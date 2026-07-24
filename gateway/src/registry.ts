import type { ProviderEndpoint } from "./providers/types.js";

// 模型注册表:网关对外模型 ID → 各供应商端点(含价格,用于价格优先路由)。
// M1 起改为数据库 + 定时同步上游价格;M0 先静态维护。

export interface ModelEntry {
  id: string;
  name: string;
  endpoints: ProviderEndpoint[];
}

export const registry: ModelEntry[] = [
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    endpoints: [
      { provider: "deepseek", upstreamModel: "deepseek-chat", inputPrice: 0.27, outputPrice: 1.1, contextLength: 128_000 },
      { provider: "siliconflow", upstreamModel: "deepseek-ai/DeepSeek-V3", inputPrice: 0.35, outputPrice: 1.4, contextLength: 128_000 },
    ],
  },
  {
    id: "deepseek/deepseek-reasoner",
    name: "DeepSeek R1",
    endpoints: [
      { provider: "deepseek", upstreamModel: "deepseek-reasoner", inputPrice: 0.55, outputPrice: 2.19, contextLength: 128_000 },
      { provider: "siliconflow", upstreamModel: "deepseek-ai/DeepSeek-R1", inputPrice: 0.6, outputPrice: 2.4, contextLength: 128_000 },
    ],
  },
  {
    id: "qwen/qwen2.5-72b-instruct",
    name: "Qwen2.5 72B Instruct",
    endpoints: [
      { provider: "siliconflow", upstreamModel: "Qwen/Qwen2.5-72B-Instruct", inputPrice: 0.57, outputPrice: 0.57, contextLength: 32_000 },
    ],
  },
  {
    id: "moonshot/kimi-k2",
    name: "Kimi K2",
    endpoints: [
      { provider: "moonshot", upstreamModel: "kimi-k2-0711-preview", inputPrice: 0.6, outputPrice: 2.5, contextLength: 128_000 },
    ],
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o mini",
    endpoints: [
      { provider: "openai", upstreamModel: "gpt-4o-mini", inputPrice: 0.15, outputPrice: 0.6, contextLength: 128_000 },
    ],
  },
];

export function findModel(id: string): ModelEntry | undefined {
  return registry.find((m) => m.id === id);
}
