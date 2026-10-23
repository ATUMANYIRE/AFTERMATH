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
    default: "bg-[#F4F5F7] text-[#747B87] border-transparent",
    neutral: "bg-[#F0F1F3] text-[#747B87] border-transparent",
    success: "bg-[#F4F5F7] text-[#747B87] border-transparent",
    warning: "bg-[#FFF5EC] text-[#FF6A13] border-transparent",
    error: "bg-[#FFF5EC] text-[#FF6A13] border-transparent",
    accent: "bg-[#FFF5EC] text-[#FF6A13] border-transparent",
  }[variant];

  const dotColors = {
    default: "bg-[#969CA6]",
    neutral: "bg-[#969CA6]",
    success: "bg-[#191C24]/40",
    warning: "bg-[#FFF5EC] text-[#FF6A13] border-transparent",
    error: "bg-[#FF6A13]",
    accent: "bg-[#FF6A13]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap gap-1.5 px-2 py-0.5 rounded-full typo-badge border ${variantStyles} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />
      )}
      {children}
    </span>
  );
}
