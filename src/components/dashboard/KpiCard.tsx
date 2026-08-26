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

  return (
    <div
      id={id}
      onClick={onClick}
      className={`h-full rounded-xl p-3 flex flex-col justify-between relative overflow-hidden transition-all duration-200 select-none ${getVariantClass()} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top row: Icon + Title & Variation badge */}
      <div className="flex items-center justify-between gap-1.5 leading-none shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="eyebrow text-[#8B949E] truncate">
            {title}
          </span>
        </div>

        {variation && (
          <div
            className={`flex items-center gap-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              variation.type === 'positive'
                ? 'bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30'
                : variation.type === 'negative'
                ? 'bg-[#F85149]/15 text-[#F85149] border border-[#F85149]/30'
                : 'bg-[#2F81F7]/15 text-[#58A6FF] border border-[#2F81F7]/30'
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
          <h3 className="kpi-number text-[28px] xl:text-[32px] text-[#E6EDF3]">
            {value}
          </h3>
          <p className="text-[11px] font-body text-[#8B949E] mt-1 font-normal truncate leading-none">
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
