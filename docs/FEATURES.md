# 硅基裂变 · 功能文档

> 本文档汇总项目当前已实现的全部功能、架构与使用方法。
> 项目定位:LLM 统一 API 网关 / 中转站(OpenRouter 竞品),让用户注册登录后即可创建 API Key、配置模型渠道并调用大模型。

---

## 目录

1. [整体架构](#1-整体架构)
2. [仓库结构](#2-仓库结构)
3. [主站配置平台功能](#3-主站配置平台功能)
4. [部署方式](#4-部署方式)
5. [本地开发](#5-本地开发)
6. [上线到公网(VPS)](#6-上线到公网vps)
7. [设计约束与合规](#7-设计约束与合规)
8. [路线图](#8-路线图)

---

## 1. 整体架构

```
     浏览器(用户 + 管理员)          程序调用(SDK / curl)
              │                              │
   siliconfission.com                api.siliconfission.com
   www 永久跳转到主域名                        │
              ▼                              ▼
   ┌────────────────────────┐    ┌────────────────────────┐
   │  Caddy(自动 HTTPS)     │    │  Caddy(自动 HTTPS)     │
   └───────────┬────────────┘    └───────────┬────────────┘
               ▼                             ▼
   ┌────────────────────────┐    ┌────────────────────────┐
   │  new-api 原生前端 + 后端 │    │  自研网关 gateway/      │
   │  · 注册/登录/API Key    │    │  · OpenAI 兼容入口      │
   │  · 额度/计费/用量日志    │    │  · 智能路由 / fallback  │
   │  · 渠道、模型、价格配置  │    └───────────┬────────────┘
   └───────────┬────────────┘                │
               │      Postgres + Redis       │
               └──────────────┬──────────────┘
                              ▼
        上游模型(DeepSeek / OpenAI / Claude / Gemini …)
```

**关键点:主域名就是配置平台。**普通用户和管理员访问同一个 New API 原生界面,权限由账号角色区分——用户自助注册、创建 Key、查用量;管理员配置渠道、模型、价格和额度。程序调用统一走 `api.` 子域名的自研网关,与界面入口相互隔离。

---

## 2. 仓库结构

| 目录 | 说明 | 语言/技术 |
|---|---|---|
| `deploy/` | 生产部署(new-api 官方镜像 + Postgres + Redis + Caddy) | Docker Compose |
| `gateway/` | 自研网关内核(M0 骨架,可闭源替代 new-api) | Node + Hono + TS |
| `docs/` | 竞品分析、Spec、本功能文档 | Markdown |
| `vendor/new-api` 分支 | new-api 源码只读副本(仅供本地研究,AGPL) | Go — **勿并入 main** |

---

## 3. 主站配置平台功能

主域名 `https://你的域名.com` 直接提供 New API 原生界面,`www` 永久跳转到主域名。用户配置与管理配置合并在这一个平台里,按账号角色分权。

### 3.1 普通用户能做的事
- 注册 / 登录(用户名密码,以及 New API 支持的 OAuth 方式)
- 创建、查看、复制、禁用自己的 API Key(令牌)
- 查看余额、消费额度与调用日志
- 查看自己可用的模型清单与价格
- 在原生 Playground 里试用模型

### 3.2 管理员额外能做的事
- 渠道管理:接入上游供应商、填 Base URL 与上游 Key、测试连通性、启用停用
- 模型与价格:配置模型映射、倍率、缓存比例
- 用户管理:改用户组、封禁、直接增减用户额度(人工调账,不走支付流程)
- 全站日志与用量统计、系统设置(注册开关、邮件、支付等)

### 3.3 为什么用原生界面
原来的自研 Next.js 前端(`web/`)只覆盖了 New API 能力的一小部分,每加一个后台功能都要再写一层代理路由和页面,维护成本高于收益。改用原生界面后,New API 的全部管理能力立即可用,升级镜像即可拿到上游新功能。旧前端代码仍保留在 git 历史里,需要时可以恢复。

---

## 4. 部署方式

生产部署使用 `deploy/production/`(new-api + Postgres + Redis + Caddy 自动 HTTPS),完整步骤见 [go-live.md](go-live.md):

```bash
cd deploy/production
cp .env.example .env    # 首次:DOMAIN 填主域名,不带 api. 前缀
docker compose up -d --build
```

Caddy 的三条路由:主域名 → `new-api:3000`,`www` → 永久跳转主域名,`api.` 子域名 → `gateway:8788`。改动 Caddyfile 后用 `sh deploy/production/test-routing.sh` 做回归检查。

数据保存在 Docker volumes(`pg_data`、`redis_data`),**生产环境禁止 `docker compose down -v`**。

本地试跑可以用更轻的 `deploy/docker-compose.yml`(单容器 SQLite,无需 .env),数据落在 `deploy/data/`。

---

## 5. 本地开发

```bash
# 起 new-api(界面 + 后台一体)
cd deploy && docker compose up -d
# 打开 http://localhost:3000 初始化管理员

# 起自研网关
cd ../gateway
npm install
cp .env.example .env
npm run dev                # http://localhost:8788
```

初始化管理员后,在原生界面里接入渠道(如 DeepSeek,填官网申请的 Key)→ 建 API Key → 在 Playground 里选模型试用。

---

## 6. 上线到公网(VPS)

1. 买一台香港/新加坡 VPS(2C2G,Ubuntu),装 Docker
2. DNS 把 `@`、`www`、`api` 三条 A 记录都指向服务器公网 IP
3. 云控制台放行 TCP **80** 和 **443**(new-api 与 gateway 只在容器内网暴露端口,不直接对外)
4. `git clone` 本仓库 → 按上一节启动 `deploy/production`
5. 用 `curl -I` 逐一验证三个域名,详见 [go-live.md](go-live.md)

---

## 7. 设计约束与合规

- **AGPL 边界**:new-api 采用 AGPL-3.0。本项目只**运行其官方镜像 / 调用其 HTTP 接口**,不复制、不修改其源码进 `main`,因此 `gateway/` 是可闭源的自有资产。`vendor/new-api` 分支为只读研究副本,严禁并入 `main`。
- **界面归属**:主站界面来自 new-api 官方镜像,属于上游产品;不要把它的源码改动带进本仓库。
- **数据/隐私**:后端默认不记录 prompt/completion 正文。
- **运营风险**(转售境外模型给国内用户涉及上游 ToS 与国内监管),详见 `docs/deployment.md`。

---

## 8. 路线图

- [ ] 在原生界面里开启邮箱验证 / Turnstile 防滥用
- [ ] 对接易支付(支付宝/微信真实收款)
- [ ] 站点信息定制(站名、Logo、公告、服务条款与隐私政策页)
- [ ] 自研 `gateway/` 补齐 M1(多 Key、Redis 配额、Postgres 计费),逐步替代 new-api

---

## 相关文档

- [README.md](../README.md) — 项目总览
- [docs/SPEC.md](SPEC.md) — 产品与技术规格
- [docs/openrouter-analysis.md](openrouter-analysis.md) — OpenRouter 竞品分析
- [docs/deployment.md](deployment.md) — 中转站部署与风险
- [docs/go-live.md](go-live.md) — 生产上线与域名路由
