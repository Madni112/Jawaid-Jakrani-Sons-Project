import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MdVisibility,
  MdVisibilityOff,
  MdTune,
  MdSearch,
  MdRestartAlt,
  MdCheckCircle,
  MdWarning,
  MdLayers,
  MdPrint,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdWrapText,
  MdColorLens,
  MdAdd,
  MdDelete,
  MdZoomIn,
  MdZoomOut,
  MdClose,
  MdAccountBalanceWallet,
  MdTrendingUp,
  MdLocalMall,
  MdInventory,
  MdBalance,
  MdSave,
  MdPeople,
  MdLock,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdCheck,
  MdBorderAll,
  MdBorderHorizontal,
  MdBorderVertical,
  MdBorderOuter,
  MdBorderClear,
  MdBorderBottom,
  MdDescription,
  MdPalette,
  MdReceiptLong,
  MdAutoFixHigh,
  MdShare,
  MdBrandingWatermark,
  MdBusiness,
  MdAttachMoney,
  MdViewAgenda,
  MdMenuBook,
  MdGridOn,
  MdAutoAwesome,
  MdCompress,
  MdArticle,
  MdCropLandscape
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../Context/Auth';
import {
  SystemMasterConfig,
  saveSystemMasterConfig,
  canUserManageReports,
  DEFAULT_SYSTEM_CONFIG,
  ReportLayoutPreset,
  ReportCustomLayoutConfig,
  ColumnCustomStyle,
  DesignThemeKey,
  PaperSizeKey,
  FontFamilyKey,
  TableBorderSettings
} from '../../../utils/systemPermissions';
import { ALL_REPORTS, CATEGORY_META, BASIC_REPORTS, BASIC_REPORT_IDS } from '../../Reports/Dashboard/data/reportDashboardData';

interface ReportVisibilityTabProps {
  userEmail?: string | null;
  role?: string;
  systemConfig?: SystemMasterConfig | null;
  isRTL?: boolean;
}

// ── DEFAULT COLUMN SCHEMAS PER REPORT TYPE ──
const getDefaultColumnsForReport = (reportId: string): ColumnCustomStyle[] => {
  switch (reportId) {
    case 'customer-ledger':
      return [
        { key: 'date', label: 'Date', visible: true, widthPercent: 14, align: 'center', wrapText: false },
        { key: 'ref', label: 'Voucher #', visible: true, widthPercent: 14, align: 'center' },
        { key: 'narrative', label: 'Particulars', visible: true, widthPercent: 26, align: 'left', wrapText: true },
        { key: 'debit', label: 'Debit (Dr)', visible: true, widthPercent: 15, align: 'right', wrapText: false },
        { key: 'credit', label: 'Credit (Cr)', visible: true, widthPercent: 15, align: 'right', wrapText: false },
        { key: 'balance', label: 'Balance', visible: true, widthPercent: 16, align: 'right', wrapText: false }
      ];
    case 'vendor-ledger':
      return [
        { key: 'date', label: 'Date', visible: true, widthPercent: 14, align: 'center', wrapText: false },
        { key: 'ref', label: 'Bill / Ref #', visible: true, widthPercent: 14, align: 'center' },
        { key: 'narrative', label: 'Particulars', visible: true, widthPercent: 26, align: 'left', wrapText: true },
        { key: 'bill_amount', label: 'Bill Amount', visible: true, widthPercent: 15, align: 'right', wrapText: false },
        { key: 'paid', label: 'Paid (Debit)', visible: true, widthPercent: 15, align: 'right', wrapText: false },
        { key: 'balance', label: 'Net Payable', visible: true, widthPercent: 16, align: 'right', wrapText: false }
      ];
    case 'combined-ledger':
      return [
        { key: 'sno', label: 'S#', visible: true, widthPercent: 6, align: 'center' },
        { key: 'party_name', label: 'Party Account Name', visible: true, widthPercent: 30, align: 'left' },
        { key: 'type', label: 'Account Type', visible: true, widthPercent: 14, align: 'center' },
        { key: 'opening', label: 'Opening Balance', visible: true, widthPercent: 16, align: 'right', wrapText: false },
        { key: 'debit', label: 'Total Debit', visible: true, widthPercent: 16, align: 'right', wrapText: false },
        { key: 'closing', label: 'Net Closing', visible: true, widthPercent: 18, align: 'right', wrapText: false }
      ];
    case 'profit-loss':
      return [
        { key: 'item', label: 'Line Item Account', visible: true, widthPercent: 44, align: 'left' },
        { key: 'category', label: 'Classification', visible: true, widthPercent: 24, align: 'left' },
        { key: 'amount', label: 'Amount (PKR)', visible: true, widthPercent: 32, align: 'right', wrapText: false }
      ];
    case 'expense-report':
      return [
        { key: 'date', label: 'Date', visible: true, widthPercent: 14, align: 'center', wrapText: false },
        { key: 'voucher', label: 'Voucher #', visible: true, widthPercent: 14, align: 'center' },
        { key: 'category', label: 'Expense Category', visible: true, widthPercent: 22, align: 'left' },
        { key: 'description', label: 'Description / Purpose', visible: true, widthPercent: 28, align: 'left', wrapText: true },
        { key: 'amount', label: 'Amount (PKR)', visible: true, widthPercent: 22, align: 'right', wrapText: false }
      ];
    case 'daily-book':
      return [
        { key: 'time', label: 'Time / Ref', visible: true, widthPercent: 14, align: 'center', wrapText: false },
        { key: 'account', label: 'Account / Party', visible: true, widthPercent: 26, align: 'left' },
        { key: 'narrative', label: 'Particulars', visible: true, widthPercent: 26, align: 'left', wrapText: true },
        { key: 'mode', label: 'Mode', visible: true, widthPercent: 12, align: 'center' },
        { key: 'cash_in', label: 'Cash In', visible: true, widthPercent: 11, align: 'right', wrapText: false },
        { key: 'cash_out', label: 'Cash Out', visible: true, widthPercent: 11, align: 'right', wrapText: false }
      ];
    case 'daily-activity':
      return [
        { key: 'sno', label: 'S#', visible: true, widthPercent: 5, align: 'center' },
        { key: 'time', label: 'Time', visible: true, widthPercent: 12, align: 'center', wrapText: false },
        { key: 'event_type', label: 'Activity Type', visible: true, widthPercent: 16, align: 'left' },
        { key: 'ref', label: 'Reference #', visible: true, widthPercent: 14, align: 'center' },
        { key: 'party', label: 'Party / Account', visible: true, widthPercent: 20, align: 'left' },
        { key: 'narrative', label: 'Narrative Detail', visible: true, widthPercent: 19, align: 'left', wrapText: true },
        { key: 'value', label: 'Net Value', visible: true, widthPercent: 14, align: 'right', wrapText: false }
      ];
    default:
      return [
        { key: 'sno', label: 'S#', visible: true, widthPercent: 6, align: 'center' },
        { key: 'date', label: 'Date', visible: true, widthPercent: 14, align: 'center', wrapText: false },
        { key: 'ref', label: 'Document #', visible: true, widthPercent: 16, align: 'center' },
        { key: 'description', label: 'Item / Account Description', visible: true, widthPercent: 32, align: 'left', wrapText: true },
        { key: 'qty', label: 'Quantity', visible: true, widthPercent: 14, align: 'center' },
        { key: 'amount', label: 'Net Total (PKR)', visible: true, widthPercent: 18, align: 'right', wrapText: false }
      ];
  }
};

const EXTRA_ADDABLE_COLUMNS = [
  { key: 'tax_amount', label: 'Sales Tax / GST', defaultAlign: 'right', defaultWidth: 12 },
  { key: 'discount_amount', label: 'Discount (PKR)', defaultAlign: 'right', defaultWidth: 12 },
  { key: 'salesman', label: 'Salesman / Officer', defaultAlign: 'left', defaultWidth: 16 },
  { key: 'location', label: 'Warehouse / Branch', defaultAlign: 'left', defaultWidth: 15 },
  { key: 'payment_status', label: 'Payment Status', defaultAlign: 'center', defaultWidth: 12 },
  { key: 'customer_city', label: 'City / Region', defaultAlign: 'left', defaultWidth: 14 },
  { key: 'batch_no', label: 'Batch / Lot #', defaultAlign: 'center', defaultWidth: 14 },
  { key: 'remarks', label: 'Auditor Remarks', defaultAlign: 'left', defaultWidth: 20 }
];

const PRESET_DESIGN_THEMES: {
  key: DesignThemeKey;
  label: string;
  desc: string;
  icon: any;
  colorClass: string;
  bgClass: string;
}[] = [
  {
    key: 'modern-striped',
    label: 'Modern Striped',
    desc: 'Alternating clean zebra rows with crisp border accents',
    icon: MdViewAgenda,
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800'
  },
  {
    key: 'classic-ledger',
    label: 'Classic Ledger',
    desc: 'Traditional double-ruled accounting book with formal stamps',
    icon: MdMenuBook,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
  },
  {
    key: 'corporate-grid',
    label: 'Corporate Grid',
    desc: 'Full high-contrast bordered gridlines, Excel-style presentation',
    icon: MdGridOn,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800'
  },
  {
    key: 'minimal-clean',
    label: 'Minimal Clean',
    desc: 'Airy borderless rows with generous whitespace and clear spacing',
    icon: MdAutoAwesome,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800'
  },
  {
    key: 'dense-audit',
    label: 'Dense Audit',
    desc: 'Micro-compact line height maximizing data rows per printed page',
    icon: MdCompress,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
  },
  {
    key: 'custom',
    label: 'Custom Studio',
    desc: 'Personalized borders, custom widths & shared layouts',
    icon: MdPalette,
    colorClass: 'text-primary dark:text-primary',
    bgClass: 'bg-primary/10 border-primary/25'
  }
];

interface CuratedThemeConfig {
  fontFamily: FontFamilyKey;
  fontScale: number;
  paperSize: PaperSizeKey;
  tableBorder: 'none' | 'subtle' | 'full-grid';
  borderSettings: TableBorderSettings;
  columns: ColumnCustomStyle[];
}

const getCuratedThemeSettings = (
  theme: DesignThemeKey,
  currentCols: ColumnCustomStyle[]
): CuratedThemeConfig | null => {
  switch (theme) {
    case 'modern-striped':
      return {
        fontFamily: 'Inter',
        fontScale: 100,
        paperSize: 'a4-portrait',
        tableBorder: 'subtle',
        borderSettings: applyBorderPreset('horizontal-only', '#cbd5e1'),
        columns: currentCols.map((c) => {
          if (c.key === 'narrative' || c.key === 'description' || c.key === 'item' || c.key === 'party_name') {
            return { ...c, wrapText: true, widthPercent: Math.max(c.widthPercent, 28) };
          }
          return c;
        })
      };
    case 'classic-ledger':
      return {
        fontFamily: 'Roboto',
        fontScale: 100,
        paperSize: 'a4-portrait',
        tableBorder: 'subtle',
        borderSettings: applyBorderPreset('accounting', '#0f172a'),
        columns: currentCols.map((c) => {
          if (c.align === 'left' && (c.key.includes('desc') || c.key.includes('narrative'))) {
            return { ...c, wrapText: true, widthPercent: 30 };
          }
          return c;
        })
      };
    case 'corporate-grid':
      return {
        fontFamily: 'Outfit',
        fontScale: 95,
        paperSize: 'a4-portrait',
        tableBorder: 'full-grid',
        borderSettings: applyBorderPreset('all-grid', '#475569'),
        columns: currentCols
      };
    case 'minimal-clean':
      return {
        fontFamily: 'Merriweather',
        fontScale: 100,
        paperSize: 'a4-portrait',
        tableBorder: 'none',
        borderSettings: applyBorderPreset('none', 'transparent'),
        columns: currentCols
      };
    case 'dense-audit':
      return {
        fontFamily: 'JetBrains Mono',
        fontScale: 85,
        paperSize: 'a4-portrait',
        tableBorder: 'full-grid',
        borderSettings: applyBorderPreset('all-grid', '#94a3b8'),
        columns: currentCols.map((c) => ({
          ...c,
          widthPercent: Math.max(getColumnMinWidth(c, false), Math.round(c.widthPercent * 0.9))
        }))
      };
    default:
      return null;
  }
};

interface FontOptionItem {
  key: FontFamilyKey;
  label: string;
  category: string;
  family: string;
  preview: string;
}

