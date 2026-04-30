import { FastifyInstance } from "fastify";
import { mikrotikService } from "../services/mikrotik/service";

export function startResourceSocketEmitter(app: FastifyInstance) {
  const io = app.io;

  setInterval(async () => {
    try {
      const resource = await mikrotikService.getSystemResource();

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
