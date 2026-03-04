<script setup lang="ts">
import type { ApiResponse, AuthUser } from '../types/api'

const { t } = useAppLocale()
const mode = ref<'login' | 'register'>('login')
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
    await $fetch(`/api/auth/${mode.value}`, {
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
  <main class="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-6 sm:px-6 lg:px-8">
    <section class="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div
        class="rounded-[2rem] border border-[rgba(31,41,55,0.12)] bg-[linear-gradient(180deg,rgba(255,250,242,0.95),rgba(248,240,228,0.9))] p-6 shadow-[0_20px_45px_rgba(120,98,69,0.12)] sm:p-8"
      >
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">{{ t('login.kicker') }}</p>
        <h1
          class="mt-4 font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif] text-4xl leading-tight text-slate-800 sm:text-5xl"
        >
          {{ t('login.title') }}
        </h1>
        <p class="mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
          {{ t('login.summary') }}
        </p>

        <div class="mt-8 grid gap-4 sm:grid-cols-2">
          <article class="rounded-2xl bg-[rgba(255,247,236,0.88)] p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{{ t('login.mode') }}</p>
            <p class="mt-2 text-lg font-semibold text-slate-800">
              {{ mode === 'login' ? t('login.modeReturning') : t('login.modeFirst') }}
            </p>
          </article>

          <article class="rounded-2xl bg-[rgba(255,247,236,0.88)] p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{{ t('login.route') }}</p>
            <p class="mt-2 text-lg font-semibold text-slate-800">/api/auth/{{ mode }}</p>
          </article>
        </div>
        <p class="mt-6 text-sm font-medium text-amber-700">{{ t('login.bootstrapAdmin') }}</p>
      </div>

      <div class="rounded-[2rem] border border-[rgba(31,41,55,0.12)] bg-[rgba(255,251,245,0.9)] p-5 shadow-[0_20px_45px_rgba(120,98,69,0.12)] sm:p-6">
        <div class="flex gap-2 rounded-2xl bg-[rgba(244,238,229,0.8)] p-2">
          <button
            type="button"
            class="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition"
            :class="
              mode === 'login'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            "
            @click="mode = 'login'"
          >
            {{ t('login.tabLogin') }}
          </button>
          <button
            type="button"
            class="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition"
            :class="
              mode === 'register'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            "
            @click="mode = 'register'"
          >
            {{ t('login.tabRegister') }}
          </button>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="submit">
          <UInput
            v-model="form.username"
            size="xl"
            autocomplete="username"
            :placeholder="t('login.username')"
          />
          <UInput
            v-model="form.password"
            size="xl"
            type="password"
            autocomplete="current-password"
            :placeholder="t('login.password')"
          />
          <p v-if="errorMessage" class="text-sm text-rose-600">{{ errorMessage }}</p>
          <UButton type="submit" block size="xl" color="neutral" :loading="pending">
            {{ mode === 'login' ? t('login.submitLogin') : t('login.submitRegister') }}
          </UButton>
          <UButton block size="xl" color="neutral" variant="ghost" to="/">
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
