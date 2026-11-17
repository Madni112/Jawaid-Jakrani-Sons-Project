import React from 'react';
import { createPortal } from 'react-dom';
import { LuReceipt, LuX, LuPrinter } from 'react-icons/lu';
import { PosShift, PosSettings, PosTerminalCounter } from '../../../../service/posService';

interface MergedSlipModalProps {
  isMergedSlipOpen: boolean;
  setIsMergedSlipOpen: (open: boolean) => void;
  selectedCashierFilter: string;
  posConfig: PosSettings;
  dateFilter: string;
  terminalsList: PosTerminalCounter[];
  filteredShifts: PosShift[];
  dateStats: {
    totalVolume: number;
    cashSales: number;
    cardSales: number;
    digitalSales: number;
    totalVariance: number;
    count: number;
  };
  hierarchicalBreakdown: any[];
  accentColor: string;
  contrastText: string;
  normCashierName: (name?: string) => string;
  cleanCounterKey: (name?: string) => string;
  resolveTerminalName: (shiftTermCode?: string) => string;
  selectedCounter: string;
}

export const MergedSlipModal: React.FC<MergedSlipModalProps> = ({
  isMergedSlipOpen,
  setIsMergedSlipOpen,
  selectedCashierFilter,
  posConfig,
  dateFilter,
  terminalsList,
  filteredShifts,
  dateStats,
  hierarchicalBreakdown,
  accentColor,
  contrastText,
  normCashierName,
  cleanCounterKey,
  resolveTerminalName,
  selectedCounter,
}) => {
  if (!isMergedSlipOpen) return null;

  return createPortal(
    <div 
      onClick={() => setIsMergedSlipOpen(false)}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleIn"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <LuReceipt className="text-primary" />
            <span>
              {selectedCashierFilter !== 'All'
                ? `Cashier Sales Slip (${selectedCashierFilter})`
                : 'Merged Daily Register Slip'}
            </span>
          </h3>
          <button
            type="button"
            onClick={() => setIsMergedSlipOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Thermal Print Slip Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-merged-slip, #printable-merged-slip * {
                visibility: visible !important;
              }
              #printable-merged-slip {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 78mm !important;
                margin: 0 !important;
                padding: 8px !important;
                background: white !important;
                color: black !important;
              }
            }
          `}} />
          <div id="printable-merged-slip" className="bg-white text-black p-4 rounded-sm font-mono text-xs space-y-2.5 border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0">
            {/* Store Header */}
            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-black">
              <h4 className="font-extrabold text-sm uppercase">{posConfig.store_title}</h4>
              <p className="text-[10px] font-bold">
                {selectedCashierFilter !== 'All'
                  ? 'OFFICIAL CASHIER AUDIT SLIP'
                  : 'STORE-WIDE DAILY CONSOLIDATED SLIP'}
              </p>
              <p className="text-[10px]">
                PERIOD: {dateFilter === 'All' ? 'ALL DATES' : dateFilter === 'Today' ? 'TODAY' : dateFilter}
              </p>
              <p className="text-[9px] text-slate-500">
                Printed: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* SCENARIO 1: TARGETED SPECIFIC CASHIER */}
            {selectedCashierFilter !== 'All' ? (() => {
              const targetedTerminal = terminalsList.find((t) =>
                (t.assigned_cashiers || []).some((c: any) => normCashierName(c.name) === normCashierName(selectedCashierFilter))
              ) || (filteredShifts.length > 0 ? terminalsList.find(t => cleanCounterKey(t.name) === cleanCounterKey(filteredShifts[0].terminal_code)) : null) || terminalsList[0];

              return (
                <div className="space-y-2">
                  <div className="py-1.5 border-b border-dashed border-black space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-bold">TARGETED CASHIER:</span>
                      <span className="font-extrabold uppercase">{selectedCashierFilter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Counter Number:</span>
                      <span className="font-extrabold font-mono">Counter #{targetedTerminal?.counter_number || 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Counter Name:</span>
                      <span className="font-bold">{targetedTerminal?.name || (selectedCounter !== 'All' ? selectedCounter : resolveTerminalName(filteredShifts[0]?.terminal_code))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sessions Worked:</span>
                      <span>{filteredShifts.length} Shifts</span>
                    </div>
                  </div>

                  {/* Financials for Targeted Cashier */}
                  <div className="py-1.5 border-b border-dashed border-black space-y-1 text-[11px]">
                    <div className="flex justify-between font-bold text-xs pt-0.5">
                      <span>TOTAL CASHIER SALES:</span>
                      <span>Rs. {dateStats.totalVolume.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Cash Collected:</span>
                      <span>Rs. {dateStats.cashSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Card / Digital:</span>
                      <span>Rs. {(dateStats.cardSales + dateStats.digitalSales).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Cash Variance:</span>
                      <span>{dateStats.totalVariance >= 0 ? `+${dateStats.totalVariance}` : dateStats.totalVariance}</span>
                    </div>
                  </div>

                  {/* Itemized Sessions list for this cashier */}
                  <div className="py-1 text-[10px] space-y-1">
                    <p className="font-bold uppercase tracking-wider text-[10px] pb-0.5 border-b border-dotted border-black/40">
                      CASHIER SESSIONS BREAKDOWN
                    </p>
                    {filteredShifts.length === 0 ? (
                      <p className="text-slate-500 italic py-1">No shifts recorded for this cashier in selected date.</p>
                    ) : (
                      filteredShifts.map((s) => (
                        <div key={s.id} className="flex justify-between">
                          <span>#{s.session_number} ({new Date(s.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                          <span className="font-bold">Rs. {(s.cash_sales + s.card_sales + s.digital_sales).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })() : (
              /* SCENARIO 2: ALL CASHIERS - COUNTER-WISE & IN EVERY COUNTER CASHIER-WISE */
              <div className="space-y-2.5">
                {/* Overall Summary Box */}
                <div className="py-1.5 border-b border-dashed border-black space-y-1 text-[11px]">
                  <div className="flex justify-between font-extrabold text-xs">
                    <span>STORE TOTAL SALES:</span>
                    <span>Rs. {dateStats.totalVolume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cash Sales:</span>
                    <span>Rs. {dateStats.cashSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Card / Digital:</span>
                    <span>Rs. {(dateStats.cardSales + dateStats.digitalSales).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Shifts Recorded:</span>
                    <span>{dateStats.count} Sessions</span>
                  </div>
                </div>

                {/* Counter-Wise & In every counter Cashier-Wise Section */}
                <div className="space-y-2.5">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-center bg-black/5 py-0.5">
                    *** COUNTER & CASHIER BREAKDOWN ***
                  </p>

                  {hierarchicalBreakdown.map((counter) => (
                    <div key={counter.counterName} className="p-1.5 border border-dashed border-black/60 space-y-1 text-[11px]">
                      {/* Counter Header */}
                      <div className="flex justify-between font-extrabold pb-0.5 border-b border-dotted border-black">
                        <span>COUNTER {counter.counterNumber}: {counter.counterName}</span>
                        <span>Rs. {counter.totalSales.toLocaleString()}</span>
                      </div>

                      {/* Cashiers inside this Counter */}
                      <div className="pt-0.5 space-y-0.5 text-[10px]">
                        {counter.cashiers.map((cashier: any) => (
                          <div key={cashier.cashierName} className="flex justify-between pl-2">
                            <span className="truncate max-w-[170px]">
                              • {cashier.cashierName} ({cashier.shiftsCount} {cashier.shiftsCount === 1 ? 'shift' : 'shifts'})
                            </span>
                            <span className="font-bold font-mono">
                              Rs. {cashier.totalSales.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-600 pt-1 border-t border-dotted border-black/30">
                        <span>Counter Cash: Rs. {counter.cashSales.toLocaleString()}</span>
                        <span>Card: Rs. {counter.cardSales.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center pt-2 text-[9px] text-slate-500 border-t border-dashed border-black">
              *** END OF REPORT ***
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMergedSlipOpen(false)}
            className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            style={{
              backgroundColor: accentColor,
              color: contrastText
            }}
          >
            <LuPrinter size={14} />
            <span>Print Slip</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
