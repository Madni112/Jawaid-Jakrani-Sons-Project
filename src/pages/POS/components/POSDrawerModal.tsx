import React from 'react';
import {
  LuBanknote,
  LuX,
  LuCheckCircle2,
  LuCalendar,
  LuHistory,
  LuArrowDownLeft,
  LuArrowUpRight,
} from 'react-icons/lu';

interface POSDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawerTab: 'open_day' | 'close_day' | 'movement';
  setDrawerTab: (tab: 'open_day' | 'close_day' | 'movement') => void;
  activeShift: any;
  dayOpenDate: string;
  handleDayOpenDateChange: (val: string) => void;
  dayOpenPettyCash: number;
  setDayOpenPettyCash: (val: number) => void;
  pettyCashSource: string;
  dayOpenCashIn: number;
  setDayOpenCashIn: (val: number) => void;
  dayOpenCashOut: number;
  setDayOpenCashOut: (val: number) => void;
  existingSessionForDate: any;
  handleOpenDaySubmit: () => void;
  dayCloseDate: string;
  setDayCloseDate: (val: string) => void;
  dayCloseCashOut: number;
  setDayCloseCashOut: (val: number) => void;
  dayCloseCashIn: number;
  setDayCloseCashIn: (val: number) => void;
  dayCloseNotes: string;
  setDayCloseNotes: (val: string) => void;
  handleCloseDaySubmit: () => void;
  drawerMovementType: 'in' | 'out';
  setDrawerMovementType: (type: 'in' | 'out') => void;
  drawerAmount: number;
  setDrawerAmount: (val: number) => void;
  drawerReason: string;
  setDrawerReason: (val: string) => void;
  handleDrawerMovement: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
  safeAccentText: string;
}

