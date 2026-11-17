import React from 'react';
import {
  Banknote,
  Check,
  Printer,
  Settings2,
  Undo2,
  X
} from 'lucide-react';
import { IconAction } from '../../../Masters/masterUi';
import {
  LoanRecoveryItem,
  PayItem,
  PayrollLine,
  SalarySheetView
} from '../../../../services/hr.service';
import { getBrandConfig } from '../../../../utils/brand';
import {
  addUp,
  dayFig,
  money,
  printIsolatedElement,
  SHEET_TONE
} from '../utils/salarySheetUtils';
import PayOutDrawer from '../modals/PayOutDrawer';
import ManualLineAdjusterDrawer from '../modals/ManualLineAdjusterDrawer';

interface SalarySheetDetailViewProps {
  detail: SalarySheetView;
  hasUnsavedChanges: boolean;
  busy: boolean;
  editable: boolean;
  opts: {
    deductForAbsence: boolean;
    recoverLoans: boolean;
    payBonus: boolean;
    bonusAmount: number;
    bonusReason: string;
  };
  pay: {
    open: boolean;
    payThrough: string;
    accountId: string;
    date: string;
  };
  setPay: React.Dispatch<React.SetStateAction<{
    open: boolean;
    payThrough: string;
    accountId: string;
    date: string;
  }>>;
  payThroughOptions: string[];
  accounts: any[];
  heads: any[];
  draftMode: boolean;
  adjusting: number | null;
  setAdjusting: (id: number | null) => void;
  adjust: {
    extraEarnings: PayItem[];
    extraDeductions: PayItem[];
    loanRecoveries: LoanRecoveryItem[];
    remarks: string;
  };
  setAdjust: React.Dispatch<React.SetStateAction<{
    extraEarnings: PayItem[];
    extraDeductions: PayItem[];
    loanRecoveries: LoanRecoveryItem[];
    remarks: string;
  }>>;
  onCloseDetail: () => void;
  onSaveDraftChanges: () => void;
  onDiscardDraftChanges: () => void;
  onApprove: (s: SalarySheetView) => void;
  onUnapprove: (s: SalarySheetView) => void;
  onPayOut: (s: SalarySheetView) => void;
  onApplyPayrollOptions: (newOpts: any) => void;
  onBonusChange: (empId: number, bonusVal: number) => void;
  onBonusReasonChange: (empId: number, reason: string) => void;
  onAbsentCutChange: (empId: number, cutVal: number) => void;
  onLoanRecoveryAmountChange: (empId: number, loanId: number, newAmount: number) => void;
  onStartAdjust: (l: PayrollLine) => void;
  onAddItem: (kind: 'extraEarnings' | 'extraDeductions', headId: number) => void;
  onSaveAdjust: (s: SalarySheetView, employeeId: number) => void;
}

