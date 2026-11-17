import React from 'react';
import {
  MdAssessment,
  MdDragIndicator,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdArrowForward,
} from 'react-icons/md';
import { ReportItem, CategoryMeta } from '../types/reportDashboardTypes';
import { shouldShowBadge } from '../data/reportDashboardData';

interface ReportCategoryColumnProps {
  category: CategoryMeta;
  catIdx: number;
  categoryReports: ReportItem[];
  isCatDragging: boolean;
  isCatJustDropped: boolean;
  isCollapsed: boolean;
  draggedCatKey: string | null;
  draggedReportId: string | null;
  justDroppedReportId: string | null;
  toggleCatCollapse: (key: string) => void;
  handleCatDragStart: (e: React.DragEvent, key: string) => void;
  handleCatDragEnter: (key: string) => void;
  handleCatDragOver: (e: React.DragEvent) => void;
  handleCatDragEnd: () => void;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragEnter: (id: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnd: () => void;
  handleNavigate: (report: ReportItem) => void;
}

export const ReportCategoryColumn: React.FC<ReportCategoryColumnProps> = ({
  category,
  catIdx,
  categoryReports,
  isCatDragging,
  isCatJustDropped,
  isCollapsed,
  draggedCatKey,
  draggedReportId,
  justDroppedReportId,
  toggleCatCollapse,
  handleCatDragStart,
  handleCatDragEnter,
  handleCatDragOver,
  handleCatDragEnd,
  handleDragStart,
  handleDragEnter,
  handleDragOver,
  handleDragEnd,
  handleNavigate,
}) => {
  return (
    <div
      id={`category-container-${category.key}`}
      key={category.key}
      draggable={true}
      onDragStart={(e) => handleCatDragStart(e, category.key)}
      onDragEnter={() => handleCatDragEnter(category.key)}
      onDragOver={handleCatDragOver}
      onDragEnd={handleCatDragEnd}
      style={{ animationDelay: `${catIdx * 35}ms` }}
      className={`break-inside-avoid inline-block w-full mb-6 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden select-none animate-card-item drag-item-transition ${
        isCatDragging
          ? 'opacity-30 scale-[0.97] border-dashed border-emerald-500 shadow-inner'
          : isCatJustDropped
          ? 'animate-drop-settle border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-slate-200 dark:border-slate-800 hover:shadow-md'
      }`}
    >
      {/* Card Header with Category Drag Grip & Collapse Control */}
      <div
        className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer"
        onClick={() => toggleCatCollapse(category.key)}
      >
        <div className="flex items-center gap-2.5">
          <div
            title="Drag entire category column to rearrange"
            className="text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MdDragIndicator size={18} />
          </div>
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
            {category.icon ? <category.icon size={18} /> : <MdAssessment size={18} />}
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {category.title}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate max-w-[160px]">
              {category.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className="font-mono text-[11px] font-black text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {categoryReports.length}
          </span>
          <button
            type="button"
            title={isCollapsed ? "Expand category" : "Collapse category"}
            onClick={() => toggleCatCollapse(category.key)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition cursor-pointer"
          >
            {isCollapsed ? <MdKeyboardArrowDown size={18} /> : <MdKeyboardArrowUp size={18} />}
          </button>
        </div>
      </div>

      {/* Draggable Reports List with Smooth Collapsible Height */}
      <div
        className={`divide-y divide-slate-100 dark:divide-slate-800/60 transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed || draggedCatKey ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[1400px] opacity-100'
        }`}
      >
        {categoryReports.map((report) => {
          const Icon = report.icon || MdAssessment;
          const isDragging = draggedReportId === report.id;
          const isJustDropped = justDroppedReportId === report.id;

          return (
            <div
              key={report.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, report.id)}
              onDragEnter={(e) => {
                e.stopPropagation();
                handleDragEnter(report.id);
              }}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onClick={() => handleNavigate(report)}
              className={`group p-3.5 cursor-pointer drag-item-transition flex items-start justify-between gap-3 select-none ${
                isDragging
                  ? 'opacity-30 scale-[0.98] bg-emerald-100/60 dark:bg-emerald-950/40 border-y border-dashed border-emerald-500'
                  : isJustDropped
                  ? 'animate-drop-settle bg-emerald-50/70 dark:bg-emerald-950/30'
                  : 'hover:bg-emerald-50/50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1">
                <div
                  title="Drag to rearrange"
                  className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing p-0.5 mt-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MdDragIndicator size={16} />
                </div>
                <div className="mt-0.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0">
                  <Icon size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors text-xs leading-tight">
                      {report.title}
                    </h3>
                    {shouldShowBadge(report) && (
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded tracking-wide border ${
                          report.badgeType === 'new'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : report.badgeType === 'audited'
                            ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                        }`}
                      >
                        {report.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all self-center shrink-0">
                <MdArrowForward size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
