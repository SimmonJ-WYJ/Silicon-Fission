"use client";

import { useCallback, useEffect, useState } from "react";
import { formatUseTime, logTypeOptions, LOG_TYPE_ERROR, LOG_TYPE_TOPUP } from "@/lib/logs";
import { fmtDualCurrency } from "@/lib/format";

interface AdminLog {
  id: number;
  createdAt: number;
  type: number;
  typeLabel: string;
  username: string;
  tokenName: string;
  modelName: string;
  channelId: number;
  channelName: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  useTime: number;
  outputSpeed: number | null;
  isStream: boolean;
  content: string;
  requestId: string;
}

interface LogStat {
  costUsd: number;
  rpm: number;
  tpm: number;
}

const INPUT_CLASS =
  "rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm outline-none";

const TYPE_OPTIONS = logTypeOptions();

const PAGE_SIZE = 20;

function typeColor(type: number): string {
  if (type === LOG_TYPE_ERROR) return "text-[var(--color-amber)]";
  if (type === LOG_TYPE_TOPUP) return "text-[var(--color-green)]";
  return "text-[var(--color-muted)]";
}

function formatTime(seconds: number): string {
  if (!seconds) return "-";
  return new Date(seconds * 1000).toLocaleString("zh-CN", { hour12: false });
}

/** 只在有值时显示金额，避免整列都是零。 */
function formatCost(usd: number): string {
  if (!usd) return "-";
  const digits = usd < 0.01 ? 6 : 4;
  return fmtDualCurrency(usd, digits, digits);
}

export function LogsClient({ endpoint = "/api/admin/logs" }: { endpoint?: string }) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [stat, setStat] = useState<LogStat | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选条件
  const [type, setType] = useState("");
  const [username, setUsername] = useState("");
  const [modelName, setModelName] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // 已提交的筛选条件:输入框改动不立即触发请求,点「查询」才生效
  const [applied, setApplied] = useState(0);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (type) params.set("type", type);
    if (username.trim()) params.set("username", username.trim());
    if (modelName.trim()) params.set("modelName", modelName.trim());
    if (tokenName.trim()) params.set("tokenName", tokenName.trim());
    if (start) params.set("start", start);
    if (end) params.set("end", end);

    try {
      const res = await fetch(`${endpoint}?${params.toString()}`, { cache: "no-store" });
      const body = await res.json();
      if (!body.success) {
        setError(body.message || "加载失败");
        setLogs([]);
        setStat(null);
        setTotal(0);
        return;
      }
      setLogs(body.data as AdminLog[]);
      setStat((body.stat as LogStat | null) ?? null);
      setTotal(body.total as number);
    } catch {
      setError("网络错误,无法加载日志");
      setLogs([]);
      setStat(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
    // applied 变化即代表用户点了查询,依赖它来触发重新拉取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, applied, endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  function submitFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setApplied((n) => n + 1);
  }

  function resetFilters() {
    setType("");
    setUsername("");
    setModelName("");
    setTokenName("");
    setStart("");
    setEnd("");
    setPage(1);
    setApplied((n) => n + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mt-6">
      {/* 筛选栏 */}
      <form onSubmit={submitFilters} className="card space-y-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-faint)]">类型</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className={INPUT_CLASS}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-faint)]">用户名</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="精确匹配,% 为通配"
              className={`${INPUT_CLASS} w-40`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-faint)]">模型</span>
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="精确匹配,% 为通配"
              className={`${INPUT_CLASS} w-44`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-faint)]">令牌名</span>
            <input
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className={`${INPUT_CLASS} w-32`}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-faint)]">开始时间</span>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-faint)]">结束时间</span>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-xs font-medium text-white transition"
          >
            查询
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs transition"
          >
            重置
          </button>
        </div>
      </form>

      {/* 统计卡片:统计接口失败时不挡住列表,只是不展示 */}
      {stat && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <p className="text-xs text-[var(--color-faint)]">当前筛选消费</p>
            <p className="mt-1 text-xl font-semibold">{fmtDualCurrency(stat.costUsd)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-[var(--color-faint)]">RPM(每分钟请求)</p>
            <p className="mt-1 text-xl font-semibold">{stat.rpm}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-[var(--color-faint)]">TPM(每分钟 tokens)</p>
            <p className="mt-1 text-xl font-semibold">{stat.tpm.toLocaleString()}</p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* 日志列表 */}
      {loading ? (
        <p className="mt-6 text-sm text-[var(--color-muted)]">加载中…</p>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-faint)]">
                <th className="px-4 py-3 font-normal">时间</th>
                <th className="px-3 py-3 font-normal">类型</th>
                <th className="px-3 py-3 font-normal">用户</th>
                <th className="px-3 py-3 font-normal">模型</th>
                <th className="px-3 py-3 font-normal">渠道</th>
                <th className="px-3 py-3 font-normal">tokens</th>
                <th className="px-3 py-3 font-normal">耗时</th>
                <th className="px-3 py-3 font-normal">消费</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                    没有匹配的日志
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--color-muted)]">
                    {formatTime(log.createdAt)}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-3 text-xs ${typeColor(log.type)}`}>
                    {log.typeLabel}
                  </td>
                  <td className="px-3 py-3">
                    <span>{log.username || "-"}</span>
                    {log.tokenName && (
                      <span className="ml-1 text-xs text-[var(--color-faint)]">/ {log.tokenName}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {log.modelName || "-"}
                    {log.isStream && (
                      <span className="ml-1 text-[var(--color-faint)]">(流式)</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-[var(--color-muted)]">
                    {log.channelName || "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-[var(--color-muted)]">
                    {log.promptTokens || log.completionTokens
                      ? `${log.promptTokens} + ${log.completionTokens}`
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-[var(--color-muted)]">
                    {formatUseTime(log.useTime)}
                    {log.outputSpeed !== null && (
                      <span className="ml-1 text-[var(--color-faint)]">
                        {log.outputSpeed} t/s
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs">{formatCost(log.costUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 错误和管理类日志的详情单独一行展示,列表里塞不下 */}
      {!loading && logs.some((log) => log.content) && (
        <div className="card mt-4 space-y-2 p-4">
          <p className="text-xs text-[var(--color-faint)]">详情</p>
          {logs
            .filter((log) => log.content)
            .map((log) => (
              <p key={log.id} className="text-xs text-[var(--color-muted)]">
                <span className="text-[var(--color-faint)]">{formatTime(log.createdAt)}</span>
                {" · "}
                <span className={typeColor(log.type)}>{log.typeLabel}</span>
                {" · "}
                {log.content}
              </p>
            ))}
        </div>
      )}

      {/* 分页 */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs text-[var(--color-faint)]">
          共 {total} 条 · 第 {page}/{totalPages} 页
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={loading || page <= 1}
          className="ml-auto rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs transition disabled:opacity-40"
        >
          上一页
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading || page >= totalPages}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs transition disabled:opacity-40"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
