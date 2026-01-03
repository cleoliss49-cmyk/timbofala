-- SISTEMA DE COMISSÕES NÍVEL FINTECH
-- Problema: Atualmente quando admin confirma pagamento, todas as comissões são marcadas como pagas
-- sem registrar o valor real recebido. Novas vendas sobrescrevem o mesmo registro.

-- Solução: Criar tabela separada de pagamentos + lógica de saldo devedor

-- 1. Criar tabela de pagamentos de comissão (histórico granular)
CREATE TABLE IF NOT EXISTS public.commission_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  commission_id uuid REFERENCES public.platform_commissions(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL DEFAULT 'pix',
  receipt_url text,
  receipt_uploaded_at timestamp with time zone,
  notes text,
  confirmed_at timestamp with time zone,
  confirmed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Índices para performance
CREATE INDEX idx_commission_payments_business ON public.commission_payments(business_id);
CREATE INDEX idx_commission_payments_commission ON public.commission_payments(commission_id);
CREATE INDEX idx_commission_payments_created ON public.commission_payments(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acesso
CREATE POLICY "Business owners can view their payments"
ON public.commission_payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM business_profiles bp
  WHERE bp.id = commission_payments.business_id
  AND bp.user_id = auth.uid()
));

CREATE POLICY "Admins can view all payments"
ON public.commission_payments
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert payments"
ON public.commission_payments
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update payments"
ON public.commission_payments
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete payments"
ON public.commission_payments
FOR DELETE
USING (is_admin(auth.uid()));

-- 5. Alterar platform_commissions para suportar saldo dinâmico
-- Adicionar coluna de crédito/débito anterior se não existir
ALTER TABLE public.platform_commissions 
ADD COLUMN IF NOT EXISTS previous_balance numeric DEFAULT 0;

-- 6. Criar função para calcular saldo devedor de um negócio
CREATE OR REPLACE FUNCTION public.get_business_commission_balance(p_business_id uuid)
RETURNS TABLE (
  total_commission numeric,
  total_paid numeric,
  current_balance numeric,
  pending_months integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(pc.commission_amount), 0)::numeric as total_commission,
    COALESCE((SELECT SUM(cp.amount) FROM commission_payments cp WHERE cp.business_id = p_business_id AND cp.confirmed_at IS NOT NULL), 0)::numeric as total_paid,
    (COALESCE(SUM(pc.commission_amount), 0) - COALESCE((SELECT SUM(cp.amount) FROM commission_payments cp WHERE cp.business_id = p_business_id AND cp.confirmed_at IS NOT NULL), 0))::numeric as current_balance,
    COUNT(DISTINCT pc.month_year)::integer as pending_months
  FROM platform_commissions pc
  WHERE pc.business_id = p_business_id;
END;
$$;

-- 7. Criar função para admin registrar pagamento
CREATE OR REPLACE FUNCTION public.register_commission_payment(
  p_business_id uuid,
  p_amount numeric,
  p_receipt_url text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id uuid;
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Verificar se é admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Validar valor
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  -- Inserir pagamento
  INSERT INTO commission_payments (
    business_id,
    amount,
    receipt_url,
    notes,
    confirmed_at,
    confirmed_by
  )
  VALUES (
    p_business_id,
    p_amount,
    p_receipt_url,
    p_notes,
    now(),
    auth.uid()
  )
  RETURNING id INTO v_payment_id;

  -- Calcular novo saldo
  SELECT current_balance INTO v_current_balance
  FROM get_business_commission_balance(p_business_id);

  v_new_balance := v_current_balance - p_amount;

  -- Atualizar status das comissões baseado no novo saldo
  IF v_new_balance <= 0 THEN
    -- Saldo zerado ou crédito, marcar todas comissões como pagas
    UPDATE platform_commissions
    SET 
      status = 'paid',
      paid_at = now(),
      paid_amount = commission_amount,
      balance = 0,
      confirmed_by = auth.uid(),
      admin_notes = COALESCE(admin_notes || E'\n', '') || 'Pago via registro ID: ' || v_payment_id::text,
      updated_at = now()
    WHERE business_id = p_business_id
    AND status IN ('pending', 'awaiting_confirmation');
  ELSE
    -- Ainda há saldo devedor, atualizar as comissões mais antigas primeiro
    UPDATE platform_commissions
    SET 
      status = 'pending',
      balance = v_new_balance,
      paid_amount = commission_amount - v_new_balance,
      admin_notes = COALESCE(admin_notes || E'\n', '') || 'Pagamento parcial registrado: R$ ' || p_amount::text,
      updated_at = now()
    WHERE business_id = p_business_id
    AND status IN ('pending', 'awaiting_confirmation');
  END IF;

  RETURN v_payment_id;
END;
$$;

-- 8. Criar view para facilitar consulta do admin
CREATE OR REPLACE VIEW public.business_commission_summary AS
SELECT 
  bp.id as business_id,
  bp.business_name,
  bp.logo_url,
  bp.slug,
  COALESCE(SUM(pc.commission_amount), 0) as total_commission,
  COALESCE(SUM(pc.total_sales), 0) as total_sales,
  COALESCE((
    SELECT SUM(cp.amount) 
    FROM commission_payments cp 
    WHERE cp.business_id = bp.id AND cp.confirmed_at IS NOT NULL
  ), 0) as total_paid,
  COALESCE(SUM(pc.commission_amount), 0) - COALESCE((
    SELECT SUM(cp.amount) 
    FROM commission_payments cp 
    WHERE cp.business_id = bp.id AND cp.confirmed_at IS NOT NULL
  ), 0) as current_balance,
  MAX(pc.receipt_url) as last_receipt_url,
  MAX(pc.receipt_uploaded_at) as last_receipt_at,
  CASE 
    WHEN COALESCE(SUM(pc.commission_amount), 0) - COALESCE((
      SELECT SUM(cp.amount) 
      FROM commission_payments cp 
      WHERE cp.business_id = bp.id AND cp.confirmed_at IS NOT NULL
    ), 0) <= 0 THEN 'paid'
    WHEN EXISTS (SELECT 1 FROM platform_commissions WHERE business_id = bp.id AND status = 'awaiting_confirmation') THEN 'awaiting_confirmation'
    ELSE 'pending'
  END as balance_status
FROM business_profiles bp
LEFT JOIN platform_commissions pc ON pc.business_id = bp.id
WHERE bp.is_active = true
GROUP BY bp.id, bp.business_name, bp.logo_url, bp.slug;

-- 9. Grant execute nas funções
GRANT EXECUTE ON FUNCTION public.get_business_commission_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_commission_payment(uuid, numeric, text, text) TO authenticated;

-- 10. Habilitar realtime para commission_payments
ALTER PUBLICATION supabase_realtime ADD TABLE public.commission_payments;