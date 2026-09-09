import { 
  Profile, 
  UG, 
  Area, 
  Linha, 
  CentroTrabalho, 
  Equipamento, 
  EquipStatus,
  Ocorrencia, 
  Peca, 
  Orcamento, 
  Anexo, 
  OcorrenciaEvento, 
  Manutencao, 
  LevantamentoLegado 
} from '../types/database';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-adriano',
    email: 'adriano.pinto@visioncontrols.com.br',
    nome: 'Adriano Coelho Pinto',
    cargo: 'Diretor / Engenheiro Chefe',
    role: 'ADMIN',
    empresa: 'VISION CONTROLS',
    telefone: '+55 21 98844-1234',
    ativo: true,
  },
  {
    id: 'user-luiz',
    email: 'luiz.pereira@visioncontrols.com.br',
    nome: 'Luiz Pereira',
    cargo: 'Gestor de Contrato & Planejamento',
    role: 'GESTOR',
    empresa: 'VISION CONTROLS',
    telefone: '+55 21 99762-5678',
    ativo: true,
  },
  {
    id: 'user-arthur',
    email: 'arthur.almeida@visioncontrols.com.br',
    nome: 'Arthur Almeida',
    cargo: 'Encarregado de Campo & Refrigeração',
    role: 'ENCARREGADO',
    empresa: 'VISION CONTROLS',
    telefone: '+55 21 97123-9988',
    ativo: true,
  },
  {
    id: 'user-alan',
    email: 'alan.silva@visioncontrols.com.br',
    nome: 'Alan Silva',
    cargo: 'Técnico de Campo Climatização',
    role: 'TECNICO',
    empresa: 'VISION CONTROLS',
    telefone: '+55 21 98455-4321',
    ativo: true,
  },
  {
    id: 'user-ambev-vis',
    email: 'auditoria.fabril@ambev.com.br',
    nome: 'Engenharia de Utilidades AMBEV',
    cargo: 'Engenheiro de Confiabilidade',
    role: 'VISUALIZADOR',
    empresa: 'AMBEV',
    telefone: '+55 21 99999-5544',
    ativo: true,
  },
];

export const INITIAL_UGS: UG[] = [
  { id: 'ug-n1', codigo: 'N1', nome: 'UG N1 — Embalagem e Linhas de Envase', descricao: 'Área fabril de linhas de alta velocidade de cerveja e refrigerante', ordem: 1 },
  { id: 'ug-n2', codigo: 'N2', nome: 'UG N2 — Fabricação, Fermentação e Maturação', descricao: 'Salas de brassagem, fermentadores e adegas de cerveja', ordem: 2 },
  { id: 'ug-n3', codigo: 'N3', nome: 'UG N3 — Utilidades e Subestações', descricao: 'Central de ar comprimido, amônia, chillers centrais e subestação elétrica', ordem: 3 },
  { id: 'ug-n4', codigo: 'N4', nome: 'UG N4 — Expansão Fabril Futura', descricao: 'Galpão em estruturação para novas linhas de envase', ordem: 4 },
];

export const INITIAL_AREAS: Area[] = [
  { id: 'area-1', ug_id: 'ug-n1', codigo: 'EMB-RET', nome: 'Retornáveis (Vidro)' },
  { id: 'area-2', ug_id: 'ug-n1', codigo: 'EMB-OWC', nome: 'One Way Cerveja (Lata)' },
  { id: 'area-3', ug_id: 'ug-n1', codigo: 'EMB-OWR', nome: 'One Way Refri (PET)' },
  { id: 'area-4', ug_id: 'ug-n2', codigo: 'FAB-CRV', nome: 'Fabricação Cerveja' },
  { id: 'area-5', ug_id: 'ug-n2', codigo: 'XAR-REF', nome: 'Xaroparia' },
  { id: 'area-6', ug_id: 'ug-n3', codigo: 'UTI-IND', nome: 'Utilidades e Frio Industrial' },
  { id: 'area-7', ug_id: 'ug-n3', codigo: 'ADM-LAB', nome: 'Administrativo e Laboratórios' },
];

