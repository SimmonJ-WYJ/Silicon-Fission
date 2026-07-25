"use client";

import { useState } from "react";
import { login, register } from "@/lib/api";

type Tab = "login" | "register";

export function AuthForm() {
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (username.trim().length < 3) {
      setNotice({ ok: false, text: "用户名至少 3 个字符" });
      return;
    }
    if (password.length < 8) {
      setNotice({ ok: false, text: "密码至少 8 位" });
      return;
    }
    if (tab === "register") {
      if (password !== password2) {
        setNotice({ ok: false, text: "两次输入的密码不一致" });
        return;
      }
      if (!agree) {
        setNotice({ ok: false, text: "请先阅读并同意服务条款" });
        return;
      }
    }
    setBusy(true);
    try {
      if (tab === "login") {
        const res = await login(username.trim(), password);
        setNotice({ ok: res.ok, text: res.ok ? "登录成功,正在进入控制台…" : res.message });
        if (res.ok) {
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 600);
        }
      } else {
        const res = await register(username.trim(), password);
        setNotice({ ok: res.ok, text: res.ok ? "注册成功,请登录" : res.message });
        if (res.ok) setTab("login");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6">
      {/* Tabs */}
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-[var(--color-panel-2)] p-1 text-sm">
        {(["login", "register"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setNotice(null);
            }}
            className={`rounded-md py-1.5 transition ${
              tab === t
                ? "bg-[var(--color-panel)] font-medium text-[var(--color-text)] shadow"
                : "text-[var(--color-muted)]"
            }`}
          >
            {t === "login" ? "登录" : "注册"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs text-[var(--color-faint)]">用户名</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名(如 root)"
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--color-faint)] focus:border-[var(--color-brand)]"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--color-faint)]">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 8 位"
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--color-faint)] focus:border-[var(--color-brand)]"
          />
        </div>
        {tab === "register" && (
          <>
            <div>
              <label className="text-xs text-[var(--color-faint)]">确认密码</label>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="再输一次"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--color-faint)] focus:border-[var(--color-brand)]"
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-[var(--color-muted)]">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 accent-[var(--color-brand)]"
              />
              <span>
                我已阅读并同意 <span className="text-[var(--color-brand-2)]">服务条款</span> 与{" "}
                <span className="text-[var(--color-brand-2)]">隐私政策</span>
              </span>
            </label>
          </>
        )}

        {notice && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs ${
              notice.ok
                ? "border-[var(--color-green)]/30 bg-[var(--color-green)]/10 text-[var(--color-green)]"
                : "border-[var(--color-amber)]/30 bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
            }`}
          >
            {notice.text}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black transition hover:bg-gray-200 disabled:opacity-50"
        >
          {busy ? "请稍候…" : tab === "login" ? "登录" : "创建账号"}
        </button>
      </form>

      {/* Divider + OAuth */}
      <div className="my-5 flex items-center gap-3 text-xs text-[var(--color-faint)]">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        或
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setNotice({ ok: false, text: "GitHub 登录待接入(OAuth 占位)" })}
          className="flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] py-2.5 text-sm hover:bg-[var(--color-panel-2)]"
        >
          <span></span> GitHub
        </button>
        <button
          onClick={() => setNotice({ ok: false, text: "微信登录待接入(OAuth 占位)" })}
          className="flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] py-2.5 text-sm hover:bg-[var(--color-panel-2)]"
        >
          <span className="text-[var(--color-green)]">微</span> 微信
        </button>
      </div>

      <p className="mt-5 text-center text-xs text-[var(--color-faint)]">
        登录即可获取 API Key,新用户赠送体验额度
      </p>
    </div>
  );
}
