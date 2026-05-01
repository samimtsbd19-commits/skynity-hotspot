"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SkynityLogo from "../brand/SkynityLogo";
import {
  LayoutDashboard,
  Activity,
  Cpu,
  Wifi,
  Users,
  Package,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Router,
  Monitor,
  Globe,
  Zap,
  Network,
  Server,
  BarChart3,
  Palette,
  Bell,
  Map,
  Video,
  X,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Main",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/device", icon: Router, label: "Device" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { href: "/monitoring/resource", icon: Cpu, label: "Resources" },
      { href: "/monitoring/bandwidth", icon: Activity, label: "Bandwidth" },
      { href: "/monitoring/ping", icon: Globe, label: "Ping" },
      { href: "/monitoring/sfp", icon: Zap, label: "SFP Modules" },
      { href: "/monitoring/queues", icon: Network, label: "Queues" },
      { href: "/monitoring/neighbors", icon: Radio, label: "Neighbors" },
      { href: "/topology", icon: Map, label: "Topology Map" },
      { href: "/nms", icon: Video, label: "NMS / CCTV" },
    ],
  },
  {
    label: "Users",
    items: [
      { href: "/pppoe", icon: Users, label: "PPPoE Users" },
      { href: "/hotspot", icon: Wifi, label: "Hotspot" },
      { href: "/customers", icon: Monitor, label: "Customers" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/packages", icon: Package, label: "Packages" },
      { href: "/templates", icon: Palette, label: "Templates" },
      { href: "/billing", icon: Receipt, label: "Billing" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/router", icon: Server, label: "Routers" },
      { href: "/router/config", icon: Router, label: "Router Config" },
      { href: "/support", icon: Headphones, label: "Support" },
      { href: "/notifications", icon: Bell, label: "Notifications" },
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "h-screen sticky top-0 flex flex-col border-r border-[rgba(0,234,255,0.15)] bg-[#0A1628] transition-all duration-300 z-50",
          collapsed ? "w-20" : "w-64",
          "md:translate-x-0",
          mobileOpen ? "fixed left-0 top-0 translate-x-0" : "fixed left-0 top-0 -translate-x-full md:static md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[rgba(0,234,255,0.15)]">
          <SkynityLogo size={36} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-orbitron text-lg font-bold text-gradient tracking-wider">SKYNITY</h1>
              <p className="text-[10px] text-sky-text-secondary tracking-widest">CONNECTING THE FUTURE</p>
            </div>
          )}
          {mobileOpen && (
            <button onClick={onMobileClose} className="md:hidden text-sky-text-secondary hover:text-sky-text-primary">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-4 text-[10px] font-semibold text-sky-text-secondary uppercase tracking-wider mb-2">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1 px-2">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onMobileClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                          active
                            ? "bg-[rgba(0,234,255,0.1)] text-[#00EAFF] neon-border"
                            : "text-sky-text-secondary hover:bg-[#112240] hover:text-sky-text-primary"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon size={20} className={cn("shrink-0", active && "text-[#00EAFF]")} />
                        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[rgba(0,234,255,0.15)]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-[#112240] text-sky-text-secondary transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
