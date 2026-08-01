# 生产环境上线指南

当前生产架构：

- `https://你的域名.com`：New API 原生前台和管理后台
- `https://www.你的域名.com`：永久跳转到主域名，并保留访问路径
- `https://api.你的域名.com`：SiliconFission API 网关
- PostgreSQL 与 Redis 数据保存在 Docker volumes 中
- 不再使用 Vercel 或旧自定义前端壳

## 1. 配置 DNS

将以下记录解析到服务器公网 IP：

```text
A      @      服务器公网 IP
A      www    服务器公网 IP
A      api    服务器公网 IP
```

## 2. 配置生产环境变量

首次部署时执行：

```bash
cd deploy/production
cp .env.example .env
```

编辑 `.env`，其中 `DOMAIN` 必须填写主域名，不要包含 `api.`：

```dotenv
DOMAIN=yourdomain.com
```

已经运行的生产环境不要覆盖原有 `.env`，只需确认 `DOMAIN` 是主域名。

## 3. 启动或更新服务

```bash
cd deploy/production
docker compose up -d --build
docker compose ps
```

更新代码后使用：

```bash
git pull --ff-only
cd deploy/production
docker compose up -d --build
```

## 4. 验证路由

将示例域名替换为真实域名：

```bash
curl -I https://yourdomain.com
curl -I https://www.yourdomain.com/login
curl -I https://api.yourdomain.com/v1/models
```

预期结果：

- 主域名返回 New API 页面
- `www` 返回永久重定向，并保留 `/login` 路径
- `api` 子域名访问 API 网关

## 5. 数据安全

本次路由调整不会清空 New API 的用户、渠道、模型、Key、额度或日志数据。

生产环境禁止执行：

```bash
docker compose down -v
```

也不要删除 PostgreSQL、Redis 的 Docker volumes，或用示例文件覆盖生产 `.env`。

## 6. 管理入口

- 用户和管理员界面：`https://yourdomain.com`
- 程序调用地址：`https://api.yourdomain.com/v1`

管理员登录主域名后，直接使用 New API 原生管理功能。
