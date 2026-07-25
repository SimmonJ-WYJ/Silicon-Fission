import { DashboardClient } from "./dashboard-client";

export const metadata = { title: "控制台 · 硅基裂变" };

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">控制台</h1>
      <DashboardClient />
    </div>
  );
}
