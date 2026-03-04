<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '../utils/renderMarkdown'

const props = defineProps<{
  value: string
}>()
const renderedHtml = computed(() => renderMarkdown(props.value ?? ''))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="markdown-body" v-html="renderedHtml" />
</template>
