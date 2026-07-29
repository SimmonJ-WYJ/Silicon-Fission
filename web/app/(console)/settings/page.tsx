import { SettingsForm } from "./settings-form";

export const metadata = { title: "账号设置 · 硅基裂变" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">账号设置</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        修改你的用户名、显示名与登录密码。修改用户名或密码后可能需要重新登录。
      </p>
      <div className="mt-8">
        <SettingsForm />
      </div>
    </div>
  );
}
