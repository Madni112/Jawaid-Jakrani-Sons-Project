import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { logActivity } from '../../../../../service/auditLogger';
import { SortConfig, InvoiceBalanceInfo } from '../types/salesHistoryTypes';
import { computeInvoiceBalances } from '../utils/salesBalanceCalculator';

export const useSalesHistoryState = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [returnedInvoiceNos, setReturnedInvoiceNos] = useState<string[]>([]);
  const [deliveryChallansMap, setDeliveryChallansMap] = useState<Record<string, any[]>>({});
  const [invoiceBalances, setInvoiceBalances] = useState<Record<string, InvoiceBalanceInfo>>({});

  const [selectedDcForModal, setSelectedDcForModal] = useState<any | null>(null);
  const [dcListForModal, setDcListForModal] = useState<any[] | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'tracking' | 'payment'>('tracking');
  const [previewInvoiceIndex, setPreviewInvoiceIndex] = useState<number | null>(null);
  const [isApprovingPayment, setIsApprovingPayment] = useState(false);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const openDcModal = (dc: any, defaultTab: 'tracking' | 'payment' = 'tracking') => {
    setSelectedDcForModal(dc);
    setActiveModalTab(defaultTab);
  };

  const handleApproveFreightPayment = async (dcId: number) => {
    setIsApprovingPayment(true);
    try {
      const { error } = await supabase
        .from('delivery_challans')
        .update({
          freight_payment_status: 'Approved',
        })
        .eq('id', dcId);

      if (error) throw error;

      toast.success('Freight charges approved successfully!');
      setSelectedDcForModal((prev: any) => (prev ? { ...prev, freight_payment_status: 'Approved' } : null));
      fetchInvoices();
    } catch (err: any) {
      toast.error('Failed to approve payment: ' + err.message);
    } finally {
      setIsApprovingPayment(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const { data: invoicesData, error: invError } = await supabase
        .from('sales_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      const { data: vouchersData } = await supabase.from('financial_vouchers').select('*');
      const { data: returnsData, error: retError } = await supabase.from('sales_returns').select('*');

      if (!retError && returnsData) {
        const cleanList = returnsData
          .map((r: any) => String(r.original_invoice_no || '').trim().toLowerCase())
          .filter(Boolean);
        setReturnedInvoiceNos(cleanList);
      }

      const { data: dcRows } = await supabase.from('delivery_challans').select('*');

      const dcMap: Record<string, any[]> = {};
      (dcRows || []).forEach((dc: any) => {
        const invKey = String(dc.invoice_no || '').trim().toLowerCase();
        if (invKey) {
          if (!dcMap[invKey]) dcMap[invKey] = [];
          dcMap[invKey].push(dc);
        }
      });
      setDeliveryChallansMap(dcMap);

      const balanceMap = computeInvoiceBalances(invoicesData || [], vouchersData || [], returnsData || []);
      setInvoiceBalances(balanceMap);
      setInvoices(invoicesData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDeleteInvoice = async (id: string | number) => {
    const rawInvoiceIdString = String(id).trim().toLowerCase();

    const isReturned = returnedInvoiceNos.some((retNo) => {
      return (
        retNo === rawInvoiceIdString ||
        retNo === `inv-${rawInvoiceIdString}` ||
        retNo === `inv-${rawInvoiceIdString.padStart(4, '0')}` ||
        retNo.includes(rawInvoiceIdString)
      );
    });

    const targetInv = invoices.find((i) => i.id === id);
    const isReturnedStatus =
      isReturned ||
      String(targetInv?.receipt_status).trim().toLowerCase() === 'returned' ||
      String(targetInv?.sale_status).trim().toLowerCase() === 'returned';

    if (isReturnedStatus) {
      toast.error('First delete sale return entry to delete this for same invoice');
      return;
    }

    const invKey = String(targetInv?.invoice_no || `INV-${String(id).padStart(4, '0')}`).trim().toLowerCase();
    const linkedDcs = deliveryChallansMap[invKey] || [];
    const hasDispatchedItems = linkedDcs.some((dc) => {
      if (['Dispatched', 'Partially Dispatched', 'Fully Dispatched'].includes(dc.status)) return true;
      if (dc.items) {
        return dc.items.some((item: any) => Number(item.dispatchedQty || 0) > 0);
      }
      return false;
    });

    if (hasDispatchedItems) {
      toast.error('Cannot delete: Goods have already been dispatched. Please process a Sales Return instead.');
      return;
    }

    if (!window.confirm('Are you certain you want to permanently delete this invoice record?')) return;

    try {
      setLoading(true);
      const { data: targetInvoice, error: fetchError } = await supabase
        .from('sales_invoices')
        .select('items, dispatch_warehouse, invoice_no, customer_name, total_amount')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (targetInvoice && targetInvoice.items) {
        for (const item of targetInvoice.items) {
          const itemQuantityToRestore = Number(item.qty) || 0;
          const { data: currentProduct } = await supabase
            .from('products')
            .select('current_stock')
            .ilike('product_name', item.itemName)
            .maybeSingle();

          if (currentProduct) {
            const restoredMasterStockCount = (Number(currentProduct.current_stock) || 0) + itemQuantityToRestore;
            await supabase
              .from('products')
              .update({ current_stock: restoredMasterStockCount })
              .ilike('product_name', item.itemName);
          }
        }
      }

      const invoiceIdentifier = targetInvoice?.invoice_no
        ? String(targetInvoice.invoice_no).trim()
        : `INV-${String(id).padStart(4, '0')}`;
      if (invoiceIdentifier) {
        await supabase.from('delivery_challans').delete().eq('invoice_no', invoiceIdentifier);
        try {
          await supabase.from('financial_vouchers').delete().eq('original_invoice_no', invoiceIdentifier);
        } catch (vchDelErr) {
          console.warn('Vouchers deletion warning for invoice:', invoiceIdentifier, vchDelErr);
        }
      }

      const { error: deleteError } = await supabase.from('sales_invoices').delete().eq('id', id);
      if (deleteError) throw deleteError;

      logActivity({
        action: 'DELETE',
        tableName: 'sales_invoices',
        details: {
          id,
          invoice_number: invoiceIdentifier,
          customer_name: targetInvoice?.customer_name,
          total_amount: targetInvoice?.total_amount,
          event: `Deleted sales invoice ${invoiceIdentifier} (${targetInvoice?.customer_name || 'Customer'})`,
        },
      });

      toast.success('Invoice deleted cleanly. Stock metrics restored!');
      fetchInvoices();
    } catch (err: any) {
      toast.error('Deletion Interrupted: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    let result = invoices.filter(
      (inv) =>
        inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.id.toString().includes(searchTerm)
    );

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'invoice_no') {
          aVal = a.invoice_no || `INV-${String(a.id).padStart(4, '0')}`;
          bVal = b.invoice_no || `INV-${String(b.id).padStart(4, '0')}`;
        }
        if (sortConfig.key === 'sale_date') {
          aVal = a.sale_date || a.created_at;
          bVal = b.sale_date || b.created_at;
        }

        if (sortConfig.key === 'cash_amount_paid' || sortConfig.key === 'amount_received') {
          aVal = invoiceBalances[String(a.id)]?.received ?? Number(a.cash_amount_paid || 0);
          bVal = invoiceBalances[String(b.id)]?.received ?? Number(b.cash_amount_paid || 0);
        } else if (sortConfig.key === 'remaining') {
          aVal =
            invoiceBalances[String(a.id)]?.remaining ??
            Math.max(0, Number(a.total_amount || 0) - Number(a.cash_amount_paid || 0));
          bVal =
            invoiceBalances[String(b.id)]?.remaining ??
            Math.max(0, Number(b.total_amount || 0) - Number(b.cash_amount_paid || 0));
        } else if (['total_amount', 'bank_amount', 'id'].includes(sortConfig.key)) {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [invoices, searchTerm, sortConfig, invoiceBalances]);

  const handlePrevInvoice = () => {
    if (previewInvoiceIndex !== null && previewInvoiceIndex > 0) {
      setPreviewInvoiceIndex(previewInvoiceIndex - 1);
    }
  };

  const handleNextInvoice = () => {
    if (previewInvoiceIndex !== null && previewInvoiceIndex < filteredInvoices.length - 1) {
      setPreviewInvoiceIndex(previewInvoiceIndex + 1);
    }
  };

  useEffect(() => {
    if (previewInvoiceIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevInvoice();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextInvoice();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPreviewInvoiceIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewInvoiceIndex, filteredInvoices.length]);

  const previewInvoice = previewInvoiceIndex !== null ? filteredInvoices[previewInvoiceIndex] : null;

  const totalEntries = filteredInvoices.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + pageSize);

  return {
    invoices,
    sortConfig,
    loading,
    searchTerm,
    setSearchTerm,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    returnedInvoiceNos,
    deliveryChallansMap,
    invoiceBalances,
    selectedDcForModal,
    setSelectedDcForModal,
    dcListForModal,
    setDcListForModal,
    activeModalTab,
    setActiveModalTab,
    previewInvoiceIndex,
    setPreviewInvoiceIndex,
    isApprovingPayment,
    previewInvoice,
    filteredInvoices,
    paginatedInvoices,
    totalEntries,
    totalPages,
    startIndex,
    endIndex,
    handleSort,
    openDcModal,
    handleApproveFreightPayment,
    handleDeleteInvoice,
    handlePrevInvoice,
    handleNextInvoice,
    fetchInvoices,
  };
};
