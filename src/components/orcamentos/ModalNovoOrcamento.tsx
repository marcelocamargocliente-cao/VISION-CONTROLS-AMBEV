import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Building2,
  User,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { Ocorrencia, Orcamento, VwEquipamento, OrcamentoStatus } from '../../types/database';
import { DataStore } from '../../lib/dataStore';
import { formatCurrency } from '../../utils/formatters';

interface ModalNovoOrcamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (novoOrcamento: Orcamento) => void;
  ocorrencias?: Ocorrencia[];
  defaultOcorrenciaId?: string;
  equipamentosMap?: Map<string, VwEquipamento>;
}

interface PecaItem {
  descricao: string;
  part_number: string;
  quantidade: number;
  valor_unitario: string;
}

export const ModalNovoOrcamento: React.FC<ModalNovoOrcamentoProps> = ({
  isOpen,
  onClose,
  onCreated,
  ocorrencias = [],
  defaultOcorrenciaId,
  equipamentosMap = new Map(),
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Número da Proposta — em branco para o usuário digitar
  const [numero, setNumero] = useState('');

  // 2. Status — começa como Rascunho
  const [status, setStatus] = useState<OrcamentoStatus>('RASCUNHO');

  // 3. Fornecedor / Emitente
  const [fornecedor, setFornecedor] = useState('TermoService RJ & Automação Ltda');

  // 4. Valor Total da Proposta
  const [valorTotal, setValorTotal] = useState<string | number>('');

  // 5. Data de Envio — hoje por padrão, editável
  const hoje = new Date().toISOString().split('T')[0];
  const [dataEnvio, setDataEnvio] = useState(hoje);

  // 6. Validade (data)
  const [validade, setValidade] = useState('');

  // 7. Enviado para (contato AMBEV)
  const [enviadoPara, setEnviadoPara] = useState('Engenharia de Utilidades AMBEV');

  // 8. Descrição da Anomalia / Problema
  const [descricaoAnomalia, setDescricaoAnomalia] = useState('');

  // 9. Peças / Itens — lista dinâmica
  const [pecas, setPecas] = useState<PecaItem[]>([
    { descricao: '', part_number: '', quantidade: 1, valor_unitario: '' },
  ]);

  // 10. Observações Técnicas
  const [observacoes, setObservacoes] = useState('');

  // 11. Upload do PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');

  // Vínculo com Ocorrência
  const [ocorrenciaId, setOcorrenciaId] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Deixar número em branco conforme solicitado
      setNumero('');
      // Status começa como Rascunho
      setStatus('RASCUNHO');
      setFornecedor('TermoService RJ & Automação Ltda');
      setValorTotal('');
      const todayStr = new Date().toISOString().split('T')[0];
      setDataEnvio(todayStr);

      const valDate = new Date();
      valDate.setDate(valDate.getDate() + 30);
      setValidade(valDate.toISOString().split('T')[0]);

      setEnviadoPara('Engenharia de Utilidades AMBEV');
      setDescricaoAnomalia('');
      setPecas([{ descricao: '', part_number: '', quantidade: 1, valor_unitario: '' }]);
      setObservacoes('');
      setPdfFile(null);
      setPdfUrl('');
      setErrorMsg('');

      const targetOccId = defaultOcorrenciaId || (ocorrencias.length > 0 ? ocorrencias[0].id : '');
      setOcorrenciaId(targetOccId);

      // Pre-fill anomaly if target occurrence is found and has anomaly description
      if (targetOccId) {
        const occ = ocorrencias.find((o) => o.id === targetOccId);
        if (occ?.descricao_anomalia) {
          setDescricaoAnomalia(occ.descricao_anomalia);
        } else if (occ?.descricao) {
          setDescricaoAnomalia(occ.descricao);
        }
      }
    }
  }, [isOpen, defaultOcorrenciaId, ocorrencias]);

  if (!isOpen) return null;

  const adicionarPeca = () => {
    setPecas((prev) => [...prev, { descricao: '', part_number: '', quantidade: 1, valor_unitario: '' }]);
  };

  const atualizarPeca = (index: number, campo: keyof PecaItem, valor: string | number) => {
    setPecas((prev) => prev.map((p, i) => (i === index ? { ...p, [campo]: valor } : p)));
  };

  const removerPeca = (index: number) => {
    setPecas((prev) => prev.filter((_, i) => i !== index));
  };

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
      const pecasValidas = pecas.filter((p) => p.descricao.trim());

      const novoOrc = await DataStore.saveOrcamento({
        ocorrencia_id: ocorrenciaId,
        numero: numero.trim(),
        fornecedor: fornecedor.trim(),
        valor_total: numValor,
        data_envio: dataEnvio ? new Date(dataEnvio).toISOString() : new Date().toISOString(),
        enviado_para: enviadoPara.trim(),
        validade: validade ? new Date(validade).toISOString() : undefined,
        status: status,
        descricao_anomalia: descricaoAnomalia.trim(),
        observacoes: observacoes.trim(),
        pecas: pecasValidas,
        arquivo_pdf_url: pdfUrl || `https://visioncontrols.com.br/docs/orcamentos/${numero.trim()}.pdf`,
        arquivo_url: pdfUrl || `https://visioncontrols.com.br/docs/orcamentos/${numero.trim()}.pdf`,
      });

      // Cadastrar as peças vinculadas à ocorrência no DataStore
      for (const p of pecasValidas) {
        const unitVal =
          typeof p.valor_unitario === 'string'
            ? parseFloat(p.valor_unitario.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
            : Number(p.valor_unitario) || 0;

        await DataStore.savePeca({
          ocorrencia_id: ocorrenciaId,
          descricao: p.descricao.trim(),
          part_number: p.part_number.trim() || undefined,
          quantidade: Number(p.quantidade) || 1,
          valor_unitario: unitVal,
          fornecedor: fornecedor.trim(),
          status: 'COTADA',
        });
      }

      // Adicionar evento na timeline da ocorrência
      await DataStore.addEvento({
        ocorrencia_id: ocorrenciaId,
        tipo_evento: 'ORCAMENTO_ENVIADO',
        descricao: `Proposta orçamentária ${novoOrc.numero} (${formatCurrency(
          novoOrc.valor_total
        )}) cadastrada com status ${status}`,
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
        className="bg-[#1C222A] border border-[#2C343E] rounded-[8px] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2C343E] bg-[#14181D] flex items-center justify-between shrink-0">
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
          <div className="px-4 py-2.5 bg-[#E5484D]/15 border-b border-[#E5484D]/30 text-[#FF6B6B] text-xs flex items-center gap-2 font-mono shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Vincular à Ocorrência se houver mais de uma */}
          {ocorrencias.length > 1 && !defaultOcorrenciaId && (
            <div>
              <label className="block text-[11px] font-semibold text-[#ECEFF1] mb-1">
                Vincular à Ocorrência (OS) *
              </label>
              <select
                id="novo-orc-ocorrencia"
                value={ocorrenciaId}
                onChange={(e) => setOcorrenciaId(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] rounded-[6px] px-3 py-2 text-xs font-mono text-[#ECEFF1] focus:border-[#38BDF8] focus:outline-none"
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
          )}

          {/* 1. Número da Proposta & 2. Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Número da Proposta */}
            <div>
              <label className="block text-[11px] font-semibold text-[#ECEFF1] mb-1">
                Número da Proposta *
              </label>
              <input
                id="novo-orc-numero"
                type="text"
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex: ORC-2026-0825-REV1"
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#38BDF8] rounded-[6px] px-3 py-2 text-xs font-mono font-bold text-[#ECEFF1] placeholder:text-[#6B7683] focus:outline-none"
              />
            </div>

            {/* 2. Status da Proposta */}
            <div>
              <label className="block text-[11px] font-semibold text-[#ECEFF1] mb-1">
                Status da Proposta *
              </label>
              <select
                id="novo-orc-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrcamentoStatus)}
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#38BDF8] rounded-[6px] px-3 py-2 text-xs font-mono text-[#ECEFF1] focus:outline-none cursor-pointer"
              >
                <option value="RASCUNHO">Rascunho</option>
                <option value="ENVIADO">Enviado</option>
                <option value="EM_ANALISE">Em Análise</option>
                <option value="AGUARDANDO_APROVACAO_AMBEV">Aguardando Aprovação AMBEV</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REPROVADO">Reprovado</option>
                <option value="EXPIRADO">Expirado</option>
              </select>
            </div>
          </div>

          {/* 3. Fornecedor / Emitente & 4. Valor Total da Proposta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 3. Fornecedor / Emitente */}
            <div>
              <label className="block text-[11px] font-semibold text-[#ECEFF1] mb-1">
                Fornecedor / Emitente *
              </label>
              <input
                id="novo-orc-fornecedor"
                type="text"
                required
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Nome da empresa emitente"
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#38BDF8] rounded-[6px] px-3 py-2 text-xs text-[#ECEFF1] focus:outline-none"
              />
            </div>

            {/* 4. Valor Total da Proposta */}
            <div>
              <label className="block text-[11px] font-semibold text-[#ECEFF1] mb-1">
                Valor Total da Proposta (R$) *
              </label>
              <input
                id="novo-orc-valor"
                type="number"
                step="0.01"
                required
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="Ex: 14850.00"
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#38BDF8] rounded-[6px] px-3 py-2 text-xs font-mono font-bold text-[#38BDF8] focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Data de Envio & 6. Validade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 5. Data de Envio */}
            <div>
              <label className="block text-[11px] font-semibold text-[#ECEFF1] mb-1">
                Data de Envio
              </label>
              <input
                id="novo-orc-data-envio"
                type="date"
                value={dataEnvio}
                onChange={(e) => setDataEnvio(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#38BDF8] rounded-[6px] px-3 py-2 text-xs font-mono text-[#ECEFF1] focus:outline-none"
              />
              <span className="block text-[10px] text-[#8B949E] mt-1">
                Preenchida com hoje — altere se necessário
              </span>
            </div>

            {/* 6. Validade */}
            <div>
              <label className="block text-[11px] font-semibold text-[#ECEFF1] mb-1">
                Validade (data)
              </label>
              <input
                id="novo-orc-validade"
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#38BDF8] rounded-[6px] px-3 py-2 text-xs font-mono text-[#ECEFF1] focus:outline-none"
              />
            </div>
          </div>

          {/* 7. Enviado para (contato AMBEV) */}
          <div>
            <label className="block text-[11px] font-semibold text-[#ECEFF1] mb-1">
              Enviado para (contato AMBEV)
            </label>
            <input
              id="novo-orc-enviado-para"
              type="text"
              value={enviadoPara}
              onChange={(e) => setEnviadoPara(e.target.value)}
              placeholder="Ex: Engenharia de Utilidades AMBEV (Eng. Marcos Silveira)"
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#38BDF8] rounded-[6px] px-3 py-2 text-xs text-[#ECEFF1] focus:outline-none"
            />
          </div>

          {/* 8. Descrição da Anomalia / Problema */}
          <div>
            <label className="block text-[11px] font-semibold text-[#ECEFF1] mb-1">
              Descrição da Anomalia / Problema
            </label>
            <textarea
              id="novo-orc-descricao-anomalia"
              rows={3}
              value={descricaoAnomalia}
              onChange={(e) => setDescricaoAnomalia(e.target.value)}
              placeholder="Descreva o problema identificado no equipamento..."
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#38BDF8] rounded-[6px] p-2.5 text-xs text-[#ECEFF1] placeholder:text-[#6B7683] focus:outline-none"
            />
          </div>

          {/* 9. Peças / Itens Incluídos no Orçamento */}
          <div className="p-3.5 bg-[#14181D] border border-[#2C343E] rounded-[6px] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#ECEFF1] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#38BDF8]" />
                Peças / Itens Incluídos no Orçamento
              </label>
              <button
                type="button"
                onClick={adicionarPeca}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-[4px] bg-[#2C343E] hover:bg-[#38BDF8]/20 text-[#ECEFF1] hover:text-[#38BDF8] border border-[#38BDF8]/30 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar Item</span>
              </button>
            </div>

            {pecas.length === 0 ? (
              <p className="text-[11px] text-[#8B949E] italic">Nenhuma peça adicionada ainda.</p>
            ) : (
              <div className="space-y-2">
                {pecas.map((peca, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 60px 100px auto',
                      gap: 8,
                      marginTop: 8,
                      alignItems: 'start',
                    }}
                  >
                    <input
                      placeholder="Descrição da peça"
                      value={peca.descricao}
                      onChange={(e) => atualizarPeca(i, 'descricao', e.target.value)}
                      className="bg-[#0D1117] border border-[#2C343E] focus:border-[#38BDF8] rounded-[4px] px-2.5 py-1.5 text-xs text-[#ECEFF1] placeholder:text-[#6B7683] focus:outline-none"
                    />
                    <input
                      placeholder="Part Number"
                      value={peca.part_number}
                      onChange={(e) => atualizarPeca(i, 'part_number', e.target.value)}
                      className="bg-[#0D1117] border border-[#2C343E] focus:border-[#38BDF8] rounded-[4px] px-2.5 py-1.5 text-xs font-mono text-[#ECEFF1] placeholder:text-[#6B7683] focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Qtd"
                      value={peca.quantidade}
                      onChange={(e) => atualizarPeca(i, 'quantidade', Number(e.target.value))}
                      min={1}
                      className="bg-[#0D1117] border border-[#2C343E] focus:border-[#38BDF8] rounded-[4px] px-2 py-1.5 text-xs font-mono text-[#ECEFF1] text-center focus:outline-none"
                    />
                    <input
                      placeholder="R$ 0,00"
                      value={peca.valor_unitario}
                      onChange={(e) => atualizarPeca(i, 'valor_unitario', e.target.value)}
                      className="bg-[#0D1117] border border-[#2C343E] focus:border-[#38BDF8] rounded-[4px] px-2.5 py-1.5 text-xs font-mono text-[#ECEFF1] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removerPeca(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FF6B6B',
                        cursor: 'pointer',
                        padding: 4,
                        marginTop: 4,
                      }}
                      title="Remover peça"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 10. Observações Técnicas */}
          <div>
            <label className="block text-[11px] font-semibold text-[#ECEFF1] mb-1">
              Observações Técnicas
            </label>
            <textarea
              id="novo-orc-observacoes"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#38BDF8] rounded-[6px] p-2.5 text-xs text-[#ECEFF1] placeholder:text-[#6B7683] focus:outline-none"
              placeholder="Escopo de materiais, frete incluso, mão de obra, condições de garantia..."
            />
          </div>

          {/* 11. Upload do PDF */}
          <div className="p-3.5 bg-[#14181D] border border-[#2C343E] rounded-[6px]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[#ECEFF1] flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#38BDF8]" />
                Upload do PDF da Proposta
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
                className="w-full sm:w-auto px-3.5 py-1.5 bg-[#2C343E] hover:bg-[#38BDF8]/20 text-[#ECEFF1] hover:text-[#38BDF8] border border-[#38BDF8]/30 rounded-[4px] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                {pdfFile ? 'Substituir PDF' : 'Selecionar Documento PDF'}
              </button>

              <div className="text-[11px] font-mono text-[#94A3B8] truncate flex-1 text-center sm:text-left">
                {pdfFile ? pdfFile.name : 'Opcional. Pode ser anexado posteriormente.'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#2C343E] flex items-center justify-end gap-2.5">
            <button
              id="btn-novo-orc-cancelar"
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-novo-orc-salvar"
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-[4px] bg-[#2ECC71] hover:bg-[#27AE60] text-[#14181D] transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Cadastrando...' : 'Salvar Proposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

