import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { EmployeeLoan } from '../../../../services/hr.service';
import {
  DeleteConfirm, IconAction, SortHeader, SortState, TableEmpty
} from '../../../Masters/masterUi';
import { money, calcEndMonth, STATUS_TONE } from '../utils/loanHelpers';

interface LoansTableProps {
  hub: any;
  visible: EmployeeLoan[];
  sort: SortState | null;
  onSort: (k: string) => void;
  editable: boolean;
  activeFilters: string[];
  clearAll: () => void;
  shown: { amount: number; recovered: number; balance: number };
  holders: number;
  confirmId: number | null;
  setConfirmId: (id: number | null) => void;
  onView: (loan: EmployeeLoan) => void;
  onEdit: (loan: EmployeeLoan) => void;
  onDelete: (loan: EmployeeLoan) => void;
  onStatusChange: (loan: EmployeeLoan, status: EmployeeLoan['status']) => void;
  onAddNew: () => void;
}

export const LoansTable: React.FC<LoansTableProps> = ({
  hub,
  visible,
  sort,
  onSort,
  editable,
  activeFilters,
  clearAll,
  shown,
  holders,
  confirmId,
  setConfirmId,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onAddNew
}) => {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full table-auto text-left text-sm text-black dark:text-white">
        <thead className="sticky top-0 z-10 bg-gray-2 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
          <tr>
            <SortHeader label="Voucher #" sortKey="number" sort={sort} onSort={onSort} />
            <SortHeader label="Employee" sortKey="employeeName" sort={sort} onSort={onSort} />
            <SortHeader label="Kind" sortKey="kind" sort={sort} onSort={onSort} />
            <SortHeader label="Sanctioned On" sortKey="sanctionedOn" sort={sort} onSort={onSort} />
            <SortHeader label="Amount" sortKey="amount" sort={sort} onSort={onSort} />
            <SortHeader label="Installment" sortKey="installmentAmount" sort={sort} onSort={onSort} />
            <th className="py-3 px-4 font-semibold text-black dark:text-white">Recovery</th>
            <SortHeader label="Recovered" sortKey="deducted" sort={sort} onSort={onSort} />
            <SortHeader label="Balance" sortKey="balance" sort={sort} onSort={onSort} />
            <SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
            <th className="py-3 px-4 font-semibold text-black dark:text-white">Journal</th>
            <th className="py-3 px-4 font-semibold text-right text-black dark:text-white w-36">Action</th>
          </tr>
        </thead>
        <tbody>
          {hub.loading && Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="border-b border-stroke dark:border-strokedark">
              <td colSpan={12} className="p-4">
                <div className="h-4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" style={{ width: `${100 - i * 8}%` }} />
              </td>
            </tr>
          ))}
          {!hub.loading && !visible.length && (
            <TableEmpty colSpan={12} noun="loan and advance records" filters={activeFilters} cleared={clearAll}
              addLabel="SANCTION LOAN / ADVANCE"
              onAdd={onAddNew} />
          )}
          {!hub.loading && visible.map(l => (
            <tr key={l.id} className="border-b border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4/20 transition-colors">
              <td className="py-3.5 px-4 font-mono font-medium">{l.number}</td>
              <td className="py-3.5 px-4">
                <span className="block font-semibold text-black dark:text-white">{l.employeeName}</span>
                <span className="block text-[11px] text-gray-400">{l.employeeCode} · {l.department || '—'}</span>
                {l.purpose && <span className="block text-[11px] text-gray-400 italic">{l.purpose}</span>}
              </td>
              <td className="py-3.5 px-4">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${l.kind === 'Advance' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'}`}>
                  {l.kind}
                </span>
              </td>
              <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-300">{l.sanctionedOn}</td>
              <td className="py-3.5 px-4 text-right font-mono">
                <span className="font-semibold text-black dark:text-white block">{money(l.amount)}</span>
                {l.paidOutOf === 'Split' ? (
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-sans font-semibold">
                    💳 Split (C: {money(l.cashAmount || 0)} + B: {money(l.bankAmount || 0)})
                  </span>
                ) : (l.paidOutOf === 'Bank' || l.bankName || l.bankId) ? (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-sans">
                    🏦 Bank
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-sans">
                    💵 Cash
                  </span>
                )}
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <span className="font-semibold text-black dark:text-white">{money(l.installmentAmount)}</span>
                <span className="block text-[10px] text-gray-400">from {l.startMonth}</span>
              </td>
              <td className="py-3.5 px-4">
                <div className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-teal-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((l.installmentsPaid / Math.max(1, l.installments)) * 100))}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block">
                  {l.installmentsPaid} of {l.installments} mo ({l.startMonth} → {calcEndMonth(l.startMonth, l.installments)})
                </span>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-teal-600 dark:text-teal-400">{money(l.deducted)}</td>
              <td className={`py-3.5 px-4 text-right font-mono font-bold ${l.balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>{money(l.balance)}</td>
              <td className="py-3.5 px-4">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded ${STATUS_TONE[l.status] ?? 'bg-gray-100 text-gray-500'}`}>{l.status}</span>
              </td>
              <td className="py-3.5 px-4 font-mono text-xs">{l.journalNumber || <span className="text-gray-300">-</span>}</td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <IconAction
                    title={`View ${l.kind} statement & monthly schedule`}
                    tone="default"
                    onClick={() => onView(l)}
                  >
                    <Eye className="w-4 h-4 text-primary" />
                  </IconAction>
                  <IconAction title="Edit this record" tone="primary" disabled={!editable}
                    onClick={() => onEdit(l)}><Pencil className="w-4 h-4" /></IconAction>
                  {l.status === 'Active' && l.deducted === 0 && editable && (
                    <button type="button" onClick={() => onStatusChange(l, 'Cancelled')} title="Cancel and reverse issuing journal"
                      className="text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition">
                      Cancel
                    </button>
                  )}
                  {confirmId === l.id ? (
                    <DeleteConfirm onConfirm={() => onDelete(l)} onCancel={() => setConfirmId(null)}
                      confirmLabel="Delete" keepLabel={`Keep ${l.number}`} />
                  ) : (
                    <IconAction title={l.deducted > 0 ? 'Has recoveries booked — cancel it instead' : 'Delete record'}
                      tone="danger" disabled={!editable || l.deducted > 0} onClick={() => setConfirmId(l.id)}><Trash2 className="w-4 h-4" /></IconAction>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        {!!visible.length && !hub.loading && (
          <tfoot>
            <tr className="bg-gray-50 dark:bg-meta-4/40 font-bold border-t border-stroke dark:border-strokedark">
              <td colSpan={4} className="py-3 px-4 text-black dark:text-white">Total ({visible.length})</td>
              <td className="py-3 px-4 text-right tabular-nums text-black dark:text-white font-mono">{money(shown.amount)}</td>
              <td colSpan={2} className="py-3 px-4 text-xs text-gray-400">
                {holders ? `${holders} staff member(s) hold balance` : 'All cleared'}
              </td>
              <td className="py-3 px-4 text-right tabular-nums text-teal-600 dark:text-teal-400 font-mono">{money(shown.recovered)}</td>
              <td className="py-3 px-4 text-right tabular-nums text-amber-600 dark:text-amber-400 font-mono">{money(shown.balance)}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};
