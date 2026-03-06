<script setup lang="ts">
withDefaults(
  defineProps<{
    showName?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    showName: true,
    size: 'md'
  }
)
</script>

<template>
  <span class="fd-brand-mark" :class="size === 'sm' ? 'fd-brand-mark-sm' : 'fd-brand-mark-md'">
    <span class="fd-brand-badge" aria-hidden="true">
      <img src="/brand-icon.svg" alt="" />
    </span>
    <span v-if="showName" class="fd-brand-name">flareDocs</span>
  </span>
</template>
