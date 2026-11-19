import {
  MdReceipt,
  MdTrendingUp,
  MdAssessment,
  MdLayers,
  MdPeople,
  MdLocalMall,
  MdBarChart,
  MdCorporateFare,
  MdInventory,
  MdPauseCircleFilled,
  MdStorefront,
  MdAccountBalanceWallet,
  MdAccountBalance,
  MdBalance,
  MdAccessTime,
  MdReceiptLong,
  MdCategory,
  MdTimeline,
  MdHistory,
  MdCompareArrows
} from 'react-icons/md';
import { ReportConfig } from '../types/dedicatedFilterTypes';

export const shouldShowBadge = (config: { badge?: string; badgeType?: string; createdAt?: string }): boolean => {
  if (!config.badge) return false;
  if (config.badgeType === 'new') {
    if (!config.createdAt) return false;
    const createdTime = new Date(config.createdAt).getTime();
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    return (now - createdTime) <= SEVEN_DAYS_MS && (now - createdTime) >= 0;
  }
  return true;
};

export const REPORT_REGISTRY: Record<string, ReportConfig> = {
  'category-wise-sales': {
    id: 'category-wise-sales',
    title: 'Category-Wise Sales Report',
    categoryName: 'Sales & Distribution',
    subtitle: 'Header-wise category sales audit, product lines, net volumes, return credits, and revenue share.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-20',
    icon: MdCategory,
    targetPrintPath: '/Reports/Sales-Report/Print',
    printType: 'category-sales',
    fields: ['parentCategory', 'subCategory', 'subSubCategory', 'product', 'customer', 'salesman', 'location', 'color']
  },
  'product-sales-history': {
    id: 'product-sales-history',
    title: 'Product Sales History Report',
    categoryName: 'Sales & Distribution',
    subtitle: 'Historical sales performance of products, market trends, units sold, returns, rates, and net revenue.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-19',
    icon: MdInventory,
    targetPrintPath: '/Reports/Sales-Report/Print',
    printType: 'product-sales-history',
    fields: ['product', 'customer', 'salesman', 'parentCategory', 'subCategory', 'brand', 'location', 'color']
  },
  'sale-inv-detail': {
    id: 'sale-inv-detail',
    title: 'Sales Invoice Detail Report',
    categoryName: 'Sales & Distribution',
    subtitle: 'Line-level itemization including product items, quantities, UOM, and unit prices.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-17',
    icon: MdReceipt,
    targetPrintPath: '/Reports/Sales-Report/Print',
    printType: 'invoice',
    fields: ['invoice', 'customer', 'location', 'parentCategory', 'subCategory', 'subSubCategory', 'brand', 'product', 'color']
  },
  'commercial-sale-ledger': {
    id: 'commercial-sale-ledger',
    title: 'Sale (Salesmen wise)',
    categoryName: 'Sales & Distribution',
    subtitle: 'Master commercial sales register linked with salesman, carrier fleet & customer accounts.',
    badge: 'AUDITED',
    badgeType: 'audited',
    icon: MdTrendingUp,
    targetPrintPath: '/Reports/Sales-Report/Print',
    printType: 'sale',
    fields: ['customer', 'salesman', 'transport', 'location', 'saleType', 'saleMethod']
  },
  'sales-query-center': {
    id: 'sales-query-center',
    title: 'Sales Filter & Parameter Builder',
    categoryName: 'Sales & Distribution',
    subtitle: 'Custom multi-criteria query builder by customer, salesman, date window & categories.',
    icon: MdAssessment,
    targetPrintPath: '/Reports/Sales-Report/Print',
    printType: 'sales-query',
    fields: ['customer', 'salesman', 'transport', 'parentCategory', 'subCategory', 'subSubCategory', 'product', 'brand', 'location', 'saleType', 'saleMethod', 'color']
  },
  'sales-return-ledger': {
    id: 'sales-return-ledger',
    title: 'Sales Return & Credit Ledger',
    categoryName: 'Sales & Distribution',
    subtitle: 'Chronological sales returns audit, credit adjustments, and restocked product logs.',
    icon: MdLayers,
    targetPrintPath: '/Reports/Sales-Report/Print',
    printType: 'return',
    fields: ['customer', 'salesman', 'transport', 'location', 'parentCategory', 'subCategory', 'subSubCategory', 'brand', 'product', 'color']
  },
  'customer-sales-breakdown': {
    id: 'customer-sales-breakdown',
    title: 'Customer Sales & Volume Analysis',
    categoryName: 'Sales & Distribution',
    subtitle: 'Customer order cycles, top purchasing accounts, and credit settlement statuses.',
    icon: MdPeople,
    targetPrintPath: '/Reports/Sales-Report/Print',
    printType: 'customer-sales',
    fields: ['customer', 'salesman', 'location', 'saleType']
  },
  'customer-loyalty-ledger': {
    id: 'customer-loyalty-ledger',
    title: 'Customer Financial Statement & Invoice Ledger',
    categoryName: 'Sales & Distribution',
    subtitle: 'Audited chronological statement tracking sales invoices, payments received & running net dues per customer in PKR.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-17',
    icon: MdReceiptLong,
    targetPrintPath: '/Reports/Sales-Report/Print',
    printType: 'loyalty',
    fields: ['customer', 'salesman']
  },

  // ── PURCHASES & PAYABLES ──
  'purchase-ledger': {
    id: 'purchase-ledger',
    title: 'Purchase Invoice Register',
    categoryName: 'Purchases & Payables',
    subtitle: 'Direct procurement entries and supplier bill liabilities categorized chronologically.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-17',
    icon: MdLocalMall,
    targetPrintPath: '/Reports/Purchase-Report/Print',
    printType: 'purchase',
    fields: ['supplier', 'location']
  },
  'category-purchases': {
    id: 'category-purchases',
    title: 'Category-Wise Purchases Report',
    categoryName: 'Purchases & Payables',
    subtitle: 'Header-wise category procurement spend, inward volume, return debits, and expenditure share.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    icon: MdCategory,
    targetPrintPath: '/Reports/Purchase-Report/Print',
    printType: 'category-purchases',
    fields: ['parentCategory', 'subCategory', 'subSubCategory', 'product', 'brand', 'supplier', 'color']
  },
  'product-purchase-history': {
    id: 'product-purchase-history',
    title: 'Product Purchase History & Price Trend Report',
    categoryName: 'Purchases & Payables',
    subtitle: 'Historical inward procurement trends, purchase cost variations over time, batch quantities, and supplier pricing logs.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    icon: MdInventory,
    targetPrintPath: '/Reports/Purchase-Report/Print',
    printType: 'product-purchase-history',
    fields: ['parentCategory', 'subCategory', 'subSubCategory', 'product', 'brand', 'supplier', 'location', 'color']
  },
  'purchase-invoice-detail': {
    id: 'purchase-invoice-detail',
    title: 'Purchase Invoice Itemized Detail Report',
    categoryName: 'Purchases & Payables',
    subtitle: 'Line-by-line itemized purchase bill audit including product SKUs, inward quantities, UOM, and unit costs.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    icon: MdReceiptLong,
    targetPrintPath: '/Reports/Purchase-Report/Print',
    printType: 'purchase-invoice-detail',
    fields: ['invoice', 'supplier', 'location', 'parentCategory', 'subCategory', 'subSubCategory', 'brand', 'product', 'color']
  },
  'purchase-query-center': {
    id: 'purchase-query-center',
    title: 'Purchase Parameter Builder',
    categoryName: 'Purchases & Payables',
    subtitle: 'Filter vendor inward purchases across date brackets, warehouse destinations and payment terms.',
    icon: MdBarChart,
    targetPrintPath: '/Reports/Purchase-Report/Print',
    printType: 'purchase-query',
    fields: ['supplier', 'location', 'parentCategory', 'subCategory', 'subSubCategory', 'brand', 'product', 'color']
  },
  'vendor-return-ledger': {
    id: 'vendor-return-ledger',
    title: 'Purchase Returns & Debit Ledger',
    categoryName: 'Purchases & Payables',
    subtitle: 'Outgoing debit adjustments for damaged or returned supplier merchandise.',
    icon: MdCorporateFare,
    targetPrintPath: '/Reports/Purchase-Report/Print',
    printType: 'return',
    fields: ['supplier', 'location', 'parentCategory', 'subCategory', 'subSubCategory', 'brand', 'product', 'color']
  },

  // ── INVENTORY & STOCK ──
  'stock-activity-ledger': {
    id: 'stock-activity-ledger',
    title: 'Stock Activity & Movement Ledger',
    categoryName: 'Inventory & Warehouses',
    subtitle: 'Chronological inventory trail auditing opening balances, inward procurement receipts, sales issues, net movements, and closing stock.',
    badge: 'AUDITED',
    badgeType: 'audited',
    icon: MdTimeline,
    targetPrintPath: '/Reports/Stock-Report/Print',
    printType: 'stock',
    tab: 1,
    fields: ['location', 'parentCategory', 'subCategory', 'subSubCategory', 'brand', 'product', 'color']
  },
  'current-stock-balance': {
    id: 'current-stock-balance',
    title: 'Stock Balances & Valuation Registry',
    categoryName: 'Inventory & Warehouses',
    subtitle: 'Real-time SKU quantities on hand, warehouse allocations, and unit asset valuations.',
    badge: 'AUDITED',
    badgeType: 'audited',
    icon: MdInventory,
    targetPrintPath: '/Reports/Stock-Report/Print',
    printType: 'stock',
    tab: 2,
    hideDateFilter: true,
    fields: ['location', 'parentCategory', 'subCategory', 'subSubCategory', 'brand', 'product', 'color']
  },
  'as-of-date-stock-status': {
    id: 'as-of-date-stock-status',
    title: 'As-Of-Date Stock Status Report',
    categoryName: 'Inventory & Warehouses',
    subtitle: 'Historical inventory snapshot and asset quantities evaluated as of any past cutoff date.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    icon: MdHistory,
    targetPrintPath: '/Reports/Stock-Report/Print',
    printType: 'stock',
    tab: 3,
    singleDateFilter: true,
    fields: ['location', 'parentCategory', 'subCategory', 'subSubCategory', 'brand', 'product', 'color']
  },
  'inter-warehouse-transfers': {
    id: 'inter-warehouse-transfers',
    title: 'Inter-Warehouse Transfer Statement',
    categoryName: 'Inventory & Warehouses',
    subtitle: 'Internal stock movements and transfer audits between Shop Counter, Main Warehouse, and Godowns.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    icon: MdCompareArrows,
    targetPrintPath: '/Reports/Stock-Report/Print',
    printType: 'stock',
    tab: 4,
    fields: ['location', 'parentCategory', 'subCategory', 'subSubCategory', 'brand', 'product', 'salesman', 'color']
  },
  'category-wise-stock': {
    id: 'category-wise-stock',
    title: 'Category-Wise Stock Valuation Ledger',
    categoryName: 'Inventory & Warehouses',
    subtitle: 'Structured 3-tier category valuation (Parent Category, Sub-Category, Category) and value tier filters.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    icon: MdCategory,
    targetPrintPath: '/Reports/Stock-Report/Print',
    printType: 'stock',
    tab: 7,
    hideDateFilter: true,
    fields: ['parentCategory', 'subCategory', 'subSubCategory', 'brand', 'product', 'color']
  },
  'warehouse-location-report': {
    id: 'warehouse-location-report',
    title: 'Warehouse Bin & Location Stock Breakdown',
    categoryName: 'Inventory & Warehouses',
    subtitle: 'Product distribution audit broken down across Shop Counter vs Main Warehouse vs Godowns.',
    badge: 'AUDITED',
    badgeType: 'audited',
    icon: MdStorefront,
    targetPrintPath: '/Reports/Stock-Report/Print',
    printType: 'stock',
    tab: 8,
    singleDateFilter: true,
    fields: ['location', 'brand', 'product', 'color']
  },
  'holding-stock-report': {
    id: 'holding-stock-report',
    title: 'Holding Stock & Gatepass Queue',
    categoryName: 'Inventory & Warehouses',
    subtitle: 'Reserved quantities allocated on approved delivery challans pending physical dispatch.',
    badge: 'AUDITED',
    badgeType: 'audited',
    icon: MdPauseCircleFilled,
    targetPrintPath: '/Reports/Holding-Report/Print',
    printType: 'holding',
    fields: ['location', 'customer']
  },

  // ── ACCOUNTS & FINANCIALS ──
  'customer-balance-detail': {
    id: 'customer-balance-detail',
    title: 'Customer Balance Detail Report',
    categoryName: 'Accounts & Financials',
    subtitle: 'Comprehensive breakdown of customer opening balances, period billing debits, recovery credits, and net closing balances filtered by customer category.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-18',
    icon: MdAccountBalanceWallet,
    targetPrintPath: '/Reports/Account-Report/Print',
    printType: 'account',
    tab: 13,
    fields: ['city', 'area', 'customerCategory', 'customer']
  },
  'vendor-balance-detail': {
    id: 'vendor-balance-detail',
    title: 'Vendor Balance Detail & Account Ledger',
    categoryName: 'Accounts & Financials',
    subtitle: 'Comprehensive breakdown of vendor opening balances, period procurement liabilities, supplier payments, and net payables.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-18',
    icon: MdAccountBalanceWallet,
    targetPrintPath: '/Reports/Account-Report/Print',
    printType: 'account',
    tab: 3,
    fields: ['supplier']
  },
  'customer-ledger': {
    id: 'customer-ledger',
    title: 'Customer Account Ledger (General Ledger)',
    categoryName: 'Accounts & Financials',
    subtitle: 'Detailed chronological debit/credit ledger per customer account with running balance and sales invoices.',
    badge: 'ACCRUAL',
    badgeType: 'accrual',
    icon: MdAccountBalanceWallet,
    targetPrintPath: '/Reports/Account-Report/Print',
    printType: 'account',
    tab: 1,
    fields: ['city', 'area', 'customer']
  },
  'customer-vendor-ledger': {
    id: 'customer-vendor-ledger',
    title: 'Customer Account Ledger (General Ledger)',
    categoryName: 'Accounts & Financials',
    subtitle: 'Detailed chronological debit/credit ledger per customer account with running balance and sales invoices.',
    badge: 'ACCRUAL',
    badgeType: 'accrual',
    icon: MdAccountBalanceWallet,
    targetPrintPath: '/Reports/Account-Report/Print',
    printType: 'account',
    tab: 1,
    fields: ['city', 'area', 'customer']
  },
  'daybook-activity-report': {
    id: 'daybook-activity-report',
    title: 'Daily Cash & Bank Daybook',
    categoryName: 'Accounts & Financials',
    subtitle: 'Chronological daybook of daily cash inflows, customer receipts, vendor payments, and cash-drawer balances.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-19',
    icon: MdReceiptLong,
    targetPrintPath: '/Reports/Account-Report/Print',
    printType: 'account',
    tab: 9,
    singleDateFilter: true,
    fields: ['location']
  },
  'customer-aging-report': {
    id: 'customer-aging-report',
    title: 'Customer Receivables Aging Analysis',
    categoryName: 'Accounts & Financials',
    subtitle: 'Categorized customer debt aging brackets across 0-30, 31-60, 61-90, and 90+ days overdue balances.',
    badge: 'AUDITED',
    badgeType: 'audited',
    icon: MdAccessTime,
    targetPrintPath: '/Reports/Account-Report/Print',
    printType: 'account',
    tab: 12,
    hideDateFilter: true,
    fields: ['customerCategory', 'customer']
  },
  'voucher-audit-register': {
    id: 'voucher-audit-register',
    title: 'Financial Voucher Audit Register',
    categoryName: 'Accounts & Financials',
    subtitle: 'Master chronological register of CPV, CRV, BPV, BRV, and Journal Vouchers (JV) with debit/credit balance trace.',
    icon: MdReceipt,
    targetPrintPath: '/Reports/Account-Report/Print',
    printType: 'account',
    tab: 8,
    fields: ['voucherType']
  },
  'trial-balance-statement': {
    id: 'trial-balance-statement',
    title: 'Trial Balance Audit Statement',
    categoryName: 'Accounts & Financials',
    subtitle: 'Authoritative Chart of Accounts trial balance verifying that total ledger debits equal total ledger credits.',
    badge: 'AUDITED',
    badgeType: 'audited',
    icon: MdBalance,
    targetPrintPath: '/Reports/Account-Report/Print',
    printType: 'account',
    tab: 11,
    hideDateFilter: true,
    fields: []
  },
  'vendor-outstanding-report': {
    id: 'vendor-outstanding-report',
    title: 'Vendor Outstanding Payables Schedule',
    categoryName: 'Accounts & Financials',
    subtitle: 'Unsettled supplier procurement bills and payment dues sorted by vendor account and invoice date.',
    icon: MdCorporateFare,
    targetPrintPath: '/Reports/Account-Report/Print',
    printType: 'account',
    tab: 6,
    fields: ['supplier']
  },
  'expense-ledger': {
    id: 'expense-ledger',
    title: 'Operational Expense Statement',
    categoryName: 'Accounts & Financials',
    subtitle: 'Operating expenditures aggregated across rent, utilities, fuel, and logistics fleets.',
    icon: MdAccountBalance,
    targetPrintPath: '/Reports/Account-Report/Print',
    printType: 'expense',
    tab: 4,
    fields: ['parentCategory', 'location']
  },

  // ── BUSINESS OVERVIEW ──
  'balance-sheet-stat': {
    id: 'balance-sheet-stat',
    title: 'Balance Sheet Financial Statement',
    categoryName: 'Business Overview',
    subtitle: 'Authoritative audit sheet of total assets, liabilities, and owners equity balances.',
    badge: 'AUDITED',
    badgeType: 'audited',
    icon: MdBalance,
    targetPrintPath: '/Reports/Balance-Sheet',
    printType: 'balance_sheet',
    fields: ['location']
  },
  'executive-summary-report': {
    id: 'executive-summary-report',
    title: 'Commercial Executive Summary',
    categoryName: 'Business Overview',
    subtitle: 'High-level financial KPIs, sales vs purchase revenue trajectories, and liquid cash flows.',
    icon: MdTrendingUp,
    targetPrintPath: '/Reports/Balance-Sheet',
    printType: 'summary',
    fields: ['location']
  }
};
