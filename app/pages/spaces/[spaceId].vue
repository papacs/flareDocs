<script setup lang="ts">
import type {
  ApiResponse,
  AuthUser,
  DocumentDetail,
  DocumentTreeItem,
  SpaceDetail
} from '../../types/api'

const { roleLabel, t, visibilityLabel } = useAppLocale()
const route = useRoute()
const router = useRouter()
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const unauthenticatedUserResponse: ApiResponse<{ user: AuthUser }> = {
  ok: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Not authenticated.'
  }
}

const spaceId = computed(() => Number(route.params.spaceId))
const selectedDocumentId = ref<number | null>(
  route.query.doc ? Number(route.query.doc) : null
)

const createNodeMode = ref<'doc' | 'folder' | null>(null)
const createNodeTitle = ref('')
const workspaceError = ref('')
const createPending = ref(false)
const savePending = ref(false)
const deletePending = ref(false)
const isEditing = ref(false)
const conflictMessage = ref('')

const draft = reactive({
  title: '',
  content: ''
})

const { data: meResponse } = await useAsyncData('workspace-auth-me', () =>
  $fetch<ApiResponse<{ user: AuthUser }>>('/api/auth/me', {
    headers: requestHeaders
  }).catch(() => unauthenticatedUserResponse)
)

const { data: spaceResponse } = await useAsyncData(
  () => `workspace-space-${spaceId.value}`,
  () =>
    $fetch<ApiResponse<{ space: SpaceDetail }>>(`/api/spaces/${spaceId.value}`, {
      headers: requestHeaders
    })
)

const { data: treeResponse, refresh: refreshTree } = await useAsyncData(
  () => `workspace-tree-${spaceId.value}`,
  () =>
    $fetch<ApiResponse<{ documents: DocumentTreeItem[] }>>(`/api/spaces/${spaceId.value}/tree`, {
      headers: requestHeaders
    })
)

const currentUser = computed(() => (meResponse.value?.ok ? meResponse.value.data.user : null))
const space = computed(() =>
  spaceResponse.value && spaceResponse.value.ok ? spaceResponse.value.data.space : null
)
const treeItems = computed(() =>
  treeResponse.value && treeResponse.value.ok ? treeResponse.value.data.documents : []
)

const selectedDocument = ref<DocumentDetail | null>(null)

const canEdit = computed(() => {
  const role = space.value?.myRole
  return role === 'admin' || role === 'editor'
})

const selectedParentIdForCreate = computed(() => {
  if (!selectedDocument.value) {
    return null
  }

  return selectedDocument.value.isFolder ? selectedDocument.value.id : selectedDocument.value.parentId
})

function syncDraft() {
  draft.title = selectedDocument.value?.title ?? ''
  draft.content = selectedDocument.value?.content ?? ''
}

async function loadDocument(documentId: number | null) {
  if (!documentId) {
    selectedDocument.value = null
    return
  }

  const response = (await $fetch(
    `/api/spaces/${spaceId.value}/docs/${documentId}`,
    {
      headers: requestHeaders
    }
  )) as ApiResponse<{ document: DocumentDetail }>

  if (response.ok) {
    selectedDocument.value = response.data.document
    syncDraft()
  }
}

watch(
  treeItems,
  async (documents) => {
    if (!documents.length) {
      selectedDocumentId.value = null
      selectedDocument.value = null
      return
    }

    if (
      !selectedDocumentId.value ||
      !documents.some((document: DocumentTreeItem) => document.id === selectedDocumentId.value)
    ) {
      selectedDocumentId.value =
        documents.find((document: DocumentTreeItem) => !document.isFolder)?.id ?? documents[0]?.id ?? null
    }

    await loadDocument(selectedDocumentId.value)
  },
  { immediate: true }
)

watch(selectedDocumentId, async (documentId) => {
  conflictMessage.value = ''

  if (import.meta.client && documentId) {
    await router.replace({
      query: {
        ...route.query,
        doc: String(documentId)
      }
    })
  }

  await loadDocument(documentId)
  isEditing.value = false
})

function startEdit() {
  if (!selectedDocument.value || selectedDocument.value.isFolder || !canEdit.value) {
    return
  }

  syncDraft()
  isEditing.value = true
}

