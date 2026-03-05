<script setup lang="ts">
import type { ApiResponse, AuthUser } from '../types/api'

const { t } = useAppLocale()
const currentUser = ref<null | { id: number; username: string }>(null)
const unauthenticatedUserResponse: ApiResponse<{ user: AuthUser }> = {
  ok: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Not authenticated.'
  }
}
const form = reactive({
  username: '',
  password: ''
})
const pending = ref(false)
const errorMessage = ref('')

const { data: meResponse } = await useAsyncData('login-auth-me', () =>
  $fetch<ApiResponse<{ user: AuthUser }>>('/api/auth/me', {
    headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined
  }).catch(() => unauthenticatedUserResponse)
)

if (meResponse.value?.ok) {
  currentUser.value = meResponse.value.data.user
}

async function submit() {
  pending.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: form.username,
        password: form.password
      }
    })

    await navigateTo('/')
  } catch (error: unknown) {
    const apiError = error as {
      data?: {
        error?: {
          message?: string
        }
      }
      message?: string
    }

    errorMessage.value =
      apiError.data?.error?.message ?? apiError.message ?? 'Authentication failed.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="fd-auth-page">
    <div class="fd-auth-topbar">
      <LocaleSwitch />
    </div>

    <section class="fd-auth-shell">
      <div class="fd-auth-copy">
        <p class="fd-kicker">{{ t('login.kicker') }}</p>
        <h1 class="fd-auth-title">{{ t('login.title') }}</h1>
        <p class="fd-auth-summary">{{ t('login.summary') }}</p>

        <div class="fd-auth-feature-grid">
          <article class="fd-auth-feature">
            <p class="fd-auth-feature-label">{{ t('login.featureSecurityLabel') }}</p>
            <p class="fd-auth-feature-value">{{ t('login.featureSecurityValue') }}</p>
          </article>
          <article class="fd-auth-feature">
            <p class="fd-auth-feature-label">{{ t('login.featureDevicesLabel') }}</p>
            <p class="fd-auth-feature-value">{{ t('login.featureDevicesValue') }}</p>
          </article>
        </div>
      </div>

      <div class="fd-auth-card">
        <div class="fd-auth-glow" aria-hidden="true" />
        <div class="mt-6">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--fd-accent)]">
            {{ t('login.tabLogin') }}
          </p>
          <h2 class="mt-3 text-2xl text-slate-900" style="font-family: var(--fd-font-serif)">
            {{ t('login.panelTitleLogin') }}
          </h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            {{ t('login.panelSummaryLogin') }}
          </p>
          <p class="mt-2 text-xs leading-5 text-slate-400">
            {{ t('login.adminCreateOnly') }}
          </p>
        </div>

        <form class="fd-auth-form" @submit.prevent="submit">
          <div class="fd-auth-field">
            <UInput
              v-model="form.username"
              size="xl"
              autocomplete="username"
              :placeholder="t('login.username')"
              class="fd-auth-input"
            />
          </div>
          <div class="fd-auth-field">
            <UInput
              v-model="form.password"
              size="xl"
              type="password"
              autocomplete="current-password"
              :placeholder="t('login.password')"
              class="fd-auth-input"
            />
          </div>
          <p v-if="errorMessage" class="text-sm text-rose-600">{{ errorMessage }}</p>
          <UButton type="submit" block size="xl" color="neutral" class="fd-auth-submit" :loading="pending">
            {{ t('login.submitLogin') }}
          </UButton>
          <UButton block size="xl" color="neutral" variant="ghost" class="fd-auth-back" to="/">
            {{ t('login.back') }}
          </UButton>
        </form>

        <div v-if="currentUser" class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
          {{ t('login.loggedInAs', { username: currentUser.username }) }}
        </div>
      </div>
    </section>
  </main>
</template>
