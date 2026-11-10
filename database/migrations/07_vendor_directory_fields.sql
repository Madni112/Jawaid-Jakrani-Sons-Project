-- Migration 07: Add vendor code and directory fields to vendors table
ALTER TABLE vendors 
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
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Also ensure financial_vouchers has account_title column for Opening Balance vouchers
ALTER TABLE financial_vouchers
  ADD COLUMN IF NOT EXISTS account_title VARCHAR(255);

-- Notify PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
