-- ============================================================
-- IVCA — Tabela de Orçamentos / Propostas PPAC
-- Rode em: https://supabase.com/dashboard/project/hiaexzlqctlvibusuxoj/sql/new
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orcamentos (
  id                text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ocorrencia_id     text,
  numero            text NOT NULL,
  fornecedor        text NOT NULL DEFAULT 'Vision Controls',
  valor_total       numeric(12,2) DEFAULT 0,
  data_envio        text,
  enviado_para      text,
  validade          text,
  status            text NOT NULL DEFAULT 'RASCUNHO',
  arquivo_pdf_url   text,
  arquivo_url       text,
  descricao_anomalia text,
  observacoes       text,
  pecas             jsonb,
  numero_pedido     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orcamentos_all" ON public.orcamentos;
CREATE POLICY "orcamentos_all" ON public.orcamentos
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_orcamentos_ocorrencia ON public.orcamentos(ocorrencia_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON public.orcamentos(status);
