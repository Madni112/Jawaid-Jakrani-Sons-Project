import React from 'react';
import {
  MdHistory,
  MdSearch,
  MdRefresh,
  MdFileDownload,
  MdCheckCircle,
  MdVisibility,
} from 'react-icons/md';
import Spinner from '../../../../../ui/Spinner';

interface BulkUploadBatchesSectionProps {
  uploadBatches: any[];
  currentTabBatches: any[];
  batchesLoading: boolean;
  historyTab: 'ALL' | 'OTHER' | 'TILES';
  setHistoryTab: (tab: 'ALL' | 'OTHER' | 'TILES') => void;
  batchSearchTerm: string;
  setBatchSearchTerm: (term: string) => void;
  fetchUploadBatches: () => void;
  formatUploadDate: (isoString?: string) => string;
  setSelectedBatchForView: (batch: any) => void;
  setModalItemSearch: (search: string) => void;
  setModalPage: (page: number) => void;
}

export const BulkUploadBatchesSection: React.FC<BulkUploadBatchesSectionProps> = ({
  uploadBatches,
  currentTabBatches,
  batchesLoading,
  historyTab,
  setHistoryTab,
  batchSearchTerm,
  setBatchSearchTerm,
  fetchUploadBatches,
  formatUploadDate,
  setSelectedBatchForView,
  setModalItemSearch,
  setModalPage,
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-3xl shadow-sm border border-slate-200 dark:border-strokedark p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stroke dark:border-strokedark">
        <div>
          <h3 className="text-base font-black text-black dark:text-white flex items-center gap-2">
            <MdHistory className="text-emerald-600 text-xl" />
            <span>Recent Upload History</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any upload batch to view the exact items and prices uploaded.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Catalog Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-meta-4/60 rounded-xl border border-stroke dark:border-strokedark">
            <button
              type="button"
              onClick={() => setHistoryTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                historyTab === 'ALL'
                  ? 'bg-white dark:bg-boxdark text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <span>All Uploads</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                {uploadBatches.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('OTHER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                historyTab === 'OTHER'
                  ? 'bg-white dark:bg-boxdark text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <span>Other Products</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                {uploadBatches.filter(b => (b.details?.batch_type || 'OTHER').toUpperCase() === 'OTHER').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('TILES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                historyTab === 'TILES'
                  ? 'bg-white dark:bg-boxdark text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <span>Tile Products</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 font-bold">
                {uploadBatches.filter(b => (b.details?.batch_type || '').toUpperCase() === 'TILES').length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={batchSearchTerm}
                onChange={(e) => setBatchSearchTerm(e.target.value)}
                placeholder="Search file or user..."
                className="w-full sm:w-56 rounded-xl border border-stroke py-1.5 px-3 pl-8 bg-white dark:bg-boxdark text-xs font-semibold outline-none focus:border-emerald-500"
              />
              <MdSearch className="absolute left-2.5 top-2 text-slate-400 text-sm" />
            </div>
            <button
              onClick={fetchUploadBatches}
              title="Refresh History"
              className="p-1.5 rounded-xl border border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-meta-4 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <MdRefresh size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="bg-slate-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-white border-b border-stroke dark:border-strokedark">
              <th className="py-3 px-4">Upload Date & Time</th>
              <th className="py-3 px-4 text-center">Catalog</th>
              <th className="py-3 px-4">File Name</th>
              <th className="py-3 px-4">Uploaded By</th>
              <th className="py-3 px-4 text-center">Items Count</th>
              <th className="py-3 px-4 text-center">Breakdown</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {batchesLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center"><Spinner /></td>
              </tr>
            ) : currentTabBatches.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 italic font-semibold text-xs">
                  No upload batches recorded under {historyTab === 'ALL' ? 'any catalog' : historyTab === 'TILES' ? 'Tile Products' : 'Other Products'}.
                </td>
              </tr>
            ) : (
              currentTabBatches.map((batch: any) => {
                const details = batch.details || {};
                const items = Array.isArray(details.items) ? details.items : [];
                const total = details.total_rows || items.length || 0;
                const newCount = details.inserted_count ?? 0;
                const upCount = details.updated_count ?? 0;
                const isTile = String(details.batch_type || 'OTHER').toUpperCase() === 'TILES';

                return (
                  <tr
                    key={batch.id}
                    onClick={() => { setSelectedBatchForView(batch); setModalItemSearch(''); setModalPage(1); }}
                    className="border-b border-stroke dark:border-strokedark hover:bg-emerald-50/50 dark:hover:bg-meta-4/20 cursor-pointer transition text-xs font-semibold"
                  >
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {formatUploadDate(batch.created_at || details.uploaded_at)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isTile
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      }`}>
                        {isTile ? 'Tiles' : 'Other'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MdFileDownload className="text-emerald-600 text-sm shrink-0" />
                      <span className="truncate max-w-[220px]" title={details.file_name}>
                        {details.file_name || 'Upload_Batch.xlsx'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-sans">
                      {batch.performed_by || 'User'}
                    </td>
                    <td className="py-3 px-4 text-center font-black text-slate-900 dark:text-white">
                      {total} Products
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[10px]">
                        {newCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                            +{newCount} New
                          </span>
                        )}
                        {upCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold">
                            {upCount} Updated
                          </span>
                        )}
                        {newCount === 0 && upCount === 0 && (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <MdCheckCircle size={12} />
                        Success
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => { setSelectedBatchForView(batch); setModalItemSearch(''); setModalPage(1); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        <MdVisibility size={14} />
                        <span>View Items</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
