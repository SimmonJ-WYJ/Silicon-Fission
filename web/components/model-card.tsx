import Link from "next/link";
import { bestPrice, type Model } from "@/lib/models";
import { fmtContext, fmtPrice, fmtTokens } from "@/lib/format";

const MODALITY_ICON: Record<string, string> = { text: "📝", image: "🖼️", audio: "🎧" };

export function ModelCard({ model }: { model: Model }) {
  const price = bestPrice(model);
  const region = model.providers.some((p) => p.region === "国内") ? "国内直连" : "境外";
  return (
    <Link href={`/models/${encodeURIComponent(model.id)}`} className="card block p-4 transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{model.name}</div>
          <div className="text-xs text-[var(--color-faint)]">{model.vendor}</div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${
            region === "国内直连"
              ? "border-[var(--color-green)]/30 text-[var(--color-green)]"
              : "border-[var(--color-brand-2)]/30 text-[var(--color-brand-2)]"
          }`}
        >
          {region}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">{model.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
        <span>上下文 {fmtContext(model.context)}</span>
        <span>·</span>
        <span>输入 {fmtPrice(price.input)}/M</span>
        <span>输出 {fmtPrice(price.output)}/M</span>
        <span className="ml-auto text-[var(--color-faint)]">
          {model.modality.map((m) => MODALITY_ICON[m]).join(" ")} {fmtTokens(model.tokensPerWeek)}/周
        </span>
      </div>
    </Link>
  );
}
