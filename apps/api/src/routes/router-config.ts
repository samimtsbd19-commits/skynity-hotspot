import { FastifyInstance } from "fastify";
import {
  generatePppoeServerRsc,
  generateHotspotRsc,
  generateQueueTreeRsc,
  generateFirewallRsc,
  generateRadiusRsc,
  generateFullRsc,
  generateWireguardRsc,
  RscConfigOptions,
} from "../services/mikrotik/rsc-generator";
import { env } from "../config/env";
import { mockMikrotikService } from "../services/mikrotik/client";

export default async function routerConfigRoutes(app: FastifyInstance) {
  // Generate RSC script
  app.post("/rsc", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const body = request.body as {
      type: "pppoe" | "hotspot" | "queues" | "firewall" | "radius" | "full" | "wireguard";
      config?: Partial<RscConfigOptions>;
      wireguard?: { port: number; privateKey: string; publicKey: string; serverAddress: string };
    };

    let script = "";
    switch (body.type) {
      case "pppoe":
        script = generatePppoeServerRsc(body.config);
        break;
      case "hotspot":
        script = generateHotspotRsc(body.config);
        break;
      case "queues":
        script = generateQueueTreeRsc();
        break;
      case "firewall":
        script = generateFirewallRsc();
        break;
      case "radius":
        script = generateRadiusRsc(body.config);
        break;
      case "wireguard":
        script = generateWireguardRsc(
          body.wireguard?.port,
          body.wireguard?.privateKey || "",
          body.wireguard?.publicKey || "",
          body.wireguard?.serverAddress
        );
        break;
      case "full":
      default:
        script = generateFullRsc(body.config);
        break;
    }

    return { data: { script, type: body.type, generatedAt: new Date().toISOString() } };
  });

  // Apply configuration directly to MikroTik (mock mode)
  app.post("/apply", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request, reply) => {
    const body = request.body as {
      type: "pppoe" | "hotspot" | "queues" | "firewall" | "radius" | "full";
      config?: Partial<RscConfigOptions>;
      routerId?: string;
    };

    if (env.MIKROTIK_MOCK === "true") {
      // In mock mode, just log and return success
      return {
        data: {
          message: `Configuration '${body.type}' applied successfully (mock mode)`,
          routerId: body.routerId || "default",
          timestamp: new Date().toISOString(),
        },
      };
    }

    // TODO: Real implementation - push config via MikroTik REST API
    return reply.status(501).send({
      error: { code: "NOT_IMPLEMENTED", message: "Direct config push to real MikroTik not yet implemented. Please use the generated RSC script with Winbox/System > Scripts." },
    });
  });

  // Get router interface list for config generation
  app.get("/interfaces/:routerId", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      const ifaces = mockMikrotikService.getInterfaceList();
      return { data: ifaces.map((i) => ({ name: i.name, type: i.type, isUp: i.isUp, comment: i.comment })) };
    }
    return { data: [] };
  });

  // Get current router configuration status
  app.get("/status/:routerId", { preHandler: [app.authenticate] }, async () => {
    if (env.MIKROTIK_MOCK === "true") {
      return {
        data: {
          connected: true,
          identity: "SKYNITY-Core-Router",
          version: "7.14.3",
          uptime: "3d 4h 22m",
          pppoeServerEnabled: true,
          hotspotEnabled: true,
          radiusConfigured: true,
        },
      };
    }
    return { data: { connected: false } };
  });
}
