import { FastifyInstance } from "fastify";
import { mockMikrotikService } from "../services/mikrotik/client";
import { env } from "../config/env";

export function startResourceSocketEmitter(app: FastifyInstance) {
  const io = app.io;

  setInterval(async () => {
    try {
      let resource;
      if (env.MIKROTIK_MOCK === "true") {
        resource = mockMikrotikService.getSystemResource();
      } else {
        resource = mockMikrotikService.getSystemResource();
      }

      io.to("resource").emit("resource-update", {
        ...resource,
        timestamp: new Date().toISOString(),
      });
      io.to("dashboard").emit("resource-update", {
        ...resource,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      app.log.error({ msg: "Resource socket emit failed", err });
    }
  }, 5000);
}
