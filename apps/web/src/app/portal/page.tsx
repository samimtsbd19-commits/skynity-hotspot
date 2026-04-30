"use client";

import React from "react";
import { Wifi, Calendar, DollarSign, ArrowDown, ArrowUp, Activity } from "lucide-react";

export default function CustomerPortalPage() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sky-text-primary">Welcome back, Rahim!</h1>
            <p className="text-sm text-sky-text-secondary mt-1">Your SKYNITY connection is active and running smoothly.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-accent-green/10 border border-sky-accent-green/30 rounded-full">
            <Wifi size={14} className="text-sky-accent-green" />
            <span className="text-xs font-bold text-sky-accent-green uppercase">Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-sky-accent-primary" />
            <span className="text-xs text-sky-text-secondary uppercase tracking-wider">Current Plan</span>
          </div>
          <h3 className="text-lg font-bold text-sky-text-primary">Home Premium</h3>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-sky-accent-green text-sm">
              <ArrowDown size={14} />
              <span className="font-mono font-bold">30 Mbps</span>
            </div>
            <div className="flex items-center gap-1 text-sky-accent-primary text-sm">
              <ArrowUp size={14} />
              <span className="font-mono font-bold">15 Mbps</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-sky-accent-orange" />
            <span className="text-xs text-sky-text-secondary uppercase tracking-wider">Expires On</span>
          </div>
          <h3 className="text-lg font-bold text-sky-text-primary">15 June, 2024</h3>
          <p className="text-xs text-sky-text-secondary mt-1">12 days remaining</p>
          <div className="mt-3 h-1.5 bg-[#0A1628] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-accent-orange to-sky-accent-red rounded-full" style={{ width: "60%" }} />
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-sky-accent-green" />
            <span className="text-xs text-sky-text-secondary uppercase tracking-wider">Last Payment</span>
          </div>
          <h3 className="text-lg font-bold text-sky-text-primary">৳800 BDT</h3>
          <p className="text-xs text-sky-text-secondary mt-1">Paid via bKash on 15 May</p>
          <span className="inline-block mt-2 text-[10px] bg-sky-accent-green/10 text-sky-accent-green px-2 py-0.5 rounded font-bold uppercase">Paid</span>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Renew Plan", "Upgrade Speed", "View Usage", "Pay Bill"].map((action) => (
            <button
              key={action}
              className="p-4 bg-[#0A1628] border border-[rgba(0,234,255,0.1)] rounded-lg text-sm font-medium text-sky-text-primary hover:border-[rgba(0,234,255,0.3)] hover:bg-[rgba(0,234,255,0.05)] transition-all"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
