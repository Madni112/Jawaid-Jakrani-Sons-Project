import React from 'react';

interface VoucherQuickMetaBarProps {
  voucherNo: string;
  voucherType: string;
  voucherDate: string;
  onChange: (e: React.ChangeEvent<any>) => void;
}

export const VoucherQuickMetaBar: React.FC<VoucherQuickMetaBarProps> = ({
  voucherNo,
  voucherType,
  voucherDate,
  onChange
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs font-mono text-xs">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Voucher Slip #
        </span>
        <div className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
          {voucherNo}
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Voucher Type
        </span>
        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
          {voucherType}
        </div>
      </div>

      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Transaction Date *
        </span>
        <div className="relative">
          <input
            type="date"
            name="voucherDate"
            onChange={onChange}
            value={voucherDate}
            className="w-full font-mono font-bold text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
