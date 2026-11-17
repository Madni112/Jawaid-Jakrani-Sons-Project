import React from 'react';
import { money } from '../utils/salarySheetUtils';

interface SalarySheetPreviewSectionProps {
  detail: any;
  lines: any[];
  preview: any;
  deptSum: (f: (d: { staff: number; gross: number; net: number }) => number) => number;
  headSum: (kind: string) => number;
}

export const SalarySheetPreviewSection: React.FC<SalarySheetPreviewSectionProps> = ({
  detail,
  lines,
  preview,
  deptSum,
  headSum
}) => {
  if (detail || !lines.length || !preview) return null;

  return (
    <div className="rounded-xl border border-stroke bg-white shadow-xs dark:border-strokedark dark:bg-boxdark p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stroke dark:border-strokedark">
        <div>
          <h3 className="font-bold text-black dark:text-white text-base">
            Payroll Preview — {preview.monthLabel}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {preview.lines.length} staff payslip calculations ready. Review department &amp; head distributions before raising.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Designation Breakdown */}
        <div className="rounded-xl border border-stroke dark:border-strokedark overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-100/70 dark:bg-meta-4/30 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="py-2 px-3 font-bold">Designation</th>
                <th className="py-2 px-3 font-bold text-right">Staff</th>
                <th className="py-2 px-3 font-bold text-right">Gross</th>
                <th className="py-2 px-3 font-bold text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {(preview.byDepartment || []).map((d: any) => (
                <tr key={d.department}>
                  <td className="py-2 px-3 font-medium">{d.department}</td>
                  <td className="py-2 px-3 text-right">{d.staff}</td>
                  <td className="py-2 px-3 text-right">{money(d.gross)}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {money(d.net)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100/80 dark:bg-meta-4/40 font-bold">
                <td className="py-2 px-3">Total</td>
                <td className="py-2 px-3 text-right">{deptSum((d) => d.staff)}</td>
                <td className="py-2 px-3 text-right">{money(deptSum((d) => d.gross))}</td>
                <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">
                  {money(deptSum((d) => d.net))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Salary Head Breakdown */}
        <div className="rounded-xl border border-stroke dark:border-strokedark overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-100/70 dark:bg-meta-4/30 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="py-2 px-3 font-bold">Salary Head</th>
                <th className="py-2 px-3 font-bold">Type</th>
                <th className="py-2 px-3 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {(preview.byHead || []).map((h: any) => (
                <tr key={`${h.kind}-${h.head}`}>
                  <td className="py-2 px-3 font-medium">{h.head}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        h.kind === 'Earning'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {h.kind}
                    </span>
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-semibold ${
                      h.kind === 'Deduction' ? 'text-amber-600' : ''
                    }`}
                  >
                    {money(h.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100/80 dark:bg-meta-4/40 font-bold">
                <td className="py-2 px-3">Total</td>
                <td className="py-2 px-3 text-[10px] text-gray-500">
                  Bonus less deductions
                </td>
                <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {money(headSum('Earning') - headSum('Deduction'))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalarySheetPreviewSection;
