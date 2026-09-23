import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Building2,
  Layers,
  Database,
  Plus,
  Shield,
  CheckCircle2,
  Edit2,
  Trash2,
  Phone,
  Mail,
  UserPlus,
  Search,
  Filter,
  Lock,
  Briefcase,
  X,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import { Profile, UG, Area, Linha, CentroTrabalho, EmpresaParceira } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { getRoleBadge } from '../utils/formatters';
import { UgModal } from '../components/cadastros/UgModal';
import { AreaModal } from '../components/cadastros/AreaModal';
import { LinhaModal } from '../components/cadastros/LinhaModal';
import { ColaboradorModal } from '../components/cadastros/ColaboradorModal';
import { ConfirmDeleteModal } from '../components/cadastros/ConfirmDeleteModal';

export const Cadastros: React.FC = () => {
  const { refreshProfiles, canAdmin } = useAuth();

  // Estados de empresas parceiras
  const [parceiras, setParceiras] = useState<EmpresaParceira[]>([]);
  const [showFormParceira, setShowFormParceira] = useState(false);
  const [editParceira, setEditParceira] = useState<EmpresaParceira | null>(null);
  const [parceiraForm, setParceiraForm] = useState({ nome: '', cnpj: '', contato: '', email: '', telefone: '' });
  const [savingParceira, setSavingParceira] = useState(false);

  const loadParceiras = async () => {
    const ps = await DataStore.getEmpresasParceiras();
    setParceiras(ps);
  };

  const abrirNovaParceira = () => {
    setEditParceira(null);
    setParceiraForm({ nome: '', cnpj: '', contato: '', email: '', telefone: '' });
    setShowFormParceira(true);
  };

  const abrirEditarParceira = (p: EmpresaParceira) => {
    setEditParceira(p);
    setParceiraForm({ nome: p.nome, cnpj: p.cnpj || '', contato: p.contato || '', email: p.email || '', telefone: p.telefone || '' });
    setShowFormParceira(true);
  };

  const salvarParceira = async () => {
    if (!parceiraForm.nome.trim()) return;
    setSavingParceira(true);
    try {
      if (editParceira) {
        await DataStore.updateCotacao?.(editParceira.id, parceiraForm as any);
        // Usa Supabase direto para update de parceiras
        const { supabase } = await import('../lib/supabase');
        await supabase.from('empresas_parceiras').update({ ...parceiraForm, updated_at: new Date().toISOString() }).eq('id', editParceira.id);
      } else {
        await DataStore.saveEmpresaParceira({ ...parceiraForm, ativo: true });
      }
      setShowFormParceira(false);
      await loadParceiras();
    } catch (e) { console.error(e); }
    finally { setSavingParceira(false); }
  };

  const deletarParceira = async (id: string) => {
    if (!confirm('Desativar esta empresa parceira?')) return;
    await DataStore.deleteEmpresaParceira(id);
    await loadParceiras();
  };
  const [activeTab, setActiveTab] = useState<'ugs' | 'estrutura' | 'equipe' | 'parceiras'>('ugs');

  const [hierarchy, setHierarchy] = useState<{
    ugs: UG[];
    areas: Area[];
    linhas: Linha[];
    centros_trabalho: CentroTrabalho[];
  }>({ ugs: [], areas: [], linhas: [], centros_trabalho: [] });

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [, setLoading] = useState(true);

  // Filters & Search
  const [searchEquipe, setSearchEquipe] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('TODOS');
  const [filterUgEstrutura, setFilterUgEstrutura] = useState<string>('TODAS');
  const [searchEstrutura, setSearchEstrutura] = useState('');

  // Modals state
  const [isUgModalOpen, setIsUgModalOpen] = useState(false);
  const [ugToEdit, setUgToEdit] = useState<UG | null>(null);

  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState<Area | null>(null);

  const [isLinhaModalOpen, setIsLinhaModalOpen] = useState(false);
  const [linhaToEdit, setLinhaToEdit] = useState<Linha | null>(null);

  const [isColabModalOpen, setIsColabModalOpen] = useState(false);
  const [colabToEdit, setColabToEdit] = useState<Profile | null>(null);

  // Deletion Modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'UG' | 'AREA' | 'LINHA';
    id: string;
    name: string;
    errorMessage: string | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    type: 'UG',
    id: '',
    name: '',
    errorMessage: null,
    isDeleting: false,
  });

  const loadData = async () => {
    try {
      const [h, p] = await Promise.all([
        DataStore.getHierarchy(),
        DataStore.getProfiles(),
      ]);
      setHierarchy(h);
      setProfiles(p);
      setLoading(false);
    } catch (e) {
      console.error('Error loading cadastros:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadParceiras();
  }, []);

  // Sorted UGs by ordem or codigo
  const sortedUgs = useMemo(() => {
    return [...hierarchy.ugs].sort((a, b) => {
      const orderA = a.ordem !== undefined ? a.ordem : 99;
      const orderB = b.ordem !== undefined ? b.ordem : 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.codigo.localeCompare(b.codigo);
    });
  }, [hierarchy.ugs]);

  // Counts

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        p.nome.toLowerCase().includes(searchEquipe.toLowerCase()) ||
        p.email.toLowerCase().includes(searchEquipe.toLowerCase()) ||
        (p.cargo && p.cargo.toLowerCase().includes(searchEquipe.toLowerCase())) ||
        p.empresa.toLowerCase().includes(searchEquipe.toLowerCase());
      const matchRole = roleFilter === 'TODOS' || p.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [profiles, searchEquipe, roleFilter]);

  // Filtered areas
  const filteredAreas = useMemo(() => {
    return hierarchy.areas.filter((a) => {
      const matchUg = filterUgEstrutura === 'TODAS' || a.ug_id === filterUgEstrutura;
      const matchSearch =
        a.nome.toLowerCase().includes(searchEstrutura.toLowerCase()) ||
        (a.codigo && a.codigo.toLowerCase().includes(searchEstrutura.toLowerCase()));
      return matchUg && matchSearch;
    });
  }, [hierarchy.areas, filterUgEstrutura, searchEstrutura]);

  // Filtered linhas
  const filteredLinhas = useMemo(() => {
    return hierarchy.linhas.filter((l) => {
      const parentArea = hierarchy.areas.find((a) => a.id === l.area_id);
      const matchUg = filterUgEstrutura === 'TODAS' || (parentArea && parentArea.ug_id === filterUgEstrutura);
      const matchSearch =
        l.nome.toLowerCase().includes(searchEstrutura.toLowerCase()) ||
        (l.codigo && l.codigo.toLowerCase().includes(searchEstrutura.toLowerCase())) ||
        (l.codigo_sap && l.codigo_sap.toLowerCase().includes(searchEstrutura.toLowerCase()));
      return matchUg && matchSearch;
    });
  }, [hierarchy.linhas, hierarchy.areas, filterUgEstrutura, searchEstrutura]);

  // Handlers for UG
  const handleOpenNewUg = () => {
    setUgToEdit(null);
    setIsUgModalOpen(true);
  };

  const handleEditUg = (ug: UG) => {
    setUgToEdit(ug);
    setIsUgModalOpen(true);
  };

  const handleDeleteUgClick = (ug: UG) => {
    const linkedAreas = hierarchy.areas.filter((a) => a.ug_id === ug.id);
    let errorMessage = null;
    if (linkedAreas.length > 0) {
      errorMessage = `Esta UG possui ${linkedAreas.length} área${linkedAreas.length > 1 ? 's' : ''} cadastrada${linkedAreas.length > 1 ? 's' : ''}. Remova-as primeiro.`;
    }
    setDeleteModal({
      isOpen: true,
      type: 'UG',
      id: ug.id,
      name: `${ug.codigo} — ${ug.nome}`,
      errorMessage,
      isDeleting: false,
    });
  };

  // Handlers for Area
  const handleOpenNewArea = () => {
    setAreaToEdit(null);
    setIsAreaModalOpen(true);
  };

  const handleEditArea = (area: Area) => {
    setAreaToEdit(area);
    setIsAreaModalOpen(true);
  };

  const handleDeleteAreaClick = (area: Area) => {
    const linkedLinhas = hierarchy.linhas.filter((l) => l.area_id === area.id);
    let errorMessage = null;
    if (linkedLinhas.length > 0) {
      errorMessage = `Esta área possui ${linkedLinhas.length} linha${linkedLinhas.length > 1 ? 's' : ''} cadastrada${linkedLinhas.length > 1 ? 's' : ''}. Remova-as primeiro.`;
    }
    setDeleteModal({
      isOpen: true,
      type: 'AREA',
      id: area.id,
      name: area.nome,
      errorMessage,
      isDeleting: false,
    });
  };

  // Handlers for Linha
  const handleOpenNewLine = () => {
    setLinhaToEdit(null);
    setIsLinhaModalOpen(true);
  };

  const handleEditLinha = (linha: Linha) => {
    setLinhaToEdit(linha);
    setIsLinhaModalOpen(true);
  };

  const handleDeleteLinhaClick = (linha: Linha) => {
    const linkedCentros = hierarchy.centros_trabalho.filter((c) => c.linha_id === linha.id);
    let errorMessage = null;
    if (linkedCentros.length > 0) {
      errorMessage = `Esta linha possui ${linkedCentros.length} centro${linkedCentros.length > 1 ? 's' : ''} de trabalho vinculado${linkedCentros.length > 1 ? 's' : ''}. Remova-os primeiro.`;
    }
    setDeleteModal({
      isOpen: true,
      type: 'LINHA',
      id: linha.id,
      name: linha.nome,
      errorMessage,
      isDeleting: false,
    });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      if (deleteModal.type === 'UG') {
        const res = await DataStore.deleteUG(deleteModal.id);
        if (!res.success) {
          setDeleteModal((prev) => ({ ...prev, errorMessage: res.error || 'Erro ao excluir UG', isDeleting: false }));
          return;
        }
      } else if (deleteModal.type === 'AREA') {
        const res = await DataStore.deleteArea(deleteModal.id);
        if (!res.success) {
          setDeleteModal((prev) => ({ ...prev, errorMessage: res.error || 'Erro ao excluir Área', isDeleting: false }));
          return;
        }
      } else if (deleteModal.type === 'LINHA') {
        const res = await DataStore.deleteLinha(deleteModal.id);
        if (!res.success) {
          setDeleteModal((prev) => ({ ...prev, errorMessage: res.error || 'Erro ao excluir Linha', isDeleting: false }));
          return;
        }
      }

      setDeleteModal((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
      await loadData();
    } catch (err: any) {
      setDeleteModal((prev) => ({
        ...prev,
        errorMessage: err.message || 'Erro durante a exclusão',
        isDeleting: false,
      }));
    }
  };

  // Handlers for Colaborador
  const handleOpenNewColab = () => {
    setColabToEdit(null);
    setIsColabModalOpen(true);
  };

  const handleEditColab = (p: Profile) => {
    setColabToEdit(p);
    setIsColabModalOpen(true);
  };

  const handleToggleColabActive = async (p: Profile) => {
    try {
      const nextActive = p.ativo === false ? true : false;
      await DataStore.toggleProfileActive(p.id, nextActive);
      await loadData();
      await refreshProfiles();
    } catch (e) {
      console.error('Error toggling profile active:', e);
    }
  };

  const handleDeleteColab = async (p: Profile) => {
    const ok = window.confirm(`Excluir permanentemente o colaborador "${p.nome}"?\n\nEsta ação não pode ser desfeita.`);
    if (!ok) return;
    try {
      await DataStore.deleteProfile(p.id);
      setProfiles((prev) => prev.filter((x) => x.id !== p.id));
      await refreshProfiles();
    } catch (e) {
      console.error('Error deleting profile:', e);
    }
  };

  // Mapper for Levantamento
  const mapLevantamento = (item: any, index: number) => ({
    item: item.item_num || index + 1,
    ug: item.localizacao?.split('/')?.[0]?.trim() || item.localizacao_legada?.split('/')?.[0]?.trim() || item.ug || '—',
    area: item.area || item.localizacao || item.localizacao_legada || item.area_linha || '—',
    tag: item.tag_antiga ? `TAG ${item.tag_antiga}` : (item.tag_legada || (item.tag ? `TAG ${item.tag}` : (item.patrimonio || '—'))),
    status_ok: Boolean(item.status_ok),
    observacoes: [item.tipo_equipamento, item.marca, item.modelo].filter(Boolean).join(' · ') || item.observacao_campo || item.descricao || item.problema_identificado || '—',
    conciliado: Boolean(item.conciliado)
  });


  return (
    <div className="flex flex-col h-screen p-3 md:px-4 md:py-3 gap-2 overflow-hidden box-border bg-[#0B0F14]">
      {/* Header fixo */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-500/10 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px]  tracking-widest  bg-[#F5A623]/10 px-1.5 py-0.5 rounded border border-[#F5A623]/30 uppercase font-bold">
              Administração do Contrato
            </span>
            <span className="text-[10px]  ">•</span>
            <span className="text-[10px]  ">VISION CONTROLS AMBEV</span>
          </div>
          <h2 className="text-xl font-condensed font-bold  tracking-wide uppercase leading-tight">
            Cadastros Gerais, UGs & Equipe
          </h2>
        </div>

        {!canAdmin && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F8F9FA] border border-blue-500/15 rounded text-[11px]  ">
            <Lock className="w-3.5 h-3.5 " />
            <span>Modo Leitura — Apenas ADMIN e GESTOR podem alterar cadastros</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation fixas */}
      <div className="w-full flex items-center overflow-x-auto overflow-y-hidden border-b border-blue-500/15 gap-0 shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          id="tab-cadastros-ugs"
          onClick={() => setActiveTab('ugs')}
          className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2.5 text-[11px] font-semibold tracking-wider uppercase cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'ugs'
              ? 'border-[#EF4444]  bg-white/[0.02]'
              : 'border-transparent  hover:'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>UGs (Unidades Gerenciais)</span>
          <span className="text-[10px]  px-1.5 py-0.2 rounded bg-gray-100 ">
            {hierarchy.ugs.length}
          </span>
        </button>

        <button
          id="tab-cadastros-estrutura"
          onClick={() => setActiveTab('estrutura')}
          className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2.5 text-[11px] font-semibold tracking-wider uppercase cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'estrutura'
              ? 'border-[#EF4444]  bg-white/[0.02]'
              : 'border-transparent  hover:'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Estrutura Fabril (Áreas & Linhas)</span>
          <span className="text-[10px]  px-1.5 py-0.2 rounded bg-gray-100 ">
            {hierarchy.areas.length + hierarchy.linhas.length}
          </span>
        </button>

        <button
          id="tab-cadastros-equipe"
          onClick={() => setActiveTab('equipe')}
          className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2.5 text-[11px] font-semibold tracking-wider uppercase cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'equipe'
              ? 'border-[#EF4444]  bg-white/[0.02]'
              : 'border-transparent  hover:'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Equipe Vision & Acessos</span>
          <span className="text-[10px]  px-1.5 py-0.2 rounded bg-gray-100 ">
            {profiles.length}
          </span>
        </button>
        <button
          id="tab-cadastros-parceiras"
          onClick={() => setActiveTab('parceiras')}
          className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2.5 text-[11px] font-semibold tracking-wider uppercase cursor-pointer border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'parceiras'
              ? 'border-[#EF4444] bg-white/[0.02]'
              : 'border-transparent hover:'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Empresas Parceiras</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100">
            {parceiras.length}
          </span>
        </button>


      </div>

      {/* TAB 1: UGs */}
      {activeTab === 'ugs' && (
        <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F8F9FA] p-3 rounded-lg border border-blue-500/15">
            <div>
              <h3 className="text-sm font-condensed font-bold  uppercase tracking-wide">
                Unidades Gerenciais da Fábrica AMBEV RJ
              </h3>
              <p className="text-[11px]  mt-0.5">
                Macro-divisões fabris utilizadas nos filtros de equipamentos, ocorrências e indicadores de disponibilidade.
              </p>
            </div>
            {canAdmin && (
              <button
                id="btn-nova-ug"
                onClick={handleOpenNewUg}
                className="px-3 py-1.5 bg-[#F5A623] hover:bg-[#FFB84D] text-black  font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova UG</span>
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortedUgs.map((ug) => {
                const areasLinked = hierarchy.areas.filter((a) => a.ug_id === ug.id);
                const areasCount = areasLinked.length;

                return (
                  <div
                    key={ug.id}
                    id={`card-ug-${ug.id}`}
                    className="bg-[#F8F9FA] border border-blue-500/15 hover:border-blue-500/40 rounded-lg p-3.5 flex flex-col justify-between transition-colors relative"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded bg-[#F5A623]/15 border border-[#F5A623]/40   font-black text-xs flex items-center justify-center shrink-0">
                            {ug.codigo}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold  font-condensed tracking-wide uppercase leading-snug">
                              {ug.nome}
                            </h4>
                            <span className="text-[10px]  ">
                              Ordem de Exibição: {ug.ordem ?? '-'}
                            </span>
                          </div>
                        </div>

                        {canAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              id={`btn-edit-ug-${ug.id}`}
                              onClick={() => handleEditUg(ug)}
                              title="Editar UG"
                              className="p-1.5  hover:text-cyan-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-ug-${ug.id}`}
                              onClick={() => handleDeleteUgClick(ug)}
                              title="Excluir UG"
                              className="p-1.5  hover:text-red-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {ug.descricao && (
                        <p className="text-xs  bg-gray-50 p-2.5 rounded border border-white/5">
                          {ug.descricao}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-blue-500/10 flex items-center justify-between text-xs">
                      <span className="text-[11px]  ">
                        <strong className="text-cyan-400">{areasCount}</strong> {areasCount === 1 ? 'área vinculada' : 'áreas vinculadas'}
                      </span>
                      <span className="text-[10px]  ">ID: {ug.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ESTRUTURA FABRIL (Áreas e Linhas) */}
      {activeTab === 'estrutura' && (
        <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
          {/* Controls / Filter fixos */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-2 bg-[#F8F9FA] p-2.5 rounded-lg border border-blue-500/15 justify-between items-stretch sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-search-estrutura"
                  type="text"
                  placeholder="Buscar área, linha ou código SAP..."
                  value={searchEstrutura}
                  onChange={(e) => setSearchEstrutura(e.target.value)}
                  className="w-full has-icon-left-sm pr-3 py-1 text-xs bg-gray-100 border border-blue-500/20  rounded outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-1 bg-gray-100 border border-blue-500/20 px-2 py-1 rounded">
                <Filter className="w-3.5 h-3.5 " />
                <span className="text-[10px]  ">UG:</span>
                <select
                  id="select-filter-ug-estrutura"
                  value={filterUgEstrutura}
                  onChange={(e) => setFilterUgEstrutura(e.target.value)}
                  className="bg-transparent text-xs   outline-none cursor-pointer"
                >
                  <option value="TODAS" className="bg-[#F8F9FA] ">TODAS AS UGs</option>
                  {hierarchy.ugs.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#F8F9FA] ">
                      {u.codigo} — {u.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {canAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-nova-area"
                  onClick={handleOpenNewArea}
                  className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black  font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nova Área</span>
                </button>
                <button
                  id="btn-nova-linha"
                  onClick={handleOpenNewLine}
                  className="px-2.5 py-1 bg-[#F5A623] hover:bg-[#FFB84D] text-black  font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nova Linha</span>
                </button>
              </div>
            )}
          </div>

          {/* Tabelas de Estrutura Fabril com scroll interno */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] space-y-3 pr-1">
            {/* Section: Áreas Fabris */}
            <div className="bg-[#F8F9FA] border border-blue-500/15 rounded-lg overflow-hidden shadow-md">
              <div className="p-2.5 bg-[#1a2235] border-b border-blue-500/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <h3 className="text-xs font-condensed font-bold uppercase tracking-wider ">
                    Áreas Fabris ({filteredAreas.length})
                  </h3>
                </div>
                <span className="text-[10px]  ">Setores Físicos Cadastrados</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-blue-500/15   text-[10px] uppercase">
                      <th className="py-2 px-3">UG Pertencente</th>
                      <th className="py-2 px-3">Sigla / Código</th>
                      <th className="py-2 px-3">Nome da Área</th>
                      <th className="py-2 px-3 text-center">Linhas Vinculadas</th>
                      {canAdmin && <th className="py-2 px-3 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] ">
                    {filteredAreas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-3 px-4 text-center text-xs ">
                          Nenhuma área fabril encontrada para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredAreas.map((area) => {
                        const parentUg = hierarchy.ugs.find((u) => u.id === area.ug_id);
                        const linhasInArea = hierarchy.linhas.filter((l) => l.area_id === area.id);

                        return (
                          <tr key={area.id} id={`row-area-${area.id}`} className="hover:bg-blue-500/[0.05] transition-colors">
                            <td className="py-2 px-3 ">
                              {parentUg ? (
                                <span className="px-1.5 py-0.5 bg-[#F5A623]/10  border border-[#F5A623]/30 rounded font-bold text-[11px]">
                                  {parentUg.codigo}
                                </span>
                              ) : (
                                <span className="">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3  text-cyan-400 font-semibold">
                              {area.codigo || '—'}
                            </td>
                            <td className="py-2 px-3 font-medium ">
                              {area.nome}
                            </td>
                            <td className="py-2 px-3 text-center ">
                              <span className="px-1.5 py-0.5 bg-gray-100 border border-blue-500/20 rounded ">
                                {linhasInArea.length}
                              </span>
                            </td>
                            {canAdmin && (
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    id={`btn-edit-area-${area.id}`}
                                    onClick={() => handleEditArea(area)}
                                    title="Editar Área"
                                    className="p-1  hover:text-cyan-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    id={`btn-delete-area-${area.id}`}
                                    onClick={() => handleDeleteAreaClick(area)}
                                    title="Excluir Área"
                                    className="p-1  hover:text-red-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Linhas de Produção */}
            <div className="bg-[#F8F9FA] border border-blue-500/15 rounded-lg overflow-hidden shadow-md">
              <div className="p-2.5 bg-[#1a2235] border-b border-blue-500/15 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 " />
                  <h3 className="text-xs font-condensed font-bold uppercase tracking-wider ">
                    Linhas de Produção & Envase ({filteredLinhas.length})
                  </h3>
                </div>
                <span className="text-[10px]  ">Mapeamento e Códigos SAP</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-blue-500/15   text-[10px] uppercase">
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Nome da Linha</th>
                      <th className="py-2 px-3">Área / UG</th>
                      <th className="py-2 px-3">Código SAP</th>
                      <th className="py-2 px-3 text-center">Centros de Trabalho</th>
                      {canAdmin && <th className="py-2 px-3 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] ">
                    {filteredLinhas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-3 px-4 text-center text-xs ">
                          Nenhuma linha de produção encontrada.
                        </td>
                      </tr>
                    ) : (
                      filteredLinhas.map((linha) => {
                        const parentArea = hierarchy.areas.find((a) => a.id === linha.area_id);
                        const parentUg = parentArea ? hierarchy.ugs.find((u) => u.id === parentArea.ug_id) : null;
                        const centros = hierarchy.centros_trabalho.filter((c) => c.linha_id === linha.id);

                        return (
                          <tr key={linha.id} id={`row-linha-${linha.id}`} className="hover:bg-blue-500/[0.05] transition-colors">
                            <td className="py-2 px-3  font-bold ">
                              {linha.codigo || '—'}
                            </td>
                            <td className="py-2 px-3 font-semibold ">
                              {linha.nome}
                            </td>
                            <td className="py-2 px-3 text-xs ">
                              {parentArea ? (
                                <span>
                                  {parentUg && <strong className=" ">[{parentUg.codigo}] </strong>}
                                  {parentArea.nome}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2 px-3  text-cyan-400">
                              {linha.codigo_sap || '—'}
                            </td>
                            <td className="py-2 px-3 text-center ">
                              <span className="px-1.5 py-0.5 bg-gray-100 border border-blue-500/20 rounded ">
                                {centros.length}
                              </span>
                            </td>
                            {canAdmin && (
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    id={`btn-edit-linha-${linha.id}`}
                                    onClick={() => handleEditLinha(linha)}
                                    title="Editar Linha"
                                    className="p-1  hover: hover:bg-white/5 rounded transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    id={`btn-delete-linha-${linha.id}`}
                                    onClick={() => handleDeleteLinhaClick(linha)}
                                    title="Excluir Linha"
                                    className="p-1  hover:text-red-400 hover:bg-white/5 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EQUIPE VISION */}
      {activeTab === 'equipe' && (
        <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
          {/* Controls fixos */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-2 bg-[#F8F9FA] p-2.5 rounded-lg border border-blue-500/15 justify-between items-stretch sm:items-center">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:min-w-[240px] sm:w-auto">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-search-equipe"
                  type="text"
                  placeholder="Buscar por nome, cargo ou e-mail..."
                  value={searchEquipe}
                  onChange={(e) => setSearchEquipe(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 sm:py-1 text-xs bg-gray-100 border border-blue-500/20 rounded outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-1 bg-gray-100 border border-blue-500/20 px-2 py-2 sm:py-1 rounded w-full sm:w-auto">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] shrink-0">Função:</span>
                <select
                  id="select-filter-role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-xs outline-none cursor-pointer flex-1"
                >
                  <option value="TODOS" className="bg-[#F8F9FA] ">TODAS AS FUNÇÕES</option>
                  <option value="ADMIN" className="bg-[#F8F9FA] ">ADMIN</option>
                  <option value="GESTOR" className="bg-[#F8F9FA] ">GESTOR</option>
                  <option value="ENCARREGADO" className="bg-[#F8F9FA] ">ENCARREGADO</option>
                  <option value="TECNICO" className="bg-[#F8F9FA] ">TÉCNICO</option>
                  <option value="VISUALIZADOR" className="bg-[#F8F9FA] ">VISUALIZADOR</option>
                </select>
              </div>
            </div>

            {canAdmin && (
              <button
                id="btn-novo-colaborador"
                onClick={handleOpenNewColab}
                className="px-3 py-2 sm:py-1.5 bg-[#10B981] hover:bg-[#34D399] text-black font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer w-full sm:w-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Novo Colaborador</span>
              </button>
            )}
          </div>

          {/* Equipe Cards Grid com scroll interno */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProfiles.map((p) => {
                const roleInfo = getRoleBadge(p.role);
                const isAtivo = p.ativo !== false;
                const initials = p.nome
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={p.id}
                    id={`card-profile-${p.id}`}
                    className={`bg-[#F8F9FA] border rounded-lg p-3.5 flex flex-col justify-between transition-colors relative ${
                      isAtivo ? 'border-blue-500/15 hover:border-blue-500/40' : 'border-red-500/30 opacity-75'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Header: Avatar, Name, Role */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gray-100 border border-blue-500/20 flex items-center justify-center  font-bold text-xs  shrink-0">
                            {initials}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold  leading-tight">
                              {p.nome}
                            </h4>
                            <span className="text-[10px]  block">
                              {p.cargo || 'Colaborador Vision'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px]  font-bold uppercase px-2 py-0.5 rounded border ${roleInfo.badgeClass}`}
                        >
                          {p.role}
                        </span>
                      </div>

                      {/* Meta info */}
                      <div className="space-y-1 text-xs  bg-gray-50 p-2.5 rounded border border-white/5">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5  shrink-0" />
                          <span className=" text-[11px]  truncate">{p.email}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                          <span className="text-[10px]   uppercase">Empresa:</span>
                          <span className=" text-[11px] font-bold ">{p.empresa}</span>
                        </div>

                        {p.telefone && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px]   uppercase">WhatsApp:</span>
                            <a
                              href={`https://wa.me/${p.telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className=" text-[11px]  hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{p.telefone}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer status & actions */}
                    <div className="mt-3 pt-2 border-t border-blue-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAtivo ? 'bg-[#10B981] shadow-[0_0_6px_#10B981]' : 'bg-gray-500'
                          }`}
                        />
                        <span className={`text-[10px]  font-bold ${isAtivo ? '' : ''}`}>
                          {isAtivo ? 'CONTA ATIVA' : 'INATIVO'}
                        </span>
                      </div>

                      {canAdmin && (
                        <div className="flex items-center gap-1 flex-wrap w-full sm:w-auto">
                          <button
                            id={`btn-edit-colab-${p.id}`}
                            onClick={() => handleEditColab(p)}
                            title="Editar Colaborador"
                            className="px-2 py-1 text-[11px] text-cyan-400 hover:bg-white/5 border border-transparent hover:border-blue-500/20 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>

                          <button
                            id={`btn-toggle-colab-${p.id}`}
                            onClick={() => handleToggleColabActive(p)}
                            title={isAtivo ? 'Desativar acesso do colaborador' : 'Reativar acesso do colaborador'}
                            className={`px-2 py-1 text-[11px] rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                              isAtivo
                                ? 'text-amber-400 hover:bg-amber-500/10 border-transparent hover:border-amber-500/30'
                                : 'text-emerald-400 hover:bg-[#10B981]/10 border-transparent hover:border-[#10B981]/30'
                            }`}
                          >
                            <span>{isAtivo ? 'Desativar' : 'Ativar'}</span>
                          </button>

                          <button
                            id={`btn-delete-colab-${p.id}`}
                            onClick={() => handleDeleteColab(p)}
                            title="Excluir colaborador permanentemente"
                            className="px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EMPRESAS PARCEIRAS */}
      {activeTab === 'parceiras' && (
        <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F8F9FA] p-3 rounded-lg border border-[#D1D5DB]">
            <div>
              <h3 className="text-sm font-condensed font-bold uppercase tracking-wide">Empresas Parceiras Fornecedoras</h3>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Empresas cadastradas para cotações e propostas comerciais.</p>
            </div>
            {canAdmin && (
              <button onClick={abrirNovaParceira}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-md btn-primary-gradient">
                <Plus className="w-3.5 h-3.5" /> + Nova Empresa
              </button>
            )}
          </div>

          {/* Formulário inline */}
          {showFormParceira && (
            <div className="shrink-0 bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold text-[#1A1A1A] uppercase">{editParceira ? 'Editar Empresa' : 'Nova Empresa Parceira'}</p>
                <button onClick={() => setShowFormParceira(false)}><X className="w-4 h-4 text-[#6B7280]" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Nome da Empresa *</label>
                  <input value={parceiraForm.nome} onChange={(e) => setParceiraForm((f) => ({ ...f, nome: e.target.value }))}
                    placeholder="Nome da empresa..."
                    className="w-full h-10 bg-white border border-[#D1D5DB] focus:border-[#2563EB] text-[#1A1A1A] text-[12px] rounded-md px-3 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">CNPJ</label>
                  <input value={parceiraForm.cnpj} onChange={(e) => setParceiraForm((f) => ({ ...f, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                    className="w-full h-10 bg-white border border-[#D1D5DB] text-[#1A1A1A] text-[12px] rounded-md px-3 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Contato</label>
                  <input value={parceiraForm.contato} onChange={(e) => setParceiraForm((f) => ({ ...f, contato: e.target.value }))}
                    placeholder="Nome do responsável"
                    className="w-full h-10 bg-white border border-[#D1D5DB] text-[#1A1A1A] text-[12px] rounded-md px-3 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">E-mail</label>
                  <input type="email" value={parceiraForm.email} onChange={(e) => setParceiraForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="email@empresa.com"
                    className="w-full h-10 bg-white border border-[#D1D5DB] text-[#1A1A1A] text-[12px] rounded-md px-3 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Telefone</label>
                  <input value={parceiraForm.telefone} onChange={(e) => setParceiraForm((f) => ({ ...f, telefone: e.target.value }))}
                    placeholder="(21) 99999-9999"
                    className="w-full h-10 bg-white border border-[#D1D5DB] text-[#1A1A1A] text-[12px] rounded-md px-3 outline-none" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowFormParceira(false)}
                  className="flex-1 h-10 rounded-md bg-white border border-[#D1D5DB] text-[#374151] text-[12px] font-semibold">Cancelar</button>
                <button onClick={salvarParceira} disabled={savingParceira || !parceiraForm.nome.trim()}
                  className="flex-1 h-10 rounded-md btn-primary-gradient text-[12px] font-bold disabled:opacity-60">
                  {savingParceira ? 'Salvando...' : editParceira ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </div>
          )}

          {/* Lista */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 scroll-fluido">
            {parceiras.length === 0 ? (
              <div className="text-center py-12 text-[#6B7280] text-sm">
                Nenhuma empresa parceira cadastrada. Clique em "+ Nova Empresa" para adicionar.
              </div>
            ) : (
              parceiras.map((p) => (
                <div key={p.id} className="bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg p-3.5 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E5E7EB] border border-[#D1D5DB] flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-[#6B7280]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#1A1A1A] truncate">{p.nome}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {p.cnpj && <span className="text-[11px] text-[#6B7280] font-mono">{p.cnpj}</span>}
                      {p.contato && <span className="text-[11px] text-[#6B7280]">{p.contato}</span>}
                      {p.email && <span className="text-[11px] text-[#6B7280]">{p.email}</span>}
                      {p.telefone && <span className="text-[11px] text-[#6B7280]">{p.telefone}</span>}
                    </div>
                  </div>
                  {canAdmin && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => abrirEditarParceira(p)}
                        className="w-8 h-8 rounded-md bg-[#E5E7EB] border border-[#D1D5DB] text-[#374151] hover:text-white flex items-center justify-center">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deletarParceira(p.id)}
                        className="w-8 h-8 rounded-md bg-[#E5E7EB] border border-[#D1D5DB] text-red-400 hover:text-red-300 flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}



      {/* MODALS */}
      <UgModal
        isOpen={isUgModalOpen}
        onClose={() => setIsUgModalOpen(false)}
        onSuccess={(savedUg) => {
          // Atualiza estado local imediatamente (sem esperar Supabase)
          setHierarchy(prev => ({
            ...prev,
            ugs: ugToEdit
              ? prev.ugs.map(u => u.id === savedUg.id ? savedUg : u)
              : [...prev.ugs, savedUg],
          }));
          loadData(); // sync com Supabase em background
        }}
        ugToEdit={ugToEdit}
        existingCount={hierarchy.ugs.length}
      />

      <AreaModal
        isOpen={isAreaModalOpen}
        onClose={() => setIsAreaModalOpen(false)}
        onSuccess={(savedArea) => {
          setHierarchy(prev => ({
            ...prev,
            areas: areaToEdit
              ? prev.areas.map(a => a.id === savedArea.id ? savedArea : a)
              : [...prev.areas, savedArea],
          }));
          loadData();
        }}
        areaToEdit={areaToEdit}
        ugs={hierarchy.ugs}
      />

      <LinhaModal
        isOpen={isLinhaModalOpen}
        onClose={() => setIsLinhaModalOpen(false)}
        onSuccess={() => loadData()}
        linhaToEdit={linhaToEdit}
        areas={hierarchy.areas}
        ugs={hierarchy.ugs}
      />

      <ColaboradorModal
        isOpen={isColabModalOpen}
        onClose={() => setIsColabModalOpen(false)}
        onSuccess={async (savedProfile) => {
          // Atualiza estado local imediatamente
          setProfiles(prev =>
            colabToEdit
              ? prev.map(p => p.id === savedProfile.id ? savedProfile : p)
              : [...prev, savedProfile]
          );
          await loadData();
        }}
        profileToEdit={colabToEdit}
      />

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={`Excluir ${deleteModal.type}`}
        itemName={deleteModal.name}
        errorMessage={deleteModal.errorMessage}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
};
