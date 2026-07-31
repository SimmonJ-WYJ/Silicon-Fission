import { config } from "./config.js";
import { adapters } from "./providers/openai-compatible.js";
import { findModel } from "./registry.js";
import type { ChatRequest, ProviderEndpoint } from "./providers/types.js";

// 路由核心:候选端点排序 → 逐个尝试(供应商 fallback)→ models 链模型降级。
// fallback 仅在尚未向客户端写出任何字节前发生(见 SPEC 3.3)。

export interface Attempt {
  provider: string;
  model: string;
  status: number | "network_error";
  latencyMs: number;
}

export interface RouteResult {
  response: Response;
  provider: string;
  model: string;
  attempts: Attempt[];
}

export class RouteError extends Error {
  constructor(message: string, public status: number, public attempts: Attempt[] = []) {
    super(message);
  }
}

interface ProviderPrefs {
  order?: string[];
  ignore?: string[];
  sort?: "price" | "throughput" | "latency";
}

function sortEndpoints(endpoints: ProviderEndpoint[], prefs: ProviderPrefs): ProviderEndpoint[] {
  let list = endpoints.filter((e) => config.providerKeys[e.provider] && adapters[e.provider]);
  if (prefs.ignore?.length) list = list.filter((e) => !prefs.ignore!.includes(e.provider));
  if (prefs.order?.length) {
    const rank = (p: string) => {
      const i = prefs.order!.indexOf(p);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...list].sort((a, b) => rank(a.provider) - rank(b.provider));
  }
  // 默认价格优先(输入+输出均价);throughput/latency 排序待健康度信号上线后接入
  return [...list].sort(
    (a, b) => a.inputPrice + a.outputPrice - (b.inputPrice + b.outputPrice),
  );
}

/** 单个模型内的供应商 fallback */
async function tryModel(modelId: string, req: ChatRequest, attempts: Attempt[]): Promise<RouteResult | null> {
  const model = findModel(modelId);
  if (!model) throw new RouteError(`Model not found: ${modelId}`, 404, attempts);

  const prefs = (req.provider ?? {}) as ProviderPrefs;
  const candidates = sortEndpoints(model.endpoints, prefs);
  if (candidates.length === 0) {
    throw new RouteError(`No configured provider for model: ${modelId}`, 503, attempts);
  }

  for (const ep of candidates) {
    const start = Date.now();
    try {
      const res = await adapters[ep.provider].chat(req, ep.upstreamModel, config.providerKeys[ep.provider], ep.path);
      const latencyMs = Date.now() - start;
      attempts.push({ provider: ep.provider, model: modelId, status: res.status, latencyMs });
      // 5xx / 429 → 换下一家;4xx 属请求本身问题,直接透传给客户端
      if (res.ok || (res.status < 500 && res.status !== 429)) {
        return { response: res, provider: ep.provider, model: modelId, attempts };
      }
      await res.body?.cancel();
    } catch {
      attempts.push({ provider: ep.provider, model: modelId, status: "network_error", latencyMs: Date.now() - start });
    }
  }
  return null; // 该模型所有供应商都失败,交给上层做模型降级
}

/** 入口:供应商 fallback + models 链模型降级 */
export async function route(req: ChatRequest): Promise<RouteResult> {
  const chain = [req.model, ...((req.models as string[] | undefined) ?? [])].filter(
    (m, i, arr) => m && arr.indexOf(m) === i,
  );
  const attempts: Attempt[] = [];
  for (const modelId of chain) {
    const result = await tryModel(modelId, req, attempts);
    if (result) return result;
  }
  throw new RouteError("All providers failed for requested model(s)", 502, attempts);
}
