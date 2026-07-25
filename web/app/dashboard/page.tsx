export const metadata = { title: "控制台 · 硅基裂变" };

const KEYS = [
  { name: "生产环境", key: "sk-sf-••••••••3f9a", usage: "$128.40", created: "2026-06-02" },
  { name: "测试", key: "sk-sf-••••••••7b1c", usage: "$4.10", created: "2026-07-11" },
];

const USAGE = [12, 18, 9, 24, 31, 22, 28, 19, 35, 27, 33, 41, 38, 29];

export default function Dashboard() {
  const max = Math.max(...USAGE);
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">控制台</h1>

      {/* Balance + stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card bg-gradient-to-br from-[var(--color-brand)]/15 to-transparent p-5">
          <div className="text-xs text-[var(--color-faint)]">账户余额</div>
          <div className="mt-1 text-3xl font-semibold">¥ 862.50</div>
          <a
            href="/topup"
            className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-gray-200"
          >
            充值
          </a>
        </div>
        <div className="card p-5">
          <div className="text-xs text-[var(--color-faint)]">本月消费</div>
          <div className="mt-1 text-3xl font-semibold">$132.50</div>
          <div className="mt-3 text-xs text-[var(--color-muted)]">较上月 +18%</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-[var(--color-faint)]">本月请求</div>
          <div className="mt-1 text-3xl font-semibold">48,201</div>
          <div className="mt-3 text-xs text-[var(--color-muted)]">成功率 99.4%</div>
        </div>
      </div>

      {/* Usage chart */}
      <div className="card mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-medium">近 14 天用量</div>
          <div className="text-xs text-[var(--color-faint)]">单位:美元</div>
        </div>
        <div className="flex h-40 items-end gap-1.5">
          {USAGE.map((v, i) => (
            <div
              key={i}
              title={`$${v}`}
              className="flex-1 rounded-t bg-gradient-to-t from-[var(--color-brand)] to-[var(--color-brand-2)] transition hover:opacity-80"
              style={{ height: `${(v / max) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* API keys */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <button className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-panel)]">
          + 新建 Key
        </button>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-panel)] text-left text-[var(--color-faint)]">
            <tr>
              <th className="px-4 py-2 font-medium">名称</th>
              <th className="px-4 py-2 font-medium">Key</th>
              <th className="px-4 py-2 font-medium">已用</th>
              <th className="px-4 py-2 font-medium">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {KEYS.map((k) => (
              <tr key={k.key} className="border-t border-[var(--color-border-soft)]">
                <td className="px-4 py-2.5">{k.name}</td>
                <td className="px-4 py-2.5 font-mono text-[var(--color-muted)]">{k.key}</td>
                <td className="px-4 py-2.5">{k.usage}</td>
                <td className="px-4 py-2.5 text-[var(--color-muted)]">{k.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
