<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { computed } from 'vue'

const props = defineProps<{
  value: string
}>()

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
})

const renderedHtml = computed(() => markdown.render(props.value ?? ''))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="markdown-body" v-html="renderedHtml" />
</template>
