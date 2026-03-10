<script setup lang="ts">
useAppearance()

const router = useRouter()
const isRouteLoading = ref(false)
const routeLoadingProgress = ref(0)
let routeLoadingTimer: ReturnType<typeof setInterval> | null = null
let routeLoadingHideTimer: ReturnType<typeof setTimeout> | null = null

function clearRouteLoadingTimer() {
  if (routeLoadingTimer) {
    clearInterval(routeLoadingTimer)
    routeLoadingTimer = null
  }
}

function clearRouteLoadingHideTimer() {
  if (routeLoadingHideTimer) {
    clearTimeout(routeLoadingHideTimer)
    routeLoadingHideTimer = null
  }
}

function startRouteLoading() {
  clearRouteLoadingHideTimer()
  clearRouteLoadingTimer()
  isRouteLoading.value = true
  routeLoadingProgress.value = Math.max(10, routeLoadingProgress.value || 0)
  routeLoadingTimer = setInterval(() => {
    routeLoadingProgress.value = Math.min(
      92,
      routeLoadingProgress.value +
        Math.max(1, (92 - routeLoadingProgress.value) * 0.16)
    )
  }, 150)
}

function finishRouteLoading() {
  clearRouteLoadingTimer()
  routeLoadingProgress.value = 100
  clearRouteLoadingHideTimer()
  routeLoadingHideTimer = setTimeout(() => {
    isRouteLoading.value = false
    routeLoadingProgress.value = 0
  }, 180)
}

function shouldTrackRouteLoading(path: string) {
  return path.startsWith('/spaces/')
}

onMounted(() => {
  if (!('serviceWorker' in navigator)) {
    // continue with route progress hooks below
  } else {
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
  }

  router.beforeEach((to, from) => {
    if (to.fullPath !== from.fullPath && shouldTrackRouteLoading(to.path)) {
      startRouteLoading()
    }
  })

  router.afterEach(() => {
    finishRouteLoading()
  })

  router.onError(() => {
    clearRouteLoadingTimer()
    clearRouteLoadingHideTimer()
    isRouteLoading.value = false
    routeLoadingProgress.value = 0
  })
})
</script>

<template>
  <UApp>
    <div v-if="isRouteLoading" class="fd-route-loadbar" aria-hidden="true">
      <div class="fd-route-loadbar-track">
        <div
          class="fd-route-loadbar-fill"
          :style="{ width: `${Math.max(6, routeLoadingProgress)}%` }"
        />
      </div>
    </div>
    <NuxtPage />
  </UApp>
</template>
