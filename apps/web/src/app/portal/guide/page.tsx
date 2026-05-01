"use client";

import React from "react";
import { useRouter } from "next/navigation";
import SkynityLogo from "@/components/brand/SkynityLogo";
import { ShoppingCart, Wifi, Shield, AlertTriangle, Ban, Smartphone, ChevronLeft, CheckCircle, Star, CloudRain } from "lucide-react";

export default function UserGuidePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <SkynityLogo size={48} />
        </div>
        <h1 className="font-orbitron text-xl font-bold text-gradient">SKYNITY</h1>
        <p className="text-sm text-sky-text-secondary">User Guide & Policies</p>
      </div>

      <button
        onClick={() => router.push("/portal/packages")}
        className="flex items-center gap-1 text-xs text-sky-text-secondary hover:text-sky-accent-primary transition-colors"
      >
        <ChevronLeft size={14} /> Back to packages
      </button>

      {/* How to Buy */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-bold text-sky-text-primary mb-4 flex items-center gap-2">
          <ShoppingCart size={16} className="text-sky-accent-primary" /> How to Buy a Package
        </h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-accent-primary/20 text-sky-accent-primary flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <p className="text-sm text-sky-text-primary font-medium">Choose a Plan</p>
              <p className="text-xs text-sky-text-secondary">Browse our packages and select the one that fits your needs.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-accent-primary/20 text-sky-accent-primary flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <p className="text-sm text-sky-text-primary font-medium">Login or Register</p>
              <p className="text-xs text-sky-text-secondary">Create an account or login with your mobile number.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-accent-primary/20 text-sky-accent-primary flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <p className="text-sm text-sky-text-primary font-medium">Make Payment</p>
              <p className="text-xs text-sky-text-secondary">Send money via bKash or Nagad to our merchant number.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-accent-primary/20 text-sky-accent-primary flex items-center justify-center text-xs font-bold">4</div>
            <div>
              <p className="text-sm text-sky-text-primary font-medium">Submit Order</p>
              <p className="text-xs text-sky-text-secondary">Enter your Transaction ID and create a WiFi password.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-accent-green/20 text-sky-accent-green flex items-center justify-center text-xs font-bold">5</div>
            <div>
              <p className="text-sm text-sky-text-primary font-medium">Get Connected</p>
              <p className="text-xs text-sky-text-secondary">Admin will approve your order within 30 minutes. You will receive your login credentials.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Good Aspects */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-bold text-sky-text-primary mb-4 flex items-center gap-2">
          <Star size={16} className="text-sky-accent-green" /> Why Choose SKYNITY?
        </h2>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <Wifi size={16} className="text-sky-accent-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-sky-text-primary font-medium">Starlink Internet Backbone</p>
              <p className="text-xs text-sky-text-secondary">We deliver low-latency, high-speed internet powered by Starlink satellite technology.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Shield size={16} className="text-sky-accent-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-sky-text-primary font-medium">24/7 IPS Backup</p>
              <p className="text-xs text-sky-text-secondary">Our network is protected by industrial-grade UPS and backup power systems.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle size={16} className="text-sky-accent-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-sky-text-primary font-medium">No Electricity = No Problem</p>
              <p className="text-xs text-sky-text-secondary">Even if your area has a power cut, our network stays online thanks to backup power.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Smartphone size={16} className="text-sky-accent-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-sky-text-primary font-medium">Flexible Device Plans</p>
              <p className="text-xs text-sky-text-secondary">Choose between 1-device and 2-device plans based on your household needs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bad Aspects / Limitations */}
      <div className="glass-card p-5 border-sky-accent-orange/20">
        <h2 className="text-sm font-bold text-sky-text-primary mb-4 flex items-center gap-2">
          <CloudRain size={16} className="text-sky-accent-orange" /> Service Limitations
        </h2>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <AlertTriangle size={16} className="text-sky-accent-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-sky-text-primary font-medium">Rain Fade</p>
              <p className="text-xs text-sky-text-secondary">During heavy rain or storms, satellite internet may experience temporary slowdowns or brief disconnections. This is normal for satellite-based services.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="glass-card p-5 border-sky-accent-red/20">
        <h2 className="text-sm font-bold text-sky-text-primary mb-4 flex items-center gap-2">
          <Ban size={16} className="text-sky-accent-red" /> User Rules & Policies
        </h2>
        <div className="space-y-3 text-xs text-sky-text-secondary">
          <div className="flex gap-2 items-start">
            <Ban size={12} className="text-sky-accent-red flex-shrink-0 mt-0.5" />
            <p><strong className="text-sky-text-primary">Device Limit:</strong> Do not attempt to login with more devices than your package allows. If you have a 1-device plan, using 2 devices simultaneously will result in automatic disconnection.</p>
          </div>
          <div className="flex gap-2 items-start">
            <Ban size={12} className="text-sky-accent-red flex-shrink-0 mt-0.5" />
            <p><strong className="text-sky-text-primary">No Sharing:</strong> Sharing your account credentials with others is strictly prohibited.</p>
          </div>
          <div className="flex gap-2 items-start">
            <Ban size={12} className="text-sky-accent-red flex-shrink-0 mt-0.5" />
            <p><strong className="text-sky-text-primary">Fair Usage:</strong> Excessive bandwidth usage that affects other users may result in speed throttling.</p>
          </div>
          <div className="flex gap-2 items-start">
            <Ban size={12} className="text-sky-accent-red flex-shrink-0 mt-0.5" />
            <p><strong className="text-sky-text-primary">Suspension:</strong> If a user violates any rules, causes network issues, or attempts unauthorized access, their account may be suspended without prior notice.</p>
          </div>
          <div className="flex gap-2 items-start">
            <Ban size={12} className="text-sky-accent-red flex-shrink-0 mt-0.5" />
            <p><strong className="text-sky-text-primary">No Refund:</strong> Once a package is activated, refunds are not provided.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="glass-card p-5 text-center">
        <p className="text-sm text-sky-text-secondary mb-3">Ready to get connected?</p>
        <button
          onClick={() => router.push("/portal/packages")}
          className="bg-sky-accent-primary/20 hover:bg-sky-accent-primary/30 text-sky-accent-primary border border-sky-accent-primary/50 rounded-lg py-2 px-6 text-sm font-medium transition-all"
        >
          Browse Packages
        </button>
      </div>
    </div>
  );
}
