import React from 'react';
import { Plus, Receipt } from 'lucide-react';
import { SalarySheetView } from '../../../../services/hr.service';

interface SalarySheetHeaderProps {
  detail: SalarySheetView | null;
  busy: boolean;
  editable: boolean;
  onOpenGenerateModal: () => void;
}

export const SalarySheetHeader: React.FC<SalarySheetHeaderProps> = ({
  detail,
  busy,
  editable,
  onOpenGenerateModal
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stroke dark:border-strokedark">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white">
              Salary Sheet &amp; Payroll
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Generate monthly staff payslips, absence pay cuts, and loan recoveries with ledger integration
            </p>
          </div>
        </div>
      </div>
      {!detail && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenGenerateModal}
            disabled={busy || !editable}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-opacity-90 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Salary Sheet</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SalarySheetHeader;
