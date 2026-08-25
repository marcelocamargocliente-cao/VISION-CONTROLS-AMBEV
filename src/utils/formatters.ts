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
        badgeBg: 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]/40',
        textColor: 'text-[#2ECC71]',
      };
    case 'RESTRICAO':
      return {
        label: 'Restrição Operacional',
        shortLabel: 'Restrição',
        ledClass: 'led-warn',
        badgeBg: 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/40',
        textColor: 'text-[#F5A623]',
      };
    case 'PARADO':
      return {
        label: 'Parado (Crítico)',
        shortLabel: 'Parado',
        ledClass: 'led-alert',
        badgeBg: 'bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/40',
        textColor: 'text-[#E5484D]',
      };
    case 'DESATIVADO':
      return {
        label: 'Desativado',
        shortLabel: 'Desativado',
        ledClass: 'led-off',
        badgeBg: 'bg-[#6B7683]/15 text-[#94A3B8] border-[#6B7683]/40',
        textColor: 'text-[#94A3B8]',
      };
    default:
      return {
        label: status,
        shortLabel: status,
        ledClass: 'led-off',
        badgeBg: 'bg-[#6B7683]/15 text-[#94A3B8] border-[#6B7683]/40',
        textColor: 'text-[#94A3B8]',
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
        badgeBg: 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/40',
      };
    case 'AGUARDANDO_ORCAMENTO':
      return {
        label: 'Aguardando Orçamento',
        step: 2,
        ledClass: 'led-warn',
        badgeBg: 'bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/40',
      };
    case 'ORCAMENTO_ENVIADO':
      return {
        label: 'Orçamento Enviado',
        step: 3,
        ledClass: 'led-warn',
        badgeBg: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40',
      };
    case 'AGUARDANDO_APROVACAO_AMBEV':
      return {
        label: 'Aguard. Aprovação AMBEV',
        step: 4,
        ledClass: 'led-warn',
        badgeBg: 'bg-[#FB923C]/15 text-[#FB923C] border-[#FB923C]/40',
      };
    case 'APROVADA':
      return {
        label: 'Aprovada AMBEV',
        step: 5,
        ledClass: 'led-ok',
        badgeBg: 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/40',
      };
    case 'AGUARDANDO_PECA':
      return {
        label: 'Aguardando Peça',
        step: 6,
        ledClass: 'led-alert',
        badgeBg: 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/40',
      };
    case 'EM_EXECUCAO':
      return {
        label: 'Em Execução de Campo',
        step: 7,
        ledClass: 'led-warn',
        badgeBg: 'bg-[#60A5FA]/15 text-[#60A5FA] border-[#60A5FA]/40',
      };
    case 'CONCLUIDA':
      return {
        label: 'Concluída / OK',
        step: 8,
        ledClass: 'led-ok',
        badgeBg: 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]/40',
      };
    case 'CANCELADA':
      return {
        label: 'Cancelada',
        step: 0,
        ledClass: 'led-off',
        badgeBg: 'bg-[#6B7683]/15 text-[#94A3B8] border-[#6B7683]/40',
      };
    default:
      return {
        label: status,
        step: 1,
        ledClass: 'led-off',
        badgeBg: 'bg-[#6B7683]/15 text-[#94A3B8] border-[#6B7683]/40',
      };
  }
}

export function getCriticidadeConfig(crit: Criticidade) {
  switch (crit) {
    case 'CRITICA':
      return {
        label: 'Crítica (Linha)',
        badgeBg: 'bg-[#E5484D]/20 text-[#FF6B6B] border-[#E5484D]/50 font-bold',
      };
    case 'ALTA':
      return {
        label: 'Alta',
        badgeBg: 'bg-[#F97316]/20 text-[#FB923C] border-[#F97316]/50',
      };
    case 'MEDIA':
      return {
        label: 'Média',
        badgeBg: 'bg-[#F5A623]/20 text-[#FCD34D] border-[#F5A623]/50',
      };
    case 'BAIXA':
      return {
        label: 'Baixa',
        badgeBg: 'bg-[#38BDF8]/20 text-[#7DD3FC] border-[#38BDF8]/50',
      };
    default:
      return {
        label: crit,
        badgeBg: 'bg-[#6B7683]/20 text-[#CBD5E1] border-[#6B7683]/50',
      };
  }
}

