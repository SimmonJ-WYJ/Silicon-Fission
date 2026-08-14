# Silicon Fission 企业级 AI 平台 M1 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不影响现有 New API 生产系统的前提下，为 Silicon Fission 建立独立的企业级 M1 平台闭环：认证、个人组织、RBAC、审计、API Key、数据库驱动的渠道/模型/价格配置，以及使用自研 Key 的 Gateway。

**Architecture:** 采用 TypeScript 模块化单体。Hono Gateway 同时承载控制面 API 和 OpenAI 兼容数据面 API；PostgreSQL 是用户、租户、配置和审计的权威数据源，Redis 仅用于会话、缓存和限流。前端先在现有 `landing/` 内增加认证和控制台路由，管理后台在同一 React/Vite 应用中共享组件，后续再拆成独立构建产物。

**Tech Stack:** Node.js 20+、TypeScript、Hono、React、Vite、PostgreSQL 16+、Redis 7+、Vitest、Playwright、Docker Compose、Argon2id、Zod。

## Global Constraints

- 现有 New API 继续运营，新系统使用独立数据库，不读取、修改或双写 New API 数据库。
- `gateway/` 当前是 Node.js 20+、TypeScript、Hono 项目；保留 ESM、`strict: true` 和 NodeNext 模块解析。
- 浏览器会话使用 `HttpOnly`、`Secure`、`SameSite` Cookie；API Key 不使用浏览器 Cookie 认证推理请求。
- 密码使用 Argon2id 哈希；平台 API Key 只保存哈希，完整值只在创建或轮换响应中返回一次。
- 上游供应商密钥必须加密存储、掩码展示，不能出现在日志、错误响应或前端源码中。
- PostgreSQL 是资金、身份、租户和配置的权威源；Redis 不得成为唯一数据源。
- 所有租户资源查询必须带 `organization_id` 边界；前端隐藏菜单不构成权限控制。
- 所有敏感管理动作写入审计事件；审计内容不得包含密码、完整 API Key 或上游密钥。
- M1 只交付平台基础闭环；充值、真实支付、BYOK、组织邀请、复杂 Playground 和 SSO 留到后续计划。
- 任何对外请求在首字节发送前允许 fallback；流式响应已经发送后不得切换供应商。
- 每个任务结束都必须运行任务指定测试，再提交一个小而独立的 commit。

---

## 文件结构与边界

实施 M1 之前先采用最小增量结构，不一次性把仓库重构成完整 monorepo：

```text
gateway/
├── src/
│   ├── config.ts                 # 环境变量和运行配置
│   ├── index.ts                  # Hono 应用装配
│   ├── middleware/
│   │   ├── auth.ts               # 推理 API Key 认证
│   │   ├── session.ts            # 控制面会话认证
│   │   └── request-context.ts    # request_id 与租户上下文
│   ├── db/
│   │   ├── client.ts             # PostgreSQL/Redis 连接
│   │   ├── migrations/           # SQL 迁移
│   │   └── repositories/         # 按领域封装查询
│   ├── modules/
│   │   ├── auth/                 # 注册、登录、验证、会话
│   │   ├── organizations/        # 个人组织、成员、RBAC
│   │   ├── api-keys/             # 平台 Key 生命周期
│   │   ├── providers/            # 渠道、凭证和端点配置
│   │   ├── models/               # 规范模型、映射、价格版本
│   │   └── audit/                # 审计事件
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── me.ts
│   │   ├── api-keys.ts
│   │   └── admin.ts
│   ├── registry.ts               # M1 改为从配置仓库读取的适配层
│   └── router.ts                 # 保持路由算法，改用动态 registry
└── test/
    ├── unit/
    └── integration/

landing/src/
├── App.tsx                       # 增加认证/控制台路由
├── lib/api.ts                    # 控制面 API 客户端
├── lib/auth.ts                   # 当前会话操作
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── ApiKeysPage.tsx
│   └── UsagePage.tsx             # M2 占位，不实现计费图表
└── components/
    ├── AuthGuard.tsx
    └── ApiKeyReveal.tsx

deploy/
├── docker-compose.m1.yml         # 新系统本地依赖，不修改生产 New API compose
└── m1.env.example

docs/
├── superpowers/specs/2026-08-14-silicon-fission-enterprise-platform-design.md
└── superpowers/plans/2026-08-14-silicon-fission-enterprise-platform-m1.md
```

接口边界：

- `modules/*` 只暴露领域服务和 repository 接口，不直接由其他模块拼接 SQL。
- `routes/*` 负责 HTTP 输入、Schema 校验、状态码和调用领域服务。
- `registry.ts` 只把数据库里的 canonical model / endpoint 转换成当前 `ModelEntry`，路由核心不读取数据库。
- `middleware/*` 只解析身份和上下文，不实现业务授权；授权由领域服务执行。

