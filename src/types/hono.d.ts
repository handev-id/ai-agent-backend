// types/hono.d.ts
import { User } from "@prisma/client";
import "hono";
import { AgentWithCredentials } from "./prisma";

declare module "hono" {
  interface ContextVariableMap {
    user: User;
    agent: AgentWithCredentials;
  }
}
