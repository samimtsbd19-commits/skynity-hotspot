import { FastifyInstance } from "fastify";
import { env } from "../../config/env";
import { mockMikrotikService } from "../../services/mikrotik/client";

export default async function neighborsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getNeighbors() };
    }
    return { data: mockMikrotikService.getNeighbors() };
  });
}
