"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Network, Loader2, Edit2, Save, X, Ban, CheckCircle } from "lucide-react";
import { formatBandwidth } from "@/lib/utils";

interface Queue {
  name: string;
  target: string;
  maxLimitUp: string;
  maxLimitDown: string;
  txBytes: string;
  rxBytes: string;
  txRate: number;
  rxRate: number;
  comment: string;
  disabled: boolean;
}

export default function QueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Queue>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/monitoring/queues/");
      setQueues(res.data.data || []);
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

  function startEdit(q: Queue) {
    setEditing(q.name);
    setEditForm({
      maxLimitUp: q.maxLimitUp,
      maxLimitDown: q.maxLimitDown,
      comment: q.comment,
    });
  }

  async function saveEdit(name: string) {
    try {
      await api.post(`/router-config/queues/${encodeURIComponent(name)}`, editForm);
      setEditing(null);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to update queue");
    }
  }

  async function toggleQueue(name: string, disabled: boolean) {
    try {
      await api.post(`/router-config/queues/${encodeURIComponent(name)}/toggle`, { disabled });
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to toggle queue");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Queue Management" subtitle="Manage bandwidth queues" />

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Target</th>
                <th className="text-right px-4 py-3">Max Limit</th>
                <th className="text-right px-4 py-3">Current Rate</th>
                <th className="text-right px-4 py-3">Data Usage</th>
                <th className="text-left px-4 py-3">Comment</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
              {loading && queues.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sky-text-secondary">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Loading queues...
                  </td>
                </tr>
              )}
              {queues.map((q) => {
                const isEditing = editing === q.name;

                return (
                  <tr key={q.name} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          q.disabled
                            ? "bg-sky-accent-red/10 text-sky-accent-red"
                            : "bg-sky-accent-green/10 text-sky-accent-green"
                        }`}
                      >
                        {q.disabled ? <Ban size={10} /> : <CheckCircle size={10} />}
                        {q.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-sky-text-primary">
                      <div className="flex items-center gap-2">
                        <Network size={14} className="text-sky-accent-primary" />
                        {q.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sky-text-secondary font-mono text-xs">{q.target}</td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex gap-2 justify-end">
                          <input
                            type="text"
                            value={editForm.maxLimitDown || ""}
                            onChange={(e) => setEditForm({ ...editForm, maxLimitDown: e.target.value })}
                            className="w-16 px-2 py-1 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded text-xs text-sky-text-primary"
                            placeholder="Down"
                          />
                          <span className="text-sky-text-secondary">/</span>
                          <input
                            type="text"
                            value={editForm.maxLimitUp || ""}
                            onChange={(e) => setEditForm({ ...editForm, maxLimitUp: e.target.value })}
                            className="w-16 px-2 py-1 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded text-xs text-sky-text-primary"
                            placeholder="Up"
                          />
                        </div>
                      ) : (
                        <span className="text-sky-text-primary font-mono text-xs">
                          ↓{q.maxLimitDown} ↑{q.maxLimitUp}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span className="text-sky-accent-green">{formatBandwidth(q.rxRate)}</span>
                      <span className="text-sky-text-secondary"> / </span>
                      <span className="text-sky-accent-primary">{formatBandwidth(q.txRate)}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-sky-text-secondary">
                      ↓{formatBandwidth(Number(q.rxBytes))} ↑{formatBandwidth(Number(q.txBytes))}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.comment || ""}
                          onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                          className="w-full px-2 py-1 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded text-xs text-sky-text-primary"
                        />
                      ) : (
                        <span className="text-sky-text-secondary text-xs">{q.comment || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(q.name)}
                              className="p-1.5 rounded hover:bg-sky-accent-green/10 text-sky-text-secondary hover:text-sky-accent-green transition-colors"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="p-1.5 rounded hover:bg-sky-accent-red/10 text-sky-text-secondary hover:text-sky-accent-red transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(q)}
                              title="Edit"
                              className="p-1.5 rounded hover:bg-sky-accent-primary/10 text-sky-text-secondary hover:text-sky-accent-primary transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => toggleQueue(q.name, !q.disabled)}
                              title={q.disabled ? "Enable" : "Disable"}
                              className={`p-1.5 rounded transition-colors ${
                                q.disabled
                                  ? "hover:bg-sky-accent-green/10 text-sky-text-secondary hover:text-sky-accent-green"
                                  : "hover:bg-sky-accent-red/10 text-sky-text-secondary hover:text-sky-accent-red"
                              }`}
                            >
                              {q.disabled ? <CheckCircle size={14} /> : <Ban size={14} />}
                            </button>
                          </>
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
