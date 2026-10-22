"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Clock,
  Compass,
  Wrench,
  ShieldCheck,
  Cpu,
  Search,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

interface NavigationShellProps {
  children: React.ReactNode;
}

export function NavigationShell({ children }: NavigationShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    {
      name: "Overview",
      href: "/",
      icon: LayoutGrid,
      badge: null,
    },
    {
      name: "Time Machine",
      href: "/time-machine",
      icon: Clock,
      badge: "5", // Matches the single orange badge '5' on Transactions in SpendHub
    },
    {
      name: "Investigation",
      href: "/investigation",
      icon: Compass,
      badge: null,
    },
    {
      name: "Remediation Studio",
      href: "/remediation",
      icon: Wrench,
      badge: null,
    },
    {
      name: "Release Control",
      href: "/release-control",
      icon: ShieldCheck,
      badge: null,
    },
    {
      name: "Agent Activity",
      href: "/agent-activity",
      icon: Cpu,
      badge: null,
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[#F8F9FB] text-[#191C24] antialiased">
      {/* =========================================================================
          1. PERSISTENT SPENDHUB-STYLE SIDEBAR (Width: 212px, Background: #F9FAFB)
          ========================================================================= */}
      <aside className="hidden md:flex flex-col w-[212px] shrink-0 bg-[#F9FAFB] border-r border-[#ECEEF1] h-screen sticky top-0 px-3.5 py-6 justify-between select-none">
        <div className="space-y-6">
          {/* Brand Identity Header: Proportions strictly matching SpendHub */}
          <div className="px-1.5 pt-0.5">
            <Link href="/" className="block focus:outline-none">
              <BrandLogo size="md" showWordmark={true} />
            </Link>
          </div>

          {/* Search Field (Matches SpendHub #F0F1F3 rounded pill search) */}
          <div className="relative px-0.5">
            <Search className="w-3.5 h-3.5 text-[#969CA6] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F0F1F3] text-[#191C24] placeholder-[#969CA6] text-xs rounded-xl pl-8 pr-7 py-2 border border-transparent focus:border-[#ECEEF1] focus:bg-white focus:outline-none transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-sans text-[#969CA6] bg-white border border-[#ECEEF1] px-1.5 py-0.2 rounded shadow-2xs pointer-events-none">
              /
            </span>
          </div>

          {/* Navigation Items (Clean outline icons, white active pill, consistent spacing) */}
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all ${
                    isActive
                      ? "bg-white text-[#191C24] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#ECEEF1]"
                      : "text-[#747B87] font-normal hover:text-[#191C24] hover:bg-black/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-[#191C24]" : "text-[#747B87]"
                      }`}
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FF6A13] text-white leading-none">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Minimal Footer: Subtle divider and secondary links */}
        <div className="pt-4 border-t border-[#ECEEF1] px-1 space-y-2 text-[12px] text-[#747B87]">
          <div className="flex items-center justify-between">
            <span className="font-normal text-[11px] text-[#969CA6]">rel-2026-001</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" title="Core Nominal" />
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <a
              href="https://gitlab.com/atumanyire-labs/aftermath"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191C24] flex items-center gap-1 transition-colors"
            >
              GitLab <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#191C24] transition-colors"
            >
              API Docs
            </a>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#F8F9FB]">
        {/* Mobile-only header with hamburger drawer */}
        <header className="md:hidden bg-[#F9FAFB] border-b border-[#ECEEF1] h-14 flex items-center justify-between px-4 sticky top-0 z-30">
          <Link href="/" className="block">
            <BrandLogo size="sm" showWordmark={true} />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-[#747B87] hover:text-[#191C24] hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-[#ECEEF1] p-4 space-y-1 shadow-lg animate-in slide-in-from-top duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm ${
                    isActive
                      ? "bg-slate-50 text-[#191C24] font-medium"
                      : "text-[#747B87] hover:text-[#191C24]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF6A13] text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Main Workspace Viewport (Matches SpendHub page padding: 26px - 32px) */}
        <main className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
