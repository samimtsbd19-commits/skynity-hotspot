"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Users, Phone, Mail, Search, Loader2, Calendar, Package, AlertCircle, CheckCircle } from "lucide-react";

interface Customer {
  id: string;
  customerCode: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
  subscriptions?: Subscription[];
}

interface Subscription {
  id: string;
  packageId: string;
  username: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  package?: PackageInfo;
}

interface PackageInfo {
  id: string;
  name: string;
  downloadMbps: number;
  uploadMbps: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/customers/");
        const list = res.data.data || [];
        // Fetch subscriptions for each customer
        const enriched = await Promise.all(
          list.map(async (c: Customer) => {
            try {
              const detail = await api.get(`/customers/${c.id}`);
              return { ...c, subscriptions: detail.data.data.subscriptions || [] };
            } catch {
              return c;
            }
          })
        );
        setCustomers(enriched);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = customers.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.customerCode && c.customerCode.toLowerCase().includes(search.toLowerCase()))
  );

  function getStatusIcon(status: string) {
    switch (status) {
      case "active": return <CheckCircle size={12} className="text-sky-accent-green" />;
      case "suspended": return <AlertCircle size={12} className="text-sky-accent-orange" />;
      case "expired": return <AlertCircle size={12} className="text-sky-accent-red" />;
      default: return <AlertCircle size={12} className="text-sky-text-secondary" />;
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "active": return "bg-sky-accent-green/10 text-sky-accent-green";
      case "suspended": return "bg-sky-accent-orange/10 text-sky-accent-orange";
      case "expired": return "bg-sky-accent-red/10 text-sky-accent-red";
      default: return "bg-sky-text-secondary/10 text-sky-text-secondary";
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Customers" subtitle="Subscriber management" />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-text-secondary" />
          <input
            type="text"
            placeholder="Search by name, phone, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary placeholder:text-sky-text-secondary/50 focus:outline-none focus:border-[#00EAFF]"
          />
        </div>
        <div className="text-xs text-sky-text-secondary">
          Total: <span className="text-sky-text-primary font-mono">{customers.length}</span>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0A1628] text-sky-text-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Subscription</th>
                <th className="text-left px-4 py-3">Package</th>
                <th className="text-left px-4 py-3">Expires</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,234,255,0.1)]">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sky-text-secondary">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Loading customers...
                  </td>
                </tr>
              )}
              {filtered.map((c) => {
                const sub = c.subscriptions?.[0];
                const daysLeft = sub?.expiresAt
                  ? Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : null;

                return (
                  <tr key={c.id} className="hover:bg-[rgba(0,234,255,0.03)] transition-colors">
                    <td className="px-4 py-3 font-mono text-sky-accent-primary text-xs">{c.customerCode || "—"}</td>
                    <td className="px-4 py-3 font-medium text-sky-text-primary">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-sky-accent-primary" />
                        {c.fullName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sky-text-secondary text-xs">
                          <Phone size={12} />
                          {c.phone}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-sky-text-secondary text-xs">
                            <Mail size={12} />
                            {c.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sky-text-secondary font-mono text-xs">{sub?.username || "—"}</td>
                    <td className="px-4 py-3">
                      {sub?.package ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Package size={12} className="text-sky-accent-primary" />
                          <span className="text-sky-text-primary">{sub.package.name}</span>
                          <span className="text-sky-text-secondary">{sub.package.downloadMbps}M</span>
                        </div>
                      ) : (
                        <span className="text-sky-text-secondary/50 text-xs">No plan</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub?.expiresAt ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar size={12} className="text-sky-accent-orange" />
                          <span className={`${daysLeft !== null && daysLeft <= 3 ? "text-sky-accent-red" : "text-sky-text-secondary"}`}>
                            {daysLeft}d left
                          </span>
                        </div>
                      ) : (
                        <span className="text-sky-text-secondary/50 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getStatusClass(sub.status)}`}>
                          {getStatusIcon(sub.status)}
                          {sub.status}
                        </span>
                      ) : (
                        <span className="text-sky-text-secondary/50 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sky-text-secondary text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
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
