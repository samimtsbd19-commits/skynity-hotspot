"use client";

import React from "react";
import { Receipt, Download, CheckCircle } from "lucide-react";

const bills = [
  { id: "INV-2024-0012", date: "15 May 2024", amount: "800", status: "paid", method: "bKash" },
  { id: "INV-2024-0011", date: "15 Apr 2024", amount: "800", status: "paid", method: "Nagad" },
  { id: "INV-2024-0010", date: "15 Mar 2024", amount: "550", status: "paid", method: "bKash" },
];

export default function BillsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-sky-text-primary">My Bills</h1>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Invoice</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Method</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
            {bills.map((b) => (
              <tr key={b.id} className="hover:bg-[rgba(0,234,255,0.03)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Receipt size={14} className="text-sky-accent-primary" />
                    <span className="font-mono text-sky-text-primary">{b.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sky-text-secondary">{b.date}</td>
                <td className="px-4 py-3 font-bold text-sky-text-primary">৳{b.amount} BDT</td>
                <td className="px-4 py-3 text-sky-text-secondary uppercase">{b.method}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-sky-accent-green" />
                    <span className="text-[10px] uppercase font-bold text-sky-accent-green bg-sky-accent-green/10 px-2 py-0.5 rounded">{b.status}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button className="p-1.5 rounded hover:bg-[#112240] text-sky-text-secondary hover:text-sky-accent-primary transition-colors">
                    <Download size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
