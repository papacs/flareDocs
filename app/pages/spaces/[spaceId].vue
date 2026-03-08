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
const requestHeaders = import.meta.server
  ? useRequestHeaders(['cookie'])
  : undefined
const recentSpaceStorageKey = 'fd-recent-space-id'

const spaceId = computed(() => Number(route.params.spaceId))
const treeStorageKey = computed(() => `fd-tree-expanded:${spaceId.value}`)
const selectedDocumentId = ref<number | null>(
  route.query.doc ? Number(route.query.doc) : null
)

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
const isActionMenuOpen = ref(false)
const isDocumentInfoOpen = ref(false)
const isFullscreen = ref(false)
const isMobileTreeOpen = ref(false)
const conflictMessage = ref('')
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const autoSaveTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const autoSaveInterval = ref<ReturnType<typeof setInterval> | null>(null)
const expandedFolderIds = ref<number[]>([])
const persistedExpandedFolderIds = ref<number[] | null>(null)
const treeReady = ref(false)
const moveTargetParentId = ref<string>('root')
const documentPanelRef = ref<HTMLElement | null>(null)
const documentScrollRef = ref<HTMLElement | null>(null)
const readingProgress = ref(0)
const editorRenderKey = ref(0)
const documentLoadPending = ref(false)
const documentLoadProgress = ref(0)
const documentLoadTimer = ref<ReturnType<typeof setInterval> | null>(null)
const documentLoadFallbackTimer = ref<ReturnType<typeof setTimeout> | null>(
  null
)
const documentLoadToken = ref(0)
const documentCache = new Map<number, DocumentDetail>()
const prefetchingDocumentIds = new Set<number>()

const autoSaveDebounceMs = 2500
const autoSaveIntervalMs = 60_000

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

  readingProgress.value = Math.min(
    100,
    Math.max(0, (element.scrollTop / maxScroll) * 100)
  )
}

