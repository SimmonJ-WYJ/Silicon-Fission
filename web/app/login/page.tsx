import { AuthForm } from "./auth-form";

export const metadata = { title: "登录 · 硅基裂变" };

export default function LoginPage() {
  return (
    <div className="hero-glow">
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-2)] text-xl text-white">
              裂
            </div>
            <h1 className="text-2xl font-semibold">欢迎使用硅基裂变</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              一个 API Key,调用所有大模型
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
