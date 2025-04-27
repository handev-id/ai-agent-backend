import { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import { prisma } from "../lib/prisma";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const cookie = c.req.raw.headers.get("cookie") || "";

  const token = cookie
    .split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const payload = (await verify(token, "SECRETT", "HS256")) as {
      userId: number;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    c.set("user", user);
    await next();
  } catch (e) {
    return c.json({ message: "Invalid token" }, 401);
  }
};
