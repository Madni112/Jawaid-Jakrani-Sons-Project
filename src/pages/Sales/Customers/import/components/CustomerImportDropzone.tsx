import React, { useRef, useState } from 'react';
import { MdCloudUpload } from 'react-icons/md';
import Spinner from '../../../../../ui/Spinner';

interface CustomerImportDropzoneProps {
  onFileSelect: (file: File) => void;
  parsing: boolean;
}

export const CustomerImportDropzone: React.FC<CustomerImportDropzoneProps> = ({
  onFileSelect,
  parsing,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-meta-4/10 hover:border-primary/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFileSelect(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <MdCloudUpload size={24} />
          </div>

          <div>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Click to browse or drag & drop Excel / CSV here
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              or simply press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold">
                Ctrl + V
              </kbd>{' '}
              anywhere in this popup to paste copied cells
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 text-[11px] text-slate-500 font-mono">
            <span>Columns:</span>
            <span className="font-bold text-black dark:text-white">Customer Name *</span>
            <span>•</span>
            <span>Tier</span>
            <span>•</span>
            <span>Phone</span>
            <span>•</span>
            <span className="font-bold text-black dark:text-white">City * (e.g. ماتلی)</span>
            <span>•</span>
            <span>Area</span>
            <span>•</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Address</span>
            <span>•</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Province</span>
            <span>•</span>
            <span>Opening Balance</span>
            <span>•</span>
            <span>Nature (Dr / Cr)</span>
          </div>
        </div>
      </div>

      {parsing && (
        <div className="flex items-center justify-center py-8 gap-3">
          <Spinner />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Checking existing customer names and matching columns...
          </span>
        </div>
      )}
    </>
  );
};
