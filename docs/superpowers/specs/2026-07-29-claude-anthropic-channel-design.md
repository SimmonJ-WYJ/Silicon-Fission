# Claude / Anthropic 简化渠道设计

## 目标

让管理员无需进入 new-api 完整后台，即可在 Silicon Fission 的 `/admin` 简化后台创建 Claude / Anthropic 原生协议渠道。现有 OpenAI 兼容渠道行为保持不变。

## 范围

- 在“上游预设”中新增 `Claude / Anthropic`。
- 选择该预设时，将表单切换到 Anthropic 渠道协议。
- 管理接口接收显式的渠道协议，并将 Anthropic 映射为 new-api 的 Anthropic 渠道类型。
- BananaRouter 场景允许管理员填写 `https://api.bananarouter.com`、对应上游 Key，以及逗号分隔的 Claude 模型名。
- 渠道创建成功后，用户继续使用本站统一 Key 和 `/v1/chat/completions`；协议转换由 new-api 完成。

不在本次范围内：通用协议下拉框、渠道编辑、图片协议、模型真实性验证和自动部署配置变更。

## 方案

### 前端

为每个预设增加 `protocol` 元数据，值限定为 `openai` 或 `anthropic`。现有预设均使用 `openai`，新增预设使用 `anthropic`。提交表单时把所选预设的 `protocol` 一同发送，避免根据名称或 URL 猜测协议。

Claude 预设不绑定某家供应商的默认 Base URL 或模型，管理员按实际上游填写。这可同时支持 Anthropic 官方和 BananaRouter 等兼容 `/v1/messages` 的上游。

### API

`POST /api/admin/channels` 接受可选 `protocol`：

- 缺省或 `openai`：保持当前 new-api 渠道类型 `1`。
- `anthropic`：使用 new-api Anthropic 渠道类型 `14`。
- 其他值：返回 HTTP 400，不向 new-api 发送请求。

Demo 模式继续保存现有展示字段；协议只影响真实 new-api 渠道创建。

## 数据流

1. 管理员选择 Claude / Anthropic 预设。
2. 前端填入名称、Base URL、Key 和 Claude 模型列表，并提交 `protocol: "anthropic"`。
3. 管理 API 校验字段与协议，将协议映射为 new-api 渠道类型。
4. new-api 保存渠道，并在用户通过统一 OpenAI 兼容入口调用 Claude 模型时完成协议转换。

## 错误处理

- 名称、Key 或模型缺失：沿用现有 400 错误。
- 未知协议：返回明确的“不支持的渠道协议”400 错误。
- new-api 拒绝创建或不可达：沿用现有错误透传与 502 行为。

## 测试与验收

- 单元测试证明 `openai` 映射为类型 `1`。
- 单元测试证明 `anthropic` 映射为类型 `14`。
- 单元测试证明未知协议被拒绝。
- TypeScript 检查与生产构建通过。
- 页面可见 Claude / Anthropic 预设，选择后提交 Anthropic 协议。
- 现有 OpenAI 兼容预设与渠道创建不回归。
