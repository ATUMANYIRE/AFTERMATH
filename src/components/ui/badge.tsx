import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "accent" | "neutral";
  dot?: boolean;
}

export function Badge({
  variant = "default",
  dot = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#F0F1F3] text-[#747B87] border-[#ECEEF1]",
    neutral: "bg-[#F0F1F3] text-[#747B87] border-transparent",
    success: "bg-[#F0FDF4] text-[#22C55E] border-[#DCFCE7]",
    warning: "bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]",
    error: "bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]",
    accent: "bg-[#FFF5EC] text-[#FF6A13] border-[#FFE2CC]",
  }[variant];

  const dotColors = {
    default: "bg-[#969CA6]",
    neutral: "bg-[#969CA6]",
    success: "bg-[#22C55E]",
    warning: "bg-[#D97706]",
    error: "bg-[#DC2626]",
    accent: "bg-[#FF6A13]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${variantStyles} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />
      )}
      {children}
    </span>
  );
}
