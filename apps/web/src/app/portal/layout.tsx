"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SkynityLogo from "@/components/brand/SkynityLogo";
import { LogOut, Package, ListOrdered, CreditCard, Home, BarChart3, HelpCircle } from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<{ fullName: string; phone: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = localStorage.getItem("skynity_portal_token");
    const c = localStorage.getItem("skynity_portal_customer");
    setToken(t);
    if (c) {
      try { setCustomer(JSON.parse(c)); } catch { /* ignore */ }
    }
  }, []);

  function logout() {
    localStorage.removeItem("skynity_portal_token");
    localStorage.removeItem("skynity_portal_customer");
    setToken(null);
    setCustomer(null);
    router.push("/portal/login");
  }

  const navLinks = [
    { href: "/portal", icon: Home, label: "Dashboard" },
    { href: "/portal/packages", icon: Package, label: "Packages" },
    { href: "/portal/orders", icon: ListOrdered, label: "My Orders" },
    { href: "/portal/usage", icon: BarChart3, label: "Usage" },
    { href: "/portal/support", icon: HelpCircle, label: "Support" },
  ];

  return (
    <div className="min-h-screen bg-[#050B15]">
      <nav className="border-b border-[rgba(0,234,255,0.15)] bg-[#0A1628]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2">
            <SkynityLogo size={28} />
            <span className="font-orbitron text-sm font-bold text-gradient">SKYNITY</span>
          </Link>
          <div className="flex items-center gap-4">
            {token && navLinks.map((link) => (
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
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
