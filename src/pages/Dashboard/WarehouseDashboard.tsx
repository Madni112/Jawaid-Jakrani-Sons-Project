import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../Context/supabaseClient';
import { useAuth } from '../../Context/Auth';
import Spinner from '../../ui/Spinner';
import GlassCard from '../../ui/GlassCard';
import StatCard from '../../ui/StatCard';
import ActionCard from '../../ui/ActionCard';
import {
  MdWarehouse,
  MdStorefront,
  MdLocalShipping,
  MdAssignmentReturn,
  MdMoveToInbox,
  MdInbox,
  MdCompareArrows,
  MdCheckCircle,
  MdHourglassEmpty,
  MdWarning,
  MdRefresh,
  MdSearch,
  MdArrowForward,
  MdLocationOn,
  MdInventory2,
  MdDescription,
  MdSyncAlt,
  MdCalendarToday
} from 'react-icons/md';

interface DeliveryChallanItem {
  id: number;
  challan_no: string;
  customer_name: string;
  challan_date: string;
  dispatch_warehouse: string;
  status: string;
  total_quantity: number;
  driver_name?: string;
  vehicle_no?: string;
  created_at: string;
}

interface StockBalanceItem {
  product_name: string;
  warehouse_name: string;
  quantity: number;
  updated_at: string;
}

interface StockTransferItem {
  id: number;
  transfer_no: string;
  transfer_date: string;
  from_location: string;
  to_location: string;
  status: string;
}

interface WarehouseDashboardProps {
  initialLocation?: 'A-39' | 'SHOP';
}

