import { FastifyInstance } from "fastify";
import { checkSystemAlerts, checkExpiringSubscriptions } from "../services/alerts/service";

export default async function alertRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async () => {
    const [systemAlerts, expiryAlerts] = await Promise.all([
      checkSystemAlerts(),
      checkExpiringSubscriptions(),
    ]);

    return {
      data: {
        alerts: [...systemAlerts, ...expiryAlerts],
        count: systemAlerts.length + expiryAlerts.length,
      },
    };
  });
}
