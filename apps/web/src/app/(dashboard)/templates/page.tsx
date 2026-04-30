"use client";

import React, { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Palette, Save, Eye, ArrowDown, ArrowUp, Zap, CheckCircle } from "lucide-react";

interface TemplateTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgGradient: string;
  cardStyle: "glass" | "solid" | "outline";
  badgeStyle: "rounded" | "pill" | "square";
  fontFamily: "orbitron" | "inter";
}

const defaultThemes: TemplateTheme[] = [
  { id: "cyber", name: "Cyber Cyan", primaryColor: "#00EAFF", secondaryColor: "#00FF88", accentColor: "#A855F7", bgGradient: "from-[#050B15] to-[#0A1628]", cardStyle: "glass", badgeStyle: "pill", fontFamily: "orbitron" },
  { id: "sunset", name: "Sunset Glow", primaryColor: "#FF8C00", secondaryColor: "#FF3B6B", accentColor: "#FFD700", bgGradient: "from-[#1a0a00] to-[#2d0f0f]", cardStyle: "solid", badgeStyle: "rounded", fontFamily: "inter" },
  { id: "forest", name: "Neon Forest", primaryColor: "#00FF88", secondaryColor: "#00EAFF", accentColor: "#39FF14", bgGradient: "from-[#05150b] to-[#0a2814]", cardStyle: "glass", badgeStyle: "pill", fontFamily: "inter" },
  { id: "royal", name: "Royal Purple", primaryColor: "#A855F7", secondaryColor: "#00EAFF", accentColor: "#FFD700", bgGradient: "from-[#0f0515] to-[#1a0a28]", cardStyle: "solid", badgeStyle: "square", fontFamily: "orbitron" },
  { id: "minimal", name: "Minimal Dark", primaryColor: "#E2F0FF", secondaryColor: "#7AA3C8", accentColor: "#00EAFF", bgGradient: "from-[#050505] to-[#0a0a0a]", cardStyle: "outline", badgeStyle: "pill", fontFamily: "inter" },
  { id: "ocean", name: "Deep Ocean", primaryColor: "#00EAFF", secondaryColor: "#0066FF", accentColor: "#00FF88", bgGradient: "from-[#050a15] to-[#0a1a2d]", cardStyle: "glass", badgeStyle: "rounded", fontFamily: "orbitron" },
];

const samplePackage = {
  name: "Home Premium",
  downloadMbps: 30,
  uploadMbps: 15,
  priceBdt: 800,
  validityDays: 30,
  features: ["Unlimited Data", "24/7 Support", "Low Latency Gaming"],
  popular: true,
};

