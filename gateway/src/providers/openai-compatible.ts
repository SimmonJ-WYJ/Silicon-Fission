import type { ChatRequest, ProviderAdapter } from "./types.js";

// 通用 OpenAI 兼容适配器:DeepSeek、SiliconFlow、Moonshot、OpenAI 等
// 均暴露 /chat/completions,仅 baseUrl 与鉴权不同。

export function openAICompatible(id: string, baseUrl: string): ProviderAdapter {
  return {
    id,
    baseUrl,
    async chat(req: ChatRequest, upstreamModel: string, apiKey: string): Promise<Response> {
      const { models: _models, provider: _provider, ...payload } = req;
      return fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ ...payload, model: upstreamModel }),
      });
    },
  };
}

export const adapters: Record<string, ProviderAdapter> = {
  deepseek: openAICompatible("deepseek", "https://api.deepseek.com/v1"),
  siliconflow: openAICompatible("siliconflow", "https://api.siliconflow.cn/v1"),
  moonshot: openAICompatible("moonshot", "https://api.moonshot.cn/v1"),
  openai: openAICompatible("openai", "https://api.openai.com/v1"),
};
