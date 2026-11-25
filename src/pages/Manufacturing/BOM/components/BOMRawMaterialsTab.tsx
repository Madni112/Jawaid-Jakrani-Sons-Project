import React, { useMemo } from 'react';
import { MdPrecisionManufacturing, MdLayers, MdAdd, MdDelete, MdScience, MdInventory2 } from 'react-icons/md';
import SearchableProductSelect from '../../../../components/SearchableProductSelect';
import SearchableUomDropdown from '../../../../components/SearchableUomDropdown';
import { BomItem } from '../types/bomTypes';
import ChainedUomInputGrid from '../../../../components/ChainedUomInputGrid';
import { LooseChainBadge, decomposeStockForActiveUoms } from '../../../../utils/looseUomHelpers';

interface BOMRawMaterialsTabProps {
  isRTL: boolean;
  uom: string;
  batchQuantity: number;
  setBatchQuantity: (qty: number) => void;
  items: BomItem[];
  catalogProducts: any[];
  stockMap?: Record<string, number>;
  allUomsList: any[];
  availableUoms: string[];
  rawMaterialCost: number;
  onAddItemRow: () => void;
  onRemoveItemRow: (idx: number) => void;
  onUpdateItem: (idx: number, field: keyof BomItem | Partial<BomItem>, val?: any) => void;
}

