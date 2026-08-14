# Silicon Fission 企业级 AI 基础设施平台设计规格

- 状态：待评审
- 日期：2026-08-14
- 目标仓库：`https://github.com/SimmonJ-WYJ/Silicon-Fission`
- 产品定位：面向开发者、团队和企业的统一 AI 模型 API 网关与管理平台
- 参考产品：OpenRouter
- 实施策略：新系统独立开发，现有 New API 生产系统继续运营，满足迁移条件后再逐步切换

## 1. 背景与目标

Silicon Fission 当前采用双轨结构：

- `deploy/` 运行 New API 官方镜像，承载现有注册、登录、令牌、额度、渠道和管理界面。
- `gateway/` 是自研 TypeScript/Hono 网关骨架，已经具备 OpenAI 兼容入口、模型注册、供应商路由、自动 fallback 和 SSE 流式透传。
- `landing/` 是自研 React/Vite 品牌官网。

新系统需要逐步替代 New API 的产品界面和平台能力，同时保留现有业务持续运行。最终形成拥有自主品牌、自主用户体系、自主渠道配置、自主计费和企业管理能力的 AI 基础设施平台。

### 1.1 产品目标

1. 提供独立的注册、登录、账号安全和用户生命周期管理。
2. 提供用户可自助管理的 API Key、余额、账单和用量控制台。
3. 提供管理员配置模型供应商、渠道密钥、模型映射、价格和路由策略的入口。
4. 提供 OpenAI 兼容且可扩展到 Anthropic、Google 等协议的统一推理 API。
5. 从第一版开始采用多租户、RBAC、审计和可观测性友好的企业级数据模型。
6. 后续支持组织、团队、预算、BYOK、Playground、SSO 和私有化部署。

### 1.2 非目标

首期不追求一次性复制 OpenRouter 的全部规模，也不在 MVP 中实现以下能力：

- 数百个模型和数十个供应商的全量接入。
- 复杂的 AI 自动选模系统。
- 完整企业 SSO、SAML、SCIM 和 LDAP。
- 多地域主动-主动容灾。
- 对 New API 数据库做双写或强耦合集成。
- 在自研代码中复制或修改 New API 的 AGPL 源码。

## 2. 优先级与阶段

### P1：平台闭环

- 用户注册、登录、退出、邮箱验证和密码重置。
- API Key 创建、显示一次、禁用、轮换和删除。
- 管理后台的上游渠道、模型映射、价格和状态配置。
- Gateway 使用自研账号和 API Key 完成认证。
- 基础 RBAC、租户隔离和管理员审计日志。

### P2：商业化与团队能力

- Credits 余额、充值、冻结、扣费、退款和人工调账。
- 请求级计量与用量分析控制台。
- 组织、团队成员、角色、预算和成本归因。
- 支付接入、账单和对账。

### P3：高级平台能力

- BYOK：用户或组织配置自己的供应商密钥。
- Playground：网页端测试和多模型对比。
- 更完整的企业安全能力、Provisioning API 和私有化部署。
- 自动路由、模型 fallback、数据驻留和 ZDR 策略增强。

## 3. 总体架构

采用方案 A：TypeScript 单体后端配合独立 React 前端，按模块化单体设计，保留未来拆分服务的边界。

```text
浏览器 / SDK / CLI
        |
        v
Caddy / TLS / 静态资源
        |
        +------------------------------+
        |                              |
        v                              v
Landing + Console + Admin        Gateway API
React + Vite                     Hono + TypeScript
                                       |
        +------------------------------+-----------------------------+
        |              |               |              |              |
        v              v               v              v              v
      Auth          Accounts         Billing        Routing      Observability
        |              |               |              |              |
        +------------------------------+-----------------------------+
                                       |
                         PostgreSQL + Redis + Object Storage
                                       |
                                       v
                       OpenAI / Anthropic / Google / 国内供应商
```

### 3.1 代码仓库规划

第一阶段继续使用单仓库：

