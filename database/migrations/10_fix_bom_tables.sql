-- ============================================================
-- 10_fix_bom_tables.sql
-- Ensure bom_headers, bom_items, and bom_recipes have all columns
-- required by bomService.ts and recipeService.ts.
-- ============================================================

-- 1) bom_headers
ALTER TABLE public.bom_headers
    ADD COLUMN IF NOT EXISTS finished_product_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS finished_product_code VARCHAR(128),
    ADD COLUMN IF NOT EXISTS category VARCHAR(128) DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS raw_material_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS overhead_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS packaging_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS target_selling_price NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(10, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2) bom_items
ALTER TABLE public.bom_items
    ADD COLUMN IF NOT EXISTS item_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS item_code VARCHAR(128),
    ADD COLUMN IF NOT EXISTS item_type VARCHAR(64) DEFAULT 'Chemical',
    ADD COLUMN IF NOT EXISTS uom VARCHAR(64) DEFAULT 'PCS',
    ADD COLUMN IF NOT EXISTS wastage_percentage NUMERIC(10, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS allow_loose BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS loose_uom VARCHAR(64),
    ADD COLUMN IF NOT EXISTS loose_ratio NUMERIC(20, 10),
    ADD COLUMN IF NOT EXISTS multi_loose_units JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS tier_quantities JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS tier_rates JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.bom_items
    ALTER COLUMN quantity TYPE NUMERIC(20, 10);

-- 3) bom_recipes
ALTER TABLE public.bom_recipes
    ADD COLUMN IF NOT EXISTS finished_product_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS finished_product_code VARCHAR(128),
    ADD COLUMN IF NOT EXISTS finished_product_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS category VARCHAR(128) DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS sub_category VARCHAR(128),
    ADD COLUMN IF NOT EXISTS sub_sub_category VARCHAR(128),
    ADD COLUMN IF NOT EXISTS batch_quantity NUMERIC(20, 4) DEFAULT 1,
    ADD COLUMN IF NOT EXISTS uom VARCHAR(64) DEFAULT 'PCS',
    ADD COLUMN IF NOT EXISTS raw_material_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS overhead_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS packaging_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS target_selling_price NUMERIC(20, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(10, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
