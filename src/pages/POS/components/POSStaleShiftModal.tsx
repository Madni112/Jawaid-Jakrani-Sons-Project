import React from 'react';
import {
  LuAlertTriangle,
  LuX,
  LuBanknote,
  LuFileText,
  LuPrinter,
} from 'react-icons/lu';
import { posService } from '../../../service/posService';

interface POSStaleShiftModalProps {
  isStaleShiftModalOpen: boolean;
  staleShift: any;
  onCloseStaleShiftModal: () => void;
  onOpenCloseForStaleShift: () => void;
  onQuickAutoCloseStaleShift: () => void;
  selectedZReport: any;
  onCloseZReport: () => void;
  onStartTodayFromZReport: () => void;
  posConfig: any;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const POSStaleShiftModal: React.FC<POSStaleShiftModalProps> = ({
  isStaleShiftModalOpen,
  staleShift,
  onCloseStaleShiftModal,
  onOpenCloseForStaleShift,
  onQuickAutoCloseStaleShift,
  selectedZReport,
  onCloseZReport,
  onStartTodayFromZReport,
  posConfig,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  return (
    <>
      {/* ── UNCLOSED PREVIOUS DAY SHIFT DETECTED MODAL ── */}
      {isStaleShiftModalOpen && staleShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3.5 bg-amber-500/10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <LuAlertTriangle size={22} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                    Previous Day Shift Not Closed
                  </h3>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 font-medium leading-relaxed">
                  The register was not closed for <strong className="font-bold">{posService.getShiftBusinessDate(staleShift)}</strong>. Retail accounting requires closing the previous day's shift before ringing up new sales today.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseStaleShiftModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                title="Dismiss (Sales will remain blocked until closed)"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Shift Details Summary */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Unclosed Date
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5 block font-mono">
                    {posService.getShiftBusinessDate(staleShift)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Shift Session
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5 block">
                    Shift #{staleShift.session_number}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Drawer Expected
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">
                    Rs. {Number(staleShift.expected_cash || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Cash Sales
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 mt-0.5 block font-mono">
                    Rs. {Number(staleShift.cash_sales || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>Tip:</strong> Choose <em>Close Shift with Cash Counts</em> to count drawer cash & enter notes, or <em>Quick Auto-Close</em> to balance with zero discrepancy and start today immediately.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col gap-2">
              <button
                type="button"
                onClick={onOpenCloseForStaleShift}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                style={{
                  backgroundColor: accentColor,
                  color: contrastText,
                  border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
                }}
              >
                <LuBanknote size={15} />
                <span>Close Shift with Cash Counts & Z-Report</span>
              </button>

              <button
                type="button"
                onClick={onQuickAutoCloseStaleShift}
                className="w-full py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Quick Auto-Close & Open Today (Rs. {Number(staleShift.expected_cash || 0).toLocaleString()} Forward)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY Z-REPORT SLIP MODAL ── */}
      {selectedZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <LuFileText className="text-primary" />
                <span>Daily Z-Report Slip #{selectedZReport.session_number}</span>
              </h3>
              <button
                type="button"
                onClick={onCloseZReport}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Thermal Print Receipt */}
            <div className="bg-white text-black p-4 rounded-sm font-mono text-xs space-y-2 border border-slate-300 shadow-sm">
              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-black">
                <h4 className="font-extrabold text-sm uppercase">{posConfig?.store_title || 'AL MUHAMMADI'}</h4>
                <p className="text-[10px]">DAILY Z-REPORT • CASHIER CLOSE</p>
                <p className="text-[10px]">Terminal: {selectedZReport.terminal_code}</p>
                <p className="text-[10px]">Cashier: {selectedZReport.cashier_name}</p>
              </div>

              <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Session:</span>
                  <span className="font-bold">#{selectedZReport.session_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Business Date:</span>
                  <span className="font-bold">{selectedZReport.business_date || new Date(selectedZReport.opened_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Opened:</span>
                  <span>{new Date(selectedZReport.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closed:</span>
                  <span>{selectedZReport.closed_at ? new Date(selectedZReport.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Open'}</span>
                </div>
              </div>

              {/* Financial Tenders with Card Sales highlighted */}
              <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>Rs. {Number(selectedZReport.opening_float || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales:</span>
                  <span>Rs. {Number(selectedZReport.cash_sales || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold bg-slate-100 px-1 py-0.5 rounded">
                  <span>Card (POS) Sales:</span>
                  <span>Rs. {Number(selectedZReport.card_sales || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Digital / QR Sales:</span>
                  <span>Rs. {Number(selectedZReport.digital_sales || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash In / Out:</span>
                  <span>+{Number(selectedZReport.cash_in || 0).toLocaleString()} / -{Number(selectedZReport.cash_out || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-dotted border-black">
                  <span>TOTAL SALES VOLUME:</span>
                  <span>Rs. {((Number(selectedZReport.cash_sales || 0)) + (Number(selectedZReport.card_sales || 0)) + (Number(selectedZReport.digital_sales || 0))).toLocaleString()}</span>
                </div>
              </div>

              {/* Reconciliation Balance */}
              <div className="py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Expected Drawer Cash:</span>
                  <span>Rs. {Number(selectedZReport.expected_cash || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closing Petty Cash (Rolled):</span>
                  <span className="font-bold">Rs. {Number(selectedZReport.closing_petty_cash || 0).toLocaleString()}</span>
                </div>
                {selectedZReport.closing_notes && (
                  <div className="text-[10px] text-slate-600 pt-1 border-t border-dotted border-black">
                    Notes: {selectedZReport.closing_notes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCloseZReport}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LuPrinter size={14} />
                  <span>Print Z-Report</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onStartTodayFromZReport}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Start Today's Day Session ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
