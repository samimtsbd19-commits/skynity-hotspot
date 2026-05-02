import { env } from "../../config/env";
import { getMikrotikClient, mockMikrotikService } from "./client";
import { blockRadiusUser, unblockRadiusUser } from "../radius/service";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { subscriptions } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../../config/env";
import type {
  SystemResource,
  SystemHealth,
  DeviceInfo,
  NetworkInterface,
  InterfaceTraffic,
  SimpleQueue,
  SfpModule,
  PingResult,
  Neighbor,
  PppoeUser,
  ActivePppoeUser,
  HotspotUser,
  ActiveHotspotUser,
} from "@skynity/shared/types";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

function isMock(): boolean {
  return env.MIKROTIK_MOCK === "true";
}

function safeBigint(n: unknown): number {
  if (typeof n === "bigint") return Number(n);
  if (typeof n === "number") return Math.floor(n);
  if (typeof n === "string") return Number(n.replace(/[^0-9]/g, "")) || 0;
  return 0;
}

function safeNumber(n: unknown): number {
  if (typeof n === "number") return n;
  if (typeof n === "string") return Number(n.replace(/[^0-9.-]/g, "")) || 0;
  return 0;
}

const emptyResource: SystemResource = {
  cpuLoad: 0, freeMemoryMB: 0, totalMemoryMB: 0, usedMemoryPercent: 0,
  uptime: "unavailable", uptimeSeconds: 0, boardName: "unavailable",
  version: "unavailable", architecture: "unavailable", buildTime: "unavailable",
};

const emptyHealth: SystemHealth = {
  temperature: 0, voltage: 0, current: 0, powerConsumption: 0, fanSpeed: 0, cpuTemperature: 0,
};

const emptyDeviceInfo: DeviceInfo = {
  identity: "unavailable", model: "unavailable", rosVersion: "unavailable",
  firmwareVersion: "unavailable", serial: "unavailable", licenseLevel: 0,
  licenseFeatures: [], publicKeyFingerprint: "", ipAddresses: [], macAddresses: [],
};

