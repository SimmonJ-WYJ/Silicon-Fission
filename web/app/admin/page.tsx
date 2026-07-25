import { AdminClient } from "./admin-client";

export const metadata = { title: "渠道配置 · 硅基裂变" };

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">配置后台</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        接入上游模型渠道。配置完成后,用户即可在本站创建 Key 并调用模型。
      </p>
      <AdminClient />
    </div>
  );
}
