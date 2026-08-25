import React, { useState } from 'react';
import { MessageSquare, Mail, Copy, Printer, Check } from 'lucide-react';
import { 
  ShareOccurrenceData, 
  buildWhatsAppShareText, 
  buildEmailShareContent 
} from '../../utils/formatters';

interface CompartilharOcorrenciaProps {
  data: ShareOccurrenceData;
  compact?: boolean;
  className?: string;
  idPrefix?: string;
}

export const CompartilharOcorrencia: React.FC<CompartilharOcorrenciaProps> = ({
  data,
  compact = false,
  className = '',
  idPrefix = 'share',
}) => {
  const [copied, setCopied] = useState(false);

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = buildWhatsAppShareText(data);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { subject, body } = buildEmailShareContent(data);
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = buildWhatsAppShareText(data);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`} onClick={(e) => e.stopPropagation()}>
        <button
          id={`${idPrefix}-whatsapp`}
          onClick={handleWhatsApp}
          title="Compartilhar via WhatsApp"
          className="p-1.5 rounded-[4px] bg-[#1C222A] hover:bg-[#25D366]/20 text-[#94A3B8] hover:text-[#25D366] border border-[#2C343E] transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
        <button
          id={`${idPrefix}-email`}
          onClick={handleEmail}
          title="Enviar por E-mail"
          className="p-1.5 rounded-[4px] bg-[#1C222A] hover:bg-[#38BDF8]/20 text-[#94A3B8] hover:text-[#38BDF8] border border-[#2C343E] transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
        </button>
        <button
          id={`${idPrefix}-copy`}
          onClick={handleCopy}
          title="Copiar Resumo"
          className="p-1.5 rounded-[4px] bg-[#1C222A] hover:bg-[#F5A623]/20 text-[#94A3B8] hover:text-[#F5A623] border border-[#2C343E] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#2ECC71]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        id={`${idPrefix}-full-whatsapp`}
        onClick={handleWhatsApp}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/40 transition-colors shadow-sm"
      >
        <MessageSquare className="w-4 h-4" />
        <span>WhatsApp</span>
      </button>

      <button
        id={`${idPrefix}-full-email`}
        onClick={handleEmail}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] border border-[#38BDF8]/40 transition-colors shadow-sm"
      >
        <Mail className="w-4 h-4" />
        <span>E-mail</span>
      </button>

      <button
        id={`${idPrefix}-full-copy`}
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] transition-colors shadow-sm"
      >
        {copied ? <Check className="w-4 h-4 text-[#2ECC71]" /> : <Copy className="w-4 h-4 text-[#F5A623]" />}
        <span>{copied ? 'Copiado!' : 'Copiar Resumo'}</span>
      </button>

      <button
        id={`${idPrefix}-full-print`}
        onClick={handlePrint}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] transition-colors shadow-sm"
      >
        <Printer className="w-4 h-4 text-[#94A3B8]" />
        <span>Imprimir / PDF</span>
      </button>
    </div>
  );
};
