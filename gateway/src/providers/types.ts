// 供应商适配层的统一契约。
// M0 阶段所有上游都走 OpenAI 兼容协议;后续非兼容协议(如 Anthropic 原生)
// 各自实现 ProviderAdapter 完成双向转换。

export interface ProviderEndpoint {
  /** 供应商 ID,如 "deepseek" | "siliconflow" | "openai" */
  provider: string;
  /** 上游真实模型名(与网关对外模型名可能不同) */
  upstreamModel: string;
  /** 每百万输入 token 价格,单位 USD */
  inputPrice: number;
  /** 每百万输出 token 价格,单位 USD */
  outputPrice: number;
  /** 上下文窗口 */
  contextLength: number;
}

export interface ChatRequest {
  model: string;
  messages: unknown[];
  stream?: boolean;
  [key: string]: unknown;
}

export interface ProviderAdapter {
  id: string;
  baseUrl: string;
  /** 发起上游请求,返回原始 Response(流式/非流式均透传) */
  chat(req: ChatRequest, upstreamModel: string, apiKey: string): Promise<Response>;
}
