"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Users, Wifi, WifiOff, Power, PowerOff, Search, Ban, CheckCircle, Loader2 } from "lucide-react";
import { formatBandwidth } from "@/lib/utils";

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
  callerId: string;
  uptime: string;
  txBytes: string;
  rxBytes: string;
  txRate: number;
  rxRate: number;
}

export default function PppoePage() {
  const [users, setUsers] = useState<PppoeUser[]>([]);
  const [active, setActive] = useState<ActiveUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        api.get("/pppoe/users"),
        api.get("/pppoe/active"),
      ]);
      setUsers(uRes.data.data || []);
      setActive(aRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleBlock(username: string) {
    setActionUser(username);
    setActionType("block");
    try {
      await api.post(`/pppoe/users/${encodeURIComponent(username)}/block`);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to block user");
    } finally {
      setActionUser(null);
      setActionType(null);
    }
  }

  async function handleUnblock(username: string) {
    setActionUser(username);
    setActionType("unblock");
    try {
      await api.post(`/pppoe/users/${encodeURIComponent(username)}/unblock`);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to unblock user");
    } finally {
      setActionUser(null);
      setActionType(null);
    }
  }

  async function handleDisconnect(username: string) {
    setActionUser(username);
    setActionType("disconnect");
    try {
      await api.post(`/pppoe/users/${encodeURIComponent(username)}/disconnect`);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to disconnect user");
    } finally {
      setActionUser(null);
      setActionType(null);
    }
  }

  const activeMap = new Map(active.map((a) => [a.username, a]));
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.profile.toLowerCase().includes(search.toLowerCase()) ||
    (u.comment && u.comment.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <PageHeader title="PPPoE Users" subtitle="Manage PPPoE subscribers" />

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-text-secondary" />
          <input
            type="text"
            placeholder="Search by username, profile, or comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary placeholder:text-sky-text-secondary/50 focus:outline-none focus:border-[#00EAFF]"
          />
        </div>
        <div className="text-xs text-sky-text-secondary">
          Total: <span className="text-sky-text-primary font-mono">{users.length}</span> | Online: <span className="text-sky-accent-green font-mono">{active.length}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Username</th>
                <th className="text-left px-4 py-3">Profile</th>
                <th className="text-left px-4 py-3">IP Address</th>
                <th className="text-right px-4 py-3">Download</th>
                <th className="text-right px-4 py-3">Upload</th>
                <th className="text-left px-4 py-3">Uptime</th>
                <th className="text-left px-4 py-3">Comment</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
              {loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sky-text-secondary">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => {
                const act = activeMap.get(u.username);
                const isOnline = !!act;
                const isBlocked = u.disabled;
                const isActioning = actionUser === u.username;

                return (
                  <tr key={u.username} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isOnline ? (
                          <Wifi size={14} className="text-sky-accent-green" />
                        ) : isBlocked ? (
                          <Ban size={14} className="text-sky-accent-red" />
                        ) : (
                          <WifiOff size={14} className="text-sky-text-secondary" />
                        )}
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            isOnline
                              ? "bg-sky-accent-green/10 text-sky-accent-green"
                              : isBlocked
                              ? "bg-sky-accent-red/10 text-sky-accent-red"
                              : "bg-sky-text-secondary/10 text-sky-text-secondary"
                          }`}
                        >
                          {isOnline ? "Online" : isBlocked ? "Blocked" : "Offline"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-sky-text-primary">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-sky-accent-primary" />
                        {u.username}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sky-text-secondary">{u.profile}</td>
                    <td className="px-4 py-3 text-sky-text-secondary font-mono text-xs">{act?.address || "—"}</td>
                    <td className="px-4 py-3 text-right text-sky-accent-green font-mono text-xs">
                      {act ? formatBandwidth(act.rxRate) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sky-accent-primary font-mono text-xs">
                      {act ? formatBandwidth(act.txRate) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sky-text-secondary text-xs">{act?.uptime || "—"}</td>
                    <td className="px-4 py-3 text-sky-text-secondary text-xs max-w-[150px] truncate">{u.comment || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isOnline && (
                          <button
                            onClick={() => handleDisconnect(u.username)}
                            disabled={isActioning}
                            title="Disconnect"
                            className="p-1.5 rounded hover:bg-sky-accent-orange/10 text-sky-text-secondary hover:text-sky-accent-orange transition-colors"
                          >
                            {isActioning && actionType === "disconnect" ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <PowerOff size={14} />
                            )}
                          </button>
                        )}
                        {isBlocked ? (
                          <button
                            onClick={() => handleUnblock(u.username)}
                            disabled={isActioning}
                            title="Unblock"
                            className="p-1.5 rounded hover:bg-sky-accent-green/10 text-sky-text-secondary hover:text-sky-accent-green transition-colors"
                          >
                            {isActioning && actionType === "unblock" ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlock(u.username)}
                            disabled={isActioning}
                            title="Block"
                            className="p-1.5 rounded hover:bg-sky-accent-red/10 text-sky-text-secondary hover:text-sky-accent-red transition-colors"
                          >
                            {isActioning && actionType === "block" ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Ban size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
