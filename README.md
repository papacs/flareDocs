# flareDocs

<p align="left">
  <img src="./public/logo.png" alt="flareDocs logo" width="360" />
  <img src="./public/brand-icon.svg" alt="flareDocs icon" width="64" style="margin-left: 12px; vertical-align: middle;" />
</p>

flareDocs 是一个面向小团队的轻量级、无服务器、Markdown 优先知识库。V0.1 目标是交付一个可部署的 Nuxt 应用，运行在 Cloudflare Pages 上，并使用 D1 存储结构化数据、R2 存储上传文件。

## 当前状态

仓库已经完成 V0.1 范围内的主要实现，目前不是空项目，可以直接进行本地开发和联调。

当前已完成：

- Nuxt + TypeScript + Tailwind CSS + Nuxt UI 基础脚手架
- Drizzle ORM、D1 schema、初始 migration
- 管理员创建账号、登录、登出、`me` 接口与 JWT Cookie 会话
- Space 管理、成员管理、基于角色的权限控制
- 主页个人设置（修改密码、切换预置头像）和管理员“人员管理”入口
- 管理员用户管理页（新增账号、可选授予系统管理员权限）
- 管理员账号列表支持启用/停用、删除、重置密码、设置/取消系统管理员
- 首页访客态增加完整登录引导卡片，避免未登录时右侧空白区域
- 文档树、文档 CRUD、乐观锁版本控制
- 工作区多级目录树、当前路径高亮、折叠记忆和“移动到...”操作
- 工作区图标化目录面板、图标工具栏、全屏与多格式导出
- 工作区紧凑目录树、标题就地重命名、删除确认和时间格式优化
- 工作区悬浮工具条、图标化树操作和更轻的目录选中态
- 工作区正文内部滚动、阅读进度条和更清晰的左右面板配色分层
- 工作区外层滚动锁定、编辑器式双层正文布局，以及桌面端可点击跳转的阅读进度
- 阅读进度改为自上而下的直觉映射，编辑态移除底部重复操作并让编辑器内容区铺满
- 工作区顶部改成紧凑空间切换条，返回和审计改为图标按钮，当前用户改为小圆头像标识
- 工作区顶部横条与主体重新对齐，返回入口改为主页图标，并进一步覆盖 ByteMD 默认固定高度以压掉编辑态留白
- 工作区移除顶部横条并把空间下拉与主页入口并入左侧栏，释放正文可视空间
- 工作区左栏顶部进一步精简为仅保留“空间下拉 + 主页图标”，并重绘左栏卡片样式
- 工作区“当前路径”不再重复显示当前文档名，并新增手机端右上角“目录”按钮与抽屉式目录面板
- 手机端进入全屏后切换为极简顶栏：隐藏路径/标题等信息，仅保留一排操作按钮并扩大正文可视区域
- 工作区改为沉浸式阅读主视图（移动端与 PC 一致）：正文默认全宽、目录改为左侧抽屉、右上角统一动作菜单，并新增编辑态自动保存（输入防抖 + 每分钟兜底 + 切后台触发）
- 工作区切换空间后不再自动打开首个文档，改为先展示空态并由用户选择目标文档；同时 PC 端目录栏改为常驻左侧，移动端继续使用抽屉式目录
- 工作区双栏常驻目录断点下调到 `768px`，避免普通 PC 窗口宽度下误走移动端抽屉布局
- 工作区右上角操作菜单改为“文字 + 右侧功能图标”行样式，减少视觉空白并提升点击识别度
- 文档操作下拉菜单进一步改为纯图标按钮；文档标题下方改为仅显示“最新更新时间 + 最近更新人”；左侧目录树纵向间距同步收紧
- 移动端“人员管理”页顶部布局收紧，并将主页图标固定到右上角；工作区文档操作菜单改为竖向图标列，正文上方目录胶囊移除，新增“文档信息”弹框展示目录/创建与更新元数据
- 文档信息弹框新增“文件大小”（按 UTF-8 字节实时换算为 B/KB/MB）
- 人员管理页移动端布局进一步重排：外层与卡片间距收紧、主页图标对齐右上角、用户行改为上下结构、操作按钮改为双列，减少拥挤与换行混乱
- 人员管理页账号列表中，当前登录用户不再显示“删除”按钮；首页移动端仅保留上方统计（含私有/团队/公开/总数），底部工作区列表在小屏隐藏
- 首页移动端进一步隐藏首屏会话面板，去掉底部残留边框块；文档阅读右侧进度条改为始终可交互（含触屏点击/按下跳转定位）
- 主页入口悬浮文案改为“主页”，并继续收敛 ByteMD 编辑态的双滚动条与工具栏图标裁切
- 空间可见性已扩展为 `私有 / 团队 / 公开`，并会为每个用户自动补一个默认“个人工作区”
- 继续拉宽标题编辑输入框，隐藏 ByteMD 右侧模式图标以避免分栏残留，并让全屏阅读内容显式居中
- 进一步在组件层强制关闭 ByteMD 分栏状态，并在样式层兜底隐藏残留预览面板，消除编辑态空白半屏与额外滚动条
- 工作区文档加载失败时改为显式报错，并允许重复点击当前节点重新拉取，避免出现无提示空白态
- 撤回对 ByteMD 内部 class 的直接劫持，改为进入编辑时重建编辑器实例，降低“点击编辑后卡死/空白”的风险
- 恢复 ByteMD 右上角工具图标显示，并强制当前可见编辑/预览面板铺满宽度，继续压缩编辑态半屏空白与双滚动条问题
- 保留 ByteMD 右上角常用图标，但禁用分栏切换按钮，并在 split 状态下强制隐藏右侧预览面板，避免有内容时出现半屏空白和第二根滚动条
- 去掉 ByteMD 编辑区默认 `800px` 内容列限制，并收紧全屏头部间距，减少“有内容时只占左侧一列”和全屏顶部空间不足的问题
- 隐藏 CodeMirror 的重复辅助滚动条与默认 scrollbar hack，只保留一层实际可滚动内容，减少编辑态双滚动条和拖拽错位问题
- 恢复单根细滚动条作为编辑态主滚动通道，避免完全隐藏后无法拖拽定位
- 撤回对 `CodeMirror-sizer` 的错误固定高度约束，并关闭横向滚动，只保留稳定的纵向主滚动，减少拖拽时滚动条跳动
- 按要求撤回所有针对 CodeMirror 内部滚动与内部内容层的覆盖，只保留 ByteMD 外层壳样式，让编辑器滚动完全回到默认实现
- 编辑器新增“实时预览风格”写作体验：非当前编辑行按接近渲染的排版展示，仅当前光标行显示 Markdown 源码标记，兼容浅色/深色皮肤和现有工作区滚动进度逻辑
- 继续收敛实时预览一致性：公式/表格块在非活动状态直接按渲染结果展示，非活动源码行颜色统一贴近阅读态，并关闭软换行即换行渲染（`breaks: false`）以减少“小段落碎裂感”
- 进一步修复列表一致性：无序/有序列表在非活动状态改为整块渲染（恢复项目符号与编号），并修正编辑态非活动行颜色规则选择器，减少与预览颜色偏差
- 工作区性能优化：文档详情增加内存缓存与目录树悬停预取，减少重复打开等待；目录树展开态判断改为 `Set` 命中；文档打开过程新增顶部进度条反馈，降低大文档加载时的感知空白
- ByteMD 编辑器与 Markdown 渲染页面
- Markdown 数学公式渲染
- R2 图片上传与同源访问路径
- 审计日志写入、查询与页面
- 本地初始化脚本与部署说明
- 登录页视觉改版，以及仅在登录页显示的中英文切换
- 登录页返回入口已改为顶部左侧图标按钮（返回主页），移除底部文字返回按钮，并补齐浅色/深色样式
- 登录页返回入口进一步调整到登录卡片右上角图标位，并新增登录验证码（后端校验 + 前端刷新）
- 登录验证码已增强为图形算术验证码：随机加减乘除，叠加干扰线和噪点，可点击刷新
- 收敛深色皮肤细节：登录页卡片文字与输入框对比度、光斑强度、访客面板登录按钮和提示胶囊的深色可读性
- 继续优化深色登录输入区配色：输入框边框对比度更柔和、焦点高亮更清晰、验证码容器与输入框视觉更统一
- 首页在手机端补充首屏“退出登录”按钮，避免必须滚动到会话卡片才能退出
- 首页首屏操作区重新分组，移除 Cloudflare 按钮并收敛手机端按钮排版层级
- 首页会话操作统一为图标按钮（设置/人员管理/退出），并将手机端快捷操作移动到首屏右上角
- 个人设置图标更新为齿轮样式，且手机端点击后改为左侧抽屉面板，避免“点击无反馈”
- 登录页在移动端改为仅展示登录卡片，并重排顶栏和卡片间距，避免首屏看不到登录框
- 首页“打开工作区”改为优先进入最近访问的空间；个人设置新增浅色/深色外观切换
- 增强了深色主题基础皮肤，并放大工作区移动端高频按钮点击面积，提升触控可用性
- 修复深色主题对比度问题：收敛文本覆盖范围，补充首页与工作区的定向深色配色，避免文字发白难读
- 继续修复深色细节：首页会话卡与角色徽章、工作区标题/下拉、Markdown 表格在深色下的对比度与一致性
- 深色模式下“人员管理”页面已同步跟随主题；文档阅读区滚动条改为常显且更易抓取，0% 进度文案默认隐藏
- 修复移动端个人设置抽屉在深色模式下的可读性，统一文案与外观按钮对比度并增强选中态
- 继续收敛工作区深色视觉：优化空白态卡片与工作区下拉框/选中项配色，降低突兀的系统默认蓝感
- 外观切换改为点击即时生效（无需保存），并重绘浅色/深色按钮的默认态和选中态；工作区下拉框边角改为更圆润
- 工作区空间切换由原生下拉改为自定义圆角菜单（含点击空白关闭），彻底消除系统下拉硬角问题
- 基于 `logo.png` 衍生了轻量 `brand-icon.svg`，并在首页、登录页、工作区入口接入统一品牌标识；同时替换站点 favicon，浅色/深色主题均可读

