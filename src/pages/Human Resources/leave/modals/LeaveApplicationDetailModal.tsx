import React from 'react';
import { CalendarDays, Check, MailX, X } from 'lucide-react';
import { getLeaveExpiryDate, LeaveApplication, LeaveStatus } from '../../../../services/hr.service';
import { STATUS_TONE } from '../utils/leaveUtils';

interface LeaveApplicationDetailModalProps {
  viewingApp: LeaveApplication | null;
  onClose: () => void;
  editable: boolean;
  confirmCancelId: number | null;
  setConfirmCancelId: (id: number | null) => void;
  getEmpBalanceInfo: (empId?: number | null) => { allowed: number; taken: number; remaining: number };
  onApproveClick: (a: LeaveApplication) => void;
  onDecide: (a: LeaveApplication, status: LeaveStatus) => void;
}

export const LeaveApplicationDetailModal: React.FC<LeaveApplicationDetailModalProps> = ({
  viewingApp,
  onClose,
  editable,
  confirmCancelId,
  setConfirmCancelId,
  getEmpBalanceInfo,
  onApproveClick,
  onDecide
}) => {
  if (!viewingApp) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">
                Leave Application #{viewingApp.number || viewingApp.id}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Applied on {viewingApp.appliedOn || viewingApp.from || 'Recently'}
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Employee Summary Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Employee
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-black dark:text-white">
                  {viewingApp.employeeName}
                </span>
                {viewingApp.employeeCode && (
                  <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-1.5 py-0.2 rounded">
                    {viewingApp.employeeCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {viewingApp.designation || viewingApp.department || 'Staff'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Status
              </span>
              <span
                className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                  STATUS_TONE[viewingApp.status] ?? 'bg-gray-100 text-gray-500'
                }`}
              >
                {viewingApp.status}
              </span>
            </div>
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark">
              <span className="text-[11px] text-gray-400 font-medium block">Leave Type</span>
              <span className="text-xs font-bold text-black dark:text-white mt-0.5 block truncate">
                {viewingApp.leaveTypeName || viewingApp.customType || 'Casual Leave'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark">
              <span className="text-[11px] text-gray-400 font-medium block">Days / Duration</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-primary font-mono">
                  {viewingApp.days} Day(s)
                </span>
                {viewingApp.halfDay && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded">
                    Half Day
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark">
              <span className="text-[11px] text-gray-400 font-medium block">Decision By</span>
              <span className="text-xs font-bold text-black dark:text-white mt-0.5 block truncate">
                {viewingApp.approvedBy || viewingApp.decidedBy || 'Pending Decision'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark">
              <span className="text-[11px] text-gray-400 font-medium block">From Date</span>
              <span className="text-xs font-bold font-mono text-black dark:text-white mt-0.5 block">
                {viewingApp.from}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark">
              <span className="text-[11px] text-gray-400 font-medium block">To Date</span>
              <span className="text-xs font-bold font-mono text-black dark:text-white mt-0.5 block">
                {viewingApp.halfDay || viewingApp.from === viewingApp.to || !viewingApp.to ? (
                  <span className="text-gray-400 font-normal">-</span>
                ) : (
                  viewingApp.to
                )}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark">
              <span className="text-[11px] text-gray-400 font-medium block">Applied On</span>
              <span className="text-xs font-bold font-mono text-black dark:text-white mt-0.5 block">
                {viewingApp.appliedOn || '-'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-stroke dark:border-strokedark">
              <span className="text-[11px] text-gray-400 font-medium block">Expiry Date</span>
              <span
                className={`text-xs font-bold font-mono mt-0.5 block ${
                  viewingApp.status === 'Approved'
                    ? 'text-gray-400 font-normal'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {viewingApp.status === 'Approved'
                  ? '-'
                  : viewingApp.expiryDate || getLeaveExpiryDate(viewingApp.to, viewingApp.from) || '-'}
              </span>
            </div>
          </div>

          {/* Reason / Remarks Section */}
          <div className="p-3.5 rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-slate-900/30">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Reason for Leave
            </span>
            <p className="text-xs text-black dark:text-white whitespace-pre-wrap leading-relaxed">
              {viewingApp.reason ? (
                viewingApp.reason
              ) : (
                <span className="italic text-gray-400">No reason was specified.</span>
              )}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/40">
          <div className="flex items-center gap-2">
            {viewingApp.status === 'Applied' && editable && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingApp;
                    const { remaining } = getEmpBalanceInfo(target.employeeId);
                    if (target.days > remaining) {
                      onApproveClick(target);
                    } else {
                      onDecide(target, 'Approved');
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDecide(viewingApp, 'Rejected');
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <MailX className="w-3.5 h-3.5" /> Reject
                </button>
              </>
            )}
            {viewingApp.status === 'Approved' &&
              editable &&
              (confirmCancelId === viewingApp.id ? (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-200">
                    Cancel approved leave?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDecide(viewingApp, 'Cancelled');
                      setConfirmCancelId(null);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancelId(null)}
                    className="px-2 py-1 rounded text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancelId(viewingApp.id)}
                  className="px-3.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition"
                >
                  Cancel Leave
                </button>
              ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmCancelId(null);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-xs font-bold text-black dark:text-white hover:bg-gray-100 dark:hover:bg-meta-4 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplicationDetailModal;
