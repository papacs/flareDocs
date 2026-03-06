<script setup lang="ts">
import type { ApiResponse, AuthUser, SpaceSummary } from '../types/api'
import type { AppearanceMode } from '../composables/useAppearance'
import {
  avatarPresetIds,
  defaultAvatarPresetId,
  getAvatarPresetMeta
} from '../utils/avatar-presets'
import { FetchError } from 'ofetch'

const { t, visibilityLabel } = useAppLocale()
const { appearance, setAppearance } = useAppearance()
const githubRepoUrl = 'https://github.com/papacs/flareDocs'
const cookieHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const recentSpaceStorageKey = 'fd-recent-space-id'
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
const recentSpaceId = ref<number | null>(null)
const preferredWorkspace = computed(() => {
  if (recentSpaceId.value) {
    const match = spaces.value.find((space) => space.id === recentSpaceId.value)

    if (match) {
      return match
    }
  }

  return personalWorkspace.value ?? spaces.value[0] ?? null
})
const publicSpacesCount = computed(() => spaces.value.filter((space) => space.visibility === 'public').length)
const teamSpacesCount = computed(() => spaces.value.filter((space) => space.visibility === 'team').length)
const deleteSpaceTarget = computed(
  () => spaces.value.find((space) => space.id === deleteSpaceTargetId.value) ?? null
)

const createForm = reactive({
  name: '',
  visibility: 'team'
})
const visibilityOptions = computed(() => [
  { value: 'private', label: t('index.privateOnly') },
  { value: 'team', label: t('index.teamOnly') },
  { value: 'public', label: t('index.publicRead') }
])
const normalizedSpaceName = computed(() => createForm.name.trim())
const isCreateFormValid = computed(
  () => normalizedSpaceName.value.length >= 2 && normalizedSpaceName.value.length <= 64
)

const createError = ref('')
const createPending = ref(false)
const logoutPending = ref(false)
const deleteSpacePendingId = ref<number | null>(null)
const deleteSpaceTargetId = ref<number | null>(null)
const deleteSpaceError = ref('')
const settingsOpen = ref(false)
const profilePending = ref(false)
const profileError = ref('')
const profileMessage = ref('')
const avatarToneClasses = [
  'bg-gradient-to-br from-amber-200 to-rose-200 text-slate-700',
  'bg-gradient-to-br from-sky-200 to-indigo-200 text-slate-700',
  'bg-gradient-to-br from-emerald-200 to-teal-200 text-slate-700',
  'bg-gradient-to-br from-fuchsia-200 to-violet-200 text-slate-700',
  'bg-gradient-to-br from-orange-200 to-amber-300 text-slate-700',
  'bg-gradient-to-br from-cyan-200 to-blue-200 text-slate-700',
  'bg-gradient-to-br from-lime-200 to-emerald-300 text-slate-700',
  'bg-gradient-to-br from-slate-200 to-zinc-300 text-slate-700'
]

const profileForm = reactive<{
  avatarId: string
  appearance: AppearanceMode
  currentPassword: string
  newPassword: string
}>({
  avatarId: defaultAvatarPresetId,
  appearance: 'light',
  currentPassword: '',
  newPassword: ''
})

watch(
  currentUser,
  (user) => {
    profileForm.avatarId = user?.avatarId ?? defaultAvatarPresetId
    profileForm.appearance = appearance.value
  },
  { immediate: true }
)