当前需要注意：

- 原始需求写的是 Nuxt 3，但当前脚手架实际使用的是 Nuxt 4.3.1
- 这个工作区混用过 Linux 和 Windows 依赖，首次在你的机器上启动前建议重新执行一次 `pnpm install`
- 真实 Cloudflare 的 D1 / R2 资源仍需你自己创建并替换占位值

## 功能范围

V0.1 范围内：

- 小团队使用，规模大致 3 到 10 人
- Space 内的树状 Markdown 文档
- Space 级权限：`admin`、`editor`、`viewer`
- 基于 HttpOnly Cookie 的 JWT 认证
- 基于 `Origin` / `Referer` 的同源写请求保护
- 基于 `version` 的乐观锁编辑冲突控制
- 基于 R2 的附件上传
- 关键操作审计日志

V0.1 明确不做：

- 实时协作
- CRDT / WebSocket 同步
- Durable Objects
- 全文检索基础设施
- 目录级 ACL 继承或覆盖

## 技术栈

- 应用框架：Nuxt 4 + Nitro + TypeScript
- UI：Tailwind CSS + Nuxt UI
- 编辑器：ByteMD
- 数据库：Cloudflare D1（SQLite）
- ORM：Drizzle ORM
- 文件存储：Cloudflare R2
- 部署：Cloudflare Pages
- 包管理器：pnpm
- 工具链：ESLint、Prettier、TypeScript、Wrangler

