import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
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
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#3558D4]/20 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const variantStyles = {
    primary:
      "bg-[#3558D4] hover:bg-[#2846B4] text-white shadow-sm border border-[#3558D4]",
    secondary:
      "bg-white hover:bg-slate-50 text-[#172033] border border-[#DCE2EB] shadow-card",
    outline:
      "bg-transparent hover:bg-slate-100/70 text-[#172033] border border-[#DCE2EB]",
    ghost:
      "bg-transparent hover:bg-slate-100/80 text-[#667085] hover:text-[#172033]",
    destructive:
      "bg-[#C74747] hover:bg-[#A83838] text-white shadow-sm border border-[#C74747]",
  }[variant];

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
    md: "text-sm px-4 py-2 gap-2 h-10",
    lg: "text-base px-5 py-2.5 gap-2.5 h-12",
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
