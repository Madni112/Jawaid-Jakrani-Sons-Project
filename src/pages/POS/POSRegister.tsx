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
  LuFilter
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import { getSavedAccentColor, getContrastTextColor } from '../../constant/themeConfig';
import { posService, PosShift, PosSettings } from '../../service/posService';

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
  const [newOpeningFloat, setNewOpeningFloat] = useState<number>(20000);

  const [isCloseShiftModal, setIsCloseShiftModal] = useState<boolean>(false);
  const [actualCountedCash, setActualCountedCash] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>('');

  const [isCashInOutModal, setIsCashInOutModal] = useState<boolean>(false);
  const [cashInOutType, setCashInOutType] = useState<'in' | 'out'>('in');
  const [cashInOutAmount, setCashInOutAmount] = useState<number>(0);
  const [cashInOutReason, setCashInOutReason] = useState<string>('');

  const [selectedZReport, setSelectedZReport] = useState<PosShift | null>(null);

  // Date Filter State for Daily Summary & Z-Reports
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
  };

  // Open Shift
  const handleOpenShift = async () => {
    if (newOpeningFloat < 0) {
      toast.error('Float cannot be negative');
      return;
    }
    const shift = await posService.openShift(currentCashierName, newOpeningFloat);
    refreshShifts();
    setIsOpenShiftModal(false);
    toast.success(`Shift #${shift.session_number} started with Rs. ${newOpeningFloat.toLocaleString()} float!`);
  };

  // Close Shift & Produce Z-Report
  const handleCloseShift = async () => {
    if (!activeShift) return;
    const closed = await posService.closeShift(activeShift.id, actualCountedCash, closingNotes);
    refreshShifts();
    setIsCloseShiftModal(false);
    setSelectedZReport(closed);
    toast.success(`Shift #${closed.session_number} closed. Z-Report generated!`);
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

  // Export Shifts to Excel
  const handleExportExcel = () => {
    const rows = allShifts.map((s) => ({
      'Session #': s.session_number,
      'Cashier': s.cashier_name,
      'Opened At': new Date(s.opened_at).toLocaleString(),
      'Closed At': s.closed_at ? new Date(s.closed_at).toLocaleString() : 'In Progress',
      'Opening Float': s.opening_float,
      'Cash Sales': s.cash_sales,
      'Card Sales': s.card_sales,
      'Digital Sales': s.digital_sales,
      'Total Sales': s.cash_sales + s.card_sales + s.digital_sales,
      'Cash In': s.cash_in,
      'Cash Out': s.cash_out,
      'Expected Cash': s.expected_cash,
      'Actual Counted': s.actual_counted_cash ?? '-',
      'Variance': s.variance ?? 0,
      'Status': s.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'POS_Shifts');
    const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `POS_Shift_Sessions_${Date.now()}.xlsx`);
    toast.success('Shifts exported to Excel');
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
              <LuBanknote className="text-emerald-500" />
              <span>Cash Register & Shift Reconciliation</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control register float, cash-in/out drops, and print daily end-of-shift Z-Reports.
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: OPEN SHIFT MODAL
         ───────────────────────────────────────────────────────────── */}
      {isOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <LuUnlock className="text-emerald-500" />
                <span>Open Register Shift</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenShiftModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Opening Cash Float in Drawer (Rs.):
                </label>
                <input
                  type="number"
                  value={newOpeningFloat}
                  onChange={(e) => setNewOpeningFloat(Number(e.target.value) || 0)}
                  placeholder="e.g. 20000"
                  className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Quick Float Shortcuts */}
              <div className="grid grid-cols-3 gap-2">
                {[10000, 20000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setNewOpeningFloat(amt)}
                    className="py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Rs. {amt.toLocaleString()}
                  </button>
                ))}
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
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                Open Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: CLOSE SHIFT WITH RECONCILIATION & Z-REPORT
         ───────────────────────────────────────────────────────────── */}
      {isCloseShiftModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <LuLock className="text-amber-500" />
                <span>Close Shift & Cash Reconciliation</span>
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
              {/* Expected vs Actual Count */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    System Calculated Cash
                  </span>
                  <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    Rs. {activeShift.expected_cash.toLocaleString()}
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Float + Sales + In - Out
                </span>
              </div>

              {/* Actual Count Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Actual Physical Cash Counted in Drawer (Rs.):
                </label>
                <input
                  type="number"
                  value={actualCountedCash || ''}
                  onChange={(e) => setActualCountedCash(Number(e.target.value) || 0)}
                  placeholder="Enter counted cash"
                  className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Live Variance Calculation */}
              {(() => {
                const variance = actualCountedCash - activeShift.expected_cash;
                return (
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    variance === 0
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : variance > 0
                      ? 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
                  }`}>
                    <span className="text-xs font-bold">
                      {variance === 0 ? '✓ Balanced' : variance > 0 ? 'Cash Surplus (Over)' : 'Cash Shortage'}
                    </span>
                    <span className="text-sm font-black font-mono">
                      {variance >= 0 ? `+ Rs. ${variance.toLocaleString()}` : `- Rs. ${Math.abs(variance).toLocaleString()}`}
                    </span>
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
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
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
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                Confirm & Close Shift
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

