import React from 'react';
import { MdSquareFoot } from 'react-icons/md';
import { ProductFormValues } from '../utils/productFormHelpers';

interface ProductTileSpecsSectionProps {
  values: ProductFormValues;
  handleChange: (e: React.ChangeEvent<any>) => void;
  tileSizeFormatted: string;
  sqMetersPerTile: number;
  totalSqMetersPerBox: number;
}

export const ProductTileSpecsSection: React.FC<ProductTileSpecsSectionProps> = ({
  values,
  handleChange,
  tileSizeFormatted,
  sqMetersPerTile,
  totalSqMetersPerBox
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-teal-500/30 dark:border-teal-500/20 shadow-sm p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
          <MdSquareFoot className="text-xl" />
          <span>Tile Sizing &amp; Box Packaging Setup</span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Unit:{' '}
          {values.tileDimensionUnit === 'in'
            ? 'Inches (in)'
            : values.tileDimensionUnit === 'm'
            ? 'Meters (m)'
            : 'Centimeters (cm)'}{' '}
          | Area: Square Meters (sq.m)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Dimension Unit - Dropdown (Defaults to Centimeters) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
            Dimension Unit
          </label>
          <select
            name="tileDimensionUnit"
            value={values.tileDimensionUnit || 'cm'}
            onChange={handleChange}
            className="w-full rounded-xl border border-teal-500/50 dark:border-teal-500/50 p-2.5 bg-teal-50/30 dark:bg-teal-950/20 outline-none focus:border-teal-600 text-xs font-bold text-teal-800 dark:text-teal-300 cursor-pointer"
          >
            <option value="cm">Centimeters (cm)</option>
            <option value="in">Inches (in)</option>
            <option value="m">Meters (m)</option>
          </select>
        </div>

        {/* Height */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
            Tile Height ({values.tileDimensionUnit === 'in' ? 'in' : values.tileDimensionUnit === 'm' ? 'm' : 'cm'}) *
          </label>
          <input
            type="number"
            step="any"
            min="0.01"
            name="tileHeight"
            value={values.tileHeight}
            onChange={handleChange}
            placeholder={
              values.tileDimensionUnit === 'in'
                ? 'e.g. 12 or 24'
                : values.tileDimensionUnit === 'm'
                ? 'e.g. 0.6 or 1.2'
                : 'e.g. 30 or 60'
            }
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-teal-600 text-xs font-mono font-bold text-slate-900 dark:text-white"
          />
        </div>

        {/* Width */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
            Tile Width ({values.tileDimensionUnit === 'in' ? 'in' : values.tileDimensionUnit === 'm' ? 'm' : 'cm'}) *
          </label>
          <input
            type="number"
            step="any"
            min="0.01"
            name="tileWidth"
            value={values.tileWidth}
            onChange={handleChange}
            placeholder={
              values.tileDimensionUnit === 'in'
                ? 'e.g. 12 or 24'
                : values.tileDimensionUnit === 'm'
                ? 'e.g. 0.6 or 1.2'
                : 'e.g. 60 or 120'
            }
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-teal-600 text-xs font-mono font-bold text-slate-900 dark:text-white"
          />
        </div>

        {/* Pieces Per Box */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
            Pieces Per Box *
          </label>
          <input
            type="number"
            min="1"
            name="piecesPerBox"
            value={values.piecesPerBox}
            onChange={handleChange}
            placeholder="e.g. 4 or 8"
            className="w-full rounded-xl border border-teal-500/50 dark:border-teal-500/50 p-2.5 bg-teal-50/30 dark:bg-teal-950/20 outline-none focus:border-teal-600 text-xs font-mono font-black text-teal-800 dark:text-teal-300"
          />
        </div>

        {/* Thickness (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
            Thickness <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            name="tileThickness"
            value={values.tileThickness}
            onChange={handleChange}
            placeholder="e.g. 9 mm"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-teal-600 text-xs text-slate-800 dark:text-white"
          />
        </div>

        {/* Weight per Box (kg) (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
            Weight / Box (kg) <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="number"
            step="any"
            min="0"
            name="weightPerBox"
            value={values.weightPerBox}
            onChange={handleChange}
            placeholder="e.g. 28"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-teal-600 text-xs font-mono font-bold text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* LIVE COMPUTED SQUARE METER BADGES */}
      <div className="bg-teal-50 dark:bg-teal-950/40 rounded-xl p-4 border border-teal-200 dark:border-teal-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-xl">📐</span>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Formatted Tile Size:</span>
            <strong className="text-teal-800 dark:text-teal-300 font-bold text-sm">
              {tileSizeFormatted}
            </strong>
          </div>
        </div>

        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Area per Tile:</span>
          <strong className="text-slate-900 dark:text-white font-mono font-bold text-sm">
            {sqMetersPerTile > 0 ? `${Number(sqMetersPerTile.toFixed(4))} sq.m` : '—'}
          </strong>
        </div>

        <div className="bg-white dark:bg-slate-900 px-5 py-2.5 rounded-xl border border-teal-300 dark:border-teal-700 shadow-xs">
          <span className="text-teal-600 dark:text-teal-400 block text-[10px] font-bold uppercase tracking-wider">
            Total Coverage Per Box:
          </span>
          <strong className="text-teal-800 dark:text-teal-300 font-mono font-black text-lg">
            {totalSqMetersPerBox > 0 ? `${Number(totalSqMetersPerBox.toFixed(4))} sq.m` : '—'}
          </strong>
          {totalSqMetersPerBox > 0 && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono ml-2">/ Box</span>
          )}
        </div>
      </div>
    </div>
  );
};
