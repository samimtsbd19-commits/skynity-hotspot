import fp from "fastify-plugin";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  orgId: string | null;
}

export async function createAccessToken(user: AuthUser) {
  return new SignJWT({ id: user.id, email: user.email, role: user.role, orgId: user.orgId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
  return {
    id: payload.id as string,
    email: payload.email as string,
    role: payload.role as string,
    orgId: (payload.orgId as string) || null,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
      }
      const token = authHeader.slice(7);
      request.user = await verifyAccessToken(token);
    } catch {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
    }
  });

  app.decorate("requireRole", (...roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user || !roles.includes(request.user.role)) {
        return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
      }
    };
  });
});
