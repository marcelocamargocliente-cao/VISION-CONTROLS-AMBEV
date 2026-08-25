import React from 'react';

interface AgingBadgeProps {
  dias: number;
  showIcon?: boolean;
}

export const AgingBadge: React.FC<AgingBadgeProps> = ({ dias, showIcon = true }) => {
  if (dias > 15) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
        {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_#EF4444]" />}
        <span>{dias}d parado</span>
      </span>
    );
  }

  if (dias > 7) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
        {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
        <span>{dias}d parado</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800/60 text-gray-300 border border-slate-700">
      {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
      <span>{dias}d</span>
    </span>
  );
};
