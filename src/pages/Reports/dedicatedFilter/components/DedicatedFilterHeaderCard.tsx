import React from 'react';
import { MdArrowBack, MdAssessment } from 'react-icons/md';
import { ReportConfig } from '../types/dedicatedFilterTypes';
import { shouldShowBadge } from '../constants/reportRegistry';

interface DedicatedFilterHeaderCardProps {
  activeConfig: ReportConfig;
  tenantId?: string | null;
  onNavigateDashboard: () => void;
}

export const DedicatedFilterHeaderCard: React.FC<DedicatedFilterHeaderCardProps> = ({
  activeConfig,
  onNavigateDashboard
}) => {
  const IconComponent = activeConfig.icon || MdAssessment;

  return (
    <>
      {/* ── BREADCRUMB & TOP NAV ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 uppercase tracking-wider">
          <button
            type="button"
            onClick={onNavigateDashboard}
            className="flex items-center gap-1.5 font-bold hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer transition"
          >
            <MdArrowBack size={14} />
            <span>Reports Hub</span>
          </button>
          <span>&gt;</span>
          <span>{activeConfig.categoryName}</span>
          <span>&gt;</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-[220px]">
            {activeConfig.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 font-semibold text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Direct Parameter Filter</span>
          </span>
        </div>
      </div>

      {/* ── DEDICATED HEADER CARD ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-inner shrink-0">
            <IconComponent size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {activeConfig.title}
              </h1>
              {shouldShowBadge(activeConfig) && (
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border ${
                    activeConfig.badgeType === 'new'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : activeConfig.badgeType === 'audited'
                      ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                  }`}
                >
                  {activeConfig.badge}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              {activeConfig.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateDashboard}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition self-start sm:self-auto shrink-0"
        >
          Change Report
        </button>
      </div>
    </>
  );
};

export default DedicatedFilterHeaderCard;
