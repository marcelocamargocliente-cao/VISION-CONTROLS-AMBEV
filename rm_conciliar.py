import re

with open("src/pages/Equipamentos.tsx", "r") as f:
    text = f.read()

# Remove the button block
btn_pattern = r"""          \{/\* Action: Conciliar Levantamento 2026 \*/\}
          <button
            id="btn-open-conciliacao-modal"
            onClick=\{\(\) => setShowConciliacaoModal\(true\)\}
            className="h-\[32px\] inline-flex items-center gap-1\.5 px-2\.5 text-\[11px\] font-semibold rounded-md bg-\[#0A0E1A\] hover:bg-\[#1a2235\]  border border-\[#F59E0B\]/40 transition-colors shadow-sm cursor-pointer leading-none"
          >
            <Sparkles className="w-3\.5 h-3\.5 " />
            <span className="hidden sm:inline">Conciliar Levantamento 2026</span>
            <span className="sm:hidden">Conciliar</span>
            \{pendingLegados\.length > 0 && \(
              <span className="px-1\.5 py-0\.5 text-\[9px\]  font-bold bg-\[#EF4444\]  rounded-full leading-none">
                \{pendingLegados\.length\}
              </span>
            \)\}
          </button>"""

text = re.sub(btn_pattern, "", text)

# Remove the modal block
modal_pattern = r"""      \{/\* MODAL: CONCILIAR LEVANTAMENTO 2026 \*/\}
      \{showConciliacaoModal && \(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick=\{\(e\) => \{
            if \(e\.target === e\.currentTarget\) setShowConciliacaoModal\(false\);
          \}\}
        >
          <div className="bg-\[#111827\] border border-blue-500/30 rounded-lg w-full max-w-4xl max-h-\[90vh\] flex flex-col shadow-2xl overflow-hidden">
.*?
      \)\}"""

text = re.sub(modal_pattern, "", text, flags=re.DOTALL)

with open("src/pages/Equipamentos.tsx", "w") as f:
    f.write(text)
