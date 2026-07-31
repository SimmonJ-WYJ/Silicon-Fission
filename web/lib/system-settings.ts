export type SettingKind = "boolean" | "number" | "text";

export interface SystemSettingDefinition {
  key: string;
  label: string;
  description: string;
  section: "access" | "billing" | "reliability" | "operations";
  kind: SettingKind;
  min?: number;
  integer?: boolean;
}

export interface SystemSettingValue extends SystemSettingDefinition {
  value: boolean | number | string;
}

export const SYSTEM_SETTING_DEFINITIONS: readonly SystemSettingDefinition[] = [
  { key: "RegisterEnabled", label: "开放注册", description: "允许新用户创建账号", section: "access", kind: "boolean" },
  { key: "PasswordLoginEnabled", label: "密码登录", description: "允许使用用户名和密码登录", section: "access", kind: "boolean" },
  { key: "PasswordRegisterEnabled", label: "密码注册", description: "允许通过用户名和密码注册", section: "access", kind: "boolean" },
  { key: "EmailVerificationEnabled", label: "邮箱验证", description: "注册时要求验证邮箱", section: "access", kind: "boolean" },
  { key: "QuotaForNewUser", label: "新用户初始额度", description: "New API 内部额度单位", section: "billing", kind: "number", min: 0, integer: true },
  { key: "PreConsumedQuota", label: "预扣额度", description: "请求开始前预先扣除的额度", section: "billing", kind: "number", min: 0, integer: true },
  { key: "QuotaRemindThreshold", label: "余额提醒阈值", description: "低于该额度时提醒用户", section: "billing", kind: "number", min: 0, integer: true },
  { key: "RetryTimes", label: "失败重试次数", description: "上游请求失败后的最大重试次数", section: "reliability", kind: "number", min: 0, integer: true },
  { key: "AutomaticDisableChannelEnabled", label: "自动禁用异常渠道", description: "渠道持续异常时自动停止调度", section: "reliability", kind: "boolean" },
  { key: "AutomaticEnableChannelEnabled", label: "自动恢复渠道", description: "检测恢复后重新启用渠道", section: "reliability", kind: "boolean" },
  { key: "ChannelDisableThreshold", label: "渠道禁用阈值", description: "触发自动禁用的失败阈值", section: "reliability", kind: "number", min: 0 },
  { key: "LogConsumeEnabled", label: "记录额度消耗", description: "在调用日志中记录额度消耗", section: "operations", kind: "boolean" },
  { key: "DemoSiteEnabled", label: "演示站模式", description: "限制会改变系统数据的操作", section: "operations", kind: "boolean" },
] as const;

const DEFINITIONS_BY_KEY = new Map(SYSTEM_SETTING_DEFINITIONS.map((item) => [item.key, item]));

export function parseSettingValue(
  definition: SystemSettingDefinition,
  raw: unknown,
): boolean | number | string {
  if (definition.kind === "boolean") return raw === true || raw === "true";
  if (definition.kind === "number") {
    const parsed = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return typeof raw === "string" ? raw : raw == null ? "" : String(raw);
}

export function toSystemSettings(options: Array<{ key: string; value: unknown }>): SystemSettingValue[] {
  const values = new Map(options.map((option) => [option.key, option.value]));
  return SYSTEM_SETTING_DEFINITIONS.map((definition) => ({
    ...definition,
    value: parseSettingValue(definition, values.get(definition.key)),
  }));
}

export function validateSettingUpdate(input: unknown):
  | { ok: true; key: string; value: boolean | number | string }
  | { ok: false; message: string } {
  if (!input || typeof input !== "object") return { ok: false, message: "设置格式无效" };
  const candidate = input as { key?: unknown; value?: unknown };
  if (typeof candidate.key !== "string") return { ok: false, message: "缺少设置项" };
  const definition = DEFINITIONS_BY_KEY.get(candidate.key);
  if (!definition) return { ok: false, message: `不允许修改设置 ${candidate.key}` };

  if (definition.kind === "boolean") {
    if (typeof candidate.value !== "boolean") return { ok: false, message: `${definition.label}必须是开关值` };
    return { ok: true, key: definition.key, value: candidate.value };
  }
  if (definition.kind === "number") {
    if (typeof candidate.value !== "number" || !Number.isFinite(candidate.value)) {
      return { ok: false, message: `${definition.label}必须是数字` };
    }
    if (definition.min !== undefined && candidate.value < definition.min) {
      return { ok: false, message: `${definition.label}不能小于 ${definition.min}` };
    }
    if (definition.integer && !Number.isInteger(candidate.value)) {
      return { ok: false, message: `${definition.label}必须是整数` };
    }
    return { ok: true, key: definition.key, value: candidate.value };
  }
  if (typeof candidate.value !== "string") return { ok: false, message: `${definition.label}必须是文本` };
  return { ok: true, key: definition.key, value: candidate.value };
}
