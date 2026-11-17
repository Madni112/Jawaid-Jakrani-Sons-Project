import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFileText, FiX, FiChevronLeft, FiChevronRight, FiEdit, FiPrinter } from 'react-icons/fi';
import { PurchaseRecord, AllocationMapEntry } from '../types/purchaseListTypes';
import { formatMoney } from '../utils/purchaseAllocations';

interface PurchaseQuickViewModalProps {
  previewPurchase: PurchaseRecord;
  previewPurchaseIndex: number;
  totalFilteredCount: number;
  allocationsMap: Record<string, AllocationMapEntry>;
  tenantId?: string | null;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export const PurchaseQuickViewModal: React.FC<PurchaseQuickViewModalProps> = ({
  previewPurchase,
  previewPurchaseIndex,
  totalFilteredCount,
  allocationsMap,
  tenantId,
  onPrev,
  onNext,
  onClose
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onClose]);

  const purKey = previewPurchase.purchase_no || String(previewPurchase.id);
  const purAlloc = allocationsMap[purKey] || allocationsMap[String(previewPurchase.id)];
  const pUpfront = Number(previewPurchase.cash_amount_paid || 0) + Number(previewPurchase.bank_amount_paid || 0);
  const pTotal = Number(previewPurchase.total_amount) || 0;
  const pPaid = purAlloc ? purAlloc.totalPaid : (Number(previewPurchase.amount_paid) || pUpfront);
  const pDue = purAlloc ? purAlloc.due : Math.max(0, pTotal - pPaid);
  const isPaid = pDue <= 0;

  const grossAmt = (previewPurchase.items || []).reduce((acc: number, it) => {
    const q = Number(it.qty ?? it.quantity ?? 0);
    const r = Number(it.costPricePerBox ?? it.cost_price ?? it.rate ?? it.purchase_price ?? 0);
    return acc + (q * r);
  }, 0);

  const formattedPurchaseNo = previewPurchase.purchase_no
    ? (String(previewPurchase.purchase_no).toUpperCase().startsWith('PUR-')
        ? previewPurchase.purchase_no
        : `PUR-${previewPurchase.purchase_no}`)
    : `PUR-${previewPurchase.id}`;

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
                  {formattedPurchaseNo}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isPaid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {isPaid ? (pUpfront >= pTotal ? 'Paid Upfront' : 'Paid (By Receipt)') : `Credit (Due: Rs. ${formatMoney(pDue)})`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>
                  Vendor:{' '}
                  <strong className="text-white">
                    {previewPurchase.supplier_name || previewPurchase.vendor_name || 'General Vendor'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Date: <strong className="text-slate-300">{previewPurchase.purchase_date || '-'}</strong>
                </span>
                <span>•</span>
                <span>
                  Payment Term: <strong className="text-slate-300">{previewPurchase.payment_term || 'On Credit'}</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Navigation & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                disabled={previewPurchaseIndex === 0}
                onClick={onPrev}
                title="Previous Purchase (Left Arrow)"
                className="p-1.5 rounded-md hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 hover:text-white transition cursor-pointer"
              >
                <FiChevronLeft size={16} />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold text-slate-400 select-none">
                {previewPurchaseIndex + 1} / {totalFilteredCount}
              </span>
              <button
                type="button"
                disabled={previewPurchaseIndex === totalFilteredCount - 1}
                onClick={onNext}
                title="Next Purchase (Right Arrow)"
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
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Receiving Location</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                {previewPurchase.target_warehouse ||
                  (Array.isArray(previewPurchase.items) && previewPurchase.items[0]?.warehouse) ||
                  'Main Warehouse'}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-meta-4/20 p-2.5 rounded-xl border border-stroke dark:border-strokedark">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Procurement Type</span>
              <span className="font-bold text-black dark:text-white truncate block">
                {previewPurchase.purchase_type || 'Standard Supply'}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-meta-4/20 p-2.5 rounded-xl border border-stroke dark:border-strokedark">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payment Term</span>
              <span className="font-bold text-primary truncate block">
                {previewPurchase.payment_term || 'On Credit'}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-meta-4/20 p-2.5 rounded-xl border border-stroke dark:border-strokedark">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Vendor Profile</span>
              <span className="font-bold text-black dark:text-white truncate block">
                {previewPurchase.supplier_name || previewPurchase.vendor_name || 'General Vendor'}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-meta-4/20 p-2.5 rounded-xl border border-stroke dark:border-strokedark">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Quantity</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                {(previewPurchase.items || []).reduce(
                  (sum: number, it) => sum + Number(it.qty ?? it.quantity ?? 0),
                  0
                )}{' '}
                Units
              </span>
            </div>
          </div>

