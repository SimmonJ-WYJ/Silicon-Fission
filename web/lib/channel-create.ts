import { CHANNEL_TYPE_IDS } from "./channel-catalog.ts";

export type ChannelCreateMode = "single" | "batch" | "multi_to_single";

const JSON_FIELDS = ["modelMapping", "statusCodeMapping", "paramOverride", "headerOverride", "setting", "settings"] as const;

function stringValue(body: Record<string, unknown>, key: string): string {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

export function parseChannelCreate(input: unknown):
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; message: string } {
  if (!input || typeof input !== "object") return { ok: false, message: "渠道参数格式错误" };
  const body = input as Record<string, unknown>;
  const type = Number(body.type);
  const name = stringValue(body, "name");
  const key = stringValue(body, "key");
  const models = stringValue(body, "models");
  const mode: ChannelCreateMode = ["single", "batch", "multi_to_single"].includes(String(body.mode))
    ? body.mode as ChannelCreateMode : "single";
  if (!CHANNEL_TYPE_IDS.has(type)) return { ok: false, message: "请选择有效的渠道类型" };
  if (!name || !key || !models) return { ok: false, message: "名称、凭证和模型均必填" };

  for (const field of JSON_FIELDS) {
    const value = stringValue(body, field);
    if (!value) continue;
    try { JSON.parse(value); } catch { return { ok: false, message: `${field} 必须是有效 JSON` }; }
  }

  const numberField = (key: string, fallback: number) => {
    const value = Number(body[key]);
    return Number.isFinite(value) ? value : fallback;
  };
  const group = stringValue(body, "group") || "default";
  const channel = {
    type,
    name,
    key,
    base_url: stringValue(body, "baseUrl") || null,
    models,
    group,
    openai_organization: stringValue(body, "organization") || null,
    model_mapping: stringValue(body, "modelMapping") || null,
    priority: numberField("priority", 0),
    weight: numberField("weight", 0),
    test_model: stringValue(body, "testModel") || null,
    auto_ban: body.autoBan === false ? 0 : 1,
    status: 1,
    status_code_mapping: stringValue(body, "statusCodeMapping") || null,
    tag: stringValue(body, "tag") || null,
    remark: stringValue(body, "remark"),
    setting: stringValue(body, "setting") || "{}",
    settings: stringValue(body, "settings") || "{}",
    param_override: stringValue(body, "paramOverride") || null,
    header_override: stringValue(body, "headerOverride") || null,
    other: stringValue(body, "other"),
  };
  return {
    ok: true,
    payload: {
      mode,
      ...(mode === "multi_to_single" ? { multi_key_mode: body.multiKeyMode === "polling" ? "polling" : "random" } : {}),
      ...(mode === "batch" ? { batch_add_set_key_prefix_2_name: body.keyPrefixToName === true } : {}),
      channel,
    },
  };
}
