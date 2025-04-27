import { OAuth2Client } from "google-auth-library";
import { Hono } from "hono";
import { GoogleIdTokenPayload } from "../types/google";
import { prisma } from "../lib/prisma";
import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import axios from "axios";

const loginHandler = new Hono();
const clientId = process.env.GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const baseUrl = process.env.BASE_URL!;
const redirectUri = `${baseUrl}/api/auth/callback`;
const CLIENT_URL =
  process.env.NODE_ENV !== "production" ? "http://localhost:5173" : baseUrl;

loginHandler.get("/login", (c) => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return c.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
});

loginHandler.get("/callback", async (c) => {
  const code = c.req.query("code") as string;

  const tokenRes = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { id_token } = tokenRes.data;

  const ticket = await new OAuth2Client(clientId).verifyIdToken({
    idToken: id_token,
    audience: clientId,
  });

  const payload = ticket.getPayload() as GoogleIdTokenPayload;
  console.log(payload);

  let user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
      },
    });
  }

  const token = await sign(
    { userId: user.id, email: user.email, exp: Date.now() + 60 * 60 * 24 * 7 },
    "SECRETT",
    "HS256"
  );

  setCookie(c, "token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return c.redirect(CLIENT_URL);
});

export default loginHandler;
