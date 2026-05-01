export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SystemResource {
  cpuLoad: number;
  freeMemoryMB: number;
  totalMemoryMB: number;
  usedMemoryPercent: number;
  uptime: string;
  uptimeSeconds: number;
  boardName: string;
  version: string;
  architecture: string;
  buildTime: string;
}

export interface SystemHealth {
  temperature: number;
  voltage: number;
  current: number;
  powerConsumption: number;
  fanSpeed?: number;
  cpuTemperature?: number;
}

export interface DeviceInfo {
  identity: string;
  model: string;
  rosVersion: string;
  firmwareVersion: string;
  serial: string;
  licenseLevel: number;
  licenseFeatures: string[];
  publicKeyFingerprint: string;
  ipAddresses: string[];
  macAddresses: string[];
}

export interface NetworkInterface {
  name: string;
  type: string;
  macAddress: string;
  mtu: number;
  isUp: boolean;
  txBytes: number;
  rxBytes: number;
  txPackets: number;
  rxPackets: number;
  txRate: number;
  rxRate: number;
  comment: string;
}

export interface InterfaceTraffic {
  rxBitsPerSec: number;
  txBitsPerSec: number;
  rxPacketsPerSec: number;
  txPacketsPerSec: number;
  timestamp: Date;
}

export interface SimpleQueue {
  name: string;
  target: string;
  maxLimitUp: string;
  maxLimitDown: string;
  txBytes: number;
  rxBytes: number;
  txPackets: number;
  rxPackets: number;
  txRate: number;
  rxRate: number;
  pcq: string;
  burstLimit: string;
  burstThreshold: string;
  burstTime: number;
  comment: string;
  disabled: boolean;
}

export interface SfpModule {
  name: string;
  status: "active" | "no-link" | "not-present";
  txPowerDbm: number;
  rxPowerDbm: number;
  temperatureC: number;
  voltageV: number;
  currentMa: number;
  wavelengthNm: number;
  vendor: string;
  partNumber: string;
  serialNumber: string;
  type: string;
  isHealthy: boolean;
  txPowerStatus: "ok" | "low" | "high" | "critical";
  rxPowerStatus: "ok" | "low" | "high" | "critical";
}

export interface PingResult {
  host: string;
  sentPackets: number;
  receivedPackets: number;
  packetLossPct: number;
  minMs: number;
  avgMs: number;
  maxMs: number;
  jitterMs: number;
  status: "excellent" | "good" | "fair" | "poor" | "unreachable";
}

export interface Neighbor {
  identity: string;
  macAddress: string;
  ipAddress: string;
  interface: string;
  platform: string;
  version: string;
  uptime: string;
  age: string;
  discoveryProtocol: "MNDP" | "CDP" | "LLDP";
}

export interface PppoeUser {
  username: string;
  password?: string;
  profile: string;
  service: string;
  disabled: boolean;
  comment?: string;
}

export interface ActivePppoeUser {
  username: string;
  address: string;
  callerId: string;
  service: string;
  uptime: string;
  txBytes: number;
  rxBytes: number;
  txRate?: number;
  rxRate?: number;
}

export interface HotspotUser {
  id: string;
  name: string;
  password: string;
  profile: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  disabled: boolean;
}

export interface ActiveHotspotUser {
  id: string;
  user: string;
  address: string;
  macAddress: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  txRate?: number;
  rxRate?: number;
}

export interface BandwidthSnapshot {
  id: number;
  subscriptionId: string | null;
  routerId: string | null;
  rxBytes: number;
  txBytes: number;
  rxRateBps: number | null;
  txRateBps: number | null;
  capturedAt: Date;
}
