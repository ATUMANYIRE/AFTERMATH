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
    default: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
    success: "bg-[#ECFDF5] text-[#168568] border-[#A7F3D0]/60",
    warning: "bg-[#FFFBEB] text-[#D78A43] border-[#FDE68A]/60",
    error: "bg-[#FEF2F2] text-[#C74747] border-[#FECACA]/60",
    accent: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]/60",
  }[variant];

  const dotColors = {
    default: "bg-[#9CA3AF]",
    success: "bg-[#168568]",
    warning: "bg-[#D78A43]",
    error: "bg-[#C74747]",
    accent: "bg-[#F97316]",
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
