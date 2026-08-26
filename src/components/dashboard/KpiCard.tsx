import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { SparklineChart } from './SparklineChart';

export interface KpiCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconBg?: string;
  sparklineColor: string;
  sparklineData: number[];
  variation?: {
    text: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning';
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
  sparklineColor,
  sparklineData,
  variation,
  variant = 'default',
  onClick,
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'danger':
        return 'kpi-card red';
      case 'warning':
        return 'kpi-card amber';
      case 'success':
        return 'kpi-card green';
      default:
        return 'kpi-card';
    }
  };

  const getBadgeClass = () => {
    if (!variation) return '';
    switch (variation.type) {
      case 'positive':
        if (variant === 'success') {
          return 'bg-[#3FB950]/10 text-[#3FB950] border-emerald-500/20';
        }
        return 'bg-[#1A1F28] text-[#8B949E] border-[#21262D]';
      case 'negative':
        return 'bg-[#F85149]/10 text-[#F85149] border-red-500/20';
      case 'warning':
        return 'bg-[#D29922]/10 text-[#D29922] border-amber-500/20';
      case 'neutral':
      default:
        return 'bg-[#1A1F28] text-[#8B949E] border-[#21262D]';
    }
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`h-full rounded-xl p-3 flex flex-col justify-between relative overflow-hidden transition-all duration-200 select-none ${getVariantClass()} ${
        onClick ? 'cursor-pointer hover:border-[#30363D]' : ''
      }`}
    >
      {/* Top row: Icon + Title & Variation badge */}
      <div className="flex items-center justify-between gap-1.5 leading-none shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="w-4 h-4 kpi-icon shrink-0" />
          <span className="text-[10px] font-body font-bold text-[#8B949E] uppercase tracking-wider truncate">
            {title}
          </span>
        </div>

        {variation && (
          <div
            className={`flex items-center gap-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded border leading-none shrink-0 ${getBadgeClass()}`}
          >
            {variation.type === 'positive' && variant === 'success' ? (
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
          <h3 className="kpi-number text-[28px] xl:text-[32px] font-extrabold text-[#E6EDF3] leading-none">
            {value}
          </h3>
          <p className="text-[11px] font-body text-[#8B949E] mt-1.5 font-normal truncate leading-none">
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