export const INITIAL_LINHAS: Linha[] = [
  { id: 'linha-101', area_id: 'area-1', codigo: 'L101', nome: 'Linha 101 — Vidro Retornável 600ml', codigo_sap: 'LIN-501-VID' },
  { id: 'linha-102', area_id: 'area-2', codigo: 'L102', nome: 'Linha 102 — Latas Cerveja 350ml/473ml', codigo_sap: 'LIN-502-LAT' },
  { id: 'linha-103', area_id: 'area-3', codigo: 'L103', nome: 'Linha 103 — PET Refrigerante 2L', codigo_sap: 'LIN-503-PET' },
  { id: 'linha-104', area_id: 'area-1', codigo: 'L104', nome: 'Linha 104 — Garrafas Long Neck 330ml', codigo_sap: 'LIN-504-LNK' },
  { id: 'linha-105', area_id: 'area-2', codigo: 'L105', nome: 'Linha 105 — Chopp Barril', codigo_sap: 'LIN-505-CHP' },
  { id: 'linha-201', area_id: 'area-4', codigo: 'L201', nome: 'Linha 201 — Sala de Brassagem 1 & 2', codigo_sap: 'LIN-201-BRS' },
  { id: 'linha-202', area_id: 'area-4', codigo: 'L202', nome: 'Linha 202 — Adegas e Filtração Cerveja', codigo_sap: 'LIN-202-ADG' },
  { id: 'linha-301', area_id: 'area-5', codigo: 'L301', nome: 'Linha 301 — Mistura e Xaroparia Contínua', codigo_sap: 'LIN-301-XAR' },
  { id: 'linha-401', area_id: 'area-6', codigo: 'L401', nome: 'Linha 401 — Casa de Compressores e Chillers', codigo_sap: 'LIN-401-UTI' },
  { id: 'linha-402', area_id: 'area-6', codigo: 'L402', nome: 'Linha 402 — Tratamento de Água (ETA/ETDI)', codigo_sap: 'LIN-402-ETA' },
  { id: 'linha-403', area_id: 'area-6', codigo: 'L403', nome: 'Linha 403 — Subestação Elétrica Geral 13.8kV', codigo_sap: 'LIN-403-SUB' },
  { id: 'linha-501', area_id: 'area-7', codigo: 'L501', nome: 'Linha 501 — Prédio Central e Sala de Controle (COS)', codigo_sap: 'LIN-501-COS' },
  { id: 'linha-502', area_id: 'area-7', codigo: 'L502', nome: 'Linha 502 — Laboratórios Físico-Químicos e Microbiologia', codigo_sap: 'LIN-502-LAB' },
];

export const INITIAL_CENTROS_TRABALHO: CentroTrabalho[] = [
  { id: 'ct-1', linha_id: 'linha-101', nome: 'Decoradora Fuhrmeister', codigo_sap: 'CT-DEC-01', descricao: 'Máquina de rotulagem e decoração de garrafas' },
  { id: 'ct-2', linha_id: 'linha-101', nome: 'Enchedora Krones Lavatec', codigo_sap: 'CT-ENC-01', descricao: 'Enchedora isobárica de alta capacidade' },
  { id: 'ct-3', linha_id: 'linha-101', nome: 'Painel Principal CCM 01', codigo_sap: 'CT-CCM-101', descricao: 'Painel elétrico de controle de motores' },
  { id: 'ct-4', linha_id: 'linha-102', nome: 'Recravadora Ferrum', codigo_sap: 'CT-REC-02', descricao: 'Recravação de tampas em latas de alumínio' },
  { id: 'ct-5', linha_id: 'linha-102', nome: 'Enchedora KHS Innofill', codigo_sap: 'CT-ENC-02', descricao: 'Enchedora rotativa de latas' },
  { id: 'ct-6', linha_id: 'linha-103', nome: 'Sopradora Sidel Matrix', codigo_sap: 'CT-SOP-03', descricao: 'Sopradora de pré-formas PET' },
  { id: 'ct-7', linha_id: 'linha-103', nome: 'Rotuladora Krones Contiroll', codigo_sap: 'CT-ROT-03', descricao: 'Rotulagem de garrafas PET' },
  { id: 'ct-8', linha_id: 'linha-401', nome: 'Chiller Central 01 REFRIAC', codigo_sap: 'CT-CHL-01', descricao: 'Resfriamento de glicol para processo fabril' },
  { id: 'ct-9', linha_id: 'linha-401', nome: 'Chiller Central 02 YORK', codigo_sap: 'CT-CHL-02', descricao: 'Resfriamento de água gelada industrial' },
  { id: 'ct-10', linha_id: 'linha-403', nome: 'Sala do Painel Média Tensão', codigo_sap: 'CT-SUB-01', descricao: 'Painéis de manobra 13.8kV' },
  { id: 'ct-11', linha_id: 'linha-501', nome: 'Sala dos Servidores TI / COS', codigo_sap: 'CT-TI-01', descricao: 'Data center local da fábrica e automação' },
  { id: 'ct-12', linha_id: 'linha-502', nome: 'Lab Central Cromatografia', codigo_sap: 'CT-LAB-01', descricao: 'Ambiente estéril climatizado 20°C +/- 1°C' },
];

import realEquipamentosList from './realEquipamentos.json';

