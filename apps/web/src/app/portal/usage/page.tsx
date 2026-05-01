"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Download, Upload, Clock, Calendar, Wifi, ArrowLeft } from "lucide-react";
import portalApi from "@/lib/portal-api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatBandwidth } from "@/lib/utils";

interface UsageData {
  username: string;
  sessions: {
    sessionId: string;
    startTime: string;
    stopTime: string | null;
    duration: number;
    download: number;
    upload: number;
    ipAddress: string;
    nasIp: string;
  }[];
  dailyUsage: {
    date: string;
    download: number;
    upload: number;
  }[];
  total: {
    download: number;
    upload: number;
    time: number;
  };
}

export default function UsagePage() {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await portalApi.get("/portal-api/usage");
        setUsage(res.data.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-[#112240] rounded-lg" />
          <div className="h-48 bg-[#112240] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={() => router.push("/portal")}
        className="flex items-center gap-2 text-xs text-sky-text-secondary hover:text-sky-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </button>

      <div className="text-center space-y-2">
        <Activity size={32} className="text-sky-accent-primary mx-auto" />
        <h1 className="font-orbitron text-lg font-bold text-gradient">Usage Statistics</h1>
        <p className="text-sm text-sky-text-secondary">
          {usage?.username ? `User: ${usage.username}` : "No data available"}
        </p>
      </div>

      {/* Total Stats */}
      {usage && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 text-center">
            <Download size={16} className="text-sky-accent-green mx-auto mb-2" />
            <p className="text-xs text-sky-text-secondary">Downloaded</p>
            <p className="text-sm font-bold text-sky-text-primary font-mono">{formatBandwidth(usage.total.download)}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Upload size={16} className="text-sky-accent-primary mx-auto mb-2" />
            <p className="text-xs text-sky-text-secondary">Uploaded</p>
            <p className="text-sm font-bold text-sky-text-primary font-mono">{formatBandwidth(usage.total.upload)}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Clock size={16} className="text-sky-accent-orange mx-auto mb-2" />
            <p className="text-xs text-sky-text-secondary">Online Time</p>
            <p className="text-sm font-bold text-sky-text-primary font-mono">{formatDuration(usage.total.time)}</p>
          </div>
        </div>
      )}

      {/* Daily Usage Chart */}
      {usage && usage.dailyUsage.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Daily Usage (30 Days)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usage.dailyUsage}>
                <defs>
                  <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00EAFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00EAFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.1)" />
                <XAxis dataKey="date" stroke="#7AA3C8" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#7AA3C8" fontSize={10} tickFormatter={(v) => formatBandwidth(v).replace("bps", "")} />
                <Tooltip
                  contentStyle={{ background: "#0D1E36", border: "1px solid rgba(0,234,255,0.2)", borderRadius: 8 }}
                  labelStyle={{ color: "#7AA3C8" }}
                  formatter={(value: number) => [formatBandwidth(value), ""]}
                />
                <Area type="monotone" dataKey="download" stroke="#00FF88" fill="url(#downGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="upload" stroke="#00EAFF" fill="url(#upGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {usage && usage.sessions.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Recent Sessions</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {usage.sessions.slice(0, 10).map((session, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#0A1628] border border-[rgba(0,234,255,0.1)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wifi size={12} className="text-sky-accent-green" />
                    <span className="text-xs text-sky-text-primary font-mono">{session.ipAddress || "—"}</span>
                  </div>
                  <span className="text-[10px] text-sky-text-secondary">
                    {session.startTime ? new Date(session.startTime).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-sky-text-secondary">Duration</span>
                    <p className="text-sky-text-primary font-mono">{formatDuration(session.duration || 0)}</p>
                  </div>
                  <div>
                    <span className="text-sky-text-secondary">Download</span>
                    <p className="text-sky-accent-green font-mono">{formatBandwidth(session.download || 0)}</p>
                  </div>
                  <div>
                    <span className="text-sky-text-secondary">Upload</span>
                    <p className="text-sky-accent-primary font-mono">{formatBandwidth(session.upload || 0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!usage && (
        <div className="glass-card p-8 text-center">
          <Activity size={32} className="text-sky-text-secondary mx-auto mb-3" />
          <p className="text-sm text-sky-text-secondary">No usage data available yet.</p>
          <p className="text-xs text-sky-text-secondary/60 mt-1">Usage will appear after your first connection.</p>
        </div>
      )}
    </div>
  );
}
