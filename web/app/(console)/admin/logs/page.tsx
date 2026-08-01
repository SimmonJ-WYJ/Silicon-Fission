import { redirect } from "next/navigation";

export const metadata = { title: "调用日志 · 硅基裂变" };

export default function LogsPage() {
  redirect("/logs");
}