function jumpToProgress(event: MouseEvent | PointerEvent) {
  if (!import.meta.client) {
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
    $fetch<ApiResponse<{ space: SpaceDetail }>>(
      `/api/spaces/${spaceId.value}`,
      {
        headers: requestHeaders
      }
    )
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
    $fetch<ApiResponse<{ documents: DocumentTreeItem[] }>>(
      `/api/spaces/${spaceId.value}/tree`,
      {
        headers: requestHeaders
      }
    )
)

const space = computed(() =>
  spaceResponse.value && spaceResponse.value.ok
    ? spaceResponse.value.data.space
    : null
)
const spaces = computed(() =>
  spacesResponse.value && spacesResponse.value.ok
    ? spacesResponse.value.data.spaces
    : []
)
const treeItems = computed(() =>
  treeResponse.value && treeResponse.value.ok
    ? treeResponse.value.data.documents
    : []
)
const treeItemMap = computed(
  () => new Map(treeItems.value.map((item) => [item.id, item]))
)
const expandedFolderIdSet = computed(() => new Set(expandedFolderIds.value))

const selectedDocument = ref<DocumentDetail | null>(null)

const canEdit = computed(() => {
  const role = space.value?.myRole
  return role === 'admin' || role === 'editor'
})

const isFileDocument = computed(() =>
  Boolean(selectedDocument.value && !selectedDocument.value.isFolder)
)

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
  () =>
    workspaceOptions.value.find((workspace) => workspace.id === spaceId.value)
      ?.name ?? ''
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

  return selectedDocument.value.isFolder
    ? selectedDocument.value.id
    : selectedDocument.value.parentId
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
  const expanded = expandedFolderIdSet.value

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

  window.localStorage.setItem(
    treeStorageKey.value,
    JSON.stringify(expandedFolderIds.value)
  )
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

function clearDocumentLoadTimer() {
  if (!documentLoadTimer.value) {
    return
  }

  clearInterval(documentLoadTimer.value)
  documentLoadTimer.value = null
}

function clearDocumentLoadFallbackTimer() {
  if (!documentLoadFallbackTimer.value) {
    return
  }

  clearTimeout(documentLoadFallbackTimer.value)
  documentLoadFallbackTimer.value = null
}

function startDocumentLoadProgress() {
  if (!import.meta.client) {
    return
  }

  clearDocumentLoadTimer()
  clearDocumentLoadFallbackTimer()
  documentLoadPending.value = true
  documentLoadProgress.value = Math.max(8, documentLoadProgress.value || 0)

  documentLoadTimer.value = setInterval(() => {
    documentLoadProgress.value = Math.min(
      92,
      documentLoadProgress.value +
        Math.max(1, (92 - documentLoadProgress.value) * 0.18)
    )
  }, 120)

  documentLoadFallbackTimer.value = setTimeout(() => {
    resetDocumentLoadProgress()
  }, 15_000)
}

function finishDocumentLoadProgress() {
  if (!import.meta.client) {
    return
  }

  clearDocumentLoadTimer()
  clearDocumentLoadFallbackTimer()
  documentLoadProgress.value = 100
  setTimeout(() => {
    documentLoadPending.value = false
    documentLoadProgress.value = 0
  }, 180)
}

function resetDocumentLoadProgress() {
  clearDocumentLoadTimer()
  clearDocumentLoadFallbackTimer()
  documentLoadPending.value = false
  documentLoadProgress.value = 0
}

watch(
  spaceId,
  () => {
    treeReady.value = false
    documentCache.clear()
    prefetchingDocumentIds.clear()
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
    if (
      !import.meta.client ||
      !Number.isInteger(nextSpaceId) ||
      nextSpaceId <= 0
    ) {
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
      clearAutoSaveTimer()
      selectedDocumentId.value = null
      selectedDocument.value = null
      expandedFolderIds.value = []
      treeReady.value = false
      return
    }

    const folderIds = documents
      .filter((document) => document.isFolder)
      .map((document) => document.id)
    const expanded = treeReady.value
      ? new Set(expandedFolderIds.value)
      : new Set<number>(
          persistedExpandedFolderIds.value?.length
            ? persistedExpandedFolderIds.value
            : folderIds
        )

    expandedFolderIds.value = [...expanded].filter((folderId) =>
      folderIds.includes(folderId)
    )
    treeReady.value = true

    const hasSelectedDocument =
      selectedDocumentId.value &&
      documents.some(
        (document: DocumentTreeItem) => document.id === selectedDocumentId.value
      )

    if (!hasSelectedDocument) {
      selectedDocumentId.value = null
      selectedDocument.value = null
      return
    }

    expandDocumentPath(selectedDocumentId.value)
    await loadDocument(selectedDocumentId.value, { background: true })
  },
  { immediate: true }
)

watch(selectedDocumentId, async (documentId) => {
  conflictMessage.value = ''
  clearAutoSaveTimer()
  isActionMenuOpen.value = false

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
  isActionMenuOpen.value = false
  isDocumentInfoOpen.value = false
  moveTargetParentId.value = document?.parentId
    ? String(document.parentId)
    : 'root'
  nextTick(() => {
    if (documentScrollRef.value) {
      documentScrollRef.value.scrollTop = 0
    }
    updateReadingProgress()
  })
})

watch(
  [() => draft.title, () => draft.content, isEditing, selectedDocumentId],
  () => {
    scheduleAutoSave()
  }
)

watch(isActionMenuOpen, (open) => {
  if (!open) {
    isExportMenuOpen.value = false
  }
})

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  document.addEventListener('fullscreenchange', syncFullscreenState)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('keydown', handleWindowKeydown)
  autoSaveInterval.value = setInterval(() => {
    void flushAutoSave()
  }, autoSaveIntervalMs)
  nextTick(() => updateReadingProgress())
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  document.removeEventListener('fullscreenchange', syncFullscreenState)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('keydown', handleWindowKeydown)
  clearAutoSaveTimer()
  clearDocumentLoadTimer()
  clearDocumentLoadFallbackTimer()
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value)
    autoSaveInterval.value = null
  }
})

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isSpaceMenuOpen.value) {
    isSpaceMenuOpen.value = false
  }

  if (event.key === 'Escape' && isMobileTreeOpen.value) {
    isMobileTreeOpen.value = false
  }

  if (event.key === 'Escape' && isActionMenuOpen.value) {
    isActionMenuOpen.value = false
  }

  if (event.key === 'Escape' && isDocumentInfoOpen.value) {
    isDocumentInfoOpen.value = false
  }
}

function syncDraft() {
  draft.title = selectedDocument.value?.title ?? ''
  draft.content = selectedDocument.value?.content ?? ''
  saveState.value = 'idle'
}

const hasDraftChanges = computed(() => {
  if (!selectedDocument.value) {
    return false
  }

  return (
    draft.title !== selectedDocument.value.title ||
    draft.content !== selectedDocument.value.content
  )
})

const documentMetaLabel = computed(() => {
  if (!selectedDocument.value) {
    return ''
  }

  const updatedAt = formatTimestamp(selectedDocument.value.updatedAt)
  const updatedByName =
    selectedDocument.value.updatedByName?.trim() ||
    t('workspace.unknownUpdater')

  return `${updatedAt} · ${updatedByName}`
})

