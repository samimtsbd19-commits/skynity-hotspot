import { FastifyInstance } from "fastify";
import { mikrotikService } from "../../services/mikrotik/service";

export default async function bandwidthRoutes(app: FastifyInstance) {
  app.get("/interfaces", { preHandler: [app.authenticate] }, async () => {
    const data = await mikrotikService.getInterfaceList();
    return { data };
  });

  app.get("/traffic/:iface", { preHandler: [app.authenticate] }, async (request) => {
    const { iface } = request.params as { iface: string };
    const data = await mikrotikService.getInterfaceTraffic(iface);
    return { data };
  });
}
