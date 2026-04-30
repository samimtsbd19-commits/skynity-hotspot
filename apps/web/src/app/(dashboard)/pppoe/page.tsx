"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Users, Wifi, WifiOff } from "lucide-react";

interface PppoeUser {
  username: string;
  profile: string;
  service: string;
  disabled: boolean;
  comment?: string;
}

interface ActiveUser {
  username: string;
  address: string;
  uptime: string;
}

export default function PppoePage() {
  const [users, setUsers] = useState<PppoeUser[]>([]);
  const [active, setActive] = useState<ActiveUser[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [uRes, aRes] = await Promise.all([api.get("/pppoe/users"), api.get("/pppoe/active")]);
        setUsers(uRes.data.data || []);
        setActive(aRes.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
    const interval = setInterval(() => fetchData(), 10000);
    return () => clearInterval(interval);
  }, []);

  const activeSet = new Set(active.map((a) => a.username));

  return (
    <div>
      <PageHeader title="PPPoE Users" subtitle="Manage PPPoE subscribers" />
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Username</th>
              <th className="text-left px-4 py-3">Profile</th>
              <th className="text-left px-4 py-3">Service</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
            {users.map((u) => {
              const isOnline = activeSet.has(u.username);
              return (
                <tr key={u.username} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                  <td className="px-4 py-3 font-medium text-sky-text-primary">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-sky-accent-primary" />
                      {u.username}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sky-text-secondary">{u.profile}</td>
                  <td className="px-4 py-3 text-sky-text-secondary">{u.service}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {isOnline ? (
                        <Wifi size={14} className="text-sky-accent-green" />
                      ) : (
                        <WifiOff size={14} className="text-sky-accent-red" />
                      )}
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          isOnline ? "bg-sky-accent-green/10 text-sky-accent-green" : "bg-sky-accent-red/10 text-sky-accent-red"
                        }`}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sky-text-secondary">{u.comment || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
