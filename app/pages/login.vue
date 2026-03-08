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
  password: '',
  captchaCode: ''
})
const pending = ref(false)
const errorMessage = ref('')
const captchaImageUrl = ref('')
const captchaToken = ref('')
let captchaRequestSerial = 0

async function loadCaptcha() {
  const requestSerial = ++captchaRequestSerial

  try {
    const refreshNonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const response = await $fetch<
      ApiResponse<{
        captcha: {
          token: string
          imageDataUrl: string
          expiresInSeconds: number
        }
      }>
    >('/api/auth/captcha', {
      query: {
        nonce: refreshNonce
      },
      cache: 'no-store'
    })

    if (requestSerial !== captchaRequestSerial) {
      return
    }

    if (response.ok) {
      captchaImageUrl.value = response.data.captcha.imageDataUrl
      captchaToken.value = response.data.captcha.token
      form.captchaCode = ''
      return
    }
  } catch {
    // keep fallback text below
  }

  if (requestSerial !== captchaRequestSerial) {
    return
  }

  captchaImageUrl.value = ''
  captchaToken.value = ''
}

await loadCaptcha()

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
        password: form.password,
        captchaCode: form.captchaCode,
        captchaToken: captchaToken.value
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
      apiError.data?.error?.message ??
      apiError.message ??
      'Authentication failed.'

    await loadCaptcha()
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="fd-auth-page">
    <div class="fd-auth-topbar">
      <NuxtLink class="fd-auth-brand-link" to="/">
        <BrandMark size="sm" />
      </NuxtLink>
      <LocaleSwitch />
    </div>

    <section class="fd-auth-shell">
      <div class="fd-auth-copy hidden lg:block">
        <p class="fd-kicker">{{ t('login.kicker') }}</p>
        <h1 class="fd-auth-title">{{ t('login.title') }}</h1>
        <p class="fd-auth-summary">{{ t('login.summary') }}</p>

        <div class="fd-auth-feature-grid">
          <article class="fd-auth-feature">
            <p class="fd-auth-feature-label">
              {{ t('login.featureSecurityLabel') }}
            </p>
            <p class="fd-auth-feature-value">
              {{ t('login.featureSecurityValue') }}
            </p>
          </article>
          <article class="fd-auth-feature">
            <p class="fd-auth-feature-label">
              {{ t('login.featureDevicesLabel') }}
            </p>
            <p class="fd-auth-feature-value">
              {{ t('login.featureDevicesValue') }}
            </p>
          </article>
        </div>
      </div>

      <div class="fd-auth-card">
        <NuxtLink
          class="fd-auth-card-back"
          to="/"
          :title="t('common.home')"
          :aria-label="t('common.home')"
        >
          <WorkspaceIcon name="back" class="h-4 w-4" />
        </NuxtLink>
        <div class="fd-auth-glow" aria-hidden="true" />
        <div class="mt-6">
          <p
            class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--fd-accent)]"
          >
            {{ t('login.tabLogin') }}
          </p>
          <h2
            class="mt-3 text-2xl text-slate-900"
            style="font-family: var(--fd-font-serif)"
          >
            {{ t('login.panelTitleLogin') }}
          </h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            {{ t('login.panelSummaryLogin') }}
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
          <div class="fd-auth-captcha-row">
            <UInput
              v-model="form.captchaCode"
              size="xl"
              inputmode="numeric"
              :placeholder="t('login.captchaInput')"
              class="fd-auth-input"
            />
            <button
              type="button"
              class="fd-auth-captcha-box"
              :title="t('login.refreshCaptcha')"
              @click="loadCaptcha"
            >
              <img
                v-if="captchaImageUrl"
                :src="captchaImageUrl"
                class="fd-auth-captcha-image"
                alt="captcha"
              />
              <span v-else class="fd-auth-captcha-text">{{
                t('login.refreshCaptcha')
              }}</span>
            </button>
          </div>
          <p v-if="errorMessage" class="text-sm text-rose-600">
            {{ errorMessage }}
          </p>
          <UButton
            type="submit"
            block
            size="xl"
            color="neutral"
            class="fd-auth-submit"
            :loading="pending"
          >
            {{ t('login.submitLogin') }}
          </UButton>
        </form>

        <div
          v-if="currentUser"
          class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {{ t('login.loggedInAs', { username: currentUser.username }) }}
        </div>
      </div>
    </section>
  </main>
</template>
