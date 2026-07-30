/** New API 默认额度换算：500000 quota = 1 USD。 */
export const QUOTA_PER_USD = 500_000;

export type QuotaAdjustmentAction = "increase" | "decrease";

export interface QuotaAdjustment {
  id: number;
  action: QuotaAdjustmentAction;
  amount: number;
  remark: string;
}

type ParseResult =
  | { ok: true; value: QuotaAdjustment }
  | { ok: false; message: string };

function hasAtMostFourDecimalPlaces(value: number): boolean {
  return Number(value.toFixed(4)) === value;
}

export function parseQuotaAdjustment(input: unknown): ParseResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "参数不合法" };
  }

  const data = input as Record<string, unknown>;
  if (!Number.isSafeInteger(data.id) || (data.id as number) <= 0) {
    return { ok: false, message: "用户 ID 不合法" };
  }
  if (data.action !== "increase" && data.action !== "decrease") {
    return { ok: false, message: "调整类型不合法" };
  }
  if (
    typeof data.amount !== "number" ||
    !Number.isFinite(data.amount) ||
    data.amount <= 0 ||
    !hasAtMostFourDecimalPlaces(data.amount)
  ) {
    return { ok: false, message: "金额必须为正数，且最多保留四位小数" };
  }

  const quotaValue = Math.round(data.amount * QUOTA_PER_USD);
  if (!Number.isSafeInteger(quotaValue) || quotaValue <= 0) {
    return { ok: false, message: "金额超出可调整范围" };
  }

  if (data.remark !== undefined && typeof data.remark !== "string") {
    return { ok: false, message: "备注格式不合法" };
  }
  const remark = typeof data.remark === "string" ? data.remark.trim() : "";
  if (remark.length > 200) {
    return { ok: false, message: "备注不能超过 200 个字符" };
  }

  return {
    ok: true,
    value: {
      id: data.id as number,
      action: data.action,
      amount: data.amount,
      remark,
    },
  };
}

export function toNewApiQuotaRequest(adjustment: QuotaAdjustment) {
  return {
    id: adjustment.id,
    action: "add_quota" as const,
    mode: adjustment.action === "increase" ? ("add" as const) : ("subtract" as const),
    value: Math.round(adjustment.amount * QUOTA_PER_USD),
  };
}
