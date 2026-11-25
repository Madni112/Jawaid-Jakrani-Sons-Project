-- ============================================================
-- 09_increase_stock_precision.sql
-- Increase numeric precision on stock/quantity columns from (15,2) to (20,10)
-- so multi-tier loose UOMs (e.g. 99 PCS + 99 LTR + 999 ML + 999 .ML = 99.99999999)
-- do not get rounded up to 100 in Postgres.
-- ============================================================

-- 1) Widen numeric columns to 10 decimal places
ALTER TABLE public.stock_balances
    ALTER COLUMN quantity TYPE numeric(20, 10);

ALTER TABLE public.products
    ALTER COLUMN current_stock TYPE numeric(20, 10);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opening_stocks' AND column_name = 'qty') THEN
        EXECUTE 'ALTER TABLE public.opening_stocks ALTER COLUMN qty TYPE numeric(20, 10)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opening_stocks' AND column_name = 'quantity') THEN
        EXECUTE 'ALTER TABLE public.opening_stocks ALTER COLUMN quantity TYPE numeric(20, 10)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'grn_items' AND column_name = 'qty') THEN
        EXECUTE 'ALTER TABLE public.grn_items ALTER COLUMN qty TYPE numeric(20, 10)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'grn_items' AND column_name = 'accepted_qty') THEN
        EXECUTE 'ALTER TABLE public.grn_items ALTER COLUMN accepted_qty TYPE numeric(20, 10)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'grn_items' AND column_name = 'rejected_qty') THEN
        EXECUTE 'ALTER TABLE public.grn_items ALTER COLUMN rejected_qty TYPE numeric(20, 10)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'grn_items' AND column_name = 'hold_qty') THEN
        EXECUTE 'ALTER TABLE public.grn_items ALTER COLUMN hold_qty TYPE numeric(20, 10)';
    END IF;
END $$;

-- 2) Patch rebuild_stock_balance() in-place to preserve tenant_id & existing logic
--    while changing round(..., 2) -> round(..., 10) and > 0.0001 -> > 1e-10
DO $$
DECLARE
    v_def text;
BEGIN
    SELECT pg_get_functiondef('public.rebuild_stock_balance(text)'::regprocedure)
      INTO v_def;

    IF v_def IS NOT NULL THEN
        v_def := replace(v_def, 'round(SUM(qty)::numeric, 2)', 'round(SUM(qty)::numeric, 10)');
        v_def := replace(v_def, 'abs(SUM(qty)) > 0.0001', 'abs(SUM(qty)) > 1e-10');
        EXECUTE v_def;
    END IF;
END $$;

-- 3) Rebuild all stock balances with 10-decimal precision
SELECT public.rebuild_stock_balance(NULL);
