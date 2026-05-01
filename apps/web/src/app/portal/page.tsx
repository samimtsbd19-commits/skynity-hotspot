"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wifi, Calendar, DollarSign, ArrowDown, ArrowUp, Activity, Package, ListOrdered, Gauge, HelpCircle, Zap } from "lucide-react";
import portalApi from "@/lib/portal-api";
import SkynityLogo from "@/components/brand/SkynityLogo";

interface CustomerData {
  id: string;
  fullName: string;
  phone: string;
  customerCode: string;
}

interface Subscription {
  id: string;
  packageId: string;
  username: string;
  status: string;
  startedAt: string;
  expiresAt: string;
}

interface PackageInfo {
  id: string;
  name: string;
  downloadMbps: number;
  uploadMbps: number;
}

export default function CustomerPortalPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const me = await portalApi.get("/portal-auth/me");
        setCustomer(me.data.data);

        const subs = await portalApi.get("/portal-api/subscriptions");
        const subList = subs.data.data || [];
        setSubscription(subList[0] || null);

        const pkgs = await portalApi.get("/portal-api/packages");
        const pkgList = pkgs.data.data || [];
        if (subList[0]) {
          const matched = pkgList.find((p: any) => p.id === subList[0].packageId);
          setPkg(matched || null);
        }

        const ord = await portalApi.get("/portal-api/orders");
        setOrders(ord.data.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-[#112240] rounded-lg" />
          <div className="h-24 bg-[#112240] rounded-lg" />
          <div className="h-24 bg-[#112240] rounded-lg" />
        </div>
      </div>
    );
  }

  const daysLeft = subscription?.expiresAt
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalDays = subscription?.startedAt && subscription?.expiresAt
    ? Math.ceil((new Date(subscription.expiresAt).getTime() - new Date(subscription.startedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 30;

  const progress = totalDays > 0 ? Math.max(0, Math.min(100, (daysLeft / totalDays) * 100)) : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Logo & Welcome */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <SkynityLogo size={48} />
        </div>
        <h1 className="font-orbitron text-lg font-bold text-gradient">SKYNITY</h1>
        <p className="text-sm text-sky-text-secondary">
          Welcome back{customer?.fullName ? `, ${customer.fullName}` : ""}!
        </p>
      </div>

      {/* Status Card */}
      <div className={`glass-card p-5 border ${
        subscription?.status === "active"
          ? "border-sky-accent-green/20"
          : "border-sky-accent-red/20"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              subscription?.status === "active" ? "bg-sky-accent-green/10" : "bg-sky-accent-red/10"
            }`}>
              <Wifi size={20} className={subscription?.status === "active" ? "text-sky-accent-green" : "text-sky-accent-red"} />
            </div>
            <div>
              <p className="text-sm font-bold text-sky-text-primary">
                {subscription?.status === "active" ? "Connection Active" : "No Active Plan"}
              </p>
              <p className="text-xs text-sky-text-secondary">
                {subscription?.status === "active" ? "Your internet is running smoothly" : "Purchase a package to get connected"}
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
            subscription?.status === "active"
              ? "bg-sky-accent-green/10 text-sky-accent-green"
              : "bg-sky-accent-red/10 text-sky-accent-red"
          }`}>
            {subscription?.status === "active" ? "Online" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-sky-accent-primary" />
            <span className="text-[10px] text-sky-text-secondary uppercase tracking-wider">Current Plan</span>
          </div>
          <p className="text-base font-bold text-sky-text-primary truncate">{pkg?.name || "—"}</p>
          {pkg && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-sky-accent-green font-mono">↓ {pkg.downloadMbps}M</span>
              <span className="text-[10px] text-sky-accent-primary font-mono">↑ {pkg.uploadMbps}M</span>
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-sky-accent-orange" />
            <span className="text-[10px] text-sky-text-secondary uppercase tracking-wider">Expires</span>
          </div>
          <p className="text-base font-bold text-sky-text-primary">
            {subscription?.expiresAt
              ? new Date(subscription.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
              : "—"}
          </p>
          <p className="text-[10px] text-sky-text-secondary mt-1">{daysLeft} days left</p>
          {subscription && (
            <div className="mt-2 h-1 bg-[#0A1628] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-accent-orange to-sky-accent-red rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-sky-accent-green" />
            <span className="text-[10px] text-sky-text-secondary uppercase tracking-wider">Last Order</span>
          </div>
          <p className="text-base font-bold text-sky-text-primary">
            {orders[0] ? `৳${orders[0].amountBdt}` : "No orders"}
          </p>
          {orders[0] && (
            <span className={`inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
              orders[0].status === "approved" ? "bg-sky-accent-green/10 text-sky-accent-green" :
              orders[0].status === "pending" ? "bg-sky-accent-orange/10 text-sky-accent-orange" :
              "bg-sky-accent-red/10 text-sky-accent-red"
            }`}>
              {orders[0].status}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs text-sky-text-secondary uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            onClick={() => router.push("/portal/packages")}
            className="glass-card p-4 text-center hover:border-sky-accent-primary/30 transition-all"
          >
            <Package size={20} className="text-sky-accent-primary mx-auto mb-2" />
            <p className="text-xs font-medium text-sky-text-primary">Packages</p>
          </button>
          <button
            onClick={() => router.push("/portal/orders")}
            className="glass-card p-4 text-center hover:border-sky-accent-primary/30 transition-all"
          >
            <ListOrdered size={20} className="text-sky-accent-primary mx-auto mb-2" />
            <p className="text-xs font-medium text-sky-text-primary">My Orders</p>
          </button>
          <button
            onClick={() => router.push("/portal/speedtest")}
            className="glass-card p-4 text-center hover:border-sky-accent-primary/30 transition-all"
          >
            <Gauge size={20} className="text-sky-accent-green mx-auto mb-2" />
            <p className="text-xs font-medium text-sky-text-primary">Speed Test</p>
          </button>
          <button
            onClick={() => router.push("/portal/usage")}
            className="glass-card p-4 text-center hover:border-sky-accent-primary/30 transition-all"
          >
            <Activity size={20} className="text-sky-accent-orange mx-auto mb-2" />
            <p className="text-xs font-medium text-sky-text-primary">Usage</p>
          </button>
          <button
            onClick={() => router.push("/portal/guide")}
            className="glass-card p-4 text-center hover:border-sky-accent-primary/30 transition-all"
          >
            <HelpCircle size={20} className="text-sky-text-secondary mx-auto mb-2" />
            <p className="text-xs font-medium text-sky-text-primary">User Guide</p>
          </button>
          <button
            onClick={() => router.push("/portal/packages")}
            className="glass-card p-4 text-center hover:border-sky-accent-green/30 transition-all"
          >
            <Zap size={20} className="text-sky-accent-green mx-auto mb-2" />
            <p className="text-xs font-medium text-sky-text-primary">Upgrade Plan</p>
          </button>
        </div>
      </div>
    </div>
  );
}
