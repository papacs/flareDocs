# flareDocs

flareDocs 是一个面向小团队的轻量级、无服务器、Markdown 优先知识库。V0.1 目标是交付一个可部署的 Nuxt 应用，运行在 Cloudflare Pages 上，并使用 D1 存储结构化数据、R2 存储上传文件。

## 当前状态

仓库已经完成 V0.1 范围内的主要实现，目前不是空项目，可以直接进行本地开发和联调。

当前已完成：
- Nuxt + TypeScript + Tailwind CSS + Nuxt UI 基础脚手架
- Drizzle ORM、D1 schema、初始 migration
- 用户注册、登录、登出、`me` 接口与 JWT Cookie 会话
- Space 管理、成员管理、基于角色的权限控制
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
- ByteMD 编辑器与 Markdown 渲染页面
- Markdown 数学公式渲染
- R2 图片上传与同源访问路径
- 审计日志写入、查询与页面
- 本地初始化脚本与部署说明
- 登录页视觉改版，以及仅在登录页显示的中英文切换

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

系统在首次触发认证逻辑时会自动补一个默认管理员账号：
- 用户名：`admin`
- 密码：`admin`

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

## Cloudflare 部署准备

如果你要接入真实 Cloudflare 资源，基本顺序如下：

1. 创建 D1 数据库

```bash
pnpm wrangler d1 create flaredocs-db
```

2. 创建 R2 Bucket

```bash
pnpm wrangler r2 bucket create <your-bucket>
```

3. 用真实资源信息更新本地 `wrangler.toml`
- `database_id`
- `bucket_name`
- `preview_bucket_name`

也可以直接重新运行：

```bash
pnpm project:setup -- --d1-database-id=<your-d1-id> --r2-bucket=<your-r2-bucket> --r2-preview-bucket=<your-preview-bucket>
```

4. 应用远程 migration

```bash
pnpm db:migrate:remote
```

## 关键实现说明

### 认证与安全

- 认证使用 JWT + HttpOnly Cookie
- 写请求使用同源校验，避免基础 CSRF 风险
- 认证相关核心逻辑在 [app/server/utils/auth.ts](./app/server/utils/auth.ts)
- 同源保护中间件在 [app/server/middleware/csrf.ts](./app/server/middleware/csrf.ts)

### 数据库接入

- D1 运行时访问封装在 [app/server/utils/db.ts](./app/server/utils/db.ts)
- Drizzle schema 位于 [db/schema.ts](./db/schema.ts)
- 初始 migration 位于 [db/migrations/0000_initial.sql](./db/migrations/0000_initial.sql)

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

## 任务与进度

当前执行记录见 [TASKS.md](./TASKS.md)。

如果你要继续推进功能或补部署细节，建议先看：
- [prompt/init.md](./prompt/init.md)
- [TASKS.md](./TASKS.md)
- [scripts/dev-notes.md](./scripts/dev-notes.md)
