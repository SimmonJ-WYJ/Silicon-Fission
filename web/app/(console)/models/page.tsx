import { getModels } from "@/lib/api";
import { SERIES } from "@/lib/models";
import { ModelsBrowser } from "./browser";

export const metadata = { title: "模型市场 · 硅基裂变" };

export default async function ModelsPage() {
  const models = await getModels();
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-semibold">模型市场</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {models.length} 个模型 · 国内外主流大模型统一接入
      </p>
      <ModelsBrowser models={models} series={SERIES} />
    </div>
  );
}
