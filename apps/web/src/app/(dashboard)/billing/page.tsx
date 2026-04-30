"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Receipt, CheckCircle, XCircle, Clock, UserCheck, UserX, Loader2 } from "lucide-react";
import { formatBdt } from "@/lib/utils";

interface Order {
  id: string;
  amountBdt: string;
  paymentMethod: string;
  status: string;
  trxId?: string;
  paymentFrom?: string;
  reviewNote?: string;
  createdAt: string;
}

export default function BillingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  async function fetchData() {
    try {
      const res = await api.get("/orders/");
      setOrders(res.data.data || []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function approveOrder(id: string) {
    setActionLoading(id);
    try {
      await api.post(`/orders/${id}/approve`);
      await fetchData();
    } catch {
      // ignore
    }
    setActionLoading(null);
  }

  async function rejectOrder(id: string) {
    setActionLoading(id);
    try {
      await api.post(`/orders/${id}/reject`, { note: rejectNote });
      setRejectingId(null);
      setRejectNote("");
      await fetchData();
    } catch {
      // ignore
    }
    setActionLoading(null);
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <PageHeader title="Billing & Orders" subtitle="Payment approvals & invoices" />
      <div className="flex gap-2 mb-4">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
              filter === f
                ? "bg-[rgba(0,234,255,0.15)] text-[#00EAFF] border border-[rgba(0,234,255,0.3)]"
                : "text-sky-text-secondary hover:bg-[#112240]"
            }`}
          >
            {f} ({f === "all" ? orders.length : orders.filter((o) => o.status === f).length})
          </button>
        ))}
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Method</th>
              <th className="text-left px-4 py-3">TXN ID</th>
              <th className="text-left px-4 py-3">From</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Receipt size={14} className="text-sky-accent-primary" />
                    <span className="font-mono text-sky-text-primary">{o.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-sky-text-primary">{formatBdt(o.amountBdt)}</td>
                <td className="px-4 py-3 text-sky-text-secondary uppercase">{o.paymentMethod}</td>
                <td className="px-4 py-3 font-mono text-sky-text-secondary">{o.trxId || "-"}</td>
                <td className="px-4 py-3 font-mono text-sky-text-secondary">{o.paymentFrom || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {o.status === "approved" && <CheckCircle size={14} className="text-sky-accent-green" />}
                    {o.status === "rejected" && <XCircle size={14} className="text-sky-accent-red" />}
                    {o.status === "pending" && <Clock size={14} className="text-sky-accent-orange" />}
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        o.status === "approved"
                          ? "bg-sky-accent-green/10 text-sky-accent-green"
                          : o.status === "rejected"
                          ? "bg-sky-accent-red/10 text-sky-accent-red"
                          : "bg-sky-accent-orange/10 text-sky-accent-orange"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sky-text-secondary">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {o.status === "pending" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => approveOrder(o.id)}
                        disabled={actionLoading === o.id}
                        className="p-1.5 bg-sky-accent-green/10 hover:bg-sky-accent-green/20 text-sky-accent-green rounded transition-colors"
                        title="Approve"
                      >
                        {actionLoading === o.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                      </button>
                      <button
                        onClick={() => setRejectingId(rejectingId === o.id ? null : o.id)}
                        className="p-1.5 bg-sky-accent-red/10 hover:bg-sky-accent-red/20 text-sky-accent-red rounded transition-colors"
                        title="Reject"
                      >
                        <UserX size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-5 w-full max-w-md">
            <h3 className="font-orbitron text-sm font-bold text-sky-text-primary mb-3">Reject Order</h3>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="w-full bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded px-3 py-2 text-sm text-sky-text-primary focus:border-sky-accent-primary focus:outline-none mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => rejectOrder(rejectingId)}
                disabled={actionLoading === rejectingId}
                className="flex-1 bg-sky-accent-red/20 hover:bg-sky-accent-red/30 text-sky-accent-red border border-sky-accent-red/50 rounded-lg py-2 text-xs font-medium transition-all"
              >
                {actionLoading === rejectingId ? "Rejecting..." : "Confirm Reject"}
              </button>
              <button
                onClick={() => { setRejectingId(null); setRejectNote(""); }}
                className="flex-1 bg-[#0A1628] hover:bg-[#112240] text-sky-text-secondary border border-[rgba(0,234,255,0.2)] rounded-lg py-2 text-xs font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
