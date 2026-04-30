"use client";

import React from "react";
import { Globe } from "lucide-react";

interface Props {
  currentLang: "en" | "bn";
  onChange: (lang: "en" | "bn") => void;
}

export default function LanguageSwitcher({ currentLang, onChange }: Props) {
  return (
    <button
      onClick={() => onChange(currentLang === "en" ? "bn" : "en")}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[#112240] text-sky-text-secondary transition-colors text-xs font-medium"
      title="Switch Language"
    >
      <Globe size={14} />
      <span className="uppercase">{currentLang === "en" ? "EN" : "বাং"}</span>
    </button>
  );
}
