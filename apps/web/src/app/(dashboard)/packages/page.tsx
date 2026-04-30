"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Package, ArrowDown, ArrowUp, Palette, Edit3 } from "lucide-react";
import { formatBdt } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface PackageItem {
  id: string;
  name: string;
  type: string;
  downloadMbps: number;
  uploadMbps: number;
  priceBdt: string;
  validityDays: number;
  isTrial: boolean;
  isActive: boolean;
  templateConfig: unknown;
}

function getTemplateColor(config: unknown): string {
  if (!config || typeof config !== "object") return "#7AA3C8";
  const c = config as Record<string, string>;
  return c.primaryColor || "#7AA3C8";
}

export default function PackagesPage() {
  const [pkgs, setPkgs] = useState<PackageItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/packages/");
        setPkgs(res.data.data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <PageHeader title="Packages" subtitle="Internet plans & pricing" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pkgs.map((p) => (
          <div key={p.id} className="glass-card p-5 relative overflow-hidden">
            {p.isTrial && (
              <div className="absolute top-0 right-0 bg-sky-accent-purple text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                TRIAL
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <Package size={18} className="text-sky-accent-primary" />
              <h3 className="font-semibold text-sky-text-primary">{p.name}</h3>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1 text-sky-accent-green">
                <ArrowDown size={14} />
                <span className="font-mono font-bold">{p.downloadMbps} Mbps</span>
              </div>
              <div className="flex items-center gap-1 text-sky-accent-primary">
                <ArrowUp size={14} />
                <span className="font-mono font-bold">{p.uploadMbps} Mbps</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[rgba(0,234,255,0.15)]">
              <span className="text-xl font-bold text-gradient">{formatBdt(p.priceBdt)}</span>
              <span className="text-xs text-sky-text-secondary">{p.validityDays} days</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  p.isActive ? "bg-sky-accent-green/10 text-sky-accent-green" : "bg-sky-accent-red/10 text-sky-accent-red"
                }`}
              >
                {p.isActive ? "Active" : "Inactive"}
              </span>
              <span className="text-[10px] uppercase text-sky-text-secondary bg-[#112240] px-2 py-0.5 rounded">{p.type}</span>
              <div
                className="w-3 h-3 rounded-full ml-auto"
                style={{ background: getTemplateColor(p.templateConfig) }}
                title="Template primary color"
              />
              <button
                onClick={() => router.push(`/templates?pkg=${p.id}`)}
                className="text-[10px] flex items-center gap-1 text-sky-accent-primary hover:text-sky-accent-green transition-colors"
              >
                <Palette size={10} />
                <Edit3 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
