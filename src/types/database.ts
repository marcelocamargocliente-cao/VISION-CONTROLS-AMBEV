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

export type EquipStatus = 'OK' | 'RESTRICAO' | 'PARADO' | 'DESATIVADO';

export type OcorrenciaStatus = 
  | 'ABERTA'
  | 'AGUARDANDO_ORCAMENTO'
  | 'ORCAMENTO_ENVIADO'
  | 'AGUARDANDO_APROVACAO_AMBEV'
  | 'APROVADA'
  | 'AGUARDANDO_PECA'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type TipoServico = 'CORRETIVA' | 'PREVENTIVA' | 'PREDITIVA' | 'MELHORIA' | 'INSTALACAO';
export type Criticidade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type PecaStatus = 'SOLICITADA' | 'COTACAO' | 'APROVADA' | 'COMPRADA' | 'ENTREGUE' | 'APLICADA' | 'PENDENTE_COTACAO' | 'COTADA' | 'APROVADA_COMPRA' | 'RECEBIDA' | 'INSTALADA';
export type OrcamentoStatus = 
  | 'RASCUNHO'
  | 'ENVIADO'
  | 'EM_ANALISE'
  | 'EM_ANALISE_AMBEV'
  | 'APROVADO'
  | 'APROVADO_AMBEV'
  | 'REPROVADO'
  | 'REJEITADO'
  | 'REJEITADO_AMBEV'
  | 'EXPIRADO'
  | 'CANCELADO'
  | 'ELABORACAO'
  | 'FATURADO';
export type UserRole = 'ADMIN' | 'GESTOR' | 'ENCARREGADO' | 'TECNICO' | 'VISUALIZADOR';

export type PecaPendente = Peca;

export interface Profile {
  id: string;
  email: string;
  nome: string;
  cargo?: string;
  role: UserRole;
  empresa: string;
  telefone?: string;
  ativo?: boolean;
  created_at?: string;
}

export interface UG {
  id: string;
  codigo: string; // 'N1', 'N2', 'N3', 'N4', 'N5'
  nome: string;
  descricao?: string;
  ordem?: number;
}

export interface Area {
  id: string;
  ug_id: string;
  nome: string;
  codigo?: string;
}

export interface Linha {
  id: string;
  area_id: string;
  nome: string;
  codigo?: string;
  codigo_sap?: string;
}

export interface CentroTrabalho {
  id: string;
  linha_id: string;
  nome: string;
  codigo_sap?: string;
  descricao?: string;
}

