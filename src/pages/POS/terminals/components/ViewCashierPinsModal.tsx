import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LuKey, LuX, LuEye, LuEyeOff, LuCheck, LuCopy } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { PosTerminalCounter } from '../../../../service/posService';

interface ViewCashierPinsModalProps {
  terminal: PosTerminalCounter;
  onClose: () => void;
}

export const ViewCashierPinsModal: React.FC<ViewCashierPinsModalProps> = ({ terminal, onClose }) => {
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <LuKey size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Cashier Security PINs
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px]">
                {terminal.name} (Counter #{terminal.counter_number || 1})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Sub-bar with toggle all */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Staff Quick PINs for this counter:
          </span>
          <button
            type="button"
            onClick={() => {
              const allCashiers = terminal.assigned_cashiers || [];
              const areAllRevealed = allCashiers.every((c) => revealedPins[c.id]);
              const nextState: Record<string, boolean> = {};
              allCashiers.forEach((c) => {
                nextState[c.id] = !areAllRevealed;
              });
              setRevealedPins(nextState);
            }}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <LuEye size={13} />
            <span>
              {(terminal.assigned_cashiers || []).every((c) => revealedPins[c.id])
                ? 'Hide All'
                : 'Reveal All'}
            </span>
          </button>
        </div>

        {/* Cashiers List with Masked PINs */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {terminal.assigned_cashiers && terminal.assigned_cashiers.length > 0 ? (
            terminal.assigned_cashiers.map((cashier) => {
              const isRevealed = !!revealedPins[cashier.id];
              const isCopied = copiedPinId === cashier.id;

              return (
                <div
                  key={cashier.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cashier.avatar_color || '#3b82f6' }}
                    >
                      {cashier.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {cashier.name}
                      </h4>
                      <span className="capitalize text-[10px] text-slate-400 font-medium">
                        {cashier.role || 'Cashier'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* PIN Pill */}
                    <div className="font-mono text-xs font-black tracking-widest bg-white dark:bg-[#111622] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white min-w-[64px] text-center">
                      {isRevealed ? cashier.pin_code : '••••'}
                    </div>

                    {/* Toggle Eye Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedPins((prev) => ({
                          ...prev,
                          [cashier.id]: !prev[cashier.id]
                        }))
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      title={isRevealed ? 'Hide PIN' : 'Reveal PIN'}
                    >
                      {isRevealed ? <LuEyeOff size={15} /> : <LuEye size={15} />}
                    </button>

                    {/* Copy PIN Button */}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(cashier.pin_code);
                        setCopiedPinId(cashier.id);
                        toast.success(`Copied PIN for ${cashier.name}`);
                        setTimeout(() => setCopiedPinId(null), 2000);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Copy PIN"
                    >
                      {isCopied ? <LuCheck size={15} className="text-emerald-500" /> : <LuCopy size={15} />}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              No cashiers assigned to this counter.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