function readRecentSpaceId() {
  if (!import.meta.client) {
    return
  }

  const storedValue = window.localStorage.getItem(recentSpaceStorageKey)
  const parsedValue = storedValue ? Number(storedValue) : NaN
  recentSpaceId.value = Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

onMounted(() => {
  readRecentSpaceId()
})

function selectAppearance(nextAppearance: AppearanceMode) {
  profileForm.appearance = nextAppearance
  setAppearance(nextAppearance)
}

const currentAvatarToneClass = computed(() =>
  currentUser.value
    ? resolveAvatarToneClass(currentUser.value.avatarId)
    : resolveAvatarToneClass(defaultAvatarPresetId)
)
const currentAvatarSymbol = computed(() =>
  currentUser.value
    ? getAvatarPresetMeta(currentUser.value.avatarId).symbol
    : getAvatarPresetMeta(defaultAvatarPresetId).symbol
)
function resolveAvatarToneClass(avatarId: string) {
  const index = avatarPresetIds.findIndex((presetId) => presetId === avatarId)
  const safeIndex = index >= 0 ? index : 0
  return avatarToneClasses[safeIndex % avatarToneClasses.length]
}

function readApiErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const maybeError = (payload as { error?: { message?: string }; ok?: boolean }).error?.message
  return typeof maybeError === 'string' ? maybeError : null
}

function canDeleteSpace(space: SpaceSummary) {
  if (!currentUser.value) {
    return false
  }

  if (space.visibility === 'public') {
    return space.createdBy === currentUser.value.id
  }

  return space.myRole === 'admin' || space.createdBy === currentUser.value.id
}

function beginDeleteSpace(spaceId: number) {
  deleteSpaceError.value = ''
  deleteSpaceTargetId.value = spaceId
}

function cancelDeleteSpace() {
  deleteSpaceTargetId.value = null
  deleteSpaceError.value = ''
}

async function confirmDeleteSpace(space: SpaceSummary) {
  if (deleteSpacePendingId.value) {
    return
  }

  deleteSpacePendingId.value = space.id
  deleteSpaceError.value = ''

  try {
    const response = await $fetch<ApiResponse<{ deleted: boolean; spaceId: number }>>(
      `/api/spaces/${space.id}`,
      {
        method: 'DELETE',
        body: {
          confirmName: space.name
        }
      }
    )

    if (!response.ok) {
      deleteSpaceError.value = response.error.message
      return
    }

    if (recentSpaceId.value === space.id) {
      recentSpaceId.value = null

      if (import.meta.client) {
        window.localStorage.removeItem(recentSpaceStorageKey)
      }
    }

    await refreshSpaces()
    deleteSpaceTargetId.value = null
  } catch (error: unknown) {
    if (error instanceof FetchError) {
      const errorMessage = readApiErrorMessage(error.data)
      deleteSpaceError.value = errorMessage ?? t('index.deleteSpaceFailed')
    } else {
      deleteSpaceError.value = error instanceof Error ? error.message : t('index.deleteSpaceFailed')
    }
  } finally {
    deleteSpacePendingId.value = null
  }
}

