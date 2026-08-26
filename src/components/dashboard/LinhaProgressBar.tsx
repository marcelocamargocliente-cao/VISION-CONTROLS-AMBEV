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
    <div className="bg-[#13181F] border border-[#21262D] rounded-xl p-3 flex flex-col justify-between h-full w-full overflow-hidden select-none">
      {/* Título: 32px shrink-0 */}
      <div className="flex items-center justify-between gap-2 shrink-0 h-[32px] mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Activity className="w-4 h-4 text-[#8B949E] shrink-0" />
          <div className="min-w-0">
            <h3 className="text-[12px] font-bold text-[#E6EDF3] tracking-tight truncate leading-tight">
              Status por Linha
            </h3>
            <p className="text-[10px] text-[#8B949E] truncate leading-none">
              Disponibilidade operacional
            </p>
          </div>
        </div>
      </div>

      {/* List of lines distributed evenly: flex-1 min-h-0 */}
      <div className="flex-1 min-h-0 flex flex-col justify-around py-0.5 space-y-1.5">
        {displayLinhas.map((l) => {
          const pct = l.total > 0 ? Math.round(((l.ok + (l.restricao || 0)) / l.total) * 100) : 100;
          const is100 = pct >= 100;
          const hasParado = (l.parado || 0) > 0;

          return (
            <div key={l.linha_id} className="group">
              <div className="flex items-center justify-between text-[11px] mb-1 leading-none font-body">
                <span className="font-medium text-[#E6EDF3] group-hover:text-[#58A6FF] transition-colors truncate">
                  {l.linha_nome}
                </span>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {hasParado && (
                    <span className="linha-badge-parado">
                      {l.parado} parado{l.parado > 1 ? 's' : ''}
                    </span>
                  )}
                  <span
                    className={`linha-pct ${is100 ? 'full' : ''}`}
                  >
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Progress bar: 3px height */}
              <div className="w-full h-[3px] rounded-[2px] bg-[#1A1F28] overflow-hidden">
                <div
                  className={`h-full rounded-[2px] transition-all duration-500 ${
                    is100 ? 'bg-[#3FB950]' : hasParado ? 'bg-[#D29922]' : 'bg-[#484F58]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão "Ver todos": 28px fixo no bottom (shrink-0) */}
      <div className="pt-1.5 border-t border-[#21262D] shrink-0 h-[28px] flex items-center">
        <button
          onClick={() => navigate('/equipamentos')}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#8B949E] hover:text-[#58A6FF] py-0.5 rounded transition-all cursor-pointer leading-none"
        >
          <span>Ver todos os equipamentos</span>
          <ArrowRight className="w-3 h-3 text-[#484F58] hover:text-[#58A6FF]" />
        </button>
      </div>
    </div>
  );
};
