"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { formatBandwidth, formatBytes } from "@/lib/utils";
import { ArrowDown, ArrowUp, Activity } from "lucide-react";

interface InterfaceData {
  name: string;
  type: string;
  isUp: boolean;
  rxRate: number;
  txRate: number;
  rxBytes: bigint;
  txBytes: bigint;
  comment: string;
}

export default function BandwidthPage() {
  const [ifaces, setIfaces] = useState<InterfaceData[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/monitoring/bandwidth/interfaces");
        setIfaces(res.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = ifaces.filter((i) => {
    if (filter === "all") return true;
    if (filter === "wan") return i.comment.toLowerCase().includes("wan") || i.name.includes("pppoe-out");
    if (filter === "lan") return i.comment.toLowerCase().includes("lan") || i.name === "bridge1";
    if (filter === "vlan") return i.type === "vlan";
    return true;
  });

  return (
    <div>
      <PageHeader title="Bandwidth Monitoring" subtitle="Real-time interface traffic" />
      <div className="flex gap-2 mb-4">
        {["all", "wan", "lan", "vlan"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
              filter === f
                ? "bg-[rgba(0,234,255,0.15)] text-[#00EAFF] border border-[rgba(0,234,255,0.3)]"
                : "text-sky-text-secondary hover:bg-[#112240]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((iface) => (
          <div key={iface.name} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className={iface.isUp ? "text-sky-accent-green" : "text-sky-accent-red"} />
                <span className="font-semibold text-sky-text-primary">{iface.name}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#112240] text-sky-text-secondary">
                {iface.type}
              </span>
            </div>
            <p className="text-xs text-sky-text-secondary mb-3">{iface.comment || "No comment"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0A1628] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-sky-accent-green mb-1">
                  <ArrowDown size={14} />
                  <span className="text-[10px] uppercase tracking-wider">RX</span>
                </div>
                <p className="text-sm font-mono font-semibold">{formatBandwidth(iface.rxRate)}</p>
                <p className="text-[10px] text-sky-text-secondary">{formatBytes(iface.rxBytes)} total</p>
              </div>
              <div className="bg-[#0A1628] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-sky-accent-primary mb-1">
                  <ArrowUp size={14} />
                  <span className="text-[10px] uppercase tracking-wider">TX</span>
                </div>
                <p className="text-sm font-mono font-semibold">{formatBandwidth(iface.txRate)}</p>
                <p className="text-[10px] text-sky-text-secondary">{formatBytes(iface.txBytes)} total</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
