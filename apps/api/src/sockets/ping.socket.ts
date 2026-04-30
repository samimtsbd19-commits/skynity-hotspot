import { FastifyInstance } from "fastify";
import { mikrotikService } from "../services/mikrotik/service";

const PING_TARGETS = ["8.8.8.8", "1.1.1.1", "208.67.222.222", "speedtest.bdsnet.com"];

export function startPingSocketEmitter(app: FastifyInstance) {
  const io = app.io;

  setInterval(async () => {
    try {
      const results = await Promise.all(
        PING_TARGETS.map((host) => mikrotikService.pingHost(host))
      );

      io.to("ping").emit("ping-update", results);
      io.to("dashboard").emit("ping-update", results);
    } catch (err) {
      app.log.error({ msg: "Ping socket emit failed", err });
    }
  }, 10000);
}
