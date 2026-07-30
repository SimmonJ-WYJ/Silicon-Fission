# 硅基裂变 · 快速起站部署指南

目标:几天内上线一个可对外收费的中转站,**让中国用户不翻墙即可调用国外先进模型**(GPT / Claude / Gemini)以及国产模型。

本方案基于 [new-api](https://github.com/QuantumNous/new-api) **官方镜像**(不修改源码,规避 AGPL 开源义务),你负责品牌、渠道、支付和网络架构。

---

## 一、核心网络架构:"不翻墙"是怎么做到的

用户端**不需要任何代理**。跨境这一跳由你的服务器完成:

```
中国用户                         你的中转站                        上游模型
(不翻墙)                                                          
  │  base_url = https://api.siliconfission.com/v1
  │  Authorization: Bearer sk-你发的Key                           
  ▼                                                               
[入口层] ── 国内可达的域名/节点 ──> [new-api 网关] ── 出海 ──> api.openai.com
                                          │                      api.anthropic.com
                                          │                      国产模型(直连国内)
                                          ▼
                                    用户/令牌/计费/渠道管理
```

要让它跑通,必须解决**两个独立**的网络问题:

### 1. 出海(egress):服务器要能访问 `api.openai.com`
两种做法,任选:
- **服务器直接放境外**(香港 / 新加坡 / 美西):最简单,本身就能出海。
- **给境外渠道单独配代理**:在 new-api 后台「渠道 → 编辑 → 代理设置」里,为 OpenAI/Claude 渠道填一个出海代理地址。这样服务器可以放在任何地方,只有国外渠道走代理。粒度更细,推荐。
  (也可用 `docker-compose.yml` 里的 `HTTP_PROXY` 给整个进程设代理,但会影响国产渠道,不推荐。)

### 2. 入口:用户连你的域名不能被墙
- **推荐起步**:香港 / 新加坡 VPS。国内直连延迟可接受(通常 30–80ms),且天然能出海,一台机器同时解决入口和出海。
- **进阶**:国内节点做入口反向代理 + 境外节点出海;或套一层国内可用的 CDN。延迟更低但架构更复杂,验证期不必上。

> 起步最省事的组合:**一台香港/新加坡 VPS + 一个未被墙的域名 + HTTPS 证书**,入口和出海一次解决。

---

## 二、部署步骤

```bash
# 1. 准备一台 Linux 服务器(建议 2C4G 起,香港/新加坡),装好 Docker
cd deploy
cp .env.example .env
# 2. 编辑 .env,把所有 CHANGE_ME 改成强随机值:
#    openssl rand -hex 32   # 生成 SESSION_SECRET 等
vim .env

# 3. 启动
docker compose up -d
docker compose logs -f new-api   # 看启动日志

# 4. 浏览器打开 http://<服务器IP>:3000
#    首次用初始管理员账号登录(new-api 默认 root / 首次启动日志里会打印初始密码),
#    立刻改密码。
```

生产上线前:
- 用 Nginx / Caddy 挂 HTTPS(Let's Encrypt),把 3000 端口藏到反代后面。
- `.env` 里所有密码换成强随机值;数据库端口不要对公网开放(compose 默认已不暴露)。

---

## 三、配置渠道(接入模型)

后台「渠道」里为每个上游添加一个渠道。你需要**自己合法取得各家的 API Key**:

| 模型类型 | 上游 | 获取方式 | 是否需要出海代理 |
|---|---|---|---|
| GPT 系列 | OpenAI | platform.openai.com(官方,需境外支付) | 是 |
| Claude 系列 | Anthropic | console.anthropic.com | 是 |
| Gemini | Google AI Studio | aistudio.google.com | 是 |
| DeepSeek | DeepSeek | platform.deepseek.com | 否(国内直连) |
| Qwen / 通义 | 阿里百炼 | bailian.console.aliyun.com | 否 |
| Kimi | Moonshot | platform.moonshot.cn | 否 |
| 多模型聚合 | SiliconFlow | siliconflow.cn | 否 |

要点:
- 一个模型可以配**多个渠道**,new-api 按权重随机 + 失败重试,渠道越多越稳(应对封号)。
- 用「分组」把不同价位/质量的渠道分开,给不同等级用户不同分组。
- 「模型倍率」控制每个模型对用户的计费价,这是你的定价与利润来源。

---

## 四、开通对外收费

- new-api 内置**用户系统 + 令牌(API Key)管理 + 额度/充值 + 兑换码**。
- 在线支付:new-api 支持对接易支付(彩虹易支付等)实现支付宝/微信充值,后台「支付设置」配置。
- 计费:用户消费从余额扣除;你的利润 = 用户计费价(模型倍率) − 上游实际成本 − 支付手续费。

---

## 五、上线前必读的三个风险

1. **上游封号**:OpenAI/Anthropic 官方不服务中国大陆,转售其额度违反 ToS,渠道可能被封。对策:多渠道冗余、监控可用性、准备备用号。
2. **国内合规**:面向公众提供未备案的境外大模型,处于监管灰色地带。自行评估法律风险,必要时咨询专业意见。
3. **AGPL**:本方案用官方镜像、**未改源码**,合规。一旦你要 fork 修改 new-api 并对外服务,需公开你的改动,或联系作者(support@quantumnous.com)购买商业授权。若要做闭源差异化产品,走本仓库 `gateway/` 的自研路线。

---

## 六、这和自研 gateway 的关系

- `deploy/`(本目录):用 new-api **快速验证需求、跑现金流**。可弃、合规、一两天上线。
- `gateway/`:自研网关内核,是你**能闭源、能差异化、能卖给企业**的长期资产。等 new-api 验证了市场,再决定投入。

两条腿并行,详见 [SPEC.md](SPEC.md) 的两人团队楔子策略。
