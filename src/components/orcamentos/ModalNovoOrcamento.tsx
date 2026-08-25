import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  DollarSign,
  Calendar,
  Building2,
  User,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Ocorrencia, Orcamento, VwEquipamento } from '../../types/database';
import { DataStore } from '../../lib/dataStore';
import { gerarNumeroOrcamento, formatCurrency } from '../../utils/formatters';

interface ModalNovoOrcamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (novoOrcamento: Orcamento) => void;
  ocorrencias: Ocorrencia[];
  equipamentosMap: Map<string, VwEquipamento>;
}

export const ModalNovoOrcamento: React.FC<ModalNovoOrcamentoProps> = ({
  isOpen,
  onClose,
  onCreated,
  ocorrencias,
  equipamentosMap,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [numero, setNumero] = useState('');
  const [ocorrenciaId, setOcorrenciaId] = useState('');
  const [fornecedor, setFornecedor] = useState('TermoService RJ & Automação Ltda');
  const [valorTotal, setValorTotal] = useState<string | number>('');
  const [dataEnvio, setDataEnvio] = useState('');
  const [validade, setValidade] = useState('');
  const [enviadoPara, setEnviadoPara] = useState('Engenharia de Utilidades AMBEV');
  const [observacoes, setObservacoes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const autoNum = gerarNumeroOrcamento();
      setNumero(autoNum);
      const today = new Date().toISOString().substring(0, 10);
      setDataEnvio(today);
      const valDate = new Date();
      valDate.setDate(valDate.getDate() + 30);
      setValidade(valDate.toISOString().substring(0, 10));
      setValorTotal('');
      setObservacoes('');
      setPdfFile(null);
      setPdfUrl('');
      setErrorMsg('');
      if (ocorrencias.length > 0) {
        setOcorrenciaId(ocorrencias[0].id);
      }
    }
  }, [isOpen, ocorrencias]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!numero.trim()) {
      setErrorMsg('Informe o número da proposta.');
      return;
    }
    if (!ocorrenciaId) {
      setErrorMsg('Selecione a ocorrência vinculada.');
      return;
    }
    if (!fornecedor.trim()) {
      setErrorMsg('Informe o fornecedor emitente.');
      return;
    }

    const numValor =
      typeof valorTotal === 'string'
        ? parseFloat(valorTotal.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        : Number(valorTotal);

    if (isNaN(numValor) || numValor <= 0) {
      setErrorMsg('Informe um valor total válido para a proposta.');
      return;
    }

    setSubmitting(true);
    try {
      const novoOrc = await DataStore.saveOrcamento({
        ocorrencia_id: ocorrenciaId,
        numero: numero.trim(),
        fornecedor: fornecedor.trim(),
        valor_total: numValor,
        data_envio: dataEnvio ? new Date(dataEnvio).toISOString() : new Date().toISOString(),
        enviado_para: enviadoPara.trim(),
        validade: validade ? new Date(validade).toISOString() : undefined,
        status: 'ENVIADO',
        observacoes: observacoes.trim(),
        arquivo_pdf_url: pdfUrl || `https://visioncontrols.com.br/docs/orcamentos/${numero.trim()}.pdf`,
        arquivo_url: pdfUrl || `https://visioncontrols.com.br/docs/orcamentos/${numero.trim()}.pdf`,
      });

      // Update occurrence timeline
      await DataStore.addEvento({
        ocorrencia_id: ocorrenciaId,
        tipo_evento: 'ORCAMENTO_ENVIADO',
        descricao: `Proposta orçamentária ${novoOrc.numero} (${formatCurrency(
          novoOrc.valor_total
        )}) cadastrada e enviada para aprovação AMBEV`,
      });

      onCreated(novoOrc);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocorreu um erro ao emitir o orçamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="modal-novo-orc-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        id="modal-novo-orc-container"
        className="bg-[#1C222A] border border-[#2C343E] rounded-[6px] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2C343E] bg-[#14181D] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[4px] bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-mono font-bold text-[#ECEFF1]">
                Emitir Nova Proposta / Orçamento
              </h3>
              <p className="text-[10px] text-[#94A3B8] font-mono">
                Cadastro e envio de proposta de manutenção para aprovação AMBEV
              </p>
            </div>
          </div>
          <button
            id="btn-modal-novo-orc-close"
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
          {/* Número Proposta Sugerido */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
              Número da Proposta (Automático: ORC-ANO-MESDIA-REV1) *
            </label>
            <input
              id="novo-orc-numero"
              type="text"
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full bg-[#14181D] border border-[#38BDF8]/40 rounded px-3 py-2 text-sm font-mono font-bold text-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] focus:outline-none"
            />
          </div>

          {/* Ocorrência Vinculada */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
              Vincular à Ocorrência (OS) *
            </label>
            <select
              id="novo-orc-ocorrencia"
              value={ocorrenciaId}
              onChange={(e) => setOcorrenciaId(e.target.value)}
              className="w-full bg-[#14181D] border border-[#2C343E] rounded px-3 py-2 text-xs font-mono text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
              required
            >
              {ocorrencias.map((occ) => {
                const eq = equipamentosMap.get(occ.equipamento_id);
                return (
                  <option key={occ.id} value={occ.id}>
                    OS #{occ.numero} — TAG {eq?.tag || 'S/TAG'} ({eq?.tipo || 'HVAC'}) — {occ.status}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Valor Total & Fornecedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                Valor Total (R$) *
              </label>
              <input
                id="novo-orc-valor"
                type="number"
                step="0.01"
                required
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] rounded px-3 py-2 text-xs font-mono font-bold text-[#38BDF8] focus:border-[#38BDF8] focus:outline-none"
                placeholder="Ex: 14850.00"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                Fornecedor / Emitente *
              </label>
              <input
                id="novo-orc-fornecedor"
                type="text"
                required
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] rounded px-3 py-2 text-xs text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
                placeholder="Nome da empresa"
              />
            </div>
          </div>

          {/* Data de Envio & Validade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                Data de Envio
              </label>
              <input
                id="novo-orc-data-envio"
                type="date"
                value={dataEnvio}
                onChange={(e) => setDataEnvio(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] rounded px-3 py-2 text-xs font-mono text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
                Validade da Proposta
              </label>
              <input
                id="novo-orc-validade"
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] rounded px-3 py-2 text-xs font-mono text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
              />
            </div>
          </div>

          {/* Enviado Para */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
              Enviado para (Contato / Gestor AMBEV)
            </label>
            <input
              id="novo-orc-enviado-para"
              type="text"
              value={enviadoPara}
              onChange={(e) => setEnviadoPara(e.target.value)}
              className="w-full bg-[#14181D] border border-[#2C343E] rounded px-3 py-2 text-xs text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
              placeholder="Ex: Engenharia de Utilidades AMBEV (Eng. Marcos Silveira)"
            />
          </div>

          {/* Upload de PDF */}
          <div className="p-3.5 bg-[#14181D] border border-[#2C343E] rounded-[4px]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] uppercase font-mono text-[#94A3B8] font-bold flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#38BDF8]" />
                Anexar Documento PDF da Proposta
              </label>
              {pdfFile && (
                <span className="text-[10px] font-mono text-[#2ECC71] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Arquivo Anexado
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
                id="btn-upload-novo-orc-pdf"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2 bg-[#2C343E] hover:bg-[#38BDF8]/20 text-[#ECEFF1] hover:text-[#38BDF8] border border-[#38BDF8]/30 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {pdfFile ? 'Substituir PDF' : 'Selecionar Documento PDF'}
              </button>

              <div className="text-[11px] font-mono text-[#94A3B8] truncate flex-1 text-center sm:text-left">
                {pdfFile ? pdfFile.name : 'Opcional. Pode ser anexado posteriormente.'}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-[#94A3B8] mb-1">
              Observações Técnicas / Comerciais
            </label>
            <textarea
              id="novo-orc-observacoes"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full bg-[#14181D] border border-[#2C343E] rounded p-2.5 text-xs text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
              placeholder="Escopo de materiais, frete incluso, mão de obra..."
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#2C343E] flex items-center justify-end gap-2.5">
            <button
              id="btn-novo-orc-cancelar"
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-novo-orc-salvar"
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-[4px] bg-[#2ECC71] hover:bg-[#27AE60] text-[#14181D] transition-colors shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Cadastrando...' : 'Emitir Proposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
