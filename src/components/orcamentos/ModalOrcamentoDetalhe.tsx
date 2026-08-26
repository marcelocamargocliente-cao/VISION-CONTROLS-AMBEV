import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  X,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Building2,
  User,
  AlertTriangle,
  FileCheck2,
  Edit3,
  Copy,
  ExternalLink,
  Save,
  RotateCcw,
  Upload,
  Package,
  Layers,
  MapPin,
  Tag,
  CheckCircle2,
  XCircle,
  FileCode,
  FileDown,
  Printer,
  Sparkles,
  Paperclip,
} from 'lucide-react';
import {
  Orcamento,
  OrcamentoStatus,
  Ocorrencia,
  VwEquipamento,
  Peca,
} from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { DataStore } from '../../lib/dataStore';
import { IndustrialTag } from '../common/IndustrialTag';
import { CompartilharOrcamento } from '../common/CompartilharOrcamento';
import {
  formatCurrency,
  formatDate,
  calculateDaysDiff,
  getOrcamentoStatusConfig,
  getOcorrenciaStatusConfig,
  ShareOrcamentoData,
} from '../../utils/formatters';

interface ModalOrcamentoDetalheProps {
  orcamento: Orcamento | null;
  ocorrencia?: Ocorrencia | null;
  equipamento?: VwEquipamento | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedOrc: Orcamento) => void;
  onOpenRevisao: (orc: Orcamento) => void;
  initialEditMode?: boolean;
}

