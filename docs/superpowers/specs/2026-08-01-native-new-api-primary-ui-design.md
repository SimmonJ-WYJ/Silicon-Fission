# 原生 New API 主站切换设计

## 目标

让 `siliconfission.com` 直接展示 New API 原生前端，保留现有数据库中的用户、余额、API Key、渠道和模型配置；`api.siliconfission.com` 继续由自定义网关提供模型 API。

## 路由

- `https://siliconfission.com` → `new-api:3000`
- `https://www.siliconfission.com/*` → 永久跳转到同路径的 `https://siliconfission.com/*`
- `https://api.siliconfission.com` → `gateway:8788`，保持不变

## 数据与回滚

本次只改入口路由，不迁移或清空数据库。旧 `web/` 工程保留在仓库作为回滚来源，但不再承接公网流量。回滚时恢复原 DNS/Vercel 路由即可。
