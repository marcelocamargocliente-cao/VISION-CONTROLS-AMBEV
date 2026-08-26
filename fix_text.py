import re

with open("src/utils/formatters.ts", "r") as f:
    text = f.read()

target = r"""export function buildOrcamentoShareText\(data: ShareOrcamentoData\): string \{
  const parts: string\[\] = \[\];
  parts\.push\('\*INTEGRAÇÃO VISION CONTROLS AMBEV\*'\);
  parts\.push\(`\*Proposta de Manutenção — \$\{data\.numero\}\*`\);
  parts\.push\(''\);
  parts\.push\(`Equipamento: TAG \$\{data\.tag\} — \$\{data\.tipo\} \$\{data\.marca \|\| ''\} \$\{data\.modelo \|\| ''\}`\.trim\(\)\);
  parts\.push\(`Local: \$\{data\.ug \|\| 'N/D'\} / \$\{data\.area \|\| 'N/D'\} / \$\{data\.linha \|\| 'N/D'\} / \$\{data\.centro_trabalho \|\| 'N/D'\}`\);
  parts\.push\(`Parado há: \$\{data\.dias_parado \?\? 0\} dias`\);
  parts\.push\(''\);
  parts\.push\(`\*Fornecedor:\* \$\{data\.fornecedor \|\| 'Vision Controls / Parceiro'\}`\);
  parts\.push\(`\*Valor:\* \$\{formatCurrency\(data\.valor_total\)\}`\);
  parts\.push\(`\*Validade:\* \$\{data\.validade \? formatDate\(data\.validade\) : '30 dias'\}`\);
  parts\.push\(`\*Status:\* \$\{data\.status\}`\);
  parts\.push\(`\*Enviado para:\* \$\{data\.enviado_para \|\| 'Engenharia AMBEV RJ'\}`\);
  parts\.push\(''\);
  parts\.push\(`Ocorrência OS #\$\{data\.numero_ocorrencia \|\| 'N/D'\}`\);
  if \(data\.link_pdf\) \{
    parts\.push\(data\.link_pdf\);
  \}
  parts\.push\(''\);
  parts\.push\('_Vision Controls — HVAC Industrial_'\);

  return parts\.join\('\\n'\);
\}"""

replacement = """export function buildOrcamentoShareText(data: ShareOrcamentoData & { data_envio?: string, dias_aguardando?: number, descricao_ocorrencia?: string }): string {
  const parts: string[] = [];
  parts.push('*INTEGRAÇÃO VISION CONTROLS AMBEV*');
  parts.push(`*Proposta ${data.numero}* — Status: ${data.status}`);
  parts.push('');
  parts.push(`Equipamento: TAG ${data.tag} — ${data.tipo} ${data.marca || ''} ${data.modelo || ''}`.trim());
  parts.push(`Local: ${data.ug || 'N/D'} / ${data.area || 'N/D'} / ${data.linha || 'N/D'} / ${data.centro_trabalho || 'N/D'}`);
  parts.push(`Parado há: ${data.dias_parado ?? 0} dias`);
  parts.push('');
  parts.push(`*Fornecedor:* ${data.fornecedor || 'Vision Controls'}`);
  parts.push(`*Valor Total:* ${formatCurrency(data.valor_total)}`);
  
  if (data.data_envio) parts.push(`*Enviado em:* ${data.data_envio}`);
  
  const validade = data.validade ? formatDate(data.validade) : '30 dias';
  const diasAguardando = data.dias_aguardando !== undefined ? ` | *Aguardando AMBEV:* ${data.dias_aguardando} dias` : '';
  parts.push(`*Validade:* ${validade}${diasAguardando}`);
  
  parts.push(`*Enviado para:* ${data.enviado_para || 'Engenharia AMBEV RJ'}`);
  parts.push('');
  
  const desc = data.descricao_ocorrencia ? ` — ${data.descricao_ocorrencia.substring(0, 80)}...` : '';
  parts.push(`OS #${data.numero_ocorrencia || 'N/D'}${desc}`);
  
  if (data.link_pdf) {
    parts.push(`📎 PDF: ${data.link_pdf}`);
  }
  
  parts.push('');
  parts.push('_Vision Controls — HVAC Industrial AMBEV RJ_');

  return parts.join('\\n').trim();
}"""

text = re.sub(target, replacement, text)

with open("src/utils/formatters.ts", "w") as f:
    f.write(text)
