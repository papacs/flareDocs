export type ApiFailure = {
  ok: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiSuccess<T> = {
  ok: true
  data: T
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export type AuthUser = {
  id: number
  username: string
  avatarId: string
  isSystemAdmin: boolean
  isActive: boolean
  createdAt: number
}

export type SpaceSummary = {
  id: number
  name: string
  slug: string
  visibility: 'private' | 'team' | 'public'
  createdBy: number | null
  createdAt: number
  isPersonal: boolean
  myRole: 'admin' | 'editor' | 'viewer' | null
}

export type SpaceDetail = {
  id: number
  name: string
  slug: string
  visibility: 'private' | 'team' | 'public'
  createdBy: number | null
  createdAt: number
  isPersonal: boolean
  myRole: 'admin' | 'editor' | 'viewer' | null
}

export type DocumentTreeItem = {
  id: number
  title: string
  parentId: number | null
  isFolder: boolean
  version: number
  updatedAt: number
}

export type DocumentDetail = {
  id: number
  title: string
  content: string
  parentId: number | null
  isFolder: boolean
  version: number
  updatedAt: number
}

export type AuditLogItem = {
  id: number
  action: string
  targetType: string | null
  targetId: number | null
  meta: Record<string, unknown> | null
  ip: string | null
  userAgent: string | null
  createdAt: number
  user: {
    id: number
    username: string
  } | null
}
