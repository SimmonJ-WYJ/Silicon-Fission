import { PricingClient } from "./pricing-client";

export const metadata = { title: "倍率配置 · 硅基裂变" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">倍率配置</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        设置每个模型的计费倍率。倍率 1 相当于 $0.002 / 1K tokens（约 ¥0.0144），右侧显示美元和人民币参考价。
      </p>
      <PricingClient />
    </div>
  );
}
