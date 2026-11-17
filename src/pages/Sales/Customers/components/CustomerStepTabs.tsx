import React from 'react';

interface CustomerStepTabsProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  isRTL: boolean;
}

export const CustomerStepTabs: React.FC<CustomerStepTabsProps> = ({
  activeTab,
  setActiveTab,
  isRTL
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-slate-100/80 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-stroke dark:border-strokedark">
      <button
        type="button"
        onClick={() => setActiveTab(1)}
        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
          activeTab === 1
            ? 'bg-white dark:bg-boxdark text-primary shadow-xs border border-stroke dark:border-strokedark'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            activeTab === 1
              ? 'bg-primary text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          1
        </span>
        <span className="truncate">{isRTL ? 'شناخت' : 'Identity'}</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab(2)}
        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
          activeTab === 2
            ? 'bg-white dark:bg-boxdark text-primary shadow-xs border border-stroke dark:border-strokedark'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            activeTab === 2
              ? 'bg-primary text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          2
        </span>
        <span className="truncate">{isRTL ? 'پتہ اور رابطہ' : 'Contact & Address'}</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab(3)}
        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
          activeTab === 3
            ? 'bg-white dark:bg-boxdark text-primary shadow-xs border border-stroke dark:border-strokedark'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            activeTab === 3
              ? 'bg-primary text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          3
        </span>
        <span className="truncate">{isRTL ? 'کھاتہ اور لیجر' : 'Account & Ledger'}</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab(4)}
        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
          activeTab === 4
            ? 'bg-white dark:bg-boxdark text-primary shadow-xs border border-stroke dark:border-strokedark'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            activeTab === 4
              ? 'bg-primary text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          4
        </span>
        <span className="truncate">{isRTL ? 'ٹیکس اور قانونی' : 'Tax & Legal'}</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab(5)}
        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
          activeTab === 5
            ? 'bg-white dark:bg-boxdark text-primary shadow-xs border border-stroke dark:border-strokedark'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            activeTab === 5
              ? 'bg-primary text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          5
        </span>
        <span className="truncate">{isRTL ? 'فالو اپ نوٹس' : 'Follow-up Notes'}</span>
      </button>
    </div>
  );
};