async function createSpace() {
  if (!isCreateFormValid.value) {
    createError.value = t('index.invalidSpaceName')
    return
  }

  createPending.value = true
  createError.value = ''

  try {
    const response = await $fetch<ApiResponse<{ space: { id: number } }>>('/api/spaces', {
      method: 'POST',
      body: {
        name: normalizedSpaceName.value,
        visibility: createForm.visibility
      }
    })

    createForm.name = ''
    await refreshSpaces()

    if (response.ok) {
      await navigateTo(`/spaces/${response.data.space.id}`)
    }
  } catch (error) {
    if (error instanceof FetchError) {
      const errorMessage = readApiErrorMessage(error.data)
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

async function saveProfile() {
  if (!currentUser.value) {
    return
  }

  profilePending.value = true
  profileError.value = ''
  profileMessage.value = ''

  try {
    const body: {
      avatarId: string
      currentPassword?: string
      newPassword?: string
    } = {
      avatarId: profileForm.avatarId
    }

    if (profileForm.currentPassword || profileForm.newPassword) {
      body.currentPassword = profileForm.currentPassword
      body.newPassword = profileForm.newPassword
    }

    const response = await $fetch<ApiResponse<{ user: AuthUser }>>('/api/auth/profile', {
      method: 'PATCH',
      body
    })

    if (!response.ok) {
      profileError.value = response.error.message
      return
    }

    profileForm.currentPassword = ''
    profileForm.newPassword = ''
    profileMessage.value = t('index.profileSaved')
    await refreshMe()
  } catch (error) {
    if (error instanceof FetchError) {
      const errorMessage = readApiErrorMessage(error.data)
      profileError.value = errorMessage ?? t('index.profileSaveFailed')
    } else {
      profileError.value = error instanceof Error ? error.message : t('index.profileSaveFailed')
    }
  } finally {
    profilePending.value = false
  }
}
</script>

<template>
  <main
    class="fd-home-shell mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 bg-[radial-gradient(circle_at_top_left,rgba(255,243,220,0.9),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(228,240,248,0.9),transparent_28%),linear-gradient(180deg,#f6f0e7_0%,#f3eee5_48%,#f7f5f1_100%)] px-4 py-4 sm:px-6 lg:px-8"
    :class="appearance === 'dark' ? 'fd-home-shell-dark' : ''"
  >
    <div
      v-if="currentUser && settingsOpen"
      class="fixed inset-0 z-50 bg-slate-900/35 sm:hidden"
      @click="settingsOpen = false"
    >
      <aside
        class="fd-mobile-settings-drawer h-full w-[86%] max-w-sm overflow-y-auto border-r border-[rgba(31,41,55,0.12)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(245,239,229,0.96))] px-4 py-5 shadow-[20px_0_44px_rgba(15,23,42,0.18)]"
        @click.stop
      >
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {{ t('index.profileSettings') }}
          </p>
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            class="h-9 w-9 justify-center p-0"
            :title="t('index.closeSettings')"
            :aria-label="t('index.closeSettings')"
            @click="settingsOpen = false"
          >
            <WorkspaceIcon name="close" class="h-4 w-4" />
          </UButton>
        </div>

        <form class="mt-4 space-y-3" @submit.prevent="saveProfile">
          <p class="text-sm font-medium text-slate-700">{{ t('index.profilePanelHint') }}</p>

          <div class="space-y-2 rounded-2xl border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.76)] p-3">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('index.appearance') }}</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="fd-appearance-option fd-appearance-light rounded-xl border px-3 py-2 text-sm font-medium transition"
                :aria-pressed="profileForm.appearance === 'light'"
                @click="selectAppearance('light')"
              >
                {{ t('index.appearanceLight') }}
              </button>
              <button
                type="button"
                class="fd-appearance-option fd-appearance-dark rounded-xl border px-3 py-2 text-sm font-medium transition"
                :aria-pressed="profileForm.appearance === 'dark'"
                @click="selectAppearance('dark')"
              >
                {{ t('index.appearanceDark') }}
              </button>
            </div>
            <p class="text-xs leading-5 text-slate-500">{{ t('index.appearanceHint') }}</p>
          </div>

          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="avatarId in avatarPresetIds"
              :key="`mobile-${avatarId}`"
              type="button"
              class="rounded-xl border p-2 text-center transition"
              :class="[
                profileForm.avatarId === avatarId
                  ? 'border-[rgba(31,41,55,0.45)] shadow-sm'
                  : 'border-[rgba(31,41,55,0.1)] hover:border-[rgba(31,41,55,0.25)]',
                resolveAvatarToneClass(avatarId)
              ]"
              @click="profileForm.avatarId = avatarId"
            >
              <span class="text-lg leading-none">
                {{ getAvatarPresetMeta(avatarId).symbol }}
              </span>
              <span class="mt-1 block text-[11px] font-semibold tracking-[0.03em]">
                {{ getAvatarPresetMeta(avatarId).zhName }}
              </span>
            </button>
          </div>

          <div class="grid gap-3">
            <UInput
              v-model="profileForm.currentPassword"
              size="lg"
              type="password"
              autocomplete="current-password"
              :placeholder="t('index.currentPassword')"
            />
            <UInput
              v-model="profileForm.newPassword"
              size="lg"
              type="password"
              autocomplete="new-password"
              :placeholder="t('index.newPassword')"
            />
          </div>

          <p class="text-xs leading-5 text-slate-500">{{ t('index.passwordHint') }}</p>
          <p v-if="profileError" class="text-sm text-rose-600">{{ profileError }}</p>
          <p v-if="profileMessage" class="text-sm text-emerald-700">{{ profileMessage }}</p>

          <div class="flex justify-end">
            <UButton type="submit" color="neutral" :loading="profilePending">
              {{ t('index.saveProfile') }}
            </UButton>
          </div>
        </form>
      </aside>
    </div>

    <section
      class="overflow-hidden rounded-[2rem] border border-[rgba(31,41,55,0.1)] bg-[linear-gradient(135deg,rgba(255,251,244,0.96),rgba(244,237,227,0.88))] shadow-[0_24px_56px_rgba(120,98,69,0.12)]"
    >
      <div class="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:p-9">
        <div class="flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-3">
              <BrandMark size="sm" />
              <div class="flex items-center gap-2">
                <a
                  class="fd-home-icon-link"
                  :href="githubRepoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  title="GitHub"
                >
                  <WorkspaceIcon name="github" class="h-4 w-4" />
                </a>
                <div class="flex items-center gap-2 sm:hidden">
                  <template v-if="currentUser">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      class="h-9 w-9 justify-center p-0"
                      :title="t('index.profileSettings')"
                      :aria-label="t('index.profileSettings')"
                      @click="settingsOpen = !settingsOpen"
                    >
                      <WorkspaceIcon name="settings" class="h-4 w-4" />
                    </UButton>
                    <UButton
                      v-if="currentUser.isSystemAdmin"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      class="h-9 w-9 justify-center p-0"
                      :title="t('index.userManagement')"
                      :aria-label="t('index.userManagement')"
                      to="/admin/users"
                    >
                      <WorkspaceIcon name="users" class="h-4 w-4" />
                    </UButton>
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      class="h-9 w-9 justify-center p-0"
                      :title="t('index.logout')"
                      :aria-label="t('index.logout')"
                      :loading="logoutPending"
                      @click="logout"
                    >
                      <WorkspaceIcon name="logout" class="h-4 w-4" />
                    </UButton>
                  </template>
                  <UButton v-else color="neutral" variant="ghost" size="sm" class="h-9 px-3" to="/login">
                    {{ t('index.loginOnly') }}
                  </UButton>
                </div>
              </div>
            </div>
            <h1
              class="mt-4 max-w-3xl font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif] text-4xl leading-tight text-slate-800 sm:text-5xl"
            >
              {{ t('index.title') }}
            </h1>
            <p class="mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              {{ t('index.summary') }}
            </p>

            <div class="mt-6 space-y-3">
              <div v-if="currentUser" class="flex flex-wrap gap-3">
                <UButton
                  size="lg"
                  color="neutral"
                  :to="preferredWorkspace ? `/spaces/${preferredWorkspace.id}` : undefined"
                >
                  {{ t('index.openWorkspace') }}
                </UButton>
                <UButton
                  v-if="personalWorkspace"
                  size="lg"
                  color="neutral"
                  variant="ghost"
                  :to="`/spaces/${personalWorkspace.id}`"
                >
                  {{ t('index.openPersonalWorkspace') }}
                </UButton>
              </div>
              <div v-else />
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

        <div class="fd-home-session rounded-[1.75rem] border border-[rgba(31,41,55,0.08)] bg-[rgba(248,244,236,0.82)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur sm:p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <span
                class="inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold tracking-[0.08em]"
                :class="currentAvatarToneClass"
              >
                {{ currentAvatarSymbol }}
              </span>
              <div>
                <h2 class="mt-1 text-2xl font-semibold text-slate-800">
                  {{ currentUser ? currentUser.username : t('index.guestMode') }}
                </h2>
                <p v-if="currentUser?.isSystemAdmin" class="text-xs font-medium text-amber-700">
                  {{ t('index.systemAdmin') }}
                </p>
              </div>
            </div>

            <div v-if="currentUser" class="hidden flex-wrap items-center justify-end gap-2 sm:flex">
              <UButton
                color="neutral"
                variant="ghost"
                class="h-10 w-10 justify-center p-0"
                :title="t('index.profileSettings')"
                :aria-label="t('index.profileSettings')"
                @click="settingsOpen = !settingsOpen"
              >
                <WorkspaceIcon name="settings" class="h-4 w-4" />
              </UButton>
              <UButton
                v-if="currentUser.isSystemAdmin"
                color="neutral"
                variant="ghost"
                class="h-10 w-10 justify-center p-0"
                :title="t('index.userManagement')"
                :aria-label="t('index.userManagement')"
                to="/admin/users"
              >
                <WorkspaceIcon name="users" class="h-4 w-4" />
              </UButton>
              <UButton
                color="neutral"
                variant="ghost"
                class="h-10 w-10 justify-center p-0"
                :title="t('index.logout')"
                :aria-label="t('index.logout')"
                :loading="logoutPending"
                @click="logout"
              >
                <WorkspaceIcon name="logout" class="h-4 w-4" />
              </UButton>
            </div>
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

            <form
              v-if="currentUser && settingsOpen"
              class="hidden space-y-3 rounded-2xl border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.72)] p-4 sm:block"
              @submit.prevent="saveProfile"
            >
              <p class="text-sm font-medium text-slate-700">{{ t('index.profilePanelHint') }}</p>

              <div class="space-y-2 rounded-2xl border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.76)] p-3">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('index.appearance') }}</p>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="fd-appearance-option fd-appearance-light rounded-xl border px-3 py-2 text-sm font-medium transition"
                    :aria-pressed="profileForm.appearance === 'light'"
                    @click="selectAppearance('light')"
                  >
                    {{ t('index.appearanceLight') }}
                  </button>
                  <button
                    type="button"
                    class="fd-appearance-option fd-appearance-dark rounded-xl border px-3 py-2 text-sm font-medium transition"
                    :aria-pressed="profileForm.appearance === 'dark'"
                    @click="selectAppearance('dark')"
                  >
                    {{ t('index.appearanceDark') }}
                  </button>
                </div>
                <p class="text-xs leading-5 text-slate-500">{{ t('index.appearanceHint') }}</p>
              </div>

              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="avatarId in avatarPresetIds"
                  :key="avatarId"
                  type="button"
                  class="rounded-xl border p-2 text-center transition"
                  :class="[
                    profileForm.avatarId === avatarId
                      ? 'border-[rgba(31,41,55,0.45)] shadow-sm'
                      : 'border-[rgba(31,41,55,0.1)] hover:border-[rgba(31,41,55,0.25)]',
                    resolveAvatarToneClass(avatarId)
                  ]"
                  @click="profileForm.avatarId = avatarId"
                >
                  <span class="text-lg leading-none">
                    {{ getAvatarPresetMeta(avatarId).symbol }}
                  </span>
                  <span class="mt-1 block text-[11px] font-semibold tracking-[0.03em]">
                    {{ getAvatarPresetMeta(avatarId).zhName }}
                  </span>
                </button>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <UInput
                  v-model="profileForm.currentPassword"
                  size="lg"
                  type="password"
                  autocomplete="current-password"
                  :placeholder="t('index.currentPassword')"
                />
                <UInput
                  v-model="profileForm.newPassword"
                  size="lg"
                  type="password"
                  autocomplete="new-password"
                  :placeholder="t('index.newPassword')"
                />
              </div>

              <p class="text-xs leading-5 text-slate-500">{{ t('index.passwordHint') }}</p>
              <p v-if="profileError" class="text-sm text-rose-600">{{ profileError }}</p>
              <p v-if="profileMessage" class="text-sm text-emerald-700">{{ profileMessage }}</p>

              <div class="flex justify-end">
                <UButton type="submit" color="neutral" :loading="profilePending">
                  {{ t('index.saveProfile') }}
                </UButton>
              </div>
            </form>

            <form v-if="currentUser" class="space-y-3" @submit.prevent="createSpace">
              <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <UInput v-model="createForm.name" size="xl" :placeholder="t('index.newSpaceName')" />
                <AppSelectMenu
                  v-model="createForm.visibility"
                  :options="visibilityOptions"
                  :aria-label="t('workspace.visibility')"
                />
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

            <div
              v-else
              class="flex min-h-[16rem] flex-col justify-between rounded-2xl border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.72)] p-4"
            >
              <div>
                <p class="text-sm font-semibold text-slate-700">{{ t('index.guestPanelTitle') }}</p>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  {{ t('index.guestPanelSummary', { count: publicSpacesCount }) }}
                </p>

                <div class="mt-4 space-y-2">
                  <p class="fd-guest-feature-pill rounded-xl bg-[rgba(248,244,236,0.8)] px-3 py-2 text-xs text-slate-600">
                    {{ t('index.guestPanelFeatureRead') }}
                  </p>
                  <p class="fd-guest-feature-pill rounded-xl bg-[rgba(248,244,236,0.8)] px-3 py-2 text-xs text-slate-600">
                    {{ t('index.guestPanelFeatureManage') }}
                  </p>
                  <p class="fd-guest-feature-pill rounded-xl bg-[rgba(248,244,236,0.8)] px-3 py-2 text-xs text-slate-600">
                    {{ t('index.guestPanelFeaturePrivate') }}
                  </p>
                </div>
              </div>

              <div class="mt-5 flex flex-wrap items-center justify-between gap-2">
                <UButton class="fd-guest-login-button" size="lg" color="neutral" to="/login">{{ t('index.loginOnly') }}</UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="spaces-list" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          <div class="flex items-center gap-2">
            <NuxtLink
              :to="`/spaces/${space.id}`"
              class="fd-space-card-icon-action"
              :title="t('index.open')"
              :aria-label="t('index.open')"
            >
              <WorkspaceIcon name="chevron" class="h-4 w-4" />
            </NuxtLink>
            <button
              v-if="canDeleteSpace(space)"
              type="button"
              class="fd-space-card-icon-action fd-space-card-icon-action-danger"
              :title="`${t('index.deleteSpace')}（双击）`"
              :aria-label="`${t('index.deleteSpace')}（双击）`"
              @dblclick="beginDeleteSpace(space.id)"
            >
              <WorkspaceIcon name="delete" class="h-4 w-4" />
            </button>
          </div>
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

    <div
      v-if="deleteSpaceTarget"
      class="fd-space-delete-modal-wrap"
      role="dialog"
      aria-modal="true"
      :aria-label="t('index.deleteSpace')"
    >
      <button
        type="button"
        class="fd-space-delete-modal-backdrop"
        :aria-label="t('common.cancel')"
        @click="cancelDeleteSpace"
      />
      <div class="fd-space-delete-modal">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">{{ t('index.deleteSpace') }}</p>
        <h3 class="mt-2 text-xl font-semibold text-slate-800">
          {{ t('index.deleteSpaceModalTitle', { name: deleteSpaceTarget.name }) }}
        </h3>
        <p class="mt-3 text-sm leading-6 text-slate-600">{{ t('index.deleteSpaceModalHint') }}</p>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ t('index.deleteSpaceModalCascade') }}</p>
        <p v-if="deleteSpaceError" class="mt-3 text-sm text-rose-600">{{ deleteSpaceError }}</p>
        <div class="mt-5 flex items-center justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="cancelDeleteSpace">
            {{ t('common.cancel') }}
          </UButton>
          <UButton
            color="neutral"
            :loading="deleteSpacePendingId === deleteSpaceTargetId"
            @click="confirmDeleteSpace(deleteSpaceTarget)"
          >
            {{ t('common.delete') }}
          </UButton>
        </div>
      </div>
    </div>
  </main>
</template>
