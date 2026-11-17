import React from 'react';
import {
  MdSearch,
  MdClose,
  MdBlock,
  MdDeleteOutline,
  MdFileDownload,
} from 'react-icons/md';

interface BulkUploadStatsBarProps {
  activeTab: 'OTHER' | 'TILES';
  fileName: string | null;
  metrics: {
    total: number;
    ready: number;
    fileDup: number;
    dbDup: number;
    invalid: number;
    selectedCount: number;
  };
  activeFilterTab: 'ALL' | 'READY' | 'FILE_DUP' | 'DB_DUP' | 'INVALID';
  setActiveFilterTab: (tab: 'ALL' | 'READY' | 'FILE_DUP' | 'DB_DUP' | 'INVALID') => void;
  setCurrentPage: (page: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectAllFiltered: () => void;
  deselectAllFiltered: () => void;
  removeInvalidRows: () => void;
  removeAllDuplicates: () => void;
  handleExportFiltered: (type: 'DUPLICATES' | 'REJECTED') => void;
}

export const BulkUploadStatsBar: React.FC<BulkUploadStatsBarProps> = ({
  activeTab,
  fileName,
  metrics,
  activeFilterTab,
  setActiveFilterTab,
  setCurrentPage,
  searchTerm,
  setSearchTerm,
  selectAllFiltered,
  deselectAllFiltered,
  removeInvalidRows,
  removeAllDuplicates,
  handleExportFiltered,
}) => {
  return (
    <>
      {/* FILE INFO & QUICK STATS FOR CURRENT TAB */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total In Current Tab */}
        <div className="bg-white dark:bg-boxdark p-4 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            {activeTab === 'TILES' ? 'Tiles In Tab' : 'Others In Tab'}
          </span>
          <div className="text-2xl font-black text-black dark:text-white mt-1">
            {metrics.total.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5" title={fileName || ''}>
            📄 {fileName}
          </span>
        </div>

        {/* Ready to Upload (Green) */}
        <div
          onClick={() => { setActiveFilterTab('READY'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeFilterTab === 'READY'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
              : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
              Ready to Add (New)
            </span>
            <span className="text-base">🟢</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.ready.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Clean unique items
          </span>
        </div>

        {/* Duplicates in File (Yellow/Amber) */}
        <div
          onClick={() => { setActiveFilterTab('FILE_DUP'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeFilterTab === 'FILE_DUP'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500'
              : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
              Duplicates in File
            </span>
            <span className="text-base">🟡</span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {metrics.fileDup.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Repeated Code + Description
          </span>
        </div>

        {/* In Database (Blue) */}
        <div
          onClick={() => { setActiveFilterTab('DB_DUP'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeFilterTab === 'DB_DUP'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500'
              : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">
              Already in Catalog
            </span>
            <span className="text-base">🔵</span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {metrics.dbDup.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Matches existing DB ID
          </span>
        </div>

        {/* Rejected / Invalid (Rose/Red) */}
        <div
          onClick={() => { setActiveFilterTab('INVALID'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-2xs ${
            activeFilterTab === 'INVALID'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500'
              : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider">
              Rejected / Invalid
            </span>
            <span className="text-base">⛔</span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {metrics.invalid.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Missing required data
          </span>
        </div>
      </div>

      {/* ACTION TOOLBAR & CONTROLS */}
      <div className="bg-white dark:bg-boxdark p-4 rounded-2xl border border-stroke dark:border-strokedark shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* FILTER PILLS */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => { setActiveFilterTab('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeFilterTab === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Rows ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => { setActiveFilterTab('READY'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeFilterTab === 'READY'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              🟢 Ready to Add ({metrics.ready})
            </button>
            <button
              type="button"
              onClick={() => { setActiveFilterTab('FILE_DUP'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeFilterTab === 'FILE_DUP'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              🟡 File Duplicates ({metrics.fileDup})
            </button>
            <button
              type="button"
              onClick={() => { setActiveFilterTab('DB_DUP'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeFilterTab === 'DB_DUP'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              🔵 Already in DB ({metrics.dbDup})
            </button>
            <button
              type="button"
              onClick={() => { setActiveFilterTab('INVALID'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                activeFilterTab === 'INVALID'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              ⛔ Rejected ({metrics.invalid})
            </button>
          </div>

          {/* SEARCH BOX */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Filter by Code, Name, Brand..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs rounded-xl border border-stroke dark:border-strokedark py-2 pl-8 pr-3 bg-transparent outline-none focus:border-emerald-600 text-black dark:text-white"
            />
            <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <MdClose className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* SELECTION ACTIONS & DUPLICATE CLEANUP BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stroke dark:border-strokedark text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              Selected: <strong className="text-black dark:text-white">{metrics.selectedCount}</strong>
            </span>
            <button
              type="button"
              onClick={selectAllFiltered}
              className="px-2.5 py-1 rounded-lg border border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-meta-4 font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Select All Filtered
            </button>
            <button
              type="button"
              onClick={deselectAllFiltered}
              className="px-2.5 py-1 rounded-lg border border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-meta-4 font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Deselect All
            </button>

            {metrics.invalid > 0 && (
              <button
                type="button"
                onClick={removeInvalidRows}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <MdBlock className="text-xs" /> Remove All Rejected ({metrics.invalid})
              </button>
            )}

            {(metrics.fileDup > 0 || metrics.dbDup > 0) && (
              <button
                type="button"
                onClick={removeAllDuplicates}
                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <MdDeleteOutline className="text-xs" /> Remove All Duplicates
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Catalog Master Status Legend */}
            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-meta-4/30 px-3 py-1.5 rounded-xl border border-stroke dark:border-strokedark">
              <span className="font-bold text-slate-700 dark:text-slate-300">Catalog Master:</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Already Exists
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Will Create
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleExportFiltered('DUPLICATES')}
              className="px-3 py-1.5 rounded-xl border border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-meta-4 font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1 cursor-pointer"
            >
              <MdFileDownload className="text-sm text-amber-600" /> Export Duplicates
            </button>

            {metrics.invalid > 0 && (
              <button
                type="button"
                onClick={() => handleExportFiltered('REJECTED')}
                className="px-3 py-1.5 rounded-xl border border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-meta-4 font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1 cursor-pointer"
              >
                <MdFileDownload className="text-sm text-rose-600" /> Export Rejected
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
