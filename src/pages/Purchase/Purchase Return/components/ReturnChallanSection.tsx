import React from 'react';
import { MdLocalShipping } from 'react-icons/md';

interface ReturnChallanSectionProps {
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  errors: any;
  touched: any;
  workflowSettings: any;
  uniqueManualReturnWarehouses: string[];
}

export const ReturnChallanSection: React.FC<ReturnChallanSectionProps> = ({
  values,
  setFieldValue,
  errors,
  touched,
  workflowSettings,
  uniqueManualReturnWarehouses,
}) => {
  if (uniqueManualReturnWarehouses.length === 0) return null;

  return (
    <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10 p-4 transition-all">
      <div className="flex items-center justify-between mb-3 border-b border-rose-100 dark:border-rose-900/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
            <MdLocalShipping size={18} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide uppercase">
              Outward Return Challan / Gate Pass # (Location-wise)
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Enter physical outward return slip or delivery challan number for each returning warehouse
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          Manual Challan Required
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {uniqueManualReturnWarehouses.map((wh) => {
          const safePrefix = wh.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const errorMsg =
            touched.gatePasses &&
            errors.gatePasses &&
            typeof errors.gatePasses === 'object' &&
            errors.gatePasses[wh];

          return (
            <div
              key={wh}
              className="bg-white dark:bg-boxdark p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col gap-1"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Outward Warehouse: <span className="text-primary">{wh}</span>
                </span>
              </div>
              <div className="flex items-center rounded border border-stroke dark:border-strokedark focus-within:border-primary overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 border-r border-stroke dark:border-strokedark select-none shrink-0">
                  {safePrefix}-
                </span>
                <input
                  type="text"
                  placeholder="Slip / No. (e.g. 001)"
                  value={values.gatePasses?.[wh] || ''}
                  onChange={(e) => {
                    const rawVal = e.target.value.trim();
                    const cleanVal = rawVal.replace(new RegExp(`^${safePrefix}-`, 'i'), '');
                    setFieldValue(`gatePasses.${wh}`, cleanVal);
                  }}
                  className="w-full bg-transparent p-1.5 font-bold font-mono text-xs text-black dark:text-white outline-none"
                />
              </div>
              {errorMsg ? (
                <span className="text-[10px] font-bold text-red-500">{errorMsg}</span>
              ) : (
                <span className="text-[9px] text-slate-400">Required physical slip for this location</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
