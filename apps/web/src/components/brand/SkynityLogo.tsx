"use client";

import React from "react";

interface Props {
  size?: number;
  className?: string;
}

export default function SkynityLogo({ size = 48, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="skyGradient" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#00EAFF" />
          <stop offset="100%" stopColor="#00FF88" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#glow)">
        <path
          d="M50 5 L60 25 L85 20 L70 40 L90 60 L65 55 L55 80 L45 55 L20 60 L35 40 L15 20 L40 25 Z"
          stroke="url(#skyGradient)"
          strokeWidth="3"
          fill="none"
          className="animate-pulse"
        />
        <circle cx="50" cy="45" r="12" stroke="url(#skyGradient)" strokeWidth="2" fill="none" />
        <circle cx="50" cy="45" r="4" fill="url(#skyGradient)" className="animate-pulse" />
      </g>
    </svg>
  );
}