```text
Silicon-Fission/
├── apps/
│   ├── web/                 # Landing、登录注册和用户控制台
│   └── admin/               # 管理后台，可共享设计系统
├── gateway/
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── organizations/
│       │   ├── api-keys/
│       │   ├── providers/
│       │   ├── models/
│       │   ├── routing/
│       │   ├── metering/
│       │   ├── billing/
│       │   └── audit/
│       └── routes/
├── packages/
│   ├── contracts/           # API 类型、Schema 和错误码
│   ├── database/            # Schema、迁移和查询层
│   ├── ui/                  # Web 与 Admin 的共享组件
│   └── config/              # ESLint、TypeScript 等共享配置
├── deploy/
├── docs/
└── landing/                 # 迁移完成前保留现有官网
```

实际迁移时先保持现有 `gateway/` 和 `landing/` 可运行，再逐步调整为工作区结构，避免一次性重构阻塞业务。

### 3.2 运行组件

| 组件 | 技术 | 职责 |
|---|---|---|
| Web | React + Vite | Landing、注册登录、Key、余额、用量和组织控制台 |
| Admin | React + Vite | 用户、渠道、模型、价格、账务和系统管理 |
| Gateway | Node.js 20+、TypeScript、Hono | 控制面 API 与推理数据面 API |
| PostgreSQL | PostgreSQL 16+ | 账户、租户、配置、账本、用量和审计的权威数据源 |
| Redis | Redis 7+ | 会话、限流、额度缓存、健康度、短期幂等和任务协调 |
| Worker | Node.js Worker | 用量聚合、计费、通知、对账和周期任务 |
| Object Storage | S3 兼容服务 | 账单导出、报表和后续文件输入 |

## 4. 控制面与数据面

平台明确区分两类流量。

### 4.1 控制面

控制面处理低吞吐但需要强一致性的业务：

- 用户、会话和组织管理。
- API Key、上游密钥和权限管理。
- 渠道、模型、价格和路由配置。
- 充值、账本、账单和用量查询。
- 审计日志和系统设置。

控制面以 PostgreSQL 为权威数据源，所有管理员变更记录审计事件。

### 4.2 数据面

数据面处理高并发、低延迟的推理请求：

1. 校验 API Key 并加载租户策略。
2. 检查账户状态、配额、预算和速率限制。
3. 解析模型与路由约束。
4. 根据价格、健康度、延迟、数据政策和用户偏好生成候选端点。
5. 调用供应商并在首字节前执行安全 fallback。
6. 流式透传响应，同时累计 token、时延和成本元数据。
7. 写入原始用量事件，异步完成账本扣费和报表聚合。

控制面不可用时，数据面应能使用短期缓存继续服务已有 Key；缓存不可用时采用明确的降级策略，不能让第三方缓存成为全平台单点故障。

## 5. 身份认证与账号安全

### 5.1 用户认证

- 邮箱和密码注册。
- 邮箱验证后才能创建生产 API Key。
- 密码使用 Argon2id 哈希，禁止明文或可逆存储。
- Web 会话使用带 `HttpOnly`、`Secure` 和 `SameSite` 属性的 Cookie。
- Access Session 短期有效，Refresh Session 支持轮换和撤销。
- 支持密码重置、登录设备列表和全局退出。
- 登录、注册和重置接口启用 IP、账号双维度限流及防自动化验证。

后续可添加 Google、GitHub、企业 OIDC、SAML 和 MFA，不改变现有用户主键和会话模型。

### 5.2 RBAC

第一版内置以下角色：

| 角色 | 权限范围 |
|---|---|
| Platform Admin | 全平台配置、渠道密钥、财务和用户管理 |
| Platform Operator | 渠道、模型、状态和用量管理，不可查看完整密钥 |
| Billing Admin | 账单、充值、调账和财务导出 |
| Organization Owner | 组织成员、Key、预算、BYOK 和账单 |
| Organization Admin | 组织成员、项目和 Key 管理 |
| Organization Member | 使用被授权的项目、Key 和模型 |
| Viewer | 只读访问用量、账单和配置 |

