import React from 'react';
import { createPortal } from 'react-dom';
import { LuPlus, LuCheck, LuX } from 'react-icons/lu';

export interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  setCategoryName: (name: string) => void;
  isCreating: boolean;
  onCreate: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  setCategoryName,
  isCreating,
  onCreate,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  if (!isOpen) return null;

  return createPortal(
<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <LuPlus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Add New Category
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Saves to ERP category master list and POS catalog.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Category Name <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onCreate();
                    }
                  }}
                  autoFocus
                  placeholder="e.g. Lawn Embroidered, Boski, Silk..."
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                This category will be immediately active and available when assigning or creating products in POS and ERP.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onClose()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreating || !categoryName.trim()}
                onClick={onCreate}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold text-white transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 bg-purple-600 hover:bg-purple-700"
              >
                <LuCheck size={16} />
                <span>{isCreating ? 'Saving...' : 'Create Category'}</span>
              </button>
            </div>
          </div>
        </div>,
    document.body
  );
};

export default AddCategoryModal;
