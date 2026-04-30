"use client";

import React, { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { FileCode, Router, Download, Play, CheckCircle } from "lucide-react";

const configTypes = [
  { id: "full", label: "Full Configuration", desc: "Complete router setup (PPPoE + Hotspot + Queues + Firewall + RADIUS)" },
  { id: "pppoe", label: "PPPoE Server", desc: "PPPoE server with RADIUS auth and IP pool" },
  { id: "hotspot", label: "Hotspot Server", desc: "Hotspot with captive portal and RADIUS" },
  { id: "queues", label: "Queue Tree", desc: "Bandwidth queue templates for all packages" },
  { id: "firewall", label: "Firewall Rules", desc: "Basic firewall + NAT + blocked users list" },
  { id: "radius", label: "RADIUS Config", desc: "RADIUS server connection for PPPoE & Hotspot" },
  { id: "wireguard", label: "WireGuard Tunnel", desc: "WG tunnel for VPS-Starlink CGNAT workaround" },
];

export default function RouterConfigPage() {
  const [selectedType, setSelectedType] = useState("full");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState("");
  const [config, setConfig] = useState({
    wanInterface: "ether1",
    lanInterface: "ether2",
    pppoeInterface: "ether2",
    hotspotInterface: "ether3",
    radiusServerIp: "10.100.0.1",
    radiusSecret: "skynity-radius-secret",
    pppoePoolRange: "192.168.88.10-192.168.88.254",
    hotspotPoolRange: "192.168.89.10-192.168.89.254",
    hotspotAddress: "192.168.89.1/24",
  });

  async function generateScript() {
    setLoading(true);
    setSuccess("");
    try {
      const res = await api.post("/router-config/rsc", {
        type: selectedType,
        config: {
          wanInterface: config.wanInterface,
          lanInterface: config.lanInterface,
          pppoeInterface: config.pppoeInterface,
          hotspotInterface: config.hotspotInterface,
          radiusServerIp: config.radiusServerIp,
          radiusSecret: config.radiusSecret,
          pppoePoolRange: config.pppoePoolRange,
          hotspotPoolRange: config.hotspotPoolRange,
          hotspotAddress: config.hotspotAddress,
        },
      });
      setScript(res.data.data.script);
    } catch {
      setScript("Error generating script");
    }
    setLoading(false);
  }

  async function applyConfig() {
    setApplying(true);
    setSuccess("");
    try {
      const res = await api.post("/router-config/apply", {
        type: selectedType,
        config,
      });
      setSuccess(res.data.data.message);
    } catch {
      setSuccess("Failed to apply configuration");
    }
    setApplying(false);
  }

  function downloadRsc() {
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skynity-${selectedType}-config.rsc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Router Configuration" subtitle="Generate RSC scripts & push config to MikroTik" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Type Selection */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary flex items-center gap-2">
            <FileCode size={16} /> Configuration Type
          </h3>
          <div className="space-y-2">
            {configTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedType(t.id); setScript(""); setSuccess(""); }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedType === t.id
                    ? "border-sky-accent-primary bg-sky-accent-primary/10"
                    : "border-[rgba(0,234,255,0.1)] hover:border-[rgba(0,234,255,0.3)]"
                }`}
              >
                <div className="text-sm text-sky-text-primary font-medium">{t.label}</div>
                <div className="text-xs text-sky-text-secondary mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary flex items-center gap-2">
            <Router size={16} /> Interface & Network Settings
          </h3>
          <div className="space-y-3">
            {[
              { key: "wanInterface", label: "WAN Interface" },
              { key: "lanInterface", label: "LAN Interface" },
              { key: "pppoeInterface", label: "PPPoE Interface" },
              { key: "hotspotInterface", label: "Hotspot Interface" },
              { key: "radiusServerIp", label: "RADIUS Server IP" },
              { key: "radiusSecret", label: "RADIUS Secret" },
              { key: "pppoePoolRange", label: "PPPoE Pool Range" },
              { key: "hotspotPoolRange", label: "Hotspot Pool Range" },
              { key: "hotspotAddress", label: "Hotspot Gateway" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs text-sky-text-secondary block mb-1">{field.label}</label>
                <input
                  type="text"
                  value={(config as any)[field.key]}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  className="w-full bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded px-3 py-2 text-sm text-sky-text-primary focus:border-sky-accent-primary focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={generateScript}
              disabled={loading}
              className="flex-1 bg-sky-accent-primary/20 hover:bg-sky-accent-primary/30 text-sky-accent-primary border border-sky-accent-primary/50 rounded-lg py-2 px-4 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Generating..." : <><FileCode size={14} /> Generate RSC</>}
            </button>
            <button
              onClick={applyConfig}
              disabled={applying || !script}
              className="flex-1 bg-sky-accent-green/20 hover:bg-sky-accent-green/30 text-sky-accent-green border border-sky-accent-green/50 rounded-lg py-2 px-4 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {applying ? "Applying..." : <><Play size={14} /> Push to Router</>}
            </button>
          </div>

          {success && (
            <div className="flex items-center gap-2 text-sky-accent-green text-xs bg-sky-accent-green/10 p-2 rounded">
              <CheckCircle size={14} /> {success}
            </div>
          )}
        </div>

        {/* Script Preview */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary">Generated Script</h3>
            {script && (
              <button onClick={downloadRsc} className="text-xs text-sky-accent-primary hover:text-sky-accent-green flex items-center gap-1 transition-colors">
                <Download size={12} /> Download .rsc
              </button>
            )}
          </div>
          <div className="flex-1 bg-[#0A1628] rounded-lg border border-[rgba(0,234,255,0.1)] p-3 overflow-auto">
            <pre className="text-xs font-mono text-sky-text-secondary whitespace-pre-wrap">
              {script || "Click 'Generate RSC' to preview the RouterOS script..."}
            </pre>
          </div>
          <p className="text-xs text-sky-text-secondary mt-3">
            Copy this script to <strong>System &gt; Scripts</strong> in Winbox or use <strong>Push to Router</strong> for automatic deployment.
          </p>
        </div>
      </div>
    </div>
  );
}
