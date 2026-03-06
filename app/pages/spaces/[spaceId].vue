<script setup lang="ts">
import type {
  ApiResponse,
  DocumentDetail,
  DocumentTreeItem,
  SpaceDetail,
  SpaceSummary
} from '../../types/api'
import { renderMarkdown } from '../../utils/renderMarkdown'

type TreeNode = DocumentTreeItem & {
  children: TreeNode[]
  depth: number
}

type MoveOption = {
  depth: number
  disabled: boolean
  label: string
  value: string
}

const { t } = useAppLocale()
const route = useRoute()
const router = useRouter()
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const recentSpaceStorageKey = 'fd-recent-space-id'

const spaceId = computed(() => Number(route.params.spaceId))
const treeStorageKey = computed(() => `fd-tree-expanded:${spaceId.value}`)
const selectedDocumentId = ref<number | null>(route.query.doc ? Number(route.query.doc) : null)

const createNodeMode = ref<'doc' | 'folder' | null>(null)
const createNodeTitle = ref('')
const workspaceError = ref('')
const createPending = ref(false)
const savePending = ref(false)
const deletePending = ref(false)
const movePending = ref(false)
const isEditing = ref(false)
const isRenaming = ref(false)
const isMovePanelOpen = ref(false)
const isExportMenuOpen = ref(false)
const isFullscreen = ref(false)
const isMobileTreeOpen = ref(false)
const conflictMessage = ref('')
const expandedFolderIds = ref<number[]>([])
const persistedExpandedFolderIds = ref<number[] | null>(null)
const treeReady = ref(false)
const moveTargetParentId = ref<string>('root')
const documentPanelRef = ref<HTMLElement | null>(null)
const documentScrollRef = ref<HTMLElement | null>(null)
const readingProgress = ref(0)
const editorRenderKey = ref(0)

function syncFullscreenState() {
  if (!import.meta.client) {
    return
  }

  isFullscreen.value = document.fullscreenElement === documentPanelRef.value
}

function updateReadingProgress() {
  const element = documentScrollRef.value

  if (!element) {
    readingProgress.value = 0
    return
  }

  const maxScroll = element.scrollHeight - element.clientHeight

  if (maxScroll <= 0) {
    readingProgress.value = 0
    return
  }

  readingProgress.value = Math.min(100, Math.max(0, (element.scrollTop / maxScroll) * 100))
}

function jumpToProgress(event: MouseEvent) {
  if (!import.meta.client) {
    return
  }

  const interactiveProgressQuery = window.matchMedia('(hover: hover) and (pointer: fine)')

  if (!interactiveProgressQuery.matches) {
    return
  }

  const element = documentScrollRef.value
  const target = event.currentTarget as HTMLElement | null

  if (!element || !target) {
    return
  }

  const rect = target.getBoundingClientRect()
  const ratio = (event.clientY - rect.top) / rect.height
  const maxScroll = element.scrollHeight - element.clientHeight

  if (maxScroll <= 0) {
    return
  }

  element.scrollTop = Math.max(0, Math.min(maxScroll, ratio * maxScroll))
  updateReadingProgress()
}

const draft = reactive({
  title: '',
  content: ''
})

const { data: spaceResponse } = await useAsyncData(
  () => `workspace-space-${spaceId.value}`,
  () =>
    $fetch<ApiResponse<{ space: SpaceDetail }>>(`/api/spaces/${spaceId.value}`, {
      headers: requestHeaders
    })
)

