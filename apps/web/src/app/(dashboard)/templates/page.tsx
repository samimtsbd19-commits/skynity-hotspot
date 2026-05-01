"use client";

import React, { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Palette, Save, Eye, ArrowDown, ArrowUp, Zap, CheckCircle, Package } from "lucide-react";

interface TemplateConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgGradient: string;
  cardStyle: "glass" | "solid" | "outline";
  badgeStyle: "rounded" | "pill" | "square";
  fontFamily: "orbitron" | "inter";
}

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
  description: string | null;
  burstDownloadMbps: number | null;
  burstUploadMbps: number | null;
  templateConfig: TemplateConfig | null;
}

const defaultThemes: TemplateConfig[] = [
  { primaryColor: "#00EAFF", secondaryColor: "#00FF88", accentColor: "#A855F7", bgGradient: "from-[#050B15] to-[#0A1628]", cardStyle: "glass", badgeStyle: "pill", fontFamily: "orbitron" },
  { primaryColor: "#FF8C00", secondaryColor: "#FF3B6B", accentColor: "#FFD700", bgGradient: "from-[#1a0a00] to-[#2d0f0f]", cardStyle: "solid", badgeStyle: "rounded", fontFamily: "inter" },
  { primaryColor: "#00FF88", secondaryColor: "#00EAFF", accentColor: "#39FF14", bgGradient: "from-[#05150b] to-[#0a2814]", cardStyle: "glass", badgeStyle: "pill", fontFamily: "inter" },
  { primaryColor: "#A855F7", secondaryColor: "#00EAFF", accentColor: "#FFD700", bgGradient: "from-[#0f0515] to-[#1a0a28]", cardStyle: "solid", badgeStyle: "square", fontFamily: "orbitron" },
  { primaryColor: "#E2F0FF", secondaryColor: "#7AA3C8", accentColor: "#00EAFF", bgGradient: "from-[#050505] to-[#0a0a0a]", cardStyle: "outline", badgeStyle: "pill", fontFamily: "inter" },
  { primaryColor: "#00EAFF", secondaryColor: "#0066FF", accentColor: "#00FF88", bgGradient: "from-[#050a15] to-[#0a1a2d]", cardStyle: "glass", badgeStyle: "rounded", fontFamily: "orbitron" },
];

function normalizeTemplateConfig(raw: unknown): TemplateConfig {
  const t = raw as Record<string, unknown> | null;
  return {
    primaryColor: (t?.primaryColor as string) || "#00EAFF",
    secondaryColor: (t?.secondaryColor as string) || "#00FF88",
    accentColor: (t?.accentColor as string) || "#A855F7",
    bgGradient: (t?.bgGradient as string) || "from-[#050B15] to-[#0A1628]",
    cardStyle: (t?.cardStyle as "glass" | "solid" | "outline") || "glass",
    badgeStyle: (t?.badgeStyle as "rounded" | "pill" | "square") || "pill",
    fontFamily: (t?.fontFamily as "orbitron" | "inter") || "orbitron",
  };
}

