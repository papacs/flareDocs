export type AppLocale = 'en' | 'zh-CN'

type MessageParams = Record<string, number | string>
type MessageValue = ((params: MessageParams) => string) | string

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
    'login.summary':
      '认证层已经启用 HttpOnly Cookie 和同源写保护。这个页面默认适配小屏、触控和窄宽度布局。',
    'login.featureSecurityLabel': '安全',
    'login.featureSecurityValue': 'HttpOnly Cookie 会话与同源写保护已经启用。',
    'login.featureDevicesLabel': '体验',
    'login.featureDevicesValue':
      '桌面端、手机端和嵌入式浏览器都能保持稳定布局。',
    'login.tabLogin': '登录',
    'login.tabRegister': '注册',
    'login.panelTitleLogin': '进入你的知识空间',
    'login.panelSummaryLogin':
      '输入账号后直接进入空间列表，继续管理文档、成员和审计记录。',
    'login.adminCreateOnly': '当前系统已关闭自由注册，请联系管理员创建账号。',
    'login.panelTitleRegister': '创建新的团队账号',
    'login.panelSummaryRegister':
      '注册完成后会直接进入系统，可以继续创建空间并邀请成员。',
    'login.username': '用户名',
    'login.password': '密码',
    'login.submitLogin': '登录',
    'login.captchaInput': '验证码',
    'login.refreshCaptcha': '刷新验证码',
    'login.submitRegister': '创建账号',
    'login.back': '返回空间列表',
    'login.loggedInAs': ({ username }) => `你已登录为 ${username}。`,
    'index.title': '把团队知识整理成一棵清晰可用的文档树。',
    'index.summary':
      '先建空间，再建目录和文档；支持移动端编辑、表格公式、语音追加与权限协作。',
    'index.openWorkspace': '打开工作区',
    'index.loginOrRegister': '登录或注册',
    'index.loginOnly': '登录',
    'index.cloudflareTarget': 'Cloudflare 部署目标',
    'index.session': '会话',
    'index.guestMode': '访客模式',
    'index.systemAdmin': '系统管理员',
    'index.profileSettings': '个人设置',
    'index.closeSettings': '关闭设置',
    'index.appearance': '外观',
    'index.appearanceLight': '浅色',
    'index.appearanceDark': '深色',
    'index.appearanceHint': '默认浅色，可切换为深色外观。',
    'index.userManagement': '人员管理',
    'index.installApp': '安装到桌面',
    'index.installIosTitle': '安装到主屏幕',
    'index.installIosHint':
      '在 Safari 中点击底部“分享”按钮，然后选择“添加到主屏幕”。',
    'index.installAccepted': '应用安装请求已提交。',
    'index.installDismissed': '你取消了安装，可稍后再试。',
    'index.installUnavailable': '当前浏览器暂不支持一键安装。',
    'index.logout': '退出登录',
    'index.loggedInHint':
      '你可以先创建空间，再进入文档工作区。手机端会保持上下布局，不会挤成难用的侧栏。',
    'index.guestHint': '下方会显示公开空间。登录后可以创建团队空间并管理成员。',
    'index.newSpaceName': '新空间名称',
    'index.privateOnly': '私有',
    'index.teamOnly': '团队',
    'index.publicRead': '公开',
    'index.openPersonalWorkspace': '打开个人工作区',
    'index.personalWorkspaceHint':
      '系统会为每个用户自动创建一个个人工作区，默认只有你自己可见。',
    'index.metricSpaces': '空间总数',
    'index.metricPrivate': '私有空间',
    'index.metricTeam': '团队空间',
    'index.metricPublic': '公开空间',
    'index.quickCreate': '快速创建',
    'index.profilePanelHint':
      '可在此修改头像，或填写当前密码与新密码来更新登录密码。',
    'index.currentPassword': '当前密码',
    'index.newPassword': '新密码',
    'index.passwordHint':
      '仅修改头像可不填密码；修改密码时需同时填写当前密码和新密码。',
    'index.saveProfile': '保存个人设置',
    'index.profileSaved': '个人设置已保存。',
    'index.profileSaveFailed': '保存个人设置失败，请稍后重试。',
    'index.spaceCardHint': '进入工作区',
    'index.guestPanelTitle': '快速开始',
    'index.guestPanelSummary': ({ count }) =>
      `当前可浏览 ${count} 个公开空间。登录后可创建和协作。`,
    'index.guestPanelFeatureRead': '访客可直接浏览公开空间内容。',
    'index.guestPanelFeatureManage': '登录后可创建团队空间并管理成员权限。',
    'index.guestPanelFeaturePrivate': '每个账号都会自动获得一个个人工作区。',
    'index.guestPanelOpenPublic': '查看公开空间',
    'index.spaceTypeGuideTitle': '空间类型怎么选',
    'index.spaceTypeGuideSummary': '按可见范围选类型，后续也可再调整。',
    'index.spaceTypeGuidePrivate': '仅你和被授权成员可见，适合个人笔记和草稿。',
    'index.spaceTypeGuideTeam':
      '所有已登录用户都可查看和协作编辑，适合项目协作和团队内部沉淀。',
    'index.spaceTypeGuidePublic': '所有人可读，适合公告、手册和对外知识。',
    'index.spaceTypeGuideTip':
      '不确定时先选“私有”，整理好后再切为“团队/公开”。',
    'index.quickGuideTitle': '快速入门',
    'index.quickGuideSummaryUser': '3 分钟完成从创建到协作，按下面 4 步走。',
    'index.quickGuideStepCreateSpace':
      '点击右上角“创建空间”，先建一个私有空间。',
    'index.quickGuideStepCreateDoc': '进入空间后在左侧目录创建目录或文档。',
    'index.quickGuideStepEdit':
      '打开编辑模式直接输入，支持表格、公式和语音追加。',
    'index.quickGuideStepShare':
      '单篇先用文档分享给指定用户，长期共建资料再放进团队工作区。',
    'index.sharedWithMe': '分享给我',
    'index.sharedWithMeSummary':
      '别人从个人工作区定向分享给你的文档，会集中出现在这里。',
    'index.viewAllShares': '查看全部分享',
    'index.noSharedDocuments': '目前还没有文档分享给你。',
    'index.sharedBy': ({ username }) => `来自 ${username}`,
    'index.sharedWorkspace': ({ name }) => `来源：${name}`,
    'index.openSharedDocument': '查看分享',
    'index.spaceNameRule': '空间名称需要 2 到 64 个字符。',
    'index.invalidSpaceName': '请输入 2 到 64 个字符的空间名称。',
    'index.createSpaceFailed': '创建空间失败，请稍后重试。',
    'index.deleteSpace': '删除工作区',
    'index.deleteSpaceModalTitle': ({ name }) => `确认删除「${name}」`,
    'index.deleteSpaceModalHint': '删除后不可恢复。',
    'index.deleteSpaceModalCascade':
      '该工作区下的目录、文档和已上传文件将一并删除，请谨慎操作。',
    'index.deleteSpaceFailed': '删除工作区失败，请稍后重试。',
    'index.more': '更多',
    'index.renameSpace': '修改名称',
    'index.renameSpaceModalTitle': ({ name }) => `修改「${name}」的名称`,
    'index.renameSpaceFailed': '修改工作区名称失败，请稍后重试。',
    'index.createSpace': '创建空间',
    'index.slug': ({ slug }) => `Slug：${slug}`,
    'index.role': '角色',
    'index.open': '打开',
    'index.documentsCount': ({ count }) => `文档 ${count}`,
    'index.noSpaces': '还没有空间',
    'index.noSpacesHint':
      '登录后创建第一个空间，或者后续开放公开空间供访客阅读。',
    'workspace.kicker': '工作区',
    'workspace.space': '空间',
    'workspace.signedInAs': ({ username }) => `当前登录：${username}`,
    'workspace.guestView': '访客视图',
    'workspace.currentRole': ({ role }) => `当前角色：${role}`,
    'workspace.audit': '审计日志',
    'workspace.tree': '树结构',
    'workspace.documents': '文档',
    'workspace.sharedWithMe': '分享给我',
    'workspace.myShares': '我分享的',
    'workspace.treeHint': '支持多级目录，点击目录前的按钮可展开或收起。',
    'workspace.pickSharedDocument': '从左侧列表中选择一篇分享文档查看。',
    'workspace.sharedReadonlyHint': '分享文档在这里统一只读查看，移动端和桌面端使用同一套布局。',
    'workspace.sharedLoading': '正在加载分享文档...',
    'workspace.sharedLoadFailed': '分享文档加载失败，请稍后重试。',
    'workspace.sharedWithMeEmpty': '目前还没有收到任何分享文档。',
    'workspace.mySharesEmpty': '你还没有分享过任何文档。',
    'workspace.sharedByWorkspace': ({ username, name }) =>
      `${username} · ${name}`,
    'workspace.mySharesListMeta': ({ count, name }) =>
      `${name} · 已分享 ${count} 人`,
    'workspace.sharedFromMeta': ({ username, name }) =>
      `来自 ${username} · ${name}`,
    'workspace.mySharesReadonlyMeta': ({ name }) => `你的个人文档 · ${name}`,
    'workspace.mySharesMeta': ({ count, updatedAt }) =>
      `最近更新 ${updatedAt} · 已分享 ${count} 人`,
    'workspace.currentPath': '当前路径',
    'workspace.expandAll': '展开全部',
    'workspace.collapseAll': '收起全部',
    'workspace.createDoc': '新增文档',
    'workspace.createFolder': '新增目录',
    'workspace.doc': '文档',
    'workspace.folder': '目录',
    'workspace.folderName': '目录名称',
    'workspace.documentTitle': '文档标题',
    'workspace.enterName': '请输入文档或目录名称。',
    'workspace.createLocationHint':
      '如果当前选中目录，将在该目录下创建；如果当前选中文档，将创建到它所在的同级目录。',
    'workspace.noDocuments': '还没有文档。先创建一个目录或文档。',
    'workspace.document': '文档',
    'workspace.move': '移动到...',
    'workspace.export': '导出',
    'workspace.exportMd': '导出为 Markdown',
    'workspace.exportPdf': '导出为 PDF',
    'workspace.exportWord': '导出为 Word',
    'workspace.exportPopupBlocked': '浏览器拦截了导出窗口，请允许弹窗后重试。',
    'workspace.exportPdfEngineMissing':
      'PDF 导出引擎加载失败。请检查网络，或改为本地引入 html2pdf 后重试。',
    'workspace.actions': '操作',
    'workspace.copy': '复制内容',
    'workspace.copyFailed': '复制失败，请稍后重试。',
    'workspace.readMode': '阅读模式',
    'workspace.editMode': '编辑模式',
    'workspace.saveStatusSaving': '保存中...',
    'workspace.saveStatusSaved': '已保存',
    'workspace.saveStatusError': '保存失败',
    'workspace.unknownUpdater': '未知用户',
    'workspace.docInfo': '文档信息',
    'workspace.docInfoSpace': '工作区',
    'workspace.docInfoFolder': '目录',
    'workspace.docInfoCreatedAt': '创建时间',
    'workspace.docInfoCreatedBy': '创建人',
    'workspace.docInfoUpdatedAt': '最近更新时间',
    'workspace.docInfoUpdatedBy': '最近更新人',
    'workspace.docInfoFileSize': '文件大小',
    'workspace.rootFolder': '根目录',
    'workspace.fullscreen': '全屏查看',
    'workspace.exitFullscreen': '退出全屏',
    'workspace.confirmDelete': '确认删除当前文档或目录吗？此操作不可撤销。',
    'workspace.moveTarget': '移动目标',
    'workspace.moveRoot': '顶层目录',
    'workspace.confirmMove': '确认移动',
    'workspace.moveHint':
      '只能移动到目录下，系统会自动阻止把目录移动到自己的子目录中。',
    'workspace.moveFailed': '移动文档失败。',
    'workspace.version': ({ version, updatedAt }) =>
      `版本 ${version} · ${updatedAt}`,
    'workspace.conflict': ({ version, updatedAt }) =>
      `检测到保存冲突。当前最新版本是 ${version}，更新时间是 ${updatedAt}。请先重新加载最新内容再保存。`,
    'workspace.folderHint':
      '这是文档树中的一个目录。选择子文档阅读或编辑内容，或者在该目录下新建条目。',
    'workspace.folderMoveHint':
      '目录也可以移动到其他目录下，移动后会一起带上它下面的所有子文档。',
    'workspace.uploadHint':
      '可直接拖拽图片进编辑器，或用工具栏插图。编辑区默认是实时预览风格：只有当前编辑行显示 Markdown 源码，其余内容按接近预览样式展示。',
    'workspace.voiceStart': '开始语音',
    'workspace.voiceStop': '停止语音',
    'workspace.voicePanel': '语音追加',
    'workspace.voiceAppend': '追加到文档',
    'workspace.voiceTip': '说完后点击追加，会按当天日期自动补到 Markdown。',
    'workspace.voiceUnsupported': '当前浏览器不支持语音识别。',
    'workspace.voicePermissionGranted': '麦克风：已允许',
    'workspace.voicePermissionPrompt': '麦克风：待授权',
    'workspace.voicePermissionDenied': '麦克风：已拒绝',
    'workspace.voicePermissionUnknown': '麦克风：状态未知',
    'workspace.voicePermissionRefresh': '重新检查',
    'workspace.voiceErrorDeniedManual':
      '麦克风已被浏览器拒绝。请点地址栏左侧图标，把麦克风改为“允许”，再刷新页面。',
    'workspace.voiceErrorNotAllowed':
      '无法访问麦克风。请确认地址栏已允许麦克风，并检查系统麦克风隐私权限后重试。',
    'workspace.voiceErrorNoMic': '未检测到可用麦克风设备。',
    'workspace.voiceErrorNoSpeech': '没有识别到语音，请再说一次。',
    'workspace.voiceErrorNetwork': '语音识别网络异常，请稍后重试。',
    'workspace.voiceErrorAborted': '语音识别已取消。',
    'workspace.voiceErrorServiceNotAllowed':
      '浏览器语音识别服务不可用。可尝试更新浏览器、切换 Edge，或检查是否禁用了在线语音服务。',
    'workspace.voiceErrorInsecureContext':
      '当前页面不是安全上下文，麦克风不可用。请使用 localhost 或 HTTPS 访问。',
    'workspace.voiceErrorGeneric': '语音识别失败，请重试。',
    'workspace.pickDocument': '从左侧树中选择一个文档开始阅读或编辑。',
    'workspace.share': '分享',
    'workspace.shareDoc': '分享文档',
    'workspace.shareDocSummary':
      '把这篇个人文档只读分享给指定用户。被分享人会在首页“分享给我”里直接看到它。',
    'workspace.shareUsername': '输入要分享给的用户名',
    'workspace.shareSubmit': '添加分享',
    'workspace.shareEmpty': '这篇文档暂时还没有分享给任何人。',
    'workspace.shareRevoke': '取消分享',
    'workspace.shareRevoked': ({ username }) => `已取消对 ${username} 的分享。`,
    'workspace.shareSaved': ({ username }) => `已分享给 ${username}。`,
    'workspace.shareListTitle': '已分享给',
    'workspace.shareOnlyPersonal': '只有个人工作区中的文档支持直接定向分享。',
    'workspace.sharedReadOnly':
      '这是别人分享给你的只读文档。若需要长期多人协作，建议迁移到团队工作区。',
    'shared.title': '分享给我的文档',
    'shared.summary':
      '这里集中展示别人从个人工作区定向分享给你的文档，手机和桌面端都可以直接阅读。',
    'shared.backHome': '返回主页',
    'shared.empty': '目前还没有收到任何文档分享。',
    'shared.open': '打开文档',
    'shared.fromOwner': ({ username }) => `分享人：${username}`,
    'shared.fromWorkspace': ({ name }) => `来源工作区：${name}`,
    'shared.detailBack': '返回分享列表',
    'shared.detailMeta': ({ username, name }) => `${username} · ${name}`,
    'shared.detailReadonly': '只读分享',
    'shared.detailHint':
      '这是一篇来自个人工作区的定向分享文档，你可以直接在手机或桌面端阅读。',
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
    'audit.pageSummary': ({ page, total }) =>
      `第 ${page} 页 · 共 ${total} 条记录`,
    'audit.previous': '上一页',
    'audit.next': '下一页',
    'adminUsers.kicker': '人员管理',
    'adminUsers.title': '账号管理',
    'adminUsers.summary': '系统管理员可在这里新增用户账号并分配管理员权限。',
    'adminUsers.backHome': '返回主页',
    'adminUsers.createTitle': '新增账号',
    'adminUsers.createHint': '账号创建后可直接登录，系统会自动创建个人工作区。',
    'adminUsers.grantAdmin': '授予系统管理员权限',
    'adminUsers.grantAdminShort': '设管理员',
    'adminUsers.revokeAdmin': '取消管理员',
    'adminUsers.enable': '启用',
    'adminUsers.disable': '停用',
    'adminUsers.disabled': '已停用',
    'adminUsers.resetPassword': '重置密码',
    'adminUsers.resetPrompt': ({ username }) =>
      `请输入 ${username} 的新密码（8-128 位）：`,
    'adminUsers.deleteConfirm': ({ username }) =>
      `确认删除账号 ${username} 吗？该操作不可撤销。`,
    'adminUsers.createSubmit': '创建账号',
    'adminUsers.createSuccess': ({ username }) => `账号 ${username} 创建成功。`,
    'adminUsers.createFailed': '创建账号失败，请稍后重试。',
    'adminUsers.enableSuccess': ({ username }) => `账号 ${username} 已启用。`,
    'adminUsers.disableSuccess': ({ username }) => `账号 ${username} 已停用。`,
    'adminUsers.grantAdminSuccess': ({ username }) =>
      `账号 ${username} 已设为系统管理员。`,
    'adminUsers.revokeAdminSuccess': ({ username }) =>
      `账号 ${username} 已取消系统管理员权限。`,
    'adminUsers.resetPasswordSuccess': ({ username }) =>
      `账号 ${username} 密码已重置。`,
    'adminUsers.deleteSuccess': ({ username }) => `账号 ${username} 已删除。`,
    'adminUsers.actionFailed': '账号操作失败，请稍后重试。',
    'adminUsers.listTitle': '账号列表',
    'adminUsers.currentUser': '当前账号',
    'adminUsers.normalUser': '普通用户',
    'adminUsers.empty': '暂无账号数据。'
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
    'login.title':
      'Login on desktop, phone, or narrow in-app browsers without the layout collapsing.',
    'login.summary':
      'The auth layer already uses HttpOnly cookies and same-origin write protection. This page stays touch-friendly and readable on small screens.',
    'login.featureSecurityLabel': 'Security',
    'login.featureSecurityValue':
      'HttpOnly cookie sessions and same-origin write protection are already enabled.',
    'login.featureDevicesLabel': 'Experience',
    'login.featureDevicesValue':
      'Desktop, mobile, and in-app browser layouts stay stable and readable.',
    'login.tabLogin': 'Login',
    'login.tabRegister': 'Register',
    'login.panelTitleLogin': 'Enter your workspace',
    'login.panelSummaryLogin':
      'Sign in to continue managing documents, members, and audit activity.',
    'login.adminCreateOnly':
      'Self registration is disabled. Ask an administrator to create your account.',
    'login.panelTitleRegister': 'Create a team account',
    'login.panelSummaryRegister':
      'Register a new account and continue into the app to create your first space.',
    'login.username': 'username',
    'login.password': 'password',
    'login.submitLogin': 'Login',
    'login.captchaInput': 'Captcha',
    'login.refreshCaptcha': 'Refresh captcha',
    'login.submitRegister': 'Create account',
    'login.back': 'Back To Spaces',
    'login.loggedInAs': ({ username }) =>
      `You are already logged in as ${username}.`,
    'index.title': 'Turn team knowledge into a clean, navigable document tree.',
    'index.summary':
      'Create a space, then folders and docs. Mobile editing, tables/formulas, voice append, and role-based collaboration are ready.',
    'index.openWorkspace': 'Open Workspace',
    'index.loginOrRegister': 'Login Or Register',
    'index.loginOnly': 'Login',
    'index.cloudflareTarget': 'Cloudflare Target',
    'index.session': 'Session',
    'index.guestMode': 'Guest mode',
    'index.systemAdmin': 'System admin',
    'index.profileSettings': 'Profile',
    'index.closeSettings': 'Close settings',
    'index.appearance': 'Appearance',
    'index.appearanceLight': 'Light',
    'index.appearanceDark': 'Dark',
    'index.appearanceHint':
      'Light is default. Switch to dark for a dimmer interface.',
    'index.userManagement': 'User Management',
    'index.installApp': 'Install App',
    'index.installIosTitle': 'Install To Home Screen',
    'index.installIosHint':
      'In Safari, tap Share and then choose Add to Home Screen.',
    'index.installAccepted': 'Installation request submitted.',
    'index.installDismissed': 'Installation was dismissed.',
    'index.installUnavailable':
      'One-click install is not available in this browser.',
    'index.logout': 'Logout',
    'index.loggedInHint':
      'You can create spaces here and then open the document workspace. On phones, this panel stays above the list instead of squeezing into a side rail.',
    'index.guestHint':
      'Public spaces will appear below. Login to create team spaces and manage members.',
    'index.newSpaceName': 'New space name',
    'index.privateOnly': 'Private',
    'index.teamOnly': 'Team',
    'index.publicRead': 'Public',
    'index.openPersonalWorkspace': 'Open Personal Workspace',
    'index.personalWorkspaceHint':
      'Each user gets a personal workspace automatically, visible only to that user by default.',
    'index.metricSpaces': 'Spaces',
    'index.metricPrivate': 'Private',
    'index.metricTeam': 'Team',
    'index.metricPublic': 'Public',
    'index.quickCreate': 'Quick create',
    'index.profilePanelHint':
      'Change your avatar, or fill current and new passwords to update credentials.',
    'index.currentPassword': 'Current password',
    'index.newPassword': 'New password',
    'index.passwordHint':
      'Leave passwords empty for avatar-only updates. Password updates require both fields.',
    'index.saveProfile': 'Save profile',
    'index.profileSaved': 'Profile updated.',
    'index.profileSaveFailed': 'Unable to save profile settings.',
    'index.spaceCardHint': 'Open workspace',
    'index.guestPanelTitle': 'Quick Start',
    'index.guestPanelSummary': ({ count }) =>
      `${count} public spaces are available to browse now. Login to create and collaborate.`,
    'index.guestPanelFeatureRead':
      'Guests can browse public spaces immediately.',
    'index.guestPanelFeatureManage':
      'After login, you can create team spaces and manage members.',
    'index.guestPanelFeaturePrivate':
      'Each account gets a personal workspace automatically.',
    'index.guestPanelOpenPublic': 'Browse Public Spaces',
    'index.spaceTypeGuideTitle': 'How To Choose Space Type',
    'index.spaceTypeGuideSummary':
      'Pick by visibility scope first. You can adjust later.',
    'index.spaceTypeGuidePrivate':
      'Visible to you and authorized members only. Best for drafts and personal notes.',
    'index.spaceTypeGuideTeam':
      'All signed-in users can view and collaborate by default. Best for project collaboration and internal docs.',
    'index.spaceTypeGuidePublic':
      'Readable by everyone. Best for announcements, manuals, and shared knowledge.',
    'index.spaceTypeGuideTip':
      'If unsure, start with Private and switch to Team/Public after content is ready.',
    'index.quickGuideTitle': 'Quick Start',
    'index.quickGuideSummaryUser':
      'Finish from setup to collaboration in about 3 minutes with these 4 steps.',
    'index.quickGuideStepCreateSpace':
      'Use the top-right create button to start with a private workspace.',
    'index.quickGuideStepCreateDoc':
      'Open the workspace and create folders or docs in the left tree.',
    'index.quickGuideStepEdit':
      'Edit directly with Markdown visuals, tables, formulas, and voice append.',
    'index.quickGuideStepShare':
      'Share a single document first; move long-lived collaborative content into a team workspace.',
    'index.sharedWithMe': 'Shared With Me',
    'index.sharedWithMeSummary':
      'Documents someone shared with you from their personal workspace appear here.',
    'index.viewAllShares': 'View All Shared Docs',
    'index.noSharedDocuments': 'Nothing has been shared with you yet.',
    'index.sharedBy': ({ username }) => `From ${username}`,
    'index.sharedWorkspace': ({ name }) => `Source: ${name}`,
    'index.openSharedDocument': 'Open Share',
    'index.spaceNameRule': 'Space names must be between 2 and 64 characters.',
    'index.invalidSpaceName': 'Enter a space name between 2 and 64 characters.',
    'index.createSpaceFailed': 'Unable to create the space right now.',
    'index.deleteSpace': 'Delete Workspace',
    'index.deleteSpaceModalTitle': ({ name }) => `Delete "${name}"?`,
    'index.deleteSpaceModalHint': 'This action cannot be undone.',
    'index.deleteSpaceModalCascade':
      'All folders, documents, and uploaded files in this workspace will be deleted together.',
    'index.deleteSpaceFailed': 'Unable to delete the workspace right now.',
    'index.more': 'More',
    'index.renameSpace': 'Rename',
    'index.renameSpaceModalTitle': ({ name }) => `Rename "${name}"`,
    'index.renameSpaceFailed': 'Unable to rename the workspace right now.',
    'index.createSpace': 'Create Space',
    'index.slug': ({ slug }) => `Slug: ${slug}`,
    'index.role': 'Role',
    'index.open': 'Open',
    'index.documentsCount': ({ count }) => `Docs ${count}`,
    'index.noSpaces': 'No spaces yet',
    'index.noSpacesHint':
      'Create the first space after logging in, or expose a public space later for guest read access.',
    'workspace.kicker': 'Workspace',
    'workspace.space': 'Space',
    'workspace.signedInAs': ({ username }) => `Signed in as ${username}`,
    'workspace.guestView': 'Guest view',
    'workspace.currentRole': ({ role }) => `Current role: ${role}`,
    'workspace.audit': 'Audit',
    'workspace.tree': 'Tree',
    'workspace.documents': 'Documents',
    'workspace.sharedWithMe': 'Shared With Me',
    'workspace.myShares': 'My Shares',
    'workspace.treeHint':
      'Multi-level folders are supported. Use the control before a folder to expand or collapse it.',
    'workspace.pickSharedDocument':
      'Choose a shared document from the left list to read it here.',
    'workspace.sharedReadonlyHint':
      'Shared documents are read in one unified layout across desktop and mobile.',
    'workspace.sharedLoading': 'Loading shared document...',
    'workspace.sharedLoadFailed':
      'Unable to load the shared document right now.',
    'workspace.sharedWithMeEmpty': 'Nothing has been shared with you yet.',
    'workspace.mySharesEmpty': 'You have not shared any documents yet.',
    'workspace.sharedByWorkspace': ({ username, name }) =>
      `${username} · ${name}`,
    'workspace.mySharesListMeta': ({ count, name }) =>
      `${name} · Shared with ${count}`,
    'workspace.sharedFromMeta': ({ username, name }) =>
      `From ${username} · ${name}`,
    'workspace.mySharesReadonlyMeta': ({ name }) =>
      `Your personal document · ${name}`,
    'workspace.mySharesMeta': ({ count, updatedAt }) =>
      `Updated ${updatedAt} · Shared with ${count}`,
    'workspace.currentPath': 'Current path',
    'workspace.expandAll': 'Expand all',
    'workspace.collapseAll': 'Collapse all',
    'workspace.createDoc': 'New document',
    'workspace.createFolder': 'New folder',
    'workspace.doc': 'Doc',
    'workspace.folder': 'Folder',
    'workspace.folderName': 'Folder name',
    'workspace.documentTitle': 'Document title',
    'workspace.enterName': 'Enter a document or folder name.',
    'workspace.createLocationHint':
      'If a folder is selected, the new item is created inside it. If a document is selected, the new item is created beside it.',
    'workspace.noDocuments':
      'No documents yet. Create a folder or document to start.',
    'workspace.document': 'Document',
    'workspace.move': 'Move to...',
    'workspace.export': 'Export',
    'workspace.exportMd': 'Export as Markdown',
    'workspace.exportPdf': 'Export as PDF',
    'workspace.exportWord': 'Export as Word',
    'workspace.exportPopupBlocked':
      'The browser blocked the export window. Allow popups and try again.',
    'workspace.exportPdfEngineMissing':
      'PDF export engine failed to load. Check network access or provide a local html2pdf script.',
    'workspace.actions': 'Actions',
    'workspace.copy': 'Copy content',
    'workspace.copyFailed': 'Copy failed. Please try again.',
    'workspace.readMode': 'Reading mode',
    'workspace.editMode': 'Editing mode',
    'workspace.saveStatusSaving': 'Saving...',
    'workspace.saveStatusSaved': 'Saved',
    'workspace.saveStatusError': 'Save failed',
    'workspace.unknownUpdater': 'Unknown user',
    'workspace.docInfo': 'Document info',
    'workspace.docInfoSpace': 'Workspace',
    'workspace.docInfoFolder': 'Folder',
    'workspace.docInfoCreatedAt': 'Created at',
    'workspace.docInfoCreatedBy': 'Created by',
    'workspace.docInfoUpdatedAt': 'Updated at',
    'workspace.docInfoUpdatedBy': 'Updated by',
    'workspace.docInfoFileSize': 'File size',
    'workspace.rootFolder': 'Root',
    'workspace.fullscreen': 'Open fullscreen',
    'workspace.exitFullscreen': 'Exit fullscreen',
    'workspace.confirmDelete':
      'Delete this document or folder? This action cannot be undone.',
    'workspace.moveTarget': 'Move target',
    'workspace.moveRoot': 'Top level',
    'workspace.confirmMove': 'Confirm move',
    'workspace.moveHint':
      'Items can only be moved into folders. The app blocks moves that would place a folder inside its own descendant.',
    'workspace.moveFailed': 'Unable to move document.',
    'workspace.version': ({ version, updatedAt }) =>
      `Version ${version} · ${updatedAt}`,
    'workspace.conflict': ({ version, updatedAt }) =>
      `Conflict detected. Current version is ${version}, updated at ${updatedAt}. Reload the latest document before saving again.`,
    'workspace.folderHint':
      'This folder is part of the document tree. Select a child document to read or edit content, or create a new item beneath this folder.',
    'workspace.folderMoveHint':
      'Folders can also be moved into other folders, and their child documents move with them.',
    'workspace.uploadHint':
      'Drag images into the editor or use the toolbar image action. The editor now uses a live-preview style: only the active editing line shows Markdown source while surrounding content stays close to rendered formatting.',
    'workspace.voiceStart': 'Start Voice',
    'workspace.voiceStop': 'Stop Voice',
    'workspace.voicePanel': 'Voice Append',
    'workspace.voiceAppend': 'Append To Document',
    'workspace.voiceTip':
      "After speaking, append text to Markdown and it will be grouped under today's date.",
    'workspace.voiceUnsupported':
      'Speech recognition is not supported in this browser.',
    'workspace.voicePermissionGranted': 'Mic: allowed',
    'workspace.voicePermissionPrompt': 'Mic: waiting for permission',
    'workspace.voicePermissionDenied': 'Mic: blocked',
    'workspace.voicePermissionUnknown': 'Mic: unknown',
    'workspace.voicePermissionRefresh': 'Recheck',
    'workspace.voiceErrorDeniedManual':
      'Microphone is blocked by browser settings. Set microphone to Allow for this site, then refresh.',
    'workspace.voiceErrorNotAllowed':
      'Microphone is not accessible. Allow microphone for this site and check OS privacy settings, then retry.',
    'workspace.voiceErrorNoMic': 'No available microphone device was found.',
    'workspace.voiceErrorNoSpeech':
      'No speech was detected. Please try speaking again.',
    'workspace.voiceErrorNetwork':
      'Speech recognition network error. Please try again later.',
    'workspace.voiceErrorAborted': 'Speech recognition was cancelled.',
    'workspace.voiceErrorServiceNotAllowed':
      'Browser speech service is unavailable. Try updating browser, switching to Edge, or enabling online speech services.',
    'workspace.voiceErrorInsecureContext':
      'Microphone is unavailable in an insecure context. Use localhost or HTTPS.',
    'workspace.voiceErrorGeneric': 'Speech recognition failed. Please retry.',
    'workspace.pickDocument':
      'Pick a document from the tree to start reading or editing.',
    'workspace.share': 'Share',
    'workspace.shareDoc': 'Share Document',
    'workspace.shareDocSummary':
      'Give a specific user read-only access to this personal document. They will see it in "Shared With Me" on the home page.',
    'workspace.shareUsername': 'Enter a username to share with',
    'workspace.shareSubmit': 'Add Share',
    'workspace.shareEmpty':
      'This document has not been shared with anyone yet.',
    'workspace.shareRevoke': 'Revoke Share',
    'workspace.shareRevoked': ({ username }) =>
      `Share revoked for ${username}.`,
    'workspace.shareSaved': ({ username }) => `Shared with ${username}.`,
    'workspace.shareListTitle': 'Shared With',
    'workspace.shareOnlyPersonal':
      'Direct document sharing is only available in personal workspaces.',
    'workspace.sharedReadOnly':
      'This is a read-only document shared with you. Move long-lived collaborative content into a team workspace.',
    'shared.title': 'Shared With Me',
    'shared.summary':
      'Documents people shared with you from their personal workspaces are collected here for quick reading on desktop and mobile.',
    'shared.backHome': 'Back Home',
    'shared.empty': 'Nothing has been shared with you yet.',
    'shared.open': 'Open Document',
    'shared.fromOwner': ({ username }) => `Shared by: ${username}`,
    'shared.fromWorkspace': ({ name }) => `Workspace: ${name}`,
    'shared.detailBack': 'Back To Shared Docs',
    'shared.detailMeta': ({ username, name }) => `${username} · ${name}`,
    'shared.detailReadonly': 'Read-only Share',
    'shared.detailHint':
      'This is a directly shared personal document. You can read it comfortably on mobile or desktop.',
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
    'audit.pageSummary': ({ page, total }) =>
      `Page ${page} · ${total} total records`,
    'audit.previous': 'Previous',
    'audit.next': 'Next',
    'adminUsers.kicker': 'User Admin',
    'adminUsers.title': 'Account Management',
    'adminUsers.summary':
      'System admins can create accounts and grant admin privileges here.',
    'adminUsers.backHome': 'Back Home',
    'adminUsers.createTitle': 'Create Account',
    'adminUsers.createHint':
      'New accounts can login immediately, and a personal workspace is created automatically.',
    'adminUsers.grantAdmin': 'Grant system admin permission',
    'adminUsers.grantAdminShort': 'Grant Admin',
    'adminUsers.revokeAdmin': 'Revoke Admin',
    'adminUsers.enable': 'Enable',
    'adminUsers.disable': 'Disable',
    'adminUsers.disabled': 'Disabled',
    'adminUsers.resetPassword': 'Reset Password',
    'adminUsers.resetPrompt': ({ username }) =>
      `Enter a new password for ${username} (8-128 chars):`,
    'adminUsers.deleteConfirm': ({ username }) =>
      `Delete account ${username}? This action cannot be undone.`,
    'adminUsers.createSubmit': 'Create Account',
    'adminUsers.createSuccess': ({ username }) =>
      `Account ${username} created.`,
    'adminUsers.createFailed': 'Unable to create account right now.',
    'adminUsers.enableSuccess': ({ username }) =>
      `Account ${username} enabled.`,
    'adminUsers.disableSuccess': ({ username }) =>
      `Account ${username} disabled.`,
    'adminUsers.grantAdminSuccess': ({ username }) =>
      `Account ${username} is now a system admin.`,
    'adminUsers.revokeAdminSuccess': ({ username }) =>
      `System admin permission removed for ${username}.`,
    'adminUsers.resetPasswordSuccess': ({ username }) =>
      `Password reset for ${username}.`,
    'adminUsers.deleteSuccess': ({ username }) =>
      `Account ${username} deleted.`,
    'adminUsers.actionFailed': 'Unable to update this account right now.',
    'adminUsers.listTitle': 'User List',
    'adminUsers.currentUser': 'Current account',
    'adminUsers.normalUser': 'User',
    'adminUsers.empty': 'No users found.'
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
      return message(params ?? {})
    }

    return message
  }

  function setLocale(nextLocale: AppLocale) {
    locale.value = nextLocale
  }

  function roleLabel(role: 'admin' | 'editor' | 'viewer' | null | undefined) {
    return t(`role.${role ?? 'guest'}`)
  }

  function visibilityLabel(
    visibility: 'private' | 'public' | 'team' | null | undefined
  ) {
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
