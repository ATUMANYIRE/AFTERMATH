import React from "react";

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface SegmentedTabsProps {
  options: TabOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedTabs({
  options,
  activeId,
  onChange,
  className = "",
  size = "md",
}: SegmentedTabsProps) {
  const sizeStyles = {
    sm: "p-0.5 text-xs",
    md: "p-1 text-sm",
  }[size];

  const itemSizeStyles = {
    sm: "px-2.5 py-1 gap-1.5",
    md: "px-3.5 py-1.5 gap-2",
  }[size];

  return (
    <div
      className={`inline-flex items-center bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] ${sizeStyles} ${className}`}
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`inline-flex items-center font-medium rounded-lg transition-all duration-150 ${itemSizeStyles} ${
              isActive
                ? "bg-white text-[#111827] shadow-sm font-semibold"
                : "text-[#6B7280] hover:text-[#111827] hover:bg-white/50"
            }`}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive
                    ? "bg-[#FFF7ED] text-[#EA580C]"
                    : "bg-slate-200 text-[#6B7280]"
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
