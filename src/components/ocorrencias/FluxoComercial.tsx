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
  sublabel: string;
  icon: React.FC<{ className?: string }>;
  cor: string;
  corBg: string;
  campo?: keyof Ocorrencia;      // campo de data desta fase
  campoExtra?: keyof Ocorrencia; // campo de nº (RC, pedido)
  labelExtra?: string;
  placeholderExtra?: string;
}

const FASES: Fase[] = [
  {
    id: 'ABERTA',
    label: 'Ocorrência Aberta',
    sublabel: 'Técnico registrou o chamado',
    icon: AlertTriangle,
    cor: '#F85149',
    corBg: 'rgba(248,81,73,0.12)',
  },
  {
    id: 'ORCAMENTO_INTERNO_FEITO',
    label: 'Orçamento Interno',
    sublabel: 'Equipe Vision levantou os custos',
    icon: FileText,
    cor: '#F5A623',
    corBg: 'rgba(245,166,35,0.12)',
    campo: 'data_orcamento_interno',
  },
  {
    id: 'PPAC_ENVIADO',
    label: 'PPAC Enviado',
    sublabel: 'Proposta comercial enviada à AMBEV',
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
    sublabel: 'AMBEV emitiu a Requisição de Compra',
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
    sublabel: 'Pedido emitido pela AMBEV',
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
    label: 'Entrega / Concluído',
    sublabel: 'Serviço ou peça entregue à AMBEV',
    icon: CheckCircle2,
    cor: '#3FB950',
    corBg: 'rgba(63,185,80,0.12)',
    campo: 'data_entrega',
  },
];

interface Props {
  ocorrencia: Ocorrencia;
  canEdit: boolean;
  onAtualizado: () => void;
  usuarioNome: string;
  faseParaAbrir?: OcorrenciaStatus | null;   // dropdown → abre painel automaticamente
  onFaseAberta?: () => void;                  // avisa que o painel foi aberto (limpa o gatilho)
}

export const FluxoComercial: React.FC<Props> = ({ ocorrencia, canEdit, onAtualizado, usuarioNome, faseParaAbrir, onFaseAberta }) => {
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
    const fase = FASES.find((f) => f.id === faseId)!;
    const dataAtual = fase.campo ? (ocorrencia[fase.campo] as string) || '' : '';
    const extraAtual = fase.campoExtra ? (ocorrencia[fase.campoExtra] as string) || '' : '';
    setDataInput(dataAtual ? dataAtual.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setExtraInput(extraAtual);
    setEditando(faseId);
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
      await DataStore.addComentario(
        ocorrencia.id,
        usuarioNome,
        `Fase avançada para: ${fase.label}${extraInput ? ` · ${fase.labelExtra}: ${extraInput}` : ''}${dataInput ? ` · Data: ${new Date(dataInput + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}`
      );
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
          const podeAvancar = canEdit && !editando && idx > 0 && (
            idx <= faseAtual + 1  // próxima ou anterior podem ser editadas
          );
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

                  {/* Botão avançar/editar */}
                  {podeAvancar && idx > 0 && (
                    <button
                      onClick={() => abrirAvanco(fase.id)}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all"
                      style={{ background: fase.corBg, borderColor: fase.cor + '50', color: fase.cor }}
                    >
                      {atual ? '✏ Editar' : '› Avançar'}
                    </button>
                  )}
                </div>

                {/* Sub-label só se atual ou próximo com avançar */}
                {(atual || (!concluida && proximaFase)) && (
                  <p className="text-[10px] text-[#6E7681] mt-0.5 leading-none">{fase.sublabel}</p>
                )}
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
