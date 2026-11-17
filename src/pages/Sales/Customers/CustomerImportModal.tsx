import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdClose, MdCloudUpload, MdFileDownload } from 'react-icons/md';
import { CustomerImportModalProps, ParsedCustomer } from './import/types/customerImportTypes';
import {
  parseCustomerMatrix,
  downloadCustomerFormatTemplate,
} from './import/utils/customerImportParser';
import { executeCustomerBatchImport } from './import/services/customerImportService';
import { CustomerImportDropzone } from './import/components/CustomerImportDropzone';
import { CustomerImportPreviewTable } from './import/components/CustomerImportPreviewTable';

export type { CustomerImportModalProps, ParsedCustomer };

export const CustomerImportModal: React.FC<CustomerImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [parsedData, setParsedData] = useState<ParsedCustomer[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [batchOpeningDate, setBatchOpeningDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  // Clear state on modal close
  useEffect(() => {
    if (!isOpen) {
      setParsedData([]);
      setFileName('');
      setImporting(false);
      setParsing(false);
    }
  }, [isOpen]);

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
        const list = await parseCustomerMatrix(rows, batchOpeningDate);
        setParsedData(list);
        const existingCount = list.filter((r) => r.isExisting).length;
        const newCount = list.length - existingCount;
        if (existingCount > 0) {
          toast.success(
            `Parsed ${list.length} records (${existingCount} existing will be updated, ${newCount} new to add)!`
          );
        } else {
          toast.success(`Parsed ${list.length} new customer records!`);
        }
      } catch (err: any) {
        console.error('File parse error:', err);
        toast.error(err.message || 'Failed to parse Excel file. Please ensure valid .xlsx or .csv format.');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processRawText = async (text: string) => {
    setParsing(true);
    try {
      const workbook = XLSX.read(text, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      setFileName('Pasted Clipboard Data');
      const list = await parseCustomerMatrix(rows, batchOpeningDate);
      setParsedData(list);
      toast.success('Pasted clipboard data successfully parsed!');
    } catch (err: any) {
      console.error('Clipboard text parse error:', err);
      toast.error(err.message || 'Could not parse pasted data. Please copy rows directly from Excel.');
    } finally {
      setParsing(false);
    }
  };

  // Global Ctrl + V clipboard paste handler when modal is active
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
          e.preventDefault();
          processFile(file);
          return;
        }
      }

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
  }, [isOpen, batchOpeningDate]);

  if (!isOpen) return null;

  const handleExecuteImport = async () => {
    const validRows = parsedData.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('No valid customers ready to import.');
      return;
    }

    setImporting(true);
    try {
      const { insertedCount, updatedCount } = await executeCustomerBatchImport(
        validRows,
        batchOpeningDate
      );
      toast.success(
        `Import completed successfully! (${insertedCount} new created, ${updatedCount} existing updated)`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.message || 'Failed to import customers.');
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const existingCount = parsedData.filter((r) => r.isExisting && r.isValid).length;
  const newCount = validCount - existingCount;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-meta-4/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MdCloudUpload size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Import Customers from Excel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk upload, smart city auto-mapping, address & province support, and existing customer balance sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadCustomerFormatTemplate}
              className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download standard format template"
            >
              <MdFileDownload size={16} />
              <span>Download Excel Format</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <MdClose size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Dropzone & Paste Canvas */}
          <CustomerImportDropzone onFileSelect={processFile} parsing={parsing} />

          {/* Parsed Preview Table */}
          <CustomerImportPreviewTable
            parsedData={parsedData}
            fileName={fileName}
            batchOpeningDate={batchOpeningDate}
            setBatchOpeningDate={setBatchOpeningDate}
            onClear={() => {
              setParsedData([]);
              setFileName('');
            }}
          />
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
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              {importing ? (
                <>
                  <Spinner color="border-white" size="w-3.5 h-3.5" />
                  <span>Processing Customers...</span>
                </>
              ) : (
                <>
                  <MdCloudUpload size={16} />
                  <span>
                    Import & Update {validCount > 0 ? `(${validCount} Customers)` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerImportModal;
