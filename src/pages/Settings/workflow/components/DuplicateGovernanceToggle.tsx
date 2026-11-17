import React from 'react';
import { LuLoader2 } from 'react-icons/lu';
import { ChallanModule } from '../../../../utils/challanValidation';

interface DuplicateGovernanceToggleProps {
  module: ChallanModule;
  isPermissive: boolean;
  isAuditing: boolean;
  saving: boolean;
  moduleDisplayName: string;
  onToggle: (checked: boolean) => void;
}

export const DuplicateGovernanceToggle: React.FC<DuplicateGovernanceToggleProps> = ({
  isPermissive,
  isAuditing,
  saving,
  moduleDisplayName,
  onToggle
}) => {
  return (
    <div
      className={`mt-3 p-3.5 rounded-xl border transition-all ${
        isPermissive
          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/90 dark:border-amber-800/80'
          : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/90 dark:border-emerald-800/80'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
              Allow Duplicate Challan / Slip Numbers
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isPermissive
                  ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                  : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
              }`}
            >
              {isPermissive ? 'Permissive (Duplicates Allowed)' : 'Strict Unique Mode'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isPermissive
              ? `Multiple ${moduleDisplayName} records can share or reuse the same physical slip or challan number.`
              : `Duplicate slip numbers are strictly blocked in ${moduleDisplayName}. Every number must be unique.`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAuditing && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mr-1 animate-pulse">
              <LuLoader2 className="animate-spin" size={13} />
              <span className="text-[10px]">Auditing...</span>
            </div>
          )}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPermissive}
              onChange={(e) => onToggle(e.target.checked)}
              disabled={saving || isAuditing}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