export const BOMRawMaterialsTab: React.FC<BOMRawMaterialsTabProps> = ({
  isRTL,
  uom,
  batchQuantity,
  setBatchQuantity,
  items,
  catalogProducts,
  stockMap = {},
  allUomsList,
  availableUoms,
  rawMaterialCost,
  onAddItemRow,
  onRemoveItemRow,
  onUpdateItem
}) => {
  const [rowActiveUoms, setRowActiveUoms] = React.useState<Record<number, string[]>>({});
  const effectiveBatchQty = Number(batchQuantity) > 0 ? Number(batchQuantity) : 1;

  // Categorize breakdown: Chemical / Bulk vs Packaging Material (scaled by Batch Production Quantity)
  const chemicalTotal = useMemo(() => {
    return Math.round(
      items
        .filter(it => it.item_type !== 'Packaging')
        .reduce((sum, it) => sum + (Number(it.total_cost) || 0) * effectiveBatchQty, 0) * 100
    ) / 100;
  }, [items, effectiveBatchQty]);

  const packagingTotal = useMemo(() => {
    return Math.round(
      items
        .filter(it => it.item_type === 'Packaging')
        .reduce((sum, it) => sum + (Number(it.total_cost) || 0) * effectiveBatchQty, 0) * 100
    ) / 100;
  }, [items, effectiveBatchQty]);

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
                ? `نیچے دیے گئے خام کیمیکلز اور پیکجنگ سامان کی مقدار فی 1 یونٹ (${uom}) کے حساب سے درج کریں — کل بیچ خودکار ضرب ہو جائے گا۔`
                : `Enter each raw ingredient & packaging quantity per 1 ${uom || 'unit'} below — totals & stock checks scale automatically by this batch size.`}
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-3.5 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
        >
          <MdAdd className="text-base shrink-0" />
          <span>{isRTL ? '+ نیا آئٹم شامل کریں' : 'Add Material Item'}</span>
        </button>
      </div>

      {/* Cost Split Badges Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-meta-4/30 border border-slate-200/80 dark:border-strokedark">
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-boxdark rounded-lg border border-slate-200 dark:border-strokedark shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shrink-0">
              <MdScience size={15} />
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
              {isRTL ? 'بلک کیمیکل لاگت:' : 'Bulk Liquid Chemical:'}
            </span>
          </div>
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0">
            PKR {chemicalTotal.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-boxdark rounded-lg border border-slate-200 dark:border-strokedark shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">
              <MdInventory2 size={15} />
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
              {isRTL ? 'پیکجنگ سامان لاگت:' : 'Packaging Materials:'}
            </span>
          </div>
          <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap shrink-0">
            PKR {packagingTotal.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/30 shadow-2xs">
          <span className="text-xs font-bold text-primary truncate">
            {isRTL ? 'کل مشترکہ لاگت:' : 'Combined Materials Total:'}
          </span>
          <span className="font-mono font-extrabold text-sm text-primary whitespace-nowrap shrink-0">
            PKR {rawMaterialCost.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[300px] pb-32">
        <table className="w-full min-w-[1240px] table-fixed text-xs">
          <thead>
            <tr className="bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 uppercase font-semibold">
              <th className={`p-2.5 ${isRTL ? 'text-right' : 'text-left'} w-[140px]`}>
                {isRTL ? 'قسم (Type)' : 'Category / Type'}
              </th>
              <th className={`p-2.5 ${isRTL ? 'text-right' : 'text-left'} w-[230px]`}>
                {isRTL ? 'خام مال / جزو *' : 'Material / Component Name *'}
              </th>
              <th className="p-2.5 text-center w-[150px] bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                {isRTL ? 'موجودہ اسٹاک' : 'Available Stock'}
              </th>
              <th className="p-2.5 text-center w-[310px]">
                {isRTL ? 'مقدار (UOM) *' : 'Quantity (UOM) *'}
              </th>
              <th className="p-2.5 text-center w-[100px]">
                {isRTL ? 'فی اکائی قیمت (Cost)' : 'Unit Cost (PKR)'}
              </th>
              <th className="p-2.5 text-center w-[70px]">
                {isRTL ? 'ضیاع (Waste%)' : 'Waste %'}
              </th>
              <th className={`p-2.5 ${isRTL ? 'text-left' : 'text-right'} w-[130px] bg-primary/5 dark:bg-primary/10 text-primary font-bold`}>
                {isRTL ? 'لائن ٹوٹل (Line Total PKR)' : 'Line Total (PKR)'}
              </th>
              <th className={`p-2.5 ${isRTL ? 'text-right' : 'text-left'} w-[105px]`}>
                {isRTL ? 'تفصیل / نوٹس' : 'Notes / Specs'}
              </th>
              <th className="p-2.5 text-center w-[40px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark">
            {items.map((row, idx) => {
              const isPackaging = row.item_type === 'Packaging';
              const lineTotal = Number(row.total_cost || 0);
              const ratio = Number(row.loose_ratio || 0);
              const looseUom = row.loose_uom || '';
              const hasLoose = Boolean(row.allow_loose && ratio > 1 && looseUom);
              const matchedProduct = catalogProducts.find(
                p => String(p.product_name || '').trim().toLowerCase() === String(row.item_name || '').trim().toLowerCase()
              );
              const itemKey = String(row.item_name || '').trim().toLowerCase();
              const availStock = itemKey
                ? (stockMap[itemKey] !== undefined ? stockMap[itemKey] : Number(matchedProduct?.current_stock || 0))
                : 0;

              return (
                <tr key={row.id || idx} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors align-top">
                  {/* Item Type: Chemical vs Packaging */}
                  <td className="p-2 w-[140px]">
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
                  <td className="p-2 w-[230px] relative">
                    <SearchableProductSelect
                      value={row.item_name}
                      onChange={(productName, product) => {
                        const updates: Partial<BomItem> = {
                          item_name: productName
                        };

                        if (product) {
                          if (product.item_sr_no) updates.item_code = product.item_sr_no;
                          if (product.uom) updates.uom = product.uom;
                          const cost = Number(product.purchase_price ?? product.cost_price ?? 0);
                          if (cost > 0) updates.unit_cost = cost;

                          // Populate loose configurations if product allows loose
                          const isLooseAllowed = Boolean((product as any).allow_loose_sales || (product as any).allow_loose);
                          const multiUnits = (product as any).multi_loose_units || [];
                          if (isLooseAllowed || (Array.isArray(multiUnits) && multiUnits.length > 0)) {
                            const ratio = Number((product as any).loose_conversion_ratio || 1000);
                            const looseUnit = (product as any).loose_uom || (product.uom === 'LTR' || product.uom === 'Liters' ? 'ML' : 'GM');
                            updates.allow_loose = true;
                            updates.loose_uom = looseUnit;
                            updates.loose_ratio = ratio;
                            updates.multi_loose_units = Array.isArray(multiUnits) && multiUnits.length > 0 ? multiUnits : [
                              { uom: looseUnit, ratio: ratio, costPrice: (product as any).loose_purchase_price, salePrice: (product as any).loose_sale_price }
                            ];
                            updates.loose_quantity = Math.round(Number(row.quantity || 1) * ratio);
                          } else {
                            updates.allow_loose = false;
                            updates.loose_uom = undefined;
                            updates.loose_ratio = undefined;
                            updates.loose_quantity = undefined;
                            updates.multi_loose_units = [];
                          }
                        }

                        onUpdateItem(idx, updates);
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

                    {/* Compact Theme-Synced Loose Chain Badge */}
                    {(hasLoose || (Array.isArray(row.multi_loose_units) && row.multi_loose_units.length > 0)) && (
                      <div className="mt-1.5">
                        <LooseChainBadge
                          product={{
                            uom: row.uom,
                            allow_loose: true,
                            loose_uom: row.loose_uom,
                            loose_conversion_ratio: row.loose_ratio,
                            multi_loose_units: row.multi_loose_units,
                          }}
                        />
                      </div>
                    )}
                  </td>

                  {/* Available Stock (Linked to active UOMs in Quantity column, matching Sales Invoice) */}
                  <td className="p-2 w-[150px] text-center bg-emerald-50/30 dark:bg-emerald-950/10">
                    {!row.item_name ? (
                      <span className="text-[11px] text-slate-400 font-mono">—</span>
                    ) : (() => {
                      const hasLooseGrid = hasLoose || (Array.isArray(row.multi_loose_units) && row.multi_loose_units.length > 0);
                      const batchConsumedQty = Number(row.quantity || 0) * effectiveBatchQty;
                      const isOverStock = batchConsumedQty > availStock;
                      const prodForDecomp = matchedProduct || {
                        uom: row.uom || 'PCS',
                        loose_uom: row.loose_uom,
                        loose_conversion_ratio: row.loose_ratio,
                        multi_loose_units: row.multi_loose_units,
                      };
                      const baseUomLabel = row.uom || matchedProduct?.uom || 'PCS';

                      if (hasLooseGrid) {
                        const activeUomsForRow =
                          rowActiveUoms[idx] && rowActiveUoms[idx].length > 0
                            ? rowActiveUoms[idx]
                            : [baseUomLabel];
                        const parts = decomposeStockForActiveUoms(
                          availStock,
                          activeUomsForRow,
                          prodForDecomp
                        );
                        const primaryPart = parts[0];
                        const subParts = parts.slice(1);

                        return (
                          <div className="flex flex-col items-center justify-center font-mono gap-0.5">
                            <span
                              className={`font-black text-xs ${
                                isOverStock || availStock <= 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {primaryPart
                                ? `${primaryPart.qty.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${primaryPart.uom}`
                                : `${availStock.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${baseUomLabel}`}
                            </span>
                            {subParts.length > 0 && (
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {subParts.map((sp, sIdx) => (
                                  <span
                                    key={sIdx}
                                    style={{
                                      backgroundColor:
                                        sp.qty > 0
                                          ? 'color-mix(in srgb, var(--color-primary, #0D1540) 12%, transparent)'
                                          : 'color-mix(in srgb, var(--color-primary, #0D1540) 5%, transparent)',
                                      borderColor:
                                        sp.qty > 0
                                          ? 'color-mix(in srgb, var(--color-primary, #0D1540) 28%, transparent)'
                                          : 'color-mix(in srgb, var(--color-primary, #0D1540) 15%, transparent)',
                                      color: 'var(--color-primary, #0D1540)',
                                    }}
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                      sp.qty === 0 ? 'opacity-65' : ''
                                    }`}
                                  >
                                    +{sp.qty.toLocaleString(undefined, { maximumFractionDigits: 4 })} {sp.uom}
                                  </span>
                                ))}
                              </div>
                            )}
                            <span className="text-[9.5px] font-sans text-slate-400 dark:text-slate-500">
                              Overall Stock
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col items-center justify-center font-mono">
                          <span
                            className={`font-black text-xs ${
                              isOverStock || availStock <= 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {availStock.toLocaleString(undefined, { maximumFractionDigits: 4 })} {baseUomLabel}
                          </span>
                          <span className="text-[9.5px] font-sans text-slate-400 dark:text-slate-500">
                            Overall Stock
                          </span>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Quantity with Chained Dynamic Multi-Tier UOM Grid */}
                  <td className="p-2 w-[310px] align-top">
                    <ChainedUomInputGrid
                      primaryUom={row.uom || 'Unit'}
                      primaryQuantity={Number(row.quantity) || 0}
                      primaryRate={Number(row.unit_cost) || 0}
                      tiers={row.multi_loose_units || (hasLoose ? [{ uom: looseUom, ratio: ratio }] : [])}
                      tierQuantities={row.tier_quantities}
                      tierRates={row.tier_rates}
                      mode="purchase"
                      onActiveUomsChange={(uoms) => {
                        setRowActiveUoms(prev => {
                          const existing = prev[idx];
                          if (existing && existing.length === uoms.length && existing.every((v, i) => v === uoms[i])) {
                            return prev;
                          }
                          return { ...prev, [idx]: uoms };
                        });
                      }}
                      onChange={({ primaryQuantity, tierQuantities, tierRates, totalConvertedPrimaryQty, totalLineAmount }) => {
                        const waste = Number(row.wastage_percentage) || 0;
                        const wasteMultiplier = 1 + (waste / 100);
                        const calculatedLineCost = Math.round(totalLineAmount * wasteMultiplier * 100) / 100;
                        
                        onUpdateItem(idx, {
                          quantity: totalConvertedPrimaryQty,
                          tier_quantities: tierQuantities,
                          tier_rates: tierRates,
                          total_cost: calculatedLineCost
                        });
                      }}
                    />
                  </td>

                  <td className="p-2 w-[100px]">
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

                  <td className="p-2 w-[70px]">
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

                  {/* Read-Only Explicit Line Total (PKR) column (scaled by batch size) */}
                  <td
                    className={`p-2 w-[130px] font-mono font-bold bg-primary/5 dark:bg-primary/10 text-primary ${
                      isRTL ? 'text-left' : 'text-right'
                    }`}
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-extrabold">
                        PKR {(Math.round(lineTotal * effectiveBatchQty * 100) / 100).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-gray-400 font-normal">
                        {effectiveBatchQty > 1
                          ? `(PKR ${lineTotal.toLocaleString()} × ${effectiveBatchQty} ${uom || 'batch'})`
                          : `(${row.quantity} × ${row.unit_cost} + ${row.wastage_percentage || 0}%)`}
                      </span>
                    </div>
                  </td>

                  <td className="p-2 w-[105px]">
                    <input
                      type="text"
                      placeholder={isRTL ? 'نوٹ...' : 'fragrance, grade...'}
                      value={row.notes || ''}
                      onChange={e => onUpdateItem(idx, 'notes', e.target.value)}
                      className="w-full rounded border border-stroke bg-white dark:bg-meta-4 py-1.5 px-2 outline-none focus:border-primary dark:border-strokedark text-xs"
                    />
                  </td>

                  <td className="p-2 w-[40px] text-center">
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
