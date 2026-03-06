<script setup lang="ts">
import type { ApiResponse, AuthUser } from '../../types/api'
import {
  avatarPresetIds,
  defaultAvatarPresetId,
  getAvatarPresetMeta
} from '../../utils/avatar-presets'
import { FetchError } from 'ofetch'

type AdminUser = {
  id: number
  username: string
  avatarId: string
  isSystemAdmin: boolean
  isActive: boolean
  createdAt: number
}

const { t } = useAppLocale()
const cookieHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const unauthenticatedUserResponse: ApiResponse<{ user: AuthUser }> = {
  ok: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Not authenticated.'
  }
}

const {
  data: meResponse
} = await useAsyncData('admin-users-auth-me', () =>
  $fetch<ApiResponse<{ user: AuthUser }>>('/api/auth/me', {
    headers: cookieHeaders
  }).catch(() => unauthenticatedUserResponse)
)

const currentUser = computed(() => (meResponse.value?.ok ? meResponse.value.data.user : null))

const {
  data: usersResponse,
  refresh: refreshUsers,
  error: usersRequestError,
  status: usersStatus
} = await useAsyncData('admin-users-list', () =>
  $fetch<ApiResponse<{ users: AdminUser[] }>>('/api/admin/users', {
    headers: cookieHeaders
  })
)

const users = computed(() =>
  usersResponse.value && usersResponse.value.ok ? usersResponse.value.data.users : []
)
const usersError = computed(() => {
  if (usersResponse.value && !usersResponse.value.ok) {
    return usersResponse.value.error.message
  }

  const fetchError = usersRequestError.value as FetchError<ApiResponse<never>> | null
  const apiMessage = fetchError?.data && !fetchError.data.ok ? fetchError.data.error.message : null
  return apiMessage ?? fetchError?.message ?? ''
})
const createForm = reactive({
  username: '',
  password: '',
  avatarId: defaultAvatarPresetId,
  isSystemAdmin: false
})
const createPending = ref(false)
const createError = ref('')
const createSuccess = ref('')
const actionPendingUserId = ref<number | null>(null)
const actionError = ref('')
const actionMessage = ref('')
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

function resolveAvatarToneClass(avatarId: string) {
  const index = avatarPresetIds.findIndex((presetId) => presetId === avatarId)
  const safeIndex = index >= 0 ? index : 0
  return avatarToneClasses[safeIndex % avatarToneClasses.length]
}

function readApiErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const maybeError = (payload as { error?: { message?: string } }).error?.message
  return typeof maybeError === 'string' ? maybeError : null
}

function formatTimestamp(value: number) {
  const date = new Date(value * 1000)
  return date.toLocaleString()
}

function normalizeNewPassword(rawValue: string | null) {
  if (!rawValue) {
    return ''
  }

  return rawValue.trim()
}

const canShowAdminPage = computed(() => Boolean(currentUser.value?.isSystemAdmin))

watch(
  currentUser,
  (user) => {
    if (!user) {
      void navigateTo('/login')
      return
    }

    if (!user.isSystemAdmin) {
      void navigateTo('/')
    }
  },
  { immediate: true }
)

async function createUser() {
  createPending.value = true
  createError.value = ''
  createSuccess.value = ''

  try {
    const response = await $fetch<ApiResponse<{ user: AdminUser }>>('/api/admin/users', {
      method: 'POST',
      body: {
        username: createForm.username,
        password: createForm.password,
        avatarId: createForm.avatarId,
        isSystemAdmin: createForm.isSystemAdmin
      }
    })

    if (!response.ok) {
      createError.value = response.error.message
      return
    }

    createSuccess.value = t('adminUsers.createSuccess', { username: response.data.user.username })
    createForm.username = ''
    createForm.password = ''
    createForm.avatarId = defaultAvatarPresetId
    createForm.isSystemAdmin = false
    await refreshUsers()
  } catch (error) {
    if (error instanceof FetchError) {
      const errorMessage = readApiErrorMessage(error.data)
      createError.value = errorMessage ?? t('adminUsers.createFailed')
    } else {
      createError.value = error instanceof Error ? error.message : t('adminUsers.createFailed')
    }
  } finally {
    createPending.value = false
  }
}