async function saveDocument() {
  if (!selectedDocument.value) {
    return
  }

  savePending.value = true
  conflictMessage.value = ''

  try {
    const response = (await $fetch(
      `/api/spaces/${spaceId.value}/docs/${selectedDocument.value.id}`,
      {
        method: 'PUT',
        body: {
          title: draft.title,
          content: draft.content,
          parentId: selectedDocument.value.parentId,
          version: selectedDocument.value.version
        }
      }
    )) as ApiResponse<{ document: DocumentDetail }>

    if (response.ok) {
      selectedDocument.value = response.data.document
      isEditing.value = false
      await refreshTree()
    }
  } catch (error: unknown) {
    const apiError = error as {
      data?: {
        error?: {
          code?: string
          details?: {
            current?: {
              version: number
              updatedAt: number
            }
          }
        }
      }
    }
    const details = apiError.data?.error?.details?.current

    if (apiError.data?.error?.code === 'DOCUMENT_VERSION_CONFLICT' && details) {
      conflictMessage.value = t('workspace.conflict', {
        version: details.version,
        updatedAt: details.updatedAt
      })
      const currentDocumentId = selectedDocument.value?.id

      if (currentDocumentId) {
        await loadDocument(currentDocumentId)
      }

      return
    }

    workspaceError.value = error instanceof Error ? error.message : 'Unable to save document.'
  } finally {
    savePending.value = false
  }
}

async function createNode() {
  createPending.value = true
  workspaceError.value = ''

  const title = createNodeTitle.value.trim()

  if (!title) {
    workspaceError.value = '请输入文档或目录名称。'
    createPending.value = false
    return
  }

  try {
    const response = (await $fetch(
      `/api/spaces/${spaceId.value}/docs`,
      {
        method: 'POST',
        body: {
          title,
          parentId: selectedParentIdForCreate.value,
          isFolder: createNodeMode.value === 'folder'
        }
      }
    )) as ApiResponse<{ document: DocumentDetail }>

    createNodeTitle.value = ''
    createNodeMode.value = null
    await refreshTree()

    if (response.ok) {
      selectedDocumentId.value = response.data.document.id
    }
  } catch (error: unknown) {
    const apiError = error as {
      data?: {
        error?: {
          message?: string
        }
      }
      message?: string
    }

    workspaceError.value =
      apiError.data?.error?.message ?? apiError.message ?? 'Unable to create item.'
  } finally {
    createPending.value = false
  }
}

