import React from 'react';
import { LuReceipt, LuCheck } from 'react-icons/lu';
import { PosSettings } from '../../../../service/posService';

interface POSReceiptPrinterTabProps {
  posConfig: PosSettings;
  setPosConfig: React.Dispatch<React.SetStateAction<PosSettings>>;
  themeColor: string;
  contrastText: string;
  isRTL: boolean;
}

export const POSReceiptPrinterTab: React.FC<POSReceiptPrinterTabProps> = ({
  posConfig,
  setPosConfig,
  themeColor,
  contrastText,
  isRTL,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-5 animate-fadeIn">
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
          <LuReceipt size={18} className="text-primary" />
          <span>{isRTL ? 'تھرمل پرنٹر اور رسید کا فارمیٹ' : 'Thermal Printer & Receipt Layout'}</span>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-500">
          Active: {posConfig.receipt_paper_size}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'پرنٹر رول سائز:' : 'Thermal Receipt Paper Size:'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPosConfig(prev => ({ ...prev, receipt_paper_size: '80mm' }))}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                posConfig.receipt_paper_size === '80mm'
                  ? 'border-2 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              style={
                posConfig.receipt_paper_size === '80mm'
                  ? {
                      backgroundColor: `${themeColor}15`,
                      borderColor: themeColor,
                      color: themeColor.toLowerCase() === '#ffffff' ? '#0f172a' : themeColor
                    }
                  : undefined
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">80mm Standard</span>
                {posConfig.receipt_paper_size === '80mm' && <LuCheck size={14} />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Desktop POS printer</span>
            </button>

            <button
              type="button"
              onClick={() => setPosConfig(prev => ({ ...prev, receipt_paper_size: '58mm' }))}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                posConfig.receipt_paper_size === '58mm'
                  ? 'border-2 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              style={
                posConfig.receipt_paper_size === '58mm'
                  ? {
                      backgroundColor: `${themeColor}15`,
                      borderColor: themeColor,
                      color: themeColor.toLowerCase() === '#ffffff' ? '#0f172a' : themeColor
                    }
                  : undefined
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">58mm Compact</span>
                {posConfig.receipt_paper_size === '58mm' && <LuCheck size={14} />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Mobile / Bluetooth printer</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'برانڈ لوگو پرنٹنگ:' : 'Logo on Thermal Receipt:'}
          </label>
          <button
            type="button"
            onClick={() => setPosConfig(prev => ({ ...prev, show_logo: !prev.show_logo }))}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
              posConfig.show_logo
                ? 'border-2 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            style={
              posConfig.show_logo
                ? {
                    backgroundColor: `${themeColor}15`,
                    borderColor: themeColor,
                    color: themeColor.toLowerCase() === '#ffffff' ? '#0f172a' : themeColor
                  }
                : undefined
            }
          >
            <span className="text-xs font-bold">
              {isRTL ? 'رسید کے اوپر لوگو شامل کریں' : 'Print Store Logo at Top'}
            </span>
            <span
              className="text-[10px] px-2.5 py-1 rounded-full uppercase font-black"
              style={
                posConfig.show_logo
                  ? {
                      backgroundColor: themeColor,
                      color: contrastText,
                      border: themeColor.toLowerCase() === '#ffffff' ? '1px solid #94a3b8' : undefined
                    }
                  : {
                      backgroundColor: '#94a3b8',
                      color: '#ffffff'
                    }
              }
            >
              {posConfig.show_logo ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'رسید کے نیچے کسٹم پیغام / واپسی کی شرائط:' : 'Receipt Footer Message / Return Disclaimer:'}
          </label>
          <textarea
            rows={3}
            value={posConfig.footer_message}
            onChange={e => setPosConfig(prev => ({ ...prev, footer_message: e.target.value }))}
            placeholder="e.g. Thank you for shopping with us! Exchange allowed within 7 days with original receipt."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2.5 px-3 text-xs font-medium text-black dark:text-white outline-none focus:border-primary"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'سافٹ ویئر ڈویلپر کریڈٹ (رسید فوٹر):' : 'Software Developer / Company Credit (Receipt Footer):'}
          </label>
          <input
            type="text"
            value={posConfig.software_credit !== undefined ? posConfig.software_credit : 'Software Developed by: NHT ENTERPRISES - +92 312 8039911'}
            onChange={e => setPosConfig(prev => ({ ...prev, software_credit: e.target.value }))}
            placeholder="Software Developed by: NHT ENTERPRISES - +92 312 8039911"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2.5 px-3 text-xs font-medium text-black dark:text-white outline-none focus:border-primary"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {isRTL
              ? 'یہ پیغام تھرمل رسید کے آخر میں پرنٹ ہوگا'
              : 'Printed at the bottom of the printed thermal receipt.'}
          </p>
        </div>
      </div>
    </div>
  );
};
