#!/bin/bash
sed -i "s/style={{fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em'}}//g" src/pages/EquipamentoDetalhe.tsx
sed -i 's/style={{display:'\''flex'\'', gap:8}}/className="flex items-center gap-2"/g' src/pages/EquipamentoDetalhe.tsx
sed -i "s/style={{background:'#3FB950'}}//g" src/pages/EquipamentoDetalhe.tsx
sed -i "s/style={{background:'#F85149'}}//g" src/pages/EquipamentoDetalhe.tsx
