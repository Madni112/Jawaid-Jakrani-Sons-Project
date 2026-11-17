import React from 'react';
import { toast } from 'react-hot-toast';

interface BOMStepperHeaderProps {
  activeTab: 1 | 2 | 3;
  setActiveTab: (tab: 1 | 2 | 3) => void;
  isRTL: boolean;
  finishedProductName: string;
}

export const BOMStepperHeader: React.FC<BOMStepperHeaderProps> = ({
  activeTab,
  setActiveTab,
  isRTL,
  finishedProductName
}) => {
  return (
    <div className="mb-6 grid grid-cols-3 gap-2 p-1.5 bg-gray-100 dark:bg-meta-4 rounded-xl">
      <button
        type="button"
        onClick={() => setActiveTab(1)}
        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          activeTab === 1
            ? 'bg-white dark:bg-boxdark text-primary shadow-sm'
            : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            activeTab === 1 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          1
        </span>
        <span className="truncate">{isRTL ? '1. تیار پروڈکٹ کی تفصیل' : '1. Product & Output'}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          if (!finishedProductName.trim()) {
            toast.error(isRTL ? 'پہلے پروڈکٹ کا نام درج کریں' : 'Please enter Finished Product Name first');
            return;
          }
          setActiveTab(2);
        }}
        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          activeTab === 2
            ? 'bg-white dark:bg-boxdark text-primary shadow-sm'
            : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            activeTab === 2 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          2
        </span>
        <span className="truncate">{isRTL ? '2. خام مال (اجزاء)' : '2. Raw Materials'}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          if (!finishedProductName.trim()) {
            toast.error(isRTL ? 'پہلے پروڈکٹ کا نام درج کریں' : 'Please enter Finished Product Name first');
            return;
          }
          setActiveTab(3);
        }}
        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          activeTab === 3
            ? 'bg-white dark:bg-boxdark text-primary shadow-sm'
            : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            activeTab === 3 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          3
        </span>
        <span className="truncate">{isRTL ? '3. لیبر، اوور ہیڈ اور SOP' : '3. Labor & Overheads'}</span>
      </button>
    </div>
  );
};

export default BOMStepperHeader;
