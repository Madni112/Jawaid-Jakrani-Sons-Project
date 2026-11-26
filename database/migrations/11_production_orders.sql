-- ============================================================
-- 11_production_orders.sql
-- Create public.production_orders table for Manufacturing Work Orders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) DEFAULT 'bashir',
    order_number VARCHAR(64) NOT NULL UNIQUE,
    batch_number VARCHAR(128) NOT NULL,
    mfg_date VARCHAR(32),
    exp_date VARCHAR(32),
    bom_id VARCHAR(128),
    bom_number VARCHAR(64),
    finished_product_id VARCHAR(128),
    finished_product_name VARCHAR(255) NOT NULL,
    finished_product_code VARCHAR(128),
    category VARCHAR(128) DEFAULT 'General',
    target_quantity NUMERIC(20, 4) DEFAULT 1,
    completed_quantity NUMERIC(20, 4) DEFAULT 0,
    wastage_quantity NUMERIC(20, 4) DEFAULT 0,
    uom VARCHAR(64) DEFAULT 'PCS',
    status VARCHAR(32) DEFAULT 'Planned',
    priority VARCHAR(32) DEFAULT 'Normal',
    source_warehouse VARCHAR(255),
    destination_warehouse VARCHAR(255),
    planned_start_date VARCHAR(32),
    planned_completion_date VARCHAR(32),
    actual_start_date VARCHAR(32),
    actual_completion_date VARCHAR(32),
    supervisor VARCHAR(255),
    estimated_unit_cost NUMERIC(20, 4) DEFAULT 0,
    estimated_total_cost NUMERIC(20, 4) DEFAULT 0,
    actual_unit_cost NUMERIC(20, 4) DEFAULT 0,
    actual_total_cost NUMERIC(20, 4) DEFAULT 0,
    labor_cost NUMERIC(20, 4) DEFAULT 0,
    overhead_cost NUMERIC(20, 4) DEFAULT 0,
    notes TEXT,
    materials JSONB DEFAULT '[]'::jsonb,
    qc_checklist JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "production_orders_all" ON public.production_orders;
CREATE POLICY "production_orders_all" ON public.production_orders FOR ALL USING (true) WITH CHECK (true);
