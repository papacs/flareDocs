export type AppLocale = 'en' | 'zh-CN'

type MessageParams = Record<string, number | string>
type MessageValue = ((params?: MessageParams) => string) | string

const messages: Record<AppLocale, Record<string, MessageValue>> = {
  'zh-CN': {
    'common.brand': 'flareDocs',
    'common.back': '返回',
    'common.cancel': '取消',
    'common.create': '创建',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.save': '保存',
    'common.guest': '访客',
    'common.home': '主页',
    'common.unknown': '未知',
    'role.admin': '管理员',
    'role.editor': '编辑者',
    'role.viewer': '查看者',
    'role.guest': '访客',
    'visibility.private': '私有',
    'visibility.team': '团队',
    'visibility.public': '公开',
    'visibility.unknown': '未知',
    'switch.zh': '中',
    'switch.en': 'EN',
    'login.kicker': '访问',
    'login.title': '在桌面端、手机端和窄屏内嵌浏览器中，都能稳定登录。',
    'login.summary': '认证层已经启用 HttpOnly Cookie 和同源写保护。这个页面默认适配小屏、触控和窄宽度布局。',
    'login.featureSecurityLabel': '安全',
    'login.featureSecurityValue': 'HttpOnly Cookie 会话与同源写保护已经启用。',
    'login.featureDevicesLabel': '体验',
    'login.featureDevicesValue': '桌面端、手机端和嵌入式浏览器都能保持稳定布局。',
    'login.tabLogin': '登录',
    'login.tabRegister': '注册',
    'login.panelTitleLogin': '进入你的知识空间',
    'login.panelSummaryLogin': '输入账号后直接进入空间列表，继续管理文档、成员和审计记录。',
    'login.panelTitleRegister': '创建新的团队账号',
    'login.panelSummaryRegister': '注册完成后会直接进入系统，可以继续创建空间并邀请成员。',
    'login.username': '用户名',
    'login.password': '密码',
    'login.submitLogin': '登录',
    'login.submitRegister': '创建账号',
    'login.back': '返回空间列表',
    'login.loggedInAs': ({ username }) => `你已登录为 ${username}。`,
    'index.title': '一个移动端优先、已接通真实接口的小团队知识库。',
    'index.summary': '认证、空间、成员、文档树 API 和乐观锁都已经接通，后续界面迭代不用再依赖 mock。',
    'index.openWorkspace': '打开工作区',
    'index.loginOrRegister': '登录或注册',
    'index.cloudflareTarget': 'Cloudflare 部署目标',
    'index.session': '会话',
    'index.guestMode': '访客模式',
    'index.logout': '退出登录',
    'index.loggedInHint': '你可以先创建空间，再进入文档工作区。手机端会保持上下布局，不会挤成难用的侧栏。',
    'index.guestHint': '下方会显示公开空间。登录后可以创建团队空间并管理成员。',
    'index.newSpaceName': '新空间名称',
    'index.privateOnly': '私有',
    'index.teamOnly': '团队',
    'index.publicRead': '公开',
    'index.openPersonalWorkspace': '打开个人工作区',
    'index.personalWorkspaceHint': '系统会为每个用户自动创建一个个人工作区，默认只有你自己可见。',
    'index.metricSpaces': '空间总数',
    'index.metricTeam': '团队空间',
    'index.metricPublic': '公开空间',
    'index.quickCreate': '快速创建',
    'index.spaceCardHint': '进入工作区',
    'index.spaceNameRule': '空间名称需要 2 到 64 个字符。',
    'index.invalidSpaceName': '请输入 2 到 64 个字符的空间名称。',
    'index.createSpaceFailed': '创建空间失败，请稍后重试。',
    'index.createSpace': '创建空间',
    'index.slug': ({ slug }) => `Slug：${slug}`,
    'index.role': '角色',
    'index.open': '打开',
    'index.noSpaces': '还没有空间',
    'index.noSpacesHint': '登录后创建第一个空间，或者后续开放公开空间供访客阅读。',
    'workspace.kicker': '工作区',
    'workspace.space': '空间',
    'workspace.signedInAs': ({ username }) => `当前登录：${username}`,
    'workspace.guestView': '访客视图',
    'workspace.currentRole': ({ role }) => `当前角色：${role}`,
    'workspace.audit': '审计日志',
    'workspace.tree': '树结构',
    'workspace.documents': '文档',
    'workspace.treeHint': '支持多级目录，点击目录前的按钮可展开或收起。',
    'workspace.currentPath': '当前路径',
    'workspace.expandAll': '展开全部',
    'workspace.collapseAll': '收起全部',
    'workspace.doc': '文档',
    'workspace.folder': '目录',
    'workspace.folderName': '目录名称',
    'workspace.documentTitle': '文档标题',
    'workspace.enterName': '请输入文档或目录名称。',
    'workspace.createLocationHint': '如果当前选中目录，将在该目录下创建；如果当前选中文档，将创建到它所在的同级目录。',
    'workspace.noDocuments': '还没有文档。先创建一个目录或文档。',
    'workspace.document': '文档',
    'workspace.move': '移动到...',
    'workspace.export': '导出',
    'workspace.exportMd': '导出为 Markdown',
    'workspace.exportPdf': '导出为 PDF',
    'workspace.exportWord': '导出为 Word',
    'workspace.exportPopupBlocked': '浏览器拦截了导出窗口，请允许弹窗后重试。',
    'workspace.fullscreen': '全屏查看',
    'workspace.exitFullscreen': '退出全屏',
    'workspace.confirmDelete': '确认删除当前文档或目录吗？此操作不可撤销。',
    'workspace.moveTarget': '移动目标',
    'workspace.moveRoot': '顶层目录',
    'workspace.confirmMove': '确认移动',
    'workspace.moveHint': '只能移动到目录下，系统会自动阻止把目录移动到自己的子目录中。',
    'workspace.moveFailed': '移动文档失败。',
    'workspace.version': ({ version, updatedAt }) => `版本 ${version} · 更新时间 ${updatedAt}`,
    'workspace.conflict': ({ version, updatedAt }) =>
      `检测到保存冲突。当前最新版本是 ${version}，更新时间是 ${updatedAt}。请先重新加载最新内容再保存。`,
    'workspace.folderHint': '这是文档树中的一个目录。选择子文档阅读或编辑内容，或者在该目录下新建条目。',
    'workspace.folderMoveHint': '目录也可以移动到其他目录下，移动后会一起带上它下面的所有子文档。',
    'workspace.uploadHint': '可直接拖拽图片进编辑器，或用工具栏插图。编辑时在“编辑 / 预览”标签间切换即可查看渲染效果。',
    'workspace.pickDocument': '从左侧树中选择一个文档开始阅读或编辑。',
    'audit.kicker': '审计',
    'audit.activity': ({ name }) => `${name} 活动记录`,
    'audit.back': '返回工作区',
    'audit.allActions': '全部动作',
    'audit.userId': '用户 ID',
    'audit.apply': '应用筛选',
    'audit.reset': '重置',
    'audit.unknownUser': '未知用户',
    'audit.event': '事件',
    'audit.ip': ({ ip }) => `IP：${ip}`,
    'audit.ua': ({ userAgent }) => `UA：${userAgent}`,
    'audit.noLogs': '当前筛选条件下没有审计记录。',
    'audit.pageSummary': ({ page, total }) => `第 ${page} 页 · 共 ${total} 条记录`,
    'audit.previous': '上一页',
    'audit.next': '下一页'
  },
  en: {
    'common.brand': 'flareDocs',
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.create': 'Create',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.save': 'Save',
    'common.guest': 'Guest',
    'common.home': 'Home',
    'common.unknown': 'Unknown',
    'role.admin': 'Admin',
    'role.editor': 'Editor',
    'role.viewer': 'Viewer',
    'role.guest': 'Guest',
    'visibility.private': 'Private',
    'visibility.team': 'Team',
    'visibility.public': 'Public',
    'visibility.unknown': 'Unknown',
    'switch.zh': '中',
    'switch.en': 'EN',
    'login.kicker': 'Access',
    'login.title': 'Login on desktop, phone, or narrow in-app browsers without the layout collapsing.',
    'login.summary': 'The auth layer already uses HttpOnly cookies and same-origin write protection. This page stays touch-friendly and readable on small screens.',
    'login.featureSecurityLabel': 'Security',
    'login.featureSecurityValue': 'HttpOnly cookie sessions and same-origin write protection are already enabled.',
    'login.featureDevicesLabel': 'Experience',
    'login.featureDevicesValue': 'Desktop, mobile, and in-app browser layouts stay stable and readable.',
    'login.tabLogin': 'Login',
    'login.tabRegister': 'Register',
    'login.panelTitleLogin': 'Enter your workspace',
    'login.panelSummaryLogin': 'Sign in to continue managing documents, members, and audit activity.',
    'login.panelTitleRegister': 'Create a team account',
    'login.panelSummaryRegister': 'Register a new account and continue into the app to create your first space.',
    'login.username': 'username',
    'login.password': 'password',
    'login.submitLogin': 'Login',
    'login.submitRegister': 'Create account',
    'login.back': 'Back To Spaces',
    'login.loggedInAs': ({ username }) => `You are already logged in as ${username}.`,
    'index.title': 'A mobile-first team knowledge base that is already backed by real APIs.',
    'index.summary': 'Authentication, spaces, memberships, document tree APIs, and optimistic locking are already in place, so the next UI layers can build on a real backend.',
    'index.openWorkspace': 'Open Workspace',
    'index.loginOrRegister': 'Login Or Register',
    'index.cloudflareTarget': 'Cloudflare Target',
    'index.session': 'Session',
    'index.guestMode': 'Guest mode',
    'index.logout': 'Logout',
    'index.loggedInHint': 'You can create spaces here and then open the document workspace. On phones, this panel stays above the list instead of squeezing into a side rail.',
    'index.guestHint': 'Public spaces will appear below. Login to create team spaces and manage members.',
    'index.newSpaceName': 'New space name',
    'index.privateOnly': 'Private',
    'index.teamOnly': 'Team',
    'index.publicRead': 'Public',
    'index.openPersonalWorkspace': 'Open Personal Workspace',
    'index.personalWorkspaceHint': 'Each user gets a personal workspace automatically, visible only to that user by default.',
    'index.metricSpaces': 'Spaces',
    'index.metricTeam': 'Team',
    'index.metricPublic': 'Public',
    'index.quickCreate': 'Quick create',
    'index.spaceCardHint': 'Open workspace',
    'index.spaceNameRule': 'Space names must be between 2 and 64 characters.',
    'index.invalidSpaceName': 'Enter a space name between 2 and 64 characters.',
    'index.createSpaceFailed': 'Unable to create the space right now.',
    'index.createSpace': 'Create Space',
    'index.slug': ({ slug }) => `Slug: ${slug}`,
    'index.role': 'Role',
    'index.open': 'Open',
    'index.noSpaces': 'No spaces yet',
    'index.noSpacesHint': 'Create the first space after logging in, or expose a public space later for guest read access.',
    'workspace.kicker': 'Workspace',
    'workspace.space': 'Space',
    'workspace.signedInAs': ({ username }) => `Signed in as ${username}`,
    'workspace.guestView': 'Guest view',
    'workspace.currentRole': ({ role }) => `Current role: ${role}`,
    'workspace.audit': 'Audit',
    'workspace.tree': 'Tree',
    'workspace.documents': 'Documents',
    'workspace.treeHint': 'Multi-level folders are supported. Use the control before a folder to expand or collapse it.',
    'workspace.currentPath': 'Current path',
    'workspace.expandAll': 'Expand all',
    'workspace.collapseAll': 'Collapse all',
    'workspace.doc': 'Doc',
    'workspace.folder': 'Folder',
    'workspace.folderName': 'Folder name',
    'workspace.documentTitle': 'Document title',
    'workspace.enterName': 'Enter a document or folder name.',
    'workspace.createLocationHint': 'If a folder is selected, the new item is created inside it. If a document is selected, the new item is created beside it.',
    'workspace.noDocuments': 'No documents yet. Create a folder or document to start.',
    'workspace.document': 'Document',
    'workspace.move': 'Move to...',
    'workspace.export': 'Export',
    'workspace.exportMd': 'Export as Markdown',
    'workspace.exportPdf': 'Export as PDF',
    'workspace.exportWord': 'Export as Word',
    'workspace.exportPopupBlocked': 'The browser blocked the export window. Allow popups and try again.',
    'workspace.fullscreen': 'Open fullscreen',
    'workspace.exitFullscreen': 'Exit fullscreen',
    'workspace.confirmDelete': 'Delete this document or folder? This action cannot be undone.',
    'workspace.moveTarget': 'Move target',
    'workspace.moveRoot': 'Top level',
    'workspace.confirmMove': 'Confirm move',
    'workspace.moveHint': 'Items can only be moved into folders. The app blocks moves that would place a folder inside its own descendant.',
    'workspace.moveFailed': 'Unable to move document.',
    'workspace.version': ({ version, updatedAt }) => `Version ${version} · updated at ${updatedAt}`,
    'workspace.conflict': ({ version, updatedAt }) =>
      `Conflict detected. Current version is ${version}, updated at ${updatedAt}. Reload the latest document before saving again.`,
    'workspace.folderHint': 'This folder is part of the document tree. Select a child document to read or edit content, or create a new item beneath this folder.',
    'workspace.folderMoveHint': 'Folders can also be moved into other folders, and their child documents move with them.',
    'workspace.uploadHint': 'Drag images into the editor or use the toolbar image action. Use the Write / Preview tabs while editing to inspect the rendered result.',
    'workspace.pickDocument': 'Pick a document from the tree to start reading or editing.',
    'audit.kicker': 'Audit',
    'audit.activity': ({ name }) => `${name} activity`,
    'audit.back': 'Back To Workspace',
    'audit.allActions': 'All actions',
    'audit.userId': 'User id',
    'audit.apply': 'Apply',
    'audit.reset': 'Reset',
    'audit.unknownUser': 'Unknown user',
    'audit.event': 'event',
    'audit.ip': ({ ip }) => `IP: ${ip}`,
    'audit.ua': ({ userAgent }) => `UA: ${userAgent}`,
    'audit.noLogs': 'No audit logs matched the current filters.',
    'audit.pageSummary': ({ page, total }) => `Page ${page} · ${total} total records`,
    'audit.previous': 'Previous',
    'audit.next': 'Next'
  }
}

