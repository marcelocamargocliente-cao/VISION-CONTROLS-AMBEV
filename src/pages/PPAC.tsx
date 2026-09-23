import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Send, CheckCircle2, XCircle, Clock,
  RefreshCw, Eye, Share2, ChevronRight, AlertTriangle,
  Download, Copy, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DataStore } from '../lib/dataStore';
import { Orcamento, OrcamentoStatus, Ocorrencia, VwEquipamento } from '../types/database';
import { formatCurrency, formatDate, buildOrcamentoEmailContent } from '../utils/formatters';
import { ModalOrcamentoDetalhe } from '../components/orcamentos/ModalOrcamentoDetalhe';

const STATUS_CONFIG: Record<OrcamentoStatus, { label: string; cor: string; bg: string; icon: React.FC<{ className?: string }> }> = {
  RASCUNHO:        { label: 'Rascunho',         cor: '#8B949E', bg: 'rgba(139,148,158,0.12)', icon: FileText },
  ELABORACAO:      { label: 'Em Elaboração',     cor: '#8B949E', bg: 'rgba(139,148,158,0.12)', icon: FileText },
  ENVIADO:         { label: 'PPAC Enviada',       cor: '#58A6FF', bg: 'rgba(88,166,255,0.12)',  icon: Send },
  EM_ANALISE:      { label: 'Em Análise',         cor: '#D29922', bg: 'rgba(210,153,34,0.12)',  icon: Clock },
  EM_ANALISE_AMBEV:{ label: 'Análise AMBEV',      cor: '#D29922', bg: 'rgba(210,153,34,0.12)',  icon: Clock },
  APROVADO:        { label: 'Aprovada',            cor: '#3FB950', bg: 'rgba(63,185,80,0.12)',   icon: CheckCircle2 },
  APROVADO_AMBEV:  { label: 'Aprovada AMBEV',      cor: '#3FB950', bg: 'rgba(63,185,80,0.12)',   icon: CheckCircle2 },
  REPROVADO:       { label: 'Reprovada',           cor: '#F85149', bg: 'rgba(248,81,73,0.12)',   icon: XCircle },
  REJEITADO:       { label: 'Rejeitada',           cor: '#F85149', bg: 'rgba(248,81,73,0.12)',   icon: XCircle },
  REJEITADO_AMBEV: { label: 'Rejeitada AMBEV',     cor: '#F85149', bg: 'rgba(248,81,73,0.12)',   icon: XCircle },
  EXPIRADO:        { label: 'Expirada',            cor: '#D29922', bg: 'rgba(210,153,34,0.12)',  icon: Clock },
  CANCELADO:       { label: 'Cancelada',           cor: '#484F58', bg: 'rgba(72,79,88,0.12)',    icon: XCircle },
  FATURADO:        { label: 'Faturada',            cor: '#3FB950', bg: 'rgba(63,185,80,0.12)',   icon: CheckCircle2 },
};

