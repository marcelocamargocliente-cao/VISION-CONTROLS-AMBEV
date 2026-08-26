import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Share2,
  MessageCircle,
  Mail,
  Copy,
  Download,
  Printer,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ShareOrcamentoData,
  buildOrcamentoShareText,
  buildOrcamentoEmailContent,
} from '../../utils/formatters';

interface CompartilharOrcamentoProps {
  data: ShareOrcamentoData;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  className?: string;
  idPrefix?: string;
  variant?: 'dropdown' | 'buttons';
}

export const CompartilharOrcamento: React.FC<CompartilharOrcamentoProps> = ({
  data,
  onToast,
  className = '',
  idPrefix = 'share-orc',
  variant = 'dropdown',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const abrirDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.top - 8,
        left: rect.left,
      });
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const fechar = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.compartilhar-portal') && !btnRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, [isOpen]);

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = buildOrcamentoShareText(data);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    if (onToast) onToast('Abrindo WhatsApp com a proposta...', 'info');
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { subject, body } = buildOrcamentoEmailContent(data);
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setIsOpen(false);
    if (onToast) onToast('Iniciando cliente de e-mail...', 'info');
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = buildOrcamentoShareText(data);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (onToast) {
        onToast('Texto copiado!', 'success');
      }
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Falha ao copiar para a área de transferência', 'error');
    }
  };

  const handleDownloadOrPrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (data.link_pdf) {
      window.open(data.link_pdf, '_blank', 'noopener,noreferrer');
      if (onToast) onToast('Abrindo arquivo PDF da proposta...', 'success');
    } else {
      if (onToast) onToast('Gerando visualização de impressão/PDF da proposta...', 'info');
      setTimeout(() => {
        window.print();
      }, 300);
    }
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <button
          id={`${idPrefix}-btn-whatsapp`}
          type="button"
          onClick={handleWhatsApp}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/40 transition-colors shadow-sm"
        >
          <MessageCircle className="w-4 h-4" color="#25D366" />
          <span>WhatsApp</span>
        </button>

        <button
          id={`${idPrefix}-btn-email`}
          type="button"
          onClick={handleEmail}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] border border-[#38BDF8]/40 transition-colors shadow-sm"
        >
          <Mail className="w-4 h-4" />
          <span>E-mail</span>
        </button>

        <button
          id={`${idPrefix}-btn-copy`}
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] transition-colors shadow-sm"
        >
          {copied ? <Check className="w-4 h-4 text-[#2ECC71]" /> : <Copy className="w-4 h-4 text-[#F5A623]" />}
          <span>{copied ? 'Copiado!' : 'Copiar resumo'}</span>
        </button>

        <button
          id={`${idPrefix}-btn-pdf`}
          type="button"
          onClick={handleDownloadOrPrint}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] transition-colors shadow-sm"
        >
          {data.link_pdf ? (
            <Download className="w-4 h-4 text-[#38BDF8]" />
          ) : (
            <Printer className="w-4 h-4 text-[#94A3B8]" />
          )}
          <span>{data.link_pdf ? 'Baixar PDF' : 'Imprimir / PDF'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        ref={btnRef}
        id={`${idPrefix}-dropdown-trigger`}
        type="button"
        onClick={abrirDropdown}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] hover:border-[#38BDF8]/50 transition-all shadow-sm focus:outline-none"
      >
        <Share2 className="w-4 h-4 text-[#38BDF8]" />
        <span>Compartilhar</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#94A3B8]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />}
      </button>

      {isOpen && createPortal(
        <div
          id={`${idPrefix}-dropdown-menu`}
          className="compartilhar-portal"
          style={{
            position: 'fixed',
            top: pos.top,
            left: Math.max(10, Math.min(pos.left, window.innerWidth - 220)),
            transform: 'translateY(-100%)',
            zIndex: 99999,
            background: '#1A1F28',
            border: '1px solid #30363D',
            borderRadius: 10,
            padding: 6,
            minWidth: 200,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* WhatsApp */}
          <button
            id={`${idPrefix}-opt-whatsapp`}
            type="button"
            className="compartilhar-item flex items-center gap-[10px] w-full py-[9px] px-[12px] rounded-[7px] border-0 bg-transparent text-[#E6EDF3] text-[13px] font-medium text-left cursor-pointer transition-colors whitespace-nowrap hover:bg-white/[0.06]"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" color="#25D366" />
            <span>WhatsApp</span>
          </button>

          {/* E-mail */}
          <button
            id={`${idPrefix}-opt-email`}
            type="button"
            className="compartilhar-item flex items-center gap-[10px] w-full py-[9px] px-[12px] rounded-[7px] border-0 bg-transparent text-[#E6EDF3] text-[13px] font-medium text-left cursor-pointer transition-colors whitespace-nowrap hover:bg-white/[0.06]"
            onClick={handleEmail}
          >
            <Mail className="w-4 h-4 shrink-0 text-[#38BDF8]" />
            <span>E-mail</span>
          </button>

          {/* Copiar */}
          <button
            id={`${idPrefix}-opt-copy`}
            type="button"
            className="compartilhar-item flex items-center gap-[10px] w-full py-[9px] px-[12px] rounded-[7px] border-0 bg-transparent text-[#E6EDF3] text-[13px] font-medium text-left cursor-pointer transition-colors whitespace-nowrap hover:bg-white/[0.06]"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4 text-[#2ECC71] shrink-0" /> : <Copy className="w-4 h-4 text-[#F5A623] shrink-0" />}
            <span>{copied ? 'Copiado!' : 'Copiar resumo'}</span>
          </button>

          {/* Baixar PDF */}
          <button
            id={`${idPrefix}-opt-pdf`}
            type="button"
            className="compartilhar-item flex items-center gap-[10px] w-full py-[9px] px-[12px] rounded-[7px] border-0 bg-transparent text-[#E6EDF3] text-[13px] font-medium text-left cursor-pointer transition-colors whitespace-nowrap hover:bg-white/[0.06]"
            onClick={handleDownloadOrPrint}
          >
            <Download className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span>{data.link_pdf ? 'Baixar PDF' : 'Imprimir / PDF'}</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};
