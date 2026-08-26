import re

with open("src/pages/Equipamentos.tsx", "r") as f:
    text = f.read()

target = r"""        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          \{/\* Status \*/\}
          <div>
            <label className="block text-\[10px\] uppercase  font-bold tracking-wider  mb-0\.5 leading-none">
              Status Operacional
            </label>
            <select
              value=\{selectedStatus\}
              onChange=\{\(e\) => setSelectedStatus\(e\.target\.value\)\}
              className="w-full h-\[30px\] bg-\[#0A0E1A\] border border-blue-500/20  text-\[11px\] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="OK">OK \(Operando\)</option>
              <option value="PARADO">PARADO \(Crítico\)</option>
              <option value="RESTRICAO">Restrição</option>
              <option value="DESATIVADO">Desativado</option>
            </select>
          </div>

          \{/\* UG \*/\}
          <div>
            <label className="block text-\[10px\] uppercase  font-bold tracking-wider  mb-0\.5 leading-none">
              UG
            </label>
            <select
              value=\{selectedUg\}
              onChange=\{\(e\) => setSelectedUg\(e\.target\.value\)\}
              className="w-full h-\[30px\] bg-\[#0A0E1A\] border border-blue-500/20  text-\[11px\] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todas UGs</option>
              \{hierarchy\.ugs\.map\(\(u\) => \(
                <option key=\{u\.id\} value=\{u\.id\}>
                  \{u\.codigo\}
                </option>
              \)\)\}
            </select>
          </div>

          \{/\* Área \*/\}
          <div>
            <label className="block text-\[10px\] uppercase  font-bold tracking-wider  mb-0\.5 leading-none">
              Área
            </label>
            <select
              value=\{selectedArea\}
              onChange=\{\(e\) => setSelectedArea\(e\.target\.value\)\}
              className="w-full h-\[30px\] bg-\[#0A0E1A\] border border-blue-500/20  text-\[11px\] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todas Áreas</option>
              \{hierarchy\.areas\.map\(\(a\) => \(
                <option key=\{a\.id\} value=\{a\.id\}>
                  \{a\.nome\}
                </option>
              \)\)\}
            </select>
          </div>

          \{/\* Linha \*/\}
          <div>
            <label className="block text-\[10px\] uppercase  font-bold tracking-wider  mb-0\.5 leading-none">
              Linha
            </label>
            <select
              value=\{selectedLinha\}
              onChange=\{\(e\) => setSelectedLinha\(e\.target\.value\)\}
              className="w-full h-\[30px\] bg-\[#0A0E1A\] border border-blue-500/20  text-\[11px\] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todas Linhas</option>
              \{hierarchy\.linhas\.map\(\(l\) => \(
                <option key=\{l\.id\} value=\{l\.id\}>
                  \{l\.nome\}
                </option>
              \)\)\}
            </select>
          </div>

          \{/\* Tipo \*/\}
          <div>
            <label className="block text-\[10px\] uppercase  font-bold tracking-wider  mb-0\.5 leading-none">
              Tipo
            </label>
            <select
              value=\{selectedTipo\}
              onChange=\{\(e\) => setSelectedTipo\(e\.target\.value\)\}
              className="w-full h-\[30px\] bg-\[#0A0E1A\] border border-blue-500/20  text-\[11px\] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todos Tipos</option>
              \{distinctTipos\.map\(\(t\) => \(
                <option key=\{t\} value=\{t\}>
                  \{t\}
                </option>
              \)\)\}
            </select>
          </div>

          \{/\* Marca \*/\}
          <div>
            <label className="block text-\[10px\] uppercase  font-bold tracking-wider  mb-0\.5 leading-none">
              Marca
            </label>
            <select
              value=\{selectedMarca\}
              onChange=\{\(e\) => setSelectedMarca\(e\.target\.value\)\}
              className="w-full h-\[30px\] bg-\[#0A0E1A\] border border-blue-500/20  text-\[11px\] rounded px-2 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">Todas Marcas</option>
              \{distinctMarcas\.map\(\(m\) => \(
                <option key=\{m\} value=\{m\}>
                  \{m\}
                </option>
              \)\)\}
            </select>
          </div>
        </div>"""

replacement = """        <div className="filters-row">
          <div className="filter-group filter-status">
            <label>Status Operacional</label>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option value="">Todos os Status</option>
              <option value="OK">Operando (OK)</option>
              <option value="RESTRICAO">Restrição</option>
              <option value="PARADO">Parado (Crítico)</option>
              <option value="DESATIVADO">Desativado</option>
            </select>
          </div>

          <div className="filter-group filter-ug">
            <label>UG</label>
            <select value={selectedUg} onChange={e => setSelectedUg(e.target.value)}>
              <option value="">Todas UGs</option>
              {hierarchy.ugs.map(ug => (
                <option key={ug.id} value={ug.id}>{ug.codigo}</option>
              ))}
            </select>
          </div>

          <div className="filter-group filter-area">
            <label>Área</label>
            <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)}>
              <option value="">Todas Áreas</option>
              {hierarchy.areas.map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>

          <div className="filter-group filter-linha">
            <label>Linha</label>
            <select value={selectedLinha} onChange={e => setSelectedLinha(e.target.value)}>
              <option value="">Todas Linhas</option>
              {hierarchy.linhas.map(l => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>

          <div className="filter-group filter-tipo">
            <label>Tipo</label>
            <select value={selectedTipo} onChange={e => setSelectedTipo(e.target.value)}>
              <option value="">Todos Tipos</option>
              {distinctTipos.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="filter-group filter-marca">
            <label>Marca</label>
            <select value={selectedMarca} onChange={e => setSelectedMarca(e.target.value)}>
              <option value="">Todas Marcas</option>
              {distinctMarcas.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>"""

text = re.sub(target, replacement, text)

with open("src/pages/Equipamentos.tsx", "w") as f:
    f.write(text)
