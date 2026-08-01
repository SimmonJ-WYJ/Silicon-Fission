# 硅基裂变 · Silicon Fission

**一个 API Key,裂变出所有大模型的算力。**

Silicon Fission 是一个 LLM 统一 API 网关(OpenRouter 竞品):OpenAI 兼容的统一入口,聚合国内外主流大模型,提供智能路由、自动容灾 fallback、统一计费与用量分析。

## 访问地址

| 用途 | 地址 |
|---|---|
| 🌐 用户与管理配置平台(New API 原生前端) | https://siliconfission.com |
| ↪️ www 入口(永久跳转到主域名) | https://www.siliconfission.com |
| 🔌 API 网关(程序调用) | https://api.siliconfission.com |

> 全部服务部署在 VPS,由 Caddy 自动签发 HTTPS 证书。主域名直接呈现 New API 原生界面:普通用户在这里注册、拿 Key、看用量,管理员在这里配置渠道、模型和额度。`www` 会永久跳转到主域名。旧的自研 Next.js 前端(`web/`)已下线,历史代码仍在 git 记录中。

- 🚦 **正式上线手册(VPS 生产部署)**:[docs/go-live.md](docs/go-live.md)
- 📘 **功能文档(所有已实现功能总览)**:[docs/FEATURES.md](docs/FEATURES.md)
- 🧑‍💼 **模型供应商接入指南(新人 onboarding)**:[docs/provider-onboarding.md](docs/provider-onboarding.md)
- 🚀 快速起站部署(让中国用户不翻墙用国外模型):[docs/deployment.md](docs/deployment.md)
- 📄 产品与技术规格:[docs/SPEC.md](docs/SPEC.md)
- 🔍 OpenRouter 竞品分析:[docs/openrouter-analysis.md](docs/openrouter-analysis.md)

## 两条并行路线

- **`deploy/` — 快速起站**:基于 [new-api](https://github.com/QuantumNous/new-api) 官方镜像(不改源码,规避 AGPL),一两天上线一个可对外收费的中转站,用于验证需求、跑现金流。详见 [部署指南](docs/deployment.md)。
- **`gateway/` — 自研网关**:可闭源、可差异化、可卖给企业的长期资产。等 new-api 验证市场后再加大投入。

> 自研 Next.js 前端(`web/`)已于 2026-08-01 下线,主站改用 New API 原生界面,用户配置与管理配置合并在同一个平台。需要找回旧前端时从 git 历史恢复。

## 当前状态

M0 骨架阶段:OpenAI 兼容网关内核已可运行 —— 模型注册表、价格优先的供应商路由、跨供应商自动 fallback、SSE 流式透传。

## 快速开始

```bash
cd gateway
npm install
cp .env.example .env   # 填入上游供应商的 API Key
npm run dev            # 默认监听 http://localhost:8788
```

调用(与 OpenAI SDK 完全兼容,只需替换 base URL):

```bash
curl https://api.siliconfission.com/v1/chat/completions \
  -H "Authorization: Bearer $SF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "你好,介绍一下你自己"}],
    "stream": true
  }'
```

列出模型目录:

```bash
curl https://api.siliconfission.com/v1/models -H "Authorization: Bearer $SF_API_KEY"
```

## 目录结构

```
silicon-fission/
├── docs/                    # 产品 spec 与竞品分析
└── gateway/                 # 网关服务 (Node 20 + TypeScript + Hono)
    └── src/
        ├── index.ts         # 服务入口
        ├── config.ts        # 环境配置
        ├── registry.ts      # 模型注册表(模型 × 供应商 × 价格)
        ├── router.ts        # 路由核心:候选排序 + fallback
        ├── providers/       # 供应商适配层
        ├── routes/          # /v1/chat/completions, /v1/models
        └── middleware/      # 认证等中间件
```

## 路线图

见 [docs/SPEC.md](docs/SPEC.md) 第 4 节:M0 骨架 → M1 MVP(计费/充值/控制台)→ M2 增长(BYOK/Playground)→ M3 企业(分账/私有化)。
