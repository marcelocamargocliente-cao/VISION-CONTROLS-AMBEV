import re
with open("src/pages/EquipamentoDetalhe.tsx", "r") as f:
    text = f.read()

# I want to replace the whole className block of the tab buttons with className={`tab-item flex items-center gap-2 ${isActive ? 'active' : ''}`}
old_block = r"""className={`flex items-center gap-2 px-4 py-2\.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors \${[^}]+}`}"""
new_block = 'className={`tab-item flex items-center gap-2 ${isActive ? \'active\' : \'\'}`}'

text = re.sub(old_block, new_block, text)

with open("src/pages/EquipamentoDetalhe.tsx", "w") as f:
    f.write(text)
