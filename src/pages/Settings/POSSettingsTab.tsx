import React, { useState } from 'react';
import { useLanguage } from '../../Context/LanguageContext';
import { posService, PosSettings } from '../../service/posService';
import {
  LuStore,
  LuPrinter,
  LuReceipt,
  LuSave,
  LuCheck
} from 'react-icons/lu';
import { IoBarcodeOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

export const POSSettingsTab: React.FC = () => {
  const { isRTL } = useLanguage();
  const [posConfig, setPosConfig] = useState<PosSettings>(() => posService.getSettings());
  const [savingPosSettings, setSavingPosSettings] = useState<boolean>(false);

  const handleSavePosSettings = async () => {
    try {
      setSavingPosSettings(true);
      await posService.saveSettings(posConfig);
      toast.success(isRTL ? 'پی او ایس سیٹنگز محفوظ ہو گئیں' : 'POS Settings saved successfully!');
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

        <button
          type="button"
          onClick={handleSavePosSettings}
          disabled={savingPosSettings}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-opacity-90 transition disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              {isRTL ? 'ڈیفالٹ ڈلیوری / پیکنگ:' : 'Default Fulfillment Mode:'}
            </label>
            <select
              value={posConfig.default_fulfillment}
              onChange={e => setPosConfig(prev => ({ ...prev, default_fulfillment: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 py-2.5 px-3 text-xs font-medium text-black dark:text-white outline-none focus:border-primary"
            >
              <option value="In-Store Bag">In-Store Bag</option>
              <option value="Takeaway">Takeaway</option>
              <option value="Counter Delivery">Counter Delivery</option>
            </select>
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

          {/* Toggle: Barcode Auto-Add */}
          <div className="sm:col-span-1.5">
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
          <div className="sm:col-span-1.5">
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
