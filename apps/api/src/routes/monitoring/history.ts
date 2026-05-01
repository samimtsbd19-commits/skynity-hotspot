import { FastifyInstance } from "fastify";
import { getBandwidthHistory, getResourceHistory } from "../../services/snapshots/service";

export default async function historyRoutes(app: FastifyInstance) {
  app.get("/bandwidth", { preHandler: [app.authenticate] }, async (request) => {
    const { hours = "24" } = request.query as { hours?: string };
    const data = await getBandwidthHistory(Number(hours));
    return { data };
  });

  app.get("/resource", { preHandler: [app.authenticate] }, async (request) => {
    const { hours = "24" } = request.query as { hours?: string };
    const data = await getResourceHistory(Number(hours));
    return { data };
  });
}