const { data: spacesResponse } = await useAsyncData(
  'workspace-spaces-index',
  () =>
    $fetch<ApiResponse<{ spaces: SpaceSummary[] }>>('/api/spaces', {
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

const space = computed(() =>
  spaceResponse.value && spaceResponse.value.ok ? spaceResponse.value.data.space : null
)
const spaces = computed(() =>
  spacesResponse.value && spacesResponse.value.ok ? spacesResponse.value.data.spaces : []
)
const treeItems = computed(() =>
  treeResponse.value && treeResponse.value.ok ? treeResponse.value.data.documents : []
)
const treeItemMap = computed(() => new Map(treeItems.value.map((item) => [item.id, item])))

const selectedDocument = ref<DocumentDetail | null>(null)

const canEdit = computed(() => {
  const role = space.value?.myRole
  return role === 'admin' || role === 'editor'
})

const isFileDocument = computed(() => Boolean(selectedDocument.value && !selectedDocument.value.isFolder))

function formatTimestamp(value: number | null | undefined) {
  if (!value) {
    return ''
  }

  const date = new Date(value * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const isSpaceMenuOpen = ref(false)
const workspaceOptions = computed(() => {
  const knownIds = new Set<number>()
  const options: Array<{ id: number; name: string }> = []

  for (const workspace of spaces.value) {
    knownIds.add(workspace.id)
    options.push({ id: workspace.id, name: workspace.name })
  }

  if (space.value && !knownIds.has(space.value.id)) {
    options.push({ id: space.value.id, name: space.value.name })
  }

  return options
})

const currentWorkspaceName = computed(
  () => workspaceOptions.value.find((workspace) => workspace.id === spaceId.value)?.name ?? ''
)

async function selectWorkspace(nextSpaceId: number) {
  isSpaceMenuOpen.value = false

  if (!nextSpaceId || nextSpaceId === spaceId.value) {
    return
  }

  isMobileTreeOpen.value = false
  await navigateTo(`/spaces/${nextSpaceId}`)
}

const selectedParentIdForCreate = computed(() => {
  if (!selectedDocument.value) {
    return null
  }

  return selectedDocument.value.isFolder ? selectedDocument.value.id : selectedDocument.value.parentId
})

const selectedDocumentDescendantIds = computed(() => {
  const rootId = selectedDocument.value?.id

  if (!rootId) {
    return new Set<number>()
  }

  const byParent = new Map<number | null, DocumentTreeItem[]>()

  for (const item of treeItems.value) {
    const siblings = byParent.get(item.parentId) ?? []
    siblings.push(item)
    byParent.set(item.parentId, siblings)
  }

  const descendants = new Set<number>()
  const stack = [rootId]

  while (stack.length) {
    const currentId = stack.pop()

    if (!currentId) {
      continue
    }

    const children = byParent.get(currentId) ?? []

    for (const child of children) {
      if (!descendants.has(child.id)) {
        descendants.add(child.id)
        stack.push(child.id)
      }
    }
  }

  return descendants
})

const selectedPathNodes = computed(() => {
  const path: DocumentTreeItem[] = []
  let cursor = selectedDocument.value?.id ?? null

  while (cursor) {
    const item = treeItemMap.value.get(cursor)

    if (!item) {
      break
    }

    path.unshift(item)
    cursor = item.parentId
  }

  return path
})

const breadcrumbNodes = computed(() => selectedPathNodes.value.slice(0, -1))

const selectedAncestorIds = computed(() => {
  const ancestors = new Set<number>()

  for (const item of selectedPathNodes.value.slice(0, -1)) {
    ancestors.add(item.id)
  }

  return ancestors
})

const selectedPathIds = computed(() => {
  const ids = new Set<number>()

  for (const item of selectedPathNodes.value) {
    ids.add(item.id)
  }

  return ids
})

function sortTreeItems(items: DocumentTreeItem[]) {
  return [...items].sort((left, right) => {
    if (left.isFolder !== right.isFolder) {
      return left.isFolder ? -1 : 1
    }

    return left.title.localeCompare(right.title, 'zh-CN')
  })
}

const treeNodes = computed<TreeNode[]>(() => {
  const byParent = new Map<number | null, DocumentTreeItem[]>()

  for (const item of treeItems.value) {
    const siblings = byParent.get(item.parentId) ?? []
    siblings.push(item)
    byParent.set(item.parentId, siblings)
  }

  function build(parentId: number | null, depth: number): TreeNode[] {
    const siblings = sortTreeItems(byParent.get(parentId) ?? [])

    return siblings.map((item) => ({
      ...item,
      depth,
      children: build(item.id, depth + 1)
    }))
  }

  return build(null, 0)
})

const visibleTreeNodes = computed<TreeNode[]>(() => {
  const flattened: TreeNode[] = []
  const expanded = new Set(expandedFolderIds.value)

  function visit(nodes: TreeNode[]) {
    for (const node of nodes) {
      flattened.push(node)

      if (node.isFolder && expanded.has(node.id)) {
        visit(node.children)
      }
    }
  }

  visit(treeNodes.value)
  return flattened
})

const moveOptions = computed<MoveOption[]>(() => {
  const selectedId = selectedDocument.value?.id ?? null
  const descendantIds = selectedDocumentDescendantIds.value
  const options: MoveOption[] = [
    {
      depth: 0,
      disabled: false,
      label: t('workspace.moveRoot'),
      value: 'root'
    }
  ]

  function visit(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.isFolder) {
        options.push({
          depth: node.depth,
          disabled: node.id === selectedId || descendantIds.has(node.id),
          label: node.title,
          value: String(node.id)
        })
      }

      visit(node.children)
    }
  }

  visit(treeNodes.value)
  return options
})

const moveSelectOptions = computed(() =>
  moveOptions.value.map((option) => ({
    value: option.value,
    label: `${'　'.repeat(option.depth)}${option.label}`,
    disabled: option.disabled
  }))
)

function restoreExpandedFolders() {
  if (!import.meta.client) {
    return
  }

  try {
    const rawValue = window.localStorage.getItem(treeStorageKey.value)

    if (!rawValue) {
      persistedExpandedFolderIds.value = null
      return
    }

    const parsed = JSON.parse(rawValue)
    persistedExpandedFolderIds.value = Array.isArray(parsed)
      ? parsed.filter((value): value is number => Number.isInteger(value))
      : null
  } catch {
    persistedExpandedFolderIds.value = null
  }
}

function persistExpandedFolders() {
  if (!import.meta.client || !treeReady.value) {
    return
  }

  window.localStorage.setItem(treeStorageKey.value, JSON.stringify(expandedFolderIds.value))
}

function expandDocumentPath(documentId: number | null) {
  if (!documentId) {
    return
  }

  const expanded = new Set(expandedFolderIds.value)
  let cursor = treeItemMap.value.get(documentId)?.parentId ?? null

  while (cursor) {
    expanded.add(cursor)
    cursor = treeItemMap.value.get(cursor)?.parentId ?? null
  }

  expandedFolderIds.value = [...expanded]
}

function expandAllFolders() {
  expandedFolderIds.value = treeItems.value
    .filter((document) => document.isFolder)
    .map((document) => document.id)
}

function collapseAllFolders() {
  expandedFolderIds.value = []
}

watch(
  spaceId,
  () => {
    treeReady.value = false
    restoreExpandedFolders()
  },
  { immediate: true }
)

watch(
  expandedFolderIds,
  () => {
    persistExpandedFolders()
  },
  { deep: true }
)

watch(
  spaceId,
  (nextSpaceId) => {
    if (!import.meta.client || !Number.isInteger(nextSpaceId) || nextSpaceId <= 0) {
      return
    }

    window.localStorage.setItem(recentSpaceStorageKey, String(nextSpaceId))
  },
  { immediate: true }
)


watch(
  treeItems,
  async (documents) => {
    if (!documents.length) {
      selectedDocumentId.value = null
      selectedDocument.value = null
      expandedFolderIds.value = []
      treeReady.value = false
      return
    }

    const folderIds = documents.filter((document) => document.isFolder).map((document) => document.id)
    const expanded = treeReady.value
      ? new Set(expandedFolderIds.value)
      : new Set<number>(persistedExpandedFolderIds.value?.length ? persistedExpandedFolderIds.value : folderIds)

    expandedFolderIds.value = [...expanded].filter((folderId) => folderIds.includes(folderId))
    treeReady.value = true

    if (
      !selectedDocumentId.value ||
      !documents.some((document: DocumentTreeItem) => document.id === selectedDocumentId.value)
    ) {
      selectedDocumentId.value =
        documents.find((document: DocumentTreeItem) => !document.isFolder)?.id ?? documents[0]?.id ?? null
    }

    expandDocumentPath(selectedDocumentId.value)
    await loadDocument(selectedDocumentId.value)
  },
  { immediate: true }
)

watch(selectedDocumentId, async (documentId) => {
  conflictMessage.value = ''

  if (import.meta.client) {
    const nextQuery = { ...route.query }

    if (documentId) {
      nextQuery.doc = String(documentId)
    } else {
      delete nextQuery.doc
    }

    await router.replace({ query: nextQuery })
  }

  await loadDocument(documentId)
  isEditing.value = false
  isRenaming.value = false
  expandDocumentPath(documentId)
  nextTick(() => {
    if (documentScrollRef.value) {
      documentScrollRef.value.scrollTop = 0
    }
    updateReadingProgress()
  })
})

watch(selectedDocument, (document) => {
  isMovePanelOpen.value = false
  isExportMenuOpen.value = false
  moveTargetParentId.value = document?.parentId ? String(document.parentId) : 'root'
  nextTick(() => {
    if (documentScrollRef.value) {
      documentScrollRef.value.scrollTop = 0
    }
    updateReadingProgress()
  })
})

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  document.addEventListener('fullscreenchange', syncFullscreenState)
  window.addEventListener('keydown', handleWindowKeydown)
  nextTick(() => updateReadingProgress())
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  document.removeEventListener('fullscreenchange', syncFullscreenState)
  window.removeEventListener('keydown', handleWindowKeydown)
})

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isSpaceMenuOpen.value) {
    isSpaceMenuOpen.value = false
  }

  if (event.key === 'Escape' && isMobileTreeOpen.value) {
    isMobileTreeOpen.value = false
  }
}

