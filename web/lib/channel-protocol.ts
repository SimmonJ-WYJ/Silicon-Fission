export type ChannelProtocol = "openai" | "anthropic" | "zhipu-v4";

const BIGMODEL_ROOT = "https://open.bigmodel.cn";
const BIGMODEL_URL_ERROR =
  "智谱 GLM / BigModel V4 请填写根地址 https://open.bigmodel.cn，不要填写 /api/paas/v4、/v1 或 /chat/completions。";

export function parseChannelProtocol(value: unknown): ChannelProtocol | null {
  if (value === undefined || value === "openai") return "openai";
  if (value === "anthropic" || value === "zhipu-v4") return value;
  return null;
}

export function protocolForChannelType(value: unknown): ChannelProtocol {
  const type = Number(value);
  if (type === 14) return "anthropic";
  if (type === 26) return "zhipu-v4";
  return "openai";
}

export function channelTypeForProtocol(protocol: ChannelProtocol): number {
  switch (protocol) {
    case "openai":
      return 1;
    case "anthropic":
      return 14;
    case "zhipu-v4":
      return 26;
  }
}

export function normalizeChannelBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function validateChannelBaseUrl(
  protocol: ChannelProtocol,
  baseUrl: string,
): string | null {
  const normalized = normalizeChannelBaseUrl(baseUrl);

  if (protocol === "zhipu-v4") {
    return normalized === BIGMODEL_ROOT ? null : BIGMODEL_URL_ERROR;
  }

  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
    return null;
  } catch {
    return "上游 Base URL 必须是以 http:// 或 https:// 开头的完整地址。";
  }
}

export function channelEndpointPreview(
  protocol: ChannelProtocol,
  baseUrl: string,
): string {
  const normalized = normalizeChannelBaseUrl(baseUrl);
  if (!normalized) return "留空时由上游默认地址决定";

  switch (protocol) {
    case "openai":
      return `${normalized}/v1/chat/completions`;
    case "anthropic":
      return `${normalized}/v1/messages`;
    case "zhipu-v4":
      return `${normalized}/api/paas/v4/chat/completions`;
  }
}

export function channelProtocolLabel(protocol: ChannelProtocol): string {
  switch (protocol) {
    case "openai":
      return "OpenAI 兼容（自动拼接 /v1/chat/completions）";
    case "anthropic":
      return "Claude / Anthropic 原生（自动拼接 /v1/messages）";
    case "zhipu-v4":
      return "智谱 GLM / BigModel V4 原生（自动拼接 /api/paas/v4/chat/completions）";
  }
}
