import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { SparklineChart } from './SparklineChart';

export interface KpiCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconBg: string; // e.g. "bg-blue-500/15 text-[#3B82F6]"
  sparklineColor: string; // e.g. "#3B82F6"
  sparklineData: number[];
  variation?: {
    text: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  variant?: 'default' | 'danger' | 'warning' | 'success';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  sparklineColor,
  sparklineData,
  variation,
  variant = 'default',
  onClick,
}) => {
  const isDanger = variant === 'danger';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`h-full rounded-lg p-3 flex flex-col justify-between relative overflow-hidden transition-all duration-150 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${isDanger ? 'kpi-card-danger' : 'kpi-card-gradient'}`}
    >
      {/* Top row: Icon + Title & Variation badge */}
      <div className="flex items-center justify-between gap-1.5 leading-none shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">
            {title}
          </span>
        </div>

        {variation && (
          <div
            className={`flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
              variation.type === 'positive'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : variation.type === 'negative'
                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
            }`}
          >
            {variation.type === 'positive' ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : variation.type === 'negative' ? (
              <TrendingDown className="w-2.5 h-2.5" />
            ) : null}
            <span>{variation.text}</span>
          </div>
        )}
      </div>

      {/* Middle row: Big Number + Subtitle + Sparkline in grid */}
      <div className="flex items-end justify-between gap-2 mt-1">
        <div className="min-w-0">
          <h3 className="text-[26px] xl:text-[28px] font-bold tracking-tight text-[#F9FAFB] font-sans leading-none">
            {value}
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 font-normal truncate leading-none">
            {subtitle}
          </p>
        </div>

        <div className="w-[85px] h-[28px] shrink-0">
          <SparklineChart data={sparklineData} color={sparklineColor} height={28} />
        </div>
      </div>
    </div>
  );
};
