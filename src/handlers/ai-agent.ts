import vine from "@vinejs/vine";
import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth-middleware";
import credentialsHandler from "./credentials";

const aiAgentHandler = new Hono();

aiAgentHandler.use(authMiddleware);

aiAgentHandler.post("/", async (c) => {
  const { name } = await vine.validate({
    schema: vine.object({
      name: vine.string(),
    }),
    data: await c.req.json(),
  });

  const agent = await prisma.aiAgent.create({
    data: {
      name,
      user: {
        connect: {
          id: c.get("user").id,
        },
      },
    },
  });

  return c.json(agent);
});

aiAgentHandler.get("/", async (c) => {
  const agents = await prisma.aiAgent.findMany({
    where: {
      user: {
        id: c.get("user").id,
      },
    },
    include: {
      credentials: true,
    },
  });

  const serializedAgents = agents.map((agent) => {
    return {
      ...agent,
      credentials: !agent.credentials
        ? null
        : {
            ...agent.credentials,
            apiKey: undefined,
          },
    };
  });

  return c.json(serializedAgents);
});

aiAgentHandler.put("/:id", async (c) => {
  const { id } = c.req.param();
  const { name, instruction, welcomeMessage, resource } = await vine.validate({
    schema: vine.object({
      welcomeMessage: vine.string().optional(),
      instruction: vine.string().optional(),
      resource: vine.string().optional(),
      name: vine.string(),
    }),
    data: await c.req.json(),
  });

  const agent = await prisma.aiAgent.update({
    where: {
      id: Number(id),
    },
    data: {
      name,
      instruction,
      welcomeMessage,
      resource,
    },
  });

  return c.json(agent);
});

aiAgentHandler.delete("/:id", async (c) => {
  const { id } = c.req.param();

  const agent = await prisma.aiAgent.delete({
    where: {
      id: Number(id),
    },
  });

  return c.json(agent);
});

aiAgentHandler.route("/credentials", credentialsHandler);

export default aiAgentHandler;