export const ModalOrcamentoDetalhe: React.FC<ModalOrcamentoDetalheProps> = ({
  orcamento,
  ocorrencia,
  equipamento,
  isOpen,
  onClose,
  onUpdated,
  onOpenRevisao,
  initialEditMode = false,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthorizedToEdit =
    profile?.role === 'ADMIN' ||
    profile?.role === 'GESTOR' ||
    profile?.role === 'ENCARREGADO';

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loadingPecas, setLoadingPecas] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState<{
    numero: string;
    fornecedor: string;
    valor_total: number | string;
    data_envio: string;
    validade: string;
    enviado_para: string;
    status: OrcamentoStatus;
    observacoes: string;
    arquivo_pdf_url: string;
  }>({
    numero: '',
    fornecedor: '',
    valor_total: 0,
    data_envio: '',
    validade: '',
    enviado_para: '',
    status: 'ENVIADO',
    observacoes: '',
    arquivo_pdf_url: '',
  });

  // Local Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync form data when orcamento changes
  useEffect(() => {
    if (orcamento) {
      setFormData({
        numero: orcamento.numero || '',
        fornecedor: orcamento.fornecedor || '',
        valor_total: orcamento.valor_total ?? 0,
        data_envio: orcamento.data_envio ? orcamento.data_envio.substring(0, 10) : '',
        validade: orcamento.validade ? orcamento.validade.substring(0, 10) : '',
        enviado_para: orcamento.enviado_para || '',
        status: (orcamento.status as OrcamentoStatus) || 'ENVIADO',
        observacoes: orcamento.observacoes || '',
        arquivo_pdf_url: orcamento.arquivo_pdf_url || orcamento.arquivo_url || '',
      });
      setIsEditing(initialEditMode);

      // Load pecas for linked occurrence
      if (orcamento.ocorrencia_id) {
        setLoadingPecas(true);
        DataStore.getPecasByOcorrencia(orcamento.ocorrencia_id)
          .then((p) => setPecas(p))
          .catch((err) => console.error('Erro ao carregar pecas:', err))
          .finally(() => setLoadingPecas(false));
      }
    }
  }, [orcamento, isOpen, initialEditMode]);

  if (!isOpen || !orcamento) return null;

  const statusConfig = getOrcamentoStatusConfig(orcamento.status);
  const diasEnvio = calculateDaysDiff(orcamento.data_envio);
  const diasParado = equipamento?.dias_parado_atual ?? calculateDaysDiff(ocorrencia?.data_avaria);
  const isParadoCritico = diasParado > 15;
  const isAguardandoCritico = diasEnvio > 15 && (orcamento.status === 'ENVIADO' || orcamento.status === 'EM_ANALISE' || orcamento.status === 'EM_ANALISE_AMBEV');

  // Can show "Copiar e reenviar"
  const canReenviar =
    isAuthorizedToEdit &&
    (orcamento.status === 'ENVIADO' ||
      orcamento.status === 'REPROVADO' ||
      orcamento.status === 'REJEITADO' ||
      orcamento.status === 'REJEITADO_AMBEV' ||
      orcamento.status === 'EXPIRADO');

  // Prepare share data
  const shareData: any = {
    numero: orcamento.numero,
    tag: equipamento?.tag || 'N/D',
    tipo: equipamento?.tipo || 'Equipamento HVAC',
    marca: equipamento?.marca,
    modelo: equipamento?.modelo,
    ug: equipamento?.ug_codigo || 'UG',
    area: equipamento?.area_nome || 'Área Fabril',
    linha: equipamento?.linha_nome || 'Linha',
    centro_trabalho: equipamento?.centro_trabalho_nome || 'CT',
    dias_parado: diasParado,
    fornecedor: orcamento.fornecedor,
    valor_total: orcamento.valor_total,
    validade: orcamento.validade,
    status: statusConfig.label,
    enviado_para: orcamento.enviado_para,
    numero_ocorrencia: ocorrencia?.numero,
    link_pdf: orcamento.arquivo_pdf_url || orcamento.arquivo_url,
    data_envio: orcamento.data_envio ? formatDate(orcamento.data_envio) : undefined,
    dias_aguardando: diasEnvio,
    descricao_ocorrencia: ocorrencia?.descricao,
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate file upload or blob URL
      const fakeUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        arquivo_pdf_url: fakeUrl,
      }));
      showToast(`Arquivo "${file.name}" anexado com sucesso.`, 'success');
    }
  };

  const handleSave = async () => {
    if (!isAuthorizedToEdit) return;
    setSaving(true);
    try {
      const numValue =
        typeof formData.valor_total === 'string'
          ? parseFloat(formData.valor_total.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
          : Number(formData.valor_total);

      const updatedOrc = await DataStore.saveOrcamento({
        id: orcamento.id,
        ocorrencia_id: orcamento.ocorrencia_id,
        numero: formData.numero.trim() || orcamento.numero,
        fornecedor: formData.fornecedor.trim() || orcamento.fornecedor,
        valor_total: numValue,
        data_envio: formData.data_envio ? new Date(formData.data_envio).toISOString() : orcamento.data_envio,
        validade: formData.validade ? new Date(formData.validade).toISOString() : orcamento.validade,
        enviado_para: formData.enviado_para.trim(),
        status: formData.status,
        observacoes: formData.observacoes.trim(),
        arquivo_pdf_url: formData.arquivo_pdf_url,
        arquivo_url: formData.arquivo_pdf_url,
      });

      // Special handling when approved
      if (formData.status === 'APROVADO' || formData.status === 'APROVADO_AMBEV') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2ECC71', '#38BDF8', '#F5A623', '#FFFFFF'],
        });
        showToast('🎉 Orçamento aprovado! Equipamento será marcado para execução.', 'success');
      } else {
        showToast('Orçamento atualizado com sucesso!', 'success');
      }

      setIsEditing(false);
      onUpdated(updatedOrc);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar alterações do orçamento.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPdf = () => {
    const url = orcamento.arquivo_pdf_url || orcamento.arquivo_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast('Abrindo documento PDF da proposta...', 'info');
    } else {
      showToast('Nenhum arquivo PDF anexado a este orçamento.', 'info');
    }
  };

  return (
    <div
      id="modal-orcamento-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isEditing) onClose();
      }}
    >
      {/* Modal Card */}
      <div
        id="modal-orcamento-container"
        style={{ borderTopColor: statusConfig.borderTopColor }}
        className="bg-[#1C222A] border border-[#2C343E] border-t-[3px] rounded-[6px] shadow-2xl w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2C343E] bg-[#14181D] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[4px] bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-[#94A3B8] uppercase font-bold">
                  Proposta Orçamentária • AMBEV
                </span>
                <span
                  className={`px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold border uppercase ${statusConfig.badgeBg}`}
                >
                  {statusConfig.label}
                </span>
                {isEditing && (
                  <span className="px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/40 animate-pulse">
                    Modo Edição
                  </span>
                )}
              </div>
              <h3 className="text-lg font-mono font-bold text-[#ECEFF1] tracking-wide">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="bg-[#1C222A] border border-[#38BDF8]/50 text-[#38BDF8] px-2 py-0.5 rounded text-base font-mono focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                    placeholder="Número da Proposta"
                  />
                ) : (
                  orcamento.numero
                )}
              </h3>
            </div>
          </div>

          <button
            id="btn-modal-orc-close-header"
            onClick={onClose}
            className="p-1.5 rounded-[4px] text-[#94A3B8] hover:text-[#ECEFF1] hover:bg-[#2C343E] transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`px-4 py-2 text-xs font-mono font-medium flex items-center justify-between border-b ${
              toastMessage.type === 'success'
                ? 'bg-[#2ECC71]/20 text-[#2ECC71] border-[#2ECC71]/40'
                : toastMessage.type === 'error'
                ? 'bg-[#E5484D]/20 text-[#FF6B6B] border-[#E5484D]/40'
                : 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : toastMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[#94A3B8] hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body: 2 Columns */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 Cols): Dados do Orçamento */}
            <div className="lg:col-span-6 space-y-5 bg-[#14181D]/60 p-4 sm:p-5 rounded-[4px] border border-[#2C343E]">
              <div className="flex items-center justify-between border-b border-[#2C343E] pb-2">
                <span className="text-[11px] font-mono uppercase text-[#38BDF8] font-bold tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Dados Comerciais da Proposta
                </span>
                {!isEditing && (
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    Criado em {formatDate(orcamento.created_at)}
                  </span>
                )}
              </div>

              {/* Valor Total Highlight */}
              <div className="p-3.5 bg-[#1C222A] border border-[#38BDF8]/30 rounded-[4px] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
                    Valor Total da Proposta
                  </span>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-mono text-[#38BDF8] font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valor_total}
                        onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                        className="bg-[#14181D] border border-[#38BDF8]/50 text-[#38BDF8] px-2 py-1 rounded text-xl font-bold font-mono w-44 focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                      />
                    </div>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-condensed font-bold text-[#38BDF8] tracking-tight">
                      {formatCurrency(orcamento.valor_total)}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Status</span>
                  {isEditing ? (
                    <select
                      id="edit-orc-status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as OrcamentoStatus })
                      }
                      className="bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] text-xs rounded px-2 py-1 font-mono font-bold mt-1 focus:border-[#38BDF8] focus:outline-none"
                    >
                      <option value="RASCUNHO">RASCUNHO</option>
                      <option value="ENVIADO">ENVIADO</option>
                      <option value="EM_ANALISE">EM_ANALISE</option>
                      <option value="APROVADO">APROVADO</option>
                      <option value="REPROVADO">REPROVADO</option>
                      <option value="EXPIRADO">EXPIRADO</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-block mt-1 px-2.5 py-1 rounded-[2px] font-mono text-xs font-bold border uppercase ${statusConfig.badgeBg}`}
                    >
                      {statusConfig.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Fornecedor / Emitente */}
              <div>
                <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                  Fornecedor / Emitente Credenciado
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    className="w-full bg-[#1C222A] border border-[#2C343E] rounded px-3 py-1.5 text-xs text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
                    placeholder="Nome da Empresa / Fornecedor"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#ECEFF1]">
                    <Building2 className="w-4 h-4 text-[#94A3B8]" />
                    <span>{orcamento.fornecedor || 'Fornecedor não especificado'}</span>
                  </div>
                )}
              </div>

              {/* Datas: Envio · Validade · Dias na AMBEV */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Data de Envio */}
                <div className="bg-[#1C222A] p-2.5 rounded-[4px] border border-[#2C343E]">
                  <span className="text-[9px] font-mono uppercase text-[#94A3B8] block mb-0.5">
                    Data de Envio
                  </span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.data_envio}
                      onChange={(e) => setFormData({ ...formData, data_envio: e.target.value })}
                      className="w-full bg-[#14181D] border border-[#2C343E] rounded px-1.5 py-1 text-xs text-[#ECEFF1] font-mono"
                    />
                  ) : (
                    <div className="text-xs font-mono text-[#ECEFF1] font-medium flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#38BDF8]" />
                      {formatDate(orcamento.data_envio)}
                    </div>
                  )}
                </div>

                {/* Validade */}
                <div className="bg-[#1C222A] p-2.5 rounded-[4px] border border-[#2C343E]">
                  <span className="text-[9px] font-mono uppercase text-[#94A3B8] block mb-0.5">
                    Validade da Proposta
                  </span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.validade}
                      onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                      className="w-full bg-[#14181D] border border-[#2C343E] rounded px-1.5 py-1 text-xs text-[#ECEFF1] font-mono"
                    />
                  ) : (
                    <div className="text-xs font-mono text-[#ECEFF1] font-medium flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#F5A623]" />
                      {orcamento.validade ? formatDate(orcamento.validade) : '30 dias'}
                    </div>
                  )}
                </div>

                {/* Dias na AMBEV */}
                <div className="bg-[#1C222A] p-2.5 rounded-[4px] border border-[#2C343E]">
                  <span className="text-[9px] font-mono uppercase text-[#94A3B8] block mb-0.5">
                    Aguardando AMBEV
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-[2px] font-mono text-xs font-bold ${
                        diasEnvio > 15
                          ? 'bg-[#E5484D]/25 text-[#FF6B6B] border border-[#E5484D]/60 animate-pulse'
                          : diasEnvio >= 8
                          ? 'bg-[#F5A623]/25 text-[#F5A623] border border-[#F5A623]/60'
                          : 'bg-[#232B35] text-[#94A3B8]'
                      }`}
                    >
                      {diasEnvio} dias
                    </span>
                    {isAguardandoCritico && (
                      <span className="text-[9px] text-[#FF6B6B] font-mono uppercase font-bold">
                        Alerta &gt;15d
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Enviado Para */}
              <div>
                <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                  Enviado para (Contato / Engenharia AMBEV)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.enviado_para}
                    onChange={(e) => setFormData({ ...formData, enviado_para: e.target.value })}
                    className="w-full bg-[#1C222A] border border-[#2C343E] rounded px-3 py-1.5 text-xs text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
                    placeholder="Ex: Engenharia de Utilidades AMBEV (Eng. Marcos Silveira)"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-[#ECEFF1] bg-[#1C222A] p-2.5 rounded-[4px] border border-[#2C343E]">
                    <User className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>{orcamento.enviado_para || 'Contato AMBEV não especificado'}</span>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                  Observações Técnicas / Condições Comerciais
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full bg-[#1C222A] border border-[#2C343E] rounded p-2 text-xs text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
                    placeholder="Detalhes sobre escopo de fornecimento, frete CIF/FOB, mão de obra..."
                  />
                ) : (
                  <div className="text-xs text-[#94A3B8] bg-[#1C222A] p-2.5 rounded-[4px] border border-[#2C343E] italic">
                    {orcamento.observacoes || 'Nenhuma observação informada.'}
                  </div>
                )}
              </div>

              {/* Arquivo PDF */}
              <div className="border-t border-[#2C343E]/60 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#94A3B8] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Arquivo PDF da Proposta
                  </span>
                  {orcamento.arquivo_pdf_url || orcamento.arquivo_url ? (
                    <button
                      type="button"
                      onClick={handleOpenPdf}
                      className="text-[11px] font-mono text-[#38BDF8] hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Visualizar PDF
                    </button>
                  ) : null}
                </div>

                {isEditing ? (
                  <div className="mt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="application/pdf"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#2C343E] hover:bg-[#38BDF8]/20 text-[#ECEFF1] hover:text-[#38BDF8] border border-[#38BDF8]/30 rounded text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Substituir PDF no bucket
                      </button>
                      <input
                        type="text"
                        value={formData.arquivo_pdf_url}
                        onChange={(e) =>
                          setFormData({ ...formData, arquivo_pdf_url: e.target.value })
                        }
                        placeholder="Ou digite a URL do documento PDF"
                        className="flex-1 bg-[#1C222A] border border-[#2C343E] rounded px-2.5 py-1 text-xs text-[#ECEFF1]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] font-mono text-[#94A3B8] truncate">
                    {orcamento.arquivo_pdf_url || orcamento.arquivo_url ? (
                      <span className="text-[#ECEFF1]">
                        {orcamento.arquivo_pdf_url || orcamento.arquivo_url}
                      </span>
                    ) : (
                      <span className="italic text-[#6B7683]">Nenhum PDF anexado à proposta</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (6 Cols): Vínculo com a Ocorrência & Equipamento */}
            <div className="lg:col-span-6 space-y-5 bg-[#14181D]/60 p-4 sm:p-5 rounded-[4px] border border-[#2C343E]">
              <div className="flex items-center justify-between border-b border-[#2C343E] pb-2">
                <span className="text-[11px] font-mono uppercase text-[#F5A623] font-bold tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Vínculo com Ocorrência & Equipamento
                </span>
                {ocorrencia && (
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/ocorrencias/${ocorrencia.id}`);
                    }}
                    className="text-[11px] font-mono text-[#F5A623] hover:underline flex items-center gap-1 font-bold"
                  >
                    OS #{ocorrencia.numero}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Occurrence Status & Machine TAG */}
              <div className="p-3.5 bg-[#1C222A] border border-[#2C343E] rounded-[4px] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
                      Ocorrência Vinculada
                    </span>
                    {ocorrencia ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-sm text-[#F5A623]">
                          OS #{ocorrencia.numero}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold border uppercase ${
                            getOcorrenciaStatusConfig(ocorrencia.status).badgeBg
                          }`}
                        >
                          {getOcorrenciaStatusConfig(ocorrencia.status).label}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#94A3B8] font-mono">Sem ocorrência vinculada</span>
                    )}
                  </div>

                  {/* Industrial TAG */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-0.5 text-right">
                      TAG do Ativo
                    </span>
                    {equipamento ? (
                      <IndustrialTag tag={equipamento.tag} size="md" />
                    ) : (
                      <span className="text-xs font-mono text-[#6B7683]">TAG N/D</span>
                    )}
                  </div>
                </div>

                {/* Equipment Hierarchy */}
                {equipamento && (
                  <div className="pt-2 border-t border-[#2C343E]/60 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#94A3B8] font-mono text-[10px] block">Localização Fabril:</span>
                      <span className="text-[#ECEFF1] font-medium">
                        {equipamento.ug_codigo} • {equipamento.area_nome}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] font-mono text-[10px] block">Linha / CT:</span>
                      <span className="text-[#ECEFF1] font-medium">
                        {equipamento.linha_nome} ({equipamento.centro_trabalho_nome})
                      </span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] font-mono text-[10px] block">Tipo & Modelo:</span>
                      <span className="text-[#ECEFF1]">
                        {equipamento.tipo} • {equipamento.marca} {equipamento.modelo}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] font-mono text-[10px] block">Status Operacional:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-bold ${
                            isParadoCritico
                              ? 'bg-[#E5484D]/25 text-[#FF6B6B] border border-[#E5484D]/60 animate-pulse'
                              : 'bg-[#232B35] text-[#ECEFF1]'
                          }`}
                        >
                          Parado há {diasParado} dias
                        </span>
                        {isParadoCritico && (
                          <span className="text-[9px] text-[#FF6B6B] font-mono uppercase font-bold">
                            Crítico (&gt;15d)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Peças vinculadas à ocorrência */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Peças Incluídas no Orçamento ({pecas.length})
                  </span>
                  {ocorrencia && (
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      Itens para cotação e troca
                    </span>
                  )}
                </div>

                {loadingPecas ? (
                  <div className="p-4 text-center text-xs font-mono text-[#94A3B8]">
                    Carregando peças vinculadas...
                  </div>
                ) : pecas.length === 0 ? (
                  <div className="p-4 bg-[#1C222A] border border-[#2C343E] rounded text-center text-xs text-[#94A3B8] font-mono">
                    Nenhuma peça específica vinculada à ocorrência.
                  </div>
                ) : (
                  <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#14181D] text-[#94A3B8] font-mono text-[9px] uppercase border-b border-[#2C343E]">
                          <th className="py-1.5 px-2.5">Descrição</th>
                          <th className="py-1.5 px-2 font-mono">Part Number</th>
                          <th className="py-1.5 px-2 text-center">Qtd</th>
                          <th className="py-1.5 px-2 text-right">Unitário</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2C343E]/50 text-[#ECEFF1]">
                        {pecas.map((peca) => (
                          <tr key={peca.id} className="hover:bg-[#232B35]">
                            <td className="py-1.5 px-2.5">
                              <div className="font-semibold text-[#ECEFF1] text-[11px]">
                                {peca.descricao}
                              </div>
                              {peca.fabricante && (
                                <div className="text-[9px] text-[#94A3B8] font-mono">
                                  {peca.fabricante}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-2 font-mono text-[10px] text-[#38BDF8]">
                              {peca.part_number || '-'}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono text-[11px]">
                              {peca.quantidade} {peca.unidade || 'UN'}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono text-[11px] text-[#2ECC71]">
                              {formatCurrency(peca.valor_unitario)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Anomalia description summary */}
              {ocorrencia?.descricao_anomalia && (
                <div className="p-3 bg-[#1C222A] border border-[#2C343E] rounded-[4px]">
                  <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1">
                    Descrição da Avaria (Ocorrência)
                  </span>
                  <p className="text-xs text-[#ECEFF1] line-clamp-3">
                    {ocorrencia.descricao_anomalia}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-[#2C343E] bg-[#14181D] shrink-0">
          {isEditing ? (
            /* Editing Footer Actions */
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-mono text-[#94A3B8]">
                Altere os campos e clique em Salvar para persistir as modificações.
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-orc-cancel-edit"
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="px-3.5 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] transition-colors"
                >
                  <RotateCcw className="w-4 h-4 inline mr-1.5" />
                  Cancelar
                </button>
                <button
                  id="btn-orc-save-edit"
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold rounded-[4px] bg-[#2ECC71] hover:bg-[#27AE60] text-[#14181D] transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          ) : (
            /* Standard View Footer Actions */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Ver PDF */}
                <button
                  id="btn-orc-ver-pdf"
                  type="button"
                  onClick={handleOpenPdf}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[4px] border transition-colors shadow-sm ${
                    orcamento.arquivo_pdf_url || orcamento.arquivo_url
                      ? 'bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] border-[#38BDF8]/40'
                      : 'bg-[#1C222A] text-[#6B7683] border-[#2C343E] cursor-not-allowed opacity-60'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                  <span>Ver PDF</span>
                </button>

                {/* 2. Editar (Only for Admin, Gestor, Encarregado) */}
                {isAuthorizedToEdit && (
                  <button
                    id="btn-orc-enter-edit"
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[4px] bg-[#F5A623]/15 hover:bg-[#F5A623]/25 text-[#F5A623] border border-[#F5A623]/40 transition-colors shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                )}

                {/* 3. Copiar e reenviar (Only for Admin, Gestor, Encarregado and specific status) */}
                {canReenviar && (
                  <button
                    id="btn-orc-copiar-reenviar"
                    type="button"
                    onClick={() => onOpenRevisao(orcamento)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[4px] bg-[#60A5FA]/15 hover:bg-[#60A5FA]/25 text-[#60A5FA] border border-[#60A5FA]/40 transition-colors shadow-sm"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar e Reenviar</span>
                  </button>
                )}

                {/* 4. Compartilhar Dropdown */}
                <CompartilharOrcamento
                  data={shareData}
                  onToast={showToast}
                  idPrefix="modal-orc-share"
                />
              </div>

              {/* Close Button */}
              <button
                id="btn-orc-modal-close"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] transition-colors"
              >
                ✕ Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