## 项目结构

```text
.
├── app/
│   ├── assets/
│   ├── components/
│   ├── composables/
│   ├── pages/
│   └── server/
├── db/
│   ├── migrations/
│   └── schema.ts
├── scripts/
│   ├── dev-notes.md
│   └── setup.ts
├── prompt/
├── README.md
├── TASKS.md
├── package.json
├── nuxt.config.ts
└── wrangler.toml.example
```

## 第一次本地启动

### 1. 准备运行环境

建议使用以下版本：

- Node.js：`22.x`
- pnpm：`10.18.2`

如果你的机器还没激活对应的 pnpm，可以先执行：

```bash
corepack enable
corepack prepare pnpm@10.18.2 --activate
```

### 2. 安装依赖

```bash
pnpm install
```

如果这台机器之前切换过 Windows / Linux 环境，这一步不要跳过。

### 3. 生成本地配置

推荐直接运行项目初始化脚本：

```bash
pnpm project:setup
```

这一步会做两件事：

- 生成本地 `.env`
- 生成本地 `wrangler.toml`

脚本位置见 [scripts/setup.ts](./scripts/setup.ts)。

如果你想手动处理，也可以：

```bash
cp .env.example .env
cp wrangler.toml.example wrangler.toml
```

然后确认 `.env` 中至少有：

