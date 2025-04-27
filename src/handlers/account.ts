import { Hono } from "hono";
import { deleteCookie } from "hono/cookie";
import { authMiddleware } from "../middlewares/auth-middleware";

const accountHandler = new Hono();

accountHandler.use(authMiddleware);

accountHandler.get("/", (c) => {
  const user = c.get("user");
  return c.json({ ...user });
});

accountHandler.delete("/", (c) => {
  deleteCookie(c, "token");
  return c.json({
    message: "Logged out",
  });
});

export default accountHandler;