const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({ initialLocation }) => {
  const navigate = useNavigate();
  const { userLocationName, userLocationId, userEmail, userName, role } = useAuth();

  // Check if current user is Super Admin / Admin / Owner
  const isAdmin = useMemo(() => {
    const r = (role || '').toLowerCase();
    const email = (userEmail || '').toLowerCase();
    return (
      r.includes('admin') ||
      r.includes('owner') ||
      email === 'admin@zoaibalicompany.com' ||
      email === 'developer@noorhorizontechnologies.com'
    );
  }, [role, userEmail]);

  // Determine user's assigned warehouse (SHOP or A-39)
  const userAssignedLocation: 'A-39' | 'SHOP' = useMemo(() => {
    const locName = (userLocationName || '').toUpperCase();
    const uName = (userName || '').toUpperCase();
    const email = (userEmail || '').toLowerCase();
    const locId = userLocationId ? String(userLocationId) : '';

    if (locName.includes('SHOP') || uName.includes('SHOP') || email.includes('shop') || locId === '2') {
      return 'SHOP';
    }
    return 'A-39';
  }, [userLocationName, userName, userEmail, userLocationId]);

  // Can the user switch warehouses?
  // Strictly only Admins can switch between warehouses. Warehouse employees are locked to their own warehouse for safety!
  const canSwitchLocation = isAdmin && !initialLocation;

  // Active location is either prop, or if not admin locked to userAssignedLocation, else default
  const [activeLocation, setActiveLocation] = useState<'A-39' | 'SHOP'>(() => {
    if (initialLocation) return initialLocation;
    if (!isAdmin) return userAssignedLocation;
    return userAssignedLocation || 'A-39';
  });

  // Safety lock: If user is not Admin, strictly enforce their assigned location
  useEffect(() => {
    if (!canSwitchLocation) {
      setActiveLocation(userAssignedLocation);
    }
  }, [canSwitchLocation, userAssignedLocation]);

  const [loading, setLoading] = useState(true);

  // Data states
  const [challans, setChallans] = useState<DeliveryChallanItem[]>([]);
  const [stockBalances, setStockBalances] = useState<StockBalanceItem[]>([]);
  const [transfers, setTransfers] = useState<StockTransferItem[]>([]);

  // Filter states
  const [searchChallan, setSearchChallan] = useState('');
  const [searchStock, setSearchStock] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Dispatched' | 'Partially Dispatched'>('ALL');

  // Load Warehouse Data
  const loadWarehouseData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Delivery Challans
      const { data: dcData, error: dcErr } = await supabase
        .from('delivery_challans')
        .select('*')
        .order('id', { ascending: false })
        .limit(150);

      if (dcErr) throw dcErr;
      setChallans(dcData || []);

      // 2. Fetch Stock Balances
      const { data: stockData, error: stockErr } = await supabase
        .from('stock_balances')
        .select('*');

      if (!stockErr && stockData) {
        setStockBalances(stockData || []);
      }

      // 3. Fetch Stock Transfers
      const { data: transferData, error: transferErr } = await supabase
        .from('stock_transfers')
        .select('id, transfer_no, transfer_date, from_location, to_location, status')
        .order('id', { ascending: false })
        .limit(50);

      if (!transferErr && transferData) {
        setTransfers(transferData || []);
      }
    } catch (err) {
      console.error('Failed to load warehouse dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouseData();
  }, []);

  // Filter Delivery Challans by activeLocation
  const locationChallans = useMemo(() => {
    return challans.filter((dc) => {
      const wh = (dc.dispatch_warehouse || '').toUpperCase();
      const matchLocation =
        activeLocation === 'A-39'
          ? wh.includes('39') || wh.includes('A-39')
          : wh.includes('SHOP');

      if (!matchLocation) return false;

      if (statusFilter !== 'ALL' && dc.status !== statusFilter) {
        return false;
      }

      if (searchChallan.trim()) {
        const q = searchChallan.toLowerCase();
        const matchNo = (dc.challan_no || '').toLowerCase().includes(q);
        const matchCust = (dc.customer_name || '').toLowerCase().includes(q);
        const matchVeh = (dc.vehicle_no || '').toLowerCase().includes(q);
        if (!matchNo && !matchCust && !matchVeh) return false;
      }

      return true;
    });
  }, [challans, activeLocation, statusFilter, searchChallan]);

  // Filter Stock Balances by activeLocation
  const locationStock = useMemo(() => {
    const list = stockBalances.filter((sb) => {
      const wh = (sb.warehouse_name || '').toUpperCase();
      const matchLocation =
        activeLocation === 'A-39'
          ? wh.includes('39') || wh.includes('A-39')
          : wh.includes('SHOP');

      if (!matchLocation) return false;

      if (searchStock.trim()) {
        return (sb.product_name || '').toLowerCase().includes(searchStock.toLowerCase());
      }
      return true;
    });

    return list.sort((a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0));
  }, [stockBalances, activeLocation, searchStock]);

  // Calculate Metrics for the active location
  const metrics = useMemo(() => {
    // Total stock in this location
    const totalStockQty = locationStock.reduce(
      (sum, item) => sum + (parseFloat(String(item.quantity || 0)) || 0),
      0
    );

    // Challans metrics:
    // A challan is Dispatched if it was physically sent out (Full or Partial dispatch).
    // It is Pending ONLY if it is waiting for approval OR is an active partial challan whose hold items haven't been moved yet.
    let totalDispatched = 0;
    let totalPending = 0;

    challans.forEach((dc) => {
      const wh = (dc.dispatch_warehouse || '').toUpperCase();
      const matchLocation =
        activeLocation === 'A-39'
          ? wh.includes('39') || wh.includes('A-39')
          : wh.includes('SHOP');

      if (matchLocation) {
        const isMoved = (dc.remarks || '').includes('Remaining hold items moved to');
        const isPendingApproval = dc.status === 'Pending Approval';
        const isDispatched = dc.status === 'Dispatched' || dc.status === 'Fully Dispatched';
        const isPartial = dc.status === 'Partially Dispatched';

        if (isPendingApproval) {
          totalPending++;
        } else if (isDispatched) {
          totalDispatched++;
        } else if (isPartial) {
          // Physical dispatch occurred for this challan
          totalDispatched++;
          // Only pending if remaining hold units have not yet been moved to a subsequent challan
          if (!isMoved) {
            totalPending++;
          }
        }
      }
    });

    // Transfers count
    const relatedTransfers = transfers.filter((tr) => {
      const from = (tr.from_location || '').toUpperCase();
      const to = (tr.to_location || '').toUpperCase();
      if (activeLocation === 'A-39') {
        return from.includes('39');
      } else {
        return to.includes('SHOP');
      }
    });

    return {
      totalStockQty,
      totalDispatched,
      totalPending,
      totalTransfers: relatedTransfers.length
    };
  }, [locationStock, challans, transfers, activeLocation]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isA39 = activeLocation === 'A-39';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header: Sleek Executive Linear Style */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
              isA39
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/60'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isA39 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {isA39 ? 'Warehouse Hub (Central Storage)' : 'Showroom Hub (Sale & Retail Point)'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MdLocationOn size={13} className="text-slate-400" />
              {isA39 ? 'Plot A-39, Near Boulevard Mall' : 'Saddar, Bouri Bazar'}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {isA39 ? 'A-39 Storage Operations Terminal' : 'SHOP Floor & Dispatch Terminal'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isA39
              ? 'Bulk storage holding, supplier inward verification, delivery challans & outbound transfers'
              : 'Retail counter fulfillment, incoming stock transfers from A-39 & floor stock balances'}
          </p>
        </div>

        {/* Right Controls: Location Switcher, Date & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Location Switcher Buttons */}
          {canSwitchLocation ? (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/90 dark:border-slate-700 text-xs font-bold shadow-2xs">
              <button
                onClick={() => setActiveLocation('A-39')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isA39
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <MdWarehouse className="text-sm" />
                A-39 Storage
              </button>
              <button
                onClick={() => setActiveLocation('SHOP')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isA39
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <MdStorefront className="text-sm" />
                SHOP Floor
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
              {isA39 ? <MdWarehouse className="text-amber-500 text-sm" /> : <MdStorefront className="text-emerald-500 text-sm" />}
              <span>Assigned: {activeLocation}</span>
            </div>
          )}

          {/* Date Pill */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 px-3 py-1.5 rounded-xl font-bold font-mono text-xs text-slate-600 dark:text-slate-300 shadow-2xs flex items-center gap-1.5">
            <MdCalendarToday className="text-emerald-600 text-xs" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadWarehouseData}
            title="Refresh Warehouse Records"
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl border border-slate-200/90 dark:border-slate-700 transition-all text-slate-600 dark:text-slate-300 shadow-2xs cursor-pointer"
          >
            <MdRefresh className="text-base" />
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isA39 ? 'A-39 Total Storage Stock' : 'Shop Floor Stock Units'}
          value={metrics.totalStockQty.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          Icon={MdInventory2}
          bgColor={isA39 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-teal-500 to-emerald-700'}
        />
        <StatCard
          title={isA39 ? 'Dispatched Challans' : 'Counter Dispatches'}
          value={metrics.totalDispatched}
          Icon={MdCheckCircle}
          bgColor="bg-gradient-to-br from-emerald-600 to-teal-700"
        />
        <StatCard
          title="Pending Dispatches"
          value={metrics.totalPending}
          Icon={MdHourglassEmpty}
          bgColor="bg-gradient-to-br from-rose-500 to-red-600"
        />
        <StatCard
          title={isA39 ? 'Transfers Out to Shop' : 'Transfers In from A-39'}
          value={metrics.totalTransfers}
          Icon={MdSyncAlt}
          bgColor="bg-gradient-to-br from-indigo-600 to-blue-700"
        />
      </div>

      {/* 3. Tailored Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isA39 ? (
          <>
            <ActionCard
              title="Warehouse Dispatch"
              subtitle="Outward Delivery Challan (WDQ)"
              Icon={MdLocalShipping}
              bgGradient="bg-gradient-to-br from-orange-600 to-amber-700"
              onClick={() => navigate('/Sales/Delivery-Challan/List')}
            />
            <ActionCard
              title="Inward Challan"
              subtitle="Receive goods from suppliers / GRN"
              Icon={MdMoveToInbox}
              bgGradient="bg-gradient-to-br from-blue-600 to-indigo-800"
              onClick={() => navigate('/Purchase/Inward-Challan/List')}
            />
            <ActionCard
              title="Stock Transfer"
              subtitle="Transfer boxes to Saddar Shop"
              Icon={MdCompareArrows}
              bgGradient="bg-gradient-to-br from-purple-600 to-violet-800"
              onClick={() => navigate('/Administration/StockTransfer/List')}
            />
            <ActionCard
              title="Inward Challan"
              subtitle="Procurement & return verification"
              Icon={MdInbox}
              bgGradient="bg-gradient-to-br from-emerald-600 to-teal-800"
              onClick={() => navigate('/Purchase/Inward-Challan/List')}
            />
          </>
        ) : (
          <>
            <ActionCard
              title="Shop Dispatch"
              subtitle="Shop Dispatch Queue (SDQ)"
              Icon={MdStorefront}
              bgGradient="bg-gradient-to-br from-teal-600 to-emerald-800"
              onClick={() => navigate('/Sales/Shop-Dispatch/List')}
            />
            <ActionCard
              title="Shop Receiving"
              subtitle="Transfers & customer return receiving"
              Icon={MdMoveToInbox}
              bgGradient="bg-gradient-to-br from-cyan-600 to-blue-800"
              onClick={() => navigate('/Purchase/Shop-Receiving')}
            />
            <ActionCard
              title="Shop Stock Report"
              subtitle="View showroom inventory levels"
              Icon={MdInventory2}
              bgGradient="bg-gradient-to-br from-slate-700 to-slate-900"
              onClick={() => navigate('/Reports/Stock-Report')}
            />
          </>
        )}
      </div>

      {/* 4. Active Delivery Challan Queue & Location Stock Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Delivery Challans Queue */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-5 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MdLocalShipping className={isA39 ? 'text-orange-600 text-xl' : 'text-emerald-600 text-xl'} />
                  {isA39 ? 'A-39 Outward Delivery Challans' : 'Shop Counter Delivery Challans'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {locationChallans.length} active challans for {activeLocation}
                </p>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
                {(['ALL', 'Dispatched', 'Partially Dispatched'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      statusFilter === tab
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'Partially Dispatched' ? 'Partial' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                value={searchChallan}
                onChange={(e) => setSearchChallan(e.target.value)}
                placeholder="Search challan #, customer name, vehicle..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>

            {/* Challans Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/50 uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Challan #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Transport / Driver</th>
                    <th className="py-2.5 px-3 text-right">Total Qty</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {locationChallans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No delivery challans recorded for {activeLocation}.
                      </td>
                    </tr>
                  ) : (
                    locationChallans.slice(0, 10).map((dc) => (
                      <tr
                        key={dc.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3 font-bold text-orange-600 dark:text-orange-400">
                          {dc.challan_no || `DC-${dc.id}`}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                          {dc.challan_date || dc.created_at?.split('T')[0] || '-'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {dc.customer_name || 'Walk-in'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {dc.driver_name || dc.vehicle_no ? `${dc.driver_name || ''} ${dc.vehicle_no ? `(${dc.vehicle_no})` : ''}` : 'Direct'}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                          {Number(dc.total_quantity || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {dc.status === 'Dispatched' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <MdCheckCircle className="text-xs" />
                              Dispatched
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <MdHourglassEmpty className="text-xs" />
                              {dc.status || 'Pending'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() =>
                  navigate(isA39 ? '/Sales/Delivery-Challan/List' : '/Sales/Shop-Dispatch/List')
                }
                className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 group"
              >
                Go to Full {isA39 ? 'Warehouse Dispatch Queue' : 'Shop Dispatch Queue'}
                <MdArrowForward className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right 1 Col: Location Stock Balances */}
        <div className="space-y-4">
          <GlassCard className="p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MdInventory2 className={isA39 ? 'text-amber-600 text-lg' : 'text-teal-600 text-lg'} />
                  {activeLocation} Stock Balances
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live counted units in this location
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isA39
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  : 'bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300'
              }`}>
                {locationStock.length} SKUs
              </span>
            </div>

            {/* Quick stock search */}
            <div className="relative mb-3">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                value={searchStock}
                onChange={(e) => setSearchStock(e.target.value)}
                placeholder="Search item name..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>

            {/* Stock List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {locationStock.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No inventory balances recorded for {activeLocation}.
                </div>
              ) : (
                locationStock.map((item, idx) => {
                  const qty = parseFloat(String(item.quantity || 0)) || 0;
                  const isLow = qty <= 5;
                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-slate-200 transition-all"
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 capitalize truncate">
                          {item.product_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {activeLocation}
                        </div>
                      </div>

                      <div className="text-right whitespace-nowrap">
                        <span
                          className={`font-extrabold text-xs px-2 py-0.5 rounded-lg ${
                            isLow
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : isA39
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                          }`}
                        >
                          {qty.toLocaleString()} Units
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              <button
                onClick={() => navigate('/Reports/Stock-Report')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1"
              >
                Open Full Stock Report →
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDashboard;