```env
NUXT_AUTH_SECRET=replace-with-a-long-random-secret
# 仅首次初始化管理员时需要
NUXT_BOOTSTRAP_ADMIN_PASSWORD=replace-with-a-strong-password
```

### 4. 初始化本地数据库

执行本地 D1 migration：

```bash
pnpm db:migrate:local
```

migration 文件位于 [db/migrations/0000_initial.sql](./db/migrations/0000_initial.sql)。
如果你是之前已经跑起来的本地库，这次还需要把新增 migration 一并执行到最新。

### 5. 启动开发服务器

```bash
pnpm dev
```

启动后按终端输出访问本地地址，通常是：

```text
http://localhost:3000
```

### 6. 首次登录

如配置了 `NUXT_BOOTSTRAP_ADMIN_PASSWORD`，系统会在首次触发认证逻辑时自动补一个初始管理员账号：

- 用户名：`admin`
- 密码：`NUXT_BOOTSTRAP_ADMIN_PASSWORD` 的值

当前已关闭自由注册：普通用户需由系统管理员在“主页 -> 人员管理”中新增账号。

相关逻辑见 [app/server/utils/bootstrap.ts](./app/server/utils/bootstrap.ts)。

## 最短启动命令

```bash
corepack enable
corepack prepare pnpm@10.18.2 --activate
pnpm install
pnpm project:setup
pnpm db:migrate:local
pnpm dev
```

## 本地开发说明

### 常用命令

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm deploy:pages:first -- --project-name=<your-pages-project-name> --d1-database-id=<your-d1-id> --r2-bucket=<your-r2-bucket> --r2-preview-bucket=<your-r2-preview-bucket>
```

### 数据库相关命令

```bash
pnpm db:generate
pnpm db:migrate:local
pnpm db:migrate:remote
```

说明：

- `db:generate` 使用 [drizzle.config.ts](./drizzle.config.ts)
- `db:migrate:local` 使用本地 `wrangler.toml`，并依赖 D1 绑定名 `DB`
- `db:migrate:remote` 会通过 `--remote` 把 migration 应用到真实 Cloudflare D1
- 跟仓库提交相关的模板文件是 [wrangler.toml.example](./wrangler.toml.example)
- 实际使用的 `wrangler.toml` 已被 `.gitignore` 忽略，只保留在本地

## 常见问题

### 1. `pnpm` 无法运行或报权限错误

优先检查本机 `corepack` 和 `pnpm` 是否正确安装。建议重新执行：

```bash
corepack enable
corepack prepare pnpm@10.18.2 --activate
```

### 2. 提示 `Missing runtime config authSecret`

说明 `.env` 里没有 `NUXT_AUTH_SECRET`，重新执行：

```bash
pnpm project:setup
```

或者手动补上该环境变量。

### 3. 提示 `D1 binding \`DB\` is not configured`

说明本地 `wrangler.toml` 没准备好，或者 migration 还没执行。按下面顺序检查：

- 是否已生成本地 `wrangler.toml`
- 是否已执行 `pnpm db:migrate:local`
- `wrangler.toml` 中是否存在 `DB` 这个 D1 binding

### 4. 上传接口提示 `R2 binding \`R2_ASSETS\` is not configured`

说明你当前运行环境没有接好 R2。页面基础功能可以先开发，但上传能力需要在 `wrangler.toml` 中配置 `R2_ASSETS`。

