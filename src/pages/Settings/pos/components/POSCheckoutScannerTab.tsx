import React from 'react';
import { IoBarcodeOutline } from 'react-icons/io5';
import {
  LuCircleSlash,
  LuShoppingBag,
  LuPackage,
  LuTruck,
} from 'react-icons/lu';
import { PosSettings } from '../../../../service/posService';

interface POSCheckoutScannerTabProps {
  posConfig: PosSettings;
  setPosConfig: React.Dispatch<React.SetStateAction<PosSettings>>;
  themeColor: string;
  contrastText: string;
  isRTL: boolean;
}

export const POSCheckoutScannerTab: React.FC<POSCheckoutScannerTabProps> = ({
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
          <IoBarcodeOutline size={18} className="text-primary" />
          <span>{isRTL ? 'بارکوڈ اسکینر اور چیک آؤٹ ڈیفالٹس' : 'Scanner Hardware & Checkout Defaults'}</span>
        </div>
        <span className="text-[11px] text-slate-400">
          {isRTL ? 'بلنگ اسپیڈ اور اسکیننگ ترتیبات' : 'Billing speed & hardware configuration'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'ڈیفالٹ کسٹمر کا نام:' : 'Default Walk-in Customer:'}
          </label>
          <input
            type="text"
            value={posConfig.default_customer_name}
            onChange={e => setPosConfig(prev => ({ ...prev, default_customer_name: e.target.value }))}
            placeholder="Walk-in Customer"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2.5 px-3 text-xs font-medium text-black dark:text-white outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? 'سیلز ٹیکس شرح (%):' : 'Default Sales Tax Rate (%):'}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={posConfig.default_tax_rate}
            onChange={e =>
              setPosConfig(prev => ({ ...prev, default_tax_rate: parseFloat(e.target.value) || 0 }))
            }
            placeholder="0"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2.5 px-3 text-xs font-mono font-bold text-black dark:text-white outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Default Fulfillment Mode (Pill Selector) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          {isRTL ? 'ڈیفالٹ ڈلیوری / پیکنگ:' : 'Default Fulfillment Mode:'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-0.5">
          {[
            { id: '', label: 'Unselected', hint: 'Manual pick on checkout', icon: LuCircleSlash },
            { id: 'In-Store Bag', label: 'In-Store Bag', hint: 'Standard shopping bag', icon: LuShoppingBag },
            { id: 'Takeaway', label: 'Takeaway', hint: 'Box / Suit cover', icon: LuPackage },
            { id: 'Delivery', label: 'Delivery', hint: 'Rider / Courier dispatch', icon: LuTruck }
          ].map(opt => {
            const Icon = opt.icon;
            const isSelected =
              (!opt.id &&
                (!posConfig.default_fulfillment ||
                  posConfig.default_fulfillment === 'None' ||
                  posConfig.default_fulfillment.toLowerCase() === 'unselected')) ||
              (posConfig.default_fulfillment || '').toLowerCase() === opt.id.toLowerCase();
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPosConfig(prev => ({ ...prev, default_fulfillment: opt.id }))}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer text-left ${
                  isSelected
                    ? 'shadow-xs scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: themeColor,
                        color: contrastText,
                        borderColor: themeColor.toLowerCase() === '#ffffff' ? '#94a3b8' : themeColor
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-black/10 dark:bg-white/15 text-current'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-current" />}
                </div>
                <div>
                  <span className="block text-xs font-black tracking-tight">{opt.label}</span>
                  <span className="block text-[10px] opacity-75 font-medium mt-0.5 leading-tight">{opt.hint}</span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {isRTL
            ? 'نئی سیل پر خودکار طور پر لاگو ہوگا یا "Unselected" رکھ کر کیشیئر کو ہر سیل پر منتخب کرنے دیں'
            : 'Choose what new sales start with. Pick "Unselected" to require cashier to choose at checkout.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Toggle: Barcode Auto-Add */}
        <div>
          <button
            type="button"
            onClick={() => setPosConfig(prev => ({ ...prev, barcode_auto_add: !prev.barcode_auto_add }))}
            className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
              posConfig.barcode_auto_add
                ? 'border-2 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            style={
              posConfig.barcode_auto_add
                ? {
                    backgroundColor: `${themeColor}15`,
                    borderColor: themeColor,
                    color: themeColor.toLowerCase() === '#ffffff' ? '#0f172a' : themeColor
                  }
                : undefined
            }
          >
            <div className="text-left">
              <span className="text-xs font-bold block">
                {isRTL ? 'بارکوڈ اسکین پر فوری اندراج' : 'Barcode Auto-Add'}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Add to cart automatically when laser scans</span>
            </div>
            <span
              className="text-[10px] px-2.5 py-1 rounded-full uppercase font-black shrink-0"
              style={
                posConfig.barcode_auto_add
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
              {posConfig.barcode_auto_add ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Toggle: Sound Effects */}
        <div>
          <button
            type="button"
            onClick={() =>
              setPosConfig(prev => ({ ...prev, sound_effects_enabled: !prev.sound_effects_enabled }))
            }
            className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
              posConfig.sound_effects_enabled
                ? 'border-2 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            style={
              posConfig.sound_effects_enabled
                ? {
                    backgroundColor: `${themeColor}15`,
                    borderColor: themeColor,
                    color: themeColor.toLowerCase() === '#ffffff' ? '#0f172a' : themeColor
                  }
                : undefined
            }
          >
            <div className="text-left">
              <span className="text-xs font-bold block">
                {isRTL ? 'پی او ایس آواز و آڈیو بیپ' : 'POS Audio Feedback'}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Supermarket laser beep and cash chime</span>
            </div>
            <span
              className="text-[10px] px-2.5 py-1 rounded-full uppercase font-black shrink-0"
              style={
                posConfig.sound_effects_enabled
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
              {posConfig.sound_effects_enabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
