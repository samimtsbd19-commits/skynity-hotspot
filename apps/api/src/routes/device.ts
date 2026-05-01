import { FastifyInstance } from "fastify";
import { mikrotikService } from "../services/mikrotik/service";

export default async function deviceRoutes(app: FastifyInstance) {
  app.get("/info", { preHandler: [app.authenticate] }, async () => {
    const info = await mikrotikService.getDeviceInfo();
    return { data: info };
  });
}
