"use client";

import { useEffect, useState } from "react";
import { fetchMe, updateSelf, type Me } from "@/lib/api";

const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--color-faint)] focus:border-[var(--color-brand)]";

export function SettingsForm() {
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetchMe().then((u) => {
      setMe(u);
      if (u) {
        setUsername(u.username);
        setDisplayName(u.displayName);
      }
      setLoaded(true);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (!me) return;

    const nextUsername = username.trim();
    const nextDisplay = displayName.trim();

    if (nextUsername.length < 3) {
      setNotice({ ok: false, text: "用户名至少 3 个字符" });
      return;
    }
    if (password) {
      if (password.length < 8) {
        setNotice({ ok: false, text: "新密码至少 8 位" });
        return;
      }
      if (password !== password2) {
        setNotice({ ok: false, text: "两次输入的新密码不一致" });
        return;
      }
    }

    // 只提交真正发生变化的字段
    const payload: { username?: string; displayName?: string; password?: string } = {};
    if (nextUsername !== me.username) payload.username = nextUsername;
    if (nextDisplay !== me.displayName) payload.displayName = nextDisplay;
    if (password) payload.password = password;

    if (Object.keys(payload).length === 0) {
      setNotice({ ok: false, text: "没有需要修改的内容" });
      return;
    }

    setBusy(true);
    try {
      const res = await updateSelf(payload);
      if (res.ok) {
        const changedAuth = Boolean(payload.username || payload.password);
        setNotice({
          ok: true,
          text: changedAuth ? "修改成功,请重新登录…" : "修改成功",
        });
        setPassword("");
        setPassword2("");
        if (changedAuth) {
          setTimeout(async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }, 900);
        } else {
          setMe({ ...me, displayName: nextDisplay });
        }
      } else {
        setNotice({ ok: false, text: res.message });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return <div className="card h-64 animate-pulse" />;
  }

  if (!me) {
    return (
      <div className="card p-6 text-sm text-[var(--color-muted)]">
        请先{" "}
        <a href="/login" className="text-[var(--color-brand-2)] hover:underline">
          登录
        </a>{" "}
        后再修改账号设置。
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      <div>
        <label className="text-xs text-[var(--color-faint)]">用户名(登录用)</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className="text-xs text-[var(--color-faint)]">显示名(界面展示)</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
      </div>

      <div className="h-px bg-[var(--color-border-soft)]" />

      <div>
        <label className="text-xs text-[var(--color-faint)]">新密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="留空表示不修改密码"
          autoComplete="new-password"
          className={inputCls}
        />
      </div>

      {password && (
        <div>
          <label className="text-xs text-[var(--color-faint)]">确认新密码</label>
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="再输一次"
            autoComplete="new-password"
            className={inputCls}
          />
        </div>
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
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
      >
        {busy ? "保存中…" : "保存修改"}
      </button>
    </form>
  );
}
