import React from 'react';
import { Check, Eye, MailX, Pencil, Trash2 } from 'lucide-react';
import { DeleteConfirm, IconAction, SortHeader, SortState, TableEmpty } from '../../../Masters/masterUi';
import { getLeaveExpiryDate, LeaveApplication, LeaveStatus } from '../../../../services/hr.service';
import { days, STATUS_TONE } from '../utils/leaveUtils';

interface LeaveApplicationsTabProps {
  loading: boolean;
  visible: LeaveApplication[];
  rows: LeaveApplication[];
  sort: SortState | null;
  onSort: (k: string) => void;
  activeFilters: string[];
  onClearFilters: () => void;
  editable: boolean;
  confirmId: number | null;
  setConfirmId: (id: number | null) => void;
  confirmCancelId: number | null;
  setConfirmCancelId: (id: number | null) => void;
  shown: {
    days: number;
    waiting: number;
    waitingDays: number;
    approvedDays: number;
  };
  getEmpBalanceInfo: (empId?: number | null) => { allowed: number; taken: number; remaining: number };
  onViewApp: (a: LeaveApplication) => void;
  onApproveClick: (a: LeaveApplication) => void;
  onDecide: (a: LeaveApplication, status: LeaveStatus) => void;
  onEdit: (a: LeaveApplication) => void;
  onRemove: (a: LeaveApplication) => void;
  onNewApplication: () => void;
}

