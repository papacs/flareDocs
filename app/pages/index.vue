<script setup lang="ts">
import type { ApiResponse, AuthUser, SpaceSummary } from '../types/api'
import { FetchError } from 'ofetch'

const { roleLabel, t, visibilityLabel } = useAppLocale()
const cookieHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const unauthenticatedUserResponse: ApiResponse<{ user: AuthUser }> = {
  ok: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Not authenticated.'
  }
}

const {
  data: meResponse,
  refresh: refreshMe
} = await useAsyncData('auth-me', () =>
  $fetch<ApiResponse<{ user: AuthUser }>>('/api/auth/me', {
    headers: cookieHeaders
  }).catch(() => unauthenticatedUserResponse)
)

const {
  data: spacesResponse,
  refresh: refreshSpaces,
  status: spacesStatus
} = await useAsyncData('spaces-index', () =>
  $fetch<ApiResponse<{ spaces: SpaceSummary[] }>>('/api/spaces', {
    headers: cookieHeaders
  })
)

const currentUser = computed(() => (meResponse.value?.ok ? meResponse.value.data.user : null))
const spaces = computed(() =>
  spacesResponse.value && spacesResponse.value.ok ? spacesResponse.value.data.spaces : []
)
const personalWorkspace = computed(() => spaces.value.find((space) => space.isPersonal) ?? null)
const publicSpacesCount = computed(() => spaces.value.filter((space) => space.visibility === 'public').length)
const teamSpacesCount = computed(() => spaces.value.filter((space) => space.visibility === 'team').length)

const createForm = reactive({
  name: '',
  visibility: 'team'
})
const normalizedSpaceName = computed(() => createForm.name.trim())
const isCreateFormValid = computed(
  () => normalizedSpaceName.value.length >= 2 && normalizedSpaceName.value.length <= 64
)

const createError = ref('')
const createPending = ref(false)
const logoutPending = ref(false)

async function createSpace() {
  if (!isCreateFormValid.value) {
    createError.value = t('index.invalidSpaceName')
    return
  }

  createPending.value = true
  createError.value = ''

  try {
    const response = (await $fetch('/api/spaces', {
      method: 'POST',
      body: {
        name: normalizedSpaceName.value,
        visibility: createForm.visibility
      }
    })) as ApiResponse<{ space: { id: number } }>

    createForm.name = ''
    await refreshSpaces()

    if (response.ok) {
      await navigateTo(`/spaces/${response.data.space.id}`)
    }
  } catch (error) {
    if (error instanceof FetchError) {
      const errorMessage = (error.data as ApiResponse<never> | undefined)?.error?.message
      createError.value = errorMessage ?? t('index.createSpaceFailed')
    } else {
      createError.value = error instanceof Error ? error.message : t('index.createSpaceFailed')
    }
  } finally {
    createPending.value = false
  }
}

async function logout() {
  logoutPending.value = true

  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
      body: {}
    })
    await Promise.all([refreshMe(), refreshSpaces()])
  } finally {
    logoutPending.value = false
  }
}
</script>

