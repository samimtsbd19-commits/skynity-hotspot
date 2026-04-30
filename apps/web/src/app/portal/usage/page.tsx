"use client";

import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Wifi, Calendar, Clock } from "lucide-react";
import portalApi from "@/lib/portal-api";

interface Subscription {
  id: string;
  username: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  packageId: string;
}

interface PackageInfo {
  name: string;
  downloadMbps: number;
  uploadMbps: number;
  validityDays: number;
}

export default function UsagePage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const subs = await portalApi.get("/portal-api/subscriptions");
        const subList = subs.data.data || [];
        setSubscription(subList[0] || null);

        const pkgs = await portalApi.get("/portal-api/packages");
        const pkgList = pkgs.data.data || [];
        if (subList[0]) {
          const matched = pkgList.find((p: any) => p.id === subList[0].packageId);
          setPkg(matched || null);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10 text-sky-text-secondary">Loading...</div>;

  const daysLeft = subscription?.expiresAt
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-sky-text-primary">Usage & Plan Info</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <Wifi size={20} className="mx-auto text-sky-accent-primary mb-2" />
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">Plan</p>
          <p className="text-xl font-bold text-sky-text-primary mt-1">{pkg?.name || "—"}</p>
        </div>
        <div className="glass-card p-5 text-center">
          <ArrowDown size={20} className="mx-auto text-sky-accent-green mb-2" />
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">Download Speed</p>
          <p className="text-xl font-bold text-sky-accent-green font-mono mt-1">{pkg?.downloadMbps || 0} Mbps</p>
        </div>
        <div className="glass-card p-5 text-center">
          <ArrowUp size={20} className="mx-auto text-sky-accent-primary mb-2" />
          <p className="text-xs text-sky-text-secondary uppercase tracking-wider">Upload Speed</p>
          <p className="text-xl font-bold text-sky-accent-primary font-mono mt-1">{pkg?.uploadMbps || 0} Mbps</p>
        </div>
      </div>

      {subscription && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary">Subscription Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-sky-accent-primary" />
              <div>
                <p className="text-xs text-sky-text-secondary">Started</p>
                <p className="text-sm text-sky-text-primary">{new Date(subscription.startedAt).toLocaleDateString("en-GB")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-sky-accent-orange" />
              <div>
                <p className="text-xs text-sky-text-secondary">Expires</p>
                <p className="text-sm text-sky-text-primary">{new Date(subscription.expiresAt).toLocaleDateString("en-GB")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Wifi size={16} className="text-sky-accent-green" />
              <div>
                <p className="text-xs text-sky-text-secondary">Status</p>
                <p className="text-sm text-sky-accent-green font-bold uppercase">{subscription.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ArrowDown size={16} className="text-sky-accent-primary" />
              <div>
                <p className="text-xs text-sky-text-secondary">Days Remaining</p>
                <p className="text-sm text-sky-text-primary font-bold">{daysLeft} days</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-[#0A1628] rounded-lg border border-[rgba(0,234,255,0.1)]">
            <p className="text-xs text-sky-text-secondary">WiFi Username</p>
            <code className="text-sm text-sky-accent-primary font-mono">{subscription.username}</code>
          </div>
        </div>
      )}

      {!subscription && (
        <div className="glass-card p-8 text-center">
          <Wifi size={32} className="mx-auto text-sky-text-secondary mb-3" />
          <p className="text-sky-text-secondary">No active subscription. Browse packages to get started.</p>
        </div>
      )}
    </div>
  );
}
