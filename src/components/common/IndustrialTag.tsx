import React from 'react';

interface IndustrialTagProps {
  tag: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export const IndustrialTag: React.FC<IndustrialTagProps> = ({
  tag,
  size = 'md',
  className = '',
  id,
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 tracking-wider',
    md: 'text-xs px-2.5 py-1 tracking-widest',
    lg: 'text-sm px-3.5 py-1.5 tracking-widest font-bold',
  };

  return (
    <span
      id={id || `tag-${tag}`}
      className={`tag-badge select-all ${sizeClasses[size]} ${className}`}
      title={`TAG de Identificação: ${tag}`}
    >
      <span className="opacity-60 text-[9px] mr-1 font-mono tracking-normal">TAG</span>
      {tag}
    </span>
  );
};
