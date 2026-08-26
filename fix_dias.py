import re

with open("src/components/orcamentos/ModalOrcamentoDetalhe.tsx", "r") as f:
    text = f.read()

text = text.replace(
    '  const diasParado = ocorrencia?.data_avaria ? calculateDaysDiff(ocorrencia.data_avaria) : 0;',
    '  const diasParado = ocorrencia?.data_avaria ? calculateDaysDiff(ocorrencia.data_avaria) : 0;\n  const diasAguardando = orcamento.data_envio ? calculateDaysDiff(orcamento.data_envio) : 0;'
)

with open("src/components/orcamentos/ModalOrcamentoDetalhe.tsx", "w") as f:
    f.write(text)
