"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import SkynityLogo from "@/components/brand/SkynityLogo";
import { Package, ArrowDown, ArrowUp, Clock, CheckCircle, Zap, Shield, Smartphone, Wifi } from "lucide-react";

interface PackageItem {
  id: string;
  name: string;
  type: string;
  downloadMbps: number;
  uploadMbps: number;
  priceBdt: string;
  validityDays: number;
  isTrial: boolean;
  description: string | null;
  templateConfig?: any;
}

export default function PortalPackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await api.get("/portal-api/packages");
        setPackages(res.data.data);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    fetchPackages();
  }, []);

  const trialPkg = packages.find((p) => p.isTrial);
  const paidPackages = packages.filter((p) => !p.isTrial);

  function handleSelect(pkg: PackageItem) {
    router.push(`/portal/packages/${pkg.id}`);
  }

  return (
    <div className="space-y-8">
      {/* Header with Logo */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <SkynityLogo size={64} />
        </div>
        <h1 className="font-orbitron text-2xl font-bold text-gradient">SKYNITY</h1>
        <p className="text-sm text-sky-text-secondary">Connecting the Future — Premium Internet Service</p>
      </div>

      {/* Free Trial Banner */}
      {trialPkg && (
        <div className="glass-card p-6 border-sky-accent-green/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-sky-accent-green text-[#050B15] text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
            Free Trial
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-sky-text-primary">{trialPkg.name}</h2>
              <p className="text-xs text-sky-text-secondary">Experience SKYNITY before you buy</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sky-accent-green text-sm">
                  <ArrowDown size={14} />
                  <span className="font-mono font-bold">{trialPkg.downloadMbps} Mbps</span>
                </div>
                <div className="flex items-center gap-1 text-sky-accent-primary text-sm">
                  <ArrowUp size={14} />
                  <span className="font-mono font-bold">{trialPkg.uploadMbps} Mbps</span>
                </div>
                <div className="flex items-center gap-1 text-sky-text-secondary text-sm">
                  <Clock size={14} />
                  <span>{trialPkg.validityDays} days</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleSelect(trialPkg)}
              className="bg-sky-accent-green/20 hover:bg-sky-accent-green/30 text-sky-accent-green border border-sky-accent-green/50 rounded-lg py-2 px-6 text-sm font-medium transition-all flex items-center gap-2"
            >
              <Zap size={14} /> Get Free Trial
            </button>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 text-center">
          <Wifi size={20} className="text-sky-accent-primary mx-auto mb-2" />
          <p className="text-xs font-bold text-sky-text-primary">Starlink Backed</p>
          <p className="text-[10px] text-sky-text-secondary">Low latency satellite</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Shield size={20} className="text-sky-accent-green mx-auto mb-2" />
          <p className="text-xs font-bold text-sky-text-primary">24/7 IPS Backup</p>
          <p className="text-[10px] text-sky-text-secondary">Always connected</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Zap size={20} className="text-sky-accent-orange mx-auto mb-2" />
          <p className="text-xs font-bold text-sky-text-primary">No Power Cut</p>
          <p className="text-[10px] text-sky-text-secondary">UPS backed network</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Smartphone size={20} className="text-sky-accent-primary mx-auto mb-2" />
          <p className="text-xs font-bold text-sky-text-primary">Multi Device</p>
          <p className="text-[10px] text-sky-text-secondary">1-2 device plans</p>
        </div>
      </div>

      {/* Paid Packages */}
      <div>
        <h2 className="font-orbitron text-lg font-bold text-sky-text-primary mb-4">Choose Your Plan</h2>
        {loading ? (
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5 h-56 bg-[#112240]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paidPackages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => handleSelect(pkg)}
                className="glass-card p-5 transition-all hover:border-sky-accent-primary/50 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sky-text-primary group-hover:text-sky-accent-primary transition-colors">{pkg.name}</h3>
                  <CheckCircle size={16} className="text-sky-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1 text-sky-accent-green">
                    <ArrowDown size={14} />
                    <span className="font-mono font-bold text-sm">{pkg.downloadMbps} Mbps</span>
                  </div>
                  <div className="flex items-center gap-1 text-sky-accent-primary">
                    <ArrowUp size={14} />
                    <span className="font-mono font-bold text-sm">{pkg.uploadMbps} Mbps</span>
                  </div>
                </div>

                <p className="text-xs text-sky-text-secondary mb-4">{pkg.description || `${pkg.type.toUpperCase()} connection with dedicated bandwidth`}</p>

                <div className="flex items-center justify-between pt-3 border-t border-[rgba(0,234,255,0.1)]">
                  <div>
                    <div className="text-xl font-bold text-sky-text-primary">৳{pkg.priceBdt}</div>
                    <div className="flex items-center gap-1 text-xs text-sky-text-secondary">
                      <Clock size={10} />
                      {pkg.validityDays} days
                    </div>
                  </div>
                  <button className="bg-sky-accent-primary/20 hover:bg-sky-accent-primary/30 text-sky-accent-primary border border-sky-accent-primary/50 rounded-lg py-1.5 px-4 text-xs font-medium transition-all">
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="glass-card p-5 text-center">
        <p className="text-sm text-sky-text-secondary mb-3">Not sure which plan is right for you?</p>
        <button
          onClick={() => router.push("/portal/guide")}
          className="text-sky-accent-primary hover:text-sky-text-primary text-sm font-medium transition-colors"
        >
          Read User Guide →
        </button>
      </div>
    </div>
  );
}
