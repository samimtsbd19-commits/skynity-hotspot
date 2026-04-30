"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Settings, CreditCard, Bot, Radio, Shield, Bell } from "lucide-react";

interface SettingItem {
  id: number;
  key: string;
  value: string;
  type: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/settings/");
        setSettings(res.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
  }, []);

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "telegram", label: "Telegram", icon: Bot },
    { id: "radius", label: "RADIUS", icon: Radio },
    { id: "wireguard", label: "WireGuard", icon: Shield },
    { id: "alerts", label: "Alerts", icon: Bell },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration" />
      <div className="flex gap-4">
        <div className="w-48 shrink-0 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id
                  ? "bg-[rgba(0,234,255,0.1)] text-[#00EAFF]"
                  : "text-sky-text-secondary hover:bg-[#112240] hover:text-sky-text-primary"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 glass-card p-5">
          <h3 className="font-semibold text-sky-text-primary mb-4 capitalize">{activeTab} Settings</h3>
          <div className="space-y-3">
            {settings.length === 0 ? (
              <p className="text-sky-text-secondary text-sm">No settings found.</p>
            ) : (
              settings.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-[rgba(0,234,255,0.1)]">
                  <span className="text-sm text-sky-text-secondary uppercase tracking-wider">{s.key}</span>
                  <span className="text-sm font-mono text-sky-text-primary">{s.value}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
