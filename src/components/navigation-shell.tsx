"use client";

import React, { useEffect, useRef, useState } from "react";
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
  BookOpen,
  GitBranch,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

interface NavigationShellProps {
  children: React.ReactNode;
}

export function NavigationShell({ children }: NavigationShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      badge: null,
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
      <aside className="hidden md:flex flex-col w-[212px] shrink-0 bg-[#F9FAFB] border-r border-[#ECEEF1] h-screen sticky top-0 px-3 py-5 justify-between select-none">
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
              ref={searchRef}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F0F1F3] text-[#191C24] placeholder-[#969CA6] text-[12px] rounded-[10px] pl-8 pr-7 py-2 border border-transparent focus:border-[#ECEEF1] focus:bg-white focus:outline-none transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-sans text-[#969CA6] bg-white border border-[#ECEEF1] px-1.5 py-0.2 rounded shadow-2xs pointer-events-none">
              /
            </span>
          </div>

          {/* Navigation Items (Clean outline icons, white active pill, consistent spacing) */}
          <nav className="space-y-0.5">
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
                  className={`flex items-center justify-between px-3 py-2 rounded-[10px] typo-nav transition-all ${
                    isActive
                      ? "bg-white text-[#191C24] border border-[#ECEEF1]"
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
                    <span className="typo-badge px-1.5 py-0.5 rounded-full bg-[#FF6A13] text-white leading-none">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: current release + helpful shortcuts, styled like the nav */}
        <div className="space-y-2">
          <div className="rounded-[10px] border border-[#ECEEF1] bg-white px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="typo-description text-[#747B87]">Current release</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A13]" title="Under review" />
            </div>
            <div className="typo-body text-[#191C24]">rel-2026-001</div>
          </div>
          <div className="space-y-0.5 border-t border-[#ECEEF1] pt-2">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] typo-nav text-[#747B87] hover:text-[#191C24] hover:bg-black/[0.02] transition-colors"
            >
              <BookOpen className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>API docs</span>
              <ExternalLink className="w-3 h-3 ml-auto text-[#969CA6]" />
            </a>
            <a
              href="https://gitlab.com/atumanyire-labs/aftermath"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] typo-nav text-[#747B87] hover:text-[#191C24] hover:bg-black/[0.02] transition-colors"
            >
              <GitBranch className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>GitLab repo</span>
              <ExternalLink className="w-3 h-3 ml-auto text-[#969CA6]" />
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] ${
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
                    <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#FF6A13] text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Main Workspace Viewport (Matches SpendHub page padding: 26px - 32px) */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
