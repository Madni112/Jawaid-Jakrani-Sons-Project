import React from 'react';
import { MdArrowBack, MdArrowForward, MdCheckCircle, MdBookmarkAdded, MdSave } from 'react-icons/md';
import { DedicatedRecipe } from '../types/bomTypes';

interface BOMStepperControlsProps {
  activeTab: 1 | 2 | 3;
  isRTL: boolean;
  onPrevTab: () => void;
  onNextTab: () => void;
  selectedRecipe: DedicatedRecipe | null;
  isRecipeModified: boolean;
  onOpenSaveModal: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  saving: boolean;
}

export const BOMStepperControls: React.FC<BOMStepperControlsProps> = ({
  activeTab,
  isRTL,
  onPrevTab,
  onNextTab,
  selectedRecipe,
  isRecipeModified,
  onOpenSaveModal,
  onSubmit,
  saving
}) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark">
      <div>
        {activeTab > 1 && (
          <button
            type="button"
            onClick={onPrevTab}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stroke px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 dark:border-strokedark dark:text-gray-300 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            <MdArrowBack className={`text-base ${isRTL ? 'rotate-180' : ''}`} />
            <span>{isRTL ? 'پیچھے (Back)' : 'Back'}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {activeTab < 3 ? (
          <button
            type="button"
            onClick={onNextTab}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-opacity-90 transition cursor-pointer"
          >
            <span>{isRTL ? 'اگلا مرحلہ (Next)' : 'Next Step'}</span>
            <MdArrowForward className={`text-base ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* If using old recipe and UNCHANGED: Show subtle sync pill */}
            {selectedRecipe && !isRecipeModified ? (
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 px-3.5 py-2 rounded-xl text-xs font-semibold">
                <MdCheckCircle size={15} />
                <span>
                  {isRTL
                    ? `نسخہ "${selectedRecipe.recipe_name}" غیر تبدیل شدہ ہے`
                    : `Recipe "${selectedRecipe.recipe_name}" is unmodified`}
                </span>
              </div>
            ) : (
              /* If modified OR starting from scratch: Show Save as Recipe button with Popup prompt */
              <button
                type="button"
                onClick={onOpenSaveModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow transition cursor-pointer"
              >
                <MdBookmarkAdded className="text-base" />
                <span>
                  {selectedRecipe
                    ? isRTL
                      ? 'نیا نسخہ محفوظ کریں'
                      : 'Save as New Recipe'
                    : isRTL
                    ? 'نسخہ محفوظ کریں'
                    : 'Save Recipe'}
                </span>
              </button>
            )}

            {/* Register BOM in Manufacturing Pipeline */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-opacity-90 disabled:opacity-50 transition cursor-pointer"
            >
              <MdSave className="text-base" />
              <span>
                {saving
                  ? isRTL
                    ? 'محفوظ ہو رہا ہے...'
                    : 'Saving...'
                  : isRTL
                  ? 'پروڈکشن کیلئے رجسٹر کریں'
                  : 'Register BOM'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BOMStepperControls;
