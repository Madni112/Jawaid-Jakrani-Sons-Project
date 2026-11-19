import React, { useState, useEffect, useRef, useMemo } from 'react';
import InvoiceHeader from './components/InvoiceHeader';
import InvoiceTileItemsTable from './components/InvoiceTileItemsTable';
import InvoiceStandardItemsTable from './components/InvoiceStandardItemsTable';
import InvoiceReturnItemsSection from './components/InvoiceReturnItemsSection';
import InvoiceChallanSection from './components/InvoiceChallanSection';
import InvoiceSummaryFooter from './components/InvoiceSummaryFooter';
import { getAvailableStock, getTotalAvailableStock, getWarehouseAvailableStock, fetchStockDataset, formatStockWithBoxesAndPcs } from '../../../utils/stockCalculator';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FiPrinter, FiSave, FiCheck, FiX, FiUserCheck, FiTrash2, FiUser, FiAlertTriangle, FiArrowRight, FiPlus, FiSearch, FiMapPin, FiPhone, FiHash, FiBriefcase, FiChevronDown } from 'react-icons/fi';
import { SearchableDropdown } from '../../../components/SearchableDropdown';
import { useAuth } from '../../../Context/Auth';
import { logActivity } from '../../../service/auditLogger';
import { triggerFeedbackSound } from '../../../utils/audioFeedback';
import { fetchCustomerCreditLimits } from '../../../utils/creditLimitUtils';
import { fetchWorkflowSettings } from '../../../service/workflowSettingsService';
import { getWarehouseDispatchStatus } from '../../../utils/locationUtils';
import { isChallanNumberTaken } from '../../../utils/challanValidation';

// Universal comprehensive search helper matching across Name, Code, Category, Sub Cat, Parent Cat, Brand, and Description
const matchesProductSearch = (p: any, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const name = String(p?.product_name || p?.itemName || '').toLowerCase();
  const code = String(p?.item_sr_no || p?.skuCode || '').toLowerCase();
  const cat = String(p?.category || '').toLowerCase();
  const subCat = String(p?.sub_category || '').toLowerCase();
  const parentCat = String(p?.sub_sub_category || '').toLowerCase();
  const brand = String(p?.brand || p?.bin || '').toLowerCase();
  const desc = String(p?.product_description || '').toLowerCase();
  const sku = ('sku-' + (p?.id || '')).toLowerCase();

  return (
    name.includes(q) ||
    code.includes(q) ||
    cat.includes(q) ||
    subCat.includes(q) ||
    parentCat.includes(q) ||
    brand.includes(q) ||
    desc.includes(q) ||
    sku.includes(q)
  );
};

// Helper to identify Tile products based on parent category
const isTileProduct = (p: any) => {
  const parent = String(p?.sub_sub_category || '').toLowerCase().trim();
  return parent.includes('tile');
};

