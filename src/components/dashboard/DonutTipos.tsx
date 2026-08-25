import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Layers } from 'lucide-react';
import { VwStatusPorTipo, VwStatusPorMarca } from '../../types/database';

interface DonutTiposProps {
  tipos: VwStatusPorTipo[];
  marcas: VwStatusPorMarca[];
}

const TYPE_COLORS: Record<string, string> = {
  'CPE porta': '#3B82F6', // Blue
  'CPE teto': '#8B5CF6',  // Purple
  'Splitão': '#06B6D4',   // Cyan
  'Chiller': '#10B981',   // Emerald
  'Outros': '#64748B',    // Gray
};

export const DonutTipos: React.FC<DonutTiposProps> = ({ tipos, marcas }) => {
  const normalizedData = (tipos && tipos.length > 0
    ? tipos
    : [
        { tipo: 'CPE porta', total: 110, ok: 108, parado: 2 },
        { tipo: 'CPE teto', total: 42, ok: 42, parado: 0 },
        { tipo: 'Splitão', total: 18, ok: 18, parado: 0 },
        { tipo: 'Chiller', total: 11, ok: 11, parado: 0 },
      ]
  ).map((t) => ({
    name: t.tipo,
    value: t.total,
    color: TYPE_COLORS[t.tipo] || '#64748B',
    ok: t.ok,
    parado: t.parado,
  }));

  const totalGeral = normalizedData.reduce((acc, curr) => acc + curr.value, 0);

  // Top 3 Brands
  const topMarcas = (marcas && marcas.length > 0
    ? marcas.slice(0, 3)
    : [
        { marca: 'RITTAL', total: 95, ok: 93, parado: 2 },
        { marca: 'KRONES', total: 48, ok: 48, parado: 0 },
        { marca: 'YORK', total: 26, ok: 26, parado: 0 },
      ]
  );

  return (
    <div className="bg-[#111827] border border-blue-500/15 rounded-lg p-3 flex flex-col justify-between shadow-lg h-full w-full overflow-hidden">
      {/* Título: 32px shrink-0 */}
      <div className="flex items-center gap-1.5 shrink-0 h-[32px] mb-0.5">
        <div className="w-6 h-6 rounded-md bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
          <Layers className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[12px] font-bold text-[#F9FAFB] truncate leading-tight">
            Performance dos Modelos
          </h3>
          <p className="text-[10px] text-gray-400 truncate leading-none">
            Arquitetura térmica
          </p>
        </div>
      </div>

      {/* Donut + Legenda: flex-1 min-h-0 — o donut cresce com a altura disponível */}
      <div className="flex-1 min-h-0 grid grid-cols-2 items-center gap-1 my-0.5">
        <div className="relative w-full h-full min-h-[75px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={normalizedData}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="75%"
                paddingAngle={2}
                dataKey="value"
              >
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={1.5} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0A0E1A] border border-blue-500/30 rounded p-1.5 text-[10px] shadow-xl">
                        <p className="font-bold text-white">{data.name}</p>
                        <p className="text-gray-300 font-mono">
                          {data.value} un ({Math.round((data.value / totalGeral) * 100)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Total in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-bold font-mono text-white leading-none">{totalGeral}</span>
            <span className="text-[8px] uppercase text-gray-400 leading-none">Ativos</span>
          </div>
        </div>

        {/* Legend: 10px font */}
        <div className="space-y-1 text-[10px] pl-1">
          {normalizedData.map((item, idx) => {
            const pct = totalGeral > 0 ? Math.round((item.value / totalGeral) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between leading-none">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-300 truncate text-[10px]">{item.name}</span>
                </div>
                <span className="font-mono text-gray-400 text-[10px] font-semibold ml-1">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Fabricantes: ~60px fixo no bottom (shrink-0) */}
      <div className="pt-1.5 border-t border-white/[0.06] space-y-1 shrink-0 h-[60px] flex flex-col justify-center">
        <div className="flex items-center justify-between text-[9px] uppercase font-bold text-gray-400 tracking-wider leading-none">
          <span>Top Fabricantes</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {topMarcas.map((m) => {
            const pct = m.total > 0 ? Math.round((m.ok / m.total) * 100) : 100;
            return (
              <div key={m.marca} className="text-[10px] leading-tight">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-gray-300 truncate">{m.marca}</span>
                  <span className="font-mono text-[9px] text-gray-400 ml-0.5">{pct}%</span>
                </div>
                {/* 4px height bar */}
                <div className="w-full h-[4px] rounded-full bg-[#0A0E1A] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct === 100 ? 'bg-blue-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
