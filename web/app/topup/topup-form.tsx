"use client";

import { useMemo, useState } from "react";
import { createTopupOrder, type TopupOrder } from "@/lib/api";

const PRESETS = [50, 100, 300, 500, 1000, 3000];
const FX = 7.2; // 演示汇率
const FEE = 0.03;

const METHODS = [
  { id: "alipay", label: "支付宝", icon: "🅰️", desc: "推荐 · 即时到账" },
  { id: "wechat", label: "微信支付", icon: "💬", desc: "扫码支付" },
  { id: "card", label: "国际信用卡", icon: "💳", desc: "USD 结算 (Stripe)" },
] as const;

export function TopupForm() {
  const [amount, setAmount] = useState<number>(100);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<string>("alipay");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<TopupOrder | null>(null);

  const effective = custom ? Number(custom) || 0 : amount;
  const credits = useMemo(
    () => (effective > 0 ? ((effective / FX) * (1 - FEE)).toFixed(2) : "0.00"),
    [effective],
  );

  async function submit() {
    if (effective < 10) return;
    setBusy(true);
    setOrder(null);
    try {
      const o = await createTopupOrder(effective, method);
      setOrder(o);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Left: amount + method */}
      <div className="space-y-6">
        <div className="card p-5">
          <div className="mb-3 text-sm font-medium">选择金额</div>
          <div className="grid grid-cols-3 gap-3">
            {PRESETS.map((v) => (
              <button
                key={v}
                onClick={() => {
                  setAmount(v);
                  setCustom("");
                }}
                className={`rounded-xl border px-4 py-3 text-center transition ${
                  !custom && amount === v
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10"
                    : "border-[var(--color-border)] hover:border-[#33373f]"
                }`}
              >
                <div className="font-semibold">¥{v}</div>
                <div className="mt-0.5 text-xs text-[var(--color-faint)]">
                  ≈ {((v / FX) * (1 - FEE)).toFixed(1)} credits
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-[var(--color-muted)]">自定义</span>
            <div className="flex flex-1 items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3">
              <span className="text-sm text-[var(--color-faint)]">¥</span>
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="最低 ¥10"
                className="w-full bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-[var(--color-faint)]"
              />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 text-sm font-medium">支付方式</div>
          <div className="space-y-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  method === m.id
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10"
                    : "border-[var(--color-border)] hover:border-[#33373f]"
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-[var(--color-faint)]">{m.desc}</div>
                </div>
                <span
                  className={`h-4 w-4 rounded-full border-2 ${
                    method === m.id
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)]"
                      : "border-[var(--color-border)]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: summary */}
      <div className="h-fit space-y-4">
        <div className="card p-5">
          <div className="text-sm font-medium">订单摘要</div>
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">充值金额</span>
              <span>¥{effective || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">手续费 (3%)</span>
              <span>¥{(effective * FEE).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">参考汇率</span>
              <span>1 USD ≈ {FX} CNY</span>
            </div>
            <div className="my-2 h-px bg-[var(--color-border)]" />
            <div className="flex items-baseline justify-between">
              <span className="text-[var(--color-muted)]">到账 Credits</span>
              <span className="text-xl font-semibold text-[var(--color-brand-2)]">{credits}</span>
            </div>
          </div>
          <button
            onClick={submit}
            disabled={busy || effective < 10}
            className="mt-5 w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black transition hover:bg-gray-200 disabled:opacity-40"
          >
            {busy ? "创建订单中…" : effective < 10 ? "最低充值 ¥10" : "立即支付"}
          </button>
          <p className="mt-3 text-center text-xs text-[var(--color-faint)]">
            1 credit = 1 USD 等值额度,余额永不过期
          </p>
        </div>

        {order && (
          <div className="card border-[var(--color-green)]/30 p-5">
            <div className="text-sm font-medium text-[var(--color-green)]">✓ 订单已创建(演示)</div>
            <div className="mt-3 space-y-1.5 text-xs text-[var(--color-muted)]">
              <div>订单号:{order.orderId}</div>
              <div>金额:¥{order.amountCny}</div>
              <div>到账:{order.credits} credits</div>
              <div>
                方式:{METHODS.find((m) => m.id === order.method)?.label ?? order.method}
              </div>
            </div>
            <div className="mt-4 grid place-items-center rounded-lg bg-[var(--color-panel-2)] py-8 text-xs text-[var(--color-faint)]">
              [ 支付二维码占位 —— 接入易支付/Stripe 后展示 ]
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
