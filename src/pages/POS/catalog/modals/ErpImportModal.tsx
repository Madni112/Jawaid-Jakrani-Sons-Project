import React from 'react';
import { createPortal } from 'react-dom';
import { LuDownload, LuSearch, LuCheck, LuX } from 'react-icons/lu';
import { PosProductItem } from '../../../../service/posService';

export interface ErpImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedErpIds: Set<string>;
  groupedErpProducts: Record<string, PosProductItem[]>;
  areAllSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleCategory: (category: string, products: PosProductItem[]) => void;
  onToggleOneProduct: (productId: string) => void;
  onConfirm: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const ErpImportModal: React.FC<ErpImportModalProps> = ({
  isOpen,
  onClose,
  loading,
  searchQuery,
  setSearchQuery,
  selectedErpIds,
  groupedErpProducts,
  areAllSelected,
  onSelectAll,
  onDeselectAll,
  onToggleCategory,
  onToggleOneProduct,
  onConfirm,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  if (!isOpen) return null;

  const totalErpCount = Object.values(groupedErpProducts).reduce((acc, items) => acc + items.length, 0);

  return createPortal(
<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <LuDownload size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Get from ERP Product List
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select whole categories or pick individual products to display on your POS Terminal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onClose()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Filter & Quick Selection Toolbar */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter ERP products or categories..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  <strong className="text-indigo-600 dark:text-indigo-400">{selectedErpIds.size}</strong> of {totalErpCount} selected
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onSelectAll}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold transition cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={onDeselectAll}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body: Category-wise Grouped List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Loading ERP product list...
                </div>
              ) : Object.keys(groupedErpProducts).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No matching products found in ERP.
                </div>
              ) : (
                Object.entries(groupedErpProducts).map(([categoryName, items]) => {
                  const areAllSelected = items.every((it) => selectedErpIds.has(it.id));
                  const selectedCountInCat = items.filter((it) => selectedErpIds.has(it.id)).length;

                  return (
                    <div
                      key={categoryName}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161D2B] overflow-hidden shadow-xs"
                    >
                      {/* Category Header with Whole-Category Checkbox */}
                      <div className="p-3.5 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={areAllSelected}
                            onChange={() => onToggleCategory(items)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight block">
                              {categoryName}
                            </span>
                            {items[0] && (() => {
                              const hierarchyParts = [items[0].parent_category, items[0].sub_category]
                                .filter(Boolean)
                                .map((s: any) => String(s).trim())
                                .filter((v, i, a) => a.indexOf(v) === i);
                              if (hierarchyParts.length === 0) return null;
                              return (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                                  {hierarchyParts.join(' • ')}
                                </span>
                              );
                            })()}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {items.length} products
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => onToggleCategory(items)}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          {areAllSelected ? 'Deselect Category' : `Select Whole Category (${selectedCountInCat}/${items.length})`}
                        </button>
                      </div>

                      {/* Products Grid / Rows inside this Category */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                        {items.map((prod) => {
                          const isChecked = selectedErpIds.has(prod.id);

                          return (
                            <div
                              key={prod.id}
                              onClick={() => onToggleOneProduct(prod.id)}
                              className={`p-3 flex items-center justify-between gap-3 rounded-xl transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                isChecked ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // handled by parent div onClick
                                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
                                />

                                <div className="min-w-0">
                                  <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {prod.product_name}
                                  </h5>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                    <span>Code: {prod.item_sr_no || 'SKU'}</span>
                                    <span>•</span>
                                    <span>UOM: {prod.uom}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-extrabold text-xs font-mono text-slate-900 dark:text-white">
                                  Rs. {prod.retail_price.toLocaleString()}
                                </span>

                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isChecked
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {isChecked ? '✓ Show in POS' : 'Hidden'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white">{selectedErpIds.size} products</strong> will be available on the POS terminal
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-white transition flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-90 bg-indigo-600 hover:bg-indigo-700"
                >
                  <LuCheck size={16} />
                  <span>Add Selected ({selectedErpIds.size}) to POS Catalog</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
    document.body
  );
};

export default ErpImportModal;
