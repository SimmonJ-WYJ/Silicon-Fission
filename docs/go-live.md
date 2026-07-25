# 正式上线手册(Go-Live)

> 目标:把硅基裂变从"演示"变成"正式对用户开放"的生产站。
> 方案:前端在 Vercel,后端在 Vultr/DigitalOcean 服务器,自定义域名 + HTTPS,Postgres 数据库。
> 模型范围:国产 + 境外(GPT/Claude/Gemini)。
> 预计耗时:2–3 小时(含等待 DNS/证书)。

---

## 0. 你需要准备

- [ ] 一张能付 Vultr/DigitalOcean 的**国际信用卡**(或 PayPal)
- [ ] 一个**域名**(在 Namecheap / Cloudflare / 阿里云 等买,几十块/年)
- [ ] 各家模型的 **API Key**(见 [provider-onboarding.md](provider-onboarding.md))
- [ ] 你的 Vercel 项目已部署(前端)

---

## 1. 买服务器(Vultr 为例)

1. 注册 https://www.vultr.com ,绑卡充值(先充 $10 即可)
2. **Deploy New Server** → 类型选 **Cloud Compute – Shared CPU**
3. **Location(地域)**:选离中国近且能出海的 —— **东京 Tokyo / 首尔 Seoul / 新加坡 Singapore**(三者都能直连 OpenAI,且国内访问延迟可接受;可先开一台测延迟)
4. **Image(系统)**:**Ubuntu 24.04 LTS**
5. **Plan(配置)**:选 **2 vCPU / 4 GB** 档(约 $18–24/月)。预算紧可先 2C2G,量大再升
6. 其他默认,**Deploy**。等 2–3 分钟,记下:
   - **公网 IP**
   - **root 密码**(服务器详情页可看)

> DigitalOcean 同理:Create → Droplets → 新加坡 SGP1 → Ubuntu 24.04 → Basic 2vCPU/4GB。

---

## 2. 域名解析到服务器

去你的域名管理后台,加一条 **A 记录**:

| 类型 | 主机记录 | 记录值 |
|---|---|---|
| A | `api`(即 `api.你的域名.com`) | 你的服务器公网 IP |

保存后等生效(几分钟到半小时)。验证:本机 `ping api.你的域名.com` 能解析到你的 IP 即可。

> 前端(Vercel)用你的主域名或 Vercel 默认域名;后端 API 用这个 `api.` 子域名。两者分开。

---

## 3. 放行端口

Vultr/DO 默认不带外部防火墙(系统防火墙也通常放开),一般无需额外操作。若你启用了防火墙,放行:**TCP 80、443**(HTTPS 证书和访问需要),SSH 的 **22**。**不要**对外开放 3000/5432/6379。

---

## 4. 连服务器 + 装 Docker

Mac 终端:

```bash
ssh root@你的公网IP        # 首次输 yes,再输密码(输密码不显示是正常的)

# 装 Docker
curl -fsSL https://get.docker.com | bash
```

---

## 5. 部署生产版后端

```bash
git clone https://github.com/SimmonJ-WYJ/Silicon-Fission.git
cd Silicon-Fission/deploy/production

cp .env.example .env
# 生成随机密码填进去(逐条执行,把输出粘到 .env 对应项;或用下面 sed 一次替换)
sed -i "s/CHANGE_ME_strong_db_password/$(openssl rand -hex 16)/"     .env
sed -i "s/CHANGE_ME_strong_redis_password/$(openssl rand -hex 16)/"  .env
sed -i "s/CHANGE_ME_openssl_rand_hex_32/$(openssl rand -hex 32)/"    .env
# 关键:把 DOMAIN 改成你的真实域名
sed -i "s/api.yourdomain.com/api.你的域名.com/" .env

docker compose up -d
docker compose ps          # 四个容器都 running/healthy
docker compose logs -f caddy   # 看证书签发,出现 certificate obtained 即成功(Ctrl+C 退出)
```

**验证**:浏览器打开 `https://api.你的域名.com` —— 看到 new-api 的初始化向导、且地址栏是**锁标(HTTPS 生效)**,后端就绪。

