# 硅基裂变 · 功能文档

> 本文档汇总项目当前已实现的全部功能、架构与使用方法。
> 项目定位:LLM 统一 API 网关 / 中转站(OpenRouter 竞品),让用户注册登录后即可创建 API Key、配置模型渠道并调用大模型。

---

## 目录

1. [整体架构](#1-整体架构)
2. [仓库结构](#2-仓库结构)
3. [Web 控制台功能](#3-web-控制台功能)
4. [演示模式 vs 真实模式](#4-演示模式-vs-真实模式)
5. [后端对接层(API 路由)](#5-后端对接层api-路由)
6. [部署方式](#6-部署方式)
7. [本地开发](#7-本地开发)
8. [上线到公网(Vercel + VPS)](#8-上线到公网vercel--vps)
9. [设计约束与合规](#9-设计约束与合规)
10. [路线图](#10-路线图)

---

## 1. 整体架构

```
                浏览器(用户)
                     │  只与本站通信
                     ▼
        ┌────────────────────────────┐
        │  硅基裂变 Web(Next.js)      │   ← 你的闭源前端(web/)
        │  · 页面:首页/模型/对话/控制台 │
        │  · 服务端 API 路由(代理层)   │   app/api/*
        └────────────┬───────────────┘
                     │  服务端转发(浏览器看不到后端地址)
                     ▼
        ┌────────────────────────────┐
        │  new-api 后端(Go)           │   ← 官方镜像(deploy/)
        │  · 用户/令牌/额度/计费        │
        │  · 渠道管理与路由             │
        └────────────┬───────────────┘
                     │  OpenAI 兼容协议
                     ▼
        上游模型(DeepSeek / OpenAI / Claude / Gemini …)
```

**关键点:浏览器永远只跟本站(Next.js)通信**,登录/对话等请求由 Next.js 服务端 API 路由代理到 new-api——因此后端地址与拓扑不暴露、无 CORS 问题;将来替换后端(如换成自研 `gateway/`)前端无需改动。

---

## 2. 仓库结构

| 目录 | 说明 | 语言/技术 |
|---|---|---|
| `web/` | **对外 Web 控制台**(本次核心),可闭源、可差异化 | Next.js 16 + Tailwind v4 |
| `deploy/` | 后端一键部署(new-api 官方镜像) | Docker Compose |
| `gateway/` | 自研网关内核(M0 骨架,可闭源替代 new-api) | Node + Hono + TS |
| `docs/` | 竞品分析、Spec、本功能文档 | Markdown |
| `vendor/new-api` 分支 | new-api 源码只读副本(仅供本地研究,AGPL) | Go — **勿并入 main** |

---

## 3. Web 控制台功能

统一为**白色主题**,顶部导航:模型 / 对话 / 榜单 / 控制台 / 渠道配置。

### 3.1 首页 `/`
- Hero 主标题 + 搜索框 + 平台数据条(可用模型/供应商/Token/可用性)
- 热门模型卡片 + OpenAI SDK 兼容示例代码

### 3.2 模型市场 `/models`
- 卡片网格:模型名、厂商、描述、上下文、输入/输出单价、周用量
- 侧边筛选:**线路(国内直连 / 境外)** + 模型系列标签
- 搜索框 + 排序(按热度 / 按价格)
- 模型详情页 `/models/[id]`:参数矩阵 + 各供应商价格表

### 3.3 登录 / 注册 `/login`
- 登录/注册双 Tab,表单校验(用户名 ≥3、密码 ≥8、注册二次确认 + 同意条款)
- 登录成功自动跳转控制台;GitHub / 微信 OAuth 为占位入口
- 真实模式下对接 new-api 账号体系(JWT,存 httpOnly cookie)

### 3.4 控制台 / 工作台 `/dashboard`
- 账户行:当前账号、用户组、退出登录
- 三卡:**账户余额**、**API Keys 数量 + 累计消费**、**可用模型数**
- API Key 管理:**新建 Key**、**查看完整 Key**、**复制**
- 未登录时显示引导登录卡

### 3.5 对话 Playground `/chat`
- 多轮对话界面,右侧选模型 + 填 API Key
- 登录后自动从后端加载**真实可用模型**(标注"来自后端")
- 请求经本站 `/api/chat` 代理转发,后端地址不暴露

### 3.6 渠道配置(配置后台)`/admin`
本次新增的**站内管理页**,自动检测后端状态并给出对应操作:

| 检测到的状态 | 页面表现 |
|---|---|
| 后端未启动 | 黄色警告 + 启动命令 + 重新检测按钮 |
| 后端全新未初始化 | 初始化表单 → 创建管理员并自动登录(自动开启自用模式) |
| 未登录 | 引导登录 |
| 就绪 | 渠道列表(可测试连通)+ 接入新渠道表单 |

**接入新渠道**支持上游预设(DeepSeek / SiliconFlow / Moonshot / OpenAI / 自定义),选中自动填好 Base URL 与推荐模型,填入上游 API Key 即可接入。

### 3.7 榜单 `/rankings` 与 充值 `/topup`
- 榜单:按用量排名的模型列表(示例数据)
- 充值:人民币档位 + 自定义金额、支付方式(支付宝/微信/Stripe)、实时订单摘要(3% 手续费 + 汇率换算)。**支付对接为占位**,接入易支付/Stripe 后可真实收款。

---

## 4. 演示模式 vs 真实模式

**同一套界面,一个环境变量决定用示例数据还是真实后端。**

| | 演示模式 | 真实模式 |
|---|---|---|
| 触发条件 | 未设 `NEWAPI_BASE`,或指向 localhost | `NEWAPI_BASE` 指向真实 new-api 实例 |
| 登录 | 任意用户名+密码即可进 | new-api 真实账号校验 |
| 数据 | 示例余额 $5、示例模型、cookie 存创建的 Key | 全部真实(余额、Key、模型、计费) |
| 对话 | 返回固定示例回复 | 调真实上游模型 |
| 顶部横幅 | 紫色"演示模式"提示条 | 无 |

判定逻辑见 `web/lib/demo.ts` 的 `isDemo()`:

```ts
DEMO_MODE=true  → 强制演示
DEMO_MODE=false → 强制真实
未设置          → NEWAPI_BASE 缺失或为 localhost 时演示,否则真实
```

**用途**:Vercel 上不配后端即可完整体验/演示界面;等配好真实服务器,设一个环境变量就切成真实站,前端代码零改动。

---

## 5. 后端对接层(API 路由)

全部位于 `web/app/api/`,每个路由都是"先判断演示模式,否则代理到 new-api"。

| 本站路由 | 方法 | 作用 | 真实模式 → new-api |
|---|---|---|---|
| `/api/auth/login` | POST | 登录,写 httpOnly cookie | `/api/user/login` |
| `/api/auth/register` | POST | 注册 | `/api/user/register` |
| `/api/auth/logout` | POST | 退出,清 cookie | — |
| `/api/me` | GET | 当前用户 + 余额 | `/api/user/self` |
| `/api/keys` | GET/POST | 列出 / 新建 API Key | `/api/token/*` |
| `/api/keys/[id]/reveal` | POST | 取回完整 sk- Key | `/api/token/{id}/key` |
| `/api/models` | GET | 用户可用模型 | `/api/user/models` |
| `/api/chat` | POST | 对话代理 | `/v1/chat/completions` |
| `/api/admin/setup` | GET/POST | 后端初始化状态 / 初始化 | `/api/setup` |
| `/api/admin/channels` | GET/POST | 渠道列表 / 新增渠道 | `/api/channel/*` |
| `/api/admin/channels/[id]/test` | POST | 测试渠道连通 | `/api/channel/test/{id}` |

**额度换算**:new-api 默认 `500000 quota = $1`,常量见 `web/lib/newapi-server.ts` 的 `QUOTA_PER_USD`。

---

## 6. 部署方式

### 6.1 后端(new-api) — 一键零配置

`deploy/docker-compose.yml`(单容器 SQLite,无需 .env):

```bash
cd deploy
docker compose up -d
docker compose ps          # 等 running
# 打开 http://localhost:3000 或前端 /admin 完成初始化
```

数据持久化在 `deploy/data/`,删容器不丢数据。

> 大流量/多机部署时改用 `deploy/docker-compose.full.yml`(Postgres + Redis)。

### 6.2 前端(Web 控制台)

见下节「本地开发」与「上线」。

---

## 7. 本地开发

```bash
# 1. 起后端
cd deploy && docker compose up -d

# 2. 起前端(指向本地后端)
cd ../web
echo "NEWAPI_BASE=http://localhost:3000" > .env.local
npm install
npm run dev                # http://localhost:3001
```

打开 `http://localhost:3001/admin`,依次:初始化管理员 → 接入渠道(如 DeepSeek,填官网申请的 Key)→ 控制台建 Key → 对话页选模型使用。

**不想连后端、只看界面**:不设 `NEWAPI_BASE` 直接 `npm run dev`,即为演示模式。

---

## 8. 上线到公网(Vercel + VPS)

### 8.1 前端上 Vercel
- 导入 GitHub 仓库,**Root Directory 设为 `web`**,框架自动识别 Next.js
- 不设 `NEWAPI_BASE` → 线上即为**演示模式**,可立即体验/展示全流程
- 每次推送 `main` 自动重新部署

### 8.2 后端上 VPS(让线上站变真实)
1. 买一台香港/新加坡 VPS(2C2G,Ubuntu),装 Docker
2. `git clone` 本仓库 → `cd deploy && docker compose up -d`
3. 云控制台放行 TCP **3000** 端口
4. Vercel → Settings → Environment Variables 加:
   `NEWAPI_BASE = http://你的服务器IP:3000` → Redeploy
5. 线上站的登录/渠道/对话即变为真实数据

> 前端是服务端发起对后端的请求(非浏览器直连),`http://` 后端配 `https://` 前端不受混合内容限制。生产建议再给后端加域名 + HTTPS(Caddy 一条命令)。

---

## 9. 设计约束与合规

- **AGPL 边界**:new-api 采用 AGPL-3.0。本项目只**运行其官方镜像 / 调用其 HTTP 接口**,不复制、不修改其源码进 `main`,因此 `web/` 与 `gateway/` 是可闭源的自有资产。`vendor/new-api` 分支为只读研究副本,严禁并入 `main`。
- **数据/隐私**:后端默认不记录 prompt/completion 正文。
- **运营风险**(转售境外模型给国内用户涉及上游 ToS 与国内监管),详见 `docs/deployment.md`。

---

## 10. 路线图

- [ ] 注册页接入邮箱验证 / Turnstile 防滥用
- [ ] 充值页对接易支付(支付宝/微信真实收款)
- [ ] 登录态全局化(导航栏显示头像/余额)
- [ ] 服务条款 / 隐私政策静态页
- [ ] 自研 `gateway/` 补齐 M1(多 Key、Redis 配额、Postgres 计费),逐步替代 new-api
- [ ] 后端加域名 + HTTPS 的生产部署脚本

---

## 相关文档

- [README.md](../README.md) — 项目总览
- [docs/SPEC.md](SPEC.md) — 产品与技术规格
- [docs/openrouter-analysis.md](openrouter-analysis.md) — OpenRouter 竞品分析
- [docs/deployment.md](deployment.md) — 中转站部署与风险
- [web/README.md](../web/README.md) — 前端说明
