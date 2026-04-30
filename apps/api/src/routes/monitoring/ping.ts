import { FastifyInstance } from "fastify";
import { env } from "../../config/env";
import { mockMikrotikService } from "../../services/mikrotik/client";

export default async function pingRoutes(app: FastifyInstance) {
  app.get("/:host", { preHandler: [app.authenticate] }, async (request) => {
    const { host } = request.params as { host: string };
    const result = await mockMikrotikService.pingHost(decodeURIComponent(host));
    return { data: result };
  });

  app.get("/", { preHandler: [app.authenticate] }, async () => {
    const targets = ["8.8.8.8", "1.1.1.1", "208.67.222.222", "speedtest.bdsnet.com"];
    const results = await Promise.all(targets.map((h) => mockMikrotikService.pingHost(h)));
    return { data: results };
  });
}
