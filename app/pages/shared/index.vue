<script setup lang="ts">
import type {
  ApiResponse,
  AuthUser,
  SharedDocumentListItem
} from '../../types/api'

const { t } = useAppLocale()
const cookieHeaders = import.meta.server
  ? useRequestHeaders(['cookie'])
  : undefined
const unauthenticatedUserResponse: ApiResponse<{ user: AuthUser }> = {
  ok: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Not authenticated.'
  }
}
const emptySharedListResponse: ApiResponse<{
  shares: SharedDocumentListItem[]
}> = {
  ok: true,
  data: {
    shares: []
  }
}

const { data: meResponse } = await useAsyncData('shared-auth-me', () =>
  $fetch<ApiResponse<{ user: AuthUser }>>('/api/auth/me', {
    headers: cookieHeaders
  }).catch(() => unauthenticatedUserResponse)
)

if (!meResponse.value?.ok) {
  await navigateTo('/login')
}

const { data: sharedResponse } = await useAsyncData(
  'shared-documents-index',
  () =>
    $fetch<ApiResponse<{ shares: SharedDocumentListItem[] }>>('/api/shares', {
      headers: cookieHeaders
    }).catch(() => emptySharedListResponse)
)

const sharedDocuments = computed(() =>
  sharedResponse.value && sharedResponse.value.ok
    ? sharedResponse.value.data.shares
    : []
)

function formatDate(value: number) {
  return new Date(value * 1000).toLocaleString()
}
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between gap-3">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 rounded-full border border-[rgba(31,41,55,0.12)] bg-[rgba(255,255,255,0.76)] px-4 py-2 text-sm font-medium text-slate-700"
      >
        <WorkspaceIcon name="back" class="h-4 w-4" />
        {{ t('shared.backHome') }}
      </NuxtLink>
      <BrandMark size="sm" />
    </div>

    <section
      class="mt-5 rounded-[2rem] border border-[rgba(31,41,55,0.1)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(247,242,233,0.9))] p-5 shadow-[0_20px_44px_rgba(120,98,69,0.1)] sm:p-7"
    >
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
        {{ t('shared.detailReadonly') }}
      </p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-800">
        {{ t('shared.title') }}
      </h1>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
        {{ t('shared.summary') }}
      </p>
    </section>

    <section class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="sharedDocument in sharedDocuments"
        :key="`shared-document-${sharedDocument.documentId}`"
        class="rounded-[1.7rem] border border-[rgba(31,41,55,0.1)] bg-[rgba(255,255,255,0.84)] p-5 shadow-[0_18px_40px_rgba(120,98,69,0.1)]"
      >
        <p
          class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
        >
          {{
            t('shared.fromOwner', { username: sharedDocument.owner.username })
          }}
        </p>
        <h2 class="mt-3 text-2xl font-semibold text-slate-800">
          {{ sharedDocument.title }}
        </h2>
        <p class="mt-2 text-sm text-slate-500">
          {{ t('shared.fromWorkspace', { name: sharedDocument.spaceName }) }}
        </p>
        <p class="mt-4 text-xs text-slate-400">
          {{ formatDate(sharedDocument.updatedAt) }}
        </p>
        <NuxtLink
          :to="`/shared/${sharedDocument.documentId}`"
          class="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(31,41,55,0.12)] bg-[rgba(248,244,236,0.9)] px-4 py-2 text-sm font-medium text-slate-700"
        >
          <WorkspaceIcon name="share" class="h-4 w-4" />
          {{ t('shared.open') }}
        </NuxtLink>
      </article>

      <article
        v-if="sharedDocuments.length === 0"
        class="rounded-[1.7rem] border border-dashed border-[rgba(31,41,55,0.16)] bg-[rgba(255,255,255,0.72)] p-6 text-slate-500 md:col-span-2 xl:col-span-3"
      >
        <h2 class="text-xl font-semibold text-slate-800">
          {{ t('shared.empty') }}
        </h2>
      </article>
    </section>
  </main>
</template>
