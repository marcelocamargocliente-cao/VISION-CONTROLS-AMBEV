import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Layers } from 'lucide-react';
import { VwStatusPorTipo, VwStatusPorMarca } from '../../types/database';

interface DonutTiposProps {
  tipos: VwStatusPorTipo[];
  marcas: VwStatusPorMarca[];
}

const CORES_DONUT = [
  '#2F81F7', /* azul primário — CPE porta (maior) */
  '#388BFD',
  '#58A6FF',
  '#79B8FF',
  '#30363D', /* cinza para categorias menores */
  '#21262D',
];

export const DonutTipos: React.FC<DonutTiposProps> = ({ tipos, marcas }) => {
  const rawData = tipos && tipos.length > 0
    ? tipos
    : [
        { tipo: 'CPE porta', total: 110, ok: 108, parado: 2 },
        { tipo: 'CPE teto', total: 42, ok: 42, parado: 0 },
        { tipo: 'Splitão', total: 18, ok: 18, parado: 0 },
        { tipo: 'Chiller', total: 11, ok: 11, parado: 0 },
      ];

  const normalizedData = rawData.map((t, idx) => ({
    name: t.tipo,
    value: t.total,
    color: CORES_DONUT[idx % CORES_DONUT.length],
    ok: t.ok,
    parado: t.parado,
  }));

  const totalGeral = normalizedData.reduce((acc, curr) => acc + curr.value, 0);

  // Top 3 Brands
  const topMarcas = marcas && marcas.length > 0
    ? marcas.slice(0, 3)
    : [
        { marca: 'RITTAL', total: 95, ok: 93, parado: 2 },
        { marca: 'KRONES', total: 48, ok: 48, parado: 0 },
        { marca: 'YORK', total: 26, ok: 26, parado: 0 },
      ];

  return (
    <div className="bg-[#13181F] border border-[#21262D] rounded-xl p-3 flex flex-col justify-between h-full w-full overflow-hidden select-none">
      {/* Título: 32px shrink-0 */}
      <div className="flex items-center gap-1.5 shrink-0 h-[32px] mb-0.5">
        <Layers className="w-4 h-4 text-[#8B949E] shrink-0" />
        <div className="min-w-0">
          <h3 className="text-[12px] font-bold text-[#E6EDF3] tracking-tight truncate leading-tight">
            Performance dos Modelos
          </h3>
          <p className="text-[10px] text-[#8B949E] truncate leading-none">
            Arquitetura térmica
          </p>
        </div>
      </div>

      {/* Donut + Legenda: flex-1 min-h-0 */}
      <div className="flex-1 min-h-0 grid grid-cols-2 items-center gap-1 my-0.5">
        <div className="relative w-full h-full min-h-[75px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={normalizedData}
                cx="50%"
                cy="50%"
                innerRadius="48%"
                outerRadius="78%"
                paddingAngle={2}
                dataKey="value"
              >
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#13181F" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1A1F28] border border-[#21262D] rounded-lg p-2 text-[10px] shadow-xl">
                        <p className="font-bold text-[#E6EDF3]">{data.name}</p>
                        <p className="text-[#8B949E] font-mono">
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
            <span className="text-xs font-bold font-mono text-[#E6EDF3] leading-none">{totalGeral}</span>
            <span className="text-[8px] uppercase text-[#8B949E] leading-none mt-0.5">Ativos</span>
          </div>
        </div>

        {/* Legend: 10px font, traço fino na cor */}
        <div className="space-y-1.5 text-[10px] pl-1 font-body">
          {normalizedData.map((item, idx) => {
            const pct = totalGeral > 0 ? Math.round((item.value / totalGeral) * 100) : 0;
            return (
              <div key={`legend-${item.name || idx}-${idx}`} className="flex items-center justify-between leading-none">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-[2px] rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[#8B949E] truncate text-[10px]">{item.name}</span>
                </div>
                <span className="font-mono text-[#E6EDF3] text-[10px] font-semibold ml-1">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Fabricantes: ~60px fixo no bottom (shrink-0) */}
      <div className="pt-1.5 border-t border-[#21262D] space-y-1 shrink-0 h-[58px] flex flex-col justify-center font-body">
        <div className="flex items-center justify-between text-[9px] uppercase font-bold text-[#8B949E] tracking-wider leading-none">
          <span>Top Fabricantes</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {topMarcas.map((m, idx) => {
            const pct = m.total > 0 ? Math.round((m.ok / m.total) * 100) : 100;
            return (
              <div key={`top-marca-${m.marca || idx}-${idx}`} className="text-[10px] leading-tight">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[#8B949E] truncate">{m.marca}</span>
                  <span className="font-mono text-[10px] font-semibold text-[#E6EDF3] ml-0.5">{pct}%</span>
                </div>
                {/* 3px height bar */}
                <div className="w-full h-[3px] rounded-[2px] bg-[#1A1F28] overflow-hidden">
                  <div
                    className="h-full rounded-[2px] bg-[#58A6FF]"
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
