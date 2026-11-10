-- Migration 06: Add loose sales & tile specific columns to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS allow_loose_sales BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS loose_uom VARCHAR(64) DEFAULT 'PCS',
  ADD COLUMN IF NOT EXISTS loose_conversion_ratio NUMERIC(15, 4) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS loose_purchase_price NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS loose_sale_price NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS tile_print VARCHAR(128),
  ADD COLUMN IF NOT EXISTS finish_type VARCHAR(128);

-- Notify PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
