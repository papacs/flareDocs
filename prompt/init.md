# Codex 开发提示词：flareDocs（Serverless 轻量团队 Markdown 知识库）V0.1

你是一个资深全栈工程师，要在一个全新仓库中实现 flareDocs V0.1（轻量、极简部署、Markdown 优先的小团队知识库工具）。
目标是：**可部署到 Cloudflare Pages（Nuxt 3 + Nitro）**，使用 **Cloudflare D1（SQLite）** 做数据存储，使用 **Cloudflare R2** 存图片附件。
项目必须开源友好：默认 SQLite/D1 + R2，极简运维，一键初始化。

## 重要开发纪律（必须遵守）
1. **小步提交**：每次只改动一个清晰主题（如“新增 users 表 + 注册/登录 API”），不要一次性大改动。
2. 每个步骤都要保证 `pnpm lint` / `pnpm typecheck` / `pnpm test`（若有）通过。
3. 每个 PR/提交必须包含：
   - 变更点说明
   - 如涉及 DB：迁移文件、回滚说明（若需要）、最小示例数据
4. 不引入过度设计：V0.1 禁止 WebSocket/CRDT、禁止 Durable Objects、禁止全文搜索引擎（Meili/ES 等）。
5. 安全：必须做基本的 CSRF 防护（SameSite=Strict + Origin/Referer 检查），写接口只接受 JSON（上传接口除外）。

---

## 产品范围（V0.1 必须实现）
### 核心定位
- 3-10 人小团队使用的 Markdown 知识库
- 极简部署、低成本、页面美观、操作顺手
- 不做多人实时协同；使用**乐观锁 version**避免覆盖

### V0.1 必备功能
1. **Space（空间）隔离**
   - 空间是权限边界：space 下有目录/文档树
   - 空间可见性：`team` 或 `public`
   - 成员在空间内角色：`admin/editor/viewer`
2. **文档与目录树**
   - adjacency list：documents.parentId
   - documents 支持 folder 与 doc
   - 文档内容为 Markdown 存 D1
3. **认证与权限**
   - 用户登录，JWT 写入 HttpOnly Cookie
   - SameSite=Strict、Secure、HttpOnly
   - 所有写接口必须校验 Origin/Referer 同源
   - RBAC：全局角色（可选）+ Space 成员角色（必须）
4. **乐观锁**
   - documents.version（integer）
   - 保存时 `WHERE id=? AND version=?`，失败返回 409
5. **图片/附件上传**
   - 上传到 R2，文件名使用 UUID/随机 hash
   - 公开可访问 URL（默认简单版）
   - 上传接口限制：大小、类型白名单
6. **审计日志**
   - 对关键操作记录 audit_logs
   - 使用 `context.waitUntil()` 异步写日志，不阻塞响应
   - 支持日志列表查询（管理端/管理员可看）

### V0.1 明确不做
- 实时协同编辑（WebSocket/CRDT）
- 目录级 ACL 继承/覆盖（只做 Space 隔离）
- 私有图片签名 URL
- 全文搜索（可做简单标题/路径过滤）

---

## 技术栈与工程要求
- 前端/全栈：Nuxt 3（TypeScript）
- UI：TailwindCSS + Nuxt UI（或等价轻量组件库）
- 编辑器：ByteMD（优先）或 Vditor（可选）
- DB：Cloudflare D1（SQLite）
- ORM：Drizzle ORM（sqlite-core）
- 存储：Cloudflare R2
- 部署：Cloudflare Pages（带 Functions/Nitro）
- 包管理：pnpm
- 代码风格：ESLint + Prettier（必须）
- 环境变量：`.env.example` 提供所有必需项

---

## 仓库结构（必须按此创建）
.
├── app/                         # Nuxt app
│   ├── pages/
│   ├── components/
│   ├── middleware/
│   ├── composables/
│   ├── server/
│   │   ├── api/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── services/
│   └── assets/
├── db/
│   ├── schema.ts                # drizzle schema
│   ├── migrations/              # drizzle migrations (sql)
│   └── seed.ts                  # optional seed helper
├── scripts/
│   ├── setup.ts                 # wrangler init automation
│   └── dev-notes.md
├── wrangler.toml
├── package.json
├── pnpm-lock.yaml
├── README.md
└── .env.example

