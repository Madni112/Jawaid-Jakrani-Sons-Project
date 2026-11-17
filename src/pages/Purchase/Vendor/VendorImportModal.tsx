import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdClose, MdFileDownload, MdCloudUpload, MdStorefront } from 'react-icons/md';

import { VendorImportModalProps, ParsedVendor } from './import/types/vendorImportTypes';
import { handleDownloadVendorTemplate } from './import/utils/vendorTemplateGenerator';
import { parseVendorMatrixData, executeVendorBatchImportAction } from './import/services/vendorImportService';
import { VendorImportDropzone } from './import/components/VendorImportDropzone';
import { VendorImportPreviewTable } from './import/components/VendorImportPreviewTable';

export type { ParsedVendor, VendorImportModalProps };

export const VendorImportModal: React.FC<VendorImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedVendor[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear state on modal close
  useEffect(() => {
    if (!isOpen) {
      setParsedData([]);
      setFileName('');
      setImporting(false);
      setParsing(false);
    }
  }, [isOpen]);

  // Global Ctrl + V clipboard paste handler when modal is active
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // 1. Check if an Excel / CSV file was copied to clipboard
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls') ||
          file.name.endsWith('.csv')
        ) {
          e.preventDefault();
          processFile(file);
          return;
        }
      }

      // 2. Check if tabular data was copied directly from Excel / Sheets cells
      if (e.clipboardData) {
        const text = e.clipboardData.getData('text/plain');
        if (text && (text.includes('\t') || text.includes('\n'))) {
          e.preventDefault();
          processRawText(text);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Process uploaded or dropped File
  const processFile = (file: File) => {
    setFileName(file.name);
    setParsing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        await parseMatrix(rows);
      } catch (err: any) {
        console.error('File parse error:', err);
        toast.error('Failed to parse Excel file. Please ensure valid .xlsx or .csv format.');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Process raw tabular text pasted via Ctrl + V
  const processRawText = async (text: string) => {
    setParsing(true);
    try {
      const workbook = XLSX.read(text, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      setFileName('Pasted Clipboard Data');
      await parseMatrix(rows);
      toast.success('Pasted clipboard data successfully parsed!');
    } catch (err) {
      console.error('Clipboard text parse error:', err);
      toast.error('Could not parse pasted data. Please copy rows directly from Excel.');
    } finally {
      setParsing(false);
    }
  };

  const parseMatrix = async (rows: any[][]) => {
    try {
      const list = await parseVendorMatrixData(rows);
      if (list.length === 0) {
        toast.error('No valid vendor data rows detected in spreadsheet.');
      } else {
        setParsedData(list);
        const existingCount = list.filter((r) => r.isExisting).length;
        const newCount = list.length - existingCount;
        if (existingCount > 0) {
          toast.success(
            `Parsed ${list.length} records (${existingCount} existing will be updated, ${newCount} new to add)!`
          );
        } else {
          toast.success(`Parsed ${list.length} new vendor records!`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error parsing matrix');
    }
  };

  const handleExecuteImport = async () => {
    const validRows = parsedData.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('No valid vendors ready to import.');
      return;
    }

    setImporting(true);
    try {
      const { insertedCount, updatedCount } = await executeVendorBatchImportAction(validRows);
      toast.success(
        `Bulk Import Complete: ${insertedCount} new vendors added, ${updatedCount} existing updated!`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Execute import error:', err);
      toast.error('Import failed: ' + (err.message || 'Database error'));
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const existingCount = parsedData.filter((r) => r.isExisting).length;
  const newCount = validCount - existingCount;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#121926] shadow-2xl border border-stroke dark:border-strokedark overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark bg-slate-50/70 dark:bg-meta-4/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <MdStorefront size={22} />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                Import Vendors & Suppliers from Excel
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bulk upload suppliers, smart address & city mapping, and existing vendor balance sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadVendorTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 transition shadow-xs cursor-pointer"
              title="Download standard Excel upload format"
            >
              <MdFileDownload size={16} />
              <span>Download Excel Format</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-meta-4 cursor-pointer"
            >
              <MdClose size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Dropzone Container */}
          <VendorImportDropzone
            dragActive={dragActive}
            setDragActive={setDragActive}
            onFileSelected={processFile}
            fileInputRef={fileInputRef}
          />

          {/* Parsing Spinner */}
          {parsing && (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
              <Spinner size="w-4 h-4" />
              <span>Inspecting spreadsheet and matching with registered vendors...</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData.length > 0 && (
            <VendorImportPreviewTable
              parsedData={parsedData}
              fileName={fileName}
              onClear={() => {
                setParsedData([]);
                setFileName('');
              }}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-meta-4/20">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {parsedData.length > 0 && (
              <span className="text-xs text-slate-500">
                Ready: <strong className="text-slate-900 dark:text-white">{newCount} new</strong> to add,{' '}
                <strong className="text-amber-600 dark:text-amber-400">{existingCount} existing</strong> to update
              </span>
            )}

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={importing || validCount === 0}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              {importing ? (
                <>
                  <Spinner color="border-white" size="w-3.5 h-3.5" />
                  <span>Processing Vendors...</span>
                </>
              ) : (
                <>
                  <MdCloudUpload size={16} />
                  <span>Import & Update {validCount > 0 ? `(${validCount} Vendors)` : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorImportModal;
