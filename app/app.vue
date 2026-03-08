<script setup lang="ts">
useAppearance()

onMounted(() => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  navigator.serviceWorker
    .register('/sw.js')
    .catch((error) =>
      console.warn('Service worker registration failed.', error)
    )
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
