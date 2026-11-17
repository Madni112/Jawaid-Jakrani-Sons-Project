import React from 'react';
import { MdOutlineNotes, MdPrint, MdSave } from 'react-icons/md';
import Spinner from '../../../../ui/Spinner';

interface QuotationSummaryFooterProps {
  notes: string;
  setNotes: (val: string) => void;
  standardSubtotal: number;
  tileSubtotal: number;
  totalDiscount: number;
  grandTotal: number;
  loading: boolean;
  isEditMode: boolean;
  onCancel: () => void;
  onSubmit: (actionAfterSave: 'list' | 'print' | 'whatsapp') => void;
}

export const QuotationSummaryFooter: React.FC<QuotationSummaryFooterProps> = ({
  notes,
  setNotes,
  standardSubtotal,
  tileSubtotal,
  totalDiscount,
  grandTotal,
  loading,
  isEditMode,
  onCancel,
  onSubmit,
}) => {
  return (
    <>
      {/* 4. Summary & Notes */}
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <MdOutlineNotes />
              <span>Terms, Conditions &amp; Bank Transfer Details</span>
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="p-4 bg-gray-50 dark:bg-meta-4/20 rounded-2xl border border-stroke dark:border-strokedark space-y-2 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Standard Items Subtotal:</span>
              <span className="font-bold font-mono">PKR {standardSubtotal.toLocaleString()}</span>
            </div>

            {tileSubtotal > 0 && (
              <div className="flex justify-between text-amber-700 dark:text-amber-400">
                <span>Tile Items Subtotal:</span>
                <span className="font-bold font-mono">PKR {tileSubtotal.toLocaleString()}</span>
              </div>
            )}

            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Total Discount:</span>
                <span className="font-bold font-mono">- PKR {totalDiscount.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t border-stroke dark:border-strokedark pt-2 flex justify-between text-base font-black text-black dark:text-white">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                PKR {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Submit Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-stroke dark:border-strokedark text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => onSubmit('print')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <MdPrint size={16} />
            <span>Save &amp; Print</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onSubmit('list')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary,#800020)] hover:opacity-90 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? <Spinner color="border-white" size="w-3.5 h-3.5" /> : <MdSave size={16} />}
            <span>{isEditMode ? 'Update Quotation' : 'Save Quotation'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
