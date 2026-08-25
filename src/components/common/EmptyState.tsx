import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = '',
  id,
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-8 text-center bg-[#1C222A] border border-[#2C343E] rounded-[4px] my-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-[4px] bg-[#14181D] border border-[#2C343E] flex items-center justify-center text-[#F5A623] mb-3 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-condensed font-semibold tracking-wide text-[#ECEFF1] uppercase">
        {title}
      </h3>
      <p className="text-xs text-[#94A3B8] max-w-md mt-1 mb-4 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <>
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[4px] bg-[#F5A623] hover:bg-[#D98E1A] text-[#14181D] transition-colors"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[4px] bg-[#F5A623] hover:bg-[#D98E1A] text-[#14181D] transition-colors"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
};
