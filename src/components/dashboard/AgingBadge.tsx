import React from 'react';

interface AgingBadgeProps {
  dias: number;
  showIcon?: boolean;
}

export const AgingBadge: React.FC<AgingBadgeProps> = ({ dias, showIcon = true }) => {
  if (dias > 15) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F85149]/10 text-[#F85149] border border-[#F85149]/20 leading-none">
        {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-[#F85149]" />}
        <span>{dias}d parado</span>
      </span>
    );
  }

  if (dias > 7) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#D29922]/10 text-[#D29922] border border-[#D29922]/20 leading-none">
        {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-[#D29922]" />}
        <span>{dias}d parado</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white text-[#6B7280] border border-[#E5E7EB] leading-none">
      {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-[#484F58]" />}
      <span>{dias}d</span>
    </span>
  );
};
