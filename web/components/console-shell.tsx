import { ConsoleSidebar } from "./console-sidebar";

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1600px]">
      <ConsoleSidebar />
      <div className="min-w-0 flex-1 pt-12 md:pt-0">{children}</div>
    </div>
  );
}
