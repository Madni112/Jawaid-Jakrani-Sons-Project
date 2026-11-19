-- ====================================================================
-- ZOHAIB ALI & COMPANY ERP - DATABASE PARITY MIGRATION
-- Run this directly in Supabase SQL Editor on project: wpzwntbgpeiiclytuuht
--
-- SAFETY GUARANTEES:
-- 1. 100% NON-DESTRUCTIVE: Uses 'ADD COLUMN IF NOT EXISTS' exclusively.
-- 2. ZERO DATA LOSS: No tables or columns are dropped or truncated.
-- 3. AUTOMATIC BACKFILL: Syncs alias columns safely.
-- ====================================================================

-- 1. PRODUCTS TABLE PARITY (Loose Sales, Tile Attributes, Price Aliases)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS allow_loose_sales BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS loose_uom VARCHAR(64) DEFAULT 'PCS',
  ADD COLUMN IF NOT EXISTS loose_conversion_ratio NUMERIC(15, 4) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS loose_purchase_price NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS loose_sale_price NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS tile_print VARCHAR(128),
  ADD COLUMN IF NOT EXISTS finish_type VARCHAR(128),
  ADD COLUMN IF NOT EXISTS price NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS sales_price NUMERIC(15, 2) DEFAULT 0.00;

-- Backfill price aliases for legacy compatibility
UPDATE public.products
  SET price = COALESCE(price, retail_price, 0),
      sale_price = COALESCE(sale_price, retail_price, 0),
      sales_price = COALESCE(sales_price, retail_price, 0)
  WHERE price IS NULL OR sale_price IS NULL OR sales_price IS NULL;

-- 2. CUSTOMERS TABLE PARITY (Directory, Balances, Tax & Area Fields)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customername VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "customerCode" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS customercode VARCHAR(64),
  ADD COLUMN IF NOT EXISTS account_code VARCHAR(64),
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "currentBalance" NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "registrationType" VARCHAR(64) DEFAULT 'Retail / General',
  ADD COLUMN IF NOT EXISTS registrationtype VARCHAR(64) DEFAULT 'Retail / General',
  ADD COLUMN IF NOT EXISTS "primaryPhone" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS primaryphone VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "secondaryPhone" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS secondaryphone VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "cnicNo" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS cnicno VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "ntnNo" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS ntnno VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "stRegNo" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS stregno VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "followUpDate" DATE,
  ADD COLUMN IF NOT EXISTS followupdate DATE,
  ADD COLUMN IF NOT EXISTS area VARCHAR(128),
  ADD COLUMN IF NOT EXISTS sub_area VARCHAR(128),
  ADD COLUMN IF NOT EXISTS freight_account_code VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "freightAccountCode" VARCHAR(64);

-- Backfill customer name & balance aliases
UPDATE public.customers
  SET customer_name = COALESCE(customer_name, "customerName"),
      customername = COALESCE(customername, "customerName", customer_name),
      "customerCode" = COALESCE("customerCode", customer_code),
      customercode = COALESCE(customercode, "customerCode", customer_code),
      "currentBalance" = COALESCE("currentBalance", balance, opening_balance, 0)
  WHERE customer_name IS NULL OR "customerCode" IS NULL;

-- 3. VENDORS TABLE PARITY (Vendor Code, Contact, Ledger Balance Fields)
ALTER TABLE public.vendors 
  ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "vendorCode" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS account_code VARCHAR(64),
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(128),
  ADD COLUMN IF NOT EXISTS contact_name VARCHAR(128),
  ADD COLUMN IF NOT EXISTS mobile VARCHAR(32),
  ADD COLUMN IF NOT EXISTS cell_no VARCHAR(32),
  ADD COLUMN IF NOT EXISTS phone_no VARCHAR(32),
  ADD COLUMN IF NOT EXISTS city VARCHAR(128),
  ADD COLUMN IF NOT EXISTS area VARCHAR(128),
  ADD COLUMN IF NOT EXISTS sub_area VARCHAR(128),
  ADD COLUMN IF NOT EXISTS "subArea" VARCHAR(128),
  ADD COLUMN IF NOT EXISTS page_no VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "pageNo" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS balance NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS balance_nature VARCHAR(16) DEFAULT 'Credit',
  ADD COLUMN IF NOT EXISTS "currentBalance" NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill vendor aliases
UPDATE public.vendors
  SET "vendorCode" = COALESCE("vendorCode", vendor_code),
      vendor_code = COALESCE(vendor_code, "vendorCode"),
      contact_person = COALESCE(contact_person, contact_name),
      "currentBalance" = COALESCE("currentBalance", balance, opening_balance, 0);

-- 4. SALES INVOICES & RETURNS PARITY
ALTER TABLE public.sales_invoices 
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(15, 2) DEFAULT 0.00;

ALTER TABLE public.sales_returns 
  ADD COLUMN IF NOT EXISTS total_net_amount NUMERIC(15, 2) DEFAULT 0.00;

-- 5. SUPPLIER PURCHASES PARITY
ALTER TABLE public.supplier_purchases
  ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15, 2) DEFAULT 0.00;

-- 6. CHART OF ACCOUNTS & FINANCIAL VOUCHERS PARITY
ALTER TABLE public.chart_of_accounts
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS balance_nature VARCHAR(16) DEFAULT 'Debit';

ALTER TABLE public.financial_vouchers
  ADD COLUMN IF NOT EXISTS account_title VARCHAR(255);

-- 7. TENANTS & INVENTORY CATEGORIES PARITY
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS allowed_settings JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.inventory_categories 
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 8. BANKS COMPATIBILITY
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS "bankName" VARCHAR(255);
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS "accountTitle" VARCHAR(255);
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS "accountNumber" VARCHAR(64);
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS account_title VARCHAR(255);
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS account_number VARCHAR(64);

-- 9. NOTIFY POSTGREST SCHEMA CACHE TO RELOAD IMMEDIATELY
NOTIFY pgrst, 'reload schema';
