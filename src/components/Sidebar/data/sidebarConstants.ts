import React from 'react';
import {
  LuHome,
  LuStore,
  LuLayers,
  LuShoppingCart,
  LuDollarSign,
  LuBox,
  LuArrowDownToLine,
  LuArrowUpFromLine,
  LuBookOpen,
  LuMonitor,
  LuSlidersHorizontal,
  LuBarChart3,
  LuFileText,
  LuSettings,
} from 'react-icons/lu';
import { getUrduText } from '../../../Context/LanguageContext';

export const getSidebarLabel = (label: string, isRTL: boolean) => {
  if (isRTL) {
    return getUrduText(label);
  }
  return label;
};

// Amal ERP style outline icon mapping for NHT Theme 2
export const getTheme2Icon = (item: any): React.ElementType | null => {
  const label = (item?.label || '').toLowerCase().trim();
  const path = (item?.path || '').toLowerCase().trim();

  // Dashboard (Amal: Home icon)
  if (label.includes('dashboard') || path.includes('dashboard')) {
    return LuHome;
  }
  // POS
  if (label.includes('point of sale') || label.includes('pos') || path.includes('/pos')) {
    return LuStore;
  }
  // Maintain / Accounts / Financials (Amal: Maintain stacked layers)
  if (label.includes('maintain') || label.includes('account') || path.includes('chart') || path.includes('account')) {
    return LuLayers;
  }
  // Purchases (Amal: Shopping cart)
  if (label.includes('purchase') || path.includes('purchase')) {
    return LuShoppingCart;
  }
  // Sales (Amal: Dollar sign)
  if (label.includes('sale') || path.includes('sale') || path.includes('invoice')) {
    return LuDollarSign;
  }
  // Store / Inventory / Products / Categories (Amal: Store 3D box)
  if (
    label.includes('store') ||
    label.includes('inventory') ||
    label.includes('product') ||
    label.includes('item') ||
    path.includes('product') ||
    path.includes('categories')
  ) {
    return LuBox;
  }
  // Receipts (Amal: Download tray)
  if (label.includes('receipt') || path.includes('receipt')) {
    return LuArrowDownToLine;
  }
  // Payments / Vouchers (Amal: Upload tray)
  if (label.includes('payment') || label.includes('voucher') || path.includes('voucher') || path.includes('payment')) {
    return LuArrowUpFromLine;
  }
  // Journal (Amal: Open book)
  if (label.includes('journal') || path.includes('journal')) {
    return LuBookOpen;
  }
  // Salary / Human Resources / Employees (Amal: Salary screen/monitor)
  if (
    label.includes('salary') ||
    label.includes('human resource') ||
    label.includes('hr') ||
    label.includes('employee') ||
    path.includes('human-resources') ||
    path.includes('employee')
  ) {
    return LuMonitor;
  }
  // Fixed Assets / Locations / Machinery / BOM (Amal: Sliders)
  if (
    label.includes('fixed asset') ||
    label.includes('location') ||
    label.includes('machinery') ||
    label.includes('manufacturing') ||
    label.includes('bom') ||
    path.includes('location') ||
    path.includes('manufacturing')
  ) {
    return LuSlidersHorizontal;
  }
  // Reports (Amal: Bar chart 3 bars)
  if (label.includes('report') || path.includes('report')) {
    return LuBarChart3;
  }
  // Quotations
  if (label.includes('quotation') || path.includes('quotation')) {
    return LuFileText;
  }
  // Settings / Administration (Amal: Gear/cog)
  if (label.includes('setting') || label.includes('administration') || path.includes('setting')) {
    return LuSettings;
  }

  return item?.icon || null;
};

export const NHT2_ACCOUNTS_CHILDREN = [
  { path: '/Registration/Chart-of-Account/List', label: 'Chart Of Account' },
  { path: '/Registration/Vouchers/List', label: 'Vouchers' },
  { path: '/Registration/Bank-Account/BankAccountList', label: 'Bank Account' },
  { path: '/Inventory/OpeningStock/List', label: 'Opening Stock' },
];

export interface SidebarReportSubChild {
  path: string;
  label: string;
  reportId?: string;
}

export interface SidebarReportCategory {
  path: string;
  label: string;
  categoryKey?: string;
  children: SidebarReportSubChild[];
}

export const NHT2_REPORTS_CHILDREN: SidebarReportCategory[] = [
  {
    path: '/Reports/Main-Reports?tab=profit-loss',
    label: 'Main Reports',
    categoryKey: 'main',
    children: [
      { path: '/Reports/Main-Reports?tab=profit-loss', label: 'Profit & Loss' },
      { path: '/Reports/Main-Reports?tab=daily-book', label: 'DailyBook (Roznamcha)' },
      { path: '/Reports/Main-Reports?tab=daily-activity', label: 'Daily Activity Log' },
    ],
  },
  {
    path: '/basic-account-report',
    label: 'Account Reports',
    categoryKey: 'accounts',
    children: [
      { path: '/basic-account-report', label: 'Basic Accounts Report', reportId: 'basic-account-report' },
    ],
  },
  {
    path: '/Reports/Sales-Report?tab=category-sales',
    label: 'Sale Reports',
    categoryKey: 'sales',
    children: [
      { path: '/basic-sales-report', label: 'Basic Sales Report', reportId: 'basic-sales-report' },
      { path: '/Reports/Sales-Report?tab=invoice', label: 'Sale Invoice Report', reportId: 'sale-inv-detail' },
      { path: '/Reports/Sales-Report?tab=category-sales', label: 'Category-Wise Sales', reportId: 'category-wise-sales' },
      { path: '/Reports/Sales-Report?tab=product-sales-history', label: 'Product Sales History', reportId: 'product-sales-history' },
      { path: '/Reports/Sales-Report?tab=sale', label: 'Commercial Sales (Salesman)', reportId: 'commercial-sale-ledger' },
      { path: '/Reports/Sales-Report?tab=sales-query', label: 'Parameter Register', reportId: 'sales-query-center' },
      { path: '/Reports/Sales-Report?tab=customer-sales', label: 'Customer Sales & Volume', reportId: 'customer-sales-breakdown' },
      { path: '/Reports/Sales-Report?tab=return', label: 'Sales Return & Credit', reportId: 'sales-return-ledger' },
    ],
  },
  {
    path: '/basic-purchase-report',
    label: 'Purchase Reports',
    categoryKey: 'purchases',
    children: [
      { path: '/basic-purchase-report', label: 'Basic Purchase Report', reportId: 'basic-purchase-report' },
    ],
  },
  {
    path: '/basic-stock-report',
    label: 'Stock Reports',
    categoryKey: 'inventory',
    children: [
      { path: '/basic-stock-report', label: 'Basic Stock Report', reportId: 'basic-stock-report' },
    ],
  },
];