export const LeaveApplicationsTab: React.FC<LeaveApplicationsTabProps> = ({
  loading,
  visible,
  rows,
  sort,
  onSort,
  activeFilters,
  onClearFilters,
  editable,
  confirmId,
  setConfirmId,
  confirmCancelId,
  setConfirmCancelId,
  shown,
  getEmpBalanceInfo,
  onViewApp,
  onApproveClick,
  onDecide,
  onEdit,
  onRemove,
  onNewApplication
}) => {
  return (
    <table className="w-full table-auto text-left text-sm text-black dark:text-white">
      <thead className="sticky top-0 z-10 bg-gray-2 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
        <tr>
          <SortHeader label="App #" sortKey="number" sort={sort} onSort={onSort} />
          <SortHeader label="Employee" sortKey="employeeName" sort={sort} onSort={onSort} />
          <SortHeader label="Designation" sortKey="designation" sort={sort} onSort={onSort} />
          <SortHeader label="Leave Type" sortKey="leaveTypeName" sort={sort} onSort={onSort} />
          <SortHeader label="From" sortKey="from" sort={sort} onSort={onSort} />
          <SortHeader label="Days" sortKey="days" sort={sort} onSort={onSort} />
          <SortHeader label="To" sortKey="to" sort={sort} onSort={onSort} />
          <SortHeader label="Expiry Date" sortKey="expiryDate" sort={sort} onSort={onSort} />
          <SortHeader label="Applied" sortKey="appliedOn" sort={sort} onSort={onSort} />
          <SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
          <th className="py-3 px-4 font-semibold text-black dark:text-white">Decision</th>
          <th className="py-3 px-4 font-semibold text-black dark:text-white text-right w-32">Action</th>
        </tr>
      </thead>
      <tbody>
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="border-b border-stroke dark:border-strokedark">
              <td colSpan={12} className="p-4">
                <div
                  className="h-4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse"
                  style={{ width: `${100 - i * 8}%` }}
                />
              </td>
            </tr>
          ))}
        {!loading && !visible.length && (
          <TableEmpty
            colSpan={12}
            noun="leave applications"
            filters={activeFilters}
            cleared={onClearFilters}
            addLabel={rows.length ? undefined : 'NEW APPLICATION'}
            onAdd={onNewApplication}
          />
        )}
        {!loading &&
          visible.map((a) => (
            <tr
              key={a.id}
              className="border-b border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4/20 transition-colors"
            >
              <td className="py-3 px-4 font-medium">{a.number || a.id}</td>
              <td className="py-3 px-4">
                <span className="block font-medium">{a.employeeName}</span>
                <span className="block text-xs text-gray-400">{a.employeeCode}</span>
              </td>
              <td className="py-3 px-4">
                {a.designation || a.department || <span className="text-gray-300">-</span>}
              </td>
              <td className="py-3 px-4">
                <span className="font-medium">
                  {a.leaveTypeName || a.customType || 'Casual Leave'}
                </span>
              </td>
              <td className="py-3 px-4">{a.from}</td>
              <td className="py-3 px-4 text-center">
                <span className="font-bold tabular-nums text-primary">{a.days}</span>
                {a.status === 'Applied' &&
                  (() => {
                    const { remaining } = getEmpBalanceInfo(a.employeeId);
                    if (a.days > remaining) {
                      return (
                        <span
                          className="inline-block text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 rounded px-1.5 py-0.2 mt-0.5 whitespace-nowrap shadow-2xs"
                          title={`Employee has ${remaining} day(s) left out of annual quota`}
                        >
                          ⚠️ Over Limit ({remaining}d left)
                        </span>
                      );
                    }
                    return null;
                  })()}
              </td>
              <td className="py-3 px-4">
                {a.halfDay || a.from === a.to || !a.to ? (
                  <span className="text-gray-400 font-mono text-xs">-</span>
                ) : (
                  a.to
                )}
              </td>
              <td className="py-3 px-4">
                {a.status === 'Approved' ? (
                  <span className="text-gray-400 font-mono text-xs">-</span>
                ) : (
                  <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {a.expiryDate || getLeaveExpiryDate(a.to, a.from) || '-'}
                  </span>
                )}
              </td>
              <td className="py-3 px-4">{a.appliedOn || '-'}</td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs font-bold uppercase px-2.5 py-1 rounded ${
                    STATUS_TONE[a.status] ?? 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {a.status}
                </span>
              </td>
              <td className="py-3 px-4">
                {a.approvedBy || a.decidedBy ? (
                  <span className="block text-xs text-gray-500">
                    {a.approvedBy || a.decidedBy}
                  </span>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <IconAction
                    title="View application details"
                    tone="primary"
                    onClick={() => onViewApp(a)}
                  >
                    <Eye className="w-4 h-4 text-primary" />
                  </IconAction>
                  {a.status === 'Applied' && editable && (
                    <>
                      <IconAction
                        title="Approve this leave"
                        tone="success"
                        onClick={() => onApproveClick(a)}
                      >
                        <Check className="w-4 h-4" />
                      </IconAction>
                      <IconAction
                        title="Reject this leave"
                        tone="danger"
                        onClick={() => onDecide(a, 'Rejected')}
                      >
                        <MailX className="w-4 h-4" />
                      </IconAction>
                    </>
                  )}
                  {a.status === 'Applied' && !editable && (
                    <span className="text-xs text-gray-300">waiting</span>
                  )}
                  {a.status === 'Approved' &&
                    (confirmCancelId === a.id ? (
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 px-2 py-1 rounded shadow-xs">
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
                          Cancel leave?
                        </span>
                        <button
                          type="button"
                          disabled={!editable}
                          onClick={() => {
                            onDecide(a, 'Cancelled');
                            setConfirmCancelId(null);
                          }}
                          className="text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded transition shadow-2xs cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(null)}
                          className="text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded transition cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => setConfirmCancelId(a.id)}
                        className="text-xs font-semibold text-gray-600 dark:text-gray-300 border border-stroke dark:border-strokedark rounded px-2.5 py-1 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-meta-4 disabled:opacity-40 transition-colors"
                        title="Cancel this approved leave"
                      >
                        Cancel
                      </button>
                    ))}
                  <IconAction
                    title="Edit application"
                    tone="primary"
                    disabled={!editable || a.status === 'Approved'}
                    onClick={() => onEdit(a)}
                  >
                    <Pencil className="w-4 h-4" />
                  </IconAction>
                  {confirmId === a.id ? (
                    <DeleteConfirm
                      onConfirm={() => onRemove(a)}
                      onCancel={() => setConfirmId(null)}
                      keepLabel={`Keep application #${a.id}`}
                    />
                  ) : (
                    <IconAction
                      title="Delete application"
                      tone="danger"
                      disabled={!editable || a.status === 'Approved'}
                      onClick={() => setConfirmId(a.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconAction>
                  )}
                </div>
              </td>
            </tr>
          ))}
      </tbody>
      {!!visible.length && !loading && (
        <tfoot>
          <tr className="bg-gray-50 dark:bg-meta-4/40 font-bold border-t border-stroke dark:border-strokedark">
            <td colSpan={5} className="py-3 px-4 text-black dark:text-white">
              Total ({visible.length})
            </td>
            <td className="py-3 px-4 text-center tabular-nums text-black dark:text-white">
              {days(shown.days)}
            </td>
            <td colSpan={6} className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
              {shown.waiting
                ? `${shown.waiting} still awaiting a decision`
                : 'Every application on this page has been decided'}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
};

export default LeaveApplicationsTab;
