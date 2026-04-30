import { FastifyInstance } from "fastify";
import { env } from "../../config/env";
import { mockMikrotikService } from "../../services/mikrotik/client";

export default async function bandwidthRoutes(app: FastifyInstance) {
  app.get("/interfaces", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getInterfaceList() };
    }
    return { data: mockMikrotikService.getInterfaceList() };
  });

  app.get("/traffic/:iface", { preHandler: [app.authenticate] }, async (request) => {
    const { iface } = request.params as { iface: string };
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getInterfaceTraffic(iface) };
    }
    return { data: mockMikrotikService.getInterfaceTraffic(iface) };
  });
}
