import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  EquipStatus, 
  OcorrenciaStatus, 
  Criticidade, 
  PecaStatus, 
  OrcamentoStatus, 
  UserRole,
  TipoServico 
} from '../types/database';

/**
 * HIERARQUIA DE LOCALIZAÇÃO AMBEV
 *
 * Exemplo completo: N1 - 01310 - SUBCONJ COMUNS - VP131004
 *
 * UG (1º nível)
 *   N1, N2, N3, N4 — o prédio/bloco
 *   SEMPRE presente | banco: ugs.codigo
 *
 * LOCAL DE INSTALAÇÃO (2º + 3º nível juntos)
 *   código numérico (01310) + nome descritivo (SUBCONJ COMUNS)
 *   exibir sempre juntos separados por " - "
 *   o código numérico também é chamado de "Linha" para fins de filtro
 *   NEM SEMPRE presente | banco: codigo_sap + maquina
 *
 * TAG AMBEV (4º nível)
 *   VP131004, ACO501001 — ponto exato no SAP
 *   NEM SEMPRE presente | banco: tag_sap
 */
/**
 * Extrai o Local de Instalação a partir do Centro de Trabalho da planilha:
 * Ex: "N2-05010-EDIFICIO 01       -ACO501001" → "EDIFICIO 01"
 * Ex: "N2-05060-DESENCAIXOTADOR 01-ACO506136" → "DESENCAIXOTADOR 01"
 * Ex: "N2-05050-EDIFICIO 01"                  → "EDIFICIO 01"
 * Ex: "N3-05140"                              → ""
 */
export const extrairLocal = (ct?: string | null): string => {
  if (!ct) return '';
  // Remove prefixo UG-codigo- e sufixo -ACOxxxxxx
  const semUG = ct.replace(/^N\d-\d{5}-/, '');       // remove "N2-05010-"
  const semTag = semUG.replace(/\s*-ACO\w+\s*$/i, '') // remove " -ACO501001"
    .replace(/\s*\/\s*LINHA\s+\d+(\s+E\s+\d+)?/i, '') // remove " / LINHA 512"
    .trim();
  return semTag || '';
};

/**
 * Define o status operacional do equipamento conforme regras da planilha:
 * - Tag 360 = PARADO (ou status explícito na planilha)
 * - NOK no levantamento = RESTRICAO
 * - Demais = OK
 */
export const definirStatus = (
  tagVision: number | string,
  statusPlanilha?: string | null,
  statusLevantamento?: string | null
): EquipStatus => {
  if (String(tagVision) === '360' || statusPlanilha === 'PARADO') return 'PARADO';
  if (statusLevantamento === 'NOK') return 'RESTRICAO';
  return 'OK';
};

export function montarLocalizacao(equip: any): string {
  if (!equip) return '';
  const partes: string[] = [];

  // 1º nível — UG sempre
  if (equip.ug_codigo || equip.ug) {
    partes.push(`UG ${equip.ug_codigo || equip.ug}`);
  }

  // 2º nível — Local de Instalação extraído ou do CT
  const localExtraido = extrairLocal(equip.centro_trabalho || equip.centro_trabalho_nome);
  if (localExtraido) {
    partes.push(localExtraido);
  } else {
    const codigo = equip.codigo_sap || equip.centro_trabalho_sap;
    const maquina = equip.maquina || equip.centro_trabalho_nome;
    const localInstalacao = [codigo, maquina].filter(Boolean).join(' - ');
    if (localInstalacao) {
      partes.push(localInstalacao);
    } else if (equip.linha_nome || equip.linha) {
      partes.push(equip.linha_nome || equip.linha);
    }
  }

  // 3º nível — Tag AMBEV / Tag SAP só se existir
  if (equip.tag_sap) {
    partes.push(equip.tag_sap);
  }

  return partes.join(' · ');
}

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateString;
  }
}

