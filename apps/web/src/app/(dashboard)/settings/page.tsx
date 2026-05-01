"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import {
  Settings, CreditCard, Bot, Radio, Shield, Bell, Save, CheckCircle, Plus, Trash2,
  Building2, Phone, Mail, Globe, DollarSign, ToggleLeft, ToggleRight, Menu, X
} from "lucide-react";

interface SettingItem {
  id: number;
  key: string;
  value: string;
  type: string;
}

interface PaymentConfig {
  id: number;
  method: string;
  accountNumber: string;
  accountType: string | null;
  isActive: boolean;
}

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "telegram", label: "Telegram", icon: Bot },
  { id: "radius", label: "RADIUS", icon: Radio },
  { id: "wireguard", label: "WireGuard", icon: Shield },
  { id: "alerts", label: "Alerts", icon: Bell },
];

const generalKeys = ["company_name", "company_tagline", "support_phone", "support_email", "timezone", "currency"];
const telegramKeys = ["telegram_bot_token", "telegram_admin_chat_id", "telegram_channel_id"];
const radiusKeys = ["radius_server_host", "radius_auth_port", "radius_acct_port", "radius_secret"];
const wireguardKeys = ["wg_endpoint", "wg_port", "wg_public_key"];
const alertKeys = ["alert_low_balance_threshold", "alert_expiry_days", "alert_email_enabled", "alert_sms_enabled"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [payments, setPayments] = useState<PaymentConfig[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({ method: "", accountNumber: "", accountType: "personal" });

  useEffect(() => {
    async function fetchData() {
      try {
        const [sRes, pRes] = await Promise.all([api.get("/settings/"), api.get("/settings/payments")]);
        const sMap: Record<string, string> = {};
        (sRes.data.data || []).forEach((item: SettingItem) => {
          sMap[item.key] = item.value;
        });
        setSettings(sMap);
        setPayments(pRes.data.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function saveSetting(key: string, value: string, type = "string") {
    setSaving(key);
    try {
      await api.post("/settings/", { key, value, type });
      setSettings((prev) => ({ ...prev, [key]: value }));
      setSaved(key);
      setTimeout(() => setSaved(null), 1500);
    } catch (e) {
      // handle error
    } finally {
      setSaving(null);
    }
  }

  async function savePayment(payment: PaymentConfig) {
    setSaving(`pay-${payment.id}`);
    try {
      await api.post("/settings/payments", {
        method: payment.method,
        accountNumber: payment.accountNumber,
        accountType: payment.accountType,
        isActive: payment.isActive,
      });
      const res = await api.get("/settings/payments");
      setPayments(res.data.data || []);
      setSaved(`pay-${payment.id}`);
      setTimeout(() => setSaved(null), 1500);
    } catch (e) {
      // handle error
    } finally {
      setSaving(null);
    }
  }

  async function addPayment() {
    if (!newPayment.method || !newPayment.accountNumber) return;
    setSaving("pay-new");
    try {
      await api.post("/settings/payments", newPayment);
      const res = await api.get("/settings/payments");
      setPayments(res.data.data || []);
      setNewPayment({ method: "", accountNumber: "", accountType: "personal" });
      setSaved("pay-new");
      setTimeout(() => setSaved(null), 1500);
    } catch (e) {
      // handle error
    } finally {
      setSaving(null);
    }
  }

  async function deletePayment(id: number) {
    if (!confirm("Delete this payment method?")) return;
    try {
      await api.delete(`/settings/payments/${id}`);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      // handle error
    }
  }

  function renderInput(key: string, label: string, placeholder: string, type = "text", options?: string[]) {
    const value = settings[key] || "";
    return (
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 py-3 border-b border-[rgba(0,234,255,0.08)]">
        <label className="text-sm text-sky-text-secondary w-40 shrink-0">{label}</label>
        <div className="flex-1 flex items-center gap-2">
          {type === "toggle" ? (
            <button
              onClick={() => saveSetting(key, value === "true" ? "false" : "true", "boolean")}
              className="flex items-center gap-2 text-sm"
            >
              {value === "true" ? (
                <ToggleRight size={24} className="text-sky-accent-green" />
              ) : (
                <ToggleLeft size={24} className="text-sky-text-secondary" />
              )}
              <span className={value === "true" ? "text-sky-accent-green" : "text-sky-text-secondary"}>
                {value === "true" ? "Enabled" : "Disabled"}
              </span>
            </button>
          ) : options ? (
            <select
              value={value}
              onChange={(e) => saveSetting(key, e.target.value)}
              className="flex-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none"
            >
              {options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
              onBlur={(e) => saveSetting(key, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none"
            />
          )}
          {saved === key && <CheckCircle size={16} className="text-sky-accent-green shrink-0" />}
          {saving === key && <span className="text-xs text-sky-text-secondary animate-pulse">Saving...</span>}
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-center py-10 text-sky-text-secondary">Loading settings...</div>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration & preferences" />

      {/* Mobile Tab Toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary w-full"
        >
          <Menu size={16} />
          {tabs.find((t) => t.id === activeTab)?.label}
          <span className="ml-auto">{mobileMenuOpen ? <X size={16} /> : <span className="text-xs">▼</span>}</span>
        </button>
        {mobileMenuOpen && (
          <div className="mt-2 bg-[#0A1628] border border-[rgba(0,234,255,0.15)] rounded-lg overflow-hidden">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-3 text-sm ${
                  activeTab === t.id ? "text-[#00EAFF] bg-[rgba(0,234,255,0.08)]" : "text-sky-text-secondary"
                }`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4 flex-col md:flex-row">
        {/* Sidebar */}
        <div className="hidden md:block w-52 shrink-0 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
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

        {/* Content */}
        <div className="flex-1 glass-card p-5 md:p-6">
          {/* General */}
          {activeTab === "general" && (
            <div>
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-1 flex items-center gap-2">
                <Building2 size={16} className="text-sky-accent-primary" />
                General Settings
              </h3>
              <p className="text-xs text-sky-text-secondary mb-4">Company info and basic preferences</p>
              {renderInput("company_name", "Company Name", "SKYNITY ISP")}
              {renderInput("company_tagline", "Tagline", "Starlink Internet Provider")}
              {renderInput("support_phone", "Support Phone", "01712-345-678")}
              {renderInput("support_email", "Support Email", "support@skynity.net")}
              {renderInput("timezone", "Timezone", "Asia/Dhaka", "text", ["Asia/Dhaka", "UTC", "Asia/Kolkata"])}
              {renderInput("currency", "Currency", "BDT", "text", ["BDT", "USD", "INR"])}
            </div>
          )}

          {/* Payment */}
          {activeTab === "payment" && (
            <div>
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-1 flex items-center gap-2">
                <CreditCard size={16} className="text-sky-accent-primary" />
                Payment Methods
              </h3>
              <p className="text-xs text-sky-text-secondary mb-4">Configure bKash, Nagad, Rocket accounts</p>

              <div className="space-y-3 mb-6">
                {payments.map((p) => (
                  <div key={p.id} className="p-4 bg-[#0A1628] rounded-lg border border-[rgba(0,234,255,0.1)]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-sky-text-primary uppercase">{p.method}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => savePayment({ ...p, isActive: !p.isActive })}
                          className="text-xs flex items-center gap-1"
                        >
                          {p.isActive ? (
                            <ToggleRight size={18} className="text-sky-accent-green" />
                          ) : (
                            <ToggleLeft size={18} className="text-sky-text-secondary" />
                          )}
                        </button>
                        <button onClick={() => deletePayment(p.id)} className="text-sky-accent-red hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-sky-text-secondary uppercase">Account Number</label>
                        <input
                          value={p.accountNumber}
                          onChange={(e) => setPayments(payments.map((pm) => pm.id === p.id ? { ...pm, accountNumber: e.target.value } : pm))}
                          onBlur={() => savePayment(p)}
                          className="w-full mt-1 px-3 py-2 bg-[#050B15] border border-[rgba(0,234,255,0.2)] rounded text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-sky-text-secondary uppercase">Type</label>
                        <select
                          value={p.accountType || "personal"}
                          onChange={(e) => savePayment({ ...p, accountType: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-[#050B15] border border-[rgba(0,234,255,0.2)] rounded text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none"
                        >
                          <option value="personal">Personal</option>
                          <option value="agent">Agent</option>
                          <option value="merchant">Merchant</option>
                        </select>
                      </div>
                    </div>
                    {saved === `pay-${p.id}` && (
                      <p className="text-xs text-sky-accent-green mt-2 flex items-center gap-1"><CheckCircle size={12} /> Saved</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New */}
              <div className="p-4 bg-[#0A1628] rounded-lg border border-dashed border-[rgba(0,234,255,0.2)]">
                <p className="text-xs text-sky-text-secondary mb-3 uppercase tracking-wider">Add New Method</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                    className="px-3 py-2 bg-[#050B15] border border-[rgba(0,234,255,0.2)] rounded text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none"
                  >
                    <option value="">Select method</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                  </select>
                  <input
                    value={newPayment.accountNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, accountNumber: e.target.value })}
                    placeholder="Account Number"
                    className="px-3 py-2 bg-[#050B15] border border-[rgba(0,234,255,0.2)] rounded text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none"
                  />
                  <button
                    onClick={addPayment}
                    disabled={saving === "pay-new" || !newPayment.method || !newPayment.accountNumber}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00EAFF] to-[#00FF88] text-[#050B15] font-semibold rounded text-sm hover:shadow-[0_0_20px_rgba(0,234,255,0.4)] transition-all disabled:opacity-50"
                  >
                    <Plus size={14} />
                    {saving === "pay-new" ? "Adding..." : "Add"}
                  </button>
                </div>
                {saved === "pay-new" && (
                  <p className="text-xs text-sky-accent-green mt-2 flex items-center gap-1"><CheckCircle size={12} /> Added</p>
                )}
              </div>
            </div>
          )}

          {/* Telegram */}
          {activeTab === "telegram" && (
            <div>
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-1 flex items-center gap-2">
                <Bot size={16} className="text-sky-accent-primary" />
                Telegram Bot
              </h3>
              <p className="text-xs text-sky-text-secondary mb-4">Configure Telegram notifications</p>
              {renderInput("telegram_bot_token", "Bot Token", "123456:ABC-DEF...")}
              {renderInput("telegram_admin_chat_id", "Admin Chat ID", "-1001234567890")}
              {renderInput("telegram_channel_id", "Channel ID", "-1001234567890")}
            </div>
          )}

          {/* RADIUS */}
          {activeTab === "radius" && (
            <div>
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-1 flex items-center gap-2">
                <Radio size={16} className="text-sky-accent-primary" />
                RADIUS Server
              </h3>
              <p className="text-xs text-sky-text-secondary mb-4">RADIUS authentication server settings</p>
              {renderInput("radius_server_host", "Server Host", "10.100.0.5")}
              {renderInput("radius_auth_port", "Auth Port", "1812")}
              {renderInput("radius_acct_port", "Acct Port", "1813")}
              {renderInput("radius_secret", "Shared Secret", "radius-secret-key")}
            </div>
          )}

          {/* WireGuard */}
          {activeTab === "wireguard" && (
            <div>
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-1 flex items-center gap-2">
                <Shield size={16} className="text-sky-accent-primary" />
                WireGuard VPN
              </h3>
              <p className="text-xs text-sky-text-secondary mb-4">WireGuard tunnel configuration</p>
              {renderInput("wg_endpoint", "Endpoint", "wg.skynity.net")}
              {renderInput("wg_port", "Port", "51820")}
              {renderInput("wg_public_key", "Public Key", "...")}
            </div>
          )}

          {/* Alerts */}
          {activeTab === "alerts" && (
            <div>
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-1 flex items-center gap-2">
                <Bell size={16} className="text-sky-accent-primary" />
                Alerts & Notifications
              </h3>
              <p className="text-xs text-sky-text-secondary mb-4">Configure notification triggers</p>
              {renderInput("alert_low_balance_threshold", "Low Balance Alert (BDT)", "50")}
              {renderInput("alert_expiry_days", "Expiry Warning (days before)", "3")}
              {renderInput("alert_email_enabled", "Email Alerts", "true", "toggle")}
              {renderInput("alert_sms_enabled", "SMS Alerts", "false", "toggle")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
