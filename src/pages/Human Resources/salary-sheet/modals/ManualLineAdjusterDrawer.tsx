import React from 'react';
import { Trash2 } from 'lucide-react';
import { Area, IconAction, NumCell, Pick } from '../../../Masters/masterUi';
import { LoanRecoveryItem, PayItem, SalarySheetView } from '../../../../services/hr.service';
import { money } from '../utils/salarySheetUtils';

interface ManualLineAdjusterDrawerProps {
  adjusting: number | null;
  employeeId: number;
  draftMode: boolean;
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
  heads: any[];
  addItem: (kind: 'extraEarnings' | 'extraDeductions', headId: number) => void;
  saveAdjust: (s: SalarySheetView, employeeId: number) => void;
  detail: SalarySheetView;
  busy: boolean;
  onCancel: () => void;
}

export const ManualLineAdjusterDrawer: React.FC<ManualLineAdjusterDrawerProps> = ({
  adjusting,
  employeeId,
  draftMode,
  adjust,
  setAdjust,
  heads,
  addItem,
  saveAdjust,
  detail,
  busy,
  onCancel
}) => {
  if (adjusting !== employeeId || !draftMode) return null;

  return (
    <tr>
      <td colSpan={12} className="bg-gray-50 dark:bg-meta-4/20 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border border-stroke dark:border-strokedark p-4 rounded-xl bg-white dark:bg-boxdark">
          <div>
            <span className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">
              Manual Additions
            </span>
            {adjust.extraEarnings.map((i, n) => (
              <div key={n} className="flex items-center gap-1.5 mb-1.5">
                <span className="flex-1 text-xs">{i.name}</span>
                <NumCell
                  className="w-24"
                  value={i.amount}
                  onChange={(e) =>
                    setAdjust((a) => ({
                      ...a,
                      extraEarnings: a.extraEarnings.map((x, j) =>
                        j === n ? { ...x, amount: Number(e.target.value) } : x
                      )
                    }))
                  }
                />
                <IconAction
                  title="Remove"
                  tone="danger"
                  onClick={() =>
                    setAdjust((a) => ({
                      ...a,
                      extraEarnings: a.extraEarnings.filter((_, j) => j !== n)
                    }))
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconAction>
              </div>
            ))}
            <Pick
              className="w-full mt-2"
              value=""
              onChange={(e) => {
                addItem('extraEarnings', Number(e.target.value));
                e.target.value = '';
              }}
            >
              <option value="">+ Add a bonus head...</option>
              {heads
                .filter((h) => h.kind === 'Earning')
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
            </Pick>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">
              Manual Deductions
            </span>
            {adjust.extraDeductions.map((i, n) => (
              <div key={n} className="flex items-center gap-1.5 mb-1.5">
                <span className="flex-1 text-xs">{i.name}</span>
                <NumCell
                  className="w-24"
                  value={i.amount}
                  onChange={(e) =>
                    setAdjust((a) => ({
                      ...a,
                      extraDeductions: a.extraDeductions.map((x, j) =>
                        j === n ? { ...x, amount: Number(e.target.value) } : x
                      )
                    }))
                  }
                />
                <IconAction
                  title="Remove"
                  tone="danger"
                  onClick={() =>
                    setAdjust((a) => ({
                      ...a,
                      extraDeductions: a.extraDeductions.filter((_, j) => j !== n)
                    }))
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconAction>
              </div>
            ))}
            <Pick
              className="w-full mt-2"
              value=""
              onChange={(e) => {
                addItem('extraDeductions', Number(e.target.value));
                e.target.value = '';
              }}
            >
              <option value="">+ Add a deduction head...</option>
              {heads
                .filter((h) => h.kind === 'Deduction')
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
            </Pick>
          </div>

          {/* Loan & Advance Recovery Section */}
          <div>
            <span className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">
              Loan / Advance Recovery
            </span>
            {adjust.loanRecoveries.length > 0 ? (
              <div className="space-y-2">
                {adjust.loanRecoveries.map((r, n) => {
                  const isAdv = String(r.kind || '').toLowerCase().includes('adv');
                  return (
                    <div
                      key={r.loanId}
                      className={`p-2.5 rounded-lg border text-xs ${
                        r.isSkipped
                          ? 'border-purple-200 dark:border-purple-800/50 bg-purple-50/40 dark:bg-purple-950/20'
                          : 'border-stroke dark:border-strokedark bg-white dark:bg-boxdark'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isAdv
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {isAdv ? 'Advance' : 'Loan'}
                          </span>
                          <span className="font-mono font-bold text-black dark:text-white">
                            {r.number}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          Bal: Rs. {money(r.balance)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 mt-2">
                        {!r.isSkipped ? (
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-[10px] text-gray-500">Cut:</span>
                            <NumCell
                              className="w-20 text-right font-mono text-xs"
                              value={r.deductAmount}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(r.balance, Number(e.target.value) || 0));
                                setAdjust((a) => ({
                                  ...a,
                                  loanRecoveries: a.loanRecoveries.map((x, j) =>
                                    j === n ? { ...x, deductAmount: val } : x
                                  )
                                }));
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold flex-1">
                            ⏸️ Rs. 0 (Grace Month)
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setAdjust((a) => ({
                              ...a,
                              loanRecoveries: a.loanRecoveries.map((x, j) =>
                                j === n
                                  ? {
                                      ...x,
                                      isSkipped: !x.isSkipped,
                                      deductAmount: !x.isSkipped ? 0 : x.installmentAmount
                                    }
                                  : x
                              )
                            }));
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer whitespace-nowrap ${
                            r.isSkipped
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                              : 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100'
                          }`}
                          title={
                            r.isSkipped
                              ? 'Resume deduction for this month'
                              : 'Skip deduction for this month (Grace Month)'
                          }
                        >
                          {r.isSkipped ? '↩️ Resume' : '⏸️ Skip Month'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-stroke dark:border-strokedark text-gray-400 text-center text-xs">
                No active loans or salary advances.
              </div>
            )}
          </div>

          <div>
            <span className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-2">
              Payslip Remarks
            </span>
            <Area
              rows={3}
              value={adjust.remarks}
              onChange={(e) =>
                setAdjust((a) => ({ ...a, remarks: e.target.value }))
              }
            />
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => saveAdjust(detail, employeeId)}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-opacity-90 transition cursor-pointer disabled:opacity-50"
              >
                Save Payslip
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default ManualLineAdjusterDrawer;
