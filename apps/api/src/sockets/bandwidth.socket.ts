import { FastifyInstance } from "fastify";
import { mockMikrotikService } from "../services/mikrotik/client";
import { env } from "../config/env";

export function startBandwidthSocketEmitter(app: FastifyInstance) {
  const io = app.io;

  setInterval(async () => {
    try {
      let interfaces;
      if (env.MIKROTIK_MOCK === "true") {
        interfaces = mockMikrotikService.getInterfaceList();
      } else {
        interfaces = mockMikrotikService.getInterfaceList();
      }

      const payload = interfaces.map((iface) => ({
        name: iface.name,
        rxRate: Number(iface.rxRate),
        txRate: Number(iface.txRate),
        rxBytes: String(iface.rxBytes),
        txBytes: String(iface.txBytes),
        isUp: iface.isUp,
        timestamp: new Date().toISOString(),
      }));

      io.to("bandwidth").emit("bandwidth-update", payload);
      io.to("dashboard").emit("bandwidth-update", payload);
    } catch (err) {
      app.log.error({ msg: "Bandwidth socket emit failed", err });
    }
  }, 5000);
}
