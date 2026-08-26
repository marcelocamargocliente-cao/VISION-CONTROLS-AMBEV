import re

with open("src/pages/Equipamentos.tsx", "r") as f:
    text = f.read()

# Remove states
state_pattern = r"""  // Modals
  const \[showNewModal, setShowNewModal\] = useState\(false\);
  const \[showConciliacaoModal, setShowConciliacaoModal\] = useState\(false\);

  // Legacy reconciliation state
  const \[legados, setLegados\] = useState<LevantamentoLegado\[\]>\(\[\]\);
  const \[selectedLegado, setSelectedLegado\] = useState<LevantamentoLegado \| null>\(null\);
  const \[targetEquipId, setTargetEquipId\] = useState\(''\);
  const \[openOccurrenceForNok, setOpenOccurrenceForNok\] = useState\(true\);
  const \[conciliandoLoading, setConciliandoLoading\] = useState\(false\);
  const \[conciliadoSuccessMsg, setConciliadoSuccessMsg\] = useState<string \| null>\(null\);"""

text = re.sub(state_pattern, "  // Modals\n  const [showNewModal, setShowNewModal] = useState(false);", text)

# Remove loadData legados
loaddata_old = r"""      const \[eqs, hier, leg\] = await Promise\.all\(\[
        DataStore\.getVwEquipamentos\(\),
        DataStore\.getHierarchy\(\),
        DataStore\.getLevantamentoLegado\(\),
      \]\);
      setEquipamentos\(eqs\);
      setHierarchy\(hier\);
      setLegados\(leg\);"""

loaddata_new = r"""      const [eqs, hier] = await Promise.all([
        DataStore.getVwEquipamentos(),
        DataStore.getHierarchy(),
      ]);
      setEquipamentos(eqs);
      setHierarchy(hier);"""

text = re.sub(loaddata_old, loaddata_new, text)

# Remove keyboard listener for conciliacao modal
key_old = r"""        setShowNewModal\(false\);
        setShowConciliacaoModal\(false\);"""
key_new = r"""        setShowNewModal(false);"""
text = re.sub(key_old, key_new, text)

# Remove derived legacy properties
legacy_props = r"""  const pendingLegados = legados\.filter\(\(l\) => !l\.conciliado\);
  const nokLegados = pendingLegados\.filter\(\(l\) => !l\.status_ok\);"""
text = re.sub(legacy_props, "", text)

# Remove handleExecConciliacao
handle_pattern = r"""  const handleExecConciliacao = async \(\) => \{.*?
  \};\n"""
text = re.sub(handle_pattern, "", text, flags=re.DOTALL)

with open("src/pages/Equipamentos.tsx", "w") as f:
    f.write(text)