          {/* Items List Table */}
          <div className="border border-stroke dark:border-strokedark rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                  <th className="p-3 w-8 text-center">S#</th>
                  <th className="p-3 w-32">Code</th>
                  <th className="p-3">Product Description</th>
                  <th className="p-3 w-36 text-center">Qty / Warehouse</th>
                  <th className="p-3 w-28 text-right">Cost Rate</th>
                  <th className="p-3 w-20 text-center">Disc</th>
                  <th className="p-3 w-28 text-right pr-4">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark font-medium">
                {(previewPurchase.items || []).map((it, idx) => {
                  const qtyNum = Number(it.qty ?? it.quantity ?? 0);
                  const rateNum = Number(it.costPricePerBox ?? it.cost_price ?? it.rate ?? it.purchase_price ?? it.costPrice ?? 0);
                  const discAmt = Number(it.discountAmt ?? it.disAmt ?? 0);
                  const itemTotal = Number(it.totalAmount ?? it.netTotal ?? it.total ?? (qtyNum * rateNum - discAmt));
                  const locationName = it.warehouse || it.location || previewPurchase.target_warehouse || 'Main Warehouse';

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-center text-gray-400 font-sans">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                        {it.skuCode || it.itemCode || it.item_sr_no || '-'}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-black dark:text-white">
                          {it.itemName || it.product_name || it.pDescription || 'Unknown Product'}
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <p className="font-black font-mono text-black dark:text-white text-sm">
                          {qtyNum} {it.uom ? it.uom : ''}
                        </p>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-0.5">
                          📍 {locationName}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        Rs. {formatMoney(rateNum)}
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-500">
                        {discAmt > 0 ? `-Rs. ${formatMoney(discAmt)}` : '0%'}
                      </td>
                      <td className="p-3 text-right pr-4 font-mono font-black text-black dark:text-white text-sm">
                        Rs. {formatMoney(itemTotal)}
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
                <span>Prev Purchase</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold text-black dark:text-white">
                  →
                </kbd>
                <span>Next Purchase</span>
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
                  Rs. {formatMoney(grossAmt > 0 ? grossAmt : pTotal)}
                </span>
              </div>
              {Number(previewPurchase.freight_charges || previewPurchase.transport_charges || 0) > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Freight / Transport:</span>
                  <span className="font-mono font-bold text-black dark:text-white">
                    + Rs. {formatMoney(previewPurchase.freight_charges || previewPurchase.transport_charges)}
                  </span>
                </div>
              )}
              <div className="border-t border-stroke dark:border-strokedark pt-2 flex justify-between items-center">
                <span className="font-bold text-black dark:text-white text-sm">Grand Total:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  Rs. {formatMoney(pTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Amount Paid (Live):</span>
                <span className="font-mono font-black">Rs. {formatMoney(pPaid)}</span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-700 dark:text-slate-300">Remaining Due (Live):</span>
                <span
                  className={`font-mono font-black ${
                    pDue > 0.01 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  Rs. {formatMoney(pDue)}
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
              disabled={previewPurchaseIndex === 0}
              onClick={onPrev}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-xs hover:bg-slate-100 transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <FiChevronLeft /> Prev Purchase
            </button>
            <button
              type="button"
              disabled={previewPurchaseIndex === totalFilteredCount - 1}
              onClick={onNext}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold text-xs hover:bg-slate-100 transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              Next Purchase <FiChevronRight />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/Purchase/Purchases/Edit/${previewPurchase.id}`, {
                  state: { purchaseRecord: previewPurchase }
                });
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <FiEdit /> Edit Purchase
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/Print/${previewPurchase.id}`);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <FiPrinter /> Print Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
