import React from 'react';
import { MdCheckCircle } from 'react-icons/md';

interface UploadSuccessModalProps {
  uploadResult: {
    newCount: number;
    updatedCount: number;
    skippedCount: number;
    totalRows: number;
    mastersCount?: number;
  } | null;
  handleReset: () => void;
  navigate: (path: string) => void;
}

export const UploadSuccessModal: React.FC<UploadSuccessModalProps> = ({
  uploadResult,
  handleReset,
  navigate,
}) => {
  if (!uploadResult) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-99999 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-boxdark w-full max-w-md rounded-3xl border border-stroke dark:border-strokedark p-6 shadow-2xl space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-3xl mx-auto">
          <MdCheckCircle />
        </div>

        <div className="space-y-1">
          <h4 className="text-lg font-black text-black dark:text-white">
            Bulk Upload Successfully Completed!
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your product catalog has been safely updated with full duplicate protection.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-meta-4/20 p-3 rounded-2xl border border-stroke dark:border-strokedark text-xs">
          <div className="p-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">New Added</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {uploadResult.newCount}
            </span>
          </div>
          <div className="p-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Updated</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 block mt-0.5">
              {uploadResult.updatedCount}
            </span>
          </div>
          <div className="p-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Skipped</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
              {uploadResult.skippedCount}
            </span>
          </div>
          <div className="p-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Masters</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5" title="New Categories, Brands & Prints created">
              {uploadResult.mastersCount || 0}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-stroke dark:border-strokedark text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            Upload Another File
          </button>
          <button
            type="button"
            onClick={() => navigate('/Administration/Products/List')}
            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-md cursor-pointer"
          >
            View Products List
          </button>
        </div>
      </div>
    </div>
  );
};
