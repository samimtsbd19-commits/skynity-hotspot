import { FastifyInstance } from "fastify";
import { env } from "../../config/env";
import { mockMikrotikService } from "../../services/mikrotik/client";

export default async function resourceRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getSystemResource() };
    }
    return { data: mockMikrotikService.getSystemResource() };
  });

  app.get("/health", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getSystemHealth() };
    }
    return { data: mockMikrotikService.getSystemHealth() };
  });
}
