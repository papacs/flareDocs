<script setup lang="ts">
import type { DefineComponent } from 'vue'
import { defineAsyncComponent } from 'vue'
import gfm from '@bytemd/plugin-gfm'
import 'bytemd/dist/index.css'

const ByteMdEditor = defineAsyncComponent(async () => {
  const module = (await import('@bytemd/vue-next')) as unknown as {
    Editor?: DefineComponent
    default?: {
      Editor?: DefineComponent
    }
  }

  return (
    module.Editor ??
    module.default?.Editor
  ) as DefineComponent
})

const props = defineProps<{
  modelValue: string
  placeholder?: string
  uploadUrl?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const plugins = [gfm()]

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
      :value="props.modelValue"
      :plugins="plugins"
      :placeholder="props.placeholder ?? 'Write in Markdown...'"
      :upload-images="uploadImages"
      mode="tab"
      :preview-debounce="120"
      @change="handleChange"
    />
  </div>
</template>
