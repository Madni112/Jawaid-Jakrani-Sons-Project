import React from 'react';
import {
  LuSparkles,
  LuPenLine,
  LuCheck,
  LuLayers,
  LuPlus
} from 'react-icons/lu';
import { PosSettings } from '../../../../service/posService';
import {
  PRESET_THEME_COLORS,
  getContrastTextColor
} from '../../../../constant/themeConfig';

interface POSThemeAppearanceTabProps {
  posConfig: PosSettings;
  setPosConfig: React.Dispatch<React.SetStateAction<PosSettings>>;
  themeColor: string;
  contrastText: string;
  handleColorChange: (hex: string) => void;
  isRTL: boolean;
}

export const POSThemeAppearanceTab: React.FC<POSThemeAppearanceTabProps> = ({
  posConfig,
  setPosConfig,
  themeColor,
  contrastText,
  handleColorChange,
  isRTL,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-5 animate-fadeIn">
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
          <LuSparkles size={18} className="text-primary" />
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

      <div className="space-y-4">
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
                className={`w-9 h-9 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center border shadow-xs hover:scale-110 ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-primary border-white scale-110'
                    : 'border-black/10 dark:border-white/10 hover:border-black/30'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {isSelected && (
                  <LuCheck size={16} style={{ color: getContrastTextColor(c.hex) }} />
                )}
              </button>
            );
          })}

          {/* Custom Color Wheel Picker */}
          <label
            className="relative w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center cursor-pointer hover:scale-110 transition shrink-0 bg-slate-100 dark:bg-slate-800"
            title="Pick custom color"
          >
            <LuPenLine size={15} className="text-slate-600 dark:text-slate-300" />
            <input
              type="color"
              value={themeColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>

        {/* Live Theme Preview Box */}
        <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Live POS Preview
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs"
              style={{
                backgroundColor: themeColor,
                color: contrastText,
                border: themeColor.toLowerCase() === '#ffffff' ? '1px solid #cbd5e1' : undefined
              }}
            >
              Place Order [F9]
            </button>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${themeColor}20`,
                color: themeColor.toLowerCase() === '#ffffff' ? '#0f172a' : themeColor,
                border: `1px solid ${themeColor}`
              }}
            >
              Active Category Pill
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Buttons, headers & badges dynamically inherit this color.
            </span>
          </div>
        </div>

        {/* Category Visual Style Selector */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {isRTL ? 'کیٹیگری دکھانے کا انداز:' : 'Category Visual Style:'}
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isRTL
                ? 'منتخب کریں کہ ٹرمینل کے اوپری بار میں کیٹیگریز کس طرح دکھائی دیں'
                : 'Choose how category selector buttons appear in the POS top navigation bar.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'pill' as const,
                title: 'Compact Pill',
                urduTitle: 'سائیڈ تصویر (ڈیفالٹ)',
                subtitle: 'Small side photo + text & count',
                previewType: 'pill'
              },
              {
                id: 'card' as const,
                title: 'Visual Card',
                urduTitle: 'بڑی تصویر (اوپر)',
                subtitle: 'Full-width picture on top + name below',
                previewType: 'card'
              },
              {
                id: 'text' as const,
                title: 'Minimal Text',
                urduTitle: 'بغیر تصویر (صاف)',
                subtitle: 'Pure text & count badge (No photo)',
                previewType: 'text'
              }
            ].map(opt => {
              const isSelected = (posConfig.category_display_style || 'pill') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPosConfig(prev => ({ ...prev, category_display_style: opt.id }))}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer text-left ${
                    isSelected
                      ? 'shadow-xs scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${themeColor}12`,
                          borderColor: themeColor,
                          color: themeColor.toLowerCase() === '#ffffff' ? '#0f172a' : undefined
                        }
                      : undefined
                  }
                >
                  {/* Realistic Visual Example Inside Card */}
                  <div className="mb-3 w-full">
                    {opt.previewType === 'pill' && (
                      <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0">
                          👔
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">Suit</span>
                          <span className="text-[9px] text-slate-400 block leading-tight">Cotton</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">5</span>
                      </div>
                    )}

                    {opt.previewType === 'card' && (
                      <div className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs text-center w-full">
                        <div className="w-full h-14 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs mb-1.5 shadow-2xs">
                          📸 Big Picture
                        </div>
                        <div className="flex items-center justify-center gap-1.5 w-full">
                          <span className="text-xs font-black text-slate-900 dark:text-white">Suit</span>
                          <span className="text-[9px] font-bold px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">5</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Cotton • Suit</span>
                      </div>
                    )}

                    {opt.previewType === 'text' && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs w-full">
                        <div className="text-left">
                          <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">Suit</span>
                          <span className="text-[9px] text-slate-400 block leading-tight">Cotton • Suit</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">5</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span className="text-xs font-black block tracking-tight">
                        {isRTL ? opt.urduTitle : opt.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight font-medium">
                        {opt.subtitle}
                      </span>
                    </div>
                    {isSelected ? (
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 ml-1.5"
                        style={{ backgroundColor: themeColor, color: contrastText }}
                      >
                        <LuCheck size={10} />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 ml-1.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Interactive Category Bar Example */}
          <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isRTL ? 'ٹرمینل میں لائیو نمونہ:' : 'Live Example in POS Terminal Bar:'}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${themeColor}20`,
                  color: themeColor.toLowerCase() === '#ffffff' ? '#0f172a' : themeColor,
                  border: `1px solid ${themeColor}`
                }}
              >
                {(posConfig.category_display_style || 'pill') === 'card' ? 'Visual Card (Big Pic)' : (posConfig.category_display_style || 'pill') === 'text' ? 'Minimal Text (No Pic)' : 'Compact Pill (Side Pic)'}
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
              {(posConfig.category_display_style || 'pill') === 'card' ? (
                <>
                  <div
                    className="rounded-2xl text-center flex flex-col items-center justify-between w-[115px] h-[105px] shadow-sm border overflow-hidden"
                    style={{
                      backgroundColor: themeColor,
                      color: contrastText,
                      borderColor: themeColor.toLowerCase() === '#ffffff' ? '#cbd5e1' : 'transparent'
                    }}
                  >
                    <div className="w-full h-14 flex items-center justify-center bg-black/10 dark:bg-white/15">
                      <LuLayers size={22} />
                    </div>
                    <div className="w-full px-2 py-1.5 text-center leading-tight">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-xs font-black truncate">All Items</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-black/15 dark:bg-white/20">24</span>
                      </div>
                      <span className="text-[9px] opacity-75 font-medium block truncate mt-1">All Categories</span>
                    </div>
                  </div>

                  <div className="rounded-2xl text-center flex flex-col items-center justify-between w-[115px] h-[105px] bg-white dark:bg-[#151c2e] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                    <div className="w-full h-14 bg-gradient-to-br from-indigo-500/20 to-sky-500/20 flex items-center justify-center text-xl">
                      👔
                    </div>
                    <div className="w-full px-2 py-1.5 text-center leading-tight">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">Suit</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">12</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium block truncate mt-1">Cotton • Suit</span>
                    </div>
                  </div>

                  <div className="rounded-2xl text-center flex flex-col items-center justify-between w-[115px] h-[105px] bg-white dark:bg-[#151c2e] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                    <div className="w-full h-14 bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center text-xl">
                      🧵
                    </div>
                    <div className="w-full px-2 py-1.5 text-center leading-tight">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">Pure Silk</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">8</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium block truncate mt-1">Silk & Boski</span>
                    </div>
                  </div>
                </>
              ) : (posConfig.category_display_style || 'pill') === 'text' ? (
                <>
                  <div
                    className="px-4 py-2 rounded-xl text-left flex items-center gap-2 border shadow-xs"
                    style={{
                      backgroundColor: themeColor,
                      color: contrastText,
                      borderColor: themeColor.toLowerCase() === '#ffffff' ? '#cbd5e1' : 'transparent'
                    }}
                  >
                    <span className="text-xs font-black">All Items</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/15">24</span>
                  </div>

                  <div className="px-4 py-2 rounded-xl text-left flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
                    <span className="text-xs font-black">Suit</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700">12</span>
                  </div>

                  <div className="px-4 py-2 rounded-xl text-left flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
                    <span className="text-xs font-black">Pure Silk</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700">8</span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="px-3.5 py-2 rounded-xl text-left flex items-center gap-2.5 min-w-[130px] border shadow-xs"
                    style={{
                      backgroundColor: themeColor,
                      color: contrastText,
                      borderColor: themeColor.toLowerCase() === '#ffffff' ? '#cbd5e1' : 'transparent'
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/10 dark:bg-white/15">
                      <LuLayers size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-black">All Items</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/15">24</span>
                      </div>
                      <span className="text-[10px] opacity-80 block">All Categories</span>
                    </div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl text-left flex items-center gap-2.5 min-w-[130px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-sm">
                      👔
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-black truncate">Suit</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700">12</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">Cotton • Suit</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Card Size & Display Layout */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isRTL ? 'پروڈکٹ کارڈ سائز اور لے آؤٹ:' : 'Product Card Size & Layout:'}
            </label>
            <span className="text-[11px] font-semibold text-primary">
              {(posConfig.product_card_size || 'tall') === 'compact'
                ? (isRTL ? 'مختصر (2 لائنز سکرین پر فٹ)' : 'Compact (Fit 2 Rows)')
                : (isRTL ? 'مکمل بڑا فیشن کارڈ' : 'Showcase (Tall Card)')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3.5">
            {isRTL
              ? 'منتخب کریں کہ پروڈکٹ کارڈ سکرین پر کتنا اونچا نظر آئے تاکہ بیک وقت 2 مکمل لائنز نظر آ سکیں۔'
              : 'Choose the product card size for the POS catalog grid. Select "Compact (Fit 2 Rows)" so 2 full rows fit comfortably on your screen without scrolling.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              {
                id: 'tall' as const,
                title: 'Showcase (Tall)',
                urduTitle: 'مکمل فیشن کارڈ (بڑا)',
                subtitle: 'Current portrait photo (h-52 ~ 200px). Single row focus.',
                tag: 'Current View'
              },
              {
                id: 'compact' as const,
                title: 'Compact (Fit 2 Rows)',
                urduTitle: 'مختصر سائز (2 لائنز فٹ)',
                subtitle: 'Optimized height (h-28 ~ 100px). Fits 2 full rows on screen cleanly!',
                tag: 'Recommended'
              }
            ].map(opt => {
              const isSelected = (posConfig.product_card_size || 'tall') === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setPosConfig(prev => ({ ...prev, product_card_size: opt.id }))}
                  className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-2 ring-primary/20'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {opt.tag}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <LuCheck size={11} />}
                    </div>
                  </div>

                  <div className="mb-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex justify-center">
                    {opt.id === 'tall' ? (
                      <div className="w-24 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 shadow-2xs">
                        <div className="w-full h-16 rounded bg-gradient-to-b from-sky-400/20 to-indigo-500/30 flex items-center justify-center text-xs mb-1">
                          👔
                        </div>
                        <div className="h-2 w-14 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
                        <div className="h-1.5 w-10 bg-slate-100 dark:bg-slate-800 rounded mb-1" />
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-700">
                          <div className="h-2 w-7 bg-primary/40 rounded" />
                          <div className="w-3 h-3 rounded bg-primary/30" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="w-20 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shadow-2xs">
                          <div className="w-full h-8 rounded bg-gradient-to-b from-emerald-400/20 to-teal-500/30 flex items-center justify-center text-[10px] mb-1">
                            👔
                          </div>
                          <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-700 rounded mb-0.5" />
                          <div className="flex justify-between items-center pt-0.5 border-t border-slate-100 dark:border-slate-700">
                            <div className="h-1.5 w-6 bg-primary/40 rounded" />
                            <div className="w-2.5 h-2.5 rounded bg-primary/30" />
                          </div>
                        </div>
                        <div className="w-20 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shadow-2xs">
                          <div className="w-full h-8 rounded bg-gradient-to-b from-amber-400/20 to-rose-500/30 flex items-center justify-center text-[10px] mb-1">
                            🧵
                          </div>
                          <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-700 rounded mb-0.5" />
                          <div className="flex justify-between items-center pt-0.5 border-t border-slate-100 dark:border-slate-700">
                            <div className="h-1.5 w-6 bg-primary/40 rounded" />
                            <div className="w-2.5 h-2.5 rounded bg-primary/30" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {opt.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        • {opt.urduTitle}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      {opt.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <LuSparkles size={12} className="text-primary" />
                LIVE PRODUCT CARD PREVIEW (ON POS SCREEN):
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                {(posConfig.product_card_size || 'tall') === 'compact' ? 'Compact: 2 Rows Fit' : 'Showcase: Tall Card'}
              </span>
            </div>

            <div className="flex items-start gap-3 overflow-x-auto py-1 no-scrollbar">
              {(posConfig.product_card_size || 'tall') === 'compact' ? (
                <>
                  <div className="w-[140px] rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 p-2 shadow-xs shrink-0 flex flex-col justify-between">
                    <div className="w-full h-20 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 flex items-center justify-center text-2xl mb-1.5 relative">
                      👔
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-bold bg-black/60 text-white">Suit</span>
                    </div>
                    <div className="space-y-0.5 mb-1 text-left">
                      <h4 className="font-bold text-[11px] text-slate-900 dark:text-white truncate">Suit Cotton Latha</h4>
                      <p className="text-[9px] text-slate-400 font-medium truncate">Cotton • Suit</p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="font-mono">P-1001</span>
                        <span className="text-emerald-500 font-semibold">In Stock</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">Rs. 1,200</span>
                      <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
                        <LuPlus size={11} />
                      </div>
                    </div>
                  </div>

                  <div className="w-[140px] rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 p-2 shadow-xs shrink-0 flex flex-col justify-between">
                    <div className="w-full h-20 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center text-2xl mb-1.5 relative">
                      🧵
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-bold bg-black/60 text-white">Pure Silk</span>
                    </div>
                    <div className="space-y-0.5 mb-1 text-left">
                      <h4 className="font-bold text-[11px] text-slate-900 dark:text-white truncate">Pure Silk Boski</h4>
                      <p className="text-[9px] text-slate-400 font-medium truncate">Silk • Boski</p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="font-mono">P-1002</span>
                        <span className="text-emerald-500 font-semibold">In Stock</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">Rs. 3,500</span>
                      <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
                        <LuPlus size={11} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-[150px] rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 p-2.5 shadow-xs shrink-0 flex flex-col justify-between">
                    <div className="w-full h-36 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 flex items-center justify-center text-3xl mb-2 relative">
                      👔
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white">Suit</span>
                    </div>
                    <div className="space-y-1 mb-1.5 text-left">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">Suit Cotton Latha</h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate">Cotton • Suit</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono">P-1001</span>
                        <span className="text-emerald-500 font-semibold">In Stock</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">Rs. 1,200</span>
                      <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
                        <LuPlus size={13} />
                      </div>
                    </div>
                  </div>

                  <div className="w-[150px] rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 p-2.5 shadow-xs shrink-0 flex flex-col justify-between">
                    <div className="w-full h-36 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center text-3xl mb-2 relative">
                      🧵
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white">Pure Silk</span>
                    </div>
                    <div className="space-y-1 mb-1.5 text-left">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">Pure Silk Boski</h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate">Silk • Boski</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono">P-1002</span>
                        <span className="text-emerald-500 font-semibold">In Stock</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">Rs. 3,500</span>
                      <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
                        <LuPlus size={13} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
