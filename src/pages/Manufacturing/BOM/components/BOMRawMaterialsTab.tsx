import React, { useMemo } from 'react';
import { MdPrecisionManufacturing, MdLayers, MdAdd, MdDelete, MdScience, MdInventory2 } from 'react-icons/md';
import SearchableProductSelect from '../../../../components/SearchableProductSelect';
import SearchableUomDropdown from '../../../../components/SearchableUomDropdown';
import { BomItem } from '../types/bomTypes';

interface BOMRawMaterialsTabProps {
  isRTL: boolean;
  uom: string;
  batchQuantity: number;
  setBatchQuantity: (qty: number) => void;
  items: BomItem[];
  catalogProducts: any[];
  allUomsList: any[];
  availableUoms: string[];
  rawMaterialCost: number;
  onAddItemRow: () => void;
  onRemoveItemRow: (idx: number) => void;
  onUpdateItem: (idx: number, field: keyof BomItem, val: any) => void;
}

export const BOMRawMaterialsTab: React.FC<BOMRawMaterialsTabProps> = ({
  isRTL,
  uom,
  batchQuantity,
  setBatchQuantity,
  items,
  catalogProducts,
  allUomsList,
  availableUoms,
  rawMaterialCost,
  onAddItemRow,
  onRemoveItemRow,
  onUpdateItem
}) => {
  // Categorize breakdown: Chemical / Bulk vs Packaging Material
  const chemicalTotal = useMemo(() => {
    return items
      .filter(it => it.item_type !== 'Packaging')
      .reduce((sum, it) => sum + (Number(it.total_cost) || 0), 0);
  }, [items]);

  const packagingTotal = useMemo(() => {
    return items
      .filter(it => it.item_type === 'Packaging')
      .reduce((sum, it) => sum + (Number(it.total_cost) || 0), 0);
  }, [items]);

  return (
    <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark space-y-4">
      {/* Batch Production Target Card */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary text-white shadow-xs">
            <MdPrecisionManufacturing className="text-xl" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black dark:text-white block">
              {isRTL ? 'بیچ پیداواری مقدار (Batch Production Quantity) *' : 'Batch Production Quantity *'}
            </label>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {isRTL
                ? `یہ نسخہ نیچے دیے گئے تمام خام کیمیکلز اور پیکجنگ سامان سے تیار ہونے والی کل مقدار (${uom}) کو ظاہر کرتا ہے۔`
                : `Total output produced by this recipe run. Raw ingredients and packaging materials below formulate this exact batch size.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input
            type="number"
            min="0.001"
            step="any"
            required
            value={batchQuantity}
            onChange={e => setBatchQuantity(parseFloat(e.target.value) || 0)}
            className="w-36 rounded-xl border-2 border-primary/40 bg-white py-2 px-3 text-sm font-mono font-bold text-primary dark:bg-meta-4 outline-none focus:border-primary shadow-xs text-center"
            placeholder="1"
          />
          <span className="font-bold text-xs bg-white dark:bg-meta-4 border border-stroke dark:border-strokedark px-3 py-2 rounded-xl text-black dark:text-white uppercase font-mono">
            {uom}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stroke pb-3 dark:border-strokedark">
        <div className="flex items-center gap-2">
          <MdLayers className="text-xl text-primary" />
          <div>
            <h2 className="text-base font-semibold text-black dark:text-white">
              {isRTL ? '2. خام کیمیکلز اور پیکجنگ میٹریل (Raw Materials & Packaging)' : '2. Raw Chemicals & Packaging Materials'}
            </h2>
            <p className="text-xs text-gray-500">
              {isRTL
                ? 'ہر آئٹم کو خام کیمیکل یا پیکجنگ منتخب کریں، اور ضرورت پڑنے پر لوز اکائی (ML, GM, Pcs) استعمال کریں۔'
                : 'Categorize each row as Raw Chemical or Packaging Material. Supports fine Loose sub-units (ML, GM, Pcs) with conversion.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddItemRow}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
        >
          <MdAdd className="text-base" />
          <span>{isRTL ? '+ نیا آئٹم شامل کریں' : '+ Add Material Item'}</span>
        </button>
      </div>

      {/* Cost Split Badges Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-meta-4/30 border border-slate-200/80 dark:border-strokedark">
        <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-boxdark rounded-lg border border-slate-200 dark:border-strokedark shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <MdScience size={15} />
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isRTL ? 'بلک کیمیکل لاگت:' : 'Bulk Liquid Chemical Cost:'}
            </span>
          </div>
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            PKR {chemicalTotal.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-boxdark rounded-lg border border-slate-200 dark:border-strokedark shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <MdInventory2 size={15} />
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isRTL ? 'پیکجنگ سامان لاگت:' : 'Packaging Materials Cost:'}
            </span>
          </div>
          <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
            PKR {packagingTotal.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between px-3 py-2 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/30 shadow-2xs">
          <span className="text-xs font-bold text-primary">
            {isRTL ? 'کل مشترکہ لاگت:' : 'Combined Materials Total:'}
          </span>
          <span className="font-mono font-extrabold text-sm text-primary">
            PKR {rawMaterialCost.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[300px] pb-32">
        <table className="w-full min-w-[1140px] table-fixed text-xs">
          <thead>
            <tr className="bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 uppercase font-semibold">
              <th className={`p-2.5 ${isRTL ? 'text-right' : 'text-left'} w-[130px]`}>
                {isRTL ? 'قسم (Type)' : 'Category / Type'}
              </th>
              <th className={`p-2.5 ${isRTL ? 'text-right' : 'text-left'} w-[240px]`}>
                {isRTL ? 'خام مال / جزو *' : 'Material / Component Name *'}
              </th>
              <th className="p-2.5 text-center w-[120px]">
                {isRTL ? 'مقدار (Qty) *' : 'Quantity *'}
              </th>
              <th className="p-2.5 text-center w-[100px]">
                {isRTL ? 'اکائی (UOM) *' : 'UOM *'}
              </th>
              <th className="p-2.5 text-center w-[115px]">
                {isRTL ? 'فی اکائی قیمت (Cost)' : 'Unit Cost (PKR)'}
              </th>
              <th className="p-2.5 text-center w-[85px]">
                {isRTL ? 'ضیاع (Waste%)' : 'Waste %'}
              </th>
              <th className={`p-2.5 ${isRTL ? 'text-left' : 'text-right'} w-[150px] bg-primary/5 dark:bg-primary/10 text-primary font-bold`}>
                {isRTL ? 'لائن ٹوٹل (Line Total PKR)' : 'Line Total (PKR)'}
              </th>
              <th className={`p-2.5 ${isRTL ? 'text-right' : 'text-left'} w-[130px]`}>
                {isRTL ? 'تفصیل / نوٹس' : 'Notes / Specs'}
              </th>
              <th className="p-2.5 text-center w-[45px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark">
            {items.map((row, idx) => {
              const isPackaging = row.item_type === 'Packaging';
              const lineTotal = Number(row.total_cost || 0);
              const ratio = Number(row.loose_ratio || 0);
              const looseUom = row.loose_uom || '';
              const hasLoose = Boolean(row.allow_loose && ratio > 1 && looseUom);

              return (
                <tr key={row.id || idx} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors">
                  {/* Item Type: Chemical vs Packaging */}
                  <td className="p-2 w-[130px]">
                    <select
                      value={row.item_type || 'Chemical'}
                      onChange={e => onUpdateItem(idx, 'item_type', e.target.value as 'Chemical' | 'Packaging')}
                      className={`w-full rounded-lg border py-1.5 px-2 text-[11px] font-bold outline-none cursor-pointer transition ${
                        isPackaging
                          ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}
                    >
                      <option value="Chemical">🧪 Raw Chemical</option>
                      <option value="Packaging">📦 Packaging Mat</option>
                    </select>
                  </td>

                  {/* Material / Component Name Searchable */}
                  <td className="p-2 w-[240px] relative">
                    <SearchableProductSelect
                      value={row.item_name}
                      onChange={(productName, product) => {
                        onUpdateItem(idx, 'item_name', productName);
                        if (product) {
                          if (product.item_sr_no) onUpdateItem(idx, 'item_code', product.item_sr_no);
                          if (product.uom) onUpdateItem(idx, 'uom', product.uom);
                          const cost = Number(product.purchase_price ?? product.cost_price ?? 0);
                          if (cost > 0) onUpdateItem(idx, 'unit_cost', cost);

                          // Populate loose configurations if product allows loose
                          if (product.allow_loose_sales || product.allow_loose) {
                            onUpdateItem(idx, 'allow_loose', true);
                            onUpdateItem(idx, 'loose_uom', product.loose_uom || (product.uom === 'LTR' || product.uom === 'Liters' ? 'ML' : 'GM'));
                            onUpdateItem(idx, 'loose_ratio', Number(product.loose_conversion_ratio || 1000));
                          }
                        }
                      }}
                      products={catalogProducts}
                      placeholder={
                        isPackaging
                          ? (isRTL ? 'بوتل، کیپ، لیبل تلاش کریں...' : 'Search Bottle, Pump, Cap, Label...')
                          : (isRTL ? 'کیمیکل / جزو تلاش کریں...' : 'Search Chemical / Ingredient...')
                      }
                      allowCustom={true}
                      priceType="purchase"
                      isRTL={isRTL}
                    />

                    {/* Loose Unit Quick Converter Badge */}
                    {hasLoose && (
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-300 font-mono">
                        <span className="font-bold">Loose:</span>
                        <span>
                          {(Number(row.quantity || 0) * ratio).toLocaleString()} {looseUom}
                        </span>
                        <span className="text-gray-400">({ratio} {looseUom}/{row.uom})</span>
                      </div>
                    )}
                  </td>

                  {/* Quantity with Loose Input Option */}
                  <td className="p-2 w-[120px]">
                    <div className="flex flex-col gap-1">
                      <input
                        type="number"
                        min="0.0001"
                        step="any"
                        required
                        value={row.quantity}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          onUpdateItem(idx, 'quantity', val);
                          if (hasLoose) {
                            onUpdateItem(idx, 'loose_quantity', Math.round(val * ratio));
                          }
                        }}
                        className="w-full rounded border border-stroke bg-white dark:bg-meta-4 py-1.5 px-2 font-mono text-center outline-none focus:border-primary dark:border-strokedark font-medium"
                      />
                      {hasLoose && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder={looseUom}
                            value={row.loose_quantity ?? Math.round(Number(row.quantity || 0) * ratio)}
                            onChange={e => {
                              const lVal = parseFloat(e.target.value) || 0;
                              onUpdateItem(idx, 'loose_quantity', lVal);
                              onUpdateItem(idx, 'quantity', Number((lVal / ratio).toFixed(4)));
                            }}
                            className="w-full text-[10px] font-mono text-center py-0.5 px-1 rounded border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 outline-none"
                            title={`Type loose in ${looseUom} to auto-convert to ${row.uom}`}
                          />
                          <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">{looseUom}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-2 w-[100px] relative">
                    <SearchableUomDropdown
                      value={row.uom}
                      onChange={val => onUpdateItem(idx, 'uom', val)}
                      uoms={allUomsList.length > 0 ? allUomsList : availableUoms}
                      compact={true}
                      isRTL={isRTL}
                    />
                  </td>

                  <td className="p-2 w-[115px]">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={row.unit_cost}
                      onChange={e =>
                        onUpdateItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded border border-stroke bg-white dark:bg-meta-4 py-1.5 px-2 font-mono text-center outline-none focus:border-primary dark:border-strokedark font-medium"
                    />
                  </td>

                  <td className="p-2 w-[85px]">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={row.wastage_percentage}
                      onChange={e =>
                        onUpdateItem(idx, 'wastage_percentage', parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded border border-stroke bg-white dark:bg-meta-4 py-1.5 px-2 font-mono text-center outline-none focus:border-primary dark:border-strokedark font-medium"
                      placeholder="0"
                    />
                  </td>

                  {/* Read-Only Explicit Line Total (PKR) column */}
                  <td
                    className={`p-2 w-[150px] font-mono font-bold bg-primary/5 dark:bg-primary/10 text-primary ${
                      isRTL ? 'text-left' : 'text-right'
                    }`}
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-extrabold">PKR {lineTotal.toLocaleString()}</span>
                      <span className="text-[9px] text-gray-400 font-normal">
                        ({row.quantity} × {row.unit_cost} + {row.wastage_percentage || 0}%)
                      </span>
                    </div>
                  </td>

                  <td className="p-2 w-[130px]">
                    <input
                      type="text"
                      placeholder={isRTL ? 'نوٹ...' : 'fragrance, grade...'}
                      value={row.notes || ''}
                      onChange={e => onUpdateItem(idx, 'notes', e.target.value)}
                      className="w-full rounded border border-stroke bg-white dark:bg-meta-4 py-1.5 px-2 outline-none focus:border-primary dark:border-strokedark text-xs"
                    />
                  </td>

                  <td className="p-2 w-[45px] text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItemRow(idx)}
                      className="p-1 text-gray-400 hover:text-danger rounded hover:bg-gray-100 dark:hover:bg-meta-4 cursor-pointer transition"
                      title={isRTL ? 'حذف کریں' : 'Remove row'}
                    >
                      <MdDelete className="text-base" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-stroke dark:border-strokedark">
        <button
          type="button"
          onClick={onAddItemRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-stroke px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary dark:border-strokedark dark:text-gray-300 cursor-pointer"
        >
          <MdAdd className="text-base" />
          <span>{isRTL ? '+ نئی قطار شامل کریں' : '+ Add Another Item'}</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-semibold text-black dark:text-white">
          <span>
            {isRTL ? 'کیمیکل:' : 'Chemical:'} <span className="font-mono text-blue-600 font-bold">PKR {chemicalTotal.toLocaleString()}</span>
          </span>
          <span>
            {isRTL ? 'پیکجنگ:' : 'Packaging:'} <span className="font-mono text-amber-600 font-bold">PKR {packagingTotal.toLocaleString()}</span>
          </span>
          <div className="h-4 w-px bg-stroke dark:bg-strokedark" />
          <span>
            {isRTL ? 'کل خام مال:' : 'Total Materials:'}{' '}
            <span className="font-mono text-primary text-sm font-extrabold">
              PKR {rawMaterialCost.toLocaleString()}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default BOMRawMaterialsTab;
