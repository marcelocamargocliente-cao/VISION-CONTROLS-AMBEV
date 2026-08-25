import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  Clock,
  CheckCircle2,
  Package,
  FileText,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import {
  Ocorrencia,
  OcorrenciaStatus,
  Criticidade,
  VwEquipamento,
} from '../types/database';
import { IndustrialTag } from '../components/common/IndustrialTag';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { CompartilharOcorrencia } from '../components/common/CompartilharOcorrencia';
import { useAuth } from '../context/AuthContext';
import {
  formatDate,
  calculateDaysDiff,
  getCriticidadeConfig,
  getOcorrenciaStatusConfig,
} from '../utils/formatters';

const KANBAN_COLUMNS: OcorrenciaStatus[] = [
  'ABERTA',
  'AGUARDANDO_ORCAMENTO',
  'ORCAMENTO_ENVIADO',
  'AGUARDANDO_APROVACAO_AMBEV',
  'APROVADA',
  'AGUARDANDO_PECA',
  'EM_EXECUCAO',
  'CONCLUIDA',
];

export const Ocorrencias: React.FC = () => {
  const navigate = useNavigate();
  const { canCreateOccurrence } = useAuth();

  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [equipamentosMap, setEquipamentosMap] = useState<Map<string, VwEquipamento>>(new Map());
  const [loading, setLoading] = useState(true);

  // Views & Filters
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCriticidade, setSelectedCriticidade] = useState<string>('');
  const [onlyParados, setOnlyParados] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [occs, equips] = await Promise.all([
        DataStore.getOcorrencias(),
        DataStore.getVwEquipamentos(),
      ]);
      setOcorrencias(occs);
      setEquipamentosMap(new Map(equips.map((e) => [e.id, e])));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOcorrencias = ocorrencias.filter((occ) => {
    const eq = equipamentosMap.get(occ.equipamento_id);
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      !term ||
      String(occ.numero).includes(term) ||
      (eq && eq.tag.toLowerCase().includes(term)) ||
      (eq && eq.modelo.toLowerCase().includes(term)) ||
      (eq && eq.linha_nome.toLowerCase().includes(term)) ||
      (occ.nota_sap && occ.nota_sap.includes(term)) ||
      (occ.ordem_sap && occ.ordem_sap.includes(term)) ||
      (occ.ordem_vision && occ.ordem_vision.toLowerCase().includes(term)) ||
      occ.descricao_anomalia.toLowerCase().includes(term);

    const matchesStatus = !selectedStatus || occ.status === selectedStatus;
    const matchesCrit = !selectedCriticidade || occ.criticidade === selectedCriticidade;
    const matchesParado = !onlyParados || occ.equipamento_parado;

    return matchesSearch && matchesStatus && matchesCrit && matchesParado;
  });

  const paradosCount = ocorrencias.filter((o) => o.equipamento_parado && o.status !== 'CONCLUIDA' && o.status !== 'CANCELADA').length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-widest text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-[2px] border border-[#F5A623]/30 uppercase font-bold">
              Gestão de Chamados & Avarias
            </span>
            <span className="text-[11px] font-mono text-[#6B7683]">•</span>
            <span className="text-[11px] font-mono text-[#FF6B6B]">
              {paradosCount} EQUIPAMENTOS PARADOS
            </span>
          </div>
          <h2 className="text-2xl font-condensed font-bold text-[#ECEFF1] tracking-wide uppercase">
            Fluxo de Ocorrências e Corretivas
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-0.5 flex items-center">
            <button
              onClick={() => setViewMode('lista')}
              className={`p-1.5 rounded-[3px] text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'lista' ? 'bg-[#232B35] text-[#F5A623] shadow-sm' : 'text-[#94A3B8] hover:text-[#ECEFF1]'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-[3px] text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban' ? 'bg-[#232B35] text-[#F5A623] shadow-sm' : 'text-[#94A3B8] hover:text-[#ECEFF1]'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          {/* + Nova Ocorrência */}
          {canCreateOccurrence && (
            <button
              id="btn-nova-ocorrencia-main"
              onClick={() => navigate('/ocorrencias/nova')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[4px] bg-[#E5484D] hover:bg-[#C93B40] text-white font-condensed tracking-wider uppercase transition-colors shadow-md font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Ocorrência</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-3 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por # número, TAG, linha, nota SAP, ordem SAP ou sintoma..."
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] pl-9 pr-3 py-2 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] text-xs rounded-[3px] px-2.5 py-2 outline-none"
            >
              <option value="">Todos os Status</option>
              {KANBAN_COLUMNS.map((st) => (
                <option key={st} value={st}>
                  {getOcorrenciaStatusConfig(st).label}
                </option>
              ))}
            </select>

            <select
              value={selectedCriticidade}
              onChange={(e) => setSelectedCriticidade(e.target.value)}
              className="bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] text-xs rounded-[3px] px-2.5 py-2 outline-none"
            >
              <option value="">Todas Criticidades</option>
              <option value="CRITICA">Crítica (Linha)</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Média</option>
              <option value="BAIXA">Baixa</option>
            </select>

            <button
              onClick={() => setOnlyParados(!onlyParados)}
              className={`px-3 py-2 text-xs font-semibold rounded-[3px] border transition-colors flex items-center gap-1.5 ${
                onlyParados
                  ? 'bg-[#E5484D]/20 text-[#FF6B6B] border-[#E5484D]'
                  : 'bg-[#14181D] text-[#94A3B8] border-[#2C343E] hover:text-[#ECEFF1]'
              }`}
            >
              <span className={`led-dot ${onlyParados ? 'led-alert animate-led-pulse' : 'led-off'}`} />
              <span>Só Parados</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: LISTA */}
      {viewMode === 'lista' && (
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] overflow-hidden shadow-lg">
          {filteredOcorrencias.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Nenhuma ocorrência encontrada"
              description="Não foram localizados chamados correspondentes aos filtros selecionados."
              actionLabel="Abrir Nova Ocorrência"
              onAction={() => navigate('/ocorrencias/nova')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#14181D] text-[#94A3B8] font-mono text-[10px] uppercase tracking-wider border-b border-[#2C343E]">
                    <th className="py-2.5 px-3">Nº / Data</th>
                    <th className="py-2.5 px-3">TAG & Equipamento</th>
                    <th className="py-2.5 px-3">Localização</th>
                    <th className="py-2.5 px-3">Criticidade</th>
                    <th className="py-2.5 px-3">Status Atual</th>
                    <th className="py-2.5 px-3">Parada / SAP</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C343E]/60 text-[#ECEFF1]">
                  {filteredOcorrencias.map((occ) => {
                    const eq = equipamentosMap.get(occ.equipamento_id);
                    const crit = getCriticidadeConfig(occ.criticidade);
                    const dias = calculateDaysDiff(occ.data_avaria);

                    return (
                      <tr
                        key={occ.id}
                        onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                        className="hover:bg-[#232B35] cursor-pointer transition-colors group"
                      >
                        {/* Nº / Data */}
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-sm text-[#F5A623]">#{occ.numero}</div>
                          <div className="text-[10px] text-[#94A3B8] font-mono">{formatDate(occ.data_avaria)}</div>
                        </td>

                        {/* TAG & Equipamento */}
                        <td className="py-3 px-3">
                          {eq ? <IndustrialTag tag={eq.tag} size="sm" /> : <span className="font-mono text-xs">TAG -</span>}
                          <div className="text-xs font-semibold text-[#ECEFF1] mt-1">
                            {eq ? `${eq.tipo} ${eq.marca}` : 'Equipamento'}
                          </div>
                        </td>

                        {/* Localização */}
                        <td className="py-3 px-3">
                          <div className="text-[#ECEFF1]">{eq?.linha_nome || '-'}</div>
                          <div className="text-[10px] text-[#94A3B8]">{eq?.centro_trabalho_nome}</div>
                        </td>

                        {/* Criticidade */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono border ${crit.badgeBg}`}>
                            {crit.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <StatusBadge type="ocorrencia" status={occ.status} size="sm" />
                        </td>

                        {/* Parada / SAP */}
                        <td className="py-3 px-3 font-mono text-[11px]">
                          {occ.equipamento_parado ? (
                            <span className="text-[#FF6B6B] font-bold">
                              PARADO ({dias}d)
                            </span>
                          ) : (
                            <span className="text-[#2ECC71]">Em Operação</span>
                          )}
                          <div className="text-[10px] text-[#94A3B8]">Nota: {occ.nota_sap || '-'}</div>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <CompartilharOcorrencia
                              compact
                              data={{
                                numero: occ.numero,
                                tag: eq?.tag || '-',
                                tipo: eq?.tipo || '-',
                                marca: eq?.marca,
                                modelo: eq?.modelo,
                                ug: eq?.ug_codigo,
                                linha: eq?.linha_nome,
                                centro_trabalho: eq?.centro_trabalho_nome,
                                data_avaria: occ.data_avaria,
                                dias_parado: dias,
                                nota_sap: occ.nota_sap,
                                ordem_sap: occ.ordem_sap,
                                ordem_vision: occ.ordem_vision,
                                status: occ.status,
                              }}
                            />
                            <button
                              onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                              className="p-1.5 rounded-[4px] bg-[#232B35] text-[#ECEFF1] hover:bg-[#2C343E]"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW: KANBAN */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex items-start gap-3 min-w-[1200px]">
            {KANBAN_COLUMNS.map((colStatus) => {
              const colConfig = getOcorrenciaStatusConfig(colStatus);
              const colOccs = filteredOcorrencias.filter((o) => o.status === colStatus);

              return (
                <div
                  key={colStatus}
                  className="w-72 bg-[#1C222A] border border-[#2C343E] rounded-[4px] flex flex-col max-h-[75vh] shrink-0"
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-[#2C343E] flex items-center justify-between bg-[#14181D]">
                    <div className="flex items-center gap-2">
                      <span className={`led-dot ${colConfig.ledClass}`} />
                      <span className="text-xs font-condensed font-bold text-[#ECEFF1] uppercase">
                        {colConfig.label}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#F5A623] bg-[#232B35] px-1.5 py-0.5 rounded">
                      {colOccs.length}
                    </span>
                  </div>

                  {/* Cards Body */}
                  <div className="p-2 space-y-2 overflow-y-auto flex-1">
                    {colOccs.length === 0 ? (
                      <div className="py-8 text-center text-[11px] text-[#6B7683] font-mono">
                        Nenhum chamado
                      </div>
                    ) : (
                      colOccs.map((occ) => {
                        const eq = equipamentosMap.get(occ.equipamento_id);
                        const dias = calculateDaysDiff(occ.data_avaria);
                        const crit = getCriticidadeConfig(occ.criticidade);

                        return (
                          <div
                            key={occ.id}
                            onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                            className="p-3 bg-[#14181D] hover:bg-[#232B35] border border-[#2C343E] hover:border-[#F5A623] rounded-[3px] cursor-pointer transition-colors space-y-2 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-[#F5A623]">#{occ.numero}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${crit.badgeBg}`}>
                                {crit.label}
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                {eq && <IndustrialTag tag={eq.tag} size="sm" />}
                              </div>
                              <p className="text-xs font-semibold text-[#ECEFF1] line-clamp-1">
                                {eq?.tipo} {eq?.marca}
                              </p>
                              <p className="text-[10px] text-[#94A3B8] line-clamp-1">{eq?.linha_nome}</p>
                            </div>

                            <p className="text-[11px] text-[#ECEFF1]/90 line-clamp-2 leading-relaxed">
                              {occ.descricao_anomalia}
                            </p>

                            <div className="pt-2 border-t border-[#2C343E] flex items-center justify-between text-[10px] font-mono">
                              {occ.equipamento_parado ? (
                                <span className="text-[#FF6B6B] font-bold">PARADO ({dias}d)</span>
                              ) : (
                                <span className="text-[#2ECC71]">Operando</span>
                              )}
                              <span className="text-[#94A3B8]">{formatDate(occ.data_avaria)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