export function getRoleBadge(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return { label: 'ADMINISTRADOR', badgeClass: 'bg-[#E5484D]/15 text-[#FF6B6B] border-[#E5484D]/40' };
    case 'GESTOR':
      return { label: 'GESTOR', badgeClass: 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/40' };
    case 'ENCARREGADO':
      return { label: 'ENCARREGADO', badgeClass: 'bg-[#FCD34D]/15 text-[#FCD34D] border-[#FCD34D]/40' };
    case 'TECNICO':
      return { label: 'TÉCNICO', badgeClass: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40' };
    default:
      return { label: 'VISUALIZADOR', badgeClass: 'bg-[#94A3B8]/15 text-[#94A3B8] border-[#94A3B8]/40' };
  }
}

export function getOrcamentoStatusConfig(status: OrcamentoStatus) {
  switch (status) {
    case 'RASCUNHO':
    case 'ELABORACAO':
      return {
        label: 'Rascunho',
        badgeBg: 'bg-[#94A3B8]/20 text-[#CBD5E1] border-[#94A3B8]/40',
        textColor: 'text-[#CBD5E1]',
        color: '#94A3B8',
        borderTopColor: '#94A3B8',
      };
    case 'ENVIADO':
      return {
        label: 'Enviado',
        badgeBg: 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40',
        textColor: 'text-[#38BDF8]',
        color: '#38BDF8',
        borderTopColor: '#38BDF8',
      };
    case 'EM_ANALISE':
    case 'EM_ANALISE_AMBEV':
      return {
        label: 'Em Análise AMBEV',
        badgeBg: 'bg-[#F5A623]/20 text-[#F5A623] border-[#F5A623]/40',
        textColor: 'text-[#F5A623]',
        color: '#F5A623',
        borderTopColor: '#F5A623',
      };
    case 'APROVADO':
    case 'APROVADO_AMBEV':
    case 'FATURADO':
      return {
        label: 'Aprovado AMBEV',
        badgeBg: 'bg-[#2ECC71]/20 text-[#2ECC71] border-[#2ECC71]/40',
        textColor: 'text-[#2ECC71]',
        color: '#2ECC71',
        borderTopColor: '#2ECC71',
      };
    case 'REPROVADO':
    case 'REJEITADO':
    case 'REJEITADO_AMBEV':
      return {
        label: 'Reprovado AMBEV',
        badgeBg: 'bg-[#E5484D]/20 text-[#FF6B6B] border-[#E5484D]/40',
        textColor: 'text-[#FF6B6B]',
        color: '#E5484D',
        borderTopColor: '#E5484D',
      };
    case 'EXPIRADO':
      return {
        label: 'Expirado',
        badgeBg: 'bg-[#64748B]/20 text-[#94A3B8] border-[#64748B]/40',
        textColor: 'text-[#94A3B8]',
        color: '#64748B',
        borderTopColor: '#64748B',
      };
    case 'CANCELADO':
      return {
        label: 'Cancelado',
        badgeBg: 'bg-[#6B7683]/20 text-[#94A3B8] border-[#6B7683]/40',
        textColor: 'text-[#94A3B8]',
        color: '#6B7683',
        borderTopColor: '#6B7683',
      };
    default:
      return {
        label: status,
        badgeBg: 'bg-[#94A3B8]/20 text-[#CBD5E1] border-[#94A3B8]/40',
        textColor: 'text-[#CBD5E1]',
        color: '#94A3B8',
        borderTopColor: '#94A3B8',
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
