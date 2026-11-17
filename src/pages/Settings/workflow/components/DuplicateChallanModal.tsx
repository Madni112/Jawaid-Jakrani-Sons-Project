import React from 'react';
import { createPortal } from 'react-dom';
import { LuShieldAlert, LuAlertCircle, LuX } from 'react-icons/lu';
import { ChallanModule, DuplicateChallanInfo } from '../../../../utils/challanValidation';

export interface DuplicateModalData {
  module: ChallanModule;
  title: string;
  moduleName: string;
  duplicates: DuplicateChallanInfo[];
}

interface DuplicateChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DuplicateModalData | null;
}

export const DuplicateChallanModal: React.FC<DuplicateChallanModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen || !data || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-rose-200 dark:border-rose-900/60 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
        {/* Modal Header */}
        <div className="p-6 bg-rose-50/80 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl shrink-0">
            <LuShieldAlert />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-rose-950 dark:text-rose-200">{data.title}</h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
              The system detected <strong>{data.duplicates.length}</strong> duplicate slip / challan
              number(s) currently registered in <strong>{data.moduleName}</strong>. In Strict
              Unique Mode, duplicate numbers are strictly prohibited.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-white/80 transition-colors"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Modal Body: List of Duplicates */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <LuAlertCircle className="shrink-0 mt-0.5 text-amber-600" size={16} />
            <span>
              To switch to Strict Unique Mode, you must first correct or renumber these duplicate
              records in <strong>{data.moduleName}</strong> so that each challan or gate pass number
              is unique.
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 grid grid-cols-12 gap-2">
              <div className="col-span-1">#</div>
              <div className="col-span-6">Challan / Slip #</div>
              <div className="col-span-2">Occurrences</div>
              <div className="col-span-3 text-right">Associated Party / Doc</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.duplicates.map((dup, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                  <div className="col-span-1 text-slate-400 font-medium">{idx + 1}</div>
                  <div className="col-span-6 font-mono font-bold text-slate-900 dark:text-slate-100 break-all select-all">
                    {dup.challanNo}
                  </div>
                  <div className="col-span-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 whitespace-nowrap">
                      {dup.count} Records
                    </span>
                  </div>
                  <div className="col-span-3 text-right text-slate-500 dark:text-slate-400 text-[11px] space-y-0.5">
                    {dup.records.map((r, rIdx) => (
                      <div
                        key={rIdx}
                        className="truncate font-medium text-slate-700 dark:text-slate-300"
                      >
                        {r.party || r.docNo || 'N/A'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all shadow-sm"
          >
            Understood, I'll Resolve Duplicates First
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
