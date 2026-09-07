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
import { FotoCard } from '../components/ocorrencias/FotoCard';

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
  const [pdfs, setPdfs] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);

  // New Event Form State
  const [novoComentario, setNovoComentario] = useState('');
  const [sendingEvent, setSendingEvent] = useState(false);

  // New Peca Modal
  const [showAddPecaModal, setShowAddPecaModal] = useState(false);
  const [confirmDeleteOrc, setConfirmDeleteOrc] = useState<Orcamento | null>(null);
  const [valorPecaDisplay, setValorPecaDisplay] = useState<string>('');
  const [newPeca, setNewPeca] = useState<Partial<PecaPendente>>({

    descricao: '',
    part_number: '',
    fabricante: '',
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

  const handleDeleteOrcamento = async (orc: Orcamento) => {
    try {
      await DataStore.deleteOrcamento(orc.id);
      await loadData();
    } catch (e) { console.error(e); }
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
        setPdfs(anx.filter((a) => a.tipo_anexo !== 'FOTO'));
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

      // Recalcular valor_total de todos os orçamentos vinculados a esta ocorrência
      const pecasAtualizadas = await DataStore.getPecasByOcorrencia(ocorrencia.id);
      const novoTotal = pecasAtualizadas.reduce((sum, p) => {
        const unit = Number(p.valor_unitario) || 0;
        const qtd = Number(p.quantidade) || 1;
        return sum + unit * qtd;
      }, 0);

      const orcsVinculados = await DataStore.getOrcamentosByOcorrencia(ocorrencia.id);
      for (const orc of orcsVinculados) {
        if (orc.id) {
          await DataStore.saveOrcamento({ id: orc.id, valor_total: novoTotal });
        }
      }

      setShowAddPecaModal(false);
      setValorPecaDisplay('');
      setNewPeca({
        descricao: '',
        part_number: '',
        fabricante: '',
        quantidade: 1,
        fornecedor: '',
        valor_unitario: 0,
        status: 'PENDENTE_COTACAO',
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletarPeca = async (pecaId: string) => {
    if (!confirm('Remover esta peça?')) return;
    try {
      await DataStore.deletePeca(pecaId);
      setPecas((prev) => prev.filter((p) => p.id !== pecaId));
    } catch (e) {
      console.error('Erro ao remover peça:', e);
      alert('Erro ao remover peça. Tente novamente.');
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
                {ocorrencia.ordem_sap ? `OS ${ocorrencia.ordem_sap}` : `OCORRÊNCIA #${ocorrencia.numero}`}
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
              anexos_links: [...fotos, ...pdfs].filter((a) => a.url).map((a) => ({ nome: a.legenda || a.nome || 'Anexo', url: a.url! })),
            }}
          />

          {/* Print Button - abre PDF anexado se existir */}
          <button
            onClick={() => {
              const pdfAnexo = pdfs.find((a) => a.url && (a.url.toLowerCase().includes('.pdf') || a.mime_type === 'application/pdf'));
              if (pdfAnexo?.url) {
                window.open(pdfAnexo.url, '_blank');
              } else if (pdfs.length > 0 && pdfs[0].url) {
                window.open(pdfs[0].url, '_blank');
              } else {
                window.print();
              }
            }}
            className="p-1.5 rounded-lg bg-[#161B22] hover:bg-[#21262D]  hover: border border-[#30363D] transition-colors cursor-pointer shrink-0"
            title="Imprimir / PDF"
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
                    Peças & Serviços ({pecas.length})
                  </h3>
                </div>
                {canEdit && (
                  <button
                    onClick={() => setShowAddPecaModal(true)}
                    className="btn-primary !py-1 !px-2.5 !text-[11px] gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Item</span>
                  </button>
                )}
              </div>

              {pecas.length === 0 ? (
                <p className="text-xs  italic py-2">
                  Nenhuma peça cadastrada para este reparo.
                </p>
              ) : (
                <div className="space-y-2">
                  {pecas.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-[#30363D] bg-[#0D1117] hover:bg-[#1C2128] transition-colors"
                    >
                      {/* Qtd badge */}
                      <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#E6EDF3', paddingTop: 2 }}>
                        {p.quantidade}x
                      </span>

                      {/* Info block */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ fontWeight: 700, fontSize: 12, color: '#E6EDF3' }}>{p.descricao}</span>
                          {p.fabricante && (
                            <span style={{ fontSize: 10, color: '#8B949E' }}>({p.fabricante})</span>
                          )}
                          {(() => {
                            const tipoItem = (p as any).tipo_item || 'PECA';
                            const tipoMap: Record<string, { label: string; color: string }> = {
                              PECA:       { label: '🔧 Peça',     color: '#38BDF8' },
                              SERVICO:    { label: '🛠️ Serviço',  color: '#A78BFA' },
                              HORA_EXTRA: { label: '⏱️ H. Extra', color: '#F5A623' },
                              INSUMO:     { label: '🧴 Insumo',   color: '#34D399' },
                              FRETE:      { label: '🚚 Frete',    color: '#FB923C' },
                            };
                            const cfg = tipoMap[tipoItem] || tipoMap.PECA;
                            return (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: cfg.color + '22', border: `1px solid ${cfg.color}55`, color: cfg.color }}>
                                {cfg.label}
                              </span>
                            );
                          })()}
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 8px',
                            borderRadius: 999, border: '1px solid #30363D',
                            background: '#21262D', color: '#8B949E'
                          }}>
                            {p.status}
                          </span>
                        </div>
                        {p.part_number && (
                          <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                            {p.part_number}
                          </div>
                        )}
                      </div>

                      {/* Valor */}
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#38BDF8', whiteSpace: 'nowrap', paddingTop: 2 }}>
                        {p.valor_unitario ? formatCurrency(p.valor_unitario) : '—'}
                      </span>

                      {/* Botão editar */}
                      <button
                        onClick={() => {
                          const unit = p.valor_unitario ? Number(p.valor_unitario) : 0;
                          setValorPecaDisplay(unit ? unit.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
                          setNewPeca({
                            id: p.id,
                            descricao: p.descricao,
                            part_number: p.part_number,
                            fabricante: p.fabricante,
                            quantidade: p.quantidade,
                            valor_unitario: p.valor_unitario,
                            status: p.status,
                            tipo_item: (p as any).tipo_item || 'PECA',
                          } as any);
                          setShowAddPecaModal(true);
                        }}
                        title="Editar peça"
                        style={{
                          background: 'none', border: '1px solid rgba(56,189,248,0.3)',
                          padding: '4px 6px', cursor: 'pointer', color: '#38BDF8',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '4px', flexShrink: 0
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(56,189,248,0.1)';
                          e.currentTarget.style.borderColor = '#38BDF8';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)';
                        }}
                      >
                        <Edit3 style={{ width: 13, height: 13 }} />
                      </button>
                      {/* Botão excluir — sempre visível */}
                      <button
                        onClick={() => handleDeletarPeca(p.id)}
                        title="Excluir peça"
                        style={{
                          background: 'none', border: '1px solid rgba(248,113,113,0.3)',
                          padding: '4px 6px', cursor: 'pointer', color: '#F87171',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '4px', flexShrink: 0
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.15)';
                          e.currentTarget.style.borderColor = '#F87171';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)';
                        }}
                      >
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  ))}
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
                    <span>Nova Proposta Comercial</span>
                  </button>
                )}
              </div>

              {orcamentos.length === 0 ? (
                <p className="text-xs  italic py-2">
                  Nenhum proposta comercial emitida para aprovação ainda.
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
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteOrc(orc); }}
                              title="Deletar proposta"
                              style={{ fontSize: 11, padding: '4px 8px', background: 'none', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 4, cursor: 'pointer', color: '#F87171' }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.15)'; e.currentTarget.style.borderColor = '#F87171'; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
                            >
                              🗑️
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
                    <FotoCard
                      key={f.id}
                      foto={f}
                      canDelete={Boolean(user?.role && ['ADMIN', 'GESTOR', 'ENCARREGADO'].includes(user.role))}
                      onDeletada={(idDeletado) => {
                        setFotos((prev) => prev.filter((item) => item.id !== idDeletado));
                      }}
                    />
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

      {/* MODAL: ADICIONAR / EDITAR ITEM */}
      {showAddPecaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-display font-bold uppercase">
              {newPeca.id ? 'Editar Item' : 'Adicionar Item'}
            </h3>
            <form onSubmit={handleSaveNewPeca} className="space-y-3.5 text-xs font-body">

              {/* Tipo de Item */}
              <div>
                <label className="block eyebrow mb-1">Tipo de Item</label>
                <div className="grid grid-cols-5 gap-1">
                  {([
                    { value: 'PECA',       label: '🔧 Peça',      color: '#38BDF8' },
                    { value: 'SERVICO',    label: '🛠️ Serviço',   color: '#A78BFA' },
                    { value: 'HORA_EXTRA', label: '⏱️ H. Extra',  color: '#F5A623' },
                    { value: 'INSUMO',     label: '🧴 Insumo',    color: '#34D399' },
                    { value: 'FRETE',      label: '🚚 Frete',     color: '#FB923C' },
                  ] as const).map(({ value, label, color }) => {
                    const selected = (newPeca.tipo_item || 'PECA') === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setNewPeca({ ...newPeca, tipo_item: value, fabricante: value === 'PECA' ? (newPeca.fabricante || '') : '', part_number: value === 'PECA' ? (newPeca.part_number || '') : '' })}
                        style={{
                          border: `1px solid ${selected ? color : '#30363D'}`,
                          background: selected ? `${color}22` : 'transparent',
                          color: selected ? color : '#8B949E',
                          borderRadius: 6, padding: '6px 2px', fontSize: 10, fontWeight: 700,
                          cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center', lineHeight: 1.4,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descrição — sempre visível */}
              <div>
                <label className="block eyebrow mb-1">
                  {(newPeca.tipo_item === 'HORA_EXTRA') ? 'Funcionário / Cargo' :
                   (newPeca.tipo_item === 'SERVICO') ? 'Descrição do Serviço' :
                   (newPeca.tipo_item === 'FRETE') ? 'Transportadora / Tipo de Frete' :
                   (newPeca.tipo_item === 'INSUMO') ? 'Descrição do Insumo' : 'Nome / Descrição da Peça'}
                </label>
                <input
                  type="text"
                  required
                  value={newPeca.descricao || ''}
                  onChange={(e) => setNewPeca({ ...newPeca, descricao: e.target.value })}
                  placeholder={
                    newPeca.tipo_item === 'HORA_EXTRA' ? 'Ex: Encarregado Arthur Silva' :
                    newPeca.tipo_item === 'SERVICO' ? 'Ex: Solda oxiacetilênica na tubulação' :
                    newPeca.tipo_item === 'FRETE' ? 'Ex: Jadlog — Entrega expressa' :
                    newPeca.tipo_item === 'INSUMO' ? 'Ex: Gás R-410A cilindro 11kg' :
                    'Ex: Compressor Scroll Copeland'
                  }
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] p-2.5 rounded-lg outline-none"
                />
              </div>

              {/* Detalhes secundários — variam por tipo */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Coluna esquerda */}
                <div>
                  {(!newPeca.tipo_item || newPeca.tipo_item === 'PECA') && (
                    <>
                      <label className="block eyebrow mb-1">Part Number</label>
                      <input type="text" value={newPeca.part_number || ''}
                        onChange={(e) => setNewPeca({ ...newPeca, part_number: e.target.value })}
                        placeholder="ZR61K3E-TFD"
                        className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] p-2.5 rounded-lg outline-none" />
                    </>
                  )}
                  {newPeca.tipo_item === 'SERVICO' && (
                    <>
                      <label className="block eyebrow mb-1">Prestador / Técnico</label>
                      <input type="text" value={newPeca.fabricante || ''}
                        onChange={(e) => setNewPeca({ ...newPeca, fabricante: e.target.value })}
                        placeholder="Ex: Vision Controls"
                        className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] p-2.5 rounded-lg outline-none" />
                    </>
                  )}
                  {newPeca.tipo_item === 'HORA_EXTRA' && (
                    <>
                      <label className="block eyebrow mb-1">Tipo de H. Extra</label>
                      <select value={newPeca.part_number || '100%'}
                        onChange={(e) => setNewPeca({ ...newPeca, part_number: e.target.value })}
                        className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] p-2.5 rounded-lg outline-none">
                        <option value="100%">100% (Domingo/Feriado)</option>
                        <option value="50%">50% (Dia útil)</option>
                        <option value="75%">75% (Sábado)</option>
                        <option value="SOBREAVISO">Sobreaviso</option>
                      </select>
                    </>
                  )}
                  {newPeca.tipo_item === 'INSUMO' && (
                    <>
                      <label className="block eyebrow mb-1">Referência / Código</label>
                      <input type="text" value={newPeca.part_number || ''}
                        onChange={(e) => setNewPeca({ ...newPeca, part_number: e.target.value })}
                        placeholder="Ex: R410A-DAC"
                        className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] p-2.5 rounded-lg outline-none" />
                    </>
                  )}
                  {newPeca.tipo_item === 'FRETE' && (
                    <>
                      <label className="block eyebrow mb-1">Nota Fiscal / Referência</label>
                      <input type="text" value={newPeca.part_number || ''}
                        onChange={(e) => setNewPeca({ ...newPeca, part_number: e.target.value })}
                        placeholder="Ex: NF 001234"
                        className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] p-2.5 rounded-lg outline-none" />
                    </>
                  )}
                </div>

                {/* Coluna direita: Quantidade */}
                <div>
                  <label className="block eyebrow mb-1">
                    {newPeca.tipo_item === 'HORA_EXTRA' ? 'Qtd Horas' :
                     newPeca.tipo_item === 'SERVICO' ? 'Qtd / Horas' :
                     newPeca.tipo_item === 'FRETE' ? 'Qtd Volumes' : 'Quantidade'}
                  </label>
                  <input
                    type="text" inputMode="numeric"
                    value={newPeca.quantidade === undefined || newPeca.quantidade === null ? '' : String(newPeca.quantidade)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setNewPeca({ ...newPeca, quantidade: raw === '' ? undefined : Number(raw) });
                    }}
                    onBlur={() => { if (!newPeca.quantidade || newPeca.quantidade < 1) setNewPeca({ ...newPeca, quantidade: 1 }); }}
                    placeholder="1"
                    className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] p-2.5 rounded-lg outline-none text-center"
                  />
                </div>
              </div>

              {/* Fabricante (só para PEÇA) e Valor */}
              <div className="grid grid-cols-2 gap-2.5">
                {(!newPeca.tipo_item || newPeca.tipo_item === 'PECA') && (
                  <div>
                    <label className="block eyebrow mb-1">Fabricante</label>
                    <input type="text" value={newPeca.fabricante || ''}
                      onChange={(e) => setNewPeca({ ...newPeca, fabricante: e.target.value })}
                      placeholder="Ex: Copeland"
                      className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] p-2.5 rounded-lg outline-none" />
                  </div>
                )}
                {(!newPeca.tipo_item || newPeca.tipo_item === 'PECA') && (
                  <div>
                    <label className="block eyebrow mb-1">NCM</label>
                    <input type="text" value={(newPeca as any).ncm || ''}
                      onChange={(e) => setNewPeca({ ...newPeca, ...{ ncm: e.target.value } })}
                      placeholder="Ex: 8415.10.11"
                      className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] p-2.5 rounded-lg outline-none font-mono" />
                  </div>
                )}
              </div>

              {/* Valor */}
              <div>
                <label className="block eyebrow mb-1">
                  {newPeca.tipo_item === 'HORA_EXTRA' ? 'Valor por Hora (R$)' :
                   newPeca.tipo_item === 'SERVICO' ? 'Valor Unitário (R$)' :
                   newPeca.tipo_item === 'FRETE' ? 'Valor Total do Frete (R$)' : 'Valor Estimado (R$)'}
                </label>
                <input
                  type="text" inputMode="numeric"
                  value={valorPecaDisplay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw === '') { setValorPecaDisplay(''); setNewPeca({ ...newPeca, valor_unitario: 0 }); return; }
                    const cents = parseInt(raw, 10);
                    const fmt = (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    setValorPecaDisplay(fmt);
                    setNewPeca({ ...newPeca, valor_unitario: cents / 100 });
                  }}
                  placeholder="0,00"
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7] p-2.5 rounded-lg outline-none font-mono text-right"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => { setShowAddPecaModal(false); setNewPeca({ descricao: '', part_number: '', fabricante: '', quantidade: 1, fornecedor: '', valor_unitario: 0, status: 'PENDENTE_COTACAO' }); setValorPecaDisplay(''); }}
                  className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary !py-1.5 !px-4 text-xs font-display font-bold cursor-pointer">
                  {newPeca.id ? 'Salvar Alterações' : 'Adicionar Item'}
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
        pecasVinculadas={pecas.map(p => ({
          descricao: p.descricao,
          part_number: p.part_number,
          fabricante: p.fabricante,
          quantidade: p.quantidade,
          valor_unitario: p.valor_unitario,
          ncm: p.ncm,
        }))}
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
      {/* Confirm Delete Orcamento */}
      {confirmDeleteOrc && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1C222A] border border-red-500/40 rounded-[6px] p-5 w-full max-w-sm shadow-2xl space-y-3">
            <p className="text-sm font-bold text-red-400">Deletar Proposta Comercial?</p>
            <p className="text-xs text-[#94A3B8]">Proposta <strong className="text-white">{confirmDeleteOrc.numero}</strong> será removida permanentemente. Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setConfirmDeleteOrc(null)} className="btn-secondary !text-xs !py-1.5 !px-3">Cancelar</button>
              <button
                onClick={async () => { await handleDeleteOrcamento(confirmDeleteOrc); setConfirmDeleteOrc(null); }}
                className="!text-xs !py-1.5 !px-3 bg-red-600 hover:bg-red-700 text-white rounded-[4px] font-semibold transition-colors"
              >Confirmar Deletar</button>
            </div>
          </div>
        </div>
      )}

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
        ocorrencia={ocorrencia}
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
