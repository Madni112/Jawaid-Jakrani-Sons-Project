import React, { useState } from 'react';
import { useLanguage } from '../../Context/LanguageContext';
import { posService, PosSettings } from '../../service/posService';
import {
  getSavedAccentColor,
  applyAccentColor,
  getContrastTextColor
} from '../../constant/themeConfig';
import {
  LuStore,
  LuReceipt,
  LuSave,
  LuX,
  LuSparkles,
} from 'react-icons/lu';
import { IoBarcodeOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { POSSettingsTabProps, SettingsTabKey } from './pos/types/posSettingsTabTypes';
import { POSStoreCounterTab } from './pos/components/POSStoreCounterTab';
import { POSReceiptPrinterTab } from './pos/components/POSReceiptPrinterTab';
import { POSCheckoutScannerTab } from './pos/components/POSCheckoutScannerTab';
import { POSThemeAppearanceTab } from './pos/components/POSThemeAppearanceTab';

export { type POSSettingsTabProps };

export const POSSettingsTab: React.FC<POSSettingsTabProps> = ({ onClose, isModal }) => {
  const { isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('store');
  const [posConfig, setPosConfig] = useState<PosSettings>(() => posService.getSettings());
  const [savingPosSettings, setSavingPosSettings] = useState<boolean>(false);
  const [themeColor, setThemeColor] = useState<string>(getSavedAccentColor());
  const [, setCustomHex] = useState<string>(getSavedAccentColor().replace('#', ''));

  const contrastText = getContrastTextColor(themeColor);

  const handleColorChange = (hex: string) => {
    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    setThemeColor(cleanHex);
    setCustomHex(cleanHex.replace('#', ''));
    applyAccentColor(cleanHex);
  };

  const handleSavePosSettings = async () => {
    try {
      setSavingPosSettings(true);
      await posService.saveSettings(posConfig);
      window.dispatchEvent(new Event('pos_settings_updated'));
      toast.success(isRTL ? 'پی او ایس سیٹنگز محفوظ ہو گئیں' : 'POS Settings saved successfully!');
      if (onClose) {
        onClose();
      }
    } catch {
      toast.error('Failed to save POS settings');
    } finally {
      setSavingPosSettings(false);
    }
  };

  const tabs: {
    id: SettingsTabKey;
    label: string;
    urduLabel: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    description: string;
  }[] = [
    {
      id: 'store',
      label: 'Store & Counter',
      urduLabel: 'اسٹور اور کاؤنٹر',
      icon: LuStore,
      description: 'Store title, register ID, phone, tax NTN, and store address'
    },
    {
      id: 'receipt',
      label: 'Receipt & Printer',
      urduLabel: 'رسید اور پرنٹر',
      icon: LuReceipt,
      description: 'Thermal roll size (80mm/58mm), logo printing, and footer return policy'
    },
    {
      id: 'checkout',
      label: 'Checkout & Scanner',
      urduLabel: 'چیک آؤٹ اور اسکینر',
      icon: IoBarcodeOutline,
      description: 'Default customer, fulfillment packaging, laser auto-add, and sound chimes'
    },
    {
      id: 'theme',
      label: 'Theme & Appearance',
      urduLabel: 'تھیم اور رنگ',
      icon: LuSparkles,
      description: 'POS accent colors, button styling, and cashier interface palette'
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-xs"
            style={{ backgroundColor: themeColor, color: contrastText }}
          >
            <LuStore size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isRTL ? 'پی او ایس اور کاؤنٹر سیٹنگز' : 'POS & Counter Terminal Settings'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL
                ? 'تھرمل رسید لے آؤٹ، بارکوڈ اسکینرز، ٹرمینل ڈیفالٹس اور ٹیکس کی ترتیبات'
                : 'Configure thermal receipts, scanner auto-add, terminal defaults, and POS sound chimes'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSavePosSettings}
            disabled={savingPosSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 cursor-pointer shrink-0"
            style={{
              backgroundColor: themeColor,
              color: contrastText,
              border: themeColor.toLowerCase() === '#ffffff' ? '1px solid #cbd5e1' : undefined
            }}
          >
            <LuSave size={15} />
            <span>
              {savingPosSettings
                ? isRTL
                  ? 'محفوظ ہو رہا ہے...'
                  : 'Saving...'
                : isRTL
                ? 'سیٹنگز محفوظ کریں'
                : 'Save POS Settings'}
            </span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Close Settings"
            >
              <LuX size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: themeColor,
                      color: contrastText,
                      border: themeColor.toLowerCase() === '#ffffff' ? '1px solid #94a3b8' : undefined
                    }
                  : undefined
              }
            >
              <Icon size={16} />
              <span>{isRTL ? tab.urduLabel : tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Contents */}
      {activeTab === 'store' && (
        <POSStoreCounterTab
          posConfig={posConfig}
          setPosConfig={setPosConfig}
          isRTL={isRTL}
        />
      )}

      {activeTab === 'receipt' && (
        <POSReceiptPrinterTab
          posConfig={posConfig}
          setPosConfig={setPosConfig}
          themeColor={themeColor}
          contrastText={contrastText}
          isRTL={isRTL}
        />
      )}

      {activeTab === 'checkout' && (
        <POSCheckoutScannerTab
          posConfig={posConfig}
          setPosConfig={setPosConfig}
          themeColor={themeColor}
          contrastText={contrastText}
          isRTL={isRTL}
        />
      )}

      {activeTab === 'theme' && (
        <POSThemeAppearanceTab
          posConfig={posConfig}
          setPosConfig={setPosConfig}
          themeColor={themeColor}
          contrastText={contrastText}
          handleColorChange={handleColorChange}
          isRTL={isRTL}
        />
      )}

      {/* Bottom Save Action */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-400">
          Tip: Settings apply live to POS Terminal and receipts.
        </span>
        <button
          type="button"
          onClick={handleSavePosSettings}
          disabled={savingPosSettings}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          style={{
            backgroundColor: themeColor,
            color: contrastText,
            border: themeColor.toLowerCase() === '#ffffff' ? '1px solid #cbd5e1' : undefined
          }}
        >
          <LuSave size={16} />
          <span>
            {savingPosSettings
              ? isRTL
                ? 'محفوظ ہو رہا ہے...'
                : 'Saving...'
              : isRTL
              ? 'سیٹنگز محفوظ کریں'
              : 'Save POS Settings'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default POSSettingsTab;
