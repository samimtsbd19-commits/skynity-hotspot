import { FastifyInstance } from "fastify";
import { mikrotikService } from "../../services/mikrotik/service";

export default async function resourceRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async () => {
    const data = await mikrotikService.getSystemResource();
    return { data };
  });

  app.get("/health", { preHandler: [app.authenticate] }, async () => {
    const data = await mikrotikService.getSystemHealth();
    return { data };
  });
}
