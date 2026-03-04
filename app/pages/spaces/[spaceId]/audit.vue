<script setup lang="ts">
import type { ApiResponse, AuditLogItem, AuthUser, SpaceDetail } from '../../../types/api'

const { roleLabel, t } = useAppLocale()
const route = useRoute()
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const spaceId = computed(() => Number(route.params.spaceId))
const unauthenticatedUserResponse: ApiResponse<{ user: AuthUser }> = {
  ok: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Not authenticated.'
  }
}

const filters = reactive({
  action: '',
  userId: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  pageSize: 20
})

const { data: meResponse } = await useAsyncData('audit-auth-me', () =>
  $fetch<ApiResponse<{ user: AuthUser }>>('/api/auth/me', {
    headers: requestHeaders
  }).catch(() => unauthenticatedUserResponse)
)

const { data: spaceResponse } = await useAsyncData(
  () => `audit-space-${spaceId.value}`,
  () =>
    $fetch<ApiResponse<{ space: SpaceDetail }>>(`/api/spaces/${spaceId.value}`, {
      headers: requestHeaders
    })
)

const auditQuery = computed(() => ({
  action: filters.action || undefined,
  userId: filters.userId || undefined,
  dateFrom: filters.dateFrom || undefined,
  dateTo: filters.dateTo || undefined,
  page: filters.page,
  pageSize: filters.pageSize
}))

const { data: auditResponse, refresh: refreshAudit, status: auditStatus } = await useAsyncData(
  () => `audit-logs-${spaceId.value}-${JSON.stringify(auditQuery.value)}`,
  () =>
    $fetch<
      ApiResponse<{
        logs: AuditLogItem[]
        pagination: {
          page: number
          pageSize: number
          total: number
        }
      }>
    >(`/api/spaces/${spaceId.value}/audit-logs`, {
      headers: requestHeaders,
      query: auditQuery.value
    }),
  {
    watch: [auditQuery]
  }
)

const currentUser = computed(() => (meResponse.value?.ok ? meResponse.value.data.user : null))
const space = computed(() =>
  spaceResponse.value && spaceResponse.value.ok ? spaceResponse.value.data.space : null
)
const logs = computed(() =>
  auditResponse.value && auditResponse.value.ok ? auditResponse.value.data.logs : []
)
const pagination = computed(() =>
  auditResponse.value && auditResponse.value.ok
    ? auditResponse.value.data.pagination
    : {
        page: 1,
        pageSize: filters.pageSize,
        total: 0
      }
)

watch(
  () => [filters.action, filters.userId, filters.dateFrom, filters.dateTo, filters.pageSize],
  () => {
    filters.page = 1
  }
)

function resetFilters() {
  filters.action = ''
  filters.userId = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.page = 1
}

