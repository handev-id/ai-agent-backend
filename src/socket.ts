import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./lib/prisma";
import WidgetMessage, { WidgetMessageProps } from "./services/widget-message";

const wsServer = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Hello world" }));
  }
});

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
