"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import SkynityLogo from "@/components/brand/SkynityLogo";
import { ArrowDown, ArrowUp, Clock, Smartphone, Send, CheckCircle, AlertCircle, Package, ChevronLeft } from "lucide-react";

interface PaymentConfig {
  method: string;
  accountNumber: string;
  accountType: string | null;
}

export default function PackageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pkgId = params.id as string;

  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [payments, setPayments] = useState<PaymentConfig[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [form, setForm] = useState({
    paymentMethod: "bkash" as "bkash" | "nagad",
    trxId: "",
    paymentFrom: "",
    password: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("skynity_portal_token");
    setIsLoggedIn(!!token);

    async function fetchData() {
      try {
        const [pkgRes, payRes] = await Promise.all([
          api.get("/portal-api/packages"),
          api.get("/portal-api/payments"),
        ]);
        const allPackages = pkgRes.data.data || [];
        const found = allPackages.find((p: any) => p.id === pkgId);
        setPkg(found || null);
        setPayments(payRes.data.data || []);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    fetchData();
  }, [pkgId]);

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

    setSubmitting(true);
    try {
      const res = await api.post("/portal-api/orders", {
        packageId: pkg.id,
        paymentMethod: form.paymentMethod,
        trxId: form.trxId,
        paymentFrom: form.paymentFrom,
        amountBdt: pkg.priceBdt,
        password: form.password,
      });
      setSuccess(res.data.data.message);
      setTimeout(() => router.push("/portal/orders"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to submit order");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto animate-pulse space-y-4">
        <div className="h-48 bg-[#112240] rounded-lg" />
        <div className="h-64 bg-[#112240] rounded-lg" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <Package size={48} className="text-sky-text-secondary mx-auto mb-4" />
        <h2 className="text-lg font-bold text-sky-text-primary">Package Not Found</h2>
        <button
          onClick={() => router.push("/portal/packages")}
          className="mt-4 text-sky-accent-primary hover:text-sky-text-primary text-sm"
        >
          ← Back to Packages
        </button>
      </div>
    );
  }

  const activePayment = payments.find((p) => p.method === form.paymentMethod);
  const paymentNumber = activePayment?.accountNumber || "Contact admin for payment number";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Logo */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <SkynityLogo size={48} />
        </div>
        <h1 className="font-orbitron text-lg font-bold text-gradient">SKYNITY</h1>
      </div>

      <button
        onClick={() => router.push("/portal/packages")}
        className="flex items-center gap-1 text-xs text-sky-text-secondary hover:text-sky-accent-primary transition-colors"
      >
        <ChevronLeft size={14} /> Back to packages
      </button>

      {/* Package Card */}
      <div className="glass-card p-5">
        <h2 className="font-bold text-sky-text-primary text-lg mb-2">{pkg.name}</h2>
        <div className="flex items-center gap-4 mb-3">
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
        <p className="text-xs text-sky-text-secondary mb-3">{pkg.description || "Dedicated bandwidth connection"}</p>
        <div className="text-2xl font-bold text-sky-text-primary">৳{pkg.priceBdt}</div>
      </div>

      {!isLoggedIn ? (
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-sky-text-secondary mb-4">Please login to purchase this package</p>
          <button
            onClick={() => router.push("/portal/login")}
            className="bg-sky-accent-primary/20 hover:bg-sky-accent-primary/30 text-sky-accent-primary border border-sky-accent-primary/50 rounded-lg py-2 px-6 text-sm font-medium transition-all"
          >
            Login to Continue
          </button>
        </div>
      ) : (
        <>
          {/* Payment Instructions */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold text-sky-text-primary mb-3 flex items-center gap-2">
              <Smartphone size={16} className="text-sky-accent-primary" /> Payment Instructions
            </h3>
            <div className="space-y-2 text-xs text-sky-text-secondary">
              <p>1. Open {form.paymentMethod === "bkash" ? "bKash" : "Nagad"} app on your phone</p>
              <p>2. Select <strong>Send Money</strong></p>
              <p>3. Send <strong>৳{pkg.priceBdt}</strong> to: <strong className="text-sky-text-primary">{paymentNumber}</strong></p>
              <p>4. Enter the Transaction ID and your number below</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-sky-accent-red/10 border border-sky-accent-red/30 rounded-lg text-xs text-sky-accent-red flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-sky-accent-green/10 border border-sky-accent-green/30 rounded-lg text-xs text-sky-accent-green flex items-center gap-2">
              <CheckCircle size={14} /> {success}
            </div>
          )}

          {/* Order Form */}
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
              <label className="text-xs text-sky-text-secondary block mb-1">WiFi Password</label>
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
              disabled={submitting}
              className="w-full bg-sky-accent-green/20 hover:bg-sky-accent-green/30 text-sky-accent-green border border-sky-accent-green/50 rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {submitting ? "Submitting..." : <><Send size={14} /> Submit Order</>}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
