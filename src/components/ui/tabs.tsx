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
    sm: "p-0.5 text-[12px]",
    md: "p-0.5 text-[12px]",
  }[size];

  const itemSizeStyles = {
    sm: "px-2.5 py-1 gap-1.5",
    md: "px-3 py-1.5 gap-2",
  }[size];

  return (
    <div
      className={`inline-flex items-center max-w-full overflow-x-auto bg-[#F4F5F7] rounded-[10px] ${sizeStyles} ${className}`}
    >
      {options.map((option) => {
        const isActive = option.id === activeId;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`inline-flex items-center whitespace-nowrap typo-button rounded-lg transition-all duration-150 ${itemSizeStyles} ${
              isActive
                ? "bg-white text-[#191C24] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                : "text-[#747B87] hover:text-[#191C24]"
            }`}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive
                    ? "bg-[#FFF5EC] text-[#FF6A13]"
                    : "bg-[#ECEEF1] text-[#747B87]"
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
