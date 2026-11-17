import React from 'react';
import { MdDelete } from 'react-icons/md';
import { DeletingCategoryItem } from '../types/categoryTypes';

interface CategoryDeleteModalProps {
  item: DeletingCategoryItem;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  item,
  onCancel,
  onConfirm
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
      className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div
        className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full overflow-hidden p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
            <MdDelete className="text-xl" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Delete {item.type} Category
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Are you sure you want to delete{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                "{item.name}"
              </span>
              ?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            autoFocus
            ref={(btn) => btn && btn.focus()}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer border border-transparent focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer focus:ring-2 focus:ring-rose-400 focus:outline-none"
          >
            <MdDelete className="text-sm" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
