"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMe, type Me } from "@/lib/api";

export function NavAuth() {
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMe().then((u) => {
      setMe(u);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  // 未加载完成前占位,避免闪烁
  if (!loaded) {
    return <div className="h-8 w-16 animate-pulse rounded-lg bg-[var(--color-panel)]" />;
  }

  // 已登录:显示用户名 + 下拉(控制台 / 退出)
  if (me) {
    const initial = (me.displayName || me.username || "U").slice(0, 1).toUpperCase();
    return (
      <div className="flex items-center gap-2">
        <a
          href="/topup"
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          充值
        </a>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-2 py-1 text-sm hover:bg-[var(--color-panel)]"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-2)] text-xs text-white">
              {initial}
            </span>
            <span className="hidden max-w-[100px] truncate sm:inline">{me.displayName}</span>
            <span className="text-[var(--color-faint)]">▾</span>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-1 shadow-lg">
              <div className="border-b border-[var(--color-border-soft)] px-3 py-2 text-xs text-[var(--color-faint)]">
                余额 <span className="text-[var(--color-text)]">${me.balanceUsd}</span>
              </div>
              <a href="/dashboard" className="block px-3 py-2 text-sm hover:bg-[var(--color-panel)]">
                控制台
              </a>
              <a href="/settings" className="block px-3 py-2 text-sm hover:bg-[var(--color-panel)]">
                账号设置
              </a>
              {me.isAdmin ? (
                <a href="/admin" className="block px-3 py-2 text-sm hover:bg-[var(--color-panel)]">
                  渠道配置
                </a>
              ) : null}
              <button
                onClick={logout}
                className="block w-full px-3 py-2 text-left text-sm text-[var(--color-amber)] hover:bg-[var(--color-panel)]"
              >
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 未登录:登录 + 充值
  return (
    <div className="flex items-center gap-2">
      <a
        href="/login"
        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-panel)]"
      >
        登录
      </a>
      <a
        href="/topup"
        className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
      >
        充值
      </a>
    </div>
  );
}