---

### Task 1: 建立 M1 本地依赖与配置边界

**Files:**
- Create: `deploy/docker-compose.m1.yml`
- Create: `deploy/m1.env.example`
- Modify: `gateway/package.json`
- Modify: `gateway/src/config.ts`
- Create: `gateway/src/config.test.ts`

**Interfaces:**
- Produces `config.databaseUrl: string`, `config.redisUrl: string`, `config.cookieSecret: string`, `config.apiKeyPepper: string`, `config.sessionTtlSeconds: number`, and `config.isProduction: boolean`.
- Produces npm scripts `db:migrate`, `db:rollback`, `test`, and `test:integration`.

- [ ] **Step 1: 写配置解析失败测试**

```ts
import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("拒绝生产环境中的默认密钥", () => {
    expect(() => loadConfig({
      NODE_ENV: "production",
      SF_COOKIE_SECRET: "change-me",
      SF_API_KEY_PEPPER: "change-me",
      DATABASE_URL: "postgres://localhost/sf",
      REDIS_URL: "redis://localhost",
    })).toThrow("SF_COOKIE_SECRET");
  });

  it("解析端口和会话 TTL", () => {
    const result = loadConfig({
      NODE_ENV: "test",
      PORT: "9000",
      SESSION_TTL_SECONDS: "3600",
      SF_COOKIE_SECRET: "test-cookie-secret",
      SF_API_KEY_PEPPER: "test-api-key-pepper",
      DATABASE_URL: "postgres://localhost/sf",
      REDIS_URL: "redis://localhost",
    });
    expect(result.port).toBe(9000);
    expect(result.sessionTtlSeconds).toBe(3600);
  });
});
```

- [ ] **Step 2: 运行失败测试**

Run: `cd gateway && npm test -- src/config.test.ts`
Expected: FAIL because `loadConfig` and the Vitest script do not exist.

- [ ] **Step 3: 实现配置解析和测试脚本**

`loadConfig` 接受 `NodeJS.ProcessEnv`，对必填项做非空检查；生产环境拒绝 `change-me` 和短于 32 字节的 Cookie/API Key 密钥；开发和测试环境允许显式测试值。保留现有 `masterKey` 和供应商环境变量用于迁移期兼容，但新 M1 认证不再使用它作为用户 Key。

```ts
export interface AppConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  cookieSecret: string;
  apiKeyPepper: string;
  sessionTtlSeconds: number;
  isProduction: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig { /* validate */ }
```

在 `package.json` 添加 `test: "vitest run"`、`test:watch`、`test:integration`，依赖添加 `vitest`、`pg`、`ioredis`、`zod`、`argon2`，并锁定当前 Node 20 可安装版本。

- [ ] **Step 4: 增加 M1 Docker Compose**

Compose 只启动独立的 `sf-postgres` 和 `sf-redis` 服务，使用命名 volume `sf_pg_data`、`sf_redis_data`，PostgreSQL 暴露到本机随机或 55432 端口，不能复用 `deploy/production` 的服务名和 volume。`.env.example` 给出本地开发值并明确生产必须替换。

- [ ] **Step 5: 运行测试和类型检查**

