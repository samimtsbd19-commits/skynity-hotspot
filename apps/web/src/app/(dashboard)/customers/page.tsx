"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Users, Phone, Mail } from "lucide-react";

interface Customer {
  id: string;
  customerCode: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/customers/");
        setCustomers(res.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <PageHeader title="Customers" subtitle="Subscriber management" />
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Address</th>
              <th className="text-left px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                <td className="px-4 py-3 font-mono text-sky-accent-primary">{c.customerCode || "-"}</td>
                <td className="px-4 py-3 font-medium text-sky-text-primary">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-sky-accent-primary" />
                    {c.fullName}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sky-text-secondary">
                    <Phone size={12} />
                    {c.phone}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {c.email ? (
                    <div className="flex items-center gap-1.5 text-sky-text-secondary">
                      <Mail size={12} />
                      {c.email}
                    </div>
                  ) : (
                    <span className="text-sky-text-secondary/50">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sky-text-secondary">{c.address || "-"}</td>
                <td className="px-4 py-3 text-sky-text-secondary">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