> Caddy 拿证书要求域名已正确解析到本机、80/443 可达。若一直拿不到证书,先确认第 2、3 步。

---

## 6. 初始化 + 配置模型渠道

方式一(推荐):打开你的 **Vercel 前端** 的 `/admin` 页,它会检测到后端"未初始化" → 填管理员账号 → 自动登录 → 接入渠道。
方式二:直接开 `https://api.你的域名.com` 走 new-api 原生后台。

**接入渠道(国产先行,境外后加):**

1. **国产直连**(简单、合规、便宜,先上这些):
   - DeepSeek:Base `https://api.deepseek.com`,模型 `deepseek-chat,deepseek-reasoner`
   - 通义 / 智谱 / Kimi:见 [provider-onboarding.md](provider-onboarding.md) 表格
2. **境外模型**(在东京/新加坡 IP 上通常可直连;若不通,给该渠道单配代理):
   - OpenAI:Base `https://api.openai.com/v1`,模型 `gpt-4o,gpt-4o-mini`
   - Claude / Gemini:用 new-api 原生后台选对应渠道类型

每加一个渠道点「测试连通」,绿色后再对用户开放。

---

## 7. 把 Vercel 前端指向生产后端

1. Vercel 项目 → **Settings → Environment Variables** → 新增:
   - `NEWAPI_BASE` = `https://api.你的域名.com`
2. **Deployments → 最新一条 → ⋯ → Redeploy**

重新部署后,线上前端的登录/渠道/对话即变为**真实数据**(演示模式自动关闭,紫色横幅消失)。

---

## 8. 全流程验收(上线前必做)

在 Vercel 线上站依次验证:

- [ ] 注册一个新用户 → 能登录
- [ ] 控制台能看到余额、能新建 API Key、能查看完整 Key
- [ ] 对话页选一个真实模型 → 发消息 → 收到**模型真实回答**
- [ ] 该次调用后,控制台"累计消费"有变化(计费生效)
- [ ] 管理员在 `/admin` 能看到渠道、测试连通正常

全绿即可对外开放注册。

---

## 9. 备份与运维(正式站必须)

**每天备份数据库**(用户余额数据,丢了是事故)。在服务器上加一个定时任务:

```bash
# 手动备份一次(在 deploy/production 目录)
docker compose exec -T postgres pg_dump -U sfuser newapi | gzip > backup-$(date +%F).sql.gz

# 建议写进 crontab 每天跑,并把备份同步到对象存储/异地
```

**更新后端镜像**:

```bash
cd Silicon-Fission/deploy/production
docker compose pull && docker compose up -d
```

**看日志 / 重启**:

```bash
docker compose logs -f new-api
docker compose restart new-api
```

---

## 10. 上线后要盯的事

- **渠道健康**:境外渠道可能被上游封,准备多个同类渠道冗余,定期在后台「测试」
- **风控**:防止免费额度被刷(注册验证、限速),new-api 后台可配
- **余额监控**:上游账户余额不足会导致调用失败,设预警
- **合规红线**:境外模型转售涉及上游 ToS 与国内监管风险(见 [deployment.md](deployment.md));收款涉及商户资质

---

## 11. 收款(可选,想真正卖钱时做)

- new-api 后台支持对接**易支付**(彩虹易支付等)实现支付宝/微信充值
- 需要商户号,涉及资质,建议等商业模式验证后再接
- 我们前端的 `/topup` 页目前是演示,接入后可改为真实下单

---

## 快速命令清单

```bash
# 部署
cd Silicon-Fission/deploy/production && docker compose up -d
# 状态 / 日志
docker compose ps
docker compose logs -f
# 备份
docker compose exec -T postgres pg_dump -U sfuser newapi | gzip > backup-$(date +%F).sql.gz
# 更新
docker compose pull && docker compose up -d
```

---

## 相关文档

- [provider-onboarding.md](provider-onboarding.md) — 模型渠道接入与低成本采购
- [FEATURES.md](FEATURES.md) — 平台功能与架构
- [deployment.md](deployment.md) — 部署背景与运营风险
