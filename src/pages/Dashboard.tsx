import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Search,
  Clock,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { FilterBar } from '../components/common/FilterBar';
import { KpiCard } from '../components/dashboard/KpiCard';
import { AreaChartOcorrencias } from '../components/dashboard/AreaChartOcorrencias';
import { LinhaProgressBar } from '../components/dashboard/LinhaProgressBar';
import { DonutTipos } from '../components/dashboard/DonutTipos';
import { BarChartUGs } from '../components/dashboard/BarChartUGs';
import { useAuth } from '../context/AuthContext';
import { DataStore, GlobalFilters } from '../lib/dataStore';
import {
  VwKpis,
  VwStatusPorUg,
  VwStatusPorLinha,
  VwStatusPorTipo,
  VwStatusPorMarca,
  VwAgingParadas,
  VwEvolucaoMensal,
} from '../types/database';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState<GlobalFilters>({});
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  const [kpis, setKpis] = useState<VwKpis>({
    total_equipamentos: 181,
    operando_ok: 179,
    parados: 2,
    restricao: 1,
    desativados: 0,
    disponibilidade_pct: 98.9,
    ocorrencias_abertas: 2,
    aguardando_peca: 0,
    aguardando_orcamento_aprovacao: 1,
    valor_orcamentos_pendentes: 14850,
    mttr_medio_dias: 3.4,
  });

  const [statusUg, setStatusUg] = useState<VwStatusPorUg[]>([]);
  const [statusLinha, setStatusLinha] = useState<VwStatusPorLinha[]>([]);
  const [statusTipo, setStatusTipo] = useState<VwStatusPorTipo[]>([]);
  const [statusMarca, setStatusMarca] = useState<VwStatusPorMarca[]>([]);
  const [agingParadas, setAgingParadas] = useState<VwAgingParadas[]>([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState<VwEvolucaoMensal[]>([]);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted =
        now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
        ' · ' +
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCurrentTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [k, ugs, linhas, tipos, marcas, aging, evolucao] = await Promise.all([
        DataStore.getVwKpis(filters),
        DataStore.getVwStatusPorUg(filters),
        DataStore.getVwStatusPorLinha(filters),
        DataStore.getVwStatusPorTipo(filters),
        DataStore.getVwStatusPorMarca(filters),
        DataStore.getVwAgingParadas(),
        DataStore.getVwEvolucaoMensal(),
      ]);

      setKpis(k);
      setStatusUg(ugs);
      setStatusLinha(linhas);
      setStatusTipo(tipos);
      setStatusMarca(marcas);
      setAgingParadas(aging);
      setEvolucaoMensal(evolucao);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim().toLowerCase();
    if (query.startsWith('tag') || !isNaN(Number(query))) {
      navigate(`/equipamentos?q=${encodeURIComponent(query.replace('tag', '').trim())}`);
    } else if (query.startsWith('os') || query.startsWith('#')) {
      navigate(`/ocorrencias?q=${encodeURIComponent(query)}`);
    } else if (query.startsWith('orc') || query.startsWith('proposta')) {
      navigate(`/orcamentos?q=${encodeURIComponent(query)}`);
    } else {
      navigate(`/equipamentos?q=${encodeURIComponent(query)}`);
    }
  };

  const handleExportCsv = () => {
    if (agingParadas.length === 0) return;
    const headers = [
      'Ocorrência',
      'TAG',
      'Tipo',
      'Marca',
      'Modelo',
      'UG',
      'Linha',
      'Centro de Trabalho',
      'Data Avaria',
      'Dias Parado',
      'Status Ocorrência',
    ];

    const rows = agingParadas.map((p) => [
      p.ocorrencia_numero,
      p.tag,
      `"${p.tipo}"`,
      `"${p.marca}"`,
      `"${p.modelo}"`,
      p.ug_codigo,
      `"${p.linha_nome}"`,
      `"${p.centro_trabalho_nome}"`,
      p.data_avaria,
      p.dias_parado,
      p.status_ocorrencia,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `AMBEV_Equipamentos_Parados_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const firstName = user?.nome ? user.nome.split(' ')[0] : 'Adriano';

  return (
    <div
      id="dashboard-container"
      className="w-full h-screen overflow-hidden p-3 box-border flex flex-col gap-2.5 bg-[#0D1117] select-none font-body text-[#E6EDF3]"
    >
      {/* HEADER DO CONTEÚDO (Máximo 40px, shrink-0, linha única compacta) */}
      <header
        id="dashboard-header"
        className="h-[40px] shrink-0 flex items-center justify-between gap-3 px-3 rounded-xl bg-[#161B22] border border-[#30363D]"
      >
        {/* Título inline com subtítulo separado por · */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-[14px] font-display font-bold text-[#E6EDF3] tracking-tight truncate leading-none">
            Bom dia, {firstName}.
          </h1>
          <span className="text-[#8B949E] text-[11px]">·</span>
          <p className="text-[12px] font-body text-[#8B949E] truncate leading-none hidden sm:inline">
            181 climatizadores industriais monitorados
          </p>
        </div>

        {/* Action Controls & Relógio/Badges (mesma linha, fonte 11px) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Global Search Compact */}
          <form onSubmit={handleSearchSubmit} className="relative w-[180px] md:w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#8B949E] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar TAG, OS..."
              className="w-full h-[28px] bg-[#21262D] border border-[#30363D] rounded-lg pl-8 pr-2.5 text-[12px] font-body text-[#E6EDF3] placeholder-[#484F58] focus:outline-none focus:border-[#2F81F7] transition-all leading-none"
            />
          </form>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-[28px] flex items-center gap-1.5 px-2.5 rounded-lg text-[11px] font-body font-semibold border transition-all cursor-pointer leading-none ${
              showFilters || Object.keys(filters).length > 0
                ? 'bg-[#2F81F7]/20 text-[#58A6FF] border-[#2F81F7]/40'
                : 'bg-[#21262D] text-[#E6EDF3] border-[#30363D] hover:border-[#2F81F7]/40'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Filtros</span>
            {Object.keys(filters).length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F81F7]" />
            )}
          </button>

          {/* Refresh button */}
          <button
            onClick={loadData}
            title="Atualizar dados"
            className="h-[28px] w-[28px] flex items-center justify-center rounded-lg bg-[#21262D] border border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#2F81F7]/40 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#58A6FF]' : ''}`} />
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCsv}
            title="Exportar dados em CSV"
            className="h-[28px] w-[28px] flex items-center justify-center rounded-lg bg-[#21262D] border border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#2F81F7]/40 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
          </button>

          {/* Live Clock & Badge Online */}
          <div className="hidden lg:flex items-center gap-2 border-l border-[#30363D] pl-2.5">
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#8B949E] leading-none">
              <Clock className="w-3 h-3 text-[#58A6FF]" />
              <span>{currentTime}</span>
            </div>
            <span className="text-[10px] bg-[#3FB950]/15 text-[#3FB950] px-2 py-0.5 rounded-full border border-[#3FB950]/30 font-mono font-bold flex items-center gap-1 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>
      </header>

      {/* LINHA 1: 4 CARDS KPI (Altura fixa 110px, shrink-0, 4 colunas iguais) */}
      <div
        id="kpi-row"
        className="grid grid-cols-4 gap-2.5 h-[110px] shrink-0"
      >
        {/* Card 1: Total Equipamentos */}
        <KpiCard
          id="kpi-total-equipamentos"
          title="Total Equipamentos"
          value={kpis.total_equipamentos}
          subtitle="ativos na fábrica"
          icon={Cpu}
          iconBg="bg-[#2F81F7]/15 text-[#58A6FF]"
          sparklineColor="#2F81F7"
          sparklineData={[170, 172, 175, 178, 179, 181, 181, 181]}
          variation={{ text: '+3 novos', type: 'positive' }}
          onClick={() => navigate('/equipamentos')}
        />

        {/* Card 2: Operando (OK) */}
        <KpiCard
          id="kpi-operando-ok"
          title="Operando (OK)"
          value={kpis.operando_ok}
          subtitle={`${kpis.disponibilidade_pct}% disponibilidade`}
          icon={CheckCircle2}
          iconBg="bg-[#3FB950]/15 text-[#3FB950]"
          sparklineColor="#3FB950"
          sparklineData={[168, 170, 174, 176, 178, 179, 178, 179]}
          variant="success"
          variation={{ text: `↑ ${kpis.disponibilidade_pct}% disp.`, type: 'positive' }}
          onClick={() => navigate('/equipamentos?status=OK')}
        />

        {/* Card 3: Equipamentos Parados */}
        <KpiCard
          id="kpi-equipamentos-parados"
          title="Equipamentos Parados"
          value={kpis.parados}
          subtitle="aguardando peça/retorno"
          icon={AlertCircle}
          iconBg="bg-[#F85149]/15 text-[#F85149]"
          sparklineColor="#F85149"
          sparklineData={[5, 4, 3, 2, 4, 3, 2, 2]}
          variant={kpis.parados > 0 ? 'danger' : 'default'}
          variation={
            kpis.parados > 0
              ? { text: `${kpis.parados} crítico(s)`, type: 'negative' }
              : { text: '100% OK', type: 'positive' }
          }
          onClick={() => navigate('/equipamentos?status=PARADO')}
        />

        {/* Card 4: Orçamentos Pendentes */}
        <KpiCard
          id="kpi-orcamentos-pendentes"
          title="Orçamentos Pendentes"
          value={`R$ ${kpis.valor_orcamentos_pendentes.toLocaleString('pt-BR')}`}
          subtitle={`${kpis.aguardando_orcamento_aprovacao} aguardando aprovação`}
          icon={DollarSign}
          iconBg="bg-[#D29922]/15 text-[#D29922]"
          sparklineColor="#D29922"
          sparklineData={[8000, 12000, 15000, 13500, 16000, 14850]}
          variant="warning"
          variation={{ text: 'Aguardando AMBEV', type: 'neutral' }}
          onClick={() => navigate('/orcamentos?status=ENVIADO')}
        />
      </div>

      {/* LINHA 2: GRÁFICO DE OCORRÊNCIAS (flex: 1 1 0, min-height: 0 — CRESCE E PREENCHE O ESPAÇO) */}
      <div id="chart-row" className="flex-1 min-h-0 w-full flex flex-col">
        <AreaChartOcorrencias
          data={evolucaoMensal}
          mttrMedio={kpis.mttr_medio_dias || 3.4}
        />
      </div>

      {/* LINHA 3: 3 CARDS INFERIORES (flex: 1 1 0, min-height: 0 — CRESCE E PREENCHE O RESTANTE) */}
      <div
        id="bottom-row"
        className="flex-1 min-h-0 grid grid-cols-3 gap-2.5"
      >
        {/* Card A: Status por Linha */}
        <LinhaProgressBar linhas={statusLinha} />

        {/* Card B: Performance dos Modelos */}
        <DonutTipos tipos={statusTipo} marcas={statusMarca} />

        {/* Card C: Equipamentos em Risco */}
        <BarChartUGs statusUg={statusUg} agingParadas={agingParadas} />
      </div>

      {/* Modal / Floating Filter Bar se aberto */}
      {showFilters && (
        <div className="fixed inset-x-0 top-16 z-50 px-6 max-w-4xl mx-auto drop-shadow-2xl">
          <div className="bg-[#111827] border border-blue-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Filtragem Global
              </span>
              <button
                onClick={() => setShowFilters(false)}
                className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-[#0A0E1A]"
              >
                Fechar
              </button>
            </div>
            <FilterBar filters={filters} onFilterChange={setFilters} />
          </div>
        </div>
      )}
    </div>
  );
};