Run: `cd gateway && npm test && npm run typecheck`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add deploy/docker-compose.m1.yml deploy/m1.env.example gateway/package.json gateway/package-lock.json gateway/src/config.ts gateway/src/config.test.ts
git commit -m "chore: add m1 infrastructure configuration"
```

---

### Task 2: 创建数据库迁移、核心租户模型与连接层

**Files:**
- Create: `gateway/src/db/client.ts`
- Create: `gateway/src/db/migrate.ts`
- Create: `gateway/src/db/migrations/0001_identity_and_config.sql`
- Create: `gateway/src/db/repositories/types.ts`
- Create: `gateway/src/db/repositories/organizations.ts`
- Create: `gateway/src/db/repositories/users.ts`
- Create: `gateway/src/db/repositories/audit.ts`
- Create: `gateway/src/db/migrations.test.ts`
- Modify: `gateway/package.json`

**Interfaces:**
- `createDatabase(config): Database` returns `{ pg, redis, close }`.
- `OrganizationRepository.createPersonalOrganization(userId, displayName): Promise<Organization>`.
- `UserRepository.createUser(input): Promise<User>` and `findByEmail(email): Promise<User | null>`.
- `AuditRepository.append(input): Promise<void>`.

- [ ] **Step 1: 编写迁移验收测试**

```ts
it("creates identity, tenant, role, provider and audit tables", async () => {
  await migrate(database.pg);
  const result = await database.pg.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = 'public'",
  );
  expect(new Set(result.rows.map((row) => row.table_name))).toEqual(
    expect.arrayContaining([
      "users", "user_identities", "sessions", "organizations",
      "organization_members", "roles", "api_keys", "providers",
      "provider_credentials", "channels", "models", "provider_models",
      "endpoints", "price_versions", "audit_events",
    ]),
  );
});
```

- [ ] **Step 2: 运行失败测试**

Run: `cd gateway && npm run test:integration -- src/db/migrations.test.ts`
Expected: FAIL because migrations and database helpers do not exist.

- [ ] **Step 3: 写第一版 SQL 迁移**

迁移必须：

- 启用 `pgcrypto` 或使用应用生成 UUID；所有公开 ID 使用 UUID/不可枚举 ID。
- 为用户邮箱创建不区分大小写的唯一约束。
- `organizations`、`projects`、`api_keys`、渠道和审计表保存 `organization_id` 或明确的全局归属。
- `organization_members` 对 `(organization_id, user_id)` 唯一。
- 角色为受控字符串：`platform_admin`、`platform_operator`、`billing_admin`、`organization_owner`、`organization_admin`、`organization_member`、`viewer`。
- API Key 只建 `key_hash`、`prefix`、`name`、状态、权限限制、过期时间和租户字段，不建明文列。
- `provider_credentials.secret_ciphertext`、`secret_key_version` 与 `last_rotated_at` 单独存储。
- `audit_events.metadata` 使用 JSONB，建 `(organization_id, created_at)` 和 `(actor_user_id, created_at)` 索引。
- 价格用 `price_versions`，带 `effective_from`、`effective_to`，不覆盖历史价格。

- [ ] **Step 4: 实现连接和迁移命令**

`db/client.ts` 创建连接池和 Redis 客户端；`db/migrate.ts` 按文件名顺序执行迁移，使用 `schema_migrations` 表记录版本，重复执行安全。不要在 import 时自动连接数据库，测试可以注入连接。

- [ ] **Step 5: 实现 repository 类型和基础查询**

统一定义 `User`、`Organization`、`OrganizationMember`、`AuditEvent` 类型。repository 的 SQL 必须使用参数绑定。组织查询必须显式接收 `organizationId`，平台管理员查询使用单独的方法而不是传入特殊字符串。

- [ ] **Step 6: 运行真实依赖测试**

Run: `docker compose -f deploy/docker-compose.m1.yml up -d postgres redis`

Run: `cd gateway && npm run db:migrate && npm run test:integration -- src/db/migrations.test.ts`

Expected: migration succeeds twice without duplicate-object errors and integration test passes。

- [ ] **Step 7: 提交**

```bash
git add gateway/src/db gateway/package.json gateway/package-lock.json
git commit -m "feat: add m1 identity and configuration schema"
```

---

### Task 3: 实现密码认证、会话和个人组织

**Files:**
- Create: `gateway/src/modules/auth/password.ts`
- Create: `gateway/src/modules/auth/service.ts`
- Create: `gateway/src/modules/auth/schemas.ts`
- Create: `gateway/src/modules/auth/service.test.ts`
- Create: `gateway/src/middleware/session.ts`
- Create: `gateway/src/routes/auth.ts`
- Create: `gateway/src/routes/me.ts`
- Modify: `gateway/src/index.ts`

**Interfaces:**
- `hashPassword(password): Promise<string>` and `verifyPassword(hash, password): Promise<boolean>`.
- `AuthService.register(input): Promise<{ user: User; organization: Organization }>`.
- `AuthService.login(input): Promise<{ user: User; sessionToken: string }>`.
- `AuthService.logout(sessionToken): Promise<void>`.
- `SessionMiddleware` sets `c.set("auth", { userId, organizationId, roles })`.

- [ ] **Step 1: 编写认证失败测试**

```ts
it("registers a normalized email and creates a personal organization", async () => {
  const result = await auth.register({ email: " User@Example.COM ", password: "correct horse battery staple" });
  expect(result.user.email).toBe("user@example.com");
  expect(result.organization.name).toContain("user@example.com");
});

