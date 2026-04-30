"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext: string;
  color: "primary" | "green" | "orange" | "red" | "purple";
}

const colorMap = {
  primary: "from-[#00EAFF] to-[#00EAFF]/20 text-[#00EAFF]",
  green: "from-[#00FF88] to-[#00FF88]/20 text-[#00FF88]",
  orange: "from-[#FF8C00] to-[#FF8C00]/20 text-[#FF8C00]",
  red: "from-[#FF3B6B] to-[#FF3B6B]/20 text-[#FF3B6B]",
  purple: "from-[#A855F7] to-[#A855F7]/20 text-[#A855F7]",
};

export default function StatCard({ icon: Icon, label, value, subtext, color }: Props) {
  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      <div className={cn("absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl opacity-10 rounded-bl-full", colorMap[color])} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-medium text-sky-text-secondary uppercase tracking-wider">{label}</p>
          <h3 className="text-2xl font-bold text-sky-text-primary mt-1">{value}</h3>
          <p className="text-xs text-sky-text-secondary mt-1">{subtext}</p>
        </div>
        <div className={cn("p-2.5 rounded-lg bg-gradient-to-br", colorMap[color])}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}
