import React from 'react';
import { LuPrinter } from 'react-icons/lu';
import { PosSettings } from '../../../../service/posService';

interface POSStoreCounterTabProps {
  posConfig: PosSettings;
  setPosConfig: React.Dispatch<React.SetStateAction<PosSettings>>;
  isRTL: boolean;
}

export const POSStoreCounterTab: React.FC<POSStoreCounterTabProps> = ({
  posConfig,
  setPosConfig,
  isRTL,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4 animate-fadeIn">
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
          <LuPrinter size={18} className="text-primary" />
          <span>{isRTL ? 'اسٹور اور کاؤنٹر کی تفصیلات' : 'Store & Counter Terminal Header'}</span>
        </div>
        <span className="text-[11px] text-slate-400">
          {isRTL ? 'رسیدوں کے سب سے اوپر پرنٹ ہوگا' : 'Printed at top of customer receipts'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'رسید پر دکان کا نام:' : 'Store / Counter Title:'}
          </label>
          <input
            type="text"
            value={posConfig.store_title}
            onChange={e => setPosConfig(prev => ({ ...prev, store_title: e.target.value }))}
            placeholder="e.g. AL MUHAMMADI"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2.5 px-3 text-xs font-medium text-black dark:text-white outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'ٹرمینل / کاؤنٹر کوڈ:' : 'Terminal Code / Identifier:'}
          </label>
          <input
            type="text"
            value={posConfig.terminal_name}
            onChange={e => setPosConfig(prev => ({ ...prev, terminal_name: e.target.value }))}
            placeholder="e.g. Register 01"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2.5 px-3 text-xs font-medium text-black dark:text-white outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'رابطہ فون نمبر:' : 'Contact Phone / WhatsApp:'}
          </label>
          <input
            type="text"
            value={posConfig.store_phone}
            onChange={e => setPosConfig(prev => ({ ...prev, store_phone: e.target.value }))}
            placeholder="e.g. +92 300 1234567"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2.5 px-3 text-xs font-medium text-black dark:text-white outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'ٹیکس / NTN نمبر:' : 'Tax / NTN / STRN No:'}
          </label>
          <input
            type="text"
            value={posConfig.tax_id}
            onChange={e => setPosConfig(prev => ({ ...prev, tax_id: e.target.value }))}
            placeholder="e.g. NTN-786110"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2.5 px-3 text-xs font-medium text-black dark:text-white outline-none focus:border-primary"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'دکان کا پتہ (رسید ہیڈر):' : 'Store Address (Printed on Receipt):'}
          </label>
          <input
            type="text"
            value={posConfig.store_address}
            onChange={e => setPosConfig(prev => ({ ...prev, store_address: e.target.value }))}
            placeholder="e.g. Cloth Market, Hyderabad, Sindh"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2.5 px-3 text-xs font-medium text-black dark:text-white outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};
