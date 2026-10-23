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
    success: "bg-[#F4F5F7] text-[#747B87]",
    warning: "bg-[#FFF5EC] text-[#FF6A13]",
    error: "bg-[#F0F1F3] text-[#747B87]",
    accent: "bg-[#FFF5EC] text-[#FF6A13]",
  }[tagVariant];

  return (
    <div
      className={`bg-white rounded-[13px] border border-[#ECEEF1] p-5 flex flex-col justify-between ${className}`}
    >
      <div>
                <h4 className="typo-card-heading text-[#747B87] mb-1">
          {title}
        </h4>
        <div className="flex items-baseline gap-2 mb-1.5 whitespace-nowrap min-h-[48px]">
          {(() => {
            const str = String(value);
            const m = str.match(/^(\$?\d[\d.,]*(?:%|ms|x)?)(?:\s+(.+))?$/);
            if (m && m[1].length <= 9) {
              return (
                <>
                  <span className="typo-metric-primary text-[#191C24]">{m[1]}</span>
                  {m[2] && <span className="typo-description text-[#747B87] self-end pb-[11px]">{m[2]}</span>}
                </>
              );
            }
            return (
              <span
                className={`text-[#191C24] ${
                  str.length > 14
                    ? "text-[20px] leading-[48px] tracking-[-0.5px]"
                    : "typo-metric-secondary leading-[48px]"
                }`}
              >
                {str}
              </span>
            );
          })()}
        </div>
        {delta && (
          <div className="flex items-center gap-1.5 typo-description">
            <span
              className={
                delta.isRisk
                  ? "text-[#FF6A13]"
                  : delta.isPositive
                  ? "text-[#747B87]"
                  : "text-[#747B87]"
              }
            >
              {delta.value}
            </span>
          </div>
        )}
        {description && (
          <p className="typo-description text-[#747B87] mt-1">
            {description}
          </p>
        )}
      </div>

      {subStats && subStats.length > 0 && (
        <div className="mt-5 pt-3 border-t border-[#ECEEF1] space-y-1.5">
          {subStats.map((sub, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3">
              <span className="typo-card-footer-label text-[#747B87] whitespace-nowrap">
                {sub.label}
              </span>
              <span className="typo-body text-[#191C24] text-right whitespace-nowrap">
                {sub.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
