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
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#2C343E] pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-[4px] bg-[#1C222A] hover:bg-[#232B35] text-[#94A3B8] hover:text-[#ECEFF1] border border-[#2C343E]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono tracking-widest text-[#E5484D] bg-[#E5484D]/15 px-2 py-0.5 rounded-[2px] border border-[#E5484D]/30 uppercase font-bold">
              Registro de Campo (Mobile-First)
            </span>
          </div>
          <h2 className="text-xl font-condensed font-bold text-[#ECEFF1] tracking-wide uppercase">
            Abertura de Ocorrência Corretiva
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* STEP 1: EQUIPAMENTO */}
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2C343E] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#F5A623] text-[#14181D] font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-condensed font-bold text-sm text-[#ECEFF1] uppercase">
                Equipamento & Localização
              </h3>
            </div>
            {selectedEquip && (
              <button
                type="button"
                onClick={() => setSelectedEquip(null)}
                className="text-[11px] text-[#F5A623] hover:underline"
              >
                Trocar Equipamento
              </button>
            )}
          </div>

          {!selectedEquip ? (
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase text-[#94A3B8]">
                Digite a TAG, Patrimônio ou Máquina para buscar:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={equipSearch}
                  onChange={(e) => setEquipSearch(e.target.value)}
                  placeholder="Ex: 361, Blue e+, L101..."
                  className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] pl-9 pr-3 py-2.5 outline-none font-mono"
                />
              </div>

              {equipSearch && filteredEquips.length > 0 && (
                <div className="bg-[#14181D] border border-[#2C343E] rounded-[3px] max-h-48 overflow-y-auto divide-y divide-[#2C343E]">
                  {filteredEquips.map((eq) => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => handleSelectEquip(eq)}
                      className="w-full p-2 text-left hover:bg-[#232B35] flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <IndustrialTag tag={eq.tag} size="sm" />
                          <span className="font-semibold text-[#ECEFF1]">{eq.tipo} ({eq.marca} {eq.modelo})</span>
                        </div>
                        <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                          {eq.ug_codigo} • {eq.linha_nome} • {eq.centro_trabalho_nome}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#38BDF8] font-mono">{eq.tag_sap || ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-[#14181D] border border-[#2C343E] rounded-[3px] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Ativo Selecionado</span>
                <div className="flex items-center gap-2 mt-1">
                  <IndustrialTag tag={selectedEquip.tag} size="md" />
                  <span className="font-bold text-[#ECEFF1]">{selectedEquip.tipo}</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">{selectedEquip.marca} {selectedEquip.modelo}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Localização na Cervejaria</span>
                <p className="font-semibold text-[#ECEFF1] mt-1">{selectedEquip.linha_nome}</p>
                <p className="text-[11px] text-[#94A3B8]">{selectedEquip.ug_codigo} • {selectedEquip.centro_trabalho_nome}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Dados SAP / Elétrico</span>
                <p className="font-mono text-[#38BDF8] mt-1">{selectedEquip.tag_sap || 'Sem Tag SAP'}</p>
                <p className="text-[11px] text-[#94A3B8] font-mono">{selectedEquip.tensao} • {selectedEquip.gas_refrigerante}</p>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: GRAVIDADE & DATAS */}
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2C343E] pb-2">
            <span className="w-5 h-5 rounded-full bg-[#F5A623] text-[#14181D] font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="font-condensed font-bold text-sm text-[#ECEFF1] uppercase">
              Parâmetros Operacionais & Criticidade
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Tipo de Serviço */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Tipo de Serviço</label>
              <select
                value={tipoServico}
                onChange={(e) => setTipoServico(e.target.value as any)}
                className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2.5 rounded-[3px] outline-none"
              >
                <option value="CORRETIVA">Corretiva</option>
                <option value="PREVENTIVA">Preventiva</option>
                <option value="MELHORIA">Melhoria</option>
                <option value="EMERGENCIAL">Emergencial</option>
              </select>
            </div>

            {/* Criticidade */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Criticidade</label>
              <select
                value={criticidade}
                onChange={(e) => setCriticidade(e.target.value as Criticidade)}
                className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2.5 rounded-[3px] outline-none font-bold"
              >
                <option value="CRITICA">🔴 Crítica (Impacto em Linha)</option>
                <option value="ALTA">🟠 Alta</option>
                <option value="MEDIA">🟡 Média</option>
                <option value="BAIXA">🟢 Baixa</option>
              </select>
            </div>

            {/* Data da Avaria */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Data da Avaria*</label>
              <input
                type="date"
                required
                value={dataAvaria}
                onChange={(e) => setDataAvaria(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2.5 rounded-[3px] outline-none font-mono"
              />
            </div>

            {/* Previsão Retorno */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Previsão Retorno</label>
              <input
                type="date"
                value={previsaoRetorno}
                onChange={(e) => setPrevisaoRetorno(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2.5 rounded-[3px] outline-none font-mono"
              />
            </div>
          </div>

          {/* Impactos Imediatos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-[3px] bg-[#14181D] border border-[#2C343E] cursor-pointer hover:border-[#E5484D]/60 transition-colors">
              <input
                type="checkbox"
                checked={equipamentoParado}
                onChange={(e) => setEquipamentoParado(e.target.checked)}
                className="w-4 h-4 rounded border-[#2C343E] text-[#E5484D] focus:ring-0"
              />
              <div>
                <p className="text-xs font-bold text-[#FF6B6B]">Equipamento Está Parado Agora</p>
                <p className="text-[10px] text-[#94A3B8]">Atualiza o status do ativo no banco para PARADO e entra no aging.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-[3px] bg-[#14181D] border border-[#2C343E] cursor-pointer hover:border-[#E5484D]/60 transition-colors">
              <input
                type="checkbox"
                checked={parouLinha}
                onChange={(e) => setParouLinha(e.target.checked)}
                className="w-4 h-4 rounded border-[#2C343E] text-[#E5484D] focus:ring-0"
              />
              <div>
                <p className="text-xs font-bold text-[#FF8787]">Parou a Linha de Produção (AMBEV)</p>
                <p className="text-[10px] text-[#94A3B8]">Sinaliza parada de envasamento / processo industrial.</p>
              </div>
            </label>
          </div>
        </div>

        {/* STEP 3: DIAGNÓSTICO & SAP */}
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2C343E] pb-2">
            <span className="w-5 h-5 rounded-full bg-[#F5A623] text-[#14181D] font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h3 className="font-condensed font-bold text-sm text-[#ECEFF1] uppercase">
              Diagnóstico de Campo & Códigos SAP
            </h3>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">
              Descrição da Anomalia / Sintoma Observado*
            </label>
            <textarea
              required
              rows={3}
              value={descricaoAnomalia}
              onChange={(e) => setDescricaoAnomalia(e.target.value)}
              placeholder="Ex: Alarme de alta pressão no display; compressor desarmando por sobrecorrente; ventilador do condensador travado..."
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] p-3 rounded-[3px] outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">
              Causa Provável / Diagnóstico Técnico
            </label>
            <input
              type="text"
              value={causaProvavel}
              onChange={(e) => setCausaProvavel(e.target.value)}
              placeholder="Ex: Queima da bobina do ventilador ou vazamento na válvula Schrader"
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] p-2.5 rounded-[3px] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Nota SAP AMBEV</label>
              <input
                type="text"
                value={notaSap}
                onChange={(e) => setNotaSap(e.target.value)}
                placeholder="Ex: 10045892"
                className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px] font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Ordem SAP AMBEV</label>
              <input
                type="text"
                value={ordemSap}
                onChange={(e) => setOrdemSap(e.target.value)}
                placeholder="Ex: 40019283"
                className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px] font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Ordem Interna Vision</label>
              <input
                type="text"
                value={ordemVision}
                onChange={(e) => setOrdemVision(e.target.value)}
                className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px] font-mono"
              />
            </div>
          </div>
        </div>

        {/* STEP 4: PEÇAS NECESSÁRIAS */}
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2C343E] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#F5A623] text-[#14181D] font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="font-condensed font-bold text-sm text-[#ECEFF1] uppercase">
                Peças & Componentes Necessários ({pecas.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddPeca}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[3px] bg-[#14181D] hover:bg-[#232B35] text-[#F5A623] border border-[#F5A623]/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Peça</span>
            </button>
          </div>

          {pecas.length === 0 ? (
            <p className="text-[11px] text-[#6B7683] italic">
              Nenhuma peça pendente de compra adicionada. Clique em "+ Adicionar Peça" caso o reparo exija componentes novos.
            </p>
          ) : (
            <div className="space-y-3">
              {pecas.map((peca, idx) => (
                <div key={idx} className="p-3 bg-[#14181D] border border-[#2C343E] rounded-[3px] space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => handleRemovePeca(idx)}
                    className="absolute top-2 right-2 text-[#94A3B8] hover:text-[#E5484D]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-6">
                    <div>
                      <label className="block text-[9px] font-mono uppercase text-[#94A3B8]">Descrição da Peça*</label>
                      <input
                        type="text"
                        required
                        value={peca.descricao || ''}
                        onChange={(e) => handlePecaChange(idx, 'descricao', e.target.value)}
                        placeholder="Ex: Motoventilador Condensador"
                        className="w-full bg-[#1C222A] border border-[#2C343E] text-[#ECEFF1] p-1.5 rounded-[2px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono uppercase text-[#94A3B8]">Part Number / Código</label>
                      <input
                        type="text"
                        value={peca.part_number || ''}
                        onChange={(e) => handlePecaChange(idx, 'part_number', e.target.value)}
                        placeholder="SK 3396.282"
                        className="w-full bg-[#1C222A] border border-[#2C343E] text-[#ECEFF1] p-1.5 rounded-[2px] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono uppercase text-[#94A3B8]">Fabricante / Qtd</label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="text"
                          value={peca.fabricante || ''}
                          onChange={(e) => handlePecaChange(idx, 'fabricante', e.target.value)}
                          placeholder="RITTAL"
                          className="bg-[#1C222A] border border-[#2C343E] text-[#ECEFF1] p-1.5 rounded-[2px]"
                        />
                        <input
                          type="number"
                          min={1}
                          value={peca.quantidade || 1}
                          onChange={(e) => handlePecaChange(idx, 'quantidade', Number(e.target.value))}
                          className="bg-[#1C222A] border border-[#2C343E] text-[#ECEFF1] p-1.5 rounded-[2px] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STEP 5: FOTOS */}
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2C343E] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#F5A623] text-[#14181D] font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h3 className="font-condensed font-bold text-sm text-[#ECEFF1] uppercase">
                Fotos de Evidência ({fotos.length})
              </h3>
            </div>
            <label className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[3px] bg-[#14181D] hover:bg-[#232B35] text-[#F5A623] border border-[#F5A623]/40 cursor-pointer">
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

          {fotos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {fotos.map((foto, i) => (
                <div key={i} className="aspect-video bg-[#14181D] border border-[#2C343E] rounded-[3px] overflow-hidden relative group">
                  <img src={foto.url} alt={foto.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded hover:bg-[#E5484D]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-[#2C343E] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-[4px] bg-[#1C222A] border border-[#2C343E] text-[#94A3B8] hover:text-[#ECEFF1]"
          >
            Cancelar
          </button>

          <button
            id="btn-submit-nova-ocorrencia"
            type="submit"
            disabled={loading || !selectedEquip}
            className="px-6 py-3 rounded-[4px] bg-[#E5484D] hover:bg-[#C93B40] text-white font-condensed text-sm font-bold tracking-wider uppercase transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{loading ? 'Registrando Chamado...' : 'Gravar Ocorrência e Gerar Protocolo'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