### 5. 登录页没有“注册”入口

这是预期行为。当前版本已关闭自由注册，账号统一由系统管理员在主页的“人员管理”页面创建。

## Cloudflare 部署准备

### A. 首次部署（推荐）

1. 登录 Cloudflare

```bash
pnpm wrangler login
```

2. 第一次创建云端资源（D1 + R2）

```bash
pnpm wrangler d1 create flaredocs-db
pnpm wrangler r2 bucket create flaredocs-assets-prod
pnpm wrangler r2 bucket create flaredocs-assets-preview
```

3. 执行一键首次部署脚本

```bash
pnpm deploy:pages:first -- --project-name=<your-pages-project-name> --d1-database-id=<your-d1-id> --r2-bucket=<your-r2-bucket> --r2-preview-bucket=<your-r2-preview-bucket>
```

说明（脚本内自动完成）：

- 生成/更新 `.env` 和 `wrangler.toml`
- 创建 Pages 项目（如不存在）
- 设置 Pages Secrets：`NUXT_AUTH_SECRET`、`NUXT_BOOTSTRAP_ADMIN_PASSWORD`
- 应用远程 migration：`pnpm db:migrate:remote`
- 打包并发布：`pnpm build` + `wrangler pages deploy dist`

4. 首次管理员登录

- 账号：`admin`
- 密码：部署脚本末尾输出的初始密码（或你手动设置的 `NUXT_BOOTSTRAP_ADMIN_PASSWORD`）
- 登录后请尽快修改密码

### B. 后续发布（非首次）

代码更新后，手动发布最短流程：

```bash
pnpm build
pnpm wrangler pages deploy dist --project-name=<your-pages-project-name> --branch main --commit-dirty=true
```

注：

