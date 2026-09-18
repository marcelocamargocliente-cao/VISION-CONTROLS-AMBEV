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
}

export const FluxoComercial: React.FC<Props> = ({ ocorrencia, canEdit, onAtualizado, usuarioNome }) => {
  const faseAtualIdx = FASES.findIndex((f) => f.id === ocorrencia.status);
  const faseAtual = faseAtualIdx >= 0 ? faseAtualIdx : 0;

  const [editando, setEditando] = useState<string | null>(null);
  const [dataInput, setDataInput] = useState('');
  const [extraInput, setExtraInput] = useState('');
  const [saving, setSaving] = useState(false);

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
    <div className="card space-y-3">
      {/* Header */}
      <div className="border-b border-[#30363D] pb-2">
        <h3 className="card-title text-xs uppercase flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          Fluxo Comercial da OS
        </h3>
        <p className="text-[10px] text-[#8B949E] mt-0.5">
          Fase atual: <strong className="text-[#E6EDF3]">{FASES[faseAtual]?.label || 'Aberta'}</strong>
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        {FASES.map((fase, idx) => {
          const concluida = idx < faseAtual;
          const atual = idx === faseAtual;
          const futura = idx > faseAtual;
          const dataFase = fase.campo ? (ocorrencia[fase.campo] as string) : undefined;
          const extraFase = fase.campoExtra ? (ocorrencia[fase.campoExtra] as string) : undefined;
          const proximaFase = idx === faseAtual + 1;
          const podeAvancar = canEdit && (atual || proximaFase) && !editando;

          return (
            <div key={fase.id}>
              <div
                className={`relative flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  atual
                    ? 'border-[#8B949E]/50 bg-[#161B22]'
                    : concluida
                    ? 'border-[#30363D] bg-[#0D1117]'
                    : 'border-[#21262D] bg-[#0A0E1A] opacity-60'
                }`}
              >
                {/* Ícone */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border"
                  style={{
                    background: concluida || atual ? fase.corBg : 'transparent',
                    borderColor: concluida || atual ? fase.cor : '#30363D',
                  }}
                >
                  {concluida ? (
                    <Check className="w-4 h-4" style={{ color: fase.cor }} />
                  ) : (
                    <fase.icon className="w-4 h-4" style={{ color: atual ? fase.cor : '#6E7681' }} />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-[12px] font-bold ${atual ? 'text-[#E6EDF3]' : concluida ? 'text-[#C9D1D9]' : 'text-[#6E7681]'}`}>
                        {fase.label}
                      </p>
                      <p className="text-[10px] text-[#8B949E]">{fase.sublabel}</p>
                    </div>

                    {/* Botão avançar */}
                    {podeAvancar && idx > 0 && (
                      <button
                        onClick={() => abrirAvanco(fase.id)}
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-all"
                        style={{
                          background: fase.corBg,
                          borderColor: fase.cor + '50',
                          color: fase.cor,
                        }}
                      >
                        <ChevronRight className="w-3 h-3" />
                        {atual ? 'Editar' : 'Avançar'}
                      </button>
                    )}
                  </div>

                  {/* Dados registrados */}
                  {(dataFase || extraFase) && (
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {dataFase && (
                        <span className="text-[10px] text-[#8B949E] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(dataFase + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {extraFase && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{ background: fase.corBg, color: fase.cor }}>
                          {fase.labelExtra}: {extraFase}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Painel de edição inline */}
              {editando === fase.id && (
                <div className="mt-1 ml-11 bg-[#161B22] border border-[#30363D] rounded-lg p-3 space-y-2.5">
                  <p className="text-[11px] font-bold text-[#E6EDF3] uppercase">
                    Registrar: {fase.label}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">
                        Data {fase.label}
                      </label>
                      <input
                        type="date"
                        value={dataInput}
                        onChange={(e) => setDataInput(e.target.value)}
                        className="w-full h-9 bg-[#0A0E1A] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md px-2.5 outline-none focus:border-[#8B949E]"
                      />
                    </div>

                    {fase.campoExtra && (
                      <div>
                        <label className="block text-[9px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">
                          {fase.labelExtra}
                        </label>
                        <input
                          type="text"
                          value={extraInput}
                          onChange={(e) => setExtraInput(e.target.value)}
                          placeholder={fase.placeholderExtra}
                          className="w-full h-9 bg-[#0A0E1A] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md px-2.5 outline-none focus:border-[#8B949E] font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditando(null)}
                      disabled={saving}
                      className="flex-1 h-9 rounded-md bg-[#0A0E1A] border border-[#30363D] text-[#C9D1D9] text-[11px] font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => salvarAvanco(fase.id)}
                      disabled={saving}
                      className="flex-1 h-9 rounded-md text-[11px] font-bold disabled:opacity-60"
                      style={{ background: fase.cor, color: '#0D1117' }}
                    >
                      {saving ? 'Salvando...' : '✓ Confirmar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Conector vertical */}
              {idx < FASES.length - 1 && (
                <div className="flex items-center ml-[19px] py-0.5">
                  <div className={`w-px h-3 ${idx < faseAtual ? 'bg-[#3FB950]/40' : 'bg-[#30363D]'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