it("rejects an incorrect password without revealing account existence", async () => {
  await expect(auth.login({ email: "user@example.com", password: "wrong" }))
    .rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
});
```

- [ ] **Step 2: 运行失败测试**

Run: `cd gateway && npm test -- src/modules/auth/service.test.ts`
Expected: FAIL because the auth service is not implemented.

- [ ] **Step 3: 实现密码和注册服务**

密码规则：至少 12 个字符；拒绝空白和常见弱密码；邮箱 trim 后转小写。注册在一个事务中创建 user、password identity、personal organization、owner membership 和默认 project。重复邮箱返回统一的业务错误，不返回“账户已存在”以外的敏感信息。

- [ ] **Step 4: 实现 Cookie 会话**

会话表保存 token hash、用户、创建时间、过期时间、撤销时间、user-agent 和 IP 摘要。Cookie 只保存随机 session token，不保存用户信息；服务端只按 token hash 查询。开发环境允许 `Secure=false`，生产强制 `Secure=true`。登录成功使用 `Set-Cookie`，退出清除 Cookie 并撤销服务端会话。

- [ ] **Step 5: 添加 Hono 路由**

实现：

```text
POST /api/auth/register   -> 201
POST /api/auth/login      -> 200 + Set-Cookie
POST /api/auth/logout     -> 204
GET  /api/me              -> 200
```

所有请求用 Zod 校验；错误格式为 `{ error: { code, message, request_id } }`。登录和注册失败统一为可安全展示的错误，不泄露密码校验细节。

- [ ] **Step 6: 添加路由集成测试**

测试注册、登录、`/api/me`、错误密码、退出后 `/api/me` 返回 401。使用测试数据库事务或每例清理数据，不连接生产数据库。

- [ ] **Step 7: 运行验证并提交**

Run: `cd gateway && npm test && npm run typecheck`

```bash
git add gateway/src/modules/auth gateway/src/middleware/session.ts gateway/src/routes/auth.ts gateway/src/routes/me.ts gateway/src/index.ts
git commit -m "feat: add password authentication and sessions"
```

---

### Task 4: 实现 RBAC、授权中间件和审计事件

**Files:**
- Create: `gateway/src/modules/organizations/rbac.ts`
- Create: `gateway/src/modules/organizations/rbac.test.ts`
- Create: `gateway/src/middleware/require-role.ts`
- Create: `gateway/src/modules/audit/service.ts`
- Create: `gateway/src/modules/audit/service.test.ts`
- Modify: `gateway/src/routes/me.ts`
- Modify: `gateway/src/index.ts`

**Interfaces:**
- `hasRole(auth, requiredRole): boolean`。
- `requireRole(...roles): MiddlewareHandler`。
- `AuditService.record(input): Promise<void>`。
- `AuthContext = { userId: string; organizationId: string; roles: Role[]; isPlatformAdmin: boolean }`。

- [ ] **Step 1: 编写角色矩阵测试**

```ts
it("allows organization owners to manage keys but not platform channels", () => {
  expect(hasPermission({ roles: ["organization_owner"] }, "keys:write")).toBe(true);
  expect(hasPermission({ roles: ["organization_owner"] }, "channels:write")).toBe(false);
});

it("allows platform operators to manage channels without billing mutation", () => {
  expect(hasPermission({ roles: ["platform_operator"] }, "channels:write")).toBe(true);
  expect(hasPermission({ roles: ["platform_operator"] }, "ledger:write")).toBe(false);
});
```

- [ ] **Step 2: 运行失败测试**

Run: `cd gateway && npm test -- src/modules/organizations/rbac.test.ts`
Expected: FAIL because permission mapping is absent.

- [ ] **Step 3: 实现显式权限映射**

使用权限字符串映射而不是在路由里硬编码角色判断。至少定义 `profile:read`、`keys:read`、`keys:write`、`channels:read`、`channels:write`、`models:write`、`audit:read`、`ledger:read`。平台角色只能通过 `isPlatformAdmin` 或平台成员关系获得全局访问。

- [ ] **Step 4: 实现审计服务**

`AuditService.record` 接收 actor、organization、action、resourceType、resourceId、requestId、IP 摘要和脱敏 metadata。对 Key 创建/撤销、登录成功/失败、渠道增删改测、模型和价格发布记录事件；禁止 metadata 包含字段名 `password`、`token`、`secret`、`api_key` 的原值。

- [ ] **Step 5: 加入管理审计读取接口**

添加 `GET /api/admin/audit-events`，只允许 `platform_admin`、`platform_operator` 和 `viewer` 中具有 `audit:read` 的身份。查询按时间分页，返回脱敏 metadata，不返回密钥 ciphertext。

- [ ] **Step 6: 运行测试并提交**

Run: `cd gateway && npm test && npm run typecheck`

```bash
git add gateway/src/modules/organizations gateway/src/modules/audit gateway/src/middleware/require-role.ts gateway/src/routes/me.ts gateway/src/index.ts
git commit -m "feat: add rbac and audit logging"
```

---

### Task 5: 实现平台 API Key 生命周期

**Files:**
- Create: `gateway/src/modules/api-keys/crypto.ts`
- Create: `gateway/src/modules/api-keys/service.ts`
- Create: `gateway/src/modules/api-keys/schemas.ts`
- Create: `gateway/src/modules/api-keys/service.test.ts`
- Create: `gateway/src/routes/api-keys.ts`
- Modify: `gateway/src/index.ts`

**Interfaces:**
- `createApiKeySecret(environment): { secret: string; prefix: string }`。
- `hashApiKey(secret, pepper): string`。
- `ApiKeyService.create(input): Promise<{ metadata: ApiKeyMetadata; secret: string }>`。
- `ApiKeyService.authenticate(secret): Promise<ApiKeyAuth | null>`。
- `ApiKeyService.revoke(organizationId, keyId): Promise<void>`。

- [ ] **Step 1: 写 Key 安全测试**

```ts
it("returns a secret once and stores only a hash", async () => {
  const result = await service.create({ organizationId, userId, name: "local", environment: "test" });
  expect(result.secret).toMatch(/^sf_test_/);
  const row = await findRawKey(result.metadata.id);
  expect(row.key_hash).toBeTruthy();
  expect(row.key_hash).not.toContain(result.secret);
});

