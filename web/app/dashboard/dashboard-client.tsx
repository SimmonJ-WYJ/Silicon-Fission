"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createKey,
  fetchKeys,
  fetchMe,
  fetchMyModels,
  revealKey,
  type ApiKeyItem,
  type Me,
} from "@/lib/api";

export function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [meRes, keysRes, modelsRes] = await Promise.all([
      fetchMe(),
      fetchKeys(),
      fetchMyModels(),
    ]);
    setMe(meRes);
    setKeys(keysRes ?? []);
    setModels(modelsRes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function onCreateKey() {
    const name = newKeyName.trim() || `key-${Date.now() % 100000}`;
    setBusy(true);
    setNotice(null);
    const res = await createKey(name);
    setNotice(res.ok ? `Key「${name}」创建成功` : res.message);
    setNewKeyName("");
    await reload();
    setBusy(false);
  }

  async function onReveal(id: number) {
    const key = await revealKey(id);
    if (key) setRevealed((r) => ({ ...r, [id]: key }));
    else setNotice("获取完整 Key 失败");
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (loading) {
    return <div className="mt-10 text-sm text-[var(--color-muted)]">加载中…</div>;
  }

  if (!me) {
    return (
      <div className="card mt-6 p-10 text-center">
        <div className="text-lg font-medium">尚未登录</div>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          登录后即可查看余额、管理 API Key 并调用模型
        </p>
        <a
          href="/login"
          className="mt-5 inline-block rounded-lg bg-white px-5 py-2 text-sm font-medium text-black hover:bg-gray-200"
        >
          去登录
        </a>
      </div>
    );
  }

  return (
    <>
      {/* Account row */}
      <div className="mt-2 flex items-center justify-between text-sm text-[var(--color-muted)]">
        <span>
          当前账号:<span className="text-[var(--color-text)]">{me.displayName}</span>
          <span className="ml-2 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs">
            {me.group} 组
          </span>
        </span>
        <button onClick={onLogout} className="text-xs text-[var(--color-faint)] hover:text-[var(--color-text)]">
          退出登录
        </button>
      </div>

      {/* Balance + stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="card bg-gradient-to-br from-[var(--color-brand)]/15 to-transparent p-5">
          <div className="text-xs text-[var(--color-faint)]">账户余额</div>
          <div className="mt-1 text-3xl font-semibold">${me.balanceUsd}</div>
          <a
            href="/topup"
            className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-gray-200"
          >
            充值
          </a>
        </div>
        <div className="card p-5">
          <div className="text-xs text-[var(--color-faint)]">API Keys</div>
          <div className="mt-1 text-3xl font-semibold">{keys.length}</div>
          <div className="mt-3 text-xs text-[var(--color-muted)]">
            累计消费 ${keys.reduce((s, k) => s + k.usedUsd, 0).toFixed(4)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-[var(--color-faint)]">可用模型</div>
          <div className="mt-1 text-3xl font-semibold">{models.length}</div>
          <div className="mt-3 truncate text-xs text-[var(--color-muted)]">
            {models.length ? models.slice(0, 3).join(", ") + (models.length > 3 ? "…" : "") : "后台还未配置渠道"}
          </div>
        </div>
      </div>

      {notice && (
        <div className="mt-4 rounded-lg border border-[var(--color-brand-2)]/30 bg-[var(--color-brand-2)]/10 px-3 py-2 text-xs text-[var(--color-brand-2)]">
          {notice}
        </div>
      )}

      {/* API keys */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <div className="flex items-center gap-2">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="新 Key 名称"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-sm outline-none placeholder:text-[var(--color-faint)]"
          />
          <button
            onClick={onCreateKey}
            disabled={busy}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
          >
            + 新建 Key
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-panel)] text-left text-[var(--color-faint)]">
            <tr>
              <th className="px-4 py-2 font-medium">名称</th>
              <th className="px-4 py-2 font-medium">Key</th>
              <th className="px-4 py-2 font-medium">已用</th>
              <th className="px-4 py-2 font-medium">创建时间</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-faint)]">
                  还没有 Key,点右上角「新建 Key」创建第一个
                </td>
              </tr>
            )}
            {keys.map((k) => (
              <tr key={k.id} className="border-t border-[var(--color-border-soft)]">
                <td className="px-4 py-2.5">{k.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-muted)]">
                  {revealed[k.id] ?? k.maskedKey}
                </td>
                <td className="px-4 py-2.5">${k.usedUsd}</td>
                <td className="px-4 py-2.5 text-[var(--color-muted)]">{k.createdAt}</td>
                <td className="px-4 py-2.5 text-right">
                  {revealed[k.id] ? (
                    <button
                      onClick={() => navigator.clipboard.writeText(revealed[k.id])}
                      className="text-xs text-[var(--color-brand-2)] hover:underline"
                    >
                      复制
                    </button>
                  ) : (
                    <button
                      onClick={() => onReveal(k.id)}
                      className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
                    >
                      查看完整 Key
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--color-faint)]">
        拿到 sk- Key 后,把 OpenAI SDK 的 base_url 换成本站网关地址即可调用;也可以直接在
        <a href="/chat" className="text-[var(--color-brand-2)]"> 对话 Playground </a>里试。
      </p>
    </>
  );
}
