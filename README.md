# 硅基裂变 · Silicon Fission

**一个 API Key,裂变出所有大模型的算力。**

Silicon Fission 是一个 LLM 统一 API 网关(OpenRouter 竞品):OpenAI 兼容的统一入口,聚合国内外主流大模型,提供智能路由、自动容灾 fallback、统一计费与用量分析。

- 📘 **功能文档(所有已实现功能总览)**:[docs/FEATURES.md](docs/FEATURES.md)
- 🚀 快速起站部署(让中国用户不翻墙用国外模型):[docs/deployment.md](docs/deployment.md)
- 📄 产品与技术规格:[docs/SPEC.md](docs/SPEC.md)
- 🔍 OpenRouter 竞品分析:[docs/openrouter-analysis.md](docs/openrouter-analysis.md)

## 两条并行路线

- **`deploy/` — 快速起站**:基于 [new-api](https://github.com/QuantumNous/new-api) 官方镜像(不改源码,规避 AGPL),一两天上线一个可对外收费的中转站,用于验证需求、跑现金流。详见 [部署指南](docs/deployment.md)。
- **`gateway/` — 自研网关**:可闭源、可差异化、可卖给企业的长期资产。等 new-api 验证市场后再加大投入。
- **`web/` — Web 控制台**:OpenRouter 风格的前端(Next.js + Tailwind,白色主题),首页 / 模型市场 / 对话 Playground / 登录注册 / 控制台 / 渠道配置 / 充值,通过 API 对接后端。内置**演示模式**——不配后端也能完整体验登录到工作台的全流程。**这是你自己的闭源前端资产**。详见 [web/README.md](web/README.md) 与 [功能文档](docs/FEATURES.md)。

## 当前状态

M0 骨架阶段:OpenAI 兼容网关内核已可运行 —— 模型注册表、价格优先的供应商路由、跨供应商自动 fallback、SSE 流式透传。

## 快速开始

```bash
cd gateway
npm install
cp .env.example .env   # 填入上游供应商的 API Key
npm run dev            # 默认监听 http://localhost:8788
```

调用(与 OpenAI SDK 完全兼容,换 base URL 即可):

```bash
curl http://localhost:8788/v1/chat/completions \
  -H "Authorization: Bearer $SF_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/deepseek-chat",
    "messages": [{"role": "user", "content": "你好,介绍一下你自己"}],
    "stream": true
  }'
```

列出模型目录:

```bash
curl http://localhost:8788/v1/models -H "Authorization: Bearer $SF_MASTER_KEY"
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
