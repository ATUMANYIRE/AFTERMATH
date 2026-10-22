import React from "react";

interface SubStat {
  label: string;
  value: string | number;
}

interface StatCardProps {
  tag?: string;
  tagVariant?: "default" | "success" | "warning" | "error" | "accent";
  title: string;
  value: string | number;
  delta?: {
    value: string;
    isPositive?: boolean;
    isRisk?: boolean;
  };
  description?: string;
  subStats?: SubStat[];
  className?: string;
}

export function StatCard({
  tag,
  tagVariant = "default",
  title,
  value,
  delta,
  description,
  subStats,
  className = "",
}: StatCardProps) {
  const tagBg = {
    default: "bg-[#F0F1F3] text-[#747B87]",
    success: "bg-[#F0FDF4] text-[#22C55E]",
    warning: "bg-[#FFFBEB] text-[#D97706]",
    error: "bg-[#F0F1F3] text-[#747B87]",
    accent: "bg-[#FFF5EC] text-[#FF6A13]",
  }[tagVariant];

  return (
    <div
      className={`bg-white rounded-2xl border border-[#ECEEF1] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all flex flex-col justify-between ${className}`}
    >
      <div>
        {tag && (
          <div className="mb-3">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${tagBg}`}
            >
              {tag}
            </span>
          </div>
        )}
        <h4 className="text-[13px] font-normal text-[#747B87] tracking-normal mb-1">
          {title}
        </h4>
        <div className="flex items-baseline gap-2 mb-1.5">
          <span
            className={`font-semibold text-[#191C24] tracking-tight leading-tight break-words ${
              typeof value === "string" && value.length > 14
                ? "text-[20px] lg:text-[22px]"
                : typeof value === "string" && value.length > 8
                ? "text-[24px] lg:text-[28px]"
                : "text-[32px] lg:text-[36px]"
            }`}
          >
            {value}
          </span>
        </div>
        {delta && (
          <div className="flex items-center gap-1.5 text-xs font-normal">
            <span
              className={
                delta.isRisk
                  ? "text-[#FF6A13]"
                  : delta.isPositive
                  ? "text-[#22C55E]"
                  : "text-[#747B87]"
              }
            >
              {delta.value}
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-[#747B87] leading-relaxed mt-1">
            {description}
          </p>
        )}
      </div>

      {subStats && subStats.length > 0 && (
        <div className="mt-5 pt-3.5 border-t border-[#ECEEF1] grid grid-cols-2 gap-4">
          {subStats.map((sub, i) => (
            <div key={i}>
              <span className="block text-[11px] font-normal text-[#747B87]">
                {sub.label}
              </span>
              <span className="block text-sm font-semibold text-[#191C24] mt-0.5">
                {sub.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
