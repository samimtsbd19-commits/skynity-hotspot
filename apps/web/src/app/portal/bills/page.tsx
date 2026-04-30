"use client";

import React, { useEffect, useState } from "react";
import { Receipt, Download, CheckCircle, Clock, XCircle } from "lucide-react";
import portalApi from "@/lib/portal-api";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amountBdt: string;
  totalBdt: string;
  issuedAt: string;
  paidAt: string | null;
  status: string;
}

export default function BillsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await portalApi.get("/portal-api/orders");
        const orders = res.data.data || [];
        // Transform orders to invoice-like cards
        const mapped = orders.map((o: any, idx: number) => ({
          id: o.id,
          invoiceNumber: `INV-${o.id.slice(0, 8).toUpperCase()}`,
          amountBdt: o.amountBdt,
          totalBdt: o.amountBdt,
          issuedAt: o.createdAt,
          paidAt: o.status === "approved" ? o.reviewedAt : null,
          status: o.status,
        }));
        setInvoices(mapped);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10 text-sky-text-secondary">Loading...</div>;

  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    approved: { icon: CheckCircle, color: "text-sky-accent-green", bg: "bg-sky-accent-green/10", label: "Paid" },
    pending: { icon: Clock, color: "text-sky-accent-orange", bg: "bg-sky-accent-orange/10", label: "Pending" },
    rejected: { icon: XCircle, color: "text-sky-accent-red", bg: "bg-sky-accent-red/10", label: "Rejected" },
    refunded: { icon: XCircle, color: "text-sky-accent-red", bg: "bg-sky-accent-red/10", label: "Refunded" },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-sky-text-primary">My Bills</h1>

      {invoices.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Receipt size={32} className="mx-auto text-sky-text-secondary mb-3" />
          <p className="text-sky-text-secondary">No bills yet. Place an order to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {invoices.map((inv) => {
            const cfg = statusConfig[inv.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={inv.id} className="glass-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#0A1628]">
                    <Receipt size={18} className="text-sky-accent-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-mono text-sky-text-primary">{inv.invoiceNumber}</p>
                    <p className="text-xs text-sky-text-secondary">
                      {new Date(inv.issuedAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-sky-text-primary">৳{inv.totalBdt}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded ${cfg.bg} ${cfg.color}`}>
                    <StatusIcon size={12} />
                    {cfg.label}
                  </div>
                  <button className="p-2 rounded-lg hover:bg-[#112240] text-sky-text-secondary hover:text-sky-accent-primary transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
