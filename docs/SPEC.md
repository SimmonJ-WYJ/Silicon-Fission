# 硅基裂变 (Silicon Fission) — 产品与技术规格说明书 (Spec)

- 版本:v0.1(立项稿)
- 日期:2026-07-24
- 定位:面向开发者的 **LLM 统一 API 网关 / 中转站**,OpenRouter 的竞品。

---

## 1. 产品概述

### 1.1 一句话定位

**一个 API Key,裂变出所有大模型的算力**:OpenAI 兼容的统一入口,聚合国内外主流 LLM,提供智能路由、自动容灾、统一计费与用量分析。

### 1.2 目标用户

| 用户 | 痛点 | 我们提供 |
|---|---|---|
| 独立开发者 / 初创团队 | 多家开户、多套 SDK、汇率与支付门槛 | 一个 Key、一次充值(支持人民币)、OpenAI SDK 即插即用 |
| AI 应用公司 | 供应商限流/宕机导致服务抖动 | 多供应商自动 fallback、SLA 报表 |
| 企业 IT / 平台方 | 预算失控、无法分账、合规审计 | 配额中心、部门分账、审计日志、可私有化部署 |

### 1.3 与 OpenRouter 的差异化

1. **中国市场本土化**:人民币支付(微信/支付宝)、国产模型一等公民(DeepSeek/Qwen/GLM/Kimi/豆包/MiniMax)、中文控制台与文档、发票。
2. **透明路由**:每个响应携带 `x-sf-provider`、`x-sf-attempts` 等头,控制台可回放完整重试链路(OpenRouter 是黑盒)。
3. **企业能力前置**:配额/预算中心、子账号分账、私有化部署版本进入早期路线图。
4. **更低费率**:充值手续费目标 3%(对标 OpenRouter 5.5%),BYOK 服务费 3%。

---

## 2. 功能规格

### 2.1 核心 API(MVP,P0)

统一入口:`https://api.siliconfission.com/v1`

| 端点 | 说明 |
|---|---|
| `POST /v1/chat/completions` | OpenAI 兼容;支持 stream(SSE)、tools、response_format(JSON Schema)、多模态图片输入 |
| `GET /v1/models` | 模型目录:ID、上下文长度、单价(输入/输出每百万 token)、支持的能力、可用供应商 |
| `GET /v1/key` | 查询当前 Key 的余额、限额与用量 |

模型命名:`{vendor}/{model}`,如 `deepseek/deepseek-v3`、`anthropic/claude-sonnet-5`、`openai/gpt-5`。
变体后缀:`:free`(免费池)、`:fast`(按吞吐路由)、`:cheap`(按价格路由,默认)、`:online`(附加联网搜索)。

请求扩展字段(兼容 OpenAI,额外字段以 `sf_` 或顶层扩展承载):

```jsonc
{
  "model": "deepseek/deepseek-v3",
  "models": ["deepseek/deepseek-v3", "qwen/qwen-max"],   // 模型级 fallback 链
  "provider": {
    "order": ["deepseek", "siliconflow"],  // 指定供应商优先级
    "ignore": ["providerX"],               // 排除供应商
    "sort": "price" | "throughput" | "latency",
    "require_zdr": true                     // 仅路由零数据保留供应商
  },
  "messages": [...]
}
```

响应扩展:
- body:`usage` 内附 `cost`(本次请求实际费用,单位:credit)。
- headers:`x-sf-provider`(实际命中供应商)、`x-sf-attempts`(重试链,JSON)、`x-sf-latency-ms`。

### 2.2 智能路由(P0)

1. **供应商路由**:同一模型多供应商时,按 `sort` 策略排序(默认价格优先,稳定性加权);健康度由滑动窗口错误率 + P95 延迟实时计算。
2. **自动 fallback**:
   - 触发条件:5xx、429、连接超时、供应商内容拦截、上下文超限(切换更长上下文的供应商)。
   - 供应商内 fallback → 跨供应商 fallback → `models` 链模型降级。
   - 计费按实际服务方价格结算。
3. **熔断**:供应商错误率超阈值即摘除,半开探活恢复。
4. **Auto 模型**(P1):`siliconfission/auto` 按 prompt 复杂度自动选模型。

### 2.3 账务体系(P0)

- **Credits 预付费**:1 credit = 1 USD 等值;支持 USD(Stripe)与 CNY(微信/支付宝,按日汇率)。余额不过期。
- **计费**:推理按供应商列表价透传,不加价;充值收取 3% 手续费。
- **BYOK**(P1):用户自带上游 Key,收该部分用量 3% 服务费;可配置为「优先用平台余额,限流时 fallback 到我的 Key」。
- **免费池**:`:free` 模型限速供应,新用户赠送少量 credits。

### 2.4 Key 与组织(P0 基础 / P1 完整)

