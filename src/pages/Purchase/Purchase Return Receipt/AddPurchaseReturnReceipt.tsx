import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { FiPrinter } from 'react-icons/fi';

import { formatMoney } from './utils/purchaseReturnReceiptHelpers';
import {
  calculateVendorReturnBalances,
  submitPurchaseReturnReceipt,
} from './services/purchaseReturnReceiptService';
import { usePurchaseReturnReceiptMetadata } from './hooks/usePurchaseReturnReceiptMetadata';
import { ReturnReceiptHeader } from './components/ReturnReceiptHeader';
import { VendorAutocompleteInput } from './components/VendorAutocompleteInput';
import { ReturnNoteAutocompleteInput } from './components/ReturnNoteAutocompleteInput';
import { ReturnPaymentMethodSection } from './components/ReturnPaymentMethodSection';
import { PayeeVendorCard } from './components/PayeeVendorCard';
import { ReturnSettlementCard } from './components/ReturnSettlementCard';

const AddPurchaseReturnReceipt: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId } = useAuth();

  const [loading, setLoading] = useState(false);

  const editData = location.state?.receiptRecord;
  const isEditMode = !!editData;

  const {
    metadataLoading,
    vendorOptions,
    returnOptions,
    bankAccounts,
    coaAccounts,
    generatedReceiptNo,
  } = usePurchaseReturnReceiptMetadata(isEditMode, editData);

  // Vendor Autocomplete State
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [highlightedVendorIndex, setHighlightedVendorIndex] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedVendorObj, setSelectedVendorObj] = useState<any>(null);

  // Return Note Autocomplete State
  const [returnSearchQuery, setReturnSearchQuery] = useState('');
  const [isReturnDropdownOpen, setIsReturnDropdownOpen] = useState(false);
  const [highlightedReturnIndex, setHighlightedReturnIndex] = useState(0);
  const [selectedReturnNo, setSelectedReturnNo] = useState<string>('');

  // Balances
  const [vendorTotalOutstandingReceivable, setVendorTotalOutstandingReceivable] = useState<number>(0);
  const [returnGrossBill, setReturnGrossBill] = useState<number>(0);
  const [returnCreditAdjusted, setReturnCreditAdjusted] = useState<number>(0);
  const [returnPaidUpfront, setReturnPaidUpfront] = useState<number>(0);
  const [returnPastReceiptsPaid, setReturnPastReceiptsPaid] = useState<number>(0);
  const [effectiveDueForThisReceipt, setEffectiveDueForThisReceipt] = useState<number>(0);
  const [returnAllocationsMap, setReturnAllocationsMap] = useState<Record<string, any>>({});

  const [shouldPrintAfterSave, setShouldPrintAfterSave] = useState(false);

  const vendorContainerRef = useRef<HTMLDivElement>(null);
  const returnContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (vendorContainerRef.current && !vendorContainerRef.current.contains(e.target as Node)) {
        setIsVendorDropdownOpen(false);
      }
      if (returnContainerRef.current && !returnContainerRef.current.contains(e.target as Node)) {
        setIsReturnDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Restore edit state
  useEffect(() => {
    if (isEditMode && editData && vendorOptions.length > 0) {
      const vName = editData.vendor_name || '';
      setSelectedVendor(vName);
      setVendorSearchQuery(vName);
      const matchedVendor = vendorOptions.find((v) => v.vendor_name.toLowerCase() === vName.toLowerCase());
      if (matchedVendor) setSelectedVendorObj(matchedVendor);

      const rRef = editData.return_no || '';
      if (rRef) {
        setSelectedReturnNo(rRef);
        setReturnSearchQuery(rRef);
      } else {
        setSelectedReturnNo('');
        setReturnSearchQuery('-- General Vendor Balance Recovery (All Return Notes) --');
      }

      runCalculateBalances(vName, rRef, returnOptions, editData.id);
    }
  }, [isEditMode, editData, vendorOptions, returnOptions]);

  const runCalculateBalances = async (
    vendorName: string,
    returnNumber: string,
    allReturns: any[],
    currentEditReceiptId: number | null = null
  ) => {
    const balances = await calculateVendorReturnBalances(vendorName, returnNumber, allReturns, currentEditReceiptId);
    setVendorTotalOutstandingReceivable(balances.vendorTotalOutstandingReceivable);
    setReturnGrossBill(balances.returnGrossBill);
    setReturnCreditAdjusted(balances.returnCreditAdjusted);
    setReturnPaidUpfront(balances.returnPaidUpfront);
    setReturnPastReceiptsPaid(balances.returnPastReceiptsPaid);
    setEffectiveDueForThisReceipt(balances.effectiveDueForThisReceipt);
    setReturnAllocationsMap(balances.returnAllocationsMap);
  };

  const handleSelectVendor = (vendor: any) => {
    setSelectedVendor(vendor.vendor_name);
    setVendorSearchQuery(vendor.vendor_name);
    setSelectedVendorObj(vendor);
    setIsVendorDropdownOpen(false);
    setSelectedReturnNo('');
    setReturnSearchQuery('');
    runCalculateBalances(vendor.vendor_name, '', returnOptions, editData?.id || null);
  };

  const handleClearVendor = () => {
    setSelectedVendor('');
    setVendorSearchQuery('');
    setSelectedVendorObj(null);
    setSelectedReturnNo('');
    setReturnSearchQuery('');
    runCalculateBalances('', '', returnOptions, editData?.id || null);
  };

  const handleSelectReturn = (returnNo: string) => {
    setSelectedReturnNo(returnNo);
    setReturnSearchQuery(returnNo ? returnNo : '-- General Vendor Balance Recovery (All Return Notes) --');
    setIsReturnDropdownOpen(false);
    runCalculateBalances(selectedVendor, returnNo, returnOptions, editData?.id || null);
  };

  const filteredVendors = vendorOptions.filter((v) => {
    const q = vendorSearchQuery.toLowerCase();
    return (
      (v.vendor_name || '').toLowerCase().includes(q) ||
      (v.contact_name || '').toLowerCase().includes(q) ||
      (v.cell_no || '').toLowerCase().includes(q) ||
      (v.phone || '').toLowerCase().includes(q)
    );
  });

  const vendorReturnsList = returnOptions.filter(
    (r) => (r.vendor_name || r.supplier_name || '').toLowerCase() === selectedVendor.toLowerCase()
  );

  const filteredReturns = vendorReturnsList.filter((r) => {
    const q = returnSearchQuery.toLowerCase();
    return (
      (r.return_no || '').toLowerCase().includes(q) ||
      (r.return_date || '').toLowerCase().includes(q) ||
      (r.source_warehouse || '').toLowerCase().includes(q) ||
      (r.purchase_no || '').toLowerCase().includes(q)
    );
  });

  const validationSchema = Yup.object().shape({
    receiptNo: Yup.string().required('Receipt Voucher # is required'),
    paymentMethod: Yup.string().required('Collection method is required'),
    paymentDate: Yup.string().required('Payment date is required'),
    amount: Yup.number().when('paymentMethod', {
      is: (val: string) => val === 'By Cash' || val === 'By Bank',
      then: () =>
        Yup.number()
          .typeError('Amount must be numeric')
          .min(1, 'Amount must be greater than 0')
          .required('Amount is required'),
      otherwise: () => Yup.number().nullable(),
    }),
    cashAmount: Yup.number().when('paymentMethod', {
      is: 'Split',
      then: () => Yup.number().typeError('Cash must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable(),
    }),
    bankAmount: Yup.number().when('paymentMethod', {
      is: 'Split',
      then: () => Yup.number().typeError('Bank must be numeric').min(0, 'Cannot be negative'),
      otherwise: () => Yup.number().nullable(),
    }),
    selectedBankId: Yup.string().when('paymentMethod', {
      is: (val: string) => val === 'By Bank' || val === 'Split',
      then: () => Yup.string().required('Please select the receiving bank account'),
      otherwise: () => Yup.string().nullable(),
    }),
  });

  if (metadataLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl text-xs text-slate-800 dark:text-slate-200 antialiased font-sans">
      <ReturnReceiptHeader
        isEditMode={isEditMode}
        onBack={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Return-Receipt/List`)}
      />

      <Formik
        initialValues={
          isEditMode && editData
            ? {
                receiptNo: editData.receipt_no || '',
                paymentMethod:
                  editData.payment_method === 'By Bank'
                    ? 'By Bank'
                    : editData.payment_method === 'Split' ||
                      (editData.metadata?.cashAmount && editData.metadata?.bankAmount)
                    ? 'Split'
                    : 'By Cash',
                selectedBankId: editData.metadata?.selectedBankId || '',
                paymentDate: editData.payment_date || new Date().toISOString().split('T')[0],
                amount: editData.amount_received || '',
                cashAmount: editData.metadata?.cashAmount || '',
                bankAmount: editData.metadata?.bankAmount || '',
                notes: editData.remarks || '',
              }
            : {
                receiptNo: generatedReceiptNo,
                paymentMethod: 'By Cash',
                selectedBankId: '',
                paymentDate: new Date().toISOString().split('T')[0],
                amount: '',
                cashAmount: '',
                bankAmount: '',
                notes: '',
              }
        }
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          if (!selectedVendor) {
            toast.error('Validation Error: Please select a wholesale vendor first!');
            return;
          }

          if (values.receiptNo) {
            let query = supabase.from('purchase_return_receipts').select('id').eq('receipt_no', values.receiptNo);
            if (isEditMode && editData?.id) {
              query = query.neq('id', editData.id);
            }
            const { data: existingRecords, error: checkError } = await query;
            if (checkError) {
              toast.error('Failed to validate Receipt Voucher #.');
              return;
            }
            if (existingRecords && existingRecords.length > 0) {
              toast.error('Receipt Voucher # already exists!');
              return;
            }
          }

          let finalAmount = 0;
          if (values.paymentMethod === 'By Cash') {
            finalAmount = Number(values.amount) || 0;
          } else if (values.paymentMethod === 'By Bank') {
            finalAmount = Number(values.amount) || 0;
            if (!values.selectedBankId) {
              toast.error('Please select the receiving bank account.');
              return;
            }
          } else if (values.paymentMethod === 'Split') {
            finalAmount = (Number(values.cashAmount) || 0) + (Number(values.bankAmount) || 0);
            if (!values.selectedBankId && (Number(values.bankAmount) || 0) > 0) {
              toast.error('Please select the receiving bank account for the bank transfer portion.');
              return;
            }
          }

          if (finalAmount <= 0) {
            toast.error('Please enter a valid collection amount greater than 0.');
            return;
          }

          if (finalAmount > effectiveDueForThisReceipt + 1) {
            toast.error(
              `Error: Collected amount (Rs. ${formatMoney(finalAmount)}) exceeds the pending return balance (Rs. ${formatMoney(effectiveDueForThisReceipt)}).`
            );
            return;
          }

          try {
            setLoading(true);

            const { savedReceiptId } = await submitPurchaseReturnReceipt({
              values,
              selectedVendor,
              selectedReturnNo,
              vendorOptions,
              bankAccounts,
              coaAccounts,
              returnGrossBill,
              returnPaidUpfront,
              returnPastReceiptsPaid,
              effectiveDueForThisReceipt,
              isEditMode,
              editData,
            });

            // Update specific purchase_returns record if linked
            if (selectedReturnNo) {
              const targetReturn = returnOptions.find(
                (r) => r.return_no === selectedReturnNo || String(r.id) === String(selectedReturnNo)
              );
              if (targetReturn) {
                const { data: allReceiptsForReturn } = await supabase
                  .from('purchase_return_receipts')
                  .select('id, amount_received')
                  .eq('return_no', selectedReturnNo);

                const totalReceiptsSum = (allReceiptsForReturn || []).reduce(
                  (acc: number, r: any) => acc + (Number(r.amount_received) || 0),
                  0
                );
                const upfrontPaid = Number(targetReturn.amount_paid) || 0;
                const newTotalPaid = upfrontPaid + totalReceiptsSum;
                const returnGross = Number(targetReturn.total_amount) || 0;

                await supabase
                  .from('purchase_returns')
                  .update({
                    amount_received: newTotalPaid,
                    status: newTotalPaid >= returnGross - 1 ? 'Refunded' : 'Partial Refund',
                  })
                  .eq('id', targetReturn.id);
              }
            }

            toast.success(
              isEditMode ? 'Purchase return receipt voucher updated!' : 'Vendor return collection processed successfully!'
            );

            if (shouldPrintAfterSave && savedReceiptId) {
              navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Return-Receipt/Print/${savedReceiptId}`);
            } else {
              navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Return-Receipt/List`);
            }
          } catch (err: any) {
            toast.error('Error processing return receipt: ' + err.message);
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ handleChange, handleBlur, setFieldValue, values, errors, touched, handleSubmit }) => {
          const currentTotalAmt =
            values.paymentMethod === 'Split'
              ? Number(values.cashAmount || 0) + Number(values.bankAmount || 0)
              : Number(values.amount) || 0;

          const projectedRemaining = effectiveDueForThisReceipt - currentTotalAmt;

          return (
            <Form className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: FORM INPUTS (7 COLS) */}
              <div className="lg:col-span-7 bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-5">
                {/* Row 1: Receipt # & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block font-bold uppercase text-[11px] mb-1 ${
                        touched.receiptNo && errors.receiptNo
                          ? 'text-red-500'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Receipt Voucher #: *
                    </label>
                    <input
                      type="text"
                      name="receiptNo"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.receiptNo}
                      placeholder="Auto-generated"
                      readOnly
                      className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl font-mono font-black text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 text-xs outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
                      Collection Date: *
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

                {/* Row 2: Target Wholesale Vendor */}
                <VendorAutocompleteInput
                  isEditMode={isEditMode}
                  vendorContainerRef={vendorContainerRef}
                  vendorSearchQuery={vendorSearchQuery}
                  setVendorSearchQuery={setVendorSearchQuery}
                  isVendorDropdownOpen={isVendorDropdownOpen}
                  setIsVendorDropdownOpen={setIsVendorDropdownOpen}
                  highlightedVendorIndex={highlightedVendorIndex}
                  setHighlightedVendorIndex={setHighlightedVendorIndex}
                  selectedVendor={selectedVendor}
                  filteredVendors={filteredVendors}
                  handleSelectVendor={handleSelectVendor}
                  handleClearVendor={handleClearVendor}
                />

                {/* Row 3: Settle Specific Purchase Return Note */}
                {selectedVendor && (
                  <ReturnNoteAutocompleteInput
                    returnContainerRef={returnContainerRef}
                    returnSearchQuery={returnSearchQuery}
                    setReturnSearchQuery={setReturnSearchQuery}
                    isReturnDropdownOpen={isReturnDropdownOpen}
                    setIsReturnDropdownOpen={setIsReturnDropdownOpen}
                    highlightedReturnIndex={highlightedReturnIndex}
                    setHighlightedReturnIndex={setHighlightedReturnIndex}
                    selectedReturnNo={selectedReturnNo}
                    filteredReturns={filteredReturns}
                    returnAllocationsMap={returnAllocationsMap}
                    handleSelectReturn={handleSelectReturn}
                  />
                )}

                {/* Row 4 & 5: Collection Gateway & Amounts */}
                <ReturnPaymentMethodSection
                  values={values}
                  touched={touched}
                  errors={errors}
                  handleChange={handleChange}
                  setFieldValue={setFieldValue}
                  bankAccounts={bankAccounts}
                  effectiveDueForThisReceipt={effectiveDueForThisReceipt}
                />

                {/* Row 6: Remarks */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
                    Transaction Remarks / Recovery Notes:
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    onChange={handleChange}
                    value={values.notes}
                    placeholder="Enter cheque #, online transaction reference, or debit note clearing notes..."
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-white text-xs focus:border-emerald-600"
                  />
                </div>

                {/* Submit / Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Return-Receipt/List`)}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition text-xs cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShouldPrintAfterSave(true);
                      handleSubmit();
                    }}
                    disabled={loading || !selectedVendor}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-6 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <FiPrinter size={15} />
                    <span>Save & Print Receipt</span>
                  </button>

                  <button
                    type="submit"
                    onClick={() => setShouldPrintAfterSave(false)}
                    disabled={loading || !selectedVendor}
                    className="rounded-xl bg-primary hover:bg-opacity-90 py-3 px-8 font-black text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                  >
                    {loading ? (
                      <Spinner color="border-white" size="w-4 h-4" />
                    ) : (
                      <span>{isEditMode ? 'Update Voucher' : 'Post & Collect Refund'}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: LIVE FINANCIAL BREAKDOWN (5 COLS) */}
              <div className="lg:col-span-5 space-y-4">
                <PayeeVendorCard selectedVendor={selectedVendor} selectedVendorObj={selectedVendorObj} />

                <ReturnSettlementCard
                  selectedVendor={selectedVendor}
                  selectedReturnNo={selectedReturnNo}
                  returnGrossBill={returnGrossBill}
                  returnCreditAdjusted={returnCreditAdjusted}
                  returnPaidUpfront={returnPaidUpfront}
                  returnPastReceiptsPaid={returnPastReceiptsPaid}
                  effectiveDueForThisReceipt={effectiveDueForThisReceipt}
                  projectedRemaining={projectedRemaining}
                  vendorTotalOutstandingReceivable={vendorTotalOutstandingReceivable}
                />
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default AddPurchaseReturnReceipt;
