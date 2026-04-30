import { FastifyInstance } from "fastify";
import { mikrotikService } from "../../services/mikrotik/service";

export default async function queuesRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async () => {
    const data = await mikrotikService.getSimpleQueues();
    return { data };
  });
}
