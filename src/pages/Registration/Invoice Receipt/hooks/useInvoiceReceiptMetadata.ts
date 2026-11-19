import { useState, useEffect, useRef } from 'react';
import { supabase, fetchAllPages } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { CustomerItem, BankAccountItem, CoaAccountItem, SalesInvoiceItem, InvoiceAllocation } from '../types/invoiceReceiptTypes';
import { calculateCustomerBalances } from '../services/invoiceReceiptService';

export function useInvoiceReceiptMetadata(isEditMode: boolean, editData: any) {
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [customersList, setCustomersList] = useState<CustomerItem[]>([]);
  const [salesInvoicesList, setSalesInvoicesList] = useState<SalesInvoiceItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<CoaAccountItem[]>([]);

  // Customer Autocomplete State
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<CustomerItem | null>(null);

  // Invoice Autocomplete State
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [isInvoiceDropdownOpen, setIsInvoiceDropdownOpen] = useState(false);
  const [highlightedInvoiceIndex, setHighlightedInvoiceIndex] = useState(0);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string>('');
  const [selectedInvoiceObj, setSelectedInvoiceObj] = useState<SalesInvoiceItem | null>(null);

  const [generatedVoucherNo, setGeneratedVoucherNo] = useState('');

  // Balances
  const [customerTotalOutstanding, setCustomerTotalOutstanding] = useState<number>(0);
  const [customerOpeningBalance, setCustomerOpeningBalance] = useState<number>(0);
  const [invGrossBill, setInvGrossBill] = useState<number>(0);
  const [invPaidUpfront, setInvPaidUpfront] = useState<number>(0);
  const [invPastReceiptsPaid, setInvPastReceiptsPaid] = useState<number>(0);
  const [invReturnsDeducted, setInvReturnsDeducted] = useState<number>(0);
  const [effectiveDueForThisReceipt, setEffectiveDueForThisReceipt] = useState<number>(0);
  const [invAllocationsMap, setInvAllocationsMap] = useState<Record<string, InvoiceAllocation>>({});

  const customerContainerRef = useRef<HTMLDivElement>(null);
  const invoiceContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerContainerRef.current && !customerContainerRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
      if (invoiceContainerRef.current && !invoiceContainerRef.current.contains(e.target as Node)) {
        setIsInvoiceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerCalculateBalances = async (cName: string, invRef: string, invList: SalesInvoiceItem[], custObj?: CustomerItem | null) => {
    const cust = custObj !== undefined ? custObj : (selectedCustomerObj || customersList.find(c => (c.customer_name || '').toLowerCase() === cName.toLowerCase()));
    const openingBal = Number(cust?.opening_balance ?? 0);
    const result = await calculateCustomerBalances(cName, invRef, invList, editData?.id || null, openingBal);
    setCustomerTotalOutstanding(result.customerTotalOutstanding);
    setCustomerOpeningBalance(result.customerOpeningBalance);
    setInvGrossBill(result.invGrossBill);
    setInvPaidUpfront(result.invPaidUpfront);
    setInvPastReceiptsPaid(result.invPastReceiptsPaid);
    setInvReturnsDeducted(result.invReturnsDeducted);
    setEffectiveDueForThisReceipt(result.effectiveDueForThisReceipt);
    setInvAllocationsMap(result.invAllocationsMap);
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setMetadataLoading(true);

        // 1. Fetch Customers
        const { data: custData } = await fetchAllPages(supabase.from('customers').select('*'));
        const normalizedCust: CustomerItem[] = (custData || []).map((c: any) => ({
          ...c,
          customer_name: c.customerName || c.customername || c.customer_name || c.name || 'Unnamed Customer',
          customer_code: c.customer_code || c.customerCode || '',
          contact_name: c.company || c.contact_person || c.contact_name || '',
          phone: c.primaryPhone || c.phone || c.cell_no || '',
          city: c.city || '',
          opening_balance: Number(c.opening_balance ?? c.balance ?? c.currentBalance ?? 0)
        })).sort((a: any, b: any) => (a.customer_name || '').localeCompare(b.customer_name || ''));
        setCustomersList(normalizedCust);

        // 2. Fetch Banks & COA
        const { data: bankData } = await fetchAllPages(supabase.from('banks').select('id, bankName, accountTitle, accountNumber'));
        const { data: coaData } = await fetchAllPages(supabase.from('chart_of_accounts').select('account_code, account_title, control_code, category_code'));

        if (bankData) setBankAccounts(bankData);
        if (coaData) setCoaAccounts(coaData);

        // 3. Fetch Sales Invoices
        const { data: invData } = await fetchAllPages(
          supabase
            .from('sales_invoices')
            .select('*')
            .order('id', { ascending: false })
        );

        const safeInvoices: SalesInvoiceItem[] = invData || [];
        setSalesInvoicesList(safeInvoices);

        // If in Edit Mode, restore state
        if (isEditMode && editData) {
          const cName = editData.customerName || editData.customer_name || '';
          setSelectedCustomer(cName);
          setCustomerSearchQuery(cName);
          const matchedCust = normalizedCust.find(c => c.customer_name.toLowerCase() === cName.toLowerCase());
          if (matchedCust) setSelectedCustomerObj(matchedCust);

          const invRef = editData.original_invoice_no || editData.metadata?.linkedInvoiceNo || '';
          if (invRef) {
            setSelectedInvoiceNo(invRef);
            setInvoiceSearchQuery(invRef);
            const cleanId = String(invRef).replace(/\D/g, '');
            const matchedInv = safeInvoices.find(i => String(i.id) === cleanId || `INV-${String(i.id).padStart(4, '0')}` === invRef);
            if (matchedInv) setSelectedInvoiceObj(matchedInv);
          } else {
            setSelectedInvoiceNo('');
            setInvoiceSearchQuery('-- General Customer Balance Clearing (All Invoices) --');
            setSelectedInvoiceObj(null);
          }

          await triggerCalculateBalances(cName, invRef, safeInvoices);
        } else {
          // Fetch highest CRV number
          const { data: crvRows } = await supabase
            .from('financial_vouchers')
            .select('voucher_no')
            .ilike('voucher_no', 'CRV-%');

          let maxCrvSeq = 0;
          (crvRows || []).forEach((v: any) => {
            const match = String(v.voucher_no || '').match(/CRV-(\d+)/i);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (num > maxCrvSeq) maxCrvSeq = num;
            }
          });
          setGeneratedVoucherNo(`CRV-${String(maxCrvSeq + 1).padStart(3, '0')}`);
        }
      } catch (err: any) {
        console.error(err.message);
        toast.error('Failed to load invoice receipt metadata: ' + err.message);
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, [isEditMode, editData]);

  const handleSelectCustomer = (customer: CustomerItem) => {
    const cName = customer.customer_name;
    setSelectedCustomer(cName);
    setCustomerSearchQuery(cName);
    setSelectedCustomerObj(customer);
    setIsCustomerDropdownOpen(false);

    setSelectedInvoiceNo('');
    setInvoiceSearchQuery('-- General Customer Balance Clearing (All Invoices) --');
    setSelectedInvoiceObj(null);

    triggerCalculateBalances(cName, '', salesInvoicesList, customer);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer('');
    setCustomerSearchQuery('');
    setSelectedCustomerObj(null);
    setSelectedInvoiceNo('');
    setInvoiceSearchQuery('');
    triggerCalculateBalances('', '', salesInvoicesList, null);
  };

  const handleSelectInvoice = (invNo: string) => {
    setSelectedInvoiceNo(invNo);
    setInvoiceSearchQuery(invNo ? (invNo === 'OPENING_BALANCE' ? 'OPENING BALANCE' : invNo) : '-- General Customer Balance Clearing (All Invoices) --');
    setIsInvoiceDropdownOpen(false);

    if (invNo && invNo !== 'OPENING_BALANCE') {
      const cleanId = String(invNo).replace(/\D/g, '');
      const invObj = salesInvoicesList.find(i => String(i.id) === cleanId || `INV-${String(i.id).padStart(4, '0')}` === invNo);
      setSelectedInvoiceObj(invObj || null);
    } else {
      setSelectedInvoiceObj(null);
    }

    triggerCalculateBalances(selectedCustomer, invNo, salesInvoicesList, selectedCustomerObj);
  };

  const filteredCustomers = customersList.filter(c =>
    (c.customer_name || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (c.customer_code || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (c.contact_name || c.contact_person || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (c.cell_no || c.phone_no || c.phone || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  const customerInvoicesList = salesInvoicesList.filter(i =>
    selectedCustomer && (i.customer_name || i.customerName || '').toLowerCase() === selectedCustomer.toLowerCase()
  );

  const filteredInvoices = customerInvoicesList.filter(i => {
    if (!invoiceSearchQuery || invoiceSearchQuery.startsWith('-- General')) return true;
    const invFormatted = `INV-${String(i.id).padStart(4, '0')}`;
    return (
      invFormatted.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
      String(i.id).includes(invoiceSearchQuery) ||
      (i.invoice_date || '').toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
      (i.dispatch_warehouse || '').toLowerCase().includes(invoiceSearchQuery.toLowerCase())
    );
  });

  return {
    metadataLoading,
    customersList,
    bankAccounts,
    coaAccounts,
    salesInvoicesList,
    customerSearchQuery,
    setCustomerSearchQuery,
    isCustomerDropdownOpen,
    setIsCustomerDropdownOpen,
    highlightedCustomerIndex,
    setHighlightedCustomerIndex,
    selectedCustomer,
    selectedCustomerObj,
    handleSelectCustomer,
    handleClearCustomer,
    filteredCustomers,
    customerContainerRef,
    invoiceSearchQuery,
    setInvoiceSearchQuery,
    isInvoiceDropdownOpen,
    setIsInvoiceDropdownOpen,
    highlightedInvoiceIndex,
    setHighlightedInvoiceIndex,
    selectedInvoiceNo,
    selectedInvoiceObj,
    handleSelectInvoice,
    filteredInvoices,
    invoiceContainerRef,
    generatedVoucherNo,
    customerTotalOutstanding,
    customerOpeningBalance,
    invGrossBill,
    invPaidUpfront,
    invPastReceiptsPaid,
    invReturnsDeducted,
    effectiveDueForThisReceipt,
    invAllocationsMap
  };
}
