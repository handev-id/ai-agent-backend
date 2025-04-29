import { Hono } from "hono";
import { cors } from "hono/cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./lib/prisma";
import { serveStatic } from "hono/bun";
import WidgetMessage, { WidgetMessageProps } from "./services/widget-message";
import loginHandler from "./handlers/login";
import accountHandler from "./handlers/account";
import aiAgentHandler from "./handlers/ai-agent";

const app = new Hono();
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? "/" : "http://localhost:5173",
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
app.route("api/ai-agent", aiAgentHandler);

const wsServer = createServer();
//@ts-ignore
export const io = new Server(wsServer);

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;
  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }

  const existingAiAgent = await prisma.aiAgentCredentials.findUnique({
    where: {
      clientId: token,
    },
    include: {
      aiAgent: true,
    },
  });

  if (existingAiAgent?.clientId !== token) {
    return next(new Error("Authentication error: Invalid token"));
  }

  socket.emit(`agent:${userId}`, { name: existingAiAgent?.aiAgent?.name });

  next();
});

io.on("connection", (socket) => {
  socket.on("send-message", async (data: WidgetMessageProps) => {
    const message = await WidgetMessage.receiveMessage(data);

    socket.emit(`agent-typing:${data.userId}`, false);

    socket.emit(`reply-message:${message?.userId}`, message?.response);
  });
});

wsServer.listen(3001, () => {
  console.log("Server started on port 3001");
});

export default app;