function applyFilters() {
  return refreshAudit()
}
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
    <header
      class="flex flex-col gap-4 rounded-[2rem] border border-[rgba(31,41,55,0.12)] bg-[rgba(255,250,243,0.92)] p-5 shadow-[0_20px_45px_rgba(120,98,69,0.12)] sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="text-sm uppercase tracking-[0.24em] text-amber-700">{{ t('audit.kicker') }}</p>
        <h1 class="mt-2 text-3xl font-semibold text-slate-800">
          {{ t('audit.activity', { name: space?.name ?? t('workspace.space') }) }}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ currentUser ? t('workspace.signedInAs', { username: currentUser.username }) : t('workspace.guestView') }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UBadge color="neutral" variant="subtle">
          {{ roleLabel(space?.myRole) }}
        </UBadge>
        <UButton color="neutral" variant="ghost" :to="`/spaces/${spaceId}`">{{ t('audit.back') }}</UButton>
      </div>
    </header>

    <section
      class="rounded-[2rem] border border-[rgba(31,41,55,0.12)] bg-[rgba(255,251,245,0.92)] p-4 shadow-[0_20px_45px_rgba(120,98,69,0.12)] sm:p-5"
    >
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <select
          v-model="filters.action"
          class="h-12 rounded-xl border border-[rgba(31,41,55,0.12)] bg-white px-4 text-sm text-slate-700 outline-none"
        >
          <option value="">{{ t('audit.allActions') }}</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
          <option value="CREATE_SPACE">CREATE_SPACE</option>
          <option value="ADD_MEMBER">ADD_MEMBER</option>
          <option value="UPDATE_MEMBER_ROLE">UPDATE_MEMBER_ROLE</option>
          <option value="REMOVE_MEMBER">REMOVE_MEMBER</option>
          <option value="CREATE_DOC">CREATE_DOC</option>
          <option value="UPDATE_DOC">UPDATE_DOC</option>
          <option value="DELETE_DOC">DELETE_DOC</option>
          <option value="UPLOAD_ASSET">UPLOAD_ASSET</option>
        </select>
        <UInput v-model="filters.userId" size="xl" :placeholder="t('audit.userId')" />
        <input
          v-model="filters.dateFrom"
          type="date"
          class="h-12 rounded-xl border border-[rgba(31,41,55,0.12)] bg-white px-4 text-sm text-slate-700 outline-none"
        />
        <input
          v-model="filters.dateTo"
          type="date"
          class="h-12 rounded-xl border border-[rgba(31,41,55,0.12)] bg-white px-4 text-sm text-slate-700 outline-none"
        />
        <div class="flex gap-2">
          <UButton color="neutral" size="lg" @click="applyFilters">{{ t('audit.apply') }}</UButton>
          <UButton color="neutral" variant="ghost" size="lg" @click="resetFilters">{{ t('audit.reset') }}</UButton>
        </div>
      </div>
    </section>

    <section class="grid gap-4">
      <article
        v-for="log in logs"
        :key="log.id"
        class="rounded-[1.8rem] border border-[rgba(31,41,55,0.12)] bg-[rgba(255,250,243,0.92)] p-5 shadow-[0_20px_45px_rgba(120,98,69,0.12)]"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              {{ log.action }}
            </p>
            <h2 class="mt-2 text-xl font-semibold text-slate-800">
              {{ log.user?.username ?? t('audit.unknownUser') }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              {{ log.targetType ?? t('audit.event') }}<span v-if="log.targetId"> #{{ log.targetId }}</span>
              · {{ new Date(log.createdAt * 1000).toLocaleString() }}
            </p>
          </div>

          <div class="rounded-2xl bg-[rgba(244,238,229,0.72)] px-4 py-3 text-sm text-slate-600">
            <p>{{ t('audit.ip', { ip: log.ip ?? 'n/a' }) }}</p>
            <p class="mt-1">{{ t('audit.ua', { userAgent: log.userAgent ?? 'n/a' }) }}</p>
          </div>
        </div>

        <pre
          v-if="log.meta"
          class="mt-4 overflow-x-auto rounded-2xl bg-[rgba(255,247,236,0.88)] p-4 text-sm leading-6 text-slate-600"
        ><code>{{ JSON.stringify(log.meta, null, 2) }}</code></pre>
      </article>

      <article
        v-if="auditStatus !== 'pending' && logs.length === 0"
        class="rounded-[1.8rem] border border-dashed border-[rgba(31,41,55,0.16)] bg-[rgba(255,251,245,0.72)] p-6 text-slate-500"
      >
        {{ t('audit.noLogs') }}
      </article>
    </section>

    <footer class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-slate-500">
        {{ t('audit.pageSummary', { page: pagination.page, total: pagination.total }) }}
      </p>

      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="filters.page <= 1"
          @click="filters.page -= 1"
        >
          {{ t('audit.previous') }}
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="pagination.page * pagination.pageSize >= pagination.total"
          @click="filters.page += 1"
        >
          {{ t('audit.next') }}
        </UButton>
      </div>
    </footer>
  </main>
</template>
