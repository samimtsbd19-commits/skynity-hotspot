"use client";

import React, { useState } from "react";
import { Send, MessageCircle, Phone, MapPin, Clock, AlertTriangle, CheckCircle, Mail } from "lucide-react";

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

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass-card p-4 flex items-center gap-3">
          <Phone size={18} className="text-sky-accent-primary" />
          <div>
            <p className="text-xs text-sky-text-secondary">Hotline</p>
            <p className="text-sm font-bold text-sky-text-primary">01712-345-678</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <Mail size={18} className="text-sky-accent-primary" />
          <div>
            <p className="text-xs text-sky-text-secondary">Email</p>
            <p className="text-sm font-bold text-sky-text-primary">support@skynity.net</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <Clock size={18} className="text-sky-accent-green" />
          <div>
            <p className="text-xs text-sky-text-secondary">Support Hours</p>
            <p className="text-sm font-bold text-sky-text-primary">24/7 Available</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <MapPin size={18} className="text-sky-accent-orange" />
          <div>
            <p className="text-xs text-sky-text-secondary">Location</p>
            <p className="text-sm font-bold text-sky-text-primary">Dhaka, Bangladesh</p>
          </div>
        </div>
      </div>

      {/* Send Message */}
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
          Submit
        </button>
        {sent && (
          <div className="mt-2 flex items-center gap-1 text-xs text-sky-accent-green">
            <CheckCircle size={12} />
            Message sent! We will respond shortly.
          </div>
        )}
      </div>

      {/* Common Issues */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-sky-text-primary mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-sky-accent-orange" />
          Common Issues
        </h3>
        <div className="space-y-2 text-sm">
          <details className="bg-[#0A1628] rounded-lg p-3">
            <summary className="cursor-pointer text-sky-text-primary font-medium">Slow speed in evening?</summary>
            <p className="text-sky-text-secondary mt-2 text-xs">Peak hours (7PM-11PM) may experience slower speeds due to high demand. Try restarting your router.</p>
          </details>
          <details className="bg-[#0A1628] rounded-lg p-3">
            <summary className="cursor-pointer text-sky-text-primary font-medium">Connection dropped?</summary>
            <p className="text-sky-text-secondary mt-2 text-xs">Check your router power and cable connections. If issue persists, contact support.</p>
          </details>
          <details className="bg-[#0A1628] rounded-lg p-3">
            <summary className="cursor-pointer text-sky-text-primary font-medium">Forgot WiFi password?</summary>
            <p className="text-sky-text-secondary mt-2 text-xs">Login to user portal and check your subscription details. Or call support for reset.</p>
          </details>
        </div>
      </div>
    </div>
  );
}
