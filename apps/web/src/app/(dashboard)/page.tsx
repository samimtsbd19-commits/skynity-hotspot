"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/monitoring/StatCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Wifi, TrendingUp, AlertTriangle, Activity, Gauge, Router, Radio, Server, Thermometer, Zap, Clock, HardDrive } from "lucide-react";
import api from "@/lib/api";
import { formatBandwidth } from "@/lib/utils";
import { useRealtimeLiveStats } from "@/hooks/useRealtimeLiveStats";
import { useRealtimeBandwidth } from "@/hooks/useRealtimeBandwidth";

interface ResourceData {
  cpuLoad: number;
  freeMemoryMB: number;
  totalMemoryMB: number;
  usedMemoryPercent: number;
  uptime: string;
  boardName: string;
  version: string;
  architecture: string;
}

interface HealthData {
  temperature: number;
  voltage: number;
  cpuTemperature?: number;
}

interface DeviceInfo {
  identity: string;
  model: string;
  rosVersion: string;
  serial: string;
}

interface Alert {
  id: string;
  type: "warning" | "danger" | "info";
  message: string;
  time: string;
}

export default function DashboardPage() {
  const [resource, setResource] = useState<ResourceData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const liveStats = useRealtimeLiveStats();
  const bandwidthData = useRealtimeBandwidth();
  const [bandwidthHistory, setBandwidthHistory] = useState<{ time: string; rx: number; tx: number }[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [res, hea, dev, iface] = await Promise.all([
          api.get("/monitoring/resource/"),
          api.get("/monitoring/resource/health").catch(() => ({ data: { data: null } })),
          api.get("/routers/").catch(() => ({ data: { data: [] } })),
          api.get("/monitoring/bandwidth/").catch(() => ({ data: { data: [] } })),
        ]);
        setResource(res.data.data);
        setHealth(hea.data.data);
        const routers = dev.data.data || [];
        setDevice(routers[0] || null);
        setInterfaces(iface.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Build bandwidth chart history from socket data
  useEffect(() => {
    if (bandwidthData.length > 0) {
      const wan = bandwidthData.find((i: any) => i.name === "ether1-WAN" || i.name === "ether1");
      if (wan) {
        const now = new Date().toLocaleTimeString("en-BD", { hour12: false });
        setBandwidthHistory((prev) => {
          const next = [...prev, { time: now, rx: wan.rxRate, tx: wan.txRate }];
          if (next.length > 30) next.shift();
          return next;
        });
      }
    }
  }, [bandwidthData]);

  // Generate alerts based on data
  useEffect(() => {
    const newAlerts: Alert[] = [];
    if (resource && resource.cpuLoad > 80) {
      newAlerts.push({ id: "cpu", type: "warning", message: `High CPU usage: ${resource.cpuLoad}%`, time: "now" });
    }
    if (health && health.temperature > 65) {
      newAlerts.push({ id: "temp", type: "danger", message: `High temperature: ${health.temperature}°C`, time: "now" });
    }
    const downIface = interfaces.find((i: any) => !i.isUp && i.name !== "lo");
    if (downIface) {
      newAlerts.push({ id: "iface", type: "warning", message: `Interface ${downIface.name} is down`, time: "now" });
    }
    setAlerts(newAlerts);
  }, [resource, health, interfaces]);

  const wan = liveStats?.wan;
  const pppoe = liveStats?.pppoe;
  const hotspot = liveStats?.hotspot;

  const userDistribution = [
    { name: "PPPoE Online", value: pppoe?.activeUsers || 0, color: "#00FF88" },
    { name: "PPPoE Offline", value: Math.max(0, (pppoe?.totalUsers || 0) - (pppoe?.activeUsers || 0)), color: "#1E3A5F" },
    { name: "Hotspot Online", value: hotspot?.activeUsers || 0, color: "#A855F7" },
    { name: "Hotspot Offline", value: Math.max(0, (hotspot?.totalUsers || 0) - (hotspot?.activeUsers || 0)), color: "#334155" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Real-time network overview" />

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="PPPoE Online"
          value={pppoe?.activeUsers?.toString() ?? "—"}
          subtext={`Total: ${pppoe?.totalUsers ?? 0} users`}
          color="green"
        />
        <StatCard
          icon={Radio}
          label="Hotspot Online"
          value={hotspot?.activeUsers?.toString() ?? "—"}
          subtext={`Total: ${hotspot?.totalUsers ?? 0} users`}
          color="purple"
        />
        <StatCard
          icon={Gauge}
          label="WAN Download"
          value={wan ? formatBandwidth(wan.rxRate) : "—"}
          subtext={wan?.isUp ? "Online" : "Offline"}
          color="primary"
        />
        <StatCard
          icon={Activity}
          label="WAN Upload"
          value={wan ? formatBandwidth(wan.txRate) : "—"}
          subtext={wan ? `RX: ${formatBandwidth(wan.rxRate)}` : ""}
          color="orange"
        />
      </div>

      {/* Router Info + System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Router Info Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(0,234,255,0.1)]">
              <Router size={20} className="text-[#00EAFF]" />
            </div>
            <div>
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary">Router Info</h3>
              <p className="text-[10px] text-sky-text-secondary">{device?.identity || resource?.boardName || "SKYNITY-Core-Router"}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-sky-text-secondary">Model</span>
              <span className="text-sky-text-primary font-mono">{device?.model || resource?.boardName || "—"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-sky-text-secondary">RouterOS</span>
              <span className="text-sky-text-primary font-mono">{device?.rosVersion || resource?.version || "—"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-sky-text-secondary">Architecture</span>
              <span className="text-sky-text-primary font-mono">{resource?.architecture || "—"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-sky-text-secondary">Serial</span>
              <span className="text-sky-text-primary font-mono">{device?.serial || "—"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-sky-text-secondary">Uptime</span>
              <span className="text-sky-text-primary font-mono">{resource?.uptime || "—"}</span>
            </div>
          </div>
        </div>

        {/* System Resources */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(0,255,136,0.1)]">
              <Server size={20} className="text-[#00FF88]" />
            </div>
            <div>
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary">System Resources</h3>
              <p className="text-[10px] text-sky-text-secondary">Live performance metrics</p>
            </div>
          </div>
          {resource ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-sky-text-secondary">CPU Load</span>
                  <span className="text-sky-accent-primary font-mono">{resource.cpuLoad}%</span>
                </div>
                <div className="h-2 bg-[#0A1628] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00EAFF] to-[#00FF88] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, resource.cpuLoad)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-sky-text-secondary">RAM Usage</span>
                  <span className="text-sky-accent-primary font-mono">{resource.usedMemoryPercent}%</span>
                </div>
                <div className="h-2 bg-[#0A1628] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#A855F7] to-[#00EAFF] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, resource.usedMemoryPercent)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-[rgba(0,234,255,0.15)]">
                <span className="text-sky-text-secondary">Free Memory</span>
                <span className="text-sky-text-primary font-mono">{resource.freeMemoryMB} MB / {resource.totalMemoryMB} MB</span>
              </div>
            </div>
          ) : (
            <div className="animate-pulse space-y-3">
              <div className="h-2 bg-[#112240] rounded" />
              <div className="h-2 bg-[#112240] rounded" />
              <div className="h-2 bg-[#112240] rounded" />
            </div>
          )}
        </div>

        {/* Health + Alerts */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(168,85,247,0.1)]">
              <Thermometer size={20} className="text-[#A855F7]" />
            </div>
            <div>
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary">Health & Alerts</h3>
              <p className="text-[10px] text-sky-text-secondary">{alerts.length} active alert{alerts.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          {health && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-sky-text-secondary">Temperature</span>
                <span className={`font-mono ${health.temperature > 60 ? "text-sky-accent-red" : "text-sky-accent-green"}`}>
                  {health.temperature}°C
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-sky-text-secondary">Voltage</span>
                <span className="text-sky-text-primary font-mono">{health.voltage}V</span>
              </div>
              {health.cpuTemperature && (
                <div className="flex justify-between text-xs">
                  <span className="text-sky-text-secondary">CPU Temp</span>
                  <span className="text-sky-text-primary font-mono">{health.cpuTemperature}°C</span>
                </div>
              )}
            </div>
          )}
          <div className="pt-2 border-t border-[rgba(0,234,255,0.15)] space-y-2 max-h-32 overflow-y-auto">
            {alerts.length === 0 && (
              <p className="text-xs text-sky-text-secondary">No active alerts</p>
            )}
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-2 text-xs">
                <AlertTriangle size={12} className={alert.type === "danger" ? "text-sky-accent-red" : "text-sky-accent-orange"} />
                <span className="text-sky-text-primary">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bandwidth Chart + User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Live Bandwidth (WAN)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bandwidthHistory}>
                <defs>
                  <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00EAFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00EAFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.1)" />
                <XAxis dataKey="time" stroke="#7AA3C8" fontSize={12} />
                <YAxis stroke="#7AA3C8" fontSize={12} tickFormatter={(v) => formatBandwidth(v).replace("bps", "")} />
                <Tooltip
                  contentStyle={{ background: "#0D1E36", border: "1px solid rgba(0,234,255,0.2)", borderRadius: 8 }}
                  labelStyle={{ color: "#7AA3C8" }}
                  formatter={(value: number, name: string) => [formatBandwidth(value), name === "rx" ? "Download" : "Upload"]}
                />
                <Area type="monotone" dataKey="rx" stroke="#00FF88" fillOpacity={1} fill="url(#rxGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="tx" stroke="#00EAFF" fillOpacity={1} fill="url(#txGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">User Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0D1E36", border: "1px solid rgba(0,234,255,0.2)", borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {userDistribution.filter((u) => u.value > 0).map((u) => (
              <div key={u.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color }} />
                <span className="text-sky-text-secondary">{u.name}</span>
                <span className="text-sky-text-primary font-mono">{u.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interface Status */}
      <div className="glass-card p-5">
        <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Interface Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {interfaces.filter((i: any) => i.name !== "lo").map((iface: any) => (
            <div
              key={iface.name}
              className={`p-3 rounded-lg border ${
                iface.isUp
                  ? "border-sky-accent-green/20 bg-sky-accent-green/5"
                  : "border-sky-accent-red/20 bg-sky-accent-red/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${iface.isUp ? "bg-sky-accent-green animate-pulse" : "bg-sky-accent-red"}`} />
                <span className="text-xs font-medium text-sky-text-primary truncate">{iface.name}</span>
              </div>
              <p className="text-[10px] text-sky-text-secondary">{iface.comment || iface.type}</p>
              <p className="text-[10px] text-sky-text-secondary font-mono mt-1">
                ↓ {formatBandwidth(iface.rxRate)} ↑ {formatBandwidth(iface.txRate)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Users Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">
            PPPoE Live Users ({pppoe?.activeUsers ?? 0})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-sky-text-secondary border-b border-[rgba(0,234,255,0.15)]">
                  <th className="text-left py-2 font-medium">User</th>
                  <th className="text-left py-2 font-medium">IP</th>
                  <th className="text-right py-2 font-medium">Down</th>
                  <th className="text-right py-2 font-medium">Up</th>
                  <th className="text-left py-2 font-medium">Uptime</th>
                </tr>
              </thead>
              <tbody>
                {pppoe?.users?.slice(0, 8).map((u: any) => (
                  <tr key={u.username} className="border-b border-[rgba(0,234,255,0.05)]">
                    <td className="py-2 text-sky-text-primary">{u.username}</td>
                    <td className="py-2 text-sky-text-secondary font-mono">{u.address}</td>
                    <td className="py-2 text-right text-sky-accent-green font-mono">{formatBandwidth(u.rxRate)}</td>
                    <td className="py-2 text-right text-sky-accent-primary font-mono">{formatBandwidth(u.txRate)}</td>
                    <td className="py-2 text-sky-text-secondary">{u.uptime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">
            Hotspot Live Users ({hotspot?.activeUsers ?? 0})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-sky-text-secondary border-b border-[rgba(0,234,255,0.15)]">
                  <th className="text-left py-2 font-medium">User</th>
                  <th className="text-left py-2 font-medium">MAC</th>
                  <th className="text-right py-2 font-medium">Down</th>
                  <th className="text-right py-2 font-medium">Up</th>
                </tr>
              </thead>
              <tbody>
                {hotspot?.users?.slice(0, 8).map((u: any) => (
                  <tr key={u.id} className="border-b border-[rgba(0,234,255,0.05)]">
                    <td className="py-2 text-sky-text-primary">{u.user}</td>
                    <td className="py-2 text-sky-text-secondary font-mono">{u.macAddress}</td>
                    <td className="py-2 text-right text-sky-accent-green font-mono">{formatBandwidth(u.rxRate)}</td>
                    <td className="py-2 text-right text-sky-accent-primary font-mono">{formatBandwidth(u.txRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
