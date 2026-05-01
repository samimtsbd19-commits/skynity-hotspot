import { FastifyInstance } from "fastify";
import { mikrotikService } from "../services/mikrotik/service";

export default async function hotspotRoutes(app: FastifyInstance) {
  app.get("/users", { preHandler: [app.authenticate] }, async () => {
    const users = await mikrotikService.getHotspotUsers();
    return { data: users };
  });

  app.get("/active", { preHandler: [app.authenticate] }, async () => {
    const users = await mikrotikService.getHotspotActiveUsers();
    return { data: users };
  });

  app.get("/profiles", { preHandler: [app.authenticate] }, async () => {
    const profiles = await mikrotikService.getHotspotProfiles();
    return { data: profiles };
  });

  // Block / Unblock Hotspot user
  app.post("/users/:id/block", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { durationMinutes } = request.body as { durationMinutes?: number };

    const ok = await mikrotikService.blockHotspotUser(id);
    if (!ok) {
      return reply.status(500).send({ error: { code: "BLOCK_FAILED", message: "Failed to block hotspot user" } });
    }

    if (durationMinutes) {
      setTimeout(() => {
        mikrotikService.unblockHotspotUser(id).catch(() => {});
      }, durationMinutes * 60 * 1000);
    }

    return { data: { message: `Hotspot user ${id} blocked${durationMinutes ? ` for ${durationMinutes} minutes` : ""}` } };
  });

  app.post("/users/:id/unblock", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const ok = await mikrotikService.unblockHotspotUser(id);
    if (!ok) {
      return reply.status(500).send({ error: { code: "UNBLOCK_FAILED", message: "Failed to unblock hotspot user" } });
    }
    return { data: { message: `Hotspot user ${id} unblocked` } };
  });

  // Disconnect active hotspot session
  app.post("/users/:id/disconnect", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request) => {
    const { id } = request.params as { id: string };
    mikrotikService.disconnectHotspotUser(id);
    return { data: { message: `Hotspot user ${id} disconnected` } };
  });
}
