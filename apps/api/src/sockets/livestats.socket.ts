import { FastifyInstance } from "fastify";
import { mockMikrotikService } from "../services/mikrotik/client";
import { env } from "../config/env";

export function startLiveStatsSocketEmitter(app: FastifyInstance) {
  const io = app.io;

  setInterval(() => {
    try {
      if (env.MIKROTIK_MOCK === "true") {
        mockMikrotikService.tickLiveSpeeds();
      }

      const stats = mockMikrotikService.getLiveStats();

      io.to("livestats").emit("livestats-update", stats);
      io.to("dashboard").emit("livestats-update", stats);
    } catch (err) {
      app.log.error({ msg: "Live stats socket emit failed", err });
    }
  }, 3000);
}
