import React, { useState } from 'react';
import {
  FileText, Send, Receipt, ShoppingCart, CheckCircle2,
  Clock, ChevronRight, Pencil, X, Check, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DataStore } from '../../lib/dataStore';
import { Ocorrencia, OcorrenciaStatus } from '../../types/database';

interface Fase {
  id: OcorrenciaStatus;
  label: string;
  sublabel: string;       // instrução: o que fazer nessa fase
  labelConcluido: string; // confirmação: o que foi feito
  icon: React.FC<{ className?: string }>;
  cor: string;
  corBg: string;
  campo?: keyof Ocorrencia;
  campoExtra?: keyof Ocorrencia;
  labelExtra?: string;
  placeholderExtra?: string;
}

const FASES: Fase[] = [
  {
    id: 'ABERTA',
    label: 'Ocorrência Aberta',
    sublabel: 'Técnico registrou o chamado em campo',
    labelConcluido: 'Ocorrência registrada em campo',
    icon: AlertTriangle,
    cor: '#F85149',
    corBg: 'rgba(248,81,73,0.12)',
  },
  {
    id: 'AGUARDANDO_ORCAMENTO',
    label: 'Cotação de Fornecedor',
    sublabel: 'Solicitar e cadastrar cotações de fornecedores',
    labelConcluido: 'Cotações de fornecedores recebidas',
    icon: FileText,
    cor: '#D29922',
    corBg: 'rgba(210,153,34,0.12)',
    campo: 'data_orcamento_interno',
  },
  {
    id: 'ORCAMENTO_INTERNO_FEITO',
    label: 'Orçamento Interno',
    sublabel: 'Levantar cotação com fornecedores e gerar Proposta Comercial',
    labelConcluido: 'Orçamento interno gerado',
    icon: FileText,
    cor: '#F5A623',
    corBg: 'rgba(245,166,35,0.12)',
    campo: 'data_orcamento_interno',
  },
  {
    id: 'PPAC_ENVIADO',
    label: 'PPAC Enviado',
    sublabel: 'Emitir e enviar a Proposta Comercial à AMBEV',
    labelConcluido: 'Proposta comercial (PPAC) enviada à AMBEV',
    icon: Send,
    cor: '#58A6FF',
    corBg: 'rgba(88,166,255,0.12)',
    campo: 'data_ppac_enviado',
    campoExtra: 'ppac',
    labelExtra: 'Nº da PPAC',
    placeholderExtra: 'Ex: 11101',
  },
  {
    id: 'RC_GERADA',
    label: 'RC Gerada',
    sublabel: 'Aguardando AMBEV emitir a Requisição de Compra',
    labelConcluido: 'Requisição de Compra emitida pela AMBEV',
    icon: Receipt,
    cor: '#A371F7',
    corBg: 'rgba(163,113,247,0.12)',
    campo: 'data_rc',
    campoExtra: 'numero_rc',
    labelExtra: 'Nº da RC',
    placeholderExtra: 'Ex: RC-2026-00123',
  },
  {
    id: 'PEDIDO_DE_COMPRA',
    label: 'Pedido de Compra',
    sublabel: 'Aguardando AMBEV emitir o Pedido de Compra',
    labelConcluido: 'Pedido de Compra recebido da AMBEV',
    icon: ShoppingCart,
    cor: '#3FB950',
    corBg: 'rgba(63,185,80,0.12)',
    campo: 'data_pedido_compra',
    campoExtra: 'numero_pedido_compra',
    labelExtra: 'Nº do Pedido',
    placeholderExtra: 'Ex: 4500012345',
  },
  {
    id: 'CONCLUIDA',
    label: 'Ocorrência Registrada',
    sublabel: 'Entregar serviço ou peça e encerrar a OS',
    labelConcluido: 'Serviço ou peça entregue — OS concluída',
    icon: CheckCircle2,
    cor: '#3FB950',
    corBg: 'rgba(63,185,80,0.12)',
    campo: 'data_entrega',
  },
];

interface Fase {
  id: OcorrenciaStatus;
  label: string;
  sublabel: string;
  labelConcluido: string;
  icon: React.FC<{ className?: string }>;
  cor: string;
  corBg: string;
  campo?: keyof Ocorrencia;
  campoExtra?: keyof Ocorrencia;
  labelExtra?: string;
  placeholderExtra?: string;
}

interface Props {
  ocorrencia: Ocorrencia;
  canEdit: boolean;
  onAtualizado: () => void;
  usuarioNome: string;
  faseParaAbrir?: OcorrenciaStatus | null;
  onFaseAberta?: () => void;
  onAbrirProposta?: () => void;
  onFluxoAvancou?: (novaFase: OcorrenciaStatus) => Promise<void>; // sincroniza status da PPAC
}

