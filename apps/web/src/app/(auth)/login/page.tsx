"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SkynityLogo from "@/components/brand/SkynityLogo";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const { accessToken, user } = res.data.data;
      localStorage.setItem("skynity_access_token", accessToken);
      localStorage.setItem("skynity_user", JSON.stringify(user));
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-8 space-y-6">
      <div className="flex flex-col items-center gap-3">
        <SkynityLogo size={80} />
        <div className="text-center">
          <h1 className="font-orbitron text-2xl font-bold text-gradient">SKYNITY</h1>
          <p className="text-sm text-sky-text-secondary mt-1">Connecting the Future</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-sky-text-secondary mb-1.5 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary placeholder:text-sky-text-secondary/50 focus:outline-none focus:border-[#00EAFF] focus:shadow-[0_0_10px_rgba(0,234,255,0.2)] transition-all"
            placeholder="admin@skynity.net"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sky-text-secondary mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary placeholder:text-sky-text-secondary/50 focus:outline-none focus:border-[#00EAFF] focus:shadow-[0_0_10px_rgba(0,234,255,0.2)] transition-all"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-sky-accent-red text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-[#00EAFF] to-[#00FF88] text-[#050B15] font-semibold rounded-lg hover:shadow-[0_0_20px_rgba(0,234,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-xs text-sky-text-secondary">
        SKYNITY ISP Platform · v1.0.0
      </p>
    </div>
  );
}
