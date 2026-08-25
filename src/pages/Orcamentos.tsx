import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  FileText,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Plus,
  Send,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
  Bell,
  Eye,
  Building2,
  Calendar,
  Layers,
  Paperclip,
  Check,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import { Orcamento, OrcamentoStatus, Ocorrencia, VwEquipamento } from '../types/database';
import { IndustrialTag } from '../components/common/IndustrialTag';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency,
  formatDate,
  calculateDaysDiff,
  getOrcamentoStatusConfig,
  getOcorrenciaStatusConfig,
} from '../utils/formatters';
import { ModalOrcamentoDetalhe } from '../components/orcamentos/ModalOrcamentoDetalhe';
import { ModalRevisaoOrcamento } from '../components/orcamentos/ModalRevisaoOrcamento';
import { ModalNovoOrcamento } from '../components/orcamentos/ModalNovoOrcamento';
import { CompartilharOrcamento } from '../components/common/CompartilharOrcamento';

export const Orcamentos: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isAuthorizedToEdit =
    profile?.role === 'ADMIN' ||
    profile?.role === 'GESTOR' ||
    profile?.role === 'ENCARREGADO';

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [occsMap, setOccsMap] = useState<Map<string, Ocorrencia>>(new Map());
  const [equipsMap, setEquipsMap] = useState<Map<string, VwEquipamento>>(new Map());
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [onlyAlerts, setOnlyAlerts] = useState<boolean>(false);

  // Modal States
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [revisaoOrigem, setRevisaoOrigem] = useState<Orcamento | null>(null);
  const [isRevisaoOpen, setIsRevisaoOpen] = useState(false);

  const [isNovoOpen, setIsNovoOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [orcs, occs, eqs] = await Promise.all([
        DataStore.getOrcamentos(),
        DataStore.getOcorrencias(),
        DataStore.getVwEquipamentos(),
      ]);
      setOrcamentos(orcs);
      setOcorrencias(occs);
      setOccsMap(new Map(occs.map((o) => [o.id, o])));
      setEquipsMap(new Map(eqs.map((e) => [e.id, e])));
    } catch (e) {
      console.error(e);
      showToast('Erro ao carregar orçamentos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetail = (orc: Orcamento) => {
    setSelectedOrcamento(orc);
    setIsDetailOpen(true);
  };

  const handleOpenRevisao = (orc: Orcamento) => {
    setRevisaoOrigem(orc);
    setIsRevisaoOpen(true);
  };

  const handleOrcamentoUpdated = async (updated: Orcamento) => {
    await loadData();
    setSelectedOrcamento(updated);
  };

  const handleRevisaoCreated = async (novoOrc: Orcamento) => {
    await loadData();
    showToast(`Nova revisão ${novoOrc.numero} gerada com sucesso!`, 'success');
    setSelectedOrcamento(novoOrc);
    setIsDetailOpen(true);
  };

  const handleNovoCreated = async (novoOrc: Orcamento) => {
    await loadData();
    showToast(`Proposta ${novoOrc.numero} emitida com sucesso!`, 'success');
    setSelectedOrcamento(novoOrc);
    setIsDetailOpen(true);
  };

  const handleDirectApprove = async (e: React.MouseEvent, orc: Orcamento) => {
    e.stopPropagation();
    if (!isAuthorizedToEdit) return;
    try {
      await DataStore.saveOrcamento({ id: orc.id, status: 'APROVADO' });
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2ECC71', '#38BDF8', '#F5A623'],
      });
      showToast(`Orçamento ${orc.numero} aprovado! Equipamento liberado para execução.`, 'success');
      await loadData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao aprovar orçamento.', 'error');
    }
  };

  // Calculations & KPIs
  const totalValor = orcamentos.reduce((acc, o) => acc + o.valor_total, 0);

  const orcamentosAguardando = orcamentos.filter((o) => {
    const s = o.status;
    return s === 'ENVIADO' || s === 'EM_ANALISE' || s === 'EM_ANALISE_AMBEV';
  });

  const totalPendente = orcamentosAguardando.reduce((acc, o) => acc + o.valor_total, 0);

  // Budgets in alert (> 15 days)
  const orcamentosEmAlerta = orcamentosAguardando.filter((o) => {
    return calculateDaysDiff(o.data_envio) > 15;
  });

  const totalAprovado = orcamentos
    .filter((o) => o.status === 'APROVADO' || o.status === 'APROVADO_AMBEV' || o.status === 'FATURADO')
    .reduce((acc, o) => acc + o.valor_total, 0);

  const totalReprovado = orcamentos
    .filter(
      (o) =>
        o.status === 'REPROVADO' ||
        o.status === 'REJEITADO' ||
        o.status === 'REJEITADO_AMBEV' ||
        o.status === 'EXPIRADO'
    )
    .reduce((acc, o) => acc + o.valor_total, 0);

  // Filtered List
  const filteredOrcamentos = orcamentos.filter((orc) => {
    // Status Filter
    if (statusFilter) {
      if (statusFilter === 'AGUARDANDO') {
        if (
          orc.status !== 'ENVIADO' &&
          orc.status !== 'EM_ANALISE' &&
          orc.status !== 'EM_ANALISE_AMBEV'
        ) {
          return false;
        }
      } else if (statusFilter === 'APROVADO') {
        if (
          orc.status !== 'APROVADO' &&
          orc.status !== 'APROVADO_AMBEV' &&
          orc.status !== 'FATURADO'
        ) {
          return false;
        }
      } else if (statusFilter === 'REPROVADO') {
        if (
          orc.status !== 'REPROVADO' &&
          orc.status !== 'REJEITADO' &&
          orc.status !== 'REJEITADO_AMBEV' &&
          orc.status !== 'EXPIRADO'
        ) {
          return false;
        }
      } else if (orc.status !== statusFilter) {
        return false;
      }
    }

    // Only Alerts Filter (> 15 days)
    if (onlyAlerts) {
      const dias = calculateDaysDiff(orc.data_envio);
      const isAguardando =
        orc.status === 'ENVIADO' ||
        orc.status === 'EM_ANALISE' ||
        orc.status === 'EM_ANALISE_AMBEV';
      if (!isAguardando || dias <= 15) {
        return false;
      }
    }

    // Search filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const occ = occsMap.get(orc.ocorrencia_id);
      const eq = occ ? equipsMap.get(occ.equipamento_id) : null;

      const matchNum = orc.numero.toLowerCase().includes(q);
      const matchForn = (orc.fornecedor || '').toLowerCase().includes(q);
      const matchEnv = (orc.enviado_para || '').toLowerCase().includes(q);
      const matchTag = (eq?.tag || '').toLowerCase().includes(q);
      const matchOcc = (occ?.numero?.toString() || '').includes(q);

      if (!matchNum && !matchForn && !matchEnv && !matchTag && !matchOcc) {
        return false;
      }
    }

    return true;
  });

  const selectedOcc = selectedOrcamento ? occsMap.get(selectedOrcamento.ocorrencia_id) : null;
  const selectedEq = selectedOcc ? equipsMap.get(selectedOcc.equipamento_id) : null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-[4px] shadow-xl text-xs font-mono font-medium flex items-center gap-2 border animate-in slide-in-from-top-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-[#1C222A] text-[#2ECC71] border-[#2ECC71]'
              : toast.type === 'error'
              ? 'bg-[#1C222A] text-[#FF6B6B] border-[#E5484D]'
              : 'bg-[#1C222A] text-[#38BDF8] border-[#38BDF8]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
          ) : toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-[#FF6B6B]" />
          ) : (
            <FileText className="w-4 h-4 text-[#38BDF8]" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-widest text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded-[2px] border border-[#38BDF8]/30 uppercase font-bold">
              Gestão Comercial & Faturamento
            </span>
            <span className="text-[11px] font-mono text-[#6B7683]">•</span>
            <span className="text-[11px] font-mono text-[#94A3B8]">CONTRATO AMBEV CERVEJARIA RJ</span>
          </div>
          <h2 className="text-2xl font-condensed font-bold text-[#ECEFF1] tracking-wide uppercase">
            Orçamentos e Propostas de Manutenção
          </h2>
        </div>

        {isAuthorizedToEdit && (
          <button
            id="btn-emitir-novo-orcamento"
            onClick={() => setIsNovoOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-[#38BDF8] hover:bg-[#0284C7] text-[#14181D] font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Emitir Novo Orçamento</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Orçado */}
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1">
              Total Orçado
            </span>
            <div className="text-2xl font-condensed font-bold text-[#ECEFF1]">
              {formatCurrency(totalValor)}
            </div>
          </div>
          <p className="text-[10px] text-[#6B7683] font-mono mt-2">
            {orcamentos.length} proposta(s) emitida(s)
          </p>
        </div>

        {/* Aguardando Aprovação AMBEV com Alerta de 15 dias */}
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-3.5 relative overflow-hidden flex flex-col justify-between">
          {orcamentosEmAlerta.length > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#E5484D]/20 text-[#FF6B6B] border border-[#E5484D]/50 px-2 py-0.5 rounded text-[10px] font-mono font-bold animate-pulse">
              <Bell className="w-3 h-3 text-[#FF6B6B]" />
              <span>{orcamentosEmAlerta.length} em alerta (&gt;15d)</span>
            </div>
          )}
          <div>
            <span className="text-[10px] font-mono uppercase text-[#F5A623] block mb-1 font-bold">
              Aguardando Aprovação AMBEV
            </span>
            <div className="text-2xl font-condensed font-bold text-[#F5A623]">
              {formatCurrency(totalPendente)}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#94A3B8]">{orcamentosAguardando.length} proposta(s) na fila</span>
            {orcamentosEmAlerta.length > 0 ? (
              <span className="text-[#FF6B6B] font-bold">
                ⚠️ {orcamentosEmAlerta.length} sem resposta há +15d
              </span>
            ) : (
              <span className="text-[#2ECC71]">Prazos em dia</span>
            )}
          </div>
        </div>

        {/* Aprovados AMBEV */}
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#2ECC71] block mb-1">
              Aprovados pela AMBEV
            </span>
            <div className="text-2xl font-condensed font-bold text-[#2ECC71]">
              {formatCurrency(totalAprovado)}
            </div>
          </div>
          <p className="text-[10px] text-[#6B7683] font-mono mt-2">
            Liberados para compra e execução em campo
          </p>
        </div>

        {/* Reprovados / Expirados */}
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1">
              Reprovados / Expirados
            </span>
            <div className="text-2xl font-condensed font-bold text-[#94A3B8]">
              {formatCurrency(totalReprovado)}
            </div>
          </div>
          <p className="text-[10px] text-[#6B7683] font-mono mt-2">
            Candidatos a revisão e reenvio
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-busca-orcamentos"
              type="text"
              placeholder="Buscar por Nº, TAG, Fornecedor ou Contato..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#14181D] border border-[#2C343E] rounded-[3px] pl-8 pr-3 py-1.5 text-xs text-[#ECEFF1] placeholder-[#6B7683] focus:border-[#38BDF8] focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-mono uppercase text-[#94A3B8] shrink-0">
              Status:
            </label>
            <select
              id="select-status-orcamentos"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] text-xs rounded-[3px] px-2.5 py-1.5 outline-none font-mono"
            >
              <option value="">Todos os Status</option>
              <option value="AGUARDANDO">Aguardando Aprovação (Geral)</option>
              <option value="ENVIADO">Enviado</option>
              <option value="EM_ANALISE">Em Análise AMBEV</option>
              <option value="APROVADO">Aprovado AMBEV</option>
              <option value="REPROVADO">Reprovado / Rejeitado</option>
              <option value="EXPIRADO">Expirado</option>
              <option value="RASCUNHO">Rascunho</option>
            </select>
          </div>

          {/* Toggle Alert >15d */}
          <button
            id="btn-toggle-alerta-15d"
            type="button"
            onClick={() => setOnlyAlerts(!onlyAlerts)}
            className={`px-3 py-1.5 rounded-[3px] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors border ${
              onlyAlerts
                ? 'bg-[#E5484D]/25 text-[#FF6B6B] border-[#E5484D]/60'
                : 'bg-[#14181D] text-[#94A3B8] border-[#2C343E] hover:text-[#ECEFF1]'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${onlyAlerts ? 'text-[#FF6B6B]' : 'text-[#94A3B8]'}`} />
            <span>Alerta &gt;15 dias ({orcamentosEmAlerta.length})</span>
          </button>
        </div>

        <div className="text-right text-[11px] font-mono text-[#94A3B8]">
          Exibindo <span className="text-[#38BDF8] font-bold">{filteredOrcamentos.length}</span> de{' '}
          {orcamentos.length} proposta(s)
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] overflow-hidden shadow-lg">
        {filteredOrcamentos.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum orçamento encontrado"
            description="Não há propostas orçamentárias correspondentes aos critérios de busca."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#14181D] text-[#94A3B8] font-mono text-[10px] uppercase tracking-wider border-b border-[#2C343E]">
                  <th className="py-3 px-3">Nº Proposta</th>
                  <th className="py-3 px-3">Fornecedor / Emitente</th>
                  <th className="py-3 px-3">Ocorrência & TAG</th>
                  <th className="py-3 px-3">Data Envio</th>
                  <th className="py-3 px-3 text-center">Dias na AMBEV</th>
                  <th className="py-3 px-3">Valor Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C343E]/60 text-[#ECEFF1]">
                {filteredOrcamentos.map((orc) => {
                  const occ = occsMap.get(orc.ocorrencia_id);
                  const eq = occ ? equipsMap.get(occ.equipamento_id) : null;
                  const dias = calculateDaysDiff(orc.data_envio);
                  const isAguardando =
                    orc.status === 'ENVIADO' ||
                    orc.status === 'EM_ANALISE' ||
                    orc.status === 'EM_ANALISE_AMBEV';
                  const isLate = dias > 15 && isAguardando;
                  const isMedium = dias >= 8 && dias <= 15 && isAguardando;
                  const statusConf = getOrcamentoStatusConfig(orc.status);

                  return (
                    <tr
                      key={orc.id}
                      onClick={() => handleOpenDetail(orc)}
                      className="hover:bg-[#232B35] transition-colors cursor-pointer group"
                    >
                      {/* Nº Proposta */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sm text-[#38BDF8] group-hover:underline">
                            {orc.numero}
                          </span>
                          {(orc.arquivo_pdf_url || orc.arquivo_url) && (
                            <Paperclip className="w-3 h-3 text-[#94A3B8]" title="Possui PDF anexado" />
                          )}
                        </div>
                        {orc.enviado_para && (
                          <div className="text-[10px] text-[#94A3B8] truncate max-w-[180px]">
                            {orc.enviado_para}
                          </div>
                        )}
                      </td>

                      {/* Fornecedor */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#ECEFF1]">{orc.fornecedor}</div>
                        <div className="text-[10px] text-[#94A3B8] font-mono">
                          Validade: {orc.validade ? formatDate(orc.validade) : '30 dias'}
                        </div>
                      </td>

                      {/* Ocorrência & TAG */}
                      <td className="py-3 px-3">
                        {occ ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                              className="font-mono font-bold text-xs text-[#F5A623] hover:underline"
                            >
                              OS #{occ.numero}
                            </button>
                            {eq && (
                              <div className="mt-0.5">
                                <IndustrialTag tag={eq.tag} size="sm" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#6B7683] font-mono">-</span>
                        )}
                      </td>

                      {/* Data de Envio */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {formatDate(orc.data_envio)}
                      </td>

                      {/* Dias na AMBEV (Alerta 15 dias) */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[2px] font-mono text-xs font-bold border ${
                            isLate
                              ? 'bg-[#E5484D]/25 text-[#FF6B6B] border-[#E5484D]/60 animate-pulse'
                              : isMedium
                              ? 'bg-[#F5A623]/25 text-[#F5A623] border-[#F5A623]/60'
                              : 'bg-[#232B35] text-[#94A3B8] border-[#2C343E]'
                          }`}
                        >
                          {dias} dias
                        </span>
                        {isLate && (
                          <div className="text-[9px] text-[#FF6B6B] font-mono font-bold mt-0.5">
                            🚨 Alerta &gt;15d
                          </div>
                        )}
                      </td>

                      {/* Valor Total */}
                      <td className="py-3 px-3 font-mono font-bold text-sm text-[#38BDF8]">
                        {formatCurrency(orc.valor_total)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold border uppercase ${statusConf.badgeBg}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver Detalhe */}
                          <button
                            id={`btn-ver-orc-${orc.id}`}
                            onClick={() => handleOpenDetail(orc)}
                            title="Ver detalhes da proposta"
                            className="p-1.5 bg-[#14181D] hover:bg-[#38BDF8]/20 text-[#94A3B8] hover:text-[#38BDF8] border border-[#2C343E] rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Aprovar Direto (if authorized) */}
                          {isAuthorizedToEdit &&
                            orc.status !== 'APROVADO' &&
                            orc.status !== 'APROVADO_AMBEV' && (
                              <button
                                id={`btn-aprovar-orc-${orc.id}`}
                                onClick={(e) => handleDirectApprove(e, orc)}
                                title="Aprovar proposta comercial"
                                className="px-2 py-1 bg-[#2ECC71]/20 hover:bg-[#2ECC71] text-[#2ECC71] hover:text-[#14181D] border border-[#2ECC71]/40 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Aprovar</span>
                              </button>
                            )}
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

      {/* Modal 1: Detalhe & Edição do Orçamento */}
      <ModalOrcamentoDetalhe
        orcamento={selectedOrcamento}
        ocorrencia={selectedOcc}
        equipamento={selectedEq}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdated={handleOrcamentoUpdated}
        onOpenRevisao={(orc) => {
          setIsDetailOpen(false);
          handleOpenRevisao(orc);
        }}
      />

      {/* Modal 2: Copiar e Reenviar (Revisão) */}
      <ModalRevisaoOrcamento
        orcamentoOrigem={revisaoOrigem}
        isOpen={isRevisaoOpen}
        onClose={() => setIsRevisaoOpen(false)}
        onCreated={handleRevisaoCreated}
      />

      {/* Modal 3: Emitir Novo Orçamento */}
      <ModalNovoOrcamento
        isOpen={isNovoOpen}
        onClose={() => setIsNovoOpen(false)}
        onCreated={handleNovoCreated}
        ocorrencias={ocorrencias}
        equipamentosMap={equipsMap}
      />
    </div>
  );
};
