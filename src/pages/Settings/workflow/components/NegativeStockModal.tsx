import React from 'react';
import { createPortal } from 'react-dom';
import { LuShieldAlert, LuAlertCircle, LuX } from 'react-icons/lu';

interface NegativeStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  negativeProductsList: any[];
}

export const NegativeStockModal: React.FC<NegativeStockModalProps> = ({
  isOpen,
  onClose,
  negativeProductsList
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-rose-200 dark:border-rose-900/60 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
        {/* Modal Header */}
        <div className="p-6 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl shrink-0">
            <LuShieldAlert />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-rose-950 dark:text-rose-200">
              Cannot Disable Negative Stock Mode
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
              The system detected <strong>{negativeProductsList.length}</strong> product(s) with
              negative stock balances. In strict inventory governance mode, negative stock is
              strictly prohibited.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-white/80 transition-colors"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Modal Body: List of Negative Items */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <LuAlertCircle className="shrink-0 mt-0.5 text-amber-600" size={16} />
            <span>
              To switch to Strict Mode, you must first adjust these products to zero or positive
              stock by creating an <strong>Opening Stock</strong> entry or recording a{' '}
              <strong>Purchase Bill</strong>.
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 grid grid-cols-12">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Product Name</div>
              <div className="col-span-3">Item Code</div>
              <div className="col-span-3 text-right">Current Stock</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {negativeProductsList.map((item, idx) => (
                <div
                  key={item.product?.id || idx}
                  className="px-4 py-3 text-xs grid grid-cols-12 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                  <div className="col-span-1 text-slate-400 font-medium">{idx + 1}</div>
                  <div className="col-span-5 font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.productName || item.product?.product_name}
                  </div>
                  <div className="col-span-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {item.itemCode || item.product?.item_sr_no || '—'}
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      {item.formattedStock || `${item.availableStock} Units`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all shadow-sm"
          >
            Understood, I'll Adjust Stock First
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
