-- ====================================================================
-- NOOR HORIZON TECHNOLOGIES ERP - MIGRATION
-- Migration: 12_create_bom_recipes_table.sql
-- Description: Dedicated table for BOM Manufacturing Recipes
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.bom_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) DEFAULT 'uzair',
    recipe_name VARCHAR(255) NOT NULL,
    finished_product_name VARCHAR(255),
    finished_product_code VARCHAR(128),
    finished_product_id VARCHAR(128),
    category VARCHAR(128) DEFAULT 'General',
    sub_category VARCHAR(128),
    sub_sub_category VARCHAR(128),
    batch_quantity NUMERIC NOT NULL DEFAULT 1,
    uom VARCHAR(32) NOT NULL DEFAULT 'PCS',
    raw_material_cost NUMERIC NOT NULL DEFAULT 0,
    labor_cost NUMERIC NOT NULL DEFAULT 0,
    overhead_cost NUMERIC NOT NULL DEFAULT 0,
    packaging_cost NUMERIC NOT NULL DEFAULT 0,
    total_cost NUMERIC NOT NULL DEFAULT 0,
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    target_selling_price NUMERIC NOT NULL DEFAULT 0,
    margin_percentage NUMERIC NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'Active',
    notes TEXT,
    raw_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security and grant universal access policy
ALTER TABLE public.bom_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bom_recipes_all" ON public.bom_recipes;
CREATE POLICY "bom_recipes_all" ON public.bom_recipes FOR ALL USING (true) WITH CHECK (true);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_bom_recipes_recipe_name ON public.bom_recipes(recipe_name);
CREATE INDEX IF NOT EXISTS idx_bom_recipes_tenant_id ON public.bom_recipes(tenant_id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

