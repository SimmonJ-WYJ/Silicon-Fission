"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { SystemSettingValue } from "@/lib/system-settings";

const SECTIONS = [
  { id: "access", label: "访问与注册" },
  { id: "billing", label: "额度与计费" },
  { id: "reliability", label: "渠道容错" },
  { id: "operations", label: "运行与日志" },
] as const;

export function SystemSettingsClient() {
  const [settings, setSettings] = useState<SystemSettingValue[]>([]);
  const [original, setOriginal] = useState<SystemSettingValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/system-settings", { cache: "no-store" });
      const body = await res.json();
      if (!body.success) throw new Error(body.message || "加载失败");
      setSettings(body.data);
      setOriginal(body.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法加载系统设置");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const changed = useMemo(() => settings.filter((item) => {
    const before = original.find((candidate) => candidate.key === item.key);
    return before?.value !== item.value;
  }), [original, settings]);

  function update(key: string, value: boolean | number | string) {
    setSettings((items) => items.map((item) => item.key === key ? { ...item, value } : item));
    setNotice(null);
  }

  async function save() {
    if (!changed.length) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: changed.map(({ key, value }) => ({ key, value })) }),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.message || "保存失败");
      setNotice(body.demo ? "演示模式：改动未落库" : "系统设置已保存");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存未完成");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="mt-6 text-sm text-[var(--color-muted)]">加载中…</p>;

  return (
    <div className="mt-6 space-y-6">
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      {notice && <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">{notice}</p>}

      {SECTIONS.map((section) => (
        <section key={section.id} className="border-t border-[var(--color-border)] pt-5 first:border-t-0 first:pt-0">
          <h2 className="text-sm font-semibold">{section.label}</h2>
          <div className="mt-3 grid gap-x-8 gap-y-4 md:grid-cols-2">
            {settings.filter((item) => item.section === section.id).map((item) => (
              <label key={item.key} className="flex min-h-16 items-center justify-between gap-5 border-b border-[var(--color-border-soft)] py-3">
                <span>
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="mt-1 block text-xs text-[var(--color-faint)]">{item.description}</span>
                </span>
                {item.kind === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(item.value)}
                    onChange={(event) => update(item.key, event.target.checked)}
                    className="h-4 w-4 shrink-0 accent-[var(--color-brand)]"
                  />
                ) : (
                  <input
                    type="number"
                    min={item.min}
                    step={item.integer ? 1 : "any"}
                    value={String(item.value)}
                    onChange={(event) => update(item.key, Number(event.target.value))}
                    className="w-28 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-right font-mono text-sm outline-none"
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-bg)] py-4">
        <span className="mr-auto text-xs text-[var(--color-faint)]">{changed.length ? `${changed.length} 项未保存` : "没有未保存的改动"}</span>
        <button type="button" disabled={!changed.length || saving} onClick={() => setSettings(original)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs disabled:opacity-40">撤销</button>
        <button type="button" disabled={!changed.length || saving} onClick={save} className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-xs font-medium text-white disabled:opacity-40">{saving ? "保存中…" : "保存更改"}</button>
      </div>
    </div>
  );
}
