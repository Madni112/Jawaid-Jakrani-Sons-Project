import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { monthNamed } from '../utils/attendanceHelpers';

interface AttendanceToolbarProps {
  month: string;
  setMonth: (month: string) => void;
  totalDays: number;
  search: string;
  setSearch: (search: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetPage: () => void;
}

export const AttendanceToolbar: React.FC<AttendanceToolbarProps> = ({
  month,
  setMonth,
  totalDays,
  search,
  setSearch,
  onPrevMonth,
  onNextMonth,
  onResetPage
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stroke dark:border-strokedark">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-2 rounded border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 text-black dark:text-white cursor-pointer"
          title="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <input
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            onResetPage();
          }}
          className="rounded border border-stroke dark:border-strokedark bg-white dark:bg-boxdark px-3 py-1.5 text-xs font-bold text-black dark:text-white outline-none focus:border-primary shadow-2xs cursor-pointer"
        />

        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 rounded border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 text-black dark:text-white cursor-pointer"
          title="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:inline">
          {monthNamed(month)} ({totalDays} Days)
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search staff, code, role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onResetPage();
            }}
            className="w-full rounded border border-stroke dark:border-strokedark bg-white dark:bg-boxdark pl-8 pr-3 py-1.5 text-xs text-black dark:text-white outline-none focus:border-primary"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                onResetPage();
              }}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-black dark:hover:text-white text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceToolbar;
