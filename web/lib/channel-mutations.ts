export interface ChannelUpdateInput {
  name: string;
  baseUrl: string;
  models: string;
  enabled: boolean;
  key?: string;
}

export function parseChannelId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function parseChannelUpdate(
  input: unknown,
): { value: ChannelUpdateInput } | { error: string } {
  if (!input || typeof input !== "object") {
    return { error: "请求参数格式错误" };
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const models = typeof body.models === "string" ? body.models.trim() : "";
  if (!name || !models) {
    return { error: "渠道名称和模型均必填" };
  }
  if (typeof body.enabled !== "boolean") {
    return { error: "渠道状态必须是布尔值" };
  }
  if (body.baseUrl !== undefined && typeof body.baseUrl !== "string") {
    return { error: "上游地址格式错误" };
  }
  if (body.key !== undefined && typeof body.key !== "string") {
    return { error: "上游 Key 格式错误" };
  }

  return {
    value: {
      name,
      baseUrl: typeof body.baseUrl === "string" ? body.baseUrl.trim() : "",
      models,
      enabled: body.enabled,
      key: typeof body.key === "string" ? body.key.trim() : "",
    },
  };
}

export function buildChannelUpdatePayload(
  existing: Record<string, unknown>,
  id: number,
  input: ChannelUpdateInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...existing,
    id,
    name: input.name,
    base_url: input.baseUrl,
    models: input.models,
  };
  delete payload.status;
  delete payload.key;
  const replacementKey = input.key?.trim();
  if (replacementKey) payload.key = replacementKey;
  return payload;
}

export function deletionNameMatches(existingName: string, confirmName: unknown): boolean {
  return typeof confirmName === "string" && confirmName === existingName;
}

export function parseDeletionConfirmation(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const confirmName = (input as Record<string, unknown>).confirmName;
  return typeof confirmName === "string" ? confirmName : null;
}
