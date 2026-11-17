import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AttendancePaginationProps {
  pageSize: number;
  setPageSize: (size: number) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalStaff: number;
  totalPages: number;
  currentPage: number;
}

export const AttendancePagination: React.FC<AttendancePaginationProps> = ({
  pageSize,
  setPageSize,
  setPage,
  totalStaff,
  totalPages,
  currentPage
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg text-xs shadow-2xs">
      <div className="flex items-center gap-3">
        <span className="text-gray-500 dark:text-gray-400">
          Showing{' '}
          <span className="font-bold text-black dark:text-white">
            {pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-bold text-black dark:text-white">
            {pageSize === -1 ? totalStaff : Math.min(currentPage * pageSize, totalStaff)}
          </span>{' '}
          of{' '}
          <span className="font-bold text-black dark:text-white">{totalStaff}</span>{' '}
          staff
        </span>

        <div className="flex items-center gap-1.5 border-l border-stroke dark:border-strokedark pl-3">
          <span className="text-gray-500 dark:text-gray-400">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded border border-stroke dark:border-strokedark bg-white dark:bg-boxdark px-2 py-1 text-xs font-bold text-black dark:text-white outline-none focus:border-primary cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={-1}>All</option>
          </select>
          <span className="text-gray-500 dark:text-gray-400">entries</span>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 disabled:opacity-40 disabled:cursor-not-allowed text-black dark:text-white cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && p - prev > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={`min-w-[28px] h-7 px-2 rounded font-bold transition cursor-pointer ${
                      p === currentPage
                        ? 'bg-primary text-white shadow-xs'
                        : 'border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 text-black dark:text-white'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 disabled:opacity-40 disabled:cursor-not-allowed text-black dark:text-white cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendancePagination;