export const mikrotikService = {
  async getSystemResource(): Promise<SystemResource> {
    if (isMock()) return mockMikrotikService.getSystemResource();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/system/resource") as Record<string, unknown>;
      return {
        cpuLoad: safeNumber(res["cpu-load"]),
        freeMemoryMB: Math.round(safeNumber(res["free-memory"]) / 1024 / 1024),
        totalMemoryMB: Math.round(safeNumber(res["total-memory"]) / 1024 / 1024),
        usedMemoryPercent: Math.round(
          ((safeNumber(res["total-memory"]) - safeNumber(res["free-memory"])) / safeNumber(res["total-memory"])) * 100
        ),
        uptime: String(res.uptime || ""),
        uptimeSeconds: Math.round(safeNumber(res.uptime) || 0),
        boardName: String(res["board-name"] || ""),
        version: String(res.version || ""),
        architecture: String(res.architecture || ""),
        buildTime: String(res["build-time"] || ""),
      };
    } catch {
      return emptyResource;
    }
  },

  async getSystemHealth(): Promise<SystemHealth> {
    if (isMock()) return mockMikrotikService.getSystemHealth();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/system/health");
      const data = Array.isArray(res) ? res : [];
      const getVal = (name: string) => {
        const item = data.find((d: any) => d.name === name);
        return item ? safeNumber(item.value) : 0;
      };
      return {
        temperature: getVal("temperature"),
        voltage: getVal("voltage"),
        current: getVal("current"),
        powerConsumption: getVal("power-consumption"),
        fanSpeed: getVal("fan-speed"),
        cpuTemperature: getVal("cpu-temperature"),
      };
    } catch {
      return emptyHealth;
    }
  },

  async getDeviceInfo(): Promise<DeviceInfo> {
    if (isMock()) return mockMikrotikService.getDeviceInfo();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/system/routerboard") as Record<string, unknown>;
      return {
        identity: String(res.identity || ""),
        model: String(res.model || ""),
        rosVersion: String(res.version || ""),
        firmwareVersion: String(res["current-firmware"] || ""),
        serial: String(res.serial || ""),
        licenseLevel: safeNumber(res["license-level"]),
        licenseFeatures: [],
        publicKeyFingerprint: "",
        ipAddresses: [],
        macAddresses: [],
      };
    } catch {
      return emptyDeviceInfo;
    }
  },

  async getInterfaceList(): Promise<NetworkInterface[]> {
    if (isMock()) return mockMikrotikService.getInterfaceList();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/interface");
      const data = Array.isArray(res) ? res : [res];
      return data.map((iface: any) => ({
        name: String(iface.name || ""),
        type: String(iface.type || "ether"),
        macAddress: String(iface["mac-address"] || ""),
        mtu: safeNumber(iface.mtu) || 1500,
        isUp: iface.running === true || iface.disabled === "false",
        txBytes: safeBigint(iface["tx-byte"]),
        rxBytes: safeBigint(iface["rx-byte"]),
        txPackets: safeBigint(iface["tx-packet"]),
        rxPackets: safeBigint(iface["rx-packet"]),
        txRate: safeNumber(iface["tx-rate"]),
        rxRate: safeNumber(iface["rx-rate"]),
        comment: String(iface.comment || ""),
      }));
    } catch {
      return [];
    }
  },

  async getInterfaceTraffic(ifaceName: string): Promise<InterfaceTraffic> {
    if (isMock()) return mockMikrotikService.getInterfaceTraffic(ifaceName);
    try {
      const list = await this.getInterfaceList();
      const iface = list.find((i) => i.name === ifaceName);
      return {
        rxBitsPerSec: iface ? Number(iface.rxRate) : 0,
        txBitsPerSec: iface ? Number(iface.txRate) : 0,
        rxPacketsPerSec: 0,
        txPacketsPerSec: 0,
        timestamp: new Date(),
      };
    } catch {
      return { rxBitsPerSec: 0, txBitsPerSec: 0, rxPacketsPerSec: 0, txPacketsPerSec: 0, timestamp: new Date() };
    }
  },

  async pingHost(host: string, count = 4): Promise<PingResult> {
    if (isMock()) return mockMikrotikService.pingHost(host, count);
    try {
      const { promise: pingPromise } = await import("ping");
      const res = await pingPromise.probe(host, { min_reply: count });
      const avgMs = res.avg ? parseFloat(String(res.avg)) : 0;
      const loss = res.packetLoss ? parseFloat(String(res.packetLoss)) : 0;
      const status: PingResult["status"] =
        loss > 10 ? "unreachable" : avgMs > 200 ? "poor" : avgMs > 100 ? "fair" : avgMs > 50 ? "good" : "excellent";
      return {
        host,
        sentPackets: count,
        receivedPackets: res.alive ? count : 0,
        packetLossPct: loss,
        minMs: res.min ? parseFloat(res.min) : avgMs,
        avgMs,
        maxMs: res.max ? parseFloat(res.max) : avgMs,
        jitterMs: 0,
        status,
      };
    } catch {
      return { host, sentPackets: count, receivedPackets: 0, packetLossPct: 100, minMs: 0, avgMs: 0, maxMs: 0, jitterMs: 0, status: "unreachable" };
    }
  },

  async getSimpleQueues(): Promise<SimpleQueue[]> {
    if (isMock()) return mockMikrotikService.getSimpleQueues();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/queue/simple");
      const data = Array.isArray(res) ? res : [res];
      return data.map((q: any) => ({
        name: String(q.name || ""),
        target: String(q.target || ""),
        maxLimitUp: String(q["max-limit"] || "").split("/")[1] || "",
        maxLimitDown: String(q["max-limit"] || "").split("/")[0] || "",
        txBytes: safeBigint(q["tx-byte"]),
        rxBytes: safeBigint(q["rx-byte"]),
        txPackets: safeBigint(q["tx-packet"]),
        rxPackets: safeBigint(q["rx-packet"]),
        txRate: safeNumber(q["tx-rate"]),
        rxRate: safeNumber(q["rx-rate"]),
        pcq: "",
        burstLimit: "",
        burstThreshold: "",
        burstTime: 0,
        comment: String(q.comment || ""),
        disabled: q.disabled === "true",
      }));
    } catch {
      return [];
    }
  },

  async getSfpModules(): Promise<SfpModule[]> {
    if (isMock()) return mockMikrotikService.getSfpModules();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/interface/ethernet/sfp");
      const data = Array.isArray(res) ? res : [res];
      return data.map((s: any) => ({
        name: String(s.name || ""),
        status: (String(s.status || "") as SfpModule["status"]) || "not-present",
        txPowerDbm: safeNumber(s["sfp-tx-power"]),
        rxPowerDbm: safeNumber(s["sfp-rx-power"]),
        temperatureC: safeNumber(s["sfp-temperature"]),
        voltageV: safeNumber(s["sfp-voltage"]),
        currentMa: safeNumber(s["sfp-current"]),
        wavelengthNm: safeNumber(s["sfp-wavelength"]),
        vendor: String(s["sfp-vendor-name"] || ""),
        partNumber: String(s["sfp-vendor-part-number"] || ""),
        serialNumber: String(s["sfp-vendor-serial"] || ""),
        type: String(s["sfp-type"] || ""),
        isHealthy: s.status === "active" || s.status === "link-ok",
        txPowerStatus: safeNumber(s["sfp-tx-power"]) > -10 ? "ok" : "low",
        rxPowerStatus: safeNumber(s["sfp-rx-power"]) > -15 ? "ok" : "low",
      }));
    } catch {
      return [];
    }
  },

  async getNeighbors(): Promise<Neighbor[]> {
    if (isMock()) return mockMikrotikService.getNeighbors();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/ip/neighbor");
      const data = Array.isArray(res) ? res : [res];
      return data.map((n: any) => ({
        identity: String(n.identity || ""),
        macAddress: String(n["mac-address"] || ""),
        ipAddress: String(n.address || ""),
        interface: String(n.interface || ""),
        platform: String(n.platform || ""),
        version: String(n.version || ""),
        uptime: String(n.uptime || ""),
        age: String(n.age || ""),
        discoveryProtocol: (String(n["discovery-protocol"] || "MNDP") as Neighbor["discoveryProtocol"]) || "MNDP",
      }));
    } catch {
      return [];
    }
  },

  async getPppoeUsers(): Promise<PppoeUser[]> {
    if (isMock()) return mockMikrotikService.getPppoeUsers();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/ppp/secret");
      const data = Array.isArray(res) ? res : [res];
      return data.map((u: any) => ({
        username: String(u.name || ""),
        profile: String(u.profile || ""),
        service: String(u.service || "pppoe"),
        disabled: u.disabled === "true",
        comment: String(u.comment || ""),
      }));
    } catch {
      return [];
    }
  },

  async getPppoeActiveUsers(): Promise<ActivePppoeUser[]> {
    if (isMock()) return mockMikrotikService.getPppoeActiveUsers();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/ppp/active");
      const data = Array.isArray(res) ? res : [res];
      return data.map((u: any) => ({
        username: String(u.name || ""),
        address: String(u.address || ""),
        callerId: String(u["caller-id"] || ""),
        service: String(u.service || "pppoe"),
        uptime: String(u.uptime || ""),
        txBytes: safeBigint(u["tx-byte"]),
        rxBytes: safeBigint(u["rx-byte"]),
        txRate: safeNumber(u["tx-rate"]),
        rxRate: safeNumber(u["rx-rate"]),
      }));
    } catch {
      return [];
    }
  },

  createPppoeUser(_data: unknown): void {
    if (isMock()) return mockMikrotikService.createPppoeUser(_data);
    // Handled in provisioning service via getMikrotikClient directly
  },

  updatePppoeUser(_username: string, _data: unknown): void {
    // Handled in provisioning service
  },

  deletePppoeUser(_username: string): void {
    // Handled in provisioning service
  },

  disconnectPppoeUser(_username: string): void {
    // Handled in provisioning service
  },

  async getPppoeProfiles(): Promise<string[]> {
    if (isMock()) return mockMikrotikService.getPppoeProfiles();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/ppp/profile");
      const data = Array.isArray(res) ? res : [res];
      return data.map((p: any) => String(p.name || "")).filter(Boolean);
    } catch {
      return [];
    }
  },

  async blockPppoeUser(username: string): Promise<boolean> {
    if (isMock()) return mockMikrotikService.blockPppoeUser(username);
    try {
      const client = getMikrotikClient();
      await client.post("/ppp/secret/set", { name: username, disabled: "yes" });
      await blockRadiusUser(username);
      return true;
    } catch {
      return false;
    }
  },

  async unblockPppoeUser(username: string, password?: string): Promise<boolean> {
    if (isMock()) return mockMikrotikService.unblockPppoeUser(username);
    try {
      const client = getMikrotikClient();
      await client.post("/ppp/secret/set", { name: username, disabled: "no" });
      let pwd = password;
      if (!pwd) {
        const rows = await db.select().from(subscriptions).where(eq(subscriptions.username, username)).limit(1);
        if (rows.length > 0) pwd = rows[0].passwordEncrypted || undefined;
      }
      if (pwd) {
        await unblockRadiusUser(username, pwd);
      }
      return true;
    } catch {
      return false;
    }
  },

  async getHotspotUsers(): Promise<HotspotUser[]> {
    if (isMock()) return mockMikrotikService.getHotspotUsers();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/ip/hotspot/user");
      const data = Array.isArray(res) ? res : [res];
      return data.map((u: any) => ({
        id: String(u[".id"] || u.id || ""),
        name: String(u.name || ""),
        password: String(u.password || ""),
        profile: String(u.profile || ""),
        uptime: String(u.uptime || ""),
        bytesIn: safeBigint(u["bytes-in"]),
        bytesOut: safeBigint(u["bytes-out"]),
        disabled: u.disabled === "true",
      }));
    } catch {
      return [];
    }
  },

  async getHotspotActiveUsers(): Promise<ActiveHotspotUser[]> {
    if (isMock()) return mockMikrotikService.getHotspotActiveUsers();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/ip/hotspot/active");
      const data = Array.isArray(res) ? res : [res];
      return data.map((u: any) => ({
        id: String(u[".id"] || u.id || ""),
        user: String(u.user || ""),
        address: String(u.address || ""),
        macAddress: String(u["mac-address"] || ""),
        uptime: String(u.uptime || ""),
        bytesIn: safeBigint(u["bytes-in"]),
        bytesOut: safeBigint(u["bytes-out"]),
        txRate: safeNumber(u["tx-rate"]),
        rxRate: safeNumber(u["rx-rate"]),
      }));
    } catch {
      return [];
    }
  },

  createHotspotUser(_data: unknown): void {
    if (isMock()) return mockMikrotikService.createHotspotUser(_data);
    // Handled in provisioning service
  },

  updateHotspotUser(_id: string, _data: unknown): void {
    // Handled in provisioning service
  },

  deleteHotspotUser(_id: string): void {
    // Handled in provisioning service
  },

  disconnectHotspotUser(_id: string): void {
    // Handled in provisioning service
  },

  async getHotspotProfiles(): Promise<string[]> {
    if (isMock()) return mockMikrotikService.getHotspotProfiles();
    try {
      const client = getMikrotikClient();
      const res = await client.get("/ip/hotspot/user/profile");
      const data = Array.isArray(res) ? res : [res];
      return data.map((p: any) => String(p.name || "")).filter(Boolean);
    } catch {
      return [];
    }
  },

  async blockHotspotUser(id: string): Promise<boolean> {
    if (isMock()) return mockMikrotikService.blockHotspotUser(id);
    try {
      const client = getMikrotikClient();
      await client.post("/ip/hotspot/user/set", { ".id": id, disabled: "yes" });
      const users = await this.getHotspotUsers();
      const user = users.find((u) => u.id === id);
      if (user?.name) await blockRadiusUser(user.name);
      return true;
    } catch {
      return false;
    }
  },

  async unblockHotspotUser(id: string): Promise<boolean> {
    if (isMock()) return mockMikrotikService.unblockHotspotUser(id);
    try {
      const client = getMikrotikClient();
      await client.post("/ip/hotspot/user/set", { ".id": id, disabled: "no" });
      const users = await this.getHotspotUsers();
      const user = users.find((u) => u.id === id);
      if (user?.name) {
        const rows = await db.select().from(subscriptions).where(eq(subscriptions.username, user.name)).limit(1);
        const pwd = rows[0]?.passwordEncrypted;
        if (pwd) await unblockRadiusUser(user.name, pwd);
      }
      return true;
    } catch {
      return false;
    }
  },

  async getLiveStats() {
    if (isMock()) {
      mockMikrotikService.tickLiveSpeeds();
      return mockMikrotikService.getLiveStats();
    }
    const pppoeActive = await this.getPppoeActiveUsers();
    const hotspotActive = await this.getHotspotActiveUsers();
    const queues = await this.getSimpleQueues();
    const interfaces = await this.getInterfaceList();

    const pppoeTotalSpeed = pppoeActive.reduce(
      (acc, u) => ({ rx: acc.rx + (u.rxRate || 0), tx: acc.tx + (u.txRate || 0) }),
      { rx: 0, tx: 0 }
    );
    const hotspotTotalSpeed = hotspotActive.reduce(
      (acc, u) => ({ rx: acc.rx + (u.rxRate || 0), tx: acc.tx + (u.txRate || 0) }),
      { rx: 0, tx: 0 }
    );
    const wanInterface = interfaces.find((i) => i.name === "ether1");

    return {
      pppoe: {
        totalUsers: (await this.getPppoeUsers()).length,
        activeUsers: pppoeActive.length,
        totalRxRate: pppoeTotalSpeed.rx,
        totalTxRate: pppoeTotalSpeed.tx,
        users: pppoeActive.map((u) => ({
          username: u.username,
          address: u.address,
          rxRate: u.rxRate || 0,
          txRate: u.txRate || 0,
          uptime: u.uptime,
        })),
      },
      hotspot: {
        totalUsers: (await this.getHotspotUsers()).length,
        activeUsers: hotspotActive.length,
        totalRxRate: hotspotTotalSpeed.rx,
        totalTxRate: hotspotTotalSpeed.tx,
        users: hotspotActive.map((u) => ({
          id: u.id,
          user: u.user,
          address: u.address,
          macAddress: u.macAddress,
          rxRate: u.rxRate || 0,
          txRate: u.txRate || 0,
          uptime: u.uptime,
        })),
      },
      queues: queues.map((q) => ({
        name: q.name,
        target: q.target,
        rxRate: q.rxRate,
        txRate: q.txRate,
        maxLimitDown: q.maxLimitDown,
        maxLimitUp: q.maxLimitUp,
        disabled: q.disabled,
        comment: q.comment,
      })),
      wan: wanInterface
        ? {
            name: wanInterface.name,
            rxRate: Number(wanInterface.rxRate),
            txRate: Number(wanInterface.txRate),
            rxBytes: String(wanInterface.rxBytes),
            txBytes: String(wanInterface.txBytes),
            isUp: wanInterface.isUp,
          }
        : null,
    };
  },

  tickLiveSpeeds(): void {
    if (isMock()) mockMikrotikService.tickLiveSpeeds();
    // Real router speeds update automatically
  },
};
