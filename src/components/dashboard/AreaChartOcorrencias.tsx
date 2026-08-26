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
import { Info } from 'lucide-react';
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
    <div className="bg-[#13181F] border border-[#21262D] rounded-xl p-3 flex flex-col justify-between h-full w-full overflow-hidden select-none">
      {/* Header (shrink-0: título, número e seletores) */}
      <div className="flex items-center justify-between gap-2 shrink-0 h-[36px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[13px] font-bold text-[#E6EDF3] tracking-tight truncate">
              Análise de Ocorrências
            </h2>
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-[#484F58] hover:text-[#8B949E] transition-colors cursor-help" />
              <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block bg-[#1A1F28] border border-[#21262D] text-[10px] text-[#8B949E] p-2 rounded-lg shadow-lg w-48 z-30">
                Histórico temporal de ordens de serviço e taxa de abertura de ocorrências.
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-1.5 border-l border-[#21262D] pl-3">
            <span className="text-[26px] xl:text-[28px] font-extrabold text-[#E6EDF3] tracking-tight leading-none font-sans">
              {totalAbertas}
            </span>
            <span className="hidden md:inline text-[10px] font-body text-[#8B949E]">
              total no período
            </span>
          </div>
        </div>

        {/* Seletores discretos */}
        <div className="flex items-center bg-[#1A1F28] p-0.5 rounded-lg border border-[#21262D] shrink-0">
          <button
            onClick={() => setPeriodo('mes')}
            className={`h-[24px] px-2.5 text-[11px] font-medium rounded-md transition-all leading-none ${
              periodo === 'mes'
                ? 'bg-[#21262D] text-[#E6EDF3] font-semibold shadow-xs'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriodo('6m')}
            className={`h-[24px] px-2.5 text-[11px] font-medium rounded-md transition-all leading-none ${
              periodo === '6m'
                ? 'bg-[#21262D] text-[#E6EDF3] font-semibold shadow-xs'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            6 Meses
          </button>
          <button
            onClick={() => setPeriodo('ano')}
            className={`h-[24px] px-2.5 text-[11px] font-medium rounded-md transition-all leading-none ${
              periodo === 'ano'
                ? 'bg-[#21262D] text-[#E6EDF3] font-semibold shadow-xs'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            Este Ano
          </button>
        </div>
      </div>

      {/* Area Chart: flex-1 min-h-0 */}
      <div className="w-full flex-1 min-h-0 my-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="gradOcorrenciasClean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2F81F7" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2F81F7" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(255, 255, 255, 0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="mes_label"
              tickLine={false}
              axisLine={{ stroke: '#21262D' }}
              tick={{ fill: '#8B949E', fontSize: 10 }}
              height={18}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#21262D' }}
              tick={{ fill: '#8B949E', fontSize: 10 }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#1A1F28] border border-[#21262D] rounded-lg p-2 shadow-xl text-[11px]">
                      <p className="font-semibold text-[#8B949E] mb-1">{label}</p>
                      <div className="flex items-center justify-between gap-3 text-[#58A6FF]">
                        <span>Abertas:</span>
                        <span className="font-mono font-bold text-[#E6EDF3]">{payload[0]?.value}</span>
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
              stroke="#2F81F7"
              strokeWidth={1.5}
              fill="url(#gradOcorrenciasClean)"
              dot={false}
              activeDot={{ r: 3, fill: '#2F81F7', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer: Estatísticas inline separadas por · */}
      <div className="h-[28px] pt-1.5 border-t border-[#21262D] flex items-center justify-between text-[11px] text-[#8B949E] shrink-0 font-body">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-[#8B949E] font-medium tracking-wider">Média:</span>
          <span className="font-bold font-mono text-[#E6EDF3]">{mediaMensal} OS/mês</span>
        </div>
        <span className="text-[#484F58]">·</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-[#8B949E] font-medium tracking-wider">Pior Mês:</span>
          <span className="font-bold font-mono text-[#E6EDF3]">
            {maxAbertas?.mes_label || 'Jun'} ({maxAbertas?.abertas || 14})
          </span>
        </div>
        <span className="text-[#484F58]">·</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-[#8B949E] font-medium tracking-wider">Melhor Mês:</span>
          <span className="font-bold font-mono text-[#E6EDF3]">
            {minAbertas?.mes_label || 'Ago'} ({minAbertas?.abertas || 4})
          </span>
        </div>
        <span className="text-[#484F58]">·</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-[#8B949E] font-medium tracking-wider">MTTR Médio:</span>
          <span className="font-bold font-mono text-[#E6EDF3]">{mttrMedio} dias</span>
        </div>
      </div>
    </div>
  );
};
