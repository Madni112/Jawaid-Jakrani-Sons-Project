import React from 'react';
import {
  MdTune,
  MdCategory,
  MdCloudUpload,
} from 'react-icons/md';
import Spinner from '../../../../../ui/Spinner';
import { ProcessedRow } from '../types/bulkUploadTypes';

interface BulkUploadConfirmationDockProps {
  uploadMode: 'SKIP_DUPLICATES' | 'UPDATE_EXISTING';
  setUploadMode: (mode: 'SKIP_DUPLICATES' | 'UPDATE_EXISTING') => void;
  autoCreateMasters: boolean;
  setAutoCreateMasters: (val: boolean) => void;
  handleReset: () => void;
  loading: boolean;
  metrics: {
    selectedCount: number;
  };
  handleExecuteUpload: () => void;
  uploadProgress: { current: number; total: number; stage: string } | null;
  activeTab: 'OTHER' | 'TILES';
  isMixedFile: boolean;
  handleExecuteUploadBoth: () => void;
  otherRows: ProcessedRow[];
  tileRows: ProcessedRow[];
}

export const BulkUploadConfirmationDock: React.FC<BulkUploadConfirmationDockProps> = ({
  uploadMode,
  setUploadMode,
  autoCreateMasters,
  setAutoCreateMasters,
  handleReset,
  loading,
  metrics,
  handleExecuteUpload,
  uploadProgress,
  activeTab,
  isMixedFile,
  handleExecuteUploadBoth,
  otherRows,
  tileRows,
}) => {
  return (
    <div className="bg-white dark:bg-boxdark p-5 rounded-3xl border border-stroke dark:border-strokedark shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
          <MdTune className="text-emerald-600 text-base" /> Duplicate Handling Strategy:
        </h4>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="uploadMode"
              value="SKIP_DUPLICATES"
              checked={uploadMode === 'SKIP_DUPLICATES'}
              onChange={() => setUploadMode('SKIP_DUPLICATES')}
              className="cursor-pointer"
            />
            <span>Skip existing catalog duplicates (Insert clean only)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="uploadMode"
              value="UPDATE_EXISTING"
              checked={uploadMode === 'UPDATE_EXISTING'}
              onChange={() => setUploadMode('UPDATE_EXISTING')}
              className="cursor-pointer"
            />
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              Update existing catalog items if matched in database
            </span>
          </label>
        </div>

        {/* Master Hierarchy Provisioning Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-strokedark/60 space-y-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={autoCreateMasters}
              onChange={(e) => setAutoCreateMasters(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <MdCategory className="text-emerald-600 text-sm" />
              <span>Auto-create missing Categories, Subcategories, Brands & Prints in master lists</span>
            </span>
          </label>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-5">
            Builds the 3-level tree (Parent Category → Sub Category → Category/Size) and registers Brands & Prints so dropdowns stay fully synchronized.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2.5 text-xs font-bold rounded-xl border border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-meta-4 text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          Cancel & Clear
        </button>

        {/* Upload current tab */}
        <button
          type="button"
          disabled={loading || metrics.selectedCount === 0}
          onClick={handleExecuteUpload}
          className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Spinner />
              <span>Processing {uploadProgress?.current || 0}/{uploadProgress?.total || metrics.selectedCount}...</span>
            </>
          ) : (
            <>
              <MdCloudUpload className="text-base" />
              <span>Upload {metrics.selectedCount} {activeTab === 'TILES' ? 'Tile' : 'Other'} Products</span>
            </>
          )}
        </button>

        {/* Upload both tabs if mixed file */}
        {isMixedFile && (
          <button
            type="button"
            disabled={loading}
            onClick={handleExecuteUploadBoth}
            className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <MdCloudUpload className="text-base text-emerald-400" />
            <span>Upload Both Tabs ({otherRows.length + tileRows.length} Total)</span>
          </button>
        )}
      </div>
    </div>
  );
};