function readMessage(locale: AppLocale, key: string) {
  return messages[locale][key] ?? messages.en[key] ?? key
}

export function useAppLocale() {
  const locale = useState<AppLocale>('app-locale', () => 'zh-CN')
  const initialized = useState('app-locale-initialized', () => false)

  if (import.meta.client && !initialized.value) {
    initialized.value = true

    const storedLocale = window.localStorage.getItem('fd-locale')

    if (storedLocale === 'zh-CN' || storedLocale === 'en') {
      locale.value = storedLocale
    }

    watch(
      locale,
      (nextLocale) => {
        window.localStorage.setItem('fd-locale', nextLocale)
      },
      { immediate: true }
    )
  }

  function t(key: string, params?: MessageParams) {
    const message = readMessage(locale.value, key)

    if (typeof message === 'function') {
      return message(params)
    }

    return message
  }

  function setLocale(nextLocale: AppLocale) {
    locale.value = nextLocale
  }

  function roleLabel(role: 'admin' | 'editor' | 'viewer' | null | undefined) {
    return t(`role.${role ?? 'guest'}`)
  }

  function visibilityLabel(visibility: 'private' | 'public' | 'team' | null | undefined) {
    return t(`visibility.${visibility ?? 'unknown'}`)
  }

  return {
    locale,
    roleLabel,
    setLocale,
    t,
    visibilityLabel
  }
}