it("revoked keys cannot authenticate", async () => {
  const result = await service.create(input);
  await service.revoke(organizationId, result.metadata.id);
  await expect(service.authenticate(result.secret)).resolves.toBeNull();
});
```

- [ ] **Step 2: 运行失败测试**

Run: `cd gateway && npm test -- src/modules/api-keys/service.test.ts`
Expected: FAIL because Key service is absent.

- [ ] **Step 3: 实现随机 Key 和哈希**

使用 Node `crypto.randomBytes` 生成不可预测 secret；格式 `sf_live_` / `sf_test_` + base64url。哈希使用 HMAC-SHA256(secret, `SF_API_KEY_PEPPER`) 或同等不可逆方案。prefix 只保存用于展示，不能用于认证。

- [ ] **Step 4: 实现生命周期服务**

创建、列表、撤销、删除和轮换。轮换必须在事务中先创建新 Key，再撤销旧 Key；旧 Key 不可恢复。所有操作检查 `organizationId` 和 `keys:write`，记录审计事件。Key 限额字段在 M1 建模并返回，但 M2 才接入请求预检。

- [ ] **Step 5: 添加控制面路由**

实现：

```text
GET    /api/keys
POST   /api/keys
PATCH  /api/keys/:id
POST   /api/keys/:id/rotate
DELETE /api/keys/:id
```

列表只返回 prefix、名称、状态、环境、创建时间、最后使用时间和限制；创建/轮换响应额外返回一次性 `secret`，后续任何 GET 不返回它。

- [ ] **Step 6: 替换推理认证中间件**

将当前 `gateway/src/middleware/auth.ts` 的单一 master key 比较替换为 `Authorization: Bearer <sf_...>` → `ApiKeyService.authenticate`。认证成功设置 `apiKeyId`、`organizationId`、`projectId` 和限制上下文。短时缓存可以使用 Redis，但撤销操作必须删除缓存，数据库查询仍是回源。

- [ ] **Step 7: 测试并提交**

Run: `cd gateway && npm test && npm run typecheck`

```bash
git add gateway/src/modules/api-keys gateway/src/routes/api-keys.ts gateway/src/middleware/auth.ts gateway/src/index.ts
git commit -m "feat: add managed api key lifecycle"
```

---

### Task 6: 实现渠道、模型、Endpoint 和价格配置服务

**Files:**
- Create: `gateway/src/modules/providers/crypto.ts`
- Create: `gateway/src/modules/providers/service.ts`
- Create: `gateway/src/modules/providers/service.test.ts`
- Create: `gateway/src/modules/models/service.ts`
- Create: `gateway/src/modules/models/service.test.ts`
- Create: `gateway/src/routes/admin.ts`
- Modify: `gateway/src/registry.ts`
- Modify: `gateway/src/router.ts`
- Modify: `gateway/src/index.ts`

**Interfaces:**
- `ProviderService.createChannel(input): Promise<Channel>`。
- `ProviderService.testChannel(channelId): Promise<ChannelTestResult>`。
- `ModelService.publishPrice(input): Promise<PriceVersion>`。
- `loadRegistrySnapshot(): Promise<ModelEntry[]>`。
- `refreshRegistry(): Promise<void>`。

- [ ] **Step 1: 写数据库驱动 registry 测试**

```ts
it("maps an enabled endpoint to the existing ModelEntry shape", async () => {
  await seedModelEndpoint({
    canonicalId: "deepseek/deepseek-chat",
    provider: "deepseek",
    upstreamModel: "deepseek-chat",
    inputPrice: 0.27,
    outputPrice: 1.1,
  });
  const snapshot = await loadRegistrySnapshot();
  expect(snapshot[0]).toMatchObject({
    id: "deepseek/deepseek-chat",
    endpoints: [{ provider: "deepseek", upstreamModel: "deepseek-chat" }],
  });
});
```

- [ ] **Step 2: 运行失败测试**

Run: `cd gateway && npm test -- src/modules/models/service.test.ts`
Expected: FAIL because registry still reads the static array.

- [ ] **Step 3: 实现加密凭证存储边界**

`providers/crypto.ts` 提供 `encryptCredential(plaintext, keyVersion)` 和 `decryptCredential(ciphertext, keyVersion)`，使用随机 nonce、认证加密和部署密钥；测试环境使用固定测试密钥，生产启动时缺少密钥必须失败。日志只记录 provider/channel ID 和测试结果分类。

- [ ] **Step 4: 实现渠道与模型服务**

渠道服务覆盖创建、列表、更新、启停、排空、连通性测试；模型服务覆盖 canonical model、provider model、endpoint 和价格版本。所有写操作通过 `requireRole` 的 `channels:write` 或 `models:write`，所有查询带平台权限或组织边界。价格发布必须关闭上一版本的 `effective_to`，禁止修改已经有计量事件引用的历史版本。

- [ ] **Step 5: 实现管理 API**

至少添加：

```text
GET   /api/admin/channels
POST  /api/admin/channels
PATCH /api/admin/channels/:id
POST  /api/admin/channels/:id/test
GET   /api/admin/models
POST  /api/admin/models
POST  /api/admin/models/:id/endpoints
POST  /api/admin/prices
```

请求 Schema 拒绝明文返回 secret；创建和更新返回 `secretConfigured: true`、`secretLastRotatedAt` 等安全元数据。

- [ ] **Step 6: 将 registry 切换为可刷新快照**

保留 `ModelEntry`、`ProviderEndpoint` 和 `findModel` 的调用契约。由 `refreshRegistry()` 从数据库加载 enabled channel、model、endpoint 和当前生效 price version 到内存快照；启动时刷新，管理写操作成功后显式刷新。数据库不可用时保留最后一次有效快照并记录错误，不回退到硬编码生产密钥。

- [ ] **Step 7: 更新路由认证和 provider adapter**

`router.ts` 不再直接读取 `config.providerKeys` 判断渠道是否可用，而从 registry endpoint 的 credential reference 获取已解密的短生命周期凭证。adapter 接口扩展为接受 `{ apiKey, baseUrl, upstreamModel, path }`，但不得把凭证写入 `Attempt`、日志或响应头。

- [ ] **Step 8: 测试并提交**

Run: `cd gateway && npm test && npm run typecheck`

```bash
git add gateway/src/modules/providers gateway/src/modules/models gateway/src/routes/admin.ts gateway/src/registry.ts gateway/src/router.ts gateway/src/index.ts
git commit -m "feat: add database-backed provider and model configuration"
```

---

### Task 7: 更新现有 Gateway 路由契约与数据面安全边界

**Files:**
- Modify: `gateway/src/index.ts`
- Modify: `gateway/src/routes/chat.ts`
- Modify: `gateway/src/routes/models.ts`
- Modify: `gateway/src/middleware/auth.ts`
- Create: `gateway/src/middleware/request-context.ts`
- Create: `gateway/src/routes/health.ts`
- Create: `gateway/src/routes/contracts.test.ts`

**Interfaces:**
- `c.get("requestId")` returns a UUID request ID。
- `c.get("inferenceAuth")` returns `{ apiKeyId, organizationId, projectId }`。
- `GET /health/live` is process-only; `GET /health/ready` checks database/registry readiness without exposing secrets。

- [ ] **Step 1: 写 API 契约测试**

```ts
it("rejects missing and revoked keys with the same 401 shape", async () => {
  const missing = await app.request("/v1/models");
  expect(missing.status).toBe(401);
  expect(await missing.json()).toMatchObject({ error: { type: "authentication_error" } });
});

