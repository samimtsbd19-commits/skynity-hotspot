"use client";

import React from "react";

interface Props {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <div className="mb-6">
      <h1 className="font-orbitron text-2xl font-bold text-sky-text-primary">{title}</h1>
      {subtitle && <p className="text-sky-text-secondary text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
