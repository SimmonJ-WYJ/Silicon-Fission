import Link from "next/link";
import { notFound } from "next/navigation";
import { getModel, bestPrice, MODELS } from "@/lib/models";
import { fmtContext, fmtPrice, fmtTokens } from "@/lib/format";

export function generateStaticParams() {
  return MODELS.map((m) => ({ id: encodeURIComponent(m.id) }));
}

export default async function ModelDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = getModel(decodeURIComponent(id));
  if (!model) notFound();
  const price = bestPrice(model);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/models" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
        ← 返回模型市场
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{model.name}</h1>
          <div className="mt-1 text-[var(--color-muted)]">
            {model.vendor} · <code className="text-sm">{model.id}</code>
          </div>
        </div>
        <Link
          href="/chat"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
        >
          在对话中试用
        </Link>
      </div>

      <p className="mt-4 max-w-2xl text-[var(--color-muted)]">{model.description}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { k: "上下文", v: fmtContext(model.context) + " tokens" },
          { k: "最低输入价", v: fmtPrice(price.input) + " / 1M" },
          { k: "最低输出价", v: fmtPrice(price.output) + " / 1M" },
          { k: "模态", v: model.modality.join(" / ") },
          { k: "本周用量", v: fmtTokens(model.tokensPerWeek) + " tokens" },
          { k: "可用供应商", v: model.providers.length + " 家" },
        ].map((s) => (
          <div key={s.k} className="card p-4">
            <div className="text-xs text-[var(--color-faint)]">{s.k}</div>
            <div className="mt-1 font-medium">{s.v}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">供应商与价格</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-panel)] text-left text-[var(--color-faint)]">
            <tr>
              <th className="px-4 py-2 font-medium">供应商</th>
              <th className="px-4 py-2 font-medium">线路</th>
              <th className="px-4 py-2 font-medium">输入 /1M</th>
              <th className="px-4 py-2 font-medium">输出 /1M</th>
            </tr>
          </thead>
          <tbody>
            {model.providers.map((p) => (
              <tr key={p.name} className="border-t border-[var(--color-border-soft)]">
                <td className="px-4 py-2.5">{p.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      p.region === "国内" ? "text-[var(--color-green)]" : "text-[var(--color-brand-2)]"
                    }
                  >
                    {p.region === "国内" ? "国内直连" : "境外"}
                  </span>
                </td>
                <td className="px-4 py-2.5">{fmtPrice(p.input)}</td>
                <td className="px-4 py-2.5">{fmtPrice(p.output)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