export const PPAC: React.FC = () => {
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [occsMap, setOccsMap] = useState<Map<string, Ocorrencia>>(new Map());
  const [eqsMap, setEqsMap] = useState<Map<string, VwEquipamento>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<OrcamentoStatus | 'TODOS'>('TODOS');
  const [selected, setSelected] = useState<Orcamento | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mostra cache local imediatamente enquanto Supabase carrega
      const { dbState } = await import('../lib/dataStore').then(m => ({ dbState: (m as any).DataStore }));
      
      const [orcs, occs, eqs] = await Promise.all([
        DataStore.getOrcamentos(),
        DataStore.getOcorrencias(),
        DataStore.getVwEquipamentos(),
      ]);
      setOrcamentos(orcs);
      setOccsMap(new Map(occs.map((o) => [o.id, o])));
      setEqsMap(new Map(eqs.map((e) => [e.id, e])));
    } finally {
      setLoading(false);
    }
  };

  // Carrega também do localStorage diretamente como fallback imediato
  useEffect(() => {
    try {
      const raw = localStorage.getItem('IVCA_DATABASE_LOCAL_V5');
      if (raw) {
        const state = JSON.parse(raw);
        if (state.orcamentos && state.orcamentos.length > 0) {
          setOrcamentos(state.orcamentos);
        }
      }
    } catch {}
    loadData();
  }, []);

  const filtrados = useMemo(() => {
    return orcamentos.filter((o) => {
      if (filtroStatus !== 'TODOS' && o.status !== filtroStatus) return false;
      if (busca.trim()) {
        const b = busca.toLowerCase();
        const occ = occsMap.get(o.ocorrencia_id);
        const eq = occ ? eqsMap.get(occ.equipamento_id) : null;
        return (
          o.numero?.toLowerCase().includes(b) ||
          o.fornecedor?.toLowerCase().includes(b) ||
          (occ as any)?.ordem_sap?.toLowerCase().includes(b) ||
          eq?.tipo?.toLowerCase().includes(b) ||
          eq?.patrimonio_ref?.toLowerCase().includes(b)
        );
      }
      return true;
    });
  }, [orcamentos, filtroStatus, busca, occsMap, eqsMap]);

  // KPIs
  const kpis = useMemo(() => {
    const enviadas  = orcamentos.filter((o) => o.status === 'ENVIADO');
    const aprovadas = orcamentos.filter((o) => o.status === 'APROVADO');
    const expiradas = orcamentos.filter((o) => o.status === 'EXPIRADO');
    const total     = orcamentos.reduce((s, o) => s + (Number(o.valor_total) || 0), 0);
    return { enviadas: enviadas.length, aprovadas: aprovadas.length, expiradas: expiradas.length, total, qtd: orcamentos.length };
  }, [orcamentos]);

  const handleReenviar = async (orc: Orcamento) => {
    try {
      await DataStore.saveOrcamento({ ...orc, status: 'EXPIRADO' as OrcamentoStatus });
      const base = orc.numero.replace(/\D/g, '');
      const novoNum = base ? orc.numero.replace(base, String(Number(base) + 1)) : orc.numero + '-R';
      const nova = await DataStore.saveOrcamento({
        ...orc, id: undefined as any, numero: novoNum, status: 'ENVIADO' as OrcamentoStatus,
        data_envio: new Date().toISOString().slice(0, 10),
      });
      await loadData();
      toast.success(`PPAC ${nova.numero} reenviada · ${orc.numero} marcada como Expirada`);
    } catch { toast.error('Erro ao reenviar'); }
  };

  const handleCompartilharEmail = (orc: Orcamento) => {
    const occ = occsMap.get(orc.ocorrencia_id);
    const eq  = occ ? eqsMap.get(occ.equipamento_id) : null;
    const { subject, body } = buildOrcamentoEmailContent({
      numero: orc.numero,
      valor_total: orc.valor_total,
      validade: orc.validade,
      enviado_para: orc.enviado_para,
      tag: eq?.patrimonio_ref || eq?.tag || '',
      fornecedor: orc.fornecedor || '',
      tipo: eq?.tipo,
      marca: eq?.marca,
      modelo: eq?.modelo,
      tag_ambev: eq?.patrimonio_ref || (eq as any)?.tag_sap,
      ug: (occ as any)?.ug || eq?.ug_ref,
      linha: (occ as any)?.linha || eq?.localizacao_ref,
      ordem_sap: (occ as any)?.ordem_sap,
      status: orc.status,
      pecas: orc.pecas as any[],
    });
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const cfg = (status: OrcamentoStatus) => STATUS_CONFIG[status] || STATUS_CONFIG['RASCUNHO'];

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#58A6FF] border-t-transparent" />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto scroll-fluido max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[10px] text-[#8B949E] uppercase tracking-widest mb-1">
          <span className="px-2 py-0.5 rounded bg-[#21262D] border border-[#30363D]">GESTÃO COMERCIAL</span>
          <span>·</span>
          <span>CONTRATO AMBEV CERVEJARIA RJ</span>
        </div>
        <h1 className="text-lg font-display font-bold uppercase tracking-tight">PPAC — Propostas Comerciais</h1>
        <p className="text-[11px] text-[#8B949E] mt-0.5">Todas as propostas emitidas pela Vision Controls para aprovação AMBEV</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Emitido', value: formatCurrency(kpis.total), sub: `${kpis.qtd} proposta(s)`, cor: '#E6EDF3' },
          { label: 'Aguardando AMBEV', value: kpis.enviadas, sub: 'Em análise', cor: '#58A6FF' },
          { label: 'Aprovadas', value: kpis.aprovadas, sub: 'Liberadas', cor: '#3FB950' },
          { label: 'Expiradas', value: kpis.expiradas, sub: 'Candidatas a reenvio', cor: '#D29922' },
        ].map((k) => (
          <div key={k.label} className="bg-[#111827] border border-[#21262D] rounded-xl p-3.5">
            <p className="text-[10px] text-[#8B949E] uppercase tracking-wider mb-1">{k.label}</p>
            <p className="text-xl font-display font-bold" style={{ color: k.cor }}>{k.value}</p>
            <p className="text-[10px] text-[#8B949E] mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por Nº PPAC, TAG, fornecedor, OS..."
            className="w-full h-10 bg-[#111827] border border-[#21262D] text-[#E6EDF3] text-[12px] rounded-lg pl-9 pr-3 outline-none focus:border-[#8B949E]" />
        </div>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as any)}
          className="h-10 bg-[#111827] border border-[#21262D] text-[#E6EDF3] text-[12px] rounded-lg px-3 outline-none">
          <option value="TODOS">Todos os Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
          <FileText className="w-12 h-12 text-[#30363D]" />
          <p className="text-[13px] font-bold text-[#8B949E]">Nenhuma PPAC encontrada</p>
          <p className="text-[11px] text-[#6E7681]">Abra uma OS, adicione cotações e crie sua primeira proposta comercial.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((orc) => {
            const occ  = occsMap.get(orc.ocorrencia_id);
            const eq   = occ ? eqsMap.get(occ.equipamento_id) : null;
            const c    = cfg(orc.status);
            const diasValidade = orc.validade
              ? Math.ceil((new Date(orc.validade).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <div key={orc.id}
                className="bg-[#111827] border border-[#21262D] hover:border-[#30363D] rounded-xl p-4 transition-all">
                <div className="flex items-start gap-3">
                  {/* Badge status */}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{ background: c.bg, borderColor: c.cor + '40' }}>
                    <c.icon className="w-4 h-4" style={{ color: c.cor }} />
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[13px] font-display font-bold text-[#E6EDF3]">PPAC Nº {orc.numero}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border"
                        style={{ background: c.bg, color: c.cor, borderColor: c.cor + '40' }}>
                        {c.label}
                      </span>
                      {diasValidade !== null && diasValidade > 0 && (
                        <span className="text-[10px] text-[#D29922]">Vence em {diasValidade}d</span>
                      )}
                      {diasValidade !== null && diasValidade <= 0 && (
                        <span className="text-[10px] text-[#F85149] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Vencida
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#8B949E]">
                      {occ && (
                        <button onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                          className="flex items-center gap-1 hover:text-[#58A6FF] transition-colors">
                          <MessageSquare className="w-3 h-3" />
                          OS {(occ as any).ordem_sap || `#${(occ as any).numero}`}
                        </button>
                      )}
                      {eq && <span>{eq.tipo} · TAG {eq.patrimonio_ref || eq.tag}</span>}
                      {orc.enviado_para && <span>Para: {orc.enviado_para}</span>}
                      {orc.data_envio && <span>Enviada: {formatDate(orc.data_envio)}</span>}
                      {orc.validade && <span>Válida até: {formatDate(orc.validade)}</span>}
                    </div>

                    {/* Itens da proposta */}
                    {(orc.pecas as any[])?.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {(orc.pecas as any[]).slice(0, 3).map((p: any, i: number) => (
                          <p key={i} className="text-[10px] text-[#6E7681] truncate">
                            {i + 1}. {p.descricao} {p.quantidade > 1 ? `(${p.quantidade}x)` : ''}
                            {p.valor_unitario ? ` · R$ ${Number(p.valor_unitario * (p.quantidade || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                          </p>
                        ))}
                        {(orc.pecas as any[]).length > 3 && (
                          <p className="text-[10px] text-[#6E7681]">+{(orc.pecas as any[]).length - 3} item(ns)...</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Valor + ações */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-[15px] font-display font-bold text-[#E6EDF3]">
                      {formatCurrency(Number(orc.valor_total) || 0)}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {/* Ver detalhes */}
                      <button onClick={() => { setSelected(orc); setIsDetailOpen(true); }}
                        className="w-8 h-8 rounded-lg bg-[#21262D] border border-[#30363D] text-[#C9D1D9] hover:text-white flex items-center justify-center"
                        title="Ver / Editar proposta">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {/* Email */}
                      <button onClick={() => handleCompartilharEmail(orc)}
                        className="w-8 h-8 rounded-lg bg-[#21262D] border border-[#30363D] text-[#C9D1D9] hover:text-white flex items-center justify-center"
                        title="Enviar por e-mail">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      {/* Reenviar (só expiradas/reprovadas) */}
                      {(orc.status === 'EXPIRADO' || orc.status === 'REPROVADO') && (
                        <button onClick={() => handleReenviar(orc)}
                          className="w-8 h-8 rounded-lg bg-[#1E3A2F] border border-emerald-700/40 text-emerald-400 hover:text-emerald-300 flex items-center justify-center"
                          title="Duplicar e reenviar">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Ver OS */}
                      {occ && (
                        <button onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                          className="w-8 h-8 rounded-lg bg-[#21262D] border border-[#30363D] text-[#C9D1D9] hover:text-white flex items-center justify-center"
                          title="Ver ocorrência">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalhe */}
      <ModalOrcamentoDetalhe
        orcamento={selected}
        ocorrencia={selected ? occsMap.get(selected.ocorrencia_id) || null : null}
        equipamento={selected ? (occsMap.get(selected.ocorrencia_id) ? eqsMap.get(occsMap.get(selected.ocorrencia_id)!.equipamento_id) || null : null) : null}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdated={async () => { await loadData(); }}
        onOpenRevisao={() => {}}
      />
    </div>
  );
};
