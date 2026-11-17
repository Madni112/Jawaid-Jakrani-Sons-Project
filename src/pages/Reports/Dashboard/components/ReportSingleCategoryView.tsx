import React from 'react';
import { MdAssessment, MdDragIndicator, MdArrowForward } from 'react-icons/md';
import { ReportItem, CategoryMeta } from '../types/reportDashboardTypes';
import { shouldShowBadge } from '../data/reportDashboardData';

interface ReportSingleCategoryViewProps {
  selectedCategory: string;
  categoriesList: CategoryMeta[];
  filteredReports: ReportItem[];
  draggedReportId: string | null;
  justDroppedReportId: string | null;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragEnter: (id: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnd: () => void;
  handleNavigate: (report: ReportItem) => void;
  onBackToAll: () => void;
}

export const ReportSingleCategoryView: React.FC<ReportSingleCategoryViewProps> = ({
  selectedCategory,
  categoriesList,
  filteredReports,
  draggedReportId,
  justDroppedReportId,
  handleDragStart,
  handleDragEnter,
  handleDragOver,
  handleDragEnd,
  handleNavigate,
  onBackToAll,
}) => {
  const category = categoriesList.find((c) => c.key === selectedCategory);
  if (!category) return null;
  const categoryReports = filteredReports.filter((r) => r.category === category.key);
  const CatBannerIcon = category.icon || MdAssessment;

  return (
    <div
      key={category.key}
      className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-emerald-500/80 dark:border-emerald-500/60 shadow-xl shadow-emerald-500/10 dark:shadow-emerald-950/40 overflow-hidden animate-expand-container"
    >
      {/* Category Full-Width Banner Header */}
      <div className="p-5 border-b border-emerald-100 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-sm">
            <CatBannerIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-black text-lg text-slate-900 dark:text-white">
                {category.title}
              </h2>
              <span className="font-mono text-xs font-black text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {categoryReports.length} {categoryReports.length === 1 ? 'Report' : 'Reports'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {category.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToAll}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <span>← Back to All Reports</span>
        </button>
      </div>

      {/* 2 or 3 in a row Draggable Reports Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 bg-slate-50/30 dark:bg-slate-950/20">
        {categoryReports.map((report, idx) => {
          const Icon = report.icon || MdAssessment;
          const isDragging = draggedReportId === report.id;
          const isJustDropped = justDroppedReportId === report.id;

          return (
            <div
              key={report.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, report.id)}
              onDragEnter={() => handleDragEnter(report.id)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onClick={() => handleNavigate(report)}
              style={{ animationDelay: `${idx * 40}ms` }}
              className={`group relative p-4.5 rounded-xl border bg-white dark:bg-slate-900/90 cursor-pointer flex flex-col justify-between gap-4 select-none animate-card-item drag-item-transition ${
                isDragging
                  ? 'opacity-30 scale-95 border-dashed border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 shadow-inner'
                  : isJustDropped
                  ? 'animate-drop-settle border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/80 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 text-slate-600 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      <Icon size={18} />
                    </div>
                    <div
                      title="Drag to rearrange"
                      className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MdDragIndicator size={18} />
                    </div>
                  </div>

                  {shouldShowBadge(report) && (
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide border ${
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

                <div>
                  <h3 className="font-extrabold text-[13px] text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {report.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                <span>Open Parameter Filter</span>
                <div className="group-hover:translate-x-1 transition-transform">
                  <MdArrowForward size={15} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
