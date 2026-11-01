import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuBanknote,
  LuClock,
  LuUser,
  LuLock,
  LuUnlock,
  LuPlus,
  LuMinus,
  LuReceipt,
  LuPrinter,
  LuFileSpreadsheet,
  LuArrowLeft,
  LuCheckCircle2,
  LuAlertTriangle,
  LuCoins,
  LuX,
  LuFileText,
  LuCalendar,
  LuFilter,
  LuBarChart3,
  LuPieChart,
  LuTrendingUp,
  LuTag,
  LuShoppingBag,
  LuArrowDownLeft,
  LuArrowUpRight,
  LuCreditCard,
  LuQrCode,
  LuSparkles
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import { getSavedAccentColor, getContrastTextColor } from '../../constant/themeConfig';
import { posService, PosShift, PosSettings, PosOrder } from '../../service/posService';

interface POSRegisterProps {
  embedded?: boolean;
  onBack?: () => void;
}

export const POSRegister: React.FC<POSRegisterProps> = ({ embedded, onBack }) => {
  const navigate = useNavigate();
  const { userEmail, businessName } = useAuth();
  const { isRTL } = useLanguage();
  const [accentColor, setAccentColor] = useState<string>(getSavedAccentColor());

  useEffect(() => {
    const handleTheme = () => setAccentColor(getSavedAccentColor());
    window.addEventListener('uzair_jibran_theme_color_changed', handleTheme);
    return () => window.removeEventListener('uzair_jibran_theme_color_changed', handleTheme);
  }, []);

  const contrastText = getContrastTextColor(accentColor);

  const [posConfig] = useState<PosSettings>(() => posService.getSettings());
  const [activeShift, setActiveShift] = useState<PosShift | null>(() => posService.getActiveShift());
  const [allShifts, setAllShifts] = useState<PosShift[]>(() => posService.getAllShifts());

  // Modal States
  const [isOpenShiftModal, setIsOpenShiftModal] = useState<boolean>(false);
  const [dayOpenDate, setDayOpenDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dayOpenPettyCash, setDayOpenPettyCash] = useState<number>(() => posService.getLastClosingPettyCash());
  const [dayOpenCashIn, setDayOpenCashIn] = useState<number>(0);
  const [dayOpenCashOut, setDayOpenCashOut] = useState<number>(0);

  const [isCloseShiftModal, setIsCloseShiftModal] = useState<boolean>(false);
  const [dayCloseDate, setDayCloseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dayCloseCashOut, setDayCloseCashOut] = useState<number>(0);
  const [dayCloseCashIn, setDayCloseCashIn] = useState<number>(0);
  const [dayCloseNotes, setDayCloseNotes] = useState<string>('');
  const [actualCountedCash, setActualCountedCash] = useState<number>(0);

  const [isCashInOutModal, setIsCashInOutModal] = useState<boolean>(false);
  const [cashInOutType, setCashInOutType] = useState<'in' | 'out'>('in');
  const [cashInOutAmount, setCashInOutAmount] = useState<number>(0);
  const [cashInOutReason, setCashInOutReason] = useState<string>('');

  const [selectedZReport, setSelectedZReport] = useState<PosShift | null>(null);

  // Report Navigation State
  type ReportTab = 'zreport' | 'category' | 'top_items' | 'payments' | 'peak_hours' | 'petty_cash';
  const [activeTab, setActiveTab] = useState<ReportTab>('zreport');

  // Orders State
  const [allOrders, setAllOrders] = useState<PosOrder[]>(() => posService.getAllOrders());

  // Date Filter State for Daily Summary & Reports
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Yesterday' | 'Last7Days' | 'Custom'>('All');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const currentCashierName = userEmail?.split('@')[0] || 'Alex Rivera';

  // Filtered Shifts by Date
  const filteredShifts = useMemo(() => {
    if (dateFilter === 'All') return allShifts;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    return allShifts.filter((s) => {
      const shiftDate = new Date(s.opened_at);
      const shiftDateStr = shiftDate.toISOString().split('T')[0];

      if (dateFilter === 'Today') return shiftDateStr === todayStr;
      if (dateFilter === 'Yesterday') return shiftDateStr === yesterdayStr;
      if (dateFilter === 'Last7Days') return shiftDate >= sevenDaysAgo;
      if (dateFilter === 'Custom') return shiftDateStr === customDate;
      return true;
    });
  }, [allShifts, dateFilter, customDate]);

  // Filtered Orders by Date
  const filteredOrders = useMemo(() => {
    if (dateFilter === 'All') return allOrders;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    return allOrders.filter((ord) => {
      const orderDate = new Date(ord.created_at);
      const orderDateStr = orderDate.toISOString().split('T')[0];

      if (dateFilter === 'Today') return orderDateStr === todayStr;
      if (dateFilter === 'Yesterday') return orderDateStr === yesterdayStr;
      if (dateFilter === 'Last7Days') return orderDate >= sevenDaysAgo;
      if (dateFilter === 'Custom') return orderDateStr === customDate;
      return true;
    });
  }, [allOrders, dateFilter, customDate]);

  // 1. Category Sales Breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { category: string; quantity: number; revenue: number; ordersCount: number }> = {};
    let totalCatRevenue = 0;
    let totalCatPieces = 0;

    for (const ord of filteredOrders) {
      if (ord.status === 'Voided') continue;
      for (const item of ord.items || []) {
        const cat = item.category || 'General Cloth';
        if (!map[cat]) {
          map[cat] = { category: cat, quantity: 0, revenue: 0, ordersCount: 0 };
        }
        map[cat].quantity += Number(item.quantity) || 1;
        map[cat].revenue += Number(item.line_total) || 0;
        map[cat].ordersCount += 1;
        totalCatRevenue += Number(item.line_total) || 0;
        totalCatPieces += Number(item.quantity) || 1;
      }
    }

    const list = Object.values(map).map((c) => ({
      ...c,
      percentage: totalCatRevenue > 0 ? ((c.revenue / totalCatRevenue) * 100).toFixed(1) : '0',
      averagePrice: c.quantity > 0 ? Math.round(c.revenue / c.quantity) : 0
    })).sort((a, b) => b.revenue - a.revenue);

    return { list, totalRevenue: totalCatRevenue, totalPieces: totalCatPieces };
  }, [filteredOrders]);

  // 2. Top Fast-Moving Products
  const topProductsStats = useMemo(() => {
    const map: Record<string, { id: string; name: string; code: string; category: string; quantity: number; revenue: number; unitPrice: number }> = {};
    let totalRevenue = 0;

    for (const ord of filteredOrders) {
      if (ord.status === 'Voided') continue;
      for (const item of ord.items || []) {
        const key = item.product_id || item.product_code || item.product_name;
        if (!map[key]) {
          map[key] = {
            id: key,
            name: item.product_name,
            code: item.product_code,
            category: item.category || 'Cloth',
            quantity: 0,
            revenue: 0,
            unitPrice: Number(item.unit_price) || 0
          };
        }
        map[key].quantity += Number(item.quantity) || 1;
        map[key].revenue += Number(item.line_total) || 0;
        totalRevenue += Number(item.line_total) || 0;
      }
    }

    return Object.values(map)
      .map((p) => ({
        ...p,
        share: totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredOrders]);

  // 3. Payment Methods Breakdown
  const paymentStats = useMemo(() => {
    let cash = { total: 0, count: 0 };
    let card = { total: 0, count: 0 };
    let digital = { total: 0, count: 0 };
    let total = 0;

    for (const ord of filteredOrders) {
      if (ord.status === 'Voided') continue;
      const amt = Number(ord.total_amount) || 0;
      total += amt;
      const method = (ord.payment_method || '').toLowerCase();
      if (method.includes('card')) {
        card.total += amt;
        card.count += 1;
      } else if (method.includes('digital') || method.includes('qr') || method.includes('bank') || method.includes('online')) {
        digital.total += amt;
        digital.count += 1;
      } else {
        cash.total += amt;
        cash.count += 1;
      }
    }

    return {
      cash: { ...cash, share: total > 0 ? ((cash.total / total) * 100).toFixed(1) : '0' },
      card: { ...card, share: total > 0 ? ((card.total / total) * 100).toFixed(1) : '0' },
      digital: { ...digital, share: total > 0 ? ((digital.total / total) * 100).toFixed(1) : '0' },
      total
    };
  }, [filteredOrders]);

  // 4. Peak Sales Hours Analysis
  const hourlyStats = useMemo(() => {
    const buckets = [
      { id: 'morning', label: '🌅 Morning (09 AM – 01 PM)', count: 0, revenue: 0 },
      { id: 'afternoon', label: '☀️ Afternoon (01 PM – 05 PM)', count: 0, revenue: 0 },
      { id: 'evening', label: '🔥 Evening Rush (05 PM – 09 PM)', count: 0, revenue: 0 },
      { id: 'night', label: '🌙 Late Night (09 PM – 12 AM)', count: 0, revenue: 0 }
    ];

    let totalRev = 0;
    for (const ord of filteredOrders) {
      if (ord.status === 'Voided') continue;
      const date = new Date(ord.created_at);
      const hour = date.getHours();
      const amt = Number(ord.total_amount) || 0;
      totalRev += amt;

      if (hour >= 9 && hour < 13) {
        buckets[0].count += 1;
        buckets[0].revenue += amt;
      } else if (hour >= 13 && hour < 17) {
        buckets[1].count += 1;
        buckets[1].revenue += amt;
      } else if (hour >= 17 && hour < 21) {
        buckets[2].count += 1;
        buckets[2].revenue += amt;
      } else {
        buckets[3].count += 1;
        buckets[3].revenue += amt;
      }
    }

    const peak = [...buckets].sort((a, b) => b.revenue - a.revenue)[0];
    return {
      buckets: buckets.map(b => ({
        ...b,
        share: totalRev > 0 ? ((b.revenue / totalRev) * 100).toFixed(1) : '0'
      })),
      peakBucket: peak,
      totalRev
    };
  }, [filteredOrders]);

  // Daily Summary Stats for the selected date filter
  const dateStats = useMemo(() => {
    let totalVolume = 0;
    let cashSales = 0;
    let cardSales = 0;
    let digitalSales = 0;
    let totalVariance = 0;

    for (const s of filteredShifts) {
      cashSales += s.cash_sales || 0;
      cardSales += s.card_sales || 0;
      digitalSales += s.digital_sales || 0;
      totalVolume += (s.cash_sales || 0) + (s.card_sales || 0) + (s.digital_sales || 0);
      totalVariance += (s.variance || 0);
    }

    return {
      totalVolume,
      cashSales,
      cardSales,
      digitalSales,
      totalVariance,
      count: filteredShifts.length
    };
  }, [filteredShifts]);

  // Refresh shifts data
  const refreshShifts = () => {
    setActiveShift(posService.getActiveShift());
    setAllShifts(posService.getAllShifts());
    setAllOrders(posService.getAllOrders());
  };

  // Open Shift
  const handleOpenShift = async () => {
    const shift = await posService.openDayShift({
      businessDate: dayOpenDate,
      cashierName: currentCashierName,
      openingPettyCash: dayOpenPettyCash,
      cashIn: dayOpenCashIn,
      cashOut: dayOpenCashOut
    });
    refreshShifts();
    setIsOpenShiftModal(false);
    toast.success(`Day opened for ${dayOpenDate}! Opening Float: Rs. ${shift.opening_float.toLocaleString()}`);
  };

  // Close Shift & Produce Z-Report
  const handleCloseShift = async () => {
    if (!activeShift) return;
    const closed = await posService.closeDayShift({
      shiftId: activeShift.id,
      cashOut: dayCloseCashOut,
      cashIn: dayCloseCashIn,
      closingNotes: dayCloseNotes
    });
    refreshShifts();
    setIsCloseShiftModal(false);
    setSelectedZReport(closed);
    toast.success(`Day closed! Remaining Petty Cash: Rs. ${(closed.closing_petty_cash || 0).toLocaleString()} carried forward.`);
  };

  // Cash In / Cash Out
  const handleRecordMovement = () => {
    if (!activeShift) return;
    if (cashInOutAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    posService.recordCashMovement(activeShift.id, cashInOutType, cashInOutAmount);
    refreshShifts();
    setIsCashInOutModal(false);
    setCashInOutAmount(0);
    setCashInOutReason('');
    toast.success(`Cash ${cashInOutType.toUpperCase()} of Rs. ${cashInOutAmount.toLocaleString()} recorded`);
  };

  // Export Active Report to Excel
  const handleExportExcel = () => {
    let rows: any[] = [];
    let sheetName = 'POS_Report';
    let fileName = `POS_Report_${Date.now()}.xlsx`;

    if (activeTab === 'category') {
      sheetName = 'Category_Sales';
      fileName = `Category_Sales_Report_${Date.now()}.xlsx`;
      rows = categoryStats.list.map((c, i) => ({
        '#': i + 1,
        'Category Name': c.category,
        'Suits / Pieces Sold': c.quantity,
        'Gross Sales (Rs.)': c.revenue,
        '% Share of Total Sales': `${c.percentage}%`,
        'Average Item Price (Rs.)': c.averagePrice
      }));
    } else if (activeTab === 'top_items') {
      sheetName = 'Top_Fast_Movers';
      fileName = `Top_Fast_Movers_${Date.now()}.xlsx`;
      rows = topProductsStats.map((p, i) => ({
        'Rank': `#${i + 1}`,
        'Product Name': p.name,
        'SKU / Code': p.code,
        'Category': p.category,
        'Quantity Sold': p.quantity,
        'Unit Price (Rs.)': p.unitPrice,
        'Gross Revenue (Rs.)': p.revenue,
        '% Contribution': `${p.share}%`
      }));
    } else if (activeTab === 'payments') {
      sheetName = 'Payment_Methods';
      fileName = `Payment_Methods_Report_${Date.now()}.xlsx`;
      rows = [
        { 'Payment Method': 'Cash Sales', 'Total Amount (Rs.)': paymentStats.cash.total, 'Transaction Count': paymentStats.cash.count, '% Share': `${paymentStats.cash.share}%` },
        { 'Payment Method': 'Card Payments', 'Total Amount (Rs.)': paymentStats.card.total, 'Transaction Count': paymentStats.card.count, '% Share': `${paymentStats.card.share}%` },
        { 'Payment Method': 'Digital / QR Pay', 'Total Amount (Rs.)': paymentStats.digital.total, 'Transaction Count': paymentStats.digital.count, '% Share': `${paymentStats.digital.share}%` }
      ];
    } else if (activeTab === 'peak_hours') {
      sheetName = 'Peak_Hours';
      fileName = `Peak_Sales_Hours_${Date.now()}.xlsx`;
      rows = hourlyStats.buckets.map((b) => ({
        'Shopping Window': b.label,
        'Orders Count': b.count,
        'Total Revenue (Rs.)': b.revenue,
        '% Share of Day': `${b.share}%`
      }));
    } else if (activeTab === 'petty_cash') {
      sheetName = 'Petty_Cash';
      fileName = `Petty_Cash_Movement_${Date.now()}.xlsx`;
      rows = filteredShifts.map((s) => ({
        'Session #': s.session_number,
        'Date': s.business_date || new Date(s.opened_at).toLocaleDateString(),
        'Cashier': s.cashier_name,
        'Opening Petty Cash (Rs.)': s.opening_petty_cash ?? s.opening_float,
        'Daily Cash Sales (Rs.)': s.cash_sales,
        'Cash In (Rs.)': s.cash_in,
        'Cash Out / Drop (Rs.)': s.cash_out,
        'Closing Petty Cash Carried Forward (Rs.)': s.closing_petty_cash ?? '-',
        'Status': s.status
      }));
    } else {
      sheetName = 'Z_Report_Shifts';
      fileName = `POS_Shift_Sessions_${Date.now()}.xlsx`;
      rows = filteredShifts.map((s) => ({
        'Session #': s.session_number,
        'Cashier': s.cashier_name,
        'Date': s.business_date || new Date(s.opened_at).toLocaleDateString(),
        'Opening Float': s.opening_float,
        'Cash Sales': s.cash_sales,
        'Card Sales': s.card_sales,
        'Digital Sales': s.digital_sales,
        'Total Sales': s.cash_sales + s.card_sales + s.digital_sales,
        'Cash In': s.cash_in,
        'Cash Out': s.cash_out,
        'Closing Petty Cash': s.closing_petty_cash ?? '-',
        'Expected Cash': s.expected_cash,
        'Variance': s.variance ?? 0,
        'Status': s.status
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), fileName);
    toast.success(`Exported ${sheetName.replace(/_/g, ' ')} to Excel!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => { if (onBack) onBack(); else navigate('/pos/terminal'); }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Return to POS Terminal"
          >
            <LuArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <LuBarChart3 className="text-primary" />
              <span>POS Reports & Sales Dashboard</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Category sales, top fast-movers, payment breakdown, peak shopping hours, and daily Z-reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <LuFileSpreadsheet size={15} />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => { if (onBack) onBack(); else navigate('/pos/terminal'); }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            <MdPointOfSale size={16} />
            <span>{embedded ? 'Back to Cashier Register' : 'Launch POS Terminal'}</span>
          </button>
        </div>
      </div>

      {/* Report Navigation Tabs (Default Current Report placed FIRST!) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'zreport', label: 'Daily Z-Report & Shift Summary', badge: 'Default' },
          { id: 'category', label: 'Category-Wise Sales', badge: `${categoryStats.list.length} Cats` },
          { id: 'top_items', label: 'Top Fast-Movers', badge: `${topProductsStats.length} Items` },
          { id: 'payments', label: 'Payment Breakdown', badge: 'Cash & Digital' },
          { id: 'peak_hours', label: 'Peak Sales Trends', badge: 'Hourly' },
          { id: 'petty_cash', label: 'Petty Cash & Movement', badge: 'Audit' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'bg-white dark:bg-[#111622] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
              style={isActive ? { backgroundColor: accentColor } : undefined}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Global Date Filter & Unified KPI Bar (Applies to all reports) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <LuFilter className="text-primary" size={16} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Filter Reporting Period:
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold ml-2">
              {(['All', 'Today', 'Yesterday', 'Last7Days'] as const).map((mode) => {
                const label = mode === 'All' ? 'All Dates' : mode === 'Last7Days' ? '7 Days' : mode;
                const isSelected = dateFilter === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDateFilter(mode)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                      isSelected
                        ? 'shadow-xs text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    style={isSelected ? { backgroundColor: accentColor } : undefined}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            <LuCalendar size={14} className="text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium">Custom:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateFilter('Custom');
              }}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Global KPI Strip */}
        <div className="bg-slate-50 dark:bg-[#0c1017] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Gross Sales Revenue</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-base">
                Rs. {categoryStats.totalRevenue > 0 ? categoryStats.totalRevenue.toLocaleString() : dateStats.totalVolume.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Suits / Items Sold</span>
              <span className="font-extrabold text-slate-900 dark:text-white font-mono text-base">
                {categoryStats.totalPieces > 0 ? categoryStats.totalPieces : filteredOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0)} Pieces
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cash Collected</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-base">
                Rs. {paymentStats.cash.total > 0 ? paymentStats.cash.total.toLocaleString() : dateStats.cashSales.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Top Category</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                {categoryStats.list[0]?.category || 'Cloth Collection'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: DEFAULT CURRENT REPORT (DAILY Z-REPORT & SHIFT SUMMARY)
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'zreport' && (
        <div className="space-y-6">
          {/* Active Shift Overview Card */}
          {activeShift ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                    #{activeShift.session_number}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Current Active Shift
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                    OPEN
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Opened {new Date(activeShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by <strong className="text-slate-700 dark:text-slate-300">{activeShift.cashier_name}</strong>
                </p>
              </div>
            </div>

            {/* Quick Shift Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCashInOutType('in');
                  setIsCashInOutModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LuPlus size={14} />
                <span>Cash In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCashInOutType('out');
                  setIsCashInOutModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LuMinus size={14} />
                <span>Cash Out</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActualCountedCash(activeShift.expected_cash);
                  setIsCloseShiftModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <LuLock size={14} />
                <span>Close Shift (Z-Report)</span>
              </button>
            </div>
          </div>

          {/* Shift Financial Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-2">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Opening Float
              </span>
              <div className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-200 mt-1">
                Rs. {activeShift.opening_float.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                Cash Sales
              </span>
              <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                Rs. {activeShift.cash_sales.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                Card (POS) Sales
              </span>
              <div className="text-base font-extrabold font-mono text-sky-600 dark:text-sky-400 mt-1">
                Rs. {activeShift.card_sales.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                Digital / QR Sales
              </span>
              <div className="text-base font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-1">
                Rs. {activeShift.digital_sales.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cash Movement
              </span>
              <div className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 mt-1.5 flex items-center justify-between">
                <span className="text-emerald-500">+{activeShift.cash_in}</span>
                <span className="text-rose-500">-{activeShift.cash_out}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Expected in Drawer
              </span>
              <div className="text-base font-black font-mono text-amber-600 dark:text-amber-300 mt-1">
                Rs. {activeShift.expected_cash.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No active shift card */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl">
            <LuLock size={28} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Register Shift Currently Open
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Start a shift with your initial cash drawer float to record transactions and enable cash reconciliation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpenShiftModal(true)}
            className="px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white transition shadow-md cursor-pointer hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            Start New Register Shift
          </button>
        </div>
      )}

      {/* Shifts History & Daily Z-Report Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
        {/* Section Header with Date Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <LuClock className="text-primary" />
              <span>Shift Reconciliation & Daily Z-Report History</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Filter by date to view and reprint official daily register close summaries.
            </p>
          </div>

          {/* Date Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold">
              {(['All', 'Today', 'Yesterday', 'Last7Days'] as const).map((mode) => {
                const label = mode === 'All' ? 'All Dates' : mode === 'Last7Days' ? '7 Days' : mode;
                const isSelected = dateFilter === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDateFilter(mode)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                      isSelected
                        ? 'shadow-xs text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    style={isSelected ? { backgroundColor: accentColor } : undefined}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Picker */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
              <LuCalendar size={13} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter('Custom');
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Date Filter Summary KPI Strip */}
        <div className="bg-slate-50 dark:bg-[#0c1017] px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Filtered Sessions</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-sm">
                {dateStats.count} {dateStats.count === 1 ? 'Shift' : 'Shifts'}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Sales Volume</span>
              <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                Rs. {dateStats.totalVolume.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-500 block tracking-wider">Cash Sales</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                Rs. {dateStats.cashSales.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-500 block tracking-wider">Card / Digital</span>
              <span className="font-extrabold text-sky-600 dark:text-sky-400 font-mono text-sm">
                Rs. {(dateStats.cardSales + dateStats.digitalSales).toLocaleString()}
              </span>
            </div>
          </div>

          {dateFilter !== 'All' && (
            <button
              type="button"
              onClick={() => setDateFilter('All')}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              Reset to All Dates
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Session #</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Time Span</th>
                <th className="py-3 px-4">Opening Float</th>
                <th className="py-3 px-4">Cash Sales</th>
                <th className="py-3 px-4">Total Shift Volume</th>
                <th className="py-3 px-4">Variance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Z-Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <LuCalendar className="mx-auto text-2xl mb-2 opacity-40" />
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No shift sessions found for this date.</p>
                    <p className="text-xs text-slate-400 mt-1">Try selecting another date or click "All Dates".</p>
                  </td>
                </tr>
              ) : (
                filteredShifts.map((s) => {
                const totalVol = s.cash_sales + s.card_sales + s.digital_sales;
                const isClosed = s.status === 'Closed';

                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      #{s.session_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {s.cashier_name}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <div>{new Date(s.opened_at).toLocaleDateString()}</div>
                      <div className="font-mono">
                        {new Date(s.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {s.closed_at ? new Date(s.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Open'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      Rs. {s.opening_float.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Rs. {s.cash_sales.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {totalVol.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {s.variance !== undefined ? (
                        <span className={s.variance === 0 ? 'text-emerald-500' : s.variance > 0 ? 'text-blue-500' : 'text-rose-500'}>
                          {s.variance >= 0 ? `+${s.variance}` : s.variance}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isClosed ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isClosed ? (
                        <button
                          type="button"
                          onClick={() => setSelectedZReport(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <LuFileText size={13} />
                          <span>View Slip</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Active</span>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 2: CATEGORY-WISE SALES REPORT
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'category' && (
        <div className="space-y-6">
          {/* Category Progress Bar */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <LuPieChart size={16} className="text-primary" />
                <span>Category Sales Distribution (% of Total Business)</span>
              </span>
              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                Total: Rs. {categoryStats.totalRevenue.toLocaleString()}
              </span>
            </div>

            {/* Multi-colored Visual Distribution Bar */}
            <div className="h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              {categoryStats.list.map((c, i) => {
                const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500'];
                return (
                  <div
                    key={c.category}
                    style={{ width: `${c.percentage}%` }}
                    className={`${colors[i % colors.length]} transition-all duration-500`}
                    title={`${c.category}: ${c.percentage}% (Rs. ${c.revenue.toLocaleString()})`}
                  />
                );
              })}
            </div>

            {/* Category Badges Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {categoryStats.list.map((c, i) => {
                const dotColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-purple-500'];
                return (
                  <div key={c.category} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColors[i % dotColors.length]}`} />
                    <span>{c.category}</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{c.percentage}%</strong>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.list.map((c, i) => (
              <div
                key={c.category}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 shadow-sm space-y-4 hover:border-primary/40 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      #{i + 1}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {c.category}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {c.ordersCount} sales ticket(s)
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {c.percentage}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Sales</span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                      Rs. {c.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Suits Sold</span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                      {c.quantity} Suits
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Average Selling Price:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">Rs. {c.averagePrice.toLocaleString()}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Category Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <LuTag className="text-primary" />
                <span>Detailed Category Sales Breakdown</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {categoryStats.list.length} Categories Analyzed
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4"># Rank</th>
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Suits / Pieces Sold</th>
                    <th className="py-3 px-4">Gross Revenue (PKR)</th>
                    <th className="py-3 px-4">% Share of Sales</th>
                    <th className="py-3 px-4">Average Price / Suit</th>
                    <th className="py-3 px-4 text-right">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {categoryStats.list.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No category sales recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    categoryStats.list.map((c, i) => (
                      <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold font-mono">#{i + 1}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                          {c.category}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">{c.quantity} Suits</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Rs. {c.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-primary">
                          {c.percentage}%
                        </td>
                        <td className="py-3 px-4 font-mono">Rs. {c.averagePrice.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            i === 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {i === 0 ? '🏆 Top Category' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 3: TOP FAST-MOVING ITEMS
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'top_items' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <LuTrendingUp className="text-emerald-500" />
                <span>Top Fast-Moving Boutique Items</span>
              </h3>
              <span className="text-xs text-slate-400">Ranked by volume & revenue</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Article / Product Name</th>
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Suits Sold</th>
                    <th className="py-3 px-4">Retail Price</th>
                    <th className="py-3 px-4">Total Revenue</th>
                    <th className="py-3 px-4 text-right">Revenue Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {topProductsStats.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No product sales recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    topProductsStats.map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold font-mono">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${
                            i === 0 ? 'bg-amber-500 text-white font-black' : i === 1 ? 'bg-slate-300 text-slate-800 font-bold' : i === 2 ? 'bg-amber-700 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                          }`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{p.code}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {p.quantity} Suits
                        </td>
                        <td className="py-3 px-4 font-mono">Rs. {p.unitPrice.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Rs. {p.revenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                          {p.share}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 4: PAYMENT METHODS BREAKDOWN
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cash Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <LuBanknote size={18} />
                  <span>Cash Payments</span>
                </span>
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  {paymentStats.cash.share}%
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                Rs. {paymentStats.cash.total.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {paymentStats.cash.count} transaction(s) recorded in cash drawer
              </div>
            </div>

            {/* Card Card */}
            <div className="rounded-2xl border border-sky-500/30 bg-sky-50/20 dark:bg-sky-950/10 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-2">
                  <LuCreditCard size={18} />
                  <span>Debit / Credit Cards</span>
                </span>
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-sky-500 text-white">
                  {paymentStats.card.share}%
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                Rs. {paymentStats.card.total.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {paymentStats.card.count} transaction(s) settled via card POS machine
              </div>
            </div>

            {/* Digital / QR Card */}
            <div className="rounded-2xl border border-purple-500/30 bg-purple-50/20 dark:bg-purple-950/10 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <LuQrCode size={18} />
                  <span>Digital / QR Pay</span>
                </span>
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-purple-500 text-white">
                  {paymentStats.digital.share}%
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                Rs. {paymentStats.digital.total.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {paymentStats.digital.count} transaction(s) via Raast, JazzCash, or Nayapay
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 5: PEAK SALES TRENDS & HOURLY SHOPPING RUSH
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'peak_hours' && (
        <div className="space-y-6">
          {/* Peak Shopping Highlight Banner */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10 p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                <LuClock size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Busiest Retail Shopping Window
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <strong>{hourlyStats.peakBucket?.label || 'Evening Rush'}</strong> generates the highest sales revenue.
                </p>
              </div>
            </div>
            <span className="text-sm font-black font-mono text-amber-600">
              Rs. {(hourlyStats.peakBucket?.revenue || 0).toLocaleString()}
            </span>
          </div>

          {/* Time Windows Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {hourlyStats.buckets.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 shadow-sm space-y-3"
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {b.label}
                </span>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  Rs. {b.revenue.toLocaleString()}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{b.count} Orders</span>
                  <span className="font-bold text-primary font-mono">{b.share}% of Sales</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${b.share}%` }}
                    className="h-full bg-primary transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 6: PETTY CASH & DRAWER MOVEMENT SUMMARY
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'petty_cash' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 shadow-sm space-y-2">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <LuCoins className="text-amber-500" />
              <span>Petty Cash Accounting & Carry Forward Flow</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formula: <strong className="text-slate-800 dark:text-slate-200">The Sale - Cash Out + Cash In + Opening Petty Cash = Remaining Petty Cash</strong>. This remaining cash is automatically saved and auto-fills tomorrow morning's Day Open.
            </p>
          </div>

          {/* Petty Cash Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Session #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Cashier</th>
                    <th className="py-3 px-4">Opening Petty Cash</th>
                    <th className="py-3 px-4">Daily Cash Sales</th>
                    <th className="py-3 px-4">Cash Out (Drop)</th>
                    <th className="py-3 px-4">Cash In</th>
                    <th className="py-3 px-4">Closing Petty Cash (Carried Over)</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No shift movements found for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredShifts.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold font-mono">#{s.session_number}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {s.business_date || new Date(s.opened_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-medium">{s.cashier_name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {(s.opening_petty_cash ?? s.opening_float).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          Rs. {s.cash_sales.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-rose-500 font-bold">
                          Rs. {(s.cash_out || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-500 font-bold">
                          Rs. {(s.cash_in || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-amber-600 dark:text-amber-400">
                          {s.closing_petty_cash !== undefined ? `Rs. ${s.closing_petty_cash.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'Closed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Day Open Modal */}
      {isOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <LuUnlock className="text-emerald-500" size={18} />
                <span>Day Open (Petty Cash & Initial Change)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenShiftModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Date Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Business Date:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Select Operating Day</span>
                </label>
                <input
                  type="date"
                  value={dayOpenDate}
                  onChange={(e) => setDayOpenDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Opening Petty Cash */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Opening Petty Cash (Rs.):</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Auto-filled from last close
                  </span>
                </label>
                <input
                  type="number"
                  value={dayOpenPettyCash || ''}
                  onChange={(e) => setDayOpenPettyCash(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Cash In */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Cash In (Rs.):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Drawer change / extra cash</span>
                </label>
                <input
                  type="number"
                  value={dayOpenCashIn || ''}
                  onChange={(e) => setDayOpenCashIn(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Cash Out (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Cash Out (Optional) (Rs.):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Initial withdrawal if any</span>
                </label>
                <input
                  type="number"
                  value={dayOpenCashOut || ''}
                  onChange={(e) => setDayOpenCashOut(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Calculated Starting Balance Card */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Calculated Starting Drawer Float
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  Rs. {((Number(dayOpenPettyCash) || 0) + (Number(dayOpenCashIn) || 0) - (Number(dayOpenCashOut) || 0)).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Petty Cash (Rs. {Number(dayOpenPettyCash).toLocaleString()}) + Cash In (Rs. {Number(dayOpenCashIn).toLocaleString()}) - Cash Out (Rs. {Number(dayOpenCashOut).toLocaleString()})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpenShiftModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOpenShift}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer hover:opacity-90 bg-emerald-600 hover:bg-emerald-700"
              >
                Open Day Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Close Modal */}
      {isCloseShiftModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <LuLock className="text-rose-500" size={18} />
                <span>Day Close & Petty Cash Carry Forward</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCloseShiftModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Closing Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Closing Date:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Day being closed</span>
                </label>
                <input
                  type="date"
                  value={dayCloseDate}
                  onChange={(e) => setDayCloseDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Day Figures Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Today's Cash Sales
                  </span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    Rs. {(activeShift.cash_sales || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Opening Petty Cash
                  </span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                    Rs. {(activeShift.opening_petty_cash ?? activeShift.opening_float ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Cash Out Input (Sales Collection / Bank Deposit) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Cash Out (Owner Payout / Bank Deposit) (Rs.):</span>
                  <span className="text-[10px] text-rose-500 font-bold">Subtracted (-)</span>
                </label>
                <input
                  type="number"
                  value={dayCloseCashOut || ''}
                  onChange={(e) => setDayCloseCashOut(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Cash In Input (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Cash In (Optional) (Rs.):</span>
                  <span className="text-[10px] text-emerald-500 font-bold">Added (+)</span>
                </label>
                <input
                  type="number"
                  value={dayCloseCashIn || ''}
                  onChange={(e) => setDayCloseCashIn(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Formula & Remaining Petty Cash Card */}
              {(() => {
                const sales = activeShift.cash_sales || 0;
                const openPetty = activeShift.opening_petty_cash ?? activeShift.opening_float ?? 0;
                const remainingPetty = Math.max(0, sales - (Number(dayCloseCashOut) || 0) + (Number(dayCloseCashIn) || 0) + openPetty);
                return (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Calculated Closing Petty Cash (Carried to Next Day)
                    </span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      Rs. {remainingPetty.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Sale (Rs. {sales.toLocaleString()}) - Cash Out (Rs. {Number(dayCloseCashOut).toLocaleString()}) + Cash In (Rs. {Number(dayCloseCashIn).toLocaleString()}) + Opening Petty (Rs. {openPetty.toLocaleString()})
                    </div>
                  </div>
                );
              })()}

              {/* Closing Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Closing Notes (Optional):
                </label>
                <input
                  type="text"
                  value={dayCloseNotes}
                  onChange={(e) => setDayCloseNotes(e.target.value)}
                  placeholder="e.g. End of day reconciliation by Alex"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCloseShiftModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseShift}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer hover:opacity-90 bg-rose-600 hover:bg-rose-700"
              >
                Confirm & Close Day
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: CASH IN / CASH OUT MODAL
         ───────────────────────────────────────────────────────────── */}
      {isCashInOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Record Cash {cashInOutType === 'in' ? 'In (+)' : 'Out (-)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCashInOutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amount (Rs.):
                </label>
                <input
                  type="number"
                  value={cashInOutAmount || ''}
                  onChange={(e) => setCashInOutAmount(Number(e.target.value) || 0)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reason / Description:
                </label>
                <input
                  type="text"
                  value={cashInOutReason}
                  onChange={(e) => setCashInOutReason(e.target.value)}
                  placeholder="e.g. Petty cash / vendor payment"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCashInOutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordMovement}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: Z-REPORT THERMAL SLIP PREVIEW
         ───────────────────────────────────────────────────────────── */}
      {selectedZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <LuFileText className="text-primary" />
                <span>Daily Z-Report Slip #{selectedZReport.session_number}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedZReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Thermal Print Receipt */}
            <div className="bg-white text-black p-4 rounded-sm font-mono text-xs space-y-2 border border-slate-300 shadow-sm">
              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-black">
                <h4 className="font-extrabold text-sm uppercase">{posConfig.store_title}</h4>
                <p className="text-[10px]">DAILY Z-REPORT • CASHIER CLOSE</p>
                <p className="text-[10px]">Terminal: {selectedZReport.terminal_code}</p>
                <p className="text-[10px]">Cashier: {selectedZReport.cashier_name}</p>
              </div>

              <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Session:</span>
                  <span className="font-bold">#{selectedZReport.session_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Opened:</span>
                  <span>{new Date(selectedZReport.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closed:</span>
                  <span>{selectedZReport.closed_at ? new Date(selectedZReport.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Open'}</span>
                </div>
              </div>

              {/* Financial Tenders */}
              <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>Rs. {selectedZReport.opening_float.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales:</span>
                  <span>Rs. {selectedZReport.cash_sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Sales:</span>
                  <span>Rs. {selectedZReport.card_sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Digital / QR Sales:</span>
                  <span>Rs. {selectedZReport.digital_sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash In / Out:</span>
                  <span>+{selectedZReport.cash_in} / -{selectedZReport.cash_out}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-dotted border-black">
                  <span>TOTAL SALES VOLUME:</span>
                  <span>Rs. {(selectedZReport.cash_sales + selectedZReport.card_sales + selectedZReport.digital_sales).toLocaleString()}</span>
                </div>
              </div>

              {/* Reconciliation Balance */}
              <div className="py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Expected Drawer Cash:</span>
                  <span>Rs. {selectedZReport.expected_cash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Actual Counted:</span>
                  <span>Rs. {(selectedZReport.actual_counted_cash ?? selectedZReport.expected_cash).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold text-xs">
                  <span>Cash Variance:</span>
                  <span>{selectedZReport.variance ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedZReport(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                <LuPrinter size={14} />
                <span>Print Z-Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSRegister;

