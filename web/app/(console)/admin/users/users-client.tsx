"use client";

import { useCallback, useEffect, useState } from "react";
import { USER_ROLE_ADMIN, USER_ROLE_COMMON } from "@/lib/user-admin";

interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  role: number;
  roleLabel: string;
  isAdmin: boolean;
  enabled: boolean;
  email: string;
  group: string;
  balanceUsd: number;
  usedUsd: number;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none";

const ROLE_FILTERS = [
  { label: "全部角色", value: "" },
  { label: "普通用户", value: String(USER_ROLE_COMMON) },
  { label: "管理员", value: String(USER_ROLE_ADMIN) },
  { label: "超级管理员", value: "100" },
];

const STATUS_FILTERS = [
  { label: "全部状态", value: "" },
  { label: "正常", value: "1" },
  { label: "已禁用", value: "2" },
];

function roleColor(role: number): string {
  if (role >= 100) return "text-[var(--color-brand)]";
  if (role >= 10) return "text-[var(--color-brand-2)]";
  return "text-[var(--color-muted)]";
}

export function UsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 筛选条件
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // 新建用户表单
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState(String(USER_ROLE_COMMON));
  const [createError, setCreateError] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  // 额度调整
  const [quotaUser, setQuotaUser] = useState<AdminUser | null>(null);
  const [quotaAction, setQuotaAction] = useState<"increase" | "decrease">("increase");
  const [quotaAmount, setQuotaAmount] = useState("");
  const [quotaRemark, setQuotaRemark] = useState("");
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaBusy, setQuotaBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      const body = await res.json();
      if (!body.success) {
        setError(body.message || "加载失败");
        setUsers([]);
      } else {
        setUsers(body.data as AdminUser[]);
      }
    } catch {
      setError("网络错误,无法加载用户列表");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, roleFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function manageUser(user: AdminUser, action: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/users/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, action }),
      });
      const body = await res.json();
      if (!body.success) {
        setError(body.message || "操作失败");
        return;
      }
      setNotice(body.demo ? "演示模式:操作未真正生效" : "操作已生效");
      await load();
    } catch {
      setError("网络错误,操作未完成");
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateBusy(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          displayName: newDisplayName,
          role: Number(newRole),
        }),
      });
      const body = await res.json();
      if (!body.success) {
        setCreateError(body.message || "创建失败");
        return;
      }
      setShowCreate(false);
      setNewUsername("");
      setNewPassword("");
      setNewDisplayName("");
      setNewRole(String(USER_ROLE_COMMON));
      setNotice(body.demo ? "演示模式:用户未真正创建" : `用户「${newUsername}」已创建`);
      await load();
    } catch {
      setCreateError("网络错误,创建未完成");
    } finally {
      setCreateBusy(false);
    }
  }

  function openQuota(user: AdminUser) {
    setQuotaUser(user);
    setQuotaAction("increase");
    setQuotaAmount("");
    setQuotaRemark("");
    setQuotaError(null);
  }

  async function adjustQuota(e: React.FormEvent) {
    e.preventDefault();
    if (!quotaUser) return;
    const amount = Number(quotaAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setQuotaError("请输入大于 0 的额度");
      return;
    }

    setQuotaBusy(true);
    setQuotaError(null);
    try {
      const res = await fetch("/api/admin/users/quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quotaUser.id,
          action: quotaAction,
          amount,
          remark: quotaRemark,
        }),
      });
      const body = await res.json();
      if (!body.success) {
        setQuotaError(body.message || "调整失败");
        return;
      }
      const verb = quotaAction === "increase" ? "增加" : "扣减";
      setQuotaUser(null);
      setNotice(
        body.demo
          ? "演示模式:额度未真正变动"
          : `已为「${quotaUser.username}」${verb} $${amount}`,
      );
      await load();
    } catch {
      setQuotaError("网络错误,调整未完成");
    } finally {
      setQuotaBusy(false);
    }
  }

  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <div className="mt-6">
      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索用户名或显示名…"
          className="w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm outline-none"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm outline-none"
        >
          {ROLE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-sm outline-none"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-[var(--color-faint)]">
          共 {users.length} 人 · 管理员 {adminCount} 人
        </span>
        <button
          type="button"
          onClick={() => {
            setShowCreate((v) => !v);
            setCreateError(null);
          }}
          className="ml-auto rounded-lg bg-[var(--color-brand)] px-4 py-2 text-xs font-medium text-white transition"
        >
          {showCreate ? "收起表单" : "新建用户"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {notice}
        </p>
      )}

      {/* 新建用户表单 */}
      {showCreate && (
        <form onSubmit={createUser} className="card mt-4 space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[var(--color-faint)]">用户名(最多 20 字符)</label>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="字母、数字、下划线、连字符"
                className={INPUT_CLASS}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-faint)]">密码(8-20 字符)</label>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                className={INPUT_CLASS}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-faint)]">显示名称(留空用用户名)</label>
              <input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-faint)]">角色</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value={String(USER_ROLE_COMMON)}>普通用户</option>
                <option value={String(USER_ROLE_ADMIN)}>管理员</option>
              </select>
            </div>
          </div>
          {createError && <p className="text-xs text-red-600">{createError}</p>}
          <button
            type="submit"
            disabled={createBusy}
            className="rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
          >
            {createBusy ? "创建中…" : "创建用户"}
          </button>
        </form>
      )}

      {/* 用户列表 */}
      {loading ? (
        <p className="mt-6 text-sm text-[var(--color-muted)]">加载中…</p>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-faint)]">
                <th className="px-4 py-3 font-normal">用户</th>
                <th className="px-3 py-3 font-normal">角色</th>
                <th className="px-3 py-3 font-normal">余额</th>
                <th className="px-3 py-3 font-normal">已用</th>
                <th className="px-3 py-3 font-normal">状态</th>
                <th className="px-3 py-3 font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                    没有匹配的用户
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-2.5">
                    {u.displayName}
                    <span className="ml-1 text-xs text-[var(--color-faint)]">@{u.username}</span>
                    {u.email && (
                      <div className="text-xs text-[var(--color-faint)]">{u.email}</div>
                    )}
                  </td>
                  <td className={`px-3 py-2.5 ${roleColor(u.role)}`}>{u.roleLabel}</td>
                  <td className="px-3 py-2.5">${u.balanceUsd}</td>
                  <td className="px-3 py-2.5 text-[var(--color-muted)]">${u.usedUsd}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        u.enabled ? "text-[var(--color-green)]" : "text-[var(--color-amber)]"
                      }
                    >
                      {u.enabled ? "正常" : "已禁用"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        onClick={() => openQuota(u)}
                        className="font-medium text-[var(--color-brand-2)] hover:underline"
                      >
                        调整额度
                      </button>
                      {u.role >= 100 ? (
                        <span className="text-[var(--color-faint)]">其他操作不可用</span>
                      ) : (
                        <>
                          {u.isAdmin ? (
                            <button
                              onClick={() => manageUser(u, "demote")}
                              className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
                            >
                              降为普通
                            </button>
                          ) : (
                            <button
                              onClick={() => manageUser(u, "promote")}
                              className="text-[var(--color-brand-2)] hover:underline"
                            >
                              设为管理员
                            </button>
                          )}
                          {u.enabled ? (
                            <button
                              onClick={() => manageUser(u, "disable")}
                              className="text-[var(--color-amber)] hover:underline"
                            >
                              禁用
                            </button>
                          ) : (
                            <button
                              onClick={() => manageUser(u, "enable")}
                              className="text-[var(--color-green)] hover:underline"
                            >
                              启用
                            </button>
                          )}
                          <button
                            onClick={() =>
                              manageUser(
                                u,
                                "delete",
                                `确定删除用户「${u.username}」?此操作不可恢复。`,
                              )
                            }
                            className="text-red-500 hover:text-red-600"
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 额度调整弹窗 */}
      {quotaUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={`调整 ${quotaUser.username} 的额度`}
        >
          <form
            onSubmit={adjustQuota}
            className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-lg"
          >
            <h3 className="text-base font-semibold">
              调整额度 · {quotaUser.displayName}
              <span className="ml-1 text-xs font-normal text-[var(--color-faint)]">
                @{quotaUser.username}
              </span>
            </h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              当前余额 ${quotaUser.balanceUsd}
            </p>

            <div className="mt-4 flex gap-2">
              {(["increase", "decrease"] as const).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setQuotaAction(action)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                    quotaAction === action
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-text)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)]"
                  }`}
                >
                  {action === "increase" ? "增加额度" : "扣减额度"}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-xs text-[var(--color-faint)]">金额(美元)</label>
              <input
                value={quotaAmount}
                onChange={(e) => setQuotaAmount(e.target.value)}
                placeholder="10"
                inputMode="decimal"
                className={`${INPUT_CLASS} font-mono`}
                autoFocus
              />
            </div>

            <div className="mt-3">
              <label className="text-xs text-[var(--color-faint)]">备注(选填)</label>
              <input
                value={quotaRemark}
                onChange={(e) => setQuotaRemark(e.target.value)}
                placeholder="人工充值"
                className={INPUT_CLASS}
              />
            </div>

            {quotaError && <p className="mt-3 text-xs text-red-600">{quotaError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !quotaBusy && setQuotaUser(null)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] transition"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={quotaBusy}
                className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
              >
                {quotaBusy ? "提交中…" : "确认调整"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