export default function TemplatesPage() {
  const [pkgs, setPkgs] = useState<PackageItem[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<PackageItem | null>(null);
  const [theme, setTheme] = useState<TemplateConfig>(defaultThemes[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/packages/");
        const list: PackageItem[] = res.data.data || [];
        setPkgs(list);
        if (list.length > 0) {
          setSelectedPkg(list[0]);
          setTheme(normalizeTemplateConfig(list[0].templateConfig));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSelectPackage = (pkg: PackageItem) => {
    setSelectedPkg(pkg);
    setTheme(normalizeTemplateConfig(pkg.templateConfig));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedPkg) return;
    setSaving(true);
    try {
      await api.put(`/packages/${selectedPkg.id}`, { templateConfig: theme });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Refresh list
      const res = await api.get("/packages/");
      setPkgs(res.data.data || []);
    } catch (e) {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const previewPackages = selectedPkg
    ? [
        { ...selectedPkg, name: selectedPkg.name, popular: selectedPkg.isTrial },
        { ...selectedPkg, name: `${selectedPkg.name} Plus`, downloadMbps: selectedPkg.downloadMbps * 2, uploadMbps: selectedPkg.uploadMbps * 2, priceBdt: String(Number(selectedPkg.priceBdt) * 2), popular: false },
        { ...selectedPkg, name: `${selectedPkg.name} Lite`, downloadMbps: Math.max(5, Math.floor(selectedPkg.downloadMbps / 2)), uploadMbps: Math.max(3, Math.floor(selectedPkg.uploadMbps / 2)), priceBdt: String(Math.max(0, Math.floor(Number(selectedPkg.priceBdt) / 2))), popular: false },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Package Template Designer" subtitle="Customize package card designs per package" />

      {loading ? (
        <div className="text-center py-10 text-sky-text-secondary">Loading packages...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Package + Theme Selector */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4 flex items-center gap-2">
                <Package size={16} className="text-sky-accent-primary" />
                Select Package
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pkgs.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedPkg?.id === pkg.id
                        ? "border-[#00EAFF] bg-[rgba(0,234,255,0.1)]"
                        : "border-[rgba(0,234,255,0.1)] hover:border-[rgba(0,234,255,0.3)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-sky-text-primary">{pkg.name}</span>
                      {pkg.isTrial && (
                        <span className="text-[10px] bg-sky-accent-purple/20 text-sky-accent-purple px-1.5 py-0.5 rounded">TRIAL</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: normalizeTemplateConfig(pkg.templateConfig).primaryColor }}
                      />
                      <span className="text-[10px] text-sky-text-secondary">
                        {normalizeTemplateConfig(pkg.templateConfig).cardStyle} · {pkg.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4 flex items-center gap-2">
                <Palette size={16} className="text-sky-accent-primary" />
                Theme Presets
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {defaultThemes.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTheme(t)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      theme.primaryColor === t.primaryColor && theme.bgGradient === t.bgGradient
                        ? "border-[#00EAFF] bg-[rgba(0,234,255,0.1)]"
                        : "border-[rgba(0,234,255,0.1)] hover:border-[rgba(0,234,255,0.3)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: t.primaryColor }} />
                      <span className="text-[10px] font-medium text-sky-text-primary">Preset {idx + 1}</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded" style={{ background: t.secondaryColor }} />
                      <div className="w-3 h-3 rounded" style={{ background: t.accentColor }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Customization</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-sky-text-secondary uppercase">Primary</label>
                    <input type="color" value={theme.primaryColor} onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })} className="w-full h-8 mt-1 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-[10px] text-sky-text-secondary uppercase">Secondary</label>
                    <input type="color" value={theme.secondaryColor} onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })} className="w-full h-8 mt-1 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-[10px] text-sky-text-secondary uppercase">Accent</label>
                    <input type="color" value={theme.accentColor} onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })} className="w-full h-8 mt-1 rounded cursor-pointer" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={theme.cardStyle} onChange={(e) => setTheme({ ...theme, cardStyle: e.target.value as any })} className="w-full px-2 py-1.5 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded text-xs text-sky-text-primary">
                    <option value="glass">Glass Card</option>
                    <option value="solid">Solid Card</option>
                    <option value="outline">Outline Card</option>
                  </select>
                  <select value={theme.badgeStyle} onChange={(e) => setTheme({ ...theme, badgeStyle: e.target.value as any })} className="w-full px-2 py-1.5 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded text-xs text-sky-text-primary">
                    <option value="pill">Pill Badge</option>
                    <option value="rounded">Rounded Badge</option>
                    <option value="square">Square Badge</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !selectedPkg}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-[#00EAFF] to-[#00FF88] text-[#050B15] font-semibold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(0,234,255,0.4)] transition-all disabled:opacity-50"
                  >
                    <Save size={14} />
                    {saving ? "Saving..." : `Save to ${selectedPkg?.name || "Package"}`}
                  </button>
                </div>
                {saved && (
                  <div className="flex items-center gap-1 text-xs text-sky-accent-green">
                    <CheckCircle size={12} />
                    Template saved!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <div className="glass-card p-5">
              <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4 flex items-center gap-2">
                <Eye size={16} className="text-sky-accent-primary" />
                Live Preview — {selectedPkg?.name || "Select a package"}
              </h3>

              <div className={`p-8 rounded-xl bg-gradient-to-br ${theme.bgGradient} border border-[rgba(0,234,255,0.15)]`}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: theme.primaryColor, fontFamily: theme.fontFamily === "orbitron" ? "Orbitron" : "Inter" }}>
                    Choose Your Plan
                  </h2>
                  <p className="text-sm mt-1" style={{ color: theme.secondaryColor }}>Fast, reliable internet for your home & business</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {previewPackages.map((pkg) => (
                    <div
                      key={pkg.name}
                      className={`relative p-5 rounded-xl transition-all hover:scale-[1.02] ${
                        theme.cardStyle === "glass"
                          ? "bg-[rgba(255,255,255,0.03)] backdrop-blur-md border border-[rgba(255,255,255,0.1)]"
                          : theme.cardStyle === "solid"
                          ? "bg-[#0A1628] border border-transparent"
                          : "bg-transparent border-2"
                      }`}
                      style={{ borderColor: theme.cardStyle === "outline" ? theme.primaryColor : undefined }}
                    >
                      {pkg.popular && (
                        <div
                          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold uppercase rounded-full"
                          style={{ background: theme.accentColor, color: "#050B15" }}
                        >
                          FREE TRIAL
                        </div>
                      )}

                      <h3 className="font-bold text-lg mb-1" style={{ color: theme.primaryColor }}>{pkg.name}</h3>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1" style={{ color: theme.secondaryColor }}>
                          <ArrowDown size={14} />
                          <span className="font-mono font-bold">{pkg.downloadMbps} Mbps</span>
                        </div>
                        <div className="flex items-center gap-1" style={{ color: theme.primaryColor }}>
                          <ArrowUp size={14} />
                          <span className="font-mono font-bold">{pkg.uploadMbps} Mbps</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="text-2xl font-bold" style={{ color: theme.primaryColor }}>৳{pkg.priceBdt}</span>
                        <span className="text-xs ml-1" style={{ color: theme.secondaryColor }}>/ {pkg.validityDays} days</span>
                      </div>

                      <ul className="space-y-1.5 mb-4">
                        <li className="flex items-center gap-1.5 text-xs" style={{ color: theme.secondaryColor }}>
                          <Zap size={12} style={{ color: theme.accentColor }} />
                          Unlimited Data
                        </li>
                        <li className="flex items-center gap-1.5 text-xs" style={{ color: theme.secondaryColor }}>
                          <Zap size={12} style={{ color: theme.accentColor }} />
                          24/7 Support
                        </li>
                      </ul>

                      <button
                        className={`w-full py-2 font-semibold text-sm transition-all ${
                          theme.badgeStyle === "pill" ? "rounded-full" : theme.badgeStyle === "square" ? "rounded" : "rounded-lg"
                        }`}
                        style={{ background: theme.primaryColor, color: "#050B15" }}
                      >
                        Get Started
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-4 bg-[#0A1628] rounded-lg border border-[rgba(0,234,255,0.1)]">
                <p className="text-xs text-sky-text-secondary font-mono mb-1">Template Config JSON:</p>
                <pre className="text-[10px] text-sky-text-primary font-mono overflow-x-auto">
{JSON.stringify(theme, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
