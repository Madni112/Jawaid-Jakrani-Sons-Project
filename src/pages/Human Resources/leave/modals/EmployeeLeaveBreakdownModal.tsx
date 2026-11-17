import React from 'react';
import { CalendarDays, X } from 'lucide-react';
import { LeaveApplication } from '../../../../services/hr.service';
import { Balance, STATUS_TONE } from '../utils/leaveUtils';

interface EmployeeLeaveBreakdownModalProps {
  viewingBalance: Balance | null;
  onClose: () => void;
  rows: LeaveApplication[];
  employees: any[];
  onApplyForEmployee: (emp: any) => void;
}

export const EmployeeLeaveBreakdownModal: React.FC<EmployeeLeaveBreakdownModalProps> = ({
  viewingBalance,
  onClose,
  rows,
  employees,
  onApplyForEmployee
}) => {
  if (!viewingBalance) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                <span>{viewingBalance.name}</span>
                {viewingBalance.code && (
                  <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded">
                    {viewingBalance.code}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {viewingBalance.designation || viewingBalance.department || 'Staff Member'} · Annual
                Leave Quota Breakdown
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-black dark:hover:bg-slate-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Overview Strip */}
          {(() => {
            const totalAllowed = viewingBalance.rows.reduce((s, r) => s + r.allowed, 0);
            const totalTaken = viewingBalance.rows.reduce((s, r) => s + r.taken, 0);
            const totalLeft = Math.max(0, totalAllowed - totalTaken);
            return (
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="text-center">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Entitled Quota
                  </span>
                  <span className="text-lg font-black text-black dark:text-white font-mono mt-0.5 block">
                    {totalAllowed} Days
                  </span>
                </div>
                <div className="text-center border-x border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Approved Used
                  </span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
                    {totalTaken} Days
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono mt-0.5 block">
                    {totalLeft} Days Left
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Annual Quota Progress Card */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Annual Leave Allowance
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {viewingBalance.rows.map((r) => {
                const isExhausted = r.balance <= 0;
                return (
                  <div
                    key={r.leaveTypeId}
                    className="p-4 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black dark:text-white">
                        {r.leaveTypeName}
                      </span>
                      <span
                        className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-full ${
                          isExhausted
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        }`}
                      >
                        {r.balance} Days Left
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isExhausted ? 'bg-rose-500' : 'bg-primary'
                          }`}
                          style={{
                            width: `${
                              r.allowed > 0
                                ? Math.min(100, Math.round((r.taken / r.allowed) * 100))
                                : 0
                            }%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                        <span>Approved Used: {r.taken} Days</span>
                        <span>Total Annual Limit: {r.allowed} Days</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Employee Leave Application History */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Application History ({viewingBalance.name})
            </h4>
            {(() => {
              const empHistory = rows.filter((a) => a.employeeId === viewingBalance.employeeId);
              if (!empHistory.length) {
                return (
                  <div className="p-4 text-center text-xs text-gray-400 rounded-xl border border-dashed border-stroke dark:border-strokedark">
                    No leave applications recorded yet for this staff member.
                  </div>
                );
              }
              return (
                <div className="rounded-xl border border-stroke dark:border-strokedark overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-meta-4/60 border-b border-stroke dark:border-strokedark font-semibold text-black dark:text-white">
                      <tr>
                        <th className="p-2.5">App #</th>
                        <th className="p-2.5">Leave Type</th>
                        <th className="p-2.5">Dates</th>
                        <th className="p-2.5 text-center">Days</th>
                        <th className="p-2.5">Reason</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stroke dark:divide-strokedark">
                      {empHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-meta-4/20">
                          <td className="p-2.5 font-mono font-medium">{h.number || h.id}</td>
                          <td className="p-2.5 font-semibold text-black dark:text-white">
                            {h.leaveTypeName || h.customType || 'Casual Leave'}
                          </td>
                          <td className="p-2.5 font-mono text-gray-500">
                            {h.from}
                            {h.halfDay
                              ? ' (Half Day)'
                              : h.to && h.to !== h.from
                              ? ` → ${h.to}`
                              : ''}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-primary">
                            {h.days}
                          </td>
                          <td className="p-2.5 text-gray-500 truncate max-w-[180px]">
                            {h.reason || '-'}
                          </td>
                          <td className="p-2.5 text-right">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                STATUS_TONE[h.status] ?? 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/40 shrink-0">
          <button
            type="button"
            onClick={() => {
              const emp = employees.find((e) => e.id === viewingBalance.employeeId);
              onApplyForEmployee(emp || viewingBalance);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-sm"
          >
            + New Application for {viewingBalance.name}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-xs font-bold text-black dark:text-white hover:bg-gray-100 dark:hover:bg-meta-4 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveBreakdownModal;
