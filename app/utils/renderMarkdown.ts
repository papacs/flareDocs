import MarkdownIt from 'markdown-it'
import katex from 'katex'

function renderMath(expression: string, displayMode: boolean) {
  try {
    return katex.renderToString(expression.trim(), {
      displayMode,
      throwOnError: false,
      strict: 'ignore'
    })
  } catch {
    return displayMode
      ? `<div class="fd-math-error">${expression}</div>`
      : `<span class="fd-math-error">${expression}</span>`
  }
}

function mathPlugin(md: MarkdownIt) {
  md.inline.ruler.after('escape', 'fd_math_inline', (state: any, silent: boolean) => {
    const start = state.pos
    const source = state.src

    if (source[start] !== '$' || source[start + 1] === '$') {
      return false
    }

    let end = start + 1

    while (end < source.length) {
      if (source[end] === '$' && source[end - 1] !== '\\') {
        break
      }

      if (source[end] === '\n') {
        return false
      }

      end += 1
    }

    if (end >= source.length || end === start + 1) {
      return false
    }

    if (!silent) {
      const token = state.push('fd_math_inline', 'math', 0)
      token.content = source.slice(start + 1, end)
    }

    state.pos = end + 1
    return true
  })

  md.block.ruler.after(
    'blockquote',
    'fd_math_block',
    (state: any, startLine: number, endLine: number, silent: boolean) => {
      const start = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]
      const firstLine = state.src.slice(start, max).trim()

      if (!firstLine.startsWith('$$')) {
        return false
      }

      let nextLine = startLine
      let expression = ''

      if (firstLine !== '$$' && firstLine.endsWith('$$') && firstLine.length > 4) {
        expression = firstLine.slice(2, -2)
      } else {
        expression = firstLine === '$$' ? '' : `${firstLine.slice(2)}\n`

        while (++nextLine < endLine) {
          const nextStart = state.bMarks[nextLine] + state.tShift[nextLine]
          const nextMax = state.eMarks[nextLine]
          const line = state.src.slice(nextStart, nextMax)
          const trimmed = line.trim()

          if (trimmed.endsWith('$$')) {
            expression += trimmed === '$$' ? '' : line.replace(/\$\$\s*$/, '')
            break
          }

          expression += `${line}\n`
        }

        if (nextLine >= endLine) {
          return false
        }
      }

      if (silent) {
        return true
      }

      state.line = nextLine + 1
      const token = state.push('fd_math_block', 'math', 0)
      token.block = true
      token.content = expression
      token.map = [startLine, state.line]
      return true
    }
  )

  md.renderer.rules.fd_math_inline = (tokens: any[], idx: number) =>
    renderMath(tokens[idx].content, false)
  md.renderer.rules.fd_math_block = (tokens: any[], idx: number) =>
    `<div class="fd-math-block">${renderMath(tokens[idx].content, true)}</div>`
}

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true
}).use(mathPlugin)

export function renderMarkdown(value: string) {
  return markdown.render(value ?? '')
}
