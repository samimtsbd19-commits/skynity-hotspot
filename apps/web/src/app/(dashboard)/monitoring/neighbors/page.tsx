"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Radio } from "lucide-react";

interface NeighborData {
  identity: string;
  macAddress: string;
  ipAddress: string;
  interface: string;
  platform: string;
  version: string;
  uptime: string;
  discoveryProtocol: string;
}

export default function NeighborsPage() {
  const [neighbors, setNeighbors] = useState<NeighborData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/monitoring/neighbors/");
        setNeighbors(res.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <PageHeader title="Neighbor Discovery" subtitle="MNDP / CDP / LLDP neighbors" />
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Identity</th>
              <th className="text-left px-4 py-3">MAC</th>
              <th className="text-left px-4 py-3">IP</th>
              <th className="text-left px-4 py-3">Interface</th>
              <th className="text-left px-4 py-3">Platform</th>
              <th className="text-left px-4 py-3">Version</th>
              <th className="text-left px-4 py-3">Protocol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
            {neighbors.map((n, i) => (
              <tr key={i} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                <td className="px-4 py-3 font-medium text-sky-text-primary">
                  <div className="flex items-center gap-2">
                    <Radio size={14} className="text-sky-accent-primary" />
                    {n.identity}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-sky-text-secondary">{n.macAddress}</td>
                <td className="px-4 py-3 font-mono text-sky-text-secondary">{n.ipAddress}</td>
                <td className="px-4 py-3 text-sky-text-secondary">{n.interface}</td>
                <td className="px-4 py-3 text-sky-text-secondary">{n.platform}</td>
                <td className="px-4 py-3 text-sky-text-secondary">{n.version}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#112240] text-sky-accent-primary">
                    {n.discoveryProtocol}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
