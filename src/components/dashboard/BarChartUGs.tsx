import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import { VwStatusPorUg, VwAgingParadas } from '../../types/database';
import { AgingBadge } from './AgingBadge';

interface BarChartUGsProps {
  statusUg: VwStatusPorUg[];
  agingParadas: VwAgingParadas[];
}

// Abrevia nomes longos de área para caber no eixo X
const abreviaArea = (nome: string): string => {
  if (!nome || nome === 'SEM ÁREA') return 'S/Á';
  const upper = nome.toUpperCase();
  if (upper.includes('RETORN'))                          return 'RET.';
  if (upper.includes('ONE WAY') || upper.startsWith('OW')) return 'OW';
  if (upper.includes('PROCESSO') || upper.includes('PROC')) return 'PROCESSO';
  if (upper.includes('CHOPP'))                           return 'CHOPP';
  if (upper.includes('COMUM'))                           return 'COMUM';
  if (upper === 'ETA')                                   return 'ETA';
  if (upper.includes('PAF'))                             return 'PAF';
  return nome.slice(0, 8);
};

export const BarChartUGs: React.FC<BarChartUGsProps> = ({ statusUg, agingParadas }) => {
  const navigate = useNavigate();

  const chartData = (() => {
    const raw = (statusUg && statusUg.length > 0 ? statusUg : [])
      .map((u) => ({
        name: abreviaArea(u.ug_codigo || u.ug_nome || ''),
        fullName: u.ug_codigo || u.ug_nome || 'S/Á',
        parado: u.parado || 0,
      }))
      .filter((u) => u.parado > 0);

    // Agrupa entradas com mesmo nome abreviado (ex: OW CERVEJA + OW REFRI → OW)
    const grouped = new Map<string, { name: string; fullName: string; parado: number }>();
    raw.forEach((d) => {
      const existing = grouped.get(d.name);
      if (existing) {
        existing.parado += d.parado;
        existing.fullName = `${existing.fullName} + ${d.fullName}`;
      } else {
        grouped.set(d.name, { ...d });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => b.parado - a.parado);
  })();

  const top2Parados = agingParadas.slice(0, 2);
  const totalNok = chartData.reduce((s, d) => s + d.parado, 0);

  return (
    <div className="bg-[#13181F] border border-[#21262D] rounded-xl p-3 flex flex-col justify-between shadow-lg h-full w-full overflow-hidden">
      {/* Título */}
      <div className="flex items-center justify-between shrink-0 h-[32px] mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[12px] font-bold text-[#F9FAFB] truncate leading-tight">
              Equipamentos Indisponíveis (NOK)
            </h3>
            <p className="text-[10px] text-gray-400 truncate leading-none">
              Quantidade parada por área
            </p>
          </div>
        </div>
        {totalNok > 0 && (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 leading-none shrink-0">
            {totalNok} NOK
          </span>
        )}
      </div>

      {/* Gráfico */}
      <div className="flex-1 min-h-0 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 14, right: 4, left: -24, bottom: 4 }}
              barCategoryGap="40%"
              barSize={18}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: '#8B949E', fontSize: 9, fontFamily: 'sans-serif' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fill: '#484F58', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={20}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#1A1F28] border border-[#21262D] rounded-lg p-2 text-[10px] shadow-xl">
                        <p className="font-bold text-[#E6EDF3]">{d.fullName}</p>
                        <p className="text-red-400 font-mono">{d.parado} indisponíveis</p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="parado" radius={[3, 3, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="#F85149" />
                ))}
                <LabelList
                  dataKey="parado"
                  position="top"
                  style={{ fill: '#F85149', fontSize: 9, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-1">
            <span className="text-2xl">✅</span>
            <p className="text-[11px] text-[#3FB950] font-semibold">Nenhum equipamento parado</p>
            <p className="text-[10px] text-[#8B949E]">Todos os ativos estão operacionais</p>
          </div>
        )}
      </div>

      {/* Aging dos mais críticos */}
      {top2Parados.length > 0 && (
        <div className="pt-1.5 border-t border-[#21262D] shrink-0 space-y-1">
          {top2Parados.map((item) => (
            <div
              key={item.ocorrencia_id}
              onClick={() => navigate(`/ocorrencias/${item.ocorrencia_id}`)}
              className="flex items-center justify-between gap-2 cursor-pointer group"
            >
              <span className="text-[10px] font-mono font-medium text-[#E6EDF3] group-hover:text-[#F85149] truncate transition-colors">
                TAG {item.tag}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <AgingBadge dias={item.dias_parado} />
                <ExternalLink className="w-2.5 h-2.5 text-[#484F58] group-hover:text-[#F85149] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {totalNok === 0 && top2Parados.length === 0 && (
        <div className="shrink-0 text-center">
          <p className="text-[10px] text-[#8B949E] italic">Nenhum equipamento parado no momento.</p>
        </div>
      )}
    </div>
  );
};
