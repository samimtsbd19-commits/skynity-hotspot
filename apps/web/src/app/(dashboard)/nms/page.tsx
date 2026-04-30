"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Camera, Server, Wifi, Radio, Activity, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface NmsDevice {
  id: string;
  name: string;
  ip: string;
  type: "camera" | "switch" | "ap" | "olt" | "other";
  status: "online" | "offline";
  streamUrl?: string;
  lastSeen?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  camera: <Camera size={16} />,
  switch: <Server size={16} />,
  ap: <Wifi size={16} />,
  olt: <Radio size={16} />,
  other: <Activity size={16} />,
};

export default function NmsPage() {
  const [devices, setDevices] = useState<NmsDevice[]>([]);
  const [checking, setChecking] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    try {
      const res = await api.get("/nms/devices");
      setDevices(res.data.data || []);
    } catch {}
  }

  async function checkDevice(id: string, ip: string) {
    setChecking(id);
    try {
      const res = await api.post("/nms/camera/check", { ip });
      const result = res.data.data;
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: result.status, streamUrl: result.streamUrl } : d))
      );
    } catch {}
    setChecking(null);
  }

  return (
    <div>
      <PageHeader title="NMS & CCTV Monitoring" subtitle="Network devices and camera status" />

      <div className="flex gap-2 mb-4">
        <button
          onClick={fetchDevices}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(0,234,255,0.1)] text-[#00EAFF] border border-[rgba(0,234,255,0.3)] rounded-lg text-xs font-medium hover:bg-[rgba(0,234,255,0.2)] transition-all"
        >
          <RefreshCw size={12} />
          Refresh All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div key={device.id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sky-accent-primary">{typeIcons[device.type]}</span>
                <h3 className="font-semibold text-sky-text-primary text-sm">{device.name}</h3>
              </div>
              <div className="flex items-center gap-1">
                {device.status === "online" ? (
                  <CheckCircle size={14} className="text-sky-accent-green" />
                ) : (
                  <XCircle size={14} className="text-sky-accent-red" />
                )}
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    device.status === "online"
                      ? "bg-sky-accent-green/10 text-sky-accent-green"
                      : "bg-sky-accent-red/10 text-sky-accent-red"
                  }`}
                >
                  {device.status}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">IP Address</span>
                <span className="font-mono text-sky-text-primary">{device.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Type</span>
                <span className="text-sky-text-primary capitalize">{device.type}</span>
              </div>
              {device.streamUrl && (
                <div className="pt-2 border-t border-[rgba(0,234,255,0.1)]">
                  <span className="text-sky-text-secondary">Stream URL</span>
                  <p className="font-mono text-[10px] text-sky-accent-primary mt-0.5 break-all">{device.streamUrl}</p>
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => checkDevice(device.id, device.ip)}
                disabled={checking === device.id}
                className="flex-1 py-1.5 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded text-xs text-sky-text-secondary hover:border-[rgba(0,234,255,0.4)] hover:text-sky-text-primary transition-all disabled:opacity-50"
              >
                {checking === device.id ? "Checking..." : "Check Status"}
              </button>
              {device.streamUrl && (
                <button className="flex-1 py-1.5 bg-[rgba(0,234,255,0.1)] border border-[rgba(0,234,255,0.3)] rounded text-xs text-[#00EAFF] hover:bg-[rgba(0,234,255,0.2)] transition-all">
                  View Stream
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 glass-card p-5">
        <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-3">SNMP Device Discovery</h3>
        <div className="flex gap-2">
          <input
            placeholder="192.168.88.x"
            className="flex-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none"
          />
          <button className="px-4 py-2 bg-gradient-to-r from-[#00EAFF] to-[#00FF88] text-[#050B15] font-semibold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(0,234,255,0.4)] transition-all">
            Discover
          </button>
        </div>
      </div>
    </div>
  );
}
