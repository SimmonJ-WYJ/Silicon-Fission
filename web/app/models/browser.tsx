"use client";

import { useMemo, useState } from "react";
import { ModelCard } from "@/components/model-card";
import type { Model } from "@/lib/models";

export function ModelsBrowser({ models, series }: { models: Model[]; series: string[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<"全部" | "国内" | "境外">("全部");
  const [activeSeries, setActiveSeries] = useState<string[]>([]);
  const [sort, setSort] = useState<"hot" | "price">("hot");

  const filtered = useMemo(() => {
    let list = models.filter((m) => {
      const matchQ =
        !q ||
        m.name.toLowerCase().includes(q.toLowerCase()) ||
        m.vendor.toLowerCase().includes(q.toLowerCase());
      const matchRegion =
        region === "全部" ||
        (region === "国内"
          ? m.providers.some((p) => p.region === "国内")
          : m.providers.some((p) => p.region === "境外"));
      const matchSeries = activeSeries.length === 0 || activeSeries.includes(m.series);
      return matchQ && matchRegion && matchSeries;
    });
    list = [...list].sort((a, b) =>
      sort === "hot"
        ? b.tokensPerWeek - a.tokensPerWeek
        : Math.min(...a.providers.map((p) => p.input)) -
          Math.min(...b.providers.map((p) => p.input)),
    );
    return list;
  }, [models, q, region, activeSeries, sort]);

  const toggleSeries = (s: string) =>
    setActiveSeries((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Sidebar filters */}
      <aside className="space-y-6">
        <div>
          <div className="mb-2 text-xs font-medium uppercase text-[var(--color-faint)]">线路</div>
          <div className="flex flex-col gap-1">
            {(["全部", "国内", "境外"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`rounded-md px-3 py-1.5 text-left text-sm transition ${
                  region === r
                    ? "bg-[var(--color-panel)] text-[var(--color-text)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-panel)]"
                }`}
              >
                {r === "国内" ? "国内直连" : r === "境外" ? "境外(需出海)" : "全部线路"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase text-[var(--color-faint)]">模型系列</div>
          <div className="flex flex-wrap gap-1.5">
            {series.map((s) => (
              <button
                key={s}
                onClick={() => toggleSeries(s)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  activeSeries.includes(s)
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/15 text-[var(--color-text)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[#33373f]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索模型或厂商…"
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm outline-none placeholder:text-[var(--color-faint)] focus:border-[#33373f]"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "hot" | "price")}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm outline-none"
          >
            <option value="hot">按热度</option>
            <option value="price">按价格</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-sm text-[var(--color-muted)]">
            没有匹配的模型
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
