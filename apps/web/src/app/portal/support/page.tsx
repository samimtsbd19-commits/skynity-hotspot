"use client";

import React, { useState } from "react";
import { Send, MessageCircle, Clock, CheckCircle } from "lucide-react";

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage("");
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-sky-text-primary">Support Center</h1>

      <div className="glass-card p-5">
        <h3 className="font-semibold text-sky-text-primary mb-3 flex items-center gap-2">
          <MessageCircle size={16} className="text-sky-accent-primary" />
          Send a Message
        </h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none resize-none"
          placeholder="Describe your issue..."
        />
        <button
          onClick={handleSubmit}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00EAFF] to-[#00FF88] text-[#050B15] font-semibold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(0,234,255,0.4)] transition-all"
        >
          <Send size={14} />
          Submit Ticket
        </button>
        {sent && (
          <div className="mt-2 flex items-center gap-1 text-xs text-sky-accent-green">
            <CheckCircle size={12} />
            Ticket submitted! We will respond shortly.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-sky-text-secondary uppercase tracking-wider">Recent Tickets</h3>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-sky-accent-orange" />
              <span className="text-sm text-sky-text-primary">Slow speed in evening</span>
            </div>
            <span className="text-[10px] bg-sky-accent-orange/10 text-sky-accent-orange px-2 py-0.5 rounded uppercase font-bold">Open</span>
          </div>
          <p className="text-xs text-sky-text-secondary mt-1 ml-6">Submitted on 12 May 2024</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-sky-accent-green" />
              <span className="text-sm text-sky-text-primary">Connection drop issue</span>
            </div>
            <span className="text-[10px] bg-sky-accent-green/10 text-sky-accent-green px-2 py-0.5 rounded uppercase font-bold">Resolved</span>
          </div>
          <p className="text-xs text-sky-text-secondary mt-1 ml-6">Resolved on 10 May 2024</p>
        </div>
      </div>
    </div>
  );
}
