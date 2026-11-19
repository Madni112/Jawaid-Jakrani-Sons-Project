import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { ReturnReceiptHeader } from './components/ReturnReceiptHeader';
import { ReturnReceiptCustomerSelect } from './components/ReturnReceiptCustomerSelect';
import { ReturnReceiptNoteSelect } from './components/ReturnReceiptNoteSelect';
import { ReturnReceiptPaymentGateway } from './components/ReturnReceiptPaymentGateway';
import { ReturnReceiptSettlementCard } from './components/ReturnReceiptSettlementCard';
import { calculateCustomerReturnBalances } from './services/returnReceiptBalanceService';
import { submitSalesReturnReceiptAction } from './services/returnReceiptSubmitService';

const SalesReturnReceiptAdd: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useAuth();

  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [returnOptions, setReturnOptions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<any[]>([]);

  // Customer Autocomplete State
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<any>(null);

  // Return Note Autocomplete State
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [isReturnDropdownOpen, setIsReturnDropdownOpen] = useState(false);
  const [highlightedReturnIndex, setHighlightedReturnIndex] = useState(0);
  const [selectedReturnNo, setSelectedReturnNo] = useState<string>('');
  const [selectedReturnObj, setSelectedReturnObj] = useState<any>(null);

  const [generatedReceiptNo, setGeneratedReceiptNo] = useState('');

  // Balances
  const [customerOpeningBalance, setCustomerOpeningBalance] = useState<number>(0);
  const [customerInvoiceUnpaidDebt, setCustomerInvoiceUnpaidDebt] = useState<number>(0);
  const [customerReceivableBalance, setCustomerReceivableBalance] = useState<number>(0);
  const [customerTotalOutstandingReceivable, setCustomerTotalOutstandingReceivable] = useState<number>(0);
  const [returnGrossBill, setReturnGrossBill] = useState<number>(0);
  const [returnCreditAdjusted, setReturnCreditAdjusted] = useState<number>(0);
  const [returnPaidUpfront, setReturnPaidUpfront] = useState<number>(0);
  const [returnPastReceiptsPaid, setReturnPastReceiptsPaid] = useState<number>(0);
  const [effectiveDueForThisReceipt, setEffectiveDueForThisReceipt] = useState<number>(0);
  const [returnAllocationsMap, setReturnAllocationsMap] = useState<Record<string, any>>({});

  const [shouldPrintAfterSave, setShouldPrintAfterSave] = useState(false);

  const customerContainerRef = useRef<HTMLDivElement>(null);
  const returnContainerRef = useRef<HTMLDivElement>(null);

  const editData = location.state?.receiptRecord || location.state?.item || location.state?.record;
  const isEditMode = Boolean(editData);

  const formatMoney = (val: number | string | undefined | null): string => {
    const num = Number(val) || 0;
    if (Number.isInteger(num)) {
      return num.toLocaleString('en-US');
    }
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerContainerRef.current && !customerContainerRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
      if (returnContainerRef.current && !returnContainerRef.current.contains(e.target as Node)) {
        setIsReturnDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runBalanceCalculation = async (
    custName: string,
    rtnNum: string,
    allRtns: any[],
    editId: number | null = null
  ) => {
    const res = await calculateCustomerReturnBalances(custName, rtnNum, allRtns, editId);
    setCustomerOpeningBalance(res.customerOpeningBalance);
    setCustomerInvoiceUnpaidDebt(res.customerInvoiceUnpaidDebt);
    setCustomerReceivableBalance(res.customerReceivableBalance);
    setCustomerTotalOutstandingReceivable(res.customerTotalOutstandingReceivable);
    setReturnGrossBill(res.returnGrossBill);
    setReturnCreditAdjusted(res.returnCreditAdjusted);
    setReturnPaidUpfront(res.returnPaidUpfront);
    setReturnPastReceiptsPaid(res.returnPastReceiptsPaid);
    setEffectiveDueForThisReceipt(res.effectiveDueForThisReceipt);
    setReturnAllocationsMap(res.returnAllocationsMap);
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setMetadataLoading(true);

        const [cRes, invRes, rRes, bankRes, coaRes] = await Promise.all([
          fetchAllPages(supabase.from('customers').select('*')),
          fetchAllPages(supabase.from('sales_invoices').select('id, customer_name')),
          fetchAllPages(supabase.from('sales_returns').select('*').order('id', { ascending: false })),
          fetchAllPages(supabase.from('banks').select('id, bankName, accountTitle, accountNumber')),
          fetchAllPages(supabase.from('chart_of_accounts').select('account_code, account_title, control_code, category_code'))
        ]);

        const cData = cRes.data || [];
        const invData = invRes.data || [];
        const rData = rRes.data || [];
        const bankData = bankRes.data || [];
        const coaData = coaRes.data || [];

        const customerMap = new Map<string, any>();

        (cData || []).forEach((c: any) => {
          const name = (c.customername || c.customerName || c.customer_name || c.name || '').trim();
          if (name) {
            customerMap.set(name.toLowerCase(), {
              id: c.id,
              customer_name: name,
              customer_code: c.customer_code || c.customerCode || '',
              contact_name: c.company || c.contact_name || '',
              phone: c.phone || c.primaryPhone || c.cell_no || '',
              city: c.city || '',
              address: c.address || '',
              opening_balance: Number(c.opening_balance ?? c.balance ?? c.currentBalance ?? 0)
            });
          }
        });

        (invData || []).forEach((inv: any) => {
          const name = (inv.customer_name || '').trim();
          if (name && !customerMap.has(name.toLowerCase())) {
            customerMap.set(name.toLowerCase(), {
              id: `inv-${inv.id}`,
              customer_name: name,
              contact_name: '',
              phone: '',
              city: '',
              address: ''
            });
          }
        });

        (rData || []).forEach((r: any) => {
          const name = (r.customer_name || '').trim();
          if (name && !customerMap.has(name.toLowerCase())) {
            customerMap.set(name.toLowerCase(), {
              id: `rtn-${r.id}`,
              customer_name: name,
              contact_name: '',
              phone: '',
              city: '',
              address: ''
            });
          }
        });

        const normalizedCustomers = Array.from(customerMap.values()).sort((a, b) =>
          a.customer_name.localeCompare(b.customer_name)
        );
        setCustomerOptions(normalizedCustomers);

        if (bankData) setBankAccounts(bankData);
        if (coaData) setCoaAccounts(coaData);
        if (rData) setReturnOptions(rData);

        if (isEditMode && editData) {
          const cName = editData.customer_name || '';
          setSelectedCustomer(cName);
          setCustomerSearchQuery(cName);
          const matchedCust = normalizedCustomers.find(
            (c) => c.customer_name.toLowerCase() === cName.toLowerCase()
          );
          if (matchedCust) setSelectedCustomerObj(matchedCust);

          const rRef = editData.return_no || editData.invoice_no || editData.original_invoice_no || '';
          if (rRef) {
            setSelectedReturnNo(rRef);
            setReturnSearchQuery(rRef);
            const matchedReturn = rData?.find(
              (r) =>
                r.return_no === rRef ||
                r.invoice_no === rRef ||
                String(r.id) === String(editData.sales_return_id)
            );
            if (matchedReturn) setSelectedReturnObj(matchedReturn);
          } else {
            setSelectedReturnNo('');
            setReturnSearchQuery('-- General Customer Balance Payout (All Return Notes) --');
            setSelectedReturnObj(null);
          }

          runBalanceCalculation(cName, rRef, rData || [], editData.id);
        } else {
          const passedReturnNo =
            location.state?.selectedReturnNo ||
            location.state?.returnNo ||
            location.state?.prefillReturn?.return_no ||
            (location.state?.prefillReturn?.id
              ? `RTN-${String(location.state.prefillReturn.id).padStart(4, '0')}`
              : '');
          const passedCustName =
            location.state?.selectedCustomer ||
            location.state?.customerName ||
            location.state?.prefillReturn?.customer_name ||
            '';

          if (passedCustName) {
            setSelectedCustomer(passedCustName);
            setCustomerSearchQuery(passedCustName);
            const matchedCust = normalizedCustomers.find(
              (c) => c.customer_name.toLowerCase() === passedCustName.toLowerCase()
            );
            if (matchedCust) setSelectedCustomerObj(matchedCust);
          }

          if (passedReturnNo) {
            setSelectedReturnNo(passedReturnNo);
            setReturnSearchQuery(passedReturnNo);
            const matchedReturn = rData?.find(
              (r) =>
                r.return_no === passedReturnNo ||
                r.invoice_no === passedReturnNo ||
                String(r.id) === String(location.state?.prefillReturn?.id) ||
                `RTN-${String(r.id).padStart(4, '0')}` === passedReturnNo
            );
            if (matchedReturn) setSelectedReturnObj(matchedReturn);
          }

          if (passedCustName) {
            runBalanceCalculation(passedCustName, passedReturnNo, rData || []);
          }

          const { data: cpvRows } = await supabase
            .from('financial_vouchers')
            .select('voucher_no')
            .ilike('voucher_no', 'CPV-%');

          let maxCpvSeq = 0;
          (cpvRows || []).forEach((v) => {
            const match = String(v.voucher_no || '').match(/CPV-(\d+)/i);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (num > maxCpvSeq) maxCpvSeq = num;
            }
          });
          setGeneratedReceiptNo(`CPV-${String(maxCpvSeq + 1).padStart(3, '0')}`);
        }
      } catch (err: any) {
        console.error(err.message);
        toast.error('Failed to load sales return metadata: ' + err.message);
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, [isEditMode, editData]);

  // Customer selection handler
  const handleSelectCustomer = (cust: any) => {
    const cName = cust.customer_name || cust.name;
    setSelectedCustomer(cName);
    setCustomerSearchQuery(cName);
    setSelectedCustomerObj(cust);
    setIsCustomerDropdownOpen(false);

    setSelectedReturnNo('');
    setReturnSearchQuery('-- General Customer Balance Payout (All Return Notes) --');
    setSelectedReturnObj(null);

    runBalanceCalculation(cName, '', returnOptions, editData?.id || null);
  };

  // Return selection handler
  const handleSelectReturn = (returnNo: string) => {
    setSelectedReturnNo(returnNo);
    setReturnSearchQuery(returnNo || '-- General Customer Balance Payout (All Return Notes) --');
    setIsReturnDropdownOpen(false);

    if (returnNo) {
      const rtnObj = returnOptions.find(
        (r) =>
          r.return_no === returnNo ||
          r.invoice_no === returnNo ||
          String(r.id) === String(returnNo) ||
          `RTN-${String(r.id).padStart(4, '0')}` === returnNo
      );
      setSelectedReturnObj(rtnObj || null);
    } else {
      setSelectedReturnObj(null);
    }

    runBalanceCalculation(selectedCustomer, returnNo, returnOptions, editData?.id || null);
  };

  // Filtered lists for autocomplete
  const filteredCustomers = customerOptions.filter(
    (c) =>
      (c.customer_name || c.name || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      (c.customer_code || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      (c.contact_name || c.contact_person || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      (c.cell_no || c.phone_no || c.phone || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  const customerReturnsList = returnOptions.filter(
    (r) => selectedCustomer && (r.customer_name || '').toLowerCase() === selectedCustomer.toLowerCase()
  );

  const filteredReturns = customerReturnsList.filter((r) => {
    if (!returnSearchQuery || returnSearchQuery.startsWith('-- General')) return true;
    return (
      (r.return_no || '').toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
      (r.invoice_no || '').toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
      (r.return_date || '').toLowerCase().includes(returnSearchQuery.toLowerCase()) ||
      (r.warehouse || r.source_warehouse || '').toLowerCase().includes(returnSearchQuery.toLowerCase())
    );
  });

  const validationSchema = Yup.object().shape({
    paymentMethod: Yup.string().required('Disbursement method is required'),
    paymentDate: Yup.string().required('Date is required'),
    amount: Yup.number().when('paymentMethod', {
      is: (val: string) => val === 'By Cash' || val === 'By Bank',
      then: () =>
        Yup.number()
          .typeError('Amount must be numeric')
          .min(0, 'Amount cannot be negative')
          .required('Amount is required'),
      otherwise: () => Yup.number().nullable()
    }),
    cashAmount: Yup.number().when('paymentMethod', {
      is: 'Split',
      then: () => Yup.number().typeError('Cash must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable()
    }),
    bankAmount: Yup.number().when('paymentMethod', {
      is: 'Split',
      then: () => Yup.number().typeError('Bank must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable()
    }),
    selectedBankId: Yup.string().when('paymentMethod', {
      is: (val: string) => val === 'By Bank' || val === 'Split',
      then: () => Yup.string().required('Please select the disbursing bank account'),
      otherwise: () => Yup.string().nullable()
    })
  });

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  if (metadataLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl text-xs text-slate-800 dark:text-slate-200 antialiased font-sans">
      {/* Header */}
      <ReturnReceiptHeader
        isEditMode={isEditMode}
        onBack={() => navigate(`${tenantId ? `/${tenantId}` : ''}/sales/sales-return-receipt/list`)}
      />

      <Formik
        initialValues={
          isEditMode && editData
            ? {
                receiptNo: editData.receipt_no || `SRR-${String(editData.id).padStart(4, '0')}`,
                paymentMethod:
                  editData.settlement_mode === 'Bank' ||
                  editData.payment_mode === 'Bank' ||
                  editData.payment_method === 'By Bank'
                    ? 'By Bank'
                    : editData.payment_method === 'Split' ||
                      (editData.metadata?.cashAmount && editData.metadata?.bankAmount)
                    ? 'Split'
                    : editData.payment_method === 'Adjust Ledger' ||
                      editData.payment_mode === 'Credit Ledger'
                    ? 'Adjust Ledger'
                    : 'By Cash',
                selectedBankId: editData.metadata?.selectedBankId || editData.bank_account_title || '',
                paymentDate:
                  editData.payment_date ||
                  editData.processing_date ||
                  new Date().toISOString().split('T')[0],
                amount: editData.amount_paid || '',
                cashAmount: editData.metadata?.cashAmount || '',
                bankAmount: editData.metadata?.bankAmount || '',
                notes: editData.remarks || editData.notes || ''
              }
            : {
                receiptNo: generatedReceiptNo,
                paymentMethod: location.state?.suggestedPaymentMethod || 'By Cash',
                selectedBankId: '',
                paymentDate: new Date().toISOString().split('T')[0],
                amount: location.state?.suggestedAmount ? String(location.state.suggestedAmount) : '',
                cashAmount: '',
                bankAmount: '',
                notes: location.state?.selectedReturnNo
                  ? `Return settlement for ${location.state.selectedReturnNo}`
                  : ''
              }
        }
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          if (!selectedCustomer) {
            toast.error('Validation Error: Please select a customer first!');
            return;
          }

          try {
            setLoading(true);
            const savedReceiptId = await submitSalesReturnReceiptAction({
              values,
              selectedCustomer,
              customerOptions,
              bankAccounts,
              coaAccounts,
              selectedReturnNo,
              selectedReturnObj,
              returnOptions,
              returnGrossBill,
              returnPaidUpfront,
              returnPastReceiptsPaid,
              effectiveDueForThisReceipt,
              isEditMode,
              editData,
              formatMoney
            });

            toast.success(
              isEditMode
                ? 'Sales return payout voucher updated!'
                : 'Customer sales return refund disbursed successfully!'
            );

            if (shouldPrintAfterSave && savedReceiptId) {
              navigate(
                `${tenantId ? `/${tenantId}` : ''}/sales/sales-return-receipt/print/${savedReceiptId}`
              );
            } else {
              navigate(`${tenantId ? `/${tenantId}` : ''}/sales/sales-return-receipt/list`);
            }
          } catch (err: any) {
            toast.error('Error processing sales return receipt: ' + err.message);
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ handleChange, handleBlur, setFieldValue, values, errors, touched, handleSubmit }) => {
          const currentTotalAmt =
            values.paymentMethod === 'Split'
              ? Number(values.cashAmount || 0) + Number(values.bankAmount || 0)
              : values.paymentMethod === 'Adjust Ledger'
              ? 0
              : Number(values.amount) || 0;

          const projectedRemaining = Math.max(0, effectiveDueForThisReceipt - currentTotalAmt);

          return (
            <Form className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Inputs */}
              <div className="lg:col-span-7 bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
                      Receipt Voucher #:
                    </label>
                    <input
                      type="text"
                      name="receiptNo"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.receiptNo}
                      placeholder="Auto-generated"
                      readOnly
                      className={`w-full p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl font-mono font-black text-emerald-700 dark:text-emerald-400 border text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-not-allowed ${
                        touched.receiptNo && errors.receiptNo
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
                      Payout Date: *
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

                <ReturnReceiptCustomerSelect
                  customerContainerRef={customerContainerRef}
                  customerSearchQuery={customerSearchQuery}
                  setCustomerSearchQuery={setCustomerSearchQuery}
                  isCustomerDropdownOpen={isCustomerDropdownOpen}
                  setIsCustomerDropdownOpen={setIsCustomerDropdownOpen}
                  highlightedCustomerIndex={highlightedCustomerIndex}
                  setHighlightedCustomerIndex={setHighlightedCustomerIndex}
                  filteredCustomers={filteredCustomers}
                  selectedCustomer={selectedCustomer}
                  isEditMode={isEditMode}
                  handleSelectCustomer={handleSelectCustomer}
                  handleClearCustomer={() => {
                    setSelectedCustomer('');
                    setCustomerSearchQuery('');
                    setSelectedCustomerObj(null);
                    setSelectedReturnNo('');
                    setReturnSearchQuery('');
                    runBalanceCalculation('', '', returnOptions, editData?.id || null);
                  }}
                />

                {selectedCustomer && (
                  <ReturnReceiptNoteSelect
                    returnContainerRef={returnContainerRef}
                    selectedReturnNo={selectedReturnNo}
                    returnSearchQuery={returnSearchQuery}
                    setReturnSearchQuery={setReturnSearchQuery}
                    isReturnDropdownOpen={isReturnDropdownOpen}
                    setIsReturnDropdownOpen={setIsReturnDropdownOpen}
                    highlightedReturnIndex={highlightedReturnIndex}
                    setHighlightedReturnIndex={setHighlightedReturnIndex}
                    filteredReturns={filteredReturns}
                    returnAllocationsMap={returnAllocationsMap}
                    handleSelectReturn={handleSelectReturn}
                    formatMoney={formatMoney}
                  />
                )}

                <ReturnReceiptPaymentGateway
                  values={values}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  touched={touched}
                  bankAccounts={bankAccounts}
                  effectiveDueForThisReceipt={effectiveDueForThisReceipt}
                  blockInvalidChar={blockInvalidChar}
                  formatMoney={formatMoney}
                  loading={loading}
                  isEditMode={isEditMode}
                  selectedCustomer={selectedCustomer}
                  setShouldPrintAfterSave={setShouldPrintAfterSave}
                  handleSubmit={handleSubmit}
                  onCancel={() =>
                    navigate(`${tenantId ? `/${tenantId}` : ''}/sales/sales-return-receipt/list`)
                  }
                />
              </div>

              {/* Right Column: Live Financial Breakdown */}
              <ReturnReceiptSettlementCard
                selectedCustomer={selectedCustomer}
                selectedCustomerObj={selectedCustomerObj}
                selectedReturnNo={selectedReturnNo}
                customerOpeningBalance={customerOpeningBalance}
                customerInvoiceUnpaidDebt={customerInvoiceUnpaidDebt}
                customerReceivableBalance={customerReceivableBalance}
                returnGrossBill={returnGrossBill}
                returnCreditAdjusted={returnCreditAdjusted}
                returnPaidUpfront={returnPaidUpfront}
                returnPastReceiptsPaid={returnPastReceiptsPaid}
                effectiveDueForThisReceipt={effectiveDueForThisReceipt}
                currentTotalAmt={currentTotalAmt}
                projectedRemaining={projectedRemaining}
                formatMoney={formatMoney}
              />
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default SalesReturnReceiptAdd;
