import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdInfoOutline, MdClose } from 'react-icons/md';
import { ProductCatalogItem } from '../types/productListTypes';

interface ProductQuickViewModalProps {
  selectedQuickViewProduct: ProductCatalogItem | null;
  onClose: () => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  selectedQuickViewProduct,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!selectedQuickViewProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-boxdark rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-strokedark flex flex-col max-h-[90vh]">
        <div className="p-5 flex justify-between items-center bg-slate-50 dark:bg-meta-4/30 border-b border-slate-100 dark:border-strokedark">
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <MdInfoOutline className="text-primary text-xl" />
            Product Details
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-meta-4 rounded-full transition-colors text-slate-500"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="mb-4">
            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {selectedQuickViewProduct.product_name}
            </h4>
            <div className="flex gap-2 mt-2 font-mono text-[10px] uppercase font-bold text-slate-500">
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                SKU: {selectedQuickViewProduct.item_sr_no || 'N/A'}
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                Category: {selectedQuickViewProduct.category || 'General'}
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                UOM: {selectedQuickViewProduct.uom || 'PCS'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cost Price</div>
              <div className="text-lg font-black text-slate-700 dark:text-slate-200 font-mono">
                Rs.{' '}
                {Number(selectedQuickViewProduct.purchase_price || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sale Price (MRP)</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                Rs.{' '}
                {Number(selectedQuickViewProduct.retail_price || selectedQuickViewProduct.mrp || 0).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2 }
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-xs font-semibold text-slate-500">Brand Allocation</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {selectedQuickViewProduct.bin || 'Unassigned'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-xs font-semibold text-slate-500">Dimensions</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {(() => {
                  const sizeMatch = String(selectedQuickViewProduct.product_description || '').match(
                    /Size:\s*([^|]+)/i
                  );
                  if (sizeMatch) return sizeMatch[1].trim();
                  const text = `${selectedQuickViewProduct.category || ''} ${
                    selectedQuickViewProduct.product_name || ''
                  } ${selectedQuickViewProduct.sub_category || ''}`;
                  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
                  if (match) return `${match[1]} × ${match[2]} cm`;
                  return selectedQuickViewProduct.dimensions || 'N/A';
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-xs font-semibold text-slate-500">Weight</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {selectedQuickViewProduct.weight || 'N/A'}
              </span>
            </div>
            <div className="py-2">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Description</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg whitespace-pre-wrap">
                {selectedQuickViewProduct.product_description || selectedQuickViewProduct.product_name || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-meta-4/30 border-t border-slate-100 dark:border-strokedark flex justify-between items-center">
          <button
            onClick={() => {
              onClose();
              navigate('/Administration/Products/Add', { state: { product: selectedQuickViewProduct } });
            }}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition"
          >
            Edit Product
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-boxdark border border-slate-200 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