const documentFolderLabel = computed(() => {
  const folders = selectedPathNodes.value.slice(0, -1)

  if (!folders.length) {
    return t('workspace.rootFolder')
  }

  return folders.map((item) => item.title).join(' / ')
})

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const documentFileSizeLabel = computed(() => {
  const document = selectedDocument.value

  if (!document || document.isFolder) {
    return '-'
  }

  const encoder = new TextEncoder()
  return formatFileSize(encoder.encode(document.content ?? '').length)
})

function clearAutoSaveTimer() {
  if (!autoSaveTimer.value) {
    return
  }

  clearTimeout(autoSaveTimer.value)
  autoSaveTimer.value = null
}

function scheduleAutoSave() {
  clearAutoSaveTimer()

  if (
    !isEditing.value ||
    !canEdit.value ||
    !selectedDocument.value ||
    !hasDraftChanges.value
  ) {
    return
  }

  autoSaveTimer.value = setTimeout(() => {
    void saveDocument({ keepEditing: true, silentError: true })
  }, autoSaveDebounceMs)
}

async function flushAutoSave() {
  if (
    !isEditing.value ||
    !canEdit.value ||
    !selectedDocument.value ||
    !hasDraftChanges.value
  ) {
    return
  }

  await saveDocument({ keepEditing: true, silentError: true })
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    void flushAutoSave()
  }
}

function handleBeforeUnload() {
  void flushAutoSave()
}

async function loadDocument(
  documentId: number | null,
  options: { force?: boolean; background?: boolean } = {}
) {
  if (!documentId) {
    selectedDocument.value = null
    if (!options.background) {
      resetDocumentLoadProgress()
    }
    return
  }

  const treeVersion = treeItemMap.value.get(documentId)?.version
  const cached = documentCache.get(documentId)
  const canUseCache =
    !options.force &&
    cached &&
    (treeVersion == null || cached.version === treeVersion)

  if (canUseCache) {
    workspaceError.value = ''
    if (!options.background || selectedDocumentId.value === documentId) {
      selectedDocument.value = { ...cached }
      syncDraft()
    }

    if (
      options.background &&
      selectedDocumentId.value === documentId &&
      documentLoadPending.value
    ) {
      finishDocumentLoadProgress()
    }

    if (!options.background) {
      resetDocumentLoadProgress()
      return
    }
  }

  const loadToken = options.background
    ? documentLoadToken.value
    : ++documentLoadToken.value

  if (!options.background) {
    startDocumentLoadProgress()
  }

  try {
    const endpoint = `/api/spaces/${spaceId.value}/docs/${documentId}` as string
    const response = await $fetch<ApiResponse<{ document: DocumentDetail }>>(
      endpoint,
      {
        headers: requestHeaders
      }
    )

    if (!options.background && loadToken !== documentLoadToken.value) {
      return
    }

    if (response.ok) {
      workspaceError.value = ''
      documentCache.set(documentId, response.data.document)
      if (!options.background || selectedDocumentId.value === documentId) {
        selectedDocument.value = response.data.document
        syncDraft()
      }

      if (
        options.background &&
        selectedDocumentId.value === documentId &&
        documentLoadPending.value
      ) {
        finishDocumentLoadProgress()
      }
      return
    }

    selectedDocument.value = null
    workspaceError.value = response.error.message
  } catch (error: unknown) {
    if (!options.background && loadToken !== documentLoadToken.value) {
      return
    }

    selectedDocument.value = null
    workspaceError.value =
      error instanceof Error ? error.message : 'Unable to load document.'
  } finally {
    if (!options.background && loadToken === documentLoadToken.value) {
      finishDocumentLoadProgress()
    }
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
    isActionMenuOpen.value = false
    void loadDocument(node.id)
    return
  }

  selectedDocumentId.value = node.id
  expandDocumentPath(node.id)
  isMobileTreeOpen.value = false
  isActionMenuOpen.value = false
}

function prefetchDocument(node: TreeNode | DocumentTreeItem) {
  if (node.isFolder || prefetchingDocumentIds.has(node.id)) {
    return
  }

  const treeVersion = treeItemMap.value.get(node.id)?.version
  const cached = documentCache.get(node.id)

  if (cached && (treeVersion == null || cached.version === treeVersion)) {
    return
  }

  prefetchingDocumentIds.add(node.id)
  void loadDocument(node.id, { background: true })
    .catch(() => undefined)
    .finally(() => {
      prefetchingDocumentIds.delete(node.id)
    })
}

