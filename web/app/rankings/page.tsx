import Link from "next/link";
import { getModels } from "@/lib/api";
import { fmtTokens } from "@/lib/format";

export const metadata = { title: "模型榜单 · 硅基裂变" };

export default async function Rankings() {
  const models = await getModels();
  const ranked = [...models].sort((a, b) => b.tokensPerWeek - a.tokensPerWeek);
  const max = ranked[0]?.tokensPerWeek ?? 1;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">模型榜单</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">按本周真实 token 用量排名(示例数据)</p>

      <div className="mt-6 space-y-2">
        {ranked.map((m, i) => (
          <Link
            key={m.id}
            href={`/models/${encodeURIComponent(m.id)}`}
            className="card flex items-center gap-4 p-4"
          >
            <div className="w-6 text-center text-lg font-semibold text-[var(--color-faint)]">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{m.name}</span>
                <span className="text-xs text-[var(--color-faint)]">{m.vendor}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-panel-2)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-2)]"
                  style={{ width: `${(m.tokensPerWeek / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-medium">{fmtTokens(m.tokensPerWeek)}</div>
              <div className="text-xs text-[var(--color-faint)]">tokens/周</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
