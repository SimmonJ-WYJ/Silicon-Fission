"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMe, type Me } from "@/lib/api";
import { CHANNEL_KEY_HINTS, CHANNEL_TYPE_OPTIONS, channelTypeLabel } from "@/lib/channel-catalog";

interface Channel {
  id: number;
  type?: number;
  name: string;
  baseUrl: string;
  models: string;
  enabled: boolean;
  usedQuota: number;
  responseTimeMs: number;
}

type Status = "loading" | "offline" | "uninitialized" | "unauthed" | "ready";

export function AdminClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // 渠道编辑 / 删除
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editName, setEditName] = useState("");
  const [editBase, setEditBase] = useState("");
  const [editModels, setEditModels] = useState("");
  const [editEnabled, setEditEnabled] = useState(true);
  const [editKey, setEditKey] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 初始化表单
  const [initUser, setInitUser] = useState("root");
  const [initPass, setInitPass] = useState("");

  // 新渠道表单
  const [chType, setChType] = useState(1);
  const [chMode, setChMode] = useState<"single" | "batch" | "multi_to_single">("single");
  const [chName, setChName] = useState("OpenAI");
  const [chBase, setChBase] = useState("");
  const [chKey, setChKey] = useState("");
  const [chModels, setChModels] = useState("");
  const [chGroup, setChGroup] = useState("default");
  const [chOrganization, setChOrganization] = useState("");
  const [chModelMapping, setChModelMapping] = useState("");
  const [chPriority, setChPriority] = useState(0);
  const [chWeight, setChWeight] = useState(0);
  const [chTestModel, setChTestModel] = useState("");
  const [chAutoBan, setChAutoBan] = useState(true);
  const [chTag, setChTag] = useState("");
  const [chRemark, setChRemark] = useState("");
  const [chStatusMapping, setChStatusMapping] = useState("");
  const [chParamOverride, setChParamOverride] = useState("");
  const [chHeaderOverride, setChHeaderOverride] = useState("");
  const [chSetting, setChSetting] = useState("");
  const [chSettings, setChSettings] = useState("");

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
    setStatus("ready");
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

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
    const res = await fetch("/api/admin/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: chName.trim(),
        baseUrl: chBase.trim(),
        key: chKey.trim(),
        models: chModels.trim(),
        type: chType,
        mode: chMode,
        group: chGroup,
        organization: chOrganization,
        modelMapping: chModelMapping,
        priority: chPriority,
        weight: chWeight,
        testModel: chTestModel,
        autoBan: chAutoBan,
        tag: chTag,
        remark: chRemark,
        statusCodeMapping: chStatusMapping,
        paramOverride: chParamOverride,
        headerOverride: chHeaderOverride,
        setting: chSetting,
        settings: chSettings,
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

  function openEditChannel(channel: Channel) {
    setEditingChannel(channel);
    setEditName(channel.name);
    setEditBase(channel.baseUrl);
    setEditModels(channel.models);
    setEditEnabled(channel.enabled);
    setEditKey("");
    setEditError(null);
  }

  function closeEditChannel() {
    setEditingChannel(null);
    setEditKey("");
    setEditError(null);
  }

  async function updateChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!editingChannel) return;
    setBusy(true);
    setNotice(null);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/channels/${editingChannel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          baseUrl: editBase.trim(),
          models: editModels.trim(),
          enabled: editEnabled,
          key: editKey.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      const ok = res.ok && body.success;
      const message = ok ? `渠道「${editName.trim()}」已更新` : body.message || "更新失败";
      setNotice({ ok, text: message });
      if (!ok) {
        setEditError(message);
        return;
      }
      closeEditChannel();
      await detect();
    } catch {
      const message = "网络错误，无法更新渠道";
      setEditError(message);
      setNotice({ ok: false, text: message });
    } finally {
      setBusy(false);
    }
  }

  function openDeleteChannel(channel: Channel) {
    setDeletingChannel(channel);
    setDeleteConfirmName("");
    setDeleteError(null);
  }

  function closeDeleteChannel() {
    setDeletingChannel(null);
    setDeleteConfirmName("");
    setDeleteError(null);
  }

  async function deleteChannel() {
    if (!deletingChannel || deleteConfirmName !== deletingChannel.name) return;
    setBusy(true);
    setNotice(null);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/channels/${deletingChannel.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: deleteConfirmName }),
      });
      const body = await res.json().catch(() => ({}));
      const ok = res.ok && body.success;
      const message = ok ? `渠道「${deletingChannel.name}」已删除` : body.message || "删除失败";
      setNotice({ ok, text: message });
      if (!ok) {
        setDeleteError(message);
        return;
      }
      closeDeleteChannel();
      await detect();
    } catch {
      const message = "网络错误，无法删除渠道";
      setDeleteError(message);
      setNotice({ ok: false, text: message });
    } finally {
      setBusy(false);
    }
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
                  <div className="flex justify-end gap-3 text-xs">
                    <button onClick={() => testChannel(c.id)} className="text-[var(--color-brand-2)] hover:underline">
                      测试连通
                    </button>
                    <button onClick={() => openEditChannel(c)} className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
                      编辑
                    </button>
                    <button onClick={() => openDeleteChannel(c)} className="text-red-500 hover:text-red-600">
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新增渠道 */}
      <h2 className="mt-10 text-lg font-semibold">接入新渠道</h2>
      <form onSubmit={addChannel} className="card mt-3 space-y-6 p-5">
        <section>
          <h3 className="text-sm font-semibold">基本信息</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[var(--color-faint)]">渠道类型
              <select value={chType} onChange={(e) => { const type = Number(e.target.value); setChType(type); setChName(channelTypeLabel(type)); }} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none">
                {CHANNEL_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-[var(--color-faint)]">渠道名称
              <input value={chName} onChange={(e) => setChName(e.target.value)} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none" />
            </label>
            <label className="text-xs text-[var(--color-faint)] sm:col-span-2">上游 Base URL（留空使用官方地址）
              <input value={chBase} onChange={(e) => setChBase(e.target.value)} placeholder="https://api.example.com" className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none" />
            </label>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <h3 className="text-sm font-semibold">凭证</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[var(--color-faint)]">添加模式
              <select value={chMode} onChange={(e) => setChMode(e.target.value as typeof chMode)} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none">
                <option value="single">单 Key</option><option value="batch">批量添加（每行一个 Key）</option><option value="multi_to_single">多 Key 单渠道</option>
              </select>
            </label>
            <label className="text-xs text-[var(--color-faint)]">OpenAI Organization（可选）
              <input value={chOrganization} onChange={(e) => setChOrganization(e.target.value)} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none" />
            </label>
            <label className="text-xs text-[var(--color-faint)] sm:col-span-2">API 凭证
              <textarea value={chKey} onChange={(e) => setChKey(e.target.value)} rows={chMode === "single" ? 2 : 5} placeholder={CHANNEL_KEY_HINTS[chType] || (chMode === "single" ? "输入上游 API Key" : "每行输入一个 API Key")} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none" />
            </label>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] pt-5">
          <h3 className="text-sm font-semibold">模型与分组</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[var(--color-faint)] sm:col-span-2">开放模型（逗号分隔）
              <textarea value={chModels} onChange={(e) => setChModels(e.target.value)} rows={3} placeholder="model-a,model-b" className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none" />
            </label>
            <label className="text-xs text-[var(--color-faint)]">用户分组（逗号分隔）
              <input value={chGroup} onChange={(e) => setChGroup(e.target.value)} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none" />
            </label>
            <label className="text-xs text-[var(--color-faint)]">测试模型
              <input value={chTestModel} onChange={(e) => setChTestModel(e.target.value)} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none" />
            </label>
            <label className="text-xs text-[var(--color-faint)] sm:col-span-2">模型映射（JSON）
              <textarea value={chModelMapping} onChange={(e) => setChModelMapping(e.target.value)} rows={3} placeholder={'{"请求模型":"上游模型"}'} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none" />
            </label>
          </div>
        </section>

        <details className="border-t border-[var(--color-border)] pt-5">
          <summary className="cursor-pointer text-sm font-semibold">高级设置</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[var(--color-faint)]">优先级<input type="number" value={chPriority} onChange={(e) => setChPriority(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5" /></label>
            <label className="text-xs text-[var(--color-faint)]">权重<input type="number" value={chWeight} onChange={(e) => setChWeight(Number(e.target.value))} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5" /></label>
            <label className="text-xs text-[var(--color-faint)]">标签<input value={chTag} onChange={(e) => setChTag(e.target.value)} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5" /></label>
            <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={chAutoBan} onChange={(e) => setChAutoBan(e.target.checked)} />异常时自动禁用</label>
            {[["状态码映射", chStatusMapping, setChStatusMapping], ["参数覆盖", chParamOverride, setChParamOverride], ["请求头覆盖", chHeaderOverride, setChHeaderOverride], ["渠道运行设置", chSetting, setChSetting], ["类型专用设置", chSettings, setChSettings]] .map(([label, value, setter]) => (
              <label key={label as string} className="text-xs text-[var(--color-faint)]">{label as string}（JSON）<textarea value={value as string} onChange={(e) => (setter as (value: string) => void)(e.target.value)} rows={3} placeholder="{}" className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none" /></label>
            ))}
            <label className="text-xs text-[var(--color-faint)] sm:col-span-2">备注<textarea value={chRemark} onChange={(e) => setChRemark(e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none" /></label>
          </div>
        </details>
        <button
          type="submit"
          disabled={busy || !chName.trim() || !chKey.trim() || !chModels.trim()}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40"
        >
          {busy ? "接入中…" : "接入渠道"}
        </button>
      </form>

      <p className="mt-4 text-xs text-[var(--color-faint)]">
        配好渠道后:去 <a href="/dashboard" className="text-[var(--color-brand-2)]">控制台</a> 创建
        sk- Key → 在 <a href="/chat" className="text-[var(--color-brand-2)]">对话</a> 里选模型即可使用。
      </p>

      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-channel-title">
          <form onSubmit={updateChannel} className="w-full max-w-xl space-y-4 rounded-2xl bg-[var(--color-bg)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="edit-channel-title" className="text-lg font-semibold">编辑渠道</h2>
              <button type="button" disabled={busy} onClick={closeEditChannel} className="text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-40">
                关闭
              </button>
            </div>
            <div>
              <label className="text-xs text-[var(--color-faint)]">渠道名称</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-faint)]">上游 Base URL(留空用官方)</label>
              <input
                value={editBase}
                onChange={(e) => setEditBase(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-faint)]">开放的模型(逗号分隔)</label>
              <input
                value={editModels}
                onChange={(e) => setEditModels(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-faint)]">新上游 API Key(可选)</label>
              <input
                type="password"
                value={editKey}
                onChange={(e) => setEditKey(e.target.value)}
                autoComplete="new-password"
                placeholder="留空表示保持现有 Key"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 font-mono text-xs outline-none"
              />
              <p className="mt-1 text-xs text-[var(--color-faint)]">留空表示保持现有 Key；填写后将替换旧 Key。</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editEnabled} onChange={(e) => setEditEnabled(e.target.checked)} />
              启用此渠道
            </label>
            {editError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" disabled={busy} onClick={closeEditChannel} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-40">
                取消
              </button>
              <button
                type="submit"
                disabled={busy || !editName.trim() || !editModels.trim()}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40"
              >
                {busy ? "保存中…" : "保存更改"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deletingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-channel-title">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void deleteChannel();
            }}
            className="w-full max-w-md space-y-4 rounded-2xl bg-[var(--color-bg)] p-6 shadow-2xl"
          >
            <h2 id="delete-channel-title" className="text-lg font-semibold text-red-600">永久删除渠道</h2>
            <p className="text-sm text-[var(--color-muted)]">
              删除后不可恢复，模型 <span className="font-mono text-[var(--color-text)]">{deletingChannel.models}</span> 可能立即无法调用。
            </p>
            <div>
              <label className="text-xs text-[var(--color-faint)]">
                输入渠道名称 <span className="font-mono text-[var(--color-text)]">{deletingChannel.name}</span> 以确认
              </label>
              <input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-red-300 bg-[var(--color-panel)] px-3 py-2.5 text-sm outline-none"
              />
            </div>
            {deleteError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" disabled={busy} onClick={closeDeleteChannel} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-40">
                取消
              </button>
              <button
                type="submit"
                disabled={busy || deleteConfirmName !== deletingChannel.name}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
              >
                {busy ? "删除中…" : "永久删除"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
