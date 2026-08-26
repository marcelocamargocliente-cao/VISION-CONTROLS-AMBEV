import re

with open("src/pages/Cadastros.tsx", "r") as f:
    text = f.read()

loaddata_old = r"""      const \[h, l, p\] = await Promise\.all\(\[
        DataStore\.getHierarchy\(\),
        DataStore\.getLevantamentoLegado\(\),
        DataStore\.getProfiles\(\),
      \]\);
      setHierarchy\(h\);
      setLegados\(l\);
      setProfiles\(p\);"""

loaddata_new = r"""      const [h, p] = await Promise.all([
        DataStore.getHierarchy(),
        DataStore.getProfiles(),
      ]);
      setHierarchy(h);
      setProfiles(p);"""
text = re.sub(loaddata_old, loaddata_new, text)

with open("src/pages/Cadastros.tsx", "w") as f:
    f.write(text)
