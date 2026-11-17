import React from 'react';
import { MdFormatListBulleted } from 'react-icons/md';

interface BOMHeaderBarProps {
  bomNumber: string;
  isEditMode: boolean;
  isRTL: boolean;
  status: 'Active' | 'Trial' | 'Draft';
  setStatus: (status: 'Active' | 'Trial') => void;
  onNavigateList: () => void;
}

export const BOMHeaderBar: React.FC<BOMHeaderBarProps> = ({
  bomNumber,
  isEditMode,
  isRTL,
  status,
  setStatus,
  onNavigateList
}) => {
  return (
    <div className="mb-6 rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
            {bomNumber}
          </span>
          <h1 className="text-xl font-black text-black dark:text-white">
            {isRTL
              ? isEditMode
                ? 'نسخہ میں ترمیم کریں'
                : 'نیا مینوفیکچرنگ نسخہ (BOM)'
              : isEditMode
              ? 'Edit Bill of Materials Recipe'
              : 'Create Manufacturing BOM'}
          </h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {isRTL
            ? 'تیار پروڈکٹ، خام مال کی کھپت، اور پیداواری اخراجات کا جامع فارمولا'
            : 'Formulate bill of materials, raw consumption, wastage allowances, and overhead allocations'}
        </p>
      </div>

      {/* Right side: Recipe Status Pill Selector & See List Link */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Status Pill Selector (Active / Trial) */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-meta-4 p-1 rounded-xl border border-stroke dark:border-strokedark">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-2">
            {isRTL ? 'اسٹیٹس:' : 'Status:'}
          </span>

          {/* Active Pill */}
          <button
            type="button"
            onClick={() => setStatus('Active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              status === 'Active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-white' : 'bg-emerald-500'}`} />
            <span>{isRTL ? 'فعال (Active)' : 'Active'}</span>
          </button>

          {/* Trial Pill */}
          <button
            type="button"
            onClick={() => setStatus('Trial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              status === 'Trial' || status === 'Draft'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${status === 'Trial' || status === 'Draft' ? 'bg-white' : 'bg-amber-400'}`} />
            <span>{isRTL ? 'آزمائشی (Trial)' : 'Trial'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-[1px] bg-stroke dark:bg-strokedark" />

        {/* See List Link */}
        <button
          type="button"
          onClick={onNavigateList}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
        >
          <MdFormatListBulleted className="text-base" />
          <span>{isRTL ? '← لسٹ دیکھیں (See List)' : '← See List'}</span>
        </button>
      </div>
    </div>
  );
};

export default BOMHeaderBar;
