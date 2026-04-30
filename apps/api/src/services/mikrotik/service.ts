import { env } from "../../config/env";
import { getMikrotikClient, mockMikrotikService } from "./client";
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

function getRealClient() {
  try {
    return getMikrotikClient();
  } catch {
    return null;
  }
}

function isMock(): boolean {
  return env.MIKROTIK_MOCK === "true";
}

function safeBigint(n: unknown): bigint {
  if (typeof n === "bigint") return n;
  if (typeof n === "number") return BigInt(Math.floor(n));
  if (typeof n === "string") return BigInt(n.replace(/[^0-9]/g, "")) || BigInt(0);
  return BigInt(0);
}

function safeNumber(n: unknown): number {
  if (typeof n === "number") return n;
  if (typeof n === "string") return Number(n.replace(/[^0-9.-]/g, "")) || 0;
  return 0;
}

export const mikrotikService = {
  async getSystemResource(): Promise<SystemResource> {
    if (isMock()) return mockMikrotikService.getSystemResource();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getSystemResource();
    try {
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
      return mockMikrotikService.getSystemResource();
    }
  },

  async getSystemHealth(): Promise<SystemHealth> {
    if (isMock()) return mockMikrotikService.getSystemHealth();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getSystemHealth();
    try {
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
      return mockMikrotikService.getSystemHealth();
    }
  },

  async getDeviceInfo(): Promise<DeviceInfo> {
    if (isMock()) return mockMikrotikService.getDeviceInfo();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getDeviceInfo();
    try {
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
      return mockMikrotikService.getDeviceInfo();
    }
  },

  async getInterfaceList(): Promise<NetworkInterface[]> {
    if (isMock()) return mockMikrotikService.getInterfaceList();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getInterfaceList();
    try {
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
      return mockMikrotikService.getInterfaceList();
    }
  },

  async getInterfaceTraffic(ifaceName: string): Promise<InterfaceTraffic> {
    if (isMock()) return mockMikrotikService.getInterfaceTraffic(ifaceName);
    const client = getRealClient();
    if (!client) return mockMikrotikService.getInterfaceTraffic(ifaceName);
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
      return mockMikrotikService.getInterfaceTraffic(ifaceName);
    }
  },

  async pingHost(host: string, count = 4): Promise<PingResult> {
    if (isMock()) return mockMikrotikService.pingHost(host, count);
    // Use Node.js ping for real routers (MikroTik REST doesn't have reliable synchronous ping)
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
      return mockMikrotikService.pingHost(host, count);
    }
  },

  async getSimpleQueues(): Promise<SimpleQueue[]> {
    if (isMock()) return mockMikrotikService.getSimpleQueues();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getSimpleQueues();
    try {
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
      return mockMikrotikService.getSimpleQueues();
    }
  },

  async getSfpModules(): Promise<SfpModule[]> {
    if (isMock()) return mockMikrotikService.getSfpModules();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getSfpModules();
    try {
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
      return mockMikrotikService.getSfpModules();
    }
  },

  async getNeighbors(): Promise<Neighbor[]> {
    if (isMock()) return mockMikrotikService.getNeighbors();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getNeighbors();
    try {
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
      return mockMikrotikService.getNeighbors();
    }
  },

  async getPppoeUsers(): Promise<PppoeUser[]> {
    if (isMock()) return mockMikrotikService.getPppoeUsers();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getPppoeUsers();
    try {
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
      return mockMikrotikService.getPppoeUsers();
    }
  },

  async getPppoeActiveUsers(): Promise<ActivePppoeUser[]> {
    if (isMock()) return mockMikrotikService.getPppoeActiveUsers();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getPppoeActiveUsers();
    try {
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
      return mockMikrotikService.getPppoeActiveUsers();
    }
  },

  createPppoeUser(data: unknown): void {
    if (isMock()) return mockMikrotikService.createPppoeUser(data);
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
    const client = getRealClient();
    if (!client) return mockMikrotikService.getPppoeProfiles();
    try {
      const res = await client.get("/ppp/profile");
      const data = Array.isArray(res) ? res : [res];
      return data.map((p: any) => String(p.name || "")).filter(Boolean);
    } catch {
      return mockMikrotikService.getPppoeProfiles();
    }
  },

  blockPppoeUser(username: string): boolean {
    if (isMock()) return mockMikrotikService.blockPppoeUser(username);
    return true; // TODO: implement via real client
  },

  unblockPppoeUser(username: string): boolean {
    if (isMock()) return mockMikrotikService.unblockPppoeUser(username);
    return true; // TODO: implement via real client
  },

  async getHotspotUsers(): Promise<HotspotUser[]> {
    if (isMock()) return mockMikrotikService.getHotspotUsers();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getHotspotUsers();
    try {
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
      return mockMikrotikService.getHotspotUsers();
    }
  },

  async getHotspotActiveUsers(): Promise<ActiveHotspotUser[]> {
    if (isMock()) return mockMikrotikService.getHotspotActiveUsers();
    const client = getRealClient();
    if (!client) return mockMikrotikService.getHotspotActiveUsers();
    try {
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
      return mockMikrotikService.getHotspotActiveUsers();
    }
  },

  createHotspotUser(data: unknown): void {
    if (isMock()) return mockMikrotikService.createHotspotUser(data);
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
    const client = getRealClient();
    if (!client) return mockMikrotikService.getHotspotProfiles();
    try {
      const res = await client.get("/ip/hotspot/user/profile");
      const data = Array.isArray(res) ? res : [res];
      return data.map((p: any) => String(p.name || "")).filter(Boolean);
    } catch {
      return mockMikrotikService.getHotspotProfiles();
    }
  },

  blockHotspotUser(id: string): boolean {
    if (isMock()) return mockMikrotikService.blockHotspotUser(id);
    return true; // TODO
  },

  unblockHotspotUser(id: string): boolean {
    if (isMock()) return mockMikrotikService.unblockHotspotUser(id);
    return true; // TODO
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