it("adds a request id to successful and error responses", async () => {
  const response = await app.request("/health/live");
  expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
});
```

- [ ] **Step 2: 运行失败测试**

Run: `cd gateway && npm test -- src/routes/contracts.test.ts`
Expected: FAIL because request context and health routes are absent.

- [ ] **Step 3: 添加 request ID 和统一错误格式**

所有请求进入时生成或校验 `X-Request-ID`，响应始终带回该值。Hono 全局错误处理器将内部异常转换为不泄露堆栈的 `{ error: { code, message, request_id } }`，路由错误保留明确 HTTP 状态。

- [ ] **Step 4: 添加健康检查**

`/health/live` 不访问外部依赖；`/health/ready` 检查 PostgreSQL、Redis 和 registry 快照时间，依赖不可用返回 503。日志只记录依赖名称和状态。

- [ ] **Step 5: 运行原有 Gateway 测试和类型检查**

Run: `cd gateway && npm test && npm run typecheck`
Expected: M0 路由行为仍通过，模型列表使用数据库快照，未授权请求继续返回 401。

- [ ] **Step 6: 提交**

```bash
git add gateway/src/index.ts gateway/src/routes gateway/src/middleware
git commit -m "feat: harden gateway request and health contracts"
```

---

### Task 8: 添加 Landing 登录、注册和 API Key 控制台

**Files:**
- Create: `landing/src/lib/api.ts`
- Create: `landing/src/lib/auth.ts`
- Create: `landing/src/components/AuthGuard.tsx`
- Create: `landing/src/components/ApiKeyReveal.tsx`
- Create: `landing/src/pages/LoginPage.tsx`
- Create: `landing/src/pages/RegisterPage.tsx`
- Create: `landing/src/pages/DashboardPage.tsx`
- Create: `landing/src/pages/ApiKeysPage.tsx`
- Modify: `landing/src/App.tsx`
- Create: `landing/src/lib/auth.test.ts`
- Create: `landing/src/pages/ApiKeysPage.test.tsx`

**Interfaces:**
- `apiClient.request<T>(path, init): Promise<T>` handles JSON errors and credentials.
- `authClient.login(email, password): Promise<Me>`。
- `authClient.logout(): Promise<void>`。
- `ApiKeyReveal` accepts `{ secret: string; onDismiss(): void }` and never refetches the secret。

- [ ] **Step 1: 写前端认证测试**

```tsx
it("shows the one-time key secret and does not render it after dismiss", async () => {
  render(<ApiKeyReveal secret="sf_test_secret" onDismiss={vi.fn()} />);
  expect(screen.getByText("sf_test_secret")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /我已保存/i }));
  expect(screen.queryByText("sf_test_secret")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 运行失败测试**

Run: `cd landing && npm test -- src/pages/ApiKeysPage.test.tsx`
Expected: FAIL because API client, pages, and reveal component are absent.

- [ ] **Step 3: 实现 API 客户端和页面**

API client 使用 `credentials: "include"`、统一错误解析和 `VITE_API_BASE_URL`。登录、注册和控制台页面只处理展示状态，不在 localStorage 存 session token。Key 页面提供列表、创建、撤销和轮换；secret 只放内存状态并通过显式确认清除。

- [ ] **Step 4: 添加路由与 AuthGuard**

支持 `/` landing、`/login`、`/register`、`/dashboard`、`/api-keys`。AuthGuard 请求 `/api/me`，401 时跳转 `/login`；管理员入口先显示占位链接，真正管理界面放入 Task 9。

- [ ] **Step 5: 运行前端测试和构建**

Run: `cd landing && npm test && npm run build`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add landing/src

git commit -m "feat: add auth and api key console"
```

---

### Task 9: 添加管理后台基础页面与渠道配置流程

**Files:**
- Create: `landing/src/pages/admin/AdminGuard.tsx`
- Create: `landing/src/pages/admin/ChannelsPage.tsx`
- Create: `landing/src/pages/admin/ModelsPage.tsx`
- Create: `landing/src/pages/admin/AuditPage.tsx`
- Create: `landing/src/pages/admin/AdminLayout.tsx`
- Create: `landing/src/pages/admin/ChannelsPage.test.tsx`
- Modify: `landing/src/App.tsx`
- Modify: `landing/src/lib/api.ts`

**Interfaces:**
- `adminApi.listChannels(): Promise<Channel[]>`。
- `adminApi.createChannel(input): Promise<Channel>`。
- `adminApi.testChannel(id): Promise<ChannelTestResult>`。
- `AdminGuard` redirects non-admin roles to `/dashboard` and renders no secret fields。

- [ ] **Step 1: 写管理页面测试**

```tsx
it("renders a channel health status without rendering its credential", async () => {
  server.use(http.get("/api/admin/channels", () => HttpResponse.json({
    data: [{ id: "ch_1", name: "DeepSeek", status: "healthy", secretConfigured: true }],
  })));
  render(<ChannelsPage />);
  expect(await screen.findByText("healthy")).toBeInTheDocument();
  expect(screen.queryByText(/sk-|secret|api.?key/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 运行失败测试**

Run: `cd landing && npm test -- src/pages/admin/ChannelsPage.test.tsx`
Expected: FAIL because admin pages and API methods are absent.

- [ ] **Step 3: 实现 AdminGuard 和管理布局**

AdminGuard 使用 `/api/me` 返回的角色检查 `channels:read`，没有权限时返回 403 页面或跳转；导航包含渠道、模型、审计。页面不把服务端返回的 ciphertext 或 secret 字段绑定到 DOM。

- [ ] **Step 4: 实现渠道和模型页面**

渠道表单包含 provider adapter、name、base URL、region、credential、启停状态和数据政策标签；提交后只展示 `secretConfigured`。模型页面展示 canonical model、provider model、endpoint、输入/输出价格和生效时间。价格历史只读。

- [ ] **Step 5: 实现审计页面和测试动作**

审计页按分页展示 actor、action、resource、时间和脱敏 metadata。渠道测试按钮显示成功、HTTP 状态分类、延迟和安全错误摘要，不显示上游响应正文或密钥。

- [ ] **Step 6: 运行前端完整验证并提交**

Run: `cd landing && npm test && npm run build`

```bash
git add landing/src

git commit -m "feat: add provider administration console"
```

---

### Task 10: 集成部署、迁移说明和端到端验收

**Files:**
- Create: `deploy/m1/README.md`
- Create: `deploy/m1/smoke-test.sh`
- Modify: `docs/FEATURES.md`
- Modify: `docs/deployment.md`
- Modify: `README.md`
- Create: `gateway/test/e2e/m1-flow.test.ts`

**Interfaces:**
- `smoke-test.sh` accepts `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `API_KEY` and exits non-zero on failed health/auth/inference checks。
- E2E flow covers registration → login → `/api/me` → create Key → `/v1/models` → revoke Key → 401。

- [ ] **Step 1: 编写端到端流程测试**

```ts
it("completes the M1 account to inference flow", async () => {
  const user = await registerUniqueUser();
  const session = await login(user);
  const key = await createApiKey(session, { name: "e2e", environment: "test" });
  expect((await listModels(key.secret)).status).toBe(200);
  await revokeApiKey(session, key.id);
  expect((await listModels(key.secret)).status).toBe(401);
});
```

- [ ] **Step 2: 运行失败测试**

Run: `cd gateway && npm run test:integration -- test/e2e/m1-flow.test.ts`
Expected: FAIL until all M1 services and routes are wired together.

- [ ] **Step 3: 编写独立部署说明**

`deploy/m1/README.md` 明确：新系统使用独立 Compose 项目、独立 volume、独立数据库和独立域名；不得对现有 `deploy/production` 执行 `down -v`；列出环境变量生成、迁移、管理员初始化、反向代理和回滚步骤。

- [ ] **Step 4: 添加 smoke test**

脚本检查 `/health/live`、`/health/ready`、注册/登录、创建 Key、模型列表和撤销 Key。所有 secret 通过环境变量传递，脚本输出必须掩码。

- [ ] **Step 5: 更新项目文档**

README 和 FEATURES 标明：新 M1 是独立系统，New API 仍是现有生产系统；新增域名和部署方式必须使用实际部署值，未部署的地址不能写成已上线地址。补充从 New API 迁移时不共享数据库、密钥重新录入、余额人工复核的原则。

- [ ] **Step 6: 运行全量验证**

Run:

```bash
docker compose -f deploy/docker-compose.m1.yml up -d
cd gateway && npm run db:migrate && npm test && npm run typecheck
cd ../landing && npm test && npm run build
cd .. && bash deploy/m1/smoke-test.sh
```

Expected: Gateway、前端构建、M1 E2E 和 smoke test 全部通过；现有 `deploy/production` 文件无变更。

- [ ] **Step 7: 提交并检查工作区**

```bash
git add deploy/m1 docs/FEATURES.md docs/deployment.md README.md gateway/test/e2e/m1-flow.test.ts
git commit -m "docs: add m1 deployment and acceptance flow"
git status --short
```

Expected: 工作区干净，生产 New API compose 未被修改。

---

## 计划自审

### Spec coverage

- 认证、会话、密码和个人组织：Tasks 2–3。
- RBAC、租户边界和审计：Tasks 2、4。
- API Key 生命周期和 Gateway 认证：Task 5。
- 渠道、模型、Endpoint、价格版本和动态 registry：Task 6。
- 控制面/数据面、健康检查和错误契约：Task 7。
- 用户控制台和管理后台：Tasks 8–9。
- 新老系统并行部署、迁移边界和验收：Task 10。
- 充值、计费、BYOK、组织邀请、Playground 和 SSO：按规格明确留到 M2/M3，不假装在 M1 完成。

### Placeholder scan

除本自审段落用于说明检查结果外，计划正文没有使用 TBD、TODO、“实现以后再决定”或无具体测试的占位步骤。每个任务都指定了文件、接口、失败测试、实现动作、验证命令和提交边界。

### Type consistency

- `AuthContext` 由 Task 3 的 session middleware 产生，Task 4 的 RBAC 消费。
- `ApiKeyService.authenticate` 由 Task 5 的 inference auth middleware 消费。
- `ModelEntry` 保持现有 `router.ts` 契约，Task 6 通过 `loadRegistrySnapshot` 提供数据库快照。
- `requestId` 和 `inferenceAuth` 由 Task 7 统一注入，Task 10 的 E2E 只依赖公开 HTTP 接口。
