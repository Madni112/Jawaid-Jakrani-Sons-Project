import React from 'react';
import { createPortal } from 'react-dom';
import { LuStore, LuX } from 'react-icons/lu';
import { PosTerminalCounter } from '../../../../service/posService';

export interface CounterAssignmentModalProps {
  editingCountersItem: {
    id: string;
    name: string;
    type: 'product' | 'category';
    currentCounters: string[];
  } | null;
  onClose: () => void;
  terminals: PosTerminalCounter[];
  tempSelectedCounters: string[];
  setTempSelectedCounters: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const CounterAssignmentModal: React.FC<CounterAssignmentModalProps> = ({
  editingCountersItem,
  onClose,
  terminals,
  tempSelectedCounters,
  setTempSelectedCounters,
  onSave,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  if (!editingCountersItem) return null;

  return createPortal(
<div
          onClick={() => onClose()}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <LuStore size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Assign Counter Visibility
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                    {editingCountersItem.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Choose which counters can sell this {editingCountersItem.type}:
              </p>

              {/* All Counters Option */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={tempSelectedCounters.includes('all')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTempSelectedCounters(['all']);
                    } else {
                      setTempSelectedCounters([]);
                    }
                  }}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    🌐 All Counters (Store-wide)
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Visible across all checkout terminals
                  </span>
                </div>
              </label>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Or Specific Registers / Counters:
                </span>
                {terminals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No specific counters configured yet</p>
                ) : (
                  terminals.map((t) => {
                    const isChecked = !tempSelectedCounters.includes('all') && tempSelectedCounters.includes(t.slug);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-primary/5 border-primary/30 text-primary'
                            : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const next = tempSelectedCounters.filter((c) => c !== 'all');
                                setTempSelectedCounters([...next, t.slug]);
                              } else {
                                const next = tempSelectedCounters.filter((c) => c !== t.slug);
                                setTempSelectedCounters(next.length === 0 ? ['all'] : next);
                              }
                            }}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold block">{t.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">/{t.slug} • Counter #{t.counter_number || 1}</span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold">
                          {t.location || 'Store Floor'}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onClose()}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition cursor-pointer shadow-sm"
              >
                Apply Counters
              </button>
            </div>
          </div>
        </div>
,
    document.body
  );
};

export default CounterAssignmentModal;
