import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  posService,
  PosOrder,
  POSPaymentAccount,
  PosOrderItem,
  PosSettings,
  PosShift,
} from '../../../../service/posService';

interface UsePOSPaymentProps {
  posConfig: PosSettings;
  activeShift: PosShift | null;
  setActiveShift: (shift: PosShift | null) => void;
  currentCounterConfig: any;
  displayCashierName: string;
  ticketNumber: string;
  setTicketNumber: (no: string) => void;
  customerName: string;
  customerTier: 'VIP' | 'Regular' | 'Retail';
  fulfillmentType: string;
  setFulfillmentType: (type: string) => void;
  cartItems: PosOrderItem[];
  setCartItems: (items: PosOrderItem[]) => void;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountPercent: number;
  setDiscountPercent: (d: number) => void;
  discountAmount: number;
  grandTotal: number;
  playTone: (type: 'notification' | 'success' | 'scan' | 'warning' | 'delete') => void;
  resolveInitialFulfillment: (config: PosSettings) => string;
}

export const usePOSPayment = ({
  posConfig,
  activeShift,
  setActiveShift,
  currentCounterConfig,
  displayCashierName,
  ticketNumber,
  setTicketNumber,
  customerName,
  customerTier,
  fulfillmentType,
  setFulfillmentType,
  cartItems,
  setCartItems,
  subtotal,
  taxPercent,
  taxAmount,
  discountPercent,
  setDiscountPercent,
  discountAmount,
  grandTotal,
  playTone,
  resolveInitialFulfillment,
}: UsePOSPaymentProps) => {
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Digital' | 'Split'>('Cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isProcessingSale, setIsProcessingSale] = useState<boolean>(false);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<POSPaymentAccount | null>(null);
  const [accountSearchQuery, setAccountSearchQuery] = useState<string>('');
  const [paymentRefNumber, setPaymentRefNumber] = useState<string>('');

  const [completedOrder, setCompletedOrder] = useState<PosOrder | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [receiptSize, setReceiptSize] = useState<'80mm' | '58mm'>(posConfig.receipt_paper_size || '80mm');

  const posPaymentAccounts = useMemo(() => {
    return posService.getPOSActiveAccounts();
  }, [isPayModalOpen]);

  useEffect(() => {
    if (posPaymentAccounts.length > 0 && !selectedPaymentAccount) {
      setSelectedPaymentAccount(posPaymentAccounts[0]);
    }
  }, [posPaymentAccounts]);

  const filteredPaymentAccounts = useMemo(() => {
    if (!accountSearchQuery.trim()) return posPaymentAccounts;
    const q = accountSearchQuery.toLowerCase();
    return posPaymentAccounts.filter(
      (a) =>
        a.bank_name.toLowerCase().includes(q) ||
        a.account_title.toLowerCase().includes(q) ||
        a.account_number.toLowerCase().includes(q) ||
        (a.branch_name && a.branch_name.toLowerCase().includes(q))
    );
  }, [posPaymentAccounts, accountSearchQuery]);

  const changeDue = Math.max(0, cashTendered - grandTotal);

  const handleCompleteOrder = async () => {
    if (paymentMethod === 'Cash' && cashTendered < grandTotal) {
      playTone('warning');
      toast.error(`Insufficient cash tendered. Total is Rs. ${grandTotal.toLocaleString()}`);
      return;
    }

    try {
      setIsProcessingSale(true);
      const orderPayload: Omit<PosOrder, 'id' | 'order_number' | 'created_at'> = {
        shift_id: activeShift?.id,
        order_number: ticketNumber,
        cashier_name: displayCashierName,
        customer_name: customerName,
        customer_tier: customerTier,
        terminal_code: posConfig.terminal_name || 'Terminal 01',
        fulfillment_type: fulfillmentType || 'In-Store Bag',
        subtotal,
        tax_percentage: taxPercent,
        tax_amount: taxAmount,
        discount_percentage: discountPercent,
        discount_amount: discountAmount,
        total_amount: grandTotal,
        payment_method: paymentMethod,
        cash_tendered: paymentMethod === 'Cash' ? cashTendered : grandTotal,
        change_due: paymentMethod === 'Cash' ? changeDue : 0,
        status: 'Completed',
        notes:
          (paymentMethod === 'Digital' || paymentMethod === 'Card') && selectedPaymentAccount
            ? `Paid via ${selectedPaymentAccount.bank_name} (${selectedPaymentAccount.account_number})${paymentRefNumber ? ` • Ref: ${paymentRefNumber}` : ''}`
            : undefined,
        items: cartItems,
      };

      const saved = await posService.createOrder(orderPayload);
      playTone('success');
      toast.success(`Sale completed! Order: ${saved.order_number}`);

      setCompletedOrder(saved);
      setIsPayModalOpen(false);
      setIsReceiptModalOpen(true);

      const updatedShift = posService.getActiveShift(currentCounterConfig?.name || posConfig.terminal_name);
      setActiveShift(updatedShift);
      setCartItems([]);
      setTicketNumber(updatedShift ? posService.getNextOrderNumber(updatedShift.business_date) : '');
      setDiscountPercent(0);
      setPaymentRefNumber('');
      setAccountSearchQuery('');
      setFulfillmentType(resolveInitialFulfillment(posConfig));
    } catch (err) {
      console.error('Failed to complete sale:', err);
      toast.error('Failed to save POS order');
    } finally {
      setIsProcessingSale(false);
    }
  };

  return {
    isPayModalOpen,
    setIsPayModalOpen,
    paymentMethod,
    setPaymentMethod,
    cashTendered,
    setCashTendered,
    isProcessingSale,
    selectedPaymentAccount,
    setSelectedPaymentAccount,
    accountSearchQuery,
    setAccountSearchQuery,
    paymentRefNumber,
    setPaymentRefNumber,
    completedOrder,
    setCompletedOrder,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    receiptSize,
    setReceiptSize,
    posPaymentAccounts,
    filteredPaymentAccounts,
    changeDue,
    handleCompleteOrder,
  };
};
