import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { DataStore } from '../lib/dataStore';
import { PecaPendente, VwEquipamento, Ocorrencia } from '../types/database';
import { IndustrialTag } from '../components/common/IndustrialTag';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export const PecasPendentes: React.FC = () => {
  const navigate = useNavigate();
  const { canEdit } = useAuth();

  const [pecas, setPecas] = useState<PecaPendente[]>([]);
  const [equipsMap, setEquipsMap] = useState<Map<string, VwEquipamento>>(new Map());
  const [occsMap, setOccsMap] = useState<Map<string, Ocorrencia>>(new Map());
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fornecedorFilter, setFornecedorFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pcs, eqs, occs] = await Promise.all([
        DataStore.getPecas(),
        DataStore.getVwEquipamentos(),
        DataStore.getOcorrencias(),
      ]);
      setPecas(pcs);
      setEquipsMap(new Map(eqs.map((e) => [e.id, e])));
      setOccsMap(new Map(occs.map((o) => [o.id, o])));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdatePecaStatus = async (pecaId: string, newStatus: any) => {
    try {
      await DataStore.savePeca({ id: pecaId, status: newStatus });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredPecas = pecas.filter((p) => {
    const term = searchTerm.toLowerCase();
    const eq = equipsMap.get(p.equipamento_id);
    const matchesSearch =
      !term ||
      p.descricao.toLowerCase().includes(term) ||
      (p.part_number && p.part_number.toLowerCase().includes(term)) ||
      (p.fabricante && p.fabricante.toLowerCase().includes(term)) ||
      (p.fornecedor && p.fornecedor.toLowerCase().includes(term)) ||
      (eq && eq.tag.toLowerCase().includes(term));

    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesForn = !fornecedorFilter || p.fornecedor === fornecedorFilter;

    return matchesSearch && matchesStatus && matchesForn;
  });

  const distinctFornecedores = Array.from(new Set(pecas.map((p) => p.fornecedor))).filter(Boolean);

  const totalValorEstimado = filteredPecas.reduce((acc, p) => acc + (p.valor_unitario || 0) * p.quantidade, 0);

  const handleExportCsv = () => {
    if (filteredPecas.length === 0) return;
    const headers = [
      'ID',
      'Descrição',
      'Part Number',
      'Fabricante',
      'Quantidade',
      'TAG Equipamento',
      'Localização',
      'Fornecedor',
      'Valor Unitário',
      'Valor Total',
      'Status',
      'Previsão Entrega',
    ];

    const rows = filteredPecas.map((p) => {
      const eq = equipsMap.get(p.equipamento_id);
      return [
        p.id,
        `"${p.descricao}"`,
        `"${p.part_number || ''}"`,
        `"${p.fabricante || ''}"`,
        p.quantidade,
        eq ? eq.tag : '',
        eq ? `"${eq.linha_nome}"` : '',
        `"${p.fornecedor || ''}"`,
        p.valor_unitario || 0,
        (p.valor_unitario || 0) * p.quantidade,
        p.status,
        p.previsao_entrega ? formatDate(p.previsao_entrega) : '',
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IVCA_Lista_Compras_Pecas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-widest text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-[2px] border border-[#F5A623]/30 uppercase font-bold">
              Suprimentos & Compras Vision
            </span>
            <span className="text-[11px] font-mono text-[#6B7683]">•</span>
            <span className="text-[11px] font-mono text-[#38BDF8]">
              TOTAL ESTIMADO: {formatCurrency(totalValorEstimado)}
            </span>
          </div>
          <h2 className="text-2xl font-condensed font-bold text-[#ECEFF1] tracking-wide uppercase">
            Lista de Peças e Componentes Pendentes
          </h2>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#232B35] text-[#ECEFF1] border border-[#2C343E] transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-[#F5A623]" />
          <span>Exportar Ordem de Compra (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] p-3 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição da peça, part number, fabricante, fornecedor ou TAG..."
              className="w-full bg-[#14181D] border border-[#2C343E] focus:border-[#F5A623] text-[#ECEFF1] text-xs rounded-[3px] pl-9 pr-3 py-2 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] text-xs rounded-[3px] px-2.5 py-2 outline-none"
            >
              <option value="">Todos os Status</option>
              <option value="PENDENTE_COTACAO">Pendente Cotação</option>
              <option value="COTADA">Cotada</option>
              <option value="APROVADA_COMPRA">Aprovada Compra</option>
              <option value="COMPRADA">Comprada / Em Trânsito</option>
              <option value="RECEBIDA">Recebida na Fábrica</option>
              <option value="INSTALADA">Instalada no Ativo</option>
            </select>

            <select
              value={fornecedorFilter}
              onChange={(e) => setFornecedorFilter(e.target.value)}
              className="bg-[#14181D] border border-[#2C343E] text-[#ECEFF1] text-xs rounded-[3px] px-2.5 py-2 outline-none"
            >
              <option value="">Todos Fornecedores</option>
              {distinctFornecedores.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1C222A] border border-[#2C343E] rounded-[4px] overflow-hidden shadow-lg">
        {filteredPecas.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhuma peça pendente encontrada"
            description="Todos os componentes requisitados já foram atendidos ou não correspondem aos filtros."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#14181D] text-[#94A3B8] font-mono text-[10px] uppercase tracking-wider border-b border-[#2C343E]">
                  <th className="py-2.5 px-3">Qtd</th>
                  <th className="py-2.5 px-3">Descrição da Peça</th>
                  <th className="py-2.5 px-3">Part Number / Fabricante</th>
                  <th className="py-2.5 px-3">TAG & Localização</th>
                  <th className="py-2.5 px-3">Fornecedor</th>
                  <th className="py-2.5 px-3">Valor Estimado</th>
                  <th className="py-2.5 px-3">Status de Aquisição</th>
                  <th className="py-2.5 px-3 text-right">Ocorrência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C343E]/60 text-[#ECEFF1]">
                {filteredPecas.map((p) => {
                  const eq = equipsMap.get(p.equipamento_id);
                  const occ = occsMap.get(p.ocorrencia_id);

                  return (
                    <tr key={p.id} className="hover:bg-[#232B35] transition-colors">
                      {/* Qtd */}
                      <td className="py-3 px-3 font-mono font-bold text-sm text-[#F5A623]">
                        {p.quantidade}x
                      </td>

                      {/* Descrição */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#ECEFF1]">{p.descricao}</div>
                        {p.previsao_entrega && (
                          <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                            Previsão: {formatDate(p.previsao_entrega)}
                          </div>
                        )}
                      </td>

                      {/* Part Number & Fabricante */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-[#38BDF8]">{p.part_number || '-'}</div>
                        <div className="text-[#94A3B8]">{p.fabricante || '-'}</div>
                      </td>

                      {/* TAG & Localização */}
                      <td className="py-3 px-3">
                        {eq ? (
                          <div>
                            <IndustrialTag tag={eq.tag} size="sm" />
                            <div className="text-[10px] text-[#94A3B8] mt-1">{eq.linha_nome}</div>
                          </div>
                        ) : (
                          <span className="text-[#6B7683]">-</span>
                        )}
                      </td>

                      {/* Fornecedor */}
                      <td className="py-3 px-3 text-[#ECEFF1]">
                        {p.fornecedor || <span className="text-[#6B7683] italic">A definir</span>}
                      </td>

                      {/* Valor Estimado */}
                      <td className="py-3 px-3 font-mono text-[11px] text-[#38BDF8]">
                        {p.valor_unitario ? (
                          <div>
                            <div>{formatCurrency(p.valor_unitario * p.quantidade)}</div>
                            <div className="text-[9px] text-[#94A3B8]">{formatCurrency(p.valor_unitario)}/un</div>
                          </div>
                        ) : (
                          <span className="text-[#6B7683]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {canEdit ? (
                          <select
                            value={p.status}
                            onChange={(e) => handleUpdatePecaStatus(p.id, e.target.value)}
                            className="bg-[#14181D] border border-[#2C343E] text-xs text-[#F5A623] rounded px-2 py-1 outline-none font-mono"
                          >
                            <option value="PENDENTE_COTACAO">Pendente Cotação</option>
                            <option value="COTADA">Cotada</option>
                            <option value="APROVADA_COMPRA">Aprovada Compra</option>
                            <option value="COMPRADA">Comprada</option>
                            <option value="RECEBIDA">Recebida</option>
                            <option value="INSTALADA">Instalada</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#232B35] text-[#F5A623]">
                            {p.status}
                          </span>
                        )}
                      </td>

                      {/* Ocorrência Link */}
                      <td className="py-3 px-3 text-right">
                        {occ ? (
                          <button
                            onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                            className="inline-flex items-center gap-1 text-xs font-mono text-[#F5A623] hover:underline"
                          >
                            <span>#{occ.numero}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[#6B7683] font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
