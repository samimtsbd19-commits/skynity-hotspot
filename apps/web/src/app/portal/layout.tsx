"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SkynityLogo from "@/components/brand/SkynityLogo";
import { LogOut, Package, ListOrdered, Home, BarChart3, HelpCircle, Menu, X, Download, Gauge, Wifi } from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<{ fullName: string; phone: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = localStorage.getItem("skynity_portal_token");
    const c = localStorage.getItem("skynity_portal_customer");
    setToken(t);
    if (c) {
      try { setCustomer(JSON.parse(c)); } catch { /* ignore */ }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onlineHandler = () => setIsOnline(true);
    const offlineHandler = () => setIsOnline(false);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    setIsOnline(navigator.onLine);

    // Inject portal manifest for PWA
    const existing = document.querySelector('link[href="/portal/manifest.json"]');
    if (!existing) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/portal/manifest.json";
      document.head.appendChild(link);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  async function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstall(false);
  }

  function logout() {
    localStorage.removeItem("skynity_portal_token");
    localStorage.removeItem("skynity_portal_customer");
    setToken(null);
    setCustomer(null);
    router.push("/portal/login");
  }

  const allNavLinks = [
    { href: "/portal", icon: Home, label: "Dashboard" },
    { href: "/portal/packages", icon: Package, label: "Packages" },
    { href: "/portal/orders", icon: ListOrdered, label: "Orders" },
    { href: "/portal/usage", icon: BarChart3, label: "Usage" },
    { href: "/portal/speedtest", icon: Gauge, label: "Speed" },
    { href: "/portal/guide", icon: HelpCircle, label: "Guide" },
  ];

  const bottomNavLinks = allNavLinks.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#050B15] pb-20 md:pb-0">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-sky-accent-red/90 text-white text-xs text-center py-1.5 z-[60]">
          You are offline. Some features may not work.
        </div>
      )}

      {/* Top Nav */}
      <nav className={`border-b border-[rgba(0,234,255,0.15)] bg-[#0A1628]/80 backdrop-blur-md sticky top-0 z-50 ${!isOnline ? "mt-6" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2">
            <SkynityLogo size={28} />
            <span className="font-orbitron text-sm font-bold text-gradient">SKYNITY</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {allNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs transition-colors flex items-center gap-1 ${
                  pathname === link.href ? "text-sky-accent-primary" : "text-sky-text-secondary hover:text-sky-text-primary"
                }`}
              >
                <link.icon size={12} />
                {link.label}
              </Link>
            ))}
            {showInstall && (
              <button onClick={installPWA} className="text-xs flex items-center gap-1 text-sky-accent-green hover:text-sky-accent-primary transition-colors">
                <Download size={12} /> Install App
              </button>
            )}
            {token ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-sky-text-secondary">{customer?.fullName || customer?.phone}</span>
                <button onClick={logout} className="text-xs text-sky-accent-red hover:text-red-400 flex items-center gap-1 transition-colors">
                  <LogOut size={12} /> Logout
                </button>
              </div>
            ) : (
              <Link href="/portal/login" className="text-xs text-sky-accent-primary hover:text-sky-text-primary transition-colors">
                Login
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button className="md:hidden text-sky-text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[rgba(0,234,255,0.1)] bg-[#0A1628]/95 backdrop-blur-md">
            <div className="px-4 py-3 space-y-2">
              {allNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-2 text-sm ${
                    pathname === link.href ? "text-sky-accent-primary" : "text-sky-text-secondary"
                  }`}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              ))}
              {showInstall && (
                <button onClick={() => { installPWA(); setMobileMenuOpen(false); }} className="flex items-center gap-2 py-2 text-sm text-sky-accent-green w-full">
                  <Download size={16} /> Install App
                </button>
              )}
              {token ? (
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 py-2 text-sm text-sky-accent-red w-full">
                  <LogOut size={16} /> Logout
                </button>
              ) : (
                <Link href="/portal/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-sm text-sky-accent-primary">
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A1628]/95 backdrop-blur-md border-t border-[rgba(0,234,255,0.15)] z-50">
        <div className="flex justify-around py-2">
          {bottomNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
                pathname === link.href ? "text-sky-accent-primary" : "text-sky-text-secondary"
              }`}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* PWA Install Floating Button (Mobile) */}
      {showInstall && (
        <button
          onClick={installPWA}
          className="md:hidden fixed bottom-20 right-4 bg-sky-accent-green text-[#050B15] rounded-full p-3 shadow-lg z-50 animate-bounce"
          title="Install App"
        >
          <Download size={20} />
        </button>
      )}
    </div>
  );
}
