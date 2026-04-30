"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Send, MessageSquare, Mail, Smartphone, Bell, CheckCircle } from "lucide-react";

interface TemplateItem {
  id: string;
  name: string;
  type: string;
  content: string;
  subject?: string;
}

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [activeTab, setActiveTab] = useState<"send" | "templates" | "history">("send");
  const [form, setForm] = useState({ type: "telegram" as string, to: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    api.get("/notifications/templates").then((res) => setTemplates(res.data.data || []));
  }, []);

  async function handleSend() {
    setSending(true);
    try {
      await api.post("/notifications/send", form);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {}
    setSending(false);
  }

  async function handleBroadcast() {
    setBroadcasting(true);
    try {
      await api.post("/notifications/broadcast", { message: broadcastMsg });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {}
    setBroadcasting(false);
  }

  const applyTemplate = (t: TemplateItem) => {
    setForm({ ...form, type: t.type, message: t.content, subject: t.subject || "" });
  };

  return (
    <div>
      <PageHeader title="Notifications" subtitle="SMS, Telegram & Email messaging center" />

      <div className="flex gap-2 mb-4">
        {["send", "templates", "history"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
              activeTab === t
                ? "bg-[rgba(0,234,255,0.15)] text-[#00EAFF] border border-[rgba(0,234,255,0.3)]"
                : "text-sky-text-secondary hover:bg-[#112240]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "send" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary flex items-center gap-2">
              <Send size={16} className="text-sky-accent-primary" />
              Send Notification
            </h3>

            <div>
              <label className="text-xs text-sky-text-secondary uppercase tracking-wider">Channel</label>
              <div className="flex gap-2 mt-1">
                {[
                  { id: "telegram", icon: MessageSquare, label: "Telegram" },
                  { id: "sms", icon: Smartphone, label: "SMS" },
                  { id: "email", icon: Mail, label: "Email" },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setForm({ ...form, type: ch.id })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      form.type === ch.id
                        ? "bg-[rgba(0,234,255,0.15)] text-[#00EAFF] border border-[rgba(0,234,255,0.3)]"
                        : "text-sky-text-secondary hover:bg-[#112240]"
                    }`}
                  >
                    <ch.icon size={14} />
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-sky-text-secondary uppercase tracking-wider">Recipient</label>
              <input
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                placeholder={form.type === "telegram" ? "Chat ID" : form.type === "sms" ? "01XXXXXXXXX" : "email@example.com"}
                className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none"
              />
            </div>

            {form.type === "email" && (
              <div>
                <label className="text-xs text-sky-text-secondary uppercase tracking-wider">Subject</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none" />
              </div>
            )}

            <div>
              <label className="text-xs text-sky-text-secondary uppercase tracking-wider">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none resize-none"
                placeholder="Type your message..."
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full py-2.5 bg-gradient-to-r from-[#00EAFF] to-[#00FF88] text-[#050B15] font-semibold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(0,234,255,0.4)] transition-all disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Now"}
            </button>

            {sent && (
              <div className="flex items-center gap-1 text-xs text-sky-accent-green">
                <CheckCircle size={12} />
                Message sent successfully!
              </div>
            )}
          </div>

          <div className="glass-card p-5 space-y-4">
            <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary flex items-center gap-2">
              <Bell size={16} className="text-sky-accent-orange" />
              Broadcast to Admins
            </h3>
            <p className="text-xs text-sky-text-secondary">Send a message to all configured admin Telegram accounts.</p>
            <textarea
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none resize-none"
              placeholder="Broadcast message..."
            />
            <button
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="w-full py-2 bg-[rgba(255,140,0,0.15)] text-sky-accent-orange border border-[rgba(255,140,0,0.3)] font-semibold rounded-lg text-sm hover:bg-[rgba(255,140,0,0.25)] transition-all disabled:opacity-50"
            >
              {broadcasting ? "Broadcasting..." : "Broadcast to Admins"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="glass-card p-5 group">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sky-text-primary">{t.name}</h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#112240] text-sky-text-secondary">{t.type}</span>
              </div>
              <p className="text-xs text-sky-text-secondary line-clamp-2 mb-3">{t.content}</p>
              <button
                onClick={() => applyTemplate(t)}
                className="text-xs text-[#00EAFF] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Use this template
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "history" && (
        <div className="glass-card p-8 text-center">
          <Bell size={48} className="mx-auto text-sky-text-secondary mb-3" />
          <p className="text-sky-text-secondary">Notification history will appear here</p>
        </div>
      )}
    </div>
  );
}
