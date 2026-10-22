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
  GitBranch,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BrandLogo } from "@/components/brand-logo";

interface NavigationShellProps {
  children: React.ReactNode;
}

export function NavigationShell({ children }: NavigationShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Health and Duo status queries
  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
    refetchInterval: 10000,
  });

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
      badge: "5", // 5 adversarial fault injection scenarios
      badgeStyle: "bg-[#F97316] text-white",
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
      badge: "1", // 1 pending patch awaiting sign-off
      badgeStyle: "bg-[#F97316] text-white",
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
    <div className="min-h-screen flex bg-[#F7F8FA] text-[#111827] antialiased">
      {/* =========================================================================
          1. PERSISTENT DESKTOP SIDEBAR (260px wide, exactly matching reference design)
          ========================================================================= */}
      <aside className="hidden md:flex flex-col w-[260px] shrink-0 bg-white border-r border-[#E5E7EB]/80 h-screen sticky top-0 px-4 py-5 justify-between select-none shadow-[1px_0_4px_rgba(0,0,0,0.01)]">
        <div>
          {/* Brand Identity Header with Custom Geometric Origami Mark */}
          <div className="px-2 py-1 mb-6">
            <Link href="/" className="block focus:outline-none">
              <BrandLogo size="md" showWordmark={true} />
            </Link>
          </div>

          {/* Quick Search Pill (Direct replica of reference search container) */}
          <div className="relative mb-5 px-1">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F3F4F6] text-[#111827] placeholder-[#9CA3AF] text-xs rounded-xl pl-9 pr-8 py-2.5 border border-transparent focus:border-[#E5E7EB] focus:bg-white focus:outline-none transition-all"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#9CA3AF] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
              /
            </span>
          </div>

          {/* Navigation Links (Clean, uncrowded, identical to screen.jpg) */}
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? "bg-white text-[#111827] font-semibold shadow-card border border-[#E5E7EB]"
                      : "text-[#6B7280] font-medium hover:text-[#111827] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-[#111827]" : "text-[#6B7280]"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.badgeStyle}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Target Release & System Health Status */}
        <div className="pt-4 border-t border-[#E5E7EB]/80 space-y-3">
          {/* Active Target Release Badge */}
          <div className="bg-[#FAFBFD] rounded-xl p-3 border border-[#E5E7EB]/70 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#111827] flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[#F97316]" />
                Target Release
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-[#EF4444] font-semibold border border-rose-100">
                HIGH RISK
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#6B7280] truncate">
              rel-2026-001 (a8f9c21b4d08)
            </p>
            <div className="mt-2 pt-2 border-t border-[#E5E7EB]/60 flex items-center justify-between text-[11px]">
              <span className="text-[#6B7280]">Financial At-Risk</span>
              <span className="font-bold text-[#EF4444]">$1,500.00</span>
            </div>
          </div>

          {/* System & API Probes Indicator */}
          <div className="px-2 flex items-center justify-between text-xs text-[#6B7280]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] font-medium text-[#111827]">
                {health?.status === "ok" ? "Backend Nominal" : "Connecting..."}
              </span>
            </div>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] hover:text-[#F97316] flex items-center gap-1 transition-colors"
            >
              Docs <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA + CONTEXTUAL TOP BAR
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Minimal Contextual Top Bar */}
        <header className="sticky top-0 z-30 bg-[#F7F8FA]/90 backdrop-blur-md border-b border-[#E5E7EB]/70 h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-slate-100 focus:outline-none"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb / Workspace Name */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-[#111827]">AFTERMATH</span>
              <span className="text-[#D1D5DB]">/</span>
              <span className="text-[#6B7280] capitalize">
                {pathname === "/" ? "Executive Overview" : pathname?.replace("/", "").replace("-", " ")}
              </span>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#6B7280] font-medium shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
              GitLab Life After Code Hackathon
            </span>

            <a
              href="https://gitlab.com/atumanyire-labs/aftermath"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] font-medium shadow-card hover:bg-slate-50 transition-colors"
            >
              <span>GitLab Project</span>
              <ExternalLink className="w-3 h-3 text-[#6B7280]" />
            </a>

            <Link
              href="/time-machine"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-medium shadow-sm transition-all text-xs"
            >
              <span>Launch Lab</span>
              <Clock className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-[#E5E7EB] p-4 space-y-1 shadow-lg animate-in slide-in-from-top duration-200">
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? "bg-[#FFF7ED] text-[#F97316] font-semibold"
                      : "text-[#6B7280] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.badgeStyle}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
