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
    default: "bg-[#F1F5F9] text-[#667085]",
    success: "bg-[#ECFDF5] text-[#168568] border border-[#A7F3D0]/60",
    warning: "bg-[#FFFBEB] text-[#D78A43] border border-[#FDE68A]/60",
    error: "bg-[#FEF2F2] text-[#C74747] border border-[#FECACA]/60",
    accent: "bg-[#EFF4FE] text-[#3558D4] border border-[#BFD5FB]/60",
  }[tagVariant];

  return (
    <div
      className={`bg-white rounded-2xl border border-[#DCE2EB] p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between ${className}`}
    >
      <div>
        {tag && (
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${tagBg}`}
            >
              {tag}
            </span>
          </div>
        )}
        <h4 className="text-sm font-medium text-[#667085] tracking-normal mb-1.5">
          {title}
        </h4>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl lg:text-4xl font-bold text-[#172033] tracking-tight">
            {value}
          </span>
        </div>
        {delta && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span
              className={
                delta.isRisk
                  ? "text-[#C74747]"
                  : delta.isPositive
                  ? "text-[#168568]"
                  : "text-[#667085]"
              }
            >
              {delta.value}
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-[#667085] leading-relaxed mt-1">
            {description}
          </p>
        )}
      </div>

      {subStats && subStats.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#DCE2EB]/70 grid grid-cols-2 gap-4">
          {subStats.map((sub, i) => (
            <div key={i}>
              <span className="block text-[11px] font-medium text-[#667085] uppercase tracking-wider">
                {sub.label}
              </span>
              <span className="block text-sm font-semibold text-[#172033] mt-0.5">
                {sub.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
