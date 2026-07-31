import { UsersClient } from "./users-client";

export const metadata = { title: "用户管理 · 硅基裂变" };

export default function UsersPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">用户管理</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        新建用户、调整余额、设置角色与启禁用状态。
      </p>
      <UsersClient />
    </div>
  );
}
