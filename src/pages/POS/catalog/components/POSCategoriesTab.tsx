import React from 'react';
import {
  LuPlus,
  LuLayers,
  LuUpload,
  LuEye,
  LuEyeOff,
} from 'react-icons/lu';
import {
  PosCategoryItem,
  PosProductItem,
  PosTerminalCounter,
} from '../../../../service/posService';

export interface POSCategoriesTabProps {
  categories: PosCategoryItem[];
  products: PosProductItem[];
  terminals: PosTerminalCounter[];
  onOpenAddCategory: () => void;
  onOpenEditImage: (item: {
    id: string;
    type: 'category';
    currentUrl?: string;
    name: string;
  }) => void;
  onOpenCounterAssign: (
    id: string,
    type: 'category',
    name: string,
    counters?: string[]
  ) => void;
  onToggleCategoryVisibility: (categoryId: string, currentVal: boolean) => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const POSCategoriesTab: React.FC<POSCategoriesTabProps> = ({
  categories,
  products,
  terminals,
  onOpenAddCategory,
  onOpenEditImage,
  onOpenCounterAssign,
  onToggleCategoryVisibility,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  return (
<div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Category Management & Visibility
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any category cover to upload photo or toggle visibility on POS.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddCategory}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 bg-purple-600 hover:bg-purple-700 shrink-0"
            >
              <LuPlus size={15} />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const isVisible = cat.show_in_pos !== false;
            const itemCount = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;

            return (
              <div
                key={cat.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-4 shadow-sm flex flex-col justify-between space-y-3"
              >
                {/* Category Cover Image */}
                <div
                  onClick={() => {
                    onOpenEditImage({ id: cat.id, type: 'category', currentUrl: cat.image_url, name: cat.name });
                  }}
                  className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative group cursor-pointer"
                  title="Click to change category image"
                >
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-1">
                      <LuLayers size={26} />
                      <span className="text-[10px]">No Cover Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition gap-1.5">
                    <LuUpload size={14} />
                    <span>Upload Cover</span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {cat.name}
                    </h3>
                    {(() => {
                      const hierarchyParts = [cat.parent_name, cat.sub_name]
                        .filter(Boolean)
                        .map((s: any) => String(s).trim())
                        .filter((v, i, a) => a.indexOf(v) === i && v.toLowerCase() !== cat.name.toLowerCase());
                      if (hierarchyParts.length === 0) return null;
                      const line = hierarchyParts.join(' • ');
                      return (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[180px]" title={line}>
                          {line}
                        </p>
                      );
                    })()}
                    <span className="text-xs text-slate-400">
                      {itemCount} catalog items
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {/* Toggle Visibility */}
                    <button
                      type="button"
                      onClick={() => onToggleCategoryVisibility(cat.id, isVisible)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                        isVisible
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                      }`}
                    >
                      {isVisible ? <LuEye size={13} /> : <LuEyeOff size={13} />}
                      <span>{isVisible ? 'POS Active' : 'Hidden'}</span>
                    </button>

                    {/* Category Counter Assignment Badge */}
                    {(() => {
                      const vc = cat.visible_counters || ['all'];
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
                          onClick={() => onOpenCounterAssign(cat.id, 'category', cat.name, cat.visible_counters)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                            isAll
                              ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/25'
                          }`}
                          title="Click to assign which counters show this category"
                        >
                          <span>{label}</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>

  );
};

export default POSCategoriesTab;
