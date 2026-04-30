import { FastifyInstance } from "fastify";
import { env } from "../../config/env";
import { mockMikrotikService } from "../../services/mikrotik/client";

export default async function sfpRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getSfpModules() };
    }
    return { data: mockMikrotikService.getSfpModules() };
  });
}
