import React from 'react';
import { createPortal } from 'react-dom';
import { LuFileText, LuX, LuPrinter } from 'react-icons/lu';
import { PosShift, PosSettings } from '../../../../service/posService';

interface ZReportModalProps {
  selectedZReport: PosShift | null;
  setSelectedZReport: (shift: PosShift | null) => void;
  posConfig: PosSettings;
  resolveTerminalName: (code?: string) => string;
  getShiftCashierBreakdown: (shift: PosShift) => any[];
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({
  selectedZReport,
  setSelectedZReport,
  posConfig,
  resolveTerminalName,
  getShiftCashierBreakdown,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  if (!selectedZReport) return null;

  const breakdown = getShiftCashierBreakdown(selectedZReport);
  const shiftTotal = (selectedZReport.cash_sales + selectedZReport.card_sales + selectedZReport.digital_sales);
  const cashierNames = breakdown.map(c => c.name);

  return createPortal(
    <div 
      onClick={() => setSelectedZReport(null)}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-fadeIn overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[92vh] flex flex-col my-auto rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleIn"
      >
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between shrink-0">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <LuFileText className="text-primary" size={16} />
            <span>Daily Z-Report Slip #{selectedZReport.session_number}</span>
          </h3>
          <button
            type="button"
            onClick={() => setSelectedZReport(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Thermal Print Receipt & Scrollable Canvas */}
        <div className="flex-1 overflow-y-auto p-4 pb-8 bg-slate-100 dark:bg-[#0c1017] flex justify-center items-start">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-zreport-slip, #printable-zreport-slip * {
                visibility: visible !important;
              }
              #printable-zreport-slip {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 78mm !important;
                margin: 0 !important;
                padding: 8px 8px 36px 8px !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
                page-break-after: avoid !important;
              }
            }
          `}} />
          <div id="printable-zreport-slip" className="w-full max-w-[340px] bg-white text-black p-5 pb-6 font-mono text-xs space-y-2.5 rounded-md border border-slate-300 shadow-md print:border-none print:shadow-none print:p-0 print:max-w-none">
            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-black">
              <h4 className="font-extrabold text-sm uppercase">{posConfig.store_title}</h4>
              <p className="text-[10px]">DAILY Z-REPORT • CASHIER CLOSE</p>
              <p className="text-[10px]">Terminal: {resolveTerminalName(selectedZReport.terminal_code)}</p>
              <p className="text-[10px] font-bold">
                {cashierNames.length > 1 ? `Cashiers Active: ${cashierNames.join(', ')}` : `Cashier: ${selectedZReport.cashier_name}`}
              </p>
            </div>

            <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Session:</span>
                <span className="font-bold">#{selectedZReport.session_number}</span>
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

            {/* Cashier-Wise Sales Breakdown */}
            <div className="py-2 border-b border-dashed border-black space-y-1.5 text-[11px]">
              <div className="font-black text-[10px] uppercase tracking-wider text-black flex justify-between items-center pb-0.5 border-b border-dotted border-black/40">
                <span>CASHIER SALES BREAKDOWN:</span>
                <span>AMOUNT</span>
              </div>
              <div className="space-y-1.5 pt-0.5">
                {breakdown.map((c: any) => {
                  const share = shiftTotal > 0 ? ((c.total / shiftTotal) * 100).toFixed(0) : '0';
                  return (
                    <div key={c.name} className="space-y-0.5">
                      <div className="flex justify-between items-baseline font-bold">
                        <span className="capitalize text-black font-extrabold">• {c.name}</span>
                        <span className="font-bold font-mono">Rs. {c.total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-600 pl-2">
                        <span>
                          {c.ordersCount > 0 ? `${c.ordersCount} ${c.ordersCount === 1 ? 'sale' : 'sales'}` : 'Shift float / opener'}
                          {c.cash > 0 && c.card > 0
                            ? ` (Cash: Rs. ${c.cash.toLocaleString()} | Card: Rs. ${c.card.toLocaleString()})`
                            : c.card > 0
                            ? ` (Card: Rs. ${c.card.toLocaleString()})`
                            : ` (Cash: Rs. ${c.cash.toLocaleString()})`
                          }
                        </span>
                        <span className="font-mono">{share}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Tenders */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Opening Float:</span>
                <span>Rs. {selectedZReport.opening_float.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Sales:</span>
                <span>Rs. {selectedZReport.cash_sales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Card Sales:</span>
                <span>Rs. {selectedZReport.card_sales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Digital / QR Sales:</span>
                <span>Rs. {selectedZReport.digital_sales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash In / Out:</span>
                <span>+{selectedZReport.cash_in} / -{selectedZReport.cash_out}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-dotted border-black">
                <span>TOTAL SALES VOLUME:</span>
                <span>Rs. {(selectedZReport.cash_sales + selectedZReport.card_sales + selectedZReport.digital_sales).toLocaleString()}</span>
              </div>
            </div>

            {/* Reconciliation Balance */}
            <div className="py-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>Expected Drawer Cash:</span>
                <span>Rs. {selectedZReport.expected_cash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Actual Counted:</span>
                <span>Rs. {(selectedZReport.actual_counted_cash ?? selectedZReport.expected_cash).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-dotted border-black/40">
                <span>Cash Variance:</span>
                <span className={selectedZReport.variance && selectedZReport.variance !== 0 ? 'text-rose-600' : ''}>
                  {selectedZReport.variance !== undefined ? (selectedZReport.variance >= 0 ? `+${selectedZReport.variance}` : selectedZReport.variance) : 0}
                </span>
              </div>
            </div>

            {/* Official Software & System Provider Footer */}
            <div className="pt-3 pb-2 text-center border-t border-dashed border-black/80 text-[10px] space-y-1">
              <p className="font-extrabold text-[10px] uppercase text-black tracking-wider">
                NHT ENTERPRISES
              </p>
              <p className="text-[9px] text-slate-600 font-mono">
                Cloud ERP & POS Systems
              </p>
              <p className="text-[9px] text-slate-700 font-mono font-bold">
                Contact / Support: +92 312 8039911
              </p>
              <div className="pt-1 text-[8px] text-slate-400 font-mono">
                Daily Reconciliation Audit Report • System Generated
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-3 bg-white dark:bg-[#111622] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedZReport(null)}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            style={{
              backgroundColor: accentColor,
              color: contrastText,
              border: isAccentWhite ? '1px solid #cbd5e1' : undefined
            }}
          >
            <LuPrinter size={14} />
            <span>Print Z-Report</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
