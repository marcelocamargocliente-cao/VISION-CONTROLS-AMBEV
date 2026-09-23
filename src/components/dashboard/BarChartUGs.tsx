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

export const BarChartUGs: React.FC<BarChartUGsProps> = ({ statusUg, agingParadas }) => {
  const navigate = useNavigate();

  // Usa statusUg que agora agrupa por área real (area_ref)
  const chartData = (statusUg && statusUg.length > 0
    ? statusUg
    : [
        { ug_codigo: 'N1', ok: 45, parado: 0 },
        { ug_codigo: 'N2', ok: 52, parado: 0 },
        { ug_codigo: 'N3', ok: 38, parado: 0 },
        { ug_codigo: 'N4', ok: 44, parado: 0 },
      ]
  ).map((u) => ({
    name: u.ug_codigo,
    parado: u.parado || 0,
  })).filter((u) => u.parado > 0); // só mostra quem tem NOK

  const top2Parados = agingParadas.slice(0, 2);
  const totalNok = chartData.reduce((s, d) => s + d.parado, 0);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 flex flex-col justify-between shadow-lg h-full w-full overflow-hidden">
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

      {/* Gráfico de barras vermelhas */}
      <div className="flex-1 min-h-0 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 14, right: 4, left: -20, bottom: 0 }}
              barCategoryGap="30%"
            >
              <XAxis
                dataKey="name"
                tick={{ fill: '#8B949E', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#484F58', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-[#E5E7EB] rounded-lg p-2 text-[10px] shadow-xl">
                        <p className="font-bold text-[#1A1A1A]">{d.name}</p>
                        <p className="text-red-400 font-mono">{d.parado} indisponíveis</p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="parado" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="#F85149" />
                ))}
                <LabelList
                  dataKey="parado"
                  position="top"
                  style={{ fill: '#F85149', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-1">
            <span className="text-2xl">✅</span>
            <p className="text-[11px] text-[#3FB950] font-semibold">Nenhum equipamento parado</p>
            <p className="text-[10px] text-[#6B7280]">Todos os ativos estão operacionais</p>
          </div>
        )}
      </div>

      {/* Aging dos mais críticos */}
      {top2Parados.length > 0 && (
        <div className="pt-1.5 border-t border-[#E5E7EB] shrink-0 space-y-1">
          {top2Parados.map((item) => (
            <div
              key={item.ocorrencia_id}
              onClick={() => navigate(`/ocorrencias/${item.ocorrencia_id}`)}
              className="flex items-center justify-between gap-2 cursor-pointer group"
            >
              <span className="text-[10px] font-mono font-medium text-[#1A1A1A] group-hover:text-[#F85149] truncate transition-colors">
                TAG {item.patrimonio_ref || item.tag_sap || item.tag}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <AgingBadge dias={item.dias_parado} />
                <ExternalLink className="w-2.5 h-2.5 text-[#9CA3AF] group-hover:text-[#F85149] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {totalNok === 0 && top2Parados.length === 0 && (
        <div className="shrink-0 text-center">
          <p className="text-[10px] text-[#6B7280] italic">Nenhum equipamento parado no momento.</p>
        </div>
      )}
    </div>
  );
};