export const SalarySheetDetailView: React.FC<SalarySheetDetailViewProps> = ({
  detail,
  hasUnsavedChanges,
  busy,
  editable,
  opts,
  pay,
  setPay,
  payThroughOptions,
  accounts,
  heads,
  draftMode,
  adjusting,
  setAdjusting,
  adjust,
  setAdjust,
  onCloseDetail,
  onSaveDraftChanges,
  onDiscardDraftChanges,
  onApprove,
  onUnapprove,
  onPayOut,
  onApplyPayrollOptions,
  onBonusChange,
  onBonusReasonChange,
  onAbsentCutChange,
  onLoanRecoveryAmountChange,
  onStartAdjust,
  onAddItem,
  onSaveAdjust
}) => {
  return (
    <>
      {/* Sheet Detail Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50/70 dark:bg-meta-4/20 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCloseDetail}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>All Sheets</span>
          </button>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <h3 className="font-bold text-black dark:text-white text-base">
            {detail.number} — {detail.monthLabel}
          </h3>
          <span
            className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
              SHEET_TONE[detail.status]
            }`}
          >
            {detail.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              printIsolatedElement(
                'printable-salary-sheet-detail',
                'landscape',
                `${detail.number} - ${detail.monthLabel} Payroll`
              )
            }
            className="px-3 py-1.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4 text-black dark:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span>Print Sheet Register</span>
          </button>

          {detail.status === 'Draft' && hasUnsavedChanges && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onSaveDraftChanges}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer animate-pulse"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onDiscardDraftChanges}
                className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </>
          )}

          {detail.status === 'Draft' && (
            <button
              type="button"
              disabled={busy || !editable}
              onClick={() => onApprove(detail)}
              className="px-4 py-1.5 rounded-xl bg-primary hover:bg-opacity-90 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve &amp; Post Journal</span>
            </button>
          )}

          {detail.status === 'Approved' && (
            <>
              <button
                type="button"
                disabled={busy || !editable}
                onClick={() =>
                  setPay((p) => ({
                    ...p,
                    open: !p.open,
                    payThrough: detail.payThrough,
                    accountId: String(detail.accountId ?? '')
                  }))
                }
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Pay Out</span>
              </button>
              <button
                type="button"
                disabled={busy || !editable}
                onClick={() => onUnapprove(detail)}
                className="px-3 py-1.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4 text-black dark:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Un-approve</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onCloseDetail}
            className="p-1.5 rounded-lg text-gray-400 hover:text-black dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pay Out Drawer */}
      <PayOutDrawer
        open={pay.open}
        detail={detail}
        pay={pay}
        setPay={setPay}
        payThroughOptions={payThroughOptions}
        accounts={accounts}
        busy={busy}
        onPayOut={onPayOut}
      />

      {/* Sheet Detail Summary Badges & Batch Pill Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-stroke dark:border-strokedark bg-gray-50/30 dark:bg-meta-4/10">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-300">
          <span>
            Staff: <strong className="text-black dark:text-white">{detail.employees}</strong>
          </span>
          <span>·</span>
          <span>
            Gross: <strong className="text-black dark:text-white">{money(detail.gross)}</strong>
          </span>
          <span>·</span>
          <span>
            Withheld: <strong className="text-amber-600">{money(detail.deductions)}</strong>
          </span>
          <span>·</span>
          <span>
            Net Payable:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {money(detail.netPayable)}
            </strong>
          </span>
          <span>·</span>
          <span>
            Unpaid Days: <strong>{dayFig(detail.unpaidDays)}</strong>
          </span>
        </div>

        {/* Pill Selectors for Draft Sheet */}
        {detail.status === 'Draft' && editable && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onApplyPayrollOptions({ ...opts, deductForAbsence: !opts.deductForAbsence })
              }
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                opts.deductForAbsence
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 shadow-2xs'
                  : 'bg-white text-gray-500 border-gray-200 dark:bg-boxdark dark:text-gray-400 dark:border-strokedark hover:border-gray-300'
              }`}
              title="Toggle automatic pay cuts for absent days"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  opts.deductForAbsence ? 'bg-amber-600' : 'bg-gray-400'
                }`}
              />
              <span>Absent Cut: {opts.deductForAbsence ? 'Active' : 'Off'}</span>
            </button>

            <button
              type="button"
              onClick={() => onApplyPayrollOptions({ ...opts, recoverLoans: !opts.recoverLoans })}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                opts.recoverLoans
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs'
                  : 'bg-white text-gray-500 border-gray-200 dark:bg-boxdark dark:text-gray-400 dark:border-strokedark hover:border-gray-300'
              }`}
              title="Toggle loan & advance installment recoveries"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  opts.recoverLoans ? 'bg-emerald-600' : 'bg-gray-400'
                }`}
              />
              <span>Loan Recovery: {opts.recoverLoans ? 'Active' : 'Off'}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onApplyPayrollOptions({ ...opts, payBonus: !opts.payBonus })}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  opts.payBonus
                    ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 shadow-2xs'
                    : 'bg-white text-gray-500 border-gray-200 dark:bg-boxdark dark:text-gray-400 dark:border-strokedark hover:border-gray-300'
                }`}
                title="Toggle flat bonus for all employees"
              >
                <span
                  className={`w-2 h-2 rounded-full ${opts.payBonus ? 'bg-blue-600' : 'bg-gray-400'}`}
                />
                <span>Bonus: {opts.payBonus ? `Rs. ${money(opts.bonusAmount)}` : 'Off'}</span>
              </button>
              {opts.payBonus && (
                <div className="flex items-center gap-1 animate-fade-in">
                  <input
                    type="number"
                    min="0"
                    value={opts.bonusAmount}
                    onChange={(e) =>
                      onApplyPayrollOptions({ ...opts, bonusAmount: Number(e.target.value) })
                    }
                    className="w-20 px-2 py-0.5 text-right text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="10000"
                    title="Bonus amount per staff"
                  />
                  <input
                    type="text"
                    value={opts.bonusReason}
                    onChange={(e) =>
                      onApplyPayrollOptions({ ...opts, bonusReason: e.target.value })
                    }
                    className="w-28 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Bonus Reason"
                    title="Bonus reason"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payslip Lines Table */}
      <div className="overflow-x-auto max-h-[64vh]">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-gray-100/70 dark:bg-meta-4/30 text-gray-700 dark:text-gray-300 sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3 font-bold">Emp #</th>
              <th className="py-2.5 px-3 font-bold">Staff Name</th>
              <th className="py-2.5 px-3 font-bold">Designation</th>
              <th className="py-2.5 px-3 font-bold text-right">Basic</th>
              <th className="py-2.5 px-3 font-bold text-right">Bonus</th>
              <th className="py-2.5 px-3 font-bold text-right">Deductions</th>
              <th className="py-2.5 px-3 font-bold text-right">Absence</th>
              <th className="py-2.5 px-3 font-bold text-right">Net Pay</th>
              <th className="py-2.5 px-3 font-bold text-right">Days (P/A/L)</th>
              <th className="py-2.5 px-3 font-bold">Recoveries</th>
              <th className="py-2.5 px-3 font-bold text-center">Status</th>
              <th className="py-2.5 px-3 font-bold text-right w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark">
            {detail.lines.map((l) => (
              <React.Fragment key={l.employeeId}>
                <tr
                  className={`transition hover:bg-primary/5 dark:hover:bg-meta-4/40 ${
                    adjusting === l.employeeId ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold">{l.employeeCode}</td>
                  <td className="py-2.5 px-3">
                    <span className="block font-bold text-black dark:text-white">
                      {l.employeeName}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-black dark:text-white">
                    {l.designation || l.department || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium">{money(l.basic)}</td>
                  <td className="py-2 px-2 text-right">
                    {detail.status === 'Draft' ? (
                      <div className="flex flex-col items-end gap-1">
                        <input
                          type="number"
                          min="0"
                          value={l.bonus ?? Math.max(0, l.gross - l.basic) ?? 0}
                          onChange={(e) => onBonusChange(l.employeeId, Number(e.target.value))}
                          className="w-20 px-2 py-1 text-right text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark focus:border-blue-500 rounded-lg focus:outline-none transition"
                          title="Bonus amount for this employee"
                        />
                        <input
                          type="text"
                          placeholder="Bonus Reason"
                          value={l.bonusReason || ''}
                          onChange={(e) => onBonusReasonChange(l.employeeId, e.target.value)}
                          className="w-24 px-1.5 py-0.5 text-right text-[10px] text-gray-600 dark:text-gray-300 bg-transparent border-b border-stroke dark:border-strokedark focus:border-blue-500 focus:outline-none placeholder:text-gray-400"
                          title="Custom bonus reason for this employee"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {money(l.bonus ?? Math.max(0, l.gross - l.basic))}
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          {l.bonusReason ||
                            l.earnings
                              .filter((i) => i.headId)
                              .map((i) => `${i.name} ${money(i.amount)}`)
                              .join(' · ') ||
                            (l.extraEarnings && l.extraEarnings.length > 0
                              ? l.extraEarnings.map((i) => `${i.name} ${money(i.amount)}`).join(' · ')
                              : 'no heads')}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-600 font-semibold">
                    {money(l.totalDeductions)}
                    <span className="block text-[10px] text-gray-400">
                      {l.deductions.map((i) => `${i.name} ${money(i.amount)}`).join(' · ') ||
                        'none'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-medium">
                    {detail.status === 'Draft' ? (
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          min="0"
                          value={l.absentCut ?? l.absence ?? 0}
                          onChange={(e) => onAbsentCutChange(l.employeeId, Number(e.target.value))}
                          className="w-20 px-2 py-1 text-right text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark focus:border-rose-500 rounded-lg focus:outline-none transition"
                          title="Custom absence deduction for this employee"
                        />
                      </div>
                    ) : l.absence ? (
                      <span className="text-rose-600 font-semibold">{money(l.absence)}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {money(l.net)}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <span className="text-emerald-600 font-bold">{l.present}</span>
                    <span className="text-gray-300"> / </span>
                    <span className={l.absent ? 'text-rose-600 font-bold' : ''}>
                      {l.absent}
                    </span>
                    <span className="text-gray-300"> / </span>
                    <span>{l.leaves}</span>
                    <span className="block text-[10px] text-gray-400">
                      of {l.payableDays} days
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {((l.loanRecoveries && l.loanRecoveries.length)
                      ? l.loanRecoveries
                      : l.recoveries) &&
                    (
                      (l.loanRecoveries && l.loanRecoveries.length)
                        ? l.loanRecoveries
                        : l.recoveries
                    ).length ? (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {(
                          (l.loanRecoveries && l.loanRecoveries.length)
                            ? l.loanRecoveries
                            : l.recoveries
                        ).map((r: any, ri: number) =>
                          detail.status === 'Draft' ? (
                            <div
                              key={ri}
                              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition ${
                                (r.deductAmount ?? r.amount ?? 0) === 0 || r.isSkipped
                                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              <span className="font-mono text-[10px]">{r.number}:</span>
                              <span className="text-[10px] text-gray-500">Rs.</span>
                              <input
                                type="number"
                                min="0"
                                value={r.deductAmount ?? r.amount ?? 0}
                                onChange={(e) =>
                                  onLoanRecoveryAmountChange(
                                    l.employeeId,
                                    r.loanId,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-16 px-1.5 py-0.5 text-right font-bold text-black dark:text-white bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded focus:outline-none focus:border-amber-500"
                                title="Edit loan recovery deduction for this employee"
                              />
                            </div>
                          ) : (
                            <span
                              key={ri}
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                r.isSkipped || (r.deductAmount ?? r.amount) === 0
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {r.number}{' '}
                              {r.isSkipped || (r.deductAmount ?? r.amount) === 0
                                ? '(Skipped)'
                                : `Rs. ${money(r.deductAmount ?? r.amount)}`}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                    {l.extraEarnings.length + l.extraDeductions.length > 0 && (
                      <span className="block text-[10px] text-gray-400 italic mt-0.5">
                        {[...l.extraEarnings, ...l.extraDeductions]
                          .map((i) => `${i.name} ${money(i.amount)}`)
                          .join(' · ')}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {l.paid ? (
                      <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                        Paid
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <IconAction
                        title="Adjust payslip lines"
                        tone="primary"
                        disabled={!draftMode}
                        onClick={() =>
                          adjusting === l.employeeId ? setAdjusting(null) : onStartAdjust(l)
                        }
                      >
                        <Settings2 className="w-4 h-4" />
                      </IconAction>
                    </div>
                  </td>
                </tr>

                {/* Manual Line Adjuster Drawer */}
                <ManualLineAdjusterDrawer
                  adjusting={adjusting}
                  employeeId={l.employeeId}
                  draftMode={draftMode}
                  adjust={adjust}
                  setAdjust={setAdjust}
                  heads={heads}
                  addItem={onAddItem}
                  saveAdjust={onSaveAdjust}
                  detail={detail}
                  busy={busy}
                  onCancel={() => setAdjusting(null)}
                />
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100/80 dark:bg-meta-4/40 font-black text-black dark:text-white">
              <td colSpan={3} className="py-2.5 px-3">
                Total ({detail.employees} Staff)
              </td>
              <td className="py-2.5 px-3 text-right">
                {money(addUp(detail.lines, (l) => l.basic))}
              </td>
              <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400">
                {money(addUp(detail.lines, (l) => Math.max(0, l.gross - l.basic)))}
              </td>
              <td className="py-2.5 px-3 text-right text-amber-600">
                {money(detail.deductions)}
              </td>
              <td className="py-2.5 px-3 text-right text-rose-600">
                {money(addUp(detail.lines, (l) => Number(l.absentCut ?? l.absence ?? 0)))}
              </td>
              <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                {money(detail.netPayable)}
              </td>
              <td colSpan={4} className="py-2.5 px-3 text-[11px] text-gray-500 font-normal">
                Net Amount Payable to staff after all deductions and loan recoveries
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Hidden Printable Salary Sheet Detail for A4 Landscape printout */}
      <div id="printable-salary-sheet-detail" className="hidden">
        <div className="print-header">
          <h1>{getBrandConfig().fullName}</h1>
          <h2>MONTHLY SALARY SHEET &amp; PAYROLL REGISTER — {detail.monthLabel}</h2>
          <div className="meta-grid">
            <span>
              <strong>Sheet #:</strong> {detail.number}
            </span>
            <span>
              <strong>Period:</strong> {detail.monthLabel}
            </span>
            <span>
              <strong>Staff Count:</strong> {detail.employees}
            </span>
            <span>
              <strong>Disbursement Via:</strong> {detail.payThrough}
            </span>
            <span>
              <strong>Status:</strong> {detail.status}
            </span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th className="text-left" style={{ width: '80px' }}>
                Emp #
              </th>
              <th className="text-left">Employee Name</th>
              <th className="text-left" style={{ width: '130px' }}>
                Designation
              </th>
              <th className="text-right" style={{ width: '100px' }}>
                Basic Pay
              </th>
              <th className="text-right" style={{ width: '90px' }}>
                Bonus
              </th>
              <th className="text-right" style={{ width: '90px' }}>
                Absence Cut
              </th>
              <th className="text-right" style={{ width: '105px' }}>
                Loan / Adv
              </th>
              <th className="text-right font-black" style={{ width: '110px' }}>
                Net Pay
              </th>
              <th className="text-center" style={{ width: '120px' }}>
                Signature
              </th>
            </tr>
          </thead>
          <tbody>
            {detail.lines.map((l) => (
              <tr key={l.employeeId}>
                <td className="font-mono text-left">{l.employeeCode}</td>
                <td className="font-bold text-left">{l.employeeName}</td>
                <td className="text-left">{l.designation || l.department || 'Staff'}</td>
                <td className="text-right">{money(l.basic)}</td>
                <td className="text-right">{money(l.bonus || 0)}</td>
                <td className="text-right">{money(l.absentCut || l.absence || 0)}</td>
                <td className="text-right">
                  {money(l.advanceDeduction || l.loanDeduction || 0)}
                </td>
                <td className="text-right font-black">{money(l.netPay ?? l.net ?? 0)}</td>
                <td className="text-center" style={{ color: '#aaa' }}>
                  ___________
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray font-black">
              <td colSpan={3} className="text-left font-black">
                Total ({detail.employees} Employees)
              </td>
              <td className="text-right font-black">
                {money(addUp(detail.lines, (l) => l.basic))}
              </td>
              <td className="text-right font-black">{money(addUp(detail.lines, (l) => l.bonus || 0))}</td>
              <td className="text-right font-black">
                {money(addUp(detail.lines, (l) => Number(l.absentCut ?? l.absence ?? 0)))}
              </td>
              <td className="text-right font-black">
                {money(addUp(detail.lines, (l) => Number(l.advanceDeduction || l.loanDeduction || 0)))}
              </td>
              <td className="text-right font-black" style={{ fontSize: '12px' }}>
                {money(detail.netPayable)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        {/* Signature Footer */}
        <div className="footer-signatures">
          <div className="signature-box">
            <div className="sign-stamp">(Sign / Stamp)</div>
            <div className="sign-line">Prepared By</div>
            <div className="sign-title">HR Department</div>
          </div>
          <div className="signature-box">
            <div className="sign-stamp">(Sign / Stamp)</div>
            <div className="sign-line">Checked By</div>
            <div className="sign-title">Accounts Manager</div>
          </div>
          <div className="signature-box">
            <div className="sign-stamp">(Sign / Stamp)</div>
            <div className="sign-line">Approved By</div>
            <div className="sign-title">Managing Director</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SalarySheetDetailView;
