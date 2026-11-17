import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../Context/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import { getSavedAccentColor, getContrastTextColor } from '../../constant/themeConfig';
import { posService, PosOrder, PosSettings } from '../../service/posService';

import { POSOrdersProps, RefundItem, POSOrderStats, DateFilterMode } from './orders/types/posOrdersTypes';
import { exportPOSOrdersToExcel } from './orders/utils/posOrdersExcel';
import { POSOrdersHeader } from './orders/components/POSOrdersHeader';
import { POSOrdersStats } from './orders/components/POSOrdersStats';
import { POSOrdersFilter } from './orders/components/POSOrdersFilter';
import { POSOrdersTable } from './orders/components/POSOrdersTable';
import { POSThermalReceiptModal } from './orders/components/POSThermalReceiptModal';
import { POSRefundModal } from './orders/components/POSRefundModal';

export type { POSOrdersProps };

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
  const isAccentWhite = accentColor.toLowerCase() === '#ffffff' || accentColor.toLowerCase() === '#fff';

  const [posConfig] = useState<PosSettings>(() => posService.getSettings());
  const [orders, setOrders] = useState<PosOrder[]>(() => posService.getAllOrders());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatus || 'All');
  const [dateFilter, setDateFilter] = useState<DateFilterMode>('All');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [confirmRefundOrder, setConfirmRefundOrder] = useState<PosOrder | null>(null);
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [refundReason, setRefundReason] = useState<string>('Customer Return');
  const [refundPaymentMethod, setRefundPaymentMethod] = useState<'Cash' | 'Original'>('Cash');

  // Computed refund totals
  const selectedRefundItems = refundItems.filter((it) => it.selected && it.return_qty > 0);
  const totalRefundAmount = selectedRefundItems.reduce((sum, it) => sum + it.return_qty * it.unit_price, 0);
  const totalOriginalItemsCount = refundItems.reduce((sum, it) => sum + it.original_qty, 0);
  const totalReturnedCount = selectedRefundItems.reduce((sum, it) => sum + it.return_qty, 0);
  const isFullRefund = totalReturnedCount >= totalOriginalItemsCount && totalOriginalItemsCount > 0;

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
      if (isReturnsOnly) {
        const isReturn = o.status === 'Refunded' || o.status === 'Partially Refunded';
        if (!isReturn) return false;
        if (statusFilter !== 'All' && o.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      } else {
        if (statusFilter !== 'All' && o.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      if (methodFilter !== 'All' && o.payment_method.toLowerCase() !== methodFilter.toLowerCase()) {
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
  }, [orders, methodFilter, statusFilter, dateFilter, customDate, searchQuery, isReturnsOnly]);

  // Financial Stats
  const stats: POSOrderStats = useMemo(() => {
    if (isReturnsOnly) {
      const returnOrders = filteredOrders;
      const totalRefundValue = returnOrders.reduce((sum, o) => {
        const match = (o.notes || '').match(/Refunded Rs\.\s*([\d,]+)/i);
        if (match) {
          const parsed = parseFloat(match[1].replace(/,/g, ''));
          if (parsed > 0) return sum + parsed;
        }
        return sum + (o.subtotal || o.total_amount || 0);
      }, 0);

      const cashReturns = returnOrders
        .filter((o) => o.payment_method === 'Cash')
        .reduce((sum, o) => {
          const match = (o.notes || '').match(/Refunded Rs\.\s*([\d,]+)/i);
          if (match) {
            const parsed = parseFloat(match[1].replace(/,/g, ''));
            if (parsed > 0) return sum + parsed;
          }
          return sum + (o.subtotal || o.total_amount || 0);
        }, 0);

      const cardReturns = Math.max(0, totalRefundValue - cashReturns);
      const totalCount = returnOrders.length;
      const avgRefund = totalCount > 0 ? Math.round(totalRefundValue / totalCount) : 0;

      return {
        totalRev: totalRefundValue,
        cashTotal: cashReturns,
        cardTotal: cardReturns,
        digitalTotal: 0,
        avgTicket: avgRefund,
        count: totalCount
      };
    }

    const totalRev = filteredOrders.reduce(
      (sum, o) => sum + (o.status === 'Completed' ? o.total_amount : 0),
      0
    );
    const cashTotal = filteredOrders
      .filter((o) => o.payment_method === 'Cash' && o.status === 'Completed')
      .reduce((sum, o) => sum + o.total_amount, 0);
    const cardTotal = filteredOrders
      .filter((o) => o.payment_method === 'Card' && o.status === 'Completed')
      .reduce((sum, o) => sum + o.total_amount, 0);
    const digitalTotal = filteredOrders
      .filter((o) => o.payment_method === 'Digital' && o.status === 'Completed')
      .reduce((sum, o) => sum + o.total_amount, 0);
    const completedCount = filteredOrders.filter((o) => o.status === 'Completed').length;
    const avgTicket = completedCount > 0 ? Math.round(totalRev / completedCount) : 0;
    return { totalRev, cashTotal, cardTotal, digitalTotal, avgTicket, count: completedCount };
  }, [filteredOrders, isReturnsOnly]);

  // Process Return / Refund
  const handleRefundOrder = (order: PosOrder) => {
    if (order.status === 'Refunded') {
      toast.error('This ticket is already fully refunded');
      return;
    }
    const initialItems = (order.items || []).map((it) => ({
      product_id: it.product_id,
      product_name: it.product_name,
      unit_price: it.unit_price,
      original_qty: it.quantity,
      return_qty: it.quantity,
      selected: true
    }));
    setRefundItems(initialItems);
    setRefundReason('Customer Return');
    setRefundPaymentMethod('Cash');
    setConfirmRefundOrder(order);
  };

  const handleExecuteRefund = () => {
    if (!confirmRefundOrder || totalRefundAmount <= 0) return;

    // 🔒 Manager Override Password Check for Customer Refund
    const managerPass = prompt('🔒 Manager Authorization Required:\nEnter POS Admin / Manager Password to approve refund:');
    if (managerPass === null) return; // Cashier cancelled
    if (!posService.verifyManagerOverride('pos1', managerPass)) {
      toast.error('Invalid Manager Password. Refund not authorized.', { icon: '🔒' });
      return;
    }

    const remainingTotal = Math.max(0, confirmRefundOrder.total_amount - totalRefundAmount);
    const newStatus = isFullRefund ? ('Refunded' as const) : ('Partially Refunded' as const);

    const updated = orders.map((o) => {
      if (o.id !== confirmRefundOrder.id) return o;
      return {
        ...o,
        status: newStatus,
        total_amount: remainingTotal,
        refunded_at: new Date().toISOString(),
        refund_amount: (o.refund_amount || 0) + totalRefundAmount,
        refund_reason: refundReason,
        notes:
          (o.notes ? o.notes + ' | ' : '') +
          `Refunded Rs. ${totalRefundAmount.toLocaleString()} (${totalReturnedCount} item${
            totalReturnedCount > 1 ? 's' : ''
          }) on ${new Date().toLocaleDateString()} - ${refundReason}`
      };
    });

    setOrders(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uj_pos_orders_v1', JSON.stringify(updated));
    }

    // Deduct cash from active drawer shift if paying cash
    if (refundPaymentMethod === 'Cash') {
      const activeShift = posService.getActiveShift();
      if (activeShift) {
        posService.recordCashMovement(activeShift.id, 'out', totalRefundAmount);
      }
    }

    toast.success(
      isFullRefund
        ? `Ticket ${confirmRefundOrder.order_number} fully refunded (Rs. ${totalRefundAmount.toLocaleString()})`
        : `Partial refund of Rs. ${totalRefundAmount.toLocaleString()} issued for ${confirmRefundOrder.order_number}`
    );
    setConfirmRefundOrder(null);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/pos/terminal');
  };

  return (
    <div className="space-y-6 animate-fadeIn p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <POSOrdersHeader
        isReturnsOnly={isReturnsOnly}
        embedded={embedded}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
        onBackClick={handleBack}
        onExportExcel={() => exportPOSOrdersToExcel(filteredOrders)}
      />

      {/* Financial KPIs Banner */}
      <POSOrdersStats stats={stats} isReturnsOnly={isReturnsOnly} />

      {/* Filter Controls */}
      <POSOrdersFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        customDate={customDate}
        setCustomDate={setCustomDate}
        methodFilter={methodFilter}
        setMethodFilter={setMethodFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        isReturnsOnly={isReturnsOnly}
        accentColor={accentColor}
        contrastText={contrastText}
        isAccentWhite={isAccentWhite}
      />

      {/* Orders Table */}
      <POSOrdersTable
        orders={filteredOrders}
        isReturnsOnly={isReturnsOnly}
        onSelectOrder={setSelectedOrder}
        onRefundOrder={handleRefundOrder}
      />

      {/* Modal: Thermal Receipt Reprint Preview */}
      {selectedOrder && (
        <POSThermalReceiptModal
          order={selectedOrder}
          posConfig={posConfig}
          receiptSize={receiptSize}
          setReceiptSize={setReceiptSize}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Modal: Centered Item-Level & Full Refund */}
      {confirmRefundOrder && (
        <POSRefundModal
          order={confirmRefundOrder}
          refundItems={refundItems}
          setRefundItems={setRefundItems}
          refundReason={refundReason}
          setRefundReason={setRefundReason}
          refundPaymentMethod={refundPaymentMethod}
          setRefundPaymentMethod={setRefundPaymentMethod}
          totalRefundAmount={totalRefundAmount}
          totalReturnedCount={totalReturnedCount}
          totalOriginalItemsCount={totalOriginalItemsCount}
          isFullRefund={isFullRefund}
          onExecuteRefund={handleExecuteRefund}
          onClose={() => setConfirmRefundOrder(null)}
        />
      )}
    </div>
  );
};

export default POSOrders;
