import React from 'react';
import { Info, X, ChevronRight } from 'lucide-react';
import { monthNamed } from '../utils/attendanceHelpers';
import type { LockedLeaveModalState } from '../types/attendanceTypes';

interface ApprovedLeaveLockedModalProps {
  modalState: LockedLeaveModalState;
  month: string;
  onClose: () => void;
  onNavigateToLeaves: () => void;
}

export const ApprovedLeaveLockedModal: React.FC<ApprovedLeaveLockedModalProps> = ({
  modalState,
  month,
  onClose,
  onNavigateToLeaves
}) => {
  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-stroke bg-white shadow-2xl dark:border-strokedark dark:bg-boxdark p-6 overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-black dark:text-white">
              Leave Already Approved
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave for <strong className="text-black dark:text-white">{modalState.row.name}</strong> on{' '}
              <strong className="text-black dark:text-white">
                {modalState.day} {monthNamed(month)}
              </strong>{' '}
              has already been approved.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <div className="font-semibold mb-1 flex items-center gap-1.5">
            <span>Application #{modalState.meta.number}</span>
            <span>·</span>
            <span>{modalState.meta.leaveType}</span>
            {modalState.meta.halfDay && (
              <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 text-[10px] font-bold">
                Half Day
              </span>
            )}
          </div>
          <p>
            Leave of this date has been approved (try canceling or rejecting the leave in Leave Management first, then change its mark).
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stroke dark:border-strokedark text-xs font-bold text-black dark:text-white hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToLeaves();
            }}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-opacity-90 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Go to Leave Management</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
