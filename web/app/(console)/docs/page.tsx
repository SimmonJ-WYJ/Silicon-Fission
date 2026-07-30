import { DocsClient } from "./docs-client";

export const metadata = { title: "接入文档 · 硅基裂变" };

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">接入文档</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        这里分两种接入方式:OpenAI 兼容接口用
        <code className="mx-1 rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">https://api.siliconfission.com/v1</code>,
        Claude Code / Anthropic 兼容接入用
        <code className="mx-1 rounded bg-[var(--color-panel-2)] px-1.5 py-0.5">https://api.siliconfission.com</code>。
      </p>
      <DocsClient />
    </div>
  );
}
