import { FastifyInstance } from "fastify";
import { mikrotikService } from "../services/mikrotik/service";

export default async function pppoeRoutes(app: FastifyInstance) {
  app.get("/users", { preHandler: [app.authenticate] }, async () => {
    const users = await mikrotikService.getPppoeUsers();
    return { data: users };
  });

  app.get("/active", { preHandler: [app.authenticate] }, async () => {
    const users = await mikrotikService.getPppoeActiveUsers();
    return { data: users };
  });

  app.get("/profiles", { preHandler: [app.authenticate] }, async () => {
    const profiles = await mikrotikService.getPppoeProfiles();
    return { data: profiles };
  });

  app.post("/users", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const body = request.body as Record<string, unknown>;
    mikrotikService.createPppoeUser(body);
    return { data: { message: "User created" } };
  });

  app.delete("/users/:username", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const { username } = request.params as { username: string };
    mikrotikService.deletePppoeUser(username);
    return { data: { message: "User deleted" } };
  });

  // Block / Unblock PPPoE user (temporary suspend)
  app.post("/users/:username/block", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request, reply) => {
    const { username } = request.params as { username: string };
    const { durationMinutes } = request.body as { durationMinutes?: number };

    const ok = await mikrotikService.blockPppoeUser(username);
    if (!ok) {
      return reply.status(500).send({ error: { code: "BLOCK_FAILED", message: "Failed to block PPPoE user" } });
    }

    if (durationMinutes) {
      setTimeout(() => {
        mikrotikService.unblockPppoeUser(username).catch(() => {});
      }, durationMinutes * 60 * 1000);
    }

    return { data: { message: `User ${username} blocked${durationMinutes ? ` for ${durationMinutes} minutes` : ""}` } };
  });

  app.post("/users/:username/unblock", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request, reply) => {
    const { username } = request.params as { username: string };
    const ok = await mikrotikService.unblockPppoeUser(username);
    if (!ok) {
      return reply.status(500).send({ error: { code: "UNBLOCK_FAILED", message: "Failed to unblock PPPoE user" } });
    }
    return { data: { message: `User ${username} unblocked` } };
  });

  // Disconnect active session
  app.post("/users/:username/disconnect", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request) => {
    const { username } = request.params as { username: string };
    mikrotikService.disconnectPppoeUser(username);
    return { data: { message: `User ${username} disconnected` } };
  });
}