// 194 Equipamentos reais carregados diretamente da base de dados
export const INITIAL_EQUIPAMENTOS: Equipamento[] = (realEquipamentosList as any[]).map((item) => ({
  id: item.id || `equip-${item.tag}`,
  tag: String(item.tag),
  ug_ref: item.ug_ref || 'N2',
  area_ref: item.area_ref || 'NÃO CLASSIFICADO',
  localizacao_ref: item.localizacao_ref || 'GERAL - CERVEJARIA RJ',
  patrimonio_ref: item.patrimonio_ref != null ? String(item.patrimonio_ref) : undefined,
  tipo_equipamento: item.tipo_equipamento || 'RESFRIADOR DE PAINEL',
  marca: item.marca || undefined,
  modelo: item.modelo || undefined,
  capacidade: item.capacidade || undefined,
  aplicacao: 'INDUSTRIAL',
  status: (item.status as EquipStatus) || 'OK',
  local_instalacao: item.local_instalacao || (item.ug_ref ? `${item.ug_ref} · ${item.localizacao_ref || ''}` : ''),
  tipo: item.tipo_equipamento || 'RESFRIADOR DE PAINEL',
  patrimonio: item.patrimonio_ref != null ? String(item.patrimonio_ref) : undefined,
  qr_slug: item.qr_slug || `ivca-eq-${item.tag}`,
  ug_id: item.ug_ref ? `ug-${item.ug_ref.toLowerCase()}` : 'ug-n2',
  ug_codigo: item.ug_ref || 'N2',
  centro_trabalho: item.local_instalacao || 'CIV1-GER',
  created_at: '2025-01-10T08:00:00Z',
}));

export const INITIAL_OCORRENCIAS: Ocorrencia[] = [];

export const INITIAL_PECAS: Peca[] = [];

export const INITIAL_ORCAMENTOS: Orcamento[] = [];

export const INITIAL_EVENTOS: OcorrenciaEvento[] = [];

export const INITIAL_MANUTENCOES: Manutencao[] = [];

// Manutenções reais são cadastradas pelos usuários — sem dados fictícios.

// 195 Legacy survey records (44 NOK)
export const INITIAL_LEVANTAMENTO_LEGADO: LevantamentoLegado[] = [];
const ugCodes = ['N1', 'N2', 'N3', 'UG-UTIL'];
const subLocs = ['RETORNÁVEIS', 'LATAS', 'SALA BRASSAGEM', 'SALA COMPRESSORES'];
const areaNames = ['Envase Linha 101', 'Envase Linha 102', 'Cervejaria e Fermentação', 'Utilidades & Frio'];
const tipos = ['CPE porta', 'CPE teto', 'Splitão', 'Chiller'];
const marcas = ['RITTAL', 'KRONES', 'REFRIAC', 'CARRIER'];
const modelos = ['Blue e+ SK 3186', 'TopTherm SK 3303', 'Splitão 10TR', 'AquaSnap 30RB'];

for (let i = 1; i <= 195; i++) {
  const isNok = i <= 44; // Exactly 44 marked NOK as stated in prompt!
  const ug = ugCodes[i % 4];
  const subLoc = subLocs[i % 4];
  const loc = `${ug}/${subLoc}`;
  const area = areaNames[i % 4];
  const tagNum = (100 + i).toString();
  const pat = `PAT-AMB-${(100 + i).toString().padStart(5, '0')}`;

  INITIAL_LEVANTAMENTO_LEGADO.push({
    id: `legado-${i}`,
    tag_antiga: tagNum,
    tag_legada: `TAG-LEG-2026-${(100 + i).toString().padStart(3, '0')}`,
    tag: tagNum,
    patrimonio: pat,
    ug: ug,
    area: area,
    area_linha: `${area} (${ug})`,
    localizacao: loc,
    localizacao_legada: loc,
    tipo_equipamento: tipos[i % 4],
    marca: marcas[i % 4],
    modelo: modelos[i % 4],
    capacidade: `${(i % 3 + 1) * 2000} W`,
    descricao: isNok 
      ? `Climatizador antigo painel ${(i % 12) + 1} com ruído/parada identificada no levantamento de campo` 
      : `Equipamento inspecionado no campo jan/2026 em funcionamento`,
    status_ok: !isNok,
    observacao_campo: isNok 
      ? 'Anomalia detectada em jan/2026: ventilação deficiente ou termostato desregulado. Necessita conciliação com TAG nova e abertura de ocorrência.'
      : 'Em operação normal no momento do levantamento.',
    problema_identificado: isNok 
      ? 'Ventilação deficiente / termostato desregulado'
      : undefined,
    conciliado: false,
    equipamento_id: undefined,
    data_levantamento: '2026-01-15T12:00:00Z',
    item_num: i,
  });
}
