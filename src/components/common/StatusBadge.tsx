import React from 'react';
import { EquipStatus, OcorrenciaStatus } from '../../types/database';
import { getEquipStatusConfig, getOcorrenciaStatusConfig } from '../../utils/formatters';

interface StatusBadgeProps {
  type: 'equip' | 'ocorrencia';
  status: EquipStatus | OcorrenciaStatus;
  showLed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  status,
  showLed = true,
  size = 'md',
  className = '',
  id,
}) => {
  const config =
    type === 'equip'
      ? getEquipStatusConfig(status as EquipStatus)
      : getOcorrenciaStatusConfig(status as OcorrenciaStatus);

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-medium',
  };

  const isAlert = status === 'PARADO' || status === 'AGUARDANDO_PECA';

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 rounded-full border font-body font-semibold whitespace-nowrap transition-colors ${config.badgeBg} ${sizeClasses[size]} ${className}`}
    >
      {showLed && (
        <span
          className={`led-dot ${config.ledClass} ${isAlert ? 'animate-led-pulse' : ''}`}
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};
