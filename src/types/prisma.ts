import { Prisma } from "@prisma/client";

export const agentWithCredentials =
  Prisma.validator<Prisma.AiAgentDefaultArgs>()({
    include: {
      credentials: true,
    },
  });

export type AgentWithCredentials = Prisma.AiAgentGetPayload<
  typeof agentWithCredentials
>;
