<script setup lang="ts">
useAppearance()

onMounted(() => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const hostname = window.location.hostname
  const isLocalDev =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0'

  if (isLocalDev) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister()
      })
    })

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys
          .filter((key) => key.startsWith('flaredocs-shell-'))
          .forEach((key) => {
            void caches.delete(key)
          })
      })
    }

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
