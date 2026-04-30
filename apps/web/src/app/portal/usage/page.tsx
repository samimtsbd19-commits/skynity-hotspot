"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
  { day: "Mon", rx: 12.5, tx: 3.2 },
  { day: "Tue", rx: 15.3, tx: 4.1 },
  { day: "Wed", rx: 10.8, tx: 2.8 },
  { day: "Thu", rx: 18.2, tx: 5.5 },
  { day: "Fri", rx: 22.1, tx: 6.2 },
  { day: "Sat", rx: 25.5, tx: 7.8 },
  { day: "Sun", rx: 20.3, tx: 5.9 },
];

export default function UsagePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-sky-text-primary">Usage Statistics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">Total Downloaded</p>
          <p className="text-2xl font-bold text-sky-accent-green font-mono mt-1">124.7 GB</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">Total Uploaded</p>
          <p className="text-2xl font-bold text-sky-accent-primary font-mono mt-1">35.5 GB</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">Avg Daily Use</p>
          <p className="text-2xl font-bold text-sky-text-primary font-mono mt-1">17.8 GB</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Last 7 Days Traffic</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="u1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="u2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00EAFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00EAFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.1)" />
              <XAxis dataKey="day" stroke="#7AA3C8" fontSize={12} />
              <YAxis stroke="#7AA3C8" fontSize={12} />
              <Tooltip contentStyle={{ background: "#0D1E36", border: "1px solid rgba(0,234,255,0.2)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="rx" stroke="#00FF88" fill="url(#u1)" strokeWidth={2} name="Download (GB)" />
              <Area type="monotone" dataKey="tx" stroke="#00EAFF" fill="url(#u2)" strokeWidth={2} name="Upload (GB)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