- 多 API Key,每 Key 可设:总额度、每日额度、RPM 限速、允许的模型白名单。
- 组织/团队:成员管理、组织级账单、部门标签分账(P1)。
- Provisioning API:程序化创建/吊销子 Key,面向平台型客户(P1)。

### 2.5 控制台(P0 基础)

- 模型市场:价格、上下文、能力矩阵、实时延迟/吞吐、供应商列表。
- 用量分析:按 Key/模型/日期的 token 与费用曲线;单请求明细与路由链路回放。
- Playground:多模型并排对比聊天(P1)。
- Rankings 公共榜单:按真实用量的模型排行(P2,内容营销资产)。

### 2.6 高级能力(P1–P2)

| 功能 | 优先级 |
|---|---|
| Prompt caching 折扣透传 | P1 |
| Reasoning tokens 统一参数 | P1 |
| Web Search 插件(任意模型 `:online`)| P1 |
| PDF / 文件输入 | P2 |
| Presets(服务端参数预设)| P2 |
| OAuth PKCE(第三方 App 代扣用户余额)| P2 |
| 私有化部署版(网关内核开源/商业授权)| P2 |

### 2.7 安全与合规(贯穿)

- 默认 **不记录** prompt/completion 正文;仅存元数据(token 数、延迟、路由)。
- ZDR 路由约束;数据出境提示(路由到境外供应商时明确标注)。
- API Key 哈希存储;传输全程 TLS;审计日志(企业版)。
- 内容安全:按上游与属地法规要求接入审核策略,违规计费不转嫁。

---

## 3. 技术架构

### 3.1 总览

```
客户端 (OpenAI SDK / HTTP)
   │
   ▼
[边缘接入层]  认证、限流、配额预检     ← Key/配额缓存 (Redis)
   │
   ▼
[路由核心]    模型解析 → 供应商候选排序 → 熔断过滤
   │              ▲
   ▼              │ 健康度/价格信号
[供应商适配层]  OpenAI / Anthropic / Google / DeepSeek / Qwen / GLM ... (统一协议转换, 流式透传)
   │
   ▼
[计量计费]    usage 归集 → 异步扣费 (幂等) → 账单
   │
   ▼
[可观测]      请求日志(元数据)、路由链路、供应商健康看板
```

### 3.2 技术选型(建议)

| 层 | 选型 | 理由 |
|---|---|---|
| 网关服务 | Node.js 20 + TypeScript + Hono | SSE 流式友好、生态成熟、冷启动快;后续热点路径可用 Rust/Go 重写 |
| 数据库 | PostgreSQL(账户/账单)+ Redis(配额/健康度/限流)| 经典组合 |
| 计量管道 | 请求内联记账 + 异步对账(消息队列)| 保证低延迟与最终一致 |
| 控制台 | new-api 原生界面 | 用户自助与管理配置合一,无需自建前端;自研网关成熟后再评估替换 |
| 部署 | 容器化,多区域(国内 + 海外出口节点)| 国内可达 + 海外模型访问 |

### 3.3 关键设计点

1. **协议归一化**:内部统一为 OpenAI Chat 协议;各供应商适配器负责双向转换(含 tools、多模态、reasoning、流式增量格式)。
2. **流式与计费**:SSE 透传中旁路累计 token;连接中断按已产生 usage 结算。
3. **fallback 语义**:仅在「未向客户端写出任何字节」前允许自动重试;流已开始则只能断流报错(与 OpenRouter 一致)。
4. **扣费幂等**:request_id 为幂等键,重试不重复扣费。
5. **健康度信号**:每供应商 × 模型维度滑动窗口(错误率、P95 延迟、吞吐),路由排序时与价格加权。

---

## 4. 里程碑

| 阶段 | 内容 | 周期 |
|---|---|---|
| M0 骨架 | 网关跑通:OpenAI 兼容 `/chat/completions` + `/models`,2–3 家供应商适配,静态路由 + 简单 fallback,内存计量 | 2 周 |
| M1 MVP | Key 管理、Redis 配额、Postgres 计费、充值(Stripe/支付宝)、基础控制台 | 6 周 |
| M2 增长 | BYOK、Playground、用量分析、prompt caching、更多供应商(≥15)| 8 周 |
| M3 企业 | 组织分账、Provisioning API、审计、私有化 PoC、Rankings | 12 周 |

## 5. 成功指标(北极星:月度推理流水 GMV)

- MVP 后 3 个月:接入模型 ≥ 50,月活开发者 ≥ 500,GMV ≥ $10k/月。
- 网关自身开销延迟 P95 < 60ms;月度可用性 ≥ 99.9%。

## 6. 开放问题

1. 上游转售条款逐家确认(尤其 OpenAI/Anthropic 对 reseller 的政策)。
2. 国内合规:算法备案 / 增值电信资质路径。
3. 免费池的滥用防控(风控、设备指纹)。
