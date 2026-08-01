import { handleLogsRequest } from "@/app/api/admin/logs/route";

export async function GET(req: Request) {
  return handleLogsRequest(req, "self");
}
