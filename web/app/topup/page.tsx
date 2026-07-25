import { TopupForm } from "./topup-form";

export const metadata = { title: "充值 · 硅基裂变" };

export default function TopupPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">账户充值</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        人民币直充,余额不过期。推理按供应商官方价透传,仅收取 3% 充值手续费。
      </p>
      <TopupForm />
    </div>
  );
}
