# 硅基裂变 · Silicon Fission

**一个 API Key,裂变出所有大模型的算力。**

Silicon Fission 是一个 LLM 统一 API 网关(OpenRouter 竞品):OpenAI 兼容的统一入口,聚合国内外主流大模型,提供智能路由、自动容灾 fallback、统一计费与用量分析。

- 📄 产品与技术规格:[docs/SPEC.md](docs/SPEC.md)
- 🔍 OpenRouter 竞品分析:[docs/openrouter-analysis.md](docs/openrouter-analysis.md)

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
