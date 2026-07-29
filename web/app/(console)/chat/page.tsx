import { getModels } from "@/lib/api";
import { Playground } from "./playground";

export const metadata = { title: "对话 Playground · 硅基裂变" };

export default async function ChatPage() {
  const models = await getModels();
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">对话 Playground</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        多模型统一对话。默认连接本地网关 <code>/v1/chat/completions</code>,填入 Key 后即可实测。
      </p>
      <Playground models={models.map((m) => ({ id: m.id, name: m.name }))} />
    </div>
  );
}
