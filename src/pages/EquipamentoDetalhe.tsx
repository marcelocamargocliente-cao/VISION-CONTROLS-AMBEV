import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
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
      toast.success('Ficha técnica atualizada com sucesso!');
      setIsEditing(false);
      await loadData();
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
      console.error(e);
    }
  };

  const handleCancelEdit = () => {
    if (equipamento) {
      setFormData(equipamento);
    }
    setIsEditing(false);
  };

  const handleTabChange = (tabId: 'ficha' | 'ocorrencias' | 'manutencoes' | 'fotos' | 'qrcode') => {
    if (isEditing) {
      const confirmar = window.confirm('Há alterações não salvas. Deseja descartar?');
      if (!confirmar) return;
      handleCancelEdit();
    }
    setActiveTab(tabId);
  };

  const Campo = ({ label, field, type = 'text', options = null, isTextArea = false }: { label: string, field: keyof VwEquipamento, type?: string, options?: {value: string, label: string}[] | null, isTextArea?: boolean }) => (
    <div className="form-group">
      <label>
        {label}
      </label>

      {isEditing ? (
        options ? (
          <select
            value={formData[field] as string || ''}
            onChange={e => setFormData(prev => ({...prev, [field]: e.target.value}))}
          >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : isTextArea ? (
          <textarea
            rows={3}
            value={formData[field] as string || ''}
            onChange={e => setFormData(prev => ({...prev, [field]: e.target.value}))}
            style={{ resize: 'vertical' }}
          />
        ) : (
          <input
            type={type}
            value={formData[field] as string || ''}
            onChange={e => setFormData(prev => ({...prev, [field]: e.target.value}))}
          />
        )
      ) : (
        <div className="mt-1 py-2 text-[13px]  border-b border-[#21262D]">
          {formData[field] || <span className="">—</span>}
        </div>
      )}
    </div>
  );

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
      <div className="p-8 text-center   text-xs">
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
    <div className="equipamento-detalhe-page">
      {/* Header Bar */}
      <div className="equipamento-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/equipamentos')}
            className="p-2 rounded-[4px] card hover:bg-[#232B35]  hover: border border-[#2C343E]"
            title="Voltar para a lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <IndustrialTag tag={equipamento.tag} size="lg" />
              <StatusBadge type="equip" status={equipamento.status} size="sm" />
            </div>
            <h2 className="text-xl font-condensed font-bold  tracking-wide uppercase">
              {equipamento.tipo} — {equipamento.marca} {equipamento.modelo}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={handleCancelEdit} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleSaveFicha} className="btn-primary" >
                ✓ Salvar Alterações
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <button onClick={() => setIsEditing(true)} className="btn-secondary">
                  ✏️ Editar Ficha
                </button>
              )}
              {canCreateOccurrence && (
                <button onClick={() => navigate(`/ocorrencias/nova?equipamento_id=${equipamento.id}`)} className="btn-primary" >
                  + Abrir Ocorrência
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="equipamento-tabs flex items-center gap-1 overflow-x-auto">
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
              onClick={() => handleTabChange(tab.id as any)}
              className={`tab-item flex items-center gap-2 ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da aba ativa — ROLA */}
      <div className="equipamento-tab-content space-y-6">
        <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* TAB 1: FICHA TÉCNICA */}
      {activeTab === 'ficha' && (
        <div className="card border border-[#2C343E] rounded-[4px] p-6 space-y-6 shadow-xl">
          {isEditing && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium bg-[var(--blue-dim)] border border-[rgba(47,129,247,0.2)] text-[var(--blue)] mb-4">
              <Edit3 className="w-4 h-4" /> Modo de edição ativo — altere os campos e clique em "Salvar Alterações"
            </div>
          )}

          {/* Identificação & Localização */}
          <div>
            <h3 className="text-xs  font-bold  uppercase tracking-wider mb-3 pb-1 border-b border-[#2C343E]">
              1. Localização Física & Hierarquia Fabril (AMBEV RJ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* UG — sempre mostra */}
              <div>
                <span className="block text-[10px] uppercase text-gray-400">UG — Unidade Gerencial</span>
                <p className="text-sm font-semibold mt-0.5 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/30 rounded font-bold text-[11px]">
                    {equipamento.ug_codigo}
                  </span>
                  <span>{equipamento.ug_nome}</span>
                </p>
              </div>

              {/* Local de Instalação — código + nome juntos */}
              {((equipamento.centro_trabalho_sap || (equipamento as any).codigo_sap) || (equipamento.centro_trabalho_nome || (equipamento as any).maquina)) ? (
                <div>
                  <span className="block text-[10px] uppercase text-gray-400">Local de Instalação</span>
                  <p className="text-sm font-semibold mt-0.5">
                    {[(equipamento.centro_trabalho_sap || (equipamento as any).codigo_sap), (equipamento.centro_trabalho_nome || (equipamento as any).maquina)].filter(Boolean).join(' - ')}
                  </p>
                </div>
              ) : (
                equipamento.linha_nome && (
                  <div>
                    <span className="block text-[10px] uppercase text-gray-400">Local de Instalação</span>
                    <p className="text-sm font-semibold mt-0.5">{equipamento.linha_nome}</p>
                  </div>
                )
              )}

              {/* Tag AMBEV — 4º nível, só mostra se existir */}
              {equipamento.tag_sap && (
                <div>
                  <span className="block text-[10px] uppercase text-gray-400">Tag AMBEV</span>
                  <p className="text-sm font-semibold text-cyan-400 mt-0.5">{equipamento.tag_sap}</p>
                </div>
              )}

              {/* Tag Vision */}
              <div>
                <span className="block text-[10px] uppercase text-gray-400">Tag Vision</span>
                <p className="text-sm font-semibold text-cyan-400 mt-0.5">{equipamento.patrimonio || '—'}</p>
              </div>
            </div>

            {/* Sublocal — só mostra se existir ou em edição */}
            {isEditing ? (
              <div className="mt-4">
                <Campo label="Sublocal / Posição" field="sublocal" />
              </div>
            ) : equipamento.sublocal && (
              <div className="mt-3 text-xs">
                <strong className="text-gray-400">Sublocal / Posição:</strong> {equipamento.sublocal}
              </div>
            )}
          </div>

          {/* Especificações Técnicas (Editáveis) */}
          <div>
            <h3 className="text-xs  font-bold  uppercase tracking-wider mb-3 pb-1 border-b border-[#2C343E]">
              2. Parâmetros Eletromecânicos & Refrigeração
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Campo label="Tipo de Climatizador" field="tipo" />
              <Campo label="Marca / Fabricante" field="marca" />
              <Campo label="Modelo Comercial" field="modelo" />
              <Campo label="Tag AMBEV" field="tag_sap" />
              <Campo label="Tag Vision" field="patrimonio" />
              <Campo label="Nº de Série" field="numero_serie" />
              <Campo label="Capacidade Térmica" field="capacidade" />
              <Campo label="Tensão / Corrente Nominal" field="tensao" />
              <Campo label="Fluido Refrigerante" field="gas_refrigerante" />
              <Campo label="Ano / PPAC" field="ppac" />
              <Campo
                label="Status Operacional"
                field="status"
                options={[
                  {value:'OK', label:'Operando (OK)'},
                  {value:'RESTRICAO', label:'Restrição Operacional'},
                  {value:'PARADO', label:'Parado (Crítico)'},
                  {value:'DESATIVADO', label:'Desativado'},
                ]}
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <h3 className="text-xs  font-bold  uppercase tracking-wider mb-3 pb-1 border-b border-[#2C343E]">
              3. Observações de Campo & Diagnóstico
            </h3>
            <Campo label="Observações de Campo & Diagnóstico" field="observacoes" isTextArea={true} />
          </div>
        </div>
      )}

      {/* TAB 2: OCORRÊNCIAS */}
      {activeTab === 'ocorrencias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-condensed font-bold uppercase tracking-wider ">
              Histórico de Ocorrências do Equipamento ({ocorrencias.length})
            </h3>
            {canCreateOccurrence && (
              <button
                onClick={() => navigate(`/ocorrencias/nova?equipamento_id=${equipamento.id}`)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-[4px] bg-[#E5484D] hover:bg-[#C93B40] "
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
                  className="card border border-[#2C343E] hover:border-[#F5A623] p-4 rounded-[4px] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className=" font-bold text-sm ">#{occ.numero}</span>
                      <span className="text-xs  ">• {occ.tipo_servico}</span>
                      <StatusBadge type="ocorrencia" status={occ.status} size="sm" />
                    </div>
                    <span className="text-[11px]  ">
                      {formatDate(occ.data_avaria)}
                    </span>
                  </div>
                  <p className="text-xs  mb-2">{occ.descricao_anomalia}</p>
                  <div className="flex items-center justify-between text-[11px]   pt-2 border-t border-[#2C343E]">
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
          <h3 className="text-sm font-condensed font-bold uppercase tracking-wider ">
            Ordens SAP & Preventivas Executadas ({manutencoes.length})
          </h3>

          {manutencoes.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="Sem ordens executadas registradas"
              description="Nenhum apontamento histórico de manutenção SAP sincronizado para esta TAG."
            />
          ) : (
            <div className="card border border-[#2C343E] rounded-[4px] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[var(--bg-input)]   uppercase text-[10px] border-b border-[#2C343E]">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Ordem / Nota SAP</th>
                    <th className="py-2.5 px-3">Técnico</th>
                    <th className="py-2.5 px-3">Descrição do Serviço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C343E]/60 ">
                  {manutencoes.map((m) => (
                    <tr key={m.id} className="hover:bg-[#232B35]">
                      <td className="py-3 px-3 ">{formatDate(m.data_execucao)}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-[2px] text-[10px]  bg-[#38BDF8]/15 ">
                          {m.tipo_servico}
                        </span>
                      </td>
                      <td className="py-3 px-3  ">
                        {m.ordem_sap || '-'} / {m.nota_sap || '-'}
                      </td>
                      <td className="py-3 px-3 ">{m.tecnico_nome}</td>
                      <td className="py-3 px-3 ">{m.descricao_servico}</td>
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
            <h3 className="text-sm font-condensed font-bold uppercase tracking-wider ">
              Galeria de Fotos do Equipamento (Bucket `fotos`)
            </h3>
            {canEdit && (
              <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] card hover:bg-[#232B35]  border border-[#F5A623]/40 cursor-pointer transition-colors">
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
                <div key={foto.id} className="card border border-[#2C343E] rounded-[4px] overflow-hidden group">
                  <div className="aspect-video bg-[var(--bg-input)] overflow-hidden">
                    <img
                      src={foto.url}
                      alt={foto.nome_arquivo}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2 text-[10px]   truncate">
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
        <div className="card border border-[#2C343E] rounded-[4px] p-6 text-center max-w-md mx-auto space-y-4 shadow-xl">
          <h3 className="text-sm font-condensed font-bold uppercase tracking-wider ">
            Etiqueta Física com QR Code do Equipamento
          </h3>
          <p className="text-xs ">
            Cole esta etiqueta na carcaça do climatizador. Ao apontar a câmera do smartphone, a ficha técnica e abertura de chamado abrem instantaneamente.
          </p>

          <div className="inline-block p-4 bg-white rounded-[6px] shadow-2xl border-4 border-[#2C343E]">
            <QRCodeSVG
              value={qrUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
            <div className="mt-2 text-center   font-bold text-sm tracking-widest border-t border-gray-300 pt-1">
              TAG {equipamento.tag}
            </div>
            <div className="text-[9px]  ">
              AMBEV RJ • VISION CONTROLS
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-[4px] bg-[#F5A623] hover:bg-[#D98E1A]  font-condensed font-bold uppercase tracking-wider"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

