"use client";

import { useCallback, useEffect, useState } from "react";
import {
  rowPriceUsdPerMillion,
  usdToCny,
  USD_TO_CNY,
  validatePricingRow,
  type ModelPricingRow,
} from "@/lib/pricing";

const INPUT_CLASS =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 font-mono text-xs outline-none";

/** 倍率值 -> 输入框文本 */
function fieldText(value: number | null): string {
  return value === null || Number.isNaN(value) ? "" : String(value);
}

function dualCurrency(usd: number): string {
  return `$${usd.toFixed(2)} / ¥${usdToCny(usd).toFixed(2)}`;
}

export function PricingClient() {
  const [rows, setRows] = useState<ModelPricingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing", { cache: "no-store" });
      const body = await res.json();
      if (!body.success) {
        setError(body.message || "加载失败");
        setRows([]);
      } else {
        setRows(body.data as ModelPricingRow[]);
        setDraftFields({});
      }
    } catch {
      setError("网络错误,无法加载倍率配置");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateRow(index: number, patch: Partial<ModelPricingRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setNotice(null);
  }

  function updateNumericField(
    index: number,
    field: "inputRatio" | "outputRatio" | "perCallPrice" | "cacheRatio" | "createCacheRatio",
    raw: string,
  ) {
    const key = `${index}:${field}`;
    setDraftFields((prev) => ({ ...prev, [key]: raw }));
    const trimmed = raw.trim();
    if (!trimmed) {
      updateRow(index, { [field]: null });
      return;
    }
    // Keep incomplete-but-valid decimal text (2., .5) in the draft while
    // updating the numeric row as soon as it can be parsed.
    if (/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) {
      const value = Number(trimmed);
      if (Number.isFinite(value)) updateRow(index, { [field]: value });
    }
  }

  function numericFieldText(index: number, field: string, value: number | null) {
    return draftFields[`${index}:${field}`] ?? fieldText(value);
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { model: "", inputRatio: 1, outputRatio: null, perCallPrice: null },
    ]);
    setNotice(null);
    setFilter("");
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setNotice(null);
  }

  async function save() {
    // 先在前端拦一遍,省一次往返
    for (const [i, row] of rows.entries()) {
      const rowError = validatePricingRow(row);
      if (rowError) {
        setError(`第 ${i + 1} 行:${rowError}`);
        setNotice(null);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const body = await res.json();
      if (!body.success) {
        setError(body.message || "保存失败");
      } else {
        setNotice(body.demo ? "演示模式:改动未落库" : "已保存,新倍率立即生效");
        await load();
      }
    } catch {
      setError("网络错误,保存未完成");
    } finally {
      setSaving(false);
    }
  }

  const keyword = filter.trim().toLowerCase();
  // 带上原始下标,过滤后编辑仍然改的是正确那一行
  const visible = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !keyword || row.model.toLowerCase().includes(keyword));

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="筛选模型名…"
          className="w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm outline-none"
        />
        <span className="text-xs text-[var(--color-faint)]">
          共 {rows.length} 个模型
          {keyword && visible.length !== rows.length ? `,匹配 ${visible.length} 个` : ""}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)] transition hover:border-[#c9d0dc]"
          >
            新增模型
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-xs font-medium text-white transition disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存全部"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-[var(--color-muted)]">加载中…</p>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-faint)]">
                <th className="px-4 py-3 font-normal">模型</th>
                <th className="w-28 px-3 py-3 font-normal">输入倍率</th>
                <th className="w-28 px-3 py-3 font-normal">输出倍率</th>
                <th className="w-28 px-3 py-3 font-normal">缓存命中</th>
                <th className="w-28 px-3 py-3 font-normal">缓存写入</th>
                <th className="w-32 px-3 py-3 font-normal">按次单价($ / ¥)</th>
                <th className="w-56 px-3 py-3 font-normal">实际单价 / 1M tokens（$ / ¥）</th>
                <th className="w-16 px-3 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                    {rows.length === 0 ? "还没有配置任何模型倍率" : "没有匹配的模型"}
                  </td>
                </tr>
              )}
              {visible.map(({ row, index }) => {
                const price = rowPriceUsdPerMillion(row);
                return (
                  <tr key={index} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2">
                      <input
                        value={row.model}
                        onChange={(e) => updateRow(index, { model: e.target.value })}
                        placeholder="模型名"
                        className={INPUT_CLASS}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={numericFieldText(index, "inputRatio", row.inputRatio)}
                        onChange={(e) => updateNumericField(index, "inputRatio", e.target.value)}
                        placeholder="—"
                        className={INPUT_CLASS}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={numericFieldText(index, "outputRatio", row.outputRatio)}
                        onChange={(e) => updateNumericField(index, "outputRatio", e.target.value)}
                        placeholder="1"
                        className={INPUT_CLASS}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input value={numericFieldText(index, "cacheRatio", row.cacheRatio ?? null)} onChange={(e) => updateNumericField(index, "cacheRatio", e.target.value)} placeholder="—" className={INPUT_CLASS} />
                    </td>
                    <td className="px-3 py-2">
                      <input value={numericFieldText(index, "createCacheRatio", row.createCacheRatio ?? null)} onChange={(e) => updateNumericField(index, "createCacheRatio", e.target.value)} placeholder="—" className={INPUT_CLASS} />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={numericFieldText(index, "perCallPrice", row.perCallPrice)}
                        onChange={(e) => updateNumericField(index, "perCallPrice", e.target.value)}
                        placeholder="—"
                        className={INPUT_CLASS}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--color-muted)]">
                      {row.perCallPrice !== null ? (
                        <span>按次 {dualCurrency(row.perCallPrice)}</span>
                      ) : price ? (
                        <span className="font-mono">
                          入 {dualCurrency(price.input)} / 出 {dualCurrency(price.output)}
                        </span>
                      ) : (
                        <span className="text-[var(--color-faint)]">未配置</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="text-xs text-red-500 transition hover:text-red-600"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--color-faint)]">
        输出倍率留空按 1 倍算。人民币金额按 1 USD ≈ ¥{USD_TO_CNY} 展示，仅作参考；实际结算仍按 New API 美元等值额度执行。填了按次单价后,该模型忽略 token 倍率,按调用次数计费。
      </p>
    </div>
  );
}
