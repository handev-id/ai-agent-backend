import { MiddlewareHandler } from "hono";
import { prisma } from "../lib/prisma";
import redis from "../lib/redis";
import { AgentWithCredentials } from "../types/prisma";

export const apiMiddleware: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header("Authorization")?.split(" ")[1];

  if (!apiKey) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const cacheCredentials = await redis(`agent:${apiKey}`, async () => {
    return await prisma.aiAgentCredentials.findUnique({
      where: {
        apiKey,
      },
      include: {
        aiAgent: true,
      },
    });
  });

  if (!cacheCredentials?.aiAgent) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  c.set("agent", {
    ...cacheCredentials.aiAgent,
    credentials: {
      generativeAiKey: cacheCredentials.generativeAiKey,
    },
  } as AgentWithCredentials);
  await next();
};
