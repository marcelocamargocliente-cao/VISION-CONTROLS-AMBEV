import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  X,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DataStore } from '../lib/dataStore';
import {
  Equipamento,
  EquipStatus,
} from '../types/database';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const Equipamentos: React.FC = () => {
  const navigate = useNavigate();
  const { canEdit } = useAuth();

  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedUg, setSelectedUg] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);

  // New Equipment Form State (matching the new database fields)
  const [newEquip, setNewEquip] = useState<Partial<Equipamento>>({
    tag: '',
    ug_ref: 'N1',
    area_ref: '',
    localizacao_ref: '',
    patrimonio_ref: '',
    tipo_equipamento: 'RESFRIADOR DE PAINEL',
    marca: 'RITTAL',
    modelo: '',
    capacidade: '',
    aplicacao: 'INDUSTRIAL',
    status: 'OK',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Consulta direta Supabase
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('equipamentos')
          .select('tag, tipo_equipamento, marca, modelo, capacidade, status, ug_ref, area_ref, patrimonio_ref, localizacao_ref, local_instalacao')
          .order('tag', { ascending: true });

        if (error) {
          console.error('Supabase query error:', error);
        }

        if (!error && data && data.length > 0) {
          const mapped: Equipamento[] = data.map((item: any) => ({
            id: `equip-${item.tag}`,
            tag: String(item.tag || ''),
            ug_ref: item.ug_ref,
            area_ref: item.area_ref,
            localizacao_ref: item.localizacao_ref,
            patrimonio_ref: item.patrimonio_ref != null ? String(item.patrimonio_ref) : undefined,
            tipo_equipamento: item.tipo_equipamento || '',
            marca: item.marca || undefined,
            modelo: item.modelo || undefined,
            capacidade: item.capacidade || undefined,
            aplicacao: 'INDUSTRIAL',
            status: (item.status as EquipStatus) || 'OK',
            local_instalacao: item.local_instalacao || (item.ug_ref ? `${item.ug_ref} · ${item.localizacao_ref || ''}` : ''),
            tipo: item.tipo_equipamento || '',
            patrimonio: item.patrimonio_ref != null ? String(item.patrimonio_ref) : undefined,
          }));
          setEquipamentos(mapped);
          setLoading(false);
          return;
        }
      }

      // 3. Fallback DataStore (194 equipamentos reais)
      const eqs = await DataStore.getEquipamentos();
      setEquipamentos(eqs);
    } catch (e) {
      console.error('Erro ao carregar lista de equipamentos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcut ESC to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNewModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // List of UGs
  const distinctUgs = useMemo(() => {
    const fromData = equipamentos
      .map((e) => e.ug_ref)
      .filter((u): u is string => Boolean(u && u.trim()));
    return Array.from(new Set(fromData)).sort();
  }, [equipamentos]);

  // Unique list of Areas (from area_ref)
  const distinctAreas = useMemo(() => {
    const areas = equipamentos
      .map((e) => e.area_ref)
      .filter((a): a is string => Boolean(a && a.trim()));
    return Array.from(new Set(areas)).sort((a: string, b: string) => a.localeCompare(b));
  }, [equipamentos]);

  // Unique list of Types (from tipo_equipamento)
  const distinctTipos = useMemo(() => {
    const tipos = equipamentos
      .map((e) => e.tipo_equipamento || e.tipo)
      .filter((t): t is string => Boolean(t && t.trim()));
    return Array.from(new Set(tipos)).sort((a: string, b: string) => a.localeCompare(b));
  }, [equipamentos]);

  // Filtered equipments
  const filteredEquipamentos = useMemo(() => {
    return equipamentos.filter((eq) => {
      const term = searchTerm.toLowerCase().trim();
      const tagStr = String(eq.tag || '').toLowerCase();
      const marcaStr = (eq.marca || '').toLowerCase();
      const modeloStr = (eq.modelo || '').toLowerCase();
      const locStr = (eq.localizacao_ref || eq.local_instalacao || '').toLowerCase();

      const matchesSearch =
        !term ||
        tagStr.includes(term) ||
        marcaStr.includes(term) ||
        modeloStr.includes(term) ||
        locStr.includes(term);

      const matchesStatus = !selectedStatus || eq.status === selectedStatus;

      const ug = eq.ug_ref || '';
      const matchesUg = !selectedUg || ug.toUpperCase() === selectedUg.toUpperCase();

      const matchesArea = !selectedArea || eq.area_ref === selectedArea;

      const tipo = eq.tipo_equipamento || eq.tipo || '';
      const matchesTipo = !selectedTipo || tipo === selectedTipo;

      return matchesSearch && matchesStatus && matchesUg && matchesArea && matchesTipo;
    });
  }, [equipamentos, searchTerm, selectedStatus, selectedUg, selectedArea, selectedTipo]);

  const paradosCount = filteredEquipamentos.filter((e) => e.status === 'PARADO').length;
  const okCount = filteredEquipamentos.filter((e) => e.status === 'OK').length;

  const hasActiveFilters = Boolean(searchTerm || selectedStatus || selectedUg || selectedArea || selectedTipo);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedUg('');
    setSelectedArea('');
    setSelectedTipo('');
  };

  const handleSaveNewEquip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquip.tag) return;
    try {
      const ug = newEquip.ug_ref || 'N1';
      const loc = newEquip.localizacao_ref || '';
      const localInst = ug ? `${ug} · ${loc}` : loc;

      await DataStore.saveEquipamento({
        ...newEquip,
        local_instalacao: localInst,
        aplicacao: 'INDUSTRIAL',
      });
      setShowNewModal(false);
      setNewEquip({
        tag: '',
        ug_ref: 'N1',
        area_ref: '',
        localizacao_ref: '',
        patrimonio_ref: '',
        tipo_equipamento: 'RESFRIADOR DE PAINEL',
        marca: 'RITTAL',
        modelo: '',
        capacidade: '',
        aplicacao: 'INDUSTRIAL',
        status: 'OK',
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      id="equipamentos-page"
      className="flex flex-col h-screen p-3 md:px-4 md:py-3 gap-2 overflow-hidden box-border bg-[#0A0E1A] select-none"
    >
      {/* 1. HEADER DA PÁGINA (Fixo, max 56px) */}
      <header
        id="equipamentos-header"
        className="shrink-0 h-[56px] flex items-center justify-between gap-3 px-3.5 rounded-lg bg-[#111827] border border-blue-500/20"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 leading-none">
            <span className="text-[9px] tracking-widest bg-[#F59E0B]/10 text-[#F59E0B] px-1.5 py-0.5 rounded border border-[#F59E0B]/30 uppercase font-bold">
              Cadastro de Ativos
            </span>
            <span className="text-[10px] text-gray-500">·</span>
            <span className="text-[10px] text-gray-400 tracking-wider uppercase truncate">
              {equipamentos.length} EQUIPAMENTOS CADASTRADOS
            </span>
          </div>
          <h1 className="text-[18px] md:text-[20px] font-bold text-white tracking-tight uppercase leading-tight truncate">
            Parque de Equipamentos de Climatização
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Action: + Novo Equipamento */}
          {canEdit && (
            <button
              id="btn-open-new-equip-modal"
              onClick={() => setShowNewModal(true)}
              className="h-[32px] inline-flex items-center gap-1.5 px-3 text-[11px] font-bold rounded-md btn-primary-gradient uppercase tracking-wider transition-all shadow-md shadow-blue-500/15 cursor-pointer leading-none text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Equipamento</span>
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={loadData}
            title="Atualizar lista"
            className="h-[32px] w-[32px] flex items-center justify-center rounded-md bg-[#0A0E1A] border border-blue-500/20 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* 2. BARRA DE BUSCA (Fixa, h-[36px] compacto) */}
      <div
        id="equipamentos-search-bar"
        className="shrink-0 flex items-center gap-2"
      >
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-equipamentos"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Busca por TAG, Marca, Modelo ou Localização..."
            className="w-full h-[36px] bg-[#111827] border border-blue-500/20 focus:border-blue-400 text-white text-[12px] placeholder-gray-500 rounded-md pl-9 pr-3 outline-none transition-colors"
          />
        </div>

        {/* Quick Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-[36px] px-3 text-[11px] font-medium text-gray-400 hover:text-white bg-[#111827] border border-blue-500/20 hover:border-blue-500/40 rounded-md transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>

      {/* 3. FILTROS DA TELA (Status, UG, Área, Tipo) */}
      <div
        id="equipamentos-filters-row"
        className="shrink-0 bg-[#111827] border border-blue-500/15 rounded-lg px-3 py-2"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Filtro 1: Status (OK / PARADO) */}
          <div className="filter-group">
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-[30px] bg-[#0A0E1A] border border-blue-500/20 text-white text-[11px] rounded px-2 outline-none cursor-pointer"
            >
              <option value="">Todos os Status</option>
              <option value="OK">OK</option>
              <option value="PARADO">PARADO</option>
            </select>
          </div>

          {/* Filtro 2: UG (N1, N2, N3, N4) */}
          <div className="filter-group">
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">UG</label>
            <select
              value={selectedUg}
              onChange={(e) => setSelectedUg(e.target.value)}
              className="w-full h-[30px] bg-[#0A0E1A] border border-blue-500/20 text-white text-[11px] rounded px-2 outline-none cursor-pointer font-mono"
            >
              <option value="">Todas as UGs</option>
              {distinctUgs.map((ug) => (
                <option key={ug} value={ug}>
                  UG {ug}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro 3: Área (Valores únicos de area_ref) */}
          <div className="filter-group">
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Área</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full h-[30px] bg-[#0A0E1A] border border-blue-500/20 text-white text-[11px] rounded px-2 outline-none cursor-pointer truncate"
            >
              <option value="">Todas as Áreas</option>
              {distinctAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro 4: Tipo (Valores únicos de tipo_equipamento) */}
          <div className="filter-group">
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tipo</label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full h-[30px] bg-[#0A0E1A] border border-blue-500/20 text-white text-[11px] rounded px-2 outline-none cursor-pointer truncate"
            >
              <option value="">Todos os Tipos</option>
              {distinctTipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABELA DE LISTAGEM — COLUNAS: TAG | UG | ÁREA | LOCALIZAÇÃO | TIPO | MARCA | MODELO | CAPACIDADE | STATUS | AÇÃO */}
      <div
        id="equipamentos-table-container"
        className="flex-1 min-h-0 bg-[#111827] border border-blue-500/15 rounded-lg overflow-y-auto overflow-x-auto flex flex-col relative shadow-lg"
      >
        {filteredEquipamentos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              icon={Search}
              title="Nenhum equipamento encontrado"
              description="Tente ajustar a busca por texto livre ou os filtros de Status, UG, Área ou Tipo."
              actionLabel="Limpar todos os filtros"
              onAction={clearFilters}
            />
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[980px]">
            {/* CABEÇALHO DA TABELA (sticky) */}
            <thead className="sticky top-0 z-10 bg-[#1a2235] border-b border-blue-500/20 shadow-sm text-gray-300">
              <tr className="text-[10px] uppercase tracking-wider h-[36px]">
                <th className="py-2 px-3 w-[70px]">TAG</th>
                <th className="py-2 px-3 w-[60px] text-center">UG</th>
                <th className="py-2 px-3 w-[150px]">ÁREA</th>
                <th className="py-2 px-3 min-w-[180px]">LOCALIZAÇÃO</th>
                <th className="py-2 px-3 w-[150px]">TIPO</th>
                <th className="py-2 px-3 w-[110px]">MARCA</th>
                <th className="py-2 px-3 w-[120px]">MODELO</th>
                <th className="py-2 px-3 w-[100px]">CAPACIDADE</th>
                <th className="py-2 px-3 w-[90px] text-center">STATUS</th>
                <th className="py-2 px-3 w-[75px] text-right">AÇÃO</th>
              </tr>
            </thead>

            {/* CORPO DA TABELA */}
            <tbody className="divide-y divide-white/[0.04]">
              {filteredEquipamentos.map((eq) => {
                const isParado = eq.status === 'PARADO';
                const isOk = eq.status === 'OK';
                const targetKey = eq.tag || eq.id;
                const ugCode = eq.ug_ref || '—';
                const tipoNome = eq.tipo_equipamento || '—';

                return (
                  <tr
                    key={eq.tag || eq.id}
                    onClick={() => navigate(`/equipamentos/${targetKey}`)}
                    className="h-[44px] hover:bg-blue-500/[0.06] cursor-pointer transition-colors duration-150 group"
                  >
                    {/* 1. TAG */}
                    <td className="py-2 px-3 align-middle w-[70px]">
                      <span className="bg-[#1E3A5F] text-blue-400 font-bold text-[11px] rounded px-2 py-0.5 inline-flex items-center border border-blue-500/30 font-mono">
                        {eq.tag}
                      </span>
                    </td>

                    {/* 2. UG */}
                    <td className="py-2 px-3 align-middle w-[60px] text-center">
                      <span className="inline-block px-1.5 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded font-mono font-bold text-[10px]">
                        {ugCode}
                      </span>
                    </td>

                    {/* 3. ÁREA */}
                    <td className="py-2 px-3 align-middle w-[150px]">
                      <div className="text-gray-300 text-[11px] font-medium truncate leading-tight" title={eq.area_ref}>
                        {eq.area_ref || '—'}
                      </div>
                    </td>

                    {/* 4. LOCALIZAÇÃO */}
                    <td className="py-2 px-3 align-middle min-w-[180px]">
                      <div className="text-cyan-400 font-mono text-[11px] font-medium truncate leading-tight" title={eq.localizacao_ref || eq.local_instalacao}>
                        {eq.localizacao_ref || eq.local_instalacao || '—'}
                      </div>
                    </td>

                    {/* 5. TIPO */}
                    <td className="py-2 px-3 align-middle w-[150px]">
                      <div className="text-gray-200 text-[11px] truncate leading-tight" title={eq.tipo_equipamento || '—'}>
                        {eq.tipo_equipamento || '—'}
                      </div>
                    </td>

                    {/* 6. MARCA */}
                    <td className="py-2 px-3 align-middle w-[110px]">
                      <span className="text-[#F5A623] font-semibold text-[11px] truncate block" title={eq.marca}>
                        {eq.marca || '—'}
                      </span>
                    </td>

                    {/* 7. MODELO */}
                    <td className="py-2 px-3 align-middle w-[120px]">
                      <span className="text-gray-300 text-[11px] font-mono truncate block" title={eq.modelo}>
                        {eq.modelo || '—'}
                      </span>
                    </td>

                    {/* 8. CAPACIDADE */}
                    <td className="py-2 px-3 align-middle w-[100px]">
                      <span className="text-emerald-400 font-mono text-[11px] font-medium truncate block" title={eq.capacidade}>
                        {eq.capacidade || '—'}
                      </span>
                    </td>

                    {/* 9. STATUS (OK / PARADO) */}
                    <td className="py-2 px-3 align-middle w-[90px] text-center">
                      {isParado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                          <span>PARADO</span>
                        </span>
                      ) : isOk ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>OK</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30 whitespace-nowrap">
                          <span>{eq.status || 'OK'}</span>
                        </span>
                      )}
                    </td>

                    {/* 10. AÇÃO */}
                    <td className="py-2 px-3 align-middle w-[75px] text-right">
                      <span className="inline-flex items-center text-blue-400 group-hover:text-blue-300 font-semibold text-[11px] transition-colors leading-none">
                        <span>Ficha</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. RODAPÉ DA TABELA (Fixo no bottom) */}
      <footer
        id="equipamentos-table-footer"
        className="shrink-0 h-[32px] flex items-center justify-between px-3 rounded-md bg-[#111827] border border-blue-500/10 text-[11px] text-gray-400"
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-medium text-gray-300">
            Mostrando {filteredEquipamentos.length} de {equipamentos.length} equipamentos
          </span>
          <span>·</span>
          <span className="text-emerald-400 font-semibold">
            {okCount} OK
          </span>
          <span>·</span>
          <span className={paradosCount > 0 ? 'text-red-400 font-bold' : ''}>
            {paradosCount} PARADO{paradosCount === 1 ? '' : 'S'}
          </span>
        </div>

        <div className="hidden sm:inline text-gray-500 text-[10px]">
          Clique na linha ou em "Ficha" para ver todos os detalhes
        </div>
      </footer>

      {/* MODAL: NOVO EQUIPAMENTO (Alinhado aos novos campos) */}
      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewModal(false);
          }}
        >
          <div className="bg-[#111827] border border-blue-500/30 rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between bg-[#0A0E1A]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <h3 className="text-[14px] font-bold text-white uppercase tracking-tight">
                  Novo Equipamento
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewEquip} className="p-4 flex-1 overflow-y-auto space-y-3 text-[11px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* TAG */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Tag Vision*</label>
                  <input
                    type="text"
                    required
                    value={newEquip.tag}
                    onChange={(e) => setNewEquip({ ...newEquip, tag: e.target.value })}
                    placeholder="Ex: 352"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none font-mono"
                  />
                </div>

                {/* UG */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">UG*</label>
                  <select
                    value={newEquip.ug_ref}
                    onChange={(e) => setNewEquip({ ...newEquip, ug_ref: e.target.value })}
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 text-white px-2 rounded text-[11px] outline-none font-mono"
                  >
                    <option value="N1">N1</option>
                    <option value="N2">N2</option>
                    <option value="N3">N3</option>
                    <option value="N4">N4</option>
                  </select>
                </div>

                {/* Patrimônio AMBEV */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Patrimônio AMBEV</label>
                  <input
                    type="text"
                    value={newEquip.patrimonio_ref || ''}
                    onChange={(e) => setNewEquip({ ...newEquip, patrimonio_ref: e.target.value })}
                    placeholder="Ex: 84"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Área */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Área</label>
                  <input
                    type="text"
                    value={newEquip.area_ref}
                    onChange={(e) => setNewEquip({ ...newEquip, area_ref: e.target.value })}
                    placeholder="Ex: RETORNÁVEIS, ONE WAY CERVEJA..."
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none"
                  />
                </div>

                {/* Localização */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Localização</label>
                  <input
                    type="text"
                    value={newEquip.localizacao_ref}
                    onChange={(e) => setNewEquip({ ...newEquip, localizacao_ref: e.target.value })}
                    placeholder="Ex: LINHA 542 / EMPACOTADORA 03"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tipo de Equipamento */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Tipo</label>
                  <input
                    type="text"
                    value={newEquip.tipo_equipamento}
                    onChange={(e) => setNewEquip({ ...newEquip, tipo_equipamento: e.target.value })}
                    placeholder="Ex: RESFRIADOR DE PAINEL, SPLITÃO..."
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none"
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Marca</label>
                  <input
                    type="text"
                    value={newEquip.marca}
                    onChange={(e) => setNewEquip({ ...newEquip, marca: e.target.value })}
                    placeholder="Ex: RITTAL, KRONES, YORK..."
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none"
                  />
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Modelo</label>
                  <input
                    type="text"
                    value={newEquip.modelo}
                    onChange={(e) => setNewEquip({ ...newEquip, modelo: e.target.value })}
                    placeholder="Ex: SK 3304.500"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Capacidade */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Capacidade</label>
                  <input
                    type="text"
                    value={newEquip.capacidade}
                    onChange={(e) => setNewEquip({ ...newEquip, capacidade: e.target.value })}
                    placeholder="Ex: 1500W, 36.000 BTU'S..."
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none font-mono"
                  />
                </div>

                {/* Aplicação */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Aplicação</label>
                  <input
                    type="text"
                    disabled
                    value="INDUSTRIAL"
                    className="w-full h-[32px] bg-[#0A0E1A]/60 border border-blue-500/10 text-gray-400 px-2.5 rounded text-[11px] outline-none cursor-not-allowed uppercase font-semibold"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-gray-400 mb-1 uppercase text-[9px] font-bold">Status</label>
                  <select
                    value={newEquip.status}
                    onChange={(e) => setNewEquip({ ...newEquip, status: e.target.value as EquipStatus })}
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 text-white px-2 rounded text-[11px] outline-none"
                  >
                    <option value="OK">OK</option>
                    <option value="PARADO">PARADO</option>
                  </select>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="h-[30px] px-3 rounded bg-[#0A0E1A] border border-white/[0.08] text-gray-300 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-[30px] px-4 rounded btn-primary-gradient font-bold tracking-wider uppercase text-[11px] cursor-pointer text-white"
                >
                  Salvar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
