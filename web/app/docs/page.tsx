import { DocsClient } from "./docs-client";

export const metadata = { title: "接入文档 · 硅基裂变" };

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">接入文档</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        硅基裂变完全兼容 OpenAI 接口。已有的 OpenAI 代码,只需把 base_url 换成本站、api_key 换成你的
        sk- Key,即可调用平台接入的所有模型。
      </p>
      <DocsClient />
    </div>
  );
}
