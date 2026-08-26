import re
with open("src/components/orcamentos/ModalOrcamentoDetalhe.tsx", "r") as f:
    text = f.read()

target = r"""  const shareData: ShareOrcamentoData = \{
    numero: orcamento\.numero,
    tag: equipamento\?\.tag \|\| 'N/D',
    tipo: equipamento\?\.tipo \|\| 'Equipamento HVAC',
    marca: equipamento\?\.marca,
    modelo: equipamento\?\.modelo,
    ug: equipamento\?\.ug_codigo \|\| 'UG',
    area: equipamento\?\.area_nome \|\| 'Área Fabril',
    linha: equipamento\?\.linha_nome \|\| 'Linha',
    centro_trabalho: equipamento\?\.centro_trabalho_nome \|\| 'CT',
    dias_parado: diasParado,
    fornecedor: orcamento\.fornecedor,
    valor_total: orcamento\.valor_total,
    validade: orcamento\.validade,
    status: statusConfig\.label,
    enviado_para: orcamento\.enviado_para,
    numero_ocorrencia: ocorrencia\?\.numero,
    link_pdf: orcamento\.arquivo_pdf_url \|\| orcamento\.arquivo_url,
  \};"""

replacement = """  const shareData: any = {
    numero: orcamento.numero,
    tag: equipamento?.tag || 'N/D',
    tipo: equipamento?.tipo || 'Equipamento HVAC',
    marca: equipamento?.marca,
    modelo: equipamento?.modelo,
    ug: equipamento?.ug_codigo || 'UG',
    area: equipamento?.area_nome || 'Área Fabril',
    linha: equipamento?.linha_nome || 'Linha',
    centro_trabalho: equipamento?.centro_trabalho_nome || 'CT',
    dias_parado: diasParado,
    fornecedor: orcamento.fornecedor,
    valor_total: orcamento.valor_total,
    validade: orcamento.validade,
    status: statusConfig.label,
    enviado_para: orcamento.enviado_para,
    numero_ocorrencia: ocorrencia?.numero,
    link_pdf: orcamento.arquivo_pdf_url || orcamento.arquivo_url,
    data_envio: orcamento.data_envio ? formatDate(orcamento.data_envio) : undefined,
    dias_aguardando: diasAguardando,
    descricao_ocorrencia: ocorrencia?.descricao,
  };"""

text = re.sub(target, replacement, text)

with open("src/components/orcamentos/ModalOrcamentoDetalhe.tsx", "w") as f:
    f.write(text)
