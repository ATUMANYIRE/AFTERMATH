import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "accent";
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
    default: "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]",
    success: "bg-[#ECFDF5] text-[#168568] border-[#A7F3D0]/60",
    warning: "bg-[#FFFBEB] text-[#D78A43] border-[#FDE68A]/60",
    error: "bg-[#FEF2F2] text-[#C74747] border-[#FECACA]/60",
    accent: "bg-[#EFF4FE] text-[#3558D4] border-[#BFD5FB]/60",
  }[variant];

  const dotColors = {
    default: "bg-[#94A3B8]",
    success: "bg-[#168568]",
    warning: "bg-[#D78A43]",
    error: "bg-[#C74747]",
    accent: "bg-[#3558D4]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />
      )}
      {children}
    </span>
  );
}
