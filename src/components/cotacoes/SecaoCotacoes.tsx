import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Trash2, ChevronDown, ChevronUp,
  FileText, CheckCircle2, Upload, X, Pencil, PackagePlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DataStore } from '../../lib/dataStore';
import { CotacaoFornecedor, CotacaoItem, EmpresaParceira, PecaPendente, TipoItem } from '../../types/database';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  ocorrenciaId: string;
  canEdit: boolean;
  pecasOcorrencia?: PecaPendente[];
  onItensAdicionados?: () => void;
  onCriarProposta: (cotacao: CotacaoFornecedor) => void;
  onAdicionouCotacao?: () => Promise<void>; // dispara ao salvar nova cotação
}

const TIPOS: { id: TipoItem; label: string; icon: string }[] = [
  { id: 'PECA', label: 'Peça', icon: '🔧' },
  { id: 'SERVICO', label: 'Serviço', icon: '🛠️' },
  { id: 'H_EXTRA', label: 'H. Extra', icon: '⏱️' },
  { id: 'INSUMO', label: 'Insumo', icon: '🧴' },
  { id: 'FRETE', label: 'Frete', icon: '🚚' },
];

const ITEM_VAZIO: CotacaoItem = { descricao: '', detalhe: '', tipo: 'PECA', prestador: '', ncm: '', quantidade: 1, valor_unitario: 0 };

// Máscara de moeda baseada em centavos: "250000" -> "2.500,00"
const centavosParaTexto = (v: number): string =>
  v ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

