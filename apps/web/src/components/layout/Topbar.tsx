"use client";

import React, { useState } from "react";
import { Search, Bell, LogOut, User, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("skynity_access_token");
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-[rgba(0,234,255,0.15)] bg-[#0A1628]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search size={18} className="text-sky-text-secondary" />
        <input
          type="text"
          placeholder="Search users, customers, orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-sm text-sky-text-primary placeholder:text-sky-text-secondary outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-[#112240] text-sky-text-secondary transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-accent-red rounded-full animate-pulse" />
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-[rgba(0,234,255,0.15)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00EAFF] to-[#00FF88] flex items-center justify-center">
            <User size={16} className="text-[#050B15]" />
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-[#112240] text-sky-text-secondary transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
