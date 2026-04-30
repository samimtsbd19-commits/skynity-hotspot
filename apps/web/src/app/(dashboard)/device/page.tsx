"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Router, Cpu, HardDrive, Fingerprint, Globe, Tag } from "lucide-react";

interface DeviceData {
  identity: string;
  model: string;
  rosVersion: string;
  firmwareVersion: string;
  serial: string;
  licenseLevel: number;
  licenseFeatures: string[];
  architecture: string;
  ipAddresses: string[];
  macAddresses: string[];
}

export default function DevicePage() {
  const [device, setDevice] = useState<DeviceData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/device/info");
        setDevice(res.data.data);
      } catch {
        // ignore
      }
    }
    fetchData();
  }, []);

  if (!device) {
    return (
      <div>
        <PageHeader title="Device Info" subtitle="Router hardware & software details" />
        <div className="glass-card p-8 text-center">
          <div className="animate-pulse space-y-3 max-w-md mx-auto">
            <div className="h-4 bg-[#112240] rounded" />
            <div className="h-4 bg-[#112240] rounded" />
            <div className="h-4 bg-[#112240] rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Device Info" subtitle="Router hardware & software details" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Router size={20} className="text-sky-accent-primary" />
            <h3 className="font-semibold text-sky-text-primary">Hardware</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">Model</span>
              <span className="text-sky-text-primary font-medium">{device.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">Serial</span>
              <span className="font-mono text-sky-text-primary">{device.serial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">License</span>
              <span className="text-sky-text-primary">Level {device.licenseLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">Architecture</span>
              <span className="text-sky-text-primary">{device.architecture}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={20} className="text-sky-accent-primary" />
            <h3 className="font-semibold text-sky-text-primary">Software</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">Identity</span>
              <span className="text-sky-text-primary font-medium">{device.identity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">RouterOS</span>
              <span className="font-mono text-sky-accent-primary">{device.rosVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sky-text-secondary">Firmware</span>
              <span className="font-mono text-sky-text-primary">{device.firmwareVersion}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={20} className="text-sky-accent-primary" />
            <h3 className="font-semibold text-sky-text-primary">Network</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-sky-text-secondary">IP Addresses</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {device.ipAddresses.map((ip) => (
                  <span key={ip} className="font-mono text-xs bg-[#0A1628] px-2 py-1 rounded text-sky-text-primary">
                    {ip}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sky-text-secondary">MAC Addresses</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {device.macAddresses.map((mac) => (
                  <span key={mac} className="font-mono text-xs bg-[#0A1628] px-2 py-1 rounded text-sky-text-primary">
                    {mac}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={20} className="text-sky-accent-primary" />
            <h3 className="font-semibold text-sky-text-primary">Features</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {device.licenseFeatures.map((f) => (
              <span key={f} className="text-xs bg-[rgba(0,234,255,0.1)] text-[#00EAFF] px-2 py-1 rounded border border-[rgba(0,234,255,0.2)]">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
