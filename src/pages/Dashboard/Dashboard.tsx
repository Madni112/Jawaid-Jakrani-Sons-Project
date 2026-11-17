import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinancialSummary } from '../../service/financialCalculations';
import Spinner from '../../ui/Spinner';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import SalesmanDashboard from './SalesmanDashboard';
import WarehouseDashboard from './WarehouseDashboard';
import {
  MasterThemePreset,
  getMasterThemePreset,
  isNHTTheme2Active,
  getSavedAccentColor
} from '../../constant/themeConfig';
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';

import AdminRoleSwitcher from './components/AdminRoleSwitcher';
import DashboardHeroBanner from './components/DashboardHeroBanner';
import Theme2FinancialPanels from './components/Theme2FinancialPanels';
import Theme1FinancialCards from './components/Theme1FinancialCards';
import ReceivablesAndStockSection from './components/ReceivablesAndStockSection';
import HoldingInventorySection from './components/HoldingInventorySection';
import LiquidityCenterSection from './components/LiquidityCenterSection';
import DashboardChartsSection from './components/DashboardChartsSection';
import FinancialBreakdownModal from './modals/FinancialBreakdownModal';

import {
  ReceivableInvoice,
  PayableVendor,
  TrendingProduct,
  LowStockAlert,
  HoldingItemData,
  CashTransaction
} from './types/dashboardTypes';
import {
  fetchCompleteDashboardOperationalData
} from './services/dashboardDataService';
import {
  getSalesVsPurchasesChartConfig,
  getCustomerSalesChartConfig,
  getBankDonutConfig
} from './utils/dashboardChartConfigs';

export type {
  ReceivableInvoice,
  PayableVendor,
  TrendingProduct,
  LowStockAlert,
  HoldingItemData,
  CashTransaction
};

interface DashboardProps {
  initialView?: 'executive' | 'salesman' | 'warehouse';
}

