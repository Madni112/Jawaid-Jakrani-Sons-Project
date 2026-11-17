import { createPortal } from 'react-dom';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LuBanknote,
  LuStore,
  LuChevronDown,
  LuCheck,
  LuSearch,
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
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import { getSavedAccentColor, getContrastTextColor } from '../../constant/themeConfig';
import { posService, PosShift, PosSettings, PosOrder, PosTerminalCounter } from '../../service/posService';
import { RegisterKpiBar } from './register/components/RegisterKpiBar';
import { ActiveShiftCard } from './register/components/ActiveShiftCard';
import { ZReportTab } from './register/tabs/ZReportTab';
import { CategoryReportTab } from './register/tabs/CategoryReportTab';
import { TopItemsTab } from './register/tabs/TopItemsTab';
import { PaymentsTab } from './register/tabs/PaymentsTab';
import { PeakHoursTab } from './register/tabs/PeakHoursTab';
import { PettyCashTab } from './register/tabs/PettyCashTab';
import { DayOpenModal } from './register/modals/DayOpenModal';
import { DayCloseModal } from './register/modals/DayCloseModal';
import { CashInOutModal } from './register/modals/CashInOutModal';
import { MergedSlipModal } from './register/modals/MergedSlipModal';
import { ZReportModal } from './register/modals/ZReportModal';

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
  const isAccentWhite = accentColor.toLowerCase() === '#ffffff' || accentColor.toLowerCase() === '#fff';

  const [posConfig] = useState<PosSettings>(() => posService.getSettings());
  const [activeShift, setActiveShift] = useState<PosShift | null>(() => posService.getActiveShift());
  const [allShifts, setAllShifts] = useState<PosShift[]>(() => posService.getAllShifts());

  // Modal States
  const [isOpenShiftModal, setIsOpenShiftModal] = useState<boolean>(false);
  const [dayOpenDate, setDayOpenDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dayOpenPettyCash, setDayOpenPettyCash] = useState<number>(() => posService.getLastClosingPettyCash());
  const [dayOpenCashIn, setDayOpenCashIn] = useState<number>(0);
  const [dayOpenCashOut, setDayOpenCashOut] = useState<number>(0);
  const [pettyCashSource, setPettyCashSource] = useState<string>(() => {
    const lookup = posService.getPettyCashForDate(new Date().toISOString().split('T')[0]);
    return lookup.isFound ? `Auto-filled from ${lookup.foundDate} close` : 'Manual start / First day';
  });

  const handleDayOpenDateChange = (newDate: string) => {
    setDayOpenDate(newDate);
    const lookup = posService.getPettyCashForDate(newDate);
    setDayOpenPettyCash(lookup.amount);
    setPettyCashSource(lookup.isFound ? `Auto-filled from ${lookup.foundDate} close` : 'No prior shift before this date (enter manually)');
  };

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

  const { posSlug } = useParams<{ posSlug?: string }>();
  const currentTerminalSlug = (posSlug || 'pos1').toLowerCase();
  const loggedInCashier = posService.getLoggedInCashier(currentTerminalSlug);
  const currentCashierName = loggedInCashier?.name || userEmail?.split('@')[0] || 'Alex Rivera';

  // Counter & Cashier Filter State
  const [selectedCounter, setSelectedCounter] = useState<string>('All');
  const [selectedCashierFilter, setSelectedCashierFilter] = useState<string>('All');
  const [isMergedSlipOpen, setIsMergedSlipOpen] = useState(false);
  const [terminalsList] = useState<PosTerminalCounter[]>(() => posService.getTerminals());

  // Searchable Counter Dropdown State
  const [isCounterDropdownOpen, setIsCounterDropdownOpen] = useState(false);
  const [counterSearchQuery, setCounterSearchQuery] = useState('');
  const counterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (counterDropdownRef.current && !counterDropdownRef.current.contains(e.target as Node)) {
        setIsCounterDropdownOpen(false);
      }
    };
    if (isCounterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCounterDropdownOpen]);

  // Filtered terminals for the searchable dropdown list
  const filteredTerminalsList = useMemo(() => {
    if (!counterSearchQuery.trim()) return terminalsList;
    const q = counterSearchQuery.toLowerCase();
    return terminalsList.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.slug.toLowerCase().includes(q) || 
      (t.location && t.location.toLowerCase().includes(q))
    );
  }, [terminalsList, counterSearchQuery]);

  // Helper to normalize counter names e.g. "Register 01 (Main Counter)" -> "register 01"
  const cleanCounterKey = (name?: string) => (name || '').toLowerCase().replace(/\s*\(.*?\)/g, '').trim();

  // Helper to normalize cashier names e.g. "Uzair Jibran" vs "uzairjibran"
  const normCashierName = (name?: string) => (name || '').toLowerCase().replace(/[\s._-]+/g, '');

  // Helper to match any shift terminal_code to a configured terminal name
  const resolveTerminalName = (shiftTermCode?: string): string => {
    if (!shiftTermCode) return terminalsList[0]?.name || 'Register 01';
    const targetClean = cleanCounterKey(shiftTermCode);
    const matched = terminalsList.find(t => 
      cleanCounterKey(t.name) === targetClean ||
      t.slug.toLowerCase() === shiftTermCode.toLowerCase() ||
      t.name.toLowerCase().includes(shiftTermCode.toLowerCase()) ||
      shiftTermCode.toLowerCase().includes(t.name.toLowerCase())
    );
    return matched ? matched.name : shiftTermCode;
  };

  // Helper to calculate cashier-wise sales breakdown for any shift
  const getShiftCashierBreakdown = (shift: POSShift) => {
    const slipOrders = allOrders.filter(o => 
      o.status !== 'Voided' &&
      (o.shift_id === shift.id || (shift.business_date && o.created_at.startsWith(shift.business_date)))
    );

    const map = new Map<string, {
      name: string;
      total: number;
      cash: number;
      card: number;
      digital: number;
      ordersCount: number;
    }>();

    slipOrders.forEach(ord => {
      const rawName = ord.cashier_name || shift.cashier_name || 'Cashier';
      const normKey = normCashierName(rawName);
      if (!map.has(normKey)) {
        map.set(normKey, {
          name: rawName,
          total: 0,
          cash: 0,
          card: 0,
          digital: 0,
          ordersCount: 0
        });
      }
      const entry = map.get(normKey)!;
      const amt = Number(ord.total_amount) || 0;
      entry.total += amt;
      entry.ordersCount += 1;
      const method = (ord.payment_method || '').toLowerCase();
      if (method.includes('card')) {
        entry.card += amt;
      } else if (method.includes('digital') || method.includes('qr') || method.includes('bank') || method.includes('online')) {
        entry.digital += amt;
      } else {
        entry.cash += amt;
      }
    });

    // Check shift total sales vs orders sum
    const totalShiftSales = (shift.cash_sales || 0) + (shift.card_sales || 0) + (shift.digital_sales || 0);
    const totalOrdersSales = Array.from(map.values()).reduce((sum, e) => sum + e.total, 0);
    const remainder = Math.max(0, totalShiftSales - totalOrdersSales);

    if (remainder > 0 || map.size === 0) {
      const shiftOwnerKey = normCashierName(shift.cashier_name);
      if (!map.has(shiftOwnerKey)) {
        map.set(shiftOwnerKey, {
          name: shift.cashier_name || 'Cashier',
          total: 0,
          cash: 0,
          card: 0,
          digital: 0,
          ordersCount: 0
        });
      }
      const ownerEntry = map.get(shiftOwnerKey)!;
      ownerEntry.total += remainder;
      const remainingCash = Math.max(0, (shift.cash_sales || 0) - Array.from(map.values()).reduce((sum, e) => e === ownerEntry ? 0 : sum + e.cash, 0));
      const remainingCard = Math.max(0, (shift.card_sales || 0) - Array.from(map.values()).reduce((sum, e) => e === ownerEntry ? 0 : sum + e.card, 0));
      const remainingDigital = Math.max(0, (shift.digital_sales || 0) - Array.from(map.values()).reduce((sum, e) => e === ownerEntry ? 0 : sum + e.digital, 0));
      ownerEntry.cash += remainingCash;
      ownerEntry.card += remainingCard;
      ownerEntry.digital += remainingDigital;
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  };

  // Filtered Shifts by Date, Selected Counter, and Selected Cashier
  const filteredShifts = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    return allShifts.filter((s) => {
      const shiftDate = new Date(s.opened_at);
      const shiftDateStr = shiftDate.toISOString().split('T')[0];

      if (dateFilter === 'Today' && shiftDateStr !== todayStr) return false;
      if (dateFilter === 'Yesterday' && shiftDateStr !== yesterdayStr) return false;
      if (dateFilter === 'Last7Days' && shiftDate < sevenDaysAgo) return false;
      if (dateFilter === 'Custom' && shiftDateStr !== customDate) return false;

      // Filter by Counter (normalized via posService.matchesTerminal)
      if (selectedCounter !== 'All') {
        if (!posService.matchesTerminal(s.terminal_code, selectedCounter)) {
          return false;
        }
      }

      // Filter by Cashier (matches opener or any cashier who made sales during this shift)
      if (selectedCashierFilter !== 'All') {
        const matchesOpener = normCashierName(s.cashier_name) === normCashierName(selectedCashierFilter);
        const hasCashierOrder = allOrders.some(o => 
          (o.shift_id === s.id || (s.business_date && o.created_at.startsWith(s.business_date))) &&
          normCashierName(o.cashier_name) === normCashierName(selectedCashierFilter)
        );
        if (!matchesOpener && !hasCashierOrder) {
          return false;
        }
      }

      return true;
    });
  }, [allShifts, dateFilter, customDate, selectedCounter, selectedCashierFilter, terminalsList]);

  // Cashier Performance Cards: Dynamically scoped to Selected Counter & Date Filter
  const { cashierCards, scopeTotalSales, scopeShiftsCount } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    // Shifts matching Date AND selected Counter
    const scopedShifts = allShifts.filter((s) => {
      const shiftDate = new Date(s.opened_at);
      const shiftDateStr = shiftDate.toISOString().split('T')[0];
      const bDate = s.business_date || shiftDateStr;

      if (dateFilter === 'Today' && bDate !== todayStr) return false;
      if (dateFilter === 'Yesterday' && bDate !== yesterdayStr) return false;
      if (dateFilter === 'Last7Days' && shiftDate < sevenDaysAgo) return false;
      if (dateFilter === 'Custom' && bDate !== customDate) return false;

      if (selectedCounter !== 'All') {
        const canonicalName = resolveTerminalName(s.terminal_code);
        if (cleanCounterKey(canonicalName) !== cleanCounterKey(selectedCounter)) {
          return false;
        }
      }
      return true;
    });

    // Orders matching Date AND selected Counter
    const scopedOrders = allOrders.filter((ord) => {
      if (ord.status === 'Voided') return false;
      const orderDate = new Date(ord.created_at);
      const orderDateStr = orderDate.toISOString().split('T')[0];

      if (dateFilter === 'Today' && orderDateStr !== todayStr) return false;
      if (dateFilter === 'Yesterday' && orderDateStr !== yesterdayStr) return false;
      if (dateFilter === 'Last7Days' && orderDate < sevenDaysAgo) return false;
      if (dateFilter === 'Custom' && orderDateStr !== customDate) return false;

      if (selectedCounter !== 'All') {
        const canonicalName = resolveTerminalName(ord.terminal_code);
        if (cleanCounterKey(canonicalName) !== cleanCounterKey(selectedCounter)) {
          return false;
        }
      }
      return true;
    });

    // Determine which cashiers to display:
    const map = new Map<string, { cashierName: string; role?: string; avatarColor?: string; shiftsCount: number; totalSales: number; cashSales: number; cardSales: number }>();

    if (selectedCounter !== 'All') {
      const activeTerm = terminalsList.find(t => cleanCounterKey(t.name) === cleanCounterKey(selectedCounter));
      (activeTerm?.assigned_cashiers || []).forEach(c => {
        const normKey = normCashierName(c.name);
        map.set(normKey, {
          cashierName: c.name,
          role: c.role,
          avatarColor: c.avatar_color,
          shiftsCount: 0,
          totalSales: 0,
          cashSales: 0,
          cardSales: 0
        });
      });
    } else {
      terminalsList.forEach(t => {
        (t.assigned_cashiers || []).forEach(c => {
          const normKey = normCashierName(c.name);
          if (!map.has(normKey)) {
            map.set(normKey, {
              cashierName: c.name,
              role: c.role,
              avatarColor: c.avatar_color,
              shiftsCount: 0,
              totalSales: 0,
              cashSales: 0,
              cardSales: 0
            });
          }
        });
      });
    }

    // Include any cashiers from orders
    scopedOrders.forEach(o => {
      const normKey = normCashierName(o.cashier_name);
      if (!map.has(normKey)) {
        map.set(normKey, {
          cashierName: o.cashier_name || 'Cashier',
          shiftsCount: 0,
          totalSales: 0,
          cashSales: 0,
          cardSales: 0
        });
      }
    });

    // Include any cashiers from shifts
    scopedShifts.forEach(s => {
      const normKey = normCashierName(s.cashier_name);
      if (!map.has(normKey)) {
        map.set(normKey, {
          cashierName: s.cashier_name || 'Cashier',
          shiftsCount: 0,
          totalSales: 0,
          cashSales: 0,
          cardSales: 0
        });
      }
    });

    // Populate shift counts
    scopedShifts.forEach(s => {
      const normKey = normCashierName(s.cashier_name);
      const entry = map.get(normKey);
      if (entry) {
        entry.shiftsCount += 1;
      }
    });

    // Aggregate individual completed sales directly per cashier!
    let totalVolume = 0;
    if (scopedOrders.length > 0) {
      scopedOrders.forEach(ord => {
        const normKey = normCashierName(ord.cashier_name);
        const entry = map.get(normKey);
        const amt = Number(ord.total_amount) || 0;
        totalVolume += amt;
        if (entry) {
          entry.totalSales += amt;
          const method = (ord.payment_method || '').toLowerCase();
          if (method.includes('card')) {
            entry.cardSales += amt;
          } else {
            entry.cashSales += amt;
          }
        }
      });
    } else {
      scopedShifts.forEach(s => {
        const normKey = normCashierName(s.cashier_name);
        const entry = map.get(normKey);
        const vol = (s.cash_sales || 0) + (s.card_sales || 0) + (s.digital_sales || 0);
        totalVolume += vol;
        if (entry) {
          entry.totalSales += vol;
          entry.cashSales += (s.cash_sales || 0);
          entry.cardSales += (s.card_sales || 0) + (s.digital_sales || 0);
        }
      });
    }

    return {
      cashierCards: Array.from(map.values()),
      scopeTotalSales: totalVolume,
      scopeShiftsCount: scopedShifts.length
    };
  }, [allShifts, allOrders, dateFilter, customDate, selectedCounter, terminalsList]);

  // Hierarchical Breakdown: Counter-wise -> Cashier-wise
  const hierarchicalBreakdown = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    // Shifts matching date
    const dateShifts = allShifts.filter((s) => {
      const shiftDate = new Date(s.opened_at);
      const shiftDateStr = shiftDate.toISOString().split('T')[0];

      if (dateFilter === 'Today') return shiftDateStr === todayStr;
      if (dateFilter === 'Yesterday') return shiftDateStr === yesterdayStr;
      if (dateFilter === 'Last7Days') return shiftDate >= sevenDaysAgo;
      if (dateFilter === 'Custom') return shiftDateStr === customDate;
      return true;
    });

    // Select which terminals to include
    const targetTerminals = selectedCounter === 'All'
      ? terminalsList
      : terminalsList.filter(t => cleanCounterKey(t.name) === cleanCounterKey(selectedCounter));

    return targetTerminals.map(term => {
      // Shifts on this terminal
      const termShifts = dateShifts.filter(s => 
        cleanCounterKey(resolveTerminalName(s.terminal_code)) === cleanCounterKey(term.name)
      );

      // Collect all cashiers for this counter (assigned + historical)
      const cashierMap = new Map<string, { cashierName: string; shiftsCount: number; totalSales: number; cashSales: number; cardSales: number }>();

      (term.assigned_cashiers || []).forEach(c => {
        cashierMap.set(normCashierName(c.name), {
          cashierName: c.name,
          shiftsCount: 0,
          totalSales: 0,
          cashSales: 0,
          cardSales: 0
        });
      });

      termShifts.forEach(s => {
        const key = normCashierName(s.cashier_name);
        if (!cashierMap.has(key)) {
          cashierMap.set(key, {
            cashierName: s.cashier_name || 'Cashier',
            shiftsCount: 0,
            totalSales: 0,
            cashSales: 0,
            cardSales: 0
          });
        }
        const entry = cashierMap.get(key)!;
        const vol = (s.cash_sales || 0) + (s.card_sales || 0) + (s.digital_sales || 0);
        entry.shiftsCount += 1;
        entry.totalSales += vol;
        entry.cashSales += (s.cash_sales || 0);
        entry.cardSales += (s.card_sales || 0) + (s.digital_sales || 0);
      });

      let counterSales = 0;
      let counterCash = 0;
      let counterCard = 0;
      termShifts.forEach(s => {
        counterSales += (s.cash_sales || 0) + (s.card_sales || 0) + (s.digital_sales || 0);
        counterCash += (s.cash_sales || 0);
        counterCard += (s.card_sales || 0) + (s.digital_sales || 0);
      });

      return {
        counterName: term.name,
        counterNumber: term.counter_number || 1,
        slug: term.slug,
        location: term.location || 'Store Floor',
        totalSales: counterSales,
        cashSales: counterCash,
        cardSales: counterCard,
        shiftsCount: termShifts.length,
        cashiers: Array.from(cashierMap.values())
      };
    });
  }, [allShifts, dateFilter, customDate, selectedCounter, terminalsList]);

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
      totalVariance += (s.variance || 0);
    }

    if (filteredOrders.length > 0) {
      for (const ord of filteredOrders) {
        if (ord.status === 'Voided') continue;
        const amt = Number(ord.total_amount) || 0;
        totalVolume += amt;
        const method = (ord.payment_method || '').toLowerCase();
        if (method.includes('card')) {
          cardSales += amt;
        } else if (method.includes('digital') || method.includes('qr') || method.includes('bank')) {
          digitalSales += amt;
        } else {
          cashSales += amt;
        }
      }
    } else {
      for (const s of filteredShifts) {
        cashSales += s.cash_sales || 0;
        cardSales += s.card_sales || 0;
        digitalSales += s.digital_sales || 0;
        totalVolume += (s.cash_sales || 0) + (s.card_sales || 0) + (s.digital_sales || 0);
      }
    }

    return {
      totalVolume,
      cashSales,
      cardSales,
      digitalSales,
      totalVariance,
      count: filteredShifts.length
    };
  }, [filteredShifts, filteredOrders]);

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
        'Counter': s.terminal_code || 'Register 01',
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
                  ? 'shadow-sm'
                  : 'bg-white dark:bg-[#111622] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: accentColor,
                      color: contrastText,
                      border: isAccentWhite ? '1px solid #cbd5e1' : undefined
                    }
                  : undefined
              }
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? 'bg-black/10 dark:bg-white/15 text-current' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Global Date Filter & Unified KPI Bar (Applies to all reports) */}
      <RegisterKpiBar
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        customDate={customDate}
        setCustomDate={setCustomDate}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
        categoryStats={categoryStats}
        dateStats={dateStats}
        filteredOrders={filteredOrders}
        paymentStats={paymentStats}
      />

      {/* TAB 1: DEFAULT CURRENT REPORT (DAILY Z-REPORT & SHIFT SUMMARY) */}
      {activeTab === 'zreport' && (
        <div className="space-y-6">
          <ActiveShiftCard
            activeShift={activeShift}
            setCashInOutType={setCashInOutType}
            setIsCashInOutModal={setIsCashInOutModal}
            setActualCountedCash={setActualCountedCash}
            setIsCloseShiftModal={setIsCloseShiftModal}
            setIsOpenShiftModal={setIsOpenShiftModal}
            accentColor={accentColor}
            contrastText={contrastText}
            isAccentWhite={isAccentWhite}
          />
          <ZReportTab
            counterDropdownRef={counterDropdownRef}
            isCounterDropdownOpen={isCounterDropdownOpen}
            setIsCounterDropdownOpen={setIsCounterDropdownOpen}
            counterSearchQuery={counterSearchQuery}
            setCounterSearchQuery={setCounterSearchQuery}
            selectedCounter={selectedCounter}
            setSelectedCounter={setSelectedCounter}
            selectedCashierFilter={selectedCashierFilter}
            setSelectedCashierFilter={setSelectedCashierFilter}
            filteredTerminalsList={filteredTerminalsList}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            customDate={customDate}
            setCustomDate={setCustomDate}
            accentColor={accentColor}
            contrastText={contrastText}
            isAccentWhite={isAccentWhite}
            scopeTotalSales={scopeTotalSales}
            scopeShiftsCount={scopeShiftsCount}
            cashierCards={cashierCards}
            normCashierName={normCashierName}
            dateStats={dateStats}
            setIsMergedSlipOpen={setIsMergedSlipOpen}
            filteredShifts={filteredShifts}
            resolveTerminalName={resolveTerminalName}
            getShiftCashierBreakdown={getShiftCashierBreakdown}
            setSelectedZReport={setSelectedZReport}
          />
        </div>
      )}

      {/* TAB 2: CATEGORY-WISE SALES REPORT */}
      {activeTab === 'category' && (
        <CategoryReportTab categoryStats={categoryStats} />
      )}

      {/* TAB 3: TOP FAST-MOVING ITEMS */}
      {activeTab === 'top_items' && (
        <TopItemsTab topProductsStats={topProductsStats} />
      )}

      {/* TAB 4: PAYMENT METHODS BREAKDOWN */}
      {activeTab === 'payments' && (
        <PaymentsTab paymentStats={paymentStats} />
      )}

      {/* TAB 5: PEAK SALES TRENDS & HOURLY SHOPPING RUSH */}
      {activeTab === 'peak_hours' && (
        <PeakHoursTab hourlyStats={hourlyStats} />
      )}

      {/* TAB 6: PETTY CASH & DRAWER MOVEMENT SUMMARY */}
      {activeTab === 'petty_cash' && (
        <PettyCashTab filteredShifts={filteredShifts} />
      )}

      {/* Day Open Modal */}
      <DayOpenModal
        isOpenShiftModal={isOpenShiftModal}
        setIsOpenShiftModal={setIsOpenShiftModal}
        dayOpenDate={dayOpenDate}
        handleDayOpenDateChange={handleDayOpenDateChange}
        dayOpenPettyCash={dayOpenPettyCash}
        setDayOpenPettyCash={setDayOpenPettyCash}
        pettyCashSource={pettyCashSource}
        dayOpenCashIn={dayOpenCashIn}
        setDayOpenCashIn={setDayOpenCashIn}
        dayOpenCashOut={dayOpenCashOut}
        setDayOpenCashOut={setDayOpenCashOut}
        handleOpenShift={handleOpenShift}
      />

      {/* Day Close Modal */}
      <DayCloseModal
        isCloseShiftModal={isCloseShiftModal}
        setIsCloseShiftModal={setIsCloseShiftModal}
        activeShift={activeShift}
        dayCloseDate={dayCloseDate}
        setDayCloseDate={setDayCloseDate}
        dayCloseCashOut={dayCloseCashOut}
        setDayCloseCashOut={setDayCloseCashOut}
        dayCloseCashIn={dayCloseCashIn}
        setDayCloseCashIn={setDayCloseCashIn}
        dayCloseNotes={dayCloseNotes}
        setDayCloseNotes={setDayCloseNotes}
        handleCloseShift={handleCloseShift}
      />

      {/* Cash In / Out Modal */}
      <CashInOutModal
        isCashInOutModal={isCashInOutModal}
        setIsCashInOutModal={setIsCashInOutModal}
        cashInOutType={cashInOutType}
        cashInOutAmount={cashInOutAmount}
        setCashInOutAmount={setCashInOutAmount}
        cashInOutReason={cashInOutReason}
        setCashInOutReason={setCashInOutReason}
        handleRecordMovement={handleRecordMovement}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />

      {/* Merged Daily Slip Modal */}
      <MergedSlipModal
        isMergedSlipOpen={isMergedSlipOpen}
        setIsMergedSlipOpen={setIsMergedSlipOpen}
        selectedCashierFilter={selectedCashierFilter}
        posConfig={posConfig}
        dateFilter={dateFilter}
        terminalsList={terminalsList}
        filteredShifts={filteredShifts}
        dateStats={dateStats}
        hierarchicalBreakdown={hierarchicalBreakdown}
        accentColor={accentColor}
        contrastText={contrastText}
        normCashierName={normCashierName}
        cleanCounterKey={cleanCounterKey}
        resolveTerminalName={resolveTerminalName}
        selectedCounter={selectedCounter}
      />

      {/* Z-Report Modal */}
      <ZReportModal
        selectedZReport={selectedZReport}
        setSelectedZReport={setSelectedZReport}
        posConfig={posConfig}
        resolveTerminalName={resolveTerminalName}
        getShiftCashierBreakdown={getShiftCashierBreakdown}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />
    </div>
  );
};

export default POSRegister;

