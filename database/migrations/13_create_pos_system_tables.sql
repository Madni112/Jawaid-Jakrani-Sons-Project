-- ====================================================================
-- NOOR HORIZON TECHNOLOGIES ERP - MIGRATION
-- Migration: 13_create_pos_system_tables.sql
-- Description: Dedicated tables for Universal Point of Sale (POS) Suite
-- ====================================================================

-- 1. POS Shifts (Cash Register Management)
CREATE TABLE IF NOT EXISTS public.pos_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) DEFAULT 'uzair',
    terminal_code VARCHAR(64) DEFAULT 'Register 01',
    business_date VARCHAR(32) DEFAULT CURRENT_DATE,
    cashier_id VARCHAR(128),
    cashier_name VARCHAR(255) NOT NULL,
    session_number INT NOT NULL DEFAULT 400,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_petty_cash NUMERIC NOT NULL DEFAULT 0,
    opening_cash_in NUMERIC NOT NULL DEFAULT 0,
    opening_cash_out NUMERIC NOT NULL DEFAULT 0,
    opening_float NUMERIC NOT NULL DEFAULT 0,
    cash_sales NUMERIC NOT NULL DEFAULT 0,
    card_sales NUMERIC NOT NULL DEFAULT 0,
    digital_sales NUMERIC NOT NULL DEFAULT 0,
    cash_in NUMERIC NOT NULL DEFAULT 0,
    cash_out NUMERIC NOT NULL DEFAULT 0,
    closing_cash_out NUMERIC NOT NULL DEFAULT 0,
    closing_cash_in NUMERIC NOT NULL DEFAULT 0,
    closing_petty_cash NUMERIC NOT NULL DEFAULT 0,
    expected_cash NUMERIC NOT NULL DEFAULT 0,
    actual_counted_cash NUMERIC,
    variance NUMERIC,
    status VARCHAR(32) NOT NULL DEFAULT 'Open',
    closing_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. POS Orders (Receipt Headers)
CREATE TABLE IF NOT EXISTS public.pos_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) DEFAULT 'uzair',
    order_number VARCHAR(64) NOT NULL UNIQUE,
    shift_id UUID REFERENCES public.pos_shifts(id) ON DELETE SET NULL,
    cashier_id VARCHAR(128),
    cashier_name VARCHAR(255) NOT NULL,
    customer_id VARCHAR(128),
    customer_name VARCHAR(255) DEFAULT 'Walk-in Customer',
    customer_tier VARCHAR(64) DEFAULT 'General',
    terminal_code VARCHAR(64) DEFAULT 'Register 01',
    fulfillment_type VARCHAR(64) DEFAULT 'In-Store Bag',
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax_percentage NUMERIC NOT NULL DEFAULT 0,
    tax_amount NUMERIC NOT NULL DEFAULT 0,
    discount_percentage NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC NOT NULL DEFAULT 0,
    voucher_code VARCHAR(64),
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_method VARCHAR(32) NOT NULL DEFAULT 'Cash',
    cash_tendered NUMERIC NOT NULL DEFAULT 0,
    change_due NUMERIC NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'Completed',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. POS Order Items (Line Items)
CREATE TABLE IF NOT EXISTS public.pos_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.pos_orders(id) ON DELETE CASCADE,
    product_id VARCHAR(128),
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(128),
    image_url TEXT,
    category VARCHAR(128),
    uom VARCHAR(32) DEFAULT 'PCS',
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC NOT NULL DEFAULT 0,
    line_total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. POS Held Orders (Parked Tickets)
CREATE TABLE IF NOT EXISTS public.pos_held_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) DEFAULT 'uzair',
    ticket_label VARCHAR(255) NOT NULL,
    ticket_number VARCHAR(64) NOT NULL,
    cashier_name VARCHAR(255),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. POS Terminal Settings
CREATE TABLE IF NOT EXISTS public.pos_settings (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
    tenant_id VARCHAR(64) DEFAULT 'uzair',
    terminal_name VARCHAR(128) DEFAULT 'Register 01',
    store_title VARCHAR(255) DEFAULT 'Uzair Jibran Cloth',
    store_address TEXT DEFAULT 'Cloth Market, Hyderabad, Sindh',
    store_phone VARCHAR(64) DEFAULT '+92 300 1234567',
    tax_id VARCHAR(64) DEFAULT 'NTN-786110',
    receipt_paper_size VARCHAR(16) DEFAULT '80mm',
    show_logo BOOLEAN DEFAULT true,
    footer_message TEXT DEFAULT 'Thank you for shopping! Exchange allowed within 7 days with original receipt.',
    theme_accent_color VARCHAR(16) DEFAULT '#06B6D4',
    sync_erp_theme BOOLEAN DEFAULT true,
    default_fulfillment VARCHAR(64) DEFAULT 'In-Store Bag',
    default_customer_name VARCHAR(128) DEFAULT 'Walk-in Customer',
    default_tax_rate NUMERIC DEFAULT 0,
    barcode_auto_add BOOLEAN DEFAULT true,
    sound_effects_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Extensions on existing tables for POS visibility & Image uploads & Barcodes
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_in_pos BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode VARCHAR(64);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode_locked BOOLEAN DEFAULT false;

ALTER TABLE public.inventory_categories ADD COLUMN IF NOT EXISTS show_in_pos BOOLEAN DEFAULT true;
ALTER TABLE public.inventory_categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.inventory_categories ADD COLUMN IF NOT EXISTS icon_name VARCHAR(64);

-- Enable RLS and permissive policies
ALTER TABLE public.pos_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_shifts_all" ON public.pos_shifts;
CREATE POLICY "pos_shifts_all" ON public.pos_shifts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_orders_all" ON public.pos_orders;
CREATE POLICY "pos_orders_all" ON public.pos_orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pos_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_order_items_all" ON public.pos_order_items;
CREATE POLICY "pos_order_items_all" ON public.pos_order_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pos_held_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_held_orders_all" ON public.pos_held_orders;
CREATE POLICY "pos_held_orders_all" ON public.pos_held_orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pos_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_settings_all" ON public.pos_settings;
CREATE POLICY "pos_settings_all" ON public.pos_settings FOR ALL USING (true) WITH CHECK (true);

-- Indexing for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_pos_orders_number ON public.pos_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_pos_orders_created ON public.pos_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_pos_shifts_status ON public.pos_shifts(status);

NOTIFY pgrst, 'reload schema';

