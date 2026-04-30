"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Server, Wifi, CheckCircle, XCircle, Activity, Search, Plus, Trash2, Router } from "lucide-react";

interface RouterItem {
  id: string;
  name: string;
  vendor: string;
  host: string;
  port: number;
  isActive: boolean;
  lastSeenAt?: string;
  model?: string;
  rosVersion?: string;
}

interface TestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  deviceInfo?: {
    identity?: string;
    model?: string;
    version?: string;
    serial?: string;
  };
  interfaces?: string[];
}

const vendors = [
  { id: "mikrotik", name: "MikroTik", icon: Router },
  { id: "cisco", name: "Cisco", icon: Server },
  { id: "ubiquiti", name: "Ubiquiti", icon: Wifi },
  { id: "tplink", name: "TP-Link", icon: Router },
  { id: "generic", name: "Generic / SNMP", icon: Server },
];

export default function RouterPage() {
  const [routers, setRouters] = useState<RouterItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    vendor: "mikrotik",
    host: "",
    port: 8729,
    username: "admin",
    password: "",
    useSsl: true,
    wireguardPeerIp: "10.100.0.2",
  });

  useEffect(() => {
    fetchRouters();
  }, []);

  async function fetchRouters() {
    try {
      const res = await api.get("/routers/");
      setRouters(res.data.data || []);
    } catch {}
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post("/routers/test", form);
      setTestResult(res.data.data);
    } catch (err: any) {
      setTestResult({ success: false, latencyMs: 0, message: err.response?.data?.error?.message || "Test failed" });
    }
    setTesting(false);
  }

  async function handleDiscover() {
    setTesting(true);
    try {
      const res = await api.post("/routers/discover", form);
      setDiscovered(res.data.data || []);
    } catch {}
    setTesting(false);
  }

  async function handleSave() {
    try {
      await api.post("/routers/", form);
      setShowAdd(false);
      fetchRouters();
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this router?")) return;
    try {
      await api.delete(`/routers/${id}`);
      fetchRouters();
    } catch {}
  }

  return (
    <div>
      <PageHeader title="Router Connector" subtitle="Connect and manage network devices" />

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <div className="glass-card px-3 py-1.5 flex items-center gap-2">
            <Activity size={14} className="text-sky-accent-green" />
            <span className="text-xs text-sky-text-secondary">{routers.filter((r) => r.isActive).length} Online</span>
          </div>
          <div className="glass-card px-3 py-1.5 flex items-center gap-2">
            <Wifi size={14} className="text-sky-accent-orange" />
            <span className="text-xs text-sky-text-secondary">{routers.length} Total</span>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00EAFF] to-[#00FF88] text-[#050B15] font-semibold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(0,234,255,0.4)] transition-all"
        >
          <Plus size={16} />
          Add Router
        </button>
      </div>

      {showAdd && (
        <div className="glass-card p-6 mb-6 space-y-4">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary">New Router Connection</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-sky-text-secondary uppercase tracking-wider">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none" placeholder="Core Router" />
            </div>
            <div>
              <label className="text-xs text-sky-text-secondary uppercase tracking-wider">Vendor</label>
              <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none">
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-sky-text-secondary uppercase tracking-wider">Host / IP</label>
              <input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none" placeholder="192.168.88.1 or 10.100.0.2" />
            </div>
            <div>
              <label className="text-xs text-sky-text-secondary uppercase tracking-wider">Port</label>
              <input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none" />
            </div>
            <div>
              <label className="text-xs text-sky-text-secondary uppercase tracking-wider">Username</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none" />
            </div>
            <div>
              <label className="text-xs text-sky-text-secondary uppercase tracking-wider">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none" />
            </div>
            <div>
              <label className="text-xs text-sky-text-secondary uppercase tracking-wider">WireGuard Peer IP</label>
              <input value={form.wireguardPeerIp} onChange={(e) => setForm({ ...form, wireguardPeerIp: e.target.value })} className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={form.useSsl} onChange={(e) => setForm({ ...form, useSsl: e.target.checked })} className="accent-[#00EAFF]" />
              <span className="text-sm text-sky-text-secondary">Use SSL (HTTPS)</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleTest} disabled={testing} className="px-4 py-2 bg-[rgba(0,234,255,0.1)] text-[#00EAFF] border border-[rgba(0,234,255,0.3)] rounded-lg text-sm font-medium hover:bg-[rgba(0,234,255,0.2)] transition-all disabled:opacity-50">
              {testing ? "Testing..." : "Test Connection"}
            </button>
            <button onClick={handleDiscover} disabled={testing} className="px-4 py-2 bg-[rgba(168,85,247,0.1)] text-sky-accent-purple border border-[rgba(168,85,247,0.3)] rounded-lg text-sm font-medium hover:bg-[rgba(168,85,247,0.2)] transition-all disabled:opacity-50">
              Auto Discover
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-gradient-to-r from-[#00EAFF] to-[#00FF88] text-[#050B15] font-semibold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(0,234,255,0.4)] transition-all ml-auto">
              Save Router
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg border ${testResult.success ? "bg-sky-accent-green/5 border-sky-accent-green/30" : "bg-sky-accent-red/5 border-sky-accent-red/30"}`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? <CheckCircle size={16} className="text-sky-accent-green" /> : <XCircle size={16} className="text-sky-accent-red" />}
                <span className={`text-sm font-semibold ${testResult.success ? "text-sky-accent-green" : "text-sky-accent-red"}`}>
                  {testResult.message}
                </span>
                <span className="text-xs text-sky-text-secondary ml-auto">{testResult.latencyMs}ms</span>
              </div>
              {testResult.deviceInfo && (
                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                  {testResult.deviceInfo.identity && <div className="text-sky-text-secondary">Identity: <span className="text-sky-text-primary">{testResult.deviceInfo.identity}</span></div>}
                  {testResult.deviceInfo.model && <div className="text-sky-text-secondary">Model: <span className="text-sky-text-primary">{testResult.deviceInfo.model}</span></div>}
                  {testResult.deviceInfo.version && <div className="text-sky-text-secondary">Version: <span className="text-sky-text-primary">{testResult.deviceInfo.version}</span></div>}
                  {testResult.deviceInfo.serial && <div className="text-sky-text-secondary">Serial: <span className="text-sky-text-primary">{testResult.deviceInfo.serial}</span></div>}
                </div>
              )}
              {discovered.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[rgba(0,234,255,0.1)]">
                  <p className="text-xs text-sky-text-secondary mb-1">Discovered Interfaces:</p>
                  <div className="flex flex-wrap gap-1">
                    {discovered.map((d) => (
                      <span key={d} className="text-[10px] bg-[#112240] text-sky-text-primary px-2 py-0.5 rounded">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routers.map((r) => (
          <div key={r.id} className="glass-card p-5 relative group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server size={18} className={r.isActive ? "text-sky-accent-green" : "text-sky-accent-red"} />
                <h3 className="font-semibold text-sky-text-primary">{r.name}</h3>
              </div>
              <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-sky-accent-red/10 text-sky-text-secondary hover:text-sky-accent-red transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Vendor</span>
                <span className="text-sky-text-primary capitalize">{r.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Host</span>
                <span className="font-mono text-sky-text-primary">{r.host}:{r.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Model</span>
                <span className="text-sky-text-primary">{r.model || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-text-secondary">Version</span>
                <span className="text-sky-text-primary">{r.rosVersion || "-"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[rgba(0,234,255,0.1)]">
                <span className="text-sky-text-secondary">Status</span>
                <span className={`font-bold uppercase ${r.isActive ? "text-sky-accent-green" : "text-sky-accent-red"}`}>
                  {r.isActive ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