export const POSDrawerModal: React.FC<POSDrawerModalProps> = ({
  isOpen,
  onClose,
  drawerTab,
  setDrawerTab,
  activeShift,
  dayOpenDate,
  handleDayOpenDateChange,
  dayOpenPettyCash,
  setDayOpenPettyCash,
  pettyCashSource,
  dayOpenCashIn,
  setDayOpenCashIn,
  dayOpenCashOut,
  setDayOpenCashOut,
  existingSessionForDate,
  handleOpenDaySubmit,
  dayCloseDate,
  setDayCloseDate,
  dayCloseCashOut,
  setDayCloseCashOut,
  dayCloseCashIn,
  setDayCloseCashIn,
  dayCloseNotes,
  setDayCloseNotes,
  handleCloseDaySubmit,
  drawerMovementType,
  setDrawerMovementType,
  drawerAmount,
  setDrawerAmount,
  drawerReason,
  setDrawerReason,
  handleDrawerMovement,
  accentColor,
  contrastText,
  isAccentWhite,
  safeAccentText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <LuBanknote size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                Cash Drawer & Day Session
              </h3>
              <p className="text-[10px] text-slate-400">
                Day Open, Day Close petty cash reconciliation & cash in/out
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setDrawerTab('open_day')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              drawerTab === 'open_day'
                ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            style={drawerTab === 'open_day' ? { borderBottom: `2px solid ${safeAccentText}` } : undefined}
          >
            <span>Day Open</span>
          </button>
          <button
            type="button"
            onClick={() => setDrawerTab('close_day')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              drawerTab === 'close_day'
                ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            style={drawerTab === 'close_day' ? { borderBottom: `2px solid ${safeAccentText}` } : undefined}
          >
            <span>Day Close</span>
          </button>
          <button
            type="button"
            onClick={() => setDrawerTab('movement')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              drawerTab === 'movement'
                ? 'bg-white dark:bg-[#111622] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            style={drawerTab === 'movement' ? { borderBottom: `2px solid ${safeAccentText}` } : undefined}
          >
            <span>Cash In / Out</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* TAB 1: DAY OPEN */}
          {drawerTab === 'open_day' && (
            <div className="space-y-4">
              {activeShift ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <LuCheckCircle2 size={16} />
                      <span>Shift #{activeShift.session_number} is Currently Open</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      {activeShift.business_date || new Date(activeShift.opened_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Opening Float: <strong>Rs. {Number(activeShift.opening_float || 0).toLocaleString()}</strong> (Petty Cash: Rs. {Number(activeShift.opening_petty_cash || 0).toLocaleString()}, Cash In: Rs. {Number(activeShift.opening_cash_in || 0).toLocaleString()}).
                  </p>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('close_day')}
                    className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    style={{
                      backgroundColor: accentColor,
                      color: contrastText,
                      border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
                    }}
                  >
                    Proceed to Day Close ➔
                  </button>
                </div>
              ) : (
                <>
                  {/* Date Select */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <LuCalendar size={13} className="text-primary" />
                      <span>Business Date:</span>
                    </label>
                    <input
                      type="date"
                      value={dayOpenDate}
                      onChange={(e) => handleDayOpenDateChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                  </div>

                  {/* Opening Petty Cash */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Petty Cash (Remaining from Last Close):
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {pettyCashSource}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={dayOpenPettyCash || ''}
                      onChange={(e) => setDayOpenPettyCash(Number(e.target.value) || 0)}
                      placeholder="e.g. 20000"
                      className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Cash In */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cash In / Float Added (Rs.):
                    </label>
                    <input
                      type="number"
                      value={dayOpenCashIn || ''}
                      onChange={(e) => setDayOpenCashIn(Number(e.target.value) || 0)}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Optional Cash Out */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Cash Out (Optional Morning Drop / Expense) (Rs.):</span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="number"
                      value={dayOpenCashOut || ''}
                      onChange={(e) => setDayOpenCashOut(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Live Calculation Preview */}
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
                      <span>Petty Cash: Rs. {dayOpenPettyCash.toLocaleString()}</span>
                      <span>+ Cash In: Rs. {dayOpenCashIn.toLocaleString()}</span>
                      <span>- Cash Out: Rs. {dayOpenCashOut.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Total Opening Balance:
                      </span>
                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        Rs. {(dayOpenPettyCash + dayOpenCashIn - dayOpenCashOut).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {existingSessionForDate && (
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          <LuHistory size={15} />
                          <span>Session #{existingSessionForDate.session_number} Exists for {dayOpenDate}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-800 dark:text-blue-200">
                          Closed Session
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        This counter already has <strong>Session #{existingSessionForDate.session_number}</strong> on this date with <strong>Rs. {((existingSessionForDate.cash_sales || 0) + (existingSessionForDate.card_sales || 0) + (existingSessionForDate.digital_sales || 0)).toLocaleString()}</strong> total sales. Reopening will resume Session #{existingSessionForDate.session_number} so all transactions stay consolidated.
                      </p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleOpenDaySubmit}
                    className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: accentColor,
                      color: contrastText,
                      border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
                    }}
                  >
                    {existingSessionForDate
                      ? `Resume Session #${existingSessionForDate.session_number} (${dayOpenDate})`
                      : `Confirm & Open Day (Rs. ${(dayOpenPettyCash + dayOpenCashIn - dayOpenCashOut).toLocaleString()})`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* TAB 2: DAY CLOSE */}
          {drawerTab === 'close_day' && (
            <div className="space-y-4">
              {!activeShift ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    No active shift is currently open.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Please open the day first to record sales and reconcile closing cash.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('open_day')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    style={{
                      backgroundColor: accentColor,
                      color: contrastText,
                      border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
                    }}
                  >
                    Go to Day Open ➔
                  </button>
                </div>
              ) : (
                <>
                  {/* Date Select */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <LuCalendar size={13} className="text-primary" />
                      <span>Closing Date:</span>
                    </label>
                    <input
                      type="date"
                      value={dayCloseDate}
                      onChange={(e) => setDayCloseDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                  </div>

                  {/* Day Sales & Opening Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Opening Petty Cash
                      </span>
                      <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block truncate">
                        Rs. {Number(activeShift.opening_petty_cash ?? activeShift.opening_float ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                        Today's Cash Sales
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate">
                        Rs. {Number(activeShift.cash_sales || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        Card (POS) Sales
                      </span>
                      <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block truncate">
                        Rs. {Number(activeShift.card_sales || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Cash Out */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cash Out (Take Home / Deposit to Owner / Bank) (Rs.):
                    </label>
                    <input
                      type="number"
                      value={dayCloseCashOut || ''}
                      onChange={(e) => setDayCloseCashOut(Number(e.target.value) || 0)}
                      placeholder="e.g. 50000"
                      className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Optional Cash In */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Cash In (Optional late return / recovery) (Rs.):</span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="number"
                      value={dayCloseCashIn || ''}
                      onChange={(e) => setDayCloseCashIn(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Formula Calculation */}
                  {(() => {
                    const sales = Number(activeShift.cash_sales) || 0;
                    const openPetty = Number(activeShift.opening_petty_cash ?? activeShift.opening_float) || 0;
                    const closingPetty = Math.max(0, sales - dayCloseCashOut + dayCloseCashIn + openPetty);

                    return (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                          Closing Formula Calculation
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          Sales (Rs. {sales.toLocaleString()}) - Cash Out (Rs. {dayCloseCashOut.toLocaleString()}) + Cash In (Rs. {dayCloseCashIn.toLocaleString()}) + Opening Petty (Rs. {openPetty.toLocaleString()})
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            Remaining Petty Cash (for Tomorrow):
                          </span>
                          <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                            Rs. {closingPetty.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ This remaining amount will automatically fill tomorrow's Day Open.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Closing Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Closing Notes / Handover:
                    </label>
                    <input
                      type="text"
                      value={dayCloseNotes}
                      onChange={(e) => setDayCloseNotes(e.target.value)}
                      placeholder="e.g. Handed Rs. 40,000 to owner, Rs. 15,000 kept in drawer"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleCloseDaySubmit}
                    className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition shadow-sm cursor-pointer hover:opacity-90 bg-rose-600 hover:bg-rose-700"
                  >
                    Close Day & Finalize Petty Cash
                  </button>
                </>
              )}
            </div>
          )}

          {/* TAB 3: QUICK CASH IN / OUT */}
          {drawerTab === 'movement' && (
            <div className="space-y-4">
              {/* Drawer Live Balance Card */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Calculated Drawer Float & Cash
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  Rs. {Number(activeShift?.expected_cash || 24500).toLocaleString()}
                </div>
              </div>

              {/* Movement Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerMovementType('in')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    drawerMovementType === 'in'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <LuArrowDownLeft size={14} />
                  <span>Cash In (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerMovementType('out')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    drawerMovementType === 'out'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <LuArrowUpRight size={14} />
                  <span>Cash Out (-)</span>
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amount (Rs.):
                </label>
                <input
                  type="number"
                  value={drawerAmount || ''}
                  onChange={(e) => setDrawerAmount(Number(e.target.value) || 0)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Reason / Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reason / Description:
                </label>
                <input
                  type="text"
                  value={drawerReason}
                  onChange={(e) => setDrawerReason(e.target.value)}
                  placeholder="e.g. Petty cash refill, vendor cash drop, tea/refreshment"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleDrawerMovement}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
                style={{
                  backgroundColor: accentColor,
                  color: contrastText,
                  border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
                }}
              >
                Record Cash {drawerMovementType.toUpperCase()}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
