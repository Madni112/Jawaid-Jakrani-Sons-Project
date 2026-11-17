import React from 'react';
import { Banknote, ClipboardList, Eye, Trash2 } from 'lucide-react';
import { DeleteConfirm, IconAction, SortHeader, SortState, TableEmpty } from '../../../Masters/masterUi';
import { SalarySheetHead } from '../../../../services/hr.service';
import { dayFig, money, SHEET_TONE } from '../utils/salarySheetUtils';

interface SalarySheetListTableProps {
  loading: boolean;
  visible: SalarySheetHead[];
  sort: SortState | null;
  onSort: (k: string) => void;
  activeFilters: string[];
  onClearFilters: () => void;
  onOpen: (s: SalarySheetHead) => void;
  onRemove: (s: SalarySheetHead) => void;
  editable: boolean;
  confirmId: number | null;
  setConfirmId: (id: number | null) => void;
  shown: {
    employees: number;
    gross: number;
    deductions: number;
    netPayable: number;
    unpaidDays: number;
  };
  onOpenGenerateModal: () => void;
}

export const SalarySheetListTable: React.FC<SalarySheetListTableProps> = ({
  loading,
  visible,
  sort,
  onSort,
  activeFilters,
  onClearFilters,
  onOpen,
  onRemove,
  editable,
  confirmId,
  setConfirmId,
  shown,
  onOpenGenerateModal
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-100/70 dark:bg-meta-4/30 text-gray-700 dark:text-gray-300 sticky top-0 z-10">
          <tr>
            <SortHeader label="Sheet #" sortKey="number" sort={sort} onSort={onSort} />
            <SortHeader label="Month" sortKey="month" sort={sort} onSort={onSort} />
            <SortHeader label="Staff" sortKey="employees" sort={sort} onSort={onSort} />
            <SortHeader label="Gross" sortKey="gross" sort={sort} onSort={onSort} />
            <SortHeader label="Withheld" sortKey="deductions" sort={sort} onSort={onSort} />
            <SortHeader label="Net Payable" sortKey="netPayable" sort={sort} onSort={onSort} />
            <SortHeader label="Unpaid Days" sortKey="unpaidDays" sort={sort} onSort={onSort} />
            <th className="py-2.5 px-3 font-bold">Pay Through</th>
            <th className="py-2.5 px-3 font-bold">Journals</th>
            <SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
            <th className="py-2.5 px-3 font-bold text-right w-32">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stroke dark:divide-strokedark">
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={11} className="p-4">
                  <div
                    className="h-4 rounded bg-gray-100 dark:bg-meta-4 animate-pulse"
                    style={{ width: `${100 - i * 8}%` }}
                  />
                </td>
              </tr>
            ))}
          {!loading && !visible.length && (
            <TableEmpty
              colSpan={11}
              noun="salary sheets"
              filters={activeFilters}
              cleared={onClearFilters}
              addLabel="GENERATE SALARY SHEET"
              onAdd={onOpenGenerateModal}
            />
          )}
          {!loading &&
            visible.map((s) => (
              <tr
                key={s.id}
                onClick={() => onOpen(s)}
                className="transition hover:bg-primary/5 dark:hover:bg-meta-4/40 cursor-pointer"
              >
                <td className="py-2.5 px-3 font-mono font-bold text-black dark:text-white">
                  {s.number}
                </td>
                <td className="py-2.5 px-3 font-semibold">{s.monthLabel}</td>
                <td className="py-2.5 px-3 text-right font-bold">{s.employees}</td>
                <td className="py-2.5 px-3 text-right font-medium">{money(s.gross)}</td>
                <td className="py-2.5 px-3 text-right text-amber-600 font-semibold">
                  {money(s.deductions)}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {money(s.netPayable)}
                </td>
                <td className="py-2.5 px-3 text-right">{dayFig(s.unpaidDays)}</td>
                <td className="py-2.5 px-3">
                  <span className="font-medium">{s.payThrough}</span>
                  {s.accountName && (
                    <span className="block text-[10px] text-gray-400">{s.accountName}</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-[10px]">
                  {s.journalNumber ? (
                    <span className="font-mono text-primary font-bold">{s.journalNumber}</span>
                  ) : (
                    <span className="text-gray-300">not posted</span>
                  )}
                  {s.paymentJournalNumber && (
                    <span className="block text-gray-400">
                      payment {s.paymentJournalNumber}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      SHEET_TONE[s.status]
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 justify-end">
                    {s.status === 'Draft' ? (
                      <button
                        type="button"
                        onClick={() => onOpen(s)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Open sheet to review, edit, and approve"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Review &amp; Edit</span>
                      </button>
                    ) : s.status === 'Approved' ? (
                      <button
                        type="button"
                        onClick={() => onOpen(s)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Disburse and post payment"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Pay Salary</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpen(s)}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-meta-4 dark:hover:bg-meta-4/80 text-gray-700 dark:text-gray-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="View paid salary sheet and journal entries"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        <span>View Sheet</span>
                      </button>
                    )}
                    <IconAction
                      title={
                        s.status !== 'Draft'
                          ? 'Un-approve before deleting'
                          : 'Delete the draft sheet'
                      }
                      tone="danger"
                      disabled={!editable || s.status !== 'Draft'}
                      onClick={() => setConfirmId(s.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconAction>
                    {confirmId === s.id && (
                      <DeleteConfirm
                        title={`Delete Draft Sheet ${s.number}`}
                        message={`Are you sure you want to delete ${s.number} (${s.monthLabel})? This will remove this sheet draft.`}
                        onConfirm={() => {
                          onRemove(s);
                          setConfirmId(null);
                        }}
                        onCancel={() => setConfirmId(null)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
        {!!visible.length && !loading && (
          <tfoot>
            <tr className="bg-gray-100/80 dark:bg-meta-4/40 font-black text-black dark:text-white">
              <td colSpan={2} className="py-2.5 px-3">
                Total ({visible.length} Sheets)
              </td>
              <td className="py-2.5 px-3 text-right">{shown.employees}</td>
              <td className="py-2.5 px-3 text-right">{money(shown.gross)}</td>
              <td className="py-2.5 px-3 text-right text-amber-600">
                {money(shown.deductions)}
              </td>
              <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                {money(shown.netPayable)}
              </td>
              <td className="py-2.5 px-3 text-right">{dayFig(shown.unpaidDays)}</td>
              <td colSpan={4} className="py-2.5 px-3 text-[11px] text-gray-500 font-normal">
                Withheld is what the payslips keep back; Net Payable is what staff are handed
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default SalarySheetListTable;
