import { supabase, isSupabaseConfigured } from './supabase';
import {
  Equipamento,
  Ocorrencia,
  Peca,
  Orcamento,
  Anexo,
  OcorrenciaEvento,
  Manutencao,
  LevantamentoLegado,
  UG,
  Area,
  Linha,
  CentroTrabalho,
  Profile,
  UserRole,
  VwEquipamento,
  VwKpis,
  VwStatusPorUg,
  VwStatusPorArea,
  VwStatusPorLinha,
  VwStatusPorTipo,
  VwStatusPorMarca,
  VwAgingParadas,
  VwPecasPendentes,
  VwEvolucaoMensal,
  OcorrenciaStatus,
  EquipStatus,
} from '../types/database';
import {
  INITIAL_PROFILES,
  INITIAL_UGS,
  INITIAL_AREAS,
  INITIAL_LINHAS,
  INITIAL_CENTROS_TRABALHO,
  INITIAL_EQUIPAMENTOS,
  INITIAL_OCORRENCIAS,
  INITIAL_PECAS,
  INITIAL_ORCAMENTOS,
  INITIAL_EVENTOS,
  INITIAL_MANUTENCOES,
  INITIAL_LEVANTAMENTO_LEGADO,
} from './mockData';

// Local storage keys for caching and optimistic updates
const STORAGE_KEY = 'IVCA_DATABASE_LOCAL_V1';

interface LocalDbState {
  profiles: Profile[];
  ugs: UG[];
  areas: Area[];
  linhas: Linha[];
  centros_trabalho: CentroTrabalho[];
  equipamentos: Equipamento[];
  ocorrencias: Ocorrencia[];
  pecas: Peca[];
  orcamentos: Orcamento[];
  eventos: OcorrenciaEvento[];
  anexos: Anexo[];
  manutencoes: Manutencao[];
  levantamento_legado: LevantamentoLegado[];
}

function getInitialDbState(): LocalDbState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not read from localStorage, using default seed', e);
  }

  const state: LocalDbState = {
    profiles: [...INITIAL_PROFILES],
    ugs: [...INITIAL_UGS],
    areas: [...INITIAL_AREAS],
    linhas: [...INITIAL_LINHAS],
    centros_trabalho: [...INITIAL_CENTROS_TRABALHO],
    equipamentos: [...INITIAL_EQUIPAMENTOS],
    ocorrencias: [...INITIAL_OCORRENCIAS],
    pecas: [...INITIAL_PECAS],
    orcamentos: [...INITIAL_ORCAMENTOS],
    eventos: [...INITIAL_EVENTOS],
    anexos: [
      {
        id: 'anexo-1',
        ocorrencia_id: 'ocor-360',
        equipamento_id: 'equip-360',
        nome_arquivo: 'foto_painel_decoradora_cpe.jpg',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        tipo_anexo: 'FOTO',
        bucket: 'fotos',
        created_at: '2026-08-17T10:15:00Z',
      },
      {
        id: 'anexo-2',
        ocorrencia_id: 'ocor-223',
        equipamento_id: 'equip-223',
        nome_arquivo: 'foto_chiller_compressor_trinca.jpg',
        url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
        tipo_anexo: 'FOTO',
        bucket: 'fotos',
        created_at: '2026-08-03T15:40:00Z',
      },
    ],
    manutencoes: [...INITIAL_MANUTENCOES],
    levantamento_legado: [...INITIAL_LEVANTAMENTO_LEGADO],
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }

  return state;
}

let dbState = getInitialDbState();

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dbState));
  } catch (e) {
    console.warn('Could not persist to localStorage', e);
  }
}

// Global Filter Interface for Dashboard and lists
export interface GlobalFilters {
  ug_id?: string;
  area_id?: string;
  linha_id?: string;
  tipo?: string;
  periodo?: string; // '7d' | '30d' | '90d' | 'ano' | 'tudo'
}

