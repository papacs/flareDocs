<script setup lang="ts">
import type { DefineComponent } from 'vue'
import type { BytemdPlugin } from 'bytemd'
import { defineAsyncComponent } from 'vue'
import gfm from '@bytemd/plugin-gfm'
import { renderMarkdown } from '../utils/renderMarkdown'
import 'bytemd/dist/index.css'

const ByteMdEditor = defineAsyncComponent(async () => {
  const module = (await import('@bytemd/vue-next')) as unknown as {
    Editor?: DefineComponent
    default?: {
      Editor?: DefineComponent
    }
  }

  return (module.Editor ?? module.default?.Editor) as DefineComponent
})

const props = defineProps<{
  modelValue: string
  placeholder?: string
  uploadUrl?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const livePreviewPlugin: BytemdPlugin = {
  editorEffect(ctx) {
    const activeLineClass = 'fd-live-preview-active-line'
    const activeLineHandles: Array<{
      handle: unknown
      where: 'text' | 'wrap'
    }> = []
    const previewLineClasses: Array<{
      handle: unknown
      where: 'text' | 'wrap'
      className: string
    }> = []
    const syntaxMarks: Array<{ clear: () => void }> = []
    const renderedBlockMarks: Array<{ clear: () => void }> = []
    const { editor, root } = ctx
    root.classList.add('fd-live-preview')

    function addSyntaxMark(line: number, start: number, end: number) {
      if (end <= start) {
        return
      }

      const marker = editor.markText(
        { line, ch: start },
        { line, ch: end },
        { className: 'fd-md-syntax-hidden' }
      )
      syntaxMarks.push(marker)
    }

    function clearSyntaxMarks() {
      while (syntaxMarks.length > 0) {
        const marker = syntaxMarks.pop()
        marker?.clear()
      }
    }

    function clearRenderedBlocks() {
      while (renderedBlockMarks.length > 0) {
        const marker = renderedBlockMarks.pop()
        marker?.clear()
      }
    }

    function addRenderedBlock(
      startLine: number,
      endLine: number,
      markdownSource: string
    ) {
      const endLineContent = editor.getLine(endLine) ?? ''
      const container = document.createElement('div')
      container.className = 'fd-live-render-block markdown-body'
      container.innerHTML = renderMarkdown(markdownSource).trim()
      container.addEventListener('mousedown', (event) => {
        event.preventDefault()
        editor.setCursor({ line: startLine, ch: 0 })
        editor.focus()
      })

      const marker = editor.markText(
        { line: startLine, ch: 0 },
        { line: endLine, ch: endLineContent.length },
        {
          atomic: true,
          clearOnEnter: false,
          handleMouseEvents: true,
          replacedWith: container
        }
      )
      renderedBlockMarks.push(marker)
    }

    function addRenderedLine(line: number, markdownSource: string) {
      const content = editor.getLine(line) ?? ''
      if (!content.length) {
        return
      }

      const container = document.createElement('div')
      container.className = 'fd-live-render-line markdown-body'
      container.innerHTML = renderMarkdown(markdownSource).trim()
      container.addEventListener('mousedown', (event) => {
        event.preventDefault()
        editor.setCursor({ line, ch: 0 })
        editor.focus()
      })

      const marker = editor.markText(
        { line, ch: 0 },
        { line, ch: content.length },
        {
          atomic: true,
          clearOnEnter: false,
          handleMouseEvents: true,
          replacedWith: container
        }
      )
      renderedBlockMarks.push(marker)
    }

    function stripCommonIndent(value: string) {
      const lines = value.split('\n')
      const indents = lines
        .filter((line) => line.trim().length > 0)
        .map((line) => (line.match(/^\s*/) ?? [''])[0].length)

      if (indents.length === 0) {
        return value
      }

      const minIndent = Math.min(...indents)
      if (minIndent <= 0) {
        return value
      }

      return lines
        .map((line) => {
          if (!line.trim().length) {
            return line
          }

          return line.slice(minIndent)
        })
        .join('\n')
    }

    function normalizeListBlock(value: string) {
      return value
        .split('\n')
        .map((line) => {
          const marker = line.match(/^\s*(?:[-+*]|\d+\.)\s+/)
          if (!marker) {
            return line
          }

          return line.replace(/^\s+/, '')
        })
        .join('\n')
    }

    function addPreviewLineClass(
      line: number,
      className: 'fd-live-preview-hr' | 'fd-live-preview-table-separator'
    ) {
      const handle = editor.getLineHandle(line)
      if (!handle) {
        return
      }

      editor.addLineClass(handle, 'wrap', className)
      previewLineClasses.push({ handle, where: 'wrap', className })
      editor.addLineClass(handle, 'text', className)
      previewLineClasses.push({ handle, where: 'text', className })
    }

    function clearPreviewLineClasses() {
      while (previewLineClasses.length > 0) {
        const entry = previewLineClasses.pop()
        if (entry) {
          editor.removeLineClass(entry.handle, entry.where, entry.className)
        }
      }
    }

    function collectInlineSyntaxRanges(value: string) {
      const ranges: Array<[number, number]> = []
      const patterns = [
        /\*\*(?=\S)(.*?\S)\*\*/g,
        /__(?=\S)(.*?\S)__/g,
        /(?<!\*)\*(?=\S)(.*?\S)\*(?!\*)/g,
        /(?<!_)_(?=\S)(.*?\S)_(?!_)/g,
        /~~(?=\S)(.*?\S)~~/g,
        /`[^`\n]+`/g
      ]

      for (const pattern of patterns) {
        let match: RegExpExecArray | null
        while ((match = pattern.exec(value)) !== null) {
          const start = match.index
          const full = match[0]

          if (full.length < 2) {
            continue
          }

          if (
            full.startsWith('**') ||
            full.startsWith('__') ||
            full.startsWith('~~')
          ) {
            ranges.push([start, start + 2])
            ranges.push([start + full.length - 2, start + full.length])
            continue
          }

          ranges.push([start, start + 1])
          ranges.push([start + full.length - 1, start + full.length])
        }
      }

      return ranges
    }

    function applySyntaxMarks() {
      clearSyntaxMarks()
      clearPreviewLineClasses()
      clearRenderedBlocks()

      const activeLine = editor.getCursor().line
      const viewport = editor.getViewport()
      const lineCount = editor.lineCount()
      let inCodeFence = false
      let line = viewport.from

      while (line < viewport.to) {
        const content = editor.getLine(line) ?? ''
        const trim = content.trim()

        if (/^(```|~~~)/.test(trim)) {
          if (line !== activeLine) {
            addSyntaxMark(line, 0, Math.min(3, content.length))
          }
          inCodeFence = !inCodeFence
          line += 1
          continue
        }

        if (inCodeFence) {
          line += 1
          continue
        }

        if (trim.startsWith('$$')) {
          let endLine = line
          if (!(trim.endsWith('$$') && trim !== '$$')) {
            while (endLine + 1 < lineCount) {
              endLine += 1
              const nextTrim = (editor.getLine(endLine) ?? '').trim()
              if (nextTrim.endsWith('$$')) {
                break
              }
            }
          }

          if (activeLine < line || activeLine > endLine) {
            const blockLines: string[] = []
            for (let cursor = line; cursor <= endLine; cursor += 1) {
              blockLines.push(editor.getLine(cursor) ?? '')
            }
            addRenderedBlock(
              line,
              endLine,
              stripCommonIndent(blockLines.join('\n'))
            )
            line = endLine + 1
            continue
          }
        }

        const nextLineContent =
          line + 1 < lineCount ? (editor.getLine(line + 1) ?? '') : ''
        const isHeaderLike = content.includes('|')
        const isSeparatorLike =
          /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(
            nextLineContent
          )

        if (isHeaderLike && isSeparatorLike) {
          let endLine = line + 1
          while (endLine + 1 < lineCount) {
            const candidate = editor.getLine(endLine + 1) ?? ''
            if (!candidate.includes('|') || !candidate.trim()) {
              break
            }
            endLine += 1
          }

          if (activeLine < line || activeLine > endLine) {
            const tableLines: string[] = []
            for (let cursor = line; cursor <= endLine; cursor += 1) {
              tableLines.push(editor.getLine(cursor) ?? '')
            }
            addRenderedBlock(
              line,
              endLine,
              stripCommonIndent(tableLines.join('\n'))
            )
            line = endLine + 1
            continue
          }
        }

        const isListStarter = (value: string) =>
          /^\s*(?:[-+*]|\d+\.)\s+/.test(value)
        const isListContinuation = (value: string) => /^\s{2,}\S/.test(value)

        if (isListStarter(content)) {
          let endLine = line

          while (endLine + 1 < lineCount) {
            const nextLine = editor.getLine(endLine + 1) ?? ''
            const nextTrim = nextLine.trim()

            if (!nextTrim.length) {
              const probe = editor.getLine(endLine + 2) ?? ''
              if (isListStarter(probe) || isListContinuation(probe)) {
                endLine += 1
                continue
              }
              break
            }

            if (isListStarter(nextLine) || isListContinuation(nextLine)) {
              endLine += 1
              continue
            }

            break
          }

          if (activeLine < line || activeLine > endLine) {
            const listLines: string[] = []
            for (let cursor = line; cursor <= endLine; cursor += 1) {
              listLines.push(editor.getLine(cursor) ?? '')
            }
            addRenderedBlock(
              line,
              endLine,
              normalizeListBlock(stripCommonIndent(listLines.join('\n')))
            )
            line = endLine + 1
            continue
          }
        }

        if (line === activeLine) {
          line += 1
          continue
        }

        const hr = content.match(/^(\s*)([-*_])(?:\s*\2){2,}\s*$/)
        if (hr) {
          addSyntaxMark(line, 0, content.length)
          addPreviewLineClass(line, 'fd-live-preview-hr')
          line += 1
          continue
        }

        const isTableLike = content.includes('|')
        const hasLatexSyntax =
          content.includes('$$') ||
          content.includes('\\') ||
          /\$(?:[^$\n]|\\\$)+\$/.test(content)

        if (hasLatexSyntax) {
          addRenderedLine(line, stripCommonIndent(content))
          line += 1
          continue
        }

        if (isTableLike) {
          line += 1
          continue
        }

        const heading = content.match(/^(\s{0,3}#{1,6})(\s+)/)
        if (heading) {
          addSyntaxMark(line, 0, heading[1].length + heading[2].length)
        }

        const quote = content.match(/^(\s{0,3}>\s?)/)
        if (quote) {
          addSyntaxMark(line, 0, quote[1].length)
        }

        for (const [start, end] of collectInlineSyntaxRanges(content)) {
          addSyntaxMark(line, start, end)
        }
        line += 1
      }
    }

    function clearActiveLines() {
      while (activeLineHandles.length > 0) {
        const entry = activeLineHandles.pop()
        if (entry) {
          editor.removeLineClass(entry.handle, entry.where, activeLineClass)
        }
      }
    }

    function markActiveLines() {
      clearActiveLines()
      const line = editor.getCursor().line
      const handle = editor.getLineHandle(line)

      if (!handle) {
        return
      }

      editor.addLineClass(handle, 'wrap', activeLineClass)
      activeLineHandles.push({ handle, where: 'wrap' })
      editor.addLineClass(handle, 'text', activeLineClass)
      activeLineHandles.push({ handle, where: 'text' })
    }

    function refreshLivePreview() {
      editor.operation(() => {
        markActiveLines()
        applySyntaxMarks()
      })
    }

    let refreshScheduled = false
    function scheduleLivePreviewRefresh() {
      if (refreshScheduled) {
        return
      }

      refreshScheduled = true
      requestAnimationFrame(() => {
        refreshScheduled = false
        refreshLivePreview()
      })
    }

    editor.on('cursorActivity', scheduleLivePreviewRefresh)
    editor.on('changes', scheduleLivePreviewRefresh)
    editor.on('viewportChange', scheduleLivePreviewRefresh)
    refreshLivePreview()

    return () => {
      editor.off('cursorActivity', scheduleLivePreviewRefresh)
      editor.off('changes', scheduleLivePreviewRefresh)
      editor.off('viewportChange', scheduleLivePreviewRefresh)
      editor.operation(() => {
        clearActiveLines()
        clearSyntaxMarks()
        clearPreviewLineClasses()
        clearRenderedBlocks()
      })
      root.classList.remove('fd-live-preview')
    }
  }
}

const plugins = [gfm(), livePreviewPlugin]
const editorConfig = {
  mode: {
    name: 'yaml-frontmatter',
    highlightFormatting: true
  }
}

function handleChange(value: string) {
  emit('update:modelValue', value)
}

async function uploadImages(files: File[]) {
  if (!props.uploadUrl) {
    throw new Error('Image upload URL is not configured.')
  }

  const uploadUrl = props.uploadUrl

  return await Promise.all(
    files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await $fetch<{
        ok: boolean
        data?: {
          url: string
        }
        error?: {
          message?: string
        }
      }>(uploadUrl, {
        method: 'POST',
        body: formData
      })

      if (!response.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to upload image.')
      }

      return {
        url: response.data.url,
        alt: file.name,
        title: file.name
      }
    })
  )
}
</script>

<template>
  <div class="fd-editor-shell">
    <component
      :is="ByteMdEditor"
      class="fd-editor-core"
      :value="props.modelValue"
      :plugins="plugins"
      :editor-config="editorConfig"
      :placeholder="props.placeholder ?? 'Write in Markdown...'"
      :upload-images="uploadImages"
      mode="tab"
      :preview-debounce="120"
      @change="handleChange"
    />
  </div>
</template>
