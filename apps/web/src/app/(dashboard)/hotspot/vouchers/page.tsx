"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Ticket } from "lucide-react";

interface Voucher {
  id: string;
  code: string;
  status: string;
  batchName?: string;
  expiresAt?: string;
  createdAt: string;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/vouchers/");
        setVouchers(res.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <PageHeader title="Vouchers" subtitle="Hotspot voucher management" />
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Batch</th>
              <th className="text-left px-4 py-3">Expires</th>
              <th className="text-left px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
            {vouchers.map((v) => (
              <tr key={v.id} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-sky-accent-primary">
                  <div className="flex items-center gap-2">
                    <Ticket size={14} />
                    {v.code}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      v.status === "unused"
                        ? "bg-sky-accent-green/10 text-sky-accent-green"
                        : v.status === "used"
                        ? "bg-sky-accent-primary/10 text-sky-accent-primary"
                        : "bg-sky-accent-red/10 text-sky-accent-red"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sky-text-secondary">{v.batchName || "-"}</td>
                <td className="px-4 py-3 text-sky-text-secondary">{v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : "-"}</td>
                <td className="px-4 py-3 text-sky-text-secondary">{new Date(v.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