---

## 数据模型（必须实现）
### users
- id (pk, autoinc)
- username (unique, not null)
- password_hash (not null)
- created_at (unixepoch)

### spaces
- id (pk)
- name (not null)
- slug (unique, not null)
- visibility ('team'|'public') default 'team'
- created_by (fk users.id, on delete set null, nullable)
- created_at

### space_members
- space_id (fk spaces.id, cascade)
- user_id (fk users.id, cascade)
- role_in_space ('admin'|'editor'|'viewer') not null
- created_at
- pk(space_id, user_id)

### documents
- id (pk)
- space_id (fk spaces.id, cascade)
- title (not null)
- content (text, default '')
- parent_id (fk documents.id, cascade, nullable)
- is_folder (boolean, default false)
- version (integer, default 1)  # 乐观锁
- created_by (fk users.id, set null, nullable)   # 注意：nullable
- updated_by (fk users.id, set null, nullable)   # nullable
- created_at
- updated_at
- indexes: (space_id, parent_id), (space_id, updated_at)

### audit_logs
- id (pk)
- space_id (nullable; 某些全局操作可空)
- user_id (fk users.id, set null, nullable)
- action (text not null) e.g. LOGIN, CREATE_SPACE, CREATE_DOC, UPDATE_DOC, DELETE_DOC, UPLOAD_ASSET
- target_type (text) e.g. 'space','document','asset'
- target_id (integer nullable)
- meta (json text nullable)
- ip (text nullable)
- user_agent (text nullable)
- created_at

---

## 安全与鉴权（必须实现）
### JWT Cookie
- 登录成功后签发 JWT（payload: userId, username）
- 写入 Cookie：
  - HttpOnly, Secure, SameSite=Strict, Path=/
- Token 过期：可先做 7 天有效期

### CSRF 防护（极简版）
- 所有非 GET/HEAD 的接口：
  1) 校验 `Origin` 必须等于站点 origin（从 request headers 取）
  2) 如 Origin 缺失，校验 Referer 同源
  3) 否则拒绝 403
- 所有写接口仅接受 `Content-Type: application/json`
  - 唯一例外：上传接口 `multipart/form-data`，但仍需 Origin/Referer 校验

### 权限判定（Space 模型）
- 读取空间：
  - visibility=public：允许未登录读取（只读）
  - visibility=team：必须登录且为成员
- 写操作：
  - space role admin/editor 可写
  - viewer 只读
- 所有 documents 操作必须先校验 space 权限

---

## API 设计（必须按此实现）
统一返回 JSON：`{ ok: boolean, data?: any, error?: { code, message, details? } }`

### Auth
- POST /api/auth/register  （可选，若不做注册则提供 seed admin）
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me

### Spaces
- GET  /api/spaces                 # 我加入的空间 + public 空间（可选）
- POST /api/spaces                 # 创建空间（登录）
- GET  /api/spaces/:spaceId        # 空间信息 + 我的角色
- POST /api/spaces/:spaceId/members   # admin 添加成员（用 username）
- PATCH /api/spaces/:spaceId/members/:userId  # admin 修改 role
- DELETE /api/spaces/:spaceId/members/:userId # admin 移除成员

### Documents
- GET  /api/spaces/:spaceId/tree
  - 返回该 space 下所有 documents 的扁平数组（小团队千级可全量）
- POST /api/spaces/:spaceId/docs
  - body: { title, parentId, isFolder }
- GET  /api/spaces/:spaceId/docs/:docId
  - 返回 { id,title,content,parentId,isFolder,version,updatedAt }
- PUT  /api/spaces/:spaceId/docs/:docId
  - body: { title?, content?, parentId? , version }  # 必须带 version
  - 乐观锁：冲突返回 409 + { current: {version, updatedAt} }
- DELETE /api/spaces/:spaceId/docs/:docId
  - 删除 folder 自动 cascade