- `dist` 是发布目录，不存在就会报 `ENOENT: .../dist`
- 在 Windows PowerShell 下建议用单行命令，不要用 `\` 续行

### C. 接 Git 自动部署（推送即部署）

在 Cloudflare Dashboard 配置：

1. `Workers & Pages -> 项目 -> Settings -> Builds & deployments`
2. `Connect to Git`，选择仓库和生产分支（例如 `main`）
3. Build command：`pnpm build`
4. Build output：`dist`
5. 在 `Settings -> Variables and Secrets` 配置 secrets
6. 在 `Settings -> Bindings` 配置：

- D1 绑定名：`DB`
- R2 绑定名：`R2_ASSETS`

完成后，推送到生产分支会自动触发部署。

### D. 参数说明（deploy:pages:first）

- `--project-name=<name>`：必填，Pages 项目名
- `--d1-database-id=<id>`：首次部署建议填写
- `--r2-bucket=<bucket>`：生产桶
- `--r2-preview-bucket=<bucket>`：预览桶
- `--auth-secret=<secret>`：可选，不传则自动生成
- `--bootstrap-admin-password=<password>`：可选，不传则自动生成
- `--production-branch=<branch>`：默认 `main`
- `--skip-setup`：跳过 `project:setup`
- `--skip-project-create`：跳过 Pages 项目创建
- `--skip-migrate`：跳过远程 migration
- `--skip-build`：跳过构建
- `--dry-run`：仅打印步骤

### E. 部署与登录调试（实战排错清单）

1. 先看函数实时日志（推荐）

```bash
pnpm wrangler pages deployment tail --project-name <your-pages-project-name>
```

保持命令运行状态，然后在浏览器重试登录或验证码操作，终端会出现真实堆栈。

2. 健康检查接口

```text
https://<your-pages-project-name>.pages.dev/api/health/db
```

返回 `{"ok":true,...}` 代表 D1 绑定和连接正常。

3. 高频错误与处理

- `522 Connection timed out`
  - 含义：Host 侧不可用（常见于发布异常）
  - 处理：重新 `build + deploy`，必要时换新项目名重建

- `ENOENT .../dist`
  - 含义：没先构建就部署
  - 处理：先执行 `pnpm build`

- `/api/auth/captcha` 或 `/api/auth/login` 500
  - 优先检查 Secrets 是否存在：
    - `NUXT_AUTH_SECRET`
    - `NUXT_BOOTSTRAP_ADMIN_PASSWORD`（仅首次初始化管理员必需）
  - 检查 Bindings：
    - D1: `DB`
    - R2: `R2_ASSETS`

- `Failed to create Pages project`
  - 常见原因：项目已存在或账号无权限
  - 处理：

```bash
pnpm wrangler pages project list
pnpm deploy:pages:first -- --project-name=<your-pages-project-name> --skip-setup --skip-project-create
```

- `Pbkdf2 failed: iteration counts above 100000 are not supported`
  - 含义：运行时不支持更高迭代次数
  - 当前项目已修复为兼容值，重新部署最新代码即可

4. PowerShell 日志查看

```powershell
Get-Content "C:\Users\<your-user>\AppData\Roaming\xdg.config\.wrangler\logs\<log-file>.log"
```

## 关键实现说明

### 认证与安全

- 认证使用 JWT + HttpOnly Cookie
- 写请求使用同源校验，避免基础 CSRF 风险
- 新增统一安全响应头中间件（CSP、`X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`）
- 登录新增 IP 级失败限流（10 分钟窗口内失败 12 次后返回 `429` + `Retry-After`）
- 验证码挑战改为“答案哈希 + 一次性 challenge”机制，避免客户端直接解码 token 获取答案或重复消费同一 challenge
- 上传读取路由新增 key 白名单校验，仅允许系统生成的 `{spaceId}/{uuid}.{ext}` 资源路径
- 移除硬编码默认口令；仅在显式配置 `NUXT_BOOTSTRAP_ADMIN_PASSWORD` 时才允许首次引导创建 `admin` 账号
- 认证相关核心逻辑在 [app/server/utils/auth.ts](./app/server/utils/auth.ts)
- 同源保护中间件在 [app/server/middleware/csrf.ts](./app/server/middleware/csrf.ts)

### 人员与权限管理

- 用户注册入口已关闭，`POST /api/auth/register` 固定返回 `REGISTRATION_DISABLED`
- 新增管理员用户管理 API：`GET/POST /api/admin/users`
- 新增管理员账号维护 API：`PATCH/DELETE /api/admin/users/:userId`
- 新增个人设置 API：`PATCH /api/auth/profile`（头像切换 + 修改密码）
- 空间成员管理增加保护：个人工作区禁止分享成员，且禁止移除或降级“最后一个 space admin”
- 账号状态支持 `启用/停用`，停用账号不能登录；系统会保护“至少保留一个可用系统管理员”

### 数据库接入

- D1 运行时访问封装在 [app/server/utils/db.ts](./app/server/utils/db.ts)
- Drizzle schema 位于 [db/schema.ts](./db/schema.ts)
- 初始 migration 位于 [db/migrations/0000_initial.sql](./db/migrations/0000_initial.sql)
- 用户头像与系统管理员字段迁移位于 [db/migrations/0002_users_admin_avatar.sql](./db/migrations/0002_users_admin_avatar.sql)

### 上传能力

- 上传接口位于 [app/server/api/spaces/[spaceId]/upload.post.ts](./app/server/api/spaces/[spaceId]/upload.post.ts)
- 上传规则封装在 [app/server/utils/storage.ts](./app/server/utils/storage.ts)
- 仅允许图片类型，默认限制 5 MB

### 审计日志

- 审计写入封装在 [app/server/utils/audit.ts](./app/server/utils/audit.ts)
- 查询接口位于 [app/server/api/spaces/[spaceId]/audit-logs.get.ts](./app/server/api/spaces/[spaceId]/audit-logs.get.ts)
- 只有 Space `admin` 可查看审计日志

### 首页创建空间

- 首页创建空间表单会先在前端校验名称长度，要求 `2-64` 个字符
- 名称不合法时，创建按钮会保持禁用，避免直接打到 `POST /api/spaces` 产生 `422`
- 如果接口仍然返回失败，页面会优先展示服务端返回的具体错误信息
- 首页创建表单已调整为单行输入布局，空间名称与可见性选择并排展示
- 首页卡片与空间列表样式已重新收紧，创建入口、统计摘要和空间卡片层次更清晰
- 首页空间可见性下拉复用统一圆角样式，和工作区空间切换菜单的圆角保持一致，减少“方角”观感
- 全站原生下拉框已统一为 `fd-workspace-select` 样式（首页创建空间、工作区移动目标、审计筛选动作），并补齐深色主题一致性
- 全站下拉已进一步统一为自定义菜单组件 `AppSelectMenu`（首页空间类型、移动目标、审计动作），与工作区空间切换同风格，彻底移除系统直角下拉观感
- 首页会话卡已去掉“会话”标签与用户名下方头像名称文案，信息层级更简洁
- 首页空间卡片支持管理员删除私有/团队工作区（二次确认），并新增 `DELETE /api/spaces/:spaceId` 名称确认校验
- 首页空间卡片进一步简化：去掉角色、slug 和“进入工作区”文案，改为图标化“打开/删除”；删除改为居中弹窗确认
- 删除工作区时会同步清理该空间前缀下的 R2 上传文件（`{spaceId}/...`），并明确提示会删除目录、文档和上传文件
- 删除权限规则已更新：公开工作区仅创建者可删除；私有/团队工作区允许创建者或空间管理员删除
- 桌面端空间卡片操作已改为“更多”菜单，支持在同一入口执行“修改名称 / 删除工作区”
- 新增空间重命名接口：`PATCH /api/spaces/:spaceId`（公开空间仅创建者可改名；私有/团队空间允许创建者或空间管理员改名）
- 用户自动创建的个人空间名称已统一为 `用户名 的个人`，并会在读取时自动把历史 `用户名 的个人工作区` 名称收敛到新格式
- 个人设置在桌面端已改为弹窗式编辑（移动端继续使用侧边抽屉），避免展开表单撑高首页布局

### 工作区文档加载体验

- 工作区文档面板加载进度条已增强收尾机制：当后台预取先返回并已渲染当前文档时，会主动结束前台进度条；同时增加超时兜底，避免极端竞态下进度条残留不消失
- 工作区文档/目录删除确认已改为站内弹窗，不再使用浏览器原生确认框
- 目录态（选中 folder）文档区补充深色主题专属配色，减少深色模式下的浅色突兀感
- 编辑模式新增客户端语音追加：可直接开始/停止语音识别，预览识别结果并一键追加到 Markdown；追加时会自动按当天日期创建或复用 `## YYYY-MM-DD` 小节，并追加为列表项
- 语音入口已整合进工作区“更多/操作”菜单；点击后在编辑器上方显示可关闭的悬浮面板，并支持手动编辑识别文本后再追加
- 若启用语音追加，服务端 `Permissions-Policy` 需允许同源麦克风访问（`microphone=(self)`），否则即使浏览器站点权限显示“允许”也会被策略头拦截
- 语音追加会将“当天日期节（`## YYYY-MM-DD`）”置于文档顶部并在该节下追加内容；录音中麦克风图标会闪烁提示，面板中冗余清空按钮已移除

## 任务与进度

当前执行记录见 [TASKS.md](./TASKS.md)。

如果你要继续推进功能或补部署细节，建议先看：

- [prompt/init.md](./prompt/init.md)
- [TASKS.md](./TASKS.md)
- [scripts/dev-notes.md](./scripts/dev-notes.md)
- 修复移动端访客态登录入口：在首页首屏顶部增加仅移动端显示的登录按钮（桌面端不恢复此前移除的两个入口）。
- 修复登录页移动端重复展示：桌面说明区改为 CSS 强制仅桌面显示；并移除“当前系统已关闭自由注册...”提示文案。
- 登录页顶部说明区已彻底移除，仅保留登录卡片，避免移动端出现重复内容。
- 登录页恢复桌面端左右双栏（左侧说明区仅 `lg` 及以上显示），移动端继续保持单卡片。
- 继续优化深色登录页配色：修复左侧大标题发黑、特性卡片对比度不足和右下角光斑突兀问题。
- 访客态会话头像改为默认预设头像（不再显示问号），并与用户头像使用同一套配色逻辑。
