import React from 'react';
import { CalendarCheck, Printer, CheckCircle2 } from 'lucide-react';
import Spinner from '../../../../ui/Spinner';

interface AttendanceHeaderProps {
  autoSaveStatus: 'saved' | 'saving';
  onPrint: () => void;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  autoSaveStatus,
  onPrint
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stroke dark:border-strokedark">
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-black dark:text-white">Attendance Register</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Monthly staff attendance (Fridays fixed as Holiday · Future dates locked until date arrives)
            </p>
          </div>
        </div>
      </div>

      {/* Right Action: Auto-Save Status + Print Document */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-850">
          {autoSaveStatus === 'saving' ? (
            <>
              <Spinner />
              <span>Saving changes...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Auto-Saved</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onPrint}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-stroke dark:border-strokedark bg-white dark:bg-meta-4/30 hover:bg-gray-50 dark:hover:bg-meta-4/60 text-black dark:text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          title="Print Monthly Attendance Sheet for all staff"
        >
          <Printer className="w-3.5 h-3.5 text-primary" />
          <span>Print Sheet</span>
        </button>
      </div>
    </div>
  );
};

export default AttendanceHeader;