const Dashboard: React.FC<DashboardProps> = ({ initialView = 'executive' }) => {
  const navigate = useNavigate();
  const { role, userEmail, userName } = useAuth();
  const { isRTL, t } = useLanguage();
  const [adminView, setAdminView] = useState<'executive' | 'salesman' | 'warehouse'>(initialView);

  const [masterPreset, setMasterPreset] = useState<MasterThemePreset>(() => getMasterThemePreset());

  useEffect(() => {
    const updateMasterPreset = () => {
      setMasterPreset(getMasterThemePreset());
    };
    window.addEventListener('jakwani_master_theme_preset_changed', updateMasterPreset);
    window.addEventListener('storage', updateMasterPreset);
    return () => {
      window.removeEventListener('jakwani_master_theme_preset_changed', updateMasterPreset);
      window.removeEventListener('storage', updateMasterPreset);
    };
  }, []);

  const isTheme2 = isNHTTheme2Active() || masterPreset === 'nht-2';

  const [accentColor, setAccentColor] = useState<string>(() => getSavedAccentColor());

  useEffect(() => {
    const handleColorChange = () => {
      setAccentColor(getSavedAccentColor());
    };
    window.addEventListener('uzair_jibran_theme_color_changed', handleColorChange);
    window.addEventListener('storage', handleColorChange);
    return () => {
      window.removeEventListener('uzair_jibran_theme_color_changed', handleColorChange);
      window.removeEventListener('storage', handleColorChange);
    };
  }, []);

  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  });
  const [currentDate, setCurrentDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const displayName = userName || (userEmail ? userEmail.split('@')[0].toUpperCase() : 'MUHAMMAD SAAD');

  const userRoleLower = (role || '').toLowerCase();
  let allowedModules: string[] = [];
  try {
    const cached = localStorage.getItem('ujc_user_modules');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        allowedModules = parsed.map((s: string) => String(s).toLowerCase().trim());
      }
    }
  } catch (_) {}

  const isAdmin =
    userRoleLower.includes('admin') || userRoleLower.includes('owner') || userRoleLower.includes('super admin');
  const isSalesman =
    !isAdmin &&
    (userRoleLower.includes('salesman') ||
      allowedModules.includes('/dashboard/salesman') ||
      allowedModules.includes('salesman-dashboard'));
  const isWarehouse =
    !isAdmin &&
    !isSalesman &&
    (userRoleLower.includes('warehouse') ||
      allowedModules.includes('/dashboard/warehouse') ||
      allowedModules.includes('warehouse-dashboard'));

  const [metrics, setMetrics] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Operational Data States
  const [receivablesList, setReceivablesList] = useState<ReceivableInvoice[]>([]);
  const [payablesList, setPayablesList] = useState<PayableVendor[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockAlert[]>([]);
  const [holdingItems, setHoldingItems] = useState<HoldingItemData[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);

  // Interactive Tab Controllers
  const [chartViewTab, setChartViewTab] = useState<'daily' | 'monthly'>('monthly');
  const [holdingTab, setHoldingTab] = useState<'warehouse' | 'invoice'>('warehouse');
  const [selectedWarehouseGuy, setSelectedWarehouseGuy] = useState<string>('All');
  const [selectedHoldingInvoice, setSelectedHoldingInvoice] = useState<string>('All');
  const [liquidityTab, setLiquidityTab] = useState<'bank' | 'cash'>('bank');
  const [stockModalView, setStockModalView] = useState<'allTime' | 'thisMonth'>('allTime');
  const [activeBreakdownModal, setActiveBreakdownModal] = useState<
    'cash' | 'bank' | 'receivables' | 'payables' | 'stock' | null
  >(null);
  const [showOperationalDetails, setShowOperationalDetails] = useState<boolean>(() => {
    return localStorage.getItem('ujc_dashboard_show_details') === 'true';
  });

  const toggleOperationalDetails = () => {
    setShowOperationalDetails((prev) => {
      const next = !prev;
      localStorage.setItem('ujc_dashboard_show_details', String(next));
      return next;
    });
  };

  // Customer Sales Graph Data
  const [customerSalesDaily, setCustomerSalesDaily] = useState<{ dates: string[]; sales: number[] }>({
    dates: [],
    sales: []
  });
  const [customerSalesMonthly, setCustomerSalesMonthly] = useState<{ months: string[]; sales: number[] }>({
    months: [],
    sales: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchCompleteDashboardOperationalData();
      setMetrics(data.metrics);
      setReceivablesList(data.receivablesList);
      setPayablesList(data.payablesList);
      setTrendingProducts(data.trendingProducts);
      setLowStockProducts(data.lowStockProducts);
      setHoldingItems(data.holdingItems);
      setCashTransactions(data.cashTransactions);
      setCustomerSalesDaily(data.customerSalesDaily);
      setCustomerSalesMonthly(data.customerSalesMonthly);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSalesman && !isWarehouse) {
      loadData();
    }
  }, [isSalesman, isWarehouse]);

  // Distinct Filter Lists for Holding Items
  const warehouseGuysList = useMemo(() => {
    const set = new Set<string>();
    holdingItems.forEach((h) => {
      if (h.warehouseGuy) set.add(h.warehouseGuy);
    });
    return ['All', ...Array.from(set).sort()];
  }, [holdingItems]);

  const holdingInvoicesList = useMemo(() => {
    const set = new Set<string>();
    holdingItems.forEach((h) => {
      if (h.invoiceNo) set.add(h.invoiceNo);
    });
    return ['All', ...Array.from(set).sort()];
  }, [holdingItems]);

  const filteredHoldingItems = useMemo(() => {
    return holdingItems.filter((item) => {
      if (holdingTab === 'warehouse') {
        if (selectedWarehouseGuy !== 'All' && item.warehouseGuy !== selectedWarehouseGuy) return false;
      } else {
        if (selectedHoldingInvoice !== 'All' && item.invoiceNo !== selectedHoldingInvoice) return false;
      }
      return true;
    });
  }, [holdingItems, holdingTab, selectedWarehouseGuy, selectedHoldingInvoice]);

  // 1. Direct auto-render for role: Salesman
  if (isSalesman) {
    return <SalesmanDashboard />;
  }

  // 2. Direct auto-render for role: Warehouse Manager
  if (isWarehouse) {
    return <WarehouseDashboard />;
  }

  // 3. Super Admin Previews
  if (adminView === 'salesman') {
    return (
      <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs pb-12">
        <AdminRoleSwitcher activeView={adminView} onChangeView={setAdminView} />
        <SalesmanDashboard />
      </div>
    );
  }

  if (adminView === 'warehouse') {
    return (
      <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs pb-12">
        <AdminRoleSwitcher activeView={adminView} onChangeView={setAdminView} />
        <WarehouseDashboard />
      </div>
    );
  }

  if (loading || !metrics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Charts configs
  const { options: salesVsPurchasesChartOptions, series: salesVsPurchasesChartSeries } =
    getSalesVsPurchasesChartConfig(metrics);
  const { options: customerSalesChartOptions, series: customerSalesChartSeries } =
    getCustomerSalesChartConfig(chartViewTab, customerSalesDaily, customerSalesMonthly);
  const { options: bankDonutOptions, series: bankDonutSeries } = getBankDonutConfig(metrics);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs pb-12">
      {/* Role Dashboard Switcher for Admins (Theme 1 or when testing views) */}
      {!isTheme2 && <AdminRoleSwitcher activeView={adminView} onChangeView={setAdminView} />}

      {isTheme2 ? (
        <>
          <DashboardHeroBanner
            accentColor={accentColor}
            currentTime={currentTime}
            currentDate={currentDate}
            greeting={greeting}
            displayName={displayName}
            navigate={navigate}
          />
          <Theme2FinancialPanels
            metrics={metrics}
            setActiveBreakdownModal={setActiveBreakdownModal}
          />
        </>
      ) : (
        <Theme1FinancialCards
          metrics={metrics}
          setActiveBreakdownModal={setActiveBreakdownModal}
          t={t}
        />
      )}

      {/* EXPANDABLE OPERATIONAL DETAILS TOGGLE BAR */}
      <div className="flex items-center justify-center pt-2 pb-1">
        <button
          onClick={toggleOperationalDetails}
          className="group flex items-center gap-3 px-5 py-2 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {showOperationalDetails
                ? isRTL
                  ? 'آپریشنل لیجرز اور تجزیات چھپائیں'
                  : 'Hide Operational Ledgers & Analytics'
                : isRTL
                ? 'آپریشنل لیجرز اور تجزیات دکھائیں'
                : 'Show Operational Ledgers & Analytics'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold border border-slate-200/70 dark:border-slate-700/60">
              {isRTL ? '8 فعال ماڈیولز' : '8 Live Modules'}
            </span>
          </div>
          <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-transform duration-200 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700">
            {showOperationalDetails ? <MdKeyboardArrowUp size={16} /> : <MdKeyboardArrowDown size={16} />}
          </div>
        </button>
      </div>

      {/* COLLAPSIBLE OPERATIONAL SECTIONS */}
      {showOperationalDetails && (
        <div className="space-y-6">
          <ReceivablesAndStockSection
            receivablesList={receivablesList}
            lowStockProducts={lowStockProducts}
          />

          <HoldingInventorySection
            holdingTab={holdingTab}
            setHoldingTab={setHoldingTab}
            selectedWarehouseGuy={selectedWarehouseGuy}
            setSelectedWarehouseGuy={setSelectedWarehouseGuy}
            warehouseGuysList={warehouseGuysList}
            selectedHoldingInvoice={selectedHoldingInvoice}
            setSelectedHoldingInvoice={setSelectedHoldingInvoice}
            holdingInvoicesList={holdingInvoicesList}
            filteredHoldingItems={filteredHoldingItems}
            trendingProducts={trendingProducts}
          />

          <LiquidityCenterSection
            metrics={metrics}
            liquidityTab={liquidityTab}
            setLiquidityTab={setLiquidityTab}
            bankDonutOptions={bankDonutOptions}
            bankDonutSeries={bankDonutSeries}
            cashTransactions={cashTransactions}
          />

          <DashboardChartsSection
            salesVsPurchasesChartOptions={salesVsPurchasesChartOptions}
            salesVsPurchasesChartSeries={salesVsPurchasesChartSeries}
            customerSalesChartOptions={customerSalesChartOptions}
            customerSalesChartSeries={customerSalesChartSeries}
            chartViewTab={chartViewTab}
            setChartViewTab={setChartViewTab}
          />
        </div>
      )}

      {/* ASSET & FINANCIAL METRIC BREAKDOWN POPUP MODAL */}
      <FinancialBreakdownModal
        activeBreakdownModal={activeBreakdownModal}
        setActiveBreakdownModal={setActiveBreakdownModal}
        metrics={metrics}
        stockModalView={stockModalView}
        setStockModalView={setStockModalView}
        receivablesList={receivablesList}
      />
    </div>
  );
};

export default Dashboard;
