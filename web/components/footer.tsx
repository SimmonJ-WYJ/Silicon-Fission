export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-border-soft)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-10 text-sm text-[var(--color-faint)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-medium text-[var(--color-muted)]">硅基裂变 · Silicon Fission</span>
          <span className="ml-2">统一大模型 API 网关</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="/models" className="hover:text-[var(--color-muted)]">模型</a>
          <a href="/rankings" className="hover:text-[var(--color-muted)]">榜单</a>
          <a href="/terms" className="hover:text-[var(--color-muted)]">服务条款</a>
          <a href="/privacy" className="hover:text-[var(--color-muted)]">隐私政策</a>
        </div>
      </div>
    </footer>
  );
}
