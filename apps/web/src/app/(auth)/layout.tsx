"use client";

import React from "react";
import StarfieldBg from "@/components/brand/StarfieldBg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <StarfieldBg />
      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
