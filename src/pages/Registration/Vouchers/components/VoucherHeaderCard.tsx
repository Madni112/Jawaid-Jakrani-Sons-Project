import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdReceiptLong,
  MdCompareArrows,
  MdShoppingCart,
  MdAssignmentReturn,
  MdAccountBalanceWallet,
  MdPayments,
  MdTrendingDown,
  MdOutlineReceipt
} from 'react-icons/md';
import { PresetMeta } from '../types/voucherTypes';

interface VoucherHeaderCardProps {
  isEditMode: boolean;
  pageTitle: string;
  voucherNo?: string;
  activePreset: string;
  presetMeta?: PresetMeta;
  isOpeningBalance: boolean;
  listReturnRoute: string;
}

export const VoucherHeaderCard: React.FC<VoucherHeaderCardProps> = ({
  isEditMode,
  pageTitle,
  voucherNo,
  activePreset,
  presetMeta,
  isOpeningBalance,
  listReturnRoute
}) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-2xs border ${
            presetMeta ? presetMeta.badgeBg : 'bg-indigo-50 dark:bg-indigo-950/60'
          } ${presetMeta ? presetMeta.badgeColor : 'text-indigo-600 border-indigo-200'}`}
        >
          {activePreset === 'SAV' && <MdReceiptLong size={24} />}
          {activePreset === 'SRV' && <MdCompareArrows size={24} />}
          {activePreset === 'CRV' && <MdPayments size={24} />}
          {activePreset === 'PAV' && <MdShoppingCart size={24} />}
          {activePreset === 'PRV' && <MdAssignmentReturn size={24} />}
          {activePreset === 'VPV' && <MdAccountBalanceWallet size={24} />}
          {activePreset === 'EXP' && <MdTrendingDown size={24} />}
          {!presetMeta && <MdOutlineReceipt size={24} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {isEditMode ? `Modify ${pageTitle}: ${voucherNo}` : `Create New ${pageTitle}`}
            </h2>
            {presetMeta && (
              <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full border ${presetMeta.badgeBg} ${presetMeta.badgeColor}`}>
                {presetMeta.prefix}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isOpeningBalance
              ? 'Customer/Vendor initial opening balance ledger entry'
              : (presetMeta ? presetMeta.descPlaceholder : 'General ledger debit/credit posting')}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate(listReturnRoute)}
        className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 transition cursor-pointer self-start sm:self-auto"
      >
        ← Back to List
      </button>
    </div>
  );
};
