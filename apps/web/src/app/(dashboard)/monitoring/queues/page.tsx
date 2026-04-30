"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { formatBandwidth, formatBytes } from "@/lib/utils";
import { Network } from "lucide-react";

interface QueueData {
  name: string;
  target: string;
  maxLimitUp: string;
  maxLimitDown: string;
  txRate: number;
  rxRate: number;
  txBytes: bigint;
  rxBytes: bigint;
  comment: string;
  disabled: boolean;
}

export default function QueuesPage() {
  const [queues, setQueues] = useState<QueueData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/monitoring/queues/");
        setQueues(res.data.data || []);
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
      <PageHeader title="Queue Monitoring" subtitle="Simple queue traffic stats" />
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Target</th>
              <th className="text-left px-4 py-3">Max Limit</th>
              <th className="text-left px-4 py-3">Current Rate</th>
              <th className="text-left px-4 py-3">Total Traffic</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
            {queues.map((q) => (
              <tr key={q.name} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                <td className="px-4 py-3 font-medium text-sky-text-primary">
                  <div className="flex items-center gap-2">
                    <Network size={14} className="text-sky-accent-primary" />
                    {q.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-sky-text-secondary">{q.target}</td>
                <td className="px-4 py-3 text-sky-text-secondary">{q.maxLimitDown}/{q.maxLimitUp}</td>
                <td className="px-4 py-3 font-mono text-sky-accent-primary">
                  ↓{formatBandwidth(q.rxRate)} ↑{formatBandwidth(q.txRate)}
                </td>
                <td className="px-4 py-3 font-mono text-sky-text-secondary">
                  ↓{formatBytes(q.rxBytes)} ↑{formatBytes(q.txBytes)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      q.disabled ? "bg-sky-accent-red/10 text-sky-accent-red" : "bg-sky-accent-green/10 text-sky-accent-green"
                    }`}
                  >
                    {q.disabled ? "Disabled" : "Active"}
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
