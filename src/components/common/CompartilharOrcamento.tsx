import React, { useState, useRef, useEffect } from 'react';
import {
  Share2,
  MessageSquare,
  Mail,
  Copy,
  Download,
  Printer,
  Check,
  ChevronDown,
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
        onToast('Copiado!', 'success');
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
      const link = document.createElement('a');
      link.href = data.link_pdf;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `Proposta_${data.numero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
          <MessageSquare className="w-4 h-4" />
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
          <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
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
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        id={`${idPrefix}-dropdown-trigger`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[4px] bg-[#1C222A] hover:bg-[#2C343E] text-[#ECEFF1] border border-[#2C343E] hover:border-[#38BDF8]/50 transition-all shadow-sm focus:outline-none"
      >
        <Share2 className="w-4 h-4 text-[#38BDF8]" />
        <span>Compartilhar</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id={`${idPrefix}-dropdown-menu`}
          className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 w-56 rounded-[4px] bg-[#14181D] border border-[#2C343E] shadow-2xl z-50 overflow-hidden py-1 divide-y divide-[#2C343E]/50"
        >
          <div className="py-1">
            <button
              id={`${idPrefix}-opt-whatsapp`}
              type="button"
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#ECEFF1] hover:bg-[#25D366]/15 hover:text-[#25D366] transition-colors text-left font-medium"
            >
              <MessageSquare className="w-4 h-4 text-[#25D366]" />
              <div>
                <div className="font-semibold">WhatsApp</div>
                <div className="text-[10px] text-[#94A3B8]">Enviar proposta via mensagem</div>
              </div>
            </button>

            <button
              id={`${idPrefix}-opt-email`}
              type="button"
              onClick={handleEmail}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#ECEFF1] hover:bg-[#38BDF8]/15 hover:text-[#38BDF8] transition-colors text-left font-medium"
            >
              <Mail className="w-4 h-4 text-[#38BDF8]" />
              <div>
                <div className="font-semibold">E-mail AMBEV</div>
                <div className="text-[10px] text-[#94A3B8]">Abrir cliente de e-mail</div>
              </div>
            </button>
          </div>

          <div className="py-1">
            <button
              id={`${idPrefix}-opt-copy`}
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#ECEFF1] hover:bg-[#F5A623]/15 hover:text-[#F5A623] transition-colors text-left font-medium"
            >
              {copied ? <Check className="w-4 h-4 text-[#2ECC71]" /> : <Copy className="w-4 h-4 text-[#F5A623]" />}
              <div>
                <div className="font-semibold">{copied ? 'Copiado!' : 'Copiar Texto'}</div>
                <div className="text-[10px] text-[#94A3B8]">Copiar resumo formatado</div>
              </div>
            </button>

            <button
              id={`${idPrefix}-opt-pdf`}
              type="button"
              onClick={handleDownloadOrPrint}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#ECEFF1] hover:bg-[#38BDF8]/15 hover:text-[#38BDF8] transition-colors text-left font-medium"
            >
              {data.link_pdf ? (
                <Download className="w-4 h-4 text-[#38BDF8]" />
              ) : (
                <Printer className="w-4 h-4 text-[#94A3B8]" />
              )}
              <div>
                <div className="font-semibold">{data.link_pdf ? 'Baixar PDF' : 'Imprimir Proposta'}</div>
                <div className="text-[10px] text-[#94A3B8]">
                  {data.link_pdf ? 'Download direto do arquivo' : 'Gerar folha timbrada VC'}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
