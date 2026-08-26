import re
with open("src/pages/EquipamentoDetalhe.tsx", "r") as f:
    text = f.read()

text = re.sub(r'      \)\}\n(?:[ \n]*(?:<\/div>))*\n  \);\n\};\n?$', 
              '      )}\n        </div>\n      </div>\n    </div>\n  );\n};\n', text)

with open("src/pages/EquipamentoDetalhe.tsx", "w") as f:
    f.write(text)
