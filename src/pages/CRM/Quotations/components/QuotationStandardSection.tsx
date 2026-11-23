import { LooseChainBadge } from '../../../../utils/looseUomHelpers';
import React from 'react';
import { MdAdd, MdDeleteOutline, MdInventory2 } from 'react-icons/md';
import { formatStockWithBoxesAndPcs } from '../../../../utils/stockCalculator';
import { StandardItem } from '../types/quotationTypes';
import { UomCombobox } from './UomCombobox';

interface QuotationStandardSectionProps {
  standardItems: StandardItem[];
  nonTileProducts: any[];
  activeUomsList: string[];
  showDiscount: boolean;
  handleAddStandardItem: () => void;
  handleRemoveStandardItem: (index: number) => void;
  handleSelectStandardProduct: (prod: any, index: number) => void;
  handleStandardItemChange: (index: number, field: keyof StandardItem, value: any) => void;
  activeProdIndex: number | null;
  setActiveProdIndex: React.Dispatch<React.SetStateAction<number | null>>;
  highlightedProdIndex: number;
  setHighlightedProdIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const QuotationStandardSection: React.FC<QuotationStandardSectionProps> = ({
  standardItems,
  nonTileProducts,
  activeUomsList,
  showDiscount,
  handleAddStandardItem,
  handleRemoveStandardItem,
  handleSelectStandardProduct,
  handleStandardItemChange,
  activeProdIndex,
  setActiveProdIndex,
  highlightedProdIndex,
  setHighlightedProdIndex,
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary,#800020)] dark:text-rose-400 flex items-center gap-1.5">
            <MdInventory2 /> 2. Quoted Items &amp; Pricing
          </h3>
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
            ({standardItems.length} {standardItems.length === 1 ? 'item' : 'items'})
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stroke dark:border-strokedark shadow-2xs">
        <table className="w-full text-left text-xs min-w-[950px]">
          <thead>
            <tr className="bg-gray-100 dark:bg-meta-4/40 text-gray-700 dark:text-gray-300 font-bold">
              <th className="p-2.5 w-10 text-center">#</th>
              <th className="p-2.5 min-w-[260px]">Product Code / Description</th>
              <th className="p-2.5 min-w-[90px] text-center">UOM</th>
              <th className="p-2.5 min-w-[140px] text-center">Quantity</th>
              <th className="p-2.5 min-w-[130px] text-right">Rate (PKR)</th>
              {showDiscount && (
                <th className="p-2.5 min-w-[90px] text-right text-amber-700 dark:text-amber-400">
                  Disc %
                </th>
              )}
              <th className="p-2.5 min-w-[140px] text-right">Total (PKR)</th>
              <th className="p-2.5 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark">
            {standardItems.map((item, idx) => {
              const isCurrentActive = activeProdIndex === idx;
              const query = String(item.product_name || '').toLowerCase().trim();

              const filteredProducts = nonTileProducts.filter(p => {
                if (!query) return true;
                const name = String(p.product_name || '').toLowerCase();
                const sku = String(p.item_sr_no || '').toLowerCase();
                const cat = String(p.category || '').toLowerCase();
                return name.includes(query) || sku.includes(query) || cat.includes(query);
              });

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50/50 dark:hover:bg-meta-4/10 ${
                    isCurrentActive ? 'relative z-50' : ''
                  }`}
                >
                  <td className="p-2.5 text-center font-bold text-gray-400">{idx + 1}</td>

                  {/* Product Code / Description Searchable Autocomplete */}
                  <td className={`p-2.5 relative prod-dropdown-container ${isCurrentActive ? 'z-50' : ''}`}>
                    <div className="relative">
                      <input
                        type="text"
                        value={item.product_name}
                        onFocus={() => {
                          setActiveProdIndex(idx);
                          setHighlightedProdIndex(0);
                        }}
                        onChange={e => {
                          handleStandardItemChange(idx, 'product_name', e.target.value);
                          setActiveProdIndex(idx);
                          setHighlightedProdIndex(0);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHighlightedProdIndex(prev =>
                              prev < filteredProducts.length - 1 ? prev + 1 : 0
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightedProdIndex(prev =>
                              prev > 0 ? prev - 1 : filteredProducts.length - 1
                            );
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredProducts[highlightedProdIndex]) {
                              handleSelectStandardProduct(
                                filteredProducts[highlightedProdIndex],
                                idx
                              );
                            }
                          } else if (e.key === 'Escape') {
                            setActiveProdIndex(null);
                          }
                        }}
                        placeholder="Search by code or product description..."
                        className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden"
                      />

                      {isCurrentActive && filteredProducts.length > 0 && (
                        <div className="absolute left-0 top-full mt-1 z-99999 w-full min-w-[320px] max-w-[420px] max-h-56 overflow-y-auto rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-2xl divide-y divide-stroke dark:divide-strokedark ring-1 ring-black/10">
                          {filteredProducts.map((p, pIdx) => {
                            const price = Number(
                              p.retail_price ||
                                p.sale_price ||
                                p.sales_price ||
                                p.mrp ||
                                p.price ||
                                0
                            );
                            const isHighlighted = highlightedProdIndex === pIdx;
                            const isLoose = Boolean(
                              p.allow_loose_sales ||
                                (p.loose_conversion_ratio && p.loose_conversion_ratio > 1)
                            );

                            return (
                              <div
                                key={p.id}
                                onMouseDown={e => {
                                  e.preventDefault();
                                  handleSelectStandardProduct(p, idx);
                                }}
                                onMouseEnter={() => setHighlightedProdIndex(pIdx)}
                                className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                  isHighlighted
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-black dark:text-white font-bold'
                                    : 'hover:bg-gray-50 dark:hover:bg-meta-4/20 text-gray-700 dark:text-gray-200'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {p.item_sr_no && (
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-meta-4 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-strokedark shrink-0">
                                        {p.item_sr_no}
                                      </span>
                                    )}
                                    <span className="font-bold truncate">{p.product_name}</span>
                                    {p.category && (
                                      <span className="text-[10px] bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 px-1.5 py-0.2 rounded font-normal">
                                        {p.category}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                    <span>Code: {p.item_sr_no || `SKU-${p.id}`}</span>
                                    {isLoose && (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                        Loose Selling (1 {p.uom || 'Unit'} ={' '}
                                        {p.loose_conversion_ratio || 1} {p.loose_uom || 'Pcs'})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                    PKR {price.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Stock: {formatStockWithBoxesAndPcs(p.current_stock || 0, p).inlineText}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {item.sku_code && (
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                        <span className="font-bold text-gray-600 dark:text-gray-300">
                          Code: {item.sku_code}
                        </span>
                        {item.category && <span>• {item.category}</span>}
                      </div>
                    )}

                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={e => handleStandardItemChange(idx, 'notes', e.target.value)}
                      placeholder="Optional spec note (e.g. Master bath floor)"
                      className="w-full text-[11px] px-2 py-0.5 mt-1 rounded border border-transparent hover:border-stroke dark:hover:border-strokedark bg-transparent text-gray-500 italic focus:bg-white dark:focus:bg-boxdark focus:outline-hidden"
                    />
                  </td>

                  {/* UOM Column (Searchable & powered by active inventory UOMs) */}
                  <td className="p-2.5 text-center">
                    <UomCombobox
                      value={item.uom || item.unit || 'PCS'}
                      onChange={val => {
                        handleStandardItemChange(idx, 'uom', val);
                        handleStandardItemChange(idx, 'unit', val);
                      }}
                      activeUoms={activeUomsList}
                    />
                  </td>

                  {/* Quantity Column: Dual input for Allow Loose Selling items */}
                  <td className="p-2.5 min-w-[140px]">
                    {item.allow_loose_sales && item.loose_conversion_ratio > 1 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 justify-center">
                          {/* Bulk Input */}
                          <div className="flex items-center bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-md px-1.5 py-0.5 focus-within:border-primary shadow-xs">
                            <input
                              type="number"
                              min="0"
                              value={item.bulk_qty}
                              onChange={e => handleStandardItemChange(idx, 'bulk_qty', e.target.value)}
                              className="w-16 min-w-[50px] text-center font-bold text-xs bg-transparent text-black dark:text-white outline-hidden"
                            />
                            <span className="text-[10px] font-bold text-gray-500 pl-1 select-none">
                              {item.uom || 'DOZ'}
                            </span>
                          </div>

                          <span className="text-gray-400 font-black text-xs select-none">+</span>

                          {/* Loose Input */}
                          <div className="flex items-center bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-md px-1.5 py-0.5 focus-within:border-emerald-500 shadow-xs">
                            <input
                              type="number"
                              min="0"
                              max={item.loose_conversion_ratio - 1}
                              value={item.loose_qty}
                              onChange={e => handleStandardItemChange(idx, 'loose_qty', e.target.value)}
                              className="w-14 min-w-[45px] text-center font-bold text-xs bg-transparent text-emerald-600 dark:text-emerald-400 outline-hidden"
                            />
                            <span className="text-[10px] font-bold text-gray-500 pl-1 select-none">
                              {item.loose_uom || 'PCS'}
                            </span>
                          </div>
                        </div>

                        <div className="text-center font-mono text-[10px] text-gray-500 dark:text-gray-400">
                          Total: <strong>{item.qty}</strong> {item.uom} ({item.bulk_qty} {item.uom} +{' '}
                          {item.loose_qty} {item.loose_uom})
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.qty}
                          onChange={e => handleStandardItemChange(idx, 'qty', e.target.value)}
                          className="w-full min-w-[90px] text-center font-bold text-xs px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:outline-hidden font-mono"
                        />
                      </div>
                    )}
                  </td>

                  {/* Rate */}
                  <td className="p-2.5 text-right min-w-[130px]">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.rate}
                      onChange={e => handleStandardItemChange(idx, 'rate', e.target.value)}
                      className="w-full min-w-[105px] text-xs text-right font-bold px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:outline-hidden font-mono"
                    />
                  </td>

                  {/* Disc % */}
                  {showDiscount && (
                    <td className="p-2.5 text-right min-w-[90px]">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={item.discount_percent || 0}
                        onChange={e =>
                          handleStandardItemChange(idx, 'discount_percent', e.target.value)
                        }
                        className="w-full min-w-[75px] text-xs text-right px-2 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:outline-hidden font-mono"
                      />
                    </td>
                  )}

                  {/* Total */}
                  <td className="p-2.5 text-right font-black font-mono text-black dark:text-white min-w-[140px] whitespace-nowrap">
                    PKR {item.amount.toLocaleString()}
                  </td>

                  {/* Delete Action */}
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveStandardItem(idx)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="Remove Item"
                    >
                      <MdDeleteOutline size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Item Row Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleAddStandardItem}
          className="inline-flex items-center gap-1.5 bg-[var(--color-primary,#800020)] hover:opacity-90 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
        >
          <MdAdd size={16} />
          <span>Add Item</span>
        </button>
      </div>
    </div>
  );
};
