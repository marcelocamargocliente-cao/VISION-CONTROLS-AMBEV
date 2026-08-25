import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity } from 'lucide-react';
import { VwStatusPorLinha } from '../../types/database';

interface LinhaProgressBarProps {
  linhas: VwStatusPorLinha[];
}

export const LinhaProgressBar: React.FC<LinhaProgressBarProps> = ({ linhas }) => {
  const navigate = useNavigate();

  // Mostrar no máximo 5 linhas de produção distribuídas no flex disponível
  const displayLinhas =
    linhas && linhas.length > 0
      ? linhas.slice(0, 5)
      : [
          { linha_id: 'l1', linha_nome: 'Linha 506 (Retornáveis)', total: 10, ok: 8, parado: 2, restricao: 0 },
          { linha_id: 'l2', linha_nome: 'Linha 503 (Latas)', total: 12, ok: 11, parado: 1, restricao: 0 },
          { linha_id: 'l3', linha_nome: 'Linha 542 (Long Neck)', total: 8, ok: 8, parado: 0, restricao: 0 },
          { linha_id: 'l4', linha_nome: 'Linha 501 (Barril)', total: 6, ok: 6, parado: 0, restricao: 0 },
        ];

  return (
    <div className="bg-[#111827] border border-blue-500/15 rounded-lg p-3 flex flex-col justify-between shadow-lg h-full w-full overflow-hidden">
      {/* Título: 32px shrink-0 */}
      <div className="flex items-center justify-between gap-2 shrink-0 h-[32px] mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[12px] font-bold text-[#F9FAFB] truncate leading-tight">
              Status por Linha
            </h3>
            <p className="text-[10px] text-gray-400 truncate leading-none">
              Disponibilidade operacional
            </p>
          </div>
        </div>
      </div>

      {/* List of lines distributed evenly: flex-1 min-h-0 */}
      <div className="flex-1 min-h-0 flex flex-col justify-around py-0.5 space-y-1">
        {displayLinhas.map((l) => {
          const pct = l.total > 0 ? Math.round(((l.ok + (l.restricao || 0)) / l.total) * 100) : 100;
          const is100 = pct >= 100;
          const isWarn = pct >= 80 && pct < 100;

          const barColor = is100
            ? 'bg-emerald-500'
            : isWarn
            ? 'bg-amber-500'
            : 'bg-red-500';

          const badgeBg = is100
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : isWarn
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            : 'bg-red-500/15 text-red-400 border-red-500/30';

          return (
            <div key={l.linha_id} className="group">
              <div className="flex items-center justify-between text-[11px] mb-0.5 leading-none">
                <span className="font-medium text-gray-300 group-hover:text-blue-400 transition-colors truncate">
                  {l.linha_nome}
                </span>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {l.parado > 0 && (
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-bold leading-none">
                      {l.parado}p
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-mono font-bold px-1 py-0.5 rounded border leading-none ${badgeBg}`}
                  >
                    {pct}% OK
                  </span>
                </div>
              </div>

              {/* Progress bar: 6px height */}
              <div className="w-full h-[6px] rounded-full bg-[#0A0E1A] overflow-hidden border border-white/[0.04]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão "Ver todos": 28px fixo no bottom (shrink-0) */}
      <div className="pt-1 border-t border-white/[0.06] shrink-0 h-[28px] flex items-center">
        <button
          onClick={() => navigate('/equipamentos')}
          className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 py-0.5 rounded hover:bg-blue-500/10 transition-all cursor-pointer leading-none"
        >
          <span>Ver todos os equipamentos</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
