import React from 'react';
import { MdAutoStories, MdClose, MdSave } from 'react-icons/md';

interface BOMSaveRecipeModalProps {
  isOpen: boolean;
  isRTL: boolean;
  recipeNameInput: string;
  setRecipeNameInput: (val: string) => void;
  batchQuantity: number;
  uom: string;
  itemsCount: number;
  unitCost: number;
  savingRecipe: boolean;
  onClose: () => void;
  onConfirmSave: () => void;
}

export const BOMSaveRecipeModal: React.FC<BOMSaveRecipeModalProps> = ({
  isOpen,
  isRTL,
  recipeNameInput,
  setRecipeNameInput,
  batchQuantity,
  uom,
  itemsCount,
  unitCost,
  savingRecipe,
  onClose,
  onConfirmSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-2xl dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center gap-2 text-primary font-black text-base">
            <MdAutoStories size={20} />
            <h3>{isRTL ? 'نسخہ ڈیٹا بیس میں محفوظ کریں' : 'Save Recipe to Database'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black dark:hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <MdClose size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isRTL
              ? 'اس پیداواری فارمولے کو مستقل نسخہ لائبریری میں محفوظ کرنے کے لیے ایک منفرد نام درج کریں:'
              : 'Assign a unique recipe name to save this formula into your dedicated database table:'}
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              {isRTL ? 'نسخے کا نام (Recipe Name):' : 'Recipe Name:'}
            </label>
            <input
              type="text"
              value={recipeNameInput}
              onChange={e => setRecipeNameInput(e.target.value)}
              placeholder={isRTL ? 'مثلاً: سمر لان 80/80 کڑھائی سوٹ...' : 'e.g. Summer Lawn 80/80 Embroidered Suit'}
              className="w-full rounded-xl border border-primary/50 bg-white dark:bg-meta-4 py-2.5 px-3.5 text-xs font-bold text-black dark:text-white outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onConfirmSave();
                }
              }}
            />
          </div>

          {/* Quick Summary Pill preview */}
          <div className="bg-slate-50 dark:bg-meta-4/30 p-3 rounded-xl border border-stroke dark:border-strokedark text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">{isRTL ? 'پیداواری مقدار:' : 'Batch Quantity:'}</span>
              <span className="font-bold font-mono text-black dark:text-white">{batchQuantity} {uom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{isRTL ? 'خام اجزاء کی تعداد:' : 'Raw Materials:'}</span>
              <span className="font-bold font-mono text-black dark:text-white">{itemsCount} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{isRTL ? 'فی یونٹ لاگت:' : 'Unit Cost:'}</span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">PKR {unitCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stroke dark:border-strokedark">
          <button
            type="button"
            onClick={onClose}
            disabled={savingRecipe}
            className="px-4 py-2 rounded-xl border border-stroke dark:border-strokedark text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            {isRTL ? 'منسوخ' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={onConfirmSave}
            disabled={savingRecipe}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {savingRecipe ? (
              <span>{isRTL ? 'محفوظ ہو رہا ہے...' : 'Saving...'}</span>
            ) : (
              <>
                <MdSave size={14} />
                <span>{isRTL ? 'نسخہ محفوظ کریں' : 'Save Recipe'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BOMSaveRecipeModal;
