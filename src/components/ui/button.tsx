import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "brand" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#20242D]/10 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const variantStyles = {
    primary:
      "bg-[#20242D] hover:bg-[#2A303C] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-[#20242D]",
    brand:
      "bg-[#FF6A13] hover:bg-[#E55907] text-white shadow-[0_1px_2px_rgba(255,106,19,0.2)] border border-[#FF6A13]",
    secondary:
      "bg-white hover:bg-[#F9FAFB] text-[#191C24] border border-[#ECEEF1] shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
    outline:
      "bg-transparent hover:bg-slate-100/70 text-[#191C24] border border-[#ECEEF1]",
    ghost:
      "bg-transparent hover:bg-black/[0.03] text-[#747B87] hover:text-[#191C24]",
    destructive:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-rose-600",
  }[variant];

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
    md: "text-xs px-3.5 py-2 gap-2 h-9",
    lg: "text-sm px-4 py-2.5 gap-2 h-10",
  }[size];

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
