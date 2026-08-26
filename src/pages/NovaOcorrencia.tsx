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
  const [ordemVision, setOrdemVision] = useState<string>('OS-VC-' + Math.floor(1000 + Math.random() * 9000));
  const [ppac, setPpac] = useState<string>('');
  const [equipamentoParado, setEquipamentoParado] = useState<boolean>(true);
  const [parouLinha, setParouLinha] = useState<boolean>(false);

  // Dynamic Peças
  const [pecas, setPecas] = useState<Array<Partial<PecaPendente>>>([]);

  // Dynamic Fotos
  const [fotos, setFotos] = useState<Array<{ name: string; url: string }>>([]);

  useEffect(() => {
    DataStore.getVwEquipamentos().then((eqs) => {
      setEquipamentos(eqs);
      const preselectedId = searchParams.get('equipamento_id');
      if (preselectedId) {
        const found = eqs.find((e) => e.id === preselectedId);
        if (found) {
          setSelectedEquip(found);
          if (found.ppac) setPpac(found.ppac);
        }
      }
    });
  }, [searchParams]);

  const filteredEquips = equipamentos.filter((eq) => {
    if (!equipSearch) return false;
    const term = equipSearch.toLowerCase();
    return (
      eq.tag.toLowerCase().includes(term) ||
      (eq.patrimonio && eq.patrimonio.toLowerCase().includes(term)) ||
      (eq.tag_sap && eq.tag_sap.toLowerCase().includes(term)) ||
      eq.modelo.toLowerCase().includes(term) ||
      eq.linha_nome.toLowerCase().includes(term)
    );
  });

  const handleSelectEquip = (eq: VwEquipamento) => {
    setSelectedEquip(eq);
    setEquipSearch('');
    if (eq.ppac) setPpac(eq.ppac);
  };

  const handleAddPeca = () => {
    setPecas([
      ...pecas,
      {
        descricao: '',
        part_number: '',
        fabricante: selectedEquip?.marca || 'RITTAL',
        quantidade: 1,
        fornecedor: '',
        valor_unitario: 0,
        status: 'PENDENTE_COTACAO',
      },
    ]);
  };

  const handleRemovePeca = (index: number) => {
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
      // Determine initial status: if has pieces -> AGUARDANDO_ORCAMENTO, else ABERTA
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

      // Save peças
      for (const p of pecas) {
        if (p.descricao) {
          await DataStore.savePeca({
            ...p,
            ocorrencia_id: savedOcc.id,
            equipamento_id: selectedEquip.id,
          });
        }
      }

      // Save fotos
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
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar ocorrência.');
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
            className="p-1.5 rounded-lg bg-[#161B22] hover:bg-[#21262D]  hover: border border-[#30363D] transition-colors cursor-pointer shrink-0"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px]  tracking-widest  bg-[#F85149]/15 px-2 py-0.5 rounded-full border border-[#F85149]/30 uppercase font-bold">
                Registro de Campo (Mobile-First)
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-display font-bold  tracking-tight uppercase truncate">
              Abertura de Ocorrência Corretiva
            </h2>
          </div>
        </div>
      </div>

      {/* Form Container (Flex column with scrollable body + fixed footer) */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
        {/* Corpo com Scroll */}
        <div className="nova-ocorrencia-body flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-4 max-w-4xl w-full mx-auto">
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
                  Digite a TAG, Tag Vision, Tag AMBEV ou Local de Instalação para buscar:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4  absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={equipSearch}
                    onChange={(e) => setEquipSearch(e.target.value)}
                    placeholder="Ex: 361, Blue e+, L101..."
                    className="w-full bg-[#0D1117] border border-[#30363D] focus:border-[#2F81F7]  text-xs rounded-lg pl-9 pr-3 py-2.5 outline-none  transition-colors"
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
                        <div>
                          <div className="flex items-center gap-2">
                            <IndustrialTag tag={eq.tag} size="sm" />
                            <span className="font-semibold ">{eq.tipo} ({eq.marca} {eq.modelo})</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            UG {eq.ug_codigo} • {[eq.centro_trabalho_sap, eq.centro_trabalho_nome].filter(Boolean).join(' - ') || eq.linha_nome}
                          </div>
                        </div>
                        <span className="text-[10px] text-cyan-400">{eq.tag_sap || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#0D1117] border border-[#30363D] rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="eyebrow  block">Ativo Selecionado</span>
                  <div className="flex items-center gap-2 mt-1">
                    <IndustrialTag tag={selectedEquip.tag} size="md" />
                    <span className="font-bold ">{selectedEquip.tipo}</span>
                  </div>
                  <p className="text-[11px]  mt-0.5">{selectedEquip.marca} {selectedEquip.modelo}</p>
                </div>

                <div>
                  <span className="eyebrow  block">Localização na Cervejaria</span>
                  <p className="font-semibold text-xs mt-1">
                    {[selectedEquip.centro_trabalho_sap, selectedEquip.centro_trabalho_nome].filter(Boolean).join(' - ') || selectedEquip.linha_nome}
                  </p>
                  <p className="text-[11px] text-gray-400">UG {selectedEquip.ug_codigo}</p>
                </div>

                <div>
                  <span className="eyebrow  block">Tag AMBEV / Elétrico</span>
                  <p className="font-semibold text-cyan-400 text-xs mt-1">{selectedEquip.tag_sap || 'Sem Tag AMBEV'}</p>
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
                    Parou a Linha de Produção
                  </div>
                  <div style={{ fontSize: 11, color: '#8B949E', marginTop: 2 }}>
                    Impacto na produção AMBEV
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
                Diagnóstico de Campo & Códigos SAP
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

          {/* STEP 4: PEÇAS & COMPONENTES NECESSÁRIOS */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2F81F7]  font-display font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="card-title text-xs sm:text-sm uppercase ">
                  Peças & Componentes Necessários ({pecas.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddPeca}
                className="btn-primary !py-1 !px-2.5 !text-[11px] gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Peça</span>
              </button>
            </div>

            {pecas.length === 0 ? (
              <p className="text-xs  italic py-1">
                Nenhuma peça pendente de compra adicionada. Clique em "+ Adicionar Peça" caso o reparo exija componentes novos.
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pr-6">
                      <div>
                        <label className="block eyebrow  mb-1">Descrição da Peça*</label>
                        <input
                          type="text"
                          required
                          value={peca.descricao || ''}
                          onChange={(e) => handlePecaChange(idx, 'descricao', e.target.value)}
                          placeholder="Ex: Motoventilador Condensador"
                          className="w-full bg-[#161B22] border border-[#30363D] focus:border-[#2F81F7]  p-2 rounded-lg outline-none font-body text-xs"
                        />
                      </div>

                      <div>
                        <label className="block eyebrow  mb-1">Part Number / Código</label>
                        <input
                          type="text"
                          value={peca.part_number || ''}
                          onChange={(e) => handlePecaChange(idx, 'part_number', e.target.value)}
                          placeholder="SK 3396.282"
                          className="w-full bg-[#161B22] border border-[#30363D] focus:border-[#2F81F7]  p-2 rounded-lg outline-none  text-xs"
                        />
                      </div>

                      <div>
                        <label className="block eyebrow  mb-1">Fabricante / Qtd</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={peca.fabricante || ''}
                            onChange={(e) => handlePecaChange(idx, 'fabricante', e.target.value)}
                            placeholder="RITTAL"
                            className="bg-[#161B22] border border-[#30363D] focus:border-[#2F81F7]  p-2 rounded-lg outline-none text-xs font-body"
                          />
                          <input
                            type="number"
                            min={1}
                            value={peca.quantidade || 1}
                            onChange={(e) => handlePecaChange(idx, 'quantidade', Number(e.target.value))}
                            className="bg-[#161B22] border border-[#30363D] focus:border-[#2F81F7]  p-2 rounded-lg outline-none  text-xs font-bold"
                          />
                        </div>
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
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Registrando Chamado...' : 'Gravar Ocorrência e Gerar Protocolo'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
