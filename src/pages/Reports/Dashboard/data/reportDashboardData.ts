import {
  MdTrendingUp,
  MdReceipt,
  MdBarChart,
  MdLocalMall,
  MdInventory,
  MdPauseCircleFilled,
  MdAccountBalanceWallet,
  MdAccountBalance,
  MdBalance,
  MdAssessment,
  MdLayers,
  MdPeople,
  MdStorefront,
  MdCategory,
  MdCorporateFare,
  MdCardGiftcard,
  MdReceiptLong,
  MdTimeline,
  MdHistory,
  MdCompareArrows,
  MdPriceCheck,
  MdFormatListBulleted,
  MdAccessTime
} from 'react-icons/md';
import { ReportItem, CategoryMeta } from '../types/reportDashboardTypes';


export const shouldShowBadge = (report: { badge?: string; badgeType?: string; createdAt?: string }): boolean => {
  if (!report.badge) return false;
  if (report.badgeType === 'new') {
    if (!report.createdAt) return true;
    const createdTime = new Date(report.createdAt).getTime();
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    return Math.abs(now - createdTime) <= THIRTY_DAYS_MS;
  }
  return true;
};

export const ALL_REPORTS: ReportItem[] = [
  // ── SALES REPORTS ──
  {
    id: 'category-wise-sales',
    title: 'Category-Wise Sales & Volume Report',
    category: 'sales',
    description: 'Header-wise category sales audit, product lines, net volumes, return credits, and revenue share.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-20',
    path: '/Reports/Sales-Report',
    state: { reportType: 'category-sales' },
    icon: MdCategory
  },
  {
    id: 'product-sales-history',
    title: 'Product Sales History Report',
    category: 'sales',
    description: 'Historical sales performance of products, market trends, units sold, returns, rates, and net revenue.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-19',
    path: '/Reports/Sales-Report',
    state: { reportType: 'product-sales-history' },
    icon: MdInventory
  },
  {
    id: 'sale-inv-detail',
    title: 'Sales Invoice Detail Report',
    category: 'sales',
    description: 'Line-level itemization including product items, quantities, UOM, and unit prices.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-17',
    path: '/Reports/Sales-Report',
    state: { reportType: 'invoice' },
    icon: MdReceipt
  },
  {
    id: 'commercial-sale-ledger',
    title: 'Commercial Sales Audit Ledger',
    category: 'sales',
    description: 'Master commercial sales register linked with salesman, carrier fleet & customer accounts.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Sales-Report',
    state: { reportType: 'sale' },
    icon: MdTrendingUp
  },
  {
    id: 'sales-query-center',
    title: 'Sales Filter & Parameter Builder',
    category: 'sales',
    description: 'Custom multi-criteria query builder by customer, salesman, date window & categories.',
    path: '/Reports/Sales-Report',
    state: { reportType: 'sales-query' },
    icon: MdAssessment
  },
  {
    id: 'sales-return-ledger',
    title: 'Sales Return & Credit Ledger',
    category: 'sales',
    description: 'Chronological sales returns audit, credit adjustments, and restocked product logs.',
    path: '/Reports/Sales-Report',
    state: { reportType: 'return' },
    icon: MdLayers
  },
  {
    id: 'customer-sales-breakdown',
    title: 'Customer Sales & Volume Analysis',
    category: 'sales',
    description: 'Customer order cycles, top purchasing accounts, and credit settlement statuses.',
    path: '/Reports/Sales-Report',
    state: { reportType: 'customer-sales' },
    icon: MdPeople
  },
  {
    id: 'customer-loyalty-ledger',
    title: 'Customer Financial Statement & Invoice Ledger',
    category: 'sales',
    description: 'Audited chronological statement tracking sales invoices, cash settlements, and running net receivable balances per customer in PKR.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-17',
    path: '/Reports/Sales-Report',
    state: { reportType: 'loyalty' },
    icon: MdReceiptLong
  },

  // ── PURCHASES & PAYABLES ──
  {
    id: 'purchase-ledger',
    title: 'Purchase Invoice Register',
    category: 'purchases',
    description: 'Direct procurement entries and supplier bill liabilities categorized chronologically.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-17',
    path: '/Reports/Purchase-Report',
    state: { reportType: 'purchase' },
    icon: MdLocalMall
  },
  {
    id: 'category-purchases',
    title: 'Category-Wise Purchases & Volume Report',
    category: 'purchases',
    description: 'Header-wise category procurement spend, inward volume, return debits, and expenditure share.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    path: '/Reports/Purchase-Report',
    state: { reportType: 'category-purchases' },
    icon: MdCategory
  },
  {
    id: 'product-purchase-history',
    title: 'Product Purchase History & Price Trend',
    category: 'purchases',
    description: 'Historical inward procurement trends, purchase cost variations over time, batch quantities, and supplier pricing logs.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    path: '/Reports/Purchase-Report',
    state: { reportType: 'product-purchase-history' },
    icon: MdInventory
  },
  {
    id: 'purchase-invoice-detail',
    title: 'Purchase Invoice Detail Report',
    category: 'purchases',
    description: 'Line-level itemization including product items, inward quantities, UOM, and unit purchase prices.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    path: '/Reports/Purchase-Report',
    state: { reportType: 'purchase-invoice-detail' },
    icon: MdReceiptLong
  },
  {
    id: 'purchase-query-center',
    title: 'Purchase Parameter Builder',
    category: 'purchases',
    description: 'Filter vendor inward purchases across date brackets, warehouse destinations and payment terms.',
    path: '/Reports/Purchase-Report',
    state: { reportType: 'purchase-query' },
    icon: MdBarChart
  },
  {
    id: 'vendor-return-ledger',
    title: 'Purchase Returns & Debit Ledger',
    category: 'purchases',
    description: 'Outgoing debit adjustments for damaged or returned supplier merchandise.',
    path: '/Reports/Purchase-Report',
    state: { reportType: 'return' },
    icon: MdCorporateFare
  },
  {
    id: 'vendor-balance-detail',
    title: 'Vendor Balance Detail & Account Ledger',
    category: 'purchases',
    description: 'Comprehensive breakdown of vendor opening balances, period procurement liabilities, supplier payments, and net payables.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-18',
    path: '/Reports/Account-Report',
    state: { activeTab: 3 },
    icon: MdAccountBalanceWallet
  },
  {
    id: 'vendor-outstanding-report',
    title: 'Vendor Outstanding Payables Schedule',
    category: 'purchases',
    description: 'Unsettled supplier procurement bills and payment dues sorted by vendor account and invoice date.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Account-Report',
    state: { activeTab: 6 },
    icon: MdCorporateFare
  },

  // ── INVENTORY & WAREHOUSES ──
  {
    id: 'stock-activity-ledger',
    title: 'Stock Activity & Movement Ledger',
    category: 'inventory',
    description: 'Chronological inventory trail auditing opening balances, inward procurement receipts, sales issues, net movements, and closing stock.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Stock-Report',
    state: { activeTab: 1 },
    icon: MdTimeline
  },
  {
    id: 'current-stock-balance',
    title: 'Stock Balances & Valuation Registry',
    category: 'inventory',
    description: 'Real-time SKU quantities on hand, warehouse allocations, and unit asset valuations.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Stock-Report',
    state: { activeTab: 2 },
    icon: MdInventory
  },
  {
    id: 'as-of-date-stock-status',
    title: 'As-Of-Date Stock Status Report',
    category: 'inventory',
    description: 'Historical inventory snapshot and asset quantities evaluated as of any past cutoff date.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    path: '/Reports/Stock-Report',
    state: { activeTab: 3 },
    icon: MdHistory
  },
  {
    id: 'inter-warehouse-transfers',
    title: 'Inter-Warehouse Transfer Statement',
    category: 'inventory',
    description: 'Internal stock movements and transfer audits between Shop Counter, Main Warehouse, and Godowns.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    path: '/Reports/Stock-Report',
    state: { activeTab: 4 },
    icon: MdCompareArrows
  },
  {
    id: 'category-wise-stock',
    title: 'Category-Wise Stock Valuation Ledger',
    category: 'inventory',
    description: 'Structured 3-tier category valuation (Parent Category, Sub-Category, Category) and value tier filters.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-22',
    path: '/Reports/Stock-Report',
    state: { activeTab: 7 },
    icon: MdCategory
  },
  {
    id: 'warehouse-location-report',
    title: 'Warehouse Bin & Location Stock Breakdown',
    category: 'inventory',
    description: 'Product distribution audit broken down across Shop Counter vs Main Warehouse vs Godowns.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Stock-Report',
    state: { activeTab: 8 },
    icon: MdStorefront
  },
  {
    id: 'holding-stock-report',
    title: 'Holding Stock & Gatepass Queue',
    category: 'inventory',
    description: 'Reserved quantities allocated on approved delivery challans pending physical dispatch.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Holding-Report',
    state: {},
    icon: MdPauseCircleFilled
  },

  // ── ACCOUNTS & FINANCIALS ──
  {
    id: 'customer-balance-detail',
    title: 'Customer Balance Detail Report',
    category: 'accounts',
    description: 'Comprehensive breakdown of customer opening balances, period billing debits, recovery credits, and net closing balances filtered by customer category.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-18',
    path: '/Reports/Account-Report',
    state: { activeTab: 13 },
    icon: MdAccountBalanceWallet
  },
  {
    id: 'vendor-balance-detail',
    title: 'Vendor Balance Detail & Account Ledger',
    category: 'accounts',
    description: 'Comprehensive breakdown of vendor opening balances, period procurement liabilities, supplier payments, and net payables.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-18',
    path: '/Reports/Account-Report',
    state: { activeTab: 3 },
    icon: MdAccountBalanceWallet
  },
  {
    id: 'customer-ledger',
    title: 'Customer Account Ledger (General Ledger)',
    category: 'accounts',
    description: 'Detailed chronological debit/credit ledger per customer account with running balances and invoices.',
    badge: 'ACCRUAL',
    badgeType: 'accrual',
    path: '/Reports/Account-Report',
    state: { activeTab: 1 },
    icon: MdAccountBalanceWallet
  },
  {
    id: 'daybook-activity-report',
    title: 'Daily Cash & Bank Daybook',
    category: 'accounts',
    description: 'Chronological daybook of daily cash inflows, customer receipts, vendor payments, and cash-drawer balances.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-19',
    path: '/Reports/Account-Report',
    state: { activeTab: 9 },
    icon: MdReceiptLong
  },
  {
    id: 'customer-aging-report',
    title: 'Customer Receivables Aging Analysis',
    category: 'accounts',
    description: 'Categorized customer debt aging brackets across 0-30, 31-60, 61-90, and 90+ days overdue balances.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Account-Report',
    state: { activeTab: 12 },
    icon: MdAccessTime
  },
  {
    id: 'voucher-audit-register',
    title: 'Financial Voucher Audit Register',
    category: 'accounts',
    description: 'Master chronological register of CPV, CRV, BPV, BRV, and Journal Vouchers (JV) with debit/credit balance trace.',
    path: '/Reports/Account-Report',
    state: { activeTab: 8 },
    icon: MdReceipt
  },
  {
    id: 'trial-balance-statement',
    title: 'Trial Balance Audit Statement',
    category: 'accounts',
    description: 'Authoritative Chart of Accounts trial balance verifying that total ledger debits equal total ledger credits.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Account-Report',
    state: { activeTab: 11 },
    icon: MdBalance
  },
  {
    id: 'vendor-outstanding-report',
    title: 'Vendor Outstanding Payables Schedule',
    category: 'accounts',
    description: 'Unsettled supplier procurement bills and payment dues sorted by vendor account and invoice date.',
    path: '/Reports/Account-Report',
    state: { activeTab: 6 },
    icon: MdCorporateFare
  },
  {
    id: 'expense-ledger',
    title: 'Operational Expense Statement',
    category: 'accounts',
    description: 'Operating expenditures aggregated across rent, utilities, fuel, and logistics fleets.',
    path: '/Reports/Account-Report',
    state: { activeTab: 4 },
    icon: MdAccountBalance
  },

  // ── BUSINESS OVERVIEW & EXECUTIVE ──
  {
    id: 'balance-sheet-stat',
    title: 'Balance Sheet Financial Statement',
    category: 'business',
    description: 'Authoritative audit sheet of total assets, liabilities, and owners equity balances.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Balance-Sheet',
    icon: MdBalance
  },
  {
    id: 'executive-summary-report',
    title: 'Commercial Executive Summary',
    category: 'business',
    description: 'High-level financial KPIs, sales vs purchase revenue trajectories, and liquid cash flows.',
    path: '/Reports/Balance-Sheet',
    icon: MdTrendingUp
  }
];

