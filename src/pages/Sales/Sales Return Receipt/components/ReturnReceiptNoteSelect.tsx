import React from 'react';
import { MdReceipt, MdClear, MdKeyboardArrowDown } from 'react-icons/md';

interface ReturnReceiptNoteSelectProps {
  returnContainerRef: React.RefObject<HTMLDivElement | null>;
  selectedReturnNo: string;
  returnSearchQuery: string;
  setReturnSearchQuery: (val: string) => void;
  isReturnDropdownOpen: boolean;
  setIsReturnDropdownOpen: (val: boolean) => void;
  highlightedReturnIndex: number;
  setHighlightedReturnIndex: React.Dispatch<React.SetStateAction<number>>;
  filteredReturns: any[];
  returnAllocationsMap: Record<string, any>;
  handleSelectReturn: (returnNo: string) => void;
  formatMoney: (val: number | string | undefined | null) => string;
}

export const ReturnReceiptNoteSelect: React.FC<ReturnReceiptNoteSelectProps> = ({
  returnContainerRef,
  selectedReturnNo,
  returnSearchQuery,
  setReturnSearchQuery,
  isReturnDropdownOpen,
  setIsReturnDropdownOpen,
  highlightedReturnIndex,
  setHighlightedReturnIndex,
  filteredReturns,
  returnAllocationsMap,
  handleSelectReturn,
  formatMoney,
}) => {
  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 relative" ref={returnContainerRef as any}>
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
            Clear Selection (Settle General Balance)
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
              setHighlightedReturnIndex(prev => Math.min(prev + 1, filteredReturns.length));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedReturnIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlightedReturnIndex === 0) {
                handleSelectReturn('');
              } else if (filteredReturns[highlightedReturnIndex - 1]) {
                const r = filteredReturns[highlightedReturnIndex - 1];
                const key = r.return_no && !r.return_no.match(/^RTN-\d{6}$/) ? r.return_no : `RTN-${String(r.id).padStart(4, '0')}`;
                handleSelectReturn(key);
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
          placeholder="Search Return # (e.g. RTN-0001, INV-0002), date, or warehouse..."
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

      {/* Return Autocomplete Dropdown */}
      {isReturnDropdownOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-full max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-700/60">
          {/* Option 1: General Customer Balance Recovery */}
          <div
            onMouseEnter={() => setHighlightedReturnIndex(0)}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelectReturn('');
            }}
            className={`p-3 cursor-pointer text-xs flex justify-between items-center transition ${
              highlightedReturnIndex === 0 || !selectedReturnNo
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-bold text-xs">-- General Customer Balance Payout (All Return Notes) --</span>
              <span className="text-[10px] text-slate-400">Automated FIFO allocation against customer credit balances</span>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              General
            </span>
          </div>

          {/* Return List */}
          {filteredReturns.map((rtn, rIdx) => {
            const key = rtn.return_no && !rtn.return_no.match(/^RTN-\d{6}$/) ? rtn.return_no : `RTN-${String(rtn.id).padStart(4, '0')}`;
            const alloc = returnAllocationsMap[key] || returnAllocationsMap[rtn.return_no] || returnAllocationsMap[rtn.invoice_no];
            const bill = alloc ? alloc.gross : (Number(rtn.total_amount || rtn.total_net_amount) || 0);
            const due = alloc ? alloc.due : Math.max(0, bill - (Number(rtn.payout_amount_paid || (Number(rtn.cash_amount_paid || 0) + Number(rtn.bank_amount || 0)) || rtn.amount_paid) || 0));

            return (
              <div
                key={rtn.id}
                onMouseEnter={() => setHighlightedReturnIndex(rIdx + 1)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectReturn(key);
                }}
                className={`p-3 cursor-pointer text-xs flex justify-between items-center transition ${
                  highlightedReturnIndex === (rIdx + 1) || selectedReturnNo === key
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-400">{key}</span>
                    {rtn.inward_status && (
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        rtn.inward_status === 'Received' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' 
                          : (rtn.inward_status === 'Rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300')
                      }`}>
                        {rtn.inward_status === 'Received' ? 'QC Passed' : rtn.inward_status}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {rtn.return_date || 'N/A'} • {rtn.warehouse || rtn.source_warehouse || 'Main Warehouse'}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-slate-500 text-[10px] block">Credit: Rs. {formatMoney(bill)}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-black text-xs">
                    Refund Due: Rs. {formatMoney(due)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Select a specific customer return note to clear its remaining cash-back balance, or leave on General Balance to disburse refund payouts across open customer return credits.
      </p>
    </div>
  );
};
