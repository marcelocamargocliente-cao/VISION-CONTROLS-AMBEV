#!/bin/bash
FILE="src/pages/EquipamentoDetalhe.tsx"

# Change the main div
sed -i 's/<div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">/<div className="equipamento-detalhe-page">/g' $FILE

# Change the header div
sed -i 's/<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C343E] pb-4">/<div className="equipamento-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">/g' $FILE

# Change the tabs div
sed -i 's/<div className="flex items-center gap-1 border-b border\[#2C343E\] overflow-x-auto pb-px">/<div className="equipamento-tabs flex items-center gap-1 overflow-x-auto pb-px">/g' $FILE

# Wrap the tab contents in .equipamento-tab-content
# Find the line "{/* TAB 1: FICHA TÉCNICA */}" and insert "<div className="equipamento-tab-content max-w-6xl mx-auto w-full space-y-6">" before it.
# And add a closing "</div>" before the final "</div>" of the component.
sed -i '/{\/\* TAB 1: FICHA TÉCNICA \*\/}/i \      {/* Conteúdo da aba ativa — ROLA */}\n      <div className="equipamento-tab-content space-y-6">\n        <div className="max-w-6xl mx-auto w-full space-y-6">' $FILE

# The end of the file ends with
#     </div>
#   );
# };
# I need to insert two </div> right before the final </div>. Wait, let me replace the last 3 lines safely.
