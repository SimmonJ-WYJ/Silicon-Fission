import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { isDemo } from "@/lib/demo";

export const metadata: Metadata = {
  title: "硅基裂变 · Silicon Fission — 统一大模型 API 网关",
  description:
    "一个 API,访问国内外所有先进大模型。OpenAI 兼容接口,智能路由、自动容灾、人民币计费。中国用户不翻墙即可调用 GPT / Claude / Gemini。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {isDemo() && (
          <div className="bg-[var(--color-brand)] px-4 py-1.5 text-center text-xs text-white">
            演示模式 · 登录/工作台数据均为示例,可自由体验界面;配置真实后端(NEWAPI_BASE)后自动切换为真实数据
          </div>
        )}
        <Nav />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
