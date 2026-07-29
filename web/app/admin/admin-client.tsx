"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMe, type Me } from "@/lib/api";
import type { ChannelProtocol } from "@/lib/channel-protocol";

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

interface Channel {
  id: number;
  name: string;
  baseUrl: string;
  models: string;
  enabled: boolean;
  usedQuota: number;
  responseTimeMs: number;
}

// 常用上游预设:选中后自动填协议、base_url 和推荐模型
const PRESETS = [
  { id: "deepseek", label: "DeepSeek", protocol: "openai", baseUrl: "https://api.deepseek.com", models: "deepseek-chat,deepseek-reasoner" },
  { id: "siliconflow", label: "SiliconFlow 硅基流动", protocol: "openai", baseUrl: "https://api.siliconflow.cn", models: "deepseek-ai/DeepSeek-V3,Qwen/Qwen2.5-72B-Instruct" },
  { id: "moonshot", label: "Moonshot Kimi", protocol: "openai", baseUrl: "https://api.moonshot.cn", models: "moonshot-v1-8k,kimi-k2-0711-preview" },
  { id: "openai", label: "OpenAI(需出海线路)", protocol: "openai", baseUrl: "https://api.openai.com", models: "gpt-4o,gpt-4o-mini" },
  { id: "custom", label: "自定义(OpenAI 兼容)", protocol: "openai", baseUrl: "", models: "" },
  { id: "anthropic", label: "Claude / Anthropic", protocol: "anthropic", baseUrl: "", models: "" },
] as const satisfies readonly {
  id: string;
  label: string;
  protocol: ChannelProtocol;
  baseUrl: string;
  models: string;
}[];

type Status = "loading" | "offline" | "uninitialized" | "unauthed" | "ready";

