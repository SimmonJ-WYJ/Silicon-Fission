// 倍率/价格配置的数据转换层。
// new-api 把倍率存成 option key-value，值是 JSON 字符串：
//   ModelRatio       {"gpt-4o": 2.5}         输入倍率（相对基准价）
//   CompletionRatio  {"gpt-4o": 4}           输出倍率（相对该模型输入价）
//   ModelPrice       {"gpt-4o": 0.03}        按次计费，设了它就忽略上面两个
// 这里把三张分散的表拍平成「一行一个模型」，方便 UI 编辑。

/** new-api 的基准价：倍率 1 = $0.002 / 1K tokens */
export const BASE_PRICE_PER_1K = 0.002;

/** 展示汇率；New API 的实际结算仍以美元等值额度为准。 */
export const USD_TO_CNY = 7.2;

export interface ModelPricingRow {
  model: string;
  /** 输入倍率，null 表示未配置 */
  inputRatio: number | null;
  /** 输出倍率，null 表示未配置（new-api 默认按 1 算） */
  outputRatio: number | null;
  /** 按次计费单价（美元），非 null 时优先于倍率 */
  perCallPrice: number | null;
}

export interface PricingTables {
  modelRatio: Record<string, number>;
  completionRatio: Record<string, number>;
  modelPrice: Record<string, number>;
}

/** 解析 option 里的 JSON 字符串，坏数据一律当空表处理，不让整页崩掉 */
export function parseRatioJson(raw: unknown): Record<string, number> {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** 把三张表拍平成按模型名排序的行列表 */
export function toPricingRows(tables: PricingTables): ModelPricingRow[] {
  const models = new Set([
    ...Object.keys(tables.modelRatio),
    ...Object.keys(tables.completionRatio),
    ...Object.keys(tables.modelPrice),
  ]);

  return [...models].sort().map((model) => ({
    model,
    inputRatio: tables.modelRatio[model] ?? null,
    outputRatio: tables.completionRatio[model] ?? null,
    perCallPrice: tables.modelPrice[model] ?? null,
  }));
}

/** 行列表还原成三张表，null 的字段不写回（等于从 option 里删掉该模型） */
export function fromPricingRows(rows: ModelPricingRow[]): PricingTables {
  const modelRatio: Record<string, number> = {};
  const completionRatio: Record<string, number> = {};
  const modelPrice: Record<string, number> = {};

  for (const row of rows) {
    const model = row.model.trim();
    if (!model) continue;
    if (row.inputRatio !== null) modelRatio[model] = row.inputRatio;
    if (row.outputRatio !== null) completionRatio[model] = row.outputRatio;
    if (row.perCallPrice !== null) modelPrice[model] = row.perCallPrice;
  }

  return { modelRatio, completionRatio, modelPrice };
}

/** 倍率换算成「每百万 token 多少美元」，给 UI 显示真实价格用 */
export function ratioToUsdPerMillion(ratio: number): number {
  return ratio * BASE_PRICE_PER_1K * 1000;
}

export function usdToCny(usd: number): number {
  return usd * USD_TO_CNY;
}

/** 计算某一行的实际单价，返回 null 表示该模型未配置价格 */
export function rowPriceUsdPerMillion(
  row: ModelPricingRow,
): { input: number; output: number } | null {
  if (row.inputRatio === null) return null;
  const input = ratioToUsdPerMillion(row.inputRatio);
  // new-api 语义：输出倍率是相对该模型输入价的倍数，缺省按 1
  const output = input * (row.outputRatio ?? 1);
  return { input, output };
}

/** 校验单行，返回错误信息或 null */
export function validatePricingRow(row: ModelPricingRow): string | null {
  if (!row.model.trim()) return "模型名不能为空";

  for (const [label, value] of [
    ["输入倍率", row.inputRatio],
    ["输出倍率", row.outputRatio],
    ["按次单价", row.perCallPrice],
  ] as const) {
    if (value === null) continue;
    if (!Number.isFinite(value)) return `${label}必须是数字`;
    if (value < 0) return `${label}不能为负数`;
  }

  if (row.perCallPrice === null && row.inputRatio === null) {
    return "请至少填写输入倍率或按次单价";
  }
  return null;
}
