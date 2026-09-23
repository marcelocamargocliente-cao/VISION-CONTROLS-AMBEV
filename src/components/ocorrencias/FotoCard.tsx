import React, { useState } from 'react';
import { Trash2, X, ZoomIn, Eye } from 'lucide-react';
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
  const [visualizando, setVisualizando] = useState(false);

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
      {/* Card da foto — toque abre em tela cheia */}
      <div className="foto-card-container relative overflow-hidden rounded-lg border border-[#30363D] bg-[#0D1117] group aspect-video flex items-center justify-center">
        <button
          type="button"
          onClick={() => setVisualizando(true)}
          className="absolute inset-0 w-full h-full cursor-zoom-in p-0 border-0 bg-transparent"
          aria-label="Ver foto em tela cheia"
        >
          <img
            src={foto.url}
            alt={foto.nome_arquivo || 'Foto da avaria'}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          {/* Dica visual de que dá para ampliar */}
          <span className="absolute bottom-2 left-2 w-7 h-7 rounded-md bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn size={14} />
          </span>
        </button>

        {/* Ações: visualizar (olhinho) + deletar — sempre visíveis */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setVisualizando(true);
            }}
            title="Ver em tela cheia"
            className="w-9 h-9 rounded-md bg-black/60 hover:bg-black/80 text-white border border-white/10 cursor-pointer flex items-center justify-center shadow-md"
          >
            <Eye size={15} />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmando(true);
              }}
              title="Remover foto"
              className="w-9 h-9 rounded-md bg-[#F85149]/90 hover:bg-[#F85149] text-white border-0 cursor-pointer flex items-center justify-center shadow-md"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox — foto em tela cheia */}
      {visualizando && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 backdrop-blur-sm p-3 sheet-backdrop"
          onClick={() => setVisualizando(false)}
        >
          <button
            type="button"
            onClick={() => setVisualizando(false)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white border-0 flex items-center justify-center z-10"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
          <img
            src={foto.url}
            alt={foto.nome_arquivo || 'Foto da avaria'}
            className="max-w-full max-h-full object-contain rounded-lg select-none"
            onClick={(e) => e.stopPropagation()}
          />
          {foto.nome_arquivo && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-white/70 font-mono bg-black/50 px-3 py-1 rounded-full max-w-[80%] truncate">
              {foto.nome_arquivo}
            </span>
          )}
        </div>
      )}

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

