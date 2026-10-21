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
  ShieldAlert,
  Activity,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Settings,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

  const { data: agentActivity } = useQuery({
    queryKey: ["agent-activity"],
    queryFn: api.getAgentActivity,
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
      badge: "5 Faults",
      badgeVariant: "accent" as const,
    },
    {
      name: "Investigation",
      href: "/investigation",
      icon: Compass,
      badge: "Causal Graph",
      badgeVariant: "default" as const,
    },
    {
      name: "Remediation Studio",
      href: "/remediation",
      icon: Wrench,
      badge: "Sandbox",
      badgeVariant: "success" as const,
    },
    {
      name: "Release Control",
      href: "/release-control",
      icon: ShieldCheck,
      badge: "Superposition",
      badgeVariant: "default" as const,
    },
    {
      name: "Agent Activity",
      href: "/agent-activity",
      icon: Cpu,
      badge: agentActivity?.duo_connected ? "Live Duo" : "Benchmark",
      badgeVariant: agentActivity?.duo_connected ? "success" : "warning",
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[#FAF9F6] text-[#172033] antialiased">
      {/* =========================================================================
          1. PERSISTENT DESKTOP SIDEBAR (256px wide, inspired by reference design)
          ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#FAF9F6] border-r border-[#DCE2EB] h-screen sticky top-0 px-4 py-5 justify-between select-none">
        <div>
          {/* Brand Identity Header */}
          <Link
            href="/"
            className="flex items-center gap-3 px-2 py-1 mb-6 group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3558D4] to-[#4F75F2] flex items-center justify-center text-white shadow-sm shadow-[#3558D4]/20 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-[#172033]">
                  AFTERMATH
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#EFF4FE] text-[#3558D4]">
                  v0.2
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#667085] leading-tight">
                The Release Time Machine
              </p>
            </div>
          </Link>

          {/* Quick Search Pill (Inspired by reference search bar) */}
          <div className="relative mb-5 px-1">
            <Search className="w-4 h-4 text-[#667085] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F1F5F9] text-[#172033] placeholder-[#667085] text-xs rounded-xl pl-9 pr-8 py-2 border border-transparent focus:border-[#DCE2EB] focus:bg-white focus:outline-none transition-all"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#667085] bg-white border border-[#DCE2EB] px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
              /
            </span>
          </div>

          {/* Navigation Links */}
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-[#172033] font-semibold shadow-card border border-[#DCE2EB]"
                      : "text-[#667085] hover:text-[#172033] hover:bg-white/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-[#3558D4]" : "text-[#667085]"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.badgeVariant === "accent"
                          ? "bg-[#EFF4FE] text-[#3558D4]"
                          : item.badgeVariant === "success"
                          ? "bg-[#ECFDF5] text-[#168568]"
                          : item.badgeVariant === "warning"
                          ? "bg-[#FFFBEB] text-[#D78A43]"
                          : "bg-slate-100 text-[#667085]"
                      }`}
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
        <div className="pt-4 border-t border-[#DCE2EB]/80 space-y-3">
          {/* Active Target Release Badge */}
          <div className="bg-white rounded-xl p-3 border border-[#DCE2EB] shadow-card">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#172033] flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[#3558D4]" />
                Target Release
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-[#C74747] font-semibold border border-rose-100">
                HIGH RISK
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#667085] truncate">
              rel-2026-001 (a8f9c21b4d08)
            </p>
            <div className="mt-2 pt-2 border-t border-[#DCE2EB]/60 flex items-center justify-between text-[11px]">
              <span className="text-[#667085]">Financial At-Risk</span>
              <span className="font-bold text-[#C74747]">$1,500.00</span>
            </div>
          </div>

          {/* System & API Probes Indicator */}
          <div className="px-2 flex items-center justify-between text-xs text-[#667085]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#168568] animate-pulse" />
              <span className="text-[11px] font-medium text-[#172033]">
                {health?.status === "ok" ? "Backend Nominal" : "Connecting..."}
              </span>
            </div>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] hover:text-[#3558D4] flex items-center gap-1 transition-colors"
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
        <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#DCE2EB] h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-slate-100 focus:outline-none"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb / Workspace Name */}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-[#172033]">AFTERMATH</span>
              <span className="text-[#DCE2EB]">/</span>
              <span className="text-[#667085] capitalize">
                {pathname === "/" ? "Executive Overview" : pathname?.replace("/", "").replace("-", " ")}
              </span>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#DCE2EB] text-[#667085] font-medium shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3558D4]" />
              GitLab Life After Code Hackathon
            </span>

            <a
              href="https://gitlab.com/atumanyire-labs/aftermath"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE2EB] text-[#172033] font-medium shadow-card hover:bg-slate-50 transition-colors"
            >
              <span>GitLab Project</span>
              <ExternalLink className="w-3 h-3 text-[#667085]" />
            </a>

            <Link
              href="/time-machine"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#3558D4] hover:bg-[#2846B4] text-white font-medium shadow-sm transition-all text-xs"
            >
              <span>Launch Lab</span>
              <Clock className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-[#DCE2EB] p-4 space-y-1 shadow-lg animate-in slide-in-from-top duration-200">
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
                      ? "bg-[#EFF4FE] text-[#3558D4] font-semibold"
                      : "text-[#667085] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#667085]">
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
