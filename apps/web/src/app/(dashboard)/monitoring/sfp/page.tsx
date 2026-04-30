"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Zap, CheckCircle, AlertTriangle } from "lucide-react";

interface SfpData {
  name: string;
  status: string;
  txPowerDbm: number;
  rxPowerDbm: number;
  temperatureC: number;
  voltageV: number;
  currentMa: number;
  vendor: string;
  partNumber: string;
  isHealthy: boolean;
  txPowerStatus: string;
  rxPowerStatus: string;
}

export default function SfpPage() {
  const [modules, setModules] = useState<SfpData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/monitoring/sfp/");
        setModules(res.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (modules.length === 0) {
    return (
      <div>
        <PageHeader title="SFP Modules" subtitle="Fiber optic transceiver monitoring" />
        <div className="glass-card p-8 text-center">
          <Zap size={48} className="mx-auto text-sky-text-secondary mb-3" />
          <p className="text-sky-text-secondary">No SFP modules detected</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="SFP Modules" subtitle="Fiber optic transceiver monitoring" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((sfp) => (
          <div key={sfp.name} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-sky-accent-primary" />
                <span className="font-semibold text-sky-text-primary">{sfp.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {sfp.isHealthy ? (
                  <CheckCircle size={16} className="text-sky-accent-green" />
                ) : (
                  <AlertTriangle size={16} className="text-sky-accent-red" />
                )}
                <span className={`text-xs font-bold ${sfp.isHealthy ? "text-sky-accent-green" : "text-sky-accent-red"}`}>
                  {sfp.isHealthy ? "Healthy" : "Warning"}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Vendor</span>
                <span className="text-sky-text-primary">{sfp.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Part Number</span>
                <span className="text-sky-text-primary">{sfp.partNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">TX Power</span>
                <span className="font-mono text-sky-text-primary">{sfp.txPowerDbm} dBm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">RX Power</span>
                <span className="font-mono text-sky-text-primary">{sfp.rxPowerDbm} dBm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Temperature</span>
                <span className="font-mono text-sky-text-primary">{sfp.temperatureC}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Voltage</span>
                <span className="font-mono text-sky-text-primary">{sfp.voltageV} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Current</span>
                <span className="font-mono text-sky-text-primary">{sfp.currentMa} mA</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
