"use client";

import { useEffect, useState } from "react";
import { fetchMyModels } from "@/lib/api";

interface Msg {
  role: "user" | "assistant" | "system";
  content: string;
}

export function Playground({ models }: { models: { id: string; name: string }[] }) {
  const [apiKey, setApiKey] = useState("");
  const [options, setOptions] = useState(models);
  const [live, setLive] = useState(false); // 是否加载到了后端真实模型
  const [model, setModel] = useState(models[0]?.id ?? "");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyModels().then((list) => {
      if (list && list.length > 0) {
        setOptions(list.map((id) => ({ id, name: id })));
        setModel(list[0]);
        setLive(true);
      }
    });
  }, []);

  async function send() {
    if (!input.trim() || loading) return;
    setError(null);
    const next: Msg[] = [...msgs, { role: "user", content: input.trim() }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: next, key: apiKey.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error?.message || `请求失败 (HTTP ${res.status})`);
      }
      const reply = data.choices?.[0]?.message?.content ?? "(空响应)";
      setMsgs([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px]">
      {/* Chat column */}
      <div className="card flex h-[540px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.length === 0 && (
            <div className="grid h-full place-items-center text-center text-sm text-[var(--color-faint)]">
              发送一条消息开始对话
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-[var(--color-brand)]/20 text-[var(--color-text)]"
                    : "bg-[var(--color-panel-2)] text-[var(--color-muted)]"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-[var(--color-faint)]">思考中…</div>}
        </div>
        {error && (
          <div className="mx-4 mb-2 rounded-lg border border-[var(--color-amber)]/30 bg-[var(--color-amber)]/10 px-3 py-2 text-xs text-[var(--color-amber)]">
            {error}
          </div>
        )}
        <div className="flex items-end gap-2 border-t border-[var(--color-border-soft)] p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="输入消息,Enter 发送…"
            className="max-h-32 flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm outline-none placeholder:text-[var(--color-faint)] focus:border-[#c9d0dc]"
          />
          <button
            onClick={send}
            disabled={loading}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </div>

      {/* Settings column */}
      <div className="card h-fit space-y-4 p-4">
        <div>
          <label className="text-xs text-[var(--color-faint)]">
            模型 {live && <span className="text-[var(--color-green)]">(来自后端)</span>}
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm outline-none"
          >
            {options.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--color-faint)]">API Key</label>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type="password"
            placeholder="sk-…(控制台可创建)"
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm outline-none placeholder:text-[var(--color-faint)]"
          />
        </div>
        <div className="rounded-lg bg-[var(--color-panel-2)] p-3 text-xs text-[var(--color-faint)]">
          请求经由本站代理转发到网关,后端地址不暴露。没有 Key?去
          <a href="/dashboard" className="text-[var(--color-brand-2)]"> 控制台 </a>创建。
        </div>
      </div>
    </div>
  );
}