function syncDraft() {
  draft.title = selectedDocument.value?.title ?? ''
  draft.content = selectedDocument.value?.content ?? ''
}

async function loadDocument(documentId: number | null) {
  if (!documentId) {
    selectedDocument.value = null
    return
  }

  try {
    const endpoint = `/api/spaces/${spaceId.value}/docs/${documentId}` as string
    const response = await $fetch<ApiResponse<{ document: DocumentDetail }>>(endpoint, {
      headers: requestHeaders
    })

    if (response.ok) {
      workspaceError.value = ''
      selectedDocument.value = response.data.document
      syncDraft()
      return
    }

    selectedDocument.value = null
    workspaceError.value = response.error.message
  } catch (error: unknown) {
    selectedDocument.value = null
    workspaceError.value = error instanceof Error ? error.message : 'Unable to load document.'
  }
}

function toggleFolder(nodeId: number) {
  const expanded = new Set(expandedFolderIds.value)

  if (expanded.has(nodeId)) {
    expanded.delete(nodeId)
  } else {
    expanded.add(nodeId)
  }

  expandedFolderIds.value = [...expanded]
}

function selectNode(node: TreeNode | DocumentTreeItem) {
  if (selectedDocumentId.value === node.id) {
    isMobileTreeOpen.value = false
    void loadDocument(node.id)
    return
  }

  selectedDocumentId.value = node.id
  expandDocumentPath(node.id)
  isMobileTreeOpen.value = false
}