async function performUserAction(
  userItem: AdminUser,
  payload: {
    isActive?: boolean
    isSystemAdmin?: boolean
    newPassword?: string
  },
  successKey: string
) {
  actionPendingUserId.value = userItem.id
  actionError.value = ''
  actionMessage.value = ''

  try {
    const response = await $fetch<ApiResponse<{ user: AdminUser }>>(`/api/admin/users/${userItem.id}`, {
      method: 'PATCH',
      body: payload
    })

    if (!response.ok) {
      actionError.value = response.error.message
      return
    }

    actionMessage.value = t(successKey, { username: response.data.user.username })
    await refreshUsers()
  } catch (error) {
    if (error instanceof FetchError) {
      const errorMessage = readApiErrorMessage(error.data)
      actionError.value = errorMessage ?? t('adminUsers.actionFailed')
    } else {
      actionError.value = error instanceof Error ? error.message : t('adminUsers.actionFailed')
    }
  } finally {
    actionPendingUserId.value = null
  }
}

async function toggleUserActive(userItem: AdminUser) {
  await performUserAction(
    userItem,
    { isActive: !userItem.isActive },
    userItem.isActive ? 'adminUsers.disableSuccess' : 'adminUsers.enableSuccess'
  )
}

async function toggleUserAdmin(userItem: AdminUser) {
  await performUserAction(
    userItem,
    { isSystemAdmin: !userItem.isSystemAdmin },
    userItem.isSystemAdmin ? 'adminUsers.revokeAdminSuccess' : 'adminUsers.grantAdminSuccess'
  )
}

async function resetUserPassword(userItem: AdminUser) {
  if (!import.meta.client) {
    return
  }

  const rawValue = window.prompt(t('adminUsers.resetPrompt', { username: userItem.username }))
  const password = normalizeNewPassword(rawValue)

  if (!password) {
    return
  }

  await performUserAction(userItem, { newPassword: password }, 'adminUsers.resetPasswordSuccess')
}

async function deleteUser(userItem: AdminUser) {
  if (!import.meta.client) {
    return
  }

  if (!window.confirm(t('adminUsers.deleteConfirm', { username: userItem.username }))) {
    return
  }

  actionPendingUserId.value = userItem.id
  actionError.value = ''
  actionMessage.value = ''

  try {
    const response = await $fetch<ApiResponse<{ deleted: boolean; userId: number }>>(
      `/api/admin/users/${userItem.id}`,
      {
        method: 'DELETE',
        body: {}
      }
    )

    if (!response.ok) {
      actionError.value = response.error.message
      return
    }

    actionMessage.value = t('adminUsers.deleteSuccess', { username: userItem.username })
    await refreshUsers()
  } catch (error) {
    if (error instanceof FetchError) {
      const errorMessage = readApiErrorMessage(error.data)
      actionError.value = errorMessage ?? t('adminUsers.actionFailed')
    } else {
      actionError.value = error instanceof Error ? error.message : t('adminUsers.actionFailed')
    }
  } finally {
    actionPendingUserId.value = null
  }
}
</script>

