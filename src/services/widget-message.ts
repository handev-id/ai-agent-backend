import { prisma } from "../lib/prisma";
import { Content } from "@google/genai";
import { io } from "../socket";
import { Redis } from "ioredis";
import generativeAi from "../lib/gen-ai";
import cache from "../lib/redis";

export interface WidgetMessageProps {
  userId: string;
  text: string;
  clientId: string;
}

export default class WidgetMessage {
  public static async receiveMessage(data: WidgetMessageProps) {
    const { clientId, text, userId } = data;
    const credentials = await cache(`agent:${clientId}`, async () => {
      return await prisma.aiAgentCredentials.findUnique({
        where: {
          clientId,
        },
        include: {
          aiAgent: true,
        },
      });
    });

    if (!credentials || !credentials.aiAgent) {
      return;
    }

    const firstMessage = [
      {
        role: "user",
        parts: [{ text }],
      },
      {
        role: "model",
        parts: [{ text: credentials.aiAgent?.welcomeMessage }],
      },
    ];

    const redis = new Redis();

    const existingMessage = await redis.get(userId);

    if (!existingMessage) {
      await redis.set(userId, JSON.stringify(firstMessage));
      return {
        response: credentials.aiAgent?.welcomeMessage || "-",
        userId,
      };
    }

    io.emit(`agent-typing:${userId}`, true);

    const parseMessage = JSON.parse(existingMessage) as Content[];

    const instruction = `${credentials.aiAgent?.instruction}
    ${
      credentials.aiAgent?.resource
        ? "INI SUMBER PENGETAHUAN UNTUK KAMU: " + credentials.aiAgent?.resource
        : ""
    }`;

    const aiResponse = await generativeAi({
      GEN_AI_KEY: credentials.generativeAiKey,
      id: credentials.aiAgent.name,
      instruction: instruction || "Your assistant is a helpful assistant.",
      contents: parseMessage.concat([
        {
          role: "user",
          parts: [{ text }],
        },
      ]),
    });

    const saveMessage = [
      {
        role: "user",
        parts: [{ text }],
      },
      {
        role: "model",
        parts: [{ text: aiResponse }],
      },
    ];

    await redis.set(userId, JSON.stringify(saveMessage));

    return {
      response: aiResponse,
      userId,
    };
  }
}
