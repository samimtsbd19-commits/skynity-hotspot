"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Globe, AlertCircle } from "lucide-react";

interface PingData {
  host: string;
  avgMs: number;
  packetLossPct: number;
  status: "excellent" | "good" | "fair" | "poor" | "unreachable";
  minMs: number;
  maxMs: number;
  jitterMs: number;
}

const statusColor: Record<string, string> = {
  excellent: "text-sky-accent-primary",
  good: "text-sky-accent-green",
  fair: "text-sky-accent-orange",
  poor: "text-sky-accent-red",
  unreachable: "text-sky-accent-red",
};

export default function PingPage() {
  const [pings, setPings] = useState<PingData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/monitoring/ping/");
        setPings(res.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <PageHeader title="Ping & Latency" subtitle="Real-time connectivity checks" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pings.map((ping) => (
          <div key={ping.host} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-sky-accent-primary" />
                <span className="font-semibold text-sky-text-primary">{ping.host}</span>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${statusColor[ping.status]}`}>
                {ping.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                <p className="text-[10px] text-sky-text-secondary uppercase">Avg</p>
                <p className="text-xl font-mono font-bold text-sky-text-primary">{ping.avgMs}ms</p>
              </div>
              <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                <p className="text-[10px] text-sky-text-secondary uppercase">Min</p>
                <p className="text-xl font-mono font-bold text-sky-accent-green">{ping.minMs}ms</p>
              </div>
              <div className="bg-[#0A1628] rounded-lg p-3 text-center">
                <p className="text-[10px] text-sky-text-secondary uppercase">Max</p>
                <p className="text-xl font-mono font-bold text-sky-accent-orange">{ping.maxMs}ms</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-sky-text-secondary">Jitter: {ping.jitterMs}ms</span>
              <div className="flex items-center gap-1">
                {ping.packetLossPct > 5 && <AlertCircle size={14} className="text-sky-accent-red" />}
                <span className={ping.packetLossPct > 5 ? "text-sky-accent-red font-semibold" : "text-sky-text-secondary"}>
                  Loss: {ping.packetLossPct}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