async function deleteDocument() {
  if (!selectedDocument.value) {
    return
  }

  deletePending.value = true

  try {
    await $fetch(`/api/spaces/${spaceId.value}/docs/${selectedDocument.value.id}`, {
      method: 'DELETE',
      body: {}
    })

    selectedDocument.value = null
    selectedDocumentId.value = null
    await refreshTree()
  } finally {
    deletePending.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
    <header
      class="flex flex-col gap-4 rounded-[2rem] border border-[rgba(31,41,55,0.12)] bg-[rgba(255,250,243,0.92)] p-5 shadow-[0_20px_45px_rgba(120,98,69,0.12)] sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="text-sm uppercase tracking-[0.24em] text-amber-700">{{ t('workspace.kicker') }}</p>
        <h1 class="mt-2 text-3xl font-semibold text-slate-800">
          {{ space?.name ?? t('workspace.space') }}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ currentUser ? t('workspace.signedInAs', { username: currentUser.username }) : t('workspace.guestView') }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UBadge color="neutral" variant="subtle">
          {{ visibilityLabel(space?.visibility) }}
        </UBadge>
        <UBadge color="neutral" variant="subtle">
          {{ roleLabel(space?.myRole) }}
        </UBadge>
        <UButton
          v-if="space?.myRole === 'admin'"
          color="neutral"
          variant="ghost"
          :to="`/spaces/${spaceId}/audit`"
        >
          {{ t('workspace.audit') }}
        </UButton>
        <UButton color="neutral" variant="ghost" to="/">{{ t('common.back') }}</UButton>
      </div>
    </header>

    <p v-if="workspaceError" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ workspaceError }}
    </p>

    <div class="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <aside
        class="rounded-[2rem] border border-[rgba(31,41,55,0.12)] bg-[rgba(255,251,245,0.92)] p-4 shadow-[0_20px_45px_rgba(120,98,69,0.12)]"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.24em] text-slate-500">{{ t('workspace.tree') }}</p>
            <h2 class="mt-2 text-xl font-semibold text-slate-800">{{ t('workspace.documents') }}</h2>
          </div>
          <div v-if="canEdit" class="flex gap-2">
            <UButton color="neutral" variant="ghost" size="sm" @click="createNodeMode = 'doc'">
              {{ t('workspace.doc') }}
            </UButton>
            <UButton color="neutral" variant="ghost" size="sm" @click="createNodeMode = 'folder'">
              {{ t('workspace.folder') }}
            </UButton>
          </div>
        </div>

        <form v-if="createNodeMode" class="mt-4 space-y-3" @submit.prevent="createNode">
          <UInput
            v-model="createNodeTitle"
            size="lg"
            :placeholder="createNodeMode === 'folder' ? t('workspace.folderName') : t('workspace.documentTitle')"
          />
          <div class="flex gap-2">
            <UButton type="submit" color="neutral" size="sm" :loading="createPending">
              {{ t('common.create') }}
            </UButton>
            <UButton type="button" color="neutral" variant="ghost" size="sm" @click="createNodeMode = null">
              {{ t('common.cancel') }}
            </UButton>
          </div>
        </form>

        <div class="mt-4 space-y-2">
          <button
            v-for="item in treeItems"
            :key="item.id"
            type="button"
            class="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition"
            :class="
              selectedDocumentId === item.id
                ? 'bg-[rgba(255,241,218,0.95)] text-slate-900'
                : 'bg-[rgba(244,238,229,0.7)] text-slate-600 hover:bg-[rgba(244,238,229,0.95)]'
            "
            @click="selectedDocumentId = item.id"
          >
            <span class="truncate text-sm font-medium sm:text-base">
              {{ item.isFolder ? '▣' : '•' }} {{ item.title }}
            </span>
            <small class="shrink-0 text-xs uppercase tracking-[0.2em] text-slate-400">
              v{{ item.version }}
            </small>
          </button>

          <div
            v-if="treeItems.length === 0"
            class="rounded-2xl border border-dashed border-[rgba(31,41,55,0.16)] px-4 py-6 text-sm leading-6 text-slate-500"
          >
            {{ t('workspace.noDocuments') }}
          </div>
        </div>
      </aside>

      <section
        class="rounded-[2rem] border border-[rgba(31,41,55,0.12)] bg-[rgba(255,250,243,0.92)] p-4 shadow-[0_20px_45px_rgba(120,98,69,0.12)] sm:p-5"
      >
        <template v-if="selectedDocument">
          <div class="flex flex-col gap-3 border-b border-[rgba(31,41,55,0.08)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.24em] text-slate-500">
                {{ selectedDocument.isFolder ? t('workspace.folder') : t('workspace.document') }}
              </p>
              <h2 class="mt-2 text-3xl font-semibold text-slate-800">{{ selectedDocument.title }}</h2>
              <p class="mt-2 text-sm text-slate-500">
                {{ t('workspace.version', { version: selectedDocument.version, updatedAt: selectedDocument.updatedAt }) }}
              </p>
            </div>

            <div v-if="canEdit" class="flex flex-wrap gap-2">
              <UButton
                v-if="!selectedDocument.isFolder && !isEditing"
                color="neutral"
                size="lg"
                @click="startEdit"
              >
                {{ t('common.edit') }}
              </UButton>
              <UButton
                v-if="!selectedDocument.isFolder && isEditing"
                color="neutral"
                variant="ghost"
                size="lg"
                @click="isEditing = false"
              >
                {{ t('common.cancel') }}
              </UButton>
              <UButton
                v-if="selectedDocument"
                color="neutral"
                variant="ghost"
                size="lg"
                :loading="deletePending"
                @click="deleteDocument"
              >
                {{ t('common.delete') }}
              </UButton>
            </div>
          </div>

          <p
            v-if="conflictMessage"
            class="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
          >
            {{ conflictMessage }}
          </p>

          <div v-if="selectedDocument.isFolder" class="mt-5 rounded-2xl bg-[rgba(244,238,229,0.7)] p-5 text-slate-600">
            {{ t('workspace.folderHint') }}
          </div>

          <div v-else class="mt-5">
            <div v-if="isEditing" class="space-y-4">
              <UInput v-model="draft.title" size="xl" />
              <MarkdownEditor
                v-model="draft.content"
                :upload-url="`/api/spaces/${spaceId}/upload`"
              />
              <div class="flex flex-wrap gap-2">
                <UButton color="neutral" size="lg" :loading="savePending" @click="saveDocument">
                  {{ t('common.save') }}
                </UButton>
                <UButton color="neutral" variant="ghost" size="lg" @click="isEditing = false">
                  {{ t('common.cancel') }}
                </UButton>
              </div>
              <p class="text-sm leading-6 text-slate-500">
                {{ t('workspace.uploadHint') }}
              </p>
            </div>

            <div
              v-else
              class="prose prose-slate max-w-none rounded-[1.6rem] bg-white/70 p-4 sm:p-6"
            >
              <MarkdownViewer :value="selectedDocument.content" />
            </div>
          </div>
        </template>

        <div
          v-else
          class="flex min-h-[22rem] items-center justify-center rounded-[1.75rem] border border-dashed border-[rgba(31,41,55,0.16)] bg-[rgba(255,251,245,0.72)] p-6 text-center text-slate-500"
        >
          {{ t('workspace.pickDocument') }}
        </div>
      </section>
    </div>
  </main>
</template>