const FONT_OPTIONS: FontOptionItem[] = [
  { key: 'Inter', label: 'Inter', category: 'Modern Sans', family: 'Inter, sans-serif', preview: 'Clean modern sans for financial statements' },
  { key: 'Roboto', label: 'Roboto', category: 'Tabular Sans', family: 'Roboto, sans-serif', preview: 'Even digit widths optimized for numbers & figures' },
  { key: 'JetBrains Mono', label: 'JetBrains Mono', category: 'Monospace Ledger', family: 'JetBrains Mono, monospace', preview: 'Precise fixed-width code & audit grid' },
  { key: 'Merriweather', label: 'Merriweather', category: 'Executive Serif', family: 'Merriweather, serif', preview: 'Authoritative editorial serif for executive reports' },
  { key: 'Outfit', label: 'Outfit', category: 'Contemporary Brand', family: 'Outfit, sans-serif', preview: 'Distinctive crisp geometric typography' }
];

interface PaperOptionItem {
  key: PaperSizeKey;
  label: string;
  dimensions: string;
  badge: string;
  orientation: string;
  icon: any;
  colorClass: string;
  bgClass: string;
}

const PAPER_OPTIONS: PaperOptionItem[] = [
  {
    key: 'a4-portrait',
    label: 'A4 Portrait',
    dimensions: '210 × 297 mm',
    badge: 'Standard Vertical',
    orientation: 'Portrait',
    icon: MdArticle,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
  },
  {
    key: 'a4-landscape',
    label: 'A4 Landscape',
    dimensions: '297 × 210 mm',
    badge: 'Wide Tables (10+ Cols)',
    orientation: 'Landscape',
    icon: MdCropLandscape,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800'
  },
  {
    key: 'thermal-80mm',
    label: '80mm POS Thermal Slip',
    dimensions: '80mm Continuous',
    badge: 'Counter Receipt',
    orientation: 'Thermal Roll',
    icon: MdReceiptLong,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
  }
];

const DEFAULT_BORDER_SETTINGS: TableBorderSettings = {
  mode: 'horizontal-only',
  headerUnderline: 'heavy',
  horizontalDividers: 'subtle',
  verticalDividers: false,
  totalsDoubleRule: true,
  borderColor: '#cbd5e1'
};

const applyBorderPreset = (mode: TableBorderSettings['mode'], currentColor = '#cbd5e1'): TableBorderSettings => {
  switch (mode) {
    case 'all-grid':
      return {
        mode: 'all-grid',
        headerUnderline: 'heavy',
        horizontalDividers: 'solid',
        verticalDividers: true,
        totalsDoubleRule: true,
        borderColor: currentColor === 'transparent' ? '#cbd5e1' : currentColor
      };
    case 'horizontal-only':
      return {
        mode: 'horizontal-only',
        headerUnderline: 'heavy',
        horizontalDividers: 'subtle',
        verticalDividers: false,
        totalsDoubleRule: true,
        borderColor: currentColor === 'transparent' ? '#cbd5e1' : currentColor
      };
    case 'vertical-only':
      return {
        mode: 'vertical-only',
        headerUnderline: 'heavy',
        horizontalDividers: 'none',
        verticalDividers: true,
        totalsDoubleRule: false,
        borderColor: currentColor === 'transparent' ? '#cbd5e1' : currentColor
      };
    case 'outer-box':
      return {
        mode: 'outer-box',
        headerUnderline: 'thin',
        horizontalDividers: 'none',
        verticalDividers: false,
        totalsDoubleRule: false,
        borderColor: currentColor === 'transparent' ? '#94a3b8' : currentColor
      };
    case 'accounting':
      return {
        mode: 'accounting',
        headerUnderline: 'heavy',
        horizontalDividers: 'none',
        verticalDividers: false,
        totalsDoubleRule: true,
        borderColor: currentColor === 'transparent' ? '#0f172a' : currentColor
      };
    case 'none':
      return {
        mode: 'none',
        headerUnderline: 'none',
        horizontalDividers: 'none',
        verticalDividers: false,
        totalsDoubleRule: false,
        borderColor: 'transparent'
      };
    default:
      return DEFAULT_BORDER_SETTINGS;
  }
};

const BORDER_PRESET_BUTTONS: { mode: TableBorderSettings['mode']; label: string; icon: any; desc: string }[] = [
  { mode: 'all-grid', label: 'All Gridlines', icon: MdBorderAll, desc: 'Excel table full grid' },
  { mode: 'horizontal-only', label: 'Horizontal Rows', icon: MdBorderHorizontal, desc: 'Row lines only' },
  { mode: 'vertical-only', label: 'Vertical Columns', icon: MdBorderVertical, desc: 'Column lines only' },
  { mode: 'outer-box', label: 'Outer Box', icon: MdBorderOuter, desc: 'Outer perimeter box' },
  { mode: 'accounting', label: 'Accounting', icon: MdBorderBottom, desc: 'Header + double total rule' },
  { mode: 'none', label: 'Borderless', icon: MdBorderClear, desc: 'Clean airy whitespace' }
];

const BORDER_COLOR_SWATCHES = [
  { label: 'Light Slate', hex: '#cbd5e1' },
  { label: 'Steel Gray', hex: '#94a3b8' },
  { label: 'Charcoal', hex: '#475569' },
  { label: 'Deep Black', hex: '#0f172a' },
  { label: 'Burgundy Theme', hex: '#800020' },
  { label: 'Navy Blue', hex: '#1e3a8a' },
  { label: 'Emerald Forest', hex: '#065f46' }
];

const QUICK_COLORS = [
  { name: 'Default', hex: '' },
  { name: 'Dark Slate', hex: '#0f172a' },
  { name: 'Blue', hex: '#1d4ed8' },
  { name: 'Emerald', hex: '#047857' },
  { name: 'Amber', hex: '#b45309' },
  { name: 'Rose', hex: '#be123c' },
  { name: 'Purple', hex: '#6d28d9' }
];

const QUICK_BG_COLORS = [
  { name: 'None', hex: '' },
  { name: 'Light Slate', hex: '#f8fafc' },
  { name: 'Light Blue', hex: '#eff6ff' },
  { name: 'Light Emerald', hex: '#ecfdf5' },
  { name: 'Light Amber', hex: '#fffbeb' },
  { name: 'Light Rose', hex: '#fff1f2' },
  { name: 'Light Purple', hex: '#faf5ff' }
];

/**
 * Detects whether a column represents exact non-wrappable reference data:
 * Dates, Times, Document/Voucher numbers (e.g. INV-4401, REC-1204), Quantity, and currency amounts.
 * These columns must never be wrapped or truncated with ellipsis dots (...).
 */
const isExactIdentifierColumn = (colKey: string, label = ''): boolean => {
  const k = colKey.toLowerCase();
  const l = label.toLowerCase();

  // Date and Time fields
  if (k.includes('date') || k.includes('time') || l.includes('date') || l.includes('time')) {
    return true;
  }

  // Quantity fields (e.g. '120 Sft', '80 Bags') - must never cut off
  if (k.includes('qty') || k.includes('quantity') || l.includes('quant') || l.includes('qty')) {
    return true;
  }

  // Document numbers, Vouchers, Reference IDs
  if (
    k.includes('ref') ||
    k.includes('voucher') ||
    k.includes('document') ||
    k.includes('invoice') ||
    k.includes('doc') ||
    k.includes('inv') ||
    k.includes('bill_no') ||
    k.includes('bill_amount') ||
    k.includes('batch') ||
    l.includes('document') ||
    l.includes('voucher') ||
    l.includes('ref') ||
    l.includes('bill /') ||
    l.includes('batch')
  ) {
    return true;
  }

  // Financial amounts and currency numbers
  if (
    k.includes('amount') ||
    k.includes('debit') ||
    k.includes('credit') ||
    k.includes('balance') ||
    k.includes('paid') ||
    k.includes('closing') ||
    k.includes('opening') ||
    k.includes('cash_in') ||
    k.includes('cash_out') ||
    k.includes('tax') ||
    k.includes('discount') ||
    k.includes('net_total') ||
    k.includes('total') ||
    k.includes('price') ||
    k.includes('rate') ||
    k.includes('value') ||
    l.includes('pkr') ||
    l.includes('amount') ||
    l.includes('debit') ||
    l.includes('credit') ||
    l.includes('balance') ||
    l.includes('discount') ||
    l.includes('tax')
  ) {
    return true;
  }

  return false;
};

/**
 * Calculates the minimum readable width percentage for a column:
 * - Date columns: minimum 14% (A4) / 18% (Thermal) to guarantee full '18-Nov-2026' without dots.
 * - Quantity columns: minimum 14% (A4) / 16% (Thermal) to guarantee full 'QUANTITY' and '120 Sft' without dots.
 * - Document / Voucher columns: minimum 14-16% (A4) to guarantee full 'DOCUMENT #' and 'INV-4401'.
 * - Amount columns: minimum 15-18% (A4) to guarantee full numbers and 'NET TOTAL (PKR)' / 'DISCOUNT (PKR)'.
 * - S#: minimum 6% (A4) / 8% (Thermal).
 * - When wrapText is TRUE (One-Word Rule): width must fit at least the longest single word.
 * - When wrapText is FALSE: width must fit the full phrase without truncation.
 */
const getColumnMinWidth = (col: ColumnCustomStyle, isThermal = false): number => {
  const isExact = isExactIdentifierColumn(col.key, col.label);

  if (isExact) {
    const k = col.key.toLowerCase();
    const l = col.label.toLowerCase();

    // 1. Dates & Times: Full '18-Nov-2026' requires at least 14% on A4
    if (k.includes('date') || k.includes('time') || l.includes('date') || l.includes('time')) {
      return isThermal ? 18 : 14;
    }

    // 2. Quantity (e.g. 'QUANTITY' header + '120 Sft' value) requires at least 14% on A4
    if (k.includes('qty') || k.includes('quantity') || l.includes('quant') || l.includes('qty')) {
      return isThermal ? 16 : 14;
    }

    // 3. Document & Voucher Numbers: Full 'DOCUMENT #' and 'INV-4401'
    if (
      k.includes('ref') ||
      k.includes('voucher') ||
      k.includes('document') ||
      k.includes('inv') ||
      k.includes('doc') ||
      l.includes('document') ||
      l.includes('voucher') ||
      l.includes('ref')
    ) {
      const minDoc = Math.max(14, Math.ceil(col.label.length * 1.0) + 3);
      return isThermal ? Math.max(18, minDoc + 3) : minDoc;
    }

    // 4. Amount & Financial Figures (e.g. 126,000 / NET TOTAL (PKR) / DISCOUNT (PKR))
    const minAmt = Math.max(15, Math.ceil(col.label.length * 0.95) + 3);
    return isThermal ? Math.max(18, minAmt + 3) : minAmt;
  }

  // Sno (S#)
  if (col.key === 'sno' || col.label === 'S#') {
    return isThermal ? 8 : 6;
  }

  const words = col.label.split(/[\s/-]+/).filter(Boolean);
  const sampleWords: string[] = [];
  if (col.key === 'qty') {
    sampleWords.push('120 Sft');
  }

  if (col.wrapText) {
    // One-word rule: must fit at least the longest single word
    const allWords = [...words, ...sampleWords.flatMap((s) => s.split(/[\s/-]+/))];
    const longestWordLen = allWords.reduce((max, w) => Math.max(max, w.length), 0);
    const baseWordMin = Math.max(8, Math.ceil(longestWordLen * 0.9) + 2);
    return isThermal ? Math.max(10, baseWordMin + 3) : baseWordMin;
  } else {
    // Non-wrapped: must fit the full phrase so nothing gets truncated
    const labelLen = col.label.length;
    const sampleMaxLen = sampleWords.reduce((max, s) => Math.max(max, s.length), 0);
    const maxPhraseLen = Math.max(labelLen, sampleMaxLen);
    const baseFullMin = Math.max(10, Math.ceil(maxPhraseLen * 0.85) + 2);
    return isThermal ? Math.max(12, baseFullMin + 4) : baseFullMin;
  }
};

