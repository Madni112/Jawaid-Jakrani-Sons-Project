import React from 'react';
import { MdArrowBack, MdArrowForward, MdSave } from 'react-icons/md';
import Spinner from '../../../../ui/Spinner';

interface CustomerStepperActionsProps {
  activeTab: number;
  setActiveTab: React.Dispatch<React.SetStateAction<number>>;
  isEditMode: boolean;
  loading: boolean;
  isRTL: boolean;
  onCancel: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const CustomerStepperActions: React.FC<CustomerStepperActionsProps> = ({
  activeTab,
  setActiveTab,
  isEditMode,
  loading,
  isRTL,
  onCancel,
  onNext,
  onSubmit
}) => {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-stroke dark:border-strokedark">
      <div>
        {activeTab > 1 ? (
          <button
            type="button"
            onClick={() => setActiveTab((prev) => Math.max(1, prev - 1))}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <MdArrowBack size={16} />
            <span>Previous Step</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition shadow-xs cursor-pointer"
          >
            {isRTL ? 'منسوخ' : 'Cancel'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {activeTab < 5 ? (
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white font-bold text-xs transition shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <span>{isRTL ? 'اگلا مرحلہ' : 'Next Step'}</span>
            <MdArrowForward size={16} className={isRTL ? 'rotate-180' : ''} />
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={onSubmit}
            className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {loading ? (
              <>
                <Spinner color="border-white" size="w-4 h-4" />
                <span>{isRTL ? 'محفوظ ہو رہا ہے...' : 'Saving Profile...'}</span>
              </>
            ) : (
              <>
                <MdSave size={16} />
                <span>
                  {isRTL
                    ? isEditMode
                      ? 'کسٹمر میں ترمیم محفوظ کریں'
                      : 'کسٹمر محفوظ کریں'
                    : isEditMode
                    ? 'Update Customer Profile'
                    : 'Save Customer Profile'}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
