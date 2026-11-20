import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { useAuth } from '../../../Context/Auth';
import Spinner from '../../../ui/Spinner';
import {
  MdArrowBack,
  MdPrint,
  MdFileDownload,
  MdViewModule,
  MdFormatListBulleted,
  MdAccountBalance,
  MdPeople,
  MdStore,
  MdAccountBalanceWallet,
  MdTrendingDown,
  MdInfoOutline,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdReceiptLong,
  MdPayments,
  MdAssignmentReturn,
  MdAccountTree,
  MdUnfoldMore,
  MdUnfoldLess
} from 'react-icons/md';
import { BasicAccountFilterCriteria, BasicAccountSortBy } from './BasicAccountReport';

const STORAGE_CRITERIA_KEY = 'zac_basic_account_report_criteria_v2';

export const BasicAccountReportPrint: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantId } = useAuth();

  // Active filter criteria
  const [criteria, setCriteria] = useState<BasicAccountFilterCriteria | null>(() => {
    if (location.state?.criteria) return location.state.criteria;
    try {
      const saved = localStorage.getItem(STORAGE_CRITERIA_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [businessName, setBusinessName] = useState<string>('Zohaib Ali & Company');
  const [rawCustomers, setRawCustomers] = useState<any[]>([]);
  const [rawVendors, setRawVendors] = useState<any[]>([]);
  const [rawCoa, setRawCoa] = useState<any[]>([]);
  const [rawBanks, setRawBanks] = useState<any[]>([]);
  const [invoicesSummary, setInvoicesSummary] = useState<Record<string, { count: number; total: number; paid: number }>>({});
  const [returnsSummary, setReturnsSummary] = useState<Record<string, number>>({});
  const [purchasesSummary, setPurchasesSummary] = useState<Record<string, { count: number; total: number; paid: number }>>({});
  const [purchaseReturnsSummary, setPurchaseReturnsSummary] = useState<Record<string, number>>({});

  // Detailed transaction & voucher master sets
  const [detailedInvoices, setDetailedInvoices] = useState<any[]>([]);
  const [detailedPurchases, setDetailedPurchases] = useState<any[]>([]);
  const [detailedSalesReturns, setDetailedSalesReturns] = useState<any[]>([]);
  const [detailedPurchaseReturns, setDetailedPurchaseReturns] = useState<any[]>([]);
  const [vouchersMaster, setVouchersMaster] = useState<any[]>([]);

  // Global & Per-Row Breakdown Expansion (High-Speed O(1) State like Sales/Purchase reports)
  const [expandAllBreakdown, setExpandAllBreakdown] = useState(false);
  const [isTogglingExpand, setIsTogglingExpand] = useState(false);
  const [individualToggledIds, setIndividualToggledIds] = useState<Set<string>>(new Set());

  // Check if a row is expanded: O(1) instant lookup
  const isRowExpanded = (partyId: string | number) => {
    const idStr = String(partyId);
    if (expandAllBreakdown) {
      return !individualToggledIds.has(idStr); // Expanded unless individually collapsed
    }
    return individualToggledIds.has(idStr); // Collapsed unless individually expanded
  };

  const handleToggleRow = (partyId: string | number) => {
    const idStr = String(partyId);
    setIndividualToggledIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });
  };

  // Toggle all breakdowns with asynchronous loader to prevent UI freeze
  const handleToggleAllBreakdowns = () => {
    if (isTogglingExpand) return;
    setIsTogglingExpand(true);
    setTimeout(() => {
      setExpandAllBreakdown((prev) => !prev);
      setIndividualToggledIds(new Set()); // Reset individual overrides
      setTimeout(() => {
        setIsTogglingExpand(false);
      }, 120);
    }, 50);
  };

  // Layout Theme: 'modern' | 'classic'
  const [layoutTheme, setLayoutTheme] = useState<'modern' | 'classic'>(() => {
    try {
      return localStorage.getItem('jakwani_reports_layout') === 'classic' ? 'classic' : 'modern';
    } catch {}
    return 'modern';
  });

  const toggleLayout = () => {
    const next = layoutTheme === 'modern' ? 'classic' : 'modern';
    setLayoutTheme(next);
    try {
      localStorage.setItem('jakwani_reports_layout', next);
    } catch {}
  };

  const handleHeaderSort = (col: 'code' | 'name' | 'opening' | 'invoiced' | 'received' | 'return' | 'balance' | 'expense') => {
    setCriteria((prev) => {
      if (!prev) return null;
      let nextSort: BasicAccountSortBy = 'balance_desc';
      if (col === 'balance') {
        nextSort = prev.sortBy === 'balance_desc' ? 'balance_asc' : 'balance_desc';
      } else if (col === 'expense') {
        nextSort = prev.sortBy === 'expense_desc' ? 'expense_asc' : 'expense_desc';
      } else if (col === 'opening') {
        nextSort = prev.sortBy === 'opening_desc' ? 'opening_asc' : 'opening_desc';
      } else if (col === 'invoiced') {
        nextSort = prev.sortBy === 'invoiced_desc' ? 'invoiced_asc' : 'invoiced_desc';
      } else if (col === 'received') {
        nextSort = prev.sortBy === 'received_desc' ? 'received_asc' : 'received_desc';
      } else if (col === 'return') {
        nextSort = prev.sortBy === 'return_desc' ? 'return_asc' : 'return_desc';
      } else if (col === 'name') {
        nextSort = prev.sortBy === 'name_asc' ? 'name_desc' : 'name_asc';
      } else if (col === 'code') {
        nextSort = prev.sortBy === 'code_asc' ? 'code_desc' : 'code_asc';
      }
      return { ...prev, sortBy: nextSort };
    });
  };

  // ── DATA FETCHING & LOCAL CACHE REUSE ──
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // Fetch fresh data including vouchers, invoices, purchases, returns
        const [
          cRes,
          vRes,
          coaRes,
          bRes,
          invRes,
          retRes,
          purRes,
          pretRes,
          vouchRes
        ] = await Promise.all([
          fetchAllPages(supabase.from('customers').select('*').order('customer_name')),
          fetchAllPages(supabase.from('vendors').select('*').order('name')),
          fetchAllPages(supabase.from('chart_of_accounts').select('*').order('account_code')),
          fetchAllPages(supabase.from('banks').select('*').order('bank_name')),
          fetchAllPages(supabase.from('sales_invoices').select('id, invoice_no, customer_name, sale_date, total_amount, amount_paid, payment_term').order('sale_date', { ascending: true })),
          fetchAllPages(supabase.from('sales_returns').select('id, return_no, customer_name, return_date, total_amount').order('return_date', { ascending: true })),
          fetchAllPages(supabase.from('supplier_purchases').select('id, purchase_no, vendor_name, supplier_name, purchase_date, total_amount, amount_paid, paid_amount, remaining_balance, status, payment_term').order('purchase_date', { ascending: true })),
          fetchAllPages(supabase.from('purchase_returns').select('id, return_no, vendor_name, return_date, total_amount').order('return_date', { ascending: true })),
          fetchAllPages(supabase.from('financial_vouchers').select('id, voucher_no, voucher_type, voucher_date, customer_name, party_name, debit, credit, total_amount, original_invoice_no, metadata, description').order('voucher_date', { ascending: true }))
        ]);

        if (!isMounted) return;

        // Build invoice & return balance maps for customers
        const invSum: Record<string, { count: number; total: number; paid: number }> = {};
        (invRes.data || []).forEach((inv: any) => {
          const key = (inv.customer_name || '').trim().toLowerCase();
          if (!key) return;
          if (!invSum[key]) invSum[key] = { count: 0, total: 0, paid: 0 };
          invSum[key].count += 1;
          invSum[key].total += Number(inv.total_amount || 0);
          invSum[key].paid += Number(inv.amount_paid || 0);
        });

        const retSum: Record<string, number> = {};
        (retRes.data || []).forEach((ret: any) => {
          const key = (ret.customer_name || '').trim().toLowerCase();
          if (!key) return;
          retSum[key] = (retSum[key] || 0) + Number(ret.total_amount || 0);
        });

        // Sum vouchers for customer receipts and vendor payments
        const custReceiptSum: Record<string, number> = {};
        const vendPaymentSum: Record<string, number> = {};
        (vouchRes.data || []).forEach((v: any) => {
          const p = (v.party_name || v.customer_name || '').trim().toLowerCase();
          if (!p) return;
          const isReceive =
            (v.voucher_type || '').includes('Receive') ||
            (v.voucher_no || '').startsWith('CRV') ||
            (Number(v.credit || 0) > 0 && !(v.voucher_type || '').includes('Return') && !(v.voucher_type || '').includes('Accrual'));
          if (isReceive) {
            custReceiptSum[p] = (custReceiptSum[p] || 0) + Number(v.credit || v.total_amount || 0);
          }
          const isPayment =
            (v.voucher_type || '').includes('Payment') ||
            (v.voucher_no || '').startsWith('CPV') ||
            (v.voucher_no || '').startsWith('VPV') ||
            (v.voucher_no || '').startsWith('BPV') ||
            (Number(v.debit || 0) > 0 && !(v.voucher_type || '').includes('Return') && !(v.voucher_type || '').includes('Accrual') && !(v.voucher_type || '').includes('Sale'));
          if (isPayment) {
            vendPaymentSum[p] = (vendPaymentSum[p] || 0) + Number(v.debit || v.total_amount || 0);
          }
        });

        // Build live purchase & return balance maps for vendors
        const purSum: Record<string, { count: number; total: number; paid: number }> = {};
        (purRes.data || []).forEach((p: any) => {
          const key = (p.vendor_name || p.supplier_name || '').trim().toLowerCase();
          if (!key) return;
          if (!purSum[key]) purSum[key] = { count: 0, total: 0, paid: 0 };
          purSum[key].count += 1;
          purSum[key].total += Number(p.total_amount || 0);
          purSum[key].paid += Number(p.amount_paid || p.paid_amount || 0);
        });

        const pretSum: Record<string, number> = {};
        (pretRes.data || []).forEach((r: any) => {
          const key = (r.vendor_name || '').trim().toLowerCase();
          if (!key) return;
          pretSum[key] = (pretSum[key] || 0) + Number(r.total_amount || 0);
        });

        // Discover any ad-hoc customers from invoices/vouchers not in customers master
        const existingCustNames = new Set(
          (cRes.data || []).map((c: any) => (c.customer_name || c.name || '').trim().toLowerCase())
        );
        const adhocCustomers: any[] = [];
        (invRes.data || []).forEach((inv: any) => {
          const k = (inv.customer_name || '').trim();
          const kLower = k.toLowerCase();
          if (k && !existingCustNames.has(kLower)) {
            existingCustNames.add(kLower);
            adhocCustomers.push({
              id: `adhoc-${kLower}`,
              customer_name: k,
              customer_code: 'POS',
              opening_balance: 0,
              balance_nature: 'debit',
              area: 'Direct / Walk-in'
            });
          }
        });
        (vouchRes.data || []).forEach((v: any) => {
          const k = (v.party_name || v.customer_name || '').trim();
          const kLower = k.toLowerCase();
          if (k && !existingCustNames.has(kLower)) {
            existingCustNames.add(kLower);
            adhocCustomers.push({
              id: `adhoc-${kLower}`,
              customer_name: k,
              customer_code: 'VOUCHER',
              opening_balance: 0,
              balance_nature: 'credit',
              area: 'Direct / Walk-in'
            });
          }
        });
        const combinedCustPool = [...(cRes.data || []), ...adhocCustomers];

        // Dynamic Customers (Opening + Invoiced - Paid - Returns)
        const loadedCust = combinedCustPool.map((c: any) => {
          const k = (c.customer_name || c.customerName || c.name || '').trim().toLowerCase();
          const invInfo = invSum[k] || { count: 0, total: 0, paid: 0 };
          const retTotal = retSum[k] || 0;
          const openBal = Math.abs(Number(c.opening_balance || 0));
          const effectiveOpen = (c.balance_nature || '').toLowerCase().includes('credit') ? -openBal : openBal;
          const paidTotal = Math.max(invInfo.paid, custReceiptSum[k] || 0);
          const dynamicNet = invInfo.total - paidTotal - retTotal;
          const finalBal = effectiveOpen + dynamicNet;

          return {
            ...c,
            balance: finalBal,
            current_balance: finalBal,
            computed_balance: finalBal
          };
        });

        // Dynamic Vendors (Opening + Purchases - Paid - Returns)
        const loadedVen = (vRes.data || []).map((v: any) => {
          const k = (v.vendor_name || v.name || '').trim().toLowerCase();
          const purInfo = purSum[k] || { count: 0, total: 0, paid: 0 };
          const retTotal = pretSum[k] || 0;
          const openBal = Math.abs(Number(v.opening_balance || 0));
          const effectiveOpen = (v.balance_nature || '').toLowerCase().includes('debit') ? -openBal : openBal;
          const paidTotal = Math.max(purInfo.paid, vendPaymentSum[k] || 0);
          const dynamicNet = purInfo.total - paidTotal - retTotal;
          const finalBal = effectiveOpen + dynamicNet;

          return {
            ...v,
            balance: finalBal,
            currentBalance: finalBal,
            current_balance: finalBal,
            computed_balance: finalBal
          };
        });

        const loadedCoa = coaRes.data || [];
        const loadedBanks = bRes.data || [];

        setRawCustomers(loadedCust);
        setRawVendors(loadedVen);
        setRawCoa(loadedCoa);
        setRawBanks(loadedBanks);
        setInvoicesSummary(invSum);
        setReturnsSummary(retSum);
        setPurchasesSummary(purSum);
        setPurchaseReturnsSummary(pretSum);

        setDetailedInvoices(invRes.data || []);
        setDetailedPurchases(purRes.data || []);
        setDetailedSalesReturns(retRes.data || []);
        setDetailedPurchaseReturns(pretRes.data || []);
        setVouchersMaster(vouchRes.data || []);
      } catch (err) {
        console.error('Failed to load basic account print data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── PARSE & FILTER ACCOUNT ROWS WITH NESTED TRANSACTION / VOUCHER TREE ──
  const parsedAccountRows = useMemo(() => {
    if (!criteria) return [];

    // Helper map of vouchers indexed by invoice/reference number and party name
    const vouchersByInvoiceNo: Record<string, any[]> = {};
    const vouchersByParty: Record<string, any[]> = {};

    vouchersMaster.forEach((v) => {
      if (v.original_invoice_no) {
        const invK = String(v.original_invoice_no).trim().toLowerCase();
        if (!vouchersByInvoiceNo[invK]) vouchersByInvoiceNo[invK] = [];
        vouchersByInvoiceNo[invK].push(v);
      }
      const pName = (v.party_name || v.customer_name || '').trim().toLowerCase();
      if (pName) {
        if (!vouchersByParty[pName]) vouchersByParty[pName] = [];
        vouchersByParty[pName].push(v);
      }
    });

    if (criteria.reportType === 'customer') {
      let pool = rawCustomers;

      // Filter by selected parties
      if (criteria.partyIds && criteria.partyIds.length > 0) {
        const idSet = new Set(criteria.partyIds);
        pool = pool.filter((c) => idSet.has(String(c.id)) || idSet.has(String(c.customer_code || c.customerCode)));
      }

      // Filter by areas
      if (criteria.areas && criteria.areas.length > 0) {
        const arSet = new Set(criteria.areas.map((a) => a.toLowerCase().trim()));
        pool = pool.filter((c) => {
          const a = String(c.area || c.city || '').toLowerCase().trim();
          return arSet.has(a);
        });
      }

      const rows = pool.map((c) => {
        const cId = String(c.id);
        const cName = String(c.customer_name || c.customerName || c.customername || c.name || '').trim().toLowerCase();
        const openBal = Math.abs(Number(c.opening_balance || 0));
        const initialOpen = (c.balance_nature || '').toLowerCase().includes('credit') ? -openBal : openBal;

        // Build party's transaction and voucher hierarchy
        const partyInvoices = detailedInvoices.filter(
          (inv) => (inv.customer_name || '').trim().toLowerCase() === cName
        );
        const partyReturns = detailedSalesReturns.filter(
          (ret) => (ret.customer_name || '').trim().toLowerCase() === cName
        );
        const partyVouchers = (vouchersByParty[cName] || []).filter(
          (v) =>
            (v.voucher_type || '').includes('Receive') ||
            (v.voucher_no || '').startsWith('CRV') ||
            (Number(v.credit || 0) > 0 && !(v.voucher_type || '').includes('Return') && !(v.voucher_type || '').includes('Accrual'))
        );

        const hasDateRange = criteria.dateMode === 'multi' && Boolean(criteria.dateFrom) && Boolean(criteria.dateTo);
        const hasSingleDate = criteria.dateMode === 'single' && Boolean(criteria.singleDate);

        let preInvoiced = 0;
        let preReceived = 0;
        let preReturns = 0;

        let activeInvoices = partyInvoices;
        let activeVouchers = partyVouchers;
        let activeReturns = partyReturns;

        if (hasDateRange) {
          const dFrom = criteria.dateFrom!;
          const dTo = criteria.dateTo!;

          partyInvoices.forEach((inv) => {
            if (inv.sale_date && inv.sale_date < dFrom) {
              preInvoiced += Number(inv.total_amount || 0);
            }
          });
          partyVouchers.forEach((v) => {
            if (v.voucher_date && v.voucher_date < dFrom) {
              preReceived += Number(v.credit || v.total_amount || 0);
            }
          });
          partyReturns.forEach((ret) => {
            if (ret.return_date && ret.return_date < dFrom) {
              preReturns += Number(ret.total_amount || 0);
            }
          });

          activeInvoices = partyInvoices.filter((inv) => !inv.sale_date || (inv.sale_date >= dFrom && inv.sale_date <= dTo));
          activeVouchers = partyVouchers.filter((v) => !v.voucher_date || (v.voucher_date >= dFrom && v.voucher_date <= dTo));
          activeReturns = partyReturns.filter((ret) => !ret.return_date || (ret.return_date >= dFrom && ret.return_date <= dTo));
        } else if (hasSingleDate) {
          const sDate = criteria.singleDate!;
          activeInvoices = partyInvoices.filter((inv) => !inv.sale_date || inv.sale_date <= sDate);
          activeVouchers = partyVouchers.filter((v) => !v.voucher_date || v.voucher_date <= sDate);
          activeReturns = partyReturns.filter((ret) => !ret.return_date || ret.return_date <= sDate);
        }

        const periodOpeningBal = initialOpen + preInvoiced - preReceived - preReturns;

        // 1. Bill Vouchers (SAV) in active period
        const bills = activeInvoices.map((inv) => {
          const invKey = String(inv.invoice_no || '').trim().toLowerCase();
          const matchedVoucher = (vouchersByInvoiceNo[invKey] || []).find(
            (v) => (v.voucher_type || '').includes('Sale') || (v.voucher_no || '').startsWith('SAV')
          );
          const totalAmt = Number(inv.total_amount || 0);
          const paidAmt = Number(inv.amount_paid || 0);
          return {
            id: String(inv.id),
            billNo: inv.invoice_no || '—',
            voucherNo: matchedVoucher?.voucher_no || `SAV-${inv.invoice_no || 'NA'}`,
            voucherType: matchedVoucher?.voucher_type || 'Sale Amount Voucher',
            date: inv.sale_date || matchedVoucher?.voucher_date || '—',
            amount: totalAmt,
            paid: paidAmt,
            balance: Math.max(0, totalAmt - paidAmt)
          };
        });

        // 2. Receipt / Payment Vouchers (CRV) in active period
        const receipts = activeVouchers.map((v) => ({
          id: String(v.id),
          voucherNo: v.voucher_no,
          voucherType: v.voucher_type || 'Customer Receive Voucher',
          refNo: v.original_invoice_no || 'Receipt Slip',
          date: v.voucher_date || '—',
          amount: Number(v.credit || v.total_amount || 0),
          mode: v.description || 'Cash / Bank Receipt'
        }));

        // 3. Return Vouchers (SRV) in active period
        const returns = activeReturns.map((ret) => {
          const retKey = String(ret.return_no || '').trim().toLowerCase();
          const matchedVoucher = (vouchersByInvoiceNo[retKey] || []).find(
            (v) => (v.voucher_type || '').includes('Return') || (v.voucher_no || '').startsWith('SRV')
          );
          return {
            id: String(ret.id),
            returnNo: ret.return_no || '—',
            voucherNo: matchedVoucher?.voucher_no || `SRV-${ret.return_no || 'NA'}`,
            voucherType: matchedVoucher?.voucher_type || 'Sale Return Voucher',
            date: ret.return_date || matchedVoucher?.voucher_date || '—',
            amount: Number(ret.total_amount || 0)
          };
        });

        const invoicedTotal = bills.reduce((sum, b) => sum + b.amount, 0);
        const voucherReceived = receipts.reduce((sum, rc) => sum + rc.amount, 0);
        const invoicePaidSum = bills.reduce((sum, b) => sum + b.paid, 0);
        const receivedTotal = Math.max(invoicePaidSum, voucherReceived);
        const retAmt = returns.reduce((sum, r) => sum + r.amount, 0);

        const closeBal = periodOpeningBal + invoicedTotal - receivedTotal - retAmt;

        return {
          id: c.id,
          code: c.customer_code || c.customerCode || c.account_code || '—',
          name: c.customer_name || c.customerName || c.customername || c.name || 'Customer',
          area: c.area || c.city || '—',
          phone: c.phone || c.primaryPhone || c.primaryphone || '—',
          openingBalance: periodOpeningBal,
          invoicedAmount: invoicedTotal,
          receivedAmount: receivedTotal,
          returnAmount: retAmt,
          closingBalance: closeBal,
          balanceNature: closeBal >= 0 ? 'Dr (Receivable)' : 'Cr (Advance)',
          detailTree: {
            bills,
            receipts,
            returns,
            totalBills: invoicedTotal,
            totalPayments: receivedTotal,
            totalReturns: retAmt
          }
        };
      });

      if (criteria.hideZeroBalances) {
        return rows.filter((r) => Math.abs(r.closingBalance) > 0.01);
      }
      return rows;
    }

    if (criteria.reportType === 'vendor') {
      let pool = rawVendors;

      if (criteria.partyIds && criteria.partyIds.length > 0) {
        const idSet = new Set(criteria.partyIds);
        pool = pool.filter((v) => idSet.has(String(v.id)) || idSet.has(String(v.vendor_code || v.vendorCode)));
      }

      const rows = pool.map((v) => {
        const vName = String(v.vendor_name || v.name || '').trim().toLowerCase();
        const openBal = Math.abs(Number(v.opening_balance || 0));
        const initialOpen = (v.balance_nature || '').toLowerCase().includes('debit') ? -openBal : openBal;

        // Build vendor's transaction and voucher hierarchy
        const partyPurchases = detailedPurchases.filter(
          (p) =>
            (p.vendor_name || '').trim().toLowerCase() === vName ||
            (p.supplier_name || '').trim().toLowerCase() === vName
        );
        const partyReturns = detailedPurchaseReturns.filter(
          (ret) => (ret.vendor_name || '').trim().toLowerCase() === vName
        );
        const partyVouchers = (vouchersByParty[vName] || []).filter(
          (v) =>
            (v.voucher_type || '').includes('Payment') ||
            (v.voucher_no || '').startsWith('CPV') ||
            (v.voucher_no || '').startsWith('VPV') ||
            (v.voucher_no || '').startsWith('BPV') ||
            (Number(v.debit || 0) > 0 && !(v.voucher_type || '').includes('Return') && !(v.voucher_type || '').includes('Accrual') && !(v.voucher_type || '').includes('Sale'))
        );

        const hasDateRange = criteria.dateMode === 'multi' && Boolean(criteria.dateFrom) && Boolean(criteria.dateTo);
        const hasSingleDate = criteria.dateMode === 'single' && Boolean(criteria.singleDate);

        let prePurchased = 0;
        let prePaid = 0;
        let preReturns = 0;

        let activePurchases = partyPurchases;
        let activeVouchers = partyVouchers;
        let activeReturns = partyReturns;

        if (hasDateRange) {
          const dFrom = criteria.dateFrom!;
          const dTo = criteria.dateTo!;

          partyPurchases.forEach((p) => {
            if (p.purchase_date && p.purchase_date < dFrom) {
              prePurchased += Number(p.total_amount || 0);
            }
          });
          partyVouchers.forEach((v) => {
            if (v.voucher_date && v.voucher_date < dFrom) {
              prePaid += Number(v.debit || v.total_amount || 0);
            }
          });
          partyReturns.forEach((ret) => {
            if (ret.return_date && ret.return_date < dFrom) {
              preReturns += Number(ret.total_amount || 0);
            }
          });

          activePurchases = partyPurchases.filter((p) => !p.purchase_date || (p.purchase_date >= dFrom && p.purchase_date <= dTo));
          activeVouchers = partyVouchers.filter((v) => !v.voucher_date || (v.voucher_date >= dFrom && v.voucher_date <= dTo));
          activeReturns = partyReturns.filter((ret) => !ret.return_date || (ret.return_date >= dFrom && ret.return_date <= dTo));
        } else if (hasSingleDate) {
          const sDate = criteria.singleDate!;
          activePurchases = partyPurchases.filter((p) => !p.purchase_date || p.purchase_date <= sDate);
          activeVouchers = partyVouchers.filter((v) => !v.voucher_date || v.voucher_date <= sDate);
          activeReturns = partyReturns.filter((ret) => !ret.return_date || ret.return_date <= sDate);
        }

        const periodOpeningBal = initialOpen + prePurchased - prePaid - preReturns;

        // 1. Bill Vouchers (PAV)
        const bills = activePurchases.map((p) => {
          const pKey = String(p.purchase_no || '').trim().toLowerCase();
          const matchedVoucher = (vouchersByInvoiceNo[pKey] || []).find(
            (v) => (v.voucher_type || '').includes('Purchase') || (v.voucher_no || '').startsWith('PAV')
          );
          return {
            id: String(p.id),
            billNo: p.purchase_no || '—',
            voucherNo: matchedVoucher?.voucher_no || `PAV-${p.purchase_no || 'NA'}`,
            voucherType: matchedVoucher?.voucher_type || 'Purchase Accrual Voucher',
            date: p.purchase_date || matchedVoucher?.voucher_date || '—',
            amount: Number(p.total_amount || 0),
            paid: Number(p.amount_paid || p.paid_amount || 0),
            balance: Number(p.remaining_balance || 0)
          };
        });

        // 2. Payment Vouchers (CPV / VPV / BPV)
        const receipts = activeVouchers.map((v) => ({
          id: String(v.id),
          voucherNo: v.voucher_no,
          voucherType: v.voucher_type || 'Payment Voucher',
          refNo: v.original_invoice_no || 'Payment Slip',
          date: v.voucher_date || '—',
          amount: Number(v.debit || v.total_amount || 0),
          mode: v.description || 'Cash / Bank Payment'
        }));

        // 3. Return Vouchers (PRV)
        const returns = activeReturns.map((ret) => {
          const retKey = String(ret.return_no || '').trim().toLowerCase();
          const matchedVoucher = (vouchersByInvoiceNo[retKey] || []).find(
            (v) => (v.voucher_type || '').includes('Return') || (v.voucher_no || '').startsWith('PRV')
          );
          return {
            id: String(ret.id),
            returnNo: ret.return_no || '—',
            voucherNo: matchedVoucher?.voucher_no || `PRV-${ret.return_no || 'NA'}`,
            voucherType: matchedVoucher?.voucher_type || 'Purchase Return Voucher',
            date: ret.return_date || matchedVoucher?.voucher_date || '—',
            amount: Number(ret.total_amount || 0)
          };
        });

        const invoicedTotal = bills.reduce((sum, b) => sum + b.amount, 0);
        const voucherPaid = receipts.reduce((sum, rc) => sum + rc.amount, 0);
        const purPaidSum = bills.reduce((sum, b) => sum + b.paid, 0);
        const paidTotal = Math.max(purPaidSum, voucherPaid);
        const retAmt = returns.reduce((sum, r) => sum + r.amount, 0);

        const closeBal = periodOpeningBal + invoicedTotal - paidTotal - retAmt;

        return {
          id: v.id,
          code: v.vendor_code || v.vendorCode || '—',
          name: v.vendor_name || v.name || 'Vendor',
          area: v.category || v.city || 'Supplier',
          phone: v.phone || v.phone_no || v.cell_no || v.mobile || '—',
          openingBalance: periodOpeningBal,
          invoicedAmount: invoicedTotal,
          receivedAmount: paidTotal,
          returnAmount: retAmt,
          closingBalance: closeBal,
          balanceNature: closeBal >= 0 ? 'Cr (Payable)' : 'Dr (Advance Paid)',
          detailTree: {
            bills,
            receipts,
            returns,
            totalBills: invoicedTotal,
            totalPayments: paidTotal,
            totalReturns: retAmt
          }
        };
      });

      if (criteria.hideZeroBalances) {
        return rows.filter((r) => Math.abs(r.closingBalance) > 0.01);
      }
      return rows;
    }

    // Chart of Accounts / Cash & Bank / Expense
    let pool = rawCoa;

    if (criteria.accountHeads && criteria.accountHeads.length > 0) {
      const headSet = new Set(criteria.accountHeads);
      pool = pool.filter((acc) => headSet.has(String(acc.account_code || '').charAt(0)));
    }

    if (criteria.subHeads && criteria.subHeads.length > 0) {
      const subSet = new Set(criteria.subHeads);
      pool = pool.filter((acc) => subSet.has(String(acc.account_code || '').substring(0, 2)));
    }

    if (criteria.accountCodes && criteria.accountCodes.length > 0) {
      const cSet = new Set(criteria.accountCodes);
      pool = pool.filter((acc) => cSet.has(String(acc.account_code)));
    }

    if (criteria.reportType === 'expense') {
      pool = pool.filter((acc) => String(acc.account_code || '').startsWith('5'));
    } else if (criteria.reportType === 'cash_bank') {
      pool = pool.filter((acc) => {
        const code = String(acc.account_code || '');
        const title = String(acc.account_title || '').toLowerCase();
        const head = String(acc.head_name || '').toLowerCase();

        // Strictly exclude Receivables, Inventory, Loans, and Opening Balance suspense
        if (code.startsWith('1020') || code.startsWith('1030') || code === '1011') return false;
        if (code.startsWith('2') || title.includes('loan')) return false;
        if (title.includes('receivable') || title.includes('inventory') || title.includes('stock')) return false;

        // Include genuine Cash & Bank asset accounts
        return (
          code.startsWith('1010') ||
          code.startsWith('1000') ||
          title.includes('cash') ||
          ((head.includes('asset') || code.startsWith('1')) && title.includes('bank'))
        );
      });

      // Add registered bank accounts from rawBanks if not already present
      const existingTitles = new Set(pool.map((p) => String(p.account_title || '').trim().toLowerCase()));
      rawBanks.forEach((b: any) => {
        const bTitle = String(b.account_title || b.accountTitle || b.bank_name || b.bankName || '').trim();
        if (bTitle && !existingTitles.has(bTitle.toLowerCase())) {
          pool.push({
            id: `bank-${b.id}`,
            account_code: b.account_number || b.accountNumber || `BNK-${b.id}`,
            account_title: b.bank_name || b.bankName ? `${b.bank_name || b.bankName} (${bTitle})` : bTitle,
            head_name: 'Assets',
            sub_head_name: 'Bank Accounts',
            opening_balance: Number(b.opening_balance || b.current_balance || 0),
            balance_nature: 'debit',
            area: b.branch_name || 'Bank'
          });
        }
      });
    }

    // Helper lookups to connect COA party accounts to dynamic ledger transactions
    const hasDateRange = criteria.dateMode === 'multi' && Boolean(criteria.dateFrom) && Boolean(criteria.dateTo);
    const hasSingleDate = criteria.dateMode === 'single' && Boolean(criteria.singleDate);
    const dFrom = criteria.dateFrom;
    const dTo = criteria.dateTo;
    const sDate = criteria.singleDate;

    const custByCode = new Map<string, any>();
    const custByName = new Map<string, any>();
    rawCustomers.forEach((c) => {
      if (c.customer_code) custByCode.set(String(c.customer_code).trim().toLowerCase(), c);
      if (c.customerCode) custByCode.set(String(c.customerCode).trim().toLowerCase(), c);
      if (c.account_code) custByCode.set(String(c.account_code).trim().toLowerCase(), c);
      const n = (c.customer_name || c.customerName || c.name || '').trim().toLowerCase();
      if (n) custByName.set(n, c);
    });

    const venByCode = new Map<string, any>();
    const venByName = new Map<string, any>();
    rawVendors.forEach((v) => {
      if (v.vendor_code) venByCode.set(String(v.vendor_code).trim().toLowerCase(), v);
      if (v.vendorCode) venByCode.set(String(v.vendorCode).trim().toLowerCase(), v);
      const n = (v.vendor_name || v.name || '').trim().toLowerCase();
      if (n) venByName.set(n, v);
    });

    const rows = pool.map((acc) => {
      const code = String(acc.account_code || '');
      const codeLower = code.trim().toLowerCase();
      const titleLower = String(acc.account_title || '').trim().toLowerCase();
      const openBal = Number(acc.opening_balance || 0);

      let headName = 'Assets';
      if (code.startsWith('2')) headName = 'Liabilities';
      else if (code.startsWith('3')) headName = 'Equity';
      else if (code.startsWith('4')) headName = 'Revenue';
      else if (code.startsWith('5')) {
        headName = acc.sub_category_code || acc.control_code || 'Expenses';
      }

      // 1. Check if matching customer
      const matchedCust = criteria.reportType !== 'cash_bank' && (custByCode.get(codeLower) || custByName.get(titleLower));
      if (matchedCust) {
        const cName = String(matchedCust.customer_name || matchedCust.customerName || matchedCust.name || '').trim().toLowerCase();
        const initialOpen = (matchedCust.balance_nature || acc.balance_nature || '').toLowerCase().includes('credit')
          ? -Math.abs(Number(matchedCust.opening_balance || openBal))
          : Math.abs(Number(matchedCust.opening_balance || openBal));

        const partyInvoices = detailedInvoices.filter((inv) => (inv.customer_name || '').trim().toLowerCase() === cName);
        const partyReturns = detailedSalesReturns.filter((ret) => (ret.customer_name || '').trim().toLowerCase() === cName);
        const partyVouchers = (vouchersByParty[cName] || []).filter(
          (v) =>
            (v.voucher_type || '').includes('Receive') ||
            (v.voucher_no || '').startsWith('CRV') ||
            (Number(v.credit || 0) > 0 && !(v.voucher_type || '').includes('Return') && !(v.voucher_type || '').includes('Accrual'))
        );

        let preInvoiced = 0;
        let preReceived = 0;
        let preReturns = 0;
        let activeInvoices = partyInvoices;
        let activeVouchers = partyVouchers;
        let activeReturns = partyReturns;

        if (hasDateRange && dFrom && dTo) {
          partyInvoices.forEach((inv) => { if (inv.sale_date && inv.sale_date < dFrom) preInvoiced += Number(inv.total_amount || 0); });
          partyVouchers.forEach((v) => { if (v.voucher_date && v.voucher_date < dFrom) preReceived += Number(v.credit || v.total_amount || 0); });
          partyReturns.forEach((ret) => { if (ret.return_date && ret.return_date < dFrom) preReturns += Number(ret.total_amount || 0); });
          activeInvoices = partyInvoices.filter((inv) => !inv.sale_date || (inv.sale_date >= dFrom && inv.sale_date <= dTo));
          activeVouchers = partyVouchers.filter((v) => !v.voucher_date || (v.voucher_date >= dFrom && v.voucher_date <= dTo));
          activeReturns = partyReturns.filter((ret) => !ret.return_date || (ret.return_date >= dFrom && ret.return_date <= dTo));
        } else if (hasSingleDate && sDate) {
          activeInvoices = partyInvoices.filter((inv) => !inv.sale_date || inv.sale_date <= sDate);
          activeVouchers = partyVouchers.filter((v) => !v.voucher_date || v.voucher_date <= sDate);
          activeReturns = partyReturns.filter((ret) => !ret.return_date || ret.return_date <= sDate);
        }

        const periodOpeningBal = initialOpen + preInvoiced - preReceived - preReturns;

        const bills = activeInvoices.map((inv) => {
          const invKey = String(inv.invoice_no || '').trim().toLowerCase();
          const matchedVoucher = (vouchersByInvoiceNo[invKey] || []).find(
            (v) => (v.voucher_type || '').includes('Sale') || (v.voucher_no || '').startsWith('SAV')
          );
          const totalAmt = Number(inv.total_amount || 0);
          const paidAmt = Number(inv.amount_paid || 0);
          return {
            id: String(inv.id),
            billNo: inv.invoice_no || '—',
            voucherNo: matchedVoucher?.voucher_no || `SAV-${inv.invoice_no || 'NA'}`,
            voucherType: matchedVoucher?.voucher_type || 'Sale Amount Voucher',
            date: inv.sale_date || matchedVoucher?.voucher_date || '—',
            amount: totalAmt,
            paid: paidAmt,
            balance: Math.max(0, totalAmt - paidAmt)
          };
        });

        const receipts = activeVouchers.map((v) => ({
          id: String(v.id),
          voucherNo: v.voucher_no,
          voucherType: v.voucher_type || 'Customer Receive Voucher',
          refNo: v.original_invoice_no || 'Receipt Slip',
          date: v.voucher_date || '—',
          amount: Number(v.credit || v.total_amount || 0),
          mode: v.description || 'Cash / Bank Receipt'
        }));

        const returns = activeReturns.map((ret) => {
          const retKey = String(ret.return_no || '').trim().toLowerCase();
          const matchedVoucher = (vouchersByInvoiceNo[retKey] || []).find(
            (v) => (v.voucher_type || '').includes('Return') || (v.voucher_no || '').startsWith('SRV')
          );
          return {
            id: String(ret.id),
            returnNo: ret.return_no || '—',
            voucherNo: matchedVoucher?.voucher_no || `SRV-${ret.return_no || 'NA'}`,
            voucherType: matchedVoucher?.voucher_type || 'Sale Return Voucher',
            date: ret.return_date || matchedVoucher?.voucher_date || '—',
            amount: Number(ret.total_amount || 0)
          };
        });

        const invoicedTotal = bills.reduce((sum, b) => sum + b.amount, 0);
        const voucherReceived = receipts.reduce((sum, rc) => sum + rc.amount, 0);
        const invoicePaidSum = bills.reduce((sum, b) => sum + b.paid, 0);
        const receivedTotal = Math.max(invoicePaidSum, voucherReceived);
        const retAmt = returns.reduce((sum, r) => sum + r.amount, 0);
        const closeBal = periodOpeningBal + invoicedTotal - receivedTotal - retAmt;

        return {
          id: acc.id,
          code: acc.account_code,
          name: acc.account_title,
          area: headName,
          phone: acc.account_type || acc.balance_nature || 'Debit',
          openingBalance: periodOpeningBal,
          invoicedAmount: invoicedTotal,
          receivedAmount: receivedTotal,
          returnAmount: retAmt,
          closingBalance: closeBal,
          balanceNature: closeBal >= 0 ? 'Debit' : 'Credit',
          detailTree: {
            bills,
            receipts,
            returns,
            totalBills: invoicedTotal,
            totalPayments: receivedTotal,
            totalReturns: retAmt
          }
        };
      }

      // 2. Check if matching vendor
      const matchedVen = criteria.reportType !== 'cash_bank' && (venByCode.get(codeLower) || venByName.get(titleLower));
      if (matchedVen) {
        const vName = String(matchedVen.vendor_name || matchedVen.name || '').trim().toLowerCase();
        const initialOpen = (matchedVen.balance_nature || acc.balance_nature || '').toLowerCase().includes('debit')
          ? -Math.abs(Number(matchedVen.opening_balance || openBal))
          : Math.abs(Number(matchedVen.opening_balance || openBal));

        const partyPurchases = detailedPurchases.filter((p) => (p.vendor_name || p.supplier_name || '').trim().toLowerCase() === vName);
        const partyReturns = detailedPurchaseReturns.filter((r) => (r.vendor_name || '').trim().toLowerCase() === vName);
        const partyVouchers = (vouchersByParty[vName] || []).filter(
          (v) =>
            (v.voucher_type || '').includes('Payment') ||
            (v.voucher_no || '').startsWith('CPV') ||
            (v.voucher_no || '').startsWith('VPV') ||
            (v.voucher_no || '').startsWith('BPV') ||
            (Number(v.debit || 0) > 0 && !(v.voucher_type || '').includes('Return') && !(v.voucher_type || '').includes('Accrual') && !(v.voucher_type || '').includes('Sale'))
        );

        let prePurchased = 0;
        let prePaid = 0;
        let preReturns = 0;
        let activePurchases = partyPurchases;
        let activeVouchers = partyVouchers;
        let activeReturns = partyReturns;

        if (hasDateRange && dFrom && dTo) {
          partyPurchases.forEach((p) => { if (p.purchase_date && p.purchase_date < dFrom) prePurchased += Number(p.total_amount || 0); });
          partyVouchers.forEach((v) => { if (v.voucher_date && v.voucher_date < dFrom) prePaid += Number(v.debit || v.total_amount || 0); });
          partyReturns.forEach((ret) => { if (ret.return_date && ret.return_date < dFrom) preReturns += Number(ret.total_amount || 0); });
          activePurchases = partyPurchases.filter((p) => !p.purchase_date || (p.purchase_date >= dFrom && p.purchase_date <= dTo));
          activeVouchers = partyVouchers.filter((v) => !v.voucher_date || (v.voucher_date >= dFrom && v.voucher_date <= dTo));
          activeReturns = partyReturns.filter((ret) => !ret.return_date || (ret.return_date >= dFrom && ret.return_date <= dTo));
        } else if (hasSingleDate && sDate) {
          activePurchases = partyPurchases.filter((p) => !p.purchase_date || p.purchase_date <= sDate);
          activeVouchers = partyVouchers.filter((v) => !v.voucher_date || v.voucher_date <= sDate);
          activeReturns = partyReturns.filter((ret) => !ret.return_date || ret.return_date <= sDate);
        }

        const periodOpeningBal = initialOpen + prePurchased - prePaid - preReturns;

        const bills = activePurchases.map((p) => {
          const pKey = String(p.purchase_no || '').trim().toLowerCase();
          const matchedVoucher = (vouchersByInvoiceNo[pKey] || []).find(
            (v) => (v.voucher_type || '').includes('Purchase') || (v.voucher_no || '').startsWith('PAV')
          );
          return {
            id: String(p.id),
            billNo: p.purchase_no || '—',
            voucherNo: matchedVoucher?.voucher_no || `PAV-${p.purchase_no || 'NA'}`,
            voucherType: matchedVoucher?.voucher_type || 'Purchase Accrual Voucher',
            date: p.purchase_date || matchedVoucher?.voucher_date || '—',
            amount: Number(p.total_amount || 0),
            paid: Number(p.amount_paid || p.paid_amount || 0),
            balance: Number(p.remaining_balance || 0)
          };
        });

        const receipts = activeVouchers.map((v) => ({
          id: String(v.id),
          voucherNo: v.voucher_no,
          voucherType: v.voucher_type || 'Payment Voucher',
          refNo: v.original_invoice_no || 'Payment Slip',
          date: v.voucher_date || '—',
          amount: Number(v.debit || v.total_amount || 0),
          mode: v.description || 'Cash / Bank Payment'
        }));

        const returns = activeReturns.map((ret) => {
          const retKey = String(ret.return_no || '').trim().toLowerCase();
          const matchedVoucher = (vouchersByInvoiceNo[retKey] || []).find(
            (v) => (v.voucher_type || '').includes('Return') || (v.voucher_no || '').startsWith('PRV')
          );
          return {
            id: String(ret.id),
            returnNo: ret.return_no || '—',
            voucherNo: matchedVoucher?.voucher_no || `PRV-${ret.return_no || 'NA'}`,
            voucherType: matchedVoucher?.voucher_type || 'Purchase Return Voucher',
            date: ret.return_date || matchedVoucher?.voucher_date || '—',
            amount: Number(ret.total_amount || 0)
          };
        });

        const invoicedTotal = bills.reduce((sum, b) => sum + b.amount, 0);
        const voucherPaid = receipts.reduce((sum, rc) => sum + rc.amount, 0);
        const purPaidSum = bills.reduce((sum, b) => sum + b.paid, 0);
        const paidTotal = Math.max(purPaidSum, voucherPaid);
        const retAmt = returns.reduce((sum, r) => sum + r.amount, 0);
        const closeBal = periodOpeningBal + invoicedTotal - paidTotal - retAmt;

        return {
          id: acc.id,
          code: acc.account_code,
          name: acc.account_title,
          area: headName,
          phone: acc.account_type || acc.balance_nature || 'Debit',
          openingBalance: periodOpeningBal,
          invoicedAmount: invoicedTotal,
          receivedAmount: paidTotal,
          returnAmount: retAmt,
          closingBalance: closeBal,
          balanceNature: closeBal >= 0 ? 'Credit' : 'Debit',
          detailTree: {
            bills,
            receipts,
            returns,
            totalBills: invoicedTotal,
            totalPayments: paidTotal,
            totalReturns: retAmt
          }
        };
      }

      // 3. Cash & Bank or General Ledger / Control Account fallback
      if (criteria.reportType === 'cash_bank') {
        const isCashAcc = codeLower.startsWith('1010') || codeLower.startsWith('1000') || titleLower.includes('cash');

        let cashVoucherInflows = (vouchersMaster || []).filter((v) => {
          const vNo = (v.voucher_no || '').toUpperCase();
          const vType = (v.voucher_type || '').toLowerCase();
          const isReceive = vNo.startsWith('CRV') || vNo.startsWith('BRV') || vType.includes('receive');
          if (isCashAcc) {
            return isReceive && (vNo.startsWith('CRV') || vType.includes('cash') || !vNo.startsWith('BRV'));
          }
          return isReceive && (vNo.startsWith('BRV') || vType.includes('bank'));
        });

        let cashVoucherOutflows = (vouchersMaster || []).filter((v) => {
          const vNo = (v.voucher_no || '').toUpperCase();
          const vType = (v.voucher_type || '').toLowerCase();
          const isPayment = vNo.startsWith('CPV') || vNo.startsWith('BPV') || vNo.startsWith('VPV') || vType.includes('payment');
          if (isCashAcc) {
            return isPayment && (vNo.startsWith('CPV') || vType.includes('cash') || !vNo.startsWith('BPV'));
          }
          return isPayment && (vNo.startsWith('BPV') || vType.includes('bank'));
        });

        // Date range filtering
        if (hasDateRange && dFrom && dTo) {
          cashVoucherInflows = cashVoucherInflows.filter((v) => !v.voucher_date || (v.voucher_date >= dFrom && v.voucher_date <= dTo));
          cashVoucherOutflows = cashVoucherOutflows.filter((v) => !v.voucher_date || (v.voucher_date >= dFrom && v.voucher_date <= dTo));
        } else if (hasSingleDate && sDate) {
          cashVoucherInflows = cashVoucherInflows.filter((v) => !v.voucher_date || v.voucher_date <= sDate);
          cashVoucherOutflows = cashVoucherOutflows.filter((v) => !v.voucher_date || v.voucher_date <= sDate);
        }

        const totalIn = cashVoucherInflows.reduce((sum, v) => sum + Number(v.credit || v.total_amount || 0), 0);
        const totalOut = cashVoucherOutflows.reduce((sum, v) => sum + Number(v.debit || v.total_amount || 0), 0);
        const closing = openBal + totalIn - totalOut;

        const receiptsInflows = cashVoucherInflows.map((v) => ({
          id: String(v.id),
          billNo: v.voucher_no || '—',
          voucherNo: v.voucher_no,
          voucherType: v.voucher_type || (isCashAcc ? 'Cash Receive Voucher' : 'Bank Receive Voucher'),
          date: v.voucher_date || '—',
          amount: Number(v.credit || v.total_amount || 0),
          paid: Number(v.credit || v.total_amount || 0),
          balance: 0,
          party: v.party_name || v.customer_name || 'Cash Deposit'
        }));

        const paymentsOutflows = cashVoucherOutflows.map((v) => ({
          id: String(v.id),
          voucherNo: v.voucher_no,
          voucherType: v.voucher_type || (isCashAcc ? 'Cash Payment Voucher' : 'Bank Payment Voucher'),
          refNo: v.party_name || v.description || 'Payment Slip',
          date: v.voucher_date || '—',
          amount: Number(v.debit || v.total_amount || 0),
          mode: v.description || (isCashAcc ? 'Cash Paid' : 'Bank Paid')
        }));

        return {
          id: acc.id,
          code: acc.account_code,
          name: acc.account_title,
          area: headName,
          phone: 'Debit',
          openingBalance: openBal,
          invoicedAmount: totalIn,
          receivedAmount: totalOut,
          returnAmount: 0,
          closingBalance: closing,
          balanceNature: closing >= 0 ? 'Debit' : 'Credit',
          detailTree: {
            bills: receiptsInflows,
            receipts: paymentsOutflows,
            returns: [],
            totalBills: totalIn,
            totalPayments: totalOut,
            totalReturns: 0
          }
        };
      }

      // General Ledger / Control Account fallback
      return {
        id: acc.id,
        code: acc.account_code,
        name: acc.account_title,
        area: headName,
        phone: acc.account_type || acc.balance_nature || 'Debit',
        openingBalance: openBal,
        invoicedAmount: 0,
        receivedAmount: 0,
        returnAmount: 0,
        closingBalance: openBal,
        balanceNature: acc.balance_nature || (openBal >= 0 ? 'Debit' : 'Credit'),
        detailTree: {
          bills: [],
          receipts: [],
          returns: [],
          totalBills: 0,
          totalPayments: 0,
          totalReturns: 0
        }
      };
    });

    if (criteria.hideZeroBalances) {
      return rows.filter((r) => Math.abs(r.closingBalance) > 0.01);
    }
    return rows;
  }, [
    criteria,
    rawCustomers,
    rawVendors,
    rawCoa,
    invoicesSummary,
    returnsSummary,
    purchasesSummary,
    purchaseReturnsSummary,
    detailedInvoices,
    detailedPurchases,
    detailedSalesReturns,
    detailedPurchaseReturns,
    vouchersMaster
  ]);

  // ── SORTING ──
  const sortedAccountRows = useMemo(() => {
    const list = [...parsedAccountRows];
    if (!criteria?.sortBy) return list;

    switch (criteria.sortBy) {
      case 'balance_desc':
        return list.sort((a, b) => b.closingBalance - a.closingBalance);
      case 'balance_asc':
        return list.sort((a, b) => a.closingBalance - b.closingBalance);
      case 'receivables_desc':
        return list.sort((a, b) => Math.max(0, b.closingBalance) - Math.max(0, a.closingBalance));
      case 'receivables_asc':
        return list.sort((a, b) => Math.max(0, a.closingBalance) - Math.max(0, b.closingBalance));
      case 'received_desc':
        return list.sort((a, b) => b.receivedAmount - a.receivedAmount);
      case 'received_asc':
        return list.sort((a, b) => a.receivedAmount - b.receivedAmount);
      case 'invoiced_desc':
        return list.sort((a, b) => b.invoicedAmount - a.invoicedAmount);
      case 'invoiced_asc':
        return list.sort((a, b) => a.invoicedAmount - b.invoicedAmount);
      case 'opening_desc':
        return list.sort((a, b) => b.openingBalance - a.openingBalance);
      case 'opening_asc':
        return list.sort((a, b) => a.openingBalance - b.openingBalance);
      case 'return_desc':
        return list.sort((a, b) => b.returnAmount - a.returnAmount);
      case 'return_asc':
        return list.sort((a, b) => a.returnAmount - b.returnAmount);
      case 'expense_desc':
        return list.sort((a, b) => {
          const isExpA = a.area === 'Expenses' || String(a.code).startsWith('5');
          const isExpB = b.area === 'Expenses' || String(b.code).startsWith('5');
          const valA = isExpA
            ? Math.abs(a.closingBalance || a.receivedAmount || a.invoicedAmount || 0)
            : Math.abs(a.receivedAmount || a.closingBalance || 0);
          const valB = isExpB
            ? Math.abs(b.closingBalance || b.receivedAmount || b.invoicedAmount || 0)
            : Math.abs(b.receivedAmount || b.closingBalance || 0);
          if (isExpA !== isExpB) return isExpA ? -1 : 1;
          if (valB !== valA) return valB - valA;
          return a.name.localeCompare(b.name);
        });
      case 'expense_asc':
        return list.sort((a, b) => {
          const isExpA = a.area === 'Expenses' || String(a.code).startsWith('5');
          const isExpB = b.area === 'Expenses' || String(b.code).startsWith('5');
          const valA = isExpA
            ? Math.abs(a.closingBalance || a.receivedAmount || a.invoicedAmount || 0)
            : Math.abs(a.receivedAmount || a.closingBalance || 0);
          const valB = isExpB
            ? Math.abs(b.closingBalance || b.receivedAmount || b.invoicedAmount || 0)
            : Math.abs(b.receivedAmount || b.closingBalance || 0);
          if (isExpA !== isExpB) return isExpA ? -1 : 1;
          if (valA !== valB) return valA - valB;
          return a.name.localeCompare(b.name);
        });
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'code_asc':
        return list.sort((a, b) => String(a.code).localeCompare(String(b.code)));
      case 'code_desc':
        return list.sort((a, b) => String(b.code).localeCompare(String(a.code)));
      default:
        return list;
    }
  }, [parsedAccountRows, criteria?.sortBy]);

  // ── TAILORED KPI SUMMARY CALCULATIONS (ACCORDING TO REPORT TYPE) ──
  const kpiTotals = useMemo(() => {
    let totalReceivables = 0;
    let totalAdvances = 0;
    let totalPayables = 0;
    let totalCashBank = 0;
    let totalInflows = 0;
    let totalOutflows = 0;
    let totalReturns = 0;

    // Balance derivations strictly separated by report type
    if (criteria?.reportType === 'customer') {
      sortedAccountRows.forEach((r) => {
        if (r.closingBalance > 0) totalReceivables += r.closingBalance;
        else if (r.closingBalance < 0) totalAdvances += Math.abs(r.closingBalance);
      });
    } else if (criteria?.reportType === 'vendor') {
      sortedAccountRows.forEach((r) => {
        if (r.closingBalance > 0) totalPayables += r.closingBalance;
        else if (r.closingBalance < 0) totalAdvances += Math.abs(r.closingBalance);
      });
    } else {
      rawCustomers.forEach((c) => {
        const bal = Number(c.computed_balance ?? c.current_balance ?? c.balance ?? 0);
        if (bal > 0) totalReceivables += bal;
        else if (bal < 0) totalAdvances += Math.abs(bal);
      });
      rawVendors.forEach((v) => {
        const bal = Number(v.computed_balance ?? v.currentBalance ?? v.balance ?? 0);
        if (bal > 0) totalPayables += bal;
      });
    }

    // Liquid funds
    if (criteria?.reportType === 'cash_bank') {
      sortedAccountRows.forEach((r) => {
        totalCashBank += r.closingBalance;
      });
    } else {
      rawBanks.forEach((b) => {
        totalCashBank += Number(b.current_balance || 0);
      });
      rawCoa.forEach((acc) => {
        const c = String(acc.account_code || '');
        const t = String(acc.account_title || '').toLowerCase();
        if (c.startsWith('1010') || c.startsWith('1000') || t.includes('cash')) {
          totalCashBank += Number(acc.closing_balance || acc.opening_balance || 0);
        }
      });
    }

    // Inflows, Outflows and Returns from active filtered table rows
    sortedAccountRows.forEach((r) => {
      totalInflows += r.invoicedAmount;
      totalOutflows += r.receivedAmount;
      totalReturns += r.returnAmount;
    });

    return {
      totalAccounts: sortedAccountRows.length,
      totalReceivables,
      totalAdvances,
      totalPayables,
      totalCashBank,
      totalInflows,
      totalOutflows,
      totalReturns,
      netFinancialFlow:
        criteria?.reportType === 'customer'
          ? totalReceivables - totalAdvances
          : criteria?.reportType === 'vendor'
          ? totalPayables - totalAdvances
          : totalReceivables - totalPayables
    };
  }, [criteria?.reportType, rawCustomers, rawVendors, rawBanks, sortedAccountRows]);

  // Dynamic KPI Card Config depending on whether Customer, Vendor or CoA report
  const kpiCards = useMemo(() => {
    if (criteria?.reportType === 'customer') {
      return [
        {
          label: 'Total Receivables',
          value: `Rs. ${Math.round(kpiTotals.totalReceivables).toLocaleString()}`,
          note: 'Due from customers',
          textColor: 'text-blue-600 dark:text-blue-400',
          highlight: true
        },
        {
          label: 'Customer Advances (Cr)',
          value: `Rs. ${Math.round(kpiTotals.totalAdvances).toLocaleString()}`,
          note: 'Advance credit balances',
          textColor: 'text-amber-600 dark:text-amber-400'
        },
        {
          label: 'Period Sales (Dr)',
          value: kpiTotals.totalInflows > 0 ? `Rs. ${Math.round(kpiTotals.totalInflows).toLocaleString()}` : 'Rs. 0',
          note: 'Invoiced turnover'
        },
        {
          label: 'Collections (Cr)',
          value: kpiTotals.totalOutflows > 0 ? `Rs. ${Math.round(kpiTotals.totalOutflows).toLocaleString()}` : 'Rs. 0',
          note: 'Receipts collected',
          textColor: 'text-emerald-600 dark:text-emerald-400'
        },
        {
          label: 'Sales Returns (Cr)',
          value: kpiTotals.totalReturns > 0 ? `Rs. ${Math.round(kpiTotals.totalReturns).toLocaleString()}` : 'Rs. 0',
          note: 'Returns & deductions',
          textColor: 'text-rose-600 dark:text-rose-400'
        },
        {
          label: 'Net Receivables Due',
          value: `Rs. ${Math.round(kpiTotals.totalReceivables - kpiTotals.totalAdvances).toLocaleString()}`,
          note: 'Active Net Balance',
          highlight: true
        }
      ];
    }

    if (criteria?.reportType === 'vendor') {
      return [
        {
          label: 'Total Payables',
          value: `Rs. ${Math.round(kpiTotals.totalPayables).toLocaleString()}`,
          note: 'Outstanding to vendors',
          textColor: 'text-red-600 dark:text-red-400',
          highlight: true
        },
        {
          label: 'Vendor Advances (Dr)',
          value: `Rs. ${Math.round(kpiTotals.totalAdvances).toLocaleString()}`,
          note: 'Prepayments to vendors',
          textColor: 'text-amber-600 dark:text-amber-400'
        },
        {
          label: 'Period Purchases (Cr)',
          value: kpiTotals.totalInflows > 0 ? `Rs. ${Math.round(kpiTotals.totalInflows).toLocaleString()}` : 'Rs. 0',
          note: 'Purchases turnover'
        },
        {
          label: 'Payments Made (Dr)',
          value: kpiTotals.totalOutflows > 0 ? `Rs. ${Math.round(kpiTotals.totalOutflows).toLocaleString()}` : 'Rs. 0',
          note: 'Disbursements to vendors',
          textColor: 'text-emerald-600 dark:text-emerald-400'
        },
        {
          label: 'Purchase Returns (Dr)',
          value: kpiTotals.totalReturns > 0 ? `Rs. ${Math.round(kpiTotals.totalReturns).toLocaleString()}` : 'Rs. 0',
          note: 'Debit notes & returns',
          textColor: 'text-rose-600 dark:text-rose-400'
        },
        {
          label: 'Net Payables Due',
          value: `Rs. ${Math.round(kpiTotals.totalPayables - kpiTotals.totalAdvances).toLocaleString()}`,
          note: 'Active Net Balance',
          highlight: true
        }
      ];
    }

    if (criteria?.reportType === 'cash_bank') {
      const totalOpen = sortedAccountRows.reduce((s, r) => s + (r.openingBalance || 0), 0);
      const totalClose = sortedAccountRows.reduce((s, r) => s + (r.closingBalance || 0), 0);
      const netMovement = kpiTotals.totalInflows - kpiTotals.totalOutflows;

      return [
        {
          label: 'Opening Liquid Funds',
          value: `Rs. ${Math.round(totalOpen).toLocaleString()}`,
          note: 'Opening bank & cash',
          textColor: 'text-gray-700 dark:text-gray-200'
        },
        {
          label: 'Total Receipts (Inflows)',
          value: `Rs. ${Math.round(kpiTotals.totalInflows).toLocaleString()}`,
          note: 'CRV & BRV cash receipts',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          highlight: true
        },
        {
          label: 'Total Payments (Outflows)',
          value: `Rs. ${Math.round(kpiTotals.totalOutflows).toLocaleString()}`,
          note: 'CPV & BPV cash payments',
          textColor: 'text-rose-600 dark:text-rose-400'
        },
        {
          label: 'Net Cash Movement',
          value: `${netMovement >= 0 ? '+' : '-'}Rs. ${Math.abs(Math.round(netMovement)).toLocaleString()}`,
          note: 'Period net flow (In - Out)',
          textColor: netMovement >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
        },
        {
          label: 'Active Registers',
          value: `${sortedAccountRows.length} Accounts`,
          note: 'Cash & bank accounts'
        },
        {
          label: 'Closing Liquid Reserves',
          value: `Rs. ${Math.round(totalClose).toLocaleString()}`,
          note: 'Available closing funds',
          highlight: true,
          textColor: 'text-blue-600 dark:text-blue-400'
        }
      ];
    }

    if (criteria?.reportType === 'expense') {
      const totalExpense = sortedAccountRows.reduce((sum, r) => sum + Math.abs(r.closingBalance || r.openingBalance || 0), 0);
      const directExpense = sortedAccountRows
        .filter((r) => String(r.code).startsWith('501'))
        .reduce((sum, r) => sum + Math.abs(r.closingBalance || r.openingBalance || 0), 0);
      const indirectExpense = sortedAccountRows
        .filter((r) => {
          const c = String(r.code);
          return c.startsWith('502') || c.startsWith('503') || c.startsWith('504') || c.startsWith('505');
        })
        .reduce((sum, r) => sum + Math.abs(r.closingBalance || r.openingBalance || 0), 0);
      const adminExpense = sortedAccountRows
        .filter((r) => {
          const c = String(r.code);
          return c.startsWith('506') || c.startsWith('507') || c.startsWith('508') || c.startsWith('51') || c.startsWith('52');
        })
        .reduce((sum, r) => sum + Math.abs(r.closingBalance || r.openingBalance || 0), 0);

      return [
        {
          label: 'Total Operating Expenses',
          value: `Rs. ${Math.round(totalExpense).toLocaleString()}`,
          note: 'Total operational costs',
          textColor: 'text-rose-600 dark:text-rose-400',
          highlight: true
        },
        {
          label: 'Direct Costs / COGS',
          value: `Rs. ${Math.round(directExpense).toLocaleString()}`,
          note: 'Cost of goods & sales',
          textColor: 'text-amber-600 dark:text-amber-400'
        },
        {
          label: 'Indirect Expenses',
          value: `Rs. ${Math.round(indirectExpense).toLocaleString()}`,
          note: 'Rent, salaries, logistics & power',
          textColor: 'text-purple-600 dark:text-purple-400'
        },
        {
          label: 'General & Admin Expenses',
          value: `Rs. ${Math.round(adminExpense).toLocaleString()}`,
          note: 'Office, marketing & supplies',
          textColor: 'text-blue-600 dark:text-blue-400'
        },
        {
          label: 'Active Expense Heads',
          value: `${sortedAccountRows.length} Accounts`,
          note: 'Monitored expense lines'
        },
        {
          label: 'Net Period Expense Impact',
          value: `Rs. ${Math.round(totalExpense).toLocaleString()}`,
          note: 'Total operational impact',
          highlight: true
        }
      ];
    }

    // Chart of Accounts / All General Ledger
    return [
      {
        label: 'Total Receivables',
        value: `Rs. ${Math.round(kpiTotals.totalReceivables).toLocaleString()}`,
        note: 'Customer balances',
        textColor: 'text-blue-600 dark:text-blue-400'
      },
      {
        label: 'Total Payables',
        value: `Rs. ${Math.round(kpiTotals.totalPayables).toLocaleString()}`,
        note: 'Vendor balances',
        textColor: 'text-red-600 dark:text-red-400'
      },
      {
        label: 'Liquid Funds',
        value: `Rs. ${Math.round(kpiTotals.totalCashBank).toLocaleString()}`,
        note: 'Bank & cash reserves'
      },
      {
        label: 'Period Inflows',
        value: kpiTotals.totalInflows > 0 ? `Rs. ${Math.round(kpiTotals.totalInflows).toLocaleString()}` : 'Rs. 0',
        note: 'Sales & billing turnover'
      },
      {
        label: 'Period Outflows',
        value: kpiTotals.totalOutflows > 0 ? `Rs. ${Math.round(kpiTotals.totalOutflows).toLocaleString()}` : 'Rs. 0',
        note: 'Collections & expenses'
      },
      {
        label: 'Net Financial Position',
        value: `Rs. ${Math.round(kpiTotals.netFinancialFlow).toLocaleString()}`,
        note: 'Receivables vs Payables',
        highlight: true
      }
    ];
  }, [criteria?.reportType, kpiTotals]);

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Basic Accounts Report - ${businessName}\r\n`;
    csvContent += `Report Type: ${criteria?.reportType?.toUpperCase()}\r\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\r\n\r\n`;

    csvContent +=
      'S#,Code,Account Title / Party,Category / Area,Opening Balance,Invoiced / Purchased,Received / Paid,Returns / Refund,Closing Balance,Nature\r\n';
    sortedAccountRows.forEach((r, idx) => {
      csvContent += `${idx + 1},"${r.code}","${r.name}","${r.area}",${Math.round(r.openingBalance)},${Math.round(
        r.invoicedAmount
      )},${Math.round(r.receivedAmount)},${Math.round(r.returnAmount)},${Math.round(r.closingBalance)},"${
        r.balanceNature
      }"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Accounts_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isClassic = layoutTheme === 'classic';

  if (!criteria) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <MdInfoOutline size={36} className="text-amber-500" />
        <h2 className="text-lg font-bold">No Accounts Filter Criteria Found</h2>
        <p className="text-sm text-gray-500">
          Please select your criteria on the Basic Accounts Report filter page first.
        </p>
        <button
          onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/basic-account-report`)}
          className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
        >
          Return to Report Builder
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Spinner />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Generating Basic Accounts Statement...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isClassic ? 'bg-white text-black font-serif' : 'bg-gray-50 dark:bg-boxdark-2 text-black dark:text-white font-sans'
      }`}
    >
      {/* ── EMBEDDED PRINT STYLESHEET TO GUARANTEE ZERO SCROLLBARS & CLEAN PRINT ── */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 8mm 6mm 8mm 6mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
            color: black !important;
          }
          * {
            overflow: visible !important;
            max-height: none !important;
            box-shadow: none !important;
          }
          table {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          tbody {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          tr {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          tfoot {
            display: table-row-group !important;
          }
          .has-detail-expanded {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .detail-row {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-hidden, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* ── TOP ACTION BAR (HIDDEN IN PRINT) ── */}
      <div className="print:hidden sticky top-0 z-40 bg-white/90 dark:bg-boxdark/90 backdrop-blur border-b border-stroke dark:border-strokedark px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/basic-account-report`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4 transition shadow-xs cursor-pointer"
          >
            <MdArrowBack size={16} />
            <span>Back to Filters</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Scope Toggle: All History vs Selected Date Range */}
            <div className="inline-flex items-center p-1 rounded-xl border border-stroke dark:border-strokedark bg-gray-100 dark:bg-meta-4/40 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCriteria((prev) => prev ? { ...prev, dateMode: 'all' } : null)}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  criteria.dateMode === 'all'
                    ? 'bg-white dark:bg-boxdark text-primary dark:text-white shadow-xs font-black'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
                title="View All History Turnover & Balances"
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setCriteria((prev) => prev ? { ...prev, dateMode: 'multi' } : null)}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  criteria.dateMode === 'multi'
                    ? 'bg-white dark:bg-boxdark text-primary dark:text-white shadow-xs font-black'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
                title="View Selected Date Range"
              >
                Period
              </button>
            </div>

            {/* Quick Sort Order Selector */}
            <div className="inline-flex items-center gap-1.5 p-1 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase pl-1">Sort:</span>
              <select
                value={criteria.sortBy}
                onChange={(e) => setCriteria((prev) => prev ? { ...prev, sortBy: e.target.value as BasicAccountSortBy } : null)}
                className="bg-transparent text-xs font-bold text-black dark:text-white focus:outline-none cursor-pointer pr-1"
              >
                <optgroup label="Closing Balance">
                  <option value="balance_desc">Closing Bal (highest - lowest)</option>
                  <option value="balance_asc">Closing Bal (lowest - highest)</option>
                </optgroup>
                <optgroup label="Receivables Due">
                  <option value="receivables_desc">receivables (highest - lowest)</option>
                  <option value="receivables_asc">receivables (lowest - highest)</option>
                </optgroup>
                <optgroup label="Invoiced Turnover">
                  <option value="invoiced_desc">invoiced (highest - lowest)</option>
                  <option value="invoiced_asc">invoiced (lowest - highest)</option>
                </optgroup>
                <optgroup label="Received / Collections">
                  <option value="received_desc">Received (highest - lowest)</option>
                  <option value="received_asc">Received (lowest - highest)</option>
                </optgroup>
                <optgroup label="Opening Balance">
                  <option value="opening_desc">Opening Bal (highest - lowest)</option>
                  <option value="opening_asc">Opening Bal (lowest - highest)</option>
                </optgroup>
                <optgroup label="Returns & Deductions">
                  <option value="return_desc">return (highest - lowest)</option>
                  <option value="return_asc">return (lowest - highest)</option>
                </optgroup>
                <optgroup label="Operating Expenses">
                  <option value="expense_desc">expense (highest - lowest)</option>
                  <option value="expense_asc">expense (lowest - highest)</option>
                </optgroup>
                <optgroup label="Alphabetical & Code">
                  <option value="name_asc">
                    {criteria.reportType === 'customer'
                      ? 'Party Name (A to Z)'
                      : criteria.reportType === 'vendor'
                      ? 'Vendor Name (A to Z)'
                      : 'Account Title (A to Z)'}
                  </option>
                  <option value="name_desc">
                    {criteria.reportType === 'customer'
                      ? 'Party Name (Z to A)'
                      : criteria.reportType === 'vendor'
                      ? 'Vendor Name (Z to A)'
                      : 'Account Title (Z to A)'}
                  </option>
                  <option value="code_asc">
                    {criteria.reportType === 'customer'
                      ? 'Party Code (Ascending)'
                      : criteria.reportType === 'vendor'
                      ? 'Vendor Code (Ascending)'
                      : 'Account Code (Ascending)'}
                  </option>
                  <option value="code_desc">
                    {criteria.reportType === 'customer'
                      ? 'Party Code (Descending)'
                      : criteria.reportType === 'vendor'
                      ? 'Vendor Code (Descending)'
                      : 'Account Code (Descending)'}
                  </option>
                </optgroup>
              </select>
            </div>

            {/* Single Toggle Expand / Collapse All Button matching Sales & Purchase Reports */}
            <button
              type="button"
              onClick={handleToggleAllBreakdowns}
              disabled={isTogglingExpand}
              className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer select-none shadow-xs disabled:cursor-wait ${
                isTogglingExpand
                  ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-400 text-blue-600 dark:text-blue-300 opacity-90'
                  : expandAllBreakdown
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border-blue-600 shadow-md shadow-blue-500/20 active:scale-95'
                  : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 dark:hover:bg-meta-4/60 dark:hover:border-blue-500 dark:hover:text-blue-300 active:bg-blue-100 active:scale-95'
              }`}
            >
              {isTogglingExpand ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
              ) : expandAllBreakdown ? (
                <MdUnfoldLess size={16} className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0" />
              ) : (
                <MdUnfoldMore size={16} className="shrink-0 transition-transform duration-200 group-hover:translate-y-0.5 group-active:translate-y-0" />
              )}
              <span>
                {isTogglingExpand
                  ? (expandAllBreakdown ? 'Collapsing...' : 'Expanding...')
                  : (expandAllBreakdown ? 'Collapse All' : 'Expand All')}
              </span>
            </button>

            {/* Layout Theme Toggle */}
            <button
              onClick={toggleLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4 transition shadow-xs cursor-pointer"
              title="Toggle Modern / Classic Print Layout"
            >
              {isClassic ? <MdViewModule size={16} /> : <MdFormatListBulleted size={16} />}
              <span>{isClassic ? 'Switch to Modern' : 'Switch to Classic'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4 transition shadow-xs cursor-pointer text-emerald-600"
            >
              <MdFileDownload size={16} />
              <span>Export CSV</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition shadow-sm cursor-pointer"
            >
              <MdPrint size={16} />
              <span>Print Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── PRINT CONTENT WRAPPER ── */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 print:p-0 print:max-w-none">
        {/* ── 1. REPORT HEADER ── */}
        <div
          className={`pb-4 border-b ${
            isClassic
              ? 'border-black text-center'
              : 'border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-4'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-primary/10 text-primary dark:text-white border border-primary/20">
                BASIC ACCOUNTS DEPARTMENT
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-bold text-gray-500 uppercase">
                {criteria.reportType.toUpperCase()} FINANCIAL STATEMENT
              </span>
              {expandAllBreakdown && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    HIERARCHICAL DETAIL VIEW
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white uppercase">
              {businessName || 'Zohaib Ali & Company'}
            </h1>
          </div>

          <div className={`text-xs ${isClassic ? 'mt-2' : 'text-right text-gray-500 dark:text-gray-400'}`}>
            <p>
              Period:{' '}
              <strong className="text-black dark:text-white">
                {criteria.dateMode === 'single'
                  ? `As of ${criteria.singleDate}`
                  : criteria.dateMode === 'all'
                  ? 'All History / Complete Ledger'
                  : `${criteria.dateFrom} → ${criteria.dateTo}`}
              </strong>
            </p>
            <p className="mt-0.5">
              Print Date: {new Date().toLocaleDateString('en-GB')} • Mode:{' '}
              <span className="font-semibold capitalize">{expandAllBreakdown ? 'Detailed' : 'Summary'}</span>
            </p>
          </div>
        </div>

        {/* ── 2. EXECUTIVE KPI CARDS (BALANCES & TURNOVER) ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {kpiCards.map((kpi, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl min-w-0 ${
                isClassic
                  ? 'border border-black bg-white'
                  : kpi.highlight
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-gray-50 dark:bg-meta-4/30 border border-stroke dark:border-strokedark'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
              <span
                className={`text-xs sm:text-sm lg:text-[15px] xl:text-base font-black block mt-0.5 leading-tight tracking-tight break-words ${
                  kpi.textColor || ''
                }`}
              >
                {kpi.value}
              </span>
              <span className="text-[9px] text-gray-400 block mt-0.5 truncate">{kpi.note}</span>
            </div>
          ))}
        </div>

        {/* ── 3. MAIN ACCOUNTS / LEDGER TABLE WITH HIERARCHICAL DETAIL VIEW ── */}
        <div className="overflow-x-visible print:overflow-visible">
          <table className={`w-full text-left border-collapse ${isClassic ? 'border border-black text-xs' : 'text-xs'}`}>
            <thead>
              <tr
                className={`${
                  isClassic
                    ? 'border-b-2 border-black bg-gray-100 font-bold'
                    : 'border-b border-stroke dark:border-strokedark bg-gray-100/70 dark:bg-meta-4/40 text-gray-600 dark:text-gray-300 font-bold'
                }`}
              >
                <th className="py-2.5 px-2 text-center w-10">S#</th>
                <th
                  onClick={() => handleHeaderSort('code')}
                  className="py-2.5 px-2 w-24 cursor-pointer hover:text-primary transition select-none print:cursor-default"
                  title="Click to sort by Code"
                >
                  <div className="flex items-center gap-1">
                    <span>Code</span>
                    {criteria.sortBy === 'code_asc' && <span className="print:hidden text-[10px] text-primary">▲</span>}
                    {criteria.sortBy === 'code_desc' && <span className="print:hidden text-[10px] text-primary">▼</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderSort('name')}
                  className="py-2.5 px-2 cursor-pointer hover:text-primary transition select-none print:cursor-default"
                  title="Click to sort by Account / Party Name"
                >
                  <div className="flex items-center gap-1">
                    <span>
                      {criteria.reportType === 'customer'
                        ? 'Customer Name'
                        : criteria.reportType === 'vendor'
                        ? 'Vendor Name'
                        : criteria.reportType === 'expense'
                        ? 'Expense Account Title'
                        : 'Account Title / Party Name'}
                    </span>
                    {criteria.sortBy === 'name_asc' && <span className="print:hidden text-[10px] text-primary">▲</span>}
                    {criteria.sortBy === 'name_desc' && <span className="print:hidden text-[10px] text-primary">▼</span>}
                  </div>
                </th>
                <th className="py-2.5 px-2">
                  {criteria.reportType === 'customer'
                    ? 'Area / City'
                    : criteria.reportType === 'vendor'
                    ? 'Category / City'
                    : criteria.reportType === 'expense'
                    ? 'Expense Category'
                    : 'Account Head'}
                </th>
                <th
                  onClick={() => handleHeaderSort('opening')}
                  className="py-2.5 px-2 text-right cursor-pointer hover:text-primary transition select-none print:cursor-default"
                  title="Click to sort by Opening Balance"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Opening Bal</span>
                    {criteria.sortBy === 'opening_asc' && <span className="print:hidden text-[10px] text-primary">▲</span>}
                    {criteria.sortBy === 'opening_desc' && <span className="print:hidden text-[10px] text-primary">▼</span>}
                  </div>
                </th>

                {/* Customer Columns */}
                {criteria.reportType === 'customer' && (
                  <>
                    <th
                      onClick={() => handleHeaderSort('invoiced')}
                      className="py-2.5 px-2 text-right cursor-pointer hover:text-primary transition select-none print:cursor-default"
                      title="Click to sort by Invoiced Turnover"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Invoiced (Dr)</span>
                        {criteria.sortBy === 'invoiced_asc' && <span className="print:hidden text-[10px] text-primary">▲</span>}
                        {criteria.sortBy === 'invoiced_desc' && <span className="print:hidden text-[10px] text-primary">▼</span>}
                      </div>
                    </th>
                    <th
                      onClick={() => handleHeaderSort('received')}
                      className="py-2.5 px-2 text-right cursor-pointer hover:text-primary transition select-none print:cursor-default"
                      title="Click to sort by Collections / Received"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Received (Cr)</span>
                        {criteria.sortBy === 'received_asc' && <span className="print:hidden text-[10px] text-primary">▲</span>}
                        {criteria.sortBy === 'received_desc' && <span className="print:hidden text-[10px] text-primary">▼</span>}
                      </div>
                    </th>
                    <th
                      onClick={() => handleHeaderSort('return')}
                      className="py-2.5 px-2 text-right text-rose-600 dark:text-rose-400 cursor-pointer hover:underline transition select-none print:cursor-default"
                      title="Click to sort by Returns"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Returns / Refund (Cr)</span>
                        {criteria.sortBy === 'return_asc' && <span className="print:hidden text-[10px]">▲</span>}
                        {criteria.sortBy === 'return_desc' && <span className="print:hidden text-[10px]">▼</span>}
                      </div>
                    </th>
                  </>
                )}

                {/* Vendor Columns */}
                {criteria.reportType === 'vendor' && (
                  <>
                    <th
                      onClick={() => handleHeaderSort('invoiced')}
                      className="py-2.5 px-2 text-right cursor-pointer hover:text-primary transition select-none print:cursor-default"
                      title="Click to sort by Purchases"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Purchases (Cr)</span>
                        {criteria.sortBy === 'invoiced_asc' && <span className="print:hidden text-[10px] text-primary">▲</span>}
                        {criteria.sortBy === 'invoiced_desc' && <span className="print:hidden text-[10px] text-primary">▼</span>}
                      </div>
                    </th>
                    <th
                      onClick={() => handleHeaderSort('received')}
                      className="py-2.5 px-2 text-right cursor-pointer hover:text-primary transition select-none print:cursor-default"
                      title="Click to sort by Payments"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Payments (Dr)</span>
                        {criteria.sortBy === 'received_asc' && <span className="print:hidden text-[10px] text-primary">▲</span>}
                        {criteria.sortBy === 'received_desc' && <span className="print:hidden text-[10px] text-primary">▼</span>}
                      </div>
                    </th>
                    <th
                      onClick={() => handleHeaderSort('return')}
                      className="py-2.5 px-2 text-right text-rose-600 dark:text-rose-400 cursor-pointer hover:underline transition select-none print:cursor-default"
                      title="Click to sort by Purchase Returns"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Returns / Debit (Dr)</span>
                        {criteria.sortBy === 'return_asc' && <span className="print:hidden text-[10px]">▲</span>}
                        {criteria.sortBy === 'return_desc' && <span className="print:hidden text-[10px]">▼</span>}
                      </div>
                    </th>
                  </>
                )}

                <th
                  onClick={() => handleHeaderSort('balance')}
                  className="py-2.5 px-2 text-right cursor-pointer hover:text-primary transition select-none print:cursor-default"
                  title="Click to sort by Closing Balance"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Closing Balance</span>
                    {(criteria.sortBy === 'balance_asc' || criteria.sortBy === 'receivables_asc') && <span className="print:hidden text-[10px] text-primary">▲</span>}
                    {(criteria.sortBy === 'balance_desc' || criteria.sortBy === 'receivables_desc') && <span className="print:hidden text-[10px] text-primary">▼</span>}
                  </div>
                </th>
                <th className="py-2.5 px-2 text-center w-28">Nature</th>
                <th className="py-2.5 px-2 text-center w-12 print:hidden">Tree</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {sortedAccountRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      criteria.reportType === 'customer' || criteria.reportType === 'vendor' ? 11 : 8
                    }
                    className="py-8 text-center text-gray-400"
                  >
                    No account records found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                sortedAccountRows.map((r, idx) => {
                  const isExpanded = isRowExpanded(r.id);
                  const hasDetails =
                    r.detailTree &&
                    (r.detailTree.bills.length > 0 ||
                      r.detailTree.receipts.length > 0 ||
                      r.detailTree.returns.length > 0);

                  const colSpanTotal =
                    criteria.reportType === 'customer' || criteria.reportType === 'vendor' ? 11 : 8;

                  const hasDetailRow = isExpanded;

                  return (
                    <React.Fragment key={r.id}>
                      {/* Master Row */}
                      <tr
                        className={`master-row ${hasDetailRow ? 'has-detail-expanded' : ''} hover:bg-gray-50/80 dark:hover:bg-meta-4/20 transition ${
                          isClassic ? (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50') : ''
                        } ${isExpanded ? 'bg-blue-50/20 dark:bg-meta-4/10' : ''}`}
                      >
                        <td className="py-2 px-2 text-center text-gray-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2 font-mono font-bold text-primary text-[11px]">
                          {r.code}
                        </td>
                        <td className="py-2 px-2 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleRow(r.id)}
                              className="print:hidden text-gray-400 hover:text-primary transition cursor-pointer"
                              title={isExpanded ? 'Collapse vouchers' : 'Expand vouchers'}
                            >
                              {isExpanded ? (
                                <MdKeyboardArrowDown size={16} />
                              ) : (
                                <MdKeyboardArrowUp size={16} className="rotate-90" />
                              )}
                            </button>
                            <span
                              onClick={() => handleToggleRow(r.id)}
                              className="cursor-pointer hover:text-primary transition"
                              title="Click to toggle voucher breakdown"
                            >
                              {r.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-gray-500">{r.area}</td>
                        <td className="py-2 px-2 text-right font-mono text-gray-500">
                          {Math.round(r.openingBalance).toLocaleString()}
                        </td>

                        {/* Customer Dynamic Turnover Columns */}
                        {criteria.reportType === 'customer' && (
                          <>
                            <td className="py-2 px-2 text-right font-mono font-medium text-black dark:text-white">
                              {r.invoicedAmount > 0 ? Math.round(r.invoicedAmount).toLocaleString() : '—'}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
                              {r.receivedAmount > 0 ? Math.round(r.receivedAmount).toLocaleString() : '—'}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                              {r.returnAmount > 0 ? Math.round(r.returnAmount).toLocaleString() : '—'}
                            </td>
                          </>
                        )}

                        {/* Vendor Dynamic Turnover Columns */}
                        {criteria.reportType === 'vendor' && (
                          <>
                            <td className="py-2 px-2 text-right font-mono font-medium text-black dark:text-white">
                              {r.invoicedAmount > 0 ? Math.round(r.invoicedAmount).toLocaleString() : '—'}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
                              {r.receivedAmount > 0 ? Math.round(r.receivedAmount).toLocaleString() : '—'}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                              {r.returnAmount > 0 ? Math.round(r.returnAmount).toLocaleString() : '—'}
                            </td>
                          </>
                        )}

                        <td className="py-2 px-2 text-right font-mono font-bold text-black dark:text-white">
                          Rs. {Math.abs(Math.round(r.closingBalance)).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              r.closingBalance > 0
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : r.closingBalance < 0
                                ? 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-meta-4'
                            }`}
                          >
                            {r.balanceNature}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleToggleRow(r.id)}
                            className="text-gray-400 hover:text-primary transition p-1 cursor-pointer"
                            title={isExpanded ? 'Collapse vouchers' : 'Expand vouchers'}
                          >
                            {isExpanded ? <MdKeyboardArrowUp size={16} /> : <MdKeyboardArrowDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* ── DETAIL VIEW: NESTED TRANSACTION & VOUCHER HIERARCHY (NO SCROLLBARS, 100% PRINTABLE) ── */}
                      {isExpanded && (() => {
                        const displayedBills = r.detailTree.bills;
                        const displayedReceipts = r.detailTree.receipts;
                        const displayedReturns = r.detailTree.returns;

                        return (
                          <tr className="bg-gray-50/90 dark:bg-meta-4/20 border-b border-stroke dark:border-strokedark">
                            <td colSpan={colSpanTotal} className="p-3 pl-8 sm:pl-12">
                              <div className="bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark p-3.5 shadow-xs space-y-3 print:border-black print:p-2 print:shadow-none">
                                {/* Party Header / Hierarchy Title */}
                                <div className="flex flex-wrap items-center justify-between border-b border-stroke dark:border-strokedark pb-2 gap-2 print:border-black">
                                  <div className="flex items-center gap-2">
                                    <MdAccountTree className="text-primary" size={16} />
                                    <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                                      VOUCHER & TRANSACTION BREAKDOWN: {r.name} ({r.code})
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-mono text-gray-500 flex items-center gap-3">
                                    <span>Opening: Rs. {Math.round(r.openingBalance).toLocaleString()}</span>
                                    <span>•</span>
                                    <span>Bills: {r.detailTree.bills.length}</span>
                                    <span>•</span>
                                    <span>Receipts/Payments: {r.detailTree.receipts.length}</span>
                                    <span>•</span>
                                    <span>Returns: {r.detailTree.returns.length}</span>
                                  </div>
                                </div>

                                {/* 3-Column Hierarchy Grid (Unconstrained, flows naturally on paper and screen) */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2">
                                  {/* 1. Bills & Invoices Section */}
                                  <div className="rounded-lg border border-stroke dark:border-strokedark p-2.5 bg-gray-50/50 dark:bg-meta-4/10 print:border-black print:bg-white">
                                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-stroke/60 dark:border-strokedark/60 print:border-black">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
                                        <MdReceiptLong className="text-blue-500" size={15} />
                                        <span>
                                          {criteria.reportType === 'cash_bank'
                                            ? 'Receipts & Inflows'
                                            : criteria.reportType === 'expense'
                                            ? 'Expense Charges (Incurred)'
                                            : criteria.reportType === 'vendor'
                                            ? 'Purchase Bills'
                                            : 'Sales Invoices'}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 font-bold">
                                        {criteria.reportType === 'cash_bank'
                                          ? `${r.detailTree.bills.length} Receipts`
                                          : criteria.reportType === 'expense'
                                          ? `${r.detailTree.bills.length} Records`
                                          : `${r.detailTree.bills.length} Bills`}
                                      </span>
                                    </div>

                                    {r.detailTree.bills.length === 0 ? (
                                      <p className="text-[11px] text-gray-400 italic py-2 text-center">
                                        {criteria.reportType === 'cash_bank'
                                          ? 'No receipts or inflows recorded'
                                          : criteria.reportType === 'expense'
                                          ? 'No expense vouchers recorded'
                                          : 'No bill vouchers recorded'}
                                      </p>
                                    ) : (
                                      <div className="space-y-1 overflow-visible">
                                        {displayedBills.map((b: any, bIdx: number) => (
                                          <div
                                            key={bIdx}
                                            className="p-1.5 rounded bg-white dark:bg-boxdark border border-stroke/60 dark:border-strokedark/60 text-[10.5px] flex items-center justify-between print:border-gray-300"
                                          >
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-black text-primary text-[10px]">
                                                  {b.voucherNo}
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                  {criteria.reportType === 'cash_bank' ? `• ${b.party || 'Cash Deposit'}` : `• #${b.billNo}`}
                                                </span>
                                              </div>
                                              <span className="text-[9.5px] text-gray-400 block">{b.date}</span>
                                            </div>
                                            <div className="text-right font-mono">
                                              <span className="font-bold block text-black dark:text-white">
                                                Rs. {Math.round(b.amount).toLocaleString()}
                                              </span>
                                              {criteria.reportType === 'cash_bank' ? (
                                                <span className="text-[9px] text-emerald-600 block font-semibold">Inflow</span>
                                              ) : b.balance > 0 ? (
                                                <span className="text-[9px] text-amber-600 block">
                                                  Bal: {Math.round(b.balance).toLocaleString()}
                                                </span>
                                              ) : (
                                                <span className="text-[9px] text-emerald-600 block">Paid</span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="mt-2 pt-1.5 border-t border-stroke dark:border-strokedark flex justify-between text-[11px] font-bold print:border-black">
                                      <span>
                                        {criteria.reportType === 'cash_bank'
                                          ? 'Total Receipts (Inflows):'
                                          : criteria.reportType === 'expense'
                                          ? 'Total Incurred:'
                                          : 'Total Billed:'}
                                      </span>
                                      <span className="font-mono text-primary">
                                        Rs. {Math.round(r.detailTree.totalBills).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* 2. Receipts & Payments Section */}
                                  <div className="rounded-lg border border-stroke dark:border-strokedark p-2.5 bg-gray-50/50 dark:bg-meta-4/10 print:border-black print:bg-white">
                                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-stroke/60 dark:border-strokedark/60 print:border-black">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
                                        <MdPayments className="text-emerald-500" size={15} />
                                        <span>
                                          {criteria.reportType === 'cash_bank'
                                            ? 'Payments & Outflows'
                                            : criteria.reportType === 'expense'
                                            ? 'Payments & Disbursements'
                                            : criteria.reportType === 'vendor'
                                            ? 'Payments (Paid)'
                                            : 'Receipts (Received)'}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 font-bold">
                                        {criteria.reportType === 'cash_bank'
                                          ? `${r.detailTree.receipts.length} Payments`
                                          : `${r.detailTree.receipts.length} Slips`}
                                      </span>
                                    </div>

                                    {r.detailTree.receipts.length === 0 ? (
                                      <p className="text-[11px] text-gray-400 italic py-2 text-center">
                                        {criteria.reportType === 'cash_bank'
                                          ? 'No disbursements or payments recorded'
                                          : criteria.reportType === 'expense'
                                          ? 'No disbursements recorded'
                                          : 'No payment vouchers recorded'}
                                      </p>
                                    ) : (
                                      <div className="space-y-1 overflow-visible">
                                        {displayedReceipts.map((rc: any, rcIdx: number) => (
                                          <div
                                            key={rcIdx}
                                            className="p-1.5 rounded bg-white dark:bg-boxdark border border-stroke/60 dark:border-strokedark/60 text-[10.5px] flex items-center justify-between print:border-gray-300"
                                          >
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-black text-rose-600 text-[10px]">
                                                  {rc.voucherNo}
                                                </span>
                                                <span className="text-[10px] text-gray-500">• {rc.refNo}</span>
                                              </div>
                                              <span className="text-[9.5px] text-gray-400 block">{rc.date}</span>
                                            </div>
                                            <div className="text-right font-mono">
                                              <span className="font-bold text-rose-600 block">
                                                Rs. {Math.round(rc.amount).toLocaleString()}
                                              </span>
                                              {criteria.reportType === 'cash_bank' && (
                                                <span className="text-[9px] text-rose-500 block font-semibold">Outflow</span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="mt-2 pt-1.5 border-t border-stroke dark:border-strokedark flex justify-between text-[11px] font-bold print:border-black">
                                      <span>
                                        {criteria.reportType === 'cash_bank'
                                          ? 'Total Payments (Outflows):'
                                          : criteria.reportType === 'expense'
                                          ? 'Total Disbursed:'
                                          : criteria.reportType === 'vendor'
                                          ? 'Total Paid:'
                                          : 'Total Received:'}
                                      </span>
                                      <span className="font-mono text-rose-600">
                                        Rs. {Math.round(r.detailTree.totalPayments).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* 3. Returns & Refunds Section */}
                                  <div className="rounded-lg border border-stroke dark:border-strokedark p-2.5 bg-gray-50/50 dark:bg-meta-4/10 print:border-black print:bg-white">
                                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-stroke/60 dark:border-strokedark/60 print:border-black">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
                                        <MdAssignmentReturn className="text-rose-500" size={15} />
                                        <span>
                                          {criteria.reportType === 'cash_bank'
                                            ? 'Contra & Transfers'
                                            : criteria.reportType === 'expense'
                                            ? 'Adjustments & Reversals'
                                            : criteria.reportType === 'vendor'
                                            ? 'Purchase Returns'
                                            : 'Sale Returns'}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 font-bold">
                                        {criteria.reportType === 'cash_bank'
                                          ? `${r.detailTree.returns.length} Transfers`
                                          : criteria.reportType === 'expense'
                                          ? `${r.detailTree.returns.length} Adjustments`
                                          : `${r.detailTree.returns.length} Returns`}
                                      </span>
                                    </div>

                                    {r.detailTree.returns.length === 0 ? (
                                      <p className="text-[11px] text-gray-400 italic py-2 text-center">
                                        {criteria.reportType === 'cash_bank'
                                          ? 'No contra transfers recorded'
                                          : criteria.reportType === 'expense'
                                          ? 'No adjustments recorded'
                                          : 'No return bill vouchers recorded'}
                                      </p>
                                    ) : (
                                      <div className="space-y-1 overflow-visible">
                                        {displayedReturns.map((ret: any, rtIdx: number) => (
                                          <div
                                            key={rtIdx}
                                            className="p-1.5 rounded bg-white dark:bg-boxdark border border-stroke/60 dark:border-strokedark/60 text-[10.5px] flex items-center justify-between print:border-gray-300"
                                          >
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-black text-rose-600 text-[10px]">
                                                  {ret.voucherNo}
                                                </span>
                                                <span className="text-[10px] text-gray-500">• #{ret.returnNo}</span>
                                              </div>
                                              <span className="text-[9.5px] text-gray-400 block">{ret.date}</span>
                                            </div>
                                            <div className="text-right font-mono">
                                              <span className="font-bold text-rose-600 block">
                                                Rs. {Math.round(ret.amount).toLocaleString()}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="mt-2 pt-1.5 border-t border-stroke dark:border-strokedark flex justify-between text-[11px] font-bold print:border-black">
                                      <span>
                                        {criteria.reportType === 'cash_bank'
                                          ? 'Total Transfers:'
                                          : criteria.reportType === 'expense'
                                          ? 'Total Adjustments:'
                                          : 'Total Returns:'}
                                      </span>
                                      <span className="font-mono text-rose-600">
                                        Rs. {Math.round(r.detailTree.totalReturns).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Party Final Balance Summary Strip */}
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-meta-4/40 flex flex-wrap items-center justify-between text-xs font-bold gap-2 print:border print:border-black print:bg-gray-100">
                                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <span>
                                      Opening: <strong>Rs. {Math.round(r.openingBalance).toLocaleString()}</strong>
                                    </span>
                                    <span>+</span>
                                    <span>
                                      {criteria.reportType === 'cash_bank'
                                        ? 'Receipts: '
                                        : criteria.reportType === 'expense'
                                        ? 'Incurred: '
                                        : 'Bills: '}
                                      <strong>Rs. {Math.round(r.detailTree.totalBills).toLocaleString()}</strong>
                                    </span>
                                    <span>-</span>
                                    <span>
                                      {criteria.reportType === 'cash_bank'
                                        ? 'Payments: '
                                        : criteria.reportType === 'expense'
                                        ? 'Disbursed: '
                                        : criteria.reportType === 'vendor'
                                        ? 'Paid: '
                                        : 'Rec: '}
                                      <strong>Rs. {Math.round(r.detailTree.totalPayments).toLocaleString()}</strong>
                                    </span>
                                    {criteria.reportType !== 'cash_bank' && criteria.reportType !== 'expense' && (
                                      <>
                                        <span>-</span>
                                        <span>
                                          Returns: <strong>Rs. {Math.round(r.detailTree.totalReturns).toLocaleString()}</strong>
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="uppercase text-[10px] text-gray-500">Closing Balance:</span>
                                    <span className="text-sm font-black text-primary font-mono">
                                      Rs. {Math.abs(Math.round(r.closingBalance)).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-boxdark border border-stroke dark:border-strokedark print:border-black">
                                      {r.balanceNature}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })()}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr
                className={`${
                  isClassic
                    ? 'border-t-2 border-b-4 border-double border-black font-black bg-gray-100'
                    : 'border-t-2 border-stroke dark:border-strokedark font-black bg-gray-50 dark:bg-meta-4/40 text-black dark:text-white'
                }`}
              >
                <td colSpan={4} className="py-3 px-2 text-right uppercase tracking-wider text-xs">
                  Grand Total ({sortedAccountRows.length} Accounts):
                </td>
                <td className="py-3 px-2 text-right font-mono text-xs">
                  Rs.{' '}
                  {Math.round(
                    sortedAccountRows.reduce((sum, r) => sum + r.openingBalance, 0)
                  ).toLocaleString()}
                </td>

                {/* Customer Columns Grand Totals */}
                {criteria.reportType === 'customer' && (
                  <>
                    <td className="py-3 px-2 text-right font-mono text-xs">
                      Rs.{' '}
                      {Math.round(
                        sortedAccountRows.reduce((sum, r) => sum + r.invoicedAmount, 0)
                      ).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-xs text-emerald-600">
                      Rs.{' '}
                      {Math.round(
                        sortedAccountRows.reduce((sum, r) => sum + r.receivedAmount, 0)
                      ).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-xs text-rose-600 font-bold">
                      Rs.{' '}
                      {Math.round(
                        sortedAccountRows.reduce((sum, r) => sum + r.returnAmount, 0)
                      ).toLocaleString()}
                    </td>
                  </>
                )}

                {/* Vendor Columns Grand Totals */}
                {criteria.reportType === 'vendor' && (
                  <>
                    <td className="py-3 px-2 text-right font-mono text-xs">
                      Rs.{' '}
                      {Math.round(
                        sortedAccountRows.reduce((sum, r) => sum + r.invoicedAmount, 0)
                      ).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-xs text-emerald-600">
                      Rs.{' '}
                      {Math.round(
                        sortedAccountRows.reduce((sum, r) => sum + r.receivedAmount, 0)
                      ).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-xs text-rose-600 font-bold">
                      Rs.{' '}
                      {Math.round(
                        sortedAccountRows.reduce((sum, r) => sum + r.returnAmount, 0)
                      ).toLocaleString()}
                    </td>
                  </>
                )}

                <td className="py-3 px-2 text-right font-mono text-xs text-primary font-black">
                  Rs.{' '}
                  {Math.round(
                    sortedAccountRows.reduce((sum, r) => sum + r.closingBalance, 0)
                  ).toLocaleString()}
                </td>
                <td></td>
                <td className="print:hidden"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── 4. FORMAL REPORT SIGNATURE / AUDIT FOOTER ── */}
        <div
          className={`pt-6 mt-8 flex items-center justify-between text-[11px] text-gray-500 border-t ${
            isClassic ? 'border-black' : 'border-stroke dark:border-strokedark'
          }`}
        >
          <div>
            <span>Audited Electronic Statement • System Master ID: {businessName || 'ZAC-ERP'}</span>
          </div>
          <div className="flex items-center gap-12 text-center">
            <div>
              <div className="w-28 border-b border-gray-400 mb-1"></div>
              <span>Prepared By</span>
            </div>
            <div>
              <div className="w-28 border-b border-gray-400 mb-1"></div>
              <span>Verified / Approved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicAccountReportPrint;
