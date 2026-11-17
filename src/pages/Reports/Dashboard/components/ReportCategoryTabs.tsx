import React from 'react';
import { MdCategory, MdAssessment } from 'react-icons/md';
import { CategoryMeta } from '../types/reportDashboardTypes';

interface ReportCategoryTabsProps {
  isTheme2: boolean;
  selectedCategory: string;
  categoryCounts: Record<string, number>;
  categoriesList: CategoryMeta[];
  handleTabClick: (categoryKey: string) => void;
}

export const ReportCategoryTabs: React.FC<ReportCategoryTabsProps> = ({
  isTheme2,
  selectedCategory,
  categoryCounts,
  categoriesList,
  handleTabClick,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => handleTabClick('all')}
        className={`flex items-center gap-2 ${
          isTheme2 ? 'px-4 py-2 rounded-full font-semibold' : 'px-3.5 py-2 rounded-xl font-bold'
        } text-xs whitespace-nowrap cursor-pointer transition ${
          selectedCategory === 'all'
            ? isTheme2
              ? 'bg-[#800020] text-white shadow-xs'
              : 'bg-emerald-700 text-white shadow-sm'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        {!isTheme2 && <MdCategory size={15} />}
        <span>All Reports</span>
        <span
          className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
            selectedCategory === 'all'
              ? isTheme2
                ? 'bg-[#5c0017] text-white'
                : 'bg-emerald-800/80 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          {categoryCounts.all}
        </span>
      </button>

      {categoriesList.map((cat) => {
        const CatIcon = cat.icon || MdAssessment;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => handleTabClick(cat.key)}
            className={`flex items-center gap-2 ${
              isTheme2 ? 'px-4 py-2 rounded-full font-semibold' : 'px-3.5 py-2 rounded-xl font-bold'
            } text-xs whitespace-nowrap cursor-pointer transition ${
              selectedCategory === cat.key
                ? isTheme2
                  ? 'bg-[#800020] text-white shadow-xs'
                  : 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/50'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {!isTheme2 && <CatIcon size={15} />}
            <span>{cat.title}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                selectedCategory === cat.key
                  ? isTheme2
                    ? 'bg-[#5c0017] text-white'
                    : 'bg-emerald-800/80 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {categoryCounts[cat.key] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
};
