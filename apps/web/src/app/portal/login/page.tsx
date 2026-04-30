"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Wifi, LogIn, UserPlus } from "lucide-react";

export default function PortalLoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!/^01[3-9]\d{8}$/.test(form.phone)) {
        setError("Please enter a valid Bangladesh mobile number (e.g., 01712345678)");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? "/portal-auth/register" : "/portal-auth/login";
      const payload = isRegister
        ? { fullName: form.fullName, phone: form.phone, password: form.password, address: form.address }
        : { phone: form.phone, password: form.password };

      const res = await api.post(endpoint, payload);
      const { accessToken, customer } = res.data.data;

      localStorage.setItem("skynity_portal_token", accessToken);
      localStorage.setItem("skynity_portal_customer", JSON.stringify(customer));
      router.push("/portal");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Authentication failed");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="glass-card p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Wifi size={28} className="text-sky-accent-primary" />
          <h1 className="font-orbitron text-xl font-bold text-sky-text-primary">
            {isRegister ? "Create Account" : "Customer Login"}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-sky-accent-red/10 border border-sky-accent-red/30 rounded-lg text-xs text-sky-accent-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs text-sky-text-secondary block mb-1">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded px-3 py-2 text-sm text-sky-text-primary focus:border-sky-accent-primary focus:outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs text-sky-text-secondary block mb-1">Mobile Number</label>
            <input
              type="tel"
              placeholder="01712345678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded px-3 py-2 text-sm text-sky-text-primary focus:border-sky-accent-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs text-sky-text-secondary block mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded px-3 py-2 text-sm text-sky-text-primary focus:border-sky-accent-primary focus:outline-none"
              required
              minLength={6}
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="text-xs text-sky-text-secondary block mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded px-3 py-2 text-sm text-sky-text-primary focus:border-sky-accent-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-sky-text-secondary block mb-1">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded px-3 py-2 text-sm text-sky-text-primary focus:border-sky-accent-primary focus:outline-none"
                  rows={2}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-accent-primary/20 hover:bg-sky-accent-primary/30 text-sky-accent-primary border border-sky-accent-primary/50 rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Please wait..." : <>{isRegister ? <UserPlus size={14} /> : <LogIn size={14} />} {isRegister ? "Register" : "Login"}</>}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-xs text-sky-text-secondary hover:text-sky-accent-primary transition-colors"
          >
            {isRegister ? "Already have an account? Login" : "New customer? Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}
