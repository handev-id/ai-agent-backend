import { Hono } from "hono";
import { apiMiddleware } from "../middlewares/api-middleware";
import { prisma } from "../lib/prisma";
import vine from "@vinejs/vine";
import generativeAi from "../lib/gen-ai";
import redis from "../lib/redis";
import { Content, ContentListUnion } from "@google/genai";

const historyHandler = new Hono();

historyHandler.use(apiMiddleware);

historyHandler.post("/", async (c) => {
  const agent = c.get("agent");
  const { userId, content } = await vine.validate({
    schema: vine.object({
      userId: vine.string().uuid(), // GENERATE FROM CLIENT
      content: vine.string(),
    }),
    data: c.req.json(),
  });

  const cacheHistory = await redis(`history:${userId}`, async () => {
    return await prisma.history.findUnique({
      where: {
        userId,
      },
    });
  });

  const firstContents: ContentListUnion = [
    {
      role: "user",
      parts: [{ text: content }],
    },
    {
      role: "model",
      parts: [{ text: agent.welcomeMessage || "Halo" }],
    },
  ];

  if (!cacheHistory) {
    const savedHistory = await prisma.history.create({
      data: {
        userId,
        agentId: agent.id,
        contents: JSON.stringify(firstContents),
      },
      include: {
        agent: true,
      },
    });

    return c.json(savedHistory);
  }

  const newContents = (cacheHistory.contents as Content[]).concat(
    firstContents
  );

  const aiResponse = await generativeAi({
    GEN_AI_KEY: agent.credentials!.generativeAiKey,
    id: `${agent.id}`,
    instruction: agent?.instruction!,
    contents: newContents,
  });

  const savedHistory = await prisma.history.update({
    where: {
      userId,
    },
    data: {
      contents: JSON.stringify(
        newContents.concat([
          {
            role: "user",
            parts: [{ text: content }],
          },
          {
            role: "model",
            parts: [{ text: aiResponse }],
          },
        ])
      ),
    },
    include: {
      agent: true,
    },
  });

  return c.json(savedHistory);
});

export default historyHandler;
