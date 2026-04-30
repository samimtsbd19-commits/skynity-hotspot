import { FastifyInstance } from "fastify";
import { SnmpMonitor } from "../services/nms/snmp";
import { z } from "zod";

const discoverSchema = z.object({
  ip: z.string().ip(),
  community: z.string().default("public"),
  version: z.number().default(1),
  type: z.enum(["camera", "switch", "ap", "olt", "other"]).default("other"),
});

export default async function nmsRoutes(app: FastifyInstance) {
  app.post("/discover", { preHandler: [app.authenticate] }, async (request) => {
    const body = discoverSchema.parse(request.body);
    const device = await SnmpMonitor.discoverDevice(body.ip, body.community, body.version);
    return { data: device };
  });

  app.post("/camera/check", { preHandler: [app.authenticate] }, async (request) => {
    const { ip, username, password } = request.body as { ip: string; username?: string; password?: string };
    const result = await SnmpMonitor.checkCamera(ip, username, password);
    return { data: result };
  });

  app.get("/devices", { preHandler: [app.authenticate] }, async () => {
    return {
      data: [
        { id: "1", name: "Tower-A-Cam-01", ip: "192.168.88.101", type: "camera", status: "online", streamUrl: "rtsp://192.168.88.101:554/stream1" },
        { id: "2", name: "Tower-B-Cam-01", ip: "192.168.88.102", type: "camera", status: "online", streamUrl: "rtsp://192.168.88.102:554/stream1" },
        { id: "3", name: "Core-Switch", ip: "192.168.88.10", type: "switch", status: "online" },
        { id: "4", name: "AP-Tower-1", ip: "192.168.88.51", type: "ap", status: "online" },
        { id: "5", name: "OLT-Main", ip: "192.168.88.200", type: "olt", status: "online" },
      ],
    };
  });
}
