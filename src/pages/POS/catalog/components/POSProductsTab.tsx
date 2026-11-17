import React from 'react';
import {
  LuSearch,
  LuPlus,
  LuImage,
  LuUpload,
  LuPencil,
  LuScan,
  LuSparkles,
  LuLock,
  LuUnlock,
  LuEye,
  LuEyeOff,
  LuPrinter,
} from 'react-icons/lu';
import {
  posService,
  PosProductItem,
  PosTerminalCounter,
} from '../../../../service/posService';

export interface POSProductsTabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  allCategoryNames: string[];
  visibilityFilter: 'All' | 'Visible' | 'Hidden';
  setVisibilityFilter: (f: 'All' | 'Visible' | 'Hidden') => void;
  counterFilter: string;
  setCounterFilter: (c: string) => void;
  terminals: PosTerminalCounter[];
  filteredProducts: PosProductItem[];
  loading?: boolean;
  onOpenAddProduct: () => void;
  onOpenEditImage: (item: {
    id: string;
    type: 'product';
    currentUrl?: string;
    name: string;
  }) => void;
  onOpenEditBarcode: (product: PosProductItem) => void;
  onPrintBarcode: (product: PosProductItem) => void;
  onOpenCounterAssign: (
    id: string,
    type: 'product' | 'category',
    name: string,
    counters?: string[]
  ) => void;
  onToggleProductVisibility: (productId: string, currentVal: boolean) => void;
  onGenerateBarcode: (product: PosProductItem) => void;
  onLockBarcode: (product: PosProductItem) => void;
  onUnlockBarcode: (product: PosProductItem) => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const POSProductsTab: React.FC<POSProductsTabProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  allCategoryNames,
  visibilityFilter,
  setVisibilityFilter,
  counterFilter,
  setCounterFilter,
  terminals,
  filteredProducts,
  loading = false,
  onOpenAddProduct,
  onOpenEditImage,
  onOpenEditBarcode,
  onPrintBarcode,
  onOpenCounterAssign,
  onToggleProductVisibility,
  onGenerateBarcode,
  onLockBarcode,
  onUnlockBarcode,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  return (
<div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, or barcode..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category Dropdown & Visibility Filter */}
            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {allCategoryNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Visibility</option>
                <option value="Visible">Visible on POS Only</option>
                <option value="Hidden">Hidden Only</option>
              </select>

              <select
                value={counterFilter}
                onChange={(e) => setCounterFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                title="Filter catalog by assigned counter"
              >
                <option value="All">All Counters (Overview)</option>
                {terminals.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name} (Counter #{t.counter_number || 1})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onOpenAddProduct}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 bg-emerald-600 hover:bg-emerald-700 shrink-0"
              >
                <LuPlus size={15} />
                <span>Add Product to POS</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Item & Visual</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Retail Price</th>
                    <th className="py-3 px-4">Barcode & Lock Status</th>
                    <th className="py-3 px-4 text-center">POS Visible & Counters</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Loading products...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No products match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isVisible = p.show_in_pos !== false;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          
                          {/* Item & Visual */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => onOpenEditImage({ id: p.id, type: 'product', currentUrl: p.image_url, name: p.product_name })}
                                className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer relative group"
                                title="Click to upload/change image"
                              >
                                {p.image_url ? (
                                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <LuImage size={18} />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                  <LuUpload size={13} />
                                </div>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                  {p.product_name}
                                </h4>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {p.item_sr_no || 'SKU'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category (Leaf Category in Big, Parent & Sub in Small) */}
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block">
                                {p.category}
                              </span>
                              {(() => {
                                const hierarchyParts = [p.parent_category, p.sub_category]
                                  .filter(Boolean)
                                  .map((s: any) => String(s).trim())
                                  .filter((v, i, a) => a.indexOf(v) === i);
                                if (hierarchyParts.length === 0) return null;
                                const line = hierarchyParts.join(' • ');
                                return (
                                  <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[170px]" title={line}>
                                    {line}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>

                          {/* Retail Price */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            Rs. {p.retail_price.toLocaleString()}
                          </td>

                          {/* Barcode & Lock Status */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {p.barcode ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onOpenEditBarcode(p)}
                                    title="Click to edit or scan barcode"
                                    className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <span>{p.barcode}</span>
                                    <LuPencil size={10} className="text-slate-400" />
                                  </button>

                                  {p.barcode_locked ? (
                                    <div className="flex items-center gap-1">
                                      <span
                                        className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0"
                                        title="Locked: Protected from accidental changes."
                                      >
                                        <LuLock size={11} />
                                        <span>Locked</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => onUnlockBarcode(p)}
                                        className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
                                        title="Unlock barcode to edit or reassign"
                                      >
                                        <LuUnlock size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => onLockBarcode(p)}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-primary border border-primary/30 hover:bg-primary/10 transition cursor-pointer flex items-center gap-1"
                                        title="Lock this barcode"
                                      >
                                        <LuLock size={10} />
                                        <span>Lock Now</span>
                                      </button>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => onOpenEditBarcode(p)}
                                    className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Type custom code or scan physical tag"
                                  >
                                    <LuScan size={12} />
                                    <span>Custom / Scan</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onGenerateBarcode(p)}
                                    className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Auto-generate 13-digit barcode"
                                  >
                                    <LuSparkles size={11} />
                                    <span>Auto</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* POS Visible Toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => onToggleProductVisibility(p.id, isVisible)}
                              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                isVisible
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                              }`}
                              title={isVisible ? 'Visible in POS' : 'Hidden from POS'}
                            >
                              {isVisible ? <LuEye size={16} /> : <LuEyeOff size={16} />}
                            </button>

                            {/* Counter Visibility Badge */}
                            {(() => {
                              const vc = p.visible_counters || ['all'];
                              const isAll = vc.includes('all') || vc.length === 0;
                              let label = '🌐 All Counters';
                              if (!isAll) {
                                if (vc.length === 1) {
                                  const t = terminals.find((term) => term.slug === vc[0] || term.name === vc[0]);
                                  label = `🏷️ ${t ? t.name : vc[0]}`;
                                } else {
                                  label = `🏷️ ${vc.length} Counters`;
                                }
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => onOpenCounterAssign(p.id, 'product', p.product_name, p.visible_counters)}
                                  className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border transition flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                                    isAll
                                      ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/25'
                                  }`}
                                  title="Click to assign which counters sell this product"
                                >
                                  <span>{label}</span>
                                </button>
                              );
                            })()}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Print Barcode Label */}
                              <button
                                type="button"
                                disabled={!p.barcode}
                                onClick={() => onPrintBarcode(p)}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-40"
                                title="Print Barcode Sticker"
                              >
                                <LuPrinter size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
  );
};

export default POSProductsTab;
