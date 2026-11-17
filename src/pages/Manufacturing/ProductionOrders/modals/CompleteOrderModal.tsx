import React, { useState } from 'react';
import { MdCheckCircle, MdClose, MdWarningAmber, MdPrecisionManufacturing } from 'react-icons/md';
import { ProductionOrder } from '../../../../service/productionOrderService';
import Spinner from '../../../../ui/Spinner';

interface CompleteOrderModalProps {
  order: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (completionData: {
    completed_quantity: number;
    wastage_quantity: number;
    notes: string;
  }) => Promise<void>;
}

export const CompleteOrderModal: React.FC<CompleteOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !order) return null;

  const [completedQty, setCompletedQty] = useState<number>(order.target_quantity);
  const [wastageQty, setWastageQty] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onConfirm({
        completed_quantity: completedQty,
        wastage_quantity: wastageQty,
        notes: notes.trim()
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const yieldPercentage = order.target_quantity > 0 
    ? ((completedQty / order.target_quantity) * 100).toFixed(1) 
    : '100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-xs">
              <MdPrecisionManufacturing />
            </div>
            <div>
              <h3 className="font-black text-black dark:text-white text-base">Complete Production Run</h3>
              <p className="text-xs text-gray-500 font-mono">{order.order_number} • {order.finished_product_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black dark:hover:text-white text-lg p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            <MdClose />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 p-3.5 rounded-xl text-xs space-y-1">
            <div className="flex justify-between items-center text-blue-900 dark:text-blue-300 font-bold">
              <span>Target Planned Batch:</span>
              <span>{order.target_quantity.toLocaleString()} {order.uom}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-400 text-[11px]">
              <span>Destination Inventory Warehouse:</span>
              <span className="font-bold text-black dark:text-white">{order.destination_warehouse}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Actual Finished Output ({order.uom}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={completedQty}
                onChange={e => setCompletedQty(Number(e.target.value))}
                className="w-full text-sm font-black px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Scrap / Breakage ({order.uom})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={wastageQty}
                onChange={e => setWastageQty(Number(e.target.value))}
                className="w-full text-sm font-bold px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-rose-600 dark:text-rose-400 focus:border-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-meta-4/30 p-2.5 rounded-lg border border-stroke dark:border-strokedark font-medium">
            <span className="text-gray-600 dark:text-gray-400">Yield Efficiency:</span>
            <span className={`font-black ${Number(yieldPercentage) >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {yieldPercentage}% Target Reached
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Production & Quality Inspection Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Fired under 1220°C, zero surface glaze pinholes, packaging verified."
              className="w-full text-xs px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-300 text-[11px] leading-relaxed">
            <MdWarningAmber className="text-lg shrink-0 mt-0.5" />
            <span>
              Confirming will automatically add <strong>{completedQty.toLocaleString()} {order.uom}</strong> to <strong>{order.destination_warehouse}</strong> and finalize raw material consumption.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stroke dark:border-strokedark">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-meta-4 hover:bg-gray-200 dark:hover:bg-meta-4/80 text-black dark:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Spinner color="border-white" size="w-3.5 h-3.5" /> : <MdCheckCircle className="text-base" />}
              <span>Confirm & Deposit Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
