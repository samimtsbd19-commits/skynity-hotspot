"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Wifi, Users } from "lucide-react";
import Link from "next/link";

interface HotspotUser {
  id: string;
  name: string;
  profile: string;
  uptime: string;
  bytesIn: bigint;
  bytesOut: bigint;
  disabled: boolean;
}

interface ActiveHotspotUser {
  id: string;
  user: string;
  address: string;
  macAddress: string;
  uptime: string;
}

export default function HotspotPage() {
  const [tab, setTab] = useState<"all" | "active">("all");
  const [users, setUsers] = useState<HotspotUser[]>([]);
  const [active, setActive] = useState<ActiveHotspotUser[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [uRes, aRes] = await Promise.all([api.get("/hotspot/users"), api.get("/hotspot/active")]);
        setUsers(uRes.data.data || []);
        setActive(aRes.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
  }, []);

  const activeSet = new Set(active.map((a) => a.user));

  return (
    <div>
      <PageHeader title="Hotspot Management" subtitle="Manage hotspot users and sessions" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
              tab === "all"
                ? "bg-[rgba(0,234,255,0.15)] text-[#00EAFF] border border-[rgba(0,234,255,0.3)]"
                : "text-sky-text-secondary hover:bg-[#112240]"
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setTab("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
              tab === "active"
                ? "bg-[rgba(0,234,255,0.15)] text-[#00EAFF] border border-[rgba(0,234,255,0.3)]"
                : "text-sky-text-secondary hover:bg-[#112240]"
            }`}
          >
            Active Sessions
          </button>
        </div>
        <Link
          href="/hotspot/vouchers"
          className="px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider bg-[rgba(168,85,247,0.15)] text-sky-accent-purple border border-[rgba(168,85,247,0.3)] hover:bg-[rgba(168,85,247,0.25)] transition-all"
        >
          Vouchers
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">{tab === "active" ? "User" : "Name"}</th>
              {tab === "active" && <th className="text-left px-4 py-3">IP</th>}
              {tab === "active" && <th className="text-left px-4 py-3">MAC</th>}
              <th className="text-left px-4 py-3">Profile</th>
              <th className="text-left px-4 py-3">Uptime</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
            {tab === "all"
              ? users.map((u) => (
                  <tr key={u.id} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                    <td className="px-4 py-3 font-medium text-sky-text-primary">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-sky-accent-primary" />
                        {u.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sky-text-secondary">{u.profile}</td>
                    <td className="px-4 py-3 text-sky-text-secondary">{u.uptime}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          u.disabled ? "bg-sky-accent-red/10 text-sky-accent-red" : "bg-sky-accent-green/10 text-sky-accent-green"
                        }`}
                      >
                        {u.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))
              : active.map((a) => (
                  <tr key={a.id} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                    <td className="px-4 py-3 font-medium text-sky-text-primary">
                      <div className="flex items-center gap-2">
                        <Wifi size={14} className="text-sky-accent-green" />
                        {a.user}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sky-text-secondary">{a.address}</td>
                    <td className="px-4 py-3 font-mono text-sky-text-secondary">{a.macAddress}</td>
                    <td className="px-4 py-3 text-sky-text-secondary">-</td>
                    <td className="px-4 py-3 text-sky-text-secondary">{a.uptime}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-accent-green/10 text-sky-accent-green">
                        Online
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
