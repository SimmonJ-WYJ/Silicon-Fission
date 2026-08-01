import { NextResponse } from "next/server";
import { getSessionToken, napiFetch } from "@/lib/newapi-server";
import { isDemo, demoUser } from "@/lib/demo";
import {
  logTypeLabel,
  parseLogQuery,
  quotaToUsd,
  tokensPerSecond,
  toNewApiLogPath,
  toNewApiLogStatPath,
  toNewApiSelfLogPath,
  toNewApiSelfLogStatPath,
  type LogQuery,
} from "@/lib/logs";

interface NapiLog {
  id: number;
  user_id: number;
  created_at: number;
  type: number;
  content: string;
  username: string;
  token_name: string;
  model_name: string;
  quota: number;
  prompt_tokens: number;
  completion_tokens: number;
  use_time: number;
  is_stream: boolean;
  channel: number;
  channel_name?: string;
  group?: string;
  request_id?: string;
}

interface NapiLogPage {
  page: number;
  page_size: number;
  total: number;
  items: NapiLog[] | null;
}

interface NapiLogStat {
  quota: number;
  rpm: number;
  tpm: number;
}

function shape(log: NapiLog) {
  return {
    id: log.id,
    createdAt: log.created_at,
    type: log.type,
    typeLabel: logTypeLabel(log.type),
    username: log.username,
    tokenName: log.token_name,
    modelName: log.model_name,
    channelId: log.channel,
    channelName: log.channel_name || (log.channel ? `#${log.channel}` : ""),
    promptTokens: log.prompt_tokens,
    completionTokens: log.completion_tokens,
    // 单条日志的额度很小,保留 6 位小数才不会全被四舍五入成 0
    costUsd: Number(quotaToUsd(log.quota).toFixed(6)),
    useTime: log.use_time,
    outputSpeed: tokensPerSecond(log.completion_tokens, log.use_time),
    isStream: log.is_stream,
    content: log.content || "",
    requestId: log.request_id || "",
  };
}

const NOW = () => Math.floor(Date.now() / 1000);

function demoLogs(): NapiLog[] {
  const now = NOW();
  const base = {
    user_id: 2,
    username: "demo_user",
    token_name: "default",
    group: "default",
    is_stream: true,
  };
  return [
    { ...base, id: 1, created_at: now - 60, type: 2, content: "", model_name: "deepseek-chat", quota: 1_400, prompt_tokens: 820, completion_tokens: 240, use_time: 3, channel: 1, channel_name: "DeepSeek(示例)", request_id: "req_demo_0001" },
    { ...base, id: 2, created_at: now - 900, type: 2, content: "", model_name: "glm-4.6", quota: 5_200, prompt_tokens: 3_100, completion_tokens: 640, use_time: 6, channel: 2, channel_name: "智谱 BigModel(示例)", request_id: "req_demo_0002" },
    { ...base, id: 3, created_at: now - 3_600, type: 5, content: "上游返回 429:速率限制", model_name: "gpt-4o", quota: 0, prompt_tokens: 0, completion_tokens: 0, use_time: 1, channel: 3, channel_name: "OpenAI(示例)", is_stream: false, request_id: "req_demo_0003" },
    { ...base, id: 4, created_at: now - 7_200, type: 1, content: "管理员充值 $10.00", model_name: "", quota: 5_000_000, prompt_tokens: 0, completion_tokens: 0, use_time: 0, channel: 0, is_stream: false },
    { ...base, id: 5, created_at: now - 86_400, type: 2, content: "", model_name: "kimi-k2-0711-preview", quota: 2_600, prompt_tokens: 1_500, completion_tokens: 380, use_time: 4, channel: 4, channel_name: "Moonshot(示例)", request_id: "req_demo_0005" },
    { ...base, id: 6, created_at: now - 172_800, type: 3, content: "管理员将用户角色调整为管理员", model_name: "", quota: 0, prompt_tokens: 0, completion_tokens: 0, use_time: 0, channel: 0, is_stream: false },
  ];
}

/** 演示模式下本地过滤,让筛选交互看起来是真的 */
function filterDemoLogs(logs: NapiLog[], query: LogQuery): NapiLog[] {
  return logs.filter((log) => {
    if (query.type && log.type !== query.type) return false;
    if (query.username && !log.username.includes(query.username)) return false;
    if (query.tokenName && log.token_name !== query.tokenName) return false;
    if (query.modelName && !log.model_name.includes(query.modelName)) return false;
    if (query.channel && log.channel !== query.channel) return false;
    if (query.startTimestamp && log.created_at < query.startTimestamp) return false;
    if (query.endTimestamp && log.created_at > query.endTimestamp) return false;
    return true;
  });
}

export async function handleLogsRequest(req: Request, scope: "admin" | "self") {
  const query = parseLogQuery(new URL(req.url).searchParams);

  if (isDemo()) {
    const who = await demoUser();
    if (!who) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

    const matched = filterDemoLogs(demoLogs(), query);
    const start = (query.page - 1) * query.pageSize;
    const items = matched.slice(start, start + query.pageSize);
    const quota = matched
      .filter((log) => log.type === 2)
      .reduce((sum, log) => sum + log.quota, 0);

    return NextResponse.json({
      success: true,
      data: items.map(shape),
      total: matched.length,
      page: query.page,
      pageSize: query.pageSize,
      stat: { costUsd: Number(quotaToUsd(quota).toFixed(4)), rpm: 3, tpm: 1_240 },
    });
  }

  const token = await getSessionToken();
  if (!token) return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });

  const failed = { status: 502, body: { success: false, message: "无法连接 new-api 后端" } as const };
  // 列表和统计互不依赖,并发取
  const [list, stat] = await Promise.all([
    napiFetch<NapiLogPage>(scope === "self" ? toNewApiSelfLogPath(query) : toNewApiLogPath(query), {}, token).catch(() => failed),
    napiFetch<NapiLogStat>(scope === "self" ? toNewApiSelfLogStatPath(query) : toNewApiLogStatPath(query), {}, token).catch(() => failed),
  ]);

  if (!list.body.success || !list.body.data) {
    return NextResponse.json(
      { success: false, message: list.body.message || "获取调用日志失败" },
      { status: list.status === 401 ? 401 : 403 },
    );
  }

  const page = list.body.data;
  const items = page.items ?? [];
  // 统计失败不影响列表展示,前端会把 stat 当作可选值
  const statData = stat.body.success ? stat.body.data : null;

  return NextResponse.json({
    success: true,
    data: items.map(shape),
    total: page.total ?? items.length,
    page: page.page || query.page,
    pageSize: page.page_size || query.pageSize,
    stat: statData
      ? {
          costUsd: Number(quotaToUsd(statData.quota).toFixed(4)),
          rpm: statData.rpm ?? 0,
          tpm: statData.tpm ?? 0,
        }
      : null,
  });
}

export async function GET(req: Request) {
  return handleLogsRequest(req, "admin");
}
