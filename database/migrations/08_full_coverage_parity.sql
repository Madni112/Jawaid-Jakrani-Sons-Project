-- ====================================================================
-- AL MUHAMMADI ERP - FULL COVERAGE PARITY MIGRATION
-- Adds all 9 remaining sub-module tables & all compatibility columns
-- ====================================================================

-- 1. POS System: Order Items & Workstation Settings
CREATE TABLE IF NOT EXISTS public.pos_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.pos_orders(id) ON DELETE CASCADE,
    product_id BIGINT,
    product_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(128),
    quantity NUMERIC NOT NULL DEFAULT 1,
    uom VARCHAR(32) DEFAULT 'PCS',
    unit_price NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pos_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_order_items_all" ON public.pos_order_items;
CREATE POLICY "pos_order_items_all" ON public.pos_order_items FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.pos_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) DEFAULT 'al_muhammadi',
    terminal_code VARCHAR(64) DEFAULT 'Register 01',
    receipt_header TEXT,
    receipt_footer TEXT,
    show_logo BOOLEAN DEFAULT TRUE,
    auto_print_receipt BOOLEAN DEFAULT TRUE,
    cash_drawer_kick_command VARCHAR(64),
    allow_loose_sales BOOLEAN DEFAULT TRUE,
    sound_effects_enabled BOOLEAN DEFAULT TRUE,
    active_soundpack VARCHAR(64) DEFAULT 'modern',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pos_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pos_settings_all" ON public.pos_settings;
CREATE POLICY "pos_settings_all" ON public.pos_settings FOR ALL USING (true) WITH CHECK (true);

-- 2. Workflow & Application Settings
CREATE TABLE IF NOT EXISTS public.workflow_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) DEFAULT 'al_muhammadi',
    feature_key VARCHAR(128) UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.workflow_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workflow_settings_all" ON public.workflow_settings;
CREATE POLICY "workflow_settings_all" ON public.workflow_settings FOR ALL USING (true) WITH CHECK (true);

-- 3. CRM Follow-ups
CREATE TABLE IF NOT EXISTS public.crm_follow_ups (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(64) DEFAULT 'al_muhammadi',
    customer_id BIGINT,
    customer_name VARCHAR(255),
    follow_up_date DATE,
    notes TEXT,
    status VARCHAR(64) DEFAULT 'Pending',
    assigned_to VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.crm_follow_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crm_follow_ups_all" ON public.crm_follow_ups;
CREATE POLICY "crm_follow_ups_all" ON public.crm_follow_ups FOR ALL USING (true) WITH CHECK (true);

-- 4. Human Resources: Attendance & Pay Heads
CREATE TABLE IF NOT EXISTS public.hr_attendance (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT,
    attendance_date DATE DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status VARCHAR(32) DEFAULT 'Present',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hr_attendance_all" ON public.hr_attendance;
CREATE POLICY "hr_attendance_all" ON public.hr_attendance FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.hr_pay_heads (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) DEFAULT 'Earning',
    calculation_type VARCHAR(64) DEFAULT 'Flat Rate',
    default_amount NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.hr_pay_heads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hr_pay_heads_all" ON public.hr_pay_heads;
CREATE POLICY "hr_pay_heads_all" ON public.hr_pay_heads FOR ALL USING (true) WITH CHECK (true);

-- 5. Bill of Materials (BOM) & Manufacturing
CREATE TABLE IF NOT EXISTS public.bom_headers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) DEFAULT 'al_muhammadi',
    bom_number VARCHAR(64) NOT NULL UNIQUE,
    finished_product_name VARCHAR(255) NOT NULL,
    batch_quantity NUMERIC DEFAULT 1,
    uom VARCHAR(32) DEFAULT 'PCS',
    total_cost NUMERIC DEFAULT 0,
    status VARCHAR(32) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bom_headers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bom_headers_all" ON public.bom_headers;
CREATE POLICY "bom_headers_all" ON public.bom_headers FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.bom_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID REFERENCES public.bom_headers(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_cost NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bom_items_all" ON public.bom_items;
CREATE POLICY "bom_items_all" ON public.bom_items FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.bom_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) DEFAULT 'al_muhammadi',
    recipe_name VARCHAR(255) NOT NULL,
    raw_materials JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bom_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bom_recipes_all" ON public.bom_recipes;
CREATE POLICY "bom_recipes_all" ON public.bom_recipes FOR ALL USING (true) WITH CHECK (true);

-- 6. Column Additions & Compatibility Aliases
-- Banks
ALTER TABLE public.banks 
  ADD COLUMN IF NOT EXISTS "bankName" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "accountTitle" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "accountNumber" VARCHAR(64);
UPDATE public.banks 
  SET "bankName" = COALESCE("bankName", bank_name),
      "accountTitle" = COALESCE("accountTitle", account_title),
      "accountNumber" = COALESCE("accountNumber", account_number);

-- Chart of Accounts
ALTER TABLE public.chart_of_accounts
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS balance_nature VARCHAR(16) DEFAULT 'Debit';

-- Customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customername VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "customerCode" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS account_code VARCHAR(64),
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "currentBalance" NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "registrationType" VARCHAR(64) DEFAULT 'Retail / General',
  ADD COLUMN IF NOT EXISTS "primaryPhone" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "ntnNo" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "followUpDate" DATE;
UPDATE public.customers
  SET customer_name = COALESCE(customer_name, "customerName"),
      customername = COALESCE(customername, "customerName", customer_name);

-- Vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS "currentBalance" NUMERIC(15, 2) DEFAULT 0.00;
UPDATE public.vendors
  SET "currentBalance" = COALESCE("currentBalance", balance, opening_balance);

-- Products Price Compatibility
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS sales_price NUMERIC(15, 2) DEFAULT 0.00;
UPDATE public.products
  SET price = COALESCE(price, retail_price),
      sale_price = COALESCE(sale_price, retail_price),
      sales_price = COALESCE(sales_price, retail_price);

-- Sales Invoices & Returns
ALTER TABLE public.sales_invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE public.sales_returns ADD COLUMN IF NOT EXISTS total_net_amount NUMERIC(15, 2) DEFAULT 0.00;

-- Tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS allowed_settings JSONB DEFAULT '[]'::jsonb;

-- HR & Inventory Categories
ALTER TABLE public.hr_designations ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.hr_employees ADD COLUMN IF NOT EXISTS designation_name VARCHAR(100) DEFAULT 'Staff';
ALTER TABLE public.inventory_categories ADD COLUMN IF NOT EXISTS description TEXT;

-- Supplier Purchases Compatibility
ALTER TABLE public.supplier_purchases
  ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15, 2) DEFAULT 0.00;
UPDATE public.supplier_purchases
  SET balance_amount = COALESCE(balance_amount, remaining_balance, 0),
      paid_amount = COALESCE(paid_amount, amount_paid, 0);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
