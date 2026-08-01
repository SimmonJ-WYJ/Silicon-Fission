// 调用日志与统计的查询层。
// 对齐 new-api 的 controller.GetAllLogs / GetLogsStat:
//   GET /api/log/       -> {page, page_size, total, items}
//   GET /api/log/stat   -> {quota, rpm, tpm}
// 两个接口都在 middleware.AdminAuth() 之后,普通管理员(role>=10)即可访问。

// 显式带 .ts 后缀:tsconfig 开了 allowImportingTsExtensions,
// 且 node --test 直接跑 lib/*.ts 时需要能解析到真实文件。
import { QUOTA_PER_USD } from "./quota-adjustment.ts";

/** 对齐 model/log.go 的常量,注释里明确写了「don't use iota」,数值不能改 */
export const LOG_TYPE_ALL = 0;
export const LOG_TYPE_TOPUP = 1;
export const LOG_TYPE_CONSUME = 2;
export const LOG_TYPE_MANAGE = 3;
export const LOG_TYPE_SYSTEM = 4;
export const LOG_TYPE_ERROR = 5;

const LOG_TYPE_LABELS: Record<number, string> = {
  [LOG_TYPE_TOPUP]: "充值",
  [LOG_TYPE_CONSUME]: "消费",
  [LOG_TYPE_MANAGE]: "管理",
  [LOG_TYPE_SYSTEM]: "系统",
  [LOG_TYPE_ERROR]: "错误",
};

const LOG_TYPES = [
  LOG_TYPE_TOPUP,
  LOG_TYPE_CONSUME,
  LOG_TYPE_MANAGE,
  LOG_TYPE_SYSTEM,
  LOG_TYPE_ERROR,
];

export function logTypeLabel(type: number): string {
  return LOG_TYPE_LABELS[type] ?? "未知";
}

export interface LogQuery {
  /** 0 表示不按类型过滤:上游 GetAllLogs 把 LogTypeUnknown 当作「不加 where」 */
  type: number;
  username: string;
  tokenName: string;
  modelName: string;
  /** 0 表示不按渠道过滤 */
  channel: number;
  /** Unix 秒,0 表示不设下界 */
  startTimestamp: number;
  /** Unix 秒,0 表示不设上界 */
  endTimestamp: number;
  page: number;
  pageSize: number;
}

const TEXT_MAX = 64;
const PAGE_SIZE_MAX = 100;
const PAGE_SIZE_DEFAULT = 20;

function text(params: URLSearchParams, key: string): string {
  return (params.get(key) ?? "").trim().slice(0, TEXT_MAX);
}

/** 允许传 Unix 秒,也允许传 datetime-local / ISO 字符串,便于前端直接回传输入框的值 */
export function parseTimestampParam(raw: string | null): number {
  if (!raw) return 0;
  const value = raw.trim();
  if (!value) return 0;

  if (/^\d+$/.test(value)) {
    const seconds = Number(value);
    return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
}

export function parseLogQuery(params: URLSearchParams): LogQuery {
  const rawType = Number(params.get("type"));
  const type = LOG_TYPES.includes(rawType) ? rawType : LOG_TYPE_ALL;

  const rawChannel = Number(params.get("channel"));
  const channel = Number.isSafeInteger(rawChannel) && rawChannel > 0 ? rawChannel : 0;

  const rawPage = Number(params.get("page"));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawSize = Number(params.get("pageSize"));
  const pageSize =
    Number.isSafeInteger(rawSize) && rawSize > 0
      ? Math.min(rawSize, PAGE_SIZE_MAX)
      : PAGE_SIZE_DEFAULT;

  const startTimestamp = parseTimestampParam(params.get("start"));
  const endTimestamp = parseTimestampParam(params.get("end"));

  return {
    type,
    username: text(params, "username"),
    tokenName: text(params, "tokenName"),
    modelName: text(params, "modelName"),
    channel,
    // 时间区间反了就丢掉上界,避免上游返回空集让人以为没有日志
    startTimestamp,
    endTimestamp: endTimestamp && startTimestamp && endTimestamp < startTimestamp ? 0 : endTimestamp,
    page,
    pageSize,
  };
}

/** 只把非零/非空的筛选项拼进去:上游用零值表示「不过滤」 */
function filterParams(query: LogQuery): URLSearchParams {
  const search = new URLSearchParams();
  if (query.type !== LOG_TYPE_ALL) search.set("type", String(query.type));
  if (query.username) search.set("username", query.username);
  if (query.tokenName) search.set("token_name", query.tokenName);
  if (query.modelName) search.set("model_name", query.modelName);
  if (query.channel) search.set("channel", String(query.channel));
  if (query.startTimestamp) search.set("start_timestamp", String(query.startTimestamp));
  if (query.endTimestamp) search.set("end_timestamp", String(query.endTimestamp));
  return search;
}

export function toNewApiLogPath(query: LogQuery): string {
  const search = filterParams(query);
  search.set("p", String(query.page));
  search.set("page_size", String(query.pageSize));
  return `/api/log/?${search.toString()}`;
}

/** 统计接口共用筛选条件,但不分页 */
export function toNewApiLogStatPath(query: LogQuery): string {
  const search = filterParams(query);
  const qs = search.toString();
  return qs ? `/api/log/stat?${qs}` : "/api/log/stat";
}

export function toNewApiSelfLogPath(query: LogQuery): string {
  const search = filterParams(query);
  search.delete("username");
  search.delete("channel");
  search.set("p", String(query.page));
  search.set("page_size", String(query.pageSize));
  return `/api/log/self?${search.toString()}`;
}

export function toNewApiSelfLogStatPath(query: LogQuery): string {
  const search = filterParams(query);
  search.delete("username");
  const qs = search.toString();
  return qs ? `/api/log/self/stat?${qs}` : "/api/log/self/stat";
}

export function quotaToUsd(quota: number): number {
  if (!Number.isFinite(quota)) return 0;
  return quota / QUOTA_PER_USD;
}

/** 日志里的 use_time 是秒(service/quota.go 用 Unix 时间戳相减) */
export function formatUseTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m${seconds % 60}s`;
}

/** 输出速度,秒级精度下不足 1 秒的请求算不出来,返回 null 让 UI 显示 "-" */
export function tokensPerSecond(completionTokens: number, useTimeSeconds: number): number | null {
  if (!Number.isFinite(completionTokens) || completionTokens <= 0) return null;
  if (!Number.isFinite(useTimeSeconds) || useTimeSeconds <= 0) return null;
  return Number((completionTokens / useTimeSeconds).toFixed(1));
}

export interface LogTypeOption {
  label: string;
  value: string;
}

export function logTypeOptions(): LogTypeOption[] {
  return [
    { label: "全部类型", value: "" },
    ...LOG_TYPES.map((type) => ({ label: logTypeLabel(type), value: String(type) })),
  ];
}
