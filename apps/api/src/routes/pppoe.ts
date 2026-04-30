import { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { mockMikrotikService } from "../services/mikrotik/client";

export default async function pppoeRoutes(app: FastifyInstance) {
  app.get("/users", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getPppoeUsers() };
    }
    return { data: [] };
  });

  app.get("/active", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getPppoeActiveUsers() };
    }
    return { data: [] };
  });

  app.get("/profiles", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getPppoeProfiles() };
    }
    return { data: [] };
  });

  app.post("/users", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const body = request.body as Record<string, unknown>;
    mockMikrotikService.createPppoeUser(body);
    return { data: { message: "User created" } };
  });

  app.delete("/users/:username", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const { username } = request.params as { username: string };
    mockMikrotikService.deletePppoeUser(username);
    return { data: { message: "User deleted" } };
  });

  // Block / Unblock PPPoE user (temporary suspend)
  app.post("/users/:username/block", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request, reply) => {
    const { username } = request.params as { username: string };
    const { durationMinutes } = request.body as { durationMinutes?: number };
    
    if (env.MIKROTIK_MOCK === "true") {
      mockMikrotikService.blockPppoeUser(username);
      if (durationMinutes) {
        setTimeout(() => {
          mockMikrotikService.unblockPppoeUser(username);
        }, durationMinutes * 60 * 1000);
      }
      return { data: { message: `User ${username} blocked${durationMinutes ? ` for ${durationMinutes} minutes` : ""}` } };
    }
    return reply.status(501).send({ error: { code: "NOT_IMPLEMENTED", message: "Real MikroTik block not yet implemented" } });
  });

  app.post("/users/:username/unblock", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request) => {
    const { username } = request.params as { username: string };
    if (env.MIKROTIK_MOCK === "true") {
      mockMikrotikService.unblockPppoeUser(username);
      return { data: { message: `User ${username} unblocked` } };
    }
    return { data: { message: "User unblocked" } };
  });

  // Disconnect active session
  app.post("/users/:username/disconnect", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request) => {
    const { username } = request.params as { username: string };
    mockMikrotikService.disconnectPppoeUser(username);
    return { data: { message: `User ${username} disconnected` } };
  });
}
