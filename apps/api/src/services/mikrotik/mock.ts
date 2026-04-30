import {
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

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max));
}

let prevCpu = 25;
let prevTemp = 45;

// In-memory state for block/suspend and live speeds
const pppoeUserState = new Map<string, { disabled: boolean; txRate: number; rxRate: number }>();
const hotspotUserState = new Map<string, { disabled: boolean; txRate: number; rxRate: number }>();

export const mockMikrotikService = {
  getSystemResource(): SystemResource {
    prevCpu = Math.max(5, Math.min(95, prevCpu + randInt(-5, 6)));
    const totalMemoryMB = 1024;
    const usedPercent = rand(70, 85);
    return {
      cpuLoad: Math.round(prevCpu),
      freeMemoryMB: Math.round(totalMemoryMB * (1 - usedPercent / 100)),
      totalMemoryMB,
      usedMemoryPercent: Math.round(usedPercent),
      uptime: "3d 4h 22m",
      uptimeSeconds: 274920,
      boardName: "RB4011iGS+",
      version: "7.14.3",
      architecture: "arm64",
      buildTime: "Jan/15/2024 09:23:15",
    };
  },

  getSystemHealth(): SystemHealth {
    prevTemp = Math.max(35, Math.min(65, prevTemp + rand(-2, 2.1)));
    return {
      temperature: Math.round(prevTemp * 10) / 10,
      voltage: 24.1,
      current: 0.85,
      powerConsumption: 20.5,
      fanSpeed: 3200,
      cpuTemperature: 52,
    };
  },

  getDeviceInfo(): DeviceInfo {
    return {
      identity: "SKYNITY-Core-Router",
      model: "RB4011iGS+",
      rosVersion: "7.14.3",
      firmwareVersion: "7.14.3",
      serial: "A1B2C3D4E5F6",
      licenseLevel: 5,
      licenseFeatures: ["Level 5", "wireless", "dude"],
      publicKeyFingerprint: "SHA256:abc123...",
      ipAddresses: ["10.100.0.2/24", "192.168.88.1/24", "192.168.100.2/24"],
      macAddresses: ["48:8F:5A:12:34:56", "48:8F:5A:12:34:57"],
    };
  },

  getInterfaceList(): NetworkInterface[] {
    const ifaces = [
      { name: "ether1", type: "ether", mac: "48:8F:5A:12:34:56", mtu: 1500, up: true, comment: "WAN-Starlink" },
      { name: "ether2", type: "ether", mac: "48:8F:5A:12:34:57", mtu: 1500, up: true, comment: "LAN-Trunk" },
      { name: "ether3", type: "ether", mac: "48:8F:5A:12:34:58", mtu: 1500, up: true, comment: "" },
      { name: "ether4", type: "ether", mac: "48:8F:5A:12:34:59", mtu: 1500, up: false, comment: "" },
      { name: "vlan10", type: "vlan", mac: "48:8F:5A:12:34:57", mtu: 1500, up: true, comment: "MGMT" },
      { name: "vlan20", type: "vlan", mac: "48:8F:5A:12:34:57", mtu: 1500, up: true, comment: "PPPoE-Users" },
      { name: "wg-skynity", type: "wireguard", mac: "", mtu: 1420, up: true, comment: "SKYNITY-Tunnel" },
      { name: "pppoe-out1", type: "ppp", mac: "", mtu: 1480, up: true, comment: "Starlink-PPPoE" },
      { name: "bridge1", type: "bridge", mac: "48:8F:5A:12:34:57", mtu: 1500, up: true, comment: "Local-Bridge" },
      { name: "sfp-sfpplus1", type: "ether", mac: "48:8F:5A:12:34:5A", mtu: 1500, up: true, comment: "Fiber-Uplink" },
    ];
    return ifaces.map((i) => ({
      name: i.name,
      type: i.type,
      macAddress: i.mac,
      mtu: i.mtu,
      isUp: i.up,
      txBytes: BigInt(randInt(1000000000, 50000000000)),
      rxBytes: BigInt(randInt(1000000000, 50000000000)),
      txPackets: BigInt(randInt(1000000, 50000000)),
      rxPackets: BigInt(randInt(1000000, 50000000)),
      txRate: randInt(1000000, 500000000),
      rxRate: randInt(1000000, 500000000),
      comment: i.comment,
    }));
  },

  getInterfaceTraffic(ifaceName: string): InterfaceTraffic {
    return {
      rxBitsPerSec: randInt(1000000, 500000000),
      txBitsPerSec: randInt(1000000, 500000000),
      rxPacketsPerSec: randInt(1000, 50000),
      txPacketsPerSec: randInt(1000, 50000),
      timestamp: new Date(),
    };
  },

  getSimpleQueues(): SimpleQueue[] {
    return Array.from({ length: 12 }).map((_, i) => ({
      name: `queue-user-${i + 1}`,
      target: `192.168.88.${10 + i}/32`,
      maxLimitUp: `${randInt(5, 50)}M`,
      maxLimitDown: `${randInt(5, 50)}M`,
      txBytes: BigInt(randInt(1000000, 5000000000)),
      rxBytes: BigInt(randInt(1000000, 5000000000)),
      txPackets: BigInt(randInt(10000, 5000000)),
      rxPackets: BigInt(randInt(10000, 5000000)),
      txRate: randInt(100000, 10000000),
      rxRate: randInt(100000, 10000000),
      pcq: "",
      burstLimit: "",
      burstThreshold: "",
      burstTime: 0,
      comment: `Customer ${i + 1}`,
      disabled: false,
    }));
  },

  getSfpModules(): SfpModule[] {
    return [
      {
        name: "sfp-sfpplus1",
        status: "active",
        txPowerDbm: -2.5,
        rxPowerDbm: -7.8,
        temperatureC: 35.2,
        voltageV: 3.25,
        currentMa: 18.5,
        wavelengthNm: 1310,
        vendor: "MikroTik",
        partNumber: "S-31DLC20D",
        serialNumber: "MTK12345678",
        type: "SFP",
        isHealthy: true,
        txPowerStatus: "ok",
        rxPowerStatus: "ok",
      },
    ];
  },

  async pingHost(host: string, count = 4): Promise<PingResult> {
    const avgMs = host === "8.8.8.8" ? rand(18, 28) : host === "1.1.1.1" ? rand(15, 25) : rand(40, 120);
    const loss = Math.random() > 0.95 ? rand(5, 15) : 0;
    const status: PingResult["status"] =
      loss > 10 ? "unreachable" : avgMs > 200 ? "poor" : avgMs > 100 ? "fair" : avgMs > 50 ? "good" : "excellent";
    return {
      host,
      sentPackets: count,
      receivedPackets: Math.round(count * (1 - loss / 100)),
      packetLossPct: Math.round(loss * 100) / 100,
      minMs: Math.round((avgMs * 0.8) * 100) / 100,
      avgMs: Math.round(avgMs * 100) / 100,
      maxMs: Math.round((avgMs * 1.3) * 100) / 100,
      jitterMs: Math.round((avgMs * 0.15) * 100) / 100,
      status,
    };
  },

  getNeighbors(): Neighbor[] {
    return [
      {
        identity: "AP-Tower-1",
        macAddress: "48:8F:5A:AA:BB:CC",
        ipAddress: "192.168.88.5",
        interface: "ether2",
        platform: "MikroTik",
        version: "7.12",
        uptime: "15d 3h",
        age: "2m",
        discoveryProtocol: "MNDP",
      },
      {
        identity: "Switch-Core",
        macAddress: "48:8F:5A:DD:EE:FF",
        ipAddress: "192.168.88.3",
        interface: "ether2",
        platform: "MikroTik",
        version: "7.10",
        uptime: "45d 12h",
        age: "1m",
        discoveryProtocol: "MNDP",
      },
    ];
  },

  getPppoeUsers(): PppoeUser[] {
    return Array.from({ length: 20 }).map((_, i) => {
      const username = `user${100 + i}`;
      const state = pppoeUserState.get(username);
      return {
        username,
        profile: ["home-basic", "home-plus", "home-premium", "business-50m"][i % 4],
        service: "pppoe",
        disabled: state?.disabled ?? false,
        comment: `Customer ${i + 1}`,
      };
    });
  },

  getPppoeActiveUsers(): ActivePppoeUser[] {
    return Array.from({ length: 8 }).map((_, i) => {
      const username = `user${100 + i}`;
      const state = pppoeUserState.get(username);
      return {
        username,
        address: `192.168.88.${50 + i}`,
        callerId: `48:8F:5A:00:00:${i.toString(16).padStart(2, "0")}`,
        service: "pppoe",
        uptime: `${randInt(1, 48)}h ${randInt(1, 59)}m`,
        txBytes: BigInt(randInt(1000000, 5000000000)),
        rxBytes: BigInt(randInt(1000000, 5000000000)),
        txRate: state?.txRate ?? randInt(50000, 5000000),
        rxRate: state?.rxRate ?? randInt(50000, 5000000),
      };
    });
  },

  createPppoeUser(_data: unknown): void {},
  updatePppoeUser(_username: string, _data: unknown): void {},
  deletePppoeUser(_username: string): void {},
  disconnectPppoeUser(_username: string): void {},
  getPppoeProfiles(): string[] {
    return ["home-basic", "home-plus", "home-premium", "business-50m", "trial"];
  },

  blockPppoeUser(username: string): boolean {
    pppoeUserState.set(username, { disabled: true, txRate: 0, rxRate: 0 });
    return true;
  },

  unblockPppoeUser(username: string): boolean {
    pppoeUserState.set(username, { disabled: false, txRate: randInt(50000, 5000000), rxRate: randInt(50000, 5000000) });
    return true;
  },

  getHotspotUsers(): HotspotUser[] {
    return Array.from({ length: 10 }).map((_, i) => {
      const id = `${i + 1}`;
      const state = hotspotUserState.get(id);
      return {
        id,
        name: `hotspot_${200 + i}`,
        password: "pass123",
        profile: "hotspot-daily",
        uptime: `${randInt(1, 12)}h`,
        bytesIn: BigInt(randInt(100000, 50000000)),
        bytesOut: BigInt(randInt(100000, 50000000)),
        disabled: state?.disabled ?? false,
      };
    });
  },

  getHotspotActiveUsers(): ActiveHotspotUser[] {
    return Array.from({ length: 5 }).map((_, i) => {
      const id = `${i + 1}`;
      const state = hotspotUserState.get(id);
      return {
        id,
        user: `hotspot_${200 + i}`,
        address: `192.168.89.${10 + i}`,
        macAddress: `48:8F:5A:11:11:${i.toString(16).padStart(2, "0")}`,
        uptime: `${randInt(10, 120)}m`,
        bytesIn: BigInt(randInt(10000, 5000000)),
        bytesOut: BigInt(randInt(10000, 5000000)),
        txRate: state?.txRate ?? randInt(20000, 2000000),
        rxRate: state?.rxRate ?? randInt(20000, 2000000),
      };
    });
  },

  createHotspotUser(_data: unknown): void {},
  updateHotspotUser(_id: string, _data: unknown): void {},
  deleteHotspotUser(_id: string): void {},
  disconnectHotspotUser(_id: string): void {},
  getHotspotProfiles(): string[] {
    return ["hotspot-daily", "hotspot-weekly"];
  },

  blockHotspotUser(id: string): boolean {
    hotspotUserState.set(id, { disabled: true, txRate: 0, rxRate: 0 });
    return true;
  },

  unblockHotspotUser(id: string): boolean {
    hotspotUserState.set(id, { disabled: false, txRate: randInt(20000, 2000000), rxRate: randInt(20000, 2000000) });
    return true;
  },

  // Live stats aggregation
  getLiveStats() {
    const pppoeActive = this.getPppoeActiveUsers();
    const hotspotActive = this.getHotspotActiveUsers();
    const queues = this.getSimpleQueues();
    const interfaces = this.getInterfaceList();

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
        totalUsers: 20,
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
        totalUsers: 10,
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

  // Tick live speeds for realistic fluctuation
  tickLiveSpeeds() {
    for (const [username, state] of pppoeUserState.entries()) {
      if (!state.disabled) {
        pppoeUserState.set(username, {
          ...state,
          txRate: Math.max(0, state.txRate + randInt(-200000, 200000)),
          rxRate: Math.max(0, state.rxRate + randInt(-200000, 200000)),
        });
      }
    }
    for (const [id, state] of hotspotUserState.entries()) {
      if (!state.disabled) {
        hotspotUserState.set(id, {
          ...state,
          txRate: Math.max(0, state.txRate + randInt(-100000, 100000)),
          rxRate: Math.max(0, state.rxRate + randInt(-100000, 100000)),
        });
      }
    }
  },
};
