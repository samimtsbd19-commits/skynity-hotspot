import { FastifyInstance } from "fastify";
import { mikrotikService } from "../services/mikrotik/service";

export function startLiveStatsSocketEmitter(app: FastifyInstance) {
  const io = app.io;

  setInterval(async () => {
    try {
      mikrotikService.tickLiveSpeeds();
      const stats = await mikrotikService.getLiveStats();

      io.to("livestats").emit("livestats-update", stats);
      io.to("dashboard").emit("livestats-update", stats);
    } catch (err) {
      app.log.error({ msg: "Live stats socket emit failed", err });
    }
  }, 3000);
}
