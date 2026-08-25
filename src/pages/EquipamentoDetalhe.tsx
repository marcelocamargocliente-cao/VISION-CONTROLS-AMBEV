import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Cpu,
  ArrowLeft,
  Edit3,
  Save,
  Check,
  AlertTriangle,
  Wrench,
  Camera,
  QrCode,
  Download,
  Printer,
  Plus,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Shield,
  FileText,
  Upload,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import {
  VwEquipamento,
  Ocorrencia,
  Manutencao,
  Anexo,
  EquipStatus,
} from '../types/database';
import { IndustrialTag } from '../components/common/IndustrialTag';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime } from '../utils/formatters';

export const EquipamentoDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit, canCreateOccurrence, user } = useAuth();

  const [equipamento, setEquipamento] = useState<VwEquipamento | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [fotos, setFotos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'ficha' | 'ocorrencias' | 'manutencoes' | 'fotos' | 'qrcode'>('ficha');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<VwEquipamento>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const eq = await DataStore.getEquipamentoById(id);
      if (eq) {
        setEquipamento(eq);
        setFormData(eq);

        const allOccs = await DataStore.getOcorrencias();
        setOcorrencias(allOccs.filter((o) => o.equipamento_id === eq.id));

        const manuts = await DataStore.getManutencoesByEquipamento(eq.id);
        setManutencoes(manuts);

        const anexos = await DataStore.getAnexos(eq.id);
        setFotos(anexos.filter((a) => a.tipo_anexo === 'FOTO'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSaveFicha = async () => {
    if (!equipamento) return;
    try {
      await DataStore.saveEquipamento({
        ...formData,
        id: equipamento.id,
      });
      setSaveSuccess(true);
      setIsEditing(false);
      await loadData();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!equipamento || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target?.result as string;
      if (url) {
        await DataStore.addAnexo({
          equipamento_id: equipamento.id,
          nome_arquivo: file.name,
          url,
          tipo_anexo: 'FOTO',
          bucket: 'fotos',
        });
        await loadData();
      }
    };
    reader.readAsDataURL(file);
  };

  const qrUrl = window.location.origin + `/equipamentos/${equipamento?.id || id}`;

  if (loading) {
    return (
      <div className="p-8 text-center text-[#94A3B8] font-mono text-xs">
        Carregando ficha técnica do equipamento...
      </div>
    );
  }

  if (!equipamento) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Cpu}
          title="Equipamento não encontrado"
          description="O código ou TAG informada não foi localizado no cadastro industrial."
          actionLabel="Voltar à lista de equipamentos"
          onAction={() => navigate('/equipamentos')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C343E] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/equipamentos')}
            className="p-2 rounded-[4px] bg-[#1C222A] hover:bg-[#232B35] text-[#94A3B8] hover:text-[#ECEFF1] border border-[#2C343E]"
            title="Voltar para a lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <IndustrialTag tag={equipamento.tag} size="lg" />
              <StatusBadge type="equip" status={equipamento.status} size="sm" />
            </div>
            <h2 className="text-xl font-condensed font-bold text-[#ECEFF1] tracking-wide uppercase">
              {equipamento.tipo} — {equipamento.marca} {equipamento.modelo}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreateOccurrence && (
            <button
              onClick={() => navigate(`/ocorrencias/nova?equipamento_id=${equipamento.id}`)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#E5484D] hover:bg-[#C93B40] text-white transition-colors shadow-md uppercase font-condensed"
            >
              <Plus className="w-4 h-4" />
              <span>Abrir Ocorrência</span>
            </button>
          )}

          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#232B35] text-[#F5A623] border border-[#F5A623]/40 transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar Ficha</span>
            </button>
          )}

          {isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 text-xs text-[#94A3B8] hover:text-[#ECEFF1] bg-[#1C222A] border border-[#2C343E] rounded-[4px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFicha}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[4px] bg-[#2ECC71] hover:bg-[#27AE60] text-[#14181D] uppercase font-condensed font-bold"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-[#2ECC71]/15 border border-[#2ECC71]/40 text-[#2ECC71] text-xs rounded-[3px] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Ficha técnica atualizada com sucesso!</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-[#2C343E] overflow-x-auto pb-px">
        {[
          { id: 'ficha', label: 'Ficha Técnica', icon: FileText },
          { id: 'ocorrencias', label: `Ocorrências (${ocorrencias.length})`, icon: AlertTriangle },
          { id: 'manutencoes', label: `Manutenções (${manutencoes.length})`, icon: Wrench },
          { id: 'fotos', label: `Fotos (${fotos.length})`, icon: Camera },
          { id: 'qrcode', label: 'Etiqueta / QR Code', icon: QrCode },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-[#F5A623] text-[#F5A623] bg-[#1C222A]/60'
                  : 'border-transparent text-[#94A3B8] hover:text-[#ECEFF1] hover:bg-[#1C222A]/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FICHA TÉCNICA */}
      {activeTab === 'ficha' && (
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-6 space-y-6 shadow-xl">
          {/* Identificação & Localização */}
          <div>
            <h3 className="text-xs font-mono font-bold text-[#F5A623] uppercase tracking-wider mb-3 pb-1 border-b border-[#2C343E]">
              1. Localização Física & Hierarquia Fabril (AMBEV RJ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-[10px] font-mono uppercase text-[#94A3B8]">Unidade Gerencial</span>
                <p className="text-sm font-semibold text-[#ECEFF1] mt-0.5">{equipamento.ug_codigo} — {equipamento.ug_nome}</p>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase text-[#94A3B8]">Área</span>
                <p className="text-sm font-semibold text-[#ECEFF1] mt-0.5">{equipamento.area_nome}</p>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase text-[#94A3B8]">Linha de Produção</span>
                <p className="text-sm font-semibold text-[#ECEFF1] mt-0.5">{equipamento.linha_nome}</p>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase text-[#94A3B8]">Centro de Trabalho (Máquina)</span>
                <p className="text-sm font-semibold text-[#38BDF8] mt-0.5">{equipamento.centro_trabalho_nome}</p>
              </div>
            </div>
            {equipamento.sublocal && (
              <div className="mt-3 text-xs text-[#94A3B8]">
                <strong className="text-[#ECEFF1]">Sublocal / Posição:</strong> {equipamento.sublocal}
              </div>
            )}
          </div>

          {/* Especificações Técnicas (Editáveis) */}
          <div>
            <h3 className="text-xs font-mono font-bold text-[#F5A623] uppercase tracking-wider mb-3 pb-1 border-b border-[#2C343E]">
              2. Parâmetros Eletromecânicos & Refrigeração
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {/* Tipo */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Tipo de Climatizador</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.tipo || ''}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                  />
                ) : (
                  <p className="font-semibold text-[#ECEFF1]">{equipamento.tipo}</p>
                )}
              </div>

              {/* Marca */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Marca / Fabricante</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.marca || ''}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                  />
                ) : (
                  <p className="font-semibold text-[#ECEFF1]">{equipamento.marca}</p>
                )}
              </div>

              {/* Modelo */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Modelo Comercial</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.modelo || ''}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                  />
                ) : (
                  <p className="font-semibold text-[#ECEFF1]">{equipamento.modelo}</p>
                )}
              </div>

              {/* Tag SAP */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Tag SAP AMBEV</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.tag_sap || ''}
                    onChange={(e) => setFormData({ ...formData, tag_sap: e.target.value })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px] font-mono"
                  />
                ) : (
                  <p className="font-mono text-[#38BDF8]">{equipamento.tag_sap || '-'}</p>
                )}
              </div>

              {/* Patrimônio */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Patrimônio Físico</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.patrimonio || ''}
                    onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px] font-mono"
                  />
                ) : (
                  <p className="font-mono text-[#ECEFF1]">{equipamento.patrimonio || '-'}</p>
                )}
              </div>

              {/* Nº de Série */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Nº de Série</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.numero_serie || ''}
                    onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px] font-mono"
                  />
                ) : (
                  <p className="font-mono text-[#ECEFF1]">{equipamento.numero_serie || '-'}</p>
                )}
              </div>

              {/* Capacidade */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Capacidade Térmica</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.capacidade || ''}
                    onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                  />
                ) : (
                  <p className="font-semibold text-[#ECEFF1]">{equipamento.capacidade || '-'}</p>
                )}
              </div>

              {/* Tensão / Corrente */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Tensão / Corrente Nominal</label>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="230V 1F"
                      value={formData.tensao || ''}
                      onChange={(e) => setFormData({ ...formData, tensao: e.target.value })}
                      className="bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                    />
                    <input
                      type="text"
                      placeholder="5.2A"
                      value={formData.corrente || ''}
                      onChange={(e) => setFormData({ ...formData, corrente: e.target.value })}
                      className="bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                    />
                  </div>
                ) : (
                  <p className="font-mono text-[#ECEFF1]">
                    {equipamento.tensao || '-'} {equipamento.corrente ? `• ${equipamento.corrente}` : ''}
                  </p>
                )}
              </div>

              {/* Gás Refrigerante */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Fluido Refrigerante</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.gas_refrigerante || ''}
                    onChange={(e) => setFormData({ ...formData, gas_refrigerante: e.target.value })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                  />
                ) : (
                  <p className="font-mono text-[#38BDF8] font-bold">{equipamento.gas_refrigerante || '-'}</p>
                )}
              </div>

              {/* Ano Fabricação & PPAC */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Ano / PPAC</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.ppac || ''}
                    onChange={(e) => setFormData({ ...formData, ppac: e.target.value })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                  />
                ) : (
                  <p className="font-mono text-[#ECEFF1]">
                    {equipamento.ano_fabricacao || '-'} • <span className="text-[#F5A623]">{equipamento.ppac || '-'}</span>
                  </p>
                )}
              </div>

              {/* Status Operacional */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#94A3B8] mb-1">Status Operacional</label>
                {isEditing ? (
                  <select
                    value={formData.status || 'OK'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipStatus })}
                    className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-2 rounded-[3px]"
                  >
                    <option value="OK">OK (Operando)</option>
                    <option value="PARADO">PARADO (Crítico)</option>
                    <option value="RESTRICAO">Restrição</option>
                    <option value="DESATIVADO">Desativado</option>
                  </select>
                ) : (
                  <StatusBadge type="equip" status={equipamento.status} size="md" />
                )}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <h3 className="text-xs font-mono font-bold text-[#F5A623] uppercase tracking-wider mb-2 pb-1 border-b border-[#2C343E]">
              3. Observações de Campo & Diagnóstico
            </h3>
            {isEditing ? (
              <textarea
                rows={3}
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] p-3 rounded-[3px] text-xs leading-relaxed"
              />
            ) : (
              <p className="text-xs text-[#ECEFF1] bg-[#14181D] p-3 rounded-[3px] border border-[#2C343E] leading-relaxed">
                {equipamento.observacoes || 'Nenhuma observação cadastrada para este equipamento.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OCORRÊNCIAS */}
      {activeTab === 'ocorrencias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-condensed font-bold uppercase tracking-wider text-[#ECEFF1]">
              Histórico de Ocorrências do Equipamento ({ocorrencias.length})
            </h3>
            {canCreateOccurrence && (
              <button
                onClick={() => navigate(`/ocorrencias/nova?equipamento_id=${equipamento.id}`)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[4px] bg-[#E5484D] hover:bg-[#C93B40] text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Ocorrência</span>
              </button>
            )}
          </div>

          {ocorrencias.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Sem histórico de avarias"
              description="Este equipamento está com histórico 100% limpo, sem ocorrências ativas ou anomalias registradas."
              actionLabel="Registrar Anomalia de Campo"
              onAction={() => navigate(`/ocorrencias/nova?equipamento_id=${equipamento.id}`)}
            />
          ) : (
            <div className="space-y-3">
              {ocorrencias.map((occ) => (
                <div
                  key={occ.id}
                  onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                  className="bg-[#1C222A] border border-[#2C343E] hover:border-[#F5A623] p-4 rounded-[4px] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#F5A623]">#{occ.numero}</span>
                      <span className="text-xs font-mono text-[#94A3B8]">• {occ.tipo_servico}</span>
                      <StatusBadge type="ocorrencia" status={occ.status} size="sm" />
                    </div>
                    <span className="text-[11px] font-mono text-[#94A3B8]">
                      {formatDate(occ.data_avaria)}
                    </span>
                  </div>
                  <p className="text-xs text-[#ECEFF1] mb-2">{occ.descricao_anomalia}</p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] pt-2 border-t border-[#2C343E]">
                    <span>Relatado por: {occ.relatante_nome}</span>
                    <span>Nota SAP: {occ.nota_sap || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANUTENÇÕES EXECUTADAS */}
      {activeTab === 'manutencoes' && (
        <div className="space-y-4">
          <h3 className="text-sm font-condensed font-bold uppercase tracking-wider text-[#ECEFF1]">
            Ordens SAP & Preventivas Executadas ({manutencoes.length})
          </h3>

          {manutencoes.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="Sem ordens executadas registradas"
              description="Nenhum apontamento histórico de manutenção SAP sincronizado para esta TAG."
            />
          ) : (
            <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#14181D] text-[#94A3B8] font-mono uppercase text-[10px] border-b border-[#2C343E]">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Ordem / Nota SAP</th>
                    <th className="py-2.5 px-3">Técnico</th>
                    <th className="py-2.5 px-3">Descrição do Serviço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C343E]/60 text-[#ECEFF1]">
                  {manutencoes.map((m) => (
                    <tr key={m.id} className="hover:bg-[#232B35]">
                      <td className="py-3 px-3 font-mono">{formatDate(m.data_execucao)}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#38BDF8]/15 text-[#38BDF8]">
                          {m.tipo_servico}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#94A3B8]">
                        {m.ordem_sap || '-'} / {m.nota_sap || '-'}
                      </td>
                      <td className="py-3 px-3 text-[#ECEFF1]">{m.tecnico_nome}</td>
                      <td className="py-3 px-3 text-[#ECEFF1]">{m.descricao_servico}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FOTOS */}
      {activeTab === 'fotos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-condensed font-bold uppercase tracking-wider text-[#ECEFF1]">
              Galeria de Fotos do Equipamento (Bucket `fotos`)
            </h3>
            {canEdit && (
              <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#232B35] text-[#F5A623] border border-[#F5A623]/40 cursor-pointer transition-colors">
                <Camera className="w-4 h-4" />
                <span>Upload da Câmera / Arquivo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {fotos.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="Nenhuma foto anexada"
              description="Técnicos em campo podem fotografar placas de identificação, serpentinas ou anomalias direto do celular."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {fotos.map((foto) => (
                <div key={foto.id} className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] overflow-hidden group">
                  <div className="aspect-video bg-[#14181D] overflow-hidden">
                    <img
                      src={foto.url}
                      alt={foto.nome_arquivo}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2 text-[10px] font-mono text-[#94A3B8] truncate">
                    {foto.nome_arquivo}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: QR CODE */}
      {activeTab === 'qrcode' && (
        <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-6 text-center max-w-md mx-auto space-y-4 shadow-xl">
          <h3 className="text-sm font-condensed font-bold uppercase tracking-wider text-[#ECEFF1]">
            Etiqueta Física com QR Code do Equipamento
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Cole esta etiqueta na carcaça do climatizador. Ao apontar a câmera do smartphone, a ficha técnica e abertura de chamado abrem instantaneamente.
          </p>

          <div className="inline-block p-4 bg-white rounded-[6px] shadow-2xl border-4 border-[#2C343E]">
            <QRCodeSVG
              value={qrUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
            <div className="mt-2 text-center text-[#14181D] font-mono font-bold text-sm tracking-widest border-t border-gray-300 pt-1">
              TAG {equipamento.tag}
            </div>
            <div className="text-[9px] text-gray-600 font-mono">
              AMBEV RJ • VISION CONTROLS
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[4px] bg-[#F5A623] hover:bg-[#D98E1A] text-[#14181D] font-condensed font-bold uppercase tracking-wider"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
