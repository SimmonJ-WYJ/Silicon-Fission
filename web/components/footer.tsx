export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-border-soft)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-10 text-sm text-[var(--color-faint)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-medium text-[var(--color-muted)]">硅基裂变 · Silicon Fission</span>
          <span className="ml-2">统一大模型 API 网关</span>
        </div>
        <div className="flex gap-4">
          <span>模型</span>
          <span>文档</span>
          <span>定价</span>
          <span>状态</span>
        </div>
      </div>
    </footer>
  );
}
