import React from 'react';
import { Banknote, Users } from 'lucide-react';
import { money } from '../utils/salarySheetUtils';

interface SalarySheetStatsStripProps {
  detail: any;
  shown: {
    employees: number;
    gross: number;
    deductions: number;
    netPayable: number;
    unpaidDays: number;
  };
}

export const SalarySheetStatsStrip: React.FC<SalarySheetStatsStripProps> = ({
  detail,
  shown
}) => {
  if (detail) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark flex items-center justify-between">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Total Employees
          </span>
          <span className="text-2xl font-black text-black dark:text-white">
            {shown.employees}
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Users className="w-6 h-6" />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
            Total Salaries
          </span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
            Rs. {money(shown.netPayable || shown.gross)}
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Banknote className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default SalarySheetStatsStrip;