// Helper: Resolve or create customer COA code (2020-XXX) silently
const resolveCustomerCoaAccount = async (customerName: string, customersList: any[] = []): Promise<{ code: string; title: string }> => {
  const cleanName = (customerName || '').trim();
  if (!cleanName) return { code: '2020-001', title: 'Walk-in Customer' };

  // 1. Try matching from loaded customers list
  const matchedFromList = customersList.find(c =>
    (c.customerName || c.customer_name || '').trim().toLowerCase() === cleanName.toLowerCase()
  );
  const existingCode = matchedFromList?.customer_code || matchedFromList?.customerCode || matchedFromList?.coa_code;
  if (existingCode && String(existingCode).startsWith('2020-')) {
    return { code: String(existingCode).trim(), title: matchedFromList.customerName || cleanName };
  }

  // 2. Query chart_of_accounts directly
  try {
    const { data: coaRows } = await supabase
      .from('chart_of_accounts')
      .select('account_code, account_title')
      .ilike('account_title', cleanName)
      .limit(1);

    if (coaRows && coaRows.length > 0 && coaRows[0].account_code) {
      return { code: coaRows[0].account_code, title: coaRows[0].account_title || cleanName };
    }

    // 3. Find highest existing 2020- code to assign sequentially
    const { data: allCustCoa } = await supabase
      .from('chart_of_accounts')
      .select('account_code')
      .ilike('account_code', '2020-%');

    let maxSeq = 0;
    (allCustCoa || []).forEach(r => {
      const match = String(r.account_code || '').match(/2020-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });

    const nextCode = `2020-${String(maxSeq + 1).padStart(3, '0')}`;
    // Register in chart_of_accounts silently
    await supabase.from('chart_of_accounts').insert([{
      account_code: nextCode,
      account_title: cleanName,
      account_type: 'Current Assets',
      category: 'Accounts Receivable',
      notes: `Customer account for ${cleanName} (Auto-registered from Sales Invoice)`
    }]);

    return { code: nextCode, title: cleanName };
  } catch (err) {
    console.warn('resolveCustomerCoaAccount error:', err);
    return { code: '2020-001', title: cleanName };
  }
};

// Helper: Synchronize SAV and CRV financial vouchers for an invoice
const syncInvoiceFinancialVouchers = async ({
  invoiceNo,
  customerName,
  customerCode,
  saleDate,
  grandTotal,
  paidCash,
  paidBank,
  settlementMode,
  selectedBankTitle,
  itemsCount,
  isEdit = false
}: {
  invoiceNo: string;
  customerName: string;
  customerCode: string;
  saleDate: string;
  grandTotal: number;
  paidCash: number;
  paidBank: number;
  settlementMode: string;
  selectedBankTitle?: string;
  itemsCount: number;
  isEdit?: boolean;
}) => {
  try {
    const cleanInvNo = String(invoiceNo || '').trim();
    const totalPaid = (Number(paidCash) || 0) + (Number(paidBank) || 0);
    const vDate = saleDate || new Date().toISOString().split('T')[0];

    // Find any existing vouchers linked to this invoice
    const { data: existingVouchers } = await supabase
      .from('financial_vouchers')
      .select('id, voucher_no, voucher_type, original_invoice_no, metadata')
      .or(`original_invoice_no.eq.${cleanInvNo},voucher_no.eq.SAV-${cleanInvNo.replace(/^INV-?/i, '')}`);

    const existingSav = existingVouchers?.find(v =>
      String(v.voucher_type || '').toLowerCase().includes('sale amount') ||
      String(v.voucher_no || '').startsWith('SAV-')
    );

    const existingCrv = existingVouchers?.find(v =>
      String(v.voucher_type || '').toLowerCase().includes('customer receive') ||
      String(v.voucher_no || '').startsWith('CRV-')
    );

    // 1. ─── HANDLE SAV (Sale Amount Voucher) ───
    if (grandTotal > 0) {
      if (existingSav) {
        // Update existing SAV
        await supabase
          .from('financial_vouchers')
          .update({
            total_amount: grandTotal,
            debit: grandTotal,
            credit: 0,
            account_code: customerCode,
            account_title: customerName,
            voucher_date: vDate,
            narration: `Sale Amount for Invoice #${cleanInvNo} (${itemsCount} items)`,
            original_invoice_no: cleanInvNo,
            metadata: {
              ...(existingSav.metadata || {}),
              preset: 'SAV',
              source: 'sales_invoice',
              invoice_no: cleanInvNo,
              auto_generated: true
            }
          })
          .eq('id', existingSav.id);
      } else {
        // Generate next SAV number
        const { data: savRows } = await supabase
          .from('financial_vouchers')
          .select('voucher_no')
          .ilike('voucher_no', 'SAV-%');

        let maxSavSeq = 0;
        (savRows || []).forEach(v => {
          const match = String(v.voucher_no || '').match(/SAV-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (num > maxSavSeq) maxSavSeq = num;
          }
        });
        const nextSavNo = `SAV-${String(maxSavSeq + 1).padStart(3, '0')}`;

        await supabase.from('financial_vouchers').insert([{
          voucher_no: nextSavNo,
          voucher_type: 'Sale Amount Voucher',
          voucher_date: vDate,
          total_amount: grandTotal,
          debit: grandTotal,
          credit: 0,
          account_code: customerCode,
          account_title: customerName,
          narration: `Sale Amount for Invoice #${cleanInvNo} (${itemsCount} items)`,
          original_invoice_no: cleanInvNo,
          items: [
            {
              accountCode: customerCode,
              particulars: `Bill #${cleanInvNo}`,
              debit: grandTotal,
              credit: 0
            }
          ],
          metadata: {
            preset: 'SAV',
            source: 'sales_invoice',
            invoice_no: cleanInvNo,
            auto_generated: true
          }
        }]);
      }
    } else if (existingSav && isEdit) {
      await supabase.from('financial_vouchers').delete().eq('id', existingSav.id);
    }

    // 2. ─── HANDLE CRV (Customer Receive Voucher) ───
    if (totalPaid > 0) {
      // Resolve Bank Chart of Account if bank amount exists
      let bankCoaCode = '1020-001';
      let bankCoaTitle = 'Bank Account';
      if (Number(paidBank) > 0 && selectedBankTitle) {
        try {
          const cleanBankSearch = selectedBankTitle.trim();
          const { data: bankCoaRows } = await supabase
            .from('chart_of_accounts')
            .select('account_code, account_title')
            .ilike('account_title', `%${cleanBankSearch}%`)
            .limit(1);

          if (bankCoaRows && bankCoaRows[0]) {
            bankCoaCode = bankCoaRows[0].account_code;
            bankCoaTitle = bankCoaRows[0].account_title;
          }
        } catch (bErr) {
          console.warn('Bank COA lookup warning:', bErr);
        }
      }

      const crvItems: any[] = [];
      if (Number(paidCash) > 0) {
        crvItems.push({
          accountCode: '1010-001',
          accountTitle: 'Cash in Hand',
          particulars: `Cash received on Invoice #${cleanInvNo}`,
          debit: Number(paidCash),
          credit: 0
        });
      }
      if (Number(paidBank) > 0) {
        crvItems.push({
          accountCode: bankCoaCode,
          accountTitle: bankCoaTitle,
          particulars: `Bank transfer received on Invoice #${cleanInvNo}`,
          debit: Number(paidBank),
          credit: 0
        });
      }
      // Customer Credit row
      crvItems.push({
        accountCode: customerCode,
        accountTitle: customerName,
        particulars: `Customer credit on Invoice #${cleanInvNo}`,
        debit: 0,
        credit: totalPaid
      });

      const modeDesc = Number(paidCash) > 0 && Number(paidBank) > 0
        ? `Cash: Rs. ${paidCash} (1010-001) + Bank: Rs. ${paidBank} (${bankCoaCode} - ${bankCoaTitle})`
        : Number(paidBank) > 0
        ? `Bank Transfer: Rs. ${paidBank} (${bankCoaCode} - ${bankCoaTitle})`
        : `Cash Payment: Rs. ${paidCash} (1010-001 - Cash in Hand)`;

      if (existingCrv) {
        // Update existing CRV
        await supabase
          .from('financial_vouchers')
          .update({
            total_amount: totalPaid,
            debit: 0,
            credit: totalPaid,
            account_code: customerCode,
            account_title: customerName,
            voucher_date: vDate,
            narration: `Payment received for Invoice #${cleanInvNo} (${modeDesc})`,
            original_invoice_no: cleanInvNo,
            items: crvItems,
            metadata: {
              ...(existingCrv.metadata || {}),
              preset: 'CRV',
              source: 'sales_invoice',
              invoice_no: cleanInvNo,
              auto_generated: true,
              settlement_mode: settlementMode,
              bank_coa_code: bankCoaCode,
              bank_coa_title: bankCoaTitle,
              paid_cash: Number(paidCash),
              paid_bank: Number(paidBank)
            }
          })
          .eq('id', existingCrv.id);
      } else {
        // Generate next CRV number
        const { data: crvRows } = await supabase
          .from('financial_vouchers')
          .select('voucher_no')
          .ilike('voucher_no', 'CRV-%');

        let maxCrvSeq = 0;
        (crvRows || []).forEach(v => {
          const match = String(v.voucher_no || '').match(/CRV-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (num > maxCrvSeq) maxCrvSeq = num;
          }
        });
        const nextCrvNo = `CRV-${String(maxCrvSeq + 1).padStart(3, '0')}`;

        await supabase.from('financial_vouchers').insert([{
          voucher_no: nextCrvNo,
          voucher_type: 'Customer Receive Voucher',
          voucher_date: vDate,
          total_amount: totalPaid,
          debit: 0,
          credit: totalPaid,
          account_code: customerCode,
          account_title: customerName,
          narration: `Payment received for Invoice #${cleanInvNo} (${modeDesc})`,
          original_invoice_no: cleanInvNo,
          items: crvItems,
          metadata: {
            preset: 'CRV',
            source: 'sales_invoice',
            invoice_no: cleanInvNo,
            auto_generated: true,
            settlement_mode: settlementMode,
            bank_coa_code: bankCoaCode,
            bank_coa_title: bankCoaTitle,
            paid_cash: Number(paidCash),
            paid_bank: Number(paidBank)
          }
        }]);
      }
    } else if (existingCrv && isEdit) {
      // Payment was reduced to 0 in edit
      await supabase.from('financial_vouchers').delete().eq('id', existingCrv.id);
    }
  } catch (syncErr: any) {
    console.error('syncInvoiceFinancialVouchers error:', syncErr);
  }
};

const NewInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, role, userName, userEmail } = useAuth();
  const [customerCreditLimitsMap, setCustomerCreditLimitsMap] = useState<Record<string, number>>({});

  const checkAndAlertCreditLimit = (cust: any) => {
    if (!cust) return;
    const limit = Number(customerCreditLimitsMap[String(cust.id)] || 0);
    const bal = Number(cust.currentBalance !== undefined ? cust.currentBalance : (cust.balance || 0));
    if (limit > 0 && bal >= limit) {
      triggerFeedbackSound('warning', userEmail);
      toast.error(`Credit Limit Warning: "${cust.customerName}" has an outstanding balance of Rs. ${bal.toLocaleString()} which exceeds their agreed credit limit of Rs. ${limit.toLocaleString()}!`, { duration: 6000 });
    } else if (limit > 0 && bal >= 0.75 * limit) {
      triggerFeedbackSound('warning', userEmail);
      toast(`Credit Limit Alert: "${cust.customerName}" has reached ${Math.round((bal / limit) * 100)}% of their credit limit (Rs. ${limit.toLocaleString()}).`, { icon: '⚠️', duration: 5000 });
    }
  };
  const currentRole = (role || localStorage.getItem('zac_user_role') || '').toLowerCase();
  const currentSalesmanName = (userName || localStorage.getItem('zac_user_name') || '').trim();
  const isSalesman = currentRole.includes('salesman');
  const { id: routeId } = useParams<{ id?: string }>();
  const [fetchedEditData, setFetchedEditData] = useState<any>(null);
  const editData = location.state?.invoice || location.state?.record || fetchedEditData || null;

  useEffect(() => {
    if (!location.state?.invoice && !location.state?.record && routeId) {
      const isNum = /^\d+$/.test(routeId);
      const query = supabase.from('sales_invoices').select('*');
      if (isNum) {
        query.or(`id.eq.${routeId},invoice_no.eq.${routeId}`);
      } else {
        query.eq('invoice_no', routeId);
      }
      query.maybeSingle().then(({ data }) => {
        if (data) {
          setFetchedEditData(data);
        }
      });
    }
  }, [routeId, location.state]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [submitAction, setSubmitAction] = useState<'save' | 'print'>('save');

  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [salesmenList, setSalesmenList] = useState<any[]>([]);
  const matchedSalesman = salesmenList.find(
    (s) => (s.name || '').toLowerCase().trim() === currentSalesmanName.toLowerCase()
  )?.name || currentSalesmanName;
  const [transportList, setTransportList] = useState<any[]>([]);
  const [warehousesList, setWarehousesList] = useState<any[]>([]);
  const [workflowSettings, setWorkflowSettings] = useState<any>(null);
  const [stockDataset, setStockDataset] = useState<any>(null);
  const productDropdownScrollRef = useRef<HTMLDivElement>(null);
  const [banksList, setBanksList] = useState<any[]>([]);
  const [activeSkuIndex, setActiveSkuIndex] = useState<number | null>(null);
  const [highlightedSkuIndex, setHighlightedSkuIndex] = useState<number>(0);
  const [activeProdNameIndex, setActiveProdNameIndex] = useState<number | null>(null);
  const [highlightedProdNameIndex, setHighlightedProdNameIndex] = useState<number>(0);
  const [activeWhIndex, setActiveWhIndex] = useState<number | null>(null);
  const [highlightedWhIndex, setHighlightedWhIndex] = useState<number>(0);
  const [activeReturnProdIndex, setActiveReturnProdIndex] = useState<number | null>(null);
  const [highlightedReturnProdIndex, setHighlightedReturnProdIndex] = useState<number>(0);
  const [activeReturnWhIndex, setActiveReturnWhIndex] = useState<number | null>(null);
  const [highlightedReturnWhIndex, setHighlightedReturnWhIndex] = useState<number>(0);
  const [activeTileProdIndex, setActiveTileProdIndex] = useState<number | null>(null);
  const [highlightedTileProdIndex, setHighlightedTileProdIndex] = useState<number>(0);
  const [activeTileWhIndex, setActiveTileWhIndex] = useState<number | null>(null);
  const [highlightedTileWhIndex, setHighlightedTileWhIndex] = useState<number>(0);
  const [activeTileReturnProdIndex, setActiveTileReturnProdIndex] = useState<number | null>(null);
  const [highlightedTileReturnProdIndex, setHighlightedTileReturnProdIndex] = useState<number>(0);
  const [activeTileReturnWhIndex, setActiveTileReturnWhIndex] = useState<number | null>(null);
  const [highlightedTileReturnWhIndex, setHighlightedTileReturnWhIndex] = useState<number>(0);

  // Customer Searchable Combobox & Quick Add Modal State
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState<number>(0);

  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState<boolean>(false);
  const [quickCustomerName, setQuickCustomerName] = useState<string>('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState<string>('');
  const [quickCustomerAddress, setQuickCustomerAddress] = useState<string>('');
  const [quickCustomerCode, setQuickCustomerCode] = useState<string>('');
  const [quickCustomerCategory, setQuickCustomerCategory] = useState<string>('Retail / General');
  const [quickCustomerOpeningBal, setQuickCustomerOpeningBal] = useState<number | string>(0);
  const [quickCustomerBalNature, setQuickCustomerBalNature] = useState<'Debit' | 'Credit'>('Debit');
  const [isSavingQuickCustomer, setIsSavingQuickCustomer] = useState<boolean>(false);

  const getNextCustomerCode = (): string => {
    let maxNum = 0;
    customersList.forEach((c: any) => {
      const code = c.customer_code || c.customerCode || c.coa_code || '';
      const match = String(code).match(/2020-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `2020-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handleOpenQuickCustomerModal = (initialName: string = '', setFieldValueFn?: any) => {
    if (setFieldValueFn) {
      setActiveFormikSetFieldValue(() => setFieldValueFn);
    }
    setQuickCustomerName(initialName);
    setQuickCustomerPhone('');
    setQuickCustomerAddress('');
    setQuickCustomerCode(getNextCustomerCode());
    setQuickCustomerCategory('Retail / General');
    setQuickCustomerOpeningBal(0);
    setQuickCustomerBalNature('Debit');
    setIsQuickCustomerModalOpen(true);
    setIsCustomerDropdownOpen(false);
  };

  const handleSaveQuickCustomer = async (formikSetFieldValue: any, currentShippingAddress?: string) => {
    const trimmedName = quickCustomerName.trim();
    if (!trimmedName) {
      toast.error('Customer Name is required!');
      return;
    }
    setIsSavingQuickCustomer(true);
    try {
      const cleanCode = quickCustomerCode.trim();
      const parsedOpeningBal = Number(quickCustomerOpeningBal || 0);
      const computedBalance = quickCustomerBalNature === 'Credit' ? -Math.abs(parsedOpeningBal) : Math.abs(parsedOpeningBal);

      const payload: any = {
        customerName: trimmedName,
        customer_code: cleanCode,
        customerCode: cleanCode,
        coa_code: cleanCode,
        registrationType: quickCustomerCategory,
        primaryPhone: quickCustomerPhone.trim(),
        phone: quickCustomerPhone.trim(),
        address: quickCustomerAddress.trim(),
        province: 'Sindh',
        opening_balance: computedBalance,
        currentBalance: computedBalance,
      };

      const { data: insertData, error: insertError } = await supabase
        .from('customers')
        .insert([payload])
        .select('id');

      if (insertError) throw insertError;

      const newCustomerId = insertData?.[0]?.id || Date.now();
      const createdCustObj = {
        id: newCustomerId,
        ...payload
      };

      if (cleanCode) {
        try {
          const coaPayload: any = {
            category_code: '1. ASSETS',
            sub_category_code: 'Current Assets',
            control_code: 'Customers',
            account_code: cleanCode,
            account_title: trimmedName,
            opening_balance: Math.abs(parsedOpeningBal),
            balance_nature: quickCustomerBalNature || 'Debit',
            notes: `Customer ledger account for ${trimmedName} (Synced from Quick Add)`
          };
          await supabase.from('chart_of_accounts').insert([coaPayload]);
        } catch (coaErr) {
          console.warn('COA Quick-sync warning:', coaErr);
        }
      }

      setCustomersList((prev) => [createdCustObj, ...prev]);

      if (formikSetFieldValue) {
        formikSetFieldValue('customerName', trimmedName);
        if (quickCustomerAddress.trim() && !currentShippingAddress) {
          formikSetFieldValue('shippingAddress', quickCustomerAddress.trim());
        }
      }
      setSelectedRecordedCustomer(trimmedName);
      setCustomerModalType('recorded');
      fetchCustomerPastSales(trimmedName);
      setCustomerSearchQuery('');
      setIsQuickCustomerModalOpen(false);
      toast.success(`Customer "${trimmedName}" created and selected!`);
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      toast.error(err.message || 'Failed to create customer');
    } finally {
      setIsSavingQuickCustomer(false);
    }
  };

  const [totalStockMap, setTotalStockMap] = useState<Record<string, number>>({});
  const [customerSoldMap, setCustomerSoldMap] = useState<Record<string, { boxes: number; loose: number; totalPieces: number }>>({});

  const fetchCustomerPastSales = async (customerName: string) => {
    if (!customerName || customerName.toLowerCase() === 'walk-in customer') {
      setCustomerSoldMap({});
      return;
    }
    try {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('id, invoice_no, items')
        .ilike('customer_name', customerName.trim());
      if (error || !data) return;

      const soldMap: Record<string, { boxes: number; loose: number; totalPieces: number }> = {};
      data.forEach((inv: any) => {
        let items = inv.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch (_) { items = []; }
        }
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const nameKey = String(item.itemName || item.product_name || '').toLowerCase().trim();
            if (!nameKey) return;
            const ppb = Math.max(1, Number(item.piecesPerBox || item.pcsPerBox || 4));
            const boxQty = Number(item.boxQty || (item.isTileItem ? item.qty : 0) || 0);
            const loose = Number(item.loosePcs || 0);
            const pieces = (boxQty * ppb) + loose;

            if (!soldMap[nameKey]) {
              soldMap[nameKey] = { boxes: 0, loose: 0, totalPieces: 0 };
            }
            soldMap[nameKey].boxes += boxQty;
            soldMap[nameKey].loose += loose;
            soldMap[nameKey].totalPieces += pieces;
          });
        }
      });
      setCustomerSoldMap(soldMap);
    } catch (err) {
      console.error('Failed to fetch customer past sales:', err);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const calculateAllStocks = async () => {
      if (!productsList || productsList.length === 0) return;
      const map: Record<string, number> = {};

      if (stockDataset) {
        if (stockDataset.balancesMode && Array.isArray(stockDataset.balances)) {
          (stockDataset.balances || []).forEach((r: any) => {
            const name = String(r.product_name || '').toLowerCase().trim();
            map[name] = (map[name] || 0) + (Number(r.quantity) || 0);
          });
        } else {
          for (const p of productsList) {
            const name = (p.product_name || '').toLowerCase().trim();
            try {
              const val = await getTotalAvailableStock(p.product_name, stockDataset);
              map[name] = val;
            } catch {
              map[name] = Number(p.current_stock || 0);
            }
          }
        }
      }
      productsList.forEach(p => {
        const name = (p.product_name || '').toLowerCase().trim();
        if (map[name] === undefined) {
          map[name] = Number(p.current_stock || 0);
        }
      });
      if (!isCancelled) {
        setTotalStockMap(map);
      }
    };
    calculateAllStocks();
    return () => { isCancelled = true; };
  }, [stockDataset, productsList]);

  const getProductOverallStock = (p: any): number => {
    if (!p) return 0;
    const key = String(p.product_name || '').toLowerCase().trim();
    if (totalStockMap[key] !== undefined) return totalStockMap[key];
    return Number(p.current_stock || 0);
  };

  const getTileStockBreakdown = (p: any) => {
    const totStock = getProductOverallStock(p);
    let pcsPerBox = Number(p.pieces_per_box || p.pcs_per_box || p.pieces_per_packing || 0);
    if (pcsPerBox <= 1) {
      const match = String(p.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
      if (match && Number(match[1]) > 0) pcsPerBox = Number(match[1]);
      else pcsPerBox = 4;
    }
    const totalPieces = Math.round(totStock * pcsPerBox);
    const boxes = Math.floor(totalPieces / pcsPerBox);
    const loose = totalPieces % pcsPerBox;
    return { totStock, boxes, loose, pcsPerBox };
  };

  const getItemWarehouseStock = (productName: string, warehouseName: string, itemCode?: string): number => {
    if (!productName || !warehouseName) return 0;
    const raw = getWarehouseAvailableStock(productName, warehouseName, stockDataset, itemCode);
    return Math.abs(raw) < 0.0001 ? 0 : Number(raw.toFixed(2));
  };

  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [showStockWarningModal, setShowStockWarningModal] = useState<boolean>(false);
  const [stockWarningItems, setStockWarningItems] = useState<any[]>([]);
  const [bypassNegativeStockWarning, setBypassNegativeStockWarning] = useState<boolean>(false);
  const [activeFormikSetFieldValue, setActiveFormikSetFieldValue] = useState<any>(null);
  const [customerModalType, setCustomerModalType] = useState<'walkin' | 'recorded'>('walkin');
  const [walkinName, setWalkinName] = useState<string>('');
  const [walkinPhone, setWalkinPhone] = useState<string>('');
  const [recordWalkinCustomer, setRecordWalkinCustomer] = useState<boolean>(true);
  const [selectedRecordedCustomer, setSelectedRecordedCustomer] = useState<string>('');
  const [pendingFormValues, setPendingFormValues] = useState<any>(null);
  const [isOpeningCustomerModal, setIsOpeningCustomerModal] = useState<boolean>(false);

  const openCustomerCheckoutModal = (formValues?: any, bypassNegative: boolean = false) => {
    if (formValues) setPendingFormValues(formValues);
    setBypassNegativeStockWarning(bypassNegative);
    setShowCustomerModal(true);
  };
  const [serverToday, setServerToday] = useState<Date | null>(null);

  useEffect(() => {
    // Fetch server date so validation is not based on user's local clock
    supabase.rpc('get_server_date').then(({ data }) => {
      if (data) setServerToday(new Date(data));
      else setServerToday(new Date());
    }).catch(() => setServerToday(new Date()));

  // Fetch enterprise catalog
    const fetchCompleteEnterpriseCatalog = async () => {
      try {
        setInitialLoading(true);
        const { data: rawCust } = await fetchAllPages(supabase.from('customers').select('*'));
        let { data: prod, error: prodErr } = await fetchAllPages(supabase.from('products').select('id, product_name, current_stock, retail_price, purchase_price, item_sr_no, category, sub_category, sub_sub_category, hs_code, uom, pieces_per_box, pcs_per_box, pieces_per_packing, product_description, bin, item_type, service_charges, allow_loose_sales, loose_uom, loose_conversion_ratio, loose_sale_price'));
        if (prodErr && (prodErr.message?.includes('allow_loose_sales') || prodErr.code === '42703')) {
          const fallbackRes = await fetchAllPages(supabase.from('products').select('id, product_name, current_stock, retail_price, purchase_price, item_sr_no, category, sub_category, sub_sub_category, hs_code, uom, pieces_per_box, pcs_per_box, pieces_per_packing, product_description, bin, item_type, service_charges'));
          prod = fallbackRes.data;
        }
        const { data: sm } = await fetchAllPages(supabase.from('salesmen').select('id, name, invoice_name, invoice_names'));
        const { data: trans } = await fetchAllPages(supabase.from('logistics_transportation').select('id, name, base_charges'));
        const { data: locMaster } = await fetchAllPages(supabase.from('inventory_locations').select('name'));
        const { data: wh } = await fetchAllPages(supabase.from('opening_stocks').select('location'));
        const { data: invWh } = await fetchAllPages(supabase.from('warehouse_inventory').select('warehouse_name'));
        const { data: rawBnk } = await fetchAllPages(supabase.from('banks').select('*'));

        const cust = (rawCust || []).map((c: any) => ({
          ...c,
          customerName: c.customerName || c.customername || c.name || '',
          primaryPhone: c.primaryPhone || c.primaryphone || c.phone || '',
          customer_code: c.customer_code || c.customerCode || c.customercode || ''
        }));
        const bnk = (rawBnk || []).map((b: any) => ({
          ...b,
          bankName: b.bankName || b.bankname || '',
          accountTitle: b.accountTitle || b.accounttitle || b.account_title || ''
        }));

        // Load the stock ledger snapshot once (reused for every row's availability check)
        fetchStockDataset().then(setStockDataset).catch(() => setStockDataset(null));
        fetchWorkflowSettings().then(setWorkflowSettings).catch(() => {});

        if (cust) setCustomersList(cust);
        if (prod) setProductsList(prod);
        if (sm) setSalesmenList(sm);
        if (trans) setTransportList(trans);

        const combinedLocs = [
          ...(locMaster || []).map((l: any) => l.name)
        ];
        const uniqueLocations = Array.from(new Set(combinedLocs.map((loc: any) => String(loc || '').trim()).filter(Boolean)));
        setWarehousesList(uniqueLocations);

        if (bnk) setBanksList(bnk);
      } catch (err: any) {
        toast.error('Failed to aggregate core infrastructure registries: ' + err.message);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchCompleteEnterpriseCatalog();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.sku-container')) {
        setActiveSkuIndex(null);
      }
      if (!target.closest('.prod-name-container')) {
        setActiveProdNameIndex(null);
      }
      if (!target.closest('.wh-container')) {
        setActiveWhIndex(null);
      }
      if (!target.closest('.return-prod-name-container')) {
        setActiveReturnProdIndex(null);
      }
      if (!target.closest('.return-wh-container')) {
        setActiveReturnWhIndex(null);
      }
      if (!target.closest('.tile-prod-name-container')) {
        setActiveTileProdIndex(null);
      }
      if (!target.closest('.tile-wh-container')) {
        setActiveTileWhIndex(null);
      }
      if (!target.closest('.tile-return-prod-name-container')) {
        setActiveTileReturnProdIndex(null);
      }
      if (!target.closest('.tile-return-wh-container')) {
        setActiveTileReturnWhIndex(null);
      }
      if (!target.closest('.customer-combobox-container')) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editData && (editData.customer_name || editData.customerName)) {
      fetchCustomerPastSales(editData.customer_name || editData.customerName);
    }
  }, [editData]);

  const getSalesmanPrefix = (salesmanName: string, smList: any[] = salesmenList): string => {
    if (!salesmanName) return '';
    const smObj = (smList && smList.length > 0 ? smList : salesmenList).find(
      (s) => (s.name || '').toLowerCase().trim() === salesmanName.toLowerCase().trim()
    );
    const rawPrefix = (
      smObj?.invoice_name ||
      (smObj?.invoice_names && smObj?.invoice_names[0]) ||
      smObj?.name ||
      salesmanName ||
      ''
    )
      .trim()
      .toUpperCase();

    return rawPrefix ? `${rawPrefix}-` : '';
  };

  const getFormInitialValues = () => {
    if (editData) {
      const parsedItems = Array.isArray(editData.items)
        ? editData.items
        : JSON.parse(editData.items || '[]');

      // Intelligently separate standard return items from tile return items
      const rawReturnItems = Array.isArray(editData.return_items) ? editData.return_items : (parsedItems[0]?._returnItems || []);
      const rawTileReturnItems = (Array.isArray(editData.tile_return_items) && editData.tile_return_items.length > 0)
        ? editData.tile_return_items
        : (Array.isArray(parsedItems[0]?._tileReturnItems) && parsedItems[0]._tileReturnItems.length > 0
            ? parsedItems[0]._tileReturnItems
            : []);

      const isTileLikeItem = (it: any) => {
        if (it.isTileItem) return true;
        if (String(it.uom || '').toUpperCase() === 'BOX') return true;
        const matched = productsList.find((p: any) => 
          (it.skuCode && String(p.item_sr_no).trim().toLowerCase() === String(it.skuCode).trim().toLowerCase()) ||
          (it.itemName && String(p.product_name).trim().toLowerCase() === String(it.itemName).trim().toLowerCase())
        );
        if (matched && (
          String(matched.sub_sub_category).toUpperCase().includes('TILE') ||
          String(matched.uom).toUpperCase() === 'BOX' ||
          Number(matched.pieces_per_box) > 1 ||
          Number(matched.pcs_per_box) > 1
        )) {
          return true;
        }
        return false;
      };

      const migratedTileReturns = [...rawTileReturnItems];
      const nonTileReturns: any[] = [];

      rawReturnItems.forEach((r: any) => {
        if (isTileLikeItem(r)) {
          const exists = migratedTileReturns.some((t: any) =>
            (t.skuCode && t.skuCode === r.skuCode) || (t.itemName && t.itemName === r.itemName)
          );
          if (!exists) {
            migratedTileReturns.push(r);
          }
        } else {
          nonTileReturns.push(r);
        }
      });

      const defaultResolvedWarehouse = (
        editData.dispatch_warehouse ||
        editData.source_warehouse ||
        editData.warehouse ||
        (Array.isArray(parsedItems) ? parsedItems.find((i: any) => i?.warehouse && String(i.warehouse).trim())?.warehouse : '') ||
        (Array.isArray(editData.tile_items) ? editData.tile_items.find((i: any) => i?.warehouse && String(i.warehouse).trim())?.warehouse : '') ||
        (editData.gate_pass_no && editData.gate_pass_no.includes(':') ? editData.gate_pass_no.split(':')[0].trim() : '') ||
        (editData.gate_pass_no && editData.gate_pass_no.includes('-') ? editData.gate_pass_no.split('-')[0].trim() : '') ||
        ''
      );
      let resolvedWh = defaultResolvedWarehouse;
      if (defaultResolvedWarehouse && warehousesList.length > 0) {
        const match = warehousesList.find(w => String(w).toLowerCase().trim() === String(defaultResolvedWarehouse).toLowerCase().trim());
        if (match) {
          resolvedWh = match;
        }
      }

      return {
        invoiceNo: editData.invoice_no || '',
        customerName: editData.customer_name || editData.customerName || '',
        saleDate: editData.sale_date || new Date().toISOString().split('T')[0],
        paymentTerm: editData.payment_term || 'Cash',
        dispatchWarehouse: resolvedWh,
        applyFbrTax: Boolean(editData.apply_fbr_tax || (editData.scenario_type && editData.scenario_type !== 'Standard Retail Sale (No Tax)')),
        taxScenario: editData.scenario_type || 'Goods at Standard Rate to Registered Buyers',
        salesman: editData.salesman || (isSalesman ? (matchedSalesman || currentSalesmanName) : ''),
        transportType: editData.transport_name || 'No Transport (Handover)',
        transportCharges: Number(editData.transport_charges || 0),
        settlementMode: (Number(editData.cash_amount_paid || 0) > 0 && (Number(editData.bank_amount || 0) > 0 || editData.selected_bank))
          ? 'Split'
          : (editData.selected_bank || Number(editData.bank_amount || 0) > 0 ? 'Bank' : 'Cash'),
        selectedBankTitle: editData.selected_bank || '',
        cashAmountPaid: Number(editData.cash_amount_paid || 0),
        bankAmountPaid: Number(editData.bank_amount || 0),
        dcNo: editData.dc_no || '',
        gatePasses: (() => {
          if (!editData.gate_pass_no) return {};
          try {
            if (editData.gate_pass_no.includes(':')) {
              const parts = String(editData.gate_pass_no).split(' | ');
              const obj: any = {};
              parts.forEach((p) => {
                const [k, v] = p.split(':');
                if (k && v) obj[k.trim()] = v.trim();
              });
              return obj;
            }
            return { [editData.items?.[0]?.warehouse || 'Main Warehouse']: editData.gate_pass_no };
          } catch (e) { return {}; }
        })(),
        shippingAddress: editData.shipping_address || '',
        showDiscount: parsedItems.some((i: any) => Number(i.discountAmt || i.discount_amt || i.discount || 0) > 0),
        showOverallDiscount: Number(editData.overall_discount || editData.discount_amount || parsedItems.find((i: any) => i._overallDiscount !== undefined)?._overallDiscount || 0) > 0,
        overallDiscount: Number(editData.overall_discount || editData.discount_amount || parsedItems.find((i: any) => i._overallDiscount !== undefined)?._overallDiscount || 0),
        showAdditionalCharges: Number(editData.additional_charges || 0) > 0,
        additionalCharges: Number(editData.additional_charges || 0),

        showReturnSection: nonTileReturns.length > 0,
        returnItems: nonTileReturns.map((r: any) => ({
          skuCode: r.skuCode || r.sku || '',
          itemName: r.itemName || r.product_name || '',
          warehouse: r.warehouse || editData.dispatch_warehouse || '',
          qty: Number(r.qty || 1),
          rp: Number(r.rp ?? r.rate ?? 0),
          uom: r.uom || 'PCS',
          amount: Number(r.total || (Number(r.qty || 1) * Number(r.rp ?? r.rate ?? 0)))
        })),
        showTileReturnSection: migratedTileReturns.length > 0,
        tileReturnItems: migratedTileReturns.map((t: any, tIdx: number) => {
          const matchedProd = productsList.find((p: any) => 
            (t.skuCode && String(p.item_sr_no).trim().toLowerCase() === String(t.skuCode).trim().toLowerCase()) ||
            (t.itemName && String(p.product_name).trim().toLowerCase() === String(t.itemName).trim().toLowerCase())
          );
          const pcsPerBox = Number(t.piecesPerBox ?? matchedProd?.pieces_per_box ?? matchedProd?.pcs_per_box ?? 8);
          const sqmPerBox = Number(t.sqmPerBox ?? 1.44);
          const bQty = Number(t.boxQty ?? t.qty ?? 1);
          const lPcs = Number(t.loosePcs ?? 0);
          const pBox = Number(t.pricePerBox ?? t.rp ?? t.rate ?? (matchedProd?.retail_price || 0));
          const pPiece = pBox > 0 && pcsPerBox > 0 ? (pBox / pcsPerBox) : Number(t.pricePerPiece ?? 0);
          const pSqm = pBox > 0 && sqmPerBox > 0 ? (pBox / sqmPerBox) : Number(t.pricePerSqm ?? 0);
          const totAmount = Number(t.totalAmount ?? t.total ?? t.amount ?? ((bQty * pBox) + (lPcs * pPiece)));
          const totSqm = Number(t.totalSqm ?? (bQty * sqmPerBox + (lPcs / pcsPerBox) * sqmPerBox));
          return {
            id: t.id || `tile-return-${tIdx}-${Date.now()}`,
            skuCode: t.skuCode || t.sku || matchedProd?.item_sr_no || '',
            itemName: t.itemName || t.product_name || matchedProd?.product_name || '',
            warehouse: t.warehouse || editData.dispatch_warehouse || '',
            availableQty: Number(t.availableQty || 0),
            boxQty: bQty,
            loosePcs: lPcs,
            piecesPerBox: pcsPerBox,
            sqmPerBox: sqmPerBox,
            pricePerBox: pBox,
            pricePerSqm: Number(pSqm.toFixed(2)),
            pricePerPiece: Number(pPiece.toFixed(2)),
            totalAmount: totAmount,
            totalSqm: Number(totSqm.toFixed(2)),
            isTileItem: true
          };
        }),
        showTileSection: (Array.isArray(editData.tile_items) && editData.tile_items.length > 0) || (Array.isArray(parsedItems[0]?._tileItems) && parsedItems[0]._tileItems.length > 0) || parsedItems.some((i: any) => i.isTileItem),
        tileItems: (
          Array.isArray(editData.tile_items) && editData.tile_items.length > 0
            ? editData.tile_items
            : (Array.isArray(parsedItems[0]?._tileItems) && parsedItems[0]._tileItems.length > 0
                ? parsedItems[0]._tileItems
                : parsedItems.filter((i: any) => i.isTileItem))
        ).map((t: any, tIdx: number) => ({
          id: t.id || `tile-${tIdx}-${Date.now()}`,
          skuCode: t.skuCode || t.sku || '',
          itemName: t.itemName || t.product_name || '',
          warehouse: t.warehouse || resolvedWh,
          availableQty: Number(t.availableQty || 0),
          boxQty: Number(t.boxQty ?? t.qty ?? 1),
          loosePcs: Number(t.loosePcs ?? 0),
          piecesPerBox: Number(t.piecesPerBox ?? 4),
          sqmPerBox: Number(t.sqmPerBox ?? 1.44),
          pricePerBox: Number(t.pricePerBox ?? t.rp ?? 0),
          pricePerSqm: Number(t.pricePerSqm ?? 0),
          pricePerPiece: Number(t.pricePerPiece ?? 0),
          totalAmount: Number(t.totalAmount ?? t.total ?? t.amount ?? 0),
          totalSqm: Number(t.totalSqm ?? 0),
          isTileItem: true
        })),
        items: (parsedItems.filter((i: any) => !i.isTileItem).length > 0
          ? parsedItems.filter((i: any) => !i.isTileItem)
          : [{ skuCode: '', itemName: '', warehouse: resolvedWh, qty: 1, rp: 0, discountPer: 0, discountAmt: 0, gstRate: 0, fTaxPer: 0, amount: 0, availableQty: 0, itemServiceCharges: 0 }]
        ).map((it: any) => ({
          ...it,
          warehouse: it.warehouse || resolvedWh,
          discountPer: Number(it.discountPer ?? it.discount_per ?? 0),
          discountAmt: Number(it.discountAmt ?? it.discount_amt ?? it.discount ?? 0)
        })),
        excessCreditAction: editData.excess_credit_action || (parsedItems[0]?._excessCreditAction || (Number(parsedItems[0]?._refundPayoutAmount || parsedItems[0]?._excessRefundAmount || 0) > 0 ? 'refund' : 'credit')),
        excessRefundAmount: Number(parsedItems[0]?._refundPayoutAmount ?? parsedItems[0]?._excessRefundAmount ?? 0),
        excessRefundMethod: parsedItems[0]?._refundPayoutMethod ?? parsedItems[0]?._excessRefundMethod ?? 'Cash',
        excessRefundBank: parsedItems[0]?._refundPayoutBank ?? parsedItems[0]?._excessRefundBank ?? ''
      };
    }
    return {
      invoiceNo: '', customerName: '', saleDate: new Date().toISOString().split('T')[0], paymentTerm: 'Cash',
      dispatchWarehouse: '', applyFbrTax: false, showDiscount: false, showOverallDiscount: false, overallDiscount: 0, showAdditionalCharges: false, additionalCharges: 0,
      showReturnSection: false, returnItems: [],
      showTileReturnSection: false, tileReturnItems: [],
      showTileSection: false, tileItems: [],
      taxScenario: 'Goods at Standard Rate to Registered Buyers',
      salesman: isSalesman ? (matchedSalesman || currentSalesmanName) : '',
      transportType: 'No Transport (Handover)', transportCharges: 0, settlementMode: 'Cash',
      selectedBankTitle: '', cashAmountPaid: 0, bankAmountPaid: 0,
      excessCreditAction: 'credit',
      excessRefundAmount: 0,
      excessRefundMethod: 'Cash',
      excessRefundBank: '',
      dcNo: '',
      gatePasses: {},
      shippingAddress: '',
      items: [{ skuCode: '', itemName: '', warehouse: '', qty: 1, rp: 0, discountPer: 0, discountAmt: 0, gstRate: 0, fTaxPer: 0, amount: 0, availableQty: 0, itemServiceCharges: 0 }]
    };
  };

  const validationSchema = Yup.object().shape({
    invoiceNo: Yup.string()
      .required('Invoice # is required')
      .test(
        'has-digits',
        'Please enter the invoice number digits',
        function (value, ctx) {
          if (!value) return false;
          const prefix = getSalesmanPrefix(ctx.parent.salesman, salesmenList);
          if (prefix && value.trim().toUpperCase() === prefix.trim().toUpperCase()) {
            return false;
          }
          return true;
        }
      )
      .test(
        'check-invoice-unique',
        'This Invoice Number already exists!',
        async function (value) {
          if (!value) return true;
          const originalInvoiceNo = editData?.invoice_no;
          if (originalInvoiceNo && String(originalInvoiceNo).trim().toLowerCase() === String(value).trim().toLowerCase()) {
            return true;
          }
          try {
            const { data, error } = await supabase
              .from('sales_invoices')
              .select('id')
              .ilike('invoice_no', value.trim())
              .maybeSingle();
            if (error) return true;
            if (data) return false;
            return true;
          } catch (e) {
            return true;
          }
        }
      ),
    gatePasses: Yup.object().nullable().notRequired(),
    shippingAddress: Yup.string().nullable(),
    saleDate: Yup.string().required('Required Field').test('valid-date', 'Date must be within last 7 days', function(value) {
      if (!value) return false;
      if (editData && (editData.sale_date || editData.date) && value === String(editData.sale_date || editData.date).split('T')[0]) {
        return true;
      }
      const selected = new Date(value);
      selected.setHours(0,0,0,0);
      const base = serverToday ? new Date(serverToday) : new Date();
      const today = new Date(base);
      today.setHours(0,0,0,0);
      const minDate = new Date(today);
      minDate.setDate(today.getDate() - 7);
      return selected >= minDate && selected <= today;
    }),
    taxScenario: Yup.string().required('Required Field'),
    salesman: Yup.string().required('Required Field'),
    settlementMode: Yup.string().oneOf(['Cash', 'Bank', 'Split']).required('Required Field'),
    cashAmountPaid: Yup.number().min(0).nullable(),
    bankAmountPaid: Yup.number().min(0).nullable(),
    excessRefundAmount: Yup.number().min(0).nullable(),
    excessCreditAction: Yup.string().nullable(),
    excessRefundMethod: Yup.string().nullable(),
    excessRefundBank: Yup.string().nullable(),
    selectedBankTitle: Yup.string().when('settlementMode', {
      is: (val: string) => val === 'Bank' || val === 'Split',
      then: (schema) => schema.required('Please select corporate bank ledger profile'),
      otherwise: (schema) => schema.notRequired()
    }),
    items: Yup.array().of(
      Yup.object().shape({
        itemName: Yup.string().nullable(),
        warehouse: Yup.string().nullable().notRequired(),
        qty: Yup.number().when('itemName', {
          is: (val: string) => Boolean(val && val.trim()),
          then: (s) => s.min(0.001, 'Qty must be > 0').required('Qty is required'),
          otherwise: (s) => s.nullable()
        }),
        rp: Yup.number().when('itemName', {
          is: (val: string) => Boolean(val && val.trim()),
          then: (s) => s.min(0, 'Price cannot be negative').required('Price is required'),
          otherwise: (s) => s.nullable()
        }),
        discountPer: Yup.number().min(0).nullable(),
        discountAmt: Yup.number().min(0).nullable(),
        gstRate: Yup.number().min(0).nullable(),
        fTaxPer: Yup.number().min(0).nullable()
      })
    ).test('at-least-one-item', 'Please add at least one product to the invoice', function (items) {
      return Array.isArray(items) && items.some((i: any) => i && i.itemName && String(i.itemName).trim() !== '');
    }),
    returnItems: Yup.array().of(
      Yup.object().shape({
        itemName: Yup.string().required('Item Name is required'),
        warehouse: Yup.string().nullable().notRequired(),
        qty: Yup.number().min(0.001, 'Return Qty must be > 0').required('Qty is required'),
        rp: Yup.number().min(0, 'Return rate cannot be negative').required('Rate is required')
      })
    ).nullable()
  });

  const fetchStockForWarehouse = async (productName: string, chosenWarehouse: string, itemCode?: string) => {
    if (!productName) return 0;
    try {
      if (!chosenWarehouse) {
        const t = await getTotalAvailableStock(productName, stockDataset, itemCode);
        console.log(`[Invoice] No WH. Total stock for ${productName}:`, t);
        return t;
      }
      const s = await getAvailableStock(productName, chosenWarehouse, stockDataset, itemCode);
      console.log(`[Invoice] WH selected (${chosenWarehouse}). Stock for ${productName}:`, s);
      return s;
    } catch (err) {
      console.error("[Invoice] Error fetching stock:", err);
      return 0;
    }
  };

  // Keep the highlighted option in view while navigating with the arrow keys
  const queueProductScroll = (next: number) => {
    setTimeout(() => {
      const box = productDropdownScrollRef.current;
      if (!box) return;
      const el = box.querySelector(`[data-opt="${next}"]`) as HTMLElement | null;
      if (el) el.scrollIntoView({ block: 'nearest' });
    }, 0);
  };

  const handleProductSelectionWithWH = async (selectedProduct: any, index: number, chosenWarehouse: string, setFieldValue: any, currentItem?: any) => {
    if (!selectedProduct) {
      setFieldValue(`items.${index}.itemName`, '');
      setFieldValue(`items.${index}.skuCode`, '');
      setFieldValue(`items.${index}.availableQty`, 0);
      setFieldValue(`items.${index}.rp`, 0);
      setFieldValue(`items.${index}.amount`, 0);
      setFieldValue(`items.${index}.discountAmt`, 0);
      setFieldValue(`items.${index}.itemServiceCharges`, 0);
      return;
    }
    const serviceCharges = Number(selectedProduct.service_charges || 0);
    const isService = selectedProduct.item_type === 'service';
    const newRp = (Number(selectedProduct.retail_price) || 0) + (isService ? serviceCharges : 0);
    setFieldValue(`items.${index}.itemName`, selectedProduct.product_name);
    setFieldValue(`items.${index}.skuCode`, selectedProduct.item_sr_no || '');
    setFieldValue(`items.${index}.rp`, newRp);
    setFieldValue(`items.${index}.uom`, selectedProduct.uom || 'MTR');
    setFieldValue(`items.${index}.itemServiceCharges`, isService ? serviceCharges : 0);
    setFieldValue(`items.${index}.hsCode`, selectedProduct.hs_code || '');

    if (currentItem && currentItem.discountPer) {
      const gross = newRp * (Number(currentItem.qty) || 1);
      const calculatedAmt = (gross * Number(currentItem.discountPer)) / 100;
      setFieldValue(`items.${index}.discountAmt`, Number(calculatedAmt.toFixed(2)));
    }

    const effectiveWarehouse = (currentItem && currentItem.warehouse) ? currentItem.warehouse : (chosenWarehouse || '');
    if (effectiveWarehouse) {
      setFieldValue(`items.${index}.warehouse`, effectiveWarehouse);
    }
    const availStock = await fetchStockForWarehouse(selectedProduct.product_name, effectiveWarehouse, selectedProduct.item_sr_no);
    setFieldValue(`items.${index}.availableQty`, availStock);
  };

  const handleTileProductSelection = async (
    selectedProduct: any,
    tIdx: number,
    chosenWarehouse: string,
    setFieldValue: any,
    currentTileItem?: any
  ) => {
    if (!selectedProduct) {
      setFieldValue(`tileItems.${tIdx}.itemName`, '');
      setFieldValue(`tileItems.${tIdx}.skuCode`, '');
      setFieldValue(`tileItems.${tIdx}.availableQty`, 0);
      setFieldValue(`tileItems.${tIdx}.pricePerBox`, 0);
      setFieldValue(`tileItems.${tIdx}.pricePerSqm`, 0);
      setFieldValue(`tileItems.${tIdx}.pricePerPiece`, 0);
      setFieldValue(`tileItems.${tIdx}.totalAmount`, 0);
      setFieldValue(`tileItems.${tIdx}.totalSqm`, 0);
      return;
    }

    let pcsPerBox = Number(selectedProduct.pieces_per_box || selectedProduct.pcs_per_box || selectedProduct.pieces_per_packing || 0);
    if (pcsPerBox <= 1) {
      const match = String(selectedProduct.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
      if (match && Number(match[1]) > 0) pcsPerBox = Number(match[1]);
      else pcsPerBox = 4;
    }

    let sqmPerBox = 1.44;
    const matchSqm = String(selectedProduct.product_description || '').match(/([\d\.]+)\s*sq\.m/i);
    if (matchSqm && Number(matchSqm[1]) > 0) {
      sqmPerBox = Number(matchSqm[1]);
    } else {
      const dimMatch = String(`${selectedProduct.sub_category || ''} ${selectedProduct.product_description || ''} ${selectedProduct.item_sr_no || ''}`).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
      if (dimMatch) {
        const h = Number(dimMatch[1]) || 60;
        const w = Number(dimMatch[2]) || 60;
        sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
      }
    }

    const pBox = Number(selectedProduct.retail_price || 0);
    const configuredLoosePrice = Number(selectedProduct.loose_sale_price || 0);
    const pPiece = configuredLoosePrice > 0 ? configuredLoosePrice : Number((pBox / pcsPerBox).toFixed(2));
    const pSqm = Number((pBox / (sqmPerBox || 1)).toFixed(2));

    const boxQty = currentTileItem?.boxQty !== undefined ? Number(currentTileItem.boxQty) : 1;
    const loosePcs = currentTileItem?.loosePcs !== undefined ? Number(currentTileItem.loosePcs) : 0;
    const lineTotal = Number(((boxQty * pBox) + (loosePcs * pPiece)).toFixed(2));
    const lineSqm = Number(((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));

    setFieldValue(`tileItems.${tIdx}.itemName`, selectedProduct.product_name);
    setFieldValue(`tileItems.${tIdx}.skuCode`, selectedProduct.item_sr_no || `SKU-${selectedProduct.id}`);
    setFieldValue(`tileItems.${tIdx}.piecesPerBox`, pcsPerBox);
    setFieldValue(`tileItems.${tIdx}.sqmPerBox`, sqmPerBox);
    setFieldValue(`tileItems.${tIdx}.pricePerBox`, pBox);
    setFieldValue(`tileItems.${tIdx}.pricePerPiece`, pPiece);
    setFieldValue(`tileItems.${tIdx}.pricePerSqm`, pSqm);
    setFieldValue(`tileItems.${tIdx}.boxQty`, boxQty);
    setFieldValue(`tileItems.${tIdx}.loosePcs`, loosePcs);
    setFieldValue(`tileItems.${tIdx}.totalAmount`, lineTotal);
    setFieldValue(`tileItems.${tIdx}.totalSqm`, lineSqm);
    setFieldValue(`tileItems.${tIdx}.isTileItem`, true);

    const effectiveWarehouse = (currentTileItem && currentTileItem.warehouse) ? currentTileItem.warehouse : (chosenWarehouse || '');
    if (effectiveWarehouse) {
      setFieldValue(`tileItems.${tIdx}.warehouse`, effectiveWarehouse);
    }
    const availStock = await fetchStockForWarehouse(selectedProduct.product_name, effectiveWarehouse || '', selectedProduct.item_sr_no);
    setFieldValue(`tileItems.${tIdx}.availableQty`, availStock);
  };

  const handleTileItemChange = (
    tIdx: number,
    field: 'boxQty' | 'loosePcs' | 'pricePerBox' | 'pricePerSqm' | 'pricePerPiece' | 'totalSqm',
    val: any,
    tileItems: any[],
    setFieldValue: any
  ) => {
    const item = { ...tileItems[tIdx] };
    const pcsPerBox = Math.max(1, Number(item.piecesPerBox) || 4);
    const sqmPerBox = Math.max(0.01, Number(item.sqmPerBox) || 1.44);

    let bQty = Number(item.boxQty || 0);
    let lPcs = Number(item.loosePcs || 0);
    let pBox = Number(item.pricePerBox || 0);
    let pSqm = Number(item.pricePerSqm || 0);
    let pPiece = Number(item.pricePerPiece || 0);
    let lineSqm = Number(item.totalSqm || 0);

    if (field === 'boxQty') {
      bQty = Math.max(0, Number(val) || 0);
      lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    } else if (field === 'loosePcs') {
      let rawLoose = Math.max(0, Number(val) || 0);
      if (pcsPerBox > 1 && rawLoose >= pcsPerBox) {
        const extraBoxes = Math.floor(rawLoose / pcsPerBox);
        const remLoose = rawLoose % pcsPerBox;
        bQty = bQty + extraBoxes;
        lPcs = remLoose;
      } else {
        lPcs = rawLoose;
      }
      lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    } else if (field === 'totalSqm') {
      const enteredSqm = Math.max(0, Number(val) || 0);
      lineSqm = enteredSqm;
      if (sqmPerBox > 0) {
        const totalBoxesFloat = enteredSqm / sqmPerBox;
        bQty = Math.floor(totalBoxesFloat);
        const remFraction = totalBoxesFloat - bQty;
        lPcs = Math.round(remFraction * pcsPerBox);
        if (pcsPerBox > 1 && lPcs >= pcsPerBox) {
          bQty += Math.floor(lPcs / pcsPerBox);
          lPcs = lPcs % pcsPerBox;
        }
      }
    } else if (field === 'pricePerBox') {
      pBox = Math.max(0, Number(val) || 0);
      pPiece = Number((pBox / pcsPerBox).toFixed(2));
      pSqm = Number((pBox / sqmPerBox).toFixed(2));
      lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    } else if (field === 'pricePerSqm') {
      pSqm = Math.max(0, Number(val) || 0);
      pBox = Number((pSqm * sqmPerBox).toFixed(2));
      pPiece = Number((pBox / pcsPerBox).toFixed(2));
      lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    } else if (field === 'pricePerPiece') {
      pPiece = Math.max(0, Number(val) || 0);
      lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    }

    const lineTotal = Number(((bQty * pBox) + (lPcs * pPiece)).toFixed(2));

    setFieldValue(`tileItems.${tIdx}.boxQty`, bQty);
    setFieldValue(`tileItems.${tIdx}.loosePcs`, lPcs);
    setFieldValue(`tileItems.${tIdx}.pricePerBox`, pBox);
    setFieldValue(`tileItems.${tIdx}.pricePerSqm`, pSqm);
    setFieldValue(`tileItems.${tIdx}.pricePerPiece`, pPiece);
    setFieldValue(`tileItems.${tIdx}.totalAmount`, lineTotal);
    setFieldValue(`tileItems.${tIdx}.totalSqm`, lineSqm);
  };

  const handleTileReturnProductSelection = async (
    selectedProduct: any,
    tIdx: number,
    chosenWarehouse: string,
    setFieldValue: any,
    currentTileItem?: any
  ) => {
    if (!selectedProduct) {
      setFieldValue(`tileReturnItems.${tIdx}.itemName`, '');
      setFieldValue(`tileReturnItems.${tIdx}.skuCode`, '');
      setFieldValue(`tileReturnItems.${tIdx}.availableQty`, 0);
      setFieldValue(`tileReturnItems.${tIdx}.pricePerBox`, 0);
      setFieldValue(`tileReturnItems.${tIdx}.pricePerSqm`, 0);
      setFieldValue(`tileReturnItems.${tIdx}.pricePerPiece`, 0);
      setFieldValue(`tileReturnItems.${tIdx}.totalAmount`, 0);
      setFieldValue(`tileReturnItems.${tIdx}.totalSqm`, 0);
      return;
    }

    let pcsPerBox = Number(selectedProduct.pieces_per_box || selectedProduct.pcs_per_box || selectedProduct.pieces_per_packing || 0);
    if (pcsPerBox <= 1) {
      const match = String(selectedProduct.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
      if (match && Number(match[1]) > 0) pcsPerBox = Number(match[1]);
      else pcsPerBox = 4;
    }

    let sqmPerBox = 1.44;
    const matchSqm = String(selectedProduct.product_description || '').match(/([\d\.]+)\s*sq\.m/i);
    if (matchSqm && Number(matchSqm[1]) > 0) {
      sqmPerBox = Number(matchSqm[1]);
    } else {
      const dimMatch = String(`${selectedProduct.sub_category || ''} ${selectedProduct.product_description || ''} ${selectedProduct.item_sr_no || ''}`).match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
      if (dimMatch) {
        const h = Number(dimMatch[1]) || 60;
        const w = Number(dimMatch[2]) || 60;
        sqmPerBox = Number((((h / 100) * (w / 100)) * pcsPerBox).toFixed(2));
      }
    }

    const pBox = Number(selectedProduct.retail_price || 0);
    const configuredLoosePrice = Number(selectedProduct.loose_sale_price || 0);
    const pPiece = configuredLoosePrice > 0 ? configuredLoosePrice : Number((pBox / pcsPerBox).toFixed(2));
    const pSqm = Number((pBox / (sqmPerBox || 1)).toFixed(2));

    const boxQty = currentTileItem?.boxQty !== undefined ? Number(currentTileItem.boxQty) : 1;
    const loosePcs = currentTileItem?.loosePcs !== undefined ? Number(currentTileItem.loosePcs) : 0;
    const lineTotal = Number(((boxQty * pBox) + (loosePcs * pPiece)).toFixed(2));
    const lineSqm = Number(((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));

    setFieldValue(`tileReturnItems.${tIdx}.itemName`, selectedProduct.product_name);
    setFieldValue(`tileReturnItems.${tIdx}.skuCode`, selectedProduct.item_sr_no || `SKU-${selectedProduct.id}`);
    setFieldValue(`tileReturnItems.${tIdx}.piecesPerBox`, pcsPerBox);
    setFieldValue(`tileReturnItems.${tIdx}.sqmPerBox`, sqmPerBox);
    setFieldValue(`tileReturnItems.${tIdx}.pricePerBox`, pBox);
    setFieldValue(`tileReturnItems.${tIdx}.pricePerPiece`, pPiece);
    setFieldValue(`tileReturnItems.${tIdx}.pricePerSqm`, pSqm);
    setFieldValue(`tileReturnItems.${tIdx}.boxQty`, boxQty);
    setFieldValue(`tileReturnItems.${tIdx}.loosePcs`, loosePcs);
    setFieldValue(`tileReturnItems.${tIdx}.totalAmount`, lineTotal);
    setFieldValue(`tileReturnItems.${tIdx}.totalSqm`, lineSqm);
    setFieldValue(`tileReturnItems.${tIdx}.isTileItem`, true);

    const effectiveWarehouse = (currentTileItem && currentTileItem.warehouse) ? currentTileItem.warehouse : chosenWarehouse;
    if (effectiveWarehouse) {
      const availStock = await fetchStockForWarehouse(selectedProduct.product_name, effectiveWarehouse);
      setFieldValue(`tileReturnItems.${tIdx}.availableQty`, availStock);
    }
  };

  const handleTileReturnItemChange = (
    tIdx: number,
    field: 'boxQty' | 'loosePcs' | 'pricePerBox' | 'pricePerSqm' | 'pricePerPiece' | 'totalSqm',
    val: any,
    tileReturnItems: any[],
    setFieldValue: any
  ) => {
    const item = { ...tileReturnItems[tIdx] };
    const pcsPerBox = Math.max(1, Number(item.piecesPerBox) || 4);
    const sqmPerBox = Math.max(0.01, Number(item.sqmPerBox) || 1.44);

    let bQty = Number(item.boxQty || 0);
    let lPcs = Number(item.loosePcs || 0);
    let pBox = Number(item.pricePerBox || 0);
    let pSqm = Number(item.pricePerSqm || 0);
    let pPiece = Number(item.pricePerPiece || 0);
    let lineSqm = Number(item.totalSqm || 0);

    if (field === 'boxQty') {
      bQty = Math.max(0, Number(val) || 0);
      lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    } else if (field === 'loosePcs') {
      let rawLoose = Math.max(0, Number(val) || 0);
      if (pcsPerBox > 1 && rawLoose >= pcsPerBox) {
        const extraBoxes = Math.floor(rawLoose / pcsPerBox);
        const remLoose = rawLoose % pcsPerBox;
        bQty = bQty + extraBoxes;
        lPcs = remLoose;
      } else {
        lPcs = rawLoose;
      }
      lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    } else if (field === 'totalSqm') {
      const enteredSqm = Math.max(0, Number(val) || 0);
      lineSqm = enteredSqm;
      if (sqmPerBox > 0) {
        const totalBoxesFloat = enteredSqm / sqmPerBox;
        bQty = Math.floor(totalBoxesFloat);
        const remFraction = totalBoxesFloat - bQty;
        lPcs = Math.round(remFraction * pcsPerBox);
        if (pcsPerBox > 1 && lPcs >= pcsPerBox) {
          bQty += Math.floor(lPcs / pcsPerBox);
          lPcs = lPcs % pcsPerBox;
        }
      }
    } else if (field === 'pricePerBox') {
      pBox = Math.max(0, Number(val) || 0);
      pPiece = Number((pBox / pcsPerBox).toFixed(2));
      pSqm = Number((pBox / sqmPerBox).toFixed(2));
      lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    } else if (field === 'pricePerSqm') {
      pSqm = Math.max(0, Number(val) || 0);
      pBox = Number((pSqm * sqmPerBox).toFixed(2));
      pPiece = Number((pBox / pcsPerBox).toFixed(2));
      lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    } else if (field === 'pricePerPiece') {
      pPiece = Math.max(0, Number(val) || 0);
      lineSqm = Number(((bQty * sqmPerBox) + ((lPcs / pcsPerBox) * sqmPerBox)).toFixed(2));
    }

    const lineTotal = Number(((bQty * pBox) + (lPcs * pPiece)).toFixed(2));

    setFieldValue(`tileReturnItems.${tIdx}.boxQty`, bQty);
    setFieldValue(`tileReturnItems.${tIdx}.loosePcs`, lPcs);
    setFieldValue(`tileReturnItems.${tIdx}.pricePerBox`, pBox);
    setFieldValue(`tileReturnItems.${tIdx}.pricePerSqm`, pSqm);
    setFieldValue(`tileReturnItems.${tIdx}.pricePerPiece`, pPiece);
    setFieldValue(`tileReturnItems.${tIdx}.totalAmount`, lineTotal);
    setFieldValue(`tileReturnItems.${tIdx}.totalSqm`, lineSqm);
  };

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', 'e', 'E', '+'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const calculateLineTotals = (item: any, scenario: string, applyFbrTax: boolean = false) => {
    const qty = Math.max(0, Number(item.qty) || 0);
    const rp = Math.max(0, Number(item.rp) || 0);
    const pMatch = (productsList || []).find((p: any) => p.product_name === item.itemName || p.item_sr_no === item.itemCode || (item.skuCode && (p.item_sr_no === item.skuCode || `SKU-${p.id}` === item.skuCode)));
    const isTile = pMatch ? isTileProduct(pMatch) : false;
    const allowLoose = Boolean(pMatch?.allow_loose_sales || isTile);
    const rawPcs = Number(pMatch?.pieces_per_box ?? pMatch?.pcs_per_box ?? pMatch?.pieces_per_packing ?? 0);
    const pcsPerBox = Number(pMatch?.loose_conversion_ratio) > 0 ? Number(pMatch.loose_conversion_ratio) : (rawPcs > 0 ? rawPcs : (isTile ? 4 : 1));

    let grossBase = rp * qty;
    if (allowLoose && pcsPerBox > 1) {
      const bulkCount = Math.floor(qty);
      const looseCount = Math.round((qty - bulkCount) * pcsPerBox);
      const piecePrice = item.piecePrice !== undefined && item.piecePrice !== ''
        ? Number(item.piecePrice)
        : (Number(pMatch?.loose_sale_price) > 0 ? Number(pMatch.loose_sale_price) : (pcsPerBox > 0 ? rp / pcsPerBox : 0));
      grossBase = Number(((bulkCount * rp) + (looseCount * piecePrice)).toFixed(2));
    }
    const discountAmt = Math.max(0, Number(item.discountAmt) || 0);
    const remainingRetail = grossBase - discountAmt;

    if (!applyFbrTax) {
      return {
        grossBase,
        activeGstRate: 0,
        activeFTaxPer: 0,
        gstAmt: 0,
        fTaxAmt: 0,
        discountAmt,
        remainingRetail,
        netTotal: remainingRetail
      };
    }

    let activeGstRate = Number(item.gstRate || 18);
    let activeFTaxPer = Number(item.fTaxPer || 0);

    if (scenario === 'Reduced Rate Sale') {
      activeGstRate = item.gstRate !== undefined && item.gstRate !== null && item.gstRate !== '' ? Number(item.gstRate) : 0;
      activeFTaxPer = item.fTaxPer !== undefined && item.fTaxPer !== null && item.fTaxPer !== '' ? Number(item.fTaxPer) : 0;
    } else {
      switch (scenario) {
        case 'Goods at Standard Rate to Unregistered Buyers':
          activeGstRate = 18;
          activeFTaxPer = 4;
          break;
        case 'Exempt Goods Sale':
        case 'Zero Rated Sale':
          activeGstRate = 0;
          activeFTaxPer = 0;
          break;
        case 'Goods Sold that are Listed in SRO 297(1)/2023':
          activeGstRate = 25;
          activeFTaxPer = 0;
          break;
        case 'Sale of 3rd Schedule Goods':
          activeGstRate = 18;
          activeFTaxPer = 0;
          break;
        case 'Goods at Standard Rate to Registered Buyers':
        default:
          activeGstRate = 18;
          activeFTaxPer = 0;
          break;
      }
    }

    const isRetailBasedTax =
      scenario === 'Sale of 3rd Schedule Goods' ||
      scenario === 'Goods Sold that are Listed in SRO 297(1)/2023';

    const gstTaxBase = isRetailBasedTax ? grossBase : Math.max(0, grossBase - discountAmt);

    const gstAmt = (gstTaxBase / 100) * activeGstRate;
    const fTaxAmt = (gstTaxBase / 100) * activeFTaxPer;

    const netTotal = remainingRetail + gstAmt + fTaxAmt;

    return { grossBase, activeGstRate, activeFTaxPer, gstAmt, fTaxAmt, discountAmt, remainingRetail, netTotal };
  };

  const executeInvoicePersistence = async (values: any, customerFinalName: string, bypassNegativeCheck: boolean = false) => {
    try {
      setLoading(true);
      
      // STRICT VALIDATION: Block if quantity exceeds available stock across all rows
      const consumedInInvoice: Record<string, number> = {};
      for (let i = 0; i < values.items.length; i++) {
        const item = values.items[i];
        if (!item.itemName) continue;
        const wh = String(item.warehouse || values.dispatchWarehouse || 'Main Warehouse').trim().toLowerCase();
        const itemKey = `${String(item.skuCode || item.itemName).trim().toLowerCase()}_${wh}`;

        let maxAllowed = Number(item.availableQty || 0);
        if (editData && editData.items) {
           const oldItems = typeof editData.items === 'string' ? JSON.parse(editData.items || '[]') : (editData.items || []);
           const original = oldItems.find((oi: any) => oi.skuCode === item.skuCode && (oi.warehouse || editData.dispatch_warehouse || 'Main Warehouse') === (item.warehouse || values.dispatchWarehouse || 'Main Warehouse'));
           if (original) {
              maxAllowed += Number(original.qty || 0);
           }
        }

        const priorUsed = consumedInInvoice[itemKey] || 0;
        const availableForRow = Math.max(0, maxAllowed - priorUsed);

        if (!bypassNegativeCheck && Number(item.qty) > availableForRow) {
          toast.error(`Insufficient stock for ${item.itemName} (Row #${i + 1}). Max Available: ${availableForRow.toLocaleString()}, Requested: ${Number(item.qty).toLocaleString()}`);
          setLoading(false);
          return;
        }

        consumedInInvoice[itemKey] = priorUsed + Number(item.qty || 0);
      }

      // 2. Validate Tile Items Stock
      const validTileItems = values.showTileSection
        ? (values.tileItems || []).filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0))
        : [];

      for (let i = 0; i < validTileItems.length; i++) {
        const tItem = validTileItems[i];
        const wh = String(tItem.warehouse || values.dispatchWarehouse || 'Main Warehouse').trim().toLowerCase();
        const itemKey = `${String(tItem.skuCode || tItem.itemName).trim().toLowerCase()}_${wh}`;
        const pcsPerBox = Math.max(1, Number(tItem.piecesPerBox) || 4);
        const reqPcs = (Number(tItem.boxQty || 0) * pcsPerBox) + Number(tItem.loosePcs || 0);

        let maxAllowedPcs = Math.round(Number(tItem.availableQty || 0) * pcsPerBox);
        if (editData && editData.items) {
          const oldItems = typeof editData.items === 'string' ? JSON.parse(editData.items || '[]') : (editData.items || []);
          const original = oldItems.find((oi: any) => oi.skuCode === tItem.skuCode && (oi.warehouse || editData.dispatch_warehouse || 'Main Warehouse') === (tItem.warehouse || values.dispatchWarehouse || 'Main Warehouse'));
          if (original) {
            const origPcs = original.isTileItem
              ? ((Number(original.boxQty || 0) * pcsPerBox) + Number(original.loosePcs || 0))
              : Math.round(Number(original.qty || 0) * pcsPerBox);
            maxAllowedPcs += origPcs;
          }
        }

        const priorUsed = consumedInInvoice[itemKey] || 0;
        const availableForRowPcs = Math.max(0, maxAllowedPcs - priorUsed);

        if (!bypassNegativeCheck && reqPcs > availableForRowPcs) {
          const avBoxes = Math.floor(availableForRowPcs / pcsPerBox);
          const avLoose = availableForRowPcs % pcsPerBox;
          toast.error(`Insufficient tile stock for ${tItem.itemName} (Tile Row #${i + 1}). Max Available: ${avBoxes} Boxes${avLoose > 0 ? ` + ${avLoose} Pcs` : ''} (${availableForRowPcs} Pcs total).`);
          setLoading(false);
          return;
        }

        consumedInInvoice[itemKey] = priorUsed + reqPcs;
      }

      const validReturnItems = (values.returnItems || []).filter(
        (r: any) => r.itemName && Number(r.qty || 0) > 0
      );

      const returnTotalVal = validReturnItems.reduce((acc: number, rItem: any) => {
        return acc + (Number(rItem.qty || 0) * Number(rItem.rp ?? rItem.rate ?? 0));
      }, 0);

      const validTileReturnItems = values.showTileReturnSection
        ? (values.tileReturnItems || []).filter((t: any) => t.itemName && (Number(t.boxQty || 0) > 0 || Number(t.loosePcs || 0) > 0 || Number(t.totalAmount || 0) > 0))
        : [];

      const tileReturnTotalVal = validTileReturnItems.reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0);
      const totalAllReturnsCredit = returnTotalVal + tileReturnTotalVal;

      const tileTotalVal = validTileItems.reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0);

      const convertedTileItems = validTileItems.map((t: any) => {
        const pcsPerBox = Math.max(1, Number(t.piecesPerBox) || 4);
        const bQty = Number(t.boxQty || 0);
        const lPcs = Number(t.loosePcs || 0);
        const totalPcs = (bQty * pcsPerBox) + lPcs;
        const qtyBoxDec = Number((totalPcs / pcsPerBox).toFixed(3));
        return {
          skuCode: t.skuCode,
          itemName: t.itemName,
          warehouse: t.warehouse || values.dispatchWarehouse || 'Main Warehouse',
          qty: qtyBoxDec,
          rp: Number(t.pricePerBox || 0),
          discountPer: 0,
          discountAmt: 0,
          gstRate: 0,
          fTaxPer: 0,
          amount: Number(t.totalAmount || 0),
          netTotal: Number(t.totalAmount || 0),
          uom: 'BOX',
          isTileItem: true,
          boxQty: bQty,
          loosePcs: lPcs,
          piecesPerBox: pcsPerBox,
          sqmPerBox: Number(t.sqmPerBox || 1.44),
          totalSqm: Number(t.totalSqm || 0),
          pricePerBox: Number(t.pricePerBox || 0),
          pricePerSqm: Number(t.pricePerSqm || 0),
          pricePerPiece: Number(t.pricePerPiece || 0)
        };
      });

      const validStandardItems = (values.items || []).filter((it: any) => it.itemName && it.itemName.trim() !== '');
      const allMergedItems = [...validStandardItems, ...convertedTileItems];

      const soldItemsSum = validStandardItems.reduce((acc: number, item: any) => {
        return acc + calculateLineTotals(item, values.taxScenario, values.applyFbrTax).netTotal;
      }, 0) + tileTotalVal;

      const grossAfterCharges = soldItemsSum + Number(values.transportCharges || 0) + Number(values.additionalCharges || 0) - Number(values.overallDiscount || 0);
      const calculatedGrandTotal = grossAfterCharges - totalAllReturnsCredit;

      let paidCash = 0;
      let paidBank = 0;

      if (values.settlementMode === 'Cash') {
        paidCash = Number(values.cashAmountPaid || 0);
        paidBank = 0;
      } else if (values.settlementMode === 'Bank') {
        paidCash = 0;
        paidBank = Number(values.bankAmountPaid || values.cashAmountPaid || 0);
      } else if (values.settlementMode === 'Split') {
        paidCash = Number(values.cashAmountPaid || 0);
        paidBank = Number(values.bankAmountPaid || 0);
      }

      const totalPaidCombined = paidCash + paidBank;
      if (calculatedGrandTotal >= 0 && totalPaidCombined > calculatedGrandTotal + 0.01) {
        toast.error(`Payment amount (Rs. ${totalPaidCombined.toLocaleString(undefined, { minimumFractionDigits: 2 })}) cannot exceed total bill amount (Rs. ${calculatedGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })})!`);
        setLoading(false);
        return;
      }

      // ── STRICT NEGATIVE STOCK ENFORCEMENT (WHEN ALLOW_NEGATIVE_STOCK IS DISABLED) ──
      const activeWorkflowSettings = workflowSettings || await fetchWorkflowSettings();
      if (activeWorkflowSettings && activeWorkflowSettings.allow_negative_stock === false) {
        const stockDataset = await fetchStockDataset();
        const requestedPerProd: Record<string, { qty: number; name: string; code: string; wh: string }> = {};

        allMergedItems.forEach((it: any) => {
          const pName = (it.itemName || it.product_name || '').trim();
          if (!pName) return;
          const key = pName.toLowerCase();
          const q = Number(it.qty || it.quantity || 0);
          if (!requestedPerProd[key]) {
            requestedPerProd[key] = {
              qty: 0,
              name: pName,
              code: it.itemCode || it.code || it.skuCode || '',
              wh: (it.warehouse || values.dispatchWarehouse || '').trim()
            };
          }
          requestedPerProd[key].qty += q;
        });

        // In edit mode, add back previously billed quantity from this invoice so we only check net increases
        if (editData) {
          const oldItems = Array.isArray(editData.items) ? editData.items : JSON.parse(editData.items || '[]');
          oldItems.forEach((oi: any) => {
            const pName = (oi.itemName || oi.product_name || '').trim().toLowerCase();
            if (requestedPerProd[pName]) {
              const oldQty = Number(oi.qty || oi.quantity || 0);
              requestedPerProd[pName].qty -= oldQty;
            }
          });
        }

        // Check if any product has net requested quantity exceeding available stock
        for (const key of Object.keys(requestedPerProd)) {
          const req = requestedPerProd[key];
          if (req.qty > 0.0001) {
            let avail = 0;
            if (req.wh) {
              avail = await getAvailableStock(req.name, req.wh, stockDataset, req.code);
            } else {
              avail = await getTotalAvailableStock(req.name, stockDataset, req.code);
            }

            if (req.qty > avail + 0.0001) {
              const matchedProd = (productsList || []).find((p: any) =>
                (p.product_name && p.product_name.trim().toLowerCase() === req.name.toLowerCase()) ||
                (p.item_sr_no && p.item_sr_no === req.code)
              );
              const fmtAvail = formatStockWithBoxesAndPcs(avail, matchedProd).inlineText;
              const fmtReq = formatStockWithBoxesAndPcs(req.qty, matchedProd).inlineText;

              toast.error(
                `Cannot Save Sale: "${req.name}" exceeds available stock (${fmtAvail} available, but ${fmtReq} requested). Negative stock is disabled in settings.`,
                { duration: 7000 }
              );
              setLoading(false);
              return;
            }
          }
        }
      }

      // Validate gate pass for required warehouses (only when setting is ON and extra quantity or new warehouse added)
      const isManualGpSettingOn = Boolean(workflowSettings?.require_manual_gatepass_sale);
      const reqManualGpLocs = workflowSettings?.manual_gatepass_locations_sale || [];
      const isStrictChallanSale = workflowSettings?.allow_duplicate_challan_sale === false;

      if ((isManualGpSettingOn && reqManualGpLocs.length > 0) || isStrictChallanSale) {
        const uniqueSaleWhs = new Set<string>();
        allMergedItems.forEach((it: any) => {
          const w = (it.warehouse || values.dispatchWarehouse || '').trim();
          if (w) uniqueSaleWhs.add(w);
        });
        for (const wh of uniqueSaleWhs) {
          if (isManualGpSettingOn && reqManualGpLocs.includes(wh)) {
            const whStatus = getWarehouseDispatchStatus(wh, values.items, values.tileItems, editData, values.dispatchWarehouse, productsList);
            if (!editData || whStatus.isNewOrIncreased) {
              const enteredSlip = values.gatePasses?.[wh]?.trim();
              if (!enteredSlip) {
                toast.error(`Please enter Dispatch Gate Pass / Bilty Number for ${wh}!`);
                setLoading(false);
                return;
              }
            }
          }

          // Strict Unique Delivery Challan / Gate Pass Governance
          if (isStrictChallanSale) {
            const enteredSlip = values.gatePasses?.[wh]?.trim();
            if (enteredSlip) {
              const safePrefix = wh.toUpperCase().replace(/[^A-Z0-9]/g, '');
              const checkNo = enteredSlip.toUpperCase().startsWith(`${safePrefix}-`) ? enteredSlip.toUpperCase() : `${safePrefix}-${enteredSlip}`;
              const { isTaken, existingRecord } = await isChallanNumberTaken('sale', checkNo, editData?.id, editData?.invoice_no || values.invoiceNo);
              if (isTaken) {
                toast.error(`Delivery Challan / Gate Pass # "${enteredSlip}" already exists in ${existingRecord?.challan_no || 'Sales Records'}! Duplicate challan numbers are strictly blocked in settings.`);
                setLoading(false);
                return;
              }
            }
          }
        }
      }
      const runningBalanceTerm = calculatedGrandTotal <= 0 
        ? 'Credit' 
        : (totalPaidCombined >= calculatedGrandTotal ? 'Cash' : 'Credit');

      const itemsToSave = (allMergedItems.length > 0 ? allMergedItems : values.items).map((it: any, idx: number) => {
        const cleanItem = {
          ...it,
          gstRate: values.applyFbrTax ? Number(it.gstRate || 0) : 0,
          fTaxPer: values.applyFbrTax ? Number(it.fTaxPer || 0) : 0
        };
        if (idx === 0) {
          return { 
            ...cleanItem, 
            _overallDiscount: Number(values.overallDiscount || 0),
            _returnItems: validReturnItems,
            _returnAmount: returnTotalVal,
            _tileItems: validTileItems,
            _tileAmount: tileTotalVal,
            _tileReturnItems: validTileReturnItems,
            _tileReturnAmount: tileReturnTotalVal,
            _totalReturnCredit: totalAllReturnsCredit,
            _excessCreditAction: values.excessCreditAction || 'credit',
            _excessRefundAmount: values.excessCreditAction === 'refund' ? Number(values.excessRefundAmount || 0) : 0,
            _excessRefundMethod: values.excessRefundMethod || 'Cash',
            _excessRefundBank: values.excessRefundBank || ''
          };
        }
        return cleanItem;
      });

      const finalDispatchWh = values.dispatchWarehouse || itemsToSave[0]?.warehouse || (warehousesList.length > 0 ? warehousesList[0] : 'Main Warehouse');

      const databasePayload = {
        invoice_no: values.invoiceNo,
        customer_name: customerFinalName,
        sale_date: values.saleDate,
        payment_term: runningBalanceTerm,
        dispatch_warehouse: finalDispatchWh,
        salesman: values.salesman || (isSalesman ? (matchedSalesman || currentSalesmanName) : ''),
        transport_name: values.transportType,
        transport_charges: Number(values.transportCharges || 0),
        additional_charges: Number(values.additionalCharges || 0),
        selected_bank: (values.settlementMode === 'Bank' || values.settlementMode === 'Split') ? values.selectedBankTitle : null,
        bank_amount: String(paidBank),
        cash_amount_paid: paidCash,
        total_amount: String(grossAfterCharges),
        receipt_status: (calculatedGrandTotal <= 0 && totalAllReturnsCredit > 0) ? 'Credit Adjusted' : (totalPaidCombined >= calculatedGrandTotal ? 'Paid' : 'On Credit'),
        sale_status: 'Confirm',
        shipping_address: values.shippingAddress,
        gate_pass_no: values.gatePasses && Object.keys(values.gatePasses).length > 0 ? Object.entries(values.gatePasses).map(([k, v]) => `${k}: ${v}`).join(' | ') : null,
        items: itemsToSave.map((it: any) => ({
          ...it,
          warehouse: it.warehouse || finalDispatchWh
        })),
        scenario_type: values.applyFbrTax ? values.taxScenario : 'Standard Retail Sale (No Tax)'
      };

      let finalInvoiceId = editData?.id;

      if (editData && editData.id) {
        const formattedInvCode = editData.invoice_no || values.invoiceNo;
        
        // 1. Fetch DCs associated with this invoice
        const { data: dcs, error: dcErr } = await supabase
          .from('delivery_challans')
          .select('*')
          .eq('invoice_no', formattedInvCode);
        
        if (dcErr) throw dcErr;

        const isPendingStatus = (st: string) => /pending/i.test(st || '');
        const isAutoDc = (dc: any) => Boolean(dc.remarks && dc.remarks.includes('[AUTOMATIC]'));
        const activeDCs = (dcs || []).filter(dc => !isPendingStatus(dc.status) && !isAutoDc(dc));
        const pendingDCs = (dcs || []).filter(dc => isPendingStatus(dc.status) || isAutoDc(dc));

        // Track covered quantities by sku_warehouse from already approved DCs
        const coveredQtys: Record<string, number> = {};
        activeDCs.forEach(dc => {
          (dc.items || []).forEach((i: any) => {
            const key = `${i.skuCode}_${i.location}`;
            coveredQtys[key] = (coveredQtys[key] || 0) + Number(i.orderQty || 0);
          });
        });

        // Helper for error formatting
        const formatErrorQty = (qty: number, skuCode: string, itemName?: string) => {
          const matchedProd = productsList.find(p => p.product_name === itemName || (skuCode && (p.item_sr_no === skuCode || `SKU-${p.id}` === skuCode)));
          let displayQty = String(qty);
          if (matchedProd) {
            const isTile = Boolean(String(matchedProd.category || '').toLowerCase().includes('tile'));
            let pcsPerBox = Number(matchedProd.pieces_per_box || matchedProd.pcs_per_box || matchedProd.pieces_per_packing || 1);
            if (isTile && pcsPerBox <= 1) pcsPerBox = 4;
            if (pcsPerBox > 1) {
              const totalPcs = Math.round(qty * pcsPerBox);
              const b = Math.floor(totalPcs / pcsPerBox);
              const p = totalPcs % pcsPerBox;
              displayQty = p === 0 ? `${b} Boxes` : `${b} Boxes + ${p} Pcs`;
            }
          }
          return displayQty;
        };

        // 2. Validate against approved DCs
        for (const item of allMergedItems) {
          const wh = (item.warehouse || values.dispatchWarehouse || 'Main Warehouse').trim();
          const key = `${item.skuCode}_${wh}`;
          const covered = coveredQtys[key] || 0;
          if (Number(item.qty) < covered) {
             const fmt = formatErrorQty(covered, item.skuCode, item.itemName);
             throw new Error(`Cannot decrease quantity for ${item.itemName} below the actively processed DC amount (${fmt}).`);
          }
        }
        
        for (const key of Object.keys(coveredQtys)) {
          const covered = coveredQtys[key];
          if (covered > 0) {
            const found = allMergedItems.find((i:any) => `${i.skuCode}_${(i.warehouse || values.dispatchWarehouse || 'Main Warehouse').trim()}` === key);
            if (!found) {
               const sku = key.split('_')[0];
               const fmt = formatErrorQty(covered, sku);
               throw new Error(`Cannot remove item with SKU ${sku} because it already has actively processed DCs (${fmt}).`);
            }
          }
        }

        // 3. Update Invoice
        const { error: invoiceUpdateError } = await supabase
          .from('sales_invoices')
          .update(databasePayload)
          .eq('id', editData.id);

        if (invoiceUpdateError) throw invoiceUpdateError;

        logActivity({
          action: 'UPDATE',
          tableName: 'sales_invoices',
          details: {
            id: editData.id,
            invoice_number: editData.invoice_no || values.invoiceNo,
            customer_name: customerFinalName,
            total_amount: calculatedGrandTotal,
            item_count: allMergedItems.length,
            payment_term: runningBalanceTerm,
            warehouse: values.dispatchWarehouse,
            event: `Updated sales invoice ${editData.invoice_no || values.invoiceNo} for ${customerFinalName}`
          }
        });

        // 4. Update products.current_stock (Restore old, Deduct new)
        const oldItems = typeof editData.items === 'string' ? JSON.parse(editData.items || '[]') : (editData.items || []);
        for (const oldItem of oldItems) {
          if (!oldItem.itemName || !oldItem.itemName.trim()) continue;
          const { data: prod } = await supabase.from('products').select('id, current_stock').ilike('product_name', oldItem.itemName).maybeSingle();
          if (prod) await supabase.from('products').update({ current_stock: Number(prod.current_stock) + Number(oldItem.qty || 0) }).eq('id', prod.id);
        }
        for (const newItem of allMergedItems) {
          if (!newItem.itemName || !newItem.itemName.trim()) continue;
          const { data: prod } = await supabase.from('products').select('id, current_stock').ilike('product_name', newItem.itemName).maybeSingle();
          if (prod) await supabase.from('products').update({ current_stock: Number(prod.current_stock) - Number(newItem.qty || 0) }).eq('id', prod.id);
        }

        // 5. Sync DCs (Recalculate remaining uncovered quantities, delete old pending, create new only if needed)
        const remainingItemsByWarehouse: Record<string, any[]> = {};
        for (const item of allMergedItems) {
          if (!item.itemName || !item.itemName.trim()) continue;
          if (Number(item.qty || 0) <= 0) continue;
          const wh = (item.warehouse || values.dispatchWarehouse || 'Main Warehouse').trim();
          const key = `${item.skuCode}_${wh}`;
          const covered = coveredQtys[key] || 0;
          const remaining = Number(item.qty) - covered;

          if (remaining > 0) {
            if (!remainingItemsByWarehouse[wh]) remainingItemsByWarehouse[wh] = [];
            
            // Prorate discount if any
            const origQty = Number(item.qty) || 1;
            const proratedDisAmt = (Number(item.discountAmt) || 0) * (remaining / origQty);

            remainingItemsByWarehouse[wh].push({
              poNoSub: values.clientPoNumber || '',
              pDescription: item.itemName || 'Product',
              skuCode: item.skuCode || '',
              location: wh,
              rate: Number(item.rp) || 0,
              qty: remaining,
              disAmt: Number(proratedDisAmt.toFixed(2)),
              distPer: Number(item.discountPer) || 0,
              discount: 0,
              notes: item.notes || '',
              isTileItem: Boolean(item.isTileItem),
              boxQty: item.boxQty,
              loosePcs: item.loosePcs
            });
          }
        }

        // Delete old pending DCs so they are replaced cleanly with the adjusted lines (or removed entirely if items deleted)
        if (pendingDCs.length > 0) {
          const pendingIds = pendingDCs.map(d => d.id);
          const { error: delErr } = await supabase.from('delivery_challans').delete().in('id', pendingIds);
          if (delErr) console.error('Error deleting pending DCs:', delErr);
        }

        // If require_delivery_challan is ON, sync/recreate delivery challans for remaining un-dispatched items
        const workflowSettings = await fetchWorkflowSettings();

        // Check current active DCs to compute appropriate challan code
        const { data: currentActiveDcs } = await supabase
          .from('delivery_challans')
          .select('id, challan_no, dispatch_warehouse')
          .eq('invoice_no', formattedInvCode)
          .order('id', { ascending: true });

        for (const [whName, whItems] of Object.entries(remainingItemsByWarehouse)) {
          if (whItems.length === 0) continue;
          const whQty = whItems.reduce((acc, i) => acc + Number(i.qty || 0), 0);
          if (whQty <= 0) continue;

          const isWhRequireDelivery = Boolean(
            workflowSettings?.require_delivery_challan &&
            (workflowSettings?.delivery_challan_locations || []).includes(whName)
          );

          const whBaseAmt = whItems.reduce((acc, i) => acc + (Number(i.rate || 0) * Number(i.qty || 0)), 0);
          const whDiscAmt = whItems.reduce((acc, i) => acc + Number(i.disAmt || 0), 0);
          const whNetAmt = whBaseAmt - whDiscAmt;

          const safePrefix = whName.toUpperCase().replace(/[^A-Z0-9]/g, '');
          let nextChallanNo = undefined;
          const activeWhDcs = (currentActiveDcs || []).filter(dc => dc.dispatch_warehouse === whName);
          if (activeWhDcs.length > 0) {
            const baseDc = activeWhDcs[0];
            const baseCode = (baseDc.challan_no || `DC-${String(baseDc.id).padStart(4, '0')}`).replace(/-[A-Z]+$/, '');
            const existingSubCount = (currentActiveDcs || []).filter(c => (c.challan_no || `DC-${String(c.id).padStart(4, '0')}`).startsWith(baseCode)).length;
            let nextLetter = '';
            if (existingSubCount < 26) {
              nextLetter = String.fromCharCode(65 + existingSubCount);
            } else {
              nextLetter = String.fromCharCode(65 + (existingSubCount % 26)).repeat(Math.floor(existingSubCount / 26) + 1);
            }
            nextChallanNo = `${baseCode}-${nextLetter}`;
          }

          if (!nextChallanNo) {
            const prevPending = pendingDCs.find(d => d.dispatch_warehouse === whName);
            if (prevPending && prevPending.challan_no && !activeWhDcs.length) {
              nextChallanNo = prevPending.challan_no.replace(/-[A-Z]+$/, '');
            } else {
              const { data: allDcs } = await supabase
                .from('delivery_challans')
                .select('challan_no')
                .ilike('challan_no', `${safePrefix}-%`);

              let nextNum = 1;
              if (allDcs && allDcs.length > 0) {
                const maxNum = allDcs.reduce((max, dc) => {
                  const match = (dc.challan_no || '').match(new RegExp(`^${safePrefix}-(\\d+)`));
                  if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    return num > max ? num : max;
                  }
                  return max;
                }, 0);
                nextNum = maxNum + 1;
              }
              nextChallanNo = `${safePrefix}-${String(nextNum).padStart(4, '0')}`;
            }
          }

          const isManualWh = Boolean(
            workflowSettings?.require_manual_gatepass_sale &&
            (workflowSettings?.manual_gatepass_locations_sale || []).includes(whName)
          );
          const manualGp = values.gatePasses?.[whName]?.trim();
          const finalEditChallanNo = (isManualWh && manualGp)
            ? (manualGp.toUpperCase().startsWith(`${safePrefix}-`) ? manualGp.toUpperCase() : `${safePrefix}-${manualGp}`)
            : nextChallanNo;

          const editDcStatus = isWhRequireDelivery ? 'Pending Approval' : 'Dispatched';
          const editDcRemarks = (isManualWh && manualGp)
            ? `[MANUAL GP] Direct Counter Sale / Gate Pass #${finalEditChallanNo} for ${formattedInvCode} (${whName}) [EDITED]`
            : (isWhRequireDelivery
              ? `[MANUAL] Pending Warehouse Dispatch Approval for ${formattedInvCode} (${whName}) [EDITED]`
              : `[AUTOMATIC] Direct Counter Sale / Immediate Dispatch for ${formattedInvCode} (${whName}) [EDITED]`);

          await supabase.from('delivery_challans').insert([{
            challan_no: finalEditChallanNo,
            invoice_no: formattedInvCode,
            customer_name: customerFinalName,
            challan_date: values.saleDate || new Date().toISOString().split('T')[0],
            dispatch_warehouse: whName,
            transport_name: isWhRequireDelivery ? (values.transportType || 'By Road Transport') : 'No Transport (Handover)',
            transportation: isWhRequireDelivery ? (values.transportType || 'By Road Transport') : 'No Transport (Handover)',
            po_no: values.clientPoNumber || '',
            po_date: values.saleDate || null,
            gate_pass_no: finalEditChallanNo,
            vehicle_no: isWhRequireDelivery ? '' : 'Counter Delivery',
            remarks: editDcRemarks,
            total_quantity: whQty,
            total_amount: whBaseAmt,
            total_discount: whDiscAmt,
            total_net_amount: whNetAmt,
            status: editDcStatus,
            items: whItems.map(i => ({
              ...i,
              orderQty: Number(i.qty || 0),
              dispatchedQty: isWhRequireDelivery ? 0 : Number(i.qty || 0),
              holdQty: isWhRequireDelivery ? Number(i.qty || 0) : 0
            }))
          }]);
        }

        toast.success('Sales Invoice updated successfully!');
      } else {
        // Concurrency guard: Ensure this invoice number wasn't already inserted in parallel
        const { data: duplicateCheck } = await supabase
          .from('sales_invoices')
          .select('id')
          .ilike('invoice_no', values.invoiceNo.trim())
          .maybeSingle();

        if (duplicateCheck) {
          toast.error(`Invoice #${values.invoiceNo} has already been recorded!`);
          setLoading(false);
          return;
        }

        const { data: insertedInvoice, error: invoiceError } = await supabase
          .from('sales_invoices')
          .insert([databasePayload])
          .select('id')
          .single();

        if (invoiceError) throw invoiceError;

        finalInvoiceId = insertedInvoice?.id;
        const formattedInvCode = values.invoiceNo;

        logActivity({
          action: 'INSERT',
          tableName: 'sales_invoices',
          details: {
            id: insertedInvoice?.id,
            invoice_number: values.invoiceNo,
            customer_name: customerFinalName,
            total_amount: calculatedGrandTotal,
            item_count: allMergedItems.length,
            payment_term: runningBalanceTerm,
            warehouse: values.dispatchWarehouse,
            event: `Created sales invoice ${values.invoiceNo} for ${customerFinalName}`
          }
        });

        // ── AUTO-CREATE DELIVERY CHALLANS PER UNIQUE WAREHOUSE (AUTOMATIC OR MANUAL) ──
        const workflowSettings = await fetchWorkflowSettings();
        const requireDelivery = Boolean(workflowSettings.require_delivery_challan);

        try {
          // Group invoice items by warehouse destination
          const itemsByWarehouse: Record<string, any[]> = {};
          (allMergedItems || []).forEach((item: any) => {
            if (!item.itemName || !item.itemName.trim()) return;
            if (Number(item.qty || 0) <= 0) return;
            const wh = (item.warehouse || values.dispatchWarehouse || 'Main Warehouse').trim();
            if (!itemsByWarehouse[wh]) itemsByWarehouse[wh] = [];
            itemsByWarehouse[wh].push({
              poNoSub: values.clientPoNumber || '',
              pDescription: item.itemName || 'Product',
              skuCode: item.skuCode || '',
              location: wh,
              rate: Number(item.rp) || 0,
              qty: Number(item.qty) || 0,
              disAmt: Number(item.discountAmt) || 0,
              distPer: Number(item.discountPer) || 0,
              discount: 0,
              notes: item.notes || '',
              isTileItem: Boolean(item.isTileItem),
              boxQty: item.boxQty,
              loosePcs: item.loosePcs
            });
          });

          const createdGatePassesMap: Record<string, string> = {};

          for (const [whName, whItems] of Object.entries(itemsByWarehouse)) {
            const whQty = whItems.reduce((acc, i) => acc + Number(i.qty || 0), 0);
            const whBaseAmt = whItems.reduce((acc, i) => acc + (Number(i.rate || 0) * Number(i.qty || 0)), 0);
            const whDiscAmt = whItems.reduce((acc, i) => acc + Number(i.disAmt || 0), 0);
            const whNetAmt = whBaseAmt - whDiscAmt;

            const safePrefix = whName.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const { data: allDcs } = await supabase
              .from('delivery_challans')
              .select('challan_no')
              .ilike('challan_no', `${safePrefix}-%`);

            let nextNum = 1;
            if (allDcs && allDcs.length > 0) {
              const maxNum = allDcs.reduce((max, dc) => {
                const match = (dc.challan_no || '').match(new RegExp(`^${safePrefix}-(\\d+)`));
                if (match && match[1]) {
                  const num = parseInt(match[1], 10);
                  return num > max ? num : max;
                }
                return max;
              }, 0);
              nextNum = maxNum + 1;
            }
            
            const autoChallanNo = `${safePrefix}-${String(nextNum).padStart(4, '0')}`;
            const isManualWh = Boolean(
              workflowSettings?.require_manual_gatepass_sale &&
              (workflowSettings?.manual_gatepass_locations_sale || []).includes(whName)
            );
            const manualGp = values.gatePasses?.[whName]?.trim();
            const finalChallanNo = (isManualWh && manualGp)
              ? (manualGp.toUpperCase().startsWith(`${safePrefix}-`) ? manualGp.toUpperCase() : `${safePrefix}-${manualGp}`)
              : autoChallanNo;

            createdGatePassesMap[whName] = finalChallanNo;

            const isWhRequireDelivery = Boolean(
              workflowSettings?.require_delivery_challan &&
              (workflowSettings?.delivery_challan_locations || []).includes(whName)
            );

            const dcStatus = isWhRequireDelivery ? 'Pending Approval' : 'Dispatched';
            const dcRemarks = (isManualWh && manualGp)
              ? `[MANUAL GP] Direct Counter Sale / Gate Pass #${finalChallanNo} for ${formattedInvCode} (${whName})`
              : (isWhRequireDelivery
                ? `[MANUAL] Pending Warehouse Dispatch Approval for ${formattedInvCode} (${whName})`
                : `[AUTOMATIC] Direct Counter Sale / Immediate Dispatch for ${formattedInvCode} (${whName})`);

            await supabase.from('delivery_challans').insert([{
              challan_no: finalChallanNo,
              invoice_no: formattedInvCode,
              customer_name: customerFinalName,
              challan_date: values.saleDate || new Date().toISOString().split('T')[0],
              dispatch_warehouse: whName,
              transport_name: isWhRequireDelivery ? (values.transportType || 'By Road Transport') : 'No Transport (Handover)',
              transportation: isWhRequireDelivery ? (values.transportType || 'By Road Transport') : 'No Transport (Handover)',
              po_no: values.clientPoNumber || '',
              po_date: values.saleDate || null,
              gate_pass_no: finalChallanNo,
              vehicle_no: isWhRequireDelivery ? '' : 'Counter Delivery',
              remarks: dcRemarks,
              total_quantity: whQty,
              total_amount: whBaseAmt,
              total_discount: whDiscAmt,
              total_net_amount: whNetAmt,
              status: dcStatus,
              items: whItems.map(i => ({
                ...i,
                orderQty: Number(i.qty || 0),
                dispatchedQty: isWhRequireDelivery ? 0 : Number(i.qty || 0),
                holdQty: isWhRequireDelivery ? Number(i.qty || 0) : 0
              }))
            }]);
          }

          // Backfill invoice header gate_pass_no with all generated location gate passes
          const allGatePassStr = Object.entries(createdGatePassesMap).map(([wh, gp]) => `${wh}: ${gp}`).join(' | ');
          if (finalInvoiceId && allGatePassStr) {
            await supabase.from('sales_invoices').update({ gate_pass_no: allGatePassStr }).eq('id', finalInvoiceId);
          }
        } catch (dcErr: any) {
          console.error('Delivery challan generation warning:', dcErr);
          toast.error(`DC Generation warning: ${dcErr.message || 'Unknown error'}`);
        }

        // ── 1-STEP WORKFLOW: Deduct stock immediately for warehouses that do NOT require 2-step delivery challan ──
        for (const item of allMergedItems) {
          if (!item.itemName || !item.itemName.trim()) continue;
          const wh = (item.warehouse || values.dispatchWarehouse || 'Main Warehouse').trim();
          const isWhRequireDelivery = Boolean(
            workflowSettings?.require_delivery_challan &&
            (workflowSettings?.delivery_challan_locations || []).includes(wh)
          );
          if (!isWhRequireDelivery) {
            const { data: prod } = await supabase.from('products').select('id, current_stock').ilike('product_name', item.itemName).maybeSingle();
            if (prod) await supabase.from('products').update({ current_stock: Number(prod.current_stock) - Number(item.qty) }).eq('id', prod.id);
          }
        }

        toast.success('Sales Invoice processed successfully!');
      }

      // ── AUTO-SYNC SALES RETURN RECORD (FOR IN-INVOICE RETURN / EXCHANGE) ──
      try {
        const convertedTileReturnItems = validTileReturnItems.map((t: any) => {
          const pcsPerBox = Math.max(1, Number(t.piecesPerBox) || 4);
          const bQty = Number(t.boxQty || 0);
          const lPcs = Number(t.loosePcs || 0);
          const totalPcs = (bQty * pcsPerBox) + lPcs;
          const qtyBoxDec = Number((totalPcs / pcsPerBox).toFixed(3));
          return {
            sku: t.skuCode || '',
            itemName: t.itemName,
            warehouse: t.warehouse || values.dispatchWarehouse || 'Main Warehouse',
            qty: qtyBoxDec,
            rate: Number(t.pricePerBox || 0),
            uom: 'BOX',
            total: Number(t.totalAmount || 0),
            isTileItem: true,
            boxQty: bQty,
            loosePcs: lPcs,
            piecesPerBox: pcsPerBox,
            sqmPerBox: Number(t.sqmPerBox || 1.44),
            totalSqm: Number(t.totalSqm || 0)
          };
        });

        const allCombinedReturnItems = [
          ...validReturnItems.map((i: any) => ({
            sku: i.skuCode || '',
            itemName: i.itemName,
            warehouse: i.warehouse || values.dispatchWarehouse || 'Main Warehouse',
            qty: Number(i.qty),
            rate: Number(i.rp),
            uom: i.uom || 'Nos',
            total: Number(i.qty) * Number(i.rp)
          })),
          ...convertedTileReturnItems
        ];

        if (allCombinedReturnItems.length > 0) {
          const itemWh = allCombinedReturnItems.find((i: any) => i.warehouse && i.warehouse !== 'Main Warehouse')?.warehouse;
          const defaultStorageWh = warehousesList.find((w: string) => /fateh/i.test(w) || /a[-_ ]?39/i.test(w)) || warehousesList[0] || 'Main Warehouse';
          const returnWh = itemWh || values.dispatchWarehouse || defaultStorageWh;

          const isExcessRefund = values.excessCreditAction === 'refund' && Number(values.excessRefundAmount || 0) > 0;
          const excessRefundVal = isExcessRefund ? Number(values.excessRefundAmount || 0) : 0;
          const refundMethod = values.excessRefundMethod || 'Cash';

          const settlementTerm = isExcessRefund 
            ? (totalAllReturnsCredit > excessRefundVal ? 'Exchange & Cash Refund' : (refundMethod === 'Bank' ? 'By Bank' : 'By Cash'))
            : 'Exchange On Invoice';

          const returnPayload: any = {
            return_no: values.invoiceNo,
            customer_name: customerFinalName,
            return_date: values.saleDate || new Date().toISOString().split('T')[0],
            warehouse_name: returnWh,
            source_warehouse: returnWh,
            invoice_no: values.invoiceNo,
            original_invoice_no: values.invoiceNo,
            settlement_mode: settlementTerm,
            payment_term: settlementTerm,
            total_amount: totalAllReturnsCredit,
            payout_amount_paid: excessRefundVal,
            cash_amount_paid: isExcessRefund && refundMethod === 'Cash' ? excessRefundVal : null,
            bank_amount: isExcessRefund && refundMethod === 'Bank' ? String(excessRefundVal) : null,
            selected_bank: isExcessRefund && refundMethod === 'Bank' ? values.excessRefundBank : null,
            status: isExcessRefund ? 'Refunded' : 'Credit Applied',
            inward_status: 'Pending Inward',
            remarks: `In-invoice return/exchange against Invoice #${values.invoiceNo}${isExcessRefund ? ` (Refund Paid: Rs. ${excessRefundVal} via ${refundMethod})` : ''}`,
            items: allCombinedReturnItems
          };

          const { data: existingReturn } = await supabase
            .from('sales_returns')
            .select('id')
            .eq('return_no', values.invoiceNo)
            .maybeSingle();

          if (existingReturn) {
            await supabase.from('sales_returns').update(returnPayload).eq('id', existingReturn.id);
          } else {
            await supabase.from('sales_returns').insert([returnPayload]);
          }
        } else if (editData) {
          await supabase.from('sales_returns').delete().eq('return_no', editData.invoice_no || values.invoiceNo);
        }
      } catch (retSyncErr: any) {
        console.error('Sales Return sync warning:', retSyncErr);
      }

      // ── AUTO-SYNC FINANCIAL VOUCHERS (SAV & CRV) ──
      try {
        const resolvedCustomer = await resolveCustomerCoaAccount(customerFinalName, customersList);
        await syncInvoiceFinancialVouchers({
          invoiceNo: editData?.invoice_no || values.invoiceNo,
          customerName: resolvedCustomer.title,
          customerCode: resolvedCustomer.code,
          saleDate: values.saleDate || new Date().toISOString().split('T')[0],
          grandTotal: calculatedGrandTotal,
          paidCash: paidCash,
          paidBank: paidBank,
          settlementMode: values.settlementMode || 'Cash',
          selectedBankTitle: values.selectedBankTitle,
          itemsCount: allMergedItems.length,
          isEdit: !!(editData && editData.id)
        });
      } catch (vchSyncErr: any) {
        console.error('Financial voucher auto-sync warning:', vchSyncErr);
      }

      setShowCustomerModal(false);
      if (submitAction === 'print' && finalInvoiceId) {
        navigate(`${tenantId ? `/${tenantId}` : ''}/sales/invoice/print/${finalInvoiceId}`);
      } else {
        navigate(`${tenantId ? `/${tenantId}` : ''}/sales/invoice/list`);
      }
    } catch (err: any) {
      toast.error('Submission failure: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalCustomerModalSubmit = async () => {
    if (!pendingFormValues || loading) return;
    setLoading(true);

    try {
      // Calculate if sale is on credit
      const returnVal = (pendingFormValues.returnItems || []).reduce(
        (acc: number, r: any) => acc + (Number(r.qty || 0) * Number(r.rp ?? r.rate ?? 0)), 0
      );
      const tileReturnVal = (pendingFormValues.showTileReturnSection ? (pendingFormValues.tileReturnItems || []) : []).reduce(
        (acc: number, t: any) => acc + Number(t.totalAmount || 0), 0
      );
      const tileVal = (pendingFormValues.showTileSection ? (pendingFormValues.tileItems || []) : []).reduce(
        (acc: number, t: any) => acc + Number(t.totalAmount || 0), 0
      );
      const grossTotal = (pendingFormValues.items || []).reduce((acc: number, item: any) => {
        return acc + calculateLineTotals(item, pendingFormValues.taxScenario, pendingFormValues.applyFbrTax).netTotal;
      }, 0) + tileVal + Number(pendingFormValues.transportCharges || 0) + Number(pendingFormValues.additionalCharges || 0) - Number(pendingFormValues.overallDiscount || 0);

      const netPayable = grossTotal - returnVal - tileReturnVal;
      const currentSubtotal = Math.max(0, netPayable);

      const totalPaidNow = pendingFormValues.settlementMode === 'Cash'
        ? Number(pendingFormValues.cashAmountPaid || 0)
        : (pendingFormValues.settlementMode === 'Bank' ? Number(pendingFormValues.bankAmountPaid || 0) : (Number(pendingFormValues.cashAmountPaid || 0) + Number(pendingFormValues.bankAmountPaid || 0)));
      const remainingBal = Math.max(0, currentSubtotal - totalPaidNow);
      const isOnCredit = remainingBal > 0.01 || netPayable < -0.01;

      let finalCustomerName = '';

      if (customerModalType === 'recorded') {
        if (!selectedRecordedCustomer) {
          toast.error('Please select an existing customer account from the list.');
          setLoading(false);
          return;
        }
        finalCustomerName = selectedRecordedCustomer;
      } else {
        const cleanName = walkinName.trim();
        const cleanPhone = walkinPhone.trim();

        if (isOnCredit && (!cleanName || cleanName.toLowerCase() === 'walk-in customer')) {
          toast.error(`Customer Name is required for credit sales (Outstanding balance: Rs. ${remainingBal.toLocaleString()}) to maintain customer directory record.`);
          setLoading(false);
          return;
        }

        finalCustomerName = cleanName || 'Walk-in Customer';

        // If user specified a custom walk-in customer name
        if ((recordWalkinCustomer || isOnCredit) && cleanName && cleanName.toLowerCase() !== 'walk-in customer') {
          try {
            const { data: existing } = await supabase
              .from('customers')
              .select('id')
              .ilike('customerName', cleanName)
              .maybeSingle();

            if (!existing) {
              const { error: custErr } = await supabase.from('customers').insert([{
                customerName: cleanName,
                customer_code: null,
                customercode: null,
                primaryphone: cleanPhone || '-',
                phone: cleanPhone || '-',
                company: 'Retail Walk-in'
              }]);

              if (custErr) {
                console.error('Customer insert warning:', custErr);
              } else {
                toast.success(`Customer "${cleanName}" saved to directory!`);
              }
            }
          } catch (e: any) {
            console.error('Customer registration error:', e);
          }
        } 
        // If user did not provide a custom name, auto-create / link to unified "Walk-in Customer" profile
        else if (!cleanName || cleanName.toLowerCase() === 'walk-in customer') {
          try {
            const { data: existingWalkin } = await supabase
              .from('customers')
              .select('id')
              .ilike('customerName', 'Walk-in Customer')
              .maybeSingle();

            if (!existingWalkin) {
              const { error: walkinErr } = await supabase.from('customers').insert([{
                customerName: 'Walk-in Customer',
                customer_code: 'WALK-IN',
                customercode: 'WALK-IN',
                primaryphone: '-',
                phone: '-',
                company: 'Counter Walk-in / Direct Retail'
              }]);

              if (walkinErr) {
                console.error('Walk-in Customer profile auto-creation warning:', walkinErr);
              }
            }
          } catch (e: any) {
            console.error('Walk-in customer lookup error:', e);
          }
        }
      }

      await executeInvoicePersistence(pendingFormValues, finalCustomerName, bypassNegativeStockWarning);
    } catch (e: any) {
      console.error(e);
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-7xl text-black dark:text-bodydark text-xs font-sans relative">
      
      {/* ⚠️ WAREHOUSE STOCK MISMATCH / LOW STOCK WARNING MODAL */}
      {showStockWarningModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-boxdark w-full max-w-xl rounded-2xl shadow-2xl p-6 border border-amber-300 dark:border-amber-700/60 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FiAlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Warehouse Stock Warning
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The chosen warehouse has insufficient stock, but items are available in another location:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStockWarningModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* List of Warning Items */}
            <div className="my-4 max-h-72 overflow-y-auto space-y-3 pr-1">
              {stockWarningItems.map((item, wIdx) => {
                const hasAlt = item.bestAlternative && item.bestAlternative.stock > 0;
                return (
                  <div
                    key={wIdx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {item.itemName}
                        </div>
                        {item.skuCode && (
                          <div className="text-[10px] font-mono text-slate-400">Code: {item.skuCode}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold font-mono px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-[11px]">
                          Need: {item.itemType === 'tile' ? `${item.requestedBoxes} Box + ${item.requestedLoose} Pcs` : `${item.requestedQty} ${item.uom}`}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                      <div>
                        <span className="text-slate-400">Selected Location:</span>
                        <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1 font-mono">
                          <span>{item.currentWarehouse}</span>
                          <span>(Available: {item.itemType === 'tile' ? `${item.currentStock} Box + ${item.currentLoose} Pcs` : `${item.currentStock} ${item.uom}`})</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400">Stock Found in:</span>
                        {hasAlt ? (
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                              {item.bestAlternative.warehouse} ({item.itemType === 'tile' ? `${item.bestAlternative.boxes} Box + ${item.bestAlternative.loose} Pcs` : `${item.bestAlternative.stock} ${item.uom}`})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const targetWh = item.bestAlternative.warehouse;
                                if (activeFormikSetFieldValue) {
                                  if (item.itemType === 'standard') {
                                    activeFormikSetFieldValue(`items.${item.index}.warehouse`, targetWh);
                                    activeFormikSetFieldValue(`items.${item.index}.availableQty`, item.bestAlternative.stock);
                                  } else {
                                    activeFormikSetFieldValue(`tileItems.${item.index}.warehouse`, targetWh);
                                    activeFormikSetFieldValue(`tileItems.${item.index}.availableQty`, item.bestAlternative.stock);
                                  }
                                }
                                if (pendingFormValues) {
                                  if (item.itemType === 'standard' && pendingFormValues.items?.[item.index]) {
                                    pendingFormValues.items[item.index].warehouse = targetWh;
                                    pendingFormValues.items[item.index].availableQty = item.bestAlternative.stock;
                                  } else if (item.itemType === 'tile' && pendingFormValues.tileItems?.[item.index]) {
                                    pendingFormValues.tileItems[item.index].warehouse = targetWh;
                                    pendingFormValues.tileItems[item.index].availableQty = item.bestAlternative.stock;
                                  }
                                }
                                setStockWarningItems(prev => prev.filter((_, idx) => idx !== wIdx));
                                toast.success(`Switched ${item.itemName} to ${targetWh}`);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 transition cursor-pointer"
                            >
                              Switch
                            </button>
                          </div>
                        ) : (
                          <div className="font-bold text-slate-400 italic">No other warehouse has stock</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShowStockWarningModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
              >
                Cancel & Edit Rows
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowStockWarningModal(false);
                    openCustomerCheckoutModal(pendingFormValues, true);
                  }}
                  className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold transition cursor-pointer text-center"
                  title="Allows invoice to proceed with negative stock in the selected location"
                >
                  Proceed with Negative Stock
                </button>

                {stockWarningItems.some(i => i.bestAlternative && i.bestAlternative.stock > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      stockWarningItems.forEach(item => {
                        if (item.bestAlternative && item.bestAlternative.stock > 0) {
                          const targetWh = item.bestAlternative.warehouse;
                          if (activeFormikSetFieldValue) {
                            if (item.itemType === 'standard') {
                              activeFormikSetFieldValue(`items.${item.index}.warehouse`, targetWh);
                              activeFormikSetFieldValue(`items.${item.index}.availableQty`, item.bestAlternative.stock);
                            } else {
                              activeFormikSetFieldValue(`tileItems.${item.index}.warehouse`, targetWh);
                              activeFormikSetFieldValue(`tileItems.${item.index}.availableQty`, item.bestAlternative.stock);
                            }
                          }
                          if (pendingFormValues) {
                            if (item.itemType === 'standard' && pendingFormValues.items?.[item.index]) {
                              pendingFormValues.items[item.index].warehouse = targetWh;
                              pendingFormValues.items[item.index].availableQty = item.bestAlternative.stock;
                            } else if (item.itemType === 'tile' && pendingFormValues.tileItems?.[item.index]) {
                              pendingFormValues.tileItems[item.index].warehouse = targetWh;
                              pendingFormValues.tileItems[item.index].availableQty = item.bestAlternative.stock;
                            }
                          }
                        }
                      });
                      toast.success('All items switched to warehouses with stock!');
                      setShowStockWarningModal(false);
                      openCustomerCheckoutModal(pendingFormValues, false);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Switch to Available Stock & Save</span>
                    <FiArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK NEW CUSTOMER MODAL */}
      {isQuickCustomerModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl border border-stroke dark:border-strokedark w-full max-w-md p-6 overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <FiUser className="text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-black dark:text-white">Quick Add Customer</h3>
                  <p className="text-[11px] text-gray-400">Instantly creates ledger account and selects for billing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCustomerModalOpen(false)}
                className="text-gray-400 hover:text-black dark:hover:text-white p-1 rounded-md"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Customer Full Name: *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Haji Aslam Trader"
                    value={quickCustomerName}
                    onChange={(e) => setQuickCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stroke dark:border-strokedark bg-transparent font-bold outline-none text-black dark:text-white focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Contact Phone:
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={quickCustomerPhone}
                    onChange={(e) => setQuickCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stroke dark:border-strokedark bg-transparent font-bold outline-none text-black dark:text-white focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    Customer Code:
                  </label>
                  <input
                    type="text"
                    value={quickCustomerCode}
                    onChange={(e) => setQuickCustomerCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stroke dark:border-strokedark bg-transparent font-bold outline-none text-black dark:text-white focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    Opening Balance:
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={quickCustomerOpeningBal}
                    onChange={(e) => setQuickCustomerOpeningBal(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stroke dark:border-strokedark bg-transparent font-bold outline-none text-black dark:text-white focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Shop / Delivery Address:
                </label>
                <textarea
                  rows={2}
                  placeholder="Street / Market / Delivery point..."
                  value={quickCustomerAddress}
                  onChange={(e) => setQuickCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stroke dark:border-strokedark bg-transparent font-bold outline-none text-black dark:text-white focus:border-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stroke dark:border-strokedark">
              <button
                type="button"
                onClick={() => setIsQuickCustomerModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-stroke dark:border-strokedark text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingQuickCustomer}
                onClick={() => handleSaveQuickCustomer(activeFormikSetFieldValue)}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50 transition"
              >
                {isSavingQuickCustomer ? (
                  <>
                    <Spinner size="w-3.5 h-3.5" color="border-white" />
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="text-sm" />
                    <span>Save & Use Customer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER CHECKOUT MODAL */}
      {showCustomerModal && (() => {
        const modalReturnVal = (pendingFormValues?.returnItems || []).reduce((acc: number, r: any) => acc + (Number(r.qty || 0) * Number(r.rp ?? r.rate ?? 0)), 0);
        const modalTileReturnVal = (pendingFormValues?.showTileReturnSection ? (pendingFormValues?.tileReturnItems || []) : []).reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0);
        const modalTileVal = (pendingFormValues?.showTileSection ? (pendingFormValues?.tileItems || []) : []).reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0);
        const modalGross = pendingFormValues ? (
          (pendingFormValues.items || []).reduce((acc: number, item: any) => {
            return acc + calculateLineTotals(item, pendingFormValues.taxScenario, pendingFormValues.applyFbrTax).netTotal;
          }, 0) + modalTileVal + Number(pendingFormValues.transportCharges || 0) + Number(pendingFormValues.additionalCharges || 0) - Number(pendingFormValues.overallDiscount || 0)
        ) : 0;
        const modalNetPayable = modalGross - modalReturnVal - modalTileReturnVal;
        const modalSubtotal = Math.max(0, modalNetPayable);

        const modalPaid = pendingFormValues ? (
          pendingFormValues.settlementMode === 'Cash'
            ? Number(pendingFormValues.cashAmountPaid || 0)
            : (pendingFormValues.settlementMode === 'Bank' ? Number(pendingFormValues.bankAmountPaid || 0) : (Number(pendingFormValues.cashAmountPaid || 0) + Number(pendingFormValues.bankAmountPaid || 0)))
        ) : 0;

        const modalRemainingBal = Math.max(0, modalSubtotal - modalPaid);
        const isModalOnCredit = modalRemainingBal > 0.01 || modalNetPayable < -0.01;

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-boxdark w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-stroke dark:border-strokedark animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                  <FiUserCheck className="text-emerald-500" /> Checkout Customer
                </h2>
                <button onClick={() => setShowCustomerModal(false)}>
                  <FiX className="text-xl text-gray-400 hover:text-black dark:hover:text-white" />
                </button>
              </div>

              {modalNetPayable < -0.01 ? (
                <div className="mb-4 p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>
                    <strong>Customer Account Credit (Excess Return: Rs. {Math.abs(modalNetPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}):</strong> Balance will be credited to customer receivable account.
                  </span>
                </div>
              ) : isModalOnCredit && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>
                    <strong>Credit Sale (Remaining: Rs. {modalRemainingBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}):</strong> Customer account will be saved to directory.
                  </span>
                </div>
              )}

              <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                  type="button"
                  onClick={() => setCustomerModalType('walkin')} 
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition ${customerModalType === 'walkin' ? 'bg-white dark:bg-boxdark shadow-sm text-primary dark:text-teal-400' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
                >
                  Walk-in Sale
                </button>
                <button 
                  type="button"
                  onClick={() => setCustomerModalType('recorded')} 
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition ${customerModalType === 'recorded' ? 'bg-white dark:bg-boxdark shadow-sm text-primary dark:text-teal-400' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
                >
                  Recorded Client
                </button>
              </div>

              {customerModalType === 'walkin' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Customer Name {isModalOnCredit ? <span className="text-red-500 font-extrabold">*</span> : '(Optional)'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={isModalOnCredit ? "Customer Name *" : "Customer Name (Optional)"} 
                      value={walkinName} 
                      onChange={(e) => setWalkinName(e.target.value)} 
                      className={`w-full p-3 border rounded-lg bg-white dark:bg-boxdark dark:border-strokedark outline-none text-xs font-bold text-black dark:text-white ${
                        isModalOnCredit && !walkinName.trim() ? 'border-amber-500 focus:border-amber-600 bg-amber-50/5' : 'focus:border-primary'
                      }`} 
                    />
                    {isModalOnCredit && !walkinName.trim() && (
                      <p className="text-amber-600 dark:text-amber-400 text-[10px] font-semibold mt-1">
                        * Required for credit sale
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Phone Number (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Phone Number (Optional)" 
                      value={walkinPhone} 
                      onChange={(e) => setWalkinPhone(e.target.value)} 
                      className="w-full p-3 border rounded-lg bg-white dark:bg-boxdark dark:border-strokedark outline-none text-xs text-black dark:text-white focus:border-primary" 
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                    <input 
                      type="checkbox" 
                      checked={recordWalkinCustomer || isModalOnCredit} 
                      disabled={isModalOnCredit}
                      onChange={(e) => setRecordWalkinCustomer(e.target.checked)} 
                    />
                    <span>Save this customer to directory {isModalOnCredit && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">(Auto-enabled for credit)</span>}</span>
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Select Customer Profile</label>
                  <select 
                    value={selectedRecordedCustomer} 
                    onChange={(e) => setSelectedRecordedCustomer(e.target.value)} 
                    className="w-full p-3 border rounded-lg bg-white dark:bg-boxdark dark:border-strokedark outline-none text-xs font-bold text-black dark:text-white focus:border-primary"
                  >
                    <option value="" className="bg-white dark:bg-boxdark text-black dark:text-white">-- Search Customer --</option>
                    {customersList.map(c => {
                      const code = c.customer_code || c.customerCode;
                      return (
                        <option key={c.id} value={c.customerName} className="bg-white dark:bg-boxdark text-black dark:text-white">
                          {code ? `[${code}] ${c.customerName}` : c.customerName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="flex-1 py-2.5 rounded-lg border border-stroke dark:border-strokedark font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                <button type="button" onClick={handleFinalCustomerModalSubmit} disabled={loading} className="flex-1 py-2.5 rounded-lg bg-primary text-white font-bold text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><FiCheck /> {loading ? 'Processing...' : 'Finalize & Log'}</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div className="flex items-center justify-between border-b border-stroke pb-4 mb-6 dark:border-strokedark">
          <h3 className="font-semibold text-black dark:text-white text-base">
            {editData ? `Modify Historical Sales Invoice Reference # ${editData.id}` : 'Generate Commercial Sales Invoice'}
          </h3>
          <button type="button" onClick={() => navigate('/sales/invoice/list')} className="text-sm font-medium text-primary hover:underline">See Logs List</button>
        </div>

        <Formik
          initialValues={getFormInitialValues()}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            if (isSalesman) {
              values.salesman = matchedSalesman || currentSalesmanName || values.salesman;
            }
            setPendingFormValues(values);

            // Calculate return deductions and check if on credit
            const returnVal = (values.returnItems || []).reduce(
              (acc: number, r: any) => acc + (Number(r.qty || 0) * Number(r.rp ?? r.rate ?? 0)), 0
            );
            const tileReturnVal = (values.showTileReturnSection ? (values.tileReturnItems || []) : []).reduce(
              (acc: number, t: any) => acc + Number(t.totalAmount || 0), 0
            );
            const tileVal = (values.showTileSection ? (values.tileItems || []) : []).reduce(
              (acc: number, t: any) => acc + Number(t.totalAmount || 0), 0
            );
            const grossTotal = (values.items || []).reduce((acc: number, item: any) => {
              return acc + calculateLineTotals(item, values.taxScenario, values.applyFbrTax).netTotal;
            }, 0) + tileVal + Number(values.transportCharges || 0) + Number(values.additionalCharges || 0) - Number(values.overallDiscount || 0);

            const netPayable = grossTotal - returnVal - tileReturnVal;
            const currentSubtotal = Math.max(0, netPayable);
            const totalPaidNow = values.settlementMode === 'Cash'
              ? Number(values.cashAmountPaid || 0)
              : (values.settlementMode === 'Bank' ? Number(values.bankAmountPaid || 0) : (Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)));
            const remainingBal = Math.max(0, currentSubtotal - totalPaidNow);
            const isOnCredit = remainingBal > 0.01 || netPayable < -0.01;

            const selectedCust = (values.customerName || selectedRecordedCustomer || '').trim();

            // 1. If recorded customer is selected upfront: direct persist!
            if (selectedCust && selectedCust.toLowerCase() !== 'walk-in customer') {
              setSelectedRecordedCustomer(selectedCust);
              setCustomerModalType('recorded');
              await executeInvoicePersistence(values, selectedCust, false);
              return;
            }

            // 2. If Walk-in and paid in full (no remaining debt): direct persist!
            if (!isOnCredit) {
              setCustomerModalType('walkin');
              await executeInvoicePersistence(values, 'Walk-in Customer', false);
              return;
            }

            // 3. If credit sale with Walk-in, open customer modal to capture directory details
            if (editData && editData.customer_name) {
              const custName = String(editData.customer_name).trim();
              const isExistingRecorded = customersList.some(c => (c.customerName || '').toLowerCase() === custName.toLowerCase());

              if (isExistingRecorded) {
                const found = customersList.find(c => (c.customerName || '').toLowerCase() === custName.toLowerCase());
                setSelectedRecordedCustomer(found?.customerName || custName);
                setCustomerModalType('recorded');
              } else {
                setCustomerModalType('walkin');
                setWalkinName(custName);
                setWalkinPhone('');
                setRecordWalkinCustomer(false);
              }
            } else {
              setCustomerModalType('walkin');
              setWalkinName('');
              setWalkinPhone('');
              setRecordWalkinCustomer(true);
            }
            setIsOpeningCustomerModal(false);
            setShowCustomerModal(true);
          }}
        >
          {({ values, handleChange, setFieldValue, errors, touched, submitCount, submitForm, isSubmitting, isValidating }) => {
            // Keep setFieldValue available for stock modal auto-switch
            if (activeFormikSetFieldValue !== setFieldValue) {
              setActiveFormikSetFieldValue(() => setFieldValue);
            }
            const hasAttempted = submitCount > 0;
            const isModalLoading = isOpeningCustomerModal || isSubmitting || isValidating;
            const returnTotalValue = (values.returnItems || []).reduce((acc: number, rItem: any) => {
              return acc + (Number(rItem.qty || 0) * Number(rItem.rp ?? rItem.rate ?? 0));
            }, 0);

            const tileReturnTotalValue = (values.showTileReturnSection ? (values.tileReturnItems || []) : []).reduce((acc: number, tItem: any) => {
              return acc + Number(tItem.totalAmount || 0);
            }, 0);

            const tileTotalValue = (values.showTileSection ? (values.tileItems || []) : []).reduce((acc: number, tItem: any) => {
              return acc + Number(tItem.totalAmount || 0);
            }, 0);

            const grossSubtotalValue = values.items.reduce((acc: number, item: any) => {
              return acc + calculateLineTotals(item, values.taxScenario, values.applyFbrTax).netTotal;
            }, 0) + tileTotalValue + Number(values.transportCharges || 0) + Number(values.additionalCharges || 0);

            const netPayableBeforeFloor = grossSubtotalValue - Number(values.overallDiscount || 0) - returnTotalValue - tileReturnTotalValue;
            const currentSubtotalValue = Math.max(
              0,
              netPayableBeforeFloor
            );

            const uniqueSaleWarehouses = React.useMemo(() => {
              const set = new Set<string>();
              (values.items || []).forEach((item: any) => {
                if (!item.itemName || !item.itemName.trim()) return;
                if (Number(item.qty || 0) <= 0) return;
                const wh = (item.warehouse || '').trim();
                if (wh) set.add(wh);
              });
              (values.tileItems || []).forEach((item: any) => {
                if (!item.itemName || !item.itemName.trim()) return;
                if (Number(item.boxQty || 0) <= 0 && Number(item.loosePcs || 0) <= 0) return;
                const wh = (item.warehouse || '').trim();
                if (wh) set.add(wh);
              });
              return Array.from(set);
            }, [values.items, values.tileItems]);

            const uniqueManualSaleWarehouses = React.useMemo(() => {
              const requiredLocs = workflowSettings?.manual_gatepass_locations_sale || [];
              const isSettingOn = Boolean(workflowSettings?.require_manual_gatepass_sale);

              return uniqueSaleWarehouses.filter(wh => {
                const status = getWarehouseDispatchStatus(wh, values.items, values.tileItems, editData, values.dispatchWarehouse, productsList);
                // Scenario 2: If bill already has saved gate pass for this warehouse, always show it
                if (status.hasExistingSlip) return true;
                // Scenario 1: If setting is ON, show if it's a new bill OR extra stock/new warehouse added in edit
                if (isSettingOn && requiredLocs.includes(wh)) {
                  if (!editData) return true;
                  return status.isNewOrIncreased;
                }
                return false;
              });
            }, [workflowSettings, uniqueSaleWarehouses, values.items, values.tileItems, editData, values.dispatchWarehouse]);

            const currentPrefix = getSalesmanPrefix(values.salesman, salesmenList);

            // Extract user-typed suffix
            let rawSuffix = values.invoiceNo || '';
            if (currentPrefix && rawSuffix.toUpperCase().startsWith(currentPrefix.toUpperCase())) {
              rawSuffix = rawSuffix.slice(currentPrefix.length);
            }

            // Auto-lock salesman value if logged in as salesman
            if (isSalesman && (matchedSalesman || currentSalesmanName)) {
              const currentOfficer = matchedSalesman || currentSalesmanName;
              if (values.salesman !== currentOfficer) {
                setTimeout(() => {
                  setFieldValue('salesman', currentOfficer);
                }, 0);
              }
            }

            return (
              <Form className="space-y-6">
                <InvoiceHeader
                  values={values}
                  errors={errors}
                  hasAttempted={hasAttempted}
                  currentPrefix={currentPrefix}
                  rawSuffix={rawSuffix}
                  isSalesman={isSalesman}
                  matchedSalesman={matchedSalesman}
                  currentSalesmanName={currentSalesmanName}
                  salesmenList={salesmenList}
                  getSalesmanPrefix={getSalesmanPrefix}
                  editData={editData}
                  customersList={customersList}
                  isCustomerDropdownOpen={isCustomerDropdownOpen}
                  setIsCustomerDropdownOpen={setIsCustomerDropdownOpen}
                  customerSearchQuery={customerSearchQuery}
                  setCustomerSearchQuery={setCustomerSearchQuery}
                  highlightedCustomerIndex={highlightedCustomerIndex}
                  setHighlightedCustomerIndex={setHighlightedCustomerIndex}
                  selectedRecordedCustomer={selectedRecordedCustomer}
                  setSelectedRecordedCustomer={setSelectedRecordedCustomer}
                  setCustomerModalType={setCustomerModalType}
                  setCustomerSoldMap={setCustomerSoldMap}
                  fetchCustomerPastSales={fetchCustomerPastSales}
                  handleOpenQuickCustomerModal={handleOpenQuickCustomerModal}
                  warehousesList={warehousesList}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                />

                
                <InvoiceTileItemsTable
                  values={values}
                  setFieldValue={setFieldValue}
                  activeTileProdIndex={activeTileProdIndex}
                  setActiveTileProdIndex={setActiveTileProdIndex}
                  activeTileWhIndex={activeTileWhIndex}
                  setActiveTileWhIndex={setActiveTileWhIndex}
                  highlightedTileProdIndex={highlightedTileProdIndex}
                  setHighlightedTileProdIndex={setHighlightedTileProdIndex}
                  highlightedTileWhIndex={highlightedTileWhIndex}
                  setHighlightedTileWhIndex={setHighlightedTileWhIndex}
                  productsList={productsList}
                  isTileProduct={isTileProduct}
                  handleTileProductSelection={handleTileProductSelection}
                  handleTileItemChange={handleTileItemChange}
                  warehousesList={warehousesList}
                  fetchStockForWarehouse={fetchStockForWarehouse}
                  getItemWarehouseStock={getItemWarehouseStock}
                  getTileStockBreakdown={getTileStockBreakdown}
                  blockInvalidChar={blockInvalidChar}
                />

                
                <InvoiceStandardItemsTable
                  values={values}
                  errors={errors}
                  hasAttempted={hasAttempted}
                  setFieldValue={setFieldValue}
                  activeSkuIndex={activeSkuIndex}
                  setActiveSkuIndex={setActiveSkuIndex}
                  highlightedSkuIndex={highlightedSkuIndex}
                  setHighlightedSkuIndex={setHighlightedSkuIndex}
                  activeProdNameIndex={activeProdNameIndex}
                  setActiveProdNameIndex={setActiveProdNameIndex}
                  highlightedProdNameIndex={highlightedProdNameIndex}
                  setHighlightedProdNameIndex={setHighlightedProdNameIndex}
                  activeWhIndex={activeWhIndex}
                  setActiveWhIndex={setActiveWhIndex}
                  highlightedWhIndex={highlightedWhIndex}
                  setHighlightedWhIndex={setHighlightedWhIndex}
                  productsList={productsList}
                  warehousesList={warehousesList}
                  editData={editData}
                  calculateLineTotals={calculateLineTotals}
                  handleProductSelectionWithWH={handleProductSelectionWithWH}
                  fetchStockForWarehouse={fetchStockForWarehouse}
                  getItemWarehouseStock={getItemWarehouseStock}
                  getProductOverallStock={getProductOverallStock}
                  isTileProduct={isTileProduct}
                  blockInvalidChar={blockInvalidChar}
                  triggerFeedbackSound={triggerFeedbackSound}
                  userEmail={userEmail}
                  productDropdownScrollRef={productDropdownScrollRef}
                  queueProductScroll={queueProductScroll}
                />

                
                <InvoiceReturnItemsSection
                  values={values}
                  setFieldValue={setFieldValue}
                  returnTotalValue={returnTotalValue}
                  tileReturnTotalValue={tileReturnTotalValue}
                  activeReturnProdIndex={activeReturnProdIndex}
                  setActiveReturnProdIndex={setActiveReturnProdIndex}
                  highlightedReturnProdIndex={highlightedReturnProdIndex}
                  setHighlightedReturnProdIndex={setHighlightedReturnProdIndex}
                  activeReturnWhIndex={activeReturnWhIndex}
                  setActiveReturnWhIndex={setActiveReturnWhIndex}
                  highlightedReturnWhIndex={highlightedReturnWhIndex}
                  setHighlightedReturnWhIndex={setHighlightedReturnWhIndex}
                  activeTileReturnProdIndex={activeTileReturnProdIndex}
                  setActiveTileReturnProdIndex={setActiveTileReturnProdIndex}
                  highlightedTileReturnProdIndex={highlightedTileReturnProdIndex}
                  setHighlightedTileReturnProdIndex={setHighlightedTileReturnProdIndex}
                  activeTileReturnWhIndex={activeTileReturnWhIndex}
                  setActiveTileReturnWhIndex={setActiveTileReturnWhIndex}
                  highlightedTileReturnWhIndex={highlightedTileReturnWhIndex}
                  setHighlightedTileReturnWhIndex={setHighlightedTileReturnWhIndex}
                  productsList={productsList}
                  warehousesList={warehousesList}
                  isTileProduct={isTileProduct}
                  getTileStockBreakdown={getTileStockBreakdown}
                  getProductOverallStock={getProductOverallStock}
                  formatStockWithBoxesAndPcs={formatStockWithBoxesAndPcs}
                  getItemWarehouseStock={getItemWarehouseStock}
                  fetchStockForWarehouse={fetchStockForWarehouse}
                  customerSoldMap={customerSoldMap}
                  handleTileReturnProductSelection={handleTileReturnProductSelection}
                  handleTileReturnItemChange={handleTileReturnItemChange}
                  blockInvalidChar={blockInvalidChar}
                />

                
                <InvoiceChallanSection
                  uniqueManualSaleWarehouses={uniqueManualSaleWarehouses}
                  values={values}
                  setFieldValue={setFieldValue}
                  getWarehouseDispatchStatus={getWarehouseDispatchStatus}
                  editData={editData}
                  productsList={productsList}
                />

                
                <InvoiceSummaryFooter
                  values={values}
                  errors={errors}
                  hasAttempted={hasAttempted}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  netPayableBeforeFloor={netPayableBeforeFloor}
                  grossSubtotalValue={grossSubtotalValue}
                  currentSubtotalValue={currentSubtotalValue}
                  returnTotalValue={returnTotalValue}
                  tileReturnTotalValue={tileReturnTotalValue}
                  banksList={banksList}
                  blockInvalidChar={blockInvalidChar}
                  loading={loading}
                  isModalLoading={isModalLoading}
                  submitAction={submitAction}
                  setSubmitAction={setSubmitAction}
                  setIsOpeningCustomerModal={setIsOpeningCustomerModal}
                  submitForm={submitForm}
                  navigate={navigate}
                  tenantId={tenantId}
                  editData={editData}
                />

                {/* MODAL OPENING TOAST INDICATOR */}
                {isModalLoading && !showCustomerModal && (
                  <div className="fixed bottom-6 right-6 z-[9998] flex items-center gap-3 bg-white dark:bg-boxdark border border-teal-500/40 shadow-2xl py-3 px-5 rounded-xl animate-fade-in pointer-events-none">
                    <Spinner color="border-teal-600" size="w-4 h-4" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      Validating invoice & opening client checkout...
                    </span>
                  </div>
                )}
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

export default NewInvoice;
