import React from 'react';
import { LuRotateCcw, LuX, LuCheck, LuMinus, LuPlus } from 'react-icons/lu';
import { PosOrder } from '../../../../service/posService';
import { RefundItem } from '../types/posOrdersTypes';

interface POSRefundModalProps {
  order: PosOrder;
  refundItems: RefundItem[];
  setRefundItems: React.Dispatch<React.SetStateAction<RefundItem[]>>;
  refundReason: string;
  setRefundReason: (reason: string) => void;
  refundPaymentMethod: 'Cash' | 'Original';
  setRefundPaymentMethod: (method: 'Cash' | 'Original') => void;
  totalRefundAmount: number;
  totalReturnedCount: number;
  totalOriginalItemsCount: number;
  isFullRefund: boolean;
  onExecuteRefund: () => void;
  onClose: () => void;
}

export const POSRefundModal: React.FC<POSRefundModalProps> = ({
  order,
  refundItems,
  setRefundItems,
  refundReason,
  setRefundReason,
  refundPaymentMethod,
  setRefundPaymentMethod,
  totalRefundAmount,
  totalReturnedCount,
  totalOriginalItemsCount,
  isFullRefund,
  onExecuteRefund,
  onClose
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 animate-scaleIn flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <LuRotateCcw size={20} />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                Issue Return & Refund
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {order.order_number}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {order.customer_name} • {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Sub-header Controls: Select All toggle & Refund Mode Badge */}
        <div className="py-2.5 flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              const allSelected = refundItems.every((i) => i.selected);
              setRefundItems((prev) => prev.map((i) => ({ ...i, selected: !allSelected })));
            }}
            className="flex items-center gap-1.5 font-bold text-primary hover:underline cursor-pointer"
          >
            <span>
              {refundItems.every((i) => i.selected) ? 'Deselect All' : 'Select All Items'}
            </span>
          </button>
          <div className="flex items-center gap-2 text-[11px]">
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold ${
                isFullRefund
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              {isFullRefund ? 'Full Order Refund' : 'Specific Item(s) Refund'}
            </span>
          </div>
        </div>

        {/* Scrollable Item List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 max-h-[340px] pr-1">
          {refundItems.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                item.selected
                  ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-60'
              }`}
            >
              {/* Checkbox & Name */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setRefundItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, selected: !it.selected } : it))
                    );
                  }}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 cursor-pointer ${
                    item.selected
                      ? 'bg-primary border-primary text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  {item.selected && <LuCheck size={13} className="stroke-[3]" />}
                </button>

                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {item.product_name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Rate: Rs. {item.unit_price.toLocaleString()} • Sold: {item.original_qty}
                  </p>
                </div>
              </div>

              {/* Quantity Selector [-] Qty [+] */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                  <button
                    type="button"
                    disabled={!item.selected || item.return_qty <= 1}
                    onClick={() => {
                      setRefundItems((prev) =>
                        prev.map((it, i) =>
                          i === idx ? { ...it, return_qty: Math.max(1, it.return_qty - 1) } : it
                        )
                      );
                    }}
                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <LuMinus size={12} />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">
                    {item.return_qty}
                  </span>
                  <button
                    type="button"
                    disabled={!item.selected || item.return_qty >= item.original_qty}
                    onClick={() => {
                      setRefundItems((prev) =>
                        prev.map((it, i) =>
                          i === idx
                            ? { ...it, return_qty: Math.min(it.original_qty, it.return_qty + 1) }
                            : it
                        )
                      );
                    }}
                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <LuPlus size={12} />
                  </button>
                </div>

                {/* Refund line subtotal */}
                <span className="w-24 text-right font-mono font-black text-xs text-slate-900 dark:text-white">
                  Rs. {(item.selected ? item.return_qty * item.unit_price : 0).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Return Reason & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Reason for Return
            </label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="Customer Return">Customer Return</option>
              <option value="Size / Color Exchange">Size / Color Exchange</option>
              <option value="Defective / Damaged">Defective / Damaged</option>
              <option value="Wrong Item Dispatched">Wrong Item Dispatched</option>
              <option value="Customer Changed Mind">Customer Changed Mind</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Refund Payout Method
            </label>
            <select
              value={refundPaymentMethod}
              onChange={(e) => setRefundPaymentMethod(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="Cash">Cash Out (Drawer Float)</option>
              <option value="Original">Original Tender ({order.payment_method})</option>
            </select>
          </div>
        </div>

        {/* Total Refund Summary & Actions */}
        <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none mb-1">
              Total Refund Amount
            </span>
            <span className="font-mono font-black text-lg text-rose-600 dark:text-rose-400">
              Rs. {totalRefundAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              ({totalReturnedCount} of {totalOriginalItemsCount} items selected)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={totalRefundAmount <= 0}
              onClick={onExecuteRefund}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide text-white transition shadow-md cursor-pointer bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Refund Rs. {totalRefundAmount.toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
