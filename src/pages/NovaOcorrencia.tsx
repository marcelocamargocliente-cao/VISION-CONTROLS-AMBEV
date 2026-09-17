import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Camera,
  CheckCircle2,
  Save,
  Package,
  FileText,
  DollarSign,
  Cpu,
  Info,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import {
  VwEquipamento,
  Ocorrencia,
  OcorrenciaStatus,
  Criticidade,
  PecaPendente,
  Orcamento,
} from '../types/database';
import { IndustrialTag } from '../components/common/IndustrialTag';
import { useAuth } from '../context/AuthContext';

export const NovaOcorrencia: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const editId = searchParams.get('edit'); // modo edição quando presente
  const modoEdicao = !!editId;

  const [equipamentos, setEquipamentos] = useState<VwEquipamento[]>([]);
  const [selectedEquip, setSelectedEquip] = useState<VwEquipamento | null>(null);
  const [equipSearch, setEquipSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [tipoServico, setTipoServico] = useState<'CORRETIVA' | 'PREVENTIVA' | 'MELHORIA' | 'EMERGENCIAL'>('CORRETIVA');
  const [criticidade, setCriticidade] = useState<Criticidade>('ALTA');
  const [dataAvaria, setDataAvaria] = useState<string>(new Date().toISOString().slice(0, 10));
  const [previsaoRetorno, setPrevisaoRetorno] = useState<string>('');
  const [relatanteNome, setRelatanteNome] = useState<string>(user?.nome || 'Arthur Almeida');
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState<string>('Alan - Técnico Vision');
  const [descricaoAnomalia, setDescricaoAnomalia] = useState<string>('');
  const [causaProvavel, setCausaProvavel] = useState<string>('');
  const [notaSap, setNotaSap] = useState<string>('');
  const [ordemSap, setOrdemSap] = useState<string>('');
  const [ordemVision, setOrdemVision] = useState<string>('');
  const [ppac, setPpac] = useState<string>('');
  const [equipamentoParado, setEquipamentoParado] = useState<boolean>(true);
  const [parouLinha, setParouLinha] = useState<boolean>(false);

  // Dynamic Peças
  const [pecas, setPecas] = useState<Array<Partial<PecaPendente>>>([]);
  const [valorDisplays, setValorDisplays] = useState<string[]>([]); // display-only formatted strings for valor_unitario mask

  // Dynamic Fotos
  const [fotos, setFotos] = useState<Array<{ name: string; url: string }>>([]);

  useEffect(() => {
    DataStore.getVwEquipamentos().then((eqs) => {
      setEquipamentos(eqs);

      if (modoEdicao && editId) {
        // MODO EDIÇÃO: carrega a ocorrência existente e preenche todos os campos
        DataStore.getOcorrenciaById(editId).then(async (occ) => {
          if (!occ) return;
          const equipId = occ.equipamento_id;
          const found = eqs.find((e) => e.id === equipId);
          if (found) setSelectedEquip(found);
          // Enriquece com Supabase
          const full = await DataStore.getEquipamentoById(equipId);
          if (full) setSelectedEquip((prev) => ({ ...(prev || {}), ...full } as VwEquipamento));

          // Preenche os campos com os dados da ocorrência
          setTipoServico((occ as any).tipo_servico || 'CORRETIVA');
          setCriticidade(occ.criticidade);
          setDataAvaria(occ.data_avaria?.slice(0, 10) || new Date().toISOString().slice(0, 10));
          setPrevisaoRetorno((occ as any).previsao_retorno?.slice(0, 10) || '');
          setRelatanteNome((occ as any).relatante_nome || user?.nome || '');
          setTecnicoResponsavel((occ as any).tecnico_responsavel_nome || '');
          setDescricaoAnomalia(occ.descricao_anomalia || '');
          setCausaProvavel(occ.causa_provavel || '');
          setNotaSap((occ as any).nota_sap || '');
          setOrdemSap((occ as any).ordem_sap || '');
          setOrdemVision((occ as any).ordem_vision || '');
          setPpac((occ as any).ppac || '');
          setEquipamentoParado(!!occ.equipamento_parado);
          setParouLinha(!!(occ as any).parou_linha);
        });
      } else {
        // MODO CRIAÇÃO: pré-seleciona equipamento via query param
        const preselectedId = searchParams.get('equipamento_id');
        if (preselectedId) {
          const found = eqs.find((e) => e.id === preselectedId);
          if (found) { setSelectedEquip(found); if (found.ppac) setPpac(found.ppac); }
          DataStore.getEquipamentoById(preselectedId).then((full) => {
            if (full) { setSelectedEquip((prev) => ({ ...(prev || {}), ...full } as VwEquipamento)); if (full.ppac) setPpac(full.ppac); }
          });
        }
      }
    });
  }, [searchParams]);

  const filteredEquips = equipamentos.filter((eq) => {
    if (!equipSearch) return false;
    const term = equipSearch.toLowerCase();
    return (
      (eq.tag?.toLowerCase().includes(term)) ||
      (eq.patrimonio_ref?.toLowerCase().includes(term)) ||
      (eq.patrimonio?.toLowerCase().includes(term)) ||
      (eq.tag_sap?.toLowerCase().includes(term)) ||
      (eq.modelo?.toLowerCase().includes(term)) ||
      (eq.linha_nome?.toLowerCase().includes(term)) ||
      (eq.localizacao_ref?.toLowerCase().includes(term)) ||
      (eq.local_instalacao?.toLowerCase().includes(term))
    );
  });

  const handleSelectEquip = (eq: VwEquipamento) => {
    setSelectedEquip(eq);
    setEquipSearch('');
    if (eq.ppac) setPpac(eq.ppac);
    // Busca dados frescos do Supabase para garantir TAG AMBEV/patrimônio corretos
    DataStore.getEquipamentoById(eq.id).then((full) => {
      if (full) {
        setSelectedEquip((prev) => ({ ...(prev || {}), ...full } as VwEquipamento));
        if (full.ppac) setPpac(full.ppac);
      }
    });
  };

  const handleAddPeca = () => {
    setValorDisplays([...valorDisplays, '']);
    setPecas([
      ...pecas,
      {
        descricao: '',
        part_number: '',
        fabricante: '',
        quantidade: 1,
        fornecedor: '',
        valor_unitario: 0,
        status: 'PENDENTE_COTACAO',
      },
    ]);
  };

  const handleRemovePeca = (index: number) => {
    setValorDisplays(valorDisplays.filter((_, i) => i !== index));
    setPecas(pecas.filter((_, i) => i !== index));
  };

  const handlePecaChange = (index: number, field: string, value: any) => {
    const updated = [...pecas];
    updated[index] = { ...updated[index], [field]: value };
    setPecas(updated);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList: File[] = Array.from(e.target.files);
    fileList.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const url = event.target?.result as string;
        if (url) {
          setFotos((prev) => [...prev, { name: file.name, url }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquip) {
      alert('Por favor, selecione o equipamento da ocorrência.');
      return;
    }
    if (!descricaoAnomalia.trim()) {
      alert('Por favor, descreva a anomalia verificada em campo.');
      return;
    }

    setLoading(true);
    try {
      if (modoEdicao && editId) {
        // MODO EDIÇÃO: atualiza campos da ocorrência existente
        await DataStore.updateOcorrenciaCampos(
          editId,
          {
            criticidade,
            descricao_anomalia: descricaoAnomalia.trim(),
            causa_provavel: causaProvavel.trim(),
            equipamento_parado: equipamentoParado,
          },
          user?.nome || 'Sistema'
        );
        // Atualiza campos extras via Supabase diretamente
        await (DataStore as any).updateOcorrenciaExtra?.(editId, {
          tipo_servico: tipoServico,
          data_avaria: dataAvaria,
          previsao_retorno: previsaoRetorno || null,
          relatante_nome: relatanteNome,
          tecnico_responsavel_nome: tecnicoResponsavel,
          nota_sap: notaSap || null,
          ordem_sap: ordemSap || null,
          ordem_vision: ordemVision || null,
          ppac: ppac || null,
          parou_linha: parouLinha,
        });
        navigate(`/ocorrencias/${editId}`);
      } else {
        // MODO CRIAÇÃO: cria nova ocorrência
        const initialStatus: OcorrenciaStatus = pecas.length > 0 ? 'AGUARDANDO_ORCAMENTO' : 'ABERTA';

        const savedOcc = await DataStore.saveOcorrencia(
          {
            equipamento_id: selectedEquip.id,
            tipo_servico: tipoServico,
            criticidade: criticidade,
            status: initialStatus,
            data_avaria: dataAvaria,
            previsao_retorno: previsaoRetorno || undefined,
            relatante_nome: relatanteNome,
            tecnico_responsavel_nome: tecnicoResponsavel,
            descricao_anomalia: descricaoAnomalia,
            causa_provavel: causaProvavel || undefined,
            nota_sap: notaSap || undefined,
            ordem_sap: ordemSap || undefined,
            ordem_vision: ordemVision || undefined,
            ppac: ppac || undefined,
            equipamento_parado: equipamentoParado,
            parou_linha: parouLinha,
          } as any,
          pecas as any[],
          [],
          fotos.map((f) => f.url)
        );

        for (const f of fotos) {
          await DataStore.addAnexo({
            ocorrencia_id: savedOcc.id,
            equipamento_id: selectedEquip.id,
            nome_arquivo: f.name,
            url: f.url,
            tipo_anexo: 'FOTO',
            bucket: 'fotos',
          });
        }

        navigate(`/ocorrencias/${savedOcc.id}`);
      }
    } catch (err) {
      console.error(err);
      alert(modoEdicao ? 'Erro ao atualizar ocorrência.' : 'Erro ao salvar ocorrência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nova-ocorrencia-page w-full h-full flex flex-col overflow-hidden bg-[#0D1117] font-body ">
      {/* Header Fixo */}
      <div className="nova-ocorrencia-header flex items-center justify-between gap-3 border-b border-[#30363D] bg-[#0D1117] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] transition-colors cursor-pointer shrink-0"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] tracking-widest px-2 py-0.5 rounded-full border uppercase font-bold ${modoEdicao ? 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30' : 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30'}`}>
                {modoEdicao ? 'Editando Registro' : 'Registro de Campo (Mobile-First)'}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-display font-bold tracking-tight uppercase truncate">
              {modoEdicao ? 'Editar Ocorrência Corretiva' : 'Abertura de Ocorrência Corretiva'}
            </h2>
          </div>
        </div>
      </div>

      {/* Form Container (Flex column with scrollable body + fixed footer) */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
        {/* Corpo com Scroll */}
        <div className="nova-ocorrencia-body flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl w-full mx-auto">
          {/* STEP 1: EQUIPAMENTO & LOCALIZAÇÃO */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2F81F7]  font-display font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="card-title text-xs sm:text-sm uppercase ">
                  Equipamento & Localização
                </h3>
              </div>
              {selectedEquip && (
                <button
                  type="button"
                  onClick={() => setSelectedEquip(null)}
                  className="text-[11px] font-semibold  hover:underline cursor-pointer"
                >
                  Trocar Equipamento
                </button>
              )}
            </div>

            {!selectedEquip ? (
              <div className="space-y-2">
                <label className="block eyebrow ">
                  DIGITE A TAG, TAG VISION, TAG AMBEV OU LOCAL DE INSTALAÇÃO PARA BUSCAR:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={equipSearch}
                    onChange={(e) => setEquipSearch(e.target.value)}
                    placeholder="Ex: 361, Blue e+, L101..."
                    className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  text-xs rounded-lg has-icon-left pr-3 py-2.5 outline-none  transition-colors"
                  />
                </div>

                {equipSearch && filteredEquips.length > 0 && (
                  <div className="bg-[#0D1117] border border-[#30363D] rounded-lg max-h-48 overflow-y-auto divide-y divide-[#30363D]">
                    {filteredEquips.map((eq) => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => handleSelectEquip(eq)}
                        className="w-full p-2.5 text-left hover:bg-[#1C2128] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {(eq.patrimonio_ref || eq.tag_sap) && (
                              <span className="bg-[#1E3A5F] text-cyan-400 font-bold text-[11px] rounded px-2 py-0.5 border border-cyan-500/30 font-mono">
                                AMBEV {eq.patrimonio_ref || eq.tag_sap}
                              </span>
                            )}
                            <IndustrialTag tag={eq.patrimonio_ref || eq.tag_sap || eq.tag} size="sm" />
                            <span className="font-semibold text-xs">{eq.tipo} ({eq.marca} {eq.modelo})</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            UG {eq.ug_codigo} • {[eq.centro_trabalho_sap, eq.centro_trabalho_nome].filter(Boolean).join(' - ') || eq.linha_nome}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#0D1117] border border-[#30363D] rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="eyebrow  block">TAG AMBEV</span>
                  <p className="font-semibold text-cyan-400 text-xs mt-1">{selectedEquip.tag_sap || selectedEquip.patrimonio_ref || 'Sem Tag AMBEV'}</p>
                  <p className="text-[11px]  mt-0.5">{selectedEquip.tipo_equipamento || selectedEquip.tipo}</p>
                  <p className="text-[11px] text-gray-400">{selectedEquip.marca} {selectedEquip.modelo}</p>
                </div>

                <div>
                  <span className="eyebrow  block">LOCAL DE INSTALAÇÃO</span>
                  <p className="font-semibold text-xs mt-1">
                    {selectedEquip.localizacao_ref || selectedEquip.local_instalacao || '—'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    UG {selectedEquip.ug_ref || selectedEquip.ug_codigo || '—'}
                    {(selectedEquip.area_ref) ? ` · ${selectedEquip.area_ref}` : ''}
                  </p>
                </div>

                <div>
                  <span className="eyebrow  block">TAG VISION</span>
                  <div className="flex items-center gap-2 mt-1">
                    <IndustrialTag tag={selectedEquip.tag} size="md" />
                  </div>
                  <p className="text-[11px] text-gray-400">{selectedEquip.tensao} • {selectedEquip.gas_refrigerante}</p>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: PARÂMETROS OPERACIONAIS & CRITICIDADE */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-[#30363D] pb-2">
              <span className="w-5 h-5 rounded-full bg-[#2F81F7]  font-display font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="card-title text-xs sm:text-sm uppercase ">
                Parâmetros Operacionais & Criticidade
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Tipo de Serviço */}
              <div>
                <label className="block eyebrow  mb-1">Tipo de Serviço</label>
                <select
                  value={tipoServico}
                  onChange={(e) => setTipoServico(e.target.value as any)}
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none"
                >
                  <option value="CORRETIVA">Corretiva</option>
                  <option value="PREVENTIVA">Preventiva</option>
                  <option value="MELHORIA">Melhoria</option>
                  <option value="EMERGENCIAL">Emergencial</option>
                </select>
              </div>

              {/* Criticidade */}
              <div>
                <label className="block eyebrow  mb-1">Criticidade</label>
                <select
                  value={criticidade}
                  onChange={(e) => setCriticidade(e.target.value as Criticidade)}
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none font-bold"
                >
                  <option value="CRITICA">🔴 Crítica (Impacto em Linha)</option>
                  <option value="ALTA">🟠 Alta</option>
                  <option value="MEDIA">🟡 Média</option>
                  <option value="BAIXA">🟢 Baixa</option>
                </select>
              </div>

              {/* Data da Avaria */}
              <div>
                <label className="block eyebrow  mb-1">Data da Avaria*</label>
                <input
                  type="date"
                  required
                  value={dataAvaria}
                  onChange={(e) => setDataAvaria(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none "
                />
              </div>

              {/* Previsão Retorno */}
              <div>
                <label className="block eyebrow  mb-1">Previsão Retorno</label>
                <input
                  type="date"
                  value={previsaoRetorno}
                  onChange={(e) => setPrevisaoRetorno(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none "
                />
              </div>
            </div>

            {/* Impactos Imediatos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                border: equipamentoParado ? '1px solid #2F81F7' : '1px solid #21262D',
                borderRadius: 8,
                background: equipamentoParado ? 'rgba(47,129,247,0.08)' : '#1A1F28',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={equipamentoParado}
                  onChange={e => setEquipamentoParado(e.target.checked)}
                  style={{ width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#E6EDF3' }}>
                    Equipamento Parado
                  </div>
                  <div style={{ fontSize: 11, color: '#8B949E', marginTop: 2 }}>
                    Registra como fora de operação
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                border: parouLinha ? '1px solid #2F81F7' : '1px solid #21262D',
                borderRadius: 8,
                background: parouLinha ? 'rgba(47,129,247,0.08)' : '#1A1F28',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={parouLinha}
                  onChange={e => setParouLinha(e.target.checked)}
                  style={{ width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#E6EDF3' }}>
                    EQUIPAMENTO NÃO REFRIGERA
                  </div>
                  <div style={{ fontSize: 11, color: '#8B949E', marginTop: 2 }}>
                    IMPACTO NA REFRIGERAÇÃO
                  </div>
                </div>
              </label>

            </div>
          </div>

          {/* STEP 3: DIAGNÓSTICO DE CAMPO & CÓDIGOS SAP */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-[#30363D] pb-2">
              <span className="w-5 h-5 rounded-full bg-[#2F81F7]  font-display font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="card-title text-xs sm:text-sm uppercase ">
                Diagnóstico de Campo
              </h3>
            </div>

            <div>
              <label className="block eyebrow  mb-1">
                Descrição da Anomalia / Sintoma Observado*
              </label>
              <textarea
                required
                rows={3}
                value={descricaoAnomalia}
                onChange={(e) => setDescricaoAnomalia(e.target.value)}
                placeholder="Ex: Alarme de alta pressão no display; compressor desarmando por sobrecorrente; ventilador do condensador travado..."
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-3 rounded-lg outline-none leading-relaxed font-body"
              />
            </div>

            <div>
              <label className="block eyebrow  mb-1">
                Causa Provável / Diagnóstico Técnico
              </label>
              <input
                type="text"
                value={causaProvavel}
                onChange={(e) => setCausaProvavel(e.target.value)}
                placeholder="Ex: Queima da bobina do ventilador ou vazamento na válvula Schrader"
                className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none font-body"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block eyebrow  mb-1">Nota SAP AMBEV</label>
                <input
                  type="text"
                  value={notaSap}
                  onChange={(e) => setNotaSap(e.target.value)}
                  placeholder="Ex: 10045892"
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none "
                />
              </div>

              <div>
                <label className="block eyebrow  mb-1">Ordem SAP AMBEV</label>
                <input
                  type="text"
                  value={ordemSap}
                  onChange={(e) => setOrdemSap(e.target.value)}
                  placeholder="Ex: 40019283"
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none "
                />
              </div>

              <div>
                <label className="block eyebrow  mb-1">Ordem Interna Vision</label>
                <input
                  type="text"
                  value={ordemVision}
                  onChange={(e) => setOrdemVision(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  p-2.5 rounded-lg outline-none "
                />
              </div>
            </div>
          </div>

          {/* STEP 4: PEÇAS & SERVIÇOS */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2F81F7]  font-display font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="card-title text-xs sm:text-sm uppercase ">
                  Peças & Serviços ({pecas.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddPeca}
                className="btn-primary !py-1 !px-2.5 !text-[11px] gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Item</span>
              </button>
            </div>

            {pecas.length === 0 ? (
              <p className="text-xs  italic py-1">
                Nenhuma peça pendente de compra adicionada. Clique em "+ Adicionar Item" caso o reparo exija componentes novos.
              </p>
            ) : (
              <div className="space-y-3">
                {pecas.map((peca, idx) => (
                  <div key={idx} className="p-3 bg-[#0D1117] border border-[#30363D] rounded-lg space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => handleRemovePeca(idx)}
                      className="absolute top-2.5 right-2.5  hover: transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-2 pr-6">
                      {/* Linha 1: Nome/tipo da peça */}
                      <div>
                        <label className="block eyebrow mb-1">DESCRIÇÃO *</label>
                        <input
                          type="text"
                          required
                          value={peca.descricao || ''}
                          onChange={(e) => handlePecaChange(idx, 'descricao', e.target.value)}
                          placeholder="Ex: Motoventilador Condensador, Compressor, Placa..."
                          className="w-full bg-[#161B22] border border-[#30363D] focus:border-[#2F81F7] p-2 rounded-lg outline-none font-body text-xs"
                        />
                      </div>

                      {/* Linha 2: Descrição ampla (ex-Part Number) */}
                      <div>
                        <label className="block eyebrow mb-1">DESCRIÇÃO DA PEÇA</label>
                        <textarea
                          rows={3}
                          value={peca.part_number || ''}
                          onChange={(e) => handlePecaChange(idx, 'part_number', e.target.value)}
                          placeholder="Dados técnicos, referência, código SAP, fabricante, modelo, especificação..."
                          className="w-full bg-[#161B22] border border-[#30363D] focus:border-[#2F81F7] p-2 rounded-lg outline-none text-xs resize-y"
                        />
                      </div>

                      {/* Linha 3: Qtd + Valor */}
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="w-32">
                          <label className="block eyebrow mb-1">QTD</label>
                          <input
                            type="number"
                            min={1}
                            value={peca.quantidade || 1}
                            onChange={(e) => handlePecaChange(idx, 'quantidade', Number(e.target.value))}
                            className="w-full bg-[#161B22] border border-[#30363D] focus:border-[#2F81F7] p-2 rounded-lg outline-none text-xs font-bold text-center"
                          />
                        </div>
                        {/* Valor unitário e NCM mantidos no estado mas ocultos nesta tela */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 5: FOTOS DE EVIDÊNCIA */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2F81F7]  font-display font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <h3 className="card-title text-xs sm:text-sm uppercase ">
                  Fotos de Evidência ({fotos.length})
                </h3>
              </div>
              <label className="btn-secondary !py-1 !px-2.5 !text-[11px] gap-1 cursor-pointer">
                <Camera className="w-3.5 h-3.5" />
                <span>+ Tirar / Anexar Foto</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {fotos.length === 0 ? (
              <p className="text-xs  italic py-1">
                Nenhuma foto anexada. Use fotos para agilizar a cotação das peças e alinhamento com a AMBEV.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {fotos.map((foto, i) => (
                  <div key={i} className="aspect-video bg-[#0D1117] border border-[#30363D] rounded-lg overflow-hidden relative group">
                    <img src={foto.url} alt={foto.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))}
                      className="absolute top-1.5 right-1.5 bg-black/80  p-1 rounded-md hover:bg-[#F85149] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé Fixo com Ações */}
        <div className="nova-ocorrencia-footer shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary !py-2 !px-4 text-xs font-body font-medium cursor-pointer"
          >
            Cancelar
          </button>

          <button
            id="btn-submit-nova-ocorrencia"
            type="submit"
            disabled={loading || !selectedEquip}
            className="btn-primary !py-2 !px-5 text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{ position: 'relative', zIndex: 30 }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? (modoEdicao ? 'Atualizando...' : 'Registrando Chamado...') : (modoEdicao ? 'Salvar Alterações' : 'Gravar Ocorrência e Gerar Protocolo')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
