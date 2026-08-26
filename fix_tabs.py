with open("src/pages/EquipamentoDetalhe.tsx", "r") as f:
    text = f.read()

text = text.replace('<div className="flex items-center gap-1 border-b border-[#2C343E] overflow-x-auto pb-px">',
                    '<div className="equipamento-tabs flex items-center gap-1 overflow-x-auto">')

with open("src/pages/EquipamentoDetalhe.tsx", "w") as f:
    f.write(text)
