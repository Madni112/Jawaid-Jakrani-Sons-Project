import React from 'react';
import { Check, X } from 'lucide-react';
import { LeaveApplication } from '../../../../services/hr.service';

interface OverLimitApprovalModalProps {
  overLimitConfirmApp: LeaveApplication | null;
  onClose: () => void;
  getEmpBalanceInfo: (empId?: number | null) => { allowed: number; taken: number; remaining: number };
  onConfirmApprove: (target: LeaveApplication) => void;
}

export const OverLimitApprovalModal: React.FC<OverLimitApprovalModalProps> = ({
  overLimitConfirmApp,
  onClose,
  getEmpBalanceInfo,
  onConfirmApprove
}) => {
  if (!overLimitConfirmApp) return null;

  const { allowed, taken, remaining } = getEmpBalanceInfo(overLimitConfirmApp.employeeId);
  const extra = Math.max(0, overLimitConfirmApp.days - remaining);

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-amber-300 bg-white shadow-2xl dark:border-amber-700 dark:bg-boxdark overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark bg-amber-50 dark:bg-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 text-lg font-bold">
              ⚠️
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-100">
                Approve Over-Limit Leave?
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Employee has exceeded annual leave quota
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-black dark:hover:bg-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Employee:</span>
              <span className="font-bold text-black dark:text-white">
                {overLimitConfirmApp.employeeName}{' '}
                {overLimitConfirmApp.employeeCode ? `(${overLimitConfirmApp.employeeCode})` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Annual Quota:</span>
              <span className="font-mono font-bold text-black dark:text-white">{allowed} Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Leaves Taken So Far:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {taken} Days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Available Balance:</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {remaining} Days Left
              </span>
            </div>
            <div className="pt-2 border-t border-stroke dark:border-strokedark flex justify-between">
              <span className="font-semibold text-black dark:text-white">Leave Requested:</span>
              <span className="font-mono font-bold text-primary">
                {overLimitConfirmApp.days} Day(s)
              </span>
            </div>
            <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
              <span>Exceeding Quota By:</span>
              <span className="font-mono">+{extra} Day(s)</span>
            </div>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Approving this request will grant{' '}
            <strong className="text-black dark:text-white">
              {overLimitConfirmApp.employeeName}
            </strong>{' '}
            more leave days than their annual allowance. Do you still want to approve this
            application?
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            Cancel / No
          </button>
          <button
            type="button"
            onClick={() => onConfirmApprove(overLimitConfirmApp)}
            className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Yes, Approve Over Limit
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverLimitApprovalModal;
