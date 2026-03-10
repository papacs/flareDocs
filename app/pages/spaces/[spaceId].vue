<script setup lang="ts">
import type {
  ApiResponse,
  DocumentDetail,
  DocumentShareListItem,
  DocumentTreeItem,
  OwnedSharedDocumentListItem,
  SharedDocumentDetail,
  SharedDocumentListItem,
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

type WorkspaceView = 'docs' | 'shared-with-me' | 'my-shares'

const { t } = useAppLocale()
const route = useRoute()
const router = useRouter()
const requestHeaders = import.meta.server
  ? useRequestHeaders(['cookie'])
  : undefined
const recentSpaceStorageKey = 'fd-recent-space-id'
const mobileTreeRestoreStorageKey = 'fd-mobile-tree-open-once'

const spaceId = computed(() => Number(route.params.spaceId))
const treeStorageKey = computed(() => `fd-tree-expanded:${spaceId.value}`)
const selectedDocumentId = ref<number | null>(
  parsePositiveQueryNumber(route.query.doc)
)
const workspaceView = ref<WorkspaceView>(parseWorkspaceViewFromQuery(route.query.view))
const selectedSharedDocumentId = ref<number | null>(
  parsePositiveQueryNumber(route.query.shareDoc)
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
const isSharePanelOpen = ref(false)
const isDeleteConfirmOpen = ref(false)
const isVoicePanelOpen = ref(false)
const isFullscreen = ref(false)
const isMobileTreeOpen = ref(false)
const speechSupported = ref(false)
const speechListening = ref(false)
const speechPermissionState = ref<'prompt' | 'granted' | 'denied' | 'unknown'>(
  'unknown'
)
const speechError = ref('')
const speechDraftText = ref('')
const speechInterimText = ref('')
const speechMicErrorCode = ref('')
const speechRecognitionErrorCode = ref('')
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
const sharedDocumentCache = new Map<number, SharedDocumentDetail>()
const prefetchingDocumentIds = new Set<number>()
const documentShares = ref<DocumentShareListItem[]>([])
const sharedDocumentDetail = ref<SharedDocumentDetail | null>(null)
const shareUsername = ref('')
const sharePending = ref(false)
const shareError = ref('')
const shareMessage = ref('')
const sharedDocumentError = ref('')
const sharedDocumentPending = ref(false)
const treeItems = ref<DocumentTreeItem[]>([])
const loadedTreeParentKeys = ref<string[]>([])
const treeFullyLoaded = ref(false)
const treeLoadPending = ref(false)
const treeLoadProgress = ref(0)
const treeLoadLabel = ref('')

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event & { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

const speechRecognition = ref<SpeechRecognitionLike | null>(null)

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

const { data: spacesResponse, refresh: refreshSpaces } = await useAsyncData(
  'workspace-spaces-index',
  () =>
    $fetch<ApiResponse<{ spaces: SpaceSummary[] }>>('/api/spaces', {
      headers: requestHeaders
    }),
  {
    server: false,
    immediate: false,
    default: () =>
      ({
        ok: true,
        data: {
          spaces: []
        }
      }) satisfies ApiResponse<{ spaces: SpaceSummary[] }>
  }
)

const emptySharedDocumentsResponse: ApiResponse<{ shares: SharedDocumentListItem[] }> =
  {
    ok: true,
    data: {
      shares: []
    }
  }

const emptyOwnedSharedDocumentsResponse: ApiResponse<{
  shares: OwnedSharedDocumentListItem[]
}> = {
  ok: true,
  data: {
    shares: []
  }
}

const {
  data: sharedWithMeResponse,
  refresh: refreshSharedWithMe
} = await useAsyncData(
  'workspace-shared-with-me',
  () =>
    $fetch<ApiResponse<{ shares: SharedDocumentListItem[] }>>('/api/shares', {
      headers: requestHeaders
    }).catch(() => emptySharedDocumentsResponse),
  {
    default: () => emptySharedDocumentsResponse
  }
)

const { data: mySharedDocumentsResponse, refresh: refreshMySharedDocuments } =
  await useAsyncData(
    'workspace-my-shares',
    () =>
      $fetch<ApiResponse<{ shares: OwnedSharedDocumentListItem[] }>>(
        '/api/shares/owned',
        {
          headers: requestHeaders
        }
      ).catch(() => emptyOwnedSharedDocumentsResponse),
    {
      default: () => emptyOwnedSharedDocumentsResponse
    }
  )

const { data: rootTreeResponse, refresh: refreshRootTree } = await useAsyncData(
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
const sharedWithMeDocuments = computed(() =>
  sharedWithMeResponse.value && sharedWithMeResponse.value.ok
    ? sharedWithMeResponse.value.data.shares
    : []
)
const mySharedDocuments = computed(() =>
  mySharedDocumentsResponse.value && mySharedDocumentsResponse.value.ok
    ? mySharedDocumentsResponse.value.data.shares
    : []
)
const treeItemMap = computed(
  () => new Map(treeItems.value.map((item) => [item.id, item]))
)
const expandedFolderIdSet = computed(() => new Set(expandedFolderIds.value))
const loadedTreeParentKeySet = computed(
  () => new Set(loadedTreeParentKeys.value)
)

const selectedDocument = ref<DocumentDetail | null>(null)

const canEdit = computed(() => {
  const role = space.value?.myRole
  return role === 'admin' || role === 'editor'
})
const canCurrentEdit = computed(() =>
  workspaceView.value === 'my-shares'
    ? Boolean(sharedDocumentDetail.value)
    : canEdit.value
)
const canShareDocument = computed(() =>
  Boolean(
    selectedDocument.value &&
    !selectedDocument.value.isFolder &&
    canEdit.value &&
    space.value?.isPersonal
  )
)
const isSharedView = computed(() => workspaceView.value !== 'docs')
const activeSharedDocuments = computed(() =>
  workspaceView.value === 'shared-with-me'
    ? sharedWithMeDocuments.value
    : workspaceView.value === 'my-shares'
      ? mySharedDocuments.value
      : []
)
const activeSharedSidebarItems = computed(() => {
  if (workspaceView.value === 'shared-with-me') {
    return sharedWithMeDocuments.value.map((item) => ({
      documentId: item.documentId,
      title: item.title,
      subtitle: t('workspace.sharedByWorkspace', {
        username: item.owner.username,
        name: item.spaceName
      }),
      timestamp: item.shareCreatedAt
    }))
  }

  if (workspaceView.value === 'my-shares') {
    return mySharedDocuments.value.map((item) => ({
      documentId: item.documentId,
      title: item.title,
      subtitle: t('workspace.mySharesListMeta', {
        count: item.shareCount,
        name: item.spaceName
      }),
      timestamp: item.lastSharedAt
    }))
  }

  return []
})
const selectedMySharedDocument = computed(
  () =>
    mySharedDocuments.value.find(
      (document) => document.documentId === selectedSharedDocumentId.value
    ) ?? null
)

const activeActionDocument = computed(() =>
  workspaceView.value === 'docs'
    ? selectedDocument.value
    : sharedDocumentDetail.value?.document ?? null
)

const activeEditableDocument = computed(() =>
  workspaceView.value === 'my-shares'
    ? sharedDocumentDetail.value?.document ?? null
    : selectedDocument.value
)

const activeEditableSpaceId = computed(() =>
  workspaceView.value === 'my-shares'
    ? sharedDocumentDetail.value?.space.id ?? null
    : spaceId.value
)

const canCurrentMove = computed(
  () => workspaceView.value === 'docs' && canEdit.value
)

const canCurrentShare = computed(() => {
  if (workspaceView.value === 'my-shares') {
    return Boolean(
      sharedDocumentDetail.value && !sharedDocumentDetail.value.document.isFolder
    )
  }

  return canShareDocument.value
})

const isFileDocument = computed(() =>
  Boolean(activeActionDocument.value && !activeActionDocument.value.isFolder)
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

function formatTodayDateLabel() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function appendSpeechTextToMarkdown(content: string, text: string) {
  const normalizedText = text.trim()

  if (!normalizedText) {
    return content
  }

  const lines = content.split('\n')
  const hasFrontmatter = lines[0]?.trim() === '---'
  let frontmatterEndIndex = -1

  if (hasFrontmatter) {
    for (let index = 1; index < lines.length; index += 1) {
      if (lines[index].trim() === '---') {
        frontmatterEndIndex = index
        break
      }
    }
  }

  const frontmatterLines =
    frontmatterEndIndex > 0 ? lines.slice(0, frontmatterEndIndex + 1) : []
  const bodyLines =
    frontmatterEndIndex > 0 ? lines.slice(frontmatterEndIndex + 1) : lines

  const dateHeading = `## ${formatTodayDateLabel()}`
  const dateHeadingIndex = bodyLines.findIndex(
    (line) => line.trim() === dateHeading
  )
  const listLine = `- ${normalizedText}`

  let todaySectionLines: string[] = []
  let remainingLines = [...bodyLines]

  if (dateHeadingIndex >= 0) {
    let sectionEndIndex = bodyLines.length

    for (
      let index = dateHeadingIndex + 1;
      index < bodyLines.length;
      index += 1
    ) {
      if (/^##\s+/.test(bodyLines[index].trim())) {
        sectionEndIndex = index
        break
      }
    }

    todaySectionLines = bodyLines.slice(dateHeadingIndex, sectionEndIndex)
    remainingLines = [
      ...bodyLines.slice(0, dateHeadingIndex),
      ...bodyLines.slice(sectionEndIndex)
    ]
  }

  if (!todaySectionLines.length) {
    todaySectionLines = [dateHeading, '', listLine]
  } else {
    while (
      todaySectionLines.length &&
      !todaySectionLines[todaySectionLines.length - 1].trim()
    ) {
      todaySectionLines.pop()
    }
    todaySectionLines.push('', listLine)
  }

  while (remainingLines.length && !remainingLines[0].trim()) {
    remainingLines.shift()
  }

  const outputLines = [
    ...frontmatterLines,
    ...(frontmatterLines.length ? [''] : []),
    ...todaySectionLines,
    ...(remainingLines.length ? ['', ...remainingLines] : [])
  ]

  return `${outputLines.join('\n').trimEnd()}\n`
}

function mapSpeechErrorMessage(errorCode?: string) {
  switch (errorCode) {
    case 'not-allowed':
      return t('workspace.voiceErrorDeniedManual')
    case 'service-not-allowed':
      return t('workspace.voiceErrorServiceNotAllowed')
    case 'audio-capture':
      return t('workspace.voiceErrorNoMic')
    case 'no-speech':
      return t('workspace.voiceErrorNoSpeech')
    case 'network':
      return t('workspace.voiceErrorNetwork')
    case 'aborted':
      return t('workspace.voiceErrorAborted')
    default:
      return t('workspace.voiceErrorGeneric')
  }
}

const isSpaceMenuOpen = ref(false)
const isTreeToolsMenuOpen = ref(false)
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

function parseWorkspaceViewFromQuery(value: unknown): WorkspaceView {
  return value === 'shared-with-me' || value === 'my-shares' ? value : 'docs'
}

function parsePositiveQueryNumber(value: unknown) {
  const normalizedValue = Array.isArray(value) ? value[0] : value
  const parsedValue = Number(normalizedValue)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

async function syncWorkspaceQuery() {
  if (!import.meta.client) {
    return
  }

  const nextQuery = { ...route.query }

  if (selectedDocumentId.value) {
    nextQuery.doc = String(selectedDocumentId.value)
  } else {
    delete nextQuery.doc
  }

  if (workspaceView.value === 'docs') {
    delete nextQuery.view
    delete nextQuery.shareDoc
  } else {
    nextQuery.view = workspaceView.value

    if (selectedSharedDocumentId.value) {
      nextQuery.shareDoc = String(selectedSharedDocumentId.value)
    } else {
      delete nextQuery.shareDoc
    }
  }

  await router.replace({ query: nextQuery })
}

function setWorkspaceView(nextView: WorkspaceView) {
  if (workspaceView.value === nextView) {
    return
  }

  workspaceView.value = nextView
  isActionMenuOpen.value = false
  isExportMenuOpen.value = false
  isMovePanelOpen.value = false
  isDocumentInfoOpen.value = false
  isSharePanelOpen.value = false
  isVoicePanelOpen.value = false
  isEditing.value = false
  isRenaming.value = false
  if (speechListening.value) {
    stopSpeechRecognition()
  }

  if (nextView === 'shared-with-me') {
    void refreshSharedWithMe()
  }

  if (nextView === 'my-shares') {
    void refreshMySharedDocuments()
  }

  void syncWorkspaceQuery()
}

function selectSharedDocument(documentId: number) {
  if (!documentId) {
    return
  }

  selectedSharedDocumentId.value = documentId
  isMobileTreeOpen.value = false
  isActionMenuOpen.value = false
  void syncWorkspaceQuery()
}

function openOwnedSharePanel() {
  if (workspaceView.value !== 'my-shares' || !sharedDocumentDetail.value) {
    return
  }

  isSharePanelOpen.value = true
  isActionMenuOpen.value = false
  shareUsername.value = ''
  shareError.value = ''
  shareMessage.value = ''
}

const workspaceTreeTitle = computed(() => {
  if (workspaceView.value === 'shared-with-me') {
    return t('workspace.sharedWithMe')
  }

  if (workspaceView.value === 'my-shares') {
    return t('workspace.myShares')
  }

  return t('workspace.documents')
})

async function selectWorkspace(nextSpaceId: number) {
  isSpaceMenuOpen.value = false
  isTreeToolsMenuOpen.value = false

  if (!nextSpaceId || nextSpaceId === spaceId.value) {
    return
  }

  if (import.meta.client && isMobileTreeOpen.value) {
    const isMobileViewport = window.matchMedia('(max-width: 767px)').matches

    if (isMobileViewport) {
      window.sessionStorage.setItem(mobileTreeRestoreStorageKey, '1')
    }
  }

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

    if (left.createdAt !== right.createdAt) {
      return right.createdAt - left.createdAt
    }

    if (left.updatedAt !== right.updatedAt) {
      return right.updatedAt - left.updatedAt
    }

    return left.title.localeCompare(right.title, 'zh-CN')
  })
}

function getParentKey(parentId: null | number) {
  return parentId === null ? 'root' : String(parentId)
}

function toTreeItem(document: DocumentDetail): DocumentTreeItem {
  return {
    id: document.id,
    title: document.title,
    parentId: document.parentId,
    isFolder: document.isFolder,
    version: document.version,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  }
}

function collectLoadedDescendantIds(rootIds: number[]) {
  const byParent = new Map<number | null, number[]>()

  for (const item of treeItems.value) {
    const siblings = byParent.get(item.parentId) ?? []
    siblings.push(item.id)
    byParent.set(item.parentId, siblings)
  }

  const descendants = new Set<number>()
  const stack = [...rootIds]

  while (stack.length) {
    const currentId = stack.pop()

    if (!currentId) {
      continue
    }

    const children = byParent.get(currentId) ?? []

    for (const childId of children) {
      if (!descendants.has(childId)) {
        descendants.add(childId)
        stack.push(childId)
      }
    }
  }

  return descendants
}

function markTreeParentLoaded(parentId: null | number) {
  const key = getParentKey(parentId)

  if (!loadedTreeParentKeySet.value.has(key)) {
    loadedTreeParentKeys.value = [...loadedTreeParentKeys.value, key]
  }
}

function replaceTreeBranch(parentId: null | number, items: DocumentTreeItem[]) {
  const currentChildIds = treeItems.value
    .filter((item) => item.parentId === parentId)
    .map((item) => item.id)
  const nextChildIds = new Set(items.map((item) => item.id))
  const removedChildIds = currentChildIds.filter((id) => !nextChildIds.has(id))
  const removedDescendantIds = collectLoadedDescendantIds(removedChildIds)

  treeItems.value = [
    ...treeItems.value.filter(
      (item) =>
        item.parentId !== parentId &&
        !removedDescendantIds.has(item.id) &&
        !removedChildIds.includes(item.id)
    ),
    ...items
  ]

  markTreeParentLoaded(parentId)
}

function upsertTreeItem(item: DocumentTreeItem) {
  treeItems.value = [
    ...treeItems.value.filter((existingItem) => existingItem.id !== item.id),
    item
  ]
}

function removeTreeSubtree(documentId: number) {
  const removedIds = collectLoadedDescendantIds([documentId])
  removedIds.add(documentId)
  treeItems.value = treeItems.value.filter((item) => !removedIds.has(item.id))
  expandedFolderIds.value = expandedFolderIds.value.filter(
    (id) => !removedIds.has(id)
  )
}

async function fetchTreeBranch(
  parentId: null | number,
  options: { all?: boolean } = {}
) {
  const query = options.all
    ? { all: '1' }
    : parentId === null
      ? undefined
      : { parentId: String(parentId) }

  const response = await $fetch<ApiResponse<{ documents: DocumentTreeItem[] }>>(
    `/api/spaces/${spaceId.value}/tree`,
    {
      headers: requestHeaders,
      query
    }
  )

  if (!response.ok) {
    throw new Error(response.error.message)
  }

  return response.data.documents
}

async function loadTreeBranch(
  parentId: null | number,
  options: { force?: boolean } = {}
) {
  const key = getParentKey(parentId)

  if (
    !options.force &&
    (treeFullyLoaded.value || loadedTreeParentKeySet.value.has(key))
  ) {
    return
  }

  const branch =
    parentId === null && !options.force && rootTreeResponse.value?.ok
      ? rootTreeResponse.value.data.documents
      : await fetchTreeBranch(parentId)

  replaceTreeBranch(parentId, branch)
}

async function loadEntireTree(options: { withProgress?: boolean } = {}) {
  const withProgress = options.withProgress ?? false

  if (withProgress) {
    treeLoadPending.value = true
    treeLoadProgress.value = 12
    treeLoadLabel.value = t('workspace.expandAll')
  }

  try {
    const allItems = await fetchTreeBranch(null, { all: true })
    treeItems.value = allItems
    treeFullyLoaded.value = true
    loadedTreeParentKeys.value = [
      'root',
      ...allItems.filter((item) => item.isFolder).map((item) => String(item.id))
    ]

    if (withProgress) {
      treeLoadProgress.value = 100
    }
  } finally {
    if (withProgress) {
      window.setTimeout(() => {
        treeLoadPending.value = false
        treeLoadProgress.value = 0
        treeLoadLabel.value = ''
      }, 180)
    }
  }
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

async function expandDocumentPath(documentId: number | null) {
  if (!documentId) {
    return
  }

  if (!treeItemMap.value.has(documentId) && !treeFullyLoaded.value) {
    try {
      await loadEntireTree()
    } catch {
      return
    }
  }

  const expanded = new Set(expandedFolderIds.value)
  let cursor = treeItemMap.value.get(documentId)?.parentId ?? null

  while (cursor) {
    if (!treeFullyLoaded.value) {
      await loadTreeBranch(cursor)
    }
    expanded.add(cursor)
    cursor = treeItemMap.value.get(cursor)?.parentId ?? null
  }

  expandedFolderIds.value = [...expanded]
}

async function expandAllFolders() {
  await loadEntireTree({ withProgress: true })
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
    treeItems.value = []
    loadedTreeParentKeys.value = []
    treeFullyLoaded.value = false
    treeLoadPending.value = false
    treeLoadProgress.value = 0
    treeLoadLabel.value = ''
    documentCache.clear()
    sharedDocumentCache.clear()
    prefetchingDocumentIds.clear()
    sharedDocumentDetail.value = null
    sharedDocumentError.value = ''
    restoreExpandedFolders()
  },
  { immediate: true }
)

watch(
  rootTreeResponse,
  async (response) => {
    if (!response?.ok) {
      treeItems.value = []
      loadedTreeParentKeys.value = []
      treeReady.value = false
      return
    }

    replaceTreeBranch(null, response.data.documents)
    treeReady.value = true

    const initialExpandedIds = persistedExpandedFolderIds.value ?? []

    if (!treeFullyLoaded.value && initialExpandedIds.length) {
      for (const folderId of initialExpandedIds) {
        try {
          await loadTreeBranch(folderId)
        } catch {
          // ignore stale expanded folders
        }
      }
    }
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

watch(isSpaceMenuOpen, async (open) => {
  if (
    !open ||
    !import.meta.client ||
    (spacesResponse.value?.ok && spacesResponse.value.data.spaces.length > 0)
  ) {
    return
  }

  await refreshSpaces()
})

watch(
  () => route.query.view,
  (value) => {
    const nextView = parseWorkspaceViewFromQuery(value)

    if (workspaceView.value !== nextView) {
      workspaceView.value = nextView
    }
  }
)

watch(
  () => route.query.shareDoc,
  (value) => {
    const nextDocumentId = parsePositiveQueryNumber(value)

    if (selectedSharedDocumentId.value !== nextDocumentId) {
      selectedSharedDocumentId.value = nextDocumentId
    }
  }
)

watch(
  treeItems,
  async (documents) => {
    if (!documents.length) {
      clearAutoSaveTimer()
      expandedFolderIds.value = []
      treeReady.value = false
      if (!selectedDocumentId.value) {
        selectedDocument.value = null
      }
      return
    }

    const folderIds = documents
      .filter((document) => document.isFolder)
      .map((document) => document.id)
    const expanded = treeReady.value
      ? new Set(expandedFolderIds.value)
      : new Set<number>(persistedExpandedFolderIds.value ?? [])

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
      return
    }

    await expandDocumentPath(selectedDocumentId.value)

    // Keep editor cursor stable while typing: do not background-refresh
    // the current document during edit mode.
    if (!isEditing.value) {
      await loadDocument(selectedDocumentId.value, { background: true })
    }
  },
  { immediate: true }
)

watch(selectedDocumentId, async (documentId) => {
  conflictMessage.value = ''
  clearAutoSaveTimer()
  isActionMenuOpen.value = false
  void syncWorkspaceQuery()

  await loadDocument(documentId)
  isEditing.value = false
  isRenaming.value = false
  await expandDocumentPath(documentId)
  nextTick(() => {
    if (documentScrollRef.value) {
      documentScrollRef.value.scrollTop = 0
    }
    updateReadingProgress()
  })
})

watch(workspaceView, async (view) => {
  conflictMessage.value = ''
  sharedDocumentError.value = ''

  if (view === 'docs') {
    sharedDocumentDetail.value = null
    void syncWorkspaceQuery()
    return
  }

  if (!selectedSharedDocumentId.value && activeSharedDocuments.value.length > 0) {
    selectedSharedDocumentId.value = activeSharedDocuments.value[0]?.documentId ?? null
  }

  void syncWorkspaceQuery()
})

watch(activeSharedDocuments, (documents) => {
  if (workspaceView.value === 'docs') {
    return
  }

  if (
    selectedSharedDocumentId.value &&
    documents.some((document) => document.documentId === selectedSharedDocumentId.value)
  ) {
    return
  }

  selectedSharedDocumentId.value = documents[0]?.documentId ?? null
})

watch(selectedSharedDocumentId, async (documentId) => {
  if (workspaceView.value === 'docs') {
    return
  }

  void syncWorkspaceQuery()
  await loadSharedDocumentDetail(documentId)
  nextTick(() => {
    if (documentScrollRef.value) {
      documentScrollRef.value.scrollTop = 0
    }
    updateReadingProgress()
  })
})

watch(
  () => activeActionDocument.value?.id ?? null,
  () => {
    const document = activeActionDocument.value
    isMovePanelOpen.value = false
    isExportMenuOpen.value = false
    isActionMenuOpen.value = false
    isDocumentInfoOpen.value = false
    isSharePanelOpen.value = false
    isDeleteConfirmOpen.value = false
    shareUsername.value = ''
    shareError.value = ''
    shareMessage.value = ''
    documentShares.value = []
    moveTargetParentId.value = document?.parentId
      ? String(document.parentId)
      : 'root'
    nextTick(() => {
      if (documentScrollRef.value) {
        documentScrollRef.value.scrollTop = 0
      }
      updateReadingProgress()
    })
  },
  { immediate: true }
)

watch(isEditing, (editing) => {
  if (!editing && speechListening.value) {
    stopSpeechRecognition()
  }
})

watch(isActionMenuOpen, (open) => {
  if (!open) {
    isExportMenuOpen.value = false
  }
})

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  if (window.sessionStorage.getItem(mobileTreeRestoreStorageKey) === '1') {
    isMobileTreeOpen.value = true
    window.sessionStorage.removeItem(mobileTreeRestoreStorageKey)
  }

  initSpeechRecognition()
  void updateSpeechPermissionState()
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

  speechRecognition.value?.abort()
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

  if (event.key === 'Escape' && isTreeToolsMenuOpen.value) {
    isTreeToolsMenuOpen.value = false
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

  if (event.key === 'Escape' && isSharePanelOpen.value) {
    isSharePanelOpen.value = false
  }
}

watch(
  [() => draft.title, () => draft.content, isEditing, activeEditableDocument],
  () => {
    scheduleAutoSave()
  }
)

function syncDraft() {
  draft.title = activeEditableDocument.value?.title ?? ''
  draft.content = activeEditableDocument.value?.content ?? ''
  saveState.value = 'idle'
}

const hasDraftChanges = computed(() => {
  if (!activeEditableDocument.value) {
    return false
  }

  return (
    draft.title !== activeEditableDocument.value.title ||
    draft.content !== activeEditableDocument.value.content
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

const sharedDocumentMetaLabel = computed(() => {
  if (!sharedDocumentDetail.value) {
    return ''
  }

  const updatedAt = formatTimestamp(sharedDocumentDetail.value.document.updatedAt)

  if (workspaceView.value === 'shared-with-me') {
    return `${updatedAt} · ${sharedDocumentDetail.value.owner.username}`
  }

  const shareCount = selectedMySharedDocument.value?.shareCount ?? 0
  return t('workspace.mySharesMeta', { count: shareCount, updatedAt })
})

const sharedDocumentRecipients = computed(
  () => selectedMySharedDocument.value?.recipients ?? []
)

const activeActionDocumentFolderLabel = computed(() => {
  if (workspaceView.value === 'docs') {
    return documentFolderLabel.value
  }

  const path = sharedDocumentDetail.value?.path ?? []
  const folders = path.slice(0, -1)

  if (!folders.length) {
    return t('workspace.rootFolder')
  }

  return folders.map((item) => item.title).join(' / ')
})

const activeActionDocumentSpaceLabel = computed(() => {
  if (workspaceView.value === 'docs') {
    return currentWorkspaceName.value || t('workspace.space')
  }

  return sharedDocumentDetail.value?.space.name ?? t('workspace.space')
})

const activeDocumentMetaLabel = computed(() => {
  if (workspaceView.value === 'my-shares') {
    return sharedDocumentMetaLabel.value
  }

  return documentMetaLabel.value
})

const activeEditorUploadUrl = computed(() => {
  if (workspaceView.value === 'my-shares') {
    return sharedDocumentDetail.value
      ? `/api/spaces/${sharedDocumentDetail.value.space.id}/upload`
      : ''
  }

  return `/api/spaces/${spaceId.value}/upload`
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

const activeActionDocumentFileSizeLabel = computed(() => {
  const document = activeActionDocument.value

  if (!document || document.isFolder) {
    return '-'
  }

  const encoder = new TextEncoder()
  return formatFileSize(encoder.encode(document.content ?? '').length)
})

function readShareApiError(error: unknown) {
  const apiError = error as {
    data?: {
      error?: {
        message?: string
      }
    }
    message?: string
  }

  return (
    apiError.data?.error?.message ??
    apiError.message ??
    t('workspace.shareOnlyPersonal')
  )
}

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

const speechPreviewText = computed(() => {
  return speechDraftText.value.trim()
})

const speechPermissionLabel = computed(() => {
  if (!speechSupported.value) {
    return t('workspace.voiceUnsupported')
  }

  switch (speechPermissionState.value) {
    case 'granted':
      return t('workspace.voicePermissionGranted')
    case 'prompt':
      return t('workspace.voicePermissionPrompt')
    case 'denied':
      return t('workspace.voicePermissionDenied')
    default:
      return t('workspace.voicePermissionUnknown')
  }
})

function clearSpeechDraft() {
  speechDraftText.value = ''
  speechInterimText.value = ''
}

function isMobileSpeechRuntime() {
  if (!import.meta.client) {
    return false
  }

  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
}

function shouldUseSpeechPermissionPreflight() {
  // Mobile Chromium is more reliable when recognition starts directly from the tap gesture.
  return !isMobileSpeechRuntime()
}

function initSpeechRecognition() {
  if (!import.meta.client) {
    return
  }

  const speechConstructor = (
    window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
    }
  ).SpeechRecognition
    ? (
        window as typeof window & {
          SpeechRecognition: new () => SpeechRecognitionLike
        }
      ).SpeechRecognition
    : (
        window as typeof window & {
          webkitSpeechRecognition?: new () => SpeechRecognitionLike
        }
      ).webkitSpeechRecognition

  if (!speechConstructor) {
    speechSupported.value = false
    return
  }

  const recognition = new speechConstructor()
  recognition.lang = 'zh-CN'
  recognition.continuous = !isMobileSpeechRuntime()
  recognition.interimResults = !isMobileSpeechRuntime()
  recognition.onresult = (event) => {
    let finalChunk = ''
    let interimChunk = ''

    for (
      let resultIndex = event.resultIndex;
      resultIndex < event.results.length;
      resultIndex += 1
    ) {
      const result = event.results[resultIndex]
      const transcript = result[0]?.transcript ?? ''

      if (result.isFinal) {
        finalChunk += transcript
      } else {
        interimChunk += transcript
      }
    }

    if (finalChunk.trim()) {
      speechDraftText.value = `${speechDraftText.value} ${finalChunk}`.trim()
    }

    speechInterimText.value = interimChunk.trim()
  }
  recognition.onerror = (event) => {
    speechRecognitionErrorCode.value = event.error || ''
    speechError.value = mapSpeechErrorMessage(event.error)
    speechListening.value = false
  }
  recognition.onend = () => {
    speechListening.value = false
    speechInterimText.value = ''
  }

  speechRecognition.value = recognition
  speechSupported.value = true
}

async function updateSpeechPermissionState() {
  if (!import.meta.client) {
    speechPermissionState.value = 'unknown'
    return
  }

  if (!('permissions' in navigator) || !navigator.permissions?.query) {
    speechPermissionState.value = 'unknown'
    return
  }

  try {
    const result = await navigator.permissions.query({
      name: 'microphone' as PermissionName
    })
    speechPermissionState.value = result.state
  } catch {
    speechPermissionState.value = 'unknown'
  }
}

async function ensureMicrophonePermission() {
  if (!import.meta.client) {
    return false
  }

  if (!window.isSecureContext) {
    speechError.value = t('workspace.voiceErrorInsecureContext')
    speechMicErrorCode.value = 'insecure-context'
    return false
  }

  await updateSpeechPermissionState()

  if (!navigator.mediaDevices?.getUserMedia) {
    return true
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    for (const track of stream.getTracks()) {
      track.stop()
    }
    speechPermissionState.value = 'granted'
    speechError.value = ''
    speechMicErrorCode.value = ''
    return true
  } catch (error) {
    const mediaError = error as { name?: string }
    const errorName = mediaError.name?.toLowerCase()
    speechMicErrorCode.value = errorName || 'unknown'
    speechPermissionState.value =
      errorName === 'notallowederror' || errorName === 'securityerror'
        ? 'denied'
        : speechPermissionState.value
    speechError.value =
      errorName === 'notallowederror' || errorName === 'securityerror'
        ? t('workspace.voiceErrorNotAllowed')
        : errorName === 'notfounderror' || errorName === 'devicesnotfounderror'
          ? t('workspace.voiceErrorNoMic')
          : t('workspace.voiceErrorGeneric')
    return false
  } finally {
    await updateSpeechPermissionState()
  }
}

async function recheckMicrophonePermission() {
  speechError.value = ''
  speechRecognitionErrorCode.value = ''
  await ensureMicrophonePermission()
}

async function startSpeechRecognition() {
  const recognition = speechRecognition.value

  if (!recognition || speechListening.value) {
    return
  }

  speechError.value = ''
  clearSpeechDraft()
  speechRecognitionErrorCode.value = ''

  if (!window.isSecureContext) {
    speechError.value = t('workspace.voiceErrorInsecureContext')
    speechMicErrorCode.value = 'insecure-context'
    return
  }

  const usePermissionPreflight = shouldUseSpeechPermissionPreflight()
  const hasMicrophonePermission = usePermissionPreflight
    ? await ensureMicrophonePermission()
    : true

  if (
    !hasMicrophonePermission &&
    (speechMicErrorCode.value === 'notfounderror' ||
      speechMicErrorCode.value === 'devicesnotfounderror' ||
      speechMicErrorCode.value === 'insecure-context')
  ) {
    return
  }

  try {
    recognition.start()
    speechListening.value = true
    if (!usePermissionPreflight) {
      void updateSpeechPermissionState()
    }
  } catch {
    speechListening.value = false
    speechError.value =
      speechPermissionState.value === 'denied'
        ? t('workspace.voiceErrorDeniedManual')
        : t('workspace.voiceErrorGeneric')
  }
}

function stopSpeechRecognition() {
  const recognition = speechRecognition.value

  if (!recognition) {
    return
  }

  recognition.stop()
  speechListening.value = false
}

function appendSpeechToDraft() {
  const recognizedText = speechDraftText.value.trim()

  if (!recognizedText) {
    return
  }

  draft.content = appendSpeechTextToMarkdown(draft.content, recognizedText)
  saveState.value = 'idle'
  clearSpeechDraft()
}

function openVoicePanelFromActionMenu() {
  isActionMenuOpen.value = false
  isVoicePanelOpen.value = true
}

function closeVoicePanel() {
  if (speechListening.value) {
    stopSpeechRecognition()
  }
  isVoicePanelOpen.value = false
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
      upsertTreeItem(toTreeItem(response.data.document))
      if (!options.background || selectedDocumentId.value === documentId) {
        if (
          options.background &&
          isEditing.value &&
          selectedDocument.value?.id === documentId &&
          !selectedDocument.value.isFolder
        ) {
          // Avoid resetting draft/model while editing; only refresh metadata.
          selectedDocument.value = {
            ...selectedDocument.value,
            version: response.data.document.version,
            updatedAt: response.data.document.updatedAt,
            updatedByName: response.data.document.updatedByName
          }
        } else {
          selectedDocument.value = response.data.document
          syncDraft()
        }
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

async function loadSharedDocumentDetail(
  documentId: number | null,
  options: { force?: boolean } = {}
) {
  if (!documentId || workspaceView.value === 'docs') {
    sharedDocumentDetail.value = null
    sharedDocumentError.value = ''
    sharedDocumentPending.value = false
    return
  }

  const cached = sharedDocumentCache.get(documentId)

  if (cached && !options.force) {
    sharedDocumentDetail.value = cached
    sharedDocumentError.value = ''
    return
  }

  sharedDocumentPending.value = true
  sharedDocumentError.value = ''

  try {
    const response = await $fetch<ApiResponse<SharedDocumentDetail>>(
      `/api/shares/${documentId}`,
      {
        headers: requestHeaders
      }
    )

    if (!response.ok) {
      sharedDocumentDetail.value = null
      sharedDocumentError.value = response.error.message
      return
    }

    sharedDocumentCache.set(documentId, response.data)
    sharedDocumentDetail.value = response.data
  } catch (error) {
    sharedDocumentDetail.value = null
    sharedDocumentError.value =
      error instanceof Error ? error.message : t('workspace.sharedLoadFailed')
  } finally {
    sharedDocumentPending.value = false
  }
}

async function toggleFolder(nodeId: number) {
  const expanded = new Set(expandedFolderIds.value)

  if (expanded.has(nodeId)) {
    expanded.delete(nodeId)
  } else {
    if (!treeFullyLoaded.value) {
      await loadTreeBranch(nodeId)
    }
    expanded.add(nodeId)
  }

  expandedFolderIds.value = [...expanded]
}

function selectNode(node: TreeNode | DocumentTreeItem) {
  if (workspaceView.value !== 'docs') {
    setWorkspaceView('docs')
  }

  if (selectedDocumentId.value === node.id) {
    isMobileTreeOpen.value = false
    isActionMenuOpen.value = false
    void syncWorkspaceQuery()
    void loadDocument(node.id)
    return
  }

  selectedDocumentId.value = node.id
  void expandDocumentPath(node.id)
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
  if (!activeEditableDocument.value || !canCurrentEdit.value) {
    return
  }

  isActionMenuOpen.value = false
  draft.title = activeEditableDocument.value.title
  isRenaming.value = true

  if (!activeEditableDocument.value.isFolder) {
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
    !activeEditableDocument.value ||
    !canCurrentEdit.value ||
    activeEditableDocument.value.isFolder
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
  if (!isMovePanelOpen.value && !treeFullyLoaded.value) {
    void loadEntireTree({ withProgress: true }).then(() => {
      isMovePanelOpen.value = true
    })
    isActionMenuOpen.value = false
    return
  }

  isMovePanelOpen.value = !isMovePanelOpen.value
  isActionMenuOpen.value = false
}

function openDocumentInfoPanel() {
  if (!activeActionDocument.value) {
    return
  }

  isDocumentInfoOpen.value = true
  isActionMenuOpen.value = false
  isExportMenuOpen.value = false
}

async function copyActiveDocumentContent() {
  const document = activeActionDocument.value

  if (!import.meta.client || !document) {
    return
  }

  try {
    await navigator.clipboard.writeText(document.content ?? '')
    isActionMenuOpen.value = false
    isExportMenuOpen.value = false
  } catch {
    workspaceError.value = t('workspace.copyFailed')
  }
}

async function loadDocumentShares() {
  if (!selectedDocument.value || !canShareDocument.value) {
    documentShares.value = []
    return
  }

  const response = await $fetch<
    ApiResponse<{ shares: DocumentShareListItem[] }>
  >(`/api/spaces/${spaceId.value}/docs/${selectedDocument.value.id}/shares`, {
    headers: requestHeaders
  })

  if (!response.ok) {
    throw new Error(response.error.message)
  }

  documentShares.value = response.data.shares
}

async function openSharePanel() {
  if (!canShareDocument.value) {
    shareError.value = t('workspace.shareOnlyPersonal')
    return
  }

  isSharePanelOpen.value = true
  isActionMenuOpen.value = false
  isExportMenuOpen.value = false
  shareUsername.value = ''
  shareError.value = ''
  shareMessage.value = ''

  try {
    await loadDocumentShares()
  } catch (error) {
    shareError.value = readShareApiError(error)
  }
}

async function submitDocumentShare() {
  if (sharePending.value) {
    return
  }

  const targetSpaceId =
    workspaceView.value === 'my-shares'
      ? sharedDocumentDetail.value?.space.id ?? null
      : spaceId.value
  const targetDocumentId =
    workspaceView.value === 'my-shares'
      ? sharedDocumentDetail.value?.document.id ?? null
      : selectedDocument.value?.id ?? null

  if (!targetSpaceId || !targetDocumentId) {
    return
  }

  const username = shareUsername.value.trim().toLowerCase()

  if (!username) {
    shareError.value = t('workspace.shareUsername')
    return
  }

  sharePending.value = true
  shareError.value = ''
  shareMessage.value = ''

  try {
    const response = await $fetch<
      ApiResponse<{ shares: DocumentShareListItem[] }>
    >(`/api/spaces/${targetSpaceId}/docs/${targetDocumentId}/shares`, {
      method: 'POST',
      body: {
        username
      }
    })

    if (!response.ok) {
      shareError.value = response.error.message
      return
    }

    if (workspaceView.value === 'my-shares') {
      sharedDocumentCache.delete(targetDocumentId)
      await refreshMySharedDocuments()
      await loadSharedDocumentDetail(targetDocumentId, { force: true })
    } else {
      documentShares.value = response.data.shares
    }

    shareMessage.value = t('workspace.shareSaved', { username })
    shareUsername.value = ''
  } catch (error) {
    shareError.value = readShareApiError(error)
  } finally {
    sharePending.value = false
  }
}

async function revokeDocumentShare(sharedWithUserId: number) {
  if (!selectedDocument.value || sharePending.value) {
    return
  }

  sharePending.value = true
  shareError.value = ''
  shareMessage.value = ''

  try {
    const response = await $fetch<
      ApiResponse<{ shares: DocumentShareListItem[] }>
    >(
      `/api/spaces/${spaceId.value}/docs/${selectedDocument.value.id}/shares/${sharedWithUserId}`,
      {
        method: 'DELETE',
        body: {}
      }
    )

    if (!response.ok) {
      shareError.value = response.error.message
      return
    }

    documentShares.value = response.data.shares
  } catch (error) {
    shareError.value = readShareApiError(error)
  } finally {
    sharePending.value = false
  }
}

async function revokeOwnedSharedDocument(sharedWithUserId: number) {
  const detail = sharedDocumentDetail.value

  if (
    workspaceView.value !== 'my-shares' ||
    !detail ||
    sharePending.value
  ) {
    return
  }

  sharePending.value = true
  shareError.value = ''
  shareMessage.value = ''

  try {
    const response = await $fetch<
      ApiResponse<{ shares: DocumentShareListItem[] }>
    >(
      `/api/spaces/${detail.space.id}/docs/${detail.document.id}/shares/${sharedWithUserId}`,
      {
        method: 'DELETE',
        body: {}
      }
    )

    if (!response.ok) {
      shareError.value = response.error.message
      return
    }

    const revokedUser = sharedDocumentRecipients.value.find(
      (item) => item.id === sharedWithUserId
    )

    shareMessage.value = revokedUser
      ? t('workspace.shareRevoked', { username: revokedUser.username })
      : ''
    sharedDocumentCache.delete(detail.document.id)
    await refreshMySharedDocuments()

    if (
      mySharedDocuments.value.some(
        (document) => document.documentId === detail.document.id
      )
    ) {
      await loadSharedDocumentDetail(detail.document.id, { force: true })
    } else {
      sharedDocumentDetail.value = null
    }
  } catch (error) {
    shareError.value = readShareApiError(error)
  } finally {
    sharePending.value = false
  }
}

async function saveDocument(options?: {
  keepEditing?: boolean
  silentError?: boolean
}) {
  const keepEditing = options?.keepEditing ?? false
  const silentError = options?.silentError ?? false
  const document = activeEditableDocument.value
  const targetSpaceId = activeEditableSpaceId.value

  if (!document || !targetSpaceId || savePending.value) {
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
      `/api/spaces/${targetSpaceId}/docs/${document.id}` as string
    const response = await $fetch<ApiResponse<{ document: DocumentDetail }>>(
      endpoint,
      {
        method: 'PUT',
        body: {
          title: draft.title,
          content: draft.content,
          parentId: document.parentId,
          version: document.version
        }
      }
    )

    if (response.ok) {
      if (workspaceView.value === 'my-shares' && sharedDocumentDetail.value) {
        sharedDocumentDetail.value = {
          ...sharedDocumentDetail.value,
          document: response.data.document
        }
        sharedDocumentCache.set(response.data.document.id, sharedDocumentDetail.value)
        await refreshMySharedDocuments()
      } else {
        selectedDocument.value = response.data.document
        documentCache.set(response.data.document.id, response.data.document)
        upsertTreeItem(toTreeItem(response.data.document))
      }
      saveState.value = 'saved'
      if (!keepEditing) {
        isEditing.value = false
        isRenaming.value = false
      }
      if (workspaceView.value === 'docs') {
        await expandDocumentPath(response.data.document.id)
      }
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
      const currentDocumentId = activeEditableDocument.value?.id

      if (currentDocumentId) {
        if (workspaceView.value === 'my-shares') {
          await loadSharedDocumentDetail(currentDocumentId, { force: true })
        } else {
          await loadDocument(currentDocumentId)
        }
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

    if (response.ok) {
      const parentId = response.data.document.parentId
      if (parentId !== null) {
        await loadTreeBranch(parentId, { force: true })
        expandedFolderIds.value = [
          ...new Set([...expandedFolderIds.value, parentId])
        ]
      } else {
        await refreshRootTree()
      }
      selectedDocumentId.value = response.data.document.id
      await expandDocumentPath(response.data.document.id)
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
  const document = activeEditableDocument.value
  const targetSpaceId = activeEditableSpaceId.value

  if (!document || !targetSpaceId) {
    return
  }

  if (deletePending.value) {
    return
  }

  isDeleteConfirmOpen.value = false
  deletePending.value = true
  isActionMenuOpen.value = false

  try {
    const endpoint =
      `/api/spaces/${targetSpaceId}/docs/${document.id}` as string
    await $fetch(endpoint, {
      method: 'DELETE',
      body: {}
    })

    if (workspaceView.value === 'my-shares') {
      sharedDocumentCache.delete(document.id)
      await refreshMySharedDocuments()
      sharedDocumentDetail.value = null
      selectedSharedDocumentId.value = mySharedDocuments.value[0]?.documentId ?? null
    } else {
      removeTreeSubtree(document.id)
      selectedDocument.value = null
      documentCache.clear()
      selectedDocumentId.value = null
    }
  } catch (error: unknown) {
    workspaceError.value =
      error instanceof Error ? error.message : 'Unable to delete item.'
  } finally {
    deletePending.value = false
  }
}

function requestDeleteDocument() {
  if (!activeEditableDocument.value || deletePending.value) {
    return
  }

  isActionMenuOpen.value = false
  isDeleteConfirmOpen.value = true
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
      upsertTreeItem(toTreeItem(response.data.document))
      isMovePanelOpen.value = false
      await loadEntireTree()
      await expandDocumentPath(response.data.document.id)
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
  const document = activeActionDocument.value

  if (!document) {
    return ''
  }

  const body = renderMarkdown(document.content)
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${document.title}</title>
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
  const document = activeActionDocument.value

  if (!document) {
    return ''
  }

  const body = renderMarkdown(document.content)
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40" lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${document.title}</title>
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
  const document = activeActionDocument.value

  if (!document || !import.meta.client) {
    return
  }

  const filename = sanitizeFilename(document.title)
  isExportMenuOpen.value = false
  isActionMenuOpen.value = false

  if (format === 'md') {
    downloadBlob(
      document.content,
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

      <template
        v-if="
          (workspaceView === 'docs' && selectedDocument) ||
          (workspaceView === 'my-shares' && activeActionDocument)
        "
      >
        <button
          v-if="
            isActionMenuOpen &&
            ((workspaceView === 'docs' && selectedDocument) ||
              (isSharedView && sharedDocumentDetail))
          "
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
              <template v-if="isRenaming && canCurrentEdit">
                <UInput
                  v-model="draft.title"
                  size="lg"
                  class="fd-title-input min-w-0 flex-1"
                />
              </template>
              <h2
                v-else
                class="fd-ellipsis-title text-lg font-semibold text-slate-800 sm:text-xl"
                :title="activeActionDocument?.title"
                :data-full-title="activeActionDocument?.title"
              >
                {{ activeActionDocument?.title }}
              </h2>
              <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                {{ activeDocumentMetaLabel }}
              </p>
            </div>
          </div>

          <div class="fd-immersive-actions">
            <button
              v-if="isRenaming && canCurrentEdit"
              type="button"
              class="fd-icon-button"
              :title="t('common.save')"
              :disabled="savePending"
              @click="saveNow"
            >
              <WorkspaceIcon name="save" class="h-4 w-4" />
            </button>
            <button
              v-if="canCurrentEdit && isFileDocument"
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
              v-if="canCurrentEdit && isFileDocument"
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
              v-if="canCurrentEdit && activeActionDocument?.isFolder && !isRenaming"
              type="button"
              class="fd-action-menu-item"
              :title="t('common.edit')"
              :aria-label="t('common.edit')"
              @click="startEdit"
            >
              <WorkspaceIcon name="edit" class="h-4 w-4" />
            </button>
            <button
              v-if="canCurrentMove"
              type="button"
              class="fd-action-menu-item"
              :title="t('workspace.move')"
              :aria-label="t('workspace.move')"
              @click="toggleMovePanelFromActionMenu"
            >
              <WorkspaceIcon name="move" class="h-4 w-4" />
            </button>
            <button
              v-if="canCurrentEdit && isFileDocument && isEditing"
              type="button"
              class="fd-action-menu-item"
              :title="t('workspace.voicePanel')"
              :aria-label="t('workspace.voicePanel')"
              @click="openVoicePanelFromActionMenu"
            >
              <WorkspaceIcon name="voice" class="h-4 w-4" />
            </button>
            <button
              v-if="canCurrentShare"
              type="button"
              class="fd-action-menu-item"
              :title="t('workspace.share')"
              :aria-label="t('workspace.share')"
              @click="
                workspaceView === 'my-shares'
                  ? openOwnedSharePanel()
                  : openSharePanel()
              "
            >
              <WorkspaceIcon name="share" class="h-4 w-4" />
            </button>
            <button
              v-if="isFileDocument"
              type="button"
              class="fd-action-menu-item"
              :title="t('workspace.copy')"
              :aria-label="t('workspace.copy')"
              @click="copyActiveDocumentContent"
            >
              <WorkspaceIcon name="copy" class="h-4 w-4" />
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
              v-if="canCurrentEdit"
              type="button"
              class="fd-action-menu-item fd-action-menu-item-danger"
              :disabled="deletePending"
              :title="t('common.delete')"
              :aria-label="t('common.delete')"
              @click="requestDeleteDocument"
            >
              <WorkspaceIcon name="delete" class="h-4 w-4" />
            </button>
            <button
              v-if="isRenaming && canCurrentEdit"
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
          v-if="isDocumentInfoOpen && activeActionDocument"
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
                {{ t('workspace.docInfoSpace') }}
              </p>
              <p class="fd-doc-info-value" :title="activeActionDocumentSpaceLabel">
                {{ activeActionDocumentSpaceLabel }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoFolder') }}
              </p>
              <p class="fd-doc-info-value" :title="activeActionDocumentFolderLabel">
                {{ activeActionDocumentFolderLabel }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoCreatedAt') }}
              </p>
              <p class="fd-doc-info-value">
                {{ formatTimestamp(activeActionDocument.createdAt) }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoCreatedBy') }}
              </p>
              <p class="fd-doc-info-value">
                {{
                  activeActionDocument.createdByName?.trim() ||
                  t('workspace.unknownUpdater')
                }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoUpdatedAt') }}
              </p>
              <p class="fd-doc-info-value">
                {{ formatTimestamp(activeActionDocument.updatedAt) }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoUpdatedBy') }}
              </p>
              <p class="fd-doc-info-value">
                {{
                  activeActionDocument.updatedByName?.trim() ||
                  t('workspace.unknownUpdater')
                }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoFileSize') }}
              </p>
              <p class="fd-doc-info-value">
                {{ activeActionDocumentFileSizeLabel }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="isSharePanelOpen && activeActionDocument"
          class="fd-doc-info-modal-wrap"
          role="dialog"
          aria-modal="true"
          :aria-label="t('workspace.shareDoc')"
        >
          <button
            type="button"
            class="fd-doc-info-modal-backdrop"
            :aria-label="t('common.cancel')"
            @click="isSharePanelOpen = false"
          />
          <div class="fd-doc-info-modal">
            <div class="fd-doc-info-modal-head">
              <h3>{{ t('workspace.shareDoc') }}</h3>
              <button
                type="button"
                class="fd-icon-button"
                :aria-label="t('common.cancel')"
                :title="t('common.cancel')"
                @click="isSharePanelOpen = false"
              >
                <WorkspaceIcon name="close" class="h-4 w-4" />
              </button>
            </div>
            <p
              class="mt-3 text-sm leading-6 text-slate-500"
            >
              {{ t('workspace.shareDocSummary') }}
            </p>
            <form
              class="mt-4 flex flex-col gap-3 sm:flex-row"
              @submit.prevent="submitDocumentShare"
            >
              <UInput
                v-model="shareUsername"
                class="flex-1"
                size="lg"
                :placeholder="t('workspace.shareUsername')"
              />
              <UButton type="submit" color="neutral" :loading="sharePending">
                {{ t('workspace.shareSubmit') }}
              </UButton>
            </form>
            <p v-if="shareError" class="mt-3 text-sm text-rose-600">
              {{ shareError }}
            </p>
            <p v-if="shareMessage" class="mt-3 text-sm text-emerald-700">
              {{ shareMessage }}
            </p>
            <div class="mt-5 space-y-2">
              <p
                class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                {{ t('workspace.shareListTitle') }}
              </p>
              <div
                v-if="
                  (workspaceView === 'docs' && documentShares.length === 0) ||
                  (workspaceView === 'my-shares' &&
                    sharedDocumentRecipients.length === 0)
                "
                class="rounded-xl border border-dashed border-[rgba(31,41,55,0.14)] px-4 py-4 text-sm text-slate-500"
              >
                {{
                  workspaceView === 'docs'
                    ? t('workspace.shareEmpty')
                    : t('workspace.mySharesEmpty')
                }}
              </div>
              <div
                v-if="workspaceView === 'docs'"
                v-for="shareItem in documentShares"
                :key="`share-user-${shareItem.sharedWith.id}`"
                class="flex items-center justify-between gap-3 rounded-xl border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-800">
                    {{ shareItem.sharedWith.username }}
                  </p>
                  <p class="text-xs text-slate-500">
                    {{ formatTimestamp(shareItem.createdAt) }}
                  </p>
                </div>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :disabled="sharePending"
                  @click="revokeDocumentShare(shareItem.sharedWith.id)"
                >
                  {{ t('workspace.shareRevoke') }}
                </UButton>
              </div>
              <div
                v-if="workspaceView === 'my-shares'"
                v-for="shareUser in sharedDocumentRecipients"
                :key="`owned-share-modal-user-${shareUser.id}`"
                class="flex items-center justify-between gap-3 rounded-xl border border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-800">
                    {{ shareUser.username }}
                  </p>
                </div>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :disabled="sharePending"
                  @click="revokeOwnedSharedDocument(shareUser.id)"
                >
                  {{ t('workspace.shareRevoke') }}
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="isMovePanelOpen && canCurrentMove"
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
          v-if="activeActionDocument?.isFolder"
          class="fd-document-stage fd-folder-stage fd-folder-stage-surface mt-3 rounded-xl p-4"
        >
          <p>{{ t('workspace.folderHint') }}</p>
          <p class="fd-folder-stage-subtext mt-2 text-sm leading-6">
            {{ t('workspace.folderMoveHint') }}
          </p>
        </div>

        <div
          v-if="isDeleteConfirmOpen && activeActionDocument"
          class="fd-space-delete-modal-wrap"
          role="dialog"
          aria-modal="true"
          :aria-label="t('common.delete')"
        >
          <button
            type="button"
            class="fd-space-delete-modal-backdrop"
            :aria-label="t('common.cancel')"
            @click="isDeleteConfirmOpen = false"
          />
          <div class="fd-space-delete-modal">
            <p
              class="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600"
            >
              {{ t('common.delete') }}
            </p>
            <h3 class="mt-2 text-xl font-semibold text-slate-800">
              {{ activeActionDocument.title }}
            </h3>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              {{ t('workspace.confirmDelete') }}
            </p>
            <div class="mt-5 flex items-center justify-end gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="deletePending"
                @click="isDeleteConfirmOpen = false"
              >
                {{ t('common.cancel') }}
              </UButton>
              <UButton
                color="neutral"
                :loading="deletePending"
                @click="deleteDocument"
              >
                {{ t('common.delete') }}
              </UButton>
            </div>
          </div>
        </div>

        <div v-else class="fd-document-stage mt-3 flex min-h-0 flex-1 flex-col">
          <div v-if="isEditing" class="fd-editor-stage">
            <div
              v-if="isVoicePanelOpen"
              class="fd-voice-float rounded-xl border p-3"
            >
              <div class="flex items-center justify-between gap-2">
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {{ t('workspace.voicePanel') }}
                </p>
                <button
                  type="button"
                  class="fd-icon-button"
                  :title="t('common.cancel')"
                  :aria-label="t('common.cancel')"
                  @click="closeVoicePanel"
                >
                  <WorkspaceIcon name="close" class="h-4 w-4" />
                </button>
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <button
                  v-if="speechSupported && !speechListening"
                  type="button"
                  class="fd-icon-button"
                  :title="t('workspace.voiceStart')"
                  :aria-label="t('workspace.voiceStart')"
                  @click="startSpeechRecognition"
                >
                  <WorkspaceIcon name="voice" class="h-4 w-4" />
                </button>
                <button
                  v-if="speechSupported && speechListening"
                  type="button"
                  class="fd-icon-button fd-icon-button-danger fd-voice-live"
                  :title="t('workspace.voiceStop')"
                  :aria-label="t('workspace.voiceStop')"
                  @click="stopSpeechRecognition"
                >
                  <WorkspaceIcon name="voice" class="h-4 w-4" />
                </button>
                <button
                  v-if="speechSupported"
                  type="button"
                  class="fd-icon-button"
                  :title="t('workspace.voiceAppend')"
                  :aria-label="t('workspace.voiceAppend')"
                  :disabled="!speechPreviewText"
                  @click="appendSpeechToDraft"
                >
                  <WorkspaceIcon name="plus-file" class="h-4 w-4" />
                </button>
                <span
                  class="rounded-full border px-2 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  {{ speechPermissionLabel }}
                </span>
                <button
                  v-if="speechSupported"
                  type="button"
                  class="rounded-full border px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:bg-[rgba(15,23,42,0.04)]"
                  @click="recheckMicrophonePermission"
                >
                  {{ t('workspace.voicePermissionRefresh') }}
                </button>
              </div>
              <p class="mt-2 text-xs text-slate-500">
                {{
                  speechSupported
                    ? t('workspace.voiceTip')
                    : t('workspace.voiceUnsupported')
                }}
              </p>
              <textarea
                v-model="speechDraftText"
                class="fd-voice-textarea mt-2 w-full rounded-lg border px-2 py-2 text-sm text-slate-700"
                rows="4"
              />
              <p v-if="speechInterimText" class="mt-1 text-xs text-slate-400">
                {{ speechInterimText }}
              </p>
              <p v-if="speechError" class="mt-2 text-xs text-rose-600">
                {{ speechError }}
              </p>
            </div>
            <MarkdownEditor
              :key="`editor-${activeActionDocument?.id}-${editorRenderKey}`"
              v-model="draft.content"
              :upload-url="activeEditorUploadUrl"
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
                <MarkdownViewer :value="activeActionDocument?.content || ''" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <div
        v-else-if="workspaceView === 'shared-with-me'"
        class="flex min-h-0 flex-1 flex-col"
      >
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
                :title="
                  sharedDocumentDetail?.document.title || workspaceTreeTitle
                "
                :data-full-title="
                  sharedDocumentDetail?.document.title || workspaceTreeTitle
                "
              >
                {{ sharedDocumentDetail?.document.title || workspaceTreeTitle }}
              </h2>
              <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                {{
                  sharedDocumentDetail
                    ? sharedDocumentMetaLabel
                    : t('workspace.sharedReadonlyHint')
                }}
              </p>
            </div>
          </div>
          <div v-if="sharedDocumentDetail" class="fd-immersive-actions">
            <button
              type="button"
              class="fd-icon-button"
              :title="t('workspace.actions')"
              :aria-label="t('workspace.actions')"
              @click="isActionMenuOpen = !isActionMenuOpen"
            >
              <WorkspaceIcon name="settings" class="h-4 w-4" />
            </button>
          </div>
          <div v-if="isActionMenuOpen && sharedDocumentDetail" class="fd-action-menu-panel">
            <button
              v-if="isFileDocument"
              type="button"
              class="fd-action-menu-item"
              :title="t('workspace.copy')"
              :aria-label="t('workspace.copy')"
              @click="copyActiveDocumentContent"
            >
              <WorkspaceIcon name="copy" class="h-4 w-4" />
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
          </div>
        </div>

        <div
          v-if="isSharedView && isDocumentInfoOpen && activeActionDocument"
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
                {{ t('workspace.docInfoSpace') }}
              </p>
              <p class="fd-doc-info-value" :title="activeActionDocumentSpaceLabel">
                {{ activeActionDocumentSpaceLabel }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoFolder') }}
              </p>
              <p class="fd-doc-info-value" :title="activeActionDocumentFolderLabel">
                {{ activeActionDocumentFolderLabel }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoCreatedAt') }}
              </p>
              <p class="fd-doc-info-value">
                {{ formatTimestamp(activeActionDocument.createdAt) }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoCreatedBy') }}
              </p>
              <p class="fd-doc-info-value">
                {{
                  activeActionDocument.createdByName?.trim() ||
                  t('workspace.unknownUpdater')
                }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoUpdatedAt') }}
              </p>
              <p class="fd-doc-info-value">
                {{ formatTimestamp(activeActionDocument.updatedAt) }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoUpdatedBy') }}
              </p>
              <p class="fd-doc-info-value">
                {{
                  activeActionDocument.updatedByName?.trim() ||
                  t('workspace.unknownUpdater')
                }}
              </p>
              <p class="fd-doc-info-label">
                {{ t('workspace.docInfoFileSize') }}
              </p>
              <p class="fd-doc-info-value">
                {{ activeActionDocumentFileSizeLabel }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="sharedDocumentPending"
          class="fd-workspace-empty mt-3 flex min-h-0 flex-1 items-center justify-center rounded-[1.2rem] border border-dashed border-[rgba(31,41,55,0.16)] bg-[rgba(255,251,245,0.72)] p-6 text-center text-slate-500"
        >
          {{ t('workspace.sharedLoading') }}
        </div>

        <div
          v-else-if="sharedDocumentDetail"
          class="mt-3 flex min-h-0 flex-1 flex-col gap-3"
        >
          <div class="fd-reader-shell fd-document-stage">
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
                <MarkdownViewer :value="sharedDocumentDetail.document.content" />
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="fd-workspace-empty mt-3 flex min-h-0 flex-1 items-center justify-center rounded-[1.2rem] border border-dashed border-[rgba(31,41,55,0.16)] bg-[rgba(255,251,245,0.72)] p-6 text-center text-slate-500"
        >
          {{ sharedDocumentError || t('workspace.pickSharedDocument') }}
        </div>
      </div>

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
                :title="currentWorkspaceName || workspaceTreeTitle"
                :data-full-title="
                  currentWorkspaceName || workspaceTreeTitle
                "
              >
                {{ currentWorkspaceName || workspaceTreeTitle }}
              </h2>
              <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                {{
                  workspaceView === 'docs'
                    ? t('workspace.treeHint')
                    : t('workspace.sharedReadonlyHint')
                }}
              </p>
            </div>
          </div>
        </div>
        <div
          class="fd-workspace-empty mt-3 flex min-h-0 flex-1 items-center justify-center rounded-[1.2rem] border border-dashed border-[rgba(31,41,55,0.16)] bg-[rgba(255,251,245,0.72)] p-6 text-center text-slate-500"
        >
          {{
            workspaceView === 'docs'
              ? t('workspace.pickDocument')
              : t('workspace.pickSharedDocument')
          }}
        </div>
      </div>
    </section>

    <aside
      class="fd-tree-shell fd-tree-drawer order-2 overflow-hidden md:order-1"
      :class="{ 'fd-tree-drawer-open': isMobileTreeOpen }"
    >
      <div class="fd-tree-workspace">
        <div class="fd-tree-workspace-row">
          <div class="fd-tree-workspace-mainbar">
            <NuxtLink
              class="fd-sidebar-home-link"
              to="/"
              :title="t('common.home')"
              :aria-label="t('common.home')"
            >
              <WorkspaceIcon name="home" class="h-4 w-4" />
            </NuxtLink>

            <button
              type="button"
              class="fd-sidebar-view-tab"
              :class="
                workspaceView === 'docs'
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-[rgba(31,41,55,0.1)] bg-white/70 text-slate-600'
              "
              :title="t('workspace.documents')"
              :aria-label="t('workspace.documents')"
              @click="setWorkspaceView('docs')"
            >
              <WorkspaceIcon name="file" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="fd-sidebar-view-tab"
              :class="
                workspaceView === 'shared-with-me'
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-[rgba(31,41,55,0.1)] bg-white/70 text-slate-600'
              "
              :title="t('workspace.sharedWithMe')"
              :aria-label="t('workspace.sharedWithMe')"
              @click="setWorkspaceView('shared-with-me')"
            >
              <WorkspaceIcon name="share" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="fd-sidebar-view-tab"
              :class="
                workspaceView === 'my-shares'
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-[rgba(31,41,55,0.1)] bg-white/70 text-slate-600'
              "
              :title="t('workspace.myShares')"
              :aria-label="t('workspace.myShares')"
              @click="setWorkspaceView('my-shares')"
            >
              <WorkspaceIcon name="users" class="h-4 w-4" />
            </button>
          </div>
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
        <div class="min-w-0 flex-1">
          <p v-if="workspaceView !== 'docs'" class="fd-tree-heading-label">
            {{ workspaceTreeTitle }}
          </p>
          <div v-if="workspaceView === 'docs'" class="fd-tree-heading-docs-row">
            <div class="fd-workspace-switch-shell flex-1">
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

            <div class="relative flex items-center">
              <button
                type="button"
                class="fd-tree-tools-trigger"
                :title="t('workspace.actions')"
                :aria-label="t('workspace.actions')"
                :aria-expanded="isTreeToolsMenuOpen ? 'true' : 'false'"
                @click="isTreeToolsMenuOpen = !isTreeToolsMenuOpen"
              >
                <WorkspaceIcon name="more" class="h-4 w-4" />
              </button>
              <button
                v-if="isTreeToolsMenuOpen"
                type="button"
                class="fd-workspace-switch-backdrop"
                aria-label="关闭目录操作菜单"
                @click="isTreeToolsMenuOpen = false"
              />
              <div v-if="isTreeToolsMenuOpen" class="fd-tree-tools-menu">
                <template v-if="canEdit">
                  <button
                    type="button"
                    class="fd-tree-tools-item"
                    @click="isTreeToolsMenuOpen = false; createNodeMode = 'doc'"
                  >
                    <WorkspaceIcon name="plus-file" class="h-4 w-4" />
                    <span>{{ t('workspace.createDoc') }}</span>
                  </button>
                  <button
                    type="button"
                    class="fd-tree-tools-item"
                    @click="
                      isTreeToolsMenuOpen = false;
                      createNodeMode = 'folder'
                    "
                  >
                    <WorkspaceIcon name="plus-folder" class="h-4 w-4" />
                    <span>{{ t('workspace.createFolder') }}</span>
                  </button>
                </template>
                <button
                  type="button"
                  class="fd-tree-tools-item"
                  :disabled="treeLoadPending"
                  @click="isTreeToolsMenuOpen = false; expandAllFolders()"
                >
                  <WorkspaceIcon name="expand-all" class="h-4 w-4" />
                  <span>{{ t('workspace.expandAll') }}</span>
                </button>
                <button
                  type="button"
                  class="fd-tree-tools-item"
                  :disabled="treeLoadPending"
                  @click="isTreeToolsMenuOpen = false; collapseAllFolders()"
                >
                  <WorkspaceIcon name="collapse-all" class="h-4 w-4" />
                  <span>{{ t('workspace.collapseAll') }}</span>
                </button>
              </div>
            </div>
          </div>
          <div
            v-if="workspaceView === 'docs' && treeLoadPending"
            class="mt-1.5 space-y-1"
          >
            <p class="text-[11px] text-slate-400">
              {{ treeLoadLabel || t('workspace.expandAll') }}
              {{ Math.round(treeLoadProgress) }}%
            </p>
            <div
              class="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200/80"
            >
              <div
                class="h-full rounded-full bg-amber-500 transition-[width] duration-200"
                :style="{ width: `${Math.max(6, treeLoadProgress)}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <form
        v-if="workspaceView === 'docs' && createNodeMode"
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

      <div v-if="workspaceView === 'docs'" class="fd-tree-list mt-2.5 space-y-1">
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
            :disabled="treeLoadPending"
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

      <div v-else class="fd-tree-list mt-2.5 space-y-2">
        <button
          v-for="item in activeSharedSidebarItems"
          :key="`shared-list-${workspaceView}-${item.documentId}`"
          type="button"
          class="w-full rounded-[1.25rem] border px-3 py-3 text-left transition"
          :class="
            selectedSharedDocumentId === item.documentId
              ? 'border-[rgba(15,23,42,0.5)] bg-[rgba(255,255,255,0.92)] shadow-[0_10px_24px_rgba(15,23,42,0.08)]'
              : 'border-[rgba(31,41,55,0.08)] bg-[rgba(255,255,255,0.72)] hover:border-[rgba(31,41,55,0.18)]'
          "
          @click="selectSharedDocument(item.documentId)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-800">
                {{ item.title }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                {{ item.subtitle }}
              </p>
            </div>
            <span class="text-[11px] text-slate-400">
              {{ formatTimestamp(item.timestamp) }}
            </span>
          </div>
        </button>

        <div
          v-if="activeSharedDocuments.length === 0"
          class="rounded-2xl border border-dashed border-[rgba(31,41,55,0.16)] px-4 py-6 text-sm leading-6 text-slate-500"
        >
          {{
            workspaceView === 'shared-with-me'
              ? t('workspace.sharedWithMeEmpty')
              : t('workspace.mySharesEmpty')
          }}
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
