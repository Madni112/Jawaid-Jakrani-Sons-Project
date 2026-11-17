import React from 'react';
import { MdAutoStories, MdSearch, MdClose, MdRestartAlt, MdCheckCircle } from 'react-icons/md';
import { DedicatedRecipe } from '../types/bomTypes';

interface BOMRecipeActionBarProps {
  isRTL: boolean;
  savedRecipes: DedicatedRecipe[];
  selectedRecipe: DedicatedRecipe | null;
  isRecipePickerOpen: boolean;
  setIsRecipePickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  recipeSearchQuery: string;
  setRecipeSearchQuery: (q: string) => void;
  isRecipeModified: boolean;
  onLoadRecipe: (rec: DedicatedRecipe) => void;
  onResetRecipe: () => void;
}

export const BOMRecipeActionBar: React.FC<BOMRecipeActionBarProps> = ({
  isRTL,
  savedRecipes,
  selectedRecipe,
  isRecipePickerOpen,
  setIsRecipePickerOpen,
  recipeSearchQuery,
  setRecipeSearchQuery,
  isRecipeModified,
  onLoadRecipe,
  onResetRecipe
}) => {
  return (
    <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-4 dark:border-primary/30 dark:bg-boxdark/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3 flex-1 flex-wrap">
        <div className="flex items-center gap-2 text-primary dark:text-primary font-bold text-xs uppercase tracking-wider shrink-0">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <MdAutoStories size={18} />
          </div>
          <span>{isRTL ? 'نسخہ منتخب کریں:' : 'Get Recipe:'}</span>
        </div>

        <div className="relative flex-1 min-w-[260px] max-w-md">
          <button
            type="button"
            onClick={() => setIsRecipePickerOpen(prev => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-xl text-xs font-semibold text-left shadow-2xs hover:border-primary transition cursor-pointer"
          >
            <span className="truncate text-black dark:text-white">
              {selectedRecipe ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <strong>{selectedRecipe.recipe_name}</strong>
                  <span className="text-gray-400 font-normal">
                    ({selectedRecipe.batch_quantity} {selectedRecipe.uom})
                  </span>
                </span>
              ) : (
                <span className="text-gray-400 font-normal">
                  {isRTL ? 'محفوظ شدہ نسخہ منتخب کریں...' : 'Select or search a saved recipe...'}
                </span>
              )}
            </span>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
              {savedRecipes.length} {isRTL ? 'نسخے' : 'Recipes'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {isRecipePickerOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark shadow-xl p-2 max-h-72 overflow-y-auto">
              <div className="p-1 mb-2 border-b border-stroke dark:border-strokedark flex items-center gap-2">
                <MdSearch className="text-gray-400" size={16} />
                <input
                  type="text"
                  value={recipeSearchQuery}
                  onChange={e => setRecipeSearchQuery(e.target.value)}
                  placeholder={isRTL ? 'نسخہ تلاش کریں...' : 'Search recipes by name or product...'}
                  className="w-full bg-transparent text-xs outline-none text-black dark:text-white"
                  autoFocus
                />
                {recipeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRecipeSearchQuery('')}
                    className="text-gray-400 hover:text-black dark:hover:text-white"
                  >
                    <MdClose size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {savedRecipes
                  .filter(r =>
                    !recipeSearchQuery.trim() ||
                    r.recipe_name.toLowerCase().includes(recipeSearchQuery.toLowerCase()) ||
                    r.finished_product_name.toLowerCase().includes(recipeSearchQuery.toLowerCase())
                  )
                  .map(r => {
                    const isCurrent = selectedRecipe?.id === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onLoadRecipe(r)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                          isCurrent
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-meta-4/40 text-black dark:text-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{r.recipe_name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {r.finished_product_name} • {r.batch_quantity} {r.uom} • {r.raw_materials?.length || 0} items
                          </p>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          PKR {Number(r.unit_cost || 0).toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {selectedRecipe && (
          <button
            type="button"
            onClick={onResetRecipe}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold transition cursor-pointer"
            title="Clear loaded recipe"
          >
            <MdRestartAlt size={14} />
            <span>{isRTL ? 'ری سیٹ' : 'Clear'}</span>
          </button>
        )}
      </div>

      {/* Recipe Active Status Badge */}
      {selectedRecipe && (
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isRecipeModified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{isRTL ? 'نسخے میں تبدیلیاں موجود ہیں' : 'Formula Modified'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700">
              <MdCheckCircle size={14} />
              <span>{isRTL ? 'نسخہ ہم آہنگ ہے' : 'Recipe In Sync'}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BOMRecipeActionBar;
