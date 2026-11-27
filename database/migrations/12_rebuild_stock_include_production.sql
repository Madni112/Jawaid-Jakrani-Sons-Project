-- ============================================================
-- 12_rebuild_stock_include_production.sql
-- Patch rebuild_stock_balance() so Completed production_orders
-- are included in stock_balances (+completed_quantity to destination_warehouse,
-- -consumed_qty from source_warehouse).
-- ============================================================

DO $$
DECLARE
    v_def text;
    v_prod_sql text;
BEGIN
    SELECT pg_get_functiondef('public.rebuild_stock_balance(text)'::regprocedure) INTO v_def;
    IF v_def IS NULL THEN
        RETURN;
    END IF;

    -- Skip if already patched
    IF position('production_orders' in v_def) > 0 THEN
        RETURN;
    END IF;

    v_prod_sql := $PROD$
        UNION ALL
        -- 7a. Manufacturing Production Orders: finished goods produced (+)
        SELECT lower(btrim(COALESCE(po.finished_product_name, ''))),
               btrim(COALESCE(NULLIF(btrim(po.destination_warehouse), ''), 'Global / Unassigned')),
               COALESCE(po.completed_quantity, po.target_quantity, 0)::numeric
        FROM public.production_orders po
        WHERE po.status = 'Completed'

        UNION ALL
        -- 7b. Manufacturing Production Orders: raw materials consumed (-)
        SELECT lower(btrim(COALESCE(m->>'item_name', m->>'product_name', ''))),
               btrim(COALESCE(NULLIF(btrim(po.source_warehouse), ''), 'Global / Unassigned')),
               -1 * (COALESCE(NULLIF(m->>'consumed_qty', ''), m->>'required_qty', '0'))::numeric
        FROM public.production_orders po
        CROSS JOIN LATERAL jsonb_array_elements(po.materials) AS m
        WHERE po.status = 'Completed'
      )
      INSERT INTO public.stock_balances$PROD$;

    v_def := regexp_replace(v_def, '\)\s*INSERT INTO public\.stock_balances', v_prod_sql, 'i');
    EXECUTE v_def;
END $$;

SELECT public.rebuild_stock_balance(NULL);
