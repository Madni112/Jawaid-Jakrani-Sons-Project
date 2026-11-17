import React from 'react';
import { MdAssessment, MdSearch, MdClear, MdRestartAlt, MdAccessTime } from 'react-icons/md';

interface ReportHeaderTheme1Props {
  reportsCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleResetOrder: () => void;
}

export const ReportHeaderTheme1: React.FC<ReportHeaderTheme1Props> = ({
  reportsCount,
  searchQuery,
  setSearchQuery,
  handleResetOrder,
}) => {
  return (
    <>
      {/* BREADCRUMB & METADATA BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 uppercase tracking-wider">
          <span>Financial Accounting</span>
          <span>&gt;</span>
          <span>Operational Ledger</span>
          <span>&gt;</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Standard Reports Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 font-semibold text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ledger Synced Active</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <MdAccessTime size={14} />
            <span>Real-time DB</span>
          </div>
        </div>
      </div>

      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-inner">
            <MdAssessment size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                Reports Directory
              </h1>
              <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md text-[11px] border border-emerald-200 dark:border-emerald-800/40">
                {reportsCount} Available
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Drag report cards or whole category boxes to rearrange. Saved automatically in your browser.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleResetOrder}
            title="Reset layout and category positions to default"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
          >
            <MdRestartAlt size={16} />
            <span className="hidden sm:inline">Reset Layout</span>
          </button>

          <div className="w-full md:w-80 relative">
            <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by name or keyword..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
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
        </div>
      </div>
    </>
  );
};
