<script setup lang="ts">
import type { ApiResponse, AuthUser, SpaceSummary } from '../types/api'

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

const createForm = reactive({
  name: '',
  visibility: 'team'
})

const createError = ref('')
const createPending = ref(false)
const logoutPending = ref(false)

async function createSpace() {
  createPending.value = true
  createError.value = ''

  try {
    const response = (await $fetch('/api/spaces', {
      method: 'POST',
      body: {
        name: createForm.name,
        visibility: createForm.visibility
      }
    })) as ApiResponse<{ space: { id: number } }>

    createForm.name = ''
    await refreshSpaces()

    if (response.ok) {
      await navigateTo(`/spaces/${response.data.space.id}`)
    }
  } catch (error) {
    createError.value = error instanceof Error ? error.message : 'Unable to create space.'
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
  <main class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
    <section
      class="overflow-hidden rounded-[2rem] border border-[rgba(31,41,55,0.12)] bg-[rgba(255,250,243,0.92)] shadow-[0_20px_45px_rgba(120,98,69,0.12)]"
    >
      <div class="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:p-9">
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
            <UButton v-if="currentUser" size="lg" color="neutral" :to="spaces[0] ? `/spaces/${spaces[0].id}` : undefined">
              {{ t('index.openWorkspace') }}
            </UButton>
            <UButton v-else size="lg" color="neutral" to="/login">{{ t('index.loginOrRegister') }}</UButton>
            <UButton size="lg" color="neutral" variant="ghost" to="https://developers.cloudflare.com/pages/">
              {{ t('index.cloudflareTarget') }}
            </UButton>
          </div>
        </div>

        <div class="rounded-[1.75rem] border border-[rgba(31,41,55,0.12)] bg-[rgba(244,238,229,0.72)] p-4 sm:p-5">
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
            <div class="rounded-2xl bg-[rgba(255,247,236,0.88)] p-4 text-sm leading-6 text-slate-600">
              <p v-if="currentUser">
                {{ t('index.loggedInHint') }}
              </p>
              <p v-else>
                {{ t('index.guestHint') }}
              </p>
            </div>

            <form v-if="currentUser" class="space-y-3" @submit.prevent="createSpace">
              <UInput v-model="createForm.name" size="xl" :placeholder="t('index.newSpaceName')" />
              <select
                v-model="createForm.visibility"
                class="h-12 w-full rounded-xl border border-[rgba(31,41,55,0.12)] bg-white px-4 text-sm text-slate-700 outline-none ring-0"
              >
                <option value="team">{{ t('index.teamOnly') }}</option>
                <option value="public">{{ t('index.publicRead') }}</option>
              </select>
              <p v-if="createError" class="text-sm text-rose-600">{{ createError }}</p>
              <UButton type="submit" size="xl" color="neutral" :loading="createPending">
                {{ t('index.createSpace') }}
              </UButton>
            </form>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="space in spaces"
        :key="space.id"
        class="rounded-[1.8rem] border border-[rgba(31,41,55,0.12)] bg-[rgba(255,251,245,0.86)] p-5 shadow-[0_20px_45px_rgba(120,98,69,0.12)]"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
          {{ visibilityLabel(space.visibility) }}
        </p>
        <h2 class="mt-3 text-2xl font-semibold text-slate-800">{{ space.name }}</h2>
        <p class="mt-2 text-sm text-slate-500">{{ t('index.slug', { slug: space.slug }) }}</p>
        <p class="mt-2 text-sm text-slate-500">
          {{ t('index.role') }}:
          <span class="font-medium text-slate-700">{{ roleLabel(space.myRole) }}</span>
        </p>
        <UButton class="mt-5" color="neutral" size="lg" :to="`/spaces/${space.id}`">
          {{ t('index.open') }}
        </UButton>
      </article>

      <article
        v-if="spacesStatus !== 'pending' && spaces.length === 0"
        class="rounded-[1.8rem] border border-dashed border-[rgba(31,41,55,0.18)] bg-[rgba(255,251,245,0.65)] p-6 text-slate-500 md:col-span-2 xl:col-span-3"
      >
        <h2 class="text-2xl font-semibold text-slate-800">{{ t('index.noSpaces') }}</h2>
        <p class="mt-3 max-w-2xl text-sm leading-6">
          {{ t('index.noSpacesHint') }}
        </p>
      </article>
    </section>
  </main>
</template>
