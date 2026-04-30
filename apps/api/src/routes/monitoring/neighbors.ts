import { FastifyInstance } from "fastify";
import { mikrotikService } from "../../services/mikrotik/service";

export default async function neighborsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async () => {
    const data = await mikrotikService.getNeighbors();
    return { data };
  });
}
