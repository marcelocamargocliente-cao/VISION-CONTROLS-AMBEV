import re

with open("src/pages/Cadastros.tsx", "r") as f:
    text = f.read()

# Replace import
text = text.replace("import { Profile, UG, Area, Linha, CentroTrabalho, LevantamentoLegado } from '../types/database';",
                    "import { Profile, UG, Area, Linha, CentroTrabalho } from '../types/database';")

# Remove legados state
text = re.sub(r"  const \[legados, setLegados\] = useState<LevantamentoLegado\[\]>\(\[\]\);\n", "", text)
text = re.sub(r"  const \[legadoFilter, setLegadoFilter\] = useState<'TODOS' \| 'NOK' \| 'CONCILIADOS'>\('TODOS'\);\n", "", text)

# Remove fetch legados
loaddata_old = r"""      const \[u, a, li, ct, p, l\] = await Promise\.all\(\[
        DataStore\.getUgs\(\),
        DataStore\.getAreas\(\),
        DataStore\.getLinhas\(\),
        DataStore\.getCentrosTrabalho\(\),
        DataStore\.getProfiles\(\),
        DataStore\.getLevantamentoLegado\(\),
      \]\);
      setHierarchy\(\{ ugs: u, areas: a, linhas: li, centros_trabalho: ct \}\);
      setProfiles\(p\);
      setLegados\(l\);"""
      
loaddata_new = r"""      const [u, a, li, ct, p] = await Promise.all([
        DataStore.getUgs(),
        DataStore.getAreas(),
        DataStore.getLinhas(),
        DataStore.getCentrosTrabalho(),
        DataStore.getProfiles(),
      ]);
      setHierarchy({ ugs: u, areas: a, linhas: li, centros_trabalho: ct });
      setProfiles(p);"""
text = re.sub(loaddata_old, loaddata_new, text)

# Remove derived values
text = re.sub(r"  const totalLegados = legados\.length;\n  const conciliadosCount = legados\.filter\(\(l\) => l\.conciliado\)\.length;\n  const nokCount = legados\.filter\(\(l\) => !l\.status_ok\)\.length;\n", "", text)

# Remove filteredLegados
filtered_old = r"""  const filteredLegados = useMemo\(\(\) => \{
    return legados\.filter\(\(l\) => \{
      if \(legadoFilter === 'NOK'\) return !l\.status_ok;
      if \(legadoFilter === 'CONCILIADOS'\) return l\.conciliado;
      return true;
    \}\);
  \}, \[legados, legadoFilter\]\);\n"""
text = re.sub(filtered_old, "", text)

with open("src/pages/Cadastros.tsx", "w") as f:
    f.write(text)
