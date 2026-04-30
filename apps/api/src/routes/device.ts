import { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { mockMikrotikService } from "../services/mikrotik/client";

export default async function deviceRoutes(app: FastifyInstance) {
  app.get("/info", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return { data: mockMikrotikService.getDeviceInfo() };
    }
    return { data: mockMikrotikService.getDeviceInfo() };
  });
}
