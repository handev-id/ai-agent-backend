import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import loginHandler from "./handlers/login";
import accountHandler from "./handlers/account";
import aiAgentHandler from "./handlers/ai-agent";
import historyHandler from "./handlers/history";

const app = new Hono();
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "/"
        : `${process.env.FRONTEND_URL}`,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(
  "/static/*",
  serveStatic({
    root: "./",
  })
);

app.route("/api/auth", loginHandler);
app.route("/api/account", accountHandler);
app.route("/api/ai-agent", aiAgentHandler);
app.route("/api/histories", historyHandler);

export default app;
