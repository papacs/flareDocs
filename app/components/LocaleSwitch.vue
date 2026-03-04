<script setup lang="ts">
import type { AppLocale } from '../composables/useAppLocale'

const { locale, setLocale } = useAppLocale()

function updateLocale(nextLocale: AppLocale) {
  setLocale(nextLocale)
}
</script>

<template>
  <div
    class="fixed right-4 top-4 z-50 flex items-center gap-1 rounded-full border border-[rgba(31,41,55,0.12)] bg-white/90 p-1.5 shadow-[0_12px_30px_rgba(31,41,55,0.08)] backdrop-blur"
  >
    <span
      aria-hidden="true"
      class="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,241,218,0.95)] text-slate-800"
    >
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Z" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9Z" />
      </svg>
    </span>
    <button
      type="button"
      class="rounded-full px-3 py-2 text-sm font-semibold transition"
      :class="locale === 'zh-CN' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'"
      @click="updateLocale('zh-CN')"
    >
      中
    </button>
    <button
      type="button"
      class="rounded-full px-3 py-2 text-sm font-semibold transition"
      :class="locale === 'en' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'"
      @click="updateLocale('en')"
    >
      EN
    </button>
  </div>
</template>
