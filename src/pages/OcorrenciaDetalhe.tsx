import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Package,
  FileText,
  DollarSign,
  Camera,
  MessageSquare,
  Plus,
  Send,
  Printer,
  ChevronDown,
  Edit3,
  Calendar,
  Layers,
  Cpu,
  User,
  Shield,
  Trash2,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import {
  Ocorrencia,
  OcorrenciaStatus,
  OcorrenciaEvento,
  PecaPendente,
  Orcamento,
  Anexo,
  VwEquipamento,
} from '../types/database';
import { IndustrialTag } from '../components/common/IndustrialTag';
import { StatusBadge } from '../components/common/StatusBadge';
import { CompartilharOcorrencia } from '../components/common/CompartilharOcorrencia';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  calculateDaysDiff,
  getCriticidadeConfig,
  getOcorrenciaStatusConfig,
  gerarNumeroOrcamento,
} from '../utils/formatters';
import { ModalOrcamentoDetalhe } from '../components/orcamentos/ModalOrcamentoDetalhe';
import { ModalRevisaoOrcamento } from '../components/orcamentos/ModalRevisaoOrcamento';
import { ModalNovoOrcamento } from '../components/orcamentos/ModalNovoOrcamento';
import { ModalDuplicarOrcamento } from '../components/orcamentos/ModalDuplicarOrcamento';

const STATUS_FLOW: OcorrenciaStatus[] = [
  'ABERTA',
  'AGUARDANDO_ORCAMENTO',
  'ORCAMENTO_ENVIADO',
  'AGUARDANDO_APROVACAO_AMBEV',
  'APROVADA',
  'AGUARDANDO_PECA',
  'EM_EXECUCAO',
  'CONCLUIDA',
  'CANCELADA',
];

