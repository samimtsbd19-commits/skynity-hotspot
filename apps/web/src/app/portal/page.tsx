"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wifi, Calendar, DollarSign, ArrowDown, ArrowUp, Activity, Package, ListOrdered } from "lucide-react";
import portalApi from "@/lib/portal-api";

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
    return <div className="text-center py-10 text-sky-text-secondary">Loading...</div>;
  }

  const daysLeft = subscription?.expiresAt
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalDays = subscription?.startedAt && subscription?.expiresAt
    ? Math.ceil((new Date(subscription.expiresAt).getTime() - new Date(subscription.startedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 30;

  const progress = totalDays > 0 ? Math.max(0, Math.min(100, (daysLeft / totalDays) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-sky-text-primary">
              Welcome back{customer?.fullName ? `, ${customer.fullName}` : ""}!
            </h1>
            <p className="text-sm text-sky-text-secondary mt-1">
              {subscription?.status === "active"
                ? "Your SKYNITY connection is active and running smoothly."
                : "You don't have an active subscription."}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            subscription?.status === "active"
              ? "bg-sky-accent-green/10 border-sky-accent-green/30"
              : "bg-sky-accent-red/10 border-sky-accent-red/30"
          }`}>
            <Wifi size={14} className={subscription?.status === "active" ? "text-sky-accent-green" : "text-sky-accent-red"} />
            <span className={`text-xs font-bold uppercase ${subscription?.status === "active" ? "text-sky-accent-green" : "text-sky-accent-red"}`}>
              {subscription?.status === "active" ? "Online" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-sky-accent-primary" />
            <span className="text-xs text-sky-text-secondary uppercase tracking-wider">Current Plan</span>
          </div>
          <h3 className="text-lg font-bold text-sky-text-primary">{pkg?.name || "No Plan"}</h3>
          {pkg && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-sky-accent-green text-sm">
                <ArrowDown size={14} />
                <span className="font-mono font-bold">{pkg.downloadMbps} Mbps</span>
              </div>
              <div className="flex items-center gap-1 text-sky-accent-primary text-sm">
                <ArrowUp size={14} />
                <span className="font-mono font-bold">{pkg.uploadMbps} Mbps</span>
              </div>
            </div>
          )}
          {subscription && (
            <p className="text-xs text-sky-text-secondary mt-2">Username: <code className="text-sky-accent-primary">{subscription.username}</code></p>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-sky-accent-orange" />
            <span className="text-xs text-sky-text-secondary uppercase tracking-wider">Expires On</span>
          </div>
          <h3 className="text-lg font-bold text-sky-text-primary">
            {subscription?.expiresAt
              ? new Date(subscription.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "—"}
          </h3>
          <p className="text-xs text-sky-text-secondary mt-1">{daysLeft} days remaining</p>
          <div className="mt-3 h-1.5 bg-[#0A1628] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-accent-orange to-sky-accent-red rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-sky-accent-green" />
            <span className="text-xs text-sky-text-secondary uppercase tracking-wider">Last Order</span>
          </div>
          <h3 className="text-lg font-bold text-sky-text-primary">
            {orders[0] ? `৳${orders[0].amountBdt}` : "No orders yet"}
          </h3>
          {orders[0] && (
            <>
              <p className="text-xs text-sky-text-secondary mt-1">{orders[0].paymentMethod?.toUpperCase()}</p>
              <span className={`inline-block mt-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                orders[0].status === "approved" ? "bg-sky-accent-green/10 text-sky-accent-green" :
                orders[0].status === "pending" ? "bg-sky-accent-orange/10 text-sky-accent-orange" :
                "bg-sky-accent-red/10 text-sky-accent-red"
              }`}>
                {orders[0].status}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => router.push("/portal/packages")} className="p-4 bg-[#0A1628] border border-[rgba(0,234,255,0.1)] rounded-lg text-sm font-medium text-sky-text-primary hover:border-[rgba(0,234,255,0.3)] hover:bg-[rgba(0,234,255,0.05)] transition-all flex items-center justify-center gap-2">
            <Package size={14} /> Browse Packages
          </button>
          <button onClick={() => router.push("/portal/orders")} className="p-4 bg-[#0A1628] border border-[rgba(0,234,255,0.1)] rounded-lg text-sm font-medium text-sky-text-primary hover:border-[rgba(0,234,255,0.3)] hover:bg-[rgba(0,234,255,0.05)] transition-all flex items-center justify-center gap-2">
            <ListOrdered size={14} /> My Orders
          </button>
          <button onClick={() => router.push("/portal/usage")} className="p-4 bg-[#0A1628] border border-[rgba(0,234,255,0.1)] rounded-lg text-sm font-medium text-sky-text-primary hover:border-[rgba(0,234,255,0.3)] hover:bg-[rgba(0,234,255,0.05)] transition-all flex items-center justify-center gap-2">
            <Activity size={14} /> View Usage
          </button>
          <button onClick={() => router.push("/portal/support")} className="p-4 bg-[#0A1628] border border-[rgba(0,234,255,0.1)] rounded-lg text-sm font-medium text-sky-text-primary hover:border-[rgba(0,234,255,0.3)] hover:bg-[rgba(0,234,255,0.05)] transition-all flex items-center justify-center gap-2">
            <DollarSign size={14} /> Pay Bill
          </button>
        </div>
      </div>
    </div>
  );
}