权限检查必须在服务端执行，前端隐藏菜单不构成授权。

## 6. API Key 管理

平台 Key 与供应商 Key 是两类不同凭证。

### 6.1 平台 API Key

- 格式包含可识别前缀，例如 `sf_live_` 和 `sf_test_`。
- 创建时只显示一次完整值，数据库仅保存 Key ID、前缀和哈希。
- 可配置名称、环境、到期时间、模型白名单、RPM、TPM、日限额和总预算。
- 可绑定组织、项目和创建人。
- 支持禁用、撤销、轮换和最后使用时间。
- 日志和界面只显示掩码值。

### 6.2 上游供应商密钥

- 由平台管理员或 BYOK 用户录入。
- 使用应用级密钥加密后存储，主密钥来自部署环境或 KMS。
- 展示时永不返回原文，只提供掩码、更新时间和测试结果。
- 修改、测试、启用、停用和删除都产生审计日志。

## 7. 管理后台与渠道配置

### 7.1 渠道管理

管理员可以：

- 新增供应商渠道并选择适配器类型。
- 配置名称、Base URL、区域、上游 Key、权重、优先级和并发限制。
- 设置是否支持流式、工具调用、结构化输出、图像、音频和缓存。
- 配置数据保留、训练使用、ZDR 和数据驻留标签。
- 测试连通性并查看脱敏后的错误。
- 启用、暂停、排空或删除渠道。
- 查看渠道级成功率、429、5xx、P50/P95 时延、吞吐和成本。

### 7.2 模型与端点

领域模型分为三层：

- **Canonical Model**：对用户公开的统一模型，例如 `anthropic/claude-sonnet-5`。
- **Provider Model**：供应商使用的实际模型 ID。
- **Endpoint**：某渠道上可调用某 Provider Model 的具体端点。

管理员可配置：

- 模型别名、上下文长度、最大输出、输入输出模态和能力标签。
- 输入、输出、缓存、图片、音频、搜索和推理 token 单价。
- 模型 ID 映射、请求参数映射和响应归一化规则。
- Endpoint 的价格、生效时间、健康状态、限流和数据政策。

价格变更采用版本化生效，不覆盖历史价格，确保账单可复算。

### 7.3 路由策略

路由必须分开处理“选择模型”和“选择供应商端点”：

- 默认优先选择满足政策要求的最低综合成本端点。
- 用户可指定 `price`、`latency`、`throughput` 或固定顺序。
- 支持供应商 allowlist、denylist、区域、ZDR 和上下文约束。
- 5xx、429、连接错误、首字节超时等在未输出响应字节前允许 fallback。
- 已经向客户端输出流式内容后不得切换供应商，以避免语义混合和重复计费。
- 熔断器按端点和模型维度维护，支持关闭、开启和半开探测。

## 8. 计量、计费与账本

### 8.1 Credits 与余额

- 账户采用预付费 Credits。
- 余额不是单个可直接修改的数值，而是由不可变账本交易计算得出。
- 交易类型包括充值、赠送、冻结、解冻、消费、退款、人工调账和过期。
- 每条账本交易包含租户、币种、金额、来源、幂等键和操作者。

### 8.2 请求计费流程

1. 请求进入时检查可用余额和预算，并按最大潜在成本进行可选预授权。
2. 供应商返回 usage 时按命中的价格版本计算成本。
3. 未返回 usage 时使用供应商 tokenizer 或估算策略，并标记计量来源。
4. 产生唯一 `request_id` 和不可重复扣费的幂等账本记录。
5. 流式中断按已产生用量计费；无法确认时进入异常对账队列。
6. 定时任务将平台记录与供应商账单对账并报告差异。

### 8.3 支付

P2 支持：

