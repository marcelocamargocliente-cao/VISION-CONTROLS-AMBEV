import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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

  const chartData = (statusUg && statusUg.length > 0
    ? statusUg
    : [
        { ug_codigo: 'N1', ok: 45, parado: 2 },
        { ug_codigo: 'N2', ok: 52, parado: 0 },
        { ug_codigo: 'N3', ok: 38, parado: 0 },
        { ug_codigo: 'N4', ok: 44, parado: 0 },
      ]
  ).map((u) => ({
    name: u.ug_codigo,
    ok: u.ok,
    parado: u.parado,
  }));

  // Máximo 2 itens
  const top2Parados = agingParadas.slice(0, 2);

  return (
    <div className="bg-[#111827] border border-blue-500/15 rounded-lg p-3 flex flex-col justify-between shadow-lg h-full w-full overflow-hidden">
      {/* Título: 32px shrink-0 */}
      <div className="flex items-center justify-between shrink-0 h-[32px] mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[12px] font-bold text-[#F9FAFB] truncate leading-tight">
              Equipamentos em Risco
            </h3>
            <p className="text-[10px] text-gray-400 truncate leading-none">
              Aging crítico de paradas
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 leading-none shrink-0">
          {agingParadas.length} alerta{agingParadas.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Gráfico de barras: flex-1 min-h-0 */}
      <div className="w-full flex-1 min-h-0 my-0.5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              tick={{ fill: '#9CA3AF', fontSize: 9 }}
              height={14}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
              tick={{ fill: '#9CA3AF', fontSize: 9 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#0A0E1A] border border-blue-500/30 rounded p-1.5 text-[10px] shadow-xl">
                      <p className="font-bold text-white mb-0.5">UG {label}</p>
                      <p className="text-blue-400 font-mono">OK: {payload[0]?.value}</p>
                      <p className="text-red-400 font-mono">Parados: {payload[1]?.value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="ok" name="Operando" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="parado" name="Parado" fill="#EF4444" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lista de críticos: máximo 2 itens, fixos no bottom (shrink-0) */}
      <div className="pt-1.5 border-t border-white/[0.06] space-y-1 shrink-0">
        {top2Parados.length === 0 ? (
          <p className="text-[11px] text-emerald-400 italic py-1 text-center">
            Nenhum equipamento parado no momento.
          </p>
        ) : (
          top2Parados.map((item) => (
            <div
              key={item.ocorrencia_id}
              onClick={() => navigate(`/ocorrencias/${item.ocorrencia_id}`)}
              className="p-1.5 rounded bg-[#0A0E1A]/70 border border-red-500/20 hover:border-red-500/50 hover:bg-[#1a2235] transition-all cursor-pointer group text-[11px]"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-white group-hover:text-blue-400 transition-colors">
                      TAG {item.tag}
                    </span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-300 truncate text-[10px]">
                      {item.linha_nome}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <AgingBadge dias={item.dias_parado} />
                  <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
