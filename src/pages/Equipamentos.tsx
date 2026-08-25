import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Sparkles,
  CheckCircle2,
  X,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import {
  VwEquipamento,
  UG,
  Area,
  Linha,
  CentroTrabalho,
  LevantamentoLegado,
  Equipamento,
} from '../types/database';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const Equipamentos: React.FC = () => {
  const navigate = useNavigate();
  const { canEdit, user } = useAuth();

  const [equipamentos, setEquipamentos] = useState<VwEquipamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUg, setSelectedUg] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedLinha, setSelectedLinha] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Hierarchy Data
  const [hierarchy, setHierarchy] = useState<{
    ugs: UG[];
    areas: Area[];
    linhas: Linha[];
    centros_trabalho: CentroTrabalho[];
  }>({ ugs: [], areas: [], linhas: [], centros_trabalho: [] });

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showConciliacaoModal, setShowConciliacaoModal] = useState(false);

  // Legacy reconciliation state
  const [legados, setLegados] = useState<LevantamentoLegado[]>([]);
  const [selectedLegado, setSelectedLegado] = useState<LevantamentoLegado | null>(null);
  const [targetEquipId, setTargetEquipId] = useState('');
  const [openOccurrenceForNok, setOpenOccurrenceForNok] = useState(true);
  const [conciliandoLoading, setConciliandoLoading] = useState(false);
  const [conciliadoSuccessMsg, setConciliadoSuccessMsg] = useState<string | null>(null);

  // New Equipment Form State
  const [newEquip, setNewEquip] = useState<Partial<Equipamento>>({
    tag: '',
    patrimonio: '',
    tag_sap: '',
    tipo: 'CPE porta',
    marca: 'RITTAL',
    modelo: '',
    capacidade: '',
    tensao: '230V 1F',
    corrente: '',
    gas_refrigerante: 'R-134a',
    ano_fabricacao: 2023,
    ppac: 'PPAC-MENSAL-CPE',
    status: 'OK',
    observacoes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eqs, hier, leg] = await Promise.all([
        DataStore.getVwEquipamentos(),
        DataStore.getHierarchy(),
        DataStore.getLevantamentoLegado(),
      ]);
      setEquipamentos(eqs);
      setHierarchy(hier);
      setLegados(leg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcut ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNewModal(false);
        setShowConciliacaoModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered equipments
  const filteredEquipamentos = equipamentos.filter((eq) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      eq.tag.toLowerCase().includes(term) ||
      (eq.patrimonio && eq.patrimonio.toLowerCase().includes(term)) ||
      (eq.tag_sap && eq.tag_sap.toLowerCase().includes(term)) ||
      eq.modelo.toLowerCase().includes(term) ||
      eq.marca.toLowerCase().includes(term) ||
      eq.tipo.toLowerCase().includes(term) ||
      eq.linha_nome.toLowerCase().includes(term) ||
      eq.centro_trabalho_nome.toLowerCase().includes(term);

    const matchesUg = !selectedUg || eq.ug_id === selectedUg;
    const matchesArea = !selectedArea || eq.area_id === selectedArea;
    const matchesLinha = !selectedLinha || eq.linha_id === selectedLinha;
    const matchesTipo = !selectedTipo || eq.tipo === selectedTipo;
    const matchesMarca = !selectedMarca || eq.marca === selectedMarca;
    const matchesStatus = !selectedStatus || eq.status === selectedStatus;

    return matchesSearch && matchesUg && matchesArea && matchesLinha && matchesTipo && matchesMarca && matchesStatus;
  });

  const distinctTipos = Array.from(new Set(equipamentos.map((e) => e.tipo))).filter(Boolean);
  const distinctMarcas = Array.from(new Set(equipamentos.map((e) => e.marca))).filter(Boolean);

  const pendingLegados = legados.filter((l) => !l.conciliado);
  const nokLegados = pendingLegados.filter((l) => !l.status_ok);

  const paradosCount = filteredEquipamentos.filter((e) => e.status === 'PARADO').length;
  const restricaoCount = filteredEquipamentos.filter((e) => e.status === 'RESTRICAO').length;

  const hasActiveFilters =
    Boolean(searchTerm || selectedUg || selectedArea || selectedLinha || selectedTipo || selectedMarca || selectedStatus);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUg('');
    setSelectedArea('');
    setSelectedLinha('');
    setSelectedTipo('');
    setSelectedMarca('');
    setSelectedStatus('');
  };

  const handleSaveNewEquip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquip.tag) return;
    try {
      await DataStore.saveEquipamento(newEquip);
      setShowNewModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecConciliacao = async () => {
    if (!selectedLegado || !targetEquipId) return;
    setConciliandoLoading(true);
    setConciliadoSuccessMsg(null);
    try {
      const res = await DataStore.conciliarRegistroLegado(
        selectedLegado.id,
        targetEquipId,
        !selectedLegado.status_ok && openOccurrenceForNok,
        undefined,
        user?.nome
      );

      const targetEq = equipamentos.find((e) => e.id === targetEquipId);
      const msg = res.ocorrenciaCriada
        ? `Registro ${selectedLegado.tag_legada} conciliado com sucesso à TAG ${targetEq?.tag || targetEquipId} e Ocorrência #${res.ocorrenciaCriada.numero} aberta!`
        : `Registro ${selectedLegado.tag_legada} conciliado com sucesso à TAG ${targetEq?.tag || targetEquipId}.`;

      setConciliadoSuccessMsg(msg);
      setSelectedLegado(null);
      setTargetEquipId('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setConciliandoLoading(false);
    }
  };

  return (
    <div
      id="equipamentos-page"
      className="flex flex-col h-screen p-3 md:px-4 md:py-3 gap-2 overflow-hidden box-border bg-[#0A0E1A] select-none font-sans text-gray-200"
    >
      {/* 1. HEADER DA PÁGINA (Fixo, max 56px) */}
      <header
        id="equipamentos-header"
        className="shrink-0 h-[56px] flex items-center justify-between gap-3 px-3.5 rounded-lg bg-[#111827] border border-blue-500/20"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 leading-none">
            <span className="text-[9px] font-mono tracking-widest text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded border border-[#F59E0B]/30 uppercase font-bold">
              Cadastro de Ativos
            </span>
            <span className="text-[10px] text-gray-500 font-mono">·</span>
            <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase truncate">
              {equipamentos.length || 181} EQUIPAMENTOS CADASTRADOS
            </span>
          </div>
          <h1 className="text-[18px] md:text-[20px] font-bold text-white tracking-tight uppercase leading-tight truncate">
            Parque de Equipamentos de Climatização
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Action: Conciliar Levantamento 2026 */}
          <button
            id="btn-open-conciliacao-modal"
            onClick={() => setShowConciliacaoModal(true)}
            className="h-[32px] inline-flex items-center gap-1.5 px-2.5 text-[11px] font-semibold rounded-md bg-[#0A0E1A] hover:bg-[#1a2235] text-[#F59E0B] border border-[#F59E0B]/40 transition-colors shadow-sm cursor-pointer leading-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden sm:inline">Conciliar Levantamento 2026</span>
            <span className="sm:hidden">Conciliar</span>
            {pendingLegados.length > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#EF4444] text-white rounded-full leading-none">
                {pendingLegados.length}
              </span>
            )}
          </button>

          {/* Action: + Novo Equipamento */}
          {canEdit && (
            <button
              id="btn-open-new-equip-modal"
              onClick={() => setShowNewModal(true)}
              className="h-[32px] inline-flex items-center gap-1.5 px-3 text-[11px] font-bold rounded-md btn-primary-gradient uppercase tracking-wider transition-all shadow-md shadow-blue-500/15 cursor-pointer leading-none"
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
            placeholder="Buscar por TAG, Patrimônio, Tag SAP (ACO...), modelo, tipo ou máquina..."
            className="w-full h-[36px] bg-[#111827] border border-blue-500/20 focus:border-blue-400 text-white text-[12px] placeholder-gray-500 rounded-md pl-9 pr-3 outline-none transition-colors"
          />
        </div>

        {/* Quick Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-[36px] px-3 text-[11px] font-medium text-gray-300 hover:text-white bg-[#111827] border border-blue-500/20 hover:border-blue-500/40 rounded-md transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>

      {/* 3. FILTROS (Fixos, 6 selects, altura total ~52px) */}
      <div
        id="equipamentos-filters-row"
        className="shrink-0 bg-[#111827] border border-blue-500/15 rounded-lg px-3 py-2"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Status */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-0.5 leading-none">
              Status Operacional
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-[30px] bg-[#0A0E1A] border border-blue-500/20 text-white text-[11px] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="OK">OK (Operando)</option>
              <option value="PARADO">PARADO (Crítico)</option>
              <option value="RESTRICAO">Restrição</option>
              <option value="DESATIVADO">Desativado</option>
            </select>
          </div>

          {/* UG */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-0.5 leading-none">
              UG
            </label>
            <select
              value={selectedUg}
              onChange={(e) => setSelectedUg(e.target.value)}
              className="w-full h-[30px] bg-[#0A0E1A] border border-blue-500/20 text-white text-[11px] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todas UGs</option>
              {hierarchy.ugs.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.codigo}
                </option>
              ))}
            </select>
          </div>

          {/* Área */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-0.5 leading-none">
              Área
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full h-[30px] bg-[#0A0E1A] border border-blue-500/20 text-white text-[11px] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todas Áreas</option>
              {hierarchy.areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Linha */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-0.5 leading-none">
              Linha
            </label>
            <select
              value={selectedLinha}
              onChange={(e) => setSelectedLinha(e.target.value)}
              className="w-full h-[30px] bg-[#0A0E1A] border border-blue-500/20 text-white text-[11px] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todas Linhas</option>
              {hierarchy.linhas.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-0.5 leading-none">
              Tipo
            </label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full h-[30px] bg-[#0A0E1A] border border-blue-500/20 text-white text-[11px] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todos Tipos</option>
              {distinctTipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-0.5 leading-none">
              Marca
            </label>
            <select
              value={selectedMarca}
              onChange={(e) => setSelectedMarca(e.target.value)}
              className="w-full h-[30px] bg-[#0A0E1A] border border-blue-500/20 text-white text-[11px] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todas Marcas</option>
              {distinctMarcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABELA — CRESCE E RECEBE O SCROLL (flex: 1 1 0, min-height: 0) */}
      <div
        id="equipamentos-table-container"
        className="flex-1 min-h-0 bg-[#111827] border border-blue-500/15 rounded-lg overflow-y-auto overflow-x-hidden flex flex-col relative shadow-lg"
      >
        {filteredEquipamentos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              icon={Search}
              title="Nenhum equipamento corresponde aos filtros aplicados"
              description="Tente ajustar a busca por TAG ou selecionar outra linha/UG para visualizar os equipamentos da cervejaria."
              actionLabel="Limpar todos os filtros"
              onAction={clearFilters}
            />
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            {/* CABEÇALHO DA TABELA (sticky) */}
            <thead className="sticky top-0 z-10 bg-[#1a2235] border-b border-blue-500/20 shadow-sm">
              <tr className="text-gray-400 font-mono text-[10px] uppercase tracking-wider h-[36px]">
                <th className="py-2 px-3 w-[75px]">TAG</th>
                <th className="py-2 px-3 w-[180px]">Tipo & Fabricante</th>
                <th className="py-2 px-3 w-[140px]">Tag SAP / Patrimônio</th>
                <th className="py-2 px-3">Localização (UG / Linha / CT)</th>
                <th className="py-2 px-3 w-[150px]">Capacidade / Gás</th>
                <th className="py-2 px-3 w-[140px] text-center">Status</th>
                <th className="py-2 px-3 w-[75px] text-right">Ação</th>
              </tr>
            </thead>

            {/* CORPO DA TABELA */}
            <tbody className="divide-y divide-white/[0.04] text-gray-200">
              {filteredEquipamentos.map((eq) => {
                const isParado = eq.status === 'PARADO';
                const isRestricao = eq.status === 'RESTRICAO';
                const isOk = eq.status === 'OK';

                return (
                  <tr
                    key={eq.id}
                    onClick={() => navigate(`/equipamentos/${eq.id}`)}
                    className="h-[52px] hover:bg-blue-500/[0.05] cursor-pointer transition-colors duration-150 group"
                  >
                    {/* TAG: badge TAG 360 */}
                    <td className="py-2 px-3 align-middle w-[75px]">
                      <span className="bg-[#1E3A5F] text-blue-400 font-mono font-bold text-[11px] rounded px-2 py-1 inline-flex items-center gap-1 border border-blue-500/30">
                        <span className="opacity-60 text-[9px]">TAG</span>
                        <span>{eq.tag}</span>
                      </span>
                    </td>

                    {/* TIPO & FABRICANTE */}
                    <td className="py-2 px-3 align-middle w-[180px] min-w-0">
                      <div className="font-bold text-white text-[12px] truncate leading-tight">
                        {eq.tipo}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate leading-tight">
                        {eq.marca} · {eq.modelo}
                      </div>
                    </td>

                    {/* TAG SAP / PATRIMÔNIO */}
                    <td className="py-2 px-3 align-middle w-[140px] min-w-0 font-mono">
                      <div className="text-cyan-400 text-[11px] font-semibold truncate leading-tight">
                        {eq.tag_sap || '-'}
                      </div>
                      <div className="text-gray-400 text-[10px] truncate leading-tight">
                        {eq.patrimonio || '-'}
                      </div>
                    </td>

                    {/* LOCALIZAÇÃO (UG / LINHA / CT) */}
                    <td className="py-2 px-3 align-middle min-w-0">
                      <div className="text-[12px] font-medium text-gray-200 truncate leading-tight">
                        {eq.linha_nome}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate leading-tight">
                        {eq.ug_codigo} · {eq.centro_trabalho_nome}
                      </div>
                    </td>

                    {/* CAPACIDADE / GÁS */}
                    <td className="py-2 px-3 align-middle w-[150px] min-w-0 font-mono">
                      <div className="text-[11px] text-gray-200 truncate leading-tight">
                        {eq.capacidade || '-'}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate leading-tight">
                        {eq.gas_refrigerante || '-'}
                      </div>
                    </td>

                    {/* STATUS: Badge Colorido */}
                    <td className="py-2 px-3 align-middle w-[140px] text-center">
                      {isParado && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                          <span>Parado (Crítico)</span>
                        </span>
                      )}

                      {isRestricao && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>Restrição</span>
                        </span>
                      )}

                      {isOk && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Operando (OK)</span>
                        </span>
                      )}

                      {!isParado && !isRestricao && !isOk && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                          <span>{eq.status}</span>
                        </span>
                      )}
                    </td>

                    {/* AÇÃO: Ficha > */}
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
          <span className="text-gray-300 font-medium">
            Mostrando {filteredEquipamentos.length} equipamentos
          </span>
          <span className="text-gray-600">·</span>
          <span className={paradosCount > 0 ? 'text-red-400 font-bold' : 'text-gray-400'}>
            {paradosCount} parado{paradosCount === 1 ? '' : 's'}
          </span>
          <span className="text-gray-600">·</span>
          <span className={restricaoCount > 0 ? 'text-amber-400 font-bold' : 'text-gray-400'}>
            {restricaoCount} em restrição
          </span>
        </div>

        <div className="hidden sm:inline text-gray-400 text-[10px] font-mono">
          ↑ Scroll para ver mais equipamentos
        </div>
      </footer>

      {/* MODAL: CONCILIAR LEVANTAMENTO 2026 */}
      {showConciliacaoModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConciliacaoModal(false);
          }}
        >
          <div className="bg-[#111827] border border-blue-500/30 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between bg-[#0A0E1A]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <div>
                  <h3 className="text-[14px] font-bold text-white uppercase tracking-tight">
                    Conciliação do Levantamento de Campo Jan/2026
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Vincule os registros legados às novas TAGs do parque AMBEV e gere ocorrências automáticas para os 44 itens marcados NOK.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConciliacaoModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success Alert */}
            {conciliadoSuccessMsg && (
              <div className="m-3 p-2.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{conciliadoSuccessMsg}</span>
              </div>
            )}

            {/* Modal Body: Split View */}
            <div className="p-3.5 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
              {/* Left Column: Lista de Registros Legados Pendentes */}
              <div className="border border-blue-500/20 rounded-md p-3 bg-[#0A0E1A] flex flex-col h-[380px]">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-white">
                    Registros Legados ({pendingLegados.length} pendentes)
                  </span>
                  <span className="text-[10px] font-mono text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/30">
                    {nokLegados.length} NOK (anomalias)
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {pendingLegados.map((leg) => {
                    const isSelected = selectedLegado?.id === leg.id;
                    return (
                      <div
                        key={leg.id}
                        onClick={() => {
                          setSelectedLegado(leg);
                          setConciliadoSuccessMsg(null);
                        }}
                        className={`p-2 rounded border cursor-pointer transition-colors text-[11px] ${
                          isSelected
                            ? 'bg-[#1a2235] border-blue-500 text-white'
                            : 'bg-[#111827] border-white/[0.06] text-gray-300 hover:border-blue-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-cyan-400">{leg.tag_legada}</span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${
                              leg.status_ok
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400 font-bold'
                            }`}
                          >
                            {leg.status_ok ? 'OK no Levantamento' : 'NOK (ANOMALIA)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-200 line-clamp-1">{leg.descricao}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {leg.localizacao_legada}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Painel de Vinculação & Abertura */}
              <div className="border border-blue-500/20 rounded-md p-3 bg-[#0A0E1A] flex flex-col justify-between h-[380px]">
                <div className="overflow-y-auto">
                  <h4 className="text-[11px] font-mono font-bold text-[#F59E0B] uppercase mb-2">
                    Vincular ao Equipamento Atual
                  </h4>

                  {selectedLegado ? (
                    <div className="space-y-2.5">
                      <div className="p-2.5 bg-[#111827] border border-blue-500/20 rounded">
                        <div className="text-[11px] font-mono text-cyan-400 font-bold">
                          {selectedLegado.tag_legada}
                        </div>
                        <div className="text-[11px] text-white mt-0.5">{selectedLegado.descricao}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Localização: {selectedLegado.localizacao_legada}
                        </div>
                        {selectedLegado.observacao_campo && (
                          <div className="mt-1.5 text-[10px] p-1.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded">
                            {selectedLegado.observacao_campo}
                          </div>
                        )}
                      </div>

                      {/* Select Target Equipment */}
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                          Selecione o Equipamento Ativo (TAG Nova):
                        </label>
                        <select
                          value={targetEquipId}
                          onChange={(e) => setTargetEquipId(e.target.value)}
                          className="w-full bg-[#111827] border border-blue-500/20 text-white text-[11px] rounded p-2 outline-none focus:border-blue-400"
                        >
                          <option value="">-- Escolha um equipamento da lista --</option>
                          {equipamentos.map((eq) => (
                            <option key={eq.id} value={eq.id}>
                              TAG {eq.tag} — {eq.tipo} ({eq.marca} {eq.modelo}) • {eq.linha_nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* If NOK: Offer automatic occurrence opening */}
                      {!selectedLegado.status_ok && (
                        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="check-open-nok-occ"
                              checked={openOccurrenceForNok}
                              onChange={(e) => setOpenOccurrenceForNok(e.target.checked)}
                              className="rounded border-gray-600 text-red-500 focus:ring-0"
                            />
                            <label htmlFor="check-open-nok-occ" className="text-[11px] text-white font-medium cursor-pointer">
                              Abrir Ocorrência Corretiva Automática (NOK)
                            </label>
                          </div>
                          <p className="text-[9px] text-gray-400">
                            Cria imediatamente um chamado de manutenção corretiva para resolução da lacuna.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-center text-gray-500">
                      <Sparkles className="w-6 h-6 text-gray-600 mb-1.5" />
                      <p className="text-[11px]">Selecione um registro legado à esquerda para conciliar.</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/[0.06] mt-2 shrink-0">
                  <button
                    id="btn-exec-conciliacao"
                    type="button"
                    disabled={!selectedLegado || !targetEquipId || conciliandoLoading}
                    onClick={handleExecConciliacao}
                    className="w-full h-[32px] rounded bg-[#F59E0B] hover:bg-[#D98E1A] text-black font-bold text-[11px] tracking-wider uppercase transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{conciliandoLoading ? 'Processando...' : 'Confirmar Conciliação'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO EQUIPAMENTO */}
      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewModal(false);
          }}
        >
          <div className="bg-[#111827] border border-blue-500/30 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between bg-[#0A0E1A]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <h3 className="text-[14px] font-bold text-white uppercase tracking-tight">
                  Novo Equipamento de Climatização
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">TAG (Etiqueta)*</label>
                  <input
                    type="text"
                    required
                    value={newEquip.tag}
                    onChange={(e) => setNewEquip({ ...newEquip, tag: e.target.value })}
                    placeholder="Ex: 361"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded font-mono text-[11px] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Patrimônio AMBEV</label>
                  <input
                    type="text"
                    value={newEquip.patrimonio}
                    onChange={(e) => setNewEquip({ ...newEquip, patrimonio: e.target.value })}
                    placeholder="PAT-AMB-00361"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded font-mono text-[11px] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Tag SAP (ACO...)</label>
                  <input
                    type="text"
                    value={newEquip.tag_sap}
                    onChange={(e) => setNewEquip({ ...newEquip, tag_sap: e.target.value })}
                    placeholder="ACO-L101-DEC-02"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded font-mono text-[11px] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Tipo</label>
                  <select
                    value={newEquip.tipo}
                    onChange={(e) => setNewEquip({ ...newEquip, tipo: e.target.value })}
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 text-white px-2 rounded text-[11px] outline-none"
                  >
                    <option value="CPE porta">CPE porta</option>
                    <option value="CPE teto">CPE teto</option>
                    <option value="Splitão">Splitão</option>
                    <option value="Chiller">Chiller</option>
                    <option value="Fan Coil">Fan Coil</option>
                    <option value="Self Contained">Self Contained</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Marca / Fabricante</label>
                  <input
                    type="text"
                    value={newEquip.marca}
                    onChange={(e) => setNewEquip({ ...newEquip, marca: e.target.value })}
                    placeholder="RITTAL, KRONES, YORK..."
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Modelo</label>
                  <input
                    type="text"
                    value={newEquip.modelo}
                    onChange={(e) => setNewEquip({ ...newEquip, modelo: e.target.value })}
                    placeholder="Blue e+ SK 3186.930"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none"
                  />
                </div>
              </div>

              {/* Localização */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">UG</label>
                  <select
                    value={newEquip.ug_id || hierarchy.ugs[0]?.id}
                    onChange={(e) => setNewEquip({ ...newEquip, ug_id: e.target.value })}
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 text-white px-2 rounded text-[11px] outline-none"
                  >
                    {hierarchy.ugs.map((u) => (
                      <option key={u.id} value={u.id}>{u.codigo} — {u.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Área</label>
                  <select
                    value={newEquip.area_id || hierarchy.areas[0]?.id}
                    onChange={(e) => setNewEquip({ ...newEquip, area_id: e.target.value })}
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 text-white px-2 rounded text-[11px] outline-none"
                  >
                    {hierarchy.areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Linha de Produção</label>
                  <select
                    value={newEquip.linha_id || hierarchy.linhas[0]?.id}
                    onChange={(e) => setNewEquip({ ...newEquip, linha_id: e.target.value })}
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 text-white px-2 rounded text-[11px] outline-none"
                  >
                    {hierarchy.linhas.map((l) => (
                      <option key={l.id} value={l.id}>{l.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Capacidade</label>
                  <input
                    type="text"
                    value={newEquip.capacidade}
                    onChange={(e) => setNewEquip({ ...newEquip, capacidade: e.target.value })}
                    placeholder="2.000 W / 60.000 BTU"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Gás Refrigerante</label>
                  <input
                    type="text"
                    value={newEquip.gas_refrigerante}
                    onChange={(e) => setNewEquip({ ...newEquip, gas_refrigerante: e.target.value })}
                    placeholder="R-134a / R-410A"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Tensão</label>
                  <input
                    type="text"
                    value={newEquip.tensao}
                    onChange={(e) => setNewEquip({ ...newEquip, tensao: e.target.value })}
                    placeholder="230V 1F / 380V 3F"
                    className="w-full h-[32px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-2.5 rounded text-[11px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-gray-400 mb-1 uppercase text-[9px] font-bold">Observações Técnicas</label>
                <textarea
                  rows={2}
                  value={newEquip.observacoes}
                  onChange={(e) => setNewEquip({ ...newEquip, observacoes: e.target.value })}
                  placeholder="Informações adicionais do ativo..."
                  className="w-full bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white p-2 rounded text-[11px] outline-none"
                />
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
                  className="h-[30px] px-4 rounded btn-primary-gradient font-bold tracking-wider uppercase text-[11px] cursor-pointer"
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
