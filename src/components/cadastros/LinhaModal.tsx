import React, { useState, useEffect } from 'react';
import { Layers, X, Check, AlertCircle } from 'lucide-react';
import { Linha, Area, UG } from '../../types/database';
import { DataStore } from '../../lib/dataStore';

interface LinhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedLinha: Linha) => void;
  linhaToEdit?: Linha | null;
  areas: Area[];
  ugs: UG[];
  defaultAreaId?: string;
}

export const LinhaModal: React.FC<LinhaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  linhaToEdit,
  areas,
  ugs,
  defaultAreaId,
}) => {
  const [areaId, setAreaId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [codigoSap, setCodigoSap] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (linhaToEdit) {
      setAreaId(linhaToEdit.area_id || areas[0]?.id || '');
      setCodigo(linhaToEdit.codigo || '');
      setNome(linhaToEdit.nome || '');
      setCodigoSap(linhaToEdit.codigo_sap || '');
    } else {
      setAreaId(defaultAreaId || areas[0]?.id || '');
      setCodigo('');
      setNome('');
      setCodigoSap('');
    }
    setError(null);
  }, [linhaToEdit, isOpen, areas, defaultAreaId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaId) {
      setError('Selecione uma Área Fabril para vincular a Linha.');
      return;
    }
    if (!codigo.trim()) {
      setError('O código da linha é obrigatório (ex: 501 ou L501).');
      return;
    }
    if (!nome.trim()) {
      setError('O nome da linha é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const saved = await DataStore.saveLinha({
        id: linhaToEdit?.id,
        area_id: areaId,
        codigo: codigo.trim().toUpperCase(),
        nome: nome.trim(),
        codigo_sap: codigoSap.trim().toUpperCase() || undefined,
      });

      setIsSubmitting(false);
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Erro ao salvar Linha de Produção.');
    }
  };

  const getUgForArea = (area: Area) => {
    return ugs.find((u) => u.id === area.ug_id);
  };

  return (
    <div
      id="modal-linha-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-linha-content"
        className="w-full max-w-lg bg-[#1C222A] border border-[#2C343E] rounded-[6px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2C343E] bg-[#14181D]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-[#F5A623]/15 border border-[#F5A623]/30 flex items-center justify-center text-[#F5A623]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-condensed font-bold uppercase tracking-wider text-[#ECEFF1]">
                {linhaToEdit ? 'Editar Linha de Produção' : 'Nova Linha de Produção'}
              </h3>
              <p className="text-[11px] font-mono text-[#94A3B8]">Linhas e Equipamentos AMBEV RJ</p>
            </div>
          </div>
          <button
            id="btn-close-linha-modal"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#ECEFF1] p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#E5484D]/10 border border-[#E5484D]/40 rounded-[4px] flex items-center gap-2 text-xs text-[#FF6B6B]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Área */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
              Área Fabril Pertencente <span className="text-[#E5484D]">*</span>
            </label>
            <select
              id="select-linha-area"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              required
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2 outline-none transition-colors"
            >
              <option value="">Selecione a Área...</option>
              {areas.map((a) => {
                const parentUg = getUgForArea(a);
                return (
                  <option key={a.id} value={a.id}>
                    {parentUg ? `[${parentUg.codigo}] ` : ''}{a.nome}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Código */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                Código da Linha <span className="text-[#E5484D]">*</span>
              </label>
              <input
                id="input-linha-codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: 501 ou L501"
                required
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs font-mono font-bold uppercase rounded-[3px] px-3 py-2 outline-none transition-colors"
              />
            </div>

            {/* Código SAP */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                Código SAP
              </label>
              <input
                id="input-linha-sap"
                type="text"
                value={codigoSap}
                onChange={(e) => setCodigoSap(e.target.value)}
                placeholder="Ex: LIN-501-VID"
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs font-mono uppercase rounded-[3px] px-3 py-2 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
              Nome Completo da Linha <span className="text-[#E5484D]">*</span>
            </label>
            <input
              id="input-linha-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Linha 501 — Vidro Retornável 600ml"
              required
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2 outline-none transition-colors"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2C343E]">
            <button
              id="btn-cancel-linha"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono font-semibold text-[#94A3B8] hover:text-[#ECEFF1] bg-[#14181D] hover:bg-[#232B35] border border-[#2C343E] rounded-[3px] transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-linha"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-black bg-[#F5A623] hover:bg-[#FFB84D] rounded-[3px] transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : linhaToEdit ? 'Atualizar Linha' : 'Cadastrar Linha'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
