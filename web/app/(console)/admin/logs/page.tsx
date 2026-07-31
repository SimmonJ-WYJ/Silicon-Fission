import { LogsClient } from "./logs-client";

export const metadata = { title: "调用日志 · 硅基裂变" };

export default function LogsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">调用日志</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        按用户、模型、渠道和时间区间查看调用与消费记录。
      </p>
      <LogsClient />
    </div>
  );
}
