import React from 'react';
import { MdReceipt, MdKeyboardArrowDown, MdClear } from 'react-icons/md';
import { SalesInvoiceItem, InvoiceAllocation } from '../types/invoiceReceiptTypes';
import { formatMoney } from '../utils/invoiceReceiptHelpers';

interface InvoiceAutocompleteInputProps {
  invoiceContainerRef: React.RefObject<HTMLDivElement>;
  selectedCustomer: string;
  selectedInvoiceNo: string;
  customerOpeningBalance?: number;
  invoiceSearchQuery: string;
  setInvoiceSearchQuery: (val: string) => void;
  isInvoiceDropdownOpen: boolean;
  setIsInvoiceDropdownOpen: (open: boolean) => void;
  highlightedInvoiceIndex: number;
  setHighlightedInvoiceIndex: React.Dispatch<React.SetStateAction<number>>;
  filteredInvoices: SalesInvoiceItem[];
  invAllocationsMap: Record<string, InvoiceAllocation>;
  onSelectInvoice: (invNo: string) => void;
}

export const InvoiceAutocompleteInput: React.FC<InvoiceAutocompleteInputProps> = ({
  invoiceContainerRef,
  selectedCustomer,
  selectedInvoiceNo,
  customerOpeningBalance = 0,
  invoiceSearchQuery,
  setInvoiceSearchQuery,
  isInvoiceDropdownOpen,
  setIsInvoiceDropdownOpen,
  highlightedInvoiceIndex,
  setHighlightedInvoiceIndex,
  filteredInvoices,
  invAllocationsMap,
  onSelectInvoice
}) => {
  if (!selectedCustomer) return null;

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 relative" ref={invoiceContainerRef}>
      <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <MdReceipt size={15} className="text-primary" /> Settle Specific Sale Invoice (Optional):
        </span>
        {selectedInvoiceNo && (
          <button
            type="button"
            onClick={() => onSelectInvoice('')}
            className="text-[10px] text-primary hover:underline font-bold"
          >
            Clear Selection (Pay General Ledger)
          </button>
        )}
      </label>

      <div className="relative">
        <input
          type="text"
          value={invoiceSearchQuery}
          onFocus={() => setIsInvoiceDropdownOpen(true)}
          onKeyDown={(e) => {
            const hasOpenBal = (Number(customerOpeningBalance) || 0) > 0;
            const maxIdx = filteredInvoices.length + (hasOpenBal ? 1 : 0);
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedInvoiceIndex(prev => Math.min(prev + 1, maxIdx));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedInvoiceIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlightedInvoiceIndex === 0) {
                onSelectInvoice('');
              } else if (hasOpenBal && highlightedInvoiceIndex === 1) {
                onSelectInvoice('OPENING_BALANCE');
              } else {
                const invOffset = hasOpenBal ? 2 : 1;
                const inv = filteredInvoices[highlightedInvoiceIndex - invOffset];
                if (inv) {
                  onSelectInvoice(`INV-${String(inv.id).padStart(4, '0')}`);
                }
              }
            } else if (e.key === 'Escape') {
              setIsInvoiceDropdownOpen(false);
            }
          }}
          onChange={(e) => {
            setInvoiceSearchQuery(e.target.value);
            setIsInvoiceDropdownOpen(true);
            setHighlightedInvoiceIndex(0);
          }}
          placeholder="Search Invoice # (e.g. INV-0042), date, or warehouse..."
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pr-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs focus:border-primary"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedInvoiceNo && (
            <button
              type="button"
              onClick={() => onSelectInvoice('')}
              className="text-slate-400 hover:text-rose-500"
            >
              <MdClear size={16} />
            </button>
          )}
          <MdKeyboardArrowDown className="text-slate-400" size={18} />
        </div>
      </div>

      {/* Dropdown */}
      {isInvoiceDropdownOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-[9999] w-full max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-700/60">
          {/* General Customer Balance Clearing */}
          <div
            onMouseEnter={() => setHighlightedInvoiceIndex(0)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelectInvoice('');
            }}
            className={`p-3 cursor-pointer text-xs flex justify-between items-center transition ${
              highlightedInvoiceIndex === 0 || !selectedInvoiceNo
                ? 'bg-primary/10 text-primary font-bold'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-bold text-xs">-- General Customer Balance Clearing (All Invoices) --</span>
              <span className="text-[10px] text-slate-400">Automated FIFO allocation against oldest open customer bills</span>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              General
            </span>
          </div>

          {/* Customer Opening Balance Option */}
          {Number(customerOpeningBalance || 0) > 0 && (
            <div
              onMouseEnter={() => setHighlightedInvoiceIndex(1)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectInvoice('OPENING_BALANCE');
              }}
              className={`p-3 cursor-pointer text-xs flex justify-between items-center transition border-b border-slate-100 dark:border-slate-700/60 ${
                highlightedInvoiceIndex === 1 || selectedInvoiceNo === 'OPENING_BALANCE'
                  ? 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs text-amber-700 dark:text-amber-400">
                    OPENING BALANCE
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold">
                    Initial Balance
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Initial customer debt recorded at account creation
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-slate-500 text-[10px] block">
                  Total: Rs. {formatMoney(Number(customerOpeningBalance || 0))}
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-black text-xs">
                  Due: Rs. {formatMoney(invAllocationsMap['OPENING_BALANCE']?.due ?? Number(customerOpeningBalance || 0))}
                </span>
              </div>
            </div>
          )}

          {/* Invoice List */}
          {filteredInvoices.map((inv, iIdx) => {
            const itemIdx = iIdx + (Number(customerOpeningBalance || 0) > 0 ? 2 : 1);
            const invFormatted = `INV-${String(inv.id).padStart(4, '0')}`;
            const alloc = invAllocationsMap[invFormatted] || invAllocationsMap[String(inv.id)];
            const bill = alloc ? alloc.gross : (Number(inv.total_amount) || 0);
            const due = alloc ? alloc.due : Math.max(0, bill - (Number(inv.cash_amount_paid || 0) + Number(inv.bank_amount || 0)));

            return (
              <div
                key={inv.id}
                onMouseEnter={() => setHighlightedInvoiceIndex(itemIdx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectInvoice(invFormatted);
                }}
                className={`p-3 cursor-pointer text-xs flex justify-between items-center transition ${
                  highlightedInvoiceIndex === itemIdx || selectedInvoiceNo === invFormatted
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono font-black text-xs text-primary">{invFormatted}</span>
                  <span className="text-[10px] text-slate-400">
                    {inv.invoice_date || 'N/A'} • {inv.dispatch_warehouse || 'Main Warehouse'}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-slate-500 text-[10px] block">Billed: Rs. {formatMoney(bill)}</span>
                  <span className="text-rose-600 dark:text-rose-400 font-black text-xs">
                    Due: Rs. {formatMoney(due)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Select a specific sales invoice to clear its balance, or leave on General Balance to collect funds against the customer's total running ledger.
      </p>
    </div>
  );
};
