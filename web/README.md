# 硅基裂变 · Web 控制台

OpenRouter 风格的前端(Next.js 16 + Tailwind v4,深色主题)。**这是你自己的、可闭源的前端**,通过 HTTP API 对接后端(自研 `gateway/` 或 new-api),不修改 new-api 源码,因此不受其 AGPL 约束。

## 页面

| 路由 | 说明 |
|---|---|
| `/` | 首页:Hero、平台数据、热门模型、SDK 兼容示例 |
| `/models` | 模型市场:侧边筛选(线路/系列)+ 排序 + 卡片网格 |
| `/models/[id]` | 模型详情:参数、供应商与价格表 |
| `/chat` | 对话 Playground:多模型,直连网关 `/v1/chat/completions` |
| `/rankings` | 模型榜单:按用量排名 |
| `/dashboard` | 控制台:余额、用量图表、API Key 管理 |

## 本地运行

```bash
cd web
npm install
npm run dev          # http://localhost:3001
```

## 对接后端

当前用 `lib/models.ts` 的 mock 数据。上线时:

1. 在 `lib/api.ts` 里把 `getModels()` 改成 `fetch(后端 /v1/models)`。
2. 设置环境变量 `NEXT_PUBLIC_API_BASE` 指向你的网关地址(Playground 与真实请求都走它)。

```bash
NEXT_PUBLIC_API_BASE=https://api.你的域名.com npm run build
```

## 设计说明

- 深色设计系统集中在 `app/globals.css`(`@theme` 颜色变量 + 品牌渐变)。
- 布局/交互对标 OpenRouter(模型市场、榜单、Playground、控制台),品牌为「硅基裂变」,非克隆。
- 组件在 `components/`,数据层在 `lib/`,页面在 `app/`。
