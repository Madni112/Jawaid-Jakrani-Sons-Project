import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';

import type {
  VendorOption,
  BankAccount,
  CoaAccount,
  PoAllocationsMap
} from './types/purchaseReceiptTypes';
import { formatMoney } from './utils/purchaseReceiptHelpers';
import { ReceiptHeaderBar } from './components/ReceiptHeaderBar';
import { VendorAutocompleteInput } from './components/VendorAutocompleteInput';
import { PurchaseOrderAutocompleteInput } from './components/PurchaseOrderAutocompleteInput';
import { PaymentMethodAmountSection } from './components/PaymentMethodAmountSection';
import { PayeeVendorProfileCard } from './components/PayeeVendorProfileCard';
import { SettlementBreakdownCard } from './components/SettlementBreakdownCard';

function AddPurchaseReceipt() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useAuth();

  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [purchaseOptions, setPurchaseOptions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<CoaAccount[]>([]);

  // Vendor Autocomplete State
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [highlightedVendorIndex, setHighlightedVendorIndex] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedVendorObj, setSelectedVendorObj] = useState<VendorOption | null>(null);

  // PO Autocomplete State
  const [poSearchQuery, setPoSearchQuery] = useState('');
  const [isPoDropdownOpen, setIsPoDropdownOpen] = useState(false);
  const [highlightedPoIndex, setHighlightedPoIndex] = useState(0);
  const [selectedPurchaseNo, setSelectedPurchaseNo] = useState<string>('');
  const [selectedPurchaseObj, setSelectedPurchaseObj] = useState<any>(null);

  const [generatedVoucherNo, setGeneratedVoucherNo] = useState('');

  // Balances
  const [vendorTotalOutstanding, setVendorTotalOutstanding] = useState<number>(0);
  const [vendorOpeningBalance, setVendorOpeningBalance] = useState<number>(0);
  const [vendorOpeningBalanceVoucherNo, setVendorOpeningBalanceVoucherNo] = useState<string>('');
  const [vendorPurchasesGrossTotal, setVendorPurchasesGrossTotal] = useState<number>(0);
  const [poGrossBill, setPoGrossBill] = useState<number>(0);
  const [poPaidUpfront, setPoPaidUpfront] = useState<number>(0);
  const [poPastReceiptsPaid, setPoPastReceiptsPaid] = useState<number>(0);
  const [effectiveDueForThisReceipt, setEffectiveDueForThisReceipt] = useState<number>(0);
  const [poAllocationsMap, setPoAllocationsMap] = useState<PoAllocationsMap>({});

  const vendorContainerRef = useRef<HTMLDivElement>(null);
  const poContainerRef = useRef<HTMLDivElement>(null);

  const editData = location.state?.receiptRecord;
  const isEditMode = !!editData;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (vendorContainerRef.current && !vendorContainerRef.current.contains(e.target as Node)) {
        setIsVendorDropdownOpen(false);
      }
      if (poContainerRef.current && !poContainerRef.current.contains(e.target as Node)) {
        setIsPoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setMetadataLoading(true);
        // 1. Fetch Vendors
        const { data: vData } = await supabase
          .from('vendors')
          .select('*')
          .order('vendor_name', { ascending: true });
        const normalizedVendors: VendorOption[] = (vData || []).map((v: any) => ({
          ...v,
          vendor_name: v.vendor_name || v.name || 'Unnamed Vendor',
          opening_balance: Number(v.opening_balance ?? v.openingBalance ?? v.balance ?? 0) || 0,
          balance_nature: v.balance_nature || 'Credit'
        }));
        setVendorOptions(normalizedVendors);

        // 2. Fetch Banks & COA
        const { data: bankData } = await supabase
          .from('banks')
          .select('id, bankName, accountTitle, accountNumber');
        const { data: coaData } = await supabase
          .from('chart_of_accounts')
          .select('account_code, account_title, control_code, category_code');

        if (bankData) setBankAccounts(bankData);
        if (coaData) setCoaAccounts(coaData);

        // 3. Fetch all Supplier Purchases
        const { data: purData } = await supabase
          .from('supplier_purchases')
          .select('*')
          .order('id', { ascending: false });

        if (purData) setPurchaseOptions(purData);

        // If in Edit Mode, restore state
        if (isEditMode && editData) {
          const vName = editData.customer_name || editData.customerName || '';
          setSelectedVendor(vName);
          setVendorSearchQuery(vName);
          const matchedVendor = normalizedVendors.find(
            (v) => v.vendor_name.toLowerCase() === vName.toLowerCase()
          );
          if (matchedVendor) setSelectedVendorObj(matchedVendor);

          const poRef = editData.original_invoice_no || editData.metadata?.linkedPurchaseNo || '';
          if (
            poRef === 'Opening Balance' ||
            poRef === 'OPENING_BALANCE' ||
            editData.metadata?.isOpeningBalance
          ) {
            setSelectedPurchaseNo('OPENING_BALANCE');
            setPoSearchQuery('Vendor Opening Balance');
          } else if (poRef) {
            setSelectedPurchaseNo(poRef);
            setPoSearchQuery(poRef);
            const cleanId = String(poRef).replace(/\D/g, '');
            const matchedPo = purData?.find((p) => p.purchase_no === poRef || String(p.id) === cleanId);
            if (matchedPo) setSelectedPurchaseObj(matchedPo);
          } else {
            setSelectedPurchaseNo('');
            setPoSearchQuery('-- General Vendor Balance Clearing (All Orders) --');
            setSelectedPurchaseObj(null);
          }

          calculateVendorBalances(vName, poRef, purData || [], editData.id, matchedVendor);
        } else {
          // Fetch existing VPV / VPR / PR vouchers to determine next gap-filled VPR-XXX number
          const { data: vpvRows } = await supabase
            .from('financial_vouchers')
            .select('voucher_no')
            .or('voucher_no.ilike.VPR-%,voucher_no.ilike.VPV-%,voucher_no.ilike.PR-%');

          const usedSeqs = new Set<number>();
          (vpvRows || []).forEach((v: any) => {
            const match = String(v.voucher_no || '').match(/(?:VPR|VPV|PR)-(\d+)/i);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > 0 && num < 100000) usedSeqs.add(num);
            }
          });
          let nextSeq = 1;
          while (usedSeqs.has(nextSeq)) {
            nextSeq++;
          }
          const nextVoucherNo = `VPR-${String(nextSeq).padStart(3, '0')}`;
          setGeneratedVoucherNo(nextVoucherNo);
        }
      } catch (err: any) {
        console.error(err.message);
        toast.error('Failed to load payment metadata: ' + err.message);
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, [isEditMode, editData]);

  // ── Calculate Live Balances for Vendor & Selected PO ───────────────────────
  const calculateVendorBalances = async (
    vendorName: string,
    poNumber: string,
    allPurchases: any[],
    currentEditVoucherId: number | null = null,
    vendorObjOverride: any = null
  ) => {
    if (!vendorName) {
      setVendorOpeningBalance(0);
      setVendorOpeningBalanceVoucherNo('');
      setVendorPurchasesGrossTotal(0);
      setVendorTotalOutstanding(0);
      setPoGrossBill(0);
      setPoPaidUpfront(0);
      setPoPastReceiptsPaid(0);
      setEffectiveDueForThisReceipt(0);
      setPoAllocationsMap({});
      return;
    }

    try {
      // 0. Resolve Vendor Opening Balance & Nature
      let vend = vendorObjOverride || selectedVendorObj;
      if (!vend || (vend.vendor_name || '').toLowerCase() !== vendorName.toLowerCase()) {
        vend = vendorOptions.find((v) => (v.vendor_name || '').toLowerCase() === vendorName.toLowerCase());
      }
      if (!vend) {
        const { data: vRecord } = await supabase
          .from('vendors')
          .select('*')
          .ilike('vendor_name', vendorName)
          .maybeSingle();
        if (vRecord) vend = vRecord;
      }

      const rawOb = Number(vend?.opening_balance ?? vend?.openingBalance ?? vend?.balance ?? 0) || 0;
      const isCredit = String(vend?.balance_nature || 'Credit').toLowerCase() === 'credit';
      const opBal = isCredit ? rawOb : -rawOb;
      setVendorOpeningBalance(opBal);

      // Check if there is an Opening Balance Voucher in financial_vouchers
      const { data: obVoucher } = await supabase
        .from('financial_vouchers')
        .select('id, voucher_no')
        .eq('customer_name', vendorName)
        .or('metadata->>isOpeningBalance.eq.true,voucher_no.ilike.OB%')
        .maybeSingle();

      const obVoucherNo = obVoucher?.voucher_no || 'OBV-001';
      setVendorOpeningBalanceVoucherNo(obVoucherNo);

      // 1. Fetch vendor's purchases sorted chronologically
      const vendorPurchases = allPurchases.filter(
        (p) => (p.supplier_name || p.vendor_name || '').toLowerCase() === vendorName.toLowerCase()
      );

      const sortedVendorPurchases = [...vendorPurchases].sort((a, b) => {
        const timeA = new Date(a.purchase_date || a.created_at || 0).getTime();
        const timeB = new Date(b.purchase_date || b.created_at || 0).getTime();
        if (timeA !== timeB) return timeA - timeB;

        const createdA = new Date(a.created_at || 0).getTime();
        const createdB = new Date(b.created_at || 0).getTime();
        if (createdA !== createdB) return createdA - createdB;

        return (Number(a.id) || 0) - (Number(b.id) || 0);
      });

      // 2. Fetch past payment vouchers for this vendor
      const { data: pastVouchers } = await supabase
        .from('financial_vouchers')
        .select('id, total_amount, original_invoice_no, metadata, voucher_no')
        .eq('customer_name', vendorName)
        .or(
          'voucher_type.eq.Cash Payment Voucher,voucher_type.eq.Bank Payment Voucher,voucher_type.eq.Cash & Bank Payment Voucher'
        );

      let totalPurchasesGross = 0;
      let totalPurchasesUpfrontPaid = 0;

      vendorPurchases.forEach((p) => {
        const gross = Number(p.total_amount) || 0;
        const paid = Number(p.cash_amount_paid || 0) + Number(p.bank_amount_paid || 0);
        totalPurchasesGross += gross;
        totalPurchasesUpfrontPaid += paid;
      });
      setVendorPurchasesGrossTotal(totalPurchasesGross);

      const allocations: Record<
        string,
        {
          gross: number;
          upfront: number;
          specificVouchers: number;
          generalAllocated: number;
          pastReceipts: number;
          due: number;
        }
      > = {};
      let totalVouchersPaid = 0;
      let unallocatedGeneralVouchers = 0;

      // Initialize Opening Balance allocation
      allocations['OPENING_BALANCE'] = {
        gross: Math.max(0, opBal),
        upfront: 0,
        specificVouchers: 0,
        generalAllocated: 0,
        pastReceipts: 0,
        due: Math.max(0, opBal)
      };

      // Initialize all POs
      sortedVendorPurchases.forEach((p) => {
        const key = p.purchase_no;
        const gross = Number(p.total_amount) || 0;
        const upfront = Number(p.cash_amount_paid || 0) + Number(p.bank_amount_paid || 0);
        allocations[key] = {
          gross,
          upfront,
          specificVouchers: 0,
          generalAllocated: 0,
          pastReceipts: 0,
          due: Math.max(0, gross - upfront)
        };
      });

      // Assign PO-specific vouchers and accumulate general unallocated vouchers
      (pastVouchers || []).forEach((v) => {
        if (currentEditVoucherId && v.id === currentEditVoucherId) return;
        const vAmt = Number(v.total_amount) || 0;
        totalVouchersPaid += vAmt;

        const vPoRef = v.original_invoice_no || v.metadata?.linkedPurchaseNo || '';
        const isOBPayment =
          vPoRef === 'Opening Balance' ||
          vPoRef === 'OPENING_BALANCE' ||
          vPoRef === obVoucherNo ||
          v.metadata?.isOpeningBalance;

        if (isOBPayment) {
          allocations['OPENING_BALANCE'].specificVouchers += vAmt;
        } else if (vPoRef) {
          const cleanVPoId = String(vPoRef).replace(/\D/g, '');
          const matchedPo = sortedVendorPurchases.find(
            (p) => p.purchase_no === vPoRef || String(p.id) === cleanVPoId
          );
          if (matchedPo && allocations[matchedPo.purchase_no]) {
            allocations[matchedPo.purchase_no].specificVouchers += vAmt;
          } else {
            unallocatedGeneralVouchers += vAmt;
          }
        } else {
          unallocatedGeneralVouchers += vAmt;
        }
      });

      // 3. Fetch Debit Notes (Purchase Returns) for this vendor
      const { data: debitNotes } = await supabase
        .from('purchase_returns')
        .select('id, total_amount, amount_paid, purchase_no')
        .eq('vendor_name', vendorName);

      (debitNotes || []).forEach((d) => {
        const dAmt = Math.max(0, (Number(d.total_amount) || 0) - (Number(d.amount_paid) || 0));
        if (dAmt <= 0) return;
        totalVouchersPaid += dAmt;

        const dPoRef = d.purchase_no || '';
        if (dPoRef) {
          const cleanDPoId = String(dPoRef).replace(/\D/g, '');
          const matchedPo = sortedVendorPurchases.find(
            (p) => p.purchase_no === dPoRef || String(p.id) === cleanDPoId
          );
          if (matchedPo && allocations[matchedPo.purchase_no]) {
            allocations[matchedPo.purchase_no].specificVouchers += dAmt;
          } else {
            unallocatedGeneralVouchers += dAmt;
          }
        } else {
          unallocatedGeneralVouchers += dAmt;
        }
      });

      // Extract overpayments
      sortedVendorPurchases.forEach((p) => {
        const key = p.purchase_no;
        const alloc = allocations[key];
        if (alloc) {
          const rawDue = alloc.gross - alloc.upfront - alloc.specificVouchers;
          if (rawDue < 0) {
            const overpayment = Math.abs(rawDue);
            unallocatedGeneralVouchers += overpayment;
            alloc.specificVouchers -= overpayment;
          }
        }
      });

      // Allocate general unallocated vouchers across open POs (FIFO order)
      let generalRemaining = unallocatedGeneralVouchers;
      sortedVendorPurchases.forEach((p) => {
        const key = p.purchase_no;
        const alloc = allocations[key];
        if (alloc) {
          const dueBeforeGeneral = Math.max(0, alloc.gross - alloc.upfront - alloc.specificVouchers);
          if (dueBeforeGeneral > 0 && generalRemaining > 0) {
            const toDistribute = Math.min(dueBeforeGeneral, generalRemaining);
            alloc.generalAllocated += toDistribute;
            generalRemaining -= toDistribute;
          }
          alloc.pastReceipts = alloc.specificVouchers + alloc.generalAllocated;
          alloc.due = alloc.gross - alloc.upfront - alloc.pastReceipts;
        }
      });

      // Allocate remaining against Opening Balance
      if (generalRemaining > 0 && allocations['OPENING_BALANCE']) {
        const obDueBefore = Math.max(
          0,
          allocations['OPENING_BALANCE'].gross - allocations['OPENING_BALANCE'].specificVouchers
        );
        if (obDueBefore > 0 && generalRemaining > 0) {
          const toDist = Math.min(obDueBefore, generalRemaining);
          allocations['OPENING_BALANCE'].generalAllocated += toDist;
          generalRemaining -= toDist;
        }
      }
      allocations['OPENING_BALANCE'].pastReceipts =
        allocations['OPENING_BALANCE'].specificVouchers + allocations['OPENING_BALANCE'].generalAllocated;
      allocations['OPENING_BALANCE'].due = Math.max(
        0,
        allocations['OPENING_BALANCE'].gross - allocations['OPENING_BALANCE'].pastReceipts
      );

      setPoAllocationsMap(allocations);

      const totalGrossLiability = opBal + totalPurchasesGross;
      const netVendorLiability = totalGrossLiability - totalPurchasesUpfrontPaid - totalVouchersPaid;
      setVendorTotalOutstanding(netVendorLiability);

      // If a specific PO or Opening Balance is selected
      if (poNumber === 'OPENING_BALANCE' || poNumber === 'Opening Balance') {
        const obAlloc = allocations['OPENING_BALANCE'];
        setPoGrossBill(obAlloc.gross);
        setPoPaidUpfront(0);
        setPoPastReceiptsPaid(obAlloc.pastReceipts);
        setEffectiveDueForThisReceipt(obAlloc.due);
      } else if (poNumber && allocations[poNumber]) {
        const currentAlloc = allocations[poNumber];
        setPoGrossBill(currentAlloc.gross);
        setPoPaidUpfront(currentAlloc.upfront);
        setPoPastReceiptsPaid(currentAlloc.pastReceipts);
        setEffectiveDueForThisReceipt(currentAlloc.due);
      } else {
        setPoGrossBill(totalGrossLiability);
        setPoPaidUpfront(totalPurchasesUpfrontPaid);
        setPoPastReceiptsPaid(totalVouchersPaid);
        setEffectiveDueForThisReceipt(netVendorLiability);
      }
    } catch (err: any) {
      console.error('Balance calculation error:', err);
    }
  };

  const handleSelectVendor = (vendor: VendorOption) => {
    const vName = vendor.vendor_name;
    setSelectedVendor(vName);
    setVendorSearchQuery(vName);
    setSelectedVendorObj(vendor);
    setIsVendorDropdownOpen(false);

    setSelectedPurchaseNo('');
    setPoSearchQuery('-- General Vendor Balance Clearing (All Orders) --');
    setSelectedPurchaseObj(null);

    calculateVendorBalances(vName, '', purchaseOptions, editData?.id || null, vendor);
  };

  const handleSelectPurchase = (poNo: string) => {
    setSelectedPurchaseNo(poNo);
    if (poNo === 'OPENING_BALANCE') {
      const obDue = poAllocationsMap['OPENING_BALANCE']?.due ?? vendorOpeningBalance;
      setPoSearchQuery(`Vendor Opening Balance (Due: Rs. ${formatMoney(obDue)})`);
      setSelectedPurchaseObj(null);
    } else if (poNo) {
      setPoSearchQuery(poNo);
      const cleanId = String(poNo).replace(/\D/g, '');
      const poObj = purchaseOptions.find((p) => p.purchase_no === poNo || String(p.id) === cleanId);
      setSelectedPurchaseObj(poObj || null);
    } else {
      setPoSearchQuery('-- General Vendor Balance Clearing (All Orders) --');
      setSelectedPurchaseObj(null);
    }
    setIsPoDropdownOpen(false);

    calculateVendorBalances(selectedVendor, poNo, purchaseOptions, editData?.id || null);
  };

  const filteredVendors = vendorOptions.filter(
    (v) =>
      (v.vendor_name || '').toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
      (v.contact_name || v.contact_person || '').toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
      (v.cell_no || v.phone_no || v.phone || '').toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
      (v.city || '').toLowerCase().includes(vendorSearchQuery.toLowerCase())
  );

  const vendorPurchasesList = purchaseOptions.filter(
    (p) =>
      selectedVendor &&
      (p.supplier_name || p.vendor_name || '').toLowerCase() === selectedVendor.toLowerCase()
  );

  const filteredPurchases = vendorPurchasesList.filter((p) => {
    if (!poSearchQuery || poSearchQuery.startsWith('-- General')) return true;
    return (
      (p.purchase_no || '').toLowerCase().includes(poSearchQuery.toLowerCase()) ||
      (p.purchase_date || '').toLowerCase().includes(poSearchQuery.toLowerCase()) ||
      (p.target_warehouse || '').toLowerCase().includes(poSearchQuery.toLowerCase())
    );
  });

  const validationSchema = Yup.object().shape({
    voucherNo: Yup.string().required('Receipt Voucher # is required'),
    voucherType: Yup.string().required('Payment method is required'),
    paymentDate: Yup.string().required('Payment date is required'),
    amount: Yup.number().when('voucherType', {
      is: (val: string) => val === 'By Cash' || val === 'By Bank',
      then: () =>
        Yup.number()
          .typeError('Amount must be a number')
          .min(1, 'Amount must be greater than 0')
          .required('Amount is required'),
      otherwise: () => Yup.number().nullable()
    }),
    cashAmount: Yup.number().when('voucherType', {
      is: 'Split',
      then: () => Yup.number().typeError('Cash must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable()
    }),
    bankAmount: Yup.number().when('voucherType', {
      is: 'Split',
      then: () => Yup.number().typeError('Bank must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable()
    }),
    selectedBankId: Yup.string().when('voucherType', {
      is: (val: string) => val === 'By Bank' || val === 'Split',
      then: () => Yup.string().required('Please select the source bank account'),
      otherwise: () => Yup.string().nullable()
    })
  });

  if (metadataLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl text-xs text-slate-800 dark:text-slate-200">
      {/* Header */}
      <ReceiptHeaderBar
        isEditMode={isEditMode}
        onNavigateToList={() =>
          navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Receipt/List`)
        }
      />

      <Formik
        initialValues={
          isEditMode && editData
            ? {
                voucherNo: editData.voucher_no || '',
                voucherType:
                  editData.voucher_type === 'Bank Payment Voucher'
                    ? 'By Bank'
                    : editData.voucher_type === 'Cash & Bank Payment Voucher' ||
                      (editData.metadata?.cashAmount && editData.metadata?.bankAmount)
                    ? 'Split'
                    : 'By Cash',
                selectedBankId: editData.metadata?.selectedBankId || '',
                paymentDate: editData.voucher_date || new Date().toISOString().split('T')[0],
                amount: editData.total_amount || '',
                cashAmount: editData.metadata?.cashAmount || '',
                bankAmount: editData.metadata?.bankAmount || '',
                notes: editData.narration || ''
              }
            : {
                voucherNo: generatedVoucherNo,
                voucherType: 'By Cash',
                selectedBankId: '',
                paymentDate: new Date().toISOString().split('T')[0],
                amount: '',
                cashAmount: '',
                bankAmount: '',
                notes: ''
              }
        }
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          if (!selectedVendor) {
            toast.error('Validation Error: Please select a wholesale vendor first!');
            return;
          }

          if (values.voucherNo) {
            let query = supabase.from('financial_vouchers').select('id').eq('voucher_no', values.voucherNo);
            if (isEditMode && editData?.id) {
              query = query.neq('id', editData.id);
            }
            const { data: existingRecords, error: checkError } = await query;
            if (checkError) {
              toast.error('Failed to validate voucher number.');
              return;
            }
            if (existingRecords && existingRecords.length > 0) {
              toast.error('Receipt Voucher # already exists!');
              return;
            }
          }

          let finalAmount = 0;
          let cashPortion = 0;
          let bankPortion = 0;

          if (values.voucherType === 'By Cash') {
            cashPortion = Number(values.amount) || 0;
            finalAmount = cashPortion;
          } else if (values.voucherType === 'By Bank') {
            bankPortion = Number(values.amount) || 0;
            finalAmount = bankPortion;
            if (!values.selectedBankId) {
              toast.error('Please select the source bank account.');
              return;
            }
          } else if (values.voucherType === 'Split') {
            cashPortion = Number(values.cashAmount) || 0;
            bankPortion = Number(values.bankAmount) || 0;
            finalAmount = cashPortion + bankPortion;
            if (!values.selectedBankId && bankPortion > 0) {
              toast.error('Please select the source bank account for the bank transfer portion.');
              return;
            }
          }

          if (finalAmount <= 0) {
            toast.error('Please enter a valid disbursement amount greater than 0.');
            return;
          }

          if (finalAmount > effectiveDueForThisReceipt + 1) {
            toast.error(
              `Error: Disbursement amount (Rs. ${formatMoney(
                finalAmount
              )}) exceeds the total payable due (Rs. ${formatMoney(effectiveDueForThisReceipt)}).`
            );
            return;
          }

          try {
            setLoading(true);

            // 1. Resolve Chart of Accounts
            const cashCoa = coaAccounts.find(
              (c: any) =>
                String(c.control_code || '').toLowerCase().includes('cash') ||
                String(c.account_title || '').toLowerCase().includes('cash')
            );

            const selectedBankObj = bankAccounts.find(
              (b: any) =>
                String(b.id) === String(values.selectedBankId) ||
                String(b.bankName) === String(values.selectedBankId)
            );
            const bankCoa = coaAccounts.find(
              (c: any) =>
                (selectedBankObj &&
                  (String(c.linked_bank_id) === String(selectedBankObj.id) ||
                    String(c.account_code) === String(selectedBankObj.accountNumber) ||
                    String(c.account_title || '')
                      .toLowerCase()
                      .includes(String(selectedBankObj.bankName || '').toLowerCase()))) ||
                String(c.control_code || '').toLowerCase().includes('bank')
            );

            const payCoa = coaAccounts.find(
              (c: any) =>
                String(c.control_code || '').toLowerCase().includes('creditor') ||
                String(c.control_code || '').toLowerCase().includes('payable') ||
                String(c.account_title || '').toLowerCase().includes('payable') ||
                String(c.account_title || '').toLowerCase().includes('creditor')
            );

            const vendorAccountCode = payCoa
              ? String(payCoa.account_code)
              : cashCoa
              ? String(cashCoa.account_code)
              : '2010';
            const cashAccountCode = cashCoa ? String(cashCoa.account_code) : '1010';
            const bankAccountCode = bankCoa
              ? String(bankCoa.account_code)
              : selectedBankObj?.accountNumber || '1015';

            let balancedJournalItems: any[] = [];
            let voucherTypeRecord = 'Cash Payment Voucher';

            if (values.voucherType === 'By Cash') {
              voucherTypeRecord = 'Cash Payment Voucher';
              balancedJournalItems = [
                {
                  accountCode: vendorAccountCode,
                  description: `Settled balance due to ${selectedVendor}`,
                  debit: finalAmount,
                  credit: 0
                },
                {
                  accountCode: cashAccountCode,
                  description: `Fund disbursed via ${values.voucherNo}`,
                  debit: 0,
                  credit: finalAmount
                }
              ];
            } else if (values.voucherType === 'By Bank') {
              voucherTypeRecord = 'Bank Payment Voucher';
              balancedJournalItems = [
                {
                  accountCode: vendorAccountCode,
                  description: `Settled balance due to ${selectedVendor}`,
                  debit: finalAmount,
                  credit: 0
                },
                {
                  accountCode: bankAccountCode,
                  description: `Fund disbursed via ${values.voucherNo}`,
                  debit: 0,
                  credit: finalAmount
                }
              ];
            } else {
              voucherTypeRecord = 'Cash & Bank Payment Voucher';
              balancedJournalItems = [
                {
                  accountCode: vendorAccountCode,
                  description: `Settled balance due to ${selectedVendor}`,
                  debit: finalAmount,
                  credit: 0
                },
                ...(cashPortion > 0
                  ? [
                      {
                        accountCode: cashAccountCode,
                        description: `Cash disbursement via ${values.voucherNo}`,
                        debit: 0,
                        credit: cashPortion
                      }
                    ]
                  : []),
                ...(bankPortion > 0
                  ? [
                      {
                        accountCode: bankAccountCode,
                        description: `Bank disbursement via ${values.voucherNo}`,
                        debit: 0,
                        credit: bankPortion
                      }
                    ]
                  : [])
              ];
            }

            const isOBSelected = selectedPurchaseNo === 'OPENING_BALANCE';
            const methodStr =
              values.voucherType === 'Split'
                ? ` | Split (Cash: Rs. ${formatMoney(cashPortion)} + Bank: Rs. ${formatMoney(bankPortion)} via ${
                    selectedBankObj?.bankName || values.selectedBankId
                  })`
                : values.voucherType === 'By Bank'
                ? ` | Source Bank: ${selectedBankObj?.bankName || values.selectedBankId}`
                : ' | Mode: Cash Drawer';

            const poInfoStr = isOBSelected
              ? ` | Linked: Vendor Opening Balance (Ref: ${vendorOpeningBalanceVoucherNo || 'OBV-001'})`
              : selectedPurchaseNo
              ? ` | Linked PO: ${selectedPurchaseNo}`
              : ' | General Vendor Settlement';
            const compositeNarration = `Paid to Vendor: ${selectedVendor}${poInfoStr}${methodStr} | Remarks: ${values.notes.trim()}`.trim();

            const payload = {
              voucher_no: values.voucherNo,
              voucher_type: voucherTypeRecord,
              voucher_date: values.paymentDate,
              customerName: selectedVendor,
              customer_name: selectedVendor,
              original_invoice_no: isOBSelected
                ? vendorOpeningBalanceVoucherNo || 'OBV-001'
                : selectedPurchaseNo || null,
              narration: compositeNarration,
              notes: compositeNarration,
              total_amount: finalAmount,
              items: balancedJournalItems,
              metadata: {
                selectedBankId:
                  values.voucherType === 'By Bank' || values.voucherType === 'Split'
                    ? values.selectedBankId
                    : null,
                selectedBankTitle: selectedBankObj
                  ? `${selectedBankObj.bankName} - ${selectedBankObj.accountTitle}`
                  : null,
                linkedPurchaseNo: isOBSelected ? 'Opening Balance' : selectedPurchaseNo || null,
                isOpeningBalance: isOBSelected,
                isOpeningBalanceSettlement: isOBSelected,
                cashAmount:
                  values.voucherType === 'Split'
                    ? cashPortion
                    : values.voucherType === 'By Cash'
                    ? finalAmount
                    : 0,
                bankAmount:
                  values.voucherType === 'Split'
                    ? bankPortion
                    : values.voucherType === 'By Bank'
                    ? finalAmount
                    : 0,
                paymentTerm: values.voucherType,
                moduleSource: 'purchase_receipt'
              }
            };

            // Insert / Update in financial_vouchers
            if (isEditMode) {
              const { error: updateErr } = await supabase
                .from('financial_vouchers')
                .update(payload)
                .eq('id', editData.id);
              if (updateErr) throw updateErr;
            } else {
              const { error: insertErr } = await supabase.from('financial_vouchers').insert([payload]);
              if (insertErr) throw insertErr;
            }

            // 2. Sync with supplier_purchases if a specific PO was linked
            if (selectedPurchaseNo && !isOBSelected) {
              const cleanId = String(selectedPurchaseNo).replace(/\D/g, '');
              const targetPo = purchaseOptions.find(
                (p) => p.purchase_no === selectedPurchaseNo || String(p.id) === cleanId
              );

              if (targetPo) {
                const { data: allVouchersForPo } = await supabase
                  .from('financial_vouchers')
                  .select('id, total_amount')
                  .eq('customer_name', selectedVendor)
                  .or(`original_invoice_no.eq.${selectedPurchaseNo},original_invoice_no.eq.${targetPo.purchase_no}`);

                const totalVoucherSum = (allVouchersForPo || []).reduce(
                  (acc: number, v: any) => acc + (Number(v.total_amount) || 0),
                  0
                );
                const upfrontPaid =
                  Number(targetPo.cash_amount_paid || 0) + Number(targetPo.bank_amount_paid || 0);
                const newTotalPaid = upfrontPaid + totalVoucherSum;
                const newRemaining = Math.max(0, (Number(targetPo.total_amount) || 0) - newTotalPaid);

                await supabase
                  .from('supplier_purchases')
                  .update({
                    amount_paid: newTotalPaid,
                    remaining_balance: newRemaining
                  })
                  .eq('id', targetPo.id);
              }
            } else if (isOBSelected && selectedVendorObj?.id) {
              try {
                const currentVendBal = Number(selectedVendorObj?.balance ?? vendorOpeningBalance);
                const newVendBal = Math.max(0, currentVendBal - finalAmount);
                await supabase
                  .from('vendors')
                  .update({
                    balance: newVendBal,
                    currentBalance: newVendBal
                  })
                  .eq('id', selectedVendorObj.id);
              } catch (vSyncErr) {
                console.warn('Vendor balance update note:', vSyncErr);
              }
            }

            toast.success(
              isEditMode ? 'Purchase payment voucher updated!' : 'Vendor payment receipt processed successfully!'
            );
            navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Receipt/List`);
          } catch (err: any) {
            toast.error('Error processing payment: ' + err.message);
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ handleChange, handleBlur, setFieldValue, values, errors, touched }) => {
          const currentTotalAmt =
            values.voucherType === 'Split'
              ? Number(values.cashAmount || 0) + Number(values.bankAmount || 0)
              : Number(values.amount) || 0;

          return (
            <Form className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* ── LEFT COLUMN: FORM INPUTS (7 COLS) ── */}
              <div className="lg:col-span-7 bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-5">
                {/* Row 1: Voucher # & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Receipt Voucher # <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="voucherNo"
                      value={values.voucherNo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-slate-800 text-black dark:text-white outline-none focus:border-primary cursor-not-allowed ${
                        touched.voucherNo && errors.voucherNo
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                      placeholder="Auto-generated"
                      readOnly
                    />
                    {touched.voucherNo && errors.voucherNo && (
                      <div className="text-[10px] font-bold text-rose-500 mt-0.5 px-1">
                        {errors.voucherNo as string}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
                      Payment Date: *
                    </label>
                    <input
                      type="date"
                      name="paymentDate"
                      onChange={handleChange}
                      value={values.paymentDate}
                      className={`w-full border rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-800 font-bold outline-none text-slate-900 dark:text-white text-xs ${
                        touched.paymentDate && errors.paymentDate
                          ? 'border-red-500'
                          : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Row 2: Target Wholesale Vendor (Searchable Autocomplete Input) */}
                <VendorAutocompleteInput
                  containerRef={vendorContainerRef}
                  isEditMode={isEditMode}
                  vendorSearchQuery={vendorSearchQuery}
                  setVendorSearchQuery={setVendorSearchQuery}
                  isVendorDropdownOpen={isVendorDropdownOpen}
                  setIsVendorDropdownOpen={setIsVendorDropdownOpen}
                  highlightedVendorIndex={highlightedVendorIndex}
                  setHighlightedVendorIndex={setHighlightedVendorIndex}
                  selectedVendor={selectedVendor}
                  filteredVendors={filteredVendors}
                  onSelectVendor={handleSelectVendor}
                  onClearVendor={() => {
                    setSelectedVendor('');
                    setVendorSearchQuery('');
                    setSelectedVendorObj(null);
                    setSelectedPurchaseNo('');
                    setPoSearchQuery('');
                    calculateVendorBalances('', '', purchaseOptions, editData?.id || null);
                  }}
                />

                {/* Row 3: Settle Specific Purchase Order (Searchable Autocomplete Input) */}
                {selectedVendor && (
                  <PurchaseOrderAutocompleteInput
                    containerRef={poContainerRef}
                    selectedPurchaseNo={selectedPurchaseNo}
                    poSearchQuery={poSearchQuery}
                    setPoSearchQuery={setPoSearchQuery}
                    isPoDropdownOpen={isPoDropdownOpen}
                    setIsPoDropdownOpen={setIsPoDropdownOpen}
                    highlightedPoIndex={highlightedPoIndex}
                    setHighlightedPoIndex={setHighlightedPoIndex}
                    vendorOpeningBalance={vendorOpeningBalance}
                    vendorOpeningBalanceVoucherNo={vendorOpeningBalanceVoucherNo}
                    poAllocationsMap={poAllocationsMap}
                    filteredPurchases={filteredPurchases}
                    onSelectPurchase={handleSelectPurchase}
                  />
                )}

                {/* Row 4-6: Payment Method & Amounts */}
                <PaymentMethodAmountSection
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  bankAccounts={bankAccounts}
                  effectiveDueForThisReceipt={effectiveDueForThisReceipt}
                />

                {/* Submit / Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Receipt/List`)
                    }
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedVendor}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-8 font-black text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                  >
                    {loading ? (
                      <Spinner color="border-white" size="w-4 h-4" />
                    ) : (
                      <span>{isEditMode ? 'Update Voucher' : 'Post & Disburse Receipt'}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* ── RIGHT COLUMN: LIVE FINANCIAL BREAKDOWN (5 COLS) ── */}
              <div className="lg:col-span-5 space-y-4">
                {/* 1. Vendor Profile Card */}
                <PayeeVendorProfileCard
                  selectedVendor={selectedVendor}
                  selectedVendorObj={selectedVendorObj}
                />

                {/* 2. Interactive Settlement & Balance Card */}
                {selectedVendor && (
                  <SettlementBreakdownCard
                    selectedPurchaseNo={selectedPurchaseNo}
                    vendorOpeningBalanceVoucherNo={vendorOpeningBalanceVoucherNo}
                    vendorOpeningBalance={vendorOpeningBalance}
                    vendorPurchasesGrossTotal={vendorPurchasesGrossTotal}
                    poGrossBill={poGrossBill}
                    poPaidUpfront={poPaidUpfront}
                    poPastReceiptsPaid={poPastReceiptsPaid}
                    effectiveDueForThisReceipt={effectiveDueForThisReceipt}
                    vendorTotalOutstanding={vendorTotalOutstanding}
                    currentTotalAmt={currentTotalAmt}
                  />
                )}
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

export default AddPurchaseReceipt;
