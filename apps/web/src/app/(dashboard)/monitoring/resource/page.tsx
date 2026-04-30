"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";

interface ResourceData {
  cpuLoad: number;
  freeMemoryMB: number;
  totalMemoryMB: number;
  usedMemoryPercent: number;
  uptime: string;
  uptimeSeconds: number;
  boardName: string;
  version: string;
}

interface HealthData {
  temperature: number;
  voltage: number;
  current: number;
  powerConsumption: number;
  fanSpeed?: number;
}

export default function ResourcePage() {
  const [resource, setResource] = useState<ResourceData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [res, healthRes] = await Promise.all([
          api.get("/monitoring/resource/"),
          api.get("/monitoring/resource/health"),
        ]);
        setResource(res.data.data);
        setHealth(healthRes.data.data);
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
      <PageHeader title="Resource Monitoring" subtitle="CPU, RAM, temperature, and health" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">CPU Load</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-bold text-sky-accent-primary font-mono">{resource?.cpuLoad ?? "--"}%</span>
          </div>
          <div className="mt-3 h-2 bg-[#0A1628] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00EAFF] to-[#00FF88] rounded-full transition-all"
              style={{ width: `${resource?.cpuLoad ?? 0}%` }}
            />
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">RAM Usage</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-bold text-sky-accent-purple font-mono">{resource?.usedMemoryPercent ?? "--"}%</span>
          </div>
          <div className="mt-3 h-2 bg-[#0A1628] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#A855F7] to-[#00EAFF] rounded-full transition-all"
              style={{ width: `${resource?.usedMemoryPercent ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-sky-text-secondary mt-2">
            {resource?.freeMemoryMB ?? "--"} MB free / {resource?.totalMemoryMB ?? "--"} MB total
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">Temperature</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-bold text-sky-accent-orange font-mono">{health?.temperature ?? "--"}°C</span>
          </div>
          <p className="text-xs text-sky-text-secondary mt-2">Fan: {health?.fanSpeed ?? "--"} RPM</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">Voltage</p>
          <div className="mt-3">
            <span className="text-2xl font-bold text-sky-text-primary font-mono">{health?.voltage ?? "--"} V</span>
          </div>
          <p className="text-xs text-sky-text-secondary mt-2">Current: {health?.current ?? "--"} A</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">Uptime</p>
          <div className="mt-3">
            <span className="text-2xl font-bold text-sky-accent-green font-mono">{resource?.uptime ?? "--"}</span>
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">Power</p>
          <div className="mt-3">
            <span className="text-2xl font-bold text-sky-text-primary font-mono">{health?.powerConsumption ?? "--"} W</span>
          </div>
        </div>
      </div>
    </div>
  );
}
