export interface ChannelTypeOption {
  value: number;
  label: string;
}

/** 与 origin/vendor/new-api web/src/features/channels/constants.ts 保持一致。 */
export const CHANNEL_TYPE_OPTIONS: readonly ChannelTypeOption[] = [
  { value: 1, label: "OpenAI" }, { value: 14, label: "Anthropic" },
  { value: 33, label: "AWS" }, { value: 24, label: "Gemini" },
  { value: 43, label: "DeepSeek" }, { value: 3, label: "Azure" },
  { value: 41, label: "Vertex AI" }, { value: 48, label: "xAI" },
  { value: 58, label: "Advanced Custom" }, { value: 42, label: "Mistral" },
  { value: 34, label: "Cohere" }, { value: 20, label: "OpenRouter" },
  { value: 4, label: "Ollama" }, { value: 40, label: "SiliconFlow" },
  { value: 27, label: "Perplexity" }, { value: 25, label: "Moonshot" },
  { value: 17, label: "Ali" }, { value: 26, label: "Zhipu V4" },
  { value: 15, label: "Baidu" }, { value: 46, label: "Baidu V2" },
  { value: 23, label: "Tencent" }, { value: 18, label: "Xunfei" },
  { value: 45, label: "VolcEngine" }, { value: 31, label: "LingYiWanWu" },
  { value: 35, label: "MiniMax" }, { value: 49, label: "Coze" },
  { value: 19, label: "360" }, { value: 47, label: "Xinference" },
  { value: 37, label: "Dify" }, { value: 38, label: "Jina" },
  { value: 39, label: "Cloudflare" }, { value: 8, label: "Custom" },
  { value: 57, label: "ChatGPT Subscription (Codex)" },
  { value: 22, label: "FastGPT" }, { value: 44, label: "MokaAI" },
  { value: 2, label: "MjProxy" }, { value: 5, label: "MjProxyPlus" },
  { value: 36, label: "SunoAPI" }, { value: 50, label: "Kling" },
  { value: 51, label: "Jimeng" }, { value: 52, label: "Vidu" },
  { value: 53, label: "Submodel" }, { value: 54, label: "DoubaoVideo" },
  { value: 55, label: "Sora" }, { value: 56, label: "Replicate" },
] as const;

export const CHANNEL_TYPE_IDS = new Set(CHANNEL_TYPE_OPTIONS.map((option) => option.value));

export const CHANNEL_KEY_HINTS: Readonly<Record<number, string>> = {
  15: "APIKey|SecretKey",
  18: "APPID|APISecret|APIKey",
  22: "APIKey-AppId",
  23: "AppId|SecretId|SecretKey",
  33: "Ak|Sk|Region",
  50: "AccessKey|SecretKey",
  51: "Access Key ID|Secret Access Key",
  57: "粘贴 Codex OAuth JSON 凭证",
};

export function channelTypeLabel(type: number): string {
  return CHANNEL_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? `类型 ${type}`;
}
