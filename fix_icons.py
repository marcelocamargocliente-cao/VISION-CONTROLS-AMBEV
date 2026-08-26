import re

with open("src/components/common/CompartilharOrcamento.tsx", "r") as f:
    text = f.read()

text = text.replace(
    'import { Share2, ChevronDown, Check, Copy, MessageSquare, Mail, Printer, Download } from \'lucide-react\';',
    'import { Share2, ChevronDown, ChevronUp, Check, Copy, MessageSquare, Mail, Printer, Download } from \'lucide-react\';'
)

text = text.replace(
    '{isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] rotate-180" />}',
    '{isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" /> : <ChevronUp className="w-3.5 h-3.5 text-[#94A3B8]" />}'
)

with open("src/components/common/CompartilharOrcamento.tsx", "w") as f:
    f.write(text)
