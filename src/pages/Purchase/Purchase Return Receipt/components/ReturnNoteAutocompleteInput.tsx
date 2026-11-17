import React from 'react';
import { MdReceipt, MdClear, MdKeyboardArrowDown } from 'react-icons/md';
import { formatMoney } from '../utils/purchaseReturnReceiptHelpers';

interface ReturnNoteAutocompleteInputProps {
  returnContainerRef: React.RefObject<HTMLDivElement>;
  returnSearchQuery: string;
  setReturnSearchQuery: (q: string) => void;
  isReturnDropdownOpen: boolean;
  setIsReturnDropdownOpen: (open: boolean) => void;
  highlightedReturnIndex: number;
  setHighlightedReturnIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedReturnNo: string;
  filteredReturns: any[];
  returnAllocationsMap: Record<string, any>;
  handleSelectReturn: (returnNo: string) => void;
}

export const ReturnNoteAutocompleteInput: React.FC<ReturnNoteAutocompleteInputProps> = ({
  returnContainerRef,
  returnSearchQuery,
  setReturnSearchQuery,
  isReturnDropdownOpen,
  setIsReturnDropdownOpen,
  highlightedReturnIndex,
  setHighlightedReturnIndex,
  selectedReturnNo,
  filteredReturns,
  returnAllocationsMap,
  handleSelectReturn,
}) => {
  return (
    <div
      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 relative"
      ref={returnContainerRef}
    >
      <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <MdReceipt size={15} className="text-emerald-600" /> Settle Specific Return Note (Optional):
        </span>
        {selectedReturnNo && (
          <button
            type="button"
            onClick={() => handleSelectReturn('')}
            className="text-[10px] text-emerald-600 hover:underline font-bold cursor-pointer"
          >
            Clear Selection (Recover General Balance)
          </button>
        )}
      </label>

      <div className="relative">
        <input
          type="text"
          value={returnSearchQuery}
          onFocus={() => setIsReturnDropdownOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedReturnIndex((prev) => Math.min(prev + 1, filteredReturns.length));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedReturnIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlightedReturnIndex === 0) {
                handleSelectReturn('');
              } else if (filteredReturns[highlightedReturnIndex - 1]) {
                handleSelectReturn(filteredReturns[highlightedReturnIndex - 1].return_no);
              }
            } else if (e.key === 'Escape') {
              setIsReturnDropdownOpen(false);
            }
          }}
          onChange={(e) => {
            setReturnSearchQuery(e.target.value);
            setIsReturnDropdownOpen(true);
            setHighlightedReturnIndex(0);
          }}
          placeholder="Search Return # (e.g. RTN-592942), date, or warehouse..."
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pr-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs focus:border-emerald-600"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedReturnNo && (
            <button
              type="button"
              onClick={() => handleSelectReturn('')}
              className="text-slate-400 hover:text-rose-500 cursor-pointer"
            >
              <MdClear size={16} />
            </button>
          )}
          <MdKeyboardArrowDown className="text-slate-400" size={18} />
        </div>
      </div>

      {/* Dropdown Options */}
      {isReturnDropdownOpen && (
        <div className="absolute left-0 top-full mt-2 z-[9999] w-full max-h-96 overflow-y-auto bg-white dark:bg-slate-800 border-2 border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-700/60 animate-modal-pop">
          <div
            onMouseEnter={() => setHighlightedReturnIndex(0)}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelectReturn('');
            }}
            className={`p-4 cursor-pointer text-xs flex justify-between items-center transition ${
              highlightedReturnIndex === 0 || !selectedReturnNo
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
            }`}
          >
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">
                ✨ General Vendor Balance Recovery (Unlinked)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Applies refund across all open debit notes automatically via FIFO
              </span>
            </div>
          </div>

          {filteredReturns.map((rtn, rIdx) => {
            const alloc = returnAllocationsMap[rtn.return_no];
            const dueAmt = alloc ? alloc.due : Number(rtn.total_amount) - Number(rtn.amount_paid || 0);

            return (
              <div
                key={rtn.id}
                onMouseEnter={() => setHighlightedReturnIndex(rIdx + 1)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectReturn(rtn.return_no);
                }}
                className={`p-4 cursor-pointer text-xs flex justify-between items-center transition ${
                  highlightedReturnIndex === rIdx + 1 || selectedReturnNo === rtn.return_no
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                      Debit Note #{rtn.return_no}
                    </span>
                    {rtn.childDispatches?.length > 0 && (
                      <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-md font-semibold border border-purple-200 dark:border-purple-800">
                        Challans: {[rtn.return_no, ...rtn.childDispatches.map((c: any) => c.return_no)].join(', ')}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Date: {rtn.return_date || '-'} • Origin:{' '}
                    {rtn.purchase_no ? `Purchase ${rtn.purchase_no}` : rtn.source_warehouse || 'Warehouse'}
                  </span>
                </div>
                <div className="text-right flex flex-col items-end gap-0.5">
                  <span className="font-mono font-bold text-sm block text-slate-900 dark:text-white">
                    Due: Rs. {formatMoney(dueAmt)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gross: Rs. {formatMoney(rtn.total_amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
