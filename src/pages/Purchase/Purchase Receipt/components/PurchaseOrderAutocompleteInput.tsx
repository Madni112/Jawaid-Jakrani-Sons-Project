import React from 'react';
import { MdReceipt, MdClear, MdKeyboardArrowDown } from 'react-icons/md';
import { formatMoney } from '../utils/purchaseReceiptHelpers';
import type { PoAllocationsMap } from '../types/purchaseReceiptTypes';

interface PurchaseOrderAutocompleteInputProps {
  containerRef: React.RefObject<HTMLDivElement>;
  selectedPurchaseNo: string;
  poSearchQuery: string;
  setPoSearchQuery: (q: string) => void;
  isPoDropdownOpen: boolean;
  setIsPoDropdownOpen: (open: boolean) => void;
  highlightedPoIndex: number;
  setHighlightedPoIndex: React.Dispatch<React.SetStateAction<number>>;
  vendorOpeningBalance: number;
  vendorOpeningBalanceVoucherNo: string;
  poAllocationsMap: PoAllocationsMap;
  filteredPurchases: any[];
  onSelectPurchase: (poNo: string) => void;
}

export const PurchaseOrderAutocompleteInput: React.FC<PurchaseOrderAutocompleteInputProps> = ({
  containerRef,
  selectedPurchaseNo,
  poSearchQuery,
  setPoSearchQuery,
  isPoDropdownOpen,
  setIsPoDropdownOpen,
  highlightedPoIndex,
  setHighlightedPoIndex,
  vendorOpeningBalance,
  vendorOpeningBalanceVoucherNo,
  poAllocationsMap,
  filteredPurchases,
  onSelectPurchase
}) => {
  return (
    <div
      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 relative"
      ref={containerRef}
    >
      <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <MdReceipt size={15} className="text-emerald-600" /> Settle Specific Purchase Order (Optional):
        </span>
        {selectedPurchaseNo && (
          <button
            type="button"
            onClick={() => onSelectPurchase('')}
            className="text-[10px] text-emerald-600 hover:underline font-bold cursor-pointer"
          >
            Clear Selection (Pay General Ledger)
          </button>
        )}
      </label>

      <div className="relative">
        <input
          type="text"
          value={poSearchQuery}
          onFocus={() => setIsPoDropdownOpen(true)}
          onKeyDown={(e) => {
            const totalOptions = 1 + (vendorOpeningBalance > 0 ? 1 : 0) + filteredPurchases.length;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedPoIndex((prev) => Math.min(prev + 1, totalOptions - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedPoIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlightedPoIndex === 0) {
                onSelectPurchase('');
              } else if (vendorOpeningBalance > 0 && highlightedPoIndex === 1) {
                onSelectPurchase('OPENING_BALANCE');
              } else {
                const pOffset = vendorOpeningBalance > 0 ? 2 : 1;
                const targetP = filteredPurchases[highlightedPoIndex - pOffset];
                if (targetP) {
                  onSelectPurchase(targetP.purchase_no);
                }
              }
            } else if (e.key === 'Escape') {
              setIsPoDropdownOpen(false);
            }
          }}
          onChange={(e) => {
            setPoSearchQuery(e.target.value);
            setIsPoDropdownOpen(true);
            setHighlightedPoIndex(0);
          }}
          placeholder="Search PO # (e.g. PUR-275918), date, or warehouse..."
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pr-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs focus:border-emerald-600"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedPurchaseNo && (
            <button
              type="button"
              onClick={() => onSelectPurchase('')}
              className="text-slate-400 hover:text-rose-500 cursor-pointer"
            >
              <MdClear size={16} />
            </button>
          )}
          <MdKeyboardArrowDown className="text-slate-400" size={18} />
        </div>
      </div>

      {/* PO Autocomplete Dropdown */}
      {isPoDropdownOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-[9999] w-full max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-700/60">
          {/* Option 1: General Vendor Balance Clearing */}
          <div
            onMouseEnter={() => setHighlightedPoIndex(0)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelectPurchase('');
            }}
            className={`p-3 cursor-pointer text-xs flex justify-between items-center transition ${
              highlightedPoIndex === 0 || !selectedPurchaseNo
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-bold text-xs">-- General Vendor Balance Clearing (All Orders) --</span>
              <span className="text-[10px] text-slate-400">Automated FIFO allocation against oldest open bills &amp; overall ledger</span>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              General
            </span>
          </div>

          {/* Option 2: Vendor Opening Balance (if exists) */}
          {vendorOpeningBalance > 0 && (
            <div
              onMouseEnter={() => setHighlightedPoIndex(1)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectPurchase('OPENING_BALANCE');
              }}
              className={`p-3 cursor-pointer text-xs flex justify-between items-center transition border-b border-slate-100 dark:border-slate-700/60 ${
                highlightedPoIndex === 1 || selectedPurchaseNo === 'OPENING_BALANCE'
                  ? 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs text-amber-700 dark:text-amber-400">
                    Vendor Opening Balance
                  </span>
                  {vendorOpeningBalanceVoucherNo && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-mono font-bold">
                      {vendorOpeningBalanceVoucherNo}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  Initial registered ledger balance (Credit Liability)
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-slate-500 text-[10px] block">
                  Total: Rs. {formatMoney(vendorOpeningBalance)}
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-black text-xs">
                  Due: Rs. {formatMoney(poAllocationsMap['OPENING_BALANCE']?.due ?? vendorOpeningBalance)}
                </span>
              </div>
            </div>
          )}

          {/* PO List */}
          {filteredPurchases.map((pur, pIdx) => {
            const alloc = poAllocationsMap[pur.purchase_no];
            const bill = alloc ? alloc.gross : Number(pur.total_amount) || 0;
            const due = alloc
              ? alloc.due
              : Math.max(
                  0,
                  bill - (Number(pur.cash_amount_paid || 0) + Number(pur.bank_amount_paid || 0))
                );
            const myIdx = (vendorOpeningBalance > 0 ? 2 : 1) + pIdx;

            return (
              <div
                key={pur.id}
                onMouseEnter={() => setHighlightedPoIndex(myIdx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectPurchase(pur.purchase_no);
                }}
                className={`p-3 cursor-pointer text-xs flex justify-between items-center transition ${
                  highlightedPoIndex === myIdx || selectedPurchaseNo === pur.purchase_no
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-400">
                    {pur.purchase_no}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {pur.purchase_date || 'N/A'} • {pur.target_warehouse || 'Main Warehouse'}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-slate-500 text-[10px] block">Bill: Rs. {formatMoney(bill)}</span>
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
        Select a specific consignment order to clear its invoice balance, or leave on General Balance to disburse funds against the vendor's total liability.
      </p>
    </div>
  );
};
