import React, { useState, useEffect } from 'react';
import { Building2, X, Check, AlertCircle } from 'lucide-react';
import { Area, UG } from '../../types/database';
import { DataStore } from '../../lib/dataStore';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedArea: Area) => void;
  areaToEdit?: Area | null;
  ugs: UG[];
  defaultUgId?: string;
}

export const AreaModal: React.FC<AreaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  areaToEdit,
  ugs,
  defaultUgId,
}) => {
  const [ugId, setUgId] = useState('');
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (areaToEdit) {
      setUgId(areaToEdit.ug_id || ugs[0]?.id || '');
      setNome(areaToEdit.nome || '');
      setCodigo(areaToEdit.codigo || '');
    } else {
      setUgId(defaultUgId || ugs[0]?.id || '');
      setNome('');
      setCodigo('');
    }
    setError(null);
  }, [areaToEdit, isOpen, ugs, defaultUgId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ugId) {
      setError('Selecione uma Unidade Gerencial (UG) para vincular a Área.');
      return;
    }
    if (!nome.trim()) {
      setError('O nome da Área é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const saved = await DataStore.saveArea({
        id: areaToEdit?.id,
        ug_id: ugId,
        nome: nome.trim(),
        codigo: codigo.trim().toUpperCase() || undefined,
      });

      setIsSubmitting(false);
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Erro ao salvar Área Fabril.');
    }
  };

  return (
    <div
      id="modal-area-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-area-content"
        className="w-full max-w-lg bg-[#1C222A] border border-[#2C343E] rounded-[6px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2C343E] bg-[#14181D]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-condensed font-bold uppercase tracking-wider text-[#ECEFF1]">
                {areaToEdit ? 'Editar Área Fabril' : 'Nova Área Fabril'}
              </h3>
              <p className="text-[11px] font-mono text-[#94A3B8]">Setorização da Planta Industrial AMBEV RJ</p>
            </div>
          </div>
          <button
            id="btn-close-area-modal"
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

          {/* Select UG */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
              Unidade Gerencial (UG) <span className="text-[#E5484D]">*</span>
            </label>
            <select
              id="select-area-ug"
              value={ugId}
              onChange={(e) => setUgId(e.target.value)}
              required
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2 outline-none transition-colors"
            >
              <option value="">Selecione a UG...</option>
              {ugs.map((ug) => (
                <option key={ug.id} value={ug.id}>
                  {ug.codigo} — {ug.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Nome da Área */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                Nome da Área <span className="text-[#E5484D]">*</span>
              </label>
              <input
                id="input-area-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Retornáveis (Vidro)"
                required
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2 outline-none transition-colors"
              />
            </div>

            {/* Código da Área */}
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                Sigla / Código
              </label>
              <input
                id="input-area-codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: EMB-RET"
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs font-mono uppercase rounded-[3px] px-3 py-2 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2C343E]">
            <button
              id="btn-cancel-area"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono font-semibold text-[#94A3B8] hover:text-[#ECEFF1] bg-[#14181D] hover:bg-[#232B35] border border-[#2C343E] rounded-[3px] transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-area"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-black bg-[#38BDF8] hover:bg-[#7DD3FC] rounded-[3px] transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : areaToEdit ? 'Atualizar Área' : 'Cadastrar Área'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
