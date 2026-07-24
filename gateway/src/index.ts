import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "./config.js";
import { auth } from "./middleware/auth.js";
import { chat } from "./routes/chat.js";
import { models } from "./routes/models.js";

const app = new Hono();

app.get("/", (c) => c.json({ name: "Silicon Fission Gateway", status: "ok" }));
app.use("/v1/*", auth);
app.route("/v1/chat", chat);
app.route("/v1/models", models);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  const configured = Object.entries(config.providerKeys)
    .filter(([, v]) => v)
    .map(([k]) => k);
  console.log(`⚡ Silicon Fission gateway listening on http://localhost:${info.port}`);
  console.log(
    configured.length
      ? `   Providers configured: ${configured.join(", ")}`
      : "   ⚠ No provider keys configured — set them in .env (see .env.example)",
  );
});