<template>
  <main
    v-if="canShowAdminPage"
    class="fd-admin-shell mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 bg-[radial-gradient(circle_at_top,rgba(248,242,231,0.92),transparent_40%),linear-gradient(180deg,#f6f1e8_0%,#f4efe6_100%)] px-4 py-4 sm:px-6 lg:px-8"
  >
    <header class="fd-admin-card rounded-3xl border border-[rgba(31,41,55,0.1)] bg-white/80 p-5 shadow-[0_16px_36px_rgba(120,98,69,0.1)]">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">{{ t('adminUsers.kicker') }}</p>
          <h1 class="mt-2 text-3xl font-semibold text-slate-800">{{ t('adminUsers.title') }}</h1>
          <p class="mt-2 text-sm text-slate-500">{{ t('adminUsers.summary') }}</p>
        </div>
        <UButton color="neutral" variant="ghost" to="/" :title="t('adminUsers.backHome')">
          <WorkspaceIcon name="home" class="h-4 w-4" />
        </UButton>
      </div>
    </header>

    <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <article class="fd-admin-card rounded-3xl border border-[rgba(31,41,55,0.1)] bg-white/80 p-5 shadow-[0_14px_32px_rgba(120,98,69,0.1)]">
        <h2 class="text-xl font-semibold text-slate-800">{{ t('adminUsers.createTitle') }}</h2>
        <p class="mt-2 text-sm leading-6 text-slate-500">{{ t('adminUsers.createHint') }}</p>

        <form class="mt-4 space-y-3" @submit.prevent="createUser">
          <UInput v-model="createForm.username" size="lg" autocomplete="off" :placeholder="t('login.username')" />
          <UInput
            v-model="createForm.password"
            size="lg"
            type="password"
            autocomplete="new-password"
            :placeholder="t('login.password')"
          />

          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="avatarId in avatarPresetIds"
              :key="avatarId"
              type="button"
              class="rounded-xl border p-2 text-center transition"
              :class="[
                createForm.avatarId === avatarId
                  ? 'border-[rgba(31,41,55,0.45)] shadow-sm'
                  : 'border-[rgba(31,41,55,0.12)] hover:border-[rgba(31,41,55,0.3)]',
                resolveAvatarToneClass(avatarId)
              ]"
              @click="createForm.avatarId = avatarId"
            >
              <span class="text-lg leading-none">{{ getAvatarPresetMeta(avatarId).symbol }}</span>
              <span class="mt-1 block text-[11px] font-semibold tracking-[0.03em]">
                {{ getAvatarPresetMeta(avatarId).zhName }}
              </span>
            </button>
          </div>

          <label class="flex items-center gap-2 text-sm text-slate-600">
            <input v-model="createForm.isSystemAdmin" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
            <span>{{ t('adminUsers.grantAdmin') }}</span>
          </label>

          <p v-if="createError" class="text-sm text-rose-600">{{ createError }}</p>
          <p v-if="createSuccess" class="text-sm text-emerald-700">{{ createSuccess }}</p>

          <UButton type="submit" color="neutral" :loading="createPending">{{ t('adminUsers.createSubmit') }}</UButton>
        </form>
      </article>

      <article class="fd-admin-card rounded-3xl border border-[rgba(31,41,55,0.1)] bg-white/80 p-5 shadow-[0_14px_32px_rgba(120,98,69,0.1)]">
        <h2 class="text-xl font-semibold text-slate-800">{{ t('adminUsers.listTitle') }}</h2>

        <p v-if="usersError" class="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{{ usersError }}</p>
        <p v-if="actionError" class="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{{ actionError }}</p>
        <p v-if="actionMessage" class="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ actionMessage }}</p>

        <ul v-else-if="users.length > 0" class="mt-4 space-y-2">
          <li
            v-for="userItem in users"
            :key="userItem.id"
            class="fd-admin-user-row flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(31,41,55,0.08)] px-3 py-2"
            :class="userItem.isActive ? 'bg-[rgba(250,247,241,0.9)]' : 'bg-[rgba(241,238,232,0.86)] opacity-75'"
          >
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-[0.06em]"
                :class="resolveAvatarToneClass(userItem.avatarId)"
              >
                {{ getAvatarPresetMeta(userItem.avatarId).symbol }}
              </span>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-slate-800">
                  {{ userItem.username }}
                  <span v-if="!userItem.isActive" class="ml-1 text-rose-600">({{ t('adminUsers.disabled') }})</span>
                </p>
                <p class="text-xs text-slate-500">{{ formatTimestamp(userItem.createdAt) }}</p>
              </div>
            </div>
            <div class="flex flex-wrap items-center justify-end gap-2">
              <span v-if="currentUser && currentUser.id === userItem.id" class="text-[11px] text-slate-400">
                {{ t('adminUsers.currentUser') }}
              </span>
              <span class="text-xs font-medium text-slate-500">
                {{ userItem.isSystemAdmin ? t('index.systemAdmin') : t('adminUsers.normalUser') }}
              </span>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                :loading="actionPendingUserId === userItem.id"
                :disabled="currentUser?.id === userItem.id"
                @click="toggleUserActive(userItem)"
              >
                {{ userItem.isActive ? t('adminUsers.disable') : t('adminUsers.enable') }}
              </UButton>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                :loading="actionPendingUserId === userItem.id"
                :disabled="currentUser?.id === userItem.id"
                @click="toggleUserAdmin(userItem)"
              >
                {{ userItem.isSystemAdmin ? t('adminUsers.revokeAdmin') : t('adminUsers.grantAdminShort') }}
              </UButton>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                :loading="actionPendingUserId === userItem.id"
                @click="resetUserPassword(userItem)"
              >
                {{ t('adminUsers.resetPassword') }}
              </UButton>
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                :loading="actionPendingUserId === userItem.id"
                :disabled="currentUser?.id === userItem.id"
                @click="deleteUser(userItem)"
              >
                {{ t('common.delete') }}
              </UButton>
            </div>
          </li>
        </ul>

        <p v-else-if="usersStatus !== 'pending'" class="mt-4 text-sm text-slate-500">{{ t('adminUsers.empty') }}</p>
      </article>
    </section>
  </main>
</template>
