import React from 'react';
import { Check, FileSpreadsheet, Info, X } from 'lucide-react';
import { Check as CheckBox, Pick } from '../../../Masters/masterUi';
import { monthNamed, SalarySheetHead } from '../../../../services/hr.service';

interface GenerateSalarySheetModalProps {
  open: boolean;
  onClose: () => void;
  month: string;
  setMonth: (m: string) => void;
  months: string[];
  existingSheet?: SalarySheetHead;
  opts: {
    deductForAbsence: boolean;
    recoverLoans: boolean;
    payBonus: boolean;
    bonusAmount: number;
    bonusReason: string;
  };
  setOpts: React.Dispatch<React.SetStateAction<{
    deductForAbsence: boolean;
    recoverLoans: boolean;
    payBonus: boolean;
    bonusAmount: number;
    bonusReason: string;
  }>>;
  busy: boolean;
  onConfirmGenerate: () => void;
  onOpenExistingSheet: (s: SalarySheetHead) => void;
  sheets: SalarySheetHead[];
}

export const GenerateSalarySheetModal: React.FC<GenerateSalarySheetModalProps> = ({
  open,
  onClose,
  month,
  setMonth,
  months,
  existingSheet,
  opts,
  setOpts,
  busy,
  onConfirmGenerate,
  onOpenExistingSheet,
  sheets
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent border-b border-stroke dark:border-strokedark flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-white shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Generate Salary Sheet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select month and calculation rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Payroll Month Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Payroll Month
            </label>
            <Pick value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthNamed(m)}{' '}
                  {sheets.some((s) => s.month === m) ? '— (Already Generated)' : ''}
                </option>
              ))}
            </Pick>
          </div>

          {existingSheet ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5 animate-fade-in">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <p className="font-bold">Salary Sheet Already Generated</p>
                <p className="mt-0.5">
                  <strong>{existingSheet.number}</strong> has already been created for{' '}
                  <strong>{existingSheet.monthLabel}</strong> ({existingSheet.status}). Click below
                  to open and review or edit it.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
                  Payroll Calculation Rules
                </h4>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-black dark:text-white">
                        Absence Pay Deductions
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Auto-deduct unpaid / absent days from basic pay
                      </p>
                    </div>
                    <CheckBox
                      checked={opts.deductForAbsence}
                      onChange={(v) => setOpts((prev) => ({ ...prev, deductForAbsence: v }))}
                    />
                  </div>

                  <div className="p-3 rounded-xl border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-black dark:text-white">
                        Loan &amp; Advance Recovery
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Deduct monthly installment for active employee loans
                      </p>
                    </div>
                    <CheckBox
                      checked={opts.recoverLoans}
                      onChange={(v) => setOpts((prev) => ({ ...prev, recoverLoans: v }))}
                    />
                  </div>

                  <div className="p-3 rounded-xl border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-black dark:text-white">
                          Include Staff Bonus
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Add extra bonus allowance across all employees
                        </p>
                      </div>
                      <CheckBox
                        checked={opts.payBonus}
                        onChange={(v) => setOpts((prev) => ({ ...prev, payBonus: v }))}
                      />
                    </div>
                    {opts.payBonus && (
                      <div className="pt-2 border-t border-stroke dark:border-strokedark grid grid-cols-2 gap-2 animate-fade-in">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                            Bonus Amount (Rs.)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={opts.bonusAmount}
                            onChange={(e) =>
                              setOpts((prev) => ({ ...prev, bonusAmount: Number(e.target.value) }))
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="10000"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                            Bonus Reason
                          </label>
                          <input
                            type="text"
                            value={opts.bonusReason}
                            onChange={(e) =>
                              setOpts((prev) => ({ ...prev, bonusReason: e.target.value }))
                            }
                            className="w-full px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Bonus Reason"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Calculates payslips for <strong>{monthNamed(month)}</strong> and creates a{' '}
                  <strong>Draft</strong> sheet. You can adjust lines before approval.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 border-t border-stroke dark:border-strokedark flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            Cancel
          </button>
          {existingSheet ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenExistingSheet(existingSheet);
              }}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Open {existingSheet.monthLabel} Sheet</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirmGenerate}
              disabled={busy}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-opacity-90 text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {busy ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Generate Salary Sheet</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateSalarySheetModal;
