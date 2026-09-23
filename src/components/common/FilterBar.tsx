import React, { useEffect, useState } from 'react';
import { Filter, RotateCcw, Building2, Layers, Cpu, Calendar } from 'lucide-react';
import { DataStore, GlobalFilters } from '../../lib/dataStore';
import { UG, Area, Linha } from '../../types/database';

interface FilterBarProps {
  filters: GlobalFilters;
  onFilterChange: (newFilters: GlobalFilters) => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  className = '',
}) => {
  const [ugs, setUgs] = useState<UG[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);

  useEffect(() => {
    DataStore.getHierarchy().then((h) => {
      setUgs(h.ugs);
      setAreas(h.areas);
      setLinhas(h.linhas);
    });

    DataStore.getVwEquipamentos().then((eqs) => {
      const distinctTipos = Array.from(new Set(eqs.map((e) => e.tipo))).filter(Boolean);
      setTipos(distinctTipos);
    });
  }, []);

  const filteredAreas = filters.ug_id
    ? areas.filter((a) => a.ug_id === filters.ug_id)
    : areas;

  const filteredLinhas = filters.area_id
    ? linhas.filter((l) => l.area_id === filters.area_id)
    : filters.ug_id
    ? linhas.filter((l) => {
        const parentArea = areas.find((a) => a.id === l.area_id);
        return parentArea?.ug_id === filters.ug_id;
      })
    : linhas;

  const handleUgChange = (ug_id: string) => {
    onFilterChange({
      ...filters,
      ug_id: ug_id || undefined,
      area_id: undefined, // Reset child
      linha_id: undefined, // Reset child
    });
  };

  const handleAreaChange = (area_id: string) => {
    onFilterChange({
      ...filters,
      area_id: area_id || undefined,
      linha_id: undefined, // Reset child
    });
  };

  const handleLinhaChange = (linha_id: string) => {
    onFilterChange({
      ...filters,
      linha_id: linha_id || undefined,
    });
  };

  const handleTipoChange = (tipo: string) => {
    onFilterChange({
      ...filters,
      tipo: tipo || undefined,
    });
  };

  const handlePeriodoChange = (periodo: string) => {
    onFilterChange({
      ...filters,
      periodo: periodo || undefined,
    });
  };

  const handleReset = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Boolean(
    filters.ug_id || filters.area_id || filters.linha_id || filters.tipo || filters.periodo
  );

  return (
    <div
      id="global-filter-bar"
      className={`bg-[#111827] border border-blue-500/20 rounded-xl p-3.5 shadow-lg ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400 uppercase">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>Filtro Global da Planta Industrial — AMBEV RJ</span>
        </div>

        {hasActiveFilters && (
          <button
            id="btn-reset-filters"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* UG Filter */}
        <div>
          <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
            Unidade Gerencial (UG)
          </label>
          <select
            id="filter-ug"
            value={filters.ug_id || ''}
            onChange={(e) => handleUgChange(e.target.value)}
            className="w-full bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none transition-colors"
          >
            <option value="">Todas as UGs (Totalidade)</option>
            {ugs.map((ug) => (
              <option key={ug.id} value={ug.id}>
                {ug.codigo} — {ug.nome.split('—')[1]?.trim() || ug.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Área Filter */}
        <div>
          <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
            Área
          </label>
          <select
            id="filter-area"
            value={filters.area_id || ''}
            onChange={(e) => handleAreaChange(e.target.value)}
            className="w-full bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none transition-colors"
          >
            <option value="">Todas as Áreas</option>
            {filteredAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Linha Filter */}
        <div>
          <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
            Linha de Produção
          </label>
          <select
            id="filter-linha"
            value={filters.linha_id || ''}
            onChange={(e) => handleLinhaChange(e.target.value)}
            className="w-full bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none transition-colors"
          >
            <option value="">Todas as Linhas</option>
            {filteredLinhas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo Filter */}
        <div>
          <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
            Tipo de Equipamento
          </label>
          <select
            id="filter-tipo"
            value={filters.tipo || ''}
            onChange={(e) => handleTipoChange(e.target.value)}
            className="w-full bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none transition-colors"
          >
            <option value="">Todos os Tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Período */}
        <div>
          <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
            Período de Análise
          </label>
          <select
            id="filter-periodo"
            value={filters.periodo || 'tudo'}
            onChange={(e) => handlePeriodoChange(e.target.value)}
            className="w-full bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none transition-colors"
          >
            <option value="tudo">Todo o Histórico</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="ano">Ano 2026</option>
          </select>
        </div>
      </div>
    </div>
  );
};