export function calculateDaysDiff(dateString?: string | null): number {
  if (!dateString) return 0;
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const days = differenceInDays(now, date);
    return Math.max(0, days);
  } catch {
    return 0;
  }
}

export function getEquipStatusConfig(status: EquipStatus) {
  switch (status) {
    case 'OK':
      return {
        label: 'Operando (OK)',
        shortLabel: 'OK',
        ledClass: 'led-ok',
        badgeBg: 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30',
        textColor: 'text-[#3FB950]',
      };
    case 'RESTRICAO':
      return {
        label: 'NOK',
        shortLabel: 'NOK',
        ledClass: 'led-alert',
        badgeBg: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/40',
        textColor: 'text-[#F85149]',
      };
    case 'PARADO':
      return {
        label: 'Parado (Crítico)',
        shortLabel: 'Parado',
        ledClass: 'led-alert',
        badgeBg: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30',
        textColor: 'text-[#F85149]',
      };
    case 'DESATIVADO':
      return {
        label: 'Desativado',
        shortLabel: 'Desativado',
        ledClass: 'led-off',
        badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]',
        textColor: 'text-[#8B949E]',
      };
    default:
      return {
        label: status,
        shortLabel: status,
        ledClass: 'led-off',
        badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]',
        textColor: 'text-[#8B949E]',
      };
  }
}

