import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Upload,
  Calendar,
  DollarSign,
  Building2,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Orcamento } from '../../types/database';
import { DataStore } from '../../lib/dataStore';
import { gerarNumeroRevisao, formatCurrency } from '../../utils/formatters';

interface ModalRevisaoOrcamentoProps {
  orcamentoOrigem: Orcamento | null;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (novoOrcamento: Orcamento) => void;
}

export const ModalRevisaoOrcamento: React.FC<ModalRevisaoOrcamentoProps> = ({
  orcamentoOrigem,
  isOpen,
  onClose,
  onCreated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [numero, setNumero] = useState('');
  const [valorTotal, setValorTotal] = useState<string | number>('');
  const [fornecedor, setFornecedor] = useState('');
  const [enviadoPara, setEnviadoPara] = useState('');
  const [validade, setValidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (orcamentoOrigem) {
      const sugerido = gerarNumeroRevisao(orcamentoOrigem.numero);
      setNumero(sugerido);
      setValorTotal(orcamentoOrigem.valor_total || 0);
      setFornecedor(orcamentoOrigem.fornecedor || '');
      setEnviadoPara(orcamentoOrigem.enviado_para || '');
      // Calculate 30 days ahead from today for default new validity
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setValidade(d.toISOString().substring(0, 10));
      setObservacoes(
        `Revisão emitida a partir da proposta ${orcamentoOrigem.numero}. Ajuste comercial e técnico conforme solicitação AMBEV.`
      );
      setPdfFile(null);
      setPdfUrl('');
      setErrorMsg('');
    }
  }, [orcamentoOrigem]);

  if (!isOpen || !orcamentoOrigem) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!numero.trim()) {
      setErrorMsg('Informe o novo número da proposta.');
      return;
    }
    if (!fornecedor.trim()) {
      setErrorMsg('Informe o fornecedor emitente.');
      return;
    }
    if (!pdfFile && !pdfUrl) {
      setErrorMsg('O upload do novo documento PDF é obrigatório para o reenvio da proposta.');
      return;
    }

    const numValor =
      typeof valorTotal === 'string'
        ? parseFloat(valorTotal.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        : Number(valorTotal);

    if (isNaN(numValor) || numValor <= 0) {
      setErrorMsg('Informe um valor total válido para a nova revisão.');
      return;
    }

    setSubmitting(true);
    try {
      const novoOrcamento = await DataStore.saveOrcamento({
        ocorrencia_id: orcamentoOrigem.ocorrencia_id,
        numero: numero.trim(),
        fornecedor: fornecedor.trim(),
        valor_total: numValor,
        data_envio: new Date().toISOString(),
        enviado_para: enviadoPara.trim(),
        validade: validade ? new Date(validade).toISOString() : undefined,
        status: 'ENVIADO',
        observacoes: observacoes.trim(),
        arquivo_pdf_url: pdfUrl || `https://visioncontrols.com.br/docs/orcamentos/${numero.trim()}.pdf`,
        arquivo_url: pdfUrl || `https://visioncontrols.com.br/docs/orcamentos/${numero.trim()}.pdf`,
      });

      // Add timeline event to occurrence
      if (orcamentoOrigem.ocorrencia_id) {
        await DataStore.addEvento({
          ocorrencia_id: orcamentoOrigem.ocorrencia_id,
          tipo_evento: 'ORCAMENTO_ENVIADO',
          descricao: `Nova revisão orçamentária ${novoOrcamento.numero} (${formatCurrency(
            novoOrcamento.valor_total
          )}) enviada para ${novoOrcamento.enviado_para || 'AMBEV'}`,
        });
      }

      onCreated(novoOrcamento);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocorreu um erro ao cadastrar a nova revisão.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="modal-revisao-overlay"
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        id="modal-revisao-container"
        className="bg-[#1C222A] border border-[#38BDF8]/40 rounded-[6px] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2C343E] bg-[#14181D] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[4px] bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-mono font-bold text-[#ECEFF1]">
                Nova Revisão deste Orçamento
              </h3>
              <p className="text-[10px] text-[#94A3B8] font-mono">
                Baseado na proposta anterior: <span className="text-[#38BDF8]">{orcamentoOrigem.numero}</span>
              </p>
            </div>
          </div>
          <button
            id="btn-modal-revisao-close"
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#94A3B8] hover:text-[#ECEFF1] hover:bg-[#2C343E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="px-4 py-2.5 bg-[#E5484D]/15 border-b border-[#E5484D]/30 text-[#FF6B6B] text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Novo Número da Proposta */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
              Novo Número da Proposta (Sugerido com REV) *
            </label>
            <input
              id="revisao-numero"
              type="text"
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full bg-[#14181D] border border-[#38BDF8]/40 rounded px-3 py-2 text-sm font-mono font-bold text-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] focus:outline-none"
              placeholder="Ex: ORC-2026-0418-REV3"
            />
          </div>

          {/* Valor Total & Validade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                Novo Valor Total (R$) *
              </label>
              <div className="relative">
                <input
                  id="revisao-valor"
                  type="number"
                  step="0.01"
                  required
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  className="w-full bg-[#14181D] border border-[#2C343E] rounded px-3 py-2 text-xs font-mono font-bold text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                Nova Validade da Proposta
              </label>
              <input
                id="revisao-validade"
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] rounded px-3 py-2 text-xs font-mono text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
              />
            </div>
          </div>

          {/* Fornecedor & Enviado Para */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                Fornecedor / Emitente *
              </label>
              <input
                id="revisao-fornecedor"
                type="text"
                required
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] rounded px-3 py-2 text-xs text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
                placeholder="Nome do fornecedor"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                Enviado para (Contato AMBEV)
              </label>
              <input
                id="revisao-enviado-para"
                type="text"
                value={enviadoPara}
                onChange={(e) => setEnviadoPara(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] rounded px-3 py-2 text-xs text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
                placeholder="Ex: Engenharia AMBEV RJ"
              />
            </div>
          </div>

          {/* Upload de Novo PDF (Obrigatório) */}
          <div className="p-3.5 bg-[#14181D] border border-[#2C343E] rounded-[4px]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] uppercase font-mono text-[#F5A623] font-bold flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload do Novo PDF da Proposta (Obrigatório) *
              </label>
              {pdfFile && (
                <span className="text-[10px] font-mono text-[#2ECC71] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Arquivo Carregado
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
              <button
                type="button"
                id="btn-upload-revisao-pdf"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2 bg-[#2C343E] hover:bg-[#38BDF8]/20 text-[#ECEFF1] hover:text-[#38BDF8] border border-[#38BDF8]/30 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {pdfFile ? 'Alterar Arquivo PDF' : 'Selecionar Documento PDF'}
              </button>

              <div className="text-[11px] font-mono text-[#94A3B8] truncate flex-1 text-center sm:text-left">
                {pdfFile ? pdfFile.name : 'Nenhum PDF selecionado ainda.'}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
              Observações da Revisão
            </label>
            <textarea
              id="revisao-observacoes"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full bg-[#14181D] border border-[#2C343E] rounded p-2.5 text-xs text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
              placeholder="Justificativa da nova revisão, alterações de escopo ou desconto..."
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#2C343E] flex items-center justify-end gap-2.5">
            <button
              id="btn-revisao-cancelar"
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-revisao-confirmar"
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-[4px] bg-[#38BDF8] hover:bg-[#0284C7] text-[#14181D] transition-colors shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Emitindo Revisão...' : 'Confirmar e Enviar Nova Revisão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
