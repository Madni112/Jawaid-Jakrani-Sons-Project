import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Barcode from 'react-barcode';
import {
  LuReceipt,
  LuSearch,
  LuCalendar,
  LuUser,
  LuCreditCard,
  LuBanknote,
  LuQrCode,
  LuPrinter,
  LuRotateCcw,
  LuFileSpreadsheet,
  LuArrowLeft,
  LuX,
  LuCheck,
  LuFilter,
  LuClock,
  LuStore
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import { getSavedAccentColor, getContrastTextColor } from '../../constant/themeConfig';
import { posService, PosOrder, PosSettings } from '../../service/posService';

interface POSOrdersProps {
  embedded?: boolean;
  defaultStatus?: string;
  isReturnsOnly?: boolean;
  onBack?: () => void;
}

export const POSOrders: React.FC<POSOrdersProps> = ({ embedded, defaultStatus, isReturnsOnly, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userEmail } = useAuth();
  const { isRTL } = useLanguage();
  const [accentColor, setAccentColor] = useState<string>(getSavedAccentColor());

  useEffect(() => {
    const handleTheme = () => setAccentColor(getSavedAccentColor());
    window.addEventListener('uzair_jibran_theme_color_changed', handleTheme);
    return () => window.removeEventListener('uzair_jibran_theme_color_changed', handleTheme);
  }, []);

  const contrastText = getContrastTextColor(accentColor);

  const [posConfig] = useState<PosSettings>(() => posService.getSettings());
  const [orders, setOrders] = useState<PosOrder[]>(() => posService.getAllOrders());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>(isReturnsOnly ? 'Completed' : (defaultStatus || 'All'));
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Yesterday' | 'Last7Days' | 'Custom'>('All');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Modal for thermal receipt reprint
  const [selectedOrder, setSelectedOrder] = useState<PosOrder | null>(null);
  const [receiptSize, setReceiptSize] = useState<'80mm' | '58mm'>(posConfig.receipt_paper_size || '80mm');

  // Check URL query parameters for action
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'returns') {
      toast('Displaying orders for return & refund processing', { icon: '↩️' });
    }
  }, [location.search]);

  // Filtered Orders (by Tender, Status, Date, and Query)
  const filteredOrders = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    return orders.filter((o) => {
      if (methodFilter !== 'All' && o.payment_method.toLowerCase() !== methodFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter !== 'All' && o.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      const orderDate = new Date(o.created_at);
      const orderDateStr = orderDate.toISOString().split('T')[0];

      if (dateFilter === 'Today' && orderDateStr !== todayStr) return false;
      if (dateFilter === 'Yesterday' && orderDateStr !== yesterdayStr) return false;
      if (dateFilter === 'Last7Days' && orderDate < sevenDaysAgo) return false;
      if (dateFilter === 'Custom' && orderDateStr !== customDate) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.cashier_name.toLowerCase().includes(q)
      );
    });
  }, [orders, methodFilter, statusFilter, dateFilter, customDate, searchQuery]);

  // Financial Stats
  const stats = useMemo(() => {
    const totalRev = filteredOrders.reduce((sum, o) => sum + (o.status === 'Completed' ? o.total_amount : 0), 0);
    const cashTotal = filteredOrders.filter((o) => o.payment_method === 'Cash' && o.status === 'Completed').reduce((sum, o) => sum + o.total_amount, 0);
    const cardTotal = filteredOrders.filter((o) => o.payment_method === 'Card' && o.status === 'Completed').reduce((sum, o) => sum + o.total_amount, 0);
    const digitalTotal = filteredOrders.filter((o) => o.payment_method === 'Digital' && o.status === 'Completed').reduce((sum, o) => sum + o.total_amount, 0);
    const completedCount = filteredOrders.filter((o) => o.status === 'Completed').length;
    const avgTicket = completedCount > 0 ? Math.round(totalRev / completedCount) : 0;
    return { totalRev, cashTotal, cardTotal, digitalTotal, avgTicket };
  }, [filteredOrders]);

  // Process Return / Refund
  const handleRefundOrder = (order: PosOrder) => {
    if (order.status === 'Refunded') {
      toast.error('This ticket is already refunded');
      return;
    }
    if (window.confirm(`Issue full refund of Rs. ${order.total_amount.toLocaleString()} for ticket ${order.order_number}?`)) {
      const updated = orders.map((o) =>
        o.id === order.id ? { ...o, status: 'Refunded' as const } : o
      );
      setOrders(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('uj_pos_orders_v1', JSON.stringify(updated));
      }
      toast.success(`Ticket ${order.order_number} marked as Refunded`);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredOrders.map((o) => ({
      'Ticket #': o.order_number,
      'Date & Time': new Date(o.created_at).toLocaleString(),
      'Customer': o.customer_name,
      'Customer Tier': o.customer_tier,
      'Cashier': o.cashier_name,
      'Terminal': o.terminal_code,
      'Payment Tender': o.payment_method,
      'Subtotal': o.subtotal,
      'Discount': o.discount_amount,
      'Tax': o.tax_amount,
      'Grand Total': o.total_amount,
      'Cash Tendered': o.cash_tendered,
      'Change Due': o.change_due,
      'Status': o.status,
      'Total Items': o.items.length
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'POS_Receipts');
    const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `POS_Sales_Receipts_${Date.now()}.xlsx`);
    toast.success('POS orders exported to Excel');
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
              <LuReceipt className="text-sky-500" />
              <span>{isReturnsOnly ? 'Returns & Refunds Processing' : 'POS Transactions & Thermal Receipts'}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review transaction logs, reprint thermal receipts, and process customer returns.
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

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total POS Revenue
          </span>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
            Rs. {stats.totalRev.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {orders.length} tickets completed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            Cash Tenders
          </span>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            Rs. {stats.cashTotal.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Physical drawer cash</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
            Card (POS) Sales
          </span>
          <div className="text-xl font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
            Rs. {stats.cardTotal.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Credit/Debit machine</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
            Average Ticket Size
          </span>
          <div className="text-xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
            Rs. {stats.avgTicket.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Per counter receipt</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket #, customer, cashier..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Date Presets */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold">
            {(['All', 'Today', 'Yesterday', 'Last7Days'] as const).map((mode) => {
              const label = mode === 'All' ? 'All Dates' : mode === 'Last7Days' ? '7 Days' : mode;
              const isSelected = dateFilter === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDateFilter(mode)}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer text-[11px] ${
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

          {/* Custom Date Input */}
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

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Tender Types</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Digital">Digital / QR</option>
            <option value="Split">Split</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Ticket #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Payment Tender</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {o.order_number}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <div>{new Date(o.created_at).toLocaleDateString()}</div>
                      <div className="font-mono">
                        {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {o.customer_name}
                      </div>
                      <span className="text-[10px] text-amber-500 font-semibold">
                        ★ {o.customer_tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {o.items.length} items
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {o.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900 dark:text-white">
                      Rs. {o.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                          title="Reprint Thermal Receipt"
                        >
                          <LuPrinter size={14} />
                        </button>

                        <button
                          type="button"
                          disabled={o.status === 'Refunded'}
                          onClick={() => handleRefundOrder(o)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition cursor-pointer disabled:opacity-30"
                          title="Process Return & Refund"
                        >
                          <LuRotateCcw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: THERMAL RECEIPT REPRINT PREVIEW
         ───────────────────────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Actions */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptSize('80mm')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    receiptSize === '80mm'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  80mm Standard
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptSize('58mm')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    receiptSize === '58mm'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  58mm Compact
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <LuPrinter size={13} />
                  <span>Reprint</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                >
                  <LuX size={18} />
                </button>
              </div>
            </div>

            {/* Thermal Slip Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-200 dark:bg-slate-900 flex justify-center">
              <div
                className={`bg-white text-black p-5 shadow-lg font-mono text-xs rounded-sm transition-all duration-200 ${
                  receiptSize === '80mm' ? 'w-[320px]' : 'w-[240px]'
                }`}
              >
                {/* Store Header */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-black">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">
                    {posConfig.store_title}
                  </h3>
                  <p className="text-[10px] leading-tight text-slate-700">{posConfig.store_address}</p>
                  <p className="text-[10px] text-slate-700">Phone: {posConfig.store_phone}</p>
                  <p className="text-[10px] font-bold text-slate-800">TAX / NTN: {posConfig.tax_id}</p>
                </div>

                {/* Ticket Meta */}
                <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Ticket #:</span>
                    <span className="font-bold">{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleDateString()} {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{selectedOrder.cashier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold">{selectedOrder.customer_name}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="py-2.5 border-b border-dashed border-black space-y-1.5 text-[11px]">
                  <div className="flex justify-between font-bold pb-1 border-b border-dotted border-black/40">
                    <span className="w-1/2">Item</span>
                    <span className="w-1/4 text-center">Qty</span>
                    <span className="w-1/4 text-right">Total</span>
                  </div>

                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span className="w-1/2 truncate font-semibold" title={it.product_name}>
                        {it.product_name}
                      </span>
                      <span className="w-1/4 text-center font-mono">
                        {it.quantity} x {it.unit_price}
                      </span>
                      <span className="w-1/4 text-right font-bold font-mono">
                        {it.line_total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="py-2.5 border-b border-dashed border-black space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rs. {selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({selectedOrder.discount_percentage}%):</span>
                      <span className="font-mono">- Rs. {selectedOrder.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({selectedOrder.tax_percentage}%):</span>
                      <span className="font-mono">+ Rs. {selectedOrder.tax_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-dotted border-black">
                    <span>TOTAL:</span>
                    <span className="font-mono">Rs. {selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Tender & Change */}
                <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Tendered ({selectedOrder.payment_method}):</span>
                    <span className="font-mono">Rs. {selectedOrder.cash_tendered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Change Due:</span>
                    <span className="font-mono">Rs. {selectedOrder.change_due.toLocaleString()}</span>
                  </div>
                </div>

                {/* Barcode & Footer Disclaimer */}
                <div className="pt-3 text-center space-y-2">
                  <div className="flex justify-center">
                    <Barcode
                      value={selectedOrder.order_number}
                      width={1.2}
                      height={35}
                      fontSize={10}
                      margin={0}
                    />
                  </div>
                  <p className="text-[9px] leading-tight text-slate-600">
                    {posConfig.footer_message}
                  </p>
                  <p className="text-[8px] text-slate-400">Reprinted Copy • Atelier POS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSOrders;