export function getOcorrenciaStatusConfig(status: OcorrenciaStatus) {
  switch (status) {
    case 'ABERTA':
      return { label: 'Aberta', step: 1, ledClass: 'led-warn', badgeBg: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30' };
    case 'AGUARDANDO_ORCAMENTO':
      return { label: 'Aguardando Orçamento', step: 2, ledClass: 'led-warn', badgeBg: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30' };
    case 'ORCAMENTO_INTERNO_FEITO':
      return { label: 'Orçamento Interno Feito', step: 3, ledClass: 'led-warn', badgeBg: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30' };
    case 'PPAC_ENVIADO':
      return { label: 'PPAC Enviado', step: 4, ledClass: 'led-warn', badgeBg: 'bg-[#58A6FF]/15 text-[#58A6FF] border-[#58A6FF]/30' };
    case 'AGUARDANDO_APROVACAO_AMBEV':
      return { label: 'Aguard. Aprovação AMBEV', step: 4, ledClass: 'led-warn', badgeBg: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30' };
    case 'RC_GERADA':
      return { label: 'RC Gerada', step: 5, ledClass: 'led-warn', badgeBg: 'bg-[#A371F7]/15 text-[#A371F7] border-[#A371F7]/30' };
    case 'PEDIDO_DE_COMPRA':
      return { label: 'Pedido de Compra', step: 6, ledClass: 'led-ok', badgeBg: 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30' };
    case 'AGUARDANDO_PECA':
      return { label: 'Aguardando Peça', step: 6, ledClass: 'led-alert', badgeBg: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30' };
    case 'EM_EXECUCAO':
      return { label: 'Em Execução de Campo', step: 7, ledClass: 'led-warn', badgeBg: 'bg-[#2F81F7]/15 text-[#58A6FF] border-[#2F81F7]/30' };
    case 'CONCLUIDA':
      return { label: 'Concluída', step: 8, ledClass: 'led-ok', badgeBg: 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30' };
    case 'CANCELADA':
      return { label: 'Cancelada', step: 0, ledClass: 'led-off', badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]' };
    default:
      return { label: status, step: 1, ledClass: 'led-off', badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]' };
  }
}
export function getCriticidadeConfig(crit: Criticidade) {
  switch (crit) {
    case 'CRITICA':
      return {
        label: 'Crítica (Linha)',
        badgeBg: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/40 font-bold',
      };
    case 'ALTA':
      return {
        label: 'Alta',
        badgeBg: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30',
      };
    case 'MEDIA':
      return {
        label: 'Média',
        badgeBg: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30',
      };
    case 'BAIXA':
      return {
        label: 'Baixa',
        badgeBg: 'bg-[#2F81F7]/15 text-[#58A6FF] border-[#2F81F7]/30',
      };
    default:
      return {
        label: crit,
        badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]',
      };
  }
}

export function getRoleBadge(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return { label: 'ADMINISTRADOR', badgeClass: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30' };
    case 'GESTOR':
      return { label: 'GESTOR', badgeClass: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30' };
    case 'ENCARREGADO':
      return { label: 'ENCARREGADO', badgeClass: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30' };
    case 'TECNICO':
      return { label: 'TÉCNICO', badgeClass: 'bg-[#2F81F7]/15 text-[#58A6FF] border-[#2F81F7]/30' };
    default:
      return { label: 'VISUALIZADOR', badgeClass: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]' };
  }
}

export function getOrcamentoStatusConfig(status: OrcamentoStatus) {
  switch (status) {
    case 'RASCUNHO':
    case 'ELABORACAO':
      return {
        label: 'Rascunho',
        badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]',
        textColor: 'text-[#8B949E]',
        color: '#8B949E',
        borderTopColor: '#8B949E',
      };
    case 'ENVIADO':
      return {
        label: 'Enviado',
        badgeBg: 'bg-[#2F81F7]/15 text-[#58A6FF] border-[#2F81F7]/30',
        textColor: 'text-[#58A6FF]',
        color: '#2F81F7',
        borderTopColor: '#2F81F7',
      };
    case 'EM_ANALISE':
    case 'EM_ANALISE_AMBEV':
      return {
        label: 'Em Análise AMBEV',
        badgeBg: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30',
        textColor: 'text-[#D29922]',
        color: '#D29922',
        borderTopColor: '#D29922',
      };
    case 'APROVADO':
    case 'APROVADO_AMBEV':
    case 'FATURADO':
      return {
        label: 'Aprovado AMBEV',
        badgeBg: 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30',
        textColor: 'text-[#3FB950]',
        color: '#3FB950',
        borderTopColor: '#3FB950',
      };
    case 'REPROVADO':
    case 'REJEITADO':
    case 'REJEITADO_AMBEV':
      return {
        label: 'Reprovado AMBEV',
        badgeBg: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30',
        textColor: 'text-[#F85149]',
        color: '#F85149',
        borderTopColor: '#F85149',
      };
    case 'EXPIRADO':
      return {
        label: 'Expirado',
        badgeBg: 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/40',
        textColor: 'text-[#F5A623]',
        color: '#F5A623',
        borderTopColor: '#F5A623',
      };
    case 'CANCELADO':
      return {
        label: 'Cancelado',
        badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]',
        textColor: 'text-[#8B949E]',
        color: '#484F58',
        borderTopColor: '#484F58',
      };
    default:
      return {
        label: status,
        badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]',
        textColor: 'text-[#8B949E]',
        color: '#8B949E',
        borderTopColor: '#8B949E',
      };
  }
}

export function gerarNumeroOrcamento(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `ORC-${yyyy}-${mm}${dd}-REV1`;
}

export function gerarNumeroRevisao(numeroAtual: string = '', ordemSap?: string): string {
  // Use ordem_sap as base when available (ex: 10000878484-REV2)
  const base = ordemSap || numeroAtual || gerarNumeroOrcamento();
  const revMatch = base.match(/^(.*?)-REV(\d+)$/i);
  if (revMatch) {
    const b = revMatch[1];
    const nextRev = parseInt(revMatch[2], 10) + 1;
    return `${b}-REV${nextRev}`;
  }
  // strip existing REV from original if base is ordem_sap and numero has REV
  if (ordemSap && numeroAtual) {
    const existingRev = numeroAtual.match(/-REV(\d+)$/i);
    if (existingRev) {
      const nextRev = parseInt(existingRev[1], 10) + 1;
      return `${ordemSap}-REV${nextRev}`;
    }
  }
  return `${base}-REV2`;
}

export interface ShareOrcamentoData {
  numero: string;
  tag: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  ug?: string;
  area?: string;
  linha?: string;
  centro_trabalho?: string;
  dias_parado?: number;
  fornecedor: string;
  valor_total: number;
  validade?: string;
  status: string;
  enviado_para?: string;
  numero_ocorrencia?: number | string;
  link_pdf?: string;
}

export function buildOrcamentoShareText(data: ShareOrcamentoData & { data_envio?: string, dias_aguardando?: number, descricao_ocorrencia?: string, maquina?: string }): string {
  const equipDesc = [data.tipo, data.marca, data.modelo].filter(Boolean).join(' ');
  const locParts = [
    data.ug ? (data.ug.startsWith('UG') ? data.ug : `UG ${data.ug}`) : '',
    data.linha,
    data.centro_trabalho || data.maquina
  ].filter(Boolean).join(' · ');

  const valorFormated = Number(data.valor_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const desc = data.descricao_ocorrencia ? ` — ${data.descricao_ocorrencia.substring(0, 80)}` : '';

  const pdfStr = data.link_pdf ? `\n📎 PDF: ${data.link_pdf}` : '';

  return `*INTEGRAÇÃO VISION CONTROLS AMBEV*
*Proposta ${data.numero}* — ${data.status}

Equipamento: TAG ${data.tag || 'N/D'} — ${equipDesc}
${locParts}
Parado há: ${data.dias_parado ?? '—'} dias

*Fornecedor:* ${data.fornecedor ?? '—'}
*Valor Total:* R$ ${valorFormated}
*Data de Envio:* ${data.data_envio ?? '—'}
*Validade:* ${data.validade ?? '—'}
*Enviado para:* ${data.enviado_para ?? '—'}

OS #${data.numero_ocorrencia ?? '—'}${desc}${pdfStr}

_Vision Controls — HVAC Industrial AMBEV RJ_`.trim();
}

export function buildOrcamentoEmailContent(data: ShareOrcamentoData & {
  numero_ocorrencia?: number | string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  tag_ambev?: string;
  ug?: string;
  linha?: string;
  ordem_sap?: string;
  local_instalacao?: string;
  pecas?: Array<{ descricao?: string; part_number?: string; quantidade?: number; valor_unitario?: string | number; ncm?: string }>;
}) {
  const formatValidade = (v?: string) => {
    if (!v) return '—';
    try { return new Date(v).toLocaleDateString('pt-BR'); } catch { return v; }
  };

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const equipDesc = [data.tipo, data.marca, data.modelo].filter(Boolean).join(' ');
  const tagAmbev = data.tag_ambev || data.tag || '';
  const localInstalacao = data.local_instalacao || data.linha || '';
  const ordemRef = data.ordem_sap || String(data.numero_ocorrencia || '');
  const enviado = data.enviado_para || 'Ambev Nova Rio';

  // Assunto fiel ao modelo real da proposta Vision
  const subject = [
    'PPAC N\u00ba ' + data.numero,
    'PROPOSTA COMERCIAL VISION CONTROLS',
    equipDesc || 'HVAC INDUSTRIAL',
    tagAmbev ? 'TAG AMBEV ' + tagAmbev : '',
  ].filter(Boolean).join(' \u2014 ');

  const valorFmt = Number(data.valor_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Tabela de itens fiel ao modelo da proposta
  const buildTabela = () => {
    if (!data.pecas || data.pecas.length === 0) return '  (Ver itens detalhados no PDF em anexo)';
    const header = '  Item | Qtd. | Descri\u00e7\u00e3o                              | NCM         | Vlr. Unit.   | Vlr. Total';
    const sep    = '  -----+------+---------------------------------------+-------------+--------------+------------';
    const rows = (data.pecas as any[]).map((p: any, i: number) => {
      const rawUnit = typeof p.valor_unitario === 'string'
        ? p.valor_unitario.replace(/\./g, '').replace(',', '.')
        : String(p.valor_unitario ?? 0);
      const unitario = parseFloat(rawUnit) || 0;
      const qtd = Number(p.quantidade ?? 1);
      const totalItem = unitario * qtd;
      const unitFmt  = 'R$ ' + unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const totalFmt = 'R$ ' + totalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const ncm  = p.ncm?.trim() || '-';
      const desc = (p.descricao || '').substring(0, 37).padEnd(37);
      return '  ' + String(i + 1).padStart(4) + ' | ' + String(qtd).padStart(4) + ' | ' + desc + ' | ' + ncm.padEnd(11) + ' | ' + unitFmt.padStart(12) + ' | ' + totalFmt.padStart(11);
    });
    const totalLine = '\n                                                      VALOR TOTAL DOS ITENS:   R$ ' + valorFmt;
    return [header, sep, ...rows, totalLine].join('\n');
  };

  const nl = '\n';
  const sep = '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';

  const lines: string[] = [
    'VISION CONTROLS',
    'VISION CONTROLS ASSOCIADOS LTDA',
    'Rua Almirante Tamandar\u00e9, 515, Alto da XV \u2014 Curitiba/PR',
    'CNPJ: 10.823.200/0001-06   Fone: (41) 3667-9835',
    nl,
    sep,
    'PPAC N\u00ba ' + data.numero,
    sep,
    nl,
    '\u00c0',
    nl,
    enviado,
    'Ref.: Fornecimento de Pe\u00e7as para equipamentos de refrigera\u00e7\u00e3o',
    nl,
    today,
    nl,
    'Prezado(a),',
    'Apresentamos nossa proposta comercial para fornecimento de pe\u00e7as para equipamentos de refrigera\u00e7\u00e3o, conforme sua solicita\u00e7\u00e3o.',
    nl,
    sep,
    '1.0 Escopo de Fornecimento',
    sep,
    nl,
    'Setor: ' + (data.ug || '\u2014') + (localInstalacao ? ' / ' + localInstalacao : '') + (tagAmbev ? '   /   Tag: ' + tagAmbev : ''),
    ordemRef ? 'Ordem SAP / OS: ' + ordemRef : '',
    'Equipamento: ' + equipDesc,
    nl,
    buildTabela(),
    nl,
    '1.1 Excluso Fornecimento.',
    'Qualquer item n\u00e3o contemplado neste Escopo de Fornecimento.',
    nl,
    sep,
    '2.0 Condi\u00e7\u00f5es Comerciais.',
    sep,
    nl,
    'VALOR TOTAL: R$ ' + valorFmt,
    'Os pre\u00e7os apresentados incluem todos os impostos, taxas, direitos e outros encargos federais, estaduais e municipais.',
    nl,
    sep,
    '3.0 Forma de Pagamento / Parcelamento.',
    sep,
    nl,
    '30 dias',
    nl,
    sep,
    '4.0 Validade da Proposta.',
    sep,
    nl,
    'O pre\u00e7o ajustado nesta proposta ser\u00e1 mantido por um per\u00edodo de 20 dias da data de emiss\u00e3o (v\u00e1lido at\u00e9 ' + formatValidade(data.validade) + '), quando poder\u00e1 ser reajustado com base no IGPM/FGV.',
    nl,
    sep,
    '5.0 Prazo de Entrega.',
    sep,
    nl,
    '07 dias \u00fateis ap\u00f3s confirma\u00e7\u00e3o do pedido.',
    nl,
    sep,
    '6.0 Aceita\u00e7\u00e3o de Pedidos.',
    sep,
    nl,
    'A confirma\u00e7\u00e3o da proposta dever\u00e1 ser apresentada atrav\u00e9s de documento com assinaturas autorizadas, formalizando assim a concord\u00e2ncia do fornecimento e observ\u00e2ncia de todas as cl\u00e1usulas e condi\u00e7\u00f5es constantes na proposta comercial. O comprovante de que \u00e9 uma assinatura autorizada dever\u00e1 vir junto com a confirma\u00e7\u00e3o do pedido.',
    nl,
    sep,
    '7.0 Informa\u00e7\u00f5es para Cadastro.',
    sep,
    nl,
    'Raz\u00e3o Social:             VISION CONTROLS ASSOCIADOS LTDA',
    'Nome Fantasia:            VISION CONTROLS',
    'Inscri\u00e7\u00e3o Estadual:       9048501360',
    'Cadastro Junta Comercial: 20092507247',
    'CNPJ:                     10.823.200/0001-06',
    'Endere\u00e7o:                 Rua Almirante Tamandar\u00e9, 515 \u2014 Alto da XV \u2014 Curitiba/PR \u2014 CEP 80045-110',
    'Telefone:                 (41) 3667-9835',
    nl,
    sep,
    nl,
    'Ficamos \u00e0 disposi\u00e7\u00e3o para esclarecimentos e aguardamos aprova\u00e7\u00e3o.',
    nl,
    'Atenciosamente,',
    nl,
    'VISION CONTROLS ASSOCIADOS LTDA',
    'Jaqueline Maria Pacheco',
    'Analista Comercial',
    'Fone: (41) 3667-9835',
  ];

  const body = lines.filter(l => l !== null && l !== undefined).join('\n');
  return { subject, body };
}
export interface ShareOccurrenceData {
  numero: number;
  tag: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  ug?: string;
  area?: string;
  linha?: string;
  centro_trabalho?: string;
  data_avaria?: string;
  dias_parado?: number;
  nota_sap?: string;
  ordem_sap?: string;
  ordem_vision?: string;
  status: string;
  pecas_resumo?: string;
  orcamento_numero?: string;
  orcamento_valor?: number;
  orcamento_link?: string;
  anexos_links?: { nome: string; url: string }[];
}

export function buildWhatsAppShareText(data: ShareOccurrenceData): string {
  const parts: string[] = [];
  parts.push(`*INTEGRAÇÃO VISION CONTROLS AMBEV — Ocorrência #${data.numero}*`);
  parts.push(`Equipamento: TAG ${data.tag} — ${data.tipo} ${data.marca || ''} ${data.modelo || ''}`.trim());
  parts.push(`Local: ${data.ug || 'N/D'} / ${data.area || 'N/D'} / ${data.linha || 'N/D'} / ${data.centro_trabalho || 'N/D'}`);
  parts.push(`Avaria em: ${formatDate(data.data_avaria)} (${data.dias_parado ?? 0} dias parado)`);
  parts.push(`Nota AMBEV: ${data.nota_sap || '-'} | Ordem: ${data.ordem_sap || '-'}`);
  if (data.ordem_vision) {
    parts.push(`Ordem Vision: ${data.ordem_vision}`);
  }
  parts.push(`Status: ${data.status}`);
  if (data.pecas_resumo) {
    parts.push(`Peças: ${data.pecas_resumo}`);
  }
  if (data.orcamento_numero || data.orcamento_valor) {
    parts.push(`Orçamento: ${data.orcamento_numero || '-'} — ${formatCurrency(data.orcamento_valor)}`);
  }
  if (data.orcamento_link) {
    parts.push(`PDF do Orçamento: ${data.orcamento_link}`);
  }
  if (data.anexos_links && data.anexos_links.length > 0) {
    parts.push(`Anexos:\n${data.anexos_links.map((a) => `- ${a.nome}: ${a.url}`).join('\n')}`);
  }

  return parts.join('\n');
}

export function buildEmailShareContent(data: ShareOccurrenceData) {
  const subject = `[IVCA] Ocorrência #${data.numero} — TAG ${data.tag} — ${data.linha || 'AMBEV RJ'}`;
  const body = buildWhatsAppShareText(data).replace(/\*/g, '');
  return { subject, body };
}
