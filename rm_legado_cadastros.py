import re

with open("src/pages/Cadastros.tsx", "r") as f:
    text = f.read()

# Update activeTab state
text = re.sub(r"const \[activeTab, setActiveTab\] = useState<'ugs' \| 'estrutura' \| 'equipe' \| 'legado'>\('ugs'\);",
              "const [activeTab, setActiveTab] = useState<'ugs' | 'estrutura' | 'equipe'>('ugs');", text)

# Remove the Tab button for LEVANTAMENTO JAN/2026
tab_btn = r"""        <button
          id="tab-cadastros-legado"
          onClick=\{\(\) => setActiveTab\('legado'\)\}
          className=\{`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2\.5 text-\[11px\] font-semibold tracking-wider uppercase cursor-pointer border-b-2 transition-all flex items-center gap-2 \$\{
            activeTab === 'legado'
              \? 'border-\[#EF4444\]  bg-white/\[0\.02\]'
              : 'border-transparent  hover:'
          \}`\}
        >
          <Database className="w-3\.5 h-3\.5" />
          <span>Levantamento Jan/2026</span>
          <span className="text-\[10px\]  px-1\.5 py-0\.2 rounded bg-black/40 ">
            \{totalLegados\}
          </span>
        </button>"""
text = re.sub(tab_btn, "", text)

# Remove the actual tab content (TAB 4)
tab_content = r"""      \{/\* TAB 4: LEVANTAMENTO JAN/2026 \*/\}
      \{activeTab === 'legado' && \(
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
.*?
      \)\}"""
text = re.sub(tab_content, "", text, flags=re.DOTALL)

with open("src/pages/Cadastros.tsx", "w") as f:
    f.write(text)
