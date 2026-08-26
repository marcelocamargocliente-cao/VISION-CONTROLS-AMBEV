import re

with open("src/components/common/CompartilharOrcamento.tsx", "r") as f:
    text = f.read()

# Target block
target_old = r"""  return \(
    <div className=\{`relative inline-block text-left \$\{className\}`\} ref=\{dropdownRef\}>
      <button
        id=\{`\$\{idPrefix\}-dropdown-trigger`\}
        type="button"
        onClick=\{\(e\) => \{
          e\.stopPropagation\(\);
          setIsOpen\(!isOpen\);
        \}\}
        className="inline-flex items-center gap-2 px-3\.5 py-2 text-xs font-semibold rounded-\[4px\] bg-\[#1C222A\] hover:bg-\[#2C343E\] text-\[#ECEFF1\] border border-\[#2C343E\] hover:border-\[#38BDF8\]/50 transition-all shadow-sm focus:outline-none"
      >
        <Share2 className="w-4 h-4 text-\[#38BDF8\]" />
        <span>Compartilhar<\/span>
        <ChevronDown className=\{`w-3\.5 h-3\.5 text-\[#94A3B8\] transition-transform \$\{isOpen \? 'rotate-180' : ''\}`\} />
      <\/button>
      \{isOpen && \(
        <div
          id=\{`\$\{idPrefix\}-dropdown-menu`\}
          className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 w-56 rounded-\[4px\] bg-\[#14181D\] border border-\[#2C343E\] shadow-2xl z-50 overflow-hidden py-1 divide-y divide-\[#2C343E\]/50"
        >
          <div className="py-1">
            <button
              id=\{`\$\{idPrefix\}-opt-whatsapp`\}
              type="button"
              onClick=\{handleWhatsApp\}
              className="w-full flex items-center gap-2\.5 px-3\.5 py-2 text-xs text-\[#ECEFF1\] hover:bg-\[#25D366\]/15 hover:text-\[#25D366\] transition-colors text-left font-medium"
            >
              <MessageSquare className="w-4 h-4 text-\[#25D366\]" />
              <div>
                <div className="font-semibold">WhatsApp<\/div>
                <div className="text-\[10px\] text-\[#94A3B8\]">Enviar proposta via mensagem<\/div>
              <\/div>
            <\/button>
            <button
              id=\{`\$\{idPrefix\}-opt-email`\}
              type="button"
              onClick=\{handleEmail\}
              className="w-full flex items-center gap-2\.5 px-3\.5 py-2 text-xs text-\[#ECEFF1\] hover:bg-\[#38BDF8\]/15 hover:text-\[#38BDF8\] transition-colors text-left font-medium"
            >
              <Mail className="w-4 h-4 text-\[#38BDF8\]" />
              <div>
                <div className="font-semibold">E-mail AMBEV<\/div>
                <div className="text-\[10px\] text-\[#94A3B8\]">Abrir cliente de e-mail<\/div>
              <\/div>
            <\/button>
          <\/div>
          <div className="py-1">
            <button
              id=\{`\$\{idPrefix\}-opt-copy`\}
              type="button"
              onClick=\{handleCopy\}
              className="w-full flex items-center gap-2\.5 px-3\.5 py-2 text-xs text-\[#ECEFF1\] hover:bg-\[#F5A623\]/15 hover:text-\[#F5A623\] transition-colors text-left font-medium"
            >
              \{copied \? <Check className="w-4 h-4 text-\[#2ECC71\]" /> : <Copy className="w-4 h-4 text-\[#F5A623\]" />\}
              <div>
                <div className="font-semibold">\{copied \? 'Copiado!' : 'Copiar Texto'\}<\/div>
                <div className="text-\[10px\] text-\[#94A3B8\]">Copiar resumo formatado<\/div>
              <\/div>
            <\/button>
            <button
              id=\{`\$\{idPrefix\}-opt-pdf`\}
              type="button"
              onClick=\{handleDownloadOrPrint\}
              className="w-full flex items-center gap-2\.5 px-3\.5 py-2 text-xs text-\[#ECEFF1\] hover:bg-\[#38BDF8\]/15 hover:text-\[#38BDF8\] transition-colors text-left font-medium"
            >
              \{data\.link_pdf \? \(
                <Download className="w-4 h-4 text-\[#38BDF8\]" />
              \) : \(
                <Printer className="w-4 h-4 text-\[#94A3B8\]" />
              \)\}
              <div>
                <div className="font-semibold">\{data\.link_pdf \? 'Baixar PDF' : 'Imprimir Proposta'\}<\/div>
                <div className="text-\[10px\] text-\[#94A3B8\]">
                  \{data\.link_pdf \? 'Download direto do arquivo' : 'Gerar folha timbrada VC'\}
                <\/div>
              <\/div>
            <\/button>
          <\/div>
        <\/div>
      \)\}
    <\/div>
  \);"""

replacement = """  return (
    <div className={`compartilhar-wrapper ${className}`} ref={dropdownRef}>
      <button
        id={`${idPrefix}-dropdown-trigger`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] transition-all shadow-sm focus:outline-none"
      >
        <Share2 className="w-4 h-4 text-[#38BDF8]" />
        <span>Compartilhar</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] rotate-180" />}
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div id={`${idPrefix}-dropdown-menu`} className="compartilhar-dropdown">
            <button
              id={`${idPrefix}-opt-whatsapp`}
              type="button"
              className="compartilhar-item"
              onClick={handleWhatsApp}
            >
              <MessageSquare size={14} color="#25D366" />
              WhatsApp
            </button>

            <button
              id={`${idPrefix}-opt-email`}
              type="button"
              className="compartilhar-item"
              onClick={handleEmail}
            >
              <Mail size={14} className="text-[#38BDF8]" />
              E-mail
            </button>

            <button
              id={`${idPrefix}-opt-copy`}
              type="button"
              className="compartilhar-item"
              onClick={handleCopy}
            >
              {copied ? <Check size={14} className="text-[#2ECC71]" /> : <Copy size={14} className="text-[#F5A623]" />}
              {copied ? 'Copiado!' : 'Copiar resumo'}
            </button>

            <button
              id={`${idPrefix}-opt-pdf`}
              type="button"
              className="compartilhar-item"
              onClick={handleDownloadOrPrint}
            >
              {data.link_pdf ? (
                <Download size={14} className="text-[#38BDF8]" />
              ) : (
                <Printer size={14} className="text-[#94A3B8]" />
              )}
              Baixar PDF
            </button>
          </div>
        </>
      )}
    </div>
  );"""

text = re.sub(target_old, replacement, text)

with open("src/components/common/CompartilharOrcamento.tsx", "w") as f:
    f.write(text)
