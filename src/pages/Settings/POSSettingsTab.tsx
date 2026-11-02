import React, { useState } from 'react';
import { useLanguage } from '../../Context/LanguageContext';
import { posService, PosSettings } from '../../service/posService';
import {
  PRESET_THEME_COLORS,
  getSavedAccentColor,
  applyAccentColor,
  getContrastTextColor
} from '../../constant/themeConfig';
import {
  LuStore,
  LuPrinter,
  LuReceipt,
  LuSave,
  LuCheck,
  LuX,
  LuSparkles,
  LuPenLine,
  LuShoppingBag,
  LuPackage,
  LuTruck,
  LuCircleSlash
} from 'react-icons/lu';
import { IoBarcodeOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

export interface POSSettingsTabProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const POSSettingsTab: React.FC<POSSettingsTabProps> = ({ onClose, isModal }) => {
  const { isRTL } = useLanguage();
  const [posConfig, setPosConfig] = useState<PosSettings>(() => posService.getSettings());
  const [savingPosSettings, setSavingPosSettings] = useState<boolean>(false);
  const [themeColor, setThemeColor] = useState<string>(getSavedAccentColor());
  const [customHex, setCustomHex] = useState<string>(getSavedAccentColor().replace('#', ''));

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <LuStore size={26} />
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-opacity-90 transition disabled:opacity-50 cursor-pointer shrink-0"
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

      {/* SECTION 0: POS & TERMINAL COLOR THEME */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <LuSparkles size={18} />
            <span>{isRTL ? 'پی او ایس کا تھیم رنگ' : 'POS Terminal Theme & Accent Color'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0"
              style={{ backgroundColor: themeColor }}
            />
            <span className="text-slate-700 dark:text-slate-200 uppercase">{themeColor}</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isRTL
              ? 'پی او ایس بٹنوں، ایکٹو کیٹیگریز اور چیک آؤٹ کے لیے ایک رنگ منتخب کریں:'
              : 'Choose a primary accent color for POS buttons, active categories, badges, and checkout:'}
          </p>

          {/* Quick Swatches */}
          <div className="flex flex-wrap gap-2.5 items-center">
            {PRESET_THEME_COLORS.slice(0, 16).map((c) => {
              const isSelected = themeColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleColorChange(c.hex)}
                  className={`w-8 h-8 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center border shadow-xs hover:scale-110 ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-primary border-white scale-110'
                      : 'border-black/10 dark:border-white/10 hover:border-black/30'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {isSelected && (
                    <LuCheck size={14} style={{ color: getContrastTextColor(c.hex) }} />
                  )}
                </button>
              );
            })}

            {/* Custom Color Wheel Picker */}
            <label
              className="relative w-8 h-8 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center cursor-pointer hover:scale-110 transition shrink-0 bg-slate-100 dark:bg-slate-800"
              title="Pick custom color"
            >
              <LuPenLine size={14} className="text-slate-600 dark:text-slate-300" />
              <input
                type="color"
                value={themeColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 1: STORE & RECEIPT HEADER */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-primary font-bold text-sm">
          <LuPrinter size={18} />
          <span>{isRTL ? 'اسٹور اور تھرمل رسید کی تفصیلات' : 'Store & Thermal Receipt Header'}</span>
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
              placeholder="e.g. Uzair Jibran Cloth"
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

      {/* SECTION 2: RECEIPT PAPER SIZE & FOOTER DISCLAIMER */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <LuReceipt size={18} />
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
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">80mm Standard</span>
                  {posConfig.receipt_paper_size === '80mm' && <LuCheck size={14} />}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Desktop POS printer</span>
              </button>

              <button
                type="button"
                onClick={() => setPosConfig(prev => ({ ...prev, receipt_paper_size: '58mm' }))}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  posConfig.receipt_paper_size === '58mm'
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">58mm Compact</span>
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
                  ? 'bg-primary/10 border-primary text-primary font-bold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="text-xs">{isRTL ? 'رسید کے اوپر لوگو شامل کریں' : 'Print Store Logo at Top'}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                  posConfig.show_logo
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
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
              rows={2}
              value={posConfig.footer_message}
              onChange={e => setPosConfig(prev => ({ ...prev, footer_message: e.target.value }))}
              placeholder="e.g. Thank you for shopping with us! Exchange allowed within 7 days with original receipt."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2 px-3 text-xs font-medium text-black dark:text-white outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: CHECKOUT & SCANNER HARDWARE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-primary font-bold text-sm">
          <IoBarcodeOutline size={18} />
          <span>{isRTL ? 'بارکوڈ اسکینر اور چیک آؤٹ ڈیفالٹس' : 'Scanner Hardware & Checkout Defaults'}</span>
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
              const isSelected = (!opt.id && (!posConfig.default_fulfillment || posConfig.default_fulfillment === 'None' || posConfig.default_fulfillment.toLowerCase() === 'unselected')) ||
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
                          color: getContrastTextColor(themeColor),
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
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-current" />
                    )}
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
              className={`w-full p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                posConfig.barcode_auto_add
                  ? 'bg-primary/10 border-primary text-primary font-bold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div className="text-left">
                <span className="text-xs block">{isRTL ? 'بارکوڈ اسکین پر فوری اندراج' : 'Barcode Auto-Add'}</span>
                <span className="text-[10px] text-slate-400 font-normal">Add to cart automatically when laser scans</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shrink-0 ${
                  posConfig.barcode_auto_add
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
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
              className={`w-full p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                posConfig.sound_effects_enabled
                  ? 'bg-primary/10 border-primary text-primary font-bold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div className="text-left">
                <span className="text-xs block">{isRTL ? 'پی او ایس آواز و آڈیو بیپ' : 'POS Audio Feedback'}</span>
                <span className="text-[10px] text-slate-400 font-normal">Supermarket laser beep and cash chime</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shrink-0 ${
                  posConfig.sound_effects_enabled
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {posConfig.sound_effects_enabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Save Action */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSavePosSettings}
          disabled={savingPosSettings}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-opacity-90 transition disabled:opacity-50 cursor-pointer"
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