export const DataStore = {
  // Reset demo database to initial state
  resetToInitial() {
    localStorage.removeItem(STORAGE_KEY);
    dbState = getInitialDbState();
    persistState();
  },

  // 1. Hierarchy & Profiles
  async getHierarchy() {
    return {
      ugs: dbState.ugs,
      areas: dbState.areas,
      linhas: dbState.linhas,
      centros_trabalho: dbState.centros_trabalho,
    };
  },

  async getProfiles(): Promise<Profile[]> {
    return dbState.profiles;
  },

  // 2. View: Equipamentos
  async getVwEquipamentos(filters?: GlobalFilters): Promise<VwEquipamento[]> {
    const ugsMap = new Map(dbState.ugs.map((u) => [u.id, u]));
    const areasMap = new Map(dbState.areas.map((a) => [a.id, a]));
    const linhasMap = new Map(dbState.linhas.map((l) => [l.id, l]));
    const ctsMap = new Map(dbState.centros_trabalho.map((c) => [c.id, c]));

    let list = dbState.equipamentos.map((eq) => {
      const ug = ugsMap.get(eq.ug_id);
      const area = areasMap.get(eq.area_id);
      const linha = linhasMap.get(eq.linha_id);
      const ct = ctsMap.get(eq.centro_trabalho_id);

      const openOcc = dbState.ocorrencias.find(
        (o) => o.equipamento_id === eq.id && o.status !== 'CONCLUIDA' && o.status !== 'CANCELADA'
      );

      let diasParado = 0;
      if (openOcc && eq.status === 'PARADO') {
        const diff = Math.floor((new Date().getTime() - new Date(openOcc.data_avaria).getTime()) / (1000 * 3600 * 24));
        diasParado = Math.max(0, diff);
      }

      return {
        ...eq,
        ug_codigo: ug?.codigo || 'N/D',
        ug_nome: ug?.nome || 'UG Não Definida',
        area_nome: area?.nome || 'Área Não Definida',
        linha_nome: linha?.nome || 'Linha Não Definida',
        centro_trabalho_nome: ct?.nome || 'CT Não Definido',
        centro_trabalho_sap: ct?.codigo_sap,
        total_ocorrencias_abertas: openOcc ? 1 : 0,
        dias_parado_atual: diasParado,
      } as VwEquipamento;
    });

    if (filters) {
      if (filters.ug_id) list = list.filter((e) => e.ug_id === filters.ug_id);
      if (filters.area_id) list = list.filter((e) => e.area_id === filters.area_id);
      if (filters.linha_id) list = list.filter((e) => e.linha_id === filters.linha_id);
      if (filters.tipo) list = list.filter((e) => e.tipo === filters.tipo);
    }

    return list;
  },

  // 3. View: KPIs (vw_kpis)
  async getVwKpis(filters?: GlobalFilters): Promise<VwKpis> {
    const list = await this.getVwEquipamentos(filters);
    const total = list.length;
    const ok = list.filter((e) => e.status === 'OK').length;
    const parados = list.filter((e) => e.status === 'PARADO').length;
    const restricao = list.filter((e) => e.status === 'RESTRICAO').length;
    const desativados = list.filter((e) => e.status === 'DESATIVADO').length;
    const disponibilidade = total > 0 ? Number((((ok + restricao) / total) * 100).toFixed(1)) : 100;

    const abertas = dbState.ocorrencias.filter((o) => o.status !== 'CONCLUIDA' && o.status !== 'CANCELADA');
    const aguardandoPeca = abertas.filter((o) => o.status === 'AGUARDANDO_PECA').length;
    const aguardandoOrcamento = abertas.filter(
      (o) => o.status === 'AGUARDANDO_ORCAMENTO' || o.status === 'ORCAMENTO_ENVIADO' || o.status === 'AGUARDANDO_APROVACAO_AMBEV'
    ).length;

    const valorOrcamentos = dbState.orcamentos
      .filter((orc) => orc.status === 'ENVIADO' || orc.status === 'ELABORACAO')
      .reduce((sum, orc) => sum + (orc.valor_total || 0), 0);

    return {
      total_equipamentos: total,
      operando_ok: ok,
      parados,
      restricao,
      desativados,
      disponibilidade_pct: disponibilidade,
      ocorrencias_abertas: abertas.length,
      aguardando_peca: aguardandoPeca,
      aguardando_orcamento_aprovacao: aguardandoOrcamento,
      valor_orcamentos_pendentes: valorOrcamentos,
      mttr_medio_dias: 3.4,
    };
  },

  // 4. View: Status por UG (vw_status_por_ug)
  async getVwStatusPorUg(filters?: GlobalFilters): Promise<VwStatusPorUg[]> {
    const equips = await this.getVwEquipamentos(filters);
    return dbState.ugs.map((ug) => {
      const ugEquips = equips.filter((e) => e.ug_id === ug.id);
      const total = ugEquips.length;
      const ok = ugEquips.filter((e) => e.status === 'OK').length;
      const parado = ugEquips.filter((e) => e.status === 'PARADO').length;
      const restricao = ugEquips.filter((e) => e.status === 'RESTRICAO').length;
      const disp = total > 0 ? Number((((ok + restricao) / total) * 100).toFixed(1)) : 100;
      return {
        ug_codigo: ug.codigo,
        ug_nome: ug.nome,
        total,
        ok,
        parado,
        restricao,
        disponibilidade_pct: disp,
      };
    });
  },

  // 5. View: Status por Linha (vw_status_por_linha)
  async getVwStatusPorLinha(filters?: GlobalFilters): Promise<VwStatusPorLinha[]> {
    const equips = await this.getVwEquipamentos(filters);
    const result: VwStatusPorLinha[] = [];

    dbState.linhas.forEach((linha) => {
      const linhaEquips = equips.filter((e) => e.linha_id === linha.id);
      if (linhaEquips.length > 0 || !filters?.linha_id) {
        const total = linhaEquips.length;
        const ok = linhaEquips.filter((e) => e.status === 'OK').length;
        const parado = linhaEquips.filter((e) => e.status === 'PARADO').length;
        const restricao = linhaEquips.filter((e) => e.status === 'RESTRICAO').length;
        result.push({
          linha_id: linha.id,
          linha_nome: linha.nome.replace('Linha ', 'L'),
          total,
          ok,
          parado,
          restricao,
        });
      }
    });

    // Ordenado do pior (mais parados) para o melhor
    return result.sort((a, b) => b.parado - a.parado);
  },

  // 6. View: Status por Área (vw_status_por_area)
  async getVwStatusPorArea(filters?: GlobalFilters): Promise<VwStatusPorArea[]> {
    const equips = await this.getVwEquipamentos(filters);
    const result: VwStatusPorArea[] = [];

    dbState.areas.forEach((area) => {
      const areaEquips = equips.filter((e) => e.area_id === area.id);
      const total = areaEquips.length;
      const ok = areaEquips.filter((e) => e.status === 'OK').length;
      const parado = areaEquips.filter((e) => e.status === 'PARADO').length;
      const restricao = areaEquips.filter((e) => e.status === 'RESTRICAO').length;
      result.push({
        area_nome: area.nome,
        total,
        ok,
        parado,
        restricao,
      });
    });

    return result.sort((a, b) => b.parado - a.parado);
  },

  // 7. View: Status por Tipo (vw_status_por_tipo)
  async getVwStatusPorTipo(filters?: GlobalFilters): Promise<VwStatusPorTipo[]> {
    const equips = await this.getVwEquipamentos(filters);
    const map = new Map<string, { total: number; ok: number; parado: number }>();

    equips.forEach((e) => {
      const cur = map.get(e.tipo) || { total: 0, ok: 0, parado: 0 };
      cur.total += 1;
      if (e.status === 'OK') cur.ok += 1;
      if (e.status === 'PARADO') cur.parado += 1;
      map.set(e.tipo, cur);
    });

    return Array.from(map.entries()).map(([tipo, data]) => ({
      tipo,
      ...data,
    }));
  },

  // 8. View: Status por Marca (vw_status_por_marca)
  async getVwStatusPorMarca(filters?: GlobalFilters): Promise<VwStatusPorMarca[]> {
    const equips = await this.getVwEquipamentos(filters);
    const map = new Map<string, { total: number; ok: number; parado: number }>();

    equips.forEach((e) => {
      const cur = map.get(e.marca) || { total: 0, ok: 0, parado: 0 };
      cur.total += 1;
      if (e.status === 'OK') cur.ok += 1;
      if (e.status === 'PARADO') cur.parado += 1;
      map.set(e.marca, cur);
    });

    return Array.from(map.entries())
      .map(([marca, data]) => ({
        marca,
        ...data,
      }))
      .sort((a, b) => b.parado - a.parado || b.total - a.total);
  },

  // 9. View: Aging Paradas (vw_aging_paradas)
  async getVwAgingParadas(): Promise<VwAgingParadas[]> {
    const ugsMap = new Map(dbState.ugs.map((u) => [u.id, u]));
    const linhasMap = new Map(dbState.linhas.map((l) => [l.id, l]));
    const ctsMap = new Map(dbState.centros_trabalho.map((c) => [c.id, c]));
    const equipsMap = new Map(dbState.equipamentos.map((e) => [e.id, e]));

    const openParadas = dbState.ocorrencias.filter(
      (o) => o.equipamento_parado && o.status !== 'CONCLUIDA' && o.status !== 'CANCELADA'
    );

    const result: VwAgingParadas[] = openParadas.map((occ) => {
      const eq = equipsMap.get(occ.equipamento_id);
      const ug = eq ? ugsMap.get(eq.ug_id) : undefined;
      const linha = eq ? linhasMap.get(eq.linha_id) : undefined;
      const ct = eq ? ctsMap.get(eq.centro_trabalho_id) : undefined;

      const diff = Math.floor((new Date().getTime() - new Date(occ.data_avaria).getTime()) / (1000 * 3600 * 24));
      const dias = Math.max(0, diff);

      let faixa: '0-7 dias' | '8-15 dias' | '16-30 dias' | '31-90 dias' | '90+ dias' = '0-7 dias';
      if (dias > 90) faixa = '90+ dias';
      else if (dias > 30) faixa = '31-90 dias';
      else if (dias > 15) faixa = '16-30 dias';
      else if (dias > 7) faixa = '8-15 dias';

      const occPecas = dbState.pecas.filter((p) => p.ocorrencia_id === occ.id);
      const occOrc = dbState.orcamentos.find((o) => o.ocorrencia_id === occ.id);

      return {
        ocorrencia_id: occ.id,
        ocorrencia_numero: occ.numero,
        equipamento_id: occ.equipamento_id,
        tag: eq?.tag || 'N/D',
        tipo: eq?.tipo || 'N/D',
        marca: eq?.marca || 'N/D',
        modelo: eq?.modelo || 'N/D',
        ug_codigo: ug?.codigo || 'N/D',
        linha_nome: linha?.nome || 'N/D',
        centro_trabalho_nome: ct?.nome || 'N/D',
        data_avaria: occ.data_avaria,
        dias_parado: dias,
        faixa_aging: faixa,
        ocorrencia_status: occ.status,
        pecas_pendentes_count: occPecas.length,
        pecas_resumo: occPecas.map((p) => `${p.quantidade}x ${p.descricao}`).join(', '),
        nota_sap: occ.nota_sap,
        ordem_sap: occ.ordem_sap,
        ordem_vision: occ.ordem_vision,
        valor_orcamento: occOrc?.valor_total,
      };
    });

    return result.sort((a, b) => b.dias_parado - a.dias_parado);
  },

  // 10. View: Peças Pendentes (vw_pecas_pendentes)
  async getVwPecasPendentes(): Promise<VwPecasPendentes[]> {
    const equipsMap = new Map(dbState.equipamentos.map((e) => [e.id, e]));
    const occsMap = new Map(dbState.ocorrencias.map((o) => [o.id, o]));
    const linhasMap = new Map(dbState.linhas.map((l) => [l.id, l]));
    const ctsMap = new Map(dbState.centros_trabalho.map((c) => [c.id, c]));

    const pendentes = dbState.pecas.filter((p) => p.status !== 'APLICADA');

    return pendentes.map((peca) => {
      const occ = occsMap.get(peca.ocorrencia_id);
      const eq = occ ? equipsMap.get(occ.equipamento_id) : undefined;
      const linha = eq ? linhasMap.get(eq.linha_id) : undefined;
      const ct = eq ? ctsMap.get(eq.centro_trabalho_id) : undefined;

      let dias = 0;
      if (occ) {
        dias = Math.max(0, Math.floor((new Date().getTime() - new Date(occ.data_avaria).getTime()) / (1000 * 3600 * 24)));
      }

      return {
        peca_id: peca.id,
        descricao: peca.descricao,
        part_number: peca.part_number,
        fabricante: peca.fabricante,
        quantidade: peca.quantidade,
        unidade: peca.unidade || 'UN',
        fornecedor: peca.fornecedor,
        valor_unitario: peca.valor_unitario,
        valor_total: (peca.valor_unitario || 0) * peca.quantidade,
        previsao_entrega: peca.previsao_entrega,
        status: peca.status,
        ocorrencia_id: peca.ocorrencia_id,
        ocorrencia_numero: occ?.numero || 0,
        equipamento_id: eq?.id || '',
        tag: eq?.tag || 'N/D',
        dias_parado_equipamento: dias,
        linha_nome: linha?.nome || 'N/D',
        centro_trabalho_nome: ct?.nome || 'N/D',
        data_solicitacao: peca.created_at,
      };
    });
  },

  // 11. View: Evolução Mensal (vw_evolucao_mensal)
  async getVwEvolucaoMensal(): Promise<VwEvolucaoMensal[]> {
    return [
      { mes_ano: '2026-01', mes_label: 'Jan/26', abertas: 12, concluidas: 14 },
      { mes_ano: '2026-02', mes_label: 'Fev/26', abertas: 8, concluidas: 10 },
      { mes_ano: '2026-03', mes_label: 'Mar/26', abertas: 9, concluidas: 8 },
      { mes_ano: '2026-04', mes_label: 'Abr/26', abertas: 11, concluidas: 12 },
      { mes_ano: '2026-05', mes_label: 'Mai/26', abertas: 6, concluidas: 7 },
      { mes_ano: '2026-06', mes_label: 'Jun/26', abertas: 14, concluidas: 13 },
      { mes_ano: '2026-07', mes_label: 'Jul/26', abertas: 7, concluidas: 9 },
      { mes_ano: '2026-08', mes_label: 'Ago/26', abertas: 4, concluidas: 3 },
    ];
  },

  // 12. Equipamentos CRUD & Details
  async getEquipamentoById(idOrTag: string): Promise<VwEquipamento | null> {
    const list = await this.getVwEquipamentos();
    const found = list.find((e) => e.id === idOrTag || e.tag === idOrTag || e.qr_slug === idOrTag);
    return found || null;
  },

  async saveEquipamento(equip: Partial<Equipamento>): Promise<Equipamento> {
    if (equip.id) {
      const idx = dbState.equipamentos.findIndex((e) => e.id === equip.id);
      if (idx >= 0) {
        dbState.equipamentos[idx] = { ...dbState.equipamentos[idx], ...equip, updated_at: new Date().toISOString() };
        persistState();
        return dbState.equipamentos[idx];
      }
    }

    const newEquip: Equipamento = {
      id: `equip-${Date.now()}`,
      tag: equip.tag || `TAG-${Math.floor(Math.random() * 900 + 100)}`,
      patrimonio: equip.patrimonio || `PAT-AMB-${Math.floor(Math.random() * 9000 + 1000)}`,
      tag_sap: equip.tag_sap || `ACO-${equip.tag}`,
      tipo: equip.tipo || 'CPE porta',
      marca: equip.marca || 'RITTAL',
      modelo: equip.modelo || 'SK Industrial',
      numero_serie: equip.numero_serie,
      capacidade: equip.capacidade,
      tensao: equip.tensao || '230V 1F',
      corrente: equip.corrente,
      gas_refrigerante: equip.gas_refrigerante || 'R-134a',
      ano_fabricacao: equip.ano_fabricacao || 2023,
      ppac: equip.ppac || 'PPAC-MENSAL-CPE',
      ug_id: equip.ug_id || dbState.ugs[0].id,
      area_id: equip.area_id || dbState.areas[0].id,
      linha_id: equip.linha_id || dbState.linhas[0].id,
      centro_trabalho_id: equip.centro_trabalho_id || dbState.centros_trabalho[0].id,
      sublocal: equip.sublocal,
      status: equip.status || 'OK',
      observacoes: equip.observacoes,
      qr_slug: `ivca-eq-${equip.tag}`,
      created_at: new Date().toISOString(),
    };

    dbState.equipamentos.unshift(newEquip);
    persistState();
    return newEquip;
  },

  async updateEquipamentoStatus(id: string, status: EquipStatus): Promise<void> {
    const eq = dbState.equipamentos.find((e) => e.id === id);
    if (eq) {
      eq.status = status;
      eq.updated_at = new Date().toISOString();
      persistState();
    }
  },

  // 13. Ocorrências CRUD
  async getOcorrencias(): Promise<Ocorrencia[]> {
    return [...dbState.ocorrencias].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getOcorrenciaById(id: string): Promise<Ocorrencia | null> {
    const occ = dbState.ocorrencias.find((o) => o.id === id || String(o.numero) === id);
    return occ || null;
  },

  async createOcorrencia(
    ocorrenciaData: Omit<Ocorrencia, 'id' | 'numero' | 'created_at'>,
    pecas: Partial<Peca>[] = [],
    orcamentos: Partial<Orcamento>[] = [],
    fotosUrls: string[] = []
  ): Promise<Ocorrencia> {
    const nextNum = Math.max(0, ...dbState.ocorrencias.map((o) => o.numero)) + 1;
    const newId = `ocor-${Date.now()}`;

    const newOcc: Ocorrencia = {
      ...ocorrenciaData,
      id: newId,
      numero: nextNum,
      created_at: new Date().toISOString(),
    };

    dbState.ocorrencias.unshift(newOcc);

    // Trigger Rule: When opened with "equipamento parado", set equip status to PARADO
    if (newOcc.equipamento_parado) {
      const eq = dbState.equipamentos.find((e) => e.id === newOcc.equipamento_id);
      if (eq) {
        eq.status = 'PARADO';
        eq.updated_at = new Date().toISOString();
      }
    }

    // Add Timeline Event
    dbState.eventos.unshift({
      id: `ev-${Date.now()}`,
      ocorrencia_id: newId,
      usuario_nome: newOcc.relatante_nome || 'Técnico de Campo',
      tipo_evento: 'CRIACAO',
      para_status: newOcc.status,
      descricao: `Ocorrência #${nextNum} aberta em campo: ${newOcc.descricao_anomalia}`,
      created_at: new Date().toISOString(),
    });

    // Add Pecas
    pecas.forEach((p, idx) => {
      dbState.pecas.push({
        id: `peca-${Date.now()}-${idx}`,
        ocorrencia_id: newId,
        descricao: p.descricao || 'Peça não identificada',
        part_number: p.part_number,
        fabricante: p.fabricante,
        quantidade: p.quantidade || 1,
        unidade: p.unidade || 'UN',
        fornecedor: p.fornecedor,
        valor_unitario: p.valor_unitario,
        previsao_entrega: p.previsao_entrega,
        status: p.status || 'SOLICITADA',
        created_at: new Date().toISOString(),
      });
    });

    // Add Orcamentos
    orcamentos.forEach((orc, idx) => {
      dbState.orcamentos.push({
        id: `orc-${Date.now()}-${idx}`,
        ocorrencia_id: newId,
        numero: orc.numero || `ORC-${nextNum}`,
        fornecedor: orc.fornecedor || 'Fornecedor Credenciado',
        valor_total: orc.valor_total || 0,
        data_envio: orc.data_envio || new Date().toISOString(),
        enviado_para: orc.enviado_para || 'Engenharia AMBEV RJ',
        validade: orc.validade,
        status: orc.status || 'ELABORACAO',
        arquivo_pdf_url: orc.arquivo_pdf_url,
        observacoes: orc.observacoes,
        created_at: new Date().toISOString(),
      });
    });

    // Add Fotos
    fotosUrls.forEach((url, idx) => {
      dbState.anexos.push({
        id: `anexo-${Date.now()}-${idx}`,
        ocorrencia_id: newId,
        equipamento_id: newOcc.equipamento_id,
        nome_arquivo: `foto_campo_${nextNum}_${idx + 1}.jpg`,
        url,
        tipo_anexo: 'FOTO',
        bucket: 'fotos',
        created_at: new Date().toISOString(),
      });
    });

    persistState();
    return newOcc;
  },

  async updateOcorrenciaStatus(
    ocorrenciaId: string,
    novoStatus: OcorrenciaStatus,
    usuarioNome: string,
    comentario?: string
  ): Promise<void> {
    const occ = dbState.ocorrencias.find((o) => o.id === ocorrenciaId);
    if (!occ) return;

    const statusAntigo = occ.status;
    occ.status = novoStatus;
    occ.updated_at = new Date().toISOString();

    if (novoStatus === 'CONCLUIDA') {
      occ.data_conclusao = new Date().toISOString();
      // Rule: If no other open occurrence for this equipment, revert to OK
      const otherOpen = dbState.ocorrencias.find(
        (o) => o.equipamento_id === occ.equipamento_id && o.id !== occ.id && o.status !== 'CONCLUIDA' && o.status !== 'CANCELADA'
      );
      if (!otherOpen) {
        const eq = dbState.equipamentos.find((e) => e.id === occ.equipamento_id);
        if (eq && eq.status === 'PARADO') {
          eq.status = 'OK';
          eq.updated_at = new Date().toISOString();
        }
      }
    }

    dbState.eventos.unshift({
      id: `ev-${Date.now()}`,
      ocorrencia_id: ocorrenciaId,
      usuario_nome: usuarioNome,
      tipo_evento: 'MUDANCA_STATUS',
      de_status: statusAntigo,
      para_status: novoStatus,
      descricao: comentario || `Status alterado de ${statusAntigo} para ${novoStatus}`,
      created_at: new Date().toISOString(),
    });

    persistState();
  },

  async addComentario(ocorrenciaId: string, usuarioNome: string, texto: string): Promise<void> {
    dbState.eventos.unshift({
      id: `ev-${Date.now()}`,
      ocorrencia_id: ocorrenciaId,
      usuario_nome: usuarioNome,
      tipo_evento: 'COMENTARIO',
      descricao: texto,
      created_at: new Date().toISOString(),
    });
    persistState();
  },

  // 14. Peças por Ocorrência
  async getPecas(): Promise<Peca[]> {
    return [...dbState.pecas];
  },

  async getPecasByOcorrencia(ocorrenciaId: string): Promise<Peca[]> {
    return dbState.pecas.filter((p) => p.ocorrencia_id === ocorrenciaId);
  },

  async savePeca(peca: Partial<Peca>): Promise<Peca> {
    if (peca.id) {
      const idx = dbState.pecas.findIndex((p) => p.id === peca.id);
      if (idx >= 0) {
        dbState.pecas[idx] = { ...dbState.pecas[idx], ...peca };
        persistState();
        return dbState.pecas[idx];
      }
    }

    const newPeca: Peca = {
      id: `peca-${Date.now()}`,
      ocorrencia_id: peca.ocorrencia_id || '',
      descricao: peca.descricao || 'Nova Peça',
      part_number: peca.part_number,
      fabricante: peca.fabricante,
      quantidade: peca.quantidade || 1,
      unidade: peca.unidade || 'UN',
      fornecedor: peca.fornecedor,
      valor_unitario: peca.valor_unitario,
      previsao_entrega: peca.previsao_entrega,
      status: peca.status || 'SOLICITADA',
      created_at: new Date().toISOString(),
    };

    dbState.pecas.push(newPeca);
    persistState();
    return newPeca;
  },

  async deletePeca(pecaId: string): Promise<void> {
    dbState.pecas = dbState.pecas.filter((p) => p.id !== pecaId);
    persistState();
  },

  // 15. Orçamentos por Ocorrência
  async getOrcamentos(): Promise<Orcamento[]> {
    return [...dbState.orcamentos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getOrcamentosByOcorrencia(ocorrenciaId: string): Promise<Orcamento[]> {
    return dbState.orcamentos.filter((o) => o.ocorrencia_id === ocorrenciaId);
  },

  async getAllOrcamentos(): Promise<Orcamento[]> {
    return [...dbState.orcamentos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async saveOrcamento(orc: Partial<Orcamento>): Promise<Orcamento> {
    if (orc.id) {
      const idx = dbState.orcamentos.findIndex((o) => o.id === orc.id);
      if (idx >= 0) {
        dbState.orcamentos[idx] = { ...dbState.orcamentos[idx], ...orc };
        persistState();
        return dbState.orcamentos[idx];
      }
    }

    const newOrc: Orcamento = {
      id: `orc-${Date.now()}`,
      ocorrencia_id: orc.ocorrencia_id || '',
      numero: orc.numero || `ORC-${Date.now().toString().slice(-4)}`,
      fornecedor: orc.fornecedor || 'Fornecedor',
      valor_total: orc.valor_total || 0,
      data_envio: orc.data_envio || new Date().toISOString(),
      enviado_para: orc.enviado_para,
      validade: orc.validade,
      status: orc.status || 'ELABORACAO',
      arquivo_pdf_url: orc.arquivo_pdf_url,
      observacoes: orc.observacoes,
      created_at: new Date().toISOString(),
    };

    dbState.orcamentos.push(newOrc);
    persistState();
    return newOrc;
  },

  // 16. Eventos Timeline
  async addEvento(evento: {
    ocorrencia_id: string;
    tipo_evento: any;
    descricao: string;
    autor_nome?: string;
    usuario_nome?: string;
  }): Promise<OcorrenciaEvento> {
    const newEv: OcorrenciaEvento = {
      id: `ev-${Date.now()}`,
      ocorrencia_id: evento.ocorrencia_id,
      tipo_evento: evento.tipo_evento,
      usuario_nome: evento.autor_nome || evento.usuario_nome || 'Usuário Vision',
      descricao: evento.descricao,
      created_at: new Date().toISOString(),
    };
    dbState.eventos.unshift(newEv);
    persistState();
    return newEv;
  },

  async saveOcorrencia(
    ocorrenciaData: Partial<Ocorrencia>,
    pecas: Partial<Peca>[] = [],
    orcamentos: Partial<Orcamento>[] = [],
    fotosUrls: string[] = []
  ): Promise<Ocorrencia> {
    if (ocorrenciaData.id) {
      const idx = dbState.ocorrencias.findIndex((o) => o.id === ocorrenciaData.id);
      if (idx >= 0) {
        dbState.ocorrencias[idx] = {
          ...dbState.ocorrencias[idx],
          ...ocorrenciaData,
          updated_at: new Date().toISOString(),
        } as Ocorrencia;
        persistState();
        return dbState.ocorrencias[idx];
      }
    }
    return this.createOcorrencia(
      ocorrenciaData as Omit<Ocorrencia, 'id' | 'numero' | 'created_at'>,
      pecas,
      orcamentos,
      fotosUrls
    );
  },

  async getEventosByOcorrencia(ocorrenciaId: string): Promise<OcorrenciaEvento[]> {
    return dbState.eventos
      .filter((e) => e.ocorrencia_id === ocorrenciaId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // 17. Anexos & Fotos
  async getAnexos(equipamentoId?: string, ocorrenciaId?: string): Promise<Anexo[]> {
    return dbState.anexos.filter((a) => {
      if (equipamentoId && a.equipamento_id === equipamentoId) return true;
      if (ocorrenciaId && a.ocorrencia_id === ocorrenciaId) return true;
      return false;
    });
  },

  async addAnexo(anexo: Omit<Anexo, 'id' | 'created_at'>): Promise<Anexo> {
    const newAnexo: Anexo = {
      ...anexo,
      id: `anexo-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    dbState.anexos.unshift(newAnexo);
    persistState();
    return newAnexo;
  },

  // 18. Manutenções Históricas
  async getManutencoesByEquipamento(equipamentoId: string): Promise<Manutencao[]> {
    return dbState.manutencoes
      .filter((m) => m.equipamento_id === equipamentoId)
      .sort((a, b) => new Date(b.data_execucao).getTime() - new Date(a.data_execucao).getTime());
  },

  // 19. Levantamento Legado 2026 (Reconciliation Feature)
  async getLevantamentoLegado(): Promise<LevantamentoLegado[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('levantamento_legado')
          .select('*')
          .order('tag_antiga', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as LevantamentoLegado[];
        }
      } catch (e) {
        console.warn('Could not query levantamento_legado from Supabase, falling back to local state:', e);
      }
    }
    return dbState.levantamento_legado;
  },

  async conciliarRegistroLegado(
    legadoId: string,
    equipamentoId: string,
    abrirOcorrencia: boolean,
    dadosOcorrencia?: Partial<Ocorrencia>,
    usuarioNome?: string
  ): Promise<{ ocorrenciaCriada?: Ocorrencia }> {
    const item = dbState.levantamento_legado.find((l) => l.id === legadoId);
    if (!item) return {};

    item.conciliado = true;
    item.equipamento_id = equipamentoId;

    let novaOcc: Ocorrencia | undefined = undefined;

    if (abrirOcorrencia) {
      const eq = dbState.equipamentos.find((e) => e.id === equipamentoId);
      const nextNum = Math.max(0, ...dbState.ocorrencias.map((o) => o.numero)) + 1;
      const occId = `ocor-${Date.now()}`;

      novaOcc = {
        id: occId,
        numero: nextNum,
        equipamento_id: equipamentoId,
        tipo_servico: dadosOcorrencia?.tipo_servico || 'CORRETIVA',
        criticidade: dadosOcorrencia?.criticidade || 'MEDIA',
        status: 'ABERTA',
        data_avaria: dadosOcorrencia?.data_avaria || new Date().toISOString(),
        relatante_nome: usuarioNome || 'Arthur Almeida (Encarregado)',
        descricao_anomalia: dadosOcorrencia?.descricao_anomalia || `[Conciliação Legado 2026 - ${item.tag_legada}]: ${item.observacao_campo || item.descricao}`,
        causa_provavel: 'Identificado no levantamento de campo inicial jan/2026.',
        equipamento_parado: !item.status_ok,
        parou_linha: false,
        created_at: new Date().toISOString(),
      };

      dbState.ocorrencias.unshift(novaOcc);

      if (novaOcc.equipamento_parado && eq) {
        eq.status = 'PARADO';
      }

      dbState.eventos.unshift({
        id: `ev-${Date.now()}`,
        ocorrencia_id: occId,
        usuario_nome: usuarioNome || 'Arthur Almeida',
        tipo_evento: 'CRIACAO',
        para_status: 'ABERTA',
        descricao: `Ocorrência gerada a partir da conciliação do levantamento legado ${item.tag_legada}`,
        created_at: new Date().toISOString(),
      });
    }

    persistState();
    return { ocorrenciaCriada: novaOcc };
  },

  // 20. Cadastros (Admin/Gestor)
  async saveUG(ug: Partial<UG>): Promise<UG> {
    if (ug.id) {
      const idx = dbState.ugs.findIndex((u) => u.id === ug.id);
      if (idx >= 0) {
        dbState.ugs[idx] = {
          ...dbState.ugs[idx],
          ...ug,
          codigo: ug.codigo ? ug.codigo.trim().toUpperCase() : dbState.ugs[idx].codigo,
        };
        persistState();
        return dbState.ugs[idx];
      }
    }
    const newUg: UG = {
      id: `ug-${Date.now()}`,
      codigo: ug.codigo ? ug.codigo.trim().toUpperCase() : `N${dbState.ugs.length + 1}`,
      nome: ug.nome || 'Nova UG',
      descricao: ug.descricao || '',
      ordem: ug.ordem !== undefined ? Number(ug.ordem) : dbState.ugs.length + 1,
    };
    dbState.ugs.push(newUg);
    persistState();
    return newUg;
  },

  async deleteUG(ugId: string): Promise<{ success: boolean; error?: string }> {
    const linkedAreas = dbState.areas.filter((a) => a.ug_id === ugId);
    if (linkedAreas.length > 0) {
      return {
        success: false,
        error: `Esta UG possui ${linkedAreas.length} área${linkedAreas.length > 1 ? 's' : ''} cadastrada${linkedAreas.length > 1 ? 's' : ''}. Remova-as primeiro.`,
      };
    }

    const linkedEquips = dbState.equipamentos.filter((e) => e.ug_id === ugId);
    if (linkedEquips.length > 0) {
      return {
        success: false,
        error: `Esta UG possui ${linkedEquips.length} equipamento${linkedEquips.length > 1 ? 's vinculados' : ' vinculado'}. Remova ou transfira-os primeiro.`,
      };
    }

    dbState.ugs = dbState.ugs.filter((u) => u.id !== ugId);
    persistState();
    return { success: true };
  },

  async saveArea(area: Partial<Area>): Promise<Area> {
    if (area.id) {
      const idx = dbState.areas.findIndex((a) => a.id === area.id);
      if (idx >= 0) {
        dbState.areas[idx] = { ...dbState.areas[idx], ...area };
        persistState();
        return dbState.areas[idx];
      }
    }
    const newArea: Area = {
      id: `area-${Date.now()}`,
      ug_id: area.ug_id || dbState.ugs[0]?.id || 'ug-n1',
      nome: area.nome || 'Nova Área',
      codigo: area.codigo || '',
    };
    dbState.areas.push(newArea);
    persistState();
    return newArea;
  },

  async deleteArea(areaId: string): Promise<{ success: boolean; error?: string }> {
    const linkedLinhas = dbState.linhas.filter((l) => l.area_id === areaId);
    if (linkedLinhas.length > 0) {
      return {
        success: false,
        error: `Esta área possui ${linkedLinhas.length} linha${linkedLinhas.length > 1 ? 's' : ''} cadastrada${linkedLinhas.length > 1 ? 's' : ''}. Remova-as primeiro.`,
      };
    }

    const linkedEquips = dbState.equipamentos.filter((e) => e.area_id === areaId);
    if (linkedEquips.length > 0) {
      return {
        success: false,
        error: `Esta área possui ${linkedEquips.length} equipamento${linkedEquips.length > 1 ? 's vinculados' : ' vinculado'}. Remova ou transfira-os primeiro.`,
      };
    }

    dbState.areas = dbState.areas.filter((a) => a.id !== areaId);
    persistState();
    return { success: true };
  },

  async saveLinha(linha: Partial<Linha>): Promise<Linha> {
    if (linha.id) {
      const idx = dbState.linhas.findIndex((l) => l.id === linha.id);
      if (idx >= 0) {
        dbState.linhas[idx] = { ...dbState.linhas[idx], ...linha };
        persistState();
        return dbState.linhas[idx];
      }
    }
    const newLinha: Linha = {
      id: `linha-${Date.now()}`,
      area_id: linha.area_id || dbState.areas[0]?.id || 'area-1',
      nome: linha.nome || 'Nova Linha',
      codigo: linha.codigo || '',
      codigo_sap: linha.codigo_sap || '',
    };
    dbState.linhas.push(newLinha);
    persistState();
    return newLinha;
  },

  async deleteLinha(linhaId: string): Promise<{ success: boolean; error?: string }> {
    const linkedCentros = dbState.centros_trabalho.filter((c) => c.linha_id === linhaId);
    if (linkedCentros.length > 0) {
      return {
        success: false,
        error: `Esta linha possui ${linkedCentros.length} centro${linkedCentros.length > 1 ? 's' : ''} de trabalho vinculado${linkedCentros.length > 1 ? 's' : ''}. Remova-os primeiro.`,
      };
    }

    const linkedEquips = dbState.equipamentos.filter((e) => e.linha_id === linhaId);
    if (linkedEquips.length > 0) {
      return {
        success: false,
        error: `Esta linha possui ${linkedEquips.length} equipamento${linkedEquips.length > 1 ? 's vinculados' : ' vinculado'}. Remova ou transfira-os primeiro.`,
      };
    }

    dbState.linhas = dbState.linhas.filter((l) => l.id !== linhaId);
    persistState();
    return { success: true };
  },

  async saveCentroTrabalho(ct: Partial<CentroTrabalho>): Promise<CentroTrabalho> {
    if (ct.id) {
      const idx = dbState.centros_trabalho.findIndex((c) => c.id === ct.id);
      if (idx >= 0) {
        dbState.centros_trabalho[idx] = { ...dbState.centros_trabalho[idx], ...ct };
        persistState();
        return dbState.centros_trabalho[idx];
      }
    }
    const newCt: CentroTrabalho = {
      id: `ct-${Date.now()}`,
      linha_id: ct.linha_id || dbState.linhas[0].id,
      nome: ct.nome || 'Novo Centro de Trabalho',
      codigo_sap: ct.codigo_sap,
      descricao: ct.descricao,
    };
    dbState.centros_trabalho.push(newCt);
    persistState();
    return newCt;
  },

  async saveProfile(profile: Partial<Profile>): Promise<Profile> {
    if (profile.id) {
      const idx = dbState.profiles.findIndex((p) => p.id === profile.id);
      if (idx >= 0) {
        dbState.profiles[idx] = { ...dbState.profiles[idx], ...profile };
        persistState();
        return dbState.profiles[idx];
      }
    }
    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      email: profile.email || 'novo.usuario@visioncontrols.com.br',
      nome: profile.nome || 'Novo Usuário',
      cargo: profile.cargo || 'Técnico de Campo',
      role: profile.role || 'TECNICO',
      empresa: profile.empresa || 'VISION CONTROLS',
      telefone: profile.telefone || '',
      ativo: profile.ativo !== false,
      created_at: new Date().toISOString(),
    };
    dbState.profiles.push(newProfile);
    persistState();
    return newProfile;
  },

  async toggleProfileActive(profileId: string, ativo: boolean): Promise<Profile> {
    const prof = dbState.profiles.find((p) => p.id === profileId);
    if (prof) {
      prof.ativo = ativo;
      persistState();
      return prof;
    }
    throw new Error('Perfil não encontrado');
  },

  async createColaborador(data: {
    nome: string;
    email: string;
    senha?: string;
    cargo?: string;
    role: UserRole;
    empresa?: string;
    telefone?: string;
    ativo?: boolean;
  }): Promise<{ success: boolean; profile?: Profile; error?: string }> {
    try {
      // If Supabase is connected, trigger the Edge Function
      if (isSupabaseConfigured) {
        try {
          const { data: resData, error } = await supabase.functions.invoke('criar-usuario', {
            body: {
              email: data.email,
              senha: data.senha || 'Vision@2026',
              nome: data.nome,
              cargo: data.cargo,
              role: data.role,
              empresa: data.empresa || 'VISION CONTROLS',
              telefone: data.telefone,
              ativo: data.ativo !== false,
            },
          });

          if (error) {
            console.warn('Edge function invoke returned error, falling back to local sync:', error);
          }
        } catch (e) {
          console.warn('Edge function invoke error, saving locally:', e);
        }
      }

      // Check if email already exists locally
      const existing = dbState.profiles.find((p) => p.email.toLowerCase() === data.email.toLowerCase());
      if (existing) {
        existing.nome = data.nome;
        existing.cargo = data.cargo;
        existing.role = data.role;
        existing.empresa = data.empresa || 'VISION CONTROLS';
        existing.telefone = data.telefone;
        existing.ativo = data.ativo !== false;
        persistState();
        return { success: true, profile: existing };
      }

      const newProfile: Profile = {
        id: `user-${Date.now()}`,
        email: data.email,
        nome: data.nome,
        cargo: data.cargo || 'Técnico de Campo',
        role: data.role,
        empresa: data.empresa || 'VISION CONTROLS',
        telefone: data.telefone || '',
        ativo: data.ativo !== false,
        created_at: new Date().toISOString(),
      };

      dbState.profiles.push(newProfile);
      persistState();
      return { success: true, profile: newProfile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao cadastrar colaborador' };
    }
  },
};
