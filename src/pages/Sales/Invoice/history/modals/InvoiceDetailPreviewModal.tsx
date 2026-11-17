import React from 'react';
import {
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiEdit,
  FiPrinter,
} from 'react-icons/fi';
import { InvoiceBalanceInfo } from '../types/salesHistoryTypes';

interface InvoiceDetailPreviewModalProps {
  previewInvoice: any;
  previewInvoiceIndex: number | null;
  totalFilteredInvoices: number;
  invoiceBalances: Record<string, InvoiceBalanceInfo>;
  handlePrevInvoice: () => void;
  handleNextInvoice: () => void;
  onClose: () => void;
  onEditInvoice: (inv: any) => void;
  onPrintInvoice: (invId: string | number) => void;
}

export const InvoiceDetailPreviewModal: React.FC<InvoiceDetailPreviewModalProps> = ({
  previewInvoice,
  previewInvoiceIndex,
  totalFilteredInvoices,
  invoiceBalances,
  handlePrevInvoice,
  handleNextInvoice,
  onClose,
  onEditInvoice,
  onPrintInvoice,
}) => {
  if (!previewInvoice) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6">
      <div className="bg-white dark:bg-boxdark w-full max-w-4xl rounded-2xl shadow-2xl border border-stroke dark:border-strokedark overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-lg font-bold shrink-0">
              <FiFileText />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black font-mono tracking-tight text-white">
                  {previewInvoice.invoice_no || `INV-${String(previewInvoice.id).padStart(4, '0')}`}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    String(previewInvoice.payment_term || '').toLowerCase() === 'cash' ||
                    String(previewInvoice.receipt_status || '').toLowerCase() === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {previewInvoice.receipt_status || previewInvoice.payment_term || 'Invoice'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>
                  Customer: <strong className="text-white">{previewInvoice.customer_name || 'Walk-in'}</strong>
                </span>
                <span>•</span>
                <span>
                  Date: <strong className="text-slate-300">{previewInvoice.sale_date || '-'}</strong>
                </span>
                {previewInvoice.salesman && (
                  <>
                    <span>•</span>
                    <span>
                      Salesman: <strong className="text-slate-300">{previewInvoice.salesman}</strong>
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Navigation & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                disabled={previewInvoiceIndex === 0}
                onClick={handlePrevInvoice}
                title="Previous Invoice (Left Arrow)"
                className="p-1.5 rounded-md hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 hover:text-white transition cursor-pointer"
              >
                <FiChevronLeft size={16} />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold text-slate-400 select-none">
                {(previewInvoiceIndex ?? 0) + 1} / {totalFilteredInvoices}
              </span>
              <button
                type="button"
                disabled={previewInvoiceIndex === totalFilteredInvoices - 1}
                onClick={handleNextInvoice}
                title="Next Invoice (Right Arrow)"
                className="p-1.5 rounded-md hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 hover:text-white transition cursor-pointer"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close (Esc)"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Body: Items Table */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Quick Meta Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-slate-50 dark:bg-meta-4/20 p-2.5 rounded-xl border border-stroke dark:border-strokedark">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Dispatch Mode</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">Direct Delivery</span>
            </div>
            <div className="bg-slate-50 dark:bg-meta-4/20 p-2.5 rounded-xl border border-stroke dark:border-strokedark">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Sale Scenario</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">
                {previewInvoice.sale_scenario || 'Standard Sale'}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-meta-4/20 p-2.5 rounded-xl border border-stroke dark:border-strokedark">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payment Term</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">
                {previewInvoice.payment_term || 'Cash'}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-meta-4/20 p-2.5 rounded-xl border border-stroke dark:border-strokedark">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payment Method</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">
                {previewInvoice.payment_method || 'Cash'}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-meta-4/20 p-2.5 rounded-xl border border-stroke dark:border-strokedark">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Line Items</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block font-mono">
                {(previewInvoice.items || []).length} items
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-stroke dark:border-strokedark rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-stroke dark:border-strokedark">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item / Description</th>
                  <th className="py-2.5 px-3 text-center">UOM</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate (Rs.)</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark">
                {(previewInvoice.items || []).map((it: any, idx: number) => {
                  const qty = Number(it.qty || it.quantity || 0);
                  const rate = Number(it.rp ?? it.rate ?? it.price ?? 0);
                  const disc = Number(it.discPercent ?? it.discount ?? 0);
                  const netAmt = Number(it.netAmount ?? it.totalAmount ?? qty * rate * (1 - disc / 100));

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {it.itemName || it.product_name || 'Item'}
                        </div>
                        {it.remarks && <div className="text-[10px] text-slate-400 italic">{it.remarks}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{it.uom || 'PCS'}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {qty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        Rs. {rate.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {disc > 0 ? `${disc}%` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {netAmt.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financials & Summary Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-slate-500 text-[11px] space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300">Keyboard Navigation Shortcuts:</p>
              <p className="flex items-center gap-1.5 flex-wrap">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold text-black dark:text-white">
                  ←
                </kbd>
                <span>Prev Invoice</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold text-black dark:text-white">
                  →
                </kbd>
                <span>Next Invoice</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold text-black dark:text-white">
                  ESC
                </kbd>
                <span>Close</span>
              </p>
            </div>

            <div className="w-full sm:w-80 bg-slate-50 dark:bg-meta-4/20 p-3.5 rounded-xl border border-stroke dark:border-strokedark space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Gross Amount:</span>
                <span className="font-mono font-bold text-black dark:text-white">
                  Rs.{' '}
                  {(previewInvoice.items || [])
                    .reduce((acc: number, it: any) => acc + Number(it.qty || 0) * Number(it.rp ?? it.rate ?? 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              {Number(previewInvoice.transport_charges || 0) > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Transport Charges:</span>
                  <span className="font-mono font-bold text-black dark:text-white">
                    + Rs. {Number(previewInvoice.transport_charges).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="border-t border-stroke dark:border-strokedark pt-2 flex justify-between items-center">
                <span className="font-bold text-black dark:text-white text-sm">Grand Total:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  Rs.{' '}
                  {Number(previewInvoice.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Amount Received (Live):</span>
                <span className="font-mono font-black">
                  Rs.{' '}
                  {(
                    invoiceBalances[String(previewInvoice.id)]?.received ??
                    Number(previewInvoice.cash_amount_paid || 0) + Number(previewInvoice.bank_amount || 0)
                  ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-700 dark:text-slate-300">Remaining Balance (Live):</span>
                <span
                  className={`font-mono font-black ${
                    (invoiceBalances[String(previewInvoice.id)]?.remaining ?? 0) > 0.01
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  Rs.{' '}
                  {(
                    invoiceBalances[String(previewInvoice.id)]?.remaining ??
                    Math.max(
                      0,
                      Number(previewInvoice.total_amount || 0) -
                        (Number(previewInvoice.cash_amount_paid || 0) + Number(previewInvoice.bank_amount || 0))
                    )
                  ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-stroke dark:border-strokedark">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={previewInvoiceIndex === 0}
              onClick={handlePrevInvoice}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-xs hover:bg-slate-100 transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <FiChevronLeft /> Prev Invoice
            </button>
            <button
              type="button"
              disabled={previewInvoiceIndex === totalFilteredInvoices - 1}
              onClick={handleNextInvoice}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-xs hover:bg-slate-100 transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              Next Invoice <FiChevronRight />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditInvoice(previewInvoice)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <FiEdit /> Edit Invoice
            </button>
            <button
              type="button"
              onClick={() => onPrintInvoice(previewInvoice.id)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <FiPrinter /> Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