### Upload
- POST /api/spaces/:spaceId/upload
  - multipart/form-data file
  - 校验类型与大小
  - 存 R2：key = `${spaceId}/${uuid}.${ext}`
  - 返回 { url, key, size, contentType }

### Audit
- GET /api/spaces/:spaceId/audit-logs
  - only admin
  - 支持 query: action, userId, dateFrom, dateTo, page, pageSize

---

## 前端页面（必须实现最小可用 UI）
- /login：登录页
- /：空间列表（我的空间 + public 可见）
- /s/:spaceSlug 或 /spaces/:spaceId：
  - 左侧 Tree（目录树）
  - 右侧文档内容展示
  - 编辑按钮（editor/admin）
  - 新建文档/目录（editor/admin）
- 文档编辑页（可在同页切换编辑模式）：
  - ByteMD 编辑器
  - 保存时带 version
  - 409 时弹出冲突提示（复制我的内容 + 重新加载最新）
- 空间成员管理页（admin）：
  - 添加成员、改角色、移除
- 审计日志页（admin）：
  - 列表 + 简单筛选

UI 要求：简洁、现代、不卡顿、移动端可用（基础响应式即可）。

---

## 审计日志写入（必须覆盖的动作）
至少记录：
- LOGIN / LOGOUT
- CREATE_SPACE
- ADD_MEMBER / UPDATE_MEMBER_ROLE / REMOVE_MEMBER
- CREATE_DOC / UPDATE_DOC / DELETE_DOC
- UPLOAD_ASSET
实现要求：
- 在 API handler 的最后调用 `ctx.waitUntil(writeAuditLog(...))`
- meta 只存必要信息（不要存全文 content）

---

## 初始化与部署（必须提供）
### 本地开发
- 提供 `.env.example`
- 提供 README：本地如何启动（可用 wrangler dev 或 nuxt dev + bindings mock）
- 若无法完全本地模拟 D1/R2，也要在 README 说清楚最简路径

### 一键初始化脚本（必须实现 scripts/setup.ts）
命令：`pnpm run setup`
执行：
1) wrangler d1 create ...
2) wrangler d1 execute ... 运行 migrations
3) wrangler r2 bucket create ...
4) 可选：插入默认管理员账号 admin/admin（或提示用户首次注册）

### Cloudflare Pages 部署
- README 给出部署步骤
- 提供 wrangler.toml 示例与 binding 名称约定

---

## 任务拆分（你必须按顺序小步实现并提交）
1) 初始化 Nuxt3 + TS + Tailwind + ESLint/Prettier + Nuxt UI
2) 接入 Drizzle + D1：实现 schema + migrations + 最小查询 demo
3) 实现 users + auth/login/logout/me（JWT Cookie + SameSite/Origin 校验）
4) 实现 spaces + space_members（权限判定函数封装）
5) 实现 documents CRUD + tree + optimistic lock + 409 冲突
6) 接入 ByteMD 编辑器 + 文档阅读/编辑 UI
7) 接入 R2 上传 + 编辑器自动插入图片 URL
8) 审计日志模块：写入 + 管理页查询
9) scripts/setup.ts + README 完整化

每一步完成后都要：
- 更新/补充 README
- 添加最小 e2e 手动测试 checklist（写在 docs 或 README）
- 确保构建/类型检查通过

---

## 代码质量要求
- 把权限检查写成可复用工具：`assertSpaceRole(spaceId, user, requiredRole)`
- 把 CSRF/Origin 校验写成 server middleware
- 所有 API handler 统一错误码：401/403/404/409/422/500
- 对上传文件做白名单（png/jpg/jpeg/webp/gif/pdf）+ 大小限制
- 文档内容渲染要防 XSS（Markdown 渲染禁止原生 HTML 或做严格 sanitize）

---

## 交付标准（完成后我会验收）
- 全流程可用：创建 space → 添加成员 → 新建目录/文档 → 编辑保存 → 冲突 409 → 上传图片 → 审计日志可查
- 可以按照 README 在 Cloudflare Pages 一次部署成功
- 代码结构清晰、模块分层合理、没有明显安全洞

开始执行。先完成第 1 步并提交。