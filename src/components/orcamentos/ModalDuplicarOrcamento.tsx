import React, { useState, useEffect } from 'react';
import { X, Copy, AlertTriangle, CheckCircle2, DollarSign, Calendar, Building2, User, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Orcamento, OrcamentoStatus } from '../../types/database';
import { DataStore } from '../../lib/dataStore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface ModalDuplicarOrcamentoProps {
  orcamentoOriginal: Orcamento | null;
  ocorrenciaId: string;
  isOpen: boolean;
  onSalvo: () => void;
  onFechar: () => void;
}

export const ModalDuplicarOrcamento: React.FC<ModalDuplicarOrcamentoProps> = ({
  orcamentoOriginal,
  ocorrenciaId,
  isOpen,
  onSalvo,
  onFechar,
}) => {
  // Número auto-incrementado: REV1 → REV2, REV2 → REV3
  const proximoNumero = () => {
    if (!orcamentoOriginal) return '';
    const atual = orcamentoOriginal.numero ?? '';
    const match = atual.match(/REV(\d+)$/i);
    if (match) {
      const rev = parseInt(match[1]) + 1;
      return atual.replace(/REV\d+$/i, `REV${rev}`);
    }
    return atual ? `${atual}-REV2` : 'ORC-REV2';
  };

  const [form, setForm] = useState({
    numero: '',
    status: 'RASCUNHO' as OrcamentoStatus,
    fornecedor: '',
    valor_total: '' as string | number,
    data_envio: new Date().toISOString().split('T')[0],
    validade: '',
    enviado_para: '',
    observacoes: '',
  });

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen && orcamentoOriginal) {
      setForm({
        numero: proximoNumero(),
        status: 'RASCUNHO',
        fornecedor: orcamentoOriginal.fornecedor ?? '',
        valor_total: orcamentoOriginal.valor_total ?? '',
        data_envio: new Date().toISOString().split('T')[0],
        validade: '',
        enviado_para: orcamentoOriginal.enviado_para ?? '',
        observacoes: '',
      });
      setSalvando(false);
    }
  }, [isOpen, orcamentoOriginal]);

  if (!isOpen || !orcamentoOriginal) return null;

  const salvar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.numero.trim()) {
      toast.error('Informe o número da nova proposta.');
      return;
    }
    if (form.valor_total === '' || isNaN(Number(form.valor_total))) {
      toast.error('Informe um valor total válido.');
      return;
    }

    setSalvando(true);
    try {
      // 1. Inserir nova proposta no DataStore
      const novoOrc = await DataStore.saveOrcamento({
        ocorrencia_id: ocorrenciaId,
        numero: form.numero.trim(),
        status: form.status,
        fornecedor: form.fornecedor.trim(),
        valor_total: Number(form.valor_total),
        data_envio: form.data_envio ? new Date(form.data_envio).toISOString() : new Date().toISOString(),
        validade: form.validade ? new Date(form.validade).toISOString() : undefined,
        enviado_para: form.enviado_para.trim(),
        observacoes: form.observacoes.trim(),
        descricao_anomalia: orcamentoOriginal.descricao_anomalia,
        pecas: orcamentoOriginal.pecas,
        arquivo_pdf_url: orcamentoOriginal.arquivo_pdf_url,
        arquivo_url: orcamentoOriginal.arquivo_url,
      });

      // 2. Marcar automaticamente a proposta original como EXPIRADO
      await DataStore.saveOrcamento({
        id: orcamentoOriginal.id,
        status: 'EXPIRADO',
      });

      // 3. Adicionar evento na timeline da ocorrência
      await DataStore.addEvento({
        ocorrencia_id: ocorrenciaId,
        tipo_evento: 'ORCAMENTO_REVISADO',
        descricao: `Nova revisão ${form.numero.trim()} criada a partir de ${orcamentoOriginal.numero}. Proposta anterior marcada como EXPIRADO.`,
      });

      // 4. Integração com Supabase se configurado
      if (isSupabaseConfigured) {
        try {
          const { error: insertError } = await supabase.from('orcamentos').insert({
            ocorrencia_id: ocorrenciaId,
            numero: form.numero.trim(),
            status: form.status,
            fornecedor: form.fornecedor.trim(),
            valor_total: Number(form.valor_total),
            data_envio: form.data_envio,
            validade: form.validade || null,
            enviado_para: form.enviado_para.trim(),
            observacoes: form.observacoes.trim(),
          });

          if (!insertError) {
            await supabase
              .from('orcamentos')
              .update({ status: 'EXPIRADO' })
              .eq('id', orcamentoOriginal.id);
          }
        } catch (supaErr) {
          console.warn('Sync com Supabase:', supaErr);
        }
      }

      toast.success(`Proposta ${form.numero} criada com sucesso!`);
      onSalvo();
      onFechar();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao salvar: ' + (error?.message || 'Falha na gravação'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      id="modal-duplicar-orcamento-overlay"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onFechar}
    >
      <div
        id="modal-duplicar-orcamento-box"
        className="bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#30363D] bg-[#0D1117] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8B949E] uppercase font-mono tracking-wider font-semibold block">
              Nova Revisão — baseada em {orcamentoOriginal.numero}
            </span>
            <h2 className="text-base font-bold text-[#F0F6FC] flex items-center gap-2 mt-0.5">
              <Copy className="w-4 h-4 text-[#58A6FF]" />
              Duplicar e Reenviar Proposta
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="text-[#8B949E] hover:text-[#F0F6FC] p-1.5 rounded-lg hover:bg-[#21262D] transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={salvar} className="p-5 space-y-4">
          {/* Aviso */}
          <div
            style={{
              background: 'rgba(210,153,34,0.08)',
              border: '1px solid rgba(210,153,34,0.2)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              color: '#F59E0B',
            }}
            className="flex items-start gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#F59E0B]" />
            <div>
              ⚠️ Isso cria uma <strong>nova proposta</strong> vinculada à mesma ocorrência.
              A proposta original <strong>{orcamentoOriginal.numero}</strong> é mantida no histórico (marcada como EXPIRADO).
              Ajuste o que precisar antes de salvar.
            </div>
          </div>

          {/* Campos em Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Número da Nova Proposta */}
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="block text-[11px] font-semibold text-[#F0F6FC] mb-1">
                Número da Nova Proposta *
              </label>
              <input
                id="duplicar-orc-numero"
                required
                value={form.numero}
                onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))}
                placeholder="Ex: ORC-2026-0825-REV2"
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#58A6FF] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#58A6FF] placeholder:text-[#6E7681] focus:outline-none"
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="block text-[11px] font-semibold text-[#F0F6FC] mb-1">
                Status
              </label>
              <select
                id="duplicar-orc-status"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as OrcamentoStatus }))}
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#58A6FF] rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] focus:outline-none cursor-pointer"
              >
                <option value="RASCUNHO">Rascunho</option>
                <option value="ENVIADO">Enviado</option>
                <option value="EM_ANALISE">Em Análise</option>
                <option value="AGUARDANDO_APROVACAO_AMBEV">Aguardando Aprovação AMBEV</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REPROVADO">Reprovado</option>
              </select>
            </div>

            {/* Fornecedor */}
            <div className="form-group">
              <label className="block text-[11px] font-semibold text-[#F0F6FC] mb-1">
                Fornecedor
              </label>
              <input
                id="duplicar-orc-fornecedor"
                value={form.fornecedor}
                onChange={(e) => setForm((p) => ({ ...p, fornecedor: e.target.value }))}
                placeholder="Nome do fornecedor"
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#58A6FF] rounded-lg px-3 py-2 text-xs text-[#F0F6FC] placeholder:text-[#6E7681] focus:outline-none"
              />
            </div>

            {/* Valor Total (R$) */}
            <div className="form-group">
              <label className="block text-[11px] font-semibold text-[#F0F6FC] mb-1">
                Valor Total (R$) *
              </label>
              <input
                id="duplicar-orc-valor"
                type="number"
                required
                value={form.valor_total}
                onChange={(e) => setForm((p) => ({ ...p, valor_total: e.target.value }))}
                placeholder="0,00"
                step="0.01"
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#58A6FF] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#38BDF8] placeholder:text-[#6E7681] focus:outline-none"
              />
            </div>

            {/* Data de Envio */}
            <div className="form-group">
              <label className="block text-[11px] font-semibold text-[#F0F6FC] mb-1">
                Data de Envio
              </label>
              <input
                id="duplicar-orc-data-envio"
                type="date"
                value={form.data_envio}
                onChange={(e) => setForm((p) => ({ ...p, data_envio: e.target.value }))}
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#58A6FF] rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] focus:outline-none"
              />
              <span style={{ fontSize: 10, color: '#8B949E' }} className="block mt-1">
                Preenchida com hoje — altere se necessário
              </span>
            </div>

            {/* Nova Validade */}
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="block text-[11px] font-semibold text-[#F0F6FC] mb-1">
                Nova Validade
              </label>
              <input
                id="duplicar-orc-validade"
                type="date"
                value={form.validade}
                onChange={(e) => setForm((p) => ({ ...p, validade: e.target.value }))}
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#58A6FF] rounded-lg px-3 py-2 text-xs font-mono text-[#F0F6FC] focus:outline-none"
              />
            </div>

            {/* Enviado Para (Contato AMBEV) */}
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="block text-[11px] font-semibold text-[#F0F6FC] mb-1">
                Enviado Para (Contato AMBEV)
              </label>
              <input
                id="duplicar-orc-enviado-para"
                value={form.enviado_para}
                onChange={(e) => setForm((p) => ({ ...p, enviado_para: e.target.value }))}
                placeholder="Ex: Engenharia de Utilidades AMBEV"
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#58A6FF] rounded-lg px-3 py-2 text-xs text-[#F0F6FC] placeholder:text-[#6E7681] focus:outline-none"
              />
            </div>

            {/* Observações / Justificativa da Revisão */}
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="block text-[11px] font-semibold text-[#F0F6FC] mb-1">
                Observações / Justificativa da Revisão
              </label>
              <textarea
                id="duplicar-orc-observacoes"
                value={form.observacoes}
                onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                placeholder="Ex: Reajuste de 8% por variação cambial do compressor. Nova validade de 30 dias."
                rows={3}
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#58A6FF] rounded-lg p-2.5 text-xs text-[#F0F6FC] placeholder:text-[#6E7681] focus:outline-none"
              />
            </div>
          </div>

          {/* Rodapé */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #30363D',
            }}
          >
            <button
              type="button"
              className="btn-secondary px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
              onClick={onFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              disabled={salvando}
            >
              <CheckCircle2 className="w-4 h-4" />
              {salvando ? 'Salvando...' : '💾 Salvar Nova Revisão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
