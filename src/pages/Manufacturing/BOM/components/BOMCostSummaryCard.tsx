import React from 'react';
import { MdTrendingUp, MdInfoOutline } from 'react-icons/md';
import { BomCalculations } from '../types/bomTypes';

interface BOMCostSummaryCardProps {
  isRTL: boolean;
  uom: string;
  calculations: BomCalculations;
  targetSellingPrice: number;
  setTargetSellingPrice: (val: number) => void;
  syncCatalogPrice: boolean;
  setSyncCatalogPrice: React.Dispatch<React.SetStateAction<boolean>>;
}

export const BOMCostSummaryCard: React.FC<BOMCostSummaryCardProps> = ({
  isRTL,
  uom,
  calculations,
  targetSellingPrice,
  setTargetSellingPrice,
  syncCatalogPrice,
  setSyncCatalogPrice
}) => {
  return (
    <div className="sticky top-24 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 via-white to-white p-5 shadow-sm dark:from-primary/10 dark:via-boxdark dark:to-boxdark dark:border-strokedark flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
          <div className="flex items-center gap-2">
            <MdTrendingUp className="text-xl text-primary" />
            <h3 className="text-base font-bold text-black dark:text-white">
              {isRTL ? 'پیداواری لاگت اور منافع' : 'Cost & Margin Summary'}
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-primary text-white px-2 py-0.5 rounded">
            LIVE
          </span>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
            <span>{isRTL ? 'کل خام مال کی لاگت:' : 'Raw Materials Cost:'}</span>
            <span className="font-mono font-bold text-black dark:text-white">
              PKR {calculations.rawMaterialCost.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
            <span>{isRTL ? 'لیبر اور اوور ہیڈز:' : 'Labor & Overheads:'}</span>
            <span className="font-mono font-bold text-black dark:text-white">
              PKR {calculations.totalOverheads.toLocaleString()}
            </span>
          </div>

          <div className="border-t border-dashed border-stroke dark:border-strokedark pt-2 flex justify-between items-center font-bold text-black dark:text-white">
            <span>{isRTL ? 'کل بیچ پیداواری لاگت:' : 'Total Batch Cost:'}</span>
            <span className="font-mono text-sm text-primary">
              PKR {calculations.totalBatchCost.toLocaleString()}
            </span>
          </div>

          {/* Highlighted Net Unit Cost */}
          <div className="bg-white dark:bg-meta-4 p-3 rounded-xl border border-stroke dark:border-strokedark">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
              {isRTL ? 'خالص فی یونٹ پیداواری لاگت:' : 'Net Unit Production Cost:'}
            </span>
            <div className="text-xl font-bold font-mono text-black dark:text-white mt-0.5">
              PKR {calculations.unitCost.toLocaleString()}
              <span className="text-xs font-normal text-gray-400 mr-1 ml-1">
                / {uom}
              </span>
            </div>
          </div>

          {/* Target Selling Price */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-black dark:text-white">
              {isRTL ? 'ہدف سیلز پرائس (PKR فی یونٹ)' : 'Target Selling Price (PKR / Unit)'}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={targetSellingPrice}
              onChange={e => setTargetSellingPrice(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-primary/50 bg-white py-2 px-3 text-xs font-mono font-bold text-emerald-600 dark:bg-meta-4 outline-none focus:border-primary"
              placeholder="0"
            />

            {/* Sync to Catalog Pill Selector */}
            <button
              type="button"
              onClick={() => setSyncCatalogPrice(prev => !prev)}
              className={`mt-2 w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                syncCatalogPrice
                  ? 'bg-primary/10 border-primary/40 text-primary dark:bg-primary/20 dark:border-primary/50'
                  : 'bg-white/80 border-stroke text-gray-500 hover:bg-gray-50 dark:bg-meta-4 dark:border-strokedark dark:text-gray-400'
              }`}
              title={
                isRTL
                  ? 'اگر فعال ہو تو پروڈکٹ لسٹ میں بھی سیلز پرائس اپڈیٹ ہو جائے گی'
                  : 'When enabled, this price will also update the product sales price in Products Catalog'
              }
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                    syncCatalogPrice
                      ? 'bg-primary border-primary text-white'
                      : 'border-stroke bg-white dark:border-strokedark dark:bg-boxdark text-transparent'
                  }`}
                >
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                    <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold leading-tight">
                  {isRTL ? 'کیٹلاگ پرائس بھی اپڈیٹ کریں' : 'Also update Catalog Price'}
                </span>
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-all ${
                  syncCatalogPrice
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {syncCatalogPrice ? (isRTL ? 'فعال' : 'ON') : (isRTL ? 'غیر فعال' : 'OFF')}
              </span>
            </button>
          </div>

          {/* Profit Breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-center">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-semibold">
                {isRTL ? 'فی یونٹ منافع' : 'Unit Profit'}
              </span>
              <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">
                PKR {calculations.unitProfit.toLocaleString()}
              </span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-semibold">
                {isRTL ? 'منافع مارجن' : 'Gross Margin'}
              </span>
              <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">
                {calculations.marginPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-stroke dark:border-strokedark text-[11px] text-gray-400">
        <MdInfoOutline className="inline mr-1 text-xs text-primary" />
        {isRTL
          ? 'تینوں مراحل میں کسی بھی قیمت یا خام مال کی تبدیلی سے لاگت فوراً اپڈیٹ ہوتی ہے۔'
          : 'Unit cost dynamically recalculates whenever raw items, waste, or batch quantities change.'}
      </div>
    </div>
  );
};

export default BOMCostSummaryCard;
