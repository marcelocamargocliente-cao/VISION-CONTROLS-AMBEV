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
        label: 'Restrição Operacional',
        shortLabel: 'Restrição',
        ledClass: 'led-warn',
        badgeBg: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30',
        textColor: 'text-[#D29922]',
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
      return {
        label: 'Aberta',
        step: 1,
        ledClass: 'led-warn',
        badgeBg: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30',
      };
    case 'AGUARDANDO_ORCAMENTO':
      return {
        label: 'Aguardando Orçamento',
        step: 2,
        ledClass: 'led-warn',
        badgeBg: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30',
      };
    case 'ORCAMENTO_ENVIADO':
      return {
        label: 'Orçamento Enviado',
        step: 3,
        ledClass: 'led-warn',
        badgeBg: 'bg-[#2F81F7]/15 text-[#58A6FF] border-[#2F81F7]/30',
      };
    case 'AGUARDANDO_APROVACAO_AMBEV':
      return {
        label: 'Aguard. Aprovação AMBEV',
        step: 4,
        ledClass: 'led-warn',
        badgeBg: 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/30',
      };
    case 'APROVADA':
      return {
        label: 'Aprovada AMBEV',
        step: 5,
        ledClass: 'led-ok',
        badgeBg: 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30',
      };
    case 'AGUARDANDO_PECA':
      return {
        label: 'Aguardando Peça',
        step: 6,
        ledClass: 'led-alert',
        badgeBg: 'bg-[#F85149]/15 text-[#F85149] border-[#F85149]/30',
      };
    case 'EM_EXECUCAO':
      return {
        label: 'Em Execução de Campo',
        step: 7,
        ledClass: 'led-warn',
        badgeBg: 'bg-[#2F81F7]/15 text-[#58A6FF] border-[#2F81F7]/30',
      };
    case 'CONCLUIDA':
      return {
        label: 'Concluída / OK',
        step: 8,
        ledClass: 'led-ok',
        badgeBg: 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/30',
      };
    case 'CANCELADA':
      return {
        label: 'Cancelada',
        step: 0,
        ledClass: 'led-off',
        badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]',
      };
    default:
      return {
        label: status,
        step: 1,
        ledClass: 'led-off',
        badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]',
      };
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
        badgeBg: 'bg-[#30363D]/40 text-[#8B949E] border-[#30363D]',
        textColor: 'text-[#8B949E]',
        color: '#484F58',
        borderTopColor: '#484F58',
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

export function gerarNumeroRevisao(numeroAtual: string = ''): string {
  if (!numeroAtual) {
    return gerarNumeroOrcamento();
  }
  const revMatch = numeroAtual.match(/^(.*?)-REV(\d+)$/i);
  if (revMatch) {
    const base = revMatch[1];
    const nextRev = parseInt(revMatch[2], 10) + 1;
    return `${base}-REV${nextRev}`;
  }
  return `${numeroAtual}-REV2`;
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

export function buildOrcamentoShareText(data: ShareOrcamentoData): string {
  const parts: string[] = [];
  parts.push('*INTEGRAÇÃO VISION CONTROLS AMBEV*');
  parts.push(`*Proposta de Manutenção — ${data.numero}*`);
  parts.push('');
  parts.push(`Equipamento: TAG ${data.tag} — ${data.tipo} ${data.marca || ''} ${data.modelo || ''}`.trim());
  parts.push(`Local: ${data.ug || 'N/D'} / ${data.area || 'N/D'} / ${data.linha || 'N/D'} / ${data.centro_trabalho || 'N/D'}`);
  parts.push(`Parado há: ${data.dias_parado ?? 0} dias`);
  parts.push('');
  parts.push(`*Fornecedor:* ${data.fornecedor || 'Vision Controls / Parceiro'}`);
  parts.push(`*Valor:* ${formatCurrency(data.valor_total)}`);
  parts.push(`*Validade:* ${data.validade ? formatDate(data.validade) : '30 dias'}`);
  parts.push(`*Status:* ${data.status}`);
  parts.push(`*Enviado para:* ${data.enviado_para || 'Engenharia AMBEV RJ'}`);
  parts.push('');
  parts.push(`Ocorrência OS #${data.numero_ocorrencia || 'N/D'}`);
  if (data.link_pdf) {
    parts.push(data.link_pdf);
  }
  parts.push('');
  parts.push('_Vision Controls — HVAC Industrial_');

  return parts.join('\n');
}

export function buildOrcamentoEmailContent(data: ShareOrcamentoData) {
  const subject = `[IVCA] Proposta ${data.numero} — TAG ${data.tag} — ${data.linha || 'AMBEV RJ'}`;
  const body = buildOrcamentoShareText(data).replace(/\*/g, '').replace(/_/g, '');
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

  return parts.join('\n');
}

export function buildEmailShareContent(data: ShareOccurrenceData) {
  const subject = `[IVCA] Ocorrência #${data.numero} — TAG ${data.tag} — ${data.linha || 'AMBEV RJ'}`;
  const body = buildWhatsAppShareText(data).replace(/\*/g, '');
  return { subject, body };
}
