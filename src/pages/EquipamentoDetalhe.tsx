import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  Cpu,
  ArrowLeft,
  Edit3,
  AlertTriangle,
  Wrench,
  Camera,
  QrCode,
  Printer,
  Plus,
  FileText,
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
  const { canEdit, canCreateOccurrence } = useAuth();

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
        setOcorrencias(allOccs.filter((o) => o.equipamento_id === eq.id || o.equipamento_id === eq.tag || o.equipamento_id === `equip-${eq.tag}`));

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
      const ug = formData.ug_ref || equipamento.ug_ref || 'N1';
      const loc = formData.localizacao_ref ?? equipamento.localizacao_ref ?? '';
      const localInst = ug ? `${ug} · ${loc}` : loc;

      await DataStore.saveEquipamento({
        tag: formData.tag || equipamento.tag,
        ug_ref: ug,
        area_ref: formData.area_ref ?? equipamento.area_ref,
        localizacao_ref: loc,
        patrimonio_ref: formData.patrimonio_ref ?? equipamento.patrimonio_ref,
        tipo_equipamento: formData.tipo_equipamento ?? equipamento.tipo_equipamento,
        marca: formData.marca ?? equipamento.marca,
        modelo: formData.modelo ?? equipamento.modelo,
        capacidade: formData.capacidade ?? equipamento.capacidade,
        aplicacao: 'INDUSTRIAL',
        status: (formData.status as EquipStatus) ?? equipamento.status,
        local_instalacao: localInst,
        id: equipamento.id,
      });
      toast.success('Ficha técnica atualizada com sucesso!');
      setIsEditing(false);
      await loadData();
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + (e.message || 'Falha ao atualizar'));
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

  const qrUrl = window.location.origin + `/equipamentos/${equipamento?.tag || equipamento?.id || id}`;

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 text-xs">
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

  const tipoNome = equipamento.tipo_equipamento || equipamento.tipo || 'RESFRIADOR DE PAINEL';
  const ugNome = equipamento.ug_ref || 'N1';

  return (
    <div className="equipamento-detalhe-page flex flex-col p-4 gap-4 max-w-7xl mx-auto w-full min-h-screen">
      {/* Header Bar */}
      <div className="equipamento-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-blue-500/20 rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/equipamentos')}
            className="p-2 rounded-md bg-[#0A0E1A] hover:bg-[#1E293B] text-gray-400 hover:text-white border border-blue-500/20 transition-colors"
            title="Voltar para a lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <IndustrialTag tag={equipamento.tag} size="lg" />
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20">
                UG {ugNome}
              </span>
              <StatusBadge type="equip" status={equipamento.status} size="sm" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-wide uppercase">
              {tipoNome} · {equipamento.marca || 'EQUIPAMENTO'} {equipamento.modelo ? `(${equipamento.modelo})` : ''}
            </h2>
            <div className="text-xs text-cyan-400 font-mono mt-0.5">
              {equipamento.localizacao_ref || equipamento.local_instalacao || 'Fábrica AMBEV'} {equipamento.area_ref ? `· Área: ${equipamento.area_ref}` : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-md bg-[#1F2937] hover:bg-[#374151] text-gray-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFicha}
                className="px-4 py-1.5 rounded-md btn-primary-gradient text-white text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
              >
                ✓ Salvar Alterações
              </button>
            </>
          ) : (
            <>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-md bg-[#1E293B] hover:bg-[#334155] text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Ficha</span>
                </button>
              )}
              {canCreateOccurrence && (
                <button
                  onClick={() => navigate(`/ocorrencias/nova?equipamento_id=${equipamento.id}&tag=${equipamento.tag}`)}
                  className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Abrir Ocorrência</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="equipamento-tabs flex items-center gap-1 overflow-x-auto border-b border-blue-500/15 pb-1">
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
              className={`flex items-center gap-2 px-3 py-2 rounded-t-md text-xs font-bold transition-colors uppercase tracking-wider ${
                isActive
                  ? 'bg-[#111827] text-blue-400 border-t-2 border-t-blue-500 border-x border-blue-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="equipamento-tab-content flex-1">
        {/* TAB 1: FICHA TÉCNICA (Campos: Tag Vision, UG, Área, Localização, Patrimônio, Tipo, Marca, Modelo, Capacidade, Aplicação, Status) */}
        {activeTab === 'ficha' && (
          <div className="bg-[#111827] border border-blue-500/20 rounded-lg p-6 space-y-6 shadow-xl">
            {isEditing && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Edit3 className="w-4 h-4" /> Modo de edição ativo — altere os campos abaixo e clique em "Salvar Alterações".
              </div>
            )}

            <div className="border-b border-blue-500/15 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Ficha Técnica do Equipamento
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Especificações e dados cadastrais do ativo na planta industrial
              </p>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                {/* 1. Tag Vision */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Tag Vision*</label>
                  <input
                    type="text"
                    value={formData.tag || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tag: e.target.value }))}
                    className="w-full h-[36px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-3 rounded text-xs outline-none font-mono"
                  />
                </div>

                {/* 2. UG */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">UG*</label>
                  <select
                    value={formData.ug_ref || 'N1'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ug_ref: e.target.value }))}
                    className="w-full h-[36px] bg-[#0A0E1A] border border-blue-500/20 text-white px-3 rounded text-xs outline-none font-mono"
                  >
                    <option value="N1">N1</option>
                    <option value="N2">N2</option>
                    <option value="N3">N3</option>
                    <option value="N4">N4</option>
                  </select>
                </div>

                {/* 3. Área */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Área</label>
                  <input
                    type="text"
                    value={formData.area_ref || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, area_ref: e.target.value }))}
                    placeholder="RETORNÁVEIS, ONE WAY CERVEJA..."
                    className="w-full h-[36px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-3 rounded text-xs outline-none"
                  />
                </div>

                {/* 4. Localização */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Localização</label>
                  <input
                    type="text"
                    value={formData.localizacao_ref || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, localizacao_ref: e.target.value }))}
                    placeholder="Ex: LINHA 542 / EMPACOTADORA 03"
                    className="w-full h-[36px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-3 rounded text-xs outline-none font-mono"
                  />
                </div>

                {/* 5. Patrimônio AMBEV */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Patrimônio AMBEV</label>
                  <input
                    type="text"
                    value={formData.patrimonio_ref || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, patrimonio_ref: e.target.value }))}
                    placeholder="Ex: 84"
                    className="w-full h-[36px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-3 rounded text-xs outline-none font-mono"
                  />
                </div>

                {/* 6. Tipo */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Tipo</label>
                  <input
                    type="text"
                    value={formData.tipo_equipamento || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tipo_equipamento: e.target.value }))}
                    placeholder="RESFRIADOR DE PAINEL, SPLITÃO..."
                    className="w-full h-[36px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-3 rounded text-xs outline-none"
                  />
                </div>

                {/* 7. Marca */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Marca</label>
                  <input
                    type="text"
                    value={formData.marca || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, marca: e.target.value }))}
                    placeholder="RITTAL, KRONES, YORK..."
                    className="w-full h-[36px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-3 rounded text-xs outline-none"
                  />
                </div>

                {/* 8. Modelo */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Modelo</label>
                  <input
                    type="text"
                    value={formData.modelo || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, modelo: e.target.value }))}
                    placeholder="Ex: SK 3304.500"
                    className="w-full h-[36px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-3 rounded text-xs outline-none font-mono"
                  />
                </div>

                {/* 9. Capacidade */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Capacidade</label>
                  <input
                    type="text"
                    value={formData.capacidade || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, capacidade: e.target.value }))}
                    placeholder="Ex: 1500W, 36.000 BTU'S..."
                    className="w-full h-[36px] bg-[#0A0E1A] border border-blue-500/20 focus:border-blue-400 text-white px-3 rounded text-xs outline-none font-mono"
                  />
                </div>

                {/* 10. Aplicação (sempre INDUSTRIAL) */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Aplicação</label>
                  <input
                    type="text"
                    disabled
                    value="INDUSTRIAL"
                    className="w-full h-[36px] bg-[#0A0E1A]/60 border border-blue-500/10 text-gray-400 px-3 rounded text-xs outline-none cursor-not-allowed uppercase font-semibold"
                  />
                </div>

                {/* 11. Status */}
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Status</label>
                  <select
                    value={formData.status || 'OK'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as EquipStatus }))}
                    className="w-full h-[36px] bg-[#0A0E1A] border border-blue-500/20 text-white px-3 rounded text-xs outline-none"
                  >
                    <option value="OK">OK</option>
                    <option value="PARADO">PARADO</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* 1. Tag Vision */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Tag Vision</span>
                  <p className="text-base font-bold text-blue-400 font-mono mt-1">
                    {equipamento.tag}
                  </p>
                </div>

                {/* 2. UG */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">UG</span>
                  <p className="text-base font-bold text-blue-300 font-mono mt-1">
                    {equipamento.ug_ref || 'N1'}
                  </p>
                </div>

                {/* 3. Área */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Área</span>
                  <p className="text-sm font-semibold text-gray-200 mt-1">
                    {equipamento.area_ref || '—'}
                  </p>
                </div>

                {/* 4. Localização */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10 sm:col-span-2 lg:col-span-1">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Localização</span>
                  <p className="text-sm font-semibold text-cyan-400 font-mono mt-1">
                    {equipamento.localizacao_ref || equipamento.local_instalacao || '—'}
                  </p>
                </div>

                {/* 5. Patrimônio */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Patrimônio</span>
                  <p className="text-sm font-mono text-gray-200 mt-1">
                    {equipamento.patrimonio_ref || '—'}
                  </p>
                </div>

                {/* 6. Tipo */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Tipo</span>
                  <p className="text-sm font-semibold text-white mt-1">
                    {equipamento.tipo_equipamento || equipamento.tipo || '—'}
                  </p>
                </div>

                {/* 7. Marca */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Marca</span>
                  <p className="text-sm font-semibold text-[#F5A623] mt-1">
                    {equipamento.marca || '—'}
                  </p>
                </div>

                {/* 8. Modelo */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Modelo</span>
                  <p className="text-sm font-mono text-gray-200 mt-1">
                    {equipamento.modelo || '—'}
                  </p>
                </div>

                {/* 9. Capacidade */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Capacidade</span>
                  <p className="text-sm font-mono text-emerald-400 font-medium mt-1">
                    {equipamento.capacidade || '—'}
                  </p>
                </div>

                {/* 10. Aplicação */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Aplicação</span>
                  <p className="text-sm font-semibold text-gray-300 mt-1 uppercase">
                    {equipamento.aplicacao || 'INDUSTRIAL'}
                  </p>
                </div>

                {/* 11. Status */}
                <div className="p-3.5 bg-[#0A0E1A] rounded-lg border border-blue-500/10">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-wider">Status</span>
                  <div className="mt-1">
                    <StatusBadge type="equip" status={equipamento.status} size="md" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OCORRÊNCIAS */}
        {activeTab === 'ocorrencias' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Histórico de Ocorrências do Equipamento ({ocorrencias.length})
              </h3>
              {canCreateOccurrence && (
                <button
                  onClick={() => navigate(`/ocorrencias/nova?equipamento_id=${equipamento.id}&tag=${equipamento.tag}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-red-600 hover:bg-red-500 text-white transition-colors"
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
                onAction={() => navigate(`/ocorrencias/nova?equipamento_id=${equipamento.id}&tag=${equipamento.tag}`)}
              />
            ) : (
              <div className="space-y-3">
                {ocorrencias.map((occ) => (
                  <div
                    key={occ.id}
                    onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                    className="p-3.5 rounded-lg bg-[#111827] border border-blue-500/20 hover:border-blue-500/40 cursor-pointer transition-all hover:bg-[#1E293B]"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400">{occ.codigo}</span>
                        <StatusBadge type="ocorrencia" status={occ.status} size="xs" />
                      </div>
                      <span className="text-[10px] text-gray-400">{formatDateTime(occ.created_at)}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">{occ.tipo_falha}</h4>
                    <p className="text-[11px] text-gray-400 line-clamp-2">{occ.descricao_falha}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANUTENÇÕES */}
        {activeTab === 'manutencoes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Histórico de Ordens e Serviços Executados ({manutencoes.length})
            </h3>
            {manutencoes.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Nenhuma manutenção registrada"
                description="Histórico de preventivas e corretivas executadas pela equipe de refrigeração."
              />
            ) : (
              <div className="bg-[#111827] border border-blue-500/20 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#1a2235] text-gray-400 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Ordem / Nota</th>
                      <th className="py-2.5 px-3">Técnico</th>
                      <th className="py-2.5 px-3">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-gray-200">
                    {manutencoes.map((m) => (
                      <tr key={m.id} className="hover:bg-blue-500/[0.05]">
                        <td className="py-2.5 px-3 whitespace-nowrap">{formatDate(m.data_execucao)}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold">
                            {m.tipo_servico}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-400">
                          {m.ordem_sap || '-'} / {m.nota_sap || '-'}
                        </td>
                        <td className="py-2.5 px-3">{m.tecnico_nome}</td>
                        <td className="py-2.5 px-3 text-gray-300">{m.descricao_servico}</td>
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Galeria de Fotos do Equipamento ({fotos.length})
              </h3>
              {canEdit && (
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#1E293B] hover:bg-[#334155] text-gray-200 border border-blue-500/30 cursor-pointer transition-colors">
                  <Camera className="w-4 h-4 text-blue-400" />
                  <span>Upload de Foto</span>
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
                description="Técnicos em campo podem fotografar placas de identificação ou serpentinas direto do celular."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {fotos.map((foto) => (
                  <div key={foto.id} className="bg-[#111827] border border-blue-500/20 rounded-lg overflow-hidden group">
                    <div className="aspect-video bg-[#0A0E1A] overflow-hidden">
                      <img
                        src={foto.url}
                        alt={foto.nome_arquivo}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2 text-[10px] text-gray-400 truncate">
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
          <div className="bg-[#111827] border border-blue-500/20 rounded-lg p-6 text-center max-w-md mx-auto space-y-4 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Etiqueta com QR Code do Ativo
            </h3>
            <p className="text-xs text-gray-400">
              Cole esta etiqueta na carcaça do climatizador. Ao apontar a câmera do smartphone, a ficha técnica abre instantaneamente.
            </p>

            <div className="inline-block p-4 bg-white rounded-lg shadow-2xl border-4 border-blue-500/30">
              <QRCodeSVG
                value={qrUrl}
                size={180}
                level="H"
                includeMargin={true}
              />
              <div className="mt-2 text-center text-black font-bold text-sm tracking-widest border-t border-gray-300 pt-1 font-mono">
                TAG {equipamento.tag}
              </div>
              <div className="text-[10px] text-gray-700 font-mono font-semibold">
                UG {ugNome} · {equipamento.localizacao_ref || equipamento.local_instalacao || 'AMBEV'}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-[#F5A623] hover:bg-[#D98E1A] text-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Etiqueta</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