<template>
  <main
    class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 bg-[radial-gradient(circle_at_top_left,rgba(255,243,220,0.9),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(228,240,248,0.9),transparent_28%),linear-gradient(180deg,#f6f0e7_0%,#f3eee5_48%,#f7f5f1_100%)] px-4 py-4 sm:px-6 lg:px-8"
  >
    <section
      class="overflow-hidden rounded-[2rem] border border-[rgba(31,41,55,0.1)] bg-[linear-gradient(135deg,rgba(255,251,244,0.96),rgba(244,237,227,0.88))] shadow-[0_24px_56px_rgba(120,98,69,0.12)]"
    >
      <div class="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:p-9">
        <div class="flex flex-col justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">{{ t('common.brand') }}</p>
            <h1
              class="mt-4 max-w-3xl font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif] text-4xl leading-tight text-slate-800 sm:text-5xl"
            >
              {{ t('index.title') }}
            </h1>
            <p class="mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              {{ t('index.summary') }}
            </p>

            <div class="mt-6 flex flex-wrap gap-3">
              <UButton
                v-if="currentUser"
                size="lg"
                color="neutral"
                :to="personalWorkspace ? `/spaces/${personalWorkspace.id}` : spaces[0] ? `/spaces/${spaces[0].id}` : undefined"
              >
                {{ t('index.openWorkspace') }}
              </UButton>
              <UButton
                v-if="currentUser && personalWorkspace"
                size="lg"
                color="neutral"
                variant="ghost"
                :to="`/spaces/${personalWorkspace.id}`"
              >
                {{ t('index.openPersonalWorkspace') }}
              </UButton>
              <UButton v-else size="lg" color="neutral" to="/login">{{ t('index.loginOrRegister') }}</UButton>
              <UButton size="lg" color="neutral" variant="ghost" to="https://developers.cloudflare.com/pages/">
                {{ t('index.cloudflareTarget') }}
              </UButton>
            </div>
          </div>

          <div class="mt-8 grid gap-3 sm:grid-cols-3">
            <article class="rounded-[1.4rem] border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.66)] p-4 backdrop-blur">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('index.metricSpaces') }}</p>
              <p class="mt-3 text-3xl font-semibold text-slate-800">{{ spaces.length }}</p>
            </article>
            <article class="rounded-[1.4rem] border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.66)] p-4 backdrop-blur">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('index.metricTeam') }}</p>
              <p class="mt-3 text-3xl font-semibold text-slate-800">{{ teamSpacesCount }}</p>
            </article>
            <article class="rounded-[1.4rem] border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.66)] p-4 backdrop-blur">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('index.metricPublic') }}</p>
              <p class="mt-3 text-3xl font-semibold text-slate-800">{{ publicSpacesCount }}</p>
            </article>
          </div>
        </div>

        <div class="rounded-[1.75rem] border border-[rgba(31,41,55,0.08)] bg-[rgba(248,244,236,0.82)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur sm:p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm uppercase tracking-[0.22em] text-slate-500">{{ t('index.session') }}</p>
              <h2 class="mt-2 text-2xl font-semibold text-slate-800">
                {{ currentUser ? currentUser.username : t('index.guestMode') }}
              </h2>
            </div>

            <UButton
              v-if="currentUser"
              color="neutral"
              variant="ghost"
              :loading="logoutPending"
              @click="logout"
            >
              {{ t('index.logout') }}
            </UButton>
          </div>

          <div class="mt-5 space-y-4">
            <div class="rounded-2xl border border-[rgba(31,41,55,0.08)] bg-[rgba(255,250,243,0.88)] p-4 text-sm leading-6 text-slate-600">
              <p v-if="currentUser">
                {{ t('index.loggedInHint') }}
              </p>
              <p v-else>
                {{ t('index.guestHint') }}
              </p>
            </div>

            <form v-if="currentUser" class="space-y-3" @submit.prevent="createSpace">
              <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <UInput v-model="createForm.name" size="xl" :placeholder="t('index.newSpaceName')" />
                <select
                  v-model="createForm.visibility"
                  class="h-12 w-full rounded-xl border border-[rgba(31,41,55,0.12)] bg-white/95 px-4 text-sm font-medium text-slate-700 outline-none ring-0 transition focus:border-[rgba(180,110,56,0.45)]"
                >
                  <option value="private">{{ t('index.privateOnly') }}</option>
                  <option value="team">{{ t('index.teamOnly') }}</option>
                  <option value="public">{{ t('index.publicRead') }}</option>
                </select>
              </div>

              <div class="rounded-2xl border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.62)] px-4 py-3">
                <p class="text-sm leading-6 text-slate-600">
                  {{ t('index.personalWorkspaceHint') }}
                </p>
              </div>

              <p class="text-sm leading-6 text-slate-500">
                {{ t('index.spaceNameRule') }}
              </p>
              <p v-if="createError" class="text-sm text-rose-600">{{ createError }}</p>

              <div class="flex items-center justify-between gap-3">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-400">{{ t('index.quickCreate') }}</p>
                <UButton
                  type="submit"
                  size="xl"
                  color="neutral"
                  :loading="createPending"
                  :disabled="!isCreateFormValid"
                >
                  {{ t('index.createSpace') }}
                </UButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="space in spaces"
        :key="space.id"
        class="group rounded-[1.8rem] border border-[rgba(31,41,55,0.1)] bg-[linear-gradient(180deg,rgba(255,252,247,0.94),rgba(248,243,235,0.84))] p-5 shadow-[0_18px_40px_rgba(120,98,69,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(120,98,69,0.14)]"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              {{ visibilityLabel(space.visibility) }}
            </p>
            <h2 class="mt-3 text-2xl font-semibold text-slate-800">{{ space.name }}</h2>
          </div>
          <span
            class="rounded-full border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.74)] px-3 py-1 text-xs font-medium text-slate-500"
          >
            {{ roleLabel(space.myRole) }}
          </span>
        </div>

        <p class="mt-3 text-sm text-slate-500">{{ t('index.slug', { slug: space.slug }) }}</p>

        <div class="mt-5 flex items-center justify-between gap-3">
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">{{ t('index.spaceCardHint') }}</p>
          <UButton class="shrink-0" color="neutral" size="lg" :to="`/spaces/${space.id}`">
            {{ t('index.open') }}
          </UButton>
        </div>
      </article>

      <article
        v-if="spacesStatus !== 'pending' && spaces.length === 0"
        class="rounded-[1.8rem] border border-dashed border-[rgba(31,41,55,0.18)] bg-[rgba(255,251,245,0.72)] p-6 text-slate-500 md:col-span-2 xl:col-span-3"
      >
        <h2 class="text-2xl font-semibold text-slate-800">{{ t('index.noSpaces') }}</h2>
        <p class="mt-3 max-w-2xl text-sm leading-6">
          {{ t('index.noSpacesHint') }}
        </p>
      </article>
    </section>
  </main>
</template>
