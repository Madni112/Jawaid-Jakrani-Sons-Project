import React from 'react';
import { AttendanceSummaryStats } from '../types/attendanceTypes';

interface AttendanceStatsStripProps {
  totalStaff: number;
  shown: AttendanceSummaryStats;
}

export const AttendanceStatsStrip: React.FC<AttendanceStatsStripProps> = ({
  totalStaff,
  shown
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 my-4">
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark">
        <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">Total Staff</span>
        <span className="text-base font-bold text-black dark:text-white">{totalStaff}</span>
      </div>
      <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
        <span className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Present (P)</span>
        <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">{shown.present}</span>
      </div>
      <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
        <span className="block text-[11px] font-semibold text-rose-700 dark:text-rose-400">Absent (A)</span>
        <span className="text-base font-bold text-rose-700 dark:text-rose-400">{shown.absent}</span>
      </div>
      <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
        <span className="block text-[11px] font-semibold text-amber-700 dark:text-amber-400">Half Day (½)</span>
        <span className="text-base font-bold text-amber-700 dark:text-amber-400">{shown.halfDay}</span>
      </div>
      <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
        <span className="block text-[11px] font-semibold text-blue-700 dark:text-blue-400">Leaves (L)</span>
        <span className="text-base font-bold text-blue-700 dark:text-blue-400">{shown.leave}</span>
      </div>
      <div className="p-3 rounded-lg bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40">
        <span className="block text-[11px] font-semibold text-purple-700 dark:text-purple-400">Holiday / Fri (H)</span>
        <span className="text-base font-bold text-purple-700 dark:text-purple-400">{shown.holiday}</span>
      </div>
      <div className="p-3 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
        <span className="block text-[11px] font-semibold text-red-700 dark:text-red-400">Deduct Days</span>
        <span className="text-base font-bold text-red-700 dark:text-red-400">{shown.unpaid}</span>
      </div>
    </div>
  );
};

export default AttendanceStatsStrip;
