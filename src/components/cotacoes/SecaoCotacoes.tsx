import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Trash2, ChevronDown, ChevronUp,
  FileText, CheckCircle2, Upload, X, Pencil
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DataStore } from '../../lib/dataStore';
import { CotacaoFornecedor, CotacaoItem, EmpresaParceira } from '../../types/database';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  ocorrenciaId: string;
  canEdit: boolean;
  onCriarProposta: (cotacao: CotacaoFornecedor) => void;
}

const ITEM_VAZIO: CotacaoItem = { descricao: '', quantidade: 1, valor_unitario: 0 };

export const SecaoCotacoes: React.FC<Props> = ({ ocorrenciaId, canEdit, onCriarProposta }) => {
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
    setEmpresaId(''); setEmpresaNome(''); setItens([{ ...ITEM_VAZIO }]);
    setObs(''); setPdfUrl(''); setPdfNome(''); setEditando(null); setShowForm(false);
  };

  const abrirEditar = (c: CotacaoFornecedor) => {
    setEditando(c); setEmpresaId(c.empresa_id || ''); setEmpresaNome(c.empresa_nome);
    setItens(c.itens.length > 0 ? c.itens : [{ ...ITEM_VAZIO }]);
    setObs(c.observacoes || ''); setPdfUrl(c.pdf_url || ''); setPdfNome(c.pdf_nome || '');
    setShowForm(true);
  };

  const handleEmpresaChange = (id: string) => {
    setEmpresaId(id);
    const p = parceiras.find((p) => p.id === id);
    setEmpresaNome(p?.nome || '');
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
      else { await DataStore.saveCotacao(payload); toast.success('Cotacao cadastrada'); }
      resetForm(); await load();
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta cotacao?')) return;
    await DataStore.deleteCotacao(id); toast.success('Cotacao removida'); await load();
  };

  const addItem = () => setItens([...itens, { ...ITEM_VAZIO }]);
  const removeItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof CotacaoItem, val: string) =>
    setItens(itens.map((it, idx) => idx !== i ? it : { ...it, [field]: field === 'descricao' ? val : Number(val) }));

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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">Itens</label>
              <button onClick={addItem} className="text-[11px] text-[#C9D1D9] hover:text-white flex items-center gap-1">
                <Plus className="w-3 h-3" /> Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_64px_88px_24px] gap-2 text-[9px] font-bold text-[#8B949E] uppercase px-1">
                <span>Descricao</span><span className="text-center">Qtd</span><span className="text-right">Valor Unit.</span><span />
              </div>
              {itens.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_64px_88px_24px] gap-2 items-center">
                  <input value={it.descricao} onChange={(e) => updateItem(i, 'descricao', e.target.value)}
                    placeholder="Descricao do item..."
                    className="h-9 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md px-2.5 outline-none focus:border-[#8B949E]" />
                  <input type="number" min="1" value={it.quantidade} onChange={(e) => updateItem(i, 'quantidade', e.target.value)}
                    className="h-9 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md px-2 outline-none text-center" />
                  <input type="number" min="0" step="0.01" value={it.valor_unitario} onChange={(e) => updateItem(i, 'valor_unitario', e.target.value)}
                    className="h-9 bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md px-2 outline-none text-right" />
                  <button onClick={() => removeItem(i)} disabled={itens.length === 1}
                    className="w-6 h-6 rounded text-red-400 hover:text-red-300 disabled:opacity-30 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="text-right text-[12px] font-bold text-[#E6EDF3] mt-2 pr-7">
              Total: {formatCurrency(valorTotal)}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">Observacoes</label>
            <textarea value={observacoes} onChange={(e) => setObs(e.target.value)} rows={2}
              className="w-full bg-[#161B22] border border-[#30363D] text-[#E6EDF3] text-[12px] rounded-md p-2.5 outline-none resize-none"
              placeholder="Condicoes, prazos, validade..." />
          </div>

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
          {cotacoes.map((c) => (
            <div key={c.id} className="bg-[#0A0E1A] border border-[#30363D] rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button onClick={() => setExpandido(expandido === c.id ? null : c.id)}
                  className="flex-1 flex items-center gap-2 text-left min-w-0">
                  <Building2 className="w-4 h-4 text-[#8B949E] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[#E6EDF3] truncate">{c.empresa_nome}</p>
                    <p className="text-[11px] text-[#8B949E]">{c.itens.length} {c.itens.length === 1 ? 'item' : 'itens'} · {formatCurrency(c.valor_total || 0)}</p>
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
          ))}
        </div>
      )}
    </div>
  );
};
