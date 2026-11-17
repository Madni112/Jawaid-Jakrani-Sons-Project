import React from 'react';
import { LuBarChart2, LuDownload, LuPrinter, LuSearch } from 'react-icons/lu';
import { MdClear, MdRestartAlt } from 'react-icons/md';
import { ReportItem } from '../types/reportDashboardTypes';

interface ReportHeaderTheme2Props {
  reportsCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  exporting: boolean;
  handleBatchExport: () => void;
  handleResetOrder: () => void;
  filteredReports: ReportItem[];
  handleNavigate: (report: ReportItem) => void;
}

export const ReportHeaderTheme2: React.FC<ReportHeaderTheme2Props> = ({
  reportsCount,
  searchQuery,
  setSearchQuery,
  exporting,
  handleBatchExport,
  handleResetOrder,
  filteredReports,
  handleNavigate,
}) => {
  return (
    <>
      {/* BREADCRUMB & METADATA BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pb-1">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Reports</span>
          <span className="text-slate-400">/</span>
          <span>Overview</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 dark:text-white font-bold">Reports Directory</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live DB Synced
          </span>
        </div>
      </div>

      {/* CRITERIA SPECIFICATION CARD */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                Reports Directory
              </h1>
              <span className="bg-[#800020]/10 text-[#800020] dark:bg-[#800020]/30 dark:text-rose-200 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-[#800020]/20">
                {reportsCount} Active Modules
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Select category criteria or search report modules to analyze fiscal metrics, transactions and inventory.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBatchExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              <LuDownload size={14} />
              <span>{exporting ? 'Exporting...' : 'CSV'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              <LuPrinter size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const firstReport = filteredReports[0];
                if (firstReport) handleNavigate(firstReport);
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#800020] hover:bg-[#6e001c] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <LuBarChart2 size={14} />
              <span>Generate</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="w-full sm:w-auto">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Financial Year 2026-27 (Active)
            </span>
          </div>
          <div className="w-full sm:flex-1 relative">
            <LuSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by name or keyword..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] outline-none transition text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <MdClear size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleResetOrder}
            title="Reset layout and category positions to default"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-xs transition cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
          >
            <MdRestartAlt size={15} />
            <span>Reset Layout</span>
          </button>
        </div>
      </div>
    </>
  );
};
