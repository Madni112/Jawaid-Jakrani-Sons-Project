import React from 'react';
import { LuPackageMinus, LuShieldCheck, LuLoader2 } from 'react-icons/lu';
import { WorkflowSettings } from '../../../../service/workflowSettingsService';

interface WorkflowNegativeStockCardProps {
  workflowSettings: WorkflowSettings;
  saving: boolean;
  checkingNegativeStock: boolean;
  onToggle: (checked: boolean) => void;
}

export const WorkflowNegativeStockCard: React.FC<WorkflowNegativeStockCardProps> = ({
  workflowSettings,
  saving,
  checkingNegativeStock,
  onToggle
}) => {
  const isPermissive = workflowSettings.allow_negative_stock !== false;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-6 shadow-sm flex flex-col justify-between md:col-span-2 ${
        isPermissive
          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
          : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner ${
                isPermissive
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isPermissive ? <LuPackageMinus /> : <LuShieldCheck />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Allow Negative / Minus Stock
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isPermissive
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                      : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                  }`}
                >
                  {isPermissive ? 'Permissive Mode' : 'Strict Protection Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Controls whether items can be oversold or returned into negative balances, and
                protects stock-inflow records from deletion.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {checkingNegativeStock && (
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mr-2 animate-pulse">
                <LuLoader2 className="animate-spin" size={14} />
                <span>Auditing Stock...</span>
              </div>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPermissive}
                onChange={(e) => onToggle(e.target.checked)}
                disabled={saving || checkingNegativeStock}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              When Enabled (Permissive Mode):
            </span>
            <ul className="text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
              <li>Sales Bills can be issued even if physical inventory drops below 0.</li>
              <li>
                Purchase returns and stock deletions are not restricted by available quantity.
              </li>
            </ul>
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              When Disabled (Strict Governance Mode):
            </span>
            <ul className="text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
              <li>
                <strong>Sale Invoice:</strong> Blocked if billed qty exceeds available stock.
              </li>
              <li>
                <strong>Purchase Return:</strong> Blocked if return qty exceeds available stock.
              </li>
              <li>
                <strong>Inflow Deletions:</strong> Blocked if deleting a Purchase, Opening Stock,
                or Sale Return causes any product stock to drop below 0.
              </li>
              <li>
                <strong>Pre-condition:</strong> Cannot be disabled if ANY product currently has a
                negative balance.
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] flex items-center justify-between font-medium">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isPermissive ? 'bg-amber-600' : 'bg-emerald-600'
              }`}
            ></span>
            <span>
              Current status:{' '}
              <strong>
                {isPermissive
                  ? 'Negative Stock Permitted (Transactions allowed beyond stock)'
                  : 'Strict Stock Protection (Overselling & Negative Deletions Blocked)'}
              </strong>
            </span>
          </div>
          <div className="text-slate-400">
            Applies globally across Sales, Purchases, Returns & Inventory
          </div>
        </div>
      </div>
    </div>
  );
};