export const OcorrenciaDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canEdit } = useAuth();

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [equipamento, setEquipamento] = useState<VwEquipamento | null>(null);
  const [eventos, setEventos] = useState<OcorrenciaEvento[]>([]);
  const [pecas, setPecas] = useState<PecaPendente[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [fotos, setFotos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);

  // New Event Form State
  const [novoComentario, setNovoComentario] = useState('');
  const [sendingEvent, setSendingEvent] = useState(false);

  // New Peca Modal
  const [showAddPecaModal, setShowAddPecaModal] = useState(false);
  const [newPeca, setNewPeca] = useState<Partial<PecaPendente>>({
    descricao: '',
    part_number: '',
    fabricante: 'RITTAL',
    quantidade: 1,
    fornecedor: '',
    valor_unitario: 0,
    status: 'PENDENTE_COTACAO',
  });

  // New Orcamento Modal & Detalhes
  const [showAddOrcModal, setShowAddOrcModal] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [isOrcDetailOpen, setIsOrcDetailOpen] = useState(false);
  const [isOrcEditMode, setIsOrcEditMode] = useState(false);
  const [duplicarOrigem, setDuplicarOrigem] = useState<Orcamento | null>(null);
  const [isDuplicarOpen, setIsDuplicarOpen] = useState(false);
  const [revisaoOrigem, setRevisaoOrigem] = useState<Orcamento | null>(null);
  const [isRevisaoOpen, setIsRevisaoOpen] = useState(false);

  const abrirEdicao = (orc: Orcamento) => {
    setSelectedOrcamento(orc);
    setIsOrcEditMode(true);
    setIsOrcDetailOpen(true);
  };

  const abrirDuplicar = (orc: Orcamento) => {
    setDuplicarOrigem(orc);
    setIsDuplicarOpen(true);
  };

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const occ = await DataStore.getOcorrenciaById(id);
      if (occ) {
        setOcorrencia(occ);
        const [eq, evts, pcs, orcs, anx] = await Promise.all([
          DataStore.getEquipamentoById(occ.equipamento_id),
          DataStore.getEventosByOcorrencia(occ.id),
          DataStore.getPecasByOcorrencia(occ.id),
          DataStore.getOrcamentosByOcorrencia(occ.id),
          DataStore.getAnexos(occ.equipamento_id, occ.id),
        ]);
        setEquipamento(eq || null);
        setEventos(evts);
        setPecas(pcs);
        setOrcamentos(orcs);
        setFotos(anx.filter((a) => a.tipo_anexo === 'FOTO'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusChange = async (newStatus: OcorrenciaStatus) => {
    if (!ocorrencia) return;
    try {
      await DataStore.updateOcorrenciaStatus(
        ocorrencia.id,
        newStatus,
        `Status atualizado para ${getOcorrenciaStatusConfig(newStatus).label}`,
        user?.nome
      );
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocorrencia || !novoComentario.trim()) return;
    setSendingEvent(true);
    try {
      await DataStore.addEvento({
        ocorrencia_id: ocorrencia.id,
        tipo_evento: 'COMENTARIO',
        descricao: novoComentario.trim(),
        autor_nome: user?.nome || 'Usuário Vision',
      });
      setNovoComentario('');
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSendingEvent(false);
    }
  };

  const handleSaveNewPeca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocorrencia || !newPeca.descricao) return;
    try {
      await DataStore.savePeca({
        ...newPeca,
        ocorrencia_id: ocorrencia.id,
        equipamento_id: ocorrencia.equipamento_id,
      });
      setShowAddPecaModal(false);
      setNewPeca({
        descricao: '',
        part_number: '',
        fabricante: 'RITTAL',
        quantidade: 1,
        fornecedor: '',
        valor_unitario: 0,
        status: 'PENDENTE_COTACAO',
      });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ocorrencia || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target?.result as string;
      if (url) {
        await DataStore.addAnexo({
          ocorrencia_id: ocorrencia.id,
          equipamento_id: ocorrencia.equipamento_id,
          nome_arquivo: file.name,
          url,
          tipo_anexo: 'FOTO',
          bucket: 'fotos',
        });
        await loadData();
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="p-8 text-center   text-xs">
        Carregando detalhes da ocorrência...
      </div>
    );
  }

  if (!ocorrencia) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertTriangle}
          title="Ocorrência não encontrada"
          description="O protocolo solicitado não existe ou foi removido."
          actionLabel="Voltar para ocorrências"
          onAction={() => navigate('/ocorrencias')}
        />
      </div>
    );
  }

  const diasParado = calculateDaysDiff(ocorrencia.data_avaria);
  const critConfig = getCriticidadeConfig(ocorrencia.criticidade);
  const totalOrcamentos = orcamentos.reduce((acc, o) => acc + o.valor_total, 0);

  return (
    <div
      id="ocorrencia-detalhe-page"
      className="ocorrencia-detalhe-page h-full w-full flex flex-col overflow-hidden bg-[#0D1117] font-body "
    >
      {/* HEADER FIXO (shrink-0) — número da ocorrência, criticidade, fase e ações */}
      <header className="ocorrencia-header no-print shrink-0 px-4 py-2.5 border-b border-[#30363D] bg-[#0D1117] sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/ocorrencias')}
            className="p-1.5 rounded-lg bg-[#161B22] hover:bg-[#21262D]  hover: border border-[#30363D] transition-colors cursor-pointer shrink-0"
            title="Voltar para ocorrências"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-extrabold text-[15px] sm:text-base  tracking-tight">
                OCORRÊNCIA #{ocorrencia.numero}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px]  font-semibold border ${critConfig.badgeBg}`}>
                {critConfig.label}
              </span>
            </div>
            <p className="text-[11px]  font-body truncate">
              Registrada em {formatDate(ocorrencia.data_avaria)} por <strong className=" font-medium">{ocorrencia.relatante_nome}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown Controller */}
          {canEdit && (
            <div className="relative inline-block text-left">
              <select
                value={ocorrencia.status}
                onChange={(e) => handleStatusChange(e.target.value as OcorrenciaStatus)}
                className="bg-[#161B22] border border-[#2F81F7]/60  font-display font-bold text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer tracking-wide hover:border-[#2F81F7] transition-colors"
              >
                {STATUS_FLOW.map((st) => (
                  <option key={st} value={st} className="bg-[#161B22] ">
                    Fase: {getOcorrenciaStatusConfig(st).label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Compartilhar Button */}
          <CompartilharOcorrencia
            data={{
              numero: ocorrencia.numero,
              tag: equipamento?.tag || 'TAG',
              tipo: equipamento?.tipo || 'Equipamento',
              marca: equipamento?.marca,
              modelo: equipamento?.modelo,
              ug: equipamento?.ug_codigo,
              linha: equipamento?.linha_nome,
              centro_trabalho: equipamento?.centro_trabalho_nome,
              data_avaria: ocorrencia.data_avaria,
              dias_parado: diasParado,
              nota_sap: ocorrencia.nota_sap,
              ordem_sap: ocorrencia.ordem_sap,
              ordem_vision: ocorrencia.ordem_vision,
              status: ocorrencia.status,
              pecas_resumo: pecas.map((p) => `${p.quantidade}x ${p.descricao}`).join(', '),
              orcamento_valor: totalOrcamentos > 0 ? totalOrcamentos : undefined,
            }}
          />

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg bg-[#161B22] hover:bg-[#21262D]  hover: border border-[#30363D] transition-colors cursor-pointer shrink-0"
            title="Imprimir Relatório Técnico"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CARD RESUMO DO EQUIPAMENTO FIXO (shrink-0) */}
      <div className="ocorrencia-equipamento-card shrink-0 px-4 pt-3">
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-3.5 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div>
            <span className="eyebrow  block mb-1">Equipamento Ativo</span>
            <div className="flex items-center gap-2.5">
              {equipamento && <IndustrialTag tag={equipamento.tag} size="lg" />}
              <div className="min-w-0">
                <p className="font-display font-bold  text-xs sm:text-sm truncate">{equipamento?.tipo || 'Equipamento'}</p>
                <p className="text-[11px]   truncate">{equipamento?.marca} {equipamento?.modelo}</p>
              </div>
            </div>
          </div>

          <div>
            <span className="eyebrow  block mb-1">Localização na Fábrica</span>
            <p className="font-semibold text-xs truncate">
              {[equipamento?.centro_trabalho_sap, equipamento?.centro_trabalho_nome].filter(Boolean).join(' - ') || equipamento?.linha_nome || 'Área Fabril'}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              UG {equipamento?.ug_codigo || 'N/D'} {equipamento?.tag_sap ? `• ${equipamento.tag_sap}` : ''}
            </p>
          </div>

          <div>
            <span className="eyebrow  block mb-1">Status Operacional</span>
            {ocorrencia.equipamento_parado ? (
              <div className="flex items-center gap-2">
                <span className="led-dot led-alert animate-led-pulse" />
                <span className=" font-bold text-xs ">
                  PARADO HÁ {diasParado} DIAS
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="led-dot led-ok" />
                <span className=" font-bold text-xs ">
                  EM OPERAÇÃO
                </span>
              </div>
            )}
            {ocorrencia.parou_linha && (
              <p className="text-[10px]   mt-0.5">⚠️ Impactou Linha de Produção</p>
            )}
          </div>

          <div>
            <span className="eyebrow  block mb-1">Controle SAP / Vision</span>
            <div className="text-[11px]  space-y-0.5">
              <div className="truncate">Nota SAP: <strong className="">{ocorrencia.nota_sap || '-'}</strong></div>
              <div className="truncate">Ordem SAP: <strong className="">{ocorrencia.ordem_sap || '-'}</strong></div>
              <div className="truncate">OS Vision: <strong className="">{ocorrencia.ordem_vision || '-'}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (ROLA COM SCROLL DEDICADO) */}
      <div className="ocorrencia-content flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3.5 items-start max-w-7xl mx-auto">
          {/* Coluna Principal (Esquerda) */}
          <div className="space-y-3.5 min-w-0">
            {/* Card: Diagnóstico de Engenharia & Avaria */}
            <div className="card space-y-3">
              <div className="flex items-center gap-2 border-b border-[#30363D] pb-2">
                <Cpu className="w-4 h-4 " />
                <h3 className="card-title text-xs uppercase ">
                  Diagnóstico de Engenharia & Avaria
                </h3>
              </div>
              <div>
                <span className="eyebrow  block mb-1.5">Descrição do Problema</span>
                <p className="text-xs  bg-[#0D1117] p-3 rounded-lg border border-[#30363D] leading-relaxed">
                  {ocorrencia.descricao_anomalia}
                </p>
              </div>
              {ocorrencia.causa_provavel && (
                <div>
                  <span className="eyebrow  block mb-1.5">Causa Raiz Provável</span>
                  <p className="text-xs  bg-[#0D1117] p-2.5 rounded-lg border border-[#30363D]">
                    {ocorrencia.causa_provavel}
                  </p>
                </div>
              )}
            </div>

            {/* Card: Peças & Componentes */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 " />
                  <h3 className="card-title text-xs uppercase ">
                    Peças & Componentes ({pecas.length})
                  </h3>
                </div>
                {canEdit && (
                  <button
                    onClick={() => setShowAddPecaModal(true)}
                    className="btn-primary !py-1 !px-2.5 !text-[11px] gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Peça</span>
                  </button>
                )}
              </div>

              {pecas.length === 0 ? (
                <p className="text-xs  italic py-2">
                  Nenhuma peça cadastrada para este reparo.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[#30363D]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#0D1117]  table-header">
                        <th className="p-2.5">Qtd</th>
                        <th className="p-2.5">Descrição & Fabricante</th>
                        <th className="p-2.5">Part Number</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Valor Unit.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30363D] ">
                      {pecas.map((p) => (
                        <tr key={p.id} className="hover:bg-[#1C2128] transition-colors">
                          <td className="p-2.5  font-bold ">{p.quantidade}x</td>
                          <td className="p-2.5">
                            <span className="font-semibold ">{p.descricao}</span>
                            <span className="text-[10px]  ml-2 ">({p.fabricante})</span>
                          </td>
                          <td className="p-2.5  ">{p.part_number || '-'}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px]  bg-[#21262D]  border border-[#30363D]">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right  ">
                            {p.valor_unitario ? formatCurrency(p.valor_unitario) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Card: Orçamentos AMBEV */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 " />
                  <h3 className="card-title text-xs uppercase ">
                    Orçamentos AMBEV ({orcamentos.length})
                  </h3>
                </div>
                {canEdit && (
                  <button
                    onClick={() => setShowAddOrcModal(true)}
                    className="btn-primary !py-1 !px-2.5 !text-[11px] gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Proposta</span>
                  </button>
                )}
              </div>

              {orcamentos.length === 0 ? (
                <p className="text-xs  italic py-2">
                  Nenhum orçamento emitido para aprovação ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {orcamentos.map((orc) => (
                    <div
                      key={orc.id}
                      onClick={() => {
                        setSelectedOrcamento(orc);
                        setIsOrcEditMode(false);
                        setIsOrcDetailOpen(true);
                      }}
                      className="p-3 bg-[#0D1117] hover:bg-[#1C2128] border border-[#30363D] hover:border-[#2F81F7]/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs cursor-pointer transition-all group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold group-hover:underline">
                            {orc.numero}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#21262D] border border-[#30363D] font-mono">
                            {orc.status}
                          </span>
                        </div>
                        <p className="mt-1 font-medium truncate">{orc.fornecedor}</p>
                        <p className="text-[10px] text-[#8B949E]">
                          Enviado em {formatDate(orc.data_envio)} • {calculateDaysDiff(orc.data_envio)} dias aguardando
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1">
                          <span className="text-sm font-bold text-[#38BDF8]">
                            {formatCurrency(orc.valor_total)}
                          </span>
                          <span className="block text-[10px] text-[#8B949E] hidden sm:inline">Clique para detalhes</span>
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ fontSize: 11, padding: '4px 10px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirEdicao(orc);
                              }}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ fontSize: 11, padding: '4px 10px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirDuplicar(orc);
                              }}
                            >
                              📋 Duplicar e Reenviar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card: Fotos da Ocorrência */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 " />
                  <h3 className="card-title text-xs uppercase ">
                    Galeria de Fotos da Avaria ({fotos.length})
                  </h3>
                </div>
                {canEdit && (
                  <label className="btn-secondary !py-1 !px-2.5 !text-[11px] gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Anexar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleUploadPhoto}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {fotos.length === 0 ? (
                <p className="text-xs  italic py-2">
                  Nenhuma foto anexada a este chamado.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {fotos.map((f) => (
                    <div key={f.id} className="aspect-video bg-[#0D1117] border border-[#30363D] rounded-lg overflow-hidden group">
                      <img src={f.url} alt={f.nome_arquivo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Lateral (Direita, 320px) — Histórico & Timeline Sticky */}
          <div className="lg:sticky lg:top-0 space-y-3.5">
            <div className="card flex flex-col max-h-[calc(100vh-210px)] lg:max-h-[calc(100vh-190px)] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#30363D] pb-2 mb-3 shrink-0">
                <MessageSquare className="w-4 h-4 " />
                <h3 className="card-title text-xs uppercase ">
                  Histórico & Timeline ({eventos.length})
                </h3>
              </div>

              {/* Timeline Stream Scrollable */}
              <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-1">
                {eventos.length === 0 ? (
                  <p className="text-xs  italic py-2">Nenhum registro no histórico.</p>
                ) : (
                  eventos.map((evt) => (
                    <div key={evt.id} className="p-2.5 bg-[#0D1117] border border-[#30363D] rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] ">
                        <span className="font-bold ">{evt.autor_nome}</span>
                        <span className="">{formatDateTime(evt.created_at)}</span>
                      </div>
                      <p className=" leading-relaxed font-body text-[12px]">{evt.descricao}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Event / Comment Form */}
              <form onSubmit={handleAddComment} className="pt-3 border-t border-[#30363D] mt-3 space-y-2 shrink-0">
                <textarea
                  rows={2}
                  required
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Adicionar nota de campo, avanço no conserto ou alinhamento..."
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  text-xs p-2 rounded-lg outline-none resize-none font-body"
                />
                <button
                  type="submit"
                  disabled={sendingEvent || !novoComentario.trim()}
                  className="btn-primary w-full !py-2 text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingEvent ? 'Gravando...' : 'Publicar Nota'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADICIONAR PEÇA */}
      {showAddPecaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-display font-bold  uppercase">
              Adicionar Peça / Componente
            </h3>
            <form onSubmit={handleSaveNewPeca} className="space-y-3.5 text-xs font-body">
              <div>
                <label className="block eyebrow  mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={newPeca.descricao || ''}
                  onChange={(e) => setNewPeca({ ...newPeca, descricao: e.target.value })}
                  placeholder="Ex: Compressor Scroll Copeland"
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block eyebrow  mb-1">Part Number</label>
                  <input
                    type="text"
                    value={newPeca.part_number || ''}
                    onChange={(e) => setNewPeca({ ...newPeca, part_number: e.target.value })}
                    placeholder="ZR61K3E-TFD"
                    className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none "
                  />
                </div>
                <div>
                  <label className="block eyebrow  mb-1">Quantidade</label>
                  <input
                    type="number"
                    min={1}
                    value={newPeca.quantidade || 1}
                    onChange={(e) => setNewPeca({ ...newPeca, quantidade: Number(e.target.value) })}
                    className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none "
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block eyebrow  mb-1">Fabricante</label>
                  <input
                    type="text"
                    value={newPeca.fabricante || ''}
                    onChange={(e) => setNewPeca({ ...newPeca, fabricante: e.target.value })}
                    placeholder="Copeland"
                    className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block eyebrow  mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={newPeca.valor_unitario || 0}
                    onChange={(e) => setNewPeca({ ...newPeca, valor_unitario: Number(e.target.value) })}
                    className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none "
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPecaModal(false)}
                  className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary !py-1.5 !px-4 text-xs font-display font-bold cursor-pointer"
                >
                  Salvar Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cadastro de Proposta / Orçamento Completo */}
      <ModalNovoOrcamento
        isOpen={showAddOrcModal}
        onClose={() => setShowAddOrcModal(false)}
        onCreated={async (novoOrc) => {
          await loadData();
          setSelectedOrcamento(novoOrc);
          setIsOrcDetailOpen(true);
        }}
        defaultOcorrenciaId={ocorrencia?.id}
        ocorrencias={ocorrencia ? [ocorrencia] : []}
        equipamentosMap={equipamento ? new Map([[equipamento.id, equipamento]]) : new Map()}
      />

      {/* Modal Detalhe do Orçamento */}
      <ModalOrcamentoDetalhe
        orcamento={selectedOrcamento}
        ocorrencia={ocorrencia}
        equipamento={equipamento}
        isOpen={isOrcDetailOpen}
        initialEditMode={isOrcEditMode}
        onClose={() => {
          setIsOrcDetailOpen(false);
          setIsOrcEditMode(false);
        }}
        onUpdated={async (updatedOrc) => {
          setSelectedOrcamento(updatedOrc);
          await loadData();
        }}
        onOpenRevisao={(orc) => {
          setIsOrcDetailOpen(false);
          setIsOrcEditMode(false);
          setDuplicarOrigem(orc);
          setIsDuplicarOpen(true);
        }}
      />

      {/* Modal Duplicar e Reenviar Proposta */}
      <ModalDuplicarOrcamento
        orcamentoOriginal={duplicarOrigem}
        ocorrenciaId={ocorrencia?.id || ''}
        isOpen={isDuplicarOpen}
        onFechar={() => {
          setIsDuplicarOpen(false);
          setDuplicarOrigem(null);
        }}
        onSalvo={async () => {
          await loadData();
        }}
      />

      {/* Modal Revisão do Orçamento */}
      <ModalRevisaoOrcamento
        orcamentoOrigem={revisaoOrigem}
        isOpen={isRevisaoOpen}
        onClose={() => setIsRevisaoOpen(false)}
        onCreated={async (novoOrc) => {
          await loadData();
          setSelectedOrcamento(novoOrc);
          setIsOrcDetailOpen(true);
        }}
      />
    </div>
  );
};
