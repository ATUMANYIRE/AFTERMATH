import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
}

export function BrandLogo({
  size = "md",
  showWordmark = true,
  className = "",
}: BrandLogoProps) {
  const sizeMap = {
    sm: { icon: 24, text: "text-sm", sub: "text-[10px]" },
    md: { icon: 34, text: "text-base", sub: "text-xs" },
    lg: { icon: 42, text: "text-lg", sub: "text-xs" },
    xl: { icon: 56, text: "text-2xl", sub: "text-sm" },
  };

  const { icon, text, sub } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Origami Temporal Hexagon Mark */}
      <div className="shrink-0 transition-transform duration-200 hover:scale-105">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="am-brand-facet1" x1="5" y1="5" x2="35" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FFA24A" />
              <stop offset="50%" stop-color="#FF701C" />
              <stop offset="100%" stop-color="#F2540C" />
            </linearGradient>
            <linearGradient id="am-brand-facet2" x1="5" y1="20" x2="35" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#F04D10" />
              <stop offset="100%" stop-color="#BD2C00" />
            </linearGradient>
            <linearGradient id="am-brand-specular" x1="10" y1="4" x2="30" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
            </linearGradient>
          </defs>

          {/* Upper Origami Ribbon (Forward Consequence Trajectory) */}
          <path
            d="M18.8 3.5C20.6 2.6 22.8 3.0 24.2 4.4L33.9 14.1C35.3 15.5 35.6 17.6 34.6 19.3L30.5 26.2C29.8 27.3 28.3 27.5 27.4 26.5L16.8 15.2C15.6 14.0 13.8 13.6 12.2 14.4L7.5 16.8C6.4 17.3 5.2 16.5 5.3 15.3L5.8 11.2C6.1 9.0 7.6 7.1 9.7 6.2L18.8 3.5Z"
            fill="url(#am-brand-facet1)"
          />
          {/* Top Facet Sheen */}
          <path
            d="M18.8 3.5L24.2 4.4L33.9 14.1C35.3 15.5 35.6 17.6 34.6 19.3L28.0 20.0L18.0 10.0L9.7 6.2L18.8 3.5Z"
            fill="url(#am-brand-specular)"
          />
          {/* Lower Origami Ribbon (Automated Invariant Remediator) */}
          <path
            d="M6.0 18.5C6.7 17.3 8.2 16.9 9.3 17.7L20.2 25.2C21.6 26.2 23.6 26.0 24.8 24.7L31.8 16.8C32.6 15.8 34.1 15.8 34.8 16.9L35.2 17.5C36.2 19.0 36.1 21.0 34.9 22.5L28.0 31.5C26.7 33.2 24.6 34.1 22.5 33.8L13.2 32.5C11.1 32.2 9.3 30.8 8.4 28.9L5.2 22.2C4.5 20.8 4.9 19.2 6.0 18.5Z"
            fill="url(#am-brand-facet2)"
          />
        </svg>
      </div>

      {/* Typography */}
      {showWordmark && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-[#111827] leading-none ${text}`}>
              AFTERMATH
            </span>
            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#F4F5F7] text-[#6B7280]">
              v2.4
            </span>
          </div>
          <span className={`text-[#6B7280] font-normal tracking-normal truncate leading-tight mt-0.5 ${sub}`}>
            The Release Time Machine
          </span>
        </div>
      )}
    </div>
  );
}
