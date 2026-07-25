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

## 对接后端(已实现:new-api)

前端通过本站的 Next.js API 路由(`app/api/*`)服务端代理到 new-api 后端——浏览器不直接接触后端地址,无 CORS 问题,后端拓扑不暴露。

```bash
# 本地把 new-api 跑在 3000 端口(见 ../deploy),然后:
cd web
echo "NEWAPI_BASE=http://localhost:3000" > .env.local
npm install && npm run dev     # http://localhost:3001
```

已打通的真实功能:

| 页面 | 功能 | 代理路由 → new-api 接口 |
|---|---|---|
| /login | 登录/注册(JWT 存 httpOnly cookie) | `/api/auth/*` → `/api/user/login`、`/api/user/register` |
| /dashboard | 真实余额、API Key 列表/新建/查看完整 Key | `/api/me`、`/api/keys*` → `/api/user/self`、`/api/token/*` |
| /chat | 选真实可用模型,用 sk- Key 发起对话 | `/api/chat` → `/v1/chat/completions` |

使用流程:后台(new-api 管理端)配置渠道 → 用户在本站注册/登录 → 控制台建 Key → Playground 或 OpenAI SDK 调模型 → 账户按量扣费。

额度换算:new-api 默认 500000 quota = $1(见 `lib/newapi-server.ts` 的 `QUOTA_PER_USD`)。

## 设计说明

- 深色设计系统集中在 `app/globals.css`(`@theme` 颜色变量 + 品牌渐变)。
- 布局/交互对标 OpenRouter(模型市场、榜单、Playground、控制台),品牌为「硅基裂变」,非克隆。
- 组件在 `components/`,数据层在 `lib/`,页面在 `app/`。
