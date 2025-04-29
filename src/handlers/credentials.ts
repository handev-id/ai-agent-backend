import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { generateCredentials } from "../services/generate-key";
import vine from "@vinejs/vine";

const credentialsHandler = new Hono();

credentialsHandler.get("/:id", async (c) => {
  const id = await vine.validate({
    schema: vine.number(),
    data: c.req.param("id"),
  });

  const credentials = await prisma.aiAgentCredentials.findUnique({
    where: {
      id,
    },
  });

  return c.json(credentials);
});

credentialsHandler.post("/", async (c) => {
  const { aiAgentId, callbackUrl, generativeAiKey } = await vine.validate({
    schema: vine.object({
      aiAgentId: vine.number(),
      generativeAiKey: vine.string(),
      callbackUrl: vine.string().optional(),
    }),
    data: await c.req.json(),
  });

  const existingGenerativeKey = await prisma.aiAgentCredentials.findFirst({
    where: {
      generativeAiKey,
    },
  });

  if (existingGenerativeKey) {
    return c.json({ message: "Generative AI key already exists" }, 400);
  }

  const { apiKey, clientId } = generateCredentials();

  const credentials = await prisma.aiAgentCredentials.upsert({
    where: {
      aiAgentId,
    },
    update: {
      callbackUrl: callbackUrl || null,
      generativeAiKey,
    },
    create: {
      callbackUrl: callbackUrl || null,
      generativeAiKey,
      apiKey,
      clientId,
      aiAgentId,
    },
  });

  await prisma.aiAgent.update({
    where: {
      id: aiAgentId,
    },
    data: {
      credentialsId: credentials.id,
    },
  });

  return c.json(credentials);
});

credentialsHandler.delete("/:id", async (c) => {
  const id = await vine.validate({
    schema: vine.number(),
    data: c.req.param("id"),
  });
  await prisma.aiAgentCredentials.delete({
    where: {
      id,
    },
  });
  return c.json({ message: "Credentials deleted" });
});

export default credentialsHandler;
