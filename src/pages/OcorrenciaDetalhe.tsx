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
  const [revisaoOrigem, setRevisaoOrigem] = useState<Orcamento | null>(null);
  const [isRevisaoOpen, setIsRevisaoOpen] = useState(false);

  const [newOrc, setNewOrc] = useState<Partial<Orcamento>>({
    numero: '',
    fornecedor: 'Rittal Sistemas Eletromecânicos Ltda',
    valor_total: 0,
    data_envio: new Date().toISOString().slice(0, 10),
    enviado_para: 'Engenharia de Utilidades AMBEV',
    status: 'ENVIADO',
  });

  const handleOpenAddOrcModal = () => {
    setNewOrc({
      numero: gerarNumeroOrcamento(),
      fornecedor: 'Rittal Sistemas Eletromecânicos Ltda',
      valor_total: 0,
      data_envio: new Date().toISOString().slice(0, 10),
      enviado_para: 'Engenharia de Utilidades AMBEV',
      status: 'ENVIADO',
    });
    setShowAddOrcModal(true);
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

  const handleSaveNewOrcamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocorrencia || !newOrc.numero || !newOrc.valor_total) return;
    try {
      await DataStore.saveOrcamento({
        ...newOrc,
        ocorrencia_id: ocorrencia.id,
      });
      setShowAddOrcModal(false);
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
      <div className="p-8 text-center text-[#94A3B8] font-mono text-xs">
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
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Controls & Navigation */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C343E] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ocorrencias')}
            className="p-2 rounded-[4px] bg-[#1C222A] hover:bg-[#232B35] text-[#94A3B8] hover:text-[#ECEFF1] border border-[#2C343E]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-lg text-[#F5A623]">
                OCORRÊNCIA #{ocorrencia.numero}
              </span>
              <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono border ${critConfig.badgeBg}`}>
                {critConfig.label}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] font-mono">
              Registrada em {formatDate(ocorrencia.data_avaria)} por {ocorrencia.relatante_nome}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown Controller */}
          {canEdit && (
            <div className="relative inline-block text-left">
              <select
                value={ocorrencia.status}
                onChange={(e) => handleStatusChange(e.target.value as OcorrenciaStatus)}
                className="bg-[#14181D] border-2 border-[#F5A623] text-[#F5A623] font-bold text-xs rounded-[4px] px-3 py-2 outline-none cursor-pointer uppercase font-condensed tracking-wider"
              >
                {STATUS_FLOW.map((st) => (
                  <option key={st} value={st}>
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
            className="p-2 rounded-[4px] bg-[#1C222A] hover:bg-[#232B35] text-[#ECEFF1] border border-[#2C343E]"
            title="Imprimir Relatório Técnico"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BANNER: ATIVO & LOCALIZAÇÃO */}
      <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 shadow-lg grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div>
          <span className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Equipamento Ativo</span>
          <div className="flex items-center gap-2">
            {equipamento && <IndustrialTag tag={equipamento.tag} size="lg" />}
            <div>
              <p className="font-bold text-[#ECEFF1] text-sm">{equipamento?.tipo}</p>
              <p className="text-[11px] text-[#94A3B8] font-mono">{equipamento?.marca} {equipamento?.modelo}</p>
            </div>
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Localização na Fábrica</span>
          <p className="font-semibold text-[#ECEFF1] text-xs">{equipamento?.linha_nome}</p>
          <p className="text-[11px] text-[#94A3B8]">{equipamento?.ug_codigo} • {equipamento?.centro_trabalho_nome}</p>
        </div>

        <div>
          <span className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Status Operacional</span>
          {ocorrencia.equipamento_parado ? (
            <div className="flex items-center gap-2">
              <span className="led-dot led-alert animate-led-pulse" />
              <span className="font-mono font-bold text-xs text-[#FF6B6B]">
                PARADO HÁ {diasParado} DIAS
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="led-dot led-ok" />
              <span className="font-mono font-bold text-xs text-[#2ECC71]">
                EM OPERAÇÃO
              </span>
            </div>
          )}
          {ocorrencia.parou_linha && (
            <p className="text-[10px] font-mono text-[#FF8787] mt-0.5">⚠️ Impactou Linha de Produção</p>
          )}
        </div>

        <div>
          <span className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Controle SAP / Vision</span>
          <div className="text-[11px] font-mono space-y-0.5">
            <div>Nota SAP: <strong className="text-[#38BDF8]">{ocorrencia.nota_sap || '-'}</strong></div>
            <div>Ordem SAP: <strong className="text-[#38BDF8]">{ocorrencia.ordem_sap || '-'}</strong></div>
            <div>OS Vision: <strong className="text-[#F5A623]">{ocorrencia.ordem_vision || '-'}</strong></div>
          </div>
        </div>
      </div>

      {/* GRID: DIAGNÓSTICO + TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda (2 cols): Diagnóstico, Peças, Orçamentos, Fotos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Anomalia & Diagnóstico */}
          <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#F5A623] uppercase tracking-wider border-b border-[#2C343E] pb-1">
              Diagnóstico de Engenharia & Avaria
            </h3>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1">Descrição do Problema</span>
              <p className="text-xs text-[#ECEFF1] bg-[#14181D] p-3 rounded-[3px] border border-[#2C343E] leading-relaxed">
                {ocorrencia.descricao_anomalia}
              </p>
            </div>
            {ocorrencia.causa_provavel && (
              <div>
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1">Causa Raiz Provável</span>
                <p className="text-xs text-[#ECEFF1] bg-[#14181D] p-2.5 rounded-[3px] border border-[#2C343E]">
                  {ocorrencia.causa_provavel}
                </p>
              </div>
            )}
          </div>

          {/* Peças Pendentes */}
          <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#2C343E] pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#F5A623]" />
                <h3 className="text-xs font-mono font-bold text-[#ECEFF1] uppercase">
                  Peças & Componentes ({pecas.length})
                </h3>
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowAddPecaModal(true)}
                  className="px-2.5 py-1 rounded-[3px] bg-[#14181D] hover:bg-[#232B35] text-[#F5A623] border border-[#F5A623]/40 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Peça</span>
                </button>
              )}
            </div>

            {pecas.length === 0 ? (
              <p className="text-xs text-[#6B7683] italic py-2">
                Nenhuma peça cadastrada para este reparo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#14181D] text-[#94A3B8] font-mono uppercase text-[9px]">
                      <th className="p-2">Qtd</th>
                      <th className="p-2">Descrição & Fabricante</th>
                      <th className="p-2">Part Number</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 text-right">Valor Unit.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C343E]/60 text-[#ECEFF1]">
                    {pecas.map((p) => (
                      <tr key={p.id} className="hover:bg-[#232B35]">
                        <td className="p-2 font-mono font-bold text-[#F5A623]">{p.quantidade}x</td>
                        <td className="p-2">
                          <span className="font-semibold">{p.descricao}</span>
                          <span className="text-[10px] text-[#94A3B8] ml-2 font-mono">({p.fabricante})</span>
                        </td>
                        <td className="p-2 font-mono text-[#38BDF8]">{p.part_number || '-'}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#232B35] text-[#F5A623] border border-[#3E4A59]">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono">
                          {p.valor_unitario ? formatCurrency(p.valor_unitario) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Orçamentos Vinculados */}
          <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#2C343E] pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#38BDF8]" />
                <h3 className="text-xs font-mono font-bold text-[#ECEFF1] uppercase">
                  Orçamentos AMBEV ({orcamentos.length})
                </h3>
              </div>
              {canEdit && (
                <button
                  onClick={handleOpenAddOrcModal}
                  className="px-2.5 py-1 rounded-[3px] bg-[#14181D] hover:bg-[#232B35] text-[#38BDF8] border border-[#38BDF8]/40 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Proposta</span>
                </button>
              )}
            </div>

            {orcamentos.length === 0 ? (
              <p className="text-xs text-[#6B7683] italic py-2">
                Nenhum orçamento emitido para aprovação ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {orcamentos.map((orc) => (
                  <div
                    key={orc.id}
                    onClick={() => {
                      setSelectedOrcamento(orc);
                      setIsOrcDetailOpen(true);
                    }}
                    className="p-3 bg-[#14181D] hover:bg-[#232B35] border border-[#2C343E] hover:border-[#38BDF8]/50 rounded-[3px] flex items-center justify-between text-xs cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#38BDF8] group-hover:underline">
                          {orc.numero}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#232B35] text-[#ECEFF1] border border-[#2C343E]">
                          {orc.status}
                        </span>
                      </div>
                      <p className="text-[#ECEFF1] mt-1">{orc.fornecedor}</p>
                      <p className="text-[10px] text-[#94A3B8] font-mono">
                        Enviado em {formatDate(orc.data_envio)} • {calculateDaysDiff(orc.data_envio)} dias aguardando
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-[#38BDF8]">
                        {formatCurrency(orc.valor_total)}
                      </span>
                      <span className="block text-[10px] text-[#94A3B8] font-mono">Clique para detalhes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fotos da Ocorrência */}
          <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#2C343E] pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#F5A623]" />
                <h3 className="text-xs font-mono font-bold text-[#ECEFF1] uppercase">
                  Galeria de Fotos da Avaria ({fotos.length})
                </h3>
              </div>
              {canEdit && (
                <label className="px-2.5 py-1 rounded-[3px] bg-[#14181D] hover:bg-[#232B35] text-[#F5A623] border border-[#F5A623]/40 text-xs font-semibold flex items-center gap-1 cursor-pointer">
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
              <p className="text-xs text-[#6B7683] italic py-2">
                Nenhuma foto anexada a este chamado.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {fotos.map((f) => (
                  <div key={f.id} className="aspect-video bg-[#14181D] border border-[#2C343E] rounded-[3px] overflow-hidden group">
                    <img src={f.url} alt={f.nome_arquivo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita (1 col): Timeline & Comentários */}
        <div className="space-y-4">
          <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 flex flex-col h-full">
            <div className="flex items-center gap-2 border-b border-[#2C343E] pb-2 mb-3">
              <MessageSquare className="w-4 h-4 text-[#F5A623]" />
              <h3 className="text-xs font-mono font-bold text-[#ECEFF1] uppercase">
                Histórico & Timeline ({eventos.length})
              </h3>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
              {eventos.map((evt) => (
                <div key={evt.id} className="p-2.5 bg-[#14181D] border border-[#2C343E] rounded-[3px] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-[#F5A623]">{evt.autor_nome}</span>
                    <span className="text-[#6B7683]">{formatDateTime(evt.created_at)}</span>
                  </div>
                  <p className="text-[#ECEFF1] leading-relaxed">{evt.descricao}</p>
                </div>
              ))}
            </div>

            {/* Add Event / Comment Form */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-[#2C343E] mt-3 space-y-2">
              <textarea
                rows={2}
                required
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Adicionar nota de campo, avanço no conserto ou alinhamento..."
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs p-2 rounded-[3px] outline-none"
              />
              <button
                type="submit"
                disabled={sendingEvent || !novoComentario.trim()}
                className="w-full py-2 px-3 rounded-[3px] bg-[#F5A623] hover:bg-[#D98E1A] text-[#14181D] font-condensed text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingEvent ? 'Gravando...' : 'Publicar Nota'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: ADICIONAR PEÇA */}
      {showAddPecaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] w-full max-w-md p-4 space-y-3">
            <h3 className="text-sm font-condensed font-bold text-[#ECEFF1] uppercase">
              Adicionar Peça / Componente
            </h3>
            <form onSubmit={handleSaveNewPeca} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={newPeca.descricao || ''}
                  onChange={(e) => setNewPeca({ ...newPeca, descricao: e.target.value })}
                  placeholder="Ex: Compressor Scroll Copeland"
                  className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Part Number</label>
                  <input
                    type="text"
                    value={newPeca.part_number || ''}
                    onChange={(e) => setNewPeca({ ...newPeca, part_number: e.target.value })}
                    placeholder="ZR61K3E-TFD"
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Quantidade</label>
                  <input
                    type="number"
                    min={1}
                    value={newPeca.quantidade || 1}
                    onChange={(e) => setNewPeca({ ...newPeca, quantidade: Number(e.target.value) })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Fabricante</label>
                  <input
                    type="text"
                    value={newPeca.fabricante || ''}
                    onChange={(e) => setNewPeca({ ...newPeca, fabricante: e.target.value })}
                    placeholder="Copeland"
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={newPeca.valor_unitario || 0}
                    onChange={(e) => setNewPeca({ ...newPeca, valor_unitario: Number(e.target.value) })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px] font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPecaModal(false)}
                  className="px-3 py-1.5 rounded-[3px] bg-[#14181D] border border-[#2C343E] text-[#94A3B8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#F5A623] text-[#14181D] font-bold"
                >
                  Salvar Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR ORÇAMENTO */}
      {showAddOrcModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] w-full max-w-md p-4 space-y-3">
            <h3 className="text-sm font-condensed font-bold text-[#ECEFF1] uppercase">
              Cadastrar Orçamento / Proposta Comercial
            </h3>
            <form onSubmit={handleSaveNewOrcamento} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Nº Proposta</label>
                  <input
                    type="text"
                    required
                    value={newOrc.numero || ''}
                    onChange={(e) => setNewOrc({ ...newOrc, numero: e.target.value })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    required
                    value={newOrc.valor_total || 0}
                    onChange={(e) => setNewOrc({ ...newOrc, valor_total: Number(e.target.value) })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#38BDF8] p-2 rounded-[3px] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Fornecedor</label>
                <input
                  type="text"
                  value={newOrc.fornecedor || ''}
                  onChange={(e) => setNewOrc({ ...newOrc, fornecedor: e.target.value })}
                  className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrcModal(false)}
                  className="px-3 py-1.5 rounded-[3px] bg-[#14181D] border border-[#2C343E] text-[#94A3B8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] bg-[#38BDF8] text-[#14181D] font-bold"
                >
                  Salvar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhe do Orçamento */}
      <ModalOrcamentoDetalhe
        orcamento={selectedOrcamento}
        ocorrencia={ocorrencia}
        equipamento={equipamento}
        isOpen={isOrcDetailOpen}
        onClose={() => setIsOrcDetailOpen(false)}
        onUpdated={async (updatedOrc) => {
          setSelectedOrcamento(updatedOrc);
          await loadData();
        }}
        onOpenRevisao={(orc) => {
          setIsOrcDetailOpen(false);
          setRevisaoOrigem(orc);
          setIsRevisaoOpen(true);
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