export const ReportVisibilityTab: React.FC<ReportVisibilityTabProps> = ({
  userEmail,
  role,
  systemConfig: initialSystemConfig,
  isRTL = false
}) => {
  const { userName, businessName, allowedSettings, canAccessSetting, role: authRole } = useAuth();
  const [systemConfig, setSystemConfig] = useState<SystemMasterConfig>(() => {
    return initialSystemConfig || DEFAULT_SYSTEM_CONFIG;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [basicSearchQuery, setBasicSearchQuery] = useState('');
  const [basicSelectedCategory, setBasicSelectedCategory] = useState<string>('all');
  const [savingGlobal, setSavingGlobal] = useState(false);

  // Fine-grained permission checks for Basic vs Advance report tiers
  const canAccessBasic = useMemo(() => {
    const effectiveRole = role || authRole;
    if (effectiveRole === 'Super Admin') return true;
    if (canAccessSetting && typeof canAccessSetting === 'function') {
      if (Array.isArray(allowedSettings) && allowedSettings.length > 0) {
        if (
          allowedSettings.includes('reports_visibility') &&
          !allowedSettings.includes('reports_visibility_basic') &&
          !allowedSettings.includes('reports_visibility_advance')
        ) {
          return true; // legacy fallback: both accessible
        }
        return allowedSettings.includes('reports_visibility_basic');
      }
      return canAccessSetting('reports_visibility_basic');
    }
    return true;
  }, [allowedSettings, canAccessSetting, role, authRole]);

  const canAccessAdvance = useMemo(() => {
    const effectiveRole = role || authRole;
    if (effectiveRole === 'Super Admin') return true;
    if (canAccessSetting && typeof canAccessSetting === 'function') {
      if (Array.isArray(allowedSettings) && allowedSettings.length > 0) {
        if (
          allowedSettings.includes('reports_visibility') &&
          !allowedSettings.includes('reports_visibility_basic') &&
          !allowedSettings.includes('reports_visibility_advance')
        ) {
          return true; // legacy fallback: both accessible
        }
        return allowedSettings.includes('reports_visibility_advance');
      }
      return canAccessSetting('reports_visibility_advance');
    }
    return true;
  }, [allowedSettings, canAccessSetting, role, authRole]);

  // Head Tab State: 'basic' (Basic reports) vs 'advance' (advance reports)
  const [reportTier, setReportTier] = useState<'basic' | 'advance'>(() => {
    try {
      const stored = localStorage.getItem('zac_reports_head_tab') as 'basic' | 'advance';
      if (stored === 'basic' || stored === 'advance') return stored;
    } catch (_) {}
    return 'basic';
  });

  // Keep active tier synchronized with user permissions
  useEffect(() => {
    if (canAccessBasic && !canAccessAdvance && reportTier !== 'basic') {
      setReportTier('basic');
    } else if (!canAccessBasic && canAccessAdvance && reportTier !== 'advance') {
      setReportTier('advance');
    }
  }, [canAccessBasic, canAccessAdvance, reportTier]);

  const handleSetTier = (tier: 'basic' | 'advance') => {
    if (tier === 'basic' && !canAccessBasic) return;
    if (tier === 'advance' && !canAccessAdvance) return;
    setReportTier(tier);
    try {
      localStorage.setItem('zac_reports_head_tab', tier);
    } catch (_) {}
  };

  // Studio Modal State
  const [activeReportForStudio, setActiveReportForStudio] = useState<any | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string>('default');
  const [layoutName, setLayoutName] = useState<string>('Custom');
  const [designTheme, setDesignTheme] = useState<DesignThemeKey>('modern-striped');
  const [paperSize, setPaperSize] = useState<PaperSizeKey>('a4-portrait');
  const [fontFamily, setFontFamily] = useState<FontFamilyKey>('Inter');
  const [fontScale, setFontScale] = useState<number>(100);
  const [tableBorder, setTableBorder] = useState<'none' | 'subtle' | 'full-grid'>('subtle');
  const [borderSettings, setBorderSettings] = useState<TableBorderSettings>(DEFAULT_BORDER_SETTINGS);
  const [showAdvancedBorders, setShowAdvancedBorders] = useState<boolean>(false);
  const [columns, setColumns] = useState<ColumnCustomStyle[]>([]);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [authorName, setAuthorName] = useState<string>('');
  const [savedAtTimestamp, setSavedAtTimestamp] = useState<string>('');
  const [showAddColumnMenu, setShowAddColumnMenu] = useState(false);
  const [customNewColName, setCustomNewColName] = useState('');
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Executive Branding & Additional Print Features
  const [watermark, setWatermark] = useState<'none' | 'official' | 'confidential' | 'duplicate' | 'draft'>('none');
  const [showCompanyLogo, setShowCompanyLogo] = useState<boolean>(true);
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('left');
  const [showTaxId, setShowTaxId] = useState<boolean>(true);
  const [currencyFormat, setCurrencyFormat] = useState<'pkr' | 'rs'>('pkr');
  const [decimalPlaces, setDecimalPlaces] = useState<0 | 2>(0);
  const [showBrandingSection, setShowBrandingSection] = useState<boolean>(false);

  // Save Modal States
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveModalPresetName, setSaveModalPresetName] = useState<string>('Custom');
  const [shareAcrossCategory, setShareAcrossCategory] = useState<boolean>(true);

  // Column Drag Resizing States (Option 4)
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [resizingColKey, setResizingColKey] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartWidth, setDragStartWidth] = useState<number>(0);

  // Searchable Dropdowns Popover States
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const [isPaperPickerOpen, setIsPaperPickerOpen] = useState(false);
  const [paperSearch, setPaperSearch] = useState('');

  const fontPickerRef = useRef<HTMLDivElement>(null);
  const paperPickerRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (fontPickerRef.current && !fontPickerRef.current.contains(e.target as Node)) {
        setIsFontPickerOpen(false);
      }
      if (paperPickerRef.current && !paperPickerRef.current.contains(e.target as Node)) {
        setIsPaperPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Helper: auto-switch to Custom Studio whenever user customizes anything below the default presets
  const ensureCustomThemeMode = () => {
    setDesignTheme((curr) => {
      if (curr !== 'custom') {
        toast.info('Switched to Custom Studio to preserve default template presets.', { id: 'switched-custom-studio' });
        return 'custom';
      }
      return curr;
    });
  };

  // Handle Drag Resizing of Column Headers (Option 4)
  const handleStartResize = (colKey: string, startWidth: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    ensureCustomThemeMode();
    setResizingColKey(colKey);
    setDragStartX(e.clientX);
    setDragStartWidth(startWidth);
  };

  useEffect(() => {
    if (!resizingColKey) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const tableWidth = tableContainerRef.current?.offsetWidth || 750;
      const deltaPercent = Math.round((deltaX / tableWidth) * 100);

      setColumns((prev) =>
        prev.map((c) => {
          if (c.key !== resizingColKey) return c;
          const minAllowed = getColumnMinWidth(c, paperSize === 'thermal-80mm');
          const newWidth = Math.max(minAllowed, Math.min(60, dragStartWidth + deltaPercent));
          return { ...c, widthPercent: newWidth };
        })
      );
    };

    const handleMouseUp = () => {
      setResizingColKey(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColKey, dragStartX, dragStartWidth, paperSize]);

  // Sync Master Config updates from outside / other devices
  useEffect(() => {
    if (initialSystemConfig) {
      setSystemConfig(initialSystemConfig);
    }
  }, [initialSystemConfig]);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail) {
        setSystemConfig(e.detail);
      }
    };
    window.addEventListener('erp_system_permissions_updated', handleSync);
    return () => window.removeEventListener('erp_system_permissions_updated', handleSync);
  }, []);

  const isPermitted = canUserManageReports(userEmail, role, systemConfig);

  // Hidden Reports List
  const hiddenReportsList = useMemo(() => {
    return Array.isArray(systemConfig.hidden_reports) ? systemConfig.hidden_reports : [];
  }, [systemConfig.hidden_reports]);

  // Filtered reports list for dashboard table
  const filteredReports = useMemo(() => {
    return ALL_REPORTS.filter((r) => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Toggle Visibility for a single report
  const handleToggleReportVisibility = async (reportId: string) => {
    if (!isPermitted) {
      toast.error('Permission denied: Report governance is locked by Master Dev.');
      return;
    }

    try {
      const isCurrentlyHidden = hiddenReportsList.includes(reportId);
      const updatedHidden = isCurrentlyHidden
        ? hiddenReportsList.filter((id) => id !== reportId)
        : [...hiddenReportsList, reportId];

      const newConfig: SystemMasterConfig = {
        ...systemConfig,
        hidden_reports: updatedHidden
      };

      setSystemConfig(newConfig);
      await saveSystemMasterConfig(newConfig);

      toast.success(
        isCurrentlyHidden
          ? `Report is now visible on all devices.`
          : `Report hidden from all user devices.`
      );
    } catch (err: any) {
      toast.error('Failed to update report visibility: ' + err.message);
    }
  };

  // Filtered basic reports list
  const filteredBasicReports = useMemo(() => {
    return BASIC_REPORTS.filter((r) => {
      if (basicSelectedCategory !== 'all' && r.category !== basicSelectedCategory) return false;
      if (basicSearchQuery.trim()) {
        const q = basicSearchQuery.toLowerCase().trim();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [basicSelectedCategory, basicSearchQuery]);

  // Bulk Show All Basic Reports
  const handleShowAllBasic = async () => {
    if (!isPermitted) return;
    try {
      setSavingGlobal(true);
      const newConfig: SystemMasterConfig = {
        ...systemConfig,
        hidden_reports: hiddenReportsList.filter((id) => !BASIC_REPORT_IDS.includes(id))
      };
      setSystemConfig(newConfig);
      await saveSystemMasterConfig(newConfig);
      toast.success('All basic departmental reports made visible.');
    } catch (err: any) {
      toast.error('Failed to show basic reports: ' + err.message);
    } finally {
      setSavingGlobal(false);
    }
  };

  // Bulk Untoggle / Hide All Basic Reports
  const handleHideAllBasic = async () => {
    if (!isPermitted) return;
    try {
      setSavingGlobal(true);
      const newConfig: SystemMasterConfig = {
        ...systemConfig,
        hidden_reports: Array.from(new Set([...hiddenReportsList, ...BASIC_REPORT_IDS]))
      };
      setSystemConfig(newConfig);
      await saveSystemMasterConfig(newConfig);
      toast.success('All basic departmental reports untoggled.');
    } catch (err: any) {
      toast.error('Failed to untoggle basic reports: ' + err.message);
    } finally {
      setSavingGlobal(false);
    }
  };

  // Bulk Show All Advance Reports
  const handleShowAll = async () => {
    if (!isPermitted) return;
    try {
      setSavingGlobal(true);
      const allAdvanceIds = ALL_REPORTS.map((r) => r.id);
      const newConfig: SystemMasterConfig = {
        ...systemConfig,
        hidden_reports: hiddenReportsList.filter((id) => !allAdvanceIds.includes(id))
      };
      setSystemConfig(newConfig);
      await saveSystemMasterConfig(newConfig);
      toast.success('All advance reports made visible on all logins.');
    } catch (err: any) {
      toast.error('Failed to show all reports: ' + err.message);
    } finally {
      setSavingGlobal(false);
    }
  };

  // Bulk Untoggle / Hide All Advance Reports
  const handleHideAll = async () => {
    if (!isPermitted) return;
    try {
      setSavingGlobal(true);
      const allAdvanceIds = ALL_REPORTS.map((r) => r.id);
      const newConfig: SystemMasterConfig = {
        ...systemConfig,
        hidden_reports: Array.from(new Set([...hiddenReportsList, ...allAdvanceIds]))
      };
      setSystemConfig(newConfig);
      await saveSystemMasterConfig(newConfig);
      toast.success('All advance reports are now untoggled.');
    } catch (err: any) {
      toast.error('Failed to untoggle all reports: ' + err.message);
    } finally {
      setSavingGlobal(false);
    }
  };

  // Computed available presets: direct presets + shared sister presets from same category
  const availableLayoutPresets = useMemo(() => {
    if (!activeReportForStudio) return [];
    const safeConfig = systemConfig || DEFAULT_SYSTEM_CONFIG;
    const directPresets = safeConfig.report_custom_layouts?.[activeReportForStudio.id]?.layouts || [];

    const sisterPresets: (ReportLayoutPreset & { isSister?: boolean; fromReportTitle?: string })[] = [];
    Object.entries(safeConfig.report_custom_layouts || {}).forEach(([repId, cfg]) => {
      if (repId === activeReportForStudio.id) return;
      const rInfo = ALL_REPORTS.find((r) => r.id === repId);
      cfg.layouts?.forEach((l) => {
        if (l.sharedCategory && (l.sharedCategory === activeReportForStudio.category || l.sharedCategory === 'all')) {
          if (!directPresets.some((dp) => dp.id === l.id || dp.name.toLowerCase() === l.name.toLowerCase())) {
            sisterPresets.push({
              ...l,
              isSister: true,
              fromReportTitle: rInfo?.title || 'Sister Report'
            });
          }
        }
      });
    });

    return [...directPresets, ...sisterPresets];
  }, [activeReportForStudio, systemConfig]);

  // ── OPEN STUDIO DESIGNER ──
  const handleOpenStudio = (report: any) => {
    if (!report) return;
    setActiveReportForStudio(report);
    const safeConfig = systemConfig || DEFAULT_SYSTEM_CONFIG;
    const reportCustomConfig: ReportCustomLayoutConfig | undefined =
      safeConfig.report_custom_layouts?.[report.id];

    const savedLayouts = reportCustomConfig?.layouts || [];
    const activeId = reportCustomConfig?.activeLayoutId || (savedLayouts.length > 0 ? savedLayouts[0].id : 'default');

    setActiveLayoutId(activeId);

    const activePreset = savedLayouts.find((l) => l.id === activeId);
    if (activePreset) {
      setLayoutName(activePreset.name);
      setDesignTheme(activePreset.designTheme);
      setPaperSize(activePreset.paperSize);
      setFontFamily(activePreset.fontFamily);
      setFontScale(activePreset.fontScale || 100);
      setTableBorder(activePreset.tableBorder || 'subtle');
      const resolvedBorder = activePreset.borderSettings || (
        activePreset.tableBorder === 'full-grid'
          ? applyBorderPreset('all-grid')
          : activePreset.tableBorder === 'none'
          ? applyBorderPreset('none')
          : applyBorderPreset('horizontal-only')
      );
      setBorderSettings(resolvedBorder);
      const isThermal = activePreset.paperSize === 'thermal-80mm';
      const normalizedColumns = activePreset.columns.map((c) => {
        if (isExactIdentifierColumn(c.key, c.label)) {
          const minW = getColumnMinWidth(c, isThermal);
          return {
            ...c,
            wrapText: false,
            widthPercent: Math.max(c.widthPercent || minW, minW)
          };
        }
        return c;
      });
      setColumns(normalizedColumns);
      setAuthorName(activePreset.savedBy || '');
      setSavedAtTimestamp(activePreset.savedAt || '');
      setWatermark(activePreset.watermark || 'none');
      setShowCompanyLogo(activePreset.showCompanyLogo ?? true);
      setLogoPosition(activePreset.logoPosition || 'left');
      setShowTaxId(activePreset.showTaxId ?? true);
      setCurrencyFormat(activePreset.currencyFormat || 'pkr');
      setDecimalPlaces(activePreset.decimalPlaces ?? 0);
    } else {
      // Default initial layout
      setLayoutName('Custom');
      setDesignTheme('modern-striped');
      setPaperSize('a4-portrait');
      setFontFamily('Inter');
      setFontScale(100);
      setTableBorder('subtle');
      setBorderSettings(DEFAULT_BORDER_SETTINGS);
      const normalizedDefaults = getDefaultColumnsForReport(report.id).map((c) => {
        if (isExactIdentifierColumn(c.key, c.label)) {
          const minW = getColumnMinWidth(c, false);
          return {
            ...c,
            wrapText: false,
            widthPercent: Math.max(c.widthPercent || minW, minW)
          };
        }
        return c;
      });
      setColumns(normalizedDefaults);
      setAuthorName(userName || userEmail || 'Admin');
      setSavedAtTimestamp(new Date().toISOString());
      setWatermark('none');
      setShowCompanyLogo(true);
      setLogoPosition('left');
      setShowTaxId(true);
      setCurrencyFormat('pkr');
      setDecimalPlaces(0);
    }
  };

  // Switch between saved layouts within the Studio
  const handleSelectLayout = (presetId: string) => {
    setActiveLayoutId(presetId);
    if (!activeReportForStudio) return;

    const preset = availableLayoutPresets.find((l) => l.id === presetId);

    if (preset) {
      setLayoutName(preset.name);
      setDesignTheme(preset.designTheme);
      setPaperSize(preset.paperSize);
      setFontFamily(preset.fontFamily);
      setFontScale(preset.fontScale || 100);
      setTableBorder(preset.tableBorder || 'subtle');
      const resolvedBorder = preset.borderSettings || (
        preset.tableBorder === 'full-grid'
          ? applyBorderPreset('all-grid')
          : preset.tableBorder === 'none'
          ? applyBorderPreset('none')
          : applyBorderPreset('horizontal-only')
      );
      setBorderSettings(resolvedBorder);
      const isThermal = preset.paperSize === 'thermal-80mm';
      const normalizedColumns = preset.columns.map((c) => {
        if (isExactIdentifierColumn(c.key, c.label)) {
          const minW = getColumnMinWidth(c, isThermal);
          return {
            ...c,
            wrapText: false,
            widthPercent: Math.max(c.widthPercent || minW, minW)
          };
        }
        return c;
      });
      setColumns(normalizedColumns);
      setAuthorName(preset.savedBy || '');
      setSavedAtTimestamp(preset.savedAt || '');
      setWatermark(preset.watermark || 'none');
      setShowCompanyLogo(preset.showCompanyLogo ?? true);
      setLogoPosition(preset.logoPosition || 'left');
      setShowTaxId(preset.showTaxId ?? true);
      setCurrencyFormat(preset.currencyFormat || 'pkr');
      setDecimalPlaces(preset.decimalPlaces ?? 0);
      if ((preset as any).isSister) {
        toast.success(`Loaded shared custom template "${preset.name}" from ${(preset as any).fromReportTitle}.`);
      }
    } else {
      setLayoutName('Default');
      setDesignTheme('modern-striped');
      setPaperSize('a4-portrait');
      setFontFamily('Inter');
      setFontScale(100);
      setTableBorder('subtle');
      setBorderSettings(DEFAULT_BORDER_SETTINGS);
      const normalizedDefaults = getDefaultColumnsForReport(activeReportForStudio.id).map((c) => {
        if (isExactIdentifierColumn(c.key, c.label)) {
          const minW = getColumnMinWidth(c, false);
          return {
            ...c,
            wrapText: false,
            widthPercent: Math.max(c.widthPercent || minW, minW)
          };
        }
        return c;
      });
      setColumns(normalizedDefaults);
      setAuthorName('');
      setSavedAtTimestamp('');
      setWatermark('none');
      setShowCompanyLogo(true);
      setLogoPosition('left');
      setShowTaxId(true);
      setCurrencyFormat('pkr');
      setDecimalPlaces(0);
    }
  };

  // Generate Next Sequential Name ("Custom", "Custom 1", "Custom 2", ...)
  const getNextSequentialName = (): string => {
    if (!activeReportForStudio) return 'Custom';
    const safeConfig = systemConfig || DEFAULT_SYSTEM_CONFIG;
    const directLayouts = safeConfig.report_custom_layouts?.[activeReportForStudio.id]?.layouts || [];

    const existingNames = new Set<string>();
    directLayouts.forEach((l) => existingNames.add(l.name.trim().toLowerCase()));

    Object.entries(safeConfig.report_custom_layouts || {}).forEach(([repId, cfg]) => {
      const rInfo = ALL_REPORTS.find((r) => r.id === repId);
      if (rInfo?.category === activeReportForStudio.category) {
        cfg.layouts?.forEach((l) => existingNames.add(l.name.trim().toLowerCase()));
      }
    });

    if (!existingNames.has('custom')) {
      return 'Custom';
    }
    let index = 1;
    while (existingNames.has(`custom ${index}`)) {
      index++;
    }
    return `Custom ${index}`;
  };

  // Handle Create New Custom Layout
  const handleCreateNewLayout = () => {
    if (!activeReportForStudio) return;
    const nextName = getNextSequentialName();
    const newId = `custom-${Date.now()}`;
    setActiveLayoutId(newId);
    setLayoutName(nextName);
    setAuthorName(userName || userEmail || 'Super Admin');
    setSavedAtTimestamp(new Date().toISOString());
    setColumns(getDefaultColumnsForReport(activeReportForStudio.id));
    toast.success(`Created new layout "${nextName}". Configure and click Save Changes.`);
  };

  // Handle Theme Selection (5 Curated Themes + 6th Custom Theme)
  const handleSelectTheme = (themeKey: DesignThemeKey) => {
    setDesignTheme(themeKey);
    if (themeKey === 'custom') {
      toast.success('Custom Studio mode active. Personalize styling freely.');
      return;
    }
    const curated = getCuratedThemeSettings(themeKey, columns);
    if (curated) {
      setFontFamily(curated.fontFamily);
      setFontScale(curated.fontScale);
      setPaperSize(curated.paperSize);
      setTableBorder(curated.tableBorder);
      setBorderSettings(curated.borderSettings);
      setColumns(curated.columns);
      toast.success(`Applied curated "${themeKey}" styling & column proportions.`);
    }
  };

  // Auto-fit Column Width
  const handleAutoFitColumn = (colKey: string) => {
    ensureCustomThemeMode();
    setColumns((prev) =>
      prev.map((c) => {
        if (c.key !== colKey) return c;
        const minAllowed = getColumnMinWidth(c, paperSize === 'thermal-80mm');
        let ideal = minAllowed;
        if (c.key === 'narrative' || c.key === 'description' || c.key === 'item' || c.key === 'party_name') {
          ideal = Math.max(minAllowed, 28);
        } else if (c.key === 'category' || c.key === 'type' || c.key === 'location') {
          ideal = Math.max(minAllowed, 16);
        } else {
          ideal = minAllowed + 2;
        }
        return { ...c, widthPercent: Math.min(ideal, 50) };
      })
    );
    toast.success('Column auto-fitted to optimal readable width.');
  };

  // Calculate Column Width Budget
  const totalWidthBudget = useMemo(() => {
    return columns
      .filter((c) => c.visible)
      .reduce((acc, curr) => acc + (Number(curr.widthPercent) || 0), 0);
  }, [columns]);

  // Toggle Column Visibility in Studio
  const handleToggleColumnVis = (colKey: string) => {
    ensureCustomThemeMode();
    setColumns((prev) =>
      prev.map((c) => (c.key === colKey ? { ...c, visible: !c.visible } : c))
    );
  };

  // Set Alignment for Column in Studio
  const handleSetAlignment = (colKey: string, align: 'left' | 'center' | 'right') => {
    ensureCustomThemeMode();
    setColumns((prev) =>
      prev.map((c) => (c.key === colKey ? { ...c, align } : c))
    );
  };

  // Cycle alignment directly from preview click
  const handleCycleAlignmentFromPreview = (colKey: string) => {
    ensureCustomThemeMode();
    setColumns((prev) =>
      prev.map((c) => {
        if (c.key !== colKey) return c;
        const nextAlign =
          c.align === 'left' ? 'center' : c.align === 'center' ? 'right' : 'left';
        return { ...c, align: nextAlign };
      })
    );
  };

  // Set Wrap Text for Column (Auto-checks safe minimum width for wording)
  const handleToggleWrap = (colKey: string) => {
    ensureCustomThemeMode();
    setColumns((prev) =>
      prev.map((c) => {
        if (c.key !== colKey) return c;
        if (isExactIdentifierColumn(c.key, c.label)) {
          toast.error(`"${c.label}" is a protected reference code and cannot be wrapped.`, {
            id: `no-wrap-${colKey}`
          });
          return { ...c, wrapText: false };
        }
        const nextWrap = !c.wrapText;
        const updatedCol: ColumnCustomStyle = { ...c, wrapText: nextWrap };
        const minAllowed = getColumnMinWidth(updatedCol, paperSize === 'thermal-80mm');
        const nextWidth = Math.max(c.widthPercent, minAllowed);
        return { ...updatedCol, widthPercent: nextWidth };
      })
    );
  };

  // Set Column Text Color
  const handleSetTextColor = (colKey: string, color: string) => {
    ensureCustomThemeMode();
    setColumns((prev) =>
      prev.map((c) => (c.key === colKey ? { ...c, textColor: color } : c))
    );
  };

  // Set Column Background Color
  const handleSetBgColor = (colKey: string, color: string) => {
    ensureCustomThemeMode();
    setColumns((prev) =>
      prev.map((c) => (c.key === colKey ? { ...c, bgColor: color } : c))
    );
  };

  // Adjust Column Width (Enforces smart minimum width rule with instant warning toast)
  const handleSetWidthPercent = (colKey: string, width: number) => {
    ensureCustomThemeMode();
    setColumns((prev) =>
      prev.map((c) => {
        if (c.key !== colKey) return c;
        const minAllowed = getColumnMinWidth(c, paperSize === 'thermal-80mm');
        if (width < minAllowed) {
          toast.error(
            `"${c.label}" cannot be less than ${minAllowed}% to avoid cutting off text.`,
            { id: `min-width-${colKey}` }
          );
        }
        // Prevent going below minimum readable word width
        const clampedWidth = Math.max(minAllowed, Math.min(60, width || minAllowed));
        return { ...c, widthPercent: clampedWidth };
      })
    );
  };

  // Add Column
  const handleAddColumn = (col: { key: string; label: string; defaultAlign?: string; defaultWidth?: number }) => {
    if (columns.some((c) => c.key === col.key)) {
      toast.error('Column is already in the list!');
      return;
    }
    ensureCustomThemeMode();
    const newCol: ColumnCustomStyle = {
      key: col.key,
      label: col.label,
      visible: true,
      widthPercent: col.defaultWidth || 14,
      align: (col.defaultAlign as any) || 'left'
    };
    setColumns((prev) => [...prev, newCol]);
    setShowAddColumnMenu(false);
    toast.success(`Added "${col.label}" column`);
  };

  // Add Custom User-typed Column
  const handleAddCustomTypedColumn = () => {
    if (!customNewColName.trim()) return;
    const cleanKey = customNewColName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (columns.some((c) => c.key === cleanKey)) {
      toast.error('Column with this name already exists!');
      return;
    }
    ensureCustomThemeMode();
    const newCol: ColumnCustomStyle = {
      key: cleanKey,
      label: customNewColName.trim(),
      visible: true,
      widthPercent: 14,
      align: 'left'
    };
    setColumns((prev) => [...prev, newCol]);
    setCustomNewColName('');
    setShowAddColumnMenu(false);
    toast.success(`Custom column "${newCol.label}" added.`);
  };

  // Remove Column
  const handleRemoveColumn = (colKey: string) => {
    ensureCustomThemeMode();
    setColumns((prev) => prev.filter((c) => c.key !== colKey));
  };

  // Format Currency for Preview
  const formatPreviewCurrency = (rawAmount: number | string): string => {
    const num = typeof rawAmount === 'string' ? parseFloat(rawAmount.replace(/,/g, '')) : rawAmount;
    if (isNaN(num)) return String(rawAmount);
    const formatted = decimalPlaces === 2
      ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.round(num).toLocaleString('en-US');
    return currencyFormat === 'rs' ? `Rs. ${formatted}` : formatted;
  };

  // Open Save Modal (Sequential Naming)
  const handleOpenSaveModal = () => {
    if (!activeReportForStudio) return;
    if (activeLayoutId === 'default') {
      const nextName = getNextSequentialName();
      setSaveModalPresetName(nextName);
    } else {
      setSaveModalPresetName(layoutName || getNextSequentialName());
    }
    setShareAcrossCategory(true);
    setShowSaveModal(true);
  };

  // ── SAVE CHANGES (CONFIRMED VIA MODAL) ──
  const handleConfirmSave = async () => {
    if (!activeReportForStudio) return;

    try {
      setIsSavingLayout(true);
      const reportId = activeReportForStudio.id;
      const targetName = saveModalPresetName.trim() || 'Custom';
      const effectiveLayoutId = activeLayoutId === 'default' ? `custom-${Date.now()}` : activeLayoutId;
      const currentUserName = userName || userEmail || 'Administrator';
      const nowIso = new Date().toISOString();

      const newPreset: ReportLayoutPreset = {
        id: effectiveLayoutId,
        name: targetName,
        designTheme,
        paperSize,
        fontFamily,
        fontScale,
        tableBorder: borderSettings.mode === 'all-grid' ? 'full-grid' : borderSettings.mode === 'none' ? 'none' : 'subtle',
        borderSettings,
        columns,
        savedBy: currentUserName,
        savedAt: nowIso,
        sharedCategory: shareAcrossCategory ? activeReportForStudio.category : undefined,
        watermark,
        showCompanyLogo,
        logoPosition,
        showTaxId,
        currencyFormat,
        decimalPlaces
      };

      const safeConfig = systemConfig || DEFAULT_SYSTEM_CONFIG;
      const existingConfig: ReportCustomLayoutConfig =
        safeConfig.report_custom_layouts?.[reportId] || {
          hidden: hiddenReportsList.includes(reportId),
          layouts: []
        };

      const filteredLayouts = existingConfig.layouts.filter((l) => l.id !== effectiveLayoutId && l.name.toLowerCase() !== targetName.toLowerCase());
      const updatedLayouts = [...filteredLayouts, newPreset];

      const updatedReportCustomLayouts = {
        ...(safeConfig.report_custom_layouts || {}),
        [reportId]: {
          ...existingConfig,
          activeLayoutId: effectiveLayoutId,
          layouts: updatedLayouts
        }
      };

      // If shared across category, make sure sister reports in the same category also register it
      if (shareAcrossCategory && activeReportForStudio.category) {
        ALL_REPORTS.filter((r) => r.category === activeReportForStudio.category && r.id !== reportId).forEach((sisterReport) => {
          const sisterCfg = updatedReportCustomLayouts[sisterReport.id] || {
            hidden: hiddenReportsList.includes(sisterReport.id),
            layouts: []
          };
          const sisterFiltered = sisterCfg.layouts.filter((l) => l.id !== effectiveLayoutId && l.name.toLowerCase() !== targetName.toLowerCase());
          updatedReportCustomLayouts[sisterReport.id] = {
            ...sisterCfg,
            layouts: [...sisterFiltered, newPreset]
          };
        });
      }

      const updatedMasterConfig: SystemMasterConfig = {
        ...safeConfig,
        report_custom_layouts: updatedReportCustomLayouts
      };

      setSystemConfig(updatedMasterConfig);
      const res = await saveSystemMasterConfig(updatedMasterConfig);

      setLayoutName(targetName);
      setAuthorName(currentUserName);
      setSavedAtTimestamp(nowIso);
      setActiveLayoutId(effectiveLayoutId);
      setShowSaveModal(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);

      if (res && res.error) {
        toast.success(`Layout "${targetName}" saved locally! Sync will retry.`);
      } else {
        toast.success(
          shareAcrossCategory
            ? `Preset "${targetName}" saved & shared across ${activeReportForStudio.category.toUpperCase()} reports!`
            : `Saved layout "${targetName}"! Applied across all devices.`
        );
      }
    } catch (err: any) {
      toast.error('Failed to save layout preset: ' + err.message);
    } finally {
      setIsSavingLayout(false);
    }
  };

  // ── RESET CHANGES ──
  const handleResetChanges = async () => {
    if (!activeReportForStudio) return;

    try {
      const defaultCols = getDefaultColumnsForReport(activeReportForStudio.id);
      setColumns(defaultCols);
      setDesignTheme('modern-striped');
      setPaperSize('a4-portrait');
      setFontFamily('Inter');
      setFontScale(100);
      setTableBorder('subtle');
      setBorderSettings(DEFAULT_BORDER_SETTINGS);
      setLayoutName('Custom');

      toast.success('Layout reset to standard defaults.');
    } catch (err: any) {
      toast.error('Failed to reset: ' + err.message);
    }
  };

  // Unauthorized locked state
  if (!isPermitted || (!canAccessBasic && !canAccessAdvance)) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 shadow-sm text-center max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 mx-auto flex items-center justify-center text-3xl">
          <MdLock />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Reports Governance & Layouts Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            You do not have permission to show, hide, or alter global report print layouts.
            Permissions are granted per-user in the Master Dev Console (<code>/dev/master</code>).
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            User Account: {userEmail || 'Current Session'} ({role || 'Employee'})
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── TOP HEAD TABS: BASIC REPORTS vs ADVANCE REPORTS ── */}
      {canAccessBasic && canAccessAdvance ? (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            type="button"
            onClick={() => handleSetTier('basic')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              reportTier === 'basic'
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <MdDescription size={18} />
            <span>Basic reports</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                reportTier === 'basic'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {BASIC_REPORTS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSetTier('advance')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              reportTier === 'advance'
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <MdAutoAwesome size={18} />
            <span>advance reports</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                reportTier === 'advance'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {ALL_REPORTS.length}
            </span>
          </button>
        </div>
      ) : canAccessBasic ? (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white shadow-md shadow-primary/25">
            <MdDescription size={18} />
            <span>Basic reports</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
              {BASIC_REPORTS.length}
            </span>
          </div>
        </div>
      ) : canAccessAdvance ? (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white shadow-md shadow-primary/25">
            <MdAutoAwesome size={18} />
            <span>advance reports</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
              {ALL_REPORTS.length}
            </span>
          </div>
        </div>
      ) : null}

      {reportTier === 'basic' && canAccessBasic ? (
        <div className="space-y-6">
          {/* ── BASIC REPORTS BANNER ── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Basic Reports Governance
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  {BASIC_REPORTS.length} Core Department Reports
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Toggle core departmental reports (Sales, Purchases, Stock, Accounts) on or off across the system.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={handleHideAllBasic}
                disabled={savingGlobal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <MdVisibilityOff className="text-amber-500 text-sm" />
                <span>Untoggle All</span>
              </button>
              <button
                type="button"
                onClick={handleShowAllBasic}
                disabled={savingGlobal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <MdCheckCircle className="text-emerald-500 text-sm" />
                <span>Show All Basic Reports</span>
              </button>
            </div>
          </div>

          {/* ── BASIC FILTERING ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Department Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setBasicSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  basicSelectedCategory === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                All Departments ({BASIC_REPORTS.length})
              </button>
              {(['sales', 'purchases', 'inventory', 'accounts'] as const).map((catKey) => {
                const count = BASIC_REPORTS.filter((r) => r.category === catKey).length;
                const catLabel = catKey === 'sales' ? 'Sales' : catKey === 'purchases' ? 'Purchases' : catKey === 'inventory' ? 'Stock' : 'Accounts';
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setBasicSelectedCategory(catKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      basicSelectedCategory === catKey
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {catLabel} ({count})
                  </button>
                );
              })}
            </div>

            {/* Basic Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search basic report..."
                value={basicSearchQuery}
                onChange={(e) => setBasicSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary transition"
              />
              <MdSearch className="absolute left-3 top-2.5 text-slate-400" size={16} />
              {basicSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBasicSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ── BASIC REPORT CARDS GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBasicReports.map((report) => {
              const isHidden = hiddenReportsList.includes(report.id);
              const ReportIcon = report.icon || MdDescription;
              return (
                <div
                  key={report.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-200 p-5 flex flex-col justify-between ${
                    isHidden
                      ? 'border-slate-200 dark:border-slate-800/80 opacity-60 hover:opacity-100'
                      : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-primary/40'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + Toggle Switch */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <ReportIcon size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {report.title}
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {report.category}
                          </span>
                        </div>
                      </div>

                      {/* Clean Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleReportVisibility(report.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          !isHidden ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        title={!isHidden ? 'Click to hide report' : 'Click to show report'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            !isHidden ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isHidden
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {isHidden ? 'HIDDEN' : 'VISIBLE'}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      Standard Design
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : canAccessAdvance ? (
        <>
          {/* ── HEADER BANNER ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Reports Visibility & Print Layout Governance
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Synced Across All Logins
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toggle reports on/off across Classic & Modern hubs, design custom column layouts, and set print templates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleHideAll}
            disabled={savingGlobal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <MdVisibilityOff className="text-amber-500 text-sm" />
            <span>Untoggle All</span>
          </button>
          <button
            type="button"
            onClick={handleShowAll}
            disabled={savingGlobal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <MdCheckCircle className="text-emerald-500 text-sm" />
            <span>Show All Reports</span>
          </button>
        </div>
      </div>

      {/* ── FILTERS & CATEGORY TABS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            All Categories ({ALL_REPORTS.length})
          </button>
          {CATEGORY_META.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedCategory === cat.key
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-72 relative">
          <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report by name..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* ── REPORTS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => {
          const isHidden = hiddenReportsList.includes(report.id);
          const customConfig = (systemConfig || DEFAULT_SYSTEM_CONFIG)?.report_custom_layouts?.[report.id];
          const activePreset = customConfig?.layouts?.find((l) => l.id === customConfig.activeLayoutId);
          const Icon = report.icon || MdTrendingUp;

          return (
            <div
              key={report.id}
              className={`rounded-2xl border transition p-4.5 flex flex-col justify-between gap-4 ${
                isHidden
                  ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-primary/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {report.title}
                      </h3>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {report.category}
                      </span>
                    </div>
                  </div>

                  {/* Show / Hide Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleReportVisibility(report.id)}
                    title={isHidden ? 'Click to Show Report' : 'Click to Hide Report'}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      !isHidden ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        !isHidden ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {report.description}
                </p>
              </div>

              {/* Bottom Metadata & Customize Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold truncate ${
                      isHidden
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {isHidden ? 'HIDDEN' : 'VISIBLE'}
                  </span>
                  {activePreset && (
                    <span className="text-[10px] font-mono text-primary font-bold truncate">
                      {activePreset.name}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenStudio(report)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition cursor-pointer shrink-0"
                >
                  <MdTune size={14} />
                  <span>Customize Layout</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
        </>
      ) : null}

      {/* ── SPLIT-SCREEN STUDIO MODAL ── */}
      {activeReportForStudio && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-[96vw] max-w-7xl h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            
            {/* STUDIO HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0">
                  <MdTune size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {activeReportForStudio.title}
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {activeReportForStudio.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Custom Print & On-Screen Layout Studio • Cloud Synced across all workstations
                  </p>
                </div>
              </div>

              {/* Layout Switcher & Saved By Audit Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                {authorName && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                    <MdPeople size={14} className="text-primary" />
                    <span>Saved by: <strong className="text-slate-900 dark:text-white font-bold">{authorName}</strong></span>
                    {savedAtTimestamp && (
                      <span className="text-slate-400 font-mono text-[10px]">
                        • {new Date(savedAtTimestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Preset Selector */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleSelectLayout('default')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeLayoutId === 'default'
                        ? 'bg-primary text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Default
                  </button>
                  {availableLayoutPresets.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleSelectLayout(l.id)}
                      title={(l as any).isSister ? `Shared from ${(l as any).fromReportTitle}` : undefined}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activeLayoutId === l.id
                          ? 'bg-primary text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {(l as any).isSister && (
                        <MdShare size={12} className={activeLayoutId === l.id ? 'text-white/90' : 'text-primary'} />
                      )}
                      <span>{l.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleCreateNewLayout}
                    title="Create New Custom Layout"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition cursor-pointer"
                  >
                    <MdAdd size={14} />
                    <span>New Layout</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveReportForStudio(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <MdClose size={20} />
                </button>
              </div>
            </div>

            {/* STUDIO SPLIT BODY */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              
              {/* ── LEFT PANEL: TOOLS & CONTROLS (~40% width) ── */}
              <div className="w-full lg:w-[42%] border-r border-slate-200 dark:border-slate-800 p-5 overflow-y-auto space-y-5 bg-white dark:bg-slate-900 shrink-0">
                
                {/* 1. Layout Name Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Custom Layout Name:
                  </label>
                  <input
                    type="text"
                    value={layoutName}
                    onChange={(e) => {
                      setLayoutName(e.target.value);
                      ensureCustomThemeMode();
                    }}
                    placeholder="e.g. Custom, Tax Audit Sheet, Counter Slip..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* 2. Visual Design Templates (5 Presets + Custom Studio) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                    Visual Design Theme (5 Templates + Custom Studio):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRESET_DESIGN_THEMES.map((theme) => {
                      const ThemeIcon = theme.icon;
                      const isSelected = designTheme === theme.key;
                      return (
                        <button
                          key={theme.key}
                          type="button"
                          onClick={() => handleSelectTheme(theme.key)}
                          className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary dark:text-white shadow-2xs font-bold ring-1 ring-primary/30'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${theme.bgClass} ${theme.colorClass} ${
                              isSelected ? 'scale-105 shadow-xs ring-2 ring-primary/20' : ''
                            }`}
                          >
                            <ThemeIcon size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate flex items-center gap-1.5">
                              <span>{theme.label}</span>
                              {theme.key === 'custom' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-bold">
                                  Studio
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">{theme.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Paper Size & Global Typography (Searchable Visual Pickers) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Paper Size Searchable Picker */}
                  <div className="relative" ref={paperPickerRef}>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Paper Size / Output:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaperPickerOpen(!isPaperPickerOpen);
                        setIsFontPickerOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {(() => {
                          const currentPaper = PAPER_OPTIONS.find((p) => p.key === paperSize) || PAPER_OPTIONS[0];
                          const PaperIcon = currentPaper.icon;
                          return (
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${currentPaper.bgClass} ${currentPaper.colorClass}`}>
                              <PaperIcon size={15} />
                            </div>
                          );
                        })()}
                        <div className="text-left min-w-0">
                          <span className="font-bold block truncate">
                            {PAPER_OPTIONS.find((p) => p.key === paperSize)?.label || paperSize}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {PAPER_OPTIONS.find((p) => p.key === paperSize)?.dimensions}
                          </span>
                        </div>
                      </div>
                      <MdKeyboardArrowDown size={18} className={`text-slate-400 transition-transform ${isPaperPickerOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Paper Dropdown Menu */}
                    {isPaperPickerOpen && (
                      <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[280px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2.5 shadow-2xl space-y-2 animate-fadeIn">
                        <div className="relative">
                          <MdSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={paperSearch}
                            onChange={(e) => setPaperSearch(e.target.value)}
                            placeholder="Filter paper size..."
                            autoFocus
                            className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
                          />
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                          {PAPER_OPTIONS.filter((p) => {
                            if (!paperSearch.trim()) return true;
                            const q = paperSearch.toLowerCase();
                            return (
                              p.label.toLowerCase().includes(q) ||
                              p.dimensions.toLowerCase().includes(q) ||
                              p.badge.toLowerCase().includes(q)
                            );
                          }).map((opt) => {
                            const isSelected = paperSize === opt.key;
                            const OptIcon = opt.icon;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                  setPaperSize(opt.key);
                                  ensureCustomThemeMode();
                                  setIsPaperPickerOpen(false);
                                  setPaperSearch('');
                                }}
                                className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-2.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-primary/10 border border-primary/40 text-primary dark:text-white font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${opt.bgClass} ${opt.colorClass}`}>
                                    <OptIcon size={15} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                      <span>{opt.label}</span>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                                        {opt.orientation}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {opt.dimensions} • {opt.badge}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && <MdCheck className="text-primary text-base shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Font Family Searchable Visual Picker */}
                  <div className="relative" ref={fontPickerRef}>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Report Font Family:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFontPickerOpen(!isFontPickerOpen);
                        setIsPaperPickerOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
                    >
                      <div className="text-left min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold truncate" style={{ fontFamily: FONT_OPTIONS.find((f) => f.key === fontFamily)?.family }}>
                            {fontFamily}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-primary/10 text-primary font-bold">
                            {FONT_OPTIONS.find((f) => f.key === fontFamily)?.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate" style={{ fontFamily: FONT_OPTIONS.find((f) => f.key === fontFamily)?.family }}>
                          The quick brown fox 123,456
                        </span>
                      </div>
                      <MdKeyboardArrowDown size={18} className={`text-slate-400 transition-transform ${isFontPickerOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Font Dropdown Menu */}
                    {isFontPickerOpen && (
                      <div className="absolute right-0 top-full mt-1.5 z-50 w-full min-w-[310px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2.5 shadow-2xl space-y-2 animate-fadeIn">
                        <div className="relative">
                          <MdSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={fontSearch}
                            onChange={(e) => setFontSearch(e.target.value)}
                            placeholder="Filter font (e.g. sans, mono, serif)..."
                            autoFocus
                            className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
                          />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
                          {FONT_OPTIONS.filter((f) => {
                            if (!fontSearch.trim()) return true;
                            const q = fontSearch.toLowerCase();
                            return (
                              f.label.toLowerCase().includes(q) ||
                              f.category.toLowerCase().includes(q) ||
                              f.preview.toLowerCase().includes(q)
                            );
                          }).map((opt) => {
                            const isSelected = fontFamily === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                  setFontFamily(opt.key);
                                  ensureCustomThemeMode();
                                  setIsFontPickerOpen(false);
                                  setFontSearch('');
                                }}
                                className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                                  isSelected
                                    ? 'bg-primary/10 border border-primary/40 text-primary dark:text-white'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-xs font-black truncate">{opt.label}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                                      {opt.category}
                                    </span>
                                  </div>
                                  <div
                                    style={{ fontFamily: opt.family }}
                                    className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight"
                                  >
                                    123,456.00 PKR • The quick brown fox
                                  </div>
                                </div>
                                {isSelected && <MdCheck className="text-primary text-base shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Font Scale Slider */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Report Typography Scale:
                    </label>
                    <span className="text-xs font-mono font-bold text-primary">{fontScale}%</span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={120}
                    step={5}
                    value={fontScale}
                    onChange={(e) => {
                      setFontScale(Number(e.target.value));
                      ensureCustomThemeMode();
                    }}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>80% (Compact)</span>
                    <span>100% (Standard)</span>
                    <span>120% (Large Print)</span>
                  </div>
                </div>

                {/* 5. Excel-Style Table Gridlines & Specific Border Designer */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <MdBorderAll className="text-primary text-base" />
                        <span>Table Gridlines & Specific Borders:</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Select quick preset or adjust individual borders
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAdvancedBorders(!showAdvancedBorders)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{showAdvancedBorders ? 'Simple' : 'Fine-Tune'}</span>
                      <MdKeyboardArrowDown className={`transition-transform ${showAdvancedBorders ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* 1-Click Quick Preset Matrix (6 Buttons) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BORDER_PRESET_BUTTONS.map((preset) => {
                      const Icon = preset.icon;
                      const isActive = borderSettings.mode === preset.mode;
                      return (
                        <button
                          key={preset.mode}
                          type="button"
                          onClick={() => {
                            const updated = applyBorderPreset(preset.mode, borderSettings.borderColor);
                            setBorderSettings(updated);
                            setTableBorder(preset.mode === 'all-grid' ? 'full-grid' : preset.mode === 'none' ? 'none' : 'subtle');
                            ensureCustomThemeMode();
                          }}
                          className={`p-2 rounded-xl text-left border transition flex items-center gap-2 cursor-pointer ${
                            isActive
                              ? 'bg-primary text-white border-primary shadow-2xs font-bold'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Icon size={18} className={isActive ? 'text-white' : 'text-primary shrink-0'} />
                          <div className="min-w-0">
                            <div className="text-[11px] font-extrabold truncate">{preset.label}</div>
                            <div className={`text-[9px] truncate ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                              {preset.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Granular Border Specifics (Fine-tune accordion) */}
                  {showAdvancedBorders && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-3 animate-fadeIn">
                      {/* Header Underline & Horizontal Rows */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            Header Underline:
                          </span>
                          <div className="flex rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
                            {(['none', 'thin', 'heavy'] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setBorderSettings((b) => ({ ...b, headerUnderline: opt }));
                                  ensureCustomThemeMode();
                                }}
                                className={`flex-1 py-1 rounded-md text-[10px] font-bold capitalize transition cursor-pointer ${
                                  borderSettings.headerUnderline === opt
                                    ? 'bg-primary text-white'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            Row Dividers:
                          </span>
                          <div className="flex rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
                            {(['none', 'subtle', 'solid'] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setBorderSettings((b) => ({ ...b, horizontalDividers: opt }));
                                  ensureCustomThemeMode();
                                }}
                                className={`flex-1 py-1 rounded-md text-[10px] font-bold capitalize transition cursor-pointer ${
                                  borderSettings.horizontalDividers === opt
                                    ? 'bg-primary text-white'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Vertical Dividers & Totals Double Rule Toggles */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBorderSettings((b) => ({ ...b, verticalDividers: !b.verticalDividers }));
                            ensureCustomThemeMode();
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                            borderSettings.verticalDividers
                              ? 'bg-primary/10 border-primary text-primary dark:text-white'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <MdBorderVertical size={16} />
                            <span>Vertical Lines</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${borderSettings.verticalDividers ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            {borderSettings.verticalDividers ? 'ON' : 'OFF'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setBorderSettings((b) => ({ ...b, totalsDoubleRule: !b.totalsDoubleRule }));
                            ensureCustomThemeMode();
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                            borderSettings.totalsDoubleRule
                              ? 'bg-primary/10 border-primary text-primary dark:text-white'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <MdBorderBottom size={16} />
                            <span>Totals Rule (═)</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${borderSettings.totalsDoubleRule ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            {borderSettings.totalsDoubleRule ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>

                      {/* Border Color Swatches & Custom Picker */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                          Border Color & Tone:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {BORDER_COLOR_SWATCHES.map((swatch) => (
                            <button
                              key={swatch.hex}
                              type="button"
                              onClick={() => {
                                setBorderSettings((b) => ({ ...b, borderColor: swatch.hex }));
                                ensureCustomThemeMode();
                              }}
                              title={swatch.label}
                              style={{ backgroundColor: swatch.hex }}
                              className={`w-6 h-6 rounded-lg transition-transform border border-slate-300 dark:border-slate-600 cursor-pointer ${
                                borderSettings.borderColor.toLowerCase() === swatch.hex.toLowerCase()
                                  ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-sm'
                                  : 'hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                            />
                          ))}
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-[10px] text-slate-400 font-mono">Custom:</span>
                            <input
                              type="color"
                              value={borderSettings.borderColor === 'transparent' ? '#cbd5e1' : borderSettings.borderColor}
                              onChange={(e) => {
                                setBorderSettings((b) => ({ ...b, borderColor: e.target.value }));
                                ensureCustomThemeMode();
                              }}
                              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4.5 Executive Branding & Print Settings */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                  <div
                    onClick={() => setShowBrandingSection(!showBrandingSection)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-primary/10 text-primary">
                        <MdBusiness size={15} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          Branding, Watermark & Currency
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Logo position, NTN tax line, diagonal stamp & decimals
                        </span>
                      </div>
                    </div>
                    <button type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {showBrandingSection ? <MdKeyboardArrowUp size={18} /> : <MdKeyboardArrowDown size={18} />}
                    </button>
                  </div>

                  {showBrandingSection && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-3 animate-fadeIn">
                      {/* Company Logo & Position */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showCompanyLogo}
                              onChange={(e) => {
                                setShowCompanyLogo(e.target.checked);
                                ensureCustomThemeMode();
                              }}
                              className="w-3.5 h-3.5 rounded text-primary focus:ring-primary cursor-pointer"
                            />
                            <span>Show Company Logo</span>
                          </label>
                          {showCompanyLogo && (
                            <div className="flex rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
                              {(['left', 'center', 'right'] as const).map((pos) => (
                                <button
                                  key={pos}
                                  type="button"
                                  onClick={() => {
                                    setLogoPosition(pos);
                                    ensureCustomThemeMode();
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition cursor-pointer ${
                                    logoPosition === pos
                                      ? 'bg-primary text-white shadow-2xs'
                                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                  }`}
                                >
                                  {pos}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tax / NTN line toggle */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showTaxId}
                              onChange={(e) => {
                                setShowTaxId(e.target.checked);
                                ensureCustomThemeMode();
                              }}
                              className="w-3.5 h-3.5 rounded text-primary focus:ring-primary cursor-pointer"
                            />
                            <span>Show Tax / NTN / STRN Line</span>
                          </label>
                          {showTaxId && (
                            <span className="text-[10px] text-primary font-bold font-mono">
                              {systemConfig?.company_ntn || systemConfig?.company_strn ? '✓ Profile Synced' : 'Demo Numbers'}
                            </span>
                          )}
                        </div>
                        {showTaxId && (
                          <div className="text-[10px] text-slate-400 font-mono pl-5 pt-0.5">
                            {systemConfig?.company_ntn || systemConfig?.company_strn
                              ? `Profile Tax: ${systemConfig.company_ntn || '—'} / ${systemConfig.company_strn || '—'}`
                              : 'Set your official NTN & STRN anytime in Settings > Profile'}
                          </div>
                        )}
                      </div>

                      {/* Watermark Selector */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                          Watermark Stamp:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { key: 'none', label: 'None' },
                            { key: 'official', label: 'Official Audited' },
                            { key: 'confidential', label: 'Confidential' },
                            { key: 'duplicate', label: 'Duplicate Copy' },
                            { key: 'draft', label: 'Draft Only' }
                          ].map((wm) => (
                            <button
                              key={wm.key}
                              type="button"
                              onClick={() => {
                                setWatermark(wm.key as any);
                                ensureCustomThemeMode();
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition truncate cursor-pointer ${
                                watermark === wm.key
                                  ? 'bg-primary text-white border-primary shadow-2xs'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {wm.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Currency Symbol & Decimals */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            Currency Symbol:
                          </span>
                          <div className="flex rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrencyFormat('pkr');
                                ensureCustomThemeMode();
                              }}
                              className={`flex-1 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                currencyFormat === 'pkr' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                              }`}
                            >
                              PKR
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrencyFormat('rs');
                                ensureCustomThemeMode();
                              }}
                              className={`flex-1 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                currencyFormat === 'rs' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                              }`}
                            >
                              Rs.
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            Decimals:
                          </span>
                          <div className="flex rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setDecimalPlaces(0);
                                ensureCustomThemeMode();
                              }}
                              className={`flex-1 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                decimalPlaces === 0 ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                              }`}
                            >
                              0 (126,000)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDecimalPlaces(2);
                                ensureCustomThemeMode();
                              }}
                              className={`flex-1 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                decimalPlaces === 2 ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                              }`}
                            >
                              2 (.00)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Width Budget Bar */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Page Width Budget:
                    </span>
                    <span
                      className={`text-xs font-mono font-black ${
                        totalWidthBudget > 100 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {totalWidthBudget}% / 100%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(totalWidthBudget, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        totalWidthBudget > 100 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {totalWidthBudget > 100 ? (
                      <>
                        <MdWarning className="text-rose-500 text-sm shrink-0" />
                        <span className="text-rose-600 font-semibold">
                          Exceeds 100%. Adjust column widths or switch to Landscape to prevent clipping.
                        </span>
                      </>
                    ) : (
                      <>
                        <MdCheckCircle className="text-emerald-500 text-sm shrink-0" />
                        <span>Fits standard page boundaries without horizontal clipping.</span>
                      </>
                    )}
                  </p>
                </div>

                {/* 6. Excel-Style Column Designer */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Columns & Cell Styling ({columns.filter((c) => c.visible).length} visible):
                    </label>

                    {/* Add Column Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAddColumnMenu(!showAddColumnMenu)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary transition cursor-pointer"
                      >
                        <MdAdd size={14} />
                        <span>Add Column</span>
                      </button>

                      {showAddColumnMenu && (
                        <div className="absolute right-0 top-8 z-50 w-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2.5 shadow-xl space-y-2 animate-fadeIn">
                          <div className="text-[10px] font-bold uppercase text-slate-400 px-1">
                            Available Report Fields
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {EXTRA_ADDABLE_COLUMNS.filter((ec) => !columns.some((c) => c.key === ec.key)).map(
                              (ec) => (
                                <button
                                  key={ec.key}
                                  type="button"
                                  onClick={() => handleAddColumn(ec)}
                                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                                >
                                  <span>{ec.label}</span>
                                  <MdAdd className="text-primary" />
                                </button>
                              )
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div className="text-[10px] font-bold text-slate-400 mb-1">
                              Custom Field Name:
                            </div>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={customNewColName}
                                onChange={(e) => setCustomNewColName(e.target.value)}
                                placeholder="e.g. Due Date"
                                className="w-full px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomTypedColumn}
                                className="px-2 py-1 bg-primary text-white text-xs font-bold rounded-lg"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Columns List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        className={`p-3 rounded-2xl border transition ${
                          col.visible
                            ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                            : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                            <input
                              type="checkbox"
                              checked={col.visible}
                              onChange={() => handleToggleColumnVis(col.key)}
                              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {col.label}
                            </span>
                          </label>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Alignment Pills */}
                            <div className="flex rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5">
                              <button
                                type="button"
                                onClick={() => handleSetAlignment(col.key, 'left')}
                                title="Align Left"
                                className={`p-1 rounded text-xs ${
                                  col.align === 'left' ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-700'
                                }`}
                              >
                                <MdFormatAlignLeft size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetAlignment(col.key, 'center')}
                                title="Align Center"
                                className={`p-1 rounded text-xs ${
                                  col.align === 'center' ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-700'
                                }`}
                              >
                                <MdFormatAlignCenter size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetAlignment(col.key, 'right')}
                                title="Align Right"
                                className={`p-1 rounded text-xs ${
                                  col.align === 'right' ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-700'
                                }`}
                              >
                                <MdFormatAlignRight size={13} />
                              </button>
                            </div>

                            {/* Wrap Text Toggle */}
                            {isExactIdentifierColumn(col.key, col.label) ? (
                              <button
                                type="button"
                                disabled
                                title="Dates, reference numbers and currency amounts cannot be wrapped to maintain standard accounting readability."
                                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[11px] font-bold flex items-center gap-1 cursor-not-allowed select-none opacity-80"
                              >
                                <MdWrapText size={13} />
                                <span>Fixed (No Wrap)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleWrap(col.key)}
                                title={col.wrapText ? 'Text Wrapping Enabled' : 'Click to enable text wrapping'}
                                className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                  col.wrapText
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                              >
                                <MdWrapText size={13} className={col.wrapText ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                                <span>{col.wrapText ? 'Wrapped' : 'Wrap'}</span>
                              </button>
                            )}

                            {/* Remove Custom Column */}
                            {EXTRA_ADDABLE_COLUMNS.some((ec) => ec.key === col.key) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColumn(col.key)}
                                title="Remove Column"
                                className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                              >
                                <MdDelete size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Column Width & Colors */}
                        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px]">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-semibold block">Width:</span>
                                <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono text-[10px] font-black">
                                  {col.widthPercent}%
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAutoFitColumn(col.key)}
                                title="Auto-fit width based on header & content length"
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                              >
                                <MdAutoFixHigh size={10} />
                                <span>Auto</span>
                              </button>
                            </div>

                            {/* Option 2: Tactile Range Slider clamped to safe minimum */}
                            <input
                              type="range"
                              min={getColumnMinWidth(col, paperSize === 'thermal-80mm')}
                              max={60}
                              value={col.widthPercent}
                              onChange={(e) => handleSetWidthPercent(col.key, Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-ew-resize accent-primary"
                            />

                            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                              <span>min {getColumnMinWidth(col, paperSize === 'thermal-80mm')}%</span>
                              <span className="truncate">
                                {isExactIdentifierColumn(col.key, col.label)
                                  ? '🔒 full'
                                  : col.wrapText
                                  ? '1-word'
                                  : 'full text'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Text Color:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="color"
                                value={col.textColor || '#1e293b'}
                                onChange={(e) => handleSetTextColor(col.key, e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                              />
                              <button
                                type="button"
                                onClick={() => handleSetTextColor(col.key, '')}
                                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                              >
                                clear
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Cell BG:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="color"
                                value={col.bgColor || '#ffffff'}
                                onChange={(e) => handleSetBgColor(col.key, e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                              />
                              <button
                                type="button"
                                onClick={() => handleSetBgColor(col.key, '')}
                                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                              >
                                clear
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── STICKY BASE BUTTONS (Exact names: Save Changes & Reset Changes) ── */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
                  <button
                    type="button"
                    onClick={handleResetChanges}
                    title="Reset all settings to default"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    <MdRestartAlt size={16} />
                    <span>Reset Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenSaveModal}
                    disabled={isSavingLayout}
                    className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-primary hover:bg-primary/90 text-white shadow-md transition cursor-pointer disabled:opacity-60"
                  >
                    {isSavingLayout ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : justSaved ? (
                      <>
                        <MdCheck size={16} className="text-emerald-300" />
                        <span>Saved to Cloud!</span>
                      </>
                    ) : (
                      <>
                        <MdSave size={16} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ── RIGHT PANEL: LIVE WYSIWYG CANVAS PREVIEW (~58% width) ── */}
              <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 overflow-y-auto flex flex-col items-center">
                
                {/* Canvas Zoom & Status Header */}
                <div className="w-full max-w-4xl flex items-center justify-between mb-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
                      Live Sheet Preview
                    </span>
                    <span className="text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-mono">
                      {paperSize.toUpperCase()} • {designTheme}
                    </span>
                  </div>

                  {/* Zoom Controls & Test Print */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(65)}
                      title="Auto-fit full A4 page into viewport with zero vertical scroll"
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        previewZoom <= 65
                          ? 'bg-primary text-white border-primary shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Fit Page
                    </button>

                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPreviewZoom((z) => Math.max(z - 10, 50))}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        <MdZoomOut size={15} />
                      </button>
                      <span className="px-2 font-mono text-[11px] font-bold">{previewZoom}%</span>
                      <button
                        type="button"
                        onClick={() => setPreviewZoom((z) => Math.min(z + 10, 140))}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        <MdZoomIn size={15} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      title="Print or Export PDF of current designed sheet"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition cursor-pointer"
                    >
                      <MdPrint size={14} />
                      <span>Print Test / PDF</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Paper Canvas with Layout-Box Zoom */}
                <div
                  className="w-full flex justify-center pb-8"
                  style={{
                    zoom: `${previewZoom}%`
                  }}
                >
                  <div
                    id="printable-paper-canvas"
                    style={{
                      fontFamily: FONT_OPTIONS.find((f) => f.key === fontFamily)?.family || 'Inter, sans-serif',
                      minHeight: paperSize === 'a4-portrait' ? '1050px' : paperSize === 'a4-landscape' ? '740px' : '400px'
                    }}
                    className={`w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-xl p-8 border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between ${
                      paperSize === 'thermal-80mm' ? 'max-w-md p-4' : ''
                    }`}
                  >
                    {/* Top Content Block */}
                    <div>
                      {/* Watermark Stamp */}
                      {watermark !== 'none' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
                          <div className="transform -rotate-30 text-5xl sm:text-6xl font-black text-slate-900/[0.04] dark:text-black/[0.05] border-4 border-dashed border-slate-900/[0.06] px-8 py-3 rounded-2xl uppercase tracking-widest whitespace-nowrap">
                            {watermark === 'official'
                              ? 'OFFICIAL AUDITED'
                              : watermark === 'confidential'
                              ? 'CONFIDENTIAL'
                              : watermark === 'duplicate'
                              ? 'DUPLICATE COPY'
                              : watermark === 'draft'
                              ? 'DRAFT ONLY'
                              : watermark}
                          </div>
                        </div>
                      )}

                      {/* Report Printed Header */}
                      <div className="border-b-2 border-slate-900 pb-3 mb-4 space-y-2 relative z-10">
                        <div
                          className={`flex ${
                            logoPosition === 'center'
                              ? 'flex-col items-center text-center'
                              : logoPosition === 'right'
                              ? 'flex-row-reverse justify-between items-start'
                              : 'justify-between items-start'
                          } gap-3`}
                        >
                          {showCompanyLogo && (
                            <div className={`flex items-center gap-2 ${logoPosition === 'center' ? 'mb-1' : ''}`}>
                              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                                <MdBusiness size={24} />
                              </div>
                              {logoPosition === 'center' && (
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Official Document
                                </span>
                              )}
                            </div>
                          )}

                          <div className={logoPosition === 'center' ? 'text-center' : ''}>
                            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                              {businessName || 'ZOHAIB ALI AND COMPANY'}
                            </h1>
                            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                              {activeReportForStudio.title}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Statement Period: 01-Jul-2026 to 30-Jun-2027 • Official Audited Copy
                            </div>
                            {showTaxId && (
                              <div className="text-[9px] font-mono font-semibold text-slate-500 mt-0.5">
                                {systemConfig?.company_ntn || systemConfig?.company_strn ? (
                                  <>
                                    {systemConfig.company_ntn && <span>NTN: {systemConfig.company_ntn}</span>}
                                    {systemConfig.company_ntn && systemConfig.company_strn && <span> • </span>}
                                    {systemConfig.company_strn && <span>STRN / Sales Tax: {systemConfig.company_strn}</span>}
                                  </>
                                ) : (
                                  <span>NTN: 7392014-9 • STRN / Sales Tax: 32-77-8761-234-56</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div
                            className={`${
                              logoPosition === 'center' ? 'text-center' : 'text-right'
                            } text-[10px] font-mono text-slate-500 shrink-0`}
                          >
                            <div>Generated: {new Date().toLocaleDateString()}</div>
                            <div>Layout: {layoutName}</div>
                            <div>Currency: {currencyFormat.toUpperCase()}</div>
                          </div>
                        </div>
                      </div>

                      {/* Simulated Table */}
                      <div ref={tableContainerRef} className="w-full overflow-x-auto relative z-10">
                    {(() => {
                      const borderColor = borderSettings.borderColor === 'transparent' ? '#cbd5e1' : borderSettings.borderColor;
                      const hasOuterBox = borderSettings.mode === 'outer-box' || borderSettings.mode === 'all-grid';
                      const showVertLines = borderSettings.verticalDividers || borderSettings.mode === 'all-grid' || borderSettings.mode === 'vertical-only';
                      const vertBorder = showVertLines ? `1px solid ${borderColor}` : undefined;
                      const horizBorder =
                        borderSettings.horizontalDividers === 'solid' || borderSettings.mode === 'all-grid'
                          ? `1px solid ${borderColor}`
                          : borderSettings.horizontalDividers === 'subtle' || borderSettings.mode === 'horizontal-only'
                          ? `1px solid ${borderSettings.borderColor === 'transparent' ? '#e2e8f0' : borderColor + '80'}`
                          : undefined;

                      const headerUnderline =
                        borderSettings.headerUnderline === 'heavy'
                          ? `2px solid ${borderColor}`
                          : borderSettings.headerUnderline === 'thin'
                          ? `1px solid ${borderColor}`
                          : undefined;

                      const totalsBottom =
                        borderSettings.totalsDoubleRule
                          ? `4px double ${borderColor}`
                          : `2px solid ${borderColor}`;

                      return (
                        <table
                          style={{
                            width: totalWidthBudget > 100 ? `${totalWidthBudget}%` : '100%',
                            minWidth: '100%',
                            fontSize: `${(fontScale / 100) * 11}px`,
                            border: hasOuterBox ? `1.5px solid ${borderColor}` : undefined
                          }}
                          className="table-fixed"
                        >
                          <thead>
                            <tr
                              style={{ borderBottom: headerUnderline }}
                              className={`${
                                designTheme === 'modern-striped'
                                  ? 'bg-slate-100'
                                  : designTheme === 'classic-ledger'
                                  ? 'bg-slate-200/90'
                                  : designTheme === 'corporate-grid'
                                  ? 'bg-slate-900 text-white'
                                  : designTheme === 'dense-audit'
                                  ? 'bg-slate-100 text-slate-900 font-black'
                                  : 'text-slate-700'
                              }`}
                            >
                              {columns
                                .filter((c) => c.visible)
                                .map((col, cIdx, arr) => (
                                  <th
                                    key={col.key}
                                    style={{
                                      width: `${col.widthPercent}%`,
                                      textAlign: col.align,
                                      color: col.textColor || undefined,
                                      backgroundColor: col.bgColor || undefined,
                                      borderRight: showVertLines && cIdx < arr.length - 1 ? vertBorder : undefined,
                                      position: 'relative'
                                    }}
                                    className={`px-2 py-1.5 uppercase font-bold text-[10px] tracking-wider select-none group/th ${
                                      isExactIdentifierColumn(col.key, col.label) ? 'whitespace-nowrap' : ''
                                    }`}
                                  >
                                    <div
                                      onClick={() => handleCycleAlignmentFromPreview(col.key)}
                                      title="Click to cycle alignment (Left / Center / Right)"
                                      className="cursor-pointer hover:text-primary transition whitespace-nowrap overflow-visible"
                                    >
                                      {col.label}
                                    </div>

                                    {/* Option 4: Draggable Header Resize Handle */}
                                    <div
                                      onMouseDown={(e) => handleStartResize(col.key, col.widthPercent, e)}
                                      title={`Drag to resize "${col.label}" (min ${getColumnMinWidth(col, paperSize === 'thermal-80mm')}%)`}
                                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-primary/40 group-hover/th:bg-primary/20 z-10 flex items-center justify-center transition select-none"
                                    >
                                      <div className="w-[2px] h-3.5 bg-slate-400 group-hover/th:bg-primary rounded-full" />
                                    </div>
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Sample Rows */}
                            {[
                              { date: '18-Nov-2026', ref: 'INV-4401', desc: 'Porcelain Polished Tile 60x120 - Calacatta Gold Extra Glaze Glossy Finish', cat: 'Floor Tiles', qty: '120 Sft', amount: 84000, debit: 84000, credit: 0, balance: 84000 },
                              { date: '17-Nov-2026', ref: 'REC-1204', desc: 'Customer Direct Bank Transfer (Meezan Bank - Main Commercial Branch)', cat: 'Settlement', qty: '—', amount: 50000, debit: 0, credit: 50000, balance: 34000 },
                              { date: '16-Nov-2026', ref: 'INV-4395', desc: 'Ceramic Glazed Wall Tiles 30x60 - Royal Grey Premium Series', cat: 'Wall Tiles', qty: '80 Sft', amount: 48000, debit: 48000, credit: 0, balance: 82000 },
                              { date: '15-Nov-2026', ref: 'RET-0042', desc: 'Damaged Tile Return Adjustment Credit Note for Corner Breakage', cat: 'Sales Return', qty: '10 Sft', amount: 6000, debit: 0, credit: 6000, balance: 76000 }
                            ].map((row, idx) => (
                              <tr
                                key={idx}
                                style={{ borderBottom: horizBorder }}
                                className={`${
                                  designTheme === 'modern-striped' && idx % 2 === 1
                                    ? 'bg-slate-50'
                                    : designTheme === 'classic-ledger' && idx % 2 === 1
                                    ? 'bg-amber-50/20'
                                    : ''
                                } ${designTheme === 'dense-audit' ? 'leading-none' : ''}`}
                              >
                                {columns
                                  .filter((c) => c.visible)
                                  .map((col, cIdx, arr) => {
                                    let val: any = '—';
                                    if (col.key === 'sno') val = String(idx + 1);
                                    else if (col.key === 'date') val = row.date;
                                    else if (col.key === 'ref' || col.key === 'voucher') val = row.ref;
                                    else if (col.key === 'narrative' || col.key === 'description' || col.key === 'item' || col.key === 'party_name') val = row.desc;
                                    else if (col.key === 'category' || col.key === 'type') val = row.cat;
                                    else if (col.key === 'qty') val = row.qty;
                                    else if (col.key === 'amount' || col.key === 'bill_amount' || col.key === 'value') val = formatPreviewCurrency(row.amount);
                                    else if (col.key === 'debit' || col.key === 'paid' || col.key === 'cash_in') val = formatPreviewCurrency(row.debit);
                                    else if (col.key === 'credit' || col.key === 'cash_out') val = formatPreviewCurrency(row.credit);
                                    else if (col.key === 'balance' || col.key === 'closing') val = formatPreviewCurrency(row.balance);
                                    else if (col.key.includes('discount')) val = formatPreviewCurrency([2500, 1500, 1000, 500][idx] || 0);
                                    else if (col.key.includes('tax') || col.key.includes('gst')) val = formatPreviewCurrency([15120, 9000, 8640, 1080][idx] || 0);
                                    else if (col.key.includes('salesman') || col.key.includes('officer')) val = ['Tariq Mehmood', 'Usman Ali', 'Bilal Ahmed', 'Tariq Mehmood'][idx];
                                    else if (col.key.includes('location') || col.key.includes('branch')) val = ['Main Warehouse', 'Showroom Floor', 'Main Warehouse', 'Return Bay'][idx];
                                    else if (col.key.includes('status')) val = ['Paid', 'Pending', 'Paid', 'Adjusted'][idx];
                                    else if (col.key.includes('batch') || col.key.includes('lot')) val = ['B-2026-09', 'B-2026-11', 'B-2026-04', 'B-2026-12'][idx];
                                    else if (col.key.includes('city') || col.key.includes('region')) val = ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad'][idx];
                                    else if (col.key.includes('remark')) val = ['Verified by Store Auditor', 'Direct online transfer', 'Inspected at dispatch', 'Breakage verified'][idx];
                                    else val = typeof row.amount === 'number' ? formatPreviewCurrency(1000) : 'Sample Entry';

                                    const isExact = isExactIdentifierColumn(col.key, col.label);
                                    return (
                                      <td
                                        key={col.key}
                                        style={{
                                          textAlign: col.align,
                                          color: col.textColor || undefined,
                                          backgroundColor: col.bgColor || undefined,
                                          borderRight: showVertLines && cIdx < arr.length - 1 ? vertBorder : undefined
                                        }}
                                        className={`px-2 py-1.5 ${
                                          isExact
                                            ? 'whitespace-nowrap overflow-visible font-mono font-medium'
                                            : col.wrapText
                                            ? 'whitespace-normal break-words leading-relaxed'
                                            : 'truncate whitespace-nowrap overflow-hidden'
                                        }`}
                                      >
                                        {val}
                                      </td>
                                    );
                                  })}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr
                              style={{
                                borderTop: `1.5px solid ${borderColor}`,
                                borderBottom: totalsBottom
                              }}
                              className={`font-black ${
                                designTheme === 'classic-ledger'
                                  ? 'bg-slate-100/90'
                                  : 'bg-slate-50'
                              }`}
                            >
                              {(() => {
                                const visibleCols = columns.filter((c) => c.visible);
                                const firstRightIdx = visibleCols.findIndex((c) => c.align === 'right');
                                const totalLabelIdx = firstRightIdx > 0 ? firstRightIdx - 1 : 0;

                                return visibleCols.map((col, idx) => {
                                  let cellVal = '';
                                  if (col.align === 'right') {
                                    if (col.key.includes('discount')) {
                                      cellVal = formatPreviewCurrency(5500);
                                    } else if (col.key.includes('tax')) {
                                      cellVal = formatPreviewCurrency(33840);
                                    } else {
                                      cellVal = formatPreviewCurrency(126000);
                                    }
                                  } else if (idx === 0 || idx === totalLabelIdx) {
                                    cellVal = idx === 0 ? 'TOTAL' : '';
                                  }

                                  return (
                                    <td
                                      key={col.key}
                                      style={{
                                        textAlign: col.align,
                                        /* Vertical borders explicitly omitted on footer for clean unified summary */
                                        borderRight: 'none'
                                      }}
                                      className="px-2 py-2.5 text-[11px] font-black uppercase tracking-wider select-none"
                                    >
                                      {cellVal}
                                    </td>
                                  );
                                });
                              })()}
                            </tr>
                          </tfoot>
                        </table>
                      );
                    })()}
                  </div>

                    </div>

                    {/* Print Footer Notice */}
                    <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>* System-generated report designed via Layout Studio • All figures in {currencyFormat.toUpperCase()}</span>
                      <span>Page 1 of 1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── SEQUENTIAL SAVE PRESET MODAL ── */}
      {showSaveModal && createPortal(
        <div className="fixed inset-0 z-[10000000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <MdSave size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Save Custom Preset
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Save layout settings with sequential naming
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preset Name:
                </label>
                <input
                  type="text"
                  value={saveModalPresetName}
                  onChange={(e) => setSaveModalPresetName(e.target.value)}
                  placeholder="e.g. Custom, Custom 1, Custom 2..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Auto-assigned next sequential name. You can customize or keep it.
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={shareAcrossCategory}
                    onChange={(e) => setShareAcrossCategory(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Share room across {activeReportForStudio?.category?.toUpperCase() || 'this'} category
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Sister reports in this category will automatically have this custom template available in their template bar.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSavingLayout}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-md transition cursor-pointer disabled:opacity-60"
              >
                {isSavingLayout ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <MdCheck size={16} />
                    <span>Save Preset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── PRINT MEDIA STYLES ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-paper-canvas, #printable-paper-canvas * {
            visibility: visible !important;
          }
          #printable-paper-canvas {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
            zoom: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportVisibilityTab;
