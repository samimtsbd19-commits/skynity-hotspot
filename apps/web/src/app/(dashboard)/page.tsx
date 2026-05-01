"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/monitoring/StatCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Wifi, TrendingUp, AlertTriangle, Activity, Gauge, Router, Radio } from "lucide-react";
import api from "@/lib/api";
import { formatBandwidth } from "@/lib/utils";
import { useRealtimeLiveStats } from "@/hooks/useRealtimeLiveStats";
import { useRealtimeBandwidth } from "@/hooks/useRealtimeBandwidth";

interface ResourceData {
  cpuLoad: number;
  freeMemoryMB: number;
  totalMemoryMB: number;
  usedMemoryPercent: number;
}

export default function DashboardPage() {
  const [resource, setResource] = useState<ResourceData | null>(null);
  const liveStats = useRealtimeLiveStats();
  const bandwidthData = useRealtimeBandwidth();

  const [bandwidthHistory, setBandwidthHistory] = useState<{ time: string; rx: number; tx: number }[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/monitoring/resource/");
        setResource(res.data.data);
      } catch {
        // ignore
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Build bandwidth chart history from socket data
  useEffect(() => {
    if (bandwidthData.length > 0) {
      const wan = bandwidthData.find((i) => i.name === "ether1");
      if (wan) {
        const now = new Date().toLocaleTimeString("en-BD", { hour12: false });
        setBandwidthHistory((prev) => {
          const next = [...prev, { time: now, rx: wan.rxRate, tx: wan.txRate }];
          if (next.length > 20) next.shift();
          return next;
        });
      }
    }
  }, [bandwidthData]);

  const wan = liveStats?.wan;
  const pppoe = liveStats?.pppoe;
  const hotspot = liveStats?.hotspot;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Real-time network overview" />

      {/* Live Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Speed Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={TrendingUp}
          label="PPPoE Total Down"
          value={pppoe ? formatBandwidth(pppoe.totalRxRate) : "—"}
          subtext={`TX: ${pppoe ? formatBandwidth(pppoe.totalTxRate) : "—"}`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Hotspot Total Down"
          value={hotspot ? formatBandwidth(hotspot.totalRxRate) : "—"}
          subtext={`TX: ${hotspot ? formatBandwidth(hotspot.totalTxRate) : "—"}`}
          color="purple"
        />
        <StatCard
          icon={Router}
          label="Router Status"
          value={resource ? "Online" : "Unknown"}
          subtext={resource ? `CPU: ${resource.cpuLoad}%` : "Loading..."}
          color="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Expiring Soon"
          value={pppoe?.users?.length?.toString() ?? "—"}
          subtext="Active PPPoE users"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Live Bandwidth Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Live Bandwidth (WAN)</h3>
          <div className="h-64">
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

        {/* System Resources */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary">System Resources</h3>
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
                    style={{ width: `${resource.cpuLoad}%` }}
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
                    style={{ width: `${resource.usedMemoryPercent}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-[rgba(0,234,255,0.15)]">
                <div className="flex justify-between text-xs">
                  <span className="text-sky-text-secondary">Free Memory</span>
                  <span className="text-sky-text-primary font-mono">{resource.freeMemoryMB} MB</span>
                </div>
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
      </div>

      {/* Live Users Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* PPPoE Live Users */}
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
                </tr>
              </thead>
              <tbody>
                {pppoe?.users?.slice(0, 6).map((u) => (
                  <tr key={u.username} className="border-b border-[rgba(0,234,255,0.05)]">
                    <td className="py-2 text-sky-text-primary">{u.username}</td>
                    <td className="py-2 text-sky-text-secondary font-mono">{u.address}</td>
                    <td className="py-2 text-right text-sky-accent-green font-mono">{formatBandwidth(u.rxRate)}</td>
                    <td className="py-2 text-right text-sky-accent-primary font-mono">{formatBandwidth(u.txRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hotspot Live Users */}
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
                {hotspot?.users?.slice(0, 6).map((u) => (
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
