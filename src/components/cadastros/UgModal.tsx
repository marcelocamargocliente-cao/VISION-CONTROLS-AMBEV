import React, { useState, useEffect } from 'react';
import { Layers, X, Check, AlertCircle } from 'lucide-react';
import { UG } from '../../types/database';
import { DataStore } from '../../lib/dataStore';

interface UgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedUg: UG) => void;
  ugToEdit?: UG | null;
  existingCount?: number;
}

export const UgModal: React.FC<UgModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ugToEdit,
  existingCount = 4,
}) => {
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ordem, setOrdem] = useState<number>(existingCount + 1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ugToEdit) {
      setCodigo(ugToEdit.codigo || '');
      setNome(ugToEdit.nome || '');
      setDescricao(ugToEdit.descricao || '');
      setOrdem(ugToEdit.ordem !== undefined ? ugToEdit.ordem : existingCount + 1);
    } else {
      setCodigo(`N${existingCount + 1}`);
      setNome(`UG N${existingCount + 1} — `);
      setDescricao('');
      setOrdem(existingCount + 1);
    }
    setError(null);
  }, [ugToEdit, isOpen, existingCount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) {
      setError('O código da UG é obrigatório (ex: N5).');
      return;
    }
    if (!nome.trim()) {
      setError('O nome da UG é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const saved = await DataStore.saveUG({
        id: ugToEdit?.id,
        codigo: codigo.trim().toUpperCase(),
        nome: nome.trim(),
        descricao: descricao.trim(),
        ordem: Number(ordem) || existingCount + 1,
      });

      setIsSubmitting(false);
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Erro ao salvar Unidade Gerencial.');
    }
  };

  return (
    <div
      id="modal-ug-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-ug-content"
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
                {ugToEdit ? 'Editar Unidade Gerencial' : 'Nova Unidade Gerencial (UG)'}
              </h3>
              <p className="text-[11px] font-mono text-[#94A3B8]">Hierarquia AMBEV RJ</p>
            </div>
          </div>
          <button
            id="btn-close-ug-modal"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Código */}
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                Código <span className="text-[#E5484D]">*</span>
              </label>
              <input
                id="input-ug-codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: N5"
                maxLength={6}
                required
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs font-mono font-bold rounded-[3px] px-3 py-2 outline-none uppercase transition-colors"
              />
            </div>

            {/* Ordem de Exibição */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
                Ordem de Exibição <span className="text-[#E5484D]">*</span>
              </label>
              <input
                id="input-ug-ordem"
                type="number"
                min={1}
                max={99}
                value={ordem}
                onChange={(e) => setOrdem(parseInt(e.target.value) || 1)}
                required
                className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs font-mono rounded-[3px] px-3 py-2 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
              Nome da UG <span className="text-[#E5484D]">*</span>
            </label>
            <input
              id="input-ug-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: UG N5 — Nova Expansão Cervejaria"
              required
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2 outline-none transition-colors"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-[#CBD5E1] mb-1">
              Descrição Operacional
            </label>
            <textarea
              id="input-ug-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição dos processos fabris abrigados nesta unidade gerencial..."
              rows={3}
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] px-3 py-2 outline-none resize-none transition-colors"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2C343E]">
            <button
              id="btn-cancel-ug"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono font-semibold text-[#94A3B8] hover:text-[#ECEFF1] bg-[#14181D] hover:bg-[#232B35] border border-[#2C343E] rounded-[3px] transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-ug"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-black bg-[#F5A623] hover:bg-[#FFB84D] rounded-[3px] transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : ugToEdit ? 'Atualizar UG' : 'Cadastrar UG'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