export function AdminClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // 初始化表单
  const [initUser, setInitUser] = useState("root");
  const [initPass, setInitPass] = useState("");

  // 新渠道表单
  const [preset, setPreset] = useState<(typeof PRESETS)[number]["id"]>("deepseek");
  const [chName, setChName] = useState("DeepSeek");
  const [chBase, setChBase] = useState<string>(PRESETS[0].baseUrl);
  const [chKey, setChKey] = useState("");
  const [chModels, setChModels] = useState<string>(PRESETS[0].models);

  const detect = useCallback(async () => {
    setStatus("loading");
    // 1. 后端可达 + 是否已初始化
    const setupRes = await fetch("/api/admin/setup").catch(() => null);
    if (!setupRes || setupRes.status === 502) {
      setStatus("offline");
      return;
    }
    const setup = await setupRes.json().catch(() => null);
    if (setup?.success && !setup.data.initialized) {
      setStatus("uninitialized");
      return;
    }
    // 2. 是否已登录
    const meRes = await fetchMe();
    if (!meRes) {
      setStatus("unauthed");
      return;
    }
    setMe(meRes);
    // 3. 拉渠道列表(非管理员会 403)
    const chRes = await fetch("/api/admin/channels");
    if (chRes.ok) {
      const body = await chRes.json();
      setChannels(body.data ?? []);
    } else {
      setChannels([]);
      const body = await chRes.json().catch(() => null);
      setNotice({ ok: false, text: body?.message || "当前账号无管理员权限,仅管理员可配置渠道" });
    }
    // 4. 拉用户列表
    const uRes = await fetch("/api/admin/users");
    if (uRes.ok) {
      const body = await uRes.json();
      setUsers(body.data ?? []);
    } else {
      setUsers([]);
    }
    setStatus("ready");
  }, []);

  async function manageUser(id: number, action: string, label: string) {
    if (action === "delete" && !confirm(`确定删除用户「${label}」?此操作不可恢复。`)) return;
    setNotice(null);
    const res = await fetch("/api/admin/users/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const body = await res.json().catch(() => ({}));
    setNotice({ ok: res.ok && body.success, text: body.message || (res.ok ? "操作成功" : "操作失败") });
    if (res.ok && body.success) await detect();
  }

  useEffect(() => {
    detect();
  }, [detect]);

  function applyPreset(id: (typeof PRESETS)[number]["id"]) {
    const p = PRESETS.find((x) => x.id === id)!;
    setPreset(id);
    setChName(p.id === "anthropic" ? p.label : p.label.split("(")[0].split(" ")[0]);
    setChBase(p.baseUrl);
    setChModels(p.models);
  }

  async function doInit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const res = await fetch("/api/admin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: initUser.trim(), password: initPass }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.success) {
      // 初始化成功 → 自动登录
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: initUser.trim(), password: initPass }),
      });
      if (loginRes.ok) {
        setNotice({ ok: true, text: "初始化完成并已登录,现在配置第一个渠道吧" });
        await detect();
      } else {
        setNotice({ ok: true, text: "初始化完成,请手动登录" });
        setStatus("unauthed");
      }
    } else {
      setNotice({ ok: false, text: body.message || "初始化失败" });
    }
    setBusy(false);
  }

  async function addChannel(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const activePreset = PRESETS.find((p) => p.id === preset)!;
    const res = await fetch("/api/admin/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: chName.trim(),
        baseUrl: chBase.trim(),
        key: chKey.trim(),
        models: chModels.trim(),
        protocol: activePreset.protocol,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setNotice({
      ok: res.ok && body.success,
      text: res.ok && body.success ? `渠道「${chName}」已接入 ✓ 用户现在可以调用:${chModels}` : body.message || "创建失败",
    });
    if (res.ok && body.success) {
      setChKey("");
      await detect();
    }
    setBusy(false);
  }

  async function testChannel(id: number) {
    setNotice(null);
    const res = await fetch(`/api/admin/channels/${id}/test`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setNotice({ ok: Boolean(body.success), text: body.message || "测试完成" });
  }

  /* ---------- 渲染各状态 ---------- */

  if (status === "loading") {
    return <div className="mt-10 text-sm text-[var(--color-muted)]">检测后端状态…</div>;
  }

  if (status === "offline") {
    return (
      <div className="card mt-6 border-[var(--color-amber)]/40 p-8">
        <div className="text-lg font-medium text-[var(--color-amber)]">⚠ 后端未启动</div>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          连接不上 new-api 后端(默认 http://localhost:3000)。在项目目录执行:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-[#16181d] p-4 text-sm text-gray-300">
{`cd deploy
docker compose up -d
docker compose ps   # 等待 running 状态`}
        </pre>
        <p className="mt-3 text-xs text-[var(--color-faint)]">
          后端在其他地址?在 web/.env.local 里设置 NEWAPI_BASE=http://你的地址 后重启前端。
        </p>
        <button
          onClick={detect}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          重新检测
        </button>
      </div>
    );
  }

  if (status === "uninitialized") {
    return (
      <div className="card mt-6 max-w-md p-6">
        <div className="text-lg font-medium">首次初始化</div>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          创建管理员账号(自动开启自用模式,配好渠道即可调用,无需逐模型配价)
        </p>
        <form onSubmit={doInit} className="mt-4 space-y-3">
          <input
            value={initUser}
            onChange={(e) => setInitUser(e.target.value)}
            placeholder="管理员用户名"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none"
          />
          <input
            type="password"
            value={initPass}
            onChange={(e) => setInitPass(e.target.value)}
            placeholder="密码(至少 8 位)"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none"
          />
          {notice && (
            <div className={`rounded-lg px-3 py-2 text-xs ${notice.ok ? "bg-[var(--color-green)]/10 text-[var(--color-green)]" : "bg-[var(--color-amber)]/10 text-[var(--color-amber)]"}`}>
              {notice.text}
            </div>
          )}
          <button
            type="submit"
            disabled={busy || initPass.length < 8}
            className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40"
          >
            {busy ? "初始化中…" : "初始化并登录"}
          </button>
        </form>
      </div>
    );
  }

  if (status === "unauthed") {
    return (
      <div className="card mt-6 p-10 text-center">
        <div className="text-lg font-medium">请先登录管理员账号</div>
        <a
          href="/login"
          className="mt-5 inline-block rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          去登录
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mt-2 text-sm text-[var(--color-muted)]">
        管理员:<span className="text-[var(--color-text)]">{me?.displayName}</span>
      </div>

      {notice && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            notice.ok
              ? "border-[var(--color-green)]/30 bg-[var(--color-green)]/10 text-[var(--color-green)]"
              : "border-[var(--color-amber)]/30 bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* 用户管理 */}
      <h2 className="mt-8 text-lg font-semibold">
        用户管理(共 {users.length} 人 · 管理员 {users.filter((u) => u.isAdmin).length} 人)
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-panel)] text-left text-[var(--color-faint)]">
            <tr>
              <th className="px-4 py-2 font-medium">用户名</th>
              <th className="px-4 py-2 font-medium">角色</th>
              <th className="px-4 py-2 font-medium">余额</th>
              <th className="px-4 py-2 font-medium">已用</th>
              <th className="px-4 py-2 font-medium">状态</th>
              <th className="px-4 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-faint)]">
                  暂无用户
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[var(--color-border-soft)]">
                <td className="px-4 py-2.5">
                  {u.displayName}
                  <span className="ml-1 text-xs text-[var(--color-faint)]">@{u.username}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      u.role >= 100
                        ? "text-[var(--color-brand)]"
                        : u.role >= 10
                          ? "text-[var(--color-brand-2)]"
                          : "text-[var(--color-muted)]"
                    }
                  >
                    {u.roleLabel}
                  </span>
                </td>
                <td className="px-4 py-2.5">${u.balanceUsd}</td>
                <td className="px-4 py-2.5 text-[var(--color-muted)]">${u.usedUsd}</td>
                <td className="px-4 py-2.5">
                  <span className={u.enabled ? "text-[var(--color-green)]" : "text-[var(--color-amber)]"}>
                    {u.enabled ? "正常" : "已禁用"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {u.role >= 100 ? (
                    <span className="text-xs text-[var(--color-faint)]">超管不可操作</span>
                  ) : (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {u.isAdmin ? (
                        <button onClick={() => manageUser(u.id, "demote", u.username)} className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
                          降为普通
                        </button>
                      ) : (
                        <button onClick={() => manageUser(u.id, "promote", u.username)} className="text-[var(--color-brand-2)] hover:underline">
                          设为管理员
                        </button>
                      )}
                      {u.enabled ? (
                        <button onClick={() => manageUser(u.id, "disable", u.username)} className="text-[var(--color-amber)] hover:underline">
                          禁用
                        </button>
                      ) : (
                        <button onClick={() => manageUser(u.id, "enable", u.username)} className="text-[var(--color-green)] hover:underline">
                          启用
                        </button>
                      )}
                      <button onClick={() => manageUser(u.id, "delete", u.username)} className="text-[var(--color-faint)] hover:text-[var(--color-amber)]">
                        删除
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 已接入渠道 */}
      <h2 className="mt-10 text-lg font-semibold">已接入渠道({channels.length})</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-panel)] text-left text-[var(--color-faint)]">
            <tr>
              <th className="px-4 py-2 font-medium">名称</th>
              <th className="px-4 py-2 font-medium">上游地址</th>
              <th className="px-4 py-2 font-medium">模型</th>
              <th className="px-4 py-2 font-medium">状态</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {channels.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-faint)]">
                  还没有渠道,在下方接入第一个上游
                </td>
              </tr>
            )}
            {channels.map((c) => (
              <tr key={c.id} className="border-t border-[var(--color-border-soft)]">
                <td className="px-4 py-2.5">{c.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-muted)]">{c.baseUrl || "官方默认"}</td>
                <td className="max-w-[240px] truncate px-4 py-2.5 text-xs text-[var(--color-muted)]">{c.models}</td>
                <td className="px-4 py-2.5">
                  <span className={c.enabled ? "text-[var(--color-green)]" : "text-[var(--color-amber)]"}>
                    {c.enabled ? "启用" : "停用"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => testChannel(c.id)} className="text-xs text-[var(--color-brand-2)] hover:underline">
                    测试连通
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新增渠道 */}
      <h2 className="mt-10 text-lg font-semibold">接入新渠道</h2>
      <form onSubmit={addChannel} className="card mt-3 space-y-4 p-5">
        <div>
          <label className="text-xs text-[var(--color-faint)]">上游预设</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  preset === p.id
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-text)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[#c9d0dc]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-[var(--color-faint)]">渠道名称</label>
            <input
              value={chName}
              onChange={(e) => setChName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-faint)]">上游 Base URL(留空用官方)</label>
            <input
              value={chBase}
              onChange={(e) => setChBase(e.target.value)}
              placeholder="https://api.deepseek.com"
              className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--color-faint)]">上游 API Key</label>
          <input
            value={chKey}
            onChange={(e) => setChKey(e.target.value)}
            type="password"
            placeholder="sk-…(去上游官网申请)"
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--color-faint)]">开放的模型(逗号分隔)</label>
          <input
            value={chModels}
            onChange={(e) => setChModels(e.target.value)}
            placeholder="deepseek-chat,deepseek-reasoner"
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !chKey.trim()}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40"
        >
          {busy ? "接入中…" : "接入渠道"}
        </button>
      </form>

      <p className="mt-4 text-xs text-[var(--color-faint)]">
        配好渠道后:去 <a href="/dashboard" className="text-[var(--color-brand-2)]">控制台</a> 创建
        sk- Key → 在 <a href="/chat" className="text-[var(--color-brand-2)]">对话</a> 里选模型即可使用。
      </p>
    </>
  );
}