function startEdit() {
  if (!selectedDocument.value || !canEdit.value) {
    return
  }

  draft.title = selectedDocument.value.title
  isRenaming.value = true

  if (!selectedDocument.value.isFolder) {
    syncDraft()
    editorRenderKey.value += 1
    isEditing.value = true
  }
}

function cancelRename() {
  draft.title = selectedDocument.value?.title ?? ''
  isRenaming.value = false
  isEditing.value = false
}

async function saveDocument() {
  if (!selectedDocument.value) {
    return
  }

  savePending.value = true
  conflictMessage.value = ''

  try {
    const endpoint = `/api/spaces/${spaceId.value}/docs/${selectedDocument.value.id}` as string
    const response = await $fetch<ApiResponse<{ document: DocumentDetail }>>(endpoint, {
      method: 'PUT',
      body: {
        title: draft.title,
        content: draft.content,
        parentId: selectedDocument.value.parentId,
        version: selectedDocument.value.version
      }
    })

    if (response.ok) {
      selectedDocument.value = response.data.document
      isEditing.value = false
      isRenaming.value = false
      await refreshTree()
      expandDocumentPath(response.data.document.id)
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
      message?: string
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
    workspaceError.value = t('workspace.enterName')
    createPending.value = false
    return
  }

  try {
    const endpoint = `/api/spaces/${spaceId.value}/docs` as string
    const response = await $fetch<ApiResponse<{ document: DocumentDetail }>>(endpoint, {
      method: 'POST',
      body: {
        title,
        parentId: selectedParentIdForCreate.value,
        isFolder: createNodeMode.value === 'folder'
      }
    })

    createNodeTitle.value = ''
    createNodeMode.value = null
    await refreshTree()

    if (response.ok) {
      selectedDocumentId.value = response.data.document.id
      expandDocumentPath(response.data.document.id)
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

  if (import.meta.client && !window.confirm(t('workspace.confirmDelete'))) {
    return
  }

  deletePending.value = true

  try {
    const endpoint = `/api/spaces/${spaceId.value}/docs/${selectedDocument.value.id}` as string
    await $fetch(endpoint, {
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

async function moveDocument() {
  if (!selectedDocument.value) {
    return
  }

  movePending.value = true
  workspaceError.value = ''

  try {
    const endpoint = `/api/spaces/${spaceId.value}/docs/${selectedDocument.value.id}` as string
    const response = await $fetch<ApiResponse<{ document: DocumentDetail }>>(endpoint, {
      method: 'PUT',
      body: {
        title: selectedDocument.value.title,
        content: selectedDocument.value.content,
        parentId: moveTargetParentId.value === 'root' ? null : Number(moveTargetParentId.value),
        version: selectedDocument.value.version
      }
    })

    if (response.ok) {
      selectedDocument.value = response.data.document
      isMovePanelOpen.value = false
      await refreshTree()
      expandDocumentPath(response.data.document.id)
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
          message?: string
        }
      }
      message?: string
    }
    const details = apiError.data?.error?.details?.current

    if (apiError.data?.error?.code === 'DOCUMENT_VERSION_CONFLICT' && details) {
      conflictMessage.value = t('workspace.conflict', {
        version: details.version,
        updatedAt: details.updatedAt
      })
      await loadDocument(selectedDocument.value.id)
      return
    }

    workspaceError.value =
      apiError.data?.error?.message ?? apiError.message ?? t('workspace.moveFailed')
  } finally {
    movePending.value = false
  }
}

function sanitizeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '-').trim() || 'document'
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  if (!import.meta.client) {
    return
  }

  const blob = new Blob([content], { type })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.URL.revokeObjectURL(url)
}

async function toggleFullscreen() {
  if (!import.meta.client || !documentPanelRef.value) {
    return
  }

  isMobileTreeOpen.value = false
  isMovePanelOpen.value = false
  isExportMenuOpen.value = false

  if (document.fullscreenElement === documentPanelRef.value) {
    await document.exitFullscreen()
    return
  }

  await documentPanelRef.value.requestFullscreen()
}

function buildExportHtml() {
  if (!selectedDocument.value) {
    return ''
  }

  const body = renderMarkdown(selectedDocument.value.content)
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${selectedDocument.value.title}</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; margin: 32px; color: #111827; }
      .markdown-body { max-width: 860px; margin: 0 auto; line-height: 1.8; }
      .markdown-body img { max-width: 100%; height: auto; }
      .markdown-body pre { background: #111827; color: #f9fafb; padding: 16px; border-radius: 12px; overflow-x: auto; }
      .markdown-body code { background: rgba(15, 23, 42, 0.08); padding: 2px 6px; border-radius: 6px; }
      .markdown-body pre code { background: transparent; padding: 0; }
      .markdown-body table { width: 100%; border-collapse: collapse; }
      .markdown-body th, .markdown-body td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; }
      .markdown-body blockquote { border-left: 4px solid #d97706; padding-left: 12px; color: #4b5563; }
    </style>
  </head>
  <body>
    <article class="markdown-body">${body}</article>
  </body>
</html>`
}

function exportDocument(format: 'md' | 'pdf' | 'word') {
  if (!selectedDocument.value || !import.meta.client) {
    return
  }

  const filename = sanitizeFilename(selectedDocument.value.title)
  isExportMenuOpen.value = false

  if (format === 'md') {
    downloadBlob(selectedDocument.value.content, `${filename}.md`, 'text/markdown;charset=utf-8')
    return
  }

  const html = buildExportHtml()

  if (format === 'word') {
    downloadBlob(html, `${filename}.doc`, 'application/msword;charset=utf-8')
    return
  }

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800')

  if (!popup) {
    workspaceError.value = t('workspace.exportPopupBlocked')
    return
  }

  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  popup.onload = () => {
    popup.focus()
    popup.print()
  }
}
</script>

<template>
  <main class="fd-workspace-shell mx-auto box-border flex w-full max-w-7xl flex-col gap-4 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
    <p v-if="workspaceError" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ workspaceError }}
    </p>

    <div class="grid min-h-0 flex-1 gap-4 xl:grid-cols-[23rem_minmax(0,1fr)]">
      <aside
        class="fd-tree-shell fd-tree-shell-mobile order-2 overflow-hidden xl:order-1"
        :class="{ 'fd-tree-shell-mobile-open': isMobileTreeOpen }"
      >
        <div class="fd-tree-workspace">
          <div class="fd-tree-workspace-row">
            <div class="fd-workspace-switch-shell">
              <button
                type="button"
                class="fd-workspace-switch fd-workspace-switch-button"
                :aria-label="t('workspace.space')"
                :aria-expanded="isSpaceMenuOpen ? 'true' : 'false'"
                @click="isSpaceMenuOpen = !isSpaceMenuOpen"
              >
                <span class="truncate">{{ currentWorkspaceName }}</span>
              </button>
              <button
                v-if="isSpaceMenuOpen"
                type="button"
                class="fd-workspace-switch-backdrop"
                aria-label="关闭空间菜单"
                @click="isSpaceMenuOpen = false"
              />
              <div v-if="isSpaceMenuOpen" class="fd-workspace-switch-menu">
                <button
                  v-for="workspace in workspaceOptions"
                  :key="workspace.id"
                  type="button"
                  class="fd-workspace-switch-option"
                  :class="workspace.id === spaceId ? 'fd-workspace-switch-option-active' : ''"
                  @click="selectWorkspace(workspace.id)"
                >
                  {{ workspace.name }}
                </button>
              </div>
            </div>
            <NuxtLink class="fd-workspace-home" to="/" :title="t('common.home')">
              <BrandMark size="sm" :show-name="false" />
            </NuxtLink>
            <button
              type="button"
              class="fd-mobile-tree-close xl:hidden"
              @click="isMobileTreeOpen = false"
            >
              <WorkspaceIcon name="close" class="h-4 w-4" />
              <span>关闭</span>
            </button>
          </div>
        </div>

        <div class="fd-tree-heading">
          <div>
            <p class="text-xs uppercase tracking-[0.24em] text-slate-500">{{ t('workspace.tree') }}</p>
            <h2 class="mt-2 text-xl font-semibold text-slate-800">{{ t('workspace.documents') }}</h2>
            <p class="mt-1 text-sm text-slate-500">{{ t('workspace.treeHint') }}</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="fd-tree-header-button"
              :title="t('workspace.expandAll')"
              @click="expandAllFolders"
            >
              <WorkspaceIcon name="expand-all" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="fd-tree-header-button"
              :title="t('workspace.collapseAll')"
              @click="collapseAllFolders"
            >
              <WorkspaceIcon name="collapse-all" class="h-4 w-4" />
            </button>
            <template v-if="canEdit">
              <button
                type="button"
                class="fd-tree-header-button"
                :title="t('workspace.doc')"
                @click="createNodeMode = 'doc'"
              >
                <WorkspaceIcon name="plus-file" class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="fd-tree-header-button"
                :title="t('workspace.folder')"
                @click="createNodeMode = 'folder'"
              >
                <WorkspaceIcon name="plus-folder" class="h-4 w-4" />
              </button>
            </template>
          </div>
        </div>

        <form v-if="createNodeMode" class="mt-4 space-y-3" @submit.prevent="createNode">
          <UInput
            v-model="createNodeTitle"
            size="lg"
            :placeholder="createNodeMode === 'folder' ? t('workspace.folderName') : t('workspace.documentTitle')"
          />
          <p class="text-sm leading-6 text-slate-500">
            {{ t('workspace.createLocationHint') }}
          </p>
          <div class="flex gap-2">
            <UButton type="submit" color="neutral" size="sm" :loading="createPending">
              {{ t('common.create') }}
            </UButton>
            <UButton type="button" color="neutral" variant="ghost" size="sm" @click="createNodeMode = null">
              {{ t('common.cancel') }}
            </UButton>
          </div>
        </form>

        <div class="fd-tree-list mt-4 space-y-2">
          <div
            v-for="item in visibleTreeNodes"
            :key="item.id"
            class="fd-tree-row"
            :class="{
              'fd-tree-row-selected': selectedDocumentId === item.id,
              'fd-tree-row-ancestor': selectedAncestorIds.has(item.id),
              'fd-tree-row-branch': selectedPathIds.has(item.id)
            }"
            :style="{ paddingLeft: `${item.depth * 16}px` }"
          >
            <button
              v-if="item.isFolder"
              type="button"
              class="fd-tree-toggle"
              @click="toggleFolder(item.id)"
            >
              <WorkspaceIcon
                name="chevron"
                class="h-4 w-4 transition"
                :class="expandedFolderIds.includes(item.id) ? 'rotate-90' : ''"
              />
            </button>
            <span v-else class="fd-tree-dot">·</span>

            <button
              type="button"
              class="fd-tree-item"
              :class="{
                'fd-tree-item-selected': selectedDocumentId === item.id,
                'fd-tree-item-ancestor': selectedAncestorIds.has(item.id),
                'fd-tree-item-branch': selectedPathIds.has(item.id) && selectedDocumentId !== item.id
              }"
              @click="selectNode(item)"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="fd-tree-icon">
                  <WorkspaceIcon
                    :name="item.isFolder ? (expandedFolderIds.includes(item.id) ? 'folder-open' : 'folder-closed') : 'file'"
                    class="h-4 w-4"
                  />
                </span>
                <span class="truncate text-sm font-medium sm:text-[15px]" :title="item.title">
                  {{ item.title }}
                </span>
              </span>
              <span class="flex shrink-0 items-center gap-2">
                <small v-if="item.isFolder && item.children.length" class="fd-tree-pill">
                  {{ item.children.length }}
                </small>
                <small class="fd-tree-version">v{{ item.version }}</small>
              </span>
            </button>
          </div>

          <div
            v-if="treeItems.length === 0"
            class="rounded-2xl border border-dashed border-[rgba(31,41,55,0.16)] px-4 py-6 text-sm leading-6 text-slate-500"
          >
            {{ t('workspace.noDocuments') }}
          </div>
        </div>
      </aside>

      <section
        ref="documentPanelRef"
        class="fd-document-panel order-1 flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-[rgba(31,41,55,0.1)] p-4 shadow-[0_26px_52px_rgba(31,41,55,0.08)] sm:p-5 xl:order-2"
      >
        <div class="fd-mobile-tree-trigger-wrap mb-3 flex justify-end xl:hidden">
          <button
            v-if="!isMobileTreeOpen"
            type="button"
            class="fd-mobile-tree-trigger"
            @click="isMobileTreeOpen = true"
          >
            <WorkspaceIcon name="folder-open" class="h-4 w-4" />
            <span>目录</span>
          </button>
        </div>

        <template v-if="selectedDocument">
          <div class="fd-doc-header">
            <div class="min-w-0 flex-1">
              <div v-if="breadcrumbNodes.length" class="fd-tree-breadcrumbs mb-2">
                <span class="fd-tree-context-label mr-1">{{ t('workspace.currentPath') }}</span>
                <button
                  v-for="pathNode in breadcrumbNodes"
                  :key="`content-${pathNode.id}`"
                  type="button"
                  class="fd-tree-crumb"
                  :class="selectedDocumentId === pathNode.id ? 'fd-tree-crumb-active' : ''"
                  @click="selectNode(pathNode)"
                  :title="pathNode.title"
                >
                  {{ pathNode.title }}
                </button>
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-3">
                <span class="fd-tree-icon">
                  <WorkspaceIcon
                    :name="selectedDocument.isFolder ? 'folder-open' : 'file'"
                    class="h-4 w-4"
                  />
                </span>
                <template v-if="isRenaming">
                  <UInput v-model="draft.title" size="xl" class="fd-title-input min-w-0 flex-1" />
                </template>
                <h2 v-else class="text-3xl font-semibold text-slate-800">{{ selectedDocument.title }}</h2>
              </div>
              <p class="mt-2 text-sm text-slate-500">
                {{ t('workspace.version', { version: selectedDocument.version, updatedAt: formatTimestamp(selectedDocument.updatedAt) }) }}
              </p>
            </div>

            <div v-if="canEdit" class="fd-floating-toolbar">
              <button
                type="button"
                class="fd-icon-button"
                :title="t('workspace.move')"
                @click="isMovePanelOpen = !isMovePanelOpen"
              >
                <WorkspaceIcon name="move" class="h-4 w-4" />
              </button>
              <button
                v-if="!isRenaming"
                type="button"
                class="fd-icon-button"
                :title="t('common.edit')"
                @click="startEdit"
              >
                <WorkspaceIcon name="edit" class="h-4 w-4" />
              </button>
              <button
                v-if="isRenaming"
                type="button"
                class="fd-icon-button"
                :title="t('common.cancel')"
                @click="cancelRename"
              >
                <WorkspaceIcon name="close" class="h-4 w-4" />
              </button>
              <button
                v-if="isRenaming"
                type="button"
                class="fd-icon-button"
                :title="t('common.save')"
                @click="saveDocument"
              >
                <WorkspaceIcon name="save" class="h-4 w-4" />
              </button>
              <button
                v-if="isFileDocument"
                type="button"
                class="fd-icon-button"
                :title="isFullscreen ? t('workspace.exitFullscreen') : t('workspace.fullscreen')"
                @click="toggleFullscreen"
              >
                <WorkspaceIcon name="fullscreen" class="h-4 w-4" />
              </button>
              <div v-if="isFileDocument" class="relative">
                <button
                  type="button"
                  class="fd-icon-button"
                  :title="t('workspace.export')"
                  @click="isExportMenuOpen = !isExportMenuOpen"
                >
                  <WorkspaceIcon name="export" class="h-4 w-4" />
                </button>
                <div v-if="isExportMenuOpen" class="fd-export-menu">
                  <button type="button" class="fd-export-item" :title="t('workspace.exportMd')" @click="exportDocument('md')">
                    <WorkspaceIcon name="markdown" class="h-4 w-4" />
                  </button>
                  <button type="button" class="fd-export-item" :title="t('workspace.exportPdf')" @click="exportDocument('pdf')">
                    <WorkspaceIcon name="pdf" class="h-4 w-4" />
                  </button>
                  <button type="button" class="fd-export-item" :title="t('workspace.exportWord')" @click="exportDocument('word')">
                    <WorkspaceIcon name="word" class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                class="fd-icon-button fd-icon-button-danger"
                :title="t('common.delete')"
                @click="deleteDocument"
              >
                <WorkspaceIcon name="delete" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div v-if="isMovePanelOpen && canEdit" class="fd-move-panel mt-4 shrink-0 rounded-[1.6rem] bg-[rgba(244,238,229,0.72)] p-4 sm:p-5">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div class="flex-1">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  {{ t('workspace.moveTarget') }}
                </p>
                <AppSelectMenu
                  v-model="moveTargetParentId"
                  class="mt-2"
                  :options="moveSelectOptions"
                  :aria-label="t('workspace.moveTarget')"
                />
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton color="neutral" :loading="movePending" @click="moveDocument">
                  {{ t('workspace.confirmMove') }}
                </UButton>
                <UButton color="neutral" variant="ghost" @click="isMovePanelOpen = false">
                  {{ t('common.cancel') }}
                </UButton>
              </div>
            </div>
            <p class="mt-3 text-sm leading-6 text-slate-500">
              {{ t('workspace.moveHint') }}
            </p>
          </div>

          <p v-if="conflictMessage" class="fd-conflict-note mt-4 shrink-0 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            {{ conflictMessage }}
          </p>

          <div
            v-if="selectedDocument.isFolder"
            class="fd-document-stage fd-folder-stage mt-5 rounded-2xl bg-[rgba(244,238,229,0.7)] p-5 text-slate-600"
          >
            <p>{{ t('workspace.folderHint') }}</p>
            <p class="mt-3 text-sm leading-6 text-slate-500">
              {{ t('workspace.folderMoveHint') }}
            </p>
          </div>

          <div v-else class="fd-document-stage mt-5 flex min-h-0 flex-1 flex-col">
            <div v-if="isEditing" class="fd-editor-stage">
              <MarkdownEditor
                :key="`editor-${selectedDocument.id}-${editorRenderKey}`"
                v-model="draft.content"
                :upload-url="`/api/spaces/${spaceId}/upload`"
              />
            </div>

            <div v-else class="fd-reader-shell fd-document-stage">
              <div class="fd-reading-progress" aria-hidden="true">
                <button
                  type="button"
                  class="fd-reading-progress-track"
                  :title="`${Math.round(readingProgress)}%`"
                  @click="jumpToProgress"
                >
                  <div class="fd-reading-progress-fill" :style="{ height: `${readingProgress}%` }" />
                </button>
                <span v-if="readingProgress > 0" class="fd-reading-progress-label">{{ Math.round(readingProgress) }}%</span>
              </div>
              <div
                ref="documentScrollRef"
                class="fd-reader-scroll"
                @scroll="updateReadingProgress"
              >
                <div class="fd-reader-content">
                  <MarkdownViewer :value="selectedDocument.content" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <div
          v-else
          class="fd-workspace-empty flex min-h-0 flex-1 items-center justify-center rounded-[1.75rem] border border-dashed border-[rgba(31,41,55,0.16)] bg-[rgba(255,251,245,0.72)] p-6 text-center text-slate-500"
        >
          {{ t('workspace.pickDocument') }}
        </div>
      </section>
    </div>

    <button
      v-if="isMobileTreeOpen"
      type="button"
      class="fd-mobile-tree-backdrop xl:hidden"
      aria-label="关闭目录面板"
      @click="isMobileTreeOpen = false"
    />
  </main>
</template>