function startEdit() {
  if (!selectedDocument.value || !canEdit.value) {
    return
  }

  isActionMenuOpen.value = false
  draft.title = selectedDocument.value.title
  isRenaming.value = true

  if (!selectedDocument.value.isFolder) {
    syncDraft()
    editorRenderKey.value += 1
    isEditing.value = true
    saveState.value = 'idle'
  }
}

function cancelRename() {
  syncDraft()
  isRenaming.value = false
  isEditing.value = false
  clearAutoSaveTimer()
}

async function toggleEditingMode() {
  if (
    !selectedDocument.value ||
    !canEdit.value ||
    selectedDocument.value.isFolder
  ) {
    return
  }

  if (isEditing.value) {
    await saveDocument({ keepEditing: false })
    return
  }

  startEdit()
}

async function saveNow() {
  await saveDocument({ keepEditing: true })
}

function openTreeFromActionMenu() {
  isMobileTreeOpen.value = true
  isActionMenuOpen.value = false
}

function toggleMovePanelFromActionMenu() {
  isMovePanelOpen.value = !isMovePanelOpen.value
  isActionMenuOpen.value = false
}

function openDocumentInfoPanel() {
  isDocumentInfoOpen.value = true
  isActionMenuOpen.value = false
  isExportMenuOpen.value = false
}

