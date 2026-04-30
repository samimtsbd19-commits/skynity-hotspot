import { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { mockMikrotikService } from "../services/mikrotik/client";

export default async function hotspotRoutes(app: FastifyInstance) {
  app.get("/users", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getHotspotUsers() };
    }
    return { data: [] };
  });

  app.get("/active", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getHotspotActiveUsers() };
    }
    return { data: [] };
  });

  app.get("/profiles", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getHotspotProfiles() };
    }
    return { data: [] };
  });

  // Block / Unblock Hotspot user
  app.post("/users/:id/block", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { durationMinutes } = request.body as { durationMinutes?: number };
    
    if (env.MIKROTIK_MOCK === "true") {
      mockMikrotikService.blockHotspotUser(id);
      if (durationMinutes) {
        setTimeout(() => {
          mockMikrotikService.unblockHotspotUser(id);
        }, durationMinutes * 60 * 1000);
      }
      return { data: { message: `Hotspot user ${id} blocked${durationMinutes ? ` for ${durationMinutes} minutes` : ""}` } };
    }
    return reply.status(501).send({ error: { code: "NOT_IMPLEMENTED", message: "Real MikroTik block not yet implemented" } });
  });

  app.post("/users/:id/unblock", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request) => {
    const { id } = request.params as { id: string };
    if (env.MIKROTIK_MOCK === "true") {
      mockMikrotikService.unblockHotspotUser(id);
      return { data: { message: `Hotspot user ${id} unblocked` } };
    }
    return { data: { message: "User unblocked" } };
  });

  // Disconnect active hotspot session
  app.post("/users/:id/disconnect", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request) => {
    const { id } = request.params as { id: string };
    mockMikrotikService.disconnectHotspotUser(id);
    return { data: { message: `Hotspot user ${id} disconnected` } };
  });
}
