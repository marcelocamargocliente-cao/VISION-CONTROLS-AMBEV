import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { VwStatusPorLinha } from '../../types/database';

interface LinhaProgressBarProps {
  linhas: VwStatusPorLinha[];
}

export const LinhaProgressBar: React.FC<LinhaProgressBarProps> = ({ linhas }) => {
  const navigate = useNavigate();

  const display =
    linhas && linhas.length > 0
      ? linhas.slice(0, 8)
      : [
          { linha_id: 'ret', linha_nome: 'RETORNÁVEIS', total: 60, ok: 38, parado: 22, restricao: 0 },
          { linha_id: 'ow',  linha_nome: 'ONE WAY CERVEJA', total: 86, ok: 79, parado: 7,  restricao: 0 },
          { linha_id: 'owref', linha_nome: 'ONE WAY REFRI', total: 15, ok: 13, parado: 2,  restricao: 0 },
          { linha_id: 'proc', linha_nome: 'PROCESSOS CERVEJA', total: 23, ok: 22, parado: 1, restricao: 0 },
          { linha_id: 'chopp', linha_nome: 'ÁREA DO CHOPP', total: 1,  ok: 0,  parado: 1,  restricao: 0 },
        ];

  const maxTotal = Math.max(...display.map((l) => l.total), 1);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 flex flex-col h-full w-full overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 shrink-0 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <BarChart3 className="w-4 h-4 text-[#6B7280] shrink-0" />
          <div className="min-w-0">
            <h3 className="text-[12px] font-bold text-[#1A1A1A] tracking-tight truncate leading-tight">
              Distribuição de Status por Área
            </h3>
            <p className="text-[10px] text-[#6B7280] truncate leading-none">
              Operacional (OK) vs Indisponível (NOK)
            </p>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-3 shrink-0 mb-2">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#3FB950]" />
          <span className="text-[9px] text-[#6B7280] uppercase font-bold tracking-wider">Operacional (OK)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#F85149]" />
          <span className="text-[9px] text-[#6B7280] uppercase font-bold tracking-wider">Indisponível (NOK)</span>
        </div>
      </div>

      {/* Barras horizontais duplas */}
      <div className="flex-1 min-h-0 flex flex-col justify-around gap-1">
        {display.map((l) => {
          const nok = l.parado + (l.restricao || 0);
          const pctOk  = maxTotal > 0 ? (l.ok  / maxTotal) * 100 : 0;
          const pctNok = maxTotal > 0 ? (nok   / maxTotal) * 100 : 0;
          return (
            <div key={l.linha_id} className="space-y-0.5">
              <div className="flex items-center justify-between text-[9px] leading-none mb-0.5">
                <span className="font-semibold text-[#374151] truncate uppercase tracking-wide text-[9px]">{l.linha_nome}</span>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span className="text-[#3FB950] font-mono font-bold">{l.ok}</span>
                  {nok > 0 && <span className="text-[#F85149] font-mono font-bold">/ {nok}</span>}
                </div>
              </div>
              {/* OK bar */}
              <div className="w-full h-[6px] rounded-sm bg-white overflow-hidden">
                <div className="h-full rounded-sm bg-[#3FB950] transition-all duration-500"
                  style={{ width: `${pctOk}%` }} />
              </div>
              {/* NOK bar */}
              {nok > 0 && (
                <div className="w-full h-[6px] rounded-sm bg-white overflow-hidden">
                  <div className="h-full rounded-sm bg-[#F85149] transition-all duration-500"
                    style={{ width: `${pctNok}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-1.5 border-t border-[#E5E7EB] shrink-0 mt-1">
        <button onClick={() => navigate('/equipamentos')}
          className="w-full flex items-center justify-center gap-1.5 text-[10px] font-semibold text-[#6B7280] hover:text-[#1A1A1A] py-0.5 rounded transition-all cursor-pointer leading-none">
          <span>Ver todos os equipamentos</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
