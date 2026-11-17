import React from 'react';
import { MdCloudUpload } from 'react-icons/md';

interface VendorImportDropzoneProps {
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  onFileSelected: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const VendorImportDropzone: React.FC<VendorImportDropzoneProps> = ({
  dragActive,
  setDragActive,
  onFileSelected,
  fileInputRef
}) => {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          onFileSelected(e.dataTransfer.files[0]);
        }
      }}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-2 ${
        dragActive
          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20'
          : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 hover:bg-slate-50/40 dark:hover:bg-meta-4/10'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileSelected(e.target.files[0]);
          }
        }}
      />

      <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
        <MdCloudUpload size={26} />
      </div>

      <div>
        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
          Click to browse or drag & drop Excel / CSV here
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          or simply press{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300 text-[10px]">
            Ctrl + V
          </kbd>{' '}
          anywhere in this popup to paste copied cells
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10.5px] text-slate-400 pt-1">
        <span>Columns:</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">Vendor Name *</span>
        <span>•</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">Company</span>
        <span>•</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">Phone</span>
        <span>•</span>
        <span className="font-semibold text-purple-600 dark:text-purple-400">City * (e.g. ماتلی)</span>
        <span>•</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">Area</span>
        <span>•</span>
        <span className="font-semibold text-purple-600 dark:text-purple-400">Address</span>
        <span>•</span>
        <span className="font-semibold text-purple-600 dark:text-purple-400">Province</span>
        <span>•</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">Opening Balance</span>
        <span>•</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">Nature (Cr / Dr)</span>
      </div>
    </div>
  );
};
