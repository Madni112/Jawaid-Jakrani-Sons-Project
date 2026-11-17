import React from 'react';
import { LuLock, LuUnlock } from 'react-icons/lu';

interface POSTerminalLockScreenProps {
  isLocked: boolean;
  displayBrand: string;
  terminalName: string;
  currentCashierName: string;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
  onUnlock: () => void;
}

export const POSTerminalLockScreen: React.FC<POSTerminalLockScreenProps> = ({
  isLocked,
  displayBrand,
  terminalName,
  currentCashierName,
  accentColor,
  contrastText,
  isAccentWhite,
  onUnlock,
}) => {
  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white p-6 animate-fadeIn">
      <div className="text-center space-y-4 max-w-sm w-full">
        <div
          className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center font-bold shadow-2xl animate-pulse ${
            isAccentWhite ? 'border border-slate-300' : ''
          }`}
          style={{
            backgroundColor: accentColor,
            color: contrastText,
          }}
        >
          <LuLock size={38} />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight">{displayBrand}</h2>
          <p className="text-xs text-slate-400">
            Terminal #{terminalName} • Session Locked
          </p>
          <p className="text-[11px] text-emerald-400 font-mono">
            Cashier: {currentCashierName}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onUnlock}
            className="w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: accentColor,
              color: contrastText,
              border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
            }}
          >
            <LuUnlock size={16} />
            <span>Unlock Terminal Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
