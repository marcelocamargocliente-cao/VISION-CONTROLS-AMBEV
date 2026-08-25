import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { VwEvolucaoMensal } from '../../types/database';

interface AreaChartOcorrenciasProps {
  data: VwEvolucaoMensal[];
  mttrMedio: number;
}

export const AreaChartOcorrencias: React.FC<AreaChartOcorrenciasProps> = ({
  data,
  mttrMedio,
}) => {
  const [periodo, setPeriodo] = useState<'mes' | 'ano' | '6m'>('ano');

  const chartData = data && data.length > 0 ? data : [
    { mes_ano: '2026-01', mes_label: 'Jan', abertas: 12, concluidas: 14 },
    { mes_ano: '2026-02', mes_label: 'Fev', abertas: 8, concluidas: 10 },
    { mes_ano: '2026-03', mes_label: 'Mar', abertas: 9, concluidas: 8 },
    { mes_ano: '2026-04', mes_label: 'Abr', abertas: 11, concluidas: 12 },
    { mes_ano: '2026-05', mes_label: 'Mai', abertas: 6, concluidas: 7 },
    { mes_ano: '2026-06', mes_label: 'Jun', abertas: 14, concluidas: 13 },
    { mes_ano: '2026-07', mes_label: 'Jul', abertas: 7, concluidas: 9 },
    { mes_ano: '2026-08', mes_label: 'Ago', abertas: 4, concluidas: 3 },
  ];

  const totalAbertas = chartData.reduce((acc, curr) => acc + curr.abertas, 0);
  const mediaMensal = (totalAbertas / Math.max(1, chartData.length)).toFixed(1);

  const maxAbertas = [...chartData].sort((a, b) => b.abertas - a.abertas)[0];
  const minAbertas = [...chartData].sort((a, b) => a.abertas - b.abertas)[0];

  return (
    <div className="bg-[#111827] border border-blue-500/15 rounded-lg p-3 flex flex-col justify-between shadow-lg h-full w-full overflow-hidden">
      {/* Header (shrink-0: título, número e seletores) */}
      <div className="flex items-center justify-between gap-2 shrink-0 h-[36px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[13px] font-bold text-[#F9FAFB] truncate">Análise de Ocorrências</h2>
            <div className="group relative">
              <Info className="w-3 h-3 text-gray-500 cursor-help" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block bg-slate-900 border border-slate-700 text-[10px] text-gray-300 p-1.5 rounded shadow-lg w-44 z-30">
                Histórico temporal de ordens de serviço abertas e concluídas.
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 border-l border-white/[0.08] pl-3">
            <span className="text-[26px] xl:text-[28px] font-bold text-[#F9FAFB] tracking-tight leading-none font-sans">
              {totalAbertas}
            </span>
            <div className="hidden sm:flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 leading-none">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>+12.5%</span>
            </div>
            <span className="hidden md:inline text-[10px] text-gray-400">total no período</span>
          </div>
        </div>

        {/* Seletores 24px altura, fonte 11px */}
        <div className="flex items-center bg-[#0A0E1A] p-0.5 rounded-md border border-blue-500/20 shrink-0">
          <button
            onClick={() => setPeriodo('mes')}
            className={`h-[24px] px-2 text-[11px] font-medium rounded transition-all leading-none ${
              periodo === 'mes'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriodo('6m')}
            className={`h-[24px] px-2 text-[11px] font-medium rounded transition-all leading-none ${
              periodo === '6m'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            6 Meses
          </button>
          <button
            onClick={() => setPeriodo('ano')}
            className={`h-[24px] px-2 text-[11px] font-medium rounded transition-all leading-none ${
              periodo === 'ano'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Este Ano
          </button>
        </div>
      </div>

      {/* Area Chart: flex-1 min-h-0 para crescer e preencher o espaço vertical perfeitamente */}
      <div className="w-full flex-1 min-h-0 my-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradientBlueCompact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />

            <XAxis
              dataKey="mes_label"
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              height={18}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#0A0E1A] border border-blue-500/30 rounded p-2 shadow-xl backdrop-blur-md text-[11px]">
                      <p className="font-bold text-gray-200 mb-1">{label}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-3 text-blue-400">
                          <span>Abertas:</span>
                          <span className="font-mono font-bold text-white">{payload[0]?.value}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-emerald-400">
                          <span>Concluídas:</span>
                          <span className="font-mono font-bold text-white">{payload[1]?.value}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="abertas"
              name="Abertas"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#areaGradientBlueCompact)"
              dot={{ r: 2.5, fill: '#3B82F6', strokeWidth: 1, stroke: '#FFFFFF' }}
              activeDot={{ r: 5, fill: '#3B82F6', stroke: '#FFFFFF', strokeWidth: 1.5 }}
            />

            <Area
              type="monotone"
              dataKey="concluidas"
              name="Concluídas"
              stroke="#10B981"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              fill="none"
              dot={{ r: 2, fill: '#10B981' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer (shrink-0, h-[32px]): 4 Stats inline numa única linha sem card separado, fonte 11px */}
      <div className="h-[32px] pt-1 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-gray-500 font-medium">Média:</span>
          <span className="font-bold font-mono text-gray-200">{mediaMensal} OS/mês</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-gray-500 font-medium">Pior Mês:</span>
          <span className="font-bold font-mono text-red-400">
            {maxAbertas?.mes_label || 'Jun'} ({maxAbertas?.abertas || 14})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-gray-500 font-medium">Melhor Mês:</span>
          <span className="font-bold font-mono text-emerald-400">
            {minAbertas?.mes_label || 'Ago'} ({minAbertas?.abertas || 4})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-gray-500 font-medium">MTTR Médio:</span>
          <span className="font-bold font-mono text-blue-400">{mttrMedio} dias</span>
        </div>
      </div>
    </div>
  );
};
