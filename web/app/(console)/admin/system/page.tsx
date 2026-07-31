import { SystemSettingsClient } from "./system-settings-client";

export const metadata = { title: "系统设置 · 硅基裂变" };

export default function SystemSettingsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">系统设置</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">管理访问、额度、渠道容错和运行策略。</p>
      <SystemSettingsClient />
    </div>
  );
}