- Stripe：银行卡与国际支付。
- 支付宝、微信或合规聚合支付：人民币充值。
- Webhook 签名校验、幂等处理、订单状态机和失败补偿。
- 平台不得仅依据前端支付成功页面增加余额。

## 9. 用量分析与可观测性

### 9.1 用户控制台

用户可以按时间、组织、项目、Key、模型和供应商查看：

- 请求数、成功率、输入输出 token、成本和平均时延。
- 单请求状态、实际供应商、重试次数、成本和错误类别。
- 预算消耗趋势和限额预警。
- CSV 或 JSON 报表导出。

默认不存储 prompt 和 completion 正文。若企业客户选择记录正文，必须有单独的保留策略、权限和审计控制。

### 9.2 平台运维

- 结构化日志必须包含 `request_id`、tenant、key、model、endpoint 和 trace ID。
- 指标覆盖吞吐、错误率、429、5xx、P50/P95/P99、首 token 时延和流中断。
- 对认证失败、计费积压、对账差异、余额异常和渠道熔断设置告警。
- 后续接入 OpenTelemetry，实现日志、指标和链路追踪关联。

## 10. 组织与多租户

从第一版开始，用户资源不直接作为唯一归属边界，核心资源归属于租户或组织。

```text
Tenant
  └─ Organization
      ├─ Members + Roles
      ├─ Projects
      │   ├─ API Keys
      │   ├─ Budgets
      │   └─ Usage
      ├─ Billing Account
      └─ BYOK Credentials
```

- 个人用户注册时自动创建个人组织。
- 每次数据库查询必须带租户边界，平台管理员访问除外。
- 组织可设置总预算，项目和 Key 可设置子预算。
- 组织额度用尽后默认拒绝新请求，不影响其他租户。

## 11. BYOK

BYOK 允许用户或组织配置自己的 OpenAI、Anthropic、Google、Azure、Bedrock 等供应商凭证，同时继续使用 Silicon Fission 的统一协议、路由、日志和策略能力。

- 密钥可设置为优先使用、仅 fallback 或强制使用。
- 可按模型、项目、平台 Key 和成员设置过滤器。
- BYOK 调用与平台共享渠道分别计费，并可配置是否计入组织预算。
- BYOK 不能绕过 ZDR、数据驻留、模型白名单和安全策略。
- 同一供应商支持多个 Key，按优先级和健康度切换。

BYOK 属于 P3，但加密凭证、组织归属和路由端点模型必须在 P1 数据设计中预留。

## 12. Playground

P3 Playground 提供：

- 单模型聊天和多模型并排比较。
- 参数、系统提示、工具、结构化输出和路由策略编辑。
- 显示延迟、token、成本、实际供应商和 fallback 链。
- 将测试配置保存为 Preset，并生成 curl、TypeScript 和 Python 示例。
- Playground 请求使用用户自己的平台 Key 或短期受限会话凭证，不能绕过计费与审计。

## 13. 核心数据模型

建议至少包含以下表：

| 表 | 用途 |
|---|---|
| `users` | 用户身份和状态 |
| `user_identities` | 密码、OAuth、OIDC 等登录身份 |
| `sessions` | Web 会话和撤销状态 |
| `organizations` | 个人或企业组织 |
| `organization_members` | 成员、角色和状态 |
| `projects` | 成本和权限隔离单元 |
| `api_keys` | 平台 API Key 元数据与哈希 |
| `providers` | 供应商定义 |
| `provider_credentials` | 加密后的平台或 BYOK 凭证 |
| `channels` | 实际渠道配置 |
| `models` | 对外规范化模型 |
| `provider_models` | 供应商模型映射 |
| `endpoints` | 模型与渠道的可路由端点 |
| `price_versions` | 可追溯的价格版本 |
| `usage_events` | 请求级原始计量事件 |
| `usage_rollups` | 小时和日级聚合 |
| `ledger_entries` | 不可变资金账本 |
| `payment_orders` | 支付订单和状态 |
| `budgets` | 组织、项目和 Key 预算 |
| `audit_events` | 安全和管理操作审计 |