async function saveDocument(options?: {
  keepEditing?: boolean
  silentError?: boolean
}) {
  const keepEditing = options?.keepEditing ?? false
  const silentError = options?.silentError ?? false

  if (!selectedDocument.value || savePending.value) {
    return
  }

  if (!hasDraftChanges.value) {
    saveState.value = 'saved'
    if (!keepEditing) {
      isEditing.value = false
      isRenaming.value = false
    }
    return
  }

  savePending.value = true
  saveState.value = 'saving'
  conflictMessage.value = ''

  try {
    const endpoint =
      `/api/spaces/${spaceId.value}/docs/${selectedDocument.value.id}` as string
    const response = await $fetch<ApiResponse<{ document: DocumentDetail }>>(
      endpoint,
      {
        method: 'PUT',
        body: {
          title: draft.title,
          content: draft.content,
          parentId: selectedDocument.value.parentId,
          version: selectedDocument.value.version
        }
      }
    )

    if (response.ok) {
      selectedDocument.value = response.data.document
      documentCache.set(response.data.document.id, response.data.document)
      saveState.value = 'saved'
      if (!keepEditing) {
        isEditing.value = false
        isRenaming.value = false
      }
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

      saveState.value = 'error'
      return
    }

    saveState.value = 'error'
    if (!silentError) {
      workspaceError.value =
        error instanceof Error ? error.message : 'Unable to save document.'
    }
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
    const response = await $fetch<ApiResponse<{ document: DocumentDetail }>>(
      endpoint,
      {
        method: 'POST',
        body: {
          title,
          parentId: selectedParentIdForCreate.value,
          isFolder: createNodeMode.value === 'folder'
        }
      }
    )

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
      apiError.data?.error?.message ??
      apiError.message ??
      'Unable to create item.'
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
  isActionMenuOpen.value = false

  try {
    const endpoint =
      `/api/spaces/${spaceId.value}/docs/${selectedDocument.value.id}` as string
    await $fetch(endpoint, {
      method: 'DELETE',
      body: {}
    })

    selectedDocument.value = null
    documentCache.clear()
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
  isActionMenuOpen.value = false

  try {
    const endpoint =
      `/api/spaces/${spaceId.value}/docs/${selectedDocument.value.id}` as string
    const response = await $fetch<ApiResponse<{ document: DocumentDetail }>>(
      endpoint,
      {
        method: 'PUT',
        body: {
          title: selectedDocument.value.title,
          content: selectedDocument.value.content,
          parentId:
            moveTargetParentId.value === 'root'
              ? null
              : Number(moveTargetParentId.value),
          version: selectedDocument.value.version
        }
      }
    )

    if (response.ok) {
      selectedDocument.value = response.data.document
      documentCache.set(response.data.document.id, response.data.document)
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
      apiError.data?.error?.message ??
      apiError.message ??
      t('workspace.moveFailed')
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
  isActionMenuOpen.value = false

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

function buildWordHtml() {
  if (!selectedDocument.value) {
    return ''
  }

  const body = renderMarkdown(selectedDocument.value.content)
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${selectedDocument.value.title}</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; margin: 24px; color: #111827; }
      .markdown-body { line-height: 1.75; }
      .markdown-body img { max-width: 100%; height: auto; }
      .markdown-body pre { background: #111827; color: #f9fafb; padding: 16px; border-radius: 12px; overflow-x: auto; }
      .markdown-body code { background: rgba(15, 23, 42, 0.08); padding: 2px 6px; border-radius: 6px; }
      .markdown-body pre code { background: transparent; padding: 0; }
      .markdown-body table { width: 100%; border-collapse: collapse; border: 1px solid #9ca3af; mso-border-alt: solid #9ca3af .75pt; }
      .markdown-body th, .markdown-body td { border: 1px solid #9ca3af; mso-border-alt: solid #9ca3af .75pt; padding: 8px 10px; text-align: left; }
      .markdown-body blockquote { border-left: 4px solid #d97706; padding-left: 12px; color: #4b5563; }
    </style>
  </head>
  <body>
    <article class="markdown-body">${body}</article>
  </body>
</html>`
}

async function loadHtml2Pdf() {
  if (!import.meta.client) {
    return null
  }

  const globalWithHtml2Pdf = window as Window & {
    html2pdf?: (source?: unknown) => {
      from: (element: HTMLElement) => unknown
      set: (options: Record<string, unknown>) => unknown
      save: () => Promise<void>
    }
  }

  if (globalWithHtml2Pdf.html2pdf) {
    return globalWithHtml2Pdf.html2pdf
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-fd-html2pdf="true"]'
    ) as HTMLScriptElement | null

    if (existing && globalWithHtml2Pdf.html2pdf) {
      resolve()
      return
    }

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('html2pdf script load failed')),
        { once: true }
      )
      return
    }

    const scriptSources = [
      '/vendor/html2pdf.bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    ]
    let sourceIndex = 0

    function appendScript() {
      const script = document.createElement('script')
      script.src = scriptSources[sourceIndex] as string
      script.async = true
      script.dataset.fdHtml2pdf = 'true'
      script.onload = () => resolve()
      script.onerror = () => {
        sourceIndex += 1
        script.remove()

        if (sourceIndex < scriptSources.length) {
          appendScript()
          return
        }

        reject(new Error('html2pdf script load failed'))
      }
      document.head.appendChild(script)
    }

    appendScript()
  })

  return globalWithHtml2Pdf.html2pdf ?? null
}

function exportDocument(format: 'md' | 'pdf' | 'word') {
  if (!selectedDocument.value || !import.meta.client) {
    return
  }

  const filename = sanitizeFilename(selectedDocument.value.title)
  isExportMenuOpen.value = false
  isActionMenuOpen.value = false

  if (format === 'md') {
    downloadBlob(
      selectedDocument.value.content,
      `${filename}.md`,
      'text/markdown;charset=utf-8'
    )
    return
  }

  if (format === 'word') {
    const wordHtml = buildWordHtml()
    downloadBlob(
      wordHtml,
      `${filename}.doc`,
      'application/msword;charset=utf-8'
    )
    return
  }

  const html = buildExportHtml()

  if (format === 'pdf') {
    void (async () => {
      try {
        const html2pdf = await loadHtml2Pdf()

        if (!html2pdf) {
          workspaceError.value = t('workspace.exportPdfEngineMissing')
          return
        }

        const container = document.createElement('div')
        container.style.position = 'fixed'
        container.style.left = '-99999px'
        container.style.top = '0'
        container.style.width = '1024px'
        container.innerHTML = html
        document.body.appendChild(container)

        const article = container.querySelector(
          '.markdown-body'
        ) as HTMLElement | null
        const source = article ?? container

        await (
          html2pdf() as {
            from: (element: HTMLElement) => {
              set: (options: Record<string, unknown>) => {
                save: () => Promise<void>
              }
            }
          }
        )
          .from(source)
          .set({
            margin: [10, 10, 10, 10],
            filename: `${filename}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff'
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          })
          .save()

        container.remove()
      } catch (error) {
        workspaceError.value =
          error instanceof Error
            ? t('workspace.exportPdfEngineMissing')
            : t('workspace.exportPdfEngineMissing')
      }
    })()
  }
}
</script>

<template>
  <main
    class="fd-workspace-shell fd-workspace-immersive mx-auto box-border grid w-full max-w-7xl grid-cols-1 gap-3 overflow-hidden px-2 py-2 sm:px-4 sm:py-4 md:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)] md:items-stretch lg:px-6"
  >
    <p
      v-if="workspaceError"
      class="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {{ workspaceError }}
    </p>

    <section
      ref="documentPanelRef"
      class="fd-document-panel fd-document-panel-immersive order-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-[rgba(31,41,55,0.08)] p-3 shadow-[0_22px_44px_rgba(31,41,55,0.08)] sm:p-4 md:order-2"
    >
      <div v-if="documentLoadPending" class="fd-doc-loadbar" aria-hidden="true">
        <div class="fd-doc-loadbar-track">
          <div
            class="fd-doc-loadbar-fill"
            :style="{ width: `${Math.max(6, documentLoadProgress)}%` }"
          />
        </div>
        <span class="fd-doc-loadbar-label"
          >{{ Math.round(documentLoadProgress) }}%</span
        >
      </div>

      <template v-if="selectedDocument">
        <button
          v-if="isActionMenuOpen"
          type="button"
          class="fd-action-menu-backdrop"
          aria-label="关闭操作菜单"
          @click="isActionMenuOpen = false"
        />
        <div class="fd-doc-header fd-immersive-header">
          <div class="fd-immersive-left">
            <button
              type="button"
              class="fd-icon-button md:hidden"
              :title="t('workspace.tree')"
              @click="isMobileTreeOpen = true"
            >
              <WorkspaceIcon name="folder-open" class="h-4 w-4" />
            </button>
            <div class="min-w-0 flex-1">
              <template v-if="isRenaming && canEdit">
                <UInput
                  v-model="draft.title"
                  size="lg"
                  class="fd-title-input min-w-0 flex-1"
                />
              </template>
              <h2
                v-else
                class="fd-ellipsis-title text-lg font-semibold text-slate-800 sm:text-xl"
                :title="selectedDocument.title"
                :data-full-title="selectedDocument.title"
              >
                {{ selectedDocument.title }}
              </h2>
              <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                {{ documentMetaLabel }}
              </p>
            </div>
          </div>

          <div class="fd-immersive-actions">
            <button
              v-if="isRenaming && canEdit"
              type="button"
              class="fd-icon-button"
              :title="t('common.save')"
              :disabled="savePending"
              @click="saveNow"
            >
              <WorkspaceIcon name="save" class="h-4 w-4" />
            </button>
            <button
              v-if="canEdit && !selectedDocument.isFolder"
              type="button"
              class="fd-icon-button"
              :title="
                isEditing ? t('workspace.readMode') : t('workspace.editMode')
              "
              @click="toggleEditingMode"
            >
              <WorkspaceIcon
                :name="isEditing ? 'markdown' : 'edit'"
                class="h-4 w-4"
              />
            </button>
            <button
              type="button"
              class="fd-icon-button"
              :title="t('workspace.actions')"
              @click="isActionMenuOpen = !isActionMenuOpen"
            >
              <WorkspaceIcon name="settings" class="h-4 w-4" />
            </button>
          </div>

          <div v-if="isActionMenuOpen" class="fd-action-menu-panel">
            <button
              type="button"
              class="fd-action-menu-item"
              :title="t('workspace.tree')"
              :aria-label="t('workspace.tree')"
              @click="openTreeFromActionMenu"
            >
              <WorkspaceIcon name="folder-open" class="h-4 w-4" />
            </button>
            <button
              v-if="canEdit && isFileDocument"
              type="button"
              class="fd-action-menu-item"
              :title="
                isEditing ? t('workspace.readMode') : t('workspace.editMode')
              "
              :aria-label="
                isEditing ? t('workspace.readMode') : t('workspace.editMode')
              "
              @click="toggleEditingMode"
            >
              <WorkspaceIcon
                :name="isEditing ? 'markdown' : 'edit'"
                class="h-4 w-4"
              />
            </button>
            <button
              v-if="canEdit && selectedDocument.isFolder && !isRenaming"
              type="button"
              class="fd-action-menu-item"
              :title="t('common.edit')"
              :aria-label="t('common.edit')"
              @click="startEdit"
            >
              <WorkspaceIcon name="edit" class="h-4 w-4" />
            </button>
            <button
              v-if="canEdit"
              type="button"
              class="fd-action-menu-item"
              :title="t('workspace.move')"
              :aria-label="t('workspace.move')"
              @click="toggleMovePanelFromActionMenu"
            >
              <WorkspaceIcon name="move" class="h-4 w-4" />
            </button>
            <button
              v-if="isFileDocument"
              type="button"
              class="fd-action-menu-item"
              :title="
                isFullscreen
                  ? t('workspace.exitFullscreen')
                  : t('workspace.fullscreen')
              "
              :aria-label="
                isFullscreen
                  ? t('workspace.exitFullscreen')
                  : t('workspace.fullscreen')
              "
              @click="toggleFullscreen"
            >
              <WorkspaceIcon name="fullscreen" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="fd-action-menu-item"
              :title="t('workspace.docInfo')"
              :aria-label="t('workspace.docInfo')"
              @click="openDocumentInfoPanel"
            >
              <WorkspaceIcon name="info" class="h-4 w-4" />
            </button>
            <button
              v-if="isFileDocument"
              type="button"
              class="fd-action-menu-item"
              :title="t('workspace.export')"
              :aria-label="t('workspace.export')"
              @click="isExportMenuOpen = !isExportMenuOpen"
            >
              <WorkspaceIcon name="export" class="h-4 w-4" />
            </button>
            <div v-if="isExportMenuOpen" class="fd-action-submenu">
              <button
                type="button"
                class="fd-action-submenu-item"
                :title="t('workspace.exportMd')"
                :aria-label="t('workspace.exportMd')"
                @click="exportDocument('md')"
              >
                <WorkspaceIcon name="markdown" class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="fd-action-submenu-item"
                :title="t('workspace.exportPdf')"
                :aria-label="t('workspace.exportPdf')"
                @click="exportDocument('pdf')"
              >
                <WorkspaceIcon name="pdf" class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="fd-action-submenu-item"
                :title="t('workspace.exportWord')"
                :aria-label="t('workspace.exportWord')"
                @click="exportDocument('word')"
              >
                <WorkspaceIcon name="word" class="h-4 w-4" />
              </button>
            </div>
            <button
              v-if="canEdit"
              type="button"
              class="fd-action-menu-item fd-action-menu-item-danger"
              :disabled="deletePending"
              :title="t('common.delete')"
              :aria-label="t('common.delete')"
              @click="deleteDocument"
            >
              <WorkspaceIcon name="delete" class="h-4 w-4" />
            </button>
            <button
              v-if="isRenaming && canEdit"
              type="button"
              class="fd-action-menu-item"
              :title="t('common.cancel')"
              :aria-label="t('common.cancel')"
              @click="cancelRename"
            >
              <WorkspaceIcon name="close" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          v-if="isDocumentInfoOpen"
          class="fd-doc-info-modal-wrap"
          role="dialog"
          aria-modal="true"
          :aria-label="t('workspace.docInfo')"
        >
          <button
            type="button"
            class="fd-doc-info-modal-backdrop"
            :aria-label="t('common.cancel')"
            @click="isDocumentInfoOpen = false"
          />
          <div class="fd-doc-info-modal">
            <div class="fd-doc-info-modal-head">
              <h3>{{ t('workspace.docInfo') }}</h3>
              <button
                type="button"
                class="fd-icon-button"
                :aria-label="t('common.cancel')"
                :title="t('common.cancel')"
                @click="isDocumentInfoOpen = false"
              >
                <WorkspaceIcon name="close" class="h-4 w-4" />
              </button>
            </div>
            <div class="fd-doc-info-grid">
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoFolder') }}
              </p>
              <p class="fd-doc-info-value" :title="documentFolderLabel">
                {{ documentFolderLabel }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoCreatedAt') }}
              </p>
              <p class="fd-doc-info-value">
                {{ formatTimestamp(selectedDocument.createdAt) }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoCreatedBy') }}
              </p>
              <p class="fd-doc-info-value">
                {{
                  selectedDocument.createdByName?.trim() ||
                  t('workspace.unknownUpdater')
                }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoUpdatedAt') }}
              </p>
              <p class="fd-doc-info-value">
                {{ formatTimestamp(selectedDocument.updatedAt) }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoUpdatedBy') }}
              </p>
              <p class="fd-doc-info-value">
                {{
                  selectedDocument.updatedByName?.trim() ||
                  t('workspace.unknownUpdater')
                }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoFileSize') }}
              </p>
              <p class="fd-doc-info-value">
                {{ documentFileSizeLabel }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="isMovePanelOpen && canEdit"
          class="fd-move-panel mt-3 shrink-0 rounded-[1.2rem] bg-[rgba(244,238,229,0.72)] p-3 sm:p-4"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div class="flex-1">
              <p
                class="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700"
              >
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
              <UButton
                color="neutral"
                :loading="movePending"
                @click="moveDocument"
              >
                {{ t('workspace.confirmMove') }}
              </UButton>
              <UButton
                color="neutral"
                variant="ghost"
                @click="isMovePanelOpen = false"
              >
                {{ t('common.cancel') }}
              </UButton>
            </div>
          </div>
        </div>

        <p
          v-if="conflictMessage"
          class="fd-conflict-note mt-3 shrink-0 rounded-xl bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800"
        >
          {{ conflictMessage }}
        </p>

        <div
          v-if="selectedDocument.isFolder"
          class="fd-document-stage fd-folder-stage mt-3 rounded-xl bg-[rgba(244,238,229,0.7)] p-4 text-slate-600"
        >
          <p>{{ t('workspace.folderHint') }}</p>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            {{ t('workspace.folderMoveHint') }}
          </p>
        </div>

        <div v-else class="fd-document-stage mt-3 flex min-h-0 flex-1 flex-col">
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
                @pointerdown="jumpToProgress"
              >
                <div
                  class="fd-reading-progress-fill"
                  :style="{ height: `${readingProgress}%` }"
                />
              </button>
              <span v-if="readingProgress > 0" class="fd-reading-progress-label"
                >{{ Math.round(readingProgress) }}%</span
              >
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

      <div v-else class="flex min-h-0 flex-1 flex-col">
        <div class="fd-doc-header fd-immersive-header">
          <div class="fd-immersive-left">
            <button
              type="button"
              class="fd-icon-button md:hidden"
              :title="t('workspace.tree')"
              @click="isMobileTreeOpen = true"
            >
              <WorkspaceIcon name="folder-open" class="h-4 w-4" />
            </button>
            <div class="min-w-0 flex-1">
              <h2
                class="fd-ellipsis-title text-lg font-semibold text-slate-800 sm:text-xl"
                :title="currentWorkspaceName || t('workspace.documents')"
                :data-full-title="
                  currentWorkspaceName || t('workspace.documents')
                "
              >
                {{ currentWorkspaceName || t('workspace.documents') }}
              </h2>
              <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                {{ t('workspace.treeHint') }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="fd-workspace-empty mt-3 flex min-h-0 flex-1 items-center justify-center rounded-[1.2rem] border border-dashed border-[rgba(31,41,55,0.16)] bg-[rgba(255,251,245,0.72)] p-6 text-center text-slate-500"
        >
          {{ t('workspace.pickDocument') }}
        </div>
      </div>
    </section>

    <aside
      class="fd-tree-shell fd-tree-drawer order-2 overflow-hidden md:order-1"
      :class="{ 'fd-tree-drawer-open': isMobileTreeOpen }"
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
                :class="
                  workspace.id === spaceId
                    ? 'fd-workspace-switch-option-active'
                    : ''
                "
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
            class="fd-mobile-tree-close"
            @click="isMobileTreeOpen = false"
          >
            <WorkspaceIcon name="close" class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="fd-tree-heading">
        <div>
          <p class="text-xs uppercase tracking-[0.24em] text-slate-500">
            {{ t('workspace.tree') }}
          </p>
          <h2 class="mt-2 text-lg font-semibold text-slate-800">
            {{ t('workspace.documents') }}
          </h2>
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

      <form
        v-if="createNodeMode"
        class="mt-4 space-y-3"
        @submit.prevent="createNode"
      >
        <UInput
          v-model="createNodeTitle"
          size="lg"
          :placeholder="
            createNodeMode === 'folder'
              ? t('workspace.folderName')
              : t('workspace.documentTitle')
          "
        />
        <div class="flex gap-2">
          <UButton
            type="submit"
            color="neutral"
            size="sm"
            :loading="createPending"
          >
            {{ t('common.create') }}
          </UButton>
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="createNodeMode = null"
          >
            {{ t('common.cancel') }}
          </UButton>
        </div>
      </form>

      <div class="fd-tree-list mt-2.5 space-y-1">
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
              :class="expandedFolderIdSet.has(item.id) ? 'rotate-90' : ''"
            />
          </button>
          <span v-else class="fd-tree-dot">·</span>

          <button
            type="button"
            class="fd-tree-item"
            :class="{
              'fd-tree-item-selected': selectedDocumentId === item.id,
              'fd-tree-item-ancestor': selectedAncestorIds.has(item.id),
              'fd-tree-item-branch':
                selectedPathIds.has(item.id) && selectedDocumentId !== item.id
            }"
            @mouseenter="prefetchDocument(item)"
            @click="selectNode(item)"
          >
            <span class="flex min-w-0 items-center gap-3">
              <span class="fd-tree-icon">
                <WorkspaceIcon
                  :name="
                    item.isFolder
                      ? expandedFolderIdSet.has(item.id)
                        ? 'folder-open'
                        : 'folder-closed'
                      : 'file'
                  "
                  class="h-4 w-4"
                />
              </span>
              <span
                class="truncate text-[13px] font-medium sm:text-sm"
                :title="item.title"
              >
                {{ item.title }}
              </span>
            </span>
            <small class="fd-tree-version">v{{ item.version }}</small>
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

    <button
      v-if="isMobileTreeOpen"
      type="button"
      class="fd-mobile-tree-backdrop"
      aria-label="关闭目录面板"
      @click="isMobileTreeOpen = false"
    />
  </main>
</template>
