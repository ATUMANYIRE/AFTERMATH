"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GitBranch,
  Clock,
  Compass,
  Cpu,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  ExternalLink,
  Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface NavigationShellProps {
  children: React.ReactNode;
}

export function NavigationShell({ children }: NavigationShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Health and Readiness queries
  const { data: health, isError: healthError } = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
    refetchInterval: 10000,
  });

  const { data: duoStatus } = useQuery({
    queryKey: ["agent-activity"],
    queryFn: api.getAgentActivity,
  });

  const navItems = [
    {
      name: "Overview",
      href: "/",
      icon: Activity,
      badge: null,
    },
    {
      name: "Release Time Machine",
      href: "/time-machine",
      icon: Clock,
      badge: "Signature",
    },
    {
      name: "Investigation Workspace",
      href: "/investigation",
      icon: Compass,
      badge: "Causal Graph",
    },
    {
      name: "Remediation Studio",
      href: "/remediation",
      icon: Wrench,
      badge: "Sandbox Fix",
    },
    {
      name: "Agent Activity",
      href: "/agent-activity",
      icon: Cpu,
      badge: duoStatus?.duo_connected ? "Live Duo" : "Unconfigured",
    },
    {
      name: "Release Control",
      href: "/release-control",
      icon: ShieldCheck,
      badge: "Gates",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#0F172A]">
      {/* Top Utility Announcement & Competition Banner */}
      <div className="bg-[#FAF8F5] border-b border-[#ECE6DA] px-4 sm:px-6 py-1.5 text-xs text-[#64748B] flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="inline-flex items-center gap-1 font-medium text-[#1E293B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] animate-pulse"></span>
            GitLab Life After Code Hackathon
          </span>
          <span className="text-[#DDD4C3]">|</span>
          <span className="hidden md:inline">
            AFTERMATH — The Release Time Machine. Every release has consequences. See them before production.
          </span>
          <span className="md:hidden">Release Time Machine</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#E2E8F0] bg-white text-[#334155]">
            <GitBranch className="w-3 h-3 text-[#1D4ED8]" />
            <span className="text-[#64748B]">active:</span>
            <span className="font-semibold text-[#0F172A]">v2.4.0-rc.3</span>
          </span>
          <div className="flex items-center gap-1.5">
            {health && !healthError ? (
              <span className="inline-flex items-center gap-1 text-[#047857]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Engine Ready</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#B45309]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connecting API...</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Product Header */}
      <header className="bg-white border-b border-[#ECE6DA] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded bg-[#0F172A] text-white flex items-center justify-center font-bold font-mono tracking-tighter text-sm group-hover:bg-[#1D4ED8] transition-colors">
                  AM
                </div>
                <div>
                  <div className="font-bold tracking-tight text-base text-[#0F172A] leading-tight flex items-center gap-1.5">
                    AFTERMATH
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#1D4ED8] font-semibold border border-[#DBEAFE]">
                      M1
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] tracking-wide leading-none hidden sm:block">
                    The Release Time Machine
                  </div>
                </div>
              </Link>

              {/* Desktop Workspace Navigation Tabs */}
              <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-[#ECE6DA]">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                        isActive
                          ? "bg-[#F7F4ED] text-[#0F172A] border border-[#DDD4C3] shadow-xs"
                          : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isActive ? "text-[#1D4ED8]" : "text-[#94A3B8]"
                        }`}
                      />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                            isActive
                              ? "bg-[#1D4ED8] text-white"
                              : "bg-[#F1F5F9] text-[#64748B]"
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

            {/* Right Meta Controls: Seed Status, GitLab Link & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-[#64748B] bg-[#FAF8F5] border border-[#ECE6DA] px-2 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
                Seeded Benchmark Fixture
              </span>

              <a
                href="https://gitlab.com/atumanyire/aftermath"
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#334155] hover:text-[#0F172A] border border-[#ECE6DA] bg-white hover:bg-[#FAF8F5] px-2.5 py-1.5 rounded transition-colors font-medium"
              >
                <span>GitLab Project</span>
                <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
              </a>

              {/* Mobile menu trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F7F4ED]"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#ECE6DA] bg-white px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded ${
                    isActive
                      ? "bg-[#F7F4ED] text-[#0F172A] border border-[#DDD4C3]"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-[#1D4ED8]" : "text-[#94A3B8]"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ECE6DA] bg-white py-4 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="font-semibold text-[#0F172A]">AFTERMATH v1.0.0</span>
            <span className="text-[#DDD4C3]">&bull;</span>
            <span>GitLab Duo Agent Integration</span>
            <span className="text-[#DDD4C3]">&bull;</span>
            <span>Milestone 1 Verified</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/time-machine" className="hover:text-[#0F172A]">
              Release Time Machine
            </Link>
            <Link href="/investigation" className="hover:text-[#0F172A]">
              Causal Graph
            </Link>
            <Link href="/release-control" className="hover:text-[#0F172A]">
              Release Gates
            </Link>
            <a
              href="https://github.com/ATUMANYIRE/AFTERMATH"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#0F172A]"
            >
              GitHub Mirror
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
