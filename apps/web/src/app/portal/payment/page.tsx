"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowDown, ArrowUp, Clock, Smartphone, Send, CheckCircle, AlertCircle } from "lucide-react";

export default function PortalPaymentPage() {
  const router = useRouter();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    paymentMethod: "bkash" as "bkash" | "nagad",
    trxId: "",
    paymentFrom: "",
    password: "",
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("skynity_selected_package");
    if (!stored) {
      router.push("/portal/packages");
      return;
    }
    setPkg(JSON.parse(stored));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!pkg) return;
    if (!form.trxId || form.trxId.length < 4) {
      setError("Please enter a valid Transaction ID");
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(form.paymentFrom)) {
      setError("Please enter a valid sender mobile number");
      return;
    }
    if (form.password.length < 6) {
      setError("WiFi password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/portal-api/orders", {
        packageId: pkg.id,
        paymentMethod: form.paymentMethod,
        trxId: form.trxId,
        paymentFrom: form.paymentFrom,
        amountBdt: pkg.priceBdt,
      });
      setSuccess(res.data.data.message);
      sessionStorage.removeItem("skynity_selected_package");
      setTimeout(() => router.push("/portal/orders"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to submit order");
    }
    setLoading(false);
  }

  if (!pkg) return null;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-orbitron text-lg font-bold text-sky-text-primary mb-6">Complete Payment</h1>

      <div className="glass-card p-5 mb-4">
        <h3 className="font-bold text-sky-text-primary mb-2">{pkg.name}</h3>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1 text-sky-accent-green text-sm">
            <ArrowDown size={14} />
            <span className="font-mono font-bold">{pkg.downloadMbps} Mbps</span>
          </div>
          <div className="flex items-center gap-1 text-sky-accent-primary text-sm">
            <ArrowUp size={14} />
            <span className="font-mono font-bold">{pkg.uploadMbps} Mbps</span>
          </div>
          <div className="flex items-center gap-1 text-sky-text-secondary text-sm">
            <Clock size={14} />
            <span>{pkg.validityDays} days</span>
          </div>
        </div>
        <div className="text-xl font-bold text-sky-text-primary">৳{pkg.priceBdt} BDT</div>
      </div>

      <div className="glass-card p-5 mb-4">
        <h3 className="text-sm font-bold text-sky-text-primary mb-3 flex items-center gap-2">
          <Smartphone size={16} className="text-sky-accent-primary" /> Payment Instructions
        </h3>
        <div className="space-y-2 text-xs text-sky-text-secondary">
          <p>1. Open {form.paymentMethod === "bkash" ? "bKash" : "Nagad"} app on your phone</p>
          <p>2. Select <strong>Send Money</strong></p>
          <p>3. Send <strong>৳{pkg.priceBdt}</strong> to: <strong className="text-sky-text-primary">01XXXXXXXXX</strong></p>
          <p>4. Enter the Transaction ID and your number below</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-sky-accent-red/10 border border-sky-accent-red/30 rounded-lg text-xs text-sky-accent-red flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-sky-accent-green/10 border border-sky-accent-green/30 rounded-lg text-xs text-sky-accent-green flex items-center gap-2">
          <CheckCircle size={14} /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
        <div>
          <label className="text-xs text-sky-text-secondary block mb-1">Payment Method</label>
          <div className="flex gap-2">
            {(["bkash", "nagad"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: method })}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                  form.paymentMethod === method
                    ? "border-sky-accent-primary bg-sky-accent-primary/10 text-sky-accent-primary"
                    : "border-[rgba(0,234,255,0.2)] text-sky-text-secondary hover:border-[rgba(0,234,255,0.4)]"
                }`}
              >
                {method === "bkash" ? "bKash" : "Nagad"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-sky-text-secondary block mb-1">Transaction ID (TRX ID)</label>
          <input
            type="text"
            placeholder="e.g., 8A7B6C5D4E"
            value={form.trxId}
            onChange={(e) => setForm({ ...form, trxId: e.target.value })}
            className="w-full bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded px-3 py-2 text-sm text-sky-text-primary focus:border-sky-accent-primary focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="text-xs text-sky-text-secondary block mb-1">Sender Mobile Number</label>
          <input
            type="tel"
            placeholder="01712345678"
            value={form.paymentFrom}
            onChange={(e) => setForm({ ...form, paymentFrom: e.target.value })}
            className="w-full bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded px-3 py-2 text-sm text-sky-text-primary focus:border-sky-accent-primary focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="text-xs text-sky-text-secondary block mb-1">WiFi Password (will be your login password)</label>
          <input
            type="password"
            placeholder="Min 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded px-3 py-2 text-sm text-sky-text-primary focus:border-sky-accent-primary focus:outline-none"
            required
            minLength={6}
          />
          <p className="text-[10px] text-sky-text-secondary mt-1">This password will be used for your WiFi connection after approval</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-accent-green/20 hover:bg-sky-accent-green/30 text-sky-accent-green border border-sky-accent-green/50 rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Submitting..." : <><Send size={14} /> Submit Order</>}
        </button>
      </form>
    </div>
  );
}