export default function TemplatesPage() {
  const [selectedTheme, setSelectedTheme] = useState<TemplateTheme>(defaultThemes[0]);
  const [customName, setCustomName] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader title="Package Template Designer" subtitle="Design modern package cards with live preview" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Theme Selector */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4 flex items-center gap-2">
              <Palette size={16} className="text-sky-accent-primary" />
              Select Theme
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {defaultThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedTheme.id === theme.id
                      ? "border-[#00EAFF] bg-[rgba(0,234,255,0.1)]"
                      : "border-[rgba(0,234,255,0.1)] hover:border-[rgba(0,234,255,0.3)]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: theme.primaryColor }} />
                    <span className="text-xs font-medium text-sky-text-primary">{theme.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded" style={{ background: theme.secondaryColor }} />
                    <div className="w-3 h-3 rounded" style={{ background: theme.accentColor }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-orbitron text-sm font-semibold text-sky-text-primary mb-4">Customization</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-sky-text-secondary uppercase">Template Name</label>
                <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="My Custom Theme" className="w-full mt-1 px-3 py-2 bg-[#0A1628] border border-[rgba(0,234,255,0.2)] rounded-lg text-sm text-sky-text-primary focus:border-[#00EAFF] outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-sky-text-secondary uppercase">Primary</label>
                  <input type="color" value={selectedTheme.primaryColor} onChange={(e) => setSelectedTheme({ ...selectedTheme, primaryColor: e.target.value })} className="w-full h-8 mt-1 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="text-[10px] text-sky-text-secondary uppercase">Secondary</label>
                  <input type="color" value={selectedTheme.secondaryColor} onChange={(e) => setSelectedTheme({ ...selectedTheme, secondaryColor: e.target.value })} className="w-full h-8 mt-1 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="text-[10px] text-sky-text-secondary uppercase">Accent</label>
                  <input type="color" value={selectedTheme.accentColor} onChange={(e) => setSelectedTheme({ ...selectedTheme, accentColor: e.target.value })} className="w-full h-8 mt-1 rounded cursor-pointer" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-[#00EAFF] to-[#00FF88] text-[#050B15] font-semibold rounded-lg text-sm hover:shadow-[0_0_20px_rgba(0,234,255,0.4)] transition-all">
                  <Save size={14} />
                  Save Template
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
              Live Preview
            </h3>

            <div className={`p-8 rounded-xl bg-gradient-to-br ${selectedTheme.bgGradient} border border-[rgba(0,234,255,0.15)]`}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: selectedTheme.primaryColor, fontFamily: selectedTheme.fontFamily === "orbitron" ? "Orbitron" : "Inter" }}>
                  Choose Your Plan
                </h2>
                <p className="text-sm mt-1" style={{ color: selectedTheme.secondaryColor }}>Fast, reliable internet for your home & business</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[samplePackage, { ...samplePackage, name: "Home Basic", downloadMbps: 10, uploadMbps: 5, priceBdt: 350, popular: false }, { ...samplePackage, name: "Business Pro", downloadMbps: 50, uploadMbps: 25, priceBdt: 1500, popular: false }].map((pkg) => (
                  <div
                    key={pkg.name}
                    className={`relative p-5 rounded-xl transition-all hover:scale-[1.02] ${
                      selectedTheme.cardStyle === "glass"
                        ? "bg-[rgba(255,255,255,0.03)] backdrop-blur-md border border-[rgba(255,255,255,0.1)]"
                        : selectedTheme.cardStyle === "solid"
                        ? "bg-[#0A1628] border border-transparent"
                        : "bg-transparent border-2"
                    }`}
                    style={{ borderColor: selectedTheme.cardStyle === "outline" ? selectedTheme.primaryColor : undefined }}
                  >
                    {pkg.popular && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-bold uppercase rounded-full"
                        style={{ background: selectedTheme.accentColor, color: "#050B15" }}
                      >
                        Most Popular
                      </div>
                    )}

                    <h3 className="font-bold text-lg mb-1" style={{ color: selectedTheme.primaryColor }}>{pkg.name}</h3>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1" style={{ color: selectedTheme.secondaryColor }}>
                        <ArrowDown size={14} />
                        <span className="font-mono font-bold">{pkg.downloadMbps} Mbps</span>
                      </div>
                      <div className="flex items-center gap-1" style={{ color: selectedTheme.primaryColor }}>
                        <ArrowUp size={14} />
                        <span className="font-mono font-bold">{pkg.uploadMbps} Mbps</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="text-2xl font-bold" style={{ color: selectedTheme.primaryColor }}>৳{pkg.priceBdt}</span>
                      <span className="text-xs ml-1" style={{ color: selectedTheme.secondaryColor }}>/ {pkg.validityDays} days</span>
                    </div>

                    <ul className="space-y-1.5 mb-4">
                      {pkg.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs" style={{ color: selectedTheme.secondaryColor }}>
                          <Zap size={12} style={{ color: selectedTheme.accentColor }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
                        selectedTheme.badgeStyle === "pill" ? "rounded-full" : selectedTheme.badgeStyle === "square" ? "rounded" : "rounded-lg"
                      }`}
                      style={{ background: selectedTheme.primaryColor, color: "#050B15" }}
                    >
                      Get Started
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-4 bg-[#0A1628] rounded-lg border border-[rgba(0,234,255,0.1)]">
              <p className="text-xs text-sky-text-secondary font-mono mb-1">Generated CSS Variables:</p>
              <pre className="text-[10px] text-sky-text-primary font-mono overflow-x-auto">
{`:root {
  --theme-primary: ${selectedTheme.primaryColor};
  --theme-secondary: ${selectedTheme.secondaryColor};
  --theme-accent: ${selectedTheme.accentColor};
  --theme-bg: ${selectedTheme.bgGradient};
  --theme-card: ${selectedTheme.cardStyle};
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
