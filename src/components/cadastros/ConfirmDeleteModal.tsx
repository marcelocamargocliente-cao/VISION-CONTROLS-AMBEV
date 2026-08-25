import React from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  errorMessage?: string | null;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  errorMessage,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-confirm-delete-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-confirm-delete-content"
        className="w-full max-w-md bg-[#1C222A] border border-[#2C343E] rounded-[6px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2C343E] bg-[#14181D]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-[#E5484D]/15 border border-[#E5484D]/30 flex items-center justify-center text-[#FF6B6B]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-condensed font-bold uppercase tracking-wider text-[#ECEFF1]">
                {title}
              </h3>
              <p className="text-[11px] font-mono text-[#94A3B8]">Confirmação de Ação Destrutiva</p>
            </div>
          </div>
          <button
            id="btn-close-delete-modal"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#ECEFF1] p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-[#14181D] border border-[#2C343E] rounded-[4px]">
            <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1">Item Selecionado:</span>
            <p className="text-sm font-semibold text-[#ECEFF1] break-words">{itemName}</p>
          </div>

          {errorMessage ? (
            <div className="p-3 bg-[#E5484D]/10 border border-[#E5484D]/40 rounded-[4px] flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#FF6B6B] shrink-0 mt-0.5" />
              <div className="text-xs text-[#FF8787] space-y-1">
                <span className="font-bold uppercase tracking-wide block">Exclusão Bloqueada</span>
                <p>{errorMessage}</p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#CBD5E1] space-y-2">
              <p className="font-semibold text-[#FF8787]">
                Tem certeza? Esta ação não pode ser desfeita.
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                O registro será excluído permanentemente da estrutura do sistema.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-[#2C343E] bg-[#14181D]">
          <button
            id="btn-cancel-delete"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-mono font-semibold text-[#94A3B8] hover:text-[#ECEFF1] bg-[#1C222A] hover:bg-[#232B35] border border-[#2C343E] rounded-[3px] transition-colors"
          >
            {errorMessage ? 'Fechar' : 'Cancelar'}
          </button>

          {!errorMessage && (
            <button
              id="btn-confirm-delete"
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#E5484D] hover:bg-[#DC2626] rounded-[3px] transition-colors flex items-center gap-1.5 shadow-md"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
