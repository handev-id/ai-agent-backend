// types/hono.d.ts
import { User } from "@prisma/client";
import "hono";

declare module "hono" {
  interface ContextVariableMap {
    user: User;
  }
}
