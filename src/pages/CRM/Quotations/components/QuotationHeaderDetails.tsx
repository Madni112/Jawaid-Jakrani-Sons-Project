import React from 'react';
import { MdPerson } from 'react-icons/md';
import CustomerCombobox, { CustomerComboboxItem } from '../../../../components/CustomerCombobox';
import { SalesmanCombobox } from './SalesmanCombobox';

interface QuotationHeaderDetailsProps {
  quoteNo: string;
  setQuoteNo: (val: string) => void;
  quoteDate: string;
  setQuoteDate: (val: string) => void;
  validUntil: string;
  setValidUntil: (val: string) => void;
  setValidityDays: (days: number) => void;
  customerDirectory: CustomerComboboxItem[];
  customerName: string;
  setCustomerName: (val: string) => void;
  handleCustomerSelect: (cust: CustomerComboboxItem | null) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  customerAddress: string;
  syncCustomerToDatabase: (name: string, phone: string, address: string) => Promise<any>;
  salesmenList: any[];
  salesmanName: string;
  setSalesmanName: (val: string) => void;
}

export const QuotationHeaderDetails: React.FC<QuotationHeaderDetailsProps> = ({
  quoteNo,
  setQuoteNo,
  quoteDate,
  setQuoteDate,
  validUntil,
  setValidUntil,
  setValidityDays,
  customerDirectory,
  customerName,
  setCustomerName,
  handleCustomerSelect,
  customerPhone,
  setCustomerPhone,
  customerAddress,
  syncCustomerToDatabase,
  salesmenList,
  salesmanName,
  setSalesmanName,
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs p-5 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary,#800020)] dark:text-rose-400 flex items-center gap-1.5 pb-2 border-b border-stroke dark:border-strokedark">
        <MdPerson /> 1. Customer &amp; Quotation Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Row 1, Col 1: Quotation # */}
        <div>
          <div className="h-6 flex items-center mb-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Quotation # <span className="text-red-500">*</span>
            </label>
          </div>
          <input
            type="text"
            required
            value={quoteNo}
            onChange={e => setQuoteNo(e.target.value)}
            placeholder="e.g. QT-2026-001"
            className="w-full h-10.5 text-xs font-bold font-mono px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden shadow-2xs transition"
          />
        </div>

        {/* Row 1, Col 2: Quotation Date */}
        <div>
          <div className="h-6 flex items-center mb-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Quotation Date
            </label>
          </div>
          <input
            type="date"
            value={quoteDate}
            onChange={e => setQuoteDate(e.target.value)}
            className="w-full h-10.5 text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden shadow-2xs transition font-semibold"
          />
        </div>

        {/* Row 1, Col 3: Valid Until */}
        <div>
          <div className="h-6 flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Valid Until
            </label>
            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => setValidityDays(7)}
                className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-meta-4 hover:bg-[var(--color-primary,#800020)]/10 hover:text-[var(--color-primary,#800020)] text-gray-600 dark:text-gray-300 font-semibold cursor-pointer transition text-[10px]"
              >
                +7d
              </button>
              <button
                type="button"
                onClick={() => setValidityDays(15)}
                className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-meta-4 hover:bg-[var(--color-primary,#800020)]/10 hover:text-[var(--color-primary,#800020)] text-gray-600 dark:text-gray-300 font-semibold cursor-pointer transition text-[10px]"
              >
                +15d
              </button>
              <button
                type="button"
                onClick={() => setValidityDays(30)}
                className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-meta-4 hover:bg-[var(--color-primary,#800020)]/10 hover:text-[var(--color-primary,#800020)] text-gray-600 dark:text-gray-300 font-semibold cursor-pointer transition text-[10px]"
              >
                +30d
              </button>
            </div>
          </div>
          <input
            type="date"
            value={validUntil}
            onChange={e => setValidUntil(e.target.value)}
            className="w-full h-10.5 text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden font-semibold shadow-2xs transition"
          />
        </div>

        {/* Row 2, Col 1: Customer Name / Business */}
        <div>
          <div className="h-6 flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Customer Name / Business <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">
              (Type name to select or auto-add)
            </span>
          </div>
          <CustomerCombobox
            customers={customerDirectory}
            value={customerName}
            onChange={name => setCustomerName(name)}
            onSelectCustomer={handleCustomerSelect}
            placeholder="Search or enter customer name..."
          />
        </div>

        {/* Row 2, Col 2: Contact Phone (WhatsApp) */}
        <div>
          <div className="h-6 flex items-center mb-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Contact Phone (WhatsApp)
            </label>
          </div>
          <input
            type="text"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            onBlur={() => {
              if (customerName.trim() && customerPhone.trim()) {
                syncCustomerToDatabase(customerName, customerPhone, customerAddress);
              }
            }}
            placeholder="e.g. 03001234567"
            className="w-full h-10.5 text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden shadow-2xs transition"
          />
        </div>

        {/* Row 2, Col 3: Salesman / Assigned To */}
        <div>
          <div className="h-6 flex items-center mb-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Salesman / Assigned To
            </label>
          </div>
          <SalesmanCombobox
            salesmen={salesmenList}
            value={salesmanName}
            onChange={val => setSalesmanName(val)}
            placeholder="Search or select salesman..."
          />
        </div>
      </div>
    </div>
  );
};