export const SecaoCotacoes: React.FC<Props> = ({ ocorrenciaId, canEdit, pecasOcorrencia = [], onItensAdicionados, onCriarProposta, onAdicionouCotacao }) => {
  const [cotacoes, setCotacoes] = useState<CotacaoFornecedor[]>([]);
  const [parceiras, setParceiras] = useState<EmpresaParceira[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<CotacaoFornecedor | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [empresaId, setEmpresaId] = useState('');
  const [empresaNome, setEmpresaNome] = useState('');
  const [itens, setItens] = useState<CotacaoItem[]>([{ ...ITEM_VAZIO }]);
  // marca quais itens são novos (não vieram das Peças & Serviços) para sincronizar
  const [itensImportados, setItensImportados] = useState<Set<number>>(new Set());
  const [observacoes, setObs] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfNome, setPdfNome] = useState('');

  const load = async () => {
    const [cs, ps] = await Promise.all([
      DataStore.getCotacoesByOcorrencia(ocorrenciaId),
      DataStore.getEmpresasParceiras(),
    ]);
    setCotacoes(cs);
    setParceiras(ps);
  };

  useEffect(() => { load(); }, [ocorrenciaId]);

  const valorTotal = itens.reduce((s, it) => s + (Number(it.quantidade) * Number(it.valor_unitario)), 0);

  const resetForm = () => {
    setEmpresaId(''); setEmpresaNome(''); setItens([{ ...ITEM_VAZIO }]); setItensImportados(new Set());
    setObs(''); setPdfUrl(''); setPdfNome(''); setEditando(null); setShowForm(false);
  };

  const abrirEditar = (c: CotacaoFornecedor) => {
    setEditando(c); setEmpresaId(c.empresa_id || ''); setEmpresaNome(c.empresa_nome);
    const its = c.itens.length > 0 ? c.itens : [{ ...ITEM_VAZIO }];
    setItens(its);
    setItensImportados(new Set(its.map((_, i) => i))); // ao editar, nada é "novo"
    setObs(c.observacoes || ''); setPdfUrl(c.pdf_url || ''); setPdfNome(c.pdf_nome || '');
    setShowForm(true);
  };

  const handleEmpresaChange = (id: string) => {
    setEmpresaId(id);
    const p = parceiras.find((p) => p.id === id);
    setEmpresaNome(p?.nome || '');
  };

  // Importa os materiais já cadastrados em Peças & Serviços da OS
  const importarMateriais = () => {
    if (pecasOcorrencia.length === 0) { toast('Nenhum material em Peças & Serviços', { icon: 'ℹ️' }); return; }
    const importados: CotacaoItem[] = pecasOcorrencia.map((p) => ({
      descricao: p.descricao,
      detalhe: (p as any).especificacao || p.part_number || '',
      tipo: ((p as any).tipo_item as TipoItem) || 'PECA',
      prestador: p.fabricante || '',
      ncm: (p as any).ncm || '',
      quantidade: p.quantidade || 1,
      valor_unitario: p.valor_unitario || 0,
    }));
    const base = itens.filter((it) => it.descricao.trim());
    const novaLista = [...base, ...importados];
    setItens(novaLista);
    setItensImportados(new Set(novaLista.map((_, i) => i)));
    toast.success(`${importados.length} material(is) importado(s)`);
  };

  const updateValor = (i: number, texto: string) => {
    const raw = texto.replace(/\D/g, '');
    const valor = raw ? parseInt(raw, 10) / 100 : 0;
    setItens(itens.map((it, idx) => idx !== i ? it : { ...it, valor_unitario: valor }));
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0]; e.target.value = '';
    setUploadingPdf(true);
    try {
      const url = await DataStore.uploadCotacaoPdf(file, ocorrenciaId);
      if (url) { setPdfUrl(url); setPdfNome(file.name); toast.success('PDF enviado'); }
      else toast.error('Falha ao enviar PDF');
    } catch { toast.error('Falha ao enviar PDF'); }
    finally { setUploadingPdf(false); }
  };

  const handleSalvar = async () => {
    if (!empresaNome.trim()) { toast.error('Informe a empresa'); return; }
    if (itens.some(it => !it.descricao.trim())) { toast.error('Preencha a descricao de todos os itens'); return; }
    setSaving(true);
    try {
      const payload = {
        ocorrencia_id: ocorrenciaId, empresa_id: empresaId || undefined, empresa_nome: empresaNome.trim(),
        valor_total: valorTotal, observacoes: observacoes.trim() || undefined,
        pdf_url: pdfUrl || undefined, pdf_nome: pdfNome || undefined,
        selecionada: editando?.selecionada ?? false, itens,
      };
      if (editando) { await DataStore.updateCotacao(editando.id, payload); toast.success('Cotacao atualizada'); }
      else {
        await DataStore.saveCotacao(payload);
        // Dispara callback pra marcar Orçamento Interno automaticamente
        await onAdicionouCotacao?.();
        // Sincroniza: itens NOVOS (não importados) viram Peças & Serviços na OS
        const novos = itens.filter((_, i) => !itensImportados.has(i) && itens[i].descricao.trim());
        if (novos.length > 0) {
          for (const it of novos) {
            await DataStore.savePeca({
              ocorrencia_id: ocorrenciaId,
              descricao: it.descricao,
              especificacao: it.detalhe,
              fabricante: it.prestador,
              ncm: it.ncm,
              tipo_item: it.tipo || 'PECA',
              quantidade: it.quantidade,
              valor_unitario: it.valor_unitario,
              status: 'SOLICITADA',
            } as any);
          }
          onItensAdicionados?.();
          toast.success(`Cotacao salva · ${novos.length} item(ns) adicionado(s) em Peças & Serviços`);
        } else {
          toast.success('Cotacao cadastrada');
        }
      }
      resetForm(); await load();
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta cotacao?')) return;
    await DataStore.deleteCotacao(id); toast.success('Cotacao removida'); await load();
  };

  const addItem = () => setItens([...itens, { ...ITEM_VAZIO }]);
  const removeItem = (i: number) => {
    const restantes = itens.filter((_, idx) => idx !== i);
    setItens(restantes.length > 0 ? restantes : [{ ...ITEM_VAZIO }]);
    setItensImportados((prev) => {
      const n = new Set<number>();
      Array.from(prev).forEach((idx: number) => { if (idx < i) n.add(idx); else if (idx > i) n.add(idx - 1); });
      return n;
    });
  };
  const updateItem = (i: number, field: keyof CotacaoItem, val: string | number) =>
    setItens(itens.map((it, idx) => idx !== i ? it : { ...it, [field]: val }));

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <h3 className="card-title text-xs uppercase">Cotacoes de Fornecedores ({cotacoes.length})</h3>
        </div>
        {canEdit && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#21262D] border border-[#30363D] text-[#C9D1D9] text-[11px] font-semibold hover:text-white">
            <Plus className="w-3.5 h-3.5" /> Adicionar Cotacao
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-[#0A0E1A] border border-[#30363D] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-[#E6EDF3] uppercase tracking-wide">
              {editando ? 'Editar Cotacao' : 'Nova Cotacao'}
            </p>
            <button onClick={resetForm}><X className="w-4 h-4 text-[#8B949E] hover:text-white" /></button>
          </div>

          {/* Empresa */}
          <div>
            <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">Empresa Fornecedora</label>
            <select value={empresaId} onChange={(e) => handleEmpresaChange(e.target.value)}
              className="w-full h-10 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md px-2.5 outline-none mb-1">
              <option value="">Selecione uma empresa parceira...</option>
              {parceiras.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            {!empresaId && (
              <input value={empresaNome} onChange={(e) => setEmpresaNome(e.target.value)}
                placeholder="Ou digite o nome da empresa"
                className="w-full h-10 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md px-2.5 outline-none" />
            )}
          </div>

          {/* Itens — cada item em bloco próprio (organizado) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">Itens da Cotacao</label>
              <div className="flex items-center gap-2">
                {!editando && pecasOcorrencia.length > 0 && (
                  <button onClick={importarMateriais}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#1E3A2F] border border-emerald-600/40 text-emerald-400 text-[11px] font-semibold hover:text-emerald-300">
                    <PackagePlus className="w-3.5 h-3.5" /> Importar materiais da ocorrência ({pecasOcorrencia.length})
                  </button>
                )}
                <button onClick={addItem} className="text-[11px] text-[#C9D1D9] hover:text-white flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Item
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {itens.map((it, i) => {
                const isServico = it.tipo === 'SERVICO' || it.tipo === 'H_EXTRA';
                return (
                <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    {/* Tipo de item — botões compactos */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {TIPOS.map((t) => (
                        <button key={t.id} onClick={() => updateItem(i, 'tipo', t.id)}
                          className={`px-1.5 h-6 rounded text-[10px] font-semibold border transition-colors ${
                            it.tipo === t.id ? 'bg-[#21262D] text-[#E6EDF3] border-[#8B949E]' : 'bg-[#0A0E1A] text-[#8B949E] border-[#30363D]'
                          }`}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-[#6E7681]">{itensImportados.has(i) && <span className="text-emerald-400">da OS</span>}</span>
                      <button onClick={() => removeItem(i)}
                        className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <input value={it.descricao} onChange={(e) => updateItem(i, 'descricao', e.target.value)}
                    placeholder={isServico ? 'Descrição do serviço' : 'Nome / descrição do item'}
                    className="w-full h-8 bg-[#0A0E1A] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded px-2.5 outline-none focus:border-[#8B949E]" />

                  <input value={it.detalhe || ''} onChange={(e) => updateItem(i, 'detalhe', e.target.value)}
                    placeholder="Detalhes / especificação / dados técnicos, código SAP..."
                    className="w-full h-8 bg-[#0A0E1A] border border-[#30363D] text-[#C9D1D9] text-[11px] rounded px-2.5 outline-none focus:border-[#8B949E]" />

                  <div className="grid grid-cols-[1fr_52px_90px] gap-1.5">
                    <input value={it.prestador || ''} onChange={(e) => updateItem(i, 'prestador', e.target.value)}
                      placeholder={isServico ? 'Prestador / técnico' : 'Fabricante'}
                      className="h-8 bg-[#0A0E1A] border border-[#30363D] text-[#E6EDF3] text-[11px] rounded px-2 outline-none focus:border-[#8B949E] min-w-0" />
                    <input type="text" inputMode="numeric" value={it.quantidade || ''}
                      onChange={(e) => updateItem(i, 'quantidade', Number(e.target.value.replace(/\D/g, '')) || 1)}
                      placeholder="Qtd"
                      className="h-8 bg-[#0A0E1A] border border-[#30363D] text-[#E6EDF3] text-[11px] rounded px-1 outline-none text-center focus:border-[#8B949E]" />
                    <input type="text" inputMode="numeric" value={centavosParaTexto(it.valor_unitario)}
                      onChange={(e) => updateValor(i, e.target.value)} placeholder="R$ 0,00"
                      className="h-8 bg-[#0A0E1A] border border-[#30363D] text-[#E6EDF3] text-[11px] rounded px-2 outline-none text-right font-mono focus:border-[#8B949E] min-w-0" />
                  </div>

                  {!isServico && (
                    <input value={it.ncm || ''} onChange={(e) => updateItem(i, 'ncm', e.target.value)}
                      placeholder="NCM (ex: 8415.10.11)"
                      className="w-full h-8 bg-[#0A0E1A] border border-[#30363D] text-[#C9D1D9] text-[11px] rounded px-2.5 outline-none font-mono focus:border-[#8B949E]" />
                  )}

                  <div className="text-right text-[10px] text-[#8B949E]">
                    Subtotal: <strong className="text-[#E6EDF3]">{formatCurrency(Number(it.quantidade) * Number(it.valor_unitario))}</strong>
                  </div>
                </div>
                );
              })}
            </div>

            <div className="text-right text-[13px] font-bold text-[#E6EDF3] mt-2.5 border-t border-[#30363D] pt-2">
              Total da Cotação: {formatCurrency(valorTotal)}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">Observacoes</label>
            <textarea value={observacoes} onChange={(e) => setObs(e.target.value)} rows={2}
              className="w-full bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md p-2.5 outline-none resize-none"
              placeholder="Condicoes, prazos, validade..." />
          </div>

          {/* Anexo PDF */}
          <div>
            <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">Anexo PDF</label>
            {pdfUrl ? (
              <div className="flex items-center gap-2 p-2.5 bg-[#161B22] border border-[#30363D] rounded-md">
                <FileText className="w-4 h-4 text-[#C9D1D9] shrink-0" />
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-[12px] text-[#C9D1D9] hover:text-white truncate flex-1">{pdfNome || 'PDF'}</a>
                <button onClick={() => { setPdfUrl(''); setPdfNome(''); }}><X className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 h-10 px-3 rounded-md bg-[#161B22] border border-[#30363D] text-[#8B949E] text-[12px] ${uploadingPdf ? 'opacity-60 pointer-events-none' : 'cursor-pointer hover:text-white'}`}>
                <Upload className="w-4 h-4 shrink-0" />
                <span>{uploadingPdf ? 'Enviando...' : 'Anexar PDF da cotacao'}</span>
                <input type="file" accept="application/pdf" onChange={handleUploadPdf} className="hidden" disabled={uploadingPdf} />
              </label>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={resetForm} className="flex-1 h-10 rounded-md bg-[#161B22] border border-[#30363D] text-[#C9D1D9] text-[12px] font-semibold">Cancelar</button>
            <button onClick={handleSalvar} disabled={saving} className="flex-1 h-10 rounded-md btn-primary-gradient text-[12px] font-bold disabled:opacity-60">
              {saving ? 'Salvando...' : editando ? 'Atualizar' : 'Salvar Cotacao'}
            </button>
          </div>
        </div>
      )}

      {cotacoes.length === 0 && !showForm ? (
        <p className="text-[11px] text-[#8B949E] italic py-2">
          Nenhuma cotacao cadastrada. Adicione cotacoes de fornecedores antes de criar a proposta comercial.
        </p>
      ) : (
        <div className="space-y-2">
          {(() => {
            // Ranking por preço: menor = verde, meio = laranja, maior = vermelho
            const sorted = [...cotacoes].sort((a, b) => (a.valor_total || 0) - (b.valor_total || 0));
            const rankColor = (id: string) => {
              const idx = sorted.findIndex((c) => c.id === id);
              const total = sorted.length;
              if (total === 1) return 'text-[#3FB950]';
              if (idx === 0) return 'text-[#3FB950]';                      // menor → verde
              if (idx === total - 1) return 'text-[#F85149]';              // maior → vermelho
              return 'text-[#F5A623]';                                      // meio → laranja
            };
            return cotacoes.map((c) => (
            <div key={c.id} className="bg-[#0A0E1A] border border-[#30363D] rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button onClick={() => setExpandido(expandido === c.id ? null : c.id)}
                  className="flex-1 flex items-center gap-2 text-left min-w-0">
                  <Building2 className="w-4 h-4 text-[#8B949E] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[#E6EDF3] truncate">{c.empresa_nome}</p>
                    <p className="text-[11px] text-[#8B949E]">{c.itens.length} {c.itens.length === 1 ? 'item' : 'itens'} · <span className={`font-bold ${rankColor(c.id)}`}>{formatCurrency(c.valor_total || 0)}</span></p>
                  </div>
                  {expandido === c.id ? <ChevronUp className="w-4 h-4 text-[#8B949E] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#8B949E] shrink-0" />}
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  {c.pdf_url && (
                    <a href={c.pdf_url} target="_blank" rel="noreferrer"
                      className="w-7 h-7 rounded-md bg-[#21262D] border border-[#30363D] text-[#C9D1D9] hover:text-white flex items-center justify-center" title="Ver PDF">
                      <FileText className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {canEdit && (
                    <>
                      <button onClick={() => abrirEditar(c)} className="w-7 h-7 rounded-md bg-[#21262D] border border-[#30363D] text-[#C9D1D9] hover:text-white flex items-center justify-center">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="w-7 h-7 rounded-md bg-[#21262D] border border-[#30363D] text-red-400 hover:text-red-300 flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onCriarProposta(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md btn-primary-gradient text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Criar Proposta
                      </button>
                    </>
                  )}
                </div>
              </div>
              {expandido === c.id && (
                <div className="border-t border-[#30363D] px-3 py-3 space-y-2.5">
                  <div>
                    <p className="text-[9px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5">Itens</p>
                    <div className="space-y-1">
                      {c.itens.map((it, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                          <span className="text-[#E6EDF3]">{it.descricao}</span>
                          <span className="text-[#8B949E] font-mono shrink-0">
                            {it.quantidade}x {formatCurrency(it.valor_unitario)} = <strong className="text-[#E6EDF3]">{formatCurrency(it.quantidade * it.valor_unitario)}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-right text-[12px] font-bold text-[#E6EDF3] mt-1.5 border-t border-[#30363D] pt-1.5">
                      Total: {formatCurrency(c.valor_total || 0)}
                    </div>
                  </div>
                  {c.observacoes && (
                    <div>
                      <p className="text-[9px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">Observacoes</p>
                      <p className="text-[11px] text-[#C9D1D9]">{c.observacoes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ));
          })()}
        </div>
      )}
    </div>
  );
};
