import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { useInvoiceReceiptMetadata } from './hooks/useInvoiceReceiptMetadata';
import { submitInvoiceReceipt } from './services/invoiceReceiptService';
import { InvoiceReceiptHeader } from './components/InvoiceReceiptHeader';
import { CustomerAutocompleteInput } from './components/CustomerAutocompleteInput';
import { InvoiceAutocompleteInput } from './components/InvoiceAutocompleteInput';
import { ReceiptPaymentSection } from './components/ReceiptPaymentSection';
import { CustomerProfileCard } from './components/CustomerProfileCard';
import { ReceiptSettlementCard } from './components/ReceiptSettlementCard';
import { ReceiptFormValues } from './types/invoiceReceiptTypes';

const validationSchema = Yup.object().shape({
  voucherType: Yup.string().required('Payment method is required'),
  paymentDate: Yup.string().required('Payment date is required'),
  amount: Yup.number().when('voucherType', {
    is: (val: string) => val === 'By Cash' || val === 'By Bank',
    then: () => Yup.number().typeError('Amount must be a number').min(1, 'Amount must be greater than 0').required('Amount is required'),
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
    then: () => Yup.string().required('Please select the target bank account'),
    otherwise: () => Yup.string().nullable()
  })
});

function AddInvoiceReceipt() {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const editData = location.state?.receipt || location.state?.receiptRecord;
  const isEditMode = !!editData;

  const {
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
    handleSelectInvoice,
    filteredInvoices,
    invoiceContainerRef,
    generatedVoucherNo,
    customerOpeningBalance,
    invGrossBill,
    invPaidUpfront,
    invPastReceiptsPaid,
    invReturnsDeducted,
    effectiveDueForThisReceipt,
    invAllocationsMap
  } = useInvoiceReceiptMetadata(isEditMode, editData);

  if (metadataLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const initialValues: ReceiptFormValues = isEditMode && editData ? {
    voucherNo: editData.voucher_no || '',
    voucherType: editData.voucher_type === 'Bank Receipt Voucher'
      ? 'By Bank'
      : (editData.voucher_type === 'Cash & Bank Receipt Voucher' || (editData.metadata?.cashAmount && editData.metadata?.bankAmount)
        ? 'Split'
        : 'By Cash'),
    selectedBankId: editData.metadata?.selectedBankId || '',
    paymentDate: editData.voucher_date || new Date().toISOString().split('T')[0],
    amount: editData.total_amount || '',
    cashAmount: editData.metadata?.cashAmount || '',
    bankAmount: editData.metadata?.bankAmount || '',
    notes: editData.narration || ''
  } : {
    voucherNo: generatedVoucherNo,
    voucherType: 'By Cash',
    selectedBankId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    cashAmount: '',
    bankAmount: '',
    notes: ''
  };

  const handleReceiptSubmit = async (values: ReceiptFormValues) => {
    try {
      setLoading(true);
      await submitInvoiceReceipt({
        values,
        selectedCustomer,
        selectedInvoiceNo,
        customersList,
        bankAccounts,
        coaAccounts,
        salesInvoicesList,
        invAllocationsMap,
        effectiveDueForThisReceipt,
        isEditMode,
        editData
      });

      toast.success(isEditMode ? 'Customer receipt voucher updated!' : 'Customer sales receipt logged successfully!');
      navigate(`${tenantId ? `/${tenantId}` : ''}/Sales/InvoiceReceipt/List`);
    } catch (err: any) {
      toast.error(err.message || 'Error processing sales receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl text-xs text-slate-800 dark:text-slate-200">
      <InvoiceReceiptHeader
        isEditMode={isEditMode}
        onBack={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Sales/InvoiceReceipt/List`)}
      />

      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={handleReceiptSubmit}
      >
        {({ handleChange, handleBlur, setFieldValue, values, errors, touched }) => {
          const currentTotalAmt = values.voucherType === 'Split'
            ? (Number(values.cashAmount || 0) + Number(values.bankAmount || 0))
            : (Number(values.amount) || 0);

          return (
            <Form className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: FORM INPUTS (7 COLS) */}
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
                        touched.voucherNo && errors.voucherNo ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-700'
                      }`}
                      placeholder="Auto-generated"
                      readOnly
                    />
                    {touched.voucherNo && errors.voucherNo && (
                      <div className="text-[10px] font-bold text-rose-500 mt-0.5 px-1">{errors.voucherNo as string}</div>
                    )}
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
                        touched.paymentDate && errors.paymentDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                      }`}
                    />
                  </div>
                </div>

                {/* Row 2: Target Customer Autocomplete */}
                <CustomerAutocompleteInput
                  customerContainerRef={customerContainerRef}
                  isEditMode={isEditMode}
                  customerSearchQuery={customerSearchQuery}
                  setCustomerSearchQuery={setCustomerSearchQuery}
                  isCustomerDropdownOpen={isCustomerDropdownOpen}
                  setIsCustomerDropdownOpen={setIsCustomerDropdownOpen}
                  highlightedCustomerIndex={highlightedCustomerIndex}
                  setHighlightedCustomerIndex={setHighlightedCustomerIndex}
                  selectedCustomer={selectedCustomer}
                  filteredCustomers={filteredCustomers}
                  onSelectCustomer={handleSelectCustomer}
                  onClearCustomer={handleClearCustomer}
                />

                {/* Row 3: Settle Specific Sale Invoice */}
                <InvoiceAutocompleteInput
                  invoiceContainerRef={invoiceContainerRef}
                  selectedCustomer={selectedCustomer}
                  selectedInvoiceNo={selectedInvoiceNo}
                  customerOpeningBalance={customerOpeningBalance}
                  invoiceSearchQuery={invoiceSearchQuery}
                  setInvoiceSearchQuery={setInvoiceSearchQuery}
                  isInvoiceDropdownOpen={isInvoiceDropdownOpen}
                  setIsInvoiceDropdownOpen={setIsInvoiceDropdownOpen}
                  highlightedInvoiceIndex={highlightedInvoiceIndex}
                  setHighlightedInvoiceIndex={setHighlightedInvoiceIndex}
                  filteredInvoices={filteredInvoices}
                  invAllocationsMap={invAllocationsMap}
                  onSelectInvoice={handleSelectInvoice}
                />

                {/* Row 4: Settlement Mode with Split Payment */}
                <ReceiptPaymentSection
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  bankAccounts={bankAccounts}
                  effectiveDueForThisReceipt={effectiveDueForThisReceipt}
                />

                {/* Row 5: Remarks */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
                    Transaction Remarks / Voucher Notes:
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    onChange={handleChange}
                    value={values.notes}
                    placeholder="Enter deposit slip #, cheque #, online transaction reference, or clearing notes..."
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-white text-xs focus:border-primary"
                  />
                </div>

                {/* Submit / Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Sales/InvoiceReceipt/List`)}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedCustomer}
                    className="rounded-xl bg-primary hover:bg-primary/90 py-3 px-8 font-black text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                  >
                    {loading ? <Spinner color="border-white" size="w-4 h-4" /> : <span>{isEditMode ? 'Update Voucher' : 'Post & Collect Receipt'}</span>}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: FINANCIAL BREAKDOWN (5 COLS) */}
              <div className="lg:col-span-5 space-y-4">
                <CustomerProfileCard
                  selectedCustomer={selectedCustomer}
                  selectedCustomerObj={selectedCustomerObj}
                />

                <ReceiptSettlementCard
                  selectedCustomer={selectedCustomer}
                  selectedInvoiceNo={selectedInvoiceNo}
                  customerOpeningBalance={customerOpeningBalance}
                  invGrossBill={invGrossBill}
                  invPaidUpfront={invPaidUpfront}
                  invReturnsDeducted={invReturnsDeducted}
                  invPastReceiptsPaid={invPastReceiptsPaid}
                  effectiveDueForThisReceipt={effectiveDueForThisReceipt}
                  currentTotalAmt={currentTotalAmt}
                />
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

export default AddInvoiceReceipt;
