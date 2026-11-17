import React from 'react';
import { Banknote, X } from 'lucide-react';
import { EmployeeLoan, monthNamed } from '../../../../services/hr.service';
import { isoDay } from '../../../../utils/dateRange';
import { money, calcEndMonth, STATUS_TONE } from '../utils/loanHelpers';

interface LoanDetailsModalProps {
  loan: EmployeeLoan | null;
  onClose: () => void;
}

export const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({ loan, onClose }) => {
  if (!loan) return null;

  const isAdv = (loan.kind || '').toLowerCase().includes('adv');
  const totalAmt = Number(loan.amount || 0);
  const recoveredAmt = Number(loan.deducted || loan.recoveredAmount || 0);
  const balanceAmt = Number(loan.balance || 0);
  const totalInstallments = Math.max(1, Number(loan.installments || 1));
  const perMonthAmt = Number(loan.installmentAmount || Math.round(totalAmt / totalInstallments));

  // Generate month-wise schedule accounting for skipped/grace months
  const skippedSet = new Set(loan.skippedMonths || []);
  const historyMap = new Map((loan.deductionHistory || []).map(h => [h.month, h.amount]));

  const schedule: {
    index: number;
    monthCode: string;
    monthName: string;
    expected: number;
    actualPaid: number;
    remainingBalance: number;
    isPaid: boolean;
    isPartial: boolean;
    isSkipped: boolean;
  }[] = [];

  let currentMonth = loan.startMonth || isoDay().slice(0, 7);
  let installmentCount = 0;
  let runningRecovered = 0;
  let safetyLoop = 0;

  while (installmentCount < totalInstallments && safetyLoop < 48) {
    safetyLoop++;
    const isSkipped = skippedSet.has(currentMonth);

    if (isSkipped) {
      schedule.push({
        index: schedule.length + 1,
        monthCode: currentMonth,
        monthName: monthNamed(currentMonth),
        expected: 0,
        actualPaid: 0,
        remainingBalance: Math.max(0, totalAmt - runningRecovered),
        isPaid: false,
        isPartial: false,
        isSkipped: true
      });
      currentMonth = calcEndMonth(currentMonth, 2);
      continue;
    }

    installmentCount++;
    const expected = installmentCount === totalInstallments ? (totalAmt - perMonthAmt * (totalInstallments - 1)) : perMonthAmt;

    let actualPaid = 0;
    if (historyMap.has(currentMonth)) {
      actualPaid = historyMap.get(currentMonth) || 0;
    } else {
      const prevExpected = (installmentCount - 1) * perMonthAmt;
      if (recoveredAmt >= prevExpected + expected) {
        actualPaid = expected;
      } else if (recoveredAmt > prevExpected) {
        actualPaid = recoveredAmt - prevExpected;
      }
    }

    runningRecovered += actualPaid;
    const remainingBalance = Math.max(0, totalAmt - runningRecovered);
    const isPaid = actualPaid >= expected && expected > 0;
    const isPartial = actualPaid > 0 && actualPaid < expected;

    schedule.push({
      index: schedule.length + 1,
      monthCode: currentMonth,
      monthName: monthNamed(currentMonth),
      expected,
      actualPaid,
      remainingBalance,
      isPaid,
      isPartial,
      isSkipped: false
    });

    currentMonth = calcEndMonth(currentMonth, 2);
  }

  const lastScheduleMonth = schedule.length > 0 ? schedule[schedule.length - 1].monthCode : loan.startMonth;
  const skippedCount = schedule.filter(s => s.isSkipped).length;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isAdv ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'}`}>
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-black dark:text-white">
                  {loan.number} — {loan.employeeName}
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_TONE[loan.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {loan.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {loan.employeeCode} · {loan.department || 'General'} · Journal: <span className="font-mono font-medium text-black dark:text-white">{loan.journalNumber || '—'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-meta-4 dark:hover:text-gray-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20">
              <span className="text-[11px] text-gray-400 block font-medium">Total Sanctioned</span>
              <span className="text-sm font-bold font-mono text-black dark:text-white mt-0.5 block">
                Rs. {money(totalAmt)}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-teal-200 dark:border-teal-800/50 bg-teal-50/40 dark:bg-teal-950/20">
              <span className="text-[11px] text-teal-700 dark:text-teal-400 block font-medium">Total Recovered (Cut)</span>
              <span className="text-sm font-bold font-mono text-teal-600 dark:text-teal-400 mt-0.5 block">
                Rs. {money(recoveredAmt)}
              </span>
            </div>
            <div className={`p-3 rounded-lg border ${balanceAmt > 0 ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20' : 'border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20'}`}>
              <span className={`text-[11px] font-medium block ${balanceAmt > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-gray-400'}`}>
                Remaining Balance
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${balanceAmt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-black dark:text-white'}`}>
                Rs. {money(balanceAmt)}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20">
              <span className="text-[11px] text-gray-400 block font-medium">
                {isAdv ? 'Recovery Type' : 'Monthly Installment'}
              </span>
              <span className="text-sm font-bold font-mono text-black dark:text-white mt-0.5 block">
                {isAdv ? 'Lump Sum (100%)' : `Rs. ${money(perMonthAmt)} / mo`}
              </span>
            </div>
          </div>

          {/* Sanction & Payout Details */}
          <div className="p-3.5 rounded-lg border border-stroke dark:border-strokedark bg-gray-50/70 dark:bg-meta-4/10 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div>
                <span className="text-gray-400">Sanctioned Date: </span>
                <span className="font-semibold text-black dark:text-white font-mono">{loan.sanctionedOn}</span>
              </div>
              <div>
                <span className="text-gray-400">Recovery Period: </span>
                <span className="font-semibold text-black dark:text-white font-mono">
                  {monthNamed(loan.startMonth)} {lastScheduleMonth !== loan.startMonth ? `→ ${monthNamed(lastScheduleMonth)} (${totalInstallments} mo${skippedCount > 0 ? ` + ${skippedCount} grace` : ''})` : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Paid Out Of: </span>
                <span className="font-semibold text-black dark:text-white">
                  {loan.paidOutOf === 'Split' ? (
                    <span className="text-amber-700 dark:text-amber-400">
                      💳 Split (Cash: Rs. {money(loan.cashAmount || 0)} · Bank: Rs. {money(loan.bankAmount || 0)})
                    </span>
                  ) : (loan.paidOutOf === 'Bank' || loan.bankName || loan.bankId) ? (
                    <span className="text-blue-600 dark:text-blue-400">
                      🏦 {loan.bankName || 'Bank'} {loan.chequeNo ? `(Ref: ${loan.chequeNo})` : ''}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      💵 {loan.accountName || 'Cash in Hand (Cash Box)'}
                    </span>
                  )}
                </span>
              </div>
            </div>
            {(loan.purpose || loan.remarks) && (
              <div className="pt-2 border-t border-stroke/70 dark:border-strokedark/70 text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap gap-4">
                {loan.purpose && <div><span className="font-medium text-black dark:text-white">Purpose:</span> {loan.purpose}</div>}
                {loan.remarks && <div><span className="font-medium text-black dark:text-white">Remarks:</span> {loan.remarks}</div>}
              </div>
            )}
          </div>

          {/* Month-Wise Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white mb-2.5 flex items-center justify-between">
              <span>📅 Month-Wise Repayment & Salary Deduction Ledger</span>
              <span className="text-[11px] font-normal text-gray-400">
                {loan.installmentsPaid || 0} of {totalInstallments} installments recovered {skippedCount > 0 ? `(${skippedCount} skipped)` : ''}
              </span>
            </h4>

            <div className="rounded-lg border border-stroke dark:border-strokedark overflow-hidden">
              <table className="w-full table-auto text-left text-xs">
                <thead className="bg-gray-100 dark:bg-meta-4 text-black dark:text-white border-b border-stroke dark:border-strokedark">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-center w-12">#</th>
                    <th className="py-2.5 px-3 font-semibold">Salary Month</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Expected Cut</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actual Recovered</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Balance After</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark text-black dark:text-white font-mono">
                  {schedule.map(item => (
                    <tr key={item.index} className={`hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors ${item.isSkipped ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''}`}>
                      <td className="py-2.5 px-3 text-center text-gray-400">{item.index}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-black dark:text-white">
                        {item.monthName} <span className="text-[10px] text-gray-400 font-mono">({item.monthCode})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {item.isSkipped ? <span className="text-gray-400 font-sans italic">Rs. 0 (Skipped)</span> : `Rs. ${money(item.expected)}`}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${item.actualPaid > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`}>
                        Rs. {money(item.actualPaid)}
                      </td>
                      <td className={`py-2.5 px-3 text-right ${item.remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                        Rs. {money(item.remainingBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        {item.isSkipped ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
                            ⏸️ Grace Month
                          </span>
                        ) : item.isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 text-[10px] font-bold">
                            ✓ Deducted
                          </span>
                        ) : item.isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                            ⚠️ Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-meta-4 dark:text-gray-300 text-[10px] font-medium">
                            ⏳ Upcoming
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-opacity-90 text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
