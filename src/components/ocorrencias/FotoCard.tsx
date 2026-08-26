import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Anexo } from '../../types/database';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { DataStore } from '../../lib/dataStore';

interface FotoCardProps {
  foto: Anexo;
  canDelete: boolean;
  onDeletada: (idDeletado: string) => void;
}

export const FotoCard: React.FC<FotoCardProps> = ({ foto, canDelete, onDeletada }) => {
  const [confirmando, setConfirmando] = useState(false);
  const [deletando, setDeletando] = useState(false);

  const deletar = async () => {
    setDeletando(true);
    try {
      if (isSupabaseConfigured) {
        // 1. Remove do Supabase Storage se houver caminho definido
        const path = (foto as any).path || foto.nome_arquivo;
        if (path) {
          try {
            await supabase.storage.from('fotos').remove([path]);
          } catch (storageErr) {
            console.warn('Storage delete non-critical error:', storageErr);
          }
        }

        // 2. Remove da tabela anexos do Supabase
        try {
          await supabase.from('anexos').delete().eq('id', foto.id);
        } catch (dbErr) {
          console.warn('Supabase DB delete error:', dbErr);
        }
      }

      // 3. Remove do DataStore local / persistência
      await DataStore.deleteAnexo(foto.id);

      toast.success('Foto removida');
      onDeletada(foto.id);
    } catch (err) {
      toast.error('Erro ao remover foto');
      console.error('Erro ao excluir foto:', err);
    } finally {
      setDeletando(false);
      setConfirmando(false);
    }
  };

  return (
    <>
      {/* Card da foto com botão hover */}
      <div className="foto-card-container relative overflow-hidden rounded-lg border border-[#30363D] bg-[#0D1117] group aspect-video flex items-center justify-center">
        <img
          src={foto.url}
          alt={foto.nome_arquivo || 'Foto da avaria'}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />

        {/* Botão deletar — aparece no hover e sempre em mobile para roles permitidas */}
        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmando(true);
            }}
            title="Remover foto"
            className="foto-delete-btn absolute top-2 right-2 w-7 h-7 rounded-md bg-[#F85149]/90 hover:bg-[#F85149] text-white border-0 cursor-pointer flex items-center justify-center opacity-0 transition-opacity duration-150 z-10 shadow-md"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Modal de confirmação */}
      {confirmando && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !deletando && setConfirmando(false)}
        >
          <div
            className="bg-[#161B22] border border-[#30363D] rounded-xl p-6 w-full max-w-[320px] text-center shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-full bg-[#F85149]/15 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} className="text-[#F85149]" />
            </div>

            <h3 className="text-sm font-bold text-[#E6EDF3] mb-2">
              Remover foto?
            </h3>

            <p className="text-xs text-[#8B949E] mb-5 leading-relaxed">
              Deseja excluir esta foto? Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                disabled={deletando}
                className="btn-secondary flex-1 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={deletar}
                disabled={deletando}
                className="flex-1 bg-[#F85149] hover:bg-[#da3633] text-white border-0 rounded-lg py-2 text-xs font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {deletando ? 'Removendo...' : 'Sim, remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