export interface Equipamento {
  id: string;
  tag: string;
  patrimonio?: string;
  tag_sap?: string;
  tipo: string; // 'CPE (PORTA)', 'CPE (TETO)', 'SPLITÃO', 'CHILLER A AR', 'CAMARA FRIA', 'FANCOIL', 'SPLIT SYSTEM', 'CHILLER A ÁGUA'
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  capacidade?: string; // ex: '710W', '1660W', '2550W', '60.000 BTU/h', '10 TR', '120 TR'
  tensao?: string;
  corrente?: string;
  gas_refrigerante?: string;
  ano_fabricacao?: number;
  ppac?: string; // Plano de Manutenção
  ug_id?: string;
  ug_codigo?: string;
  area_id?: string;
  linha_id?: string;
  centro_trabalho_id?: string;
  centro_trabalho?: string; // ex: N2-05010-EDIFICIO 01 -ACO501001
  sublocal?: string;
  status: EquipStatus;
  observacoes?: string;
  qr_slug?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Ocorrencia {
  id: string;
  numero: number;
  equipamento_id: string;
  tipo_servico: TipoServico;
  criticidade: Criticidade;
  status: OcorrenciaStatus;
  data_avaria: string;
  previsao_retorno?: string;
  relatante_nome: string;
  relatante_id?: string;
  tecnico_responsavel_id?: string;
  tecnico_responsavel_nome?: string;
  descricao_anomalia: string;
  causa_provavel?: string;
  nota_sap?: string;
  ordem_sap?: string;
  ordem_vision?: string;
  ppac?: string;
  equipamento_parado: boolean;
  parou_linha: boolean;
  data_conclusao?: string;
  created_at: string;
  updated_at?: string;
}

export interface Peca {
  id: string;
  ocorrencia_id: string;
  descricao: string;
  part_number?: string;
  fabricante?: string;
  quantidade: number;
  unidade?: string;
  fornecedor?: string;
  valor_unitario?: number;
  previsao_entrega?: string;
  status: PecaStatus;
  data_aplicacao?: string;
  created_at: string;
}

export interface Orcamento {
  id: string;
  ocorrencia_id: string;
  numero: string;
  fornecedor: string;
  valor_total: number;
  data_envio?: string;
  enviado_para?: string;
  validade?: string;
  status: OrcamentoStatus;
  arquivo_pdf_url?: string;
  arquivo_url?: string;
  descricao_anomalia?: string;
  observacoes?: string;
  pecas?: Array<{
    descricao: string;
    part_number?: string;
    quantidade: number;
    valor_unitario?: number | string;
  }>;
  created_at: string;
}

export interface Anexo {
  id: string;
  ocorrencia_id?: string;
  equipamento_id?: string;
  nome_arquivo: string;
  url: string;
  tipo_anexo: 'FOTO' | 'DOCUMENTO' | 'LAUDO' | 'OUTRO';
  bucket: 'fotos' | 'documentos';
  created_at: string;
}

export interface OcorrenciaEvento {
  id: string;
  ocorrencia_id: string;
  usuario_id?: string;
  usuario_nome: string;
  tipo_evento: 'CRIACAO' | 'MUDANCA_STATUS' | 'COMENTARIO' | 'PECA_ADICIONADA' | 'ORCAMENTO_ENVIADO' | 'FOTO_ADICIONADA';
  de_status?: OcorrenciaStatus;
  para_status?: OcorrenciaStatus;
  descricao: string;
  created_at: string;
}

export interface Manutencao {
  id: string;
  equipamento_id: string;
  tipo_servico: TipoServico;
  data_execucao: string;
  tecnico_nome: string;
  ordem_sap?: string;
  nota_sap?: string;
  descricao_servico: string;
  observacoes?: string;
  created_at: string;
}

export interface LevantamentoLegado {
  id: string;
  tag_legada?: string;
  tag_antiga?: string | number;
  tag?: string;
  descricao?: string;
  localizacao_legada?: string;
  localizacao?: string;
  area?: string;
  area_linha?: string;
  ug?: string;
  patrimonio?: string;
  tipo_equipamento?: string;
  marca?: string;
  modelo?: string;
  capacidade?: string;
  status_ok: boolean;
  observacao_campo?: string;
  problema_identificado?: string;
  conciliado: boolean;
  equipamento_id?: string;
  data_levantamento?: string;
  item_num?: number;
}

// Views Interfaces
export interface VwEquipamento extends Equipamento {
  ug_codigo: string;
  ug_nome: string;
  area_nome: string;
  linha_nome: string;
  centro_trabalho_nome: string;
  centro_trabalho_sap?: string;
  local_instalacao?: string;
  total_ocorrencias_abertas?: number;
  dias_parado_atual?: number;
}

export interface VwKpis {
  total_equipamentos: number;
  operando_ok: number;
  parados: number;
  restricao: number;
  desativados: number;
  disponibilidade_pct: number;
  ocorrencias_abertas: number;
  aguardando_peca: number;
  aguardando_orcamento_aprovacao: number;
  valor_orcamentos_pendentes: number;
  mttr_medio_dias: number;
}

export interface VwStatusPorUg {
  ug_codigo: string;
  ug_nome: string;
  total: number;
  ok: number;
  parado: number;
  restricao: number;
  disponibilidade_pct: number;
}

export interface VwStatusPorArea {
  area_nome: string;
  total: number;
  ok: number;
  parado: number;
  restricao: number;
}

export interface VwStatusPorLinha {
  linha_id?: string;
  linha_nome: string;
  total: number;
  ok: number;
  parado: number;
  restricao: number;
}

export interface VwStatusPorTipo {
  tipo: string;
  total: number;
  ok: number;
  parado: number;
}

export interface VwStatusPorMarca {
  marca: string;
  total: number;
  ok: number;
  parado: number;
}

export interface VwAgingParadas {
  ocorrencia_id: string;
  ocorrencia_numero: number;
  equipamento_id: string;
  tag: string;
  tipo: string;
  marca: string;
  modelo: string;
  ug_codigo: string;
  linha_nome: string;
  centro_trabalho_nome: string;
  data_avaria: string;
  dias_parado: number;
  faixa_aging: '0-7 dias' | '8-15 dias' | '16-30 dias' | '31-90 dias' | '90+ dias';
  ocorrencia_status: OcorrenciaStatus;
  pecas_pendentes_count: number;
  pecas_resumo?: string;
  nota_sap?: string;
  ordem_sap?: string;
  ordem_vision?: string;
  valor_orcamento?: number;
}

export interface VwPecasPendentes {
  peca_id: string;
  descricao: string;
  part_number?: string;
  fabricante?: string;
  quantidade: number;
  unidade?: string;
  fornecedor?: string;
  valor_unitario?: number;
  valor_total?: number;
  previsao_entrega?: string;
  status: PecaStatus;
  ocorrencia_id: string;
  ocorrencia_numero: number;
  equipamento_id: string;
  tag: string;
  dias_parado_equipamento: number;
  linha_nome: string;
  centro_trabalho_nome: string;
  data_solicitacao: string;
}

export interface VwReincidencia {
  equipamento_id: string;
  tag: string;
  modelo: string;
  linha_nome: string;
  total_ocorrencias_ano: number;
  total_dias_parado_acumulado: number;
}

export interface VwEvolucaoMensal {
  mes_ano: string; // '2026-01', '2026-02', etc.
  mes_label: string; // 'Jan/26', 'Fev/26', etc.
  abertas: number;
  concluidas: number;
}
