with open("src/pages/EquipamentoDetalhe.tsx", "r") as f:
    text = f.read()

text = text.replace('<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C343E] pb-4">',
                    '<div className="equipamento-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">')

with open("src/pages/EquipamentoDetalhe.tsx", "w") as f:
    f.write(text)