export const CATEGORY_META: CategoryMeta[] = [
  {
    key: 'sales',
    title: 'Sales Reports',
    subtitle: 'Receivables, order cycles & customer ledger metrics',
    icon: MdTrendingUp,
    color: 'emerald'
  },
  {
    key: 'purchases',
    title: 'Purchases & Payables',
    subtitle: 'Vendor commitments, disbursement runs & AP schedules',
    icon: MdLocalMall,
    color: 'blue'
  },
  {
    key: 'inventory',
    title: 'Inventory & Stock',
    subtitle: 'Real-time valuation, physical counts & dispatch queues',
    icon: MdInventory,
    color: 'amber'
  },
  {
    key: 'accounts',
    title: 'Accounts & Financials',
    subtitle: 'General ledgers, cash daybooks, receivable aging & financial statements',
    icon: MdAccountBalanceWallet,
    color: 'purple'
  },
  {
    key: 'business',
    title: 'Business Overview',
    subtitle: 'Executive statements, P&L balance & audit traces',
    icon: MdBalance,
    color: 'teal'
  }
];

export const STORAGE_KEY = 'erp_reports_custom_order';
export const STORAGE_CAT_KEY = 'erp_reports_category_order';

export const getInitialReports = (): ReportItem[] => {
  try {
    const savedOrderJson = localStorage.getItem(STORAGE_KEY);
    if (!savedOrderJson) return ALL_REPORTS;
    const savedIds: string[] = JSON.parse(savedOrderJson);
    if (!Array.isArray(savedIds)) return ALL_REPORTS;

    const reportMap = new Map(ALL_REPORTS.map((r) => [r.id, r]));
    const ordered: ReportItem[] = [];
    savedIds.forEach((id) => {
      const item = reportMap.get(id);
      if (item) {
        ordered.push(item);
        reportMap.delete(id);
      }
    });
    reportMap.forEach((item) => ordered.push(item));
    return ordered;
  } catch (e) {
    return ALL_REPORTS;
  }
};

export const getInitialCategories = () => {
  try {
    const saved = localStorage.getItem(STORAGE_CAT_KEY);
    if (!saved) return CATEGORY_META;
    const savedKeys: string[] = JSON.parse(saved);
    if (!Array.isArray(savedKeys)) return CATEGORY_META;

    const catMap = new Map(CATEGORY_META.map((c) => [c.key, c]));
    const ordered: typeof CATEGORY_META = [];
    savedKeys.forEach((key) => {
      const item = catMap.get(key);
      if (item) {
        ordered.push(item);
        catMap.delete(key);
      }
    });
    catMap.forEach((item) => ordered.push(item));
    return ordered;
  } catch (e) {
    return CATEGORY_META;
  }
};