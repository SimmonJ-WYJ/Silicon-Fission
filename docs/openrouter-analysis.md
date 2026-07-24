# OpenRouter 竞品分析

> 调研对象:https://openrouter.ai/
> 调研时间:2026-07
> 目的:为「硅基裂变 (Silicon Fission)」立项提供功能对标依据。

## 1. OpenRouter 是什么

OpenRouter 是一个 **LLM 统一网关(API 中转站 / LLM Gateway)**:开发者用一个 API Key、一个 OpenAI 兼容的接口(`https://openrouter.ai/api/v1`),即可访问 400+ 模型、70+ 上游供应商(OpenAI、Anthropic、Google、Meta、DeepSeek、Mistral、xAI 等),无需分别注册各家账号、维护各家 SDK 和计费。

核心价值主张:
- **一个接口,所有模型**:OpenAI SDK 直接换 base URL 就能用,迁移成本≈0。
- **更高可用性**:同一模型在多家供应商之间自动容灾切换,聚合各家的 uptime。
- **更优价格/性能**:默认路由到最便宜的稳定供应商,也可按吞吐/延迟排序。
- **统一计费**:充值一次(Credits),按各供应商原价透传计费,不加模型差价。

## 2. 功能清单(对标项)

### 2.1 API 层
| 功能 | 说明 |
|---|---|
| OpenAI 兼容接口 | `/api/v1/chat/completions`、`/completions`、`/models`,兼容 OpenAI SDK/生态工具 |
| 流式输出 (SSE) | 全模型统一的 streaming 体验 |
| 工具调用 (Tool / Function Calling) | 跨模型统一的 tools 协议 |
| 结构化输出 | JSON Schema / response_format 统一支持 |
| 多模态 | 图片输入、PDF 输入、部分模型的图像生成 |
| Reasoning tokens | 统一暴露推理模型的思维链 token 与参数 |
| Prompt Caching 透传 | 透传各供应商的提示词缓存折扣 |
| 插件能力 | 如 Web Search 插件,为任意模型附加联网搜索 |

### 2.2 路由层(核心壁垒)
| 功能 | 说明 |
|---|---|
| Provider Routing | 同一模型多供应商:默认按价格路由(cheapest stable),可 `sort: price/throughput/latency`,可指定/排除供应商 |
| Provider Fallback | 供应商 5xx、限流、超时、内容审核拦截、上下文超限时自动切换下一家 |
| Model Fallback | 请求级 `models: [a, b, c]` 备选链,主模型失败自动降级 |
| Auto Router | `openrouter/auto`:按 prompt 自动挑选合适模型 |
| 模型变体后缀 | `:free`、`:nitro`(最快)、`:floor`(最便宜)、`:online`(联网)等 |
| ZDR / 数据策略路由 | 可要求仅路由到零数据保留(Zero Data Retention)的供应商 |

### 2.3 账务与商业化
| 功能 | 说明 |
|---|---|
| Credits 预付费 | 一次充值全平台通用,余额不过期 |
| 定价透传 + 充值手续费 | 推理按供应商列表价透传,购买 Credits 收约 5.5% 手续费(商业模式核心)|
| BYOK | 用户可带自己的上游 Key,收取该用量约 5% 的服务费;可设为「仅作 fallback」 |
| 用量计量 | 响应内返回 usage(含成本);Activity 页可看每 App/Key/模型的花费 |
| API Key 管理 | 多 Key、额度上限、Provisioning API(程序化发 Key,适合平台型客户)|
| 组织/团队 | 组织级账单、成员管理 |
| 免费额度 | `:free` 模型 + 新用户少量赠送,获客手段 |

### 2.4 平台与生态
| 功能 | 说明 |
|---|---|
| 模型目录 | 每个模型的价格、上下文、供应商、延迟/吞吐实时数据 |
| Rankings / 榜单 | 按真实 token 用量的模型/App 排行榜(公共流量入口,内容营销壁垒)|
| Chatroom / Playground | 网页端多模型对比聊天 |
| Presets | 服务端保存的参数/路由预设,业务方免改代码切配置 |
| OAuth PKCE | 第三方 App 可让终端用户授权用自己的 OpenRouter 余额付费 |
| 数据政策 | 默认不记录 prompt/completion 正文;可选折扣换日志 |
| Uptime/状态页、文档 | 完整开发者体验 |

## 3. 商业模式拆解

1. **充值手续费(~5.5%)**:主要收入。推理本身不加价,靠「聚合便利性」收过路费。
2. **BYOK 服务费(~5%)**:留住自带 Key 的大客户。
3. **流量与数据侧资产**:Rankings/目录形成 SEO 和行业影响力,反哺获客;真实用量数据是稀缺资源。

## 4. 可攻击的差异化机会(硅基裂变切入点)

1. **中国市场本土化**:人民币计费(微信/支付宝)、国内可达网络、中文控制台与文档、发票/合规;优先接入国产模型(DeepSeek、Qwen、GLM、Kimi、豆包、MiniMax、阶跃等)+ 海外模型统一出口。
2. **更透明的路由**:响应头/控制台展示实际命中的供应商、重试链路、每跳延迟——OpenRouter 在这点上是黑盒。
3. **企业友好**:私有化部署版网关、预算/配额中心、部门级分账、审计日志。
4. **开发者体验**:更细的费用归因(per-request cost)、请求回放与调试、内置 eval/对比工具。
5. **价格策略**:更低充值费率或阶梯费率,BYOK 首档免费额度更慷慨。

## 5. 风险

- 上游供应商政策变化(禁止转售、区域限制)。
- 低毛利(过路费模式)要求极高的自动化运维与规模。
- 与云厂商网关(Bedrock、Vertex)及开源网关(LiteLLM、One API/new-api)的双向竞争。

## 参考来源

- [OpenRouter FAQ](https://openrouter.ai/docs/faq)
- [OpenRouter Blog: LLM Gateway](https://openrouter.ai/blog/insights/llm-gateway/)
- [OpenRouter Blog: Model Routing](https://openrouter.ai/blog/insights/model-routing/)
- [OpenRouter Blog: Reliability & Failover](https://openrouter.ai/blog/insights/reliability-failover/)
- [OpenRouter Docs: BYOK](https://openrouter.ai/docs/guides/overview/auth/byok)
- [TrueFoundry: OpenRouter Pricing](https://www.truefoundry.com/blog/openrouter-pricing)
- [Merge.dev: What is OpenRouter](https://www.merge.dev/blog/what-is-openrouter)
- [DataCamp: OpenRouter Guide](https://www.datacamp.com/tutorial/openrouter)
