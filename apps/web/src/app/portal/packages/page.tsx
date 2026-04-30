"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Package, ArrowDown, ArrowUp, Clock, CheckCircle } from "lucide-react";

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
}

export default function PortalPackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PackageItem | null>(null);
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

  function handleSelect(pkg: PackageItem) {
    setSelected(pkg);
    // Store selected package in session and go to payment
    sessionStorage.setItem("skynity_selected_package", JSON.stringify(pkg));
    router.push("/portal/payment");
  }

  if (loading) {
    return (
      <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-5 h-48 bg-[#112240]" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-orbitron text-lg font-bold text-sky-text-primary mb-6">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`glass-card p-5 transition-all hover:border-sky-accent-primary/50 ${
              selected?.id === pkg.id ? "border-sky-accent-primary neon-border" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sky-text-primary">{pkg.name}</h3>
              {pkg.isTrial && (
                <span className="text-[10px] bg-sky-accent-green/10 text-sky-accent-green px-2 py-0.5 rounded font-bold uppercase">Trial</span>
              )}
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
                <div className="text-lg font-bold text-sky-text-primary">৳{pkg.priceBdt}</div>
                <div className="flex items-center gap-1 text-xs text-sky-text-secondary">
                  <Clock size={10} />
                  {pkg.validityDays} days
                </div>
              </div>
              <button
                onClick={() => handleSelect(pkg)}
                className="bg-sky-accent-primary/20 hover:bg-sky-accent-primary/30 text-sky-accent-primary border border-sky-accent-primary/50 rounded-lg py-1.5 px-4 text-xs font-medium transition-all"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
