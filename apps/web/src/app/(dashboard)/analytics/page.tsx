"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import StatCard from "@/components/monitoring/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from "recharts";
import { Users, ShoppingCart, TrendingUp, Wifi, DollarSign, Activity } from "lucide-react";
import { formatBdt } from "@/lib/utils";

interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: string;
  activeSubscriptions: number;
  todayOrders: number;
  todayRevenue: string;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [growth, setGrowth] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [sRes, rRes, gRes] = await Promise.all([
          api.get("/analytics/dashboard"),
          api.get("/analytics/revenue?days=30"),
          api.get("/analytics/customers/growth?days=30"),
        ]);
        setStats(sRes.data.data);
        setRevenue(rRes.data.data || []);
        setGrowth(gRes.data.data || []);
      } catch {}
    }
    fetchAll();
  }, []);

  return (
    <div>
      <PageHeader title="Analytics & Reports" subtitle="Business intelligence & network insights" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard icon={Users} label="Total Customers" value={stats?.totalCustomers?.toString() || "--"} subtext="All time" color="primary" />
        <StatCard icon={Wifi} label="Active Subs" value={stats?.activeSubscriptions?.toString() || "--"} subtext="Currently active" color="green" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats?.totalOrders?.toString() || "--"} subtext="All time" color="purple" />
        <StatCard icon={DollarSign} label="Total Revenue" value={stats ? formatBdt(stats.totalRevenue) : "--"} subtext="All time" color="primary" />
        <StatCard icon={Activity} label="Today Orders" value={stats?.todayOrders?.toString() || "--"} subtext="New today" color="orange" />
        <StatCard icon={TrendingUp} label="Today Revenue" value={stats ? formatBdt(stats.todayRevenue) : "--"} subtext="Earned today" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Revenue Trend (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00EAFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00EAFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.1)" />
                <XAxis dataKey="date" stroke="#7AA3C8" fontSize={11} tickFormatter={(v) => new Date(v).toLocaleDateString("en-BD", { day: "numeric", month: "short" })} />
                <YAxis stroke="#7AA3C8" fontSize={11} tickFormatter={(v) => `৳${v}`} />
                <Tooltip contentStyle={{ background: "#0D1E36", border: "1px solid rgba(0,234,255,0.2)", borderRadius: 8 }} formatter={(v: any) => [formatBdt(v), "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#00EAFF" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Customer Growth (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.1)" />
                <XAxis dataKey="date" stroke="#7AA3C8" fontSize={11} tickFormatter={(v) => new Date(v).toLocaleDateString("en-BD", { day: "numeric", month: "short" })} />
                <YAxis stroke="#7AA3C8" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0D1E36", border: "1px solid rgba(0,234,255,0.2)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#00FF88" strokeWidth={2} dot={{ fill: "#00FF88", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Daily Orders vs Revenue</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,234,255,0.1)" />
              <XAxis dataKey="date" stroke="#7AA3C8" fontSize={11} tickFormatter={(v) => new Date(v).toLocaleDateString("en-BD", { day: "numeric" })} />
              <YAxis yAxisId="left" stroke="#7AA3C8" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" stroke="#00EAFF" fontSize={11} tickFormatter={(v) => `৳${v}`} />
              <Tooltip contentStyle={{ background: "#0D1E36", border: "1px solid rgba(0,234,255,0.2)", borderRadius: 8 }} />
              <Bar yAxisId="left" dataKey="orders" fill="#A855F7" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="revenue" fill="#00EAFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
