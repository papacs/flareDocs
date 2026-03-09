<script setup lang="ts">
import type {
  ApiResponse,
  AuthUser,
  SharedDocumentDetail
} from '../../types/api'

const { t } = useAppLocale()
const route = useRoute()
const documentId = computed(() => Number(route.params.documentId))
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
const sharedDocumentFallback: ApiResponse<SharedDocumentDetail> = {
  ok: false,
  error: {
    code: 'SHARED_DOCUMENT_NOT_FOUND',
    message: 'Shared document was not found.'
  }
}

const { data: meResponse } = await useAsyncData('shared-detail-auth-me', () =>
  $fetch<ApiResponse<{ user: AuthUser }>>('/api/auth/me', {
    headers: cookieHeaders
  }).catch(() => unauthenticatedUserResponse)
)

if (!meResponse.value?.ok) {
  await navigateTo('/login')
}

const { data: sharedDocumentResponse } = await useAsyncData(
  () => `shared-document-${documentId.value}`,
  () =>
    $fetch<ApiResponse<SharedDocumentDetail>>(
      `/api/shares/${documentId.value}`,
      {
        headers: cookieHeaders
      }
    ).catch(() => sharedDocumentFallback)
)

const sharedDocument = computed(() =>
  sharedDocumentResponse.value && sharedDocumentResponse.value.ok
    ? sharedDocumentResponse.value.data
    : null
)

function formatDate(value: number) {
  return new Date(value * 1000).toLocaleString()
}
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between gap-3">
      <NuxtLink
        to="/shared"
        class="inline-flex items-center gap-2 rounded-full border border-[rgba(31,41,55,0.12)] bg-[rgba(255,255,255,0.76)] px-4 py-2 text-sm font-medium text-slate-700"
      >
        <WorkspaceIcon name="back" class="h-4 w-4" />
        {{ t('shared.detailBack') }}
      </NuxtLink>
      <BrandMark size="sm" />
    </div>

    <section
      v-if="sharedDocument"
      class="mt-5 rounded-[2rem] border border-[rgba(31,41,55,0.1)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(247,242,233,0.9))] p-5 shadow-[0_20px_44px_rgba(120,98,69,0.1)] sm:p-7"
    >
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
        {{ t('shared.detailReadonly') }}
      </p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-800">
        {{ sharedDocument.document.title }}
      </h1>
      <p class="mt-2 text-sm text-slate-500">
        {{
          t('shared.detailMeta', {
            username: sharedDocument.owner.username,
            name: sharedDocument.space.name
          })
        }}
      </p>
      <p class="mt-3 text-sm leading-7 text-slate-500">
        {{ t('shared.detailHint') }}
      </p>
      <div
        class="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-500"
      >
        <span class="rounded-full bg-[rgba(255,255,255,0.78)] px-3 py-1">
          {{ formatDate(sharedDocument.document.updatedAt) }}
        </span>
        <span
          v-for="pathItem in sharedDocument.path"
          :key="`shared-path-${pathItem.id}`"
          class="rounded-full bg-[rgba(255,255,255,0.78)] px-3 py-1"
        >
          {{ pathItem.title }}
        </span>
      </div>
    </section>

    <article
      v-if="sharedDocument"
      class="mt-5 rounded-[1.8rem] border border-[rgba(31,41,55,0.1)] bg-[rgba(255,255,255,0.88)] p-5 shadow-[0_18px_40px_rgba(120,98,69,0.1)] sm:p-7"
    >
      <MarkdownViewer :value="sharedDocument.document.content" />
    </article>

    <section
      v-else
      class="mt-5 rounded-[1.8rem] border border-dashed border-[rgba(31,41,55,0.16)] bg-[rgba(255,255,255,0.72)] p-6 text-slate-500"
    >
      {{ sharedDocumentResponse?.error?.message ?? t('shared.empty') }}
    </section>
  </main>
</template>
