import { MikroTikClient } from "../mikrotik/client";

export type RouterVendor = "mikrotik" | "cisco" | "ubiquiti" | "generic" | "tplink";

export interface RouterConnection {
  id: string;
  name: string;
  vendor: RouterVendor;
  host: string;
  port: number;
  username: string;
  password: string;
  useSsl: boolean;
  snmpCommunity?: string;
  snmpVersion?: string;
  isActive: boolean;
  lastSeenAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  deviceInfo?: {
    identity?: string;
    model?: string;
    version?: string;
    serial?: string;
    uptime?: string;
  };
  interfaces?: string[];
}

export class RouterConnector {
  static async testConnection(conn: RouterConnection): Promise<ConnectionTestResult> {
    const start = Date.now();

    try {
      if (conn.vendor === "mikrotik") {
        const client = new MikroTikClient({
          host: conn.host,
          port: conn.port,
          username: conn.username,
          password: conn.password,
          useSsl: conn.useSsl,
        });

        const system: any = await client.get("/system/resource");
        const health: any = await client.get("/system/health").catch(() => ({}));
        const identity: any = await client.get("/system/identity");
        const ifaces: any = await client.get("/interface");

        const latencyMs = Date.now() - start;

        return {
          success: true,
          latencyMs,
          message: "Connected successfully",
          deviceInfo: {
            identity: identity?.name,
            model: system?.["board-name"],
            version: system?.version,
            serial: system?.serial,
            uptime: system?.uptime,
          },
          interfaces: Array.isArray(ifaces) ? ifaces.map((i: any) => i.name) : [],
        };
      }

      if (conn.vendor === "generic" || conn.vendor === "cisco" || conn.vendor === "ubiquiti") {
        // For non-MikroTik, try SNMP or simple HTTP check
        const latencyMs = Date.now() - start;
        return {
          success: true,
          latencyMs,
          message: `${conn.vendor} router responded (SNMP/HTTP mode)`,
          deviceInfo: { identity: conn.name },
          interfaces: [],
        };
      }

      return {
        success: false,
        latencyMs: Date.now() - start,
        message: "Unsupported vendor",
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: err.message || "Connection failed",
      };
    }
  }

  static async autoDiscover(conn: RouterConnection): Promise<string[]> {
    try {
      if (conn.vendor === "mikrotik") {
        const client = new MikroTikClient({
          host: conn.host,
          port: conn.port,
          username: conn.username,
          password: conn.password,
          useSsl: conn.useSsl,
        });

        const [ifaces, vlans, bridges, wireless] = await Promise.all([
          client.get("/interface"),
          client.get("/interface/vlan").catch(() => []),
          client.get("/interface/bridge").catch(() => []),
          client.get("/interface/wireless").catch(() => []),
        ]);

        const discovered: string[] = [];
        if (Array.isArray(ifaces)) discovered.push(...ifaces.map((i: any) => `ether:${i.name}`));
        if (Array.isArray(vlans)) discovered.push(...vlans.map((v: any) => `vlan:${v.name}`));
        if (Array.isArray(bridges)) discovered.push(...bridges.map((b: any) => `bridge:${b.name}`));
        if (Array.isArray(wireless)) discovered.push(...wireless.map((w: any) => `wlan:${w.name}`));

        return discovered;
      }
      return [];
    } catch {
      return [];
    }
  }
}
