"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { ListOrdered, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  amountBdt: string;
  paymentMethod: string;
  trxId: string | null;
  status: "pending" | "approved" | "rejected" | "refunded";
  reviewNote: string | null;
  createdAt: string;
}

export default function PortalOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get("/portal-api/orders");
        setOrders(res.data.data);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  function statusIcon(status: string) {
    switch (status) {
      case "approved":
        return <CheckCircle size={14} className="text-sky-accent-green" />;
      case "rejected":
        return <XCircle size={14} className="text-sky-accent-red" />;
      case "pending":
        return <Clock size={14} className="text-sky-accent-orange" />;
      default:
        return <AlertCircle size={14} className="text-sky-text-secondary" />;
    }
  }

  function statusClass(status: string) {
    switch (status) {
      case "approved":
        return "bg-sky-accent-green/10 text-sky-accent-green border-sky-accent-green/30";
      case "rejected":
        return "bg-sky-accent-red/10 text-sky-accent-red border-sky-accent-red/30";
      case "pending":
        return "bg-sky-accent-orange/10 text-sky-accent-orange border-sky-accent-orange/30";
      default:
        return "bg-[#112240] text-sky-text-secondary border-[rgba(0,234,255,0.1)]";
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4 h-20 bg-[#112240]" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-orbitron text-lg font-bold text-sky-text-primary mb-6 flex items-center gap-2">
        <ListOrdered size={20} /> My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-sky-text-secondary">No orders yet. Browse packages to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {statusIcon(order.status)}
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <span className="text-xs text-sky-text-secondary font-mono">{new Date(order.createdAt).toLocaleDateString("en-BD")}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-sky-text-secondary block">Amount</span>
                  <span className="text-sky-text-primary font-bold">৳{order.amountBdt}</span>
                </div>
                <div>
                  <span className="text-sky-text-secondary block">Method</span>
                  <span className="text-sky-text-primary font-bold uppercase">{order.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-sky-text-secondary block">TRX ID</span>
                  <span className="text-sky-text-primary font-mono">{order.trxId || "—"}</span>
                </div>
                <div>
                  <span className="text-sky-text-secondary block">Order ID</span>
                  <span className="text-sky-text-primary font-mono">{order.id.slice(0, 8)}</span>
                </div>
              </div>
              {order.reviewNote && (
                <p className="mt-2 text-xs text-sky-accent-red bg-sky-accent-red/5 p-2 rounded">Note: {order.reviewNote}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
