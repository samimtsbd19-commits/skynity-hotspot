import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { users, refreshTokens } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";
import { createAccessToken, comparePassword } from "../plugins/auth";
import { randomUUID } from "crypto";
import { loginSchema } from "@skynity/shared/zod";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export default async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const userRows = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (userRows.length === 0) {
      return reply.status(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }
    const user = userRows[0];
    const valid = await comparePassword(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }

    const token = await createAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    });

    const refreshTokenValue = randomUUID();
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 30);

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: refreshTokenValue,
      expiresAt: refreshExpires,
      ipAddress: request.ip as string,
      userAgent: request.headers["user-agent"] || "",
    });

    reply.setCookie("refreshToken", refreshTokenValue, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return {
      data: {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          orgId: user.orgId,
        },
      },
    };
  });

  app.post("/refresh", async (request, reply) => {
    const cookieToken = request.cookies?.refreshToken;
    if (!cookieToken) {
      return reply.status(401).send({ error: { code: "NO_REFRESH_TOKEN", message: "No refresh token" } });
    }
    const rows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, cookieToken))
      .limit(1);
    if (rows.length === 0 || rows[0].revokedAt || (rows[0].expiresAt && new Date(rows[0].expiresAt) < new Date())) {
      return reply.status(401).send({ error: { code: "INVALID_REFRESH_TOKEN", message: "Invalid refresh token" } });
    }

    const userRows = await db.select().from(users).where(eq(users.id, rows[0].userId)).limit(1);
    if (userRows.length === 0) {
      return reply.status(401).send({ error: { code: "USER_NOT_FOUND", message: "User not found" } });
    }
    const user = userRows[0];
    const token = await createAccessToken({ id: user.id, email: user.email, role: user.role, orgId: user.orgId });

    return { data: { accessToken: token } };
  });

  app.post("/logout", async (request, reply) => {
    const cookieToken = request.cookies?.refreshToken;
    if (cookieToken) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, cookieToken));
    }
    reply.clearCookie("refreshToken");
    return { data: { message: "Logged out" } };
  });
}