export const FluxoComercial: React.FC<Props> = ({ ocorrencia, canEdit, onAtualizado, usuarioNome, faseParaAbrir, onFaseAberta, onAbrirProposta, onFluxoAvancou }) => {
  const faseAtualIdx = FASES.findIndex((f) => f.id === ocorrencia.status);
  const faseAtual = faseAtualIdx >= 0 ? faseAtualIdx : 0;

  const [editando, setEditando] = useState<string | null>(null);
  const [dataInput, setDataInput] = useState('');
  const [extraInput, setExtraInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Quando o dropdown muda de fase, abre o painel de registro automaticamente
  React.useEffect(() => {
    if (faseParaAbrir && canEdit) {
      const fase = FASES.find((f) => f.id === faseParaAbrir);
      if (fase && faseParaAbrir !== 'ABERTA' && faseParaAbrir !== 'CANCELADA') {
        abrirAvanco(faseParaAbrir);
        onFaseAberta?.();
      }
    }
  }, [faseParaAbrir]);

  const abrirAvanco = (faseId: string) => {
    // Fase de Cotação: avança para Orçamento Interno e abre proposta
    if (faseId === 'ORCAMENTO_INTERNO_FEITO') {
      handleOrcamentoInterno();
      return;
    }
    const fase = FASES.find((f) => f.id === faseId)!;
    const dataAtual = fase.campo ? (ocorrencia[fase.campo] as string) || '' : '';
    const extraAtual = fase.campoExtra ? (ocorrencia[fase.campoExtra] as string) || '' : '';
    setDataInput(dataAtual ? dataAtual.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setExtraInput(extraAtual);
    setEditando(faseId);
  };

  const handleOrcamentoInterno = async () => {
    const hoje = new Date().toISOString().slice(0, 10);
    try {
      await DataStore.updateOcorrenciaExtra(ocorrencia.id, {
        status: 'ORCAMENTO_INTERNO_FEITO',
        data_orcamento_interno: hoje,
      });
      await DataStore.addComentario(
        ocorrencia.id,
        usuarioNome,
        `Orçamento interno concluído em ${new Date(hoje + 'T12:00:00').toLocaleDateString('pt-BR')} — Gerando proposta comercial (PPAC)`
      );
      await onAtualizado();
      // Abre o modal de Nova Proposta Comercial
      onAbrirProposta?.();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao registrar orçamento interno');
    }
  };

  const salvarAvanco = async (faseId: string) => {
    const fase = FASES.find((f) => f.id === faseId)!;
    setSaving(true);
    try {
      const extras: Record<string, unknown> = { status: faseId };
      if (fase.campo && dataInput) extras[fase.campo as string] = dataInput;
      if (fase.campoExtra && extraInput) extras[fase.campoExtra as string] = extraInput;
      if (faseId === 'CONCLUIDA') extras['data_conclusao'] = dataInput;

      await DataStore.updateOcorrenciaExtra(ocorrencia.id, extras);

      // Atualiza status das peças conforme a fase do fluxo
      const FASE_PARA_STATUS_PECA: Partial<Record<string, string>> = {
        'AGUARDANDO_ORCAMENTO':   'COTACAO',
        'ORCAMENTO_INTERNO_FEITO': 'COTADA',
        'PPAC_ENVIADO':            'APROVADA',
        'RC_GERADA':               'APROVADA_COMPRA',
        'PEDIDO_DE_COMPRA':        'COMPRADA',
        'CONCLUIDA':               'ENTREGUE',
      };
      const novoStatusPeca = FASE_PARA_STATUS_PECA[faseId];
      if (novoStatusPeca) {
        try {
          const pecasOS = await DataStore.getPecasByOcorrencia(ocorrencia.id);
          for (const p of pecasOS) {
            await DataStore.savePeca({ ...p, status: novoStatusPeca as any });
          }
        } catch (e) { console.warn('updatePecas:', e); }
      }

      await DataStore.addComentario(
        ocorrencia.id,
        usuarioNome,
        `Fase avançada para: ${fase.label}${extraInput ? ` · ${fase.labelExtra}: ${extraInput}` : ''}${dataInput ? ` · Data: ${new Date(dataInput + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}`
      );
      // Sincroniza status da proposta PPAC com a fase do fluxo
      await onFluxoAvancou?.(faseId as OcorrenciaStatus);
      toast.success(`Fase "${fase.label}" registrada`);
      setEditando(null);
      onAtualizado();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao avançar fase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card space-y-2">
      {/* Header compacto */}
      <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
        <h3 className="card-title text-xs uppercase flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" />
          Fluxo Comercial
        </h3>
        <span className="text-[10px] text-[#8B949E]">
          Fase atual: <strong className="text-[#E6EDF3]">{FASES[faseAtual]?.label || 'Aberta'}</strong>
        </span>
      </div>

      {/* Steps — linha do tempo compacta */}
      <div className="space-y-0">
        {FASES.map((fase, idx) => {
          const concluida = idx < faseAtual;
          const atual = idx === faseAtual;
          const dataFase = fase.campo ? (ocorrencia[fase.campo] as string) : undefined;
          const extraFase = fase.campoExtra ? (ocorrencia[fase.campoExtra] as string) : undefined;
          const temDataRegistrada = fase.campo ? !!(ocorrencia[fase.campo] as string) : false;
          // "Avançar" só na próxima fase ainda não feita
          const podeAvancar = canEdit && !editando && idx > 0 && idx === faseAtual + 1;
          // "Editar" apenas nas fases já concluídas que têm campo registrável
          const podeEditar = canEdit && !editando && idx > 0 && (concluida || (atual && temDataRegistrada)) && fase.campo;
          const dataFmt = dataFase
            ? new Date(dataFase + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : null;

          return (
            <div key={fase.id} className="flex gap-0">
              {/* Coluna da linha + ícone */}
              <div className="flex flex-col items-center w-8 shrink-0">
                {/* Linha de cima */}
                <div className={`w-px flex-none ${idx === 0 ? 'invisible' : concluida || atual ? 'bg-[#30363D]' : 'bg-[#21262D]'}`}
                  style={{ height: 8 }} />
                {/* Ícone */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center border shrink-0"
                  style={{
                    background: concluida || atual ? fase.corBg : 'transparent',
                    borderColor: concluida || atual ? fase.cor : '#30363D',
                  }}
                >
                  {concluida
                    ? <Check className="w-3.5 h-3.5" style={{ color: fase.cor }} />
                    : <fase.icon className="w-3.5 h-3.5" style={{ color: atual ? fase.cor : '#484F58' }} />
                  }
                </div>
                {/* Linha de baixo */}
                {idx < FASES.length - 1 && (
                  <div className={`w-px flex-1 min-h-[12px] ${concluida ? 'bg-[#30363D]' : 'bg-[#21262D]'}`} />
                )}
              </div>

              {/* Conteúdo da fase */}
              <div className={`flex-1 min-w-0 ml-2.5 pb-2 ${idx === 0 ? 'pt-1' : 'pt-1'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`text-[11px] font-bold leading-none ${
                      atual ? 'text-[#E6EDF3]' : concluida ? 'text-[#C9D1D9]' : 'text-[#484F58]'
                    }`}>
                      {fase.label}
                    </span>
                    {dataFmt && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: fase.corBg, color: fase.cor }}>
                        {dataFmt}
                      </span>
                    )}
                    {extraFase && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#21262D] text-[#C9D1D9] border border-[#30363D]">
                        {fase.labelExtra}: {extraFase}
                      </span>
                    )}
                  </div>

                  {/* Botão Avançar (só na próxima fase) ou Editar (nas concluídas) */}
                  {podeAvancar && (
                    <button
                      onClick={() => abrirAvanco(fase.id)}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all"
                      style={{ background: fase.corBg, borderColor: fase.cor + '50', color: fase.cor }}
                    >
                      › Avançar
                    </button>
                  )}
                  {podeEditar && !podeAvancar && (
                    <button
                      onClick={() => abrirAvanco(fase.id)}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all bg-[#21262D] border-[#30363D] text-[#8B949E] hover:text-white"
                    >
                      ✏ Editar
                    </button>
                  )}
                </div>

                {/* Sublabel: instrução quando pendente, confirmação quando feito */}
                {(() => {
                  const temData = fase.campo && (ocorrencia[fase.campo] as string);
                  if (concluida || (atual && temData)) {
                    // Fase concluída OU fase atual já com data registrada → mostra confirmação em verde
                    return <p className="text-[10px] text-[#3FB950]/70 mt-0.5 leading-tight">{fase.labelConcluido}</p>;
                  }
                  if (atual || idx === faseAtual + 1) {
                    // Fase atual sem data, ou próxima → mostra instrução
                    return <p className="text-[10px] text-[#6E7681] mt-0.5 leading-tight">{fase.sublabel}</p>;
                  }
                  return null;
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel inline de edição — fora do loop, renderiza abaixo do stepper */}
      {editando && (() => {
        const fase = FASES.find((f) => f.id === editando)!;
        return (
          <div className="mt-1 bg-[#0A0E1A] border border-[#30363D] rounded-lg p-3 space-y-2.5">
            <p className="text-[11px] font-bold text-[#E6EDF3] uppercase">Registrar: {fase.label}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">Data</label>
                <input type="date" value={dataInput} onChange={(e) => setDataInput(e.target.value)}
                  className="w-full h-8 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md px-2.5 outline-none focus:border-[#8B949E]" />
              </div>
              {fase.campoExtra && (
                <div>
                  <label className="block text-[9px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">{fase.labelExtra}</label>
                  <input type="text" value={extraInput} onChange={(e) => setExtraInput(e.target.value)}
                    placeholder={fase.placeholderExtra}
                    className="w-full h-8 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md px-2.5 outline-none focus:border-[#8B949E] font-mono" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditando(null)} disabled={saving}
                className="flex-1 h-8 rounded-md bg-[#161B22] border border-[#30363D] text-[#C9D1D9] text-[11px] font-semibold">
                Cancelar
              </button>
              <button onClick={() => salvarAvanco(editando)} disabled={saving}
                className="flex-1 h-8 rounded-md text-[11px] font-bold disabled:opacity-60"
                style={{ background: fase.cor, color: '#0D1117' }}>
                {saving ? 'Salvando...' : '✓ Confirmar'}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