所有主要表使用不可枚举 ID，包含 `created_at`、`updated_at`，涉及租户的表必须包含 `organization_id` 或明确的全局归属。

## 14. API 设计

### 14.1 推理 API

```text
GET  /v1/models
POST /v1/chat/completions
POST /v1/responses                 # 后续
POST /v1/embeddings                # 后续
POST /v1/images/generations        # 后续
```

### 14.2 控制面 API

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/verify-email
POST /api/auth/password/forgot
POST /api/auth/password/reset

GET  /api/me
GET  /api/keys
POST /api/keys
PATCH /api/keys/:id
POST /api/keys/:id/rotate
DELETE /api/keys/:id

GET  /api/usage
GET  /api/usage/requests/:id
GET  /api/billing/balance
GET  /api/billing/ledger
POST /api/billing/top-ups

GET  /api/organizations
POST /api/organizations
GET  /api/organizations/:id/members
POST /api/organizations/:id/invitations

GET  /api/admin/channels
POST /api/admin/channels
PATCH /api/admin/channels/:id
POST /api/admin/channels/:id/test
GET  /api/admin/models
POST /api/admin/models
GET  /api/admin/users
GET  /api/admin/audit-events
```

API 错误采用稳定的机器可读 `code`、人类可读 `message`、`request_id` 和可选 `details`，不得把上游密钥、数据库错误或内部堆栈返回给用户。

## 15. 安全与合规

- 上游密钥使用信封加密或 KMS，加密密钥与数据库分离。
- API Key 和密码只存储强哈希。
- 管理员敏感操作需要重新认证，后续支持 MFA。
- 所有输入使用共享 Schema 校验；数据库访问使用参数化查询。
- 登录和推理分别采用 IP、用户、Key 和组织维度的限流。
- 管理后台部署独立入口，可增加 VPN、IP allowlist 或身份代理。
- 默认不记录 prompt/completion 正文。
- 支持配置日志保留期限和数据删除流程。
- 渠道和模型记录区域、数据保留、训练使用和 ZDR 属性。
- 定期备份 PostgreSQL，并验证恢复流程；生产环境禁止通过删除 volume 清理数据。

## 16. 错误处理与一致性

- 控制面写操作使用数据库事务。
- 支付、计费和 Webhook 使用幂等键。
- 外部调用采用有限重试、指数退避、超时和熔断。
- 计费采用至少一次事件投递和幂等消费，避免漏扣与重复扣费。
- 配置变更通过版本号或事件使数据面缓存失效。
- Redis 不作为资金、用户或配置的唯一数据源。
- 无法确定扣费结果的请求进入人工或自动对账队列，不静默丢弃。

## 17. 测试策略

### 单元测试

- 密码、会话、Key 哈希和权限判断。
- 路由排序、过滤、fallback 和熔断状态机。
- token 计量、价格版本和账本计算。
- 预算继承与多租户数据过滤。

### 集成测试

- PostgreSQL 与 Redis 的真实容器测试。
- 注册、登录、创建 Key、调用模型、计费的端到端链路。
- 支付 Webhook 的签名、重复投递和乱序事件。
- 上游超时、429、5xx、流中断和 usage 缺失。

### 前端与 E2E

- 注册登录、Key 创建、余额、用量筛选和渠道配置。
- 普通用户无法访问管理 API。
- 密钥只显示一次且后续页面不可恢复。
- Desktop、tablet 和 mobile 关键视图验证。

### 性能与可靠性

- 非流式与 SSE 推理压测。
- 数据面在控制面或 Redis 短时故障下的降级测试。
- 大量 usage events 的聚合和计费积压恢复。
- 数据库备份和恢复演练。

## 18. 部署与迁移

### 18.1 并行运行

现有 New API 系统保持原有域名或迁移到 legacy 子域名。新系统使用独立环境和数据库：

```text
siliconfission.com          新 Landing
console.siliconfission.com  新用户控制台
admin.siliconfission.com    新管理后台
api.siliconfission.com      自研 Gateway
legacy.siliconfission.com   现有 New API，迁移期间保留
```

最终域名以实际 DNS 和运营安排为准。

### 18.2 迁移原则

- 新老系统不共享数据库表。
- 首先让内部账号和测试流量使用新系统。
- 再迁移渠道配置和模型目录，但上游密钥通过安全方式重新录入。
- 用户迁移优先采用邀请激活或密码重置，不迁移不可验证的密码数据。
- 余额迁移生成带来源的账本交易并进行双人复核。
- 迁移期间保留旧系统只读查询和导出能力。
- 达到验收指标后停止新用户进入旧系统，再逐步下线。

## 19. 实施里程碑

### M1：平台基础

- 工作区和数据库基础设施。
- 用户认证、个人组织、RBAC 和审计。
- API Key 管理。
- 管理员渠道、模型、端点和价格配置。
- Gateway 从数据库加载配置并验证自研 API Key。

### M2：商业闭环

- 请求级计量和异步聚合。
- Credits 账本、余额、预算和人工调账。
- 用量控制台和请求详情。
- 支付、Webhook、对账和告警。
- 组织成员、项目和成本归因。

### M3：高级能力

- BYOK 和凭证过滤器。
- Playground 与 Presets。
- Provisioning API、企业 OIDC/SSO 和更细粒度 RBAC。
- 高级路由、数据驻留策略和私有化部署包。

## 20. 验收标准

M1 完成时：

1. 用户可以注册、验证邮箱、登录并创建只能查看一次的 API Key。
2. 使用该 Key 可以调用 `/v1/chat/completions`，禁用后立即失效。
3. 管理员可以在后台新增渠道、测试连接、映射模型和发布价格。
4. 普通用户不能读取或修改其他组织的数据。
5. 管理员敏感操作具备完整审计记录，密钥不出现在日志中。
6. New API 生产系统继续独立运行，新的部署不会修改其数据。

M2 完成时：

1. 每个成功请求生成唯一用量事件和幂等账本扣费。
2. 用户可以查看余额、请求明细和按维度聚合的成本。
3. 组织、项目和 Key 的预算限制能够阻止超额请求。
4. 重复支付 Webhook 不会重复入账，对账任务能发现差异。

M3 完成时：

1. 用户可安全配置 BYOK，并限定其使用范围和优先级。
2. Playground 能展示模型、供应商、token、成本和路由链。
3. 企业管理员可以通过角色和组织策略管理成员及数据访问。

## 21. 主要风险

| 风险 | 缓解措施 |
|---|---|
| 范围过大导致长期无法上线 | 严格按 M1/M2/M3 交付，每个阶段形成可运行闭环 |
| 计费错误产生资金损失 | 不可变账本、幂等扣费、价格版本和供应商对账 |
| 上游密钥泄漏 | 加密存储、输出脱敏、权限隔离、审计和密钥轮换 |
| 缓存成为单点故障 | PostgreSQL 为权威源，数据面保留短期本地快照和明确降级策略 |
| 多租户越权 | 服务端统一授权层、查询强制租户条件和专门的越权测试 |
| New API 迁移影响现有业务 | 独立数据库、独立部署、灰度流量和可回退迁移 |
| 上游转售与地区合规 | 接入前审核供应商条款，记录区域和数据策略，提供路由约束 |

## 22. 后续决策

以下内容在实施计划阶段明确，不阻塞本设计方向：

- PostgreSQL ORM/查询层的具体选择。
- 邮件、对象存储和支付供应商。
- Web 与 Admin 是否在首期合并为一个前端应用。
- 生产 KMS 或应用级密钥管理方案。
- M1 首批供应商和模型清单。

这些决策应遵循现有 TypeScript/Hono 技术路线、最小化部署复杂度，并保证未来可替换。
