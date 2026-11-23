import React, { useState } from 'react';
import { FieldArray } from 'formik';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import WarehouseSelect from './WarehouseSelect';
import { GRNFormValues, LocationItem, ProductItem } from '../types/grnTypes';
import { isTileProduct, handleTileProductSelection, updateTileRowCalcs } from '../utils/grnHelpers';
import { formatStockWithBoxesAndPcs } from '../../../../utils/stockCalculator';

const blockInvalidChar = (e: React.KeyboardEvent) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault();

interface GRNTilesSectionProps {
  values: GRNFormValues;
  setFieldValue: (field: string, value: any) => void;
  locations: LocationItem[];
  productList: ProductItem[];
  getLocationStock: (productName: string, warehouseName: string) => number;
}

export const GRNTilesSection: React.FC<GRNTilesSectionProps> = ({
  values,
  setFieldValue,
  locations,
  productList,
  getLocationStock,
}) => {
  const [activeTileProdIndex, setActiveTileProdIndex] = useState<number | null>(null);
  const [highlightedTileProdIndex, setHighlightedTileProdIndex] = useState(0);

  if (!values.showTileSection) return null;

  const tileProducts = (productList || []).filter(p => isTileProduct(p));

  return (
    <div
      className={`border border-stroke dark:border-strokedark bg-white dark:bg-boxdark rounded-sm mb-6 relative ${
        activeTileProdIndex !== null ? 'z-30' : 'z-20'
      } overflow-visible pb-4 shadow-xs`}
    >
      <FieldArray name="tileItems">
        {({ push, remove }) => {
          const totalBoxesCount = (values.tileItems || []).reduce(
            (acc: number, t: any) => acc + Number(t.boxQty || 0),
            0
          );
          const totalLoosePcsCount = (values.tileItems || []).reduce(
            (acc: number, t: any) => acc + Number(t.loosePcs || 0),
            0
          );
          const totalSqmCount = (values.tileItems || []).reduce(
            (acc: number, t: any) => acc + Number(t.totalSqm || 0),
            0
          );

          return (
            <div className="w-full">
              {/* Header Bar */}
              <div className="p-3 bg-slate-50 dark:bg-meta-4/20 border-b border-stroke dark:border-strokedark flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-700 text-white font-mono text-[10px] font-black tracking-wider uppercase">
                    Tiles
                  </span>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    Tile Receipts (Boxes, Loose Pieces &amp; Sq. Mtr Inward)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  <span>
                    Boxes: <strong className="font-black text-black dark:text-white">{totalBoxesCount}</strong>
                  </span>
                  <span>
                    Pcs: <strong className="font-black text-black dark:text-white">{totalLoosePcsCount}</strong>
                  </span>
                  <span>
                    Total Sq.M:{' '}
                    <strong className="font-black text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded shadow-xs">
                      {totalSqmCount.toFixed(2)} m²
                    </strong>
                  </span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full table-auto border-collapse text-left">
                <thead className="bg-gray-100 dark:bg-meta-4/40 text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 border-b border-stroke dark:border-strokedark">
                  <tr>
                    <th className="p-3 w-10 text-center">S#</th>
                    <th className="p-3 min-w-[280px]">Tile Code / Description</th>
                    <th className="p-3 w-56">Receiving Warehouse</th>
                    <th className="p-3 w-32 text-center">Arrived Boxes</th>
                    <th className="p-3 w-28 text-center">Loose Pcs</th>
                    <th className="p-3 w-36 text-center">Total Sq.M</th>
                    <th className="p-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {(values.tileItems || []).map((tItem: any, tIdx: number) => {
                    const ppb = Number(tItem.piecesPerBox || 4);
                    const spb = Number(tItem.sqmPerBox || 1.44);

                    const filteredTileProds = tileProducts.filter((p: any) => {
                      if (!tItem.itemName) return true;
                      const q = String(tItem.itemName || '').toLowerCase().trim();
                      const sku = String(p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                      const pName = String(p.product_name || '').toLowerCase();
                      const cat = String(p.category || '').toLowerCase();
                      return sku.includes(q) || pName.includes(q) || cat.includes(q);
                    });

                    const isCurrentProdActive = activeTileProdIndex === tIdx;

                    return (
                      <tr
                        key={tItem.id || tIdx}
                        className={`text-xs transition ${
                          isCurrentProdActive
                            ? 'relative z-50 bg-slate-100/80 dark:bg-meta-4/40'
                            : 'relative z-10 bg-white/70 dark:bg-boxdark/70 hover:bg-slate-50/50 dark:hover:bg-meta-4/10'
                        }`}
                      >
                        <td className="p-3 text-center text-gray-400 font-sans">{tIdx + 1}</td>

                        {/* Merged Tile Code / Description Searchable Dropdown */}
                        <td className="p-3 relative tile-prod-container w-80 min-w-[280px]">
                          <div className="relative">
                            <input
                              type="text"
                              autoComplete="off"
                              value={tItem.itemName || ''}
                              onFocus={() => {
                                setActiveTileProdIndex(tIdx);
                                setHighlightedTileProdIndex(0);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setHighlightedTileProdIndex((prev) =>
                                    prev < filteredTileProds.length - 1 ? prev + 1 : 0
                                  );
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setHighlightedTileProdIndex((prev) =>
                                    prev > 0 ? prev - 1 : filteredTileProds.length - 1
                                  );
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (filteredTileProds[highlightedTileProdIndex]) {
                                    handleTileProductSelection(
                                      filteredTileProds[highlightedTileProdIndex],
                                      tIdx,
                                      tItem,
                                      setFieldValue
                                    );
                                    setActiveTileProdIndex(null);
                                  }
                                } else if (e.key === 'Escape' || e.key === 'Tab') {
                                  setActiveTileProdIndex(null);
                                }
                              }}
                              onChange={(e) => {
                                setFieldValue(`tileItems.${tIdx}.itemName`, e.target.value);
                                setActiveTileProdIndex(tIdx);
                                setHighlightedTileProdIndex(0);
                              }}
                              placeholder="Search by code or tile description..."
                              className="w-full rounded border border-stroke dark:border-strokedark p-2 text-xs bg-white dark:bg-boxdark font-bold outline-none text-black dark:text-white focus:border-primary shadow-xs"
                            />
                            {tItem.skuCode && (
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                Code: <span className="font-bold text-slate-600 dark:text-slate-300">{tItem.skuCode}</span>
                              </div>
                            )}
                            {isCurrentProdActive && (
                              <div className="absolute left-0 top-full mt-1 z-[999999] min-w-[360px] max-w-[460px] max-h-60 overflow-y-auto bg-white dark:bg-[#1A222C] border border-stroke dark:border-strokedark rounded-lg shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredTileProds.length > 0 ? (
                                  filteredTileProds.map((prod: any, pIdx: number) => {
                                    const stockStr = formatStockWithBoxesAndPcs(prod.current_stock || 0, prod).inlineText;
                                    const displaySku = prod.item_sr_no || `SKU-${prod.id}`;
                                    const isHighlighted = highlightedTileProdIndex === pIdx;
                                    const piecesBox = prod.loose_conversion_ratio || prod.pieces_per_box || 4;
                                    return (
                                      <div
                                        key={prod.id}
                                        onMouseEnter={() => setHighlightedTileProdIndex(pIdx)}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleTileProductSelection(prod, tIdx, tItem, setFieldValue);
                                          setActiveTileProdIndex(null);
                                        }}
                                        className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                          isHighlighted
                                            ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-primary text-black dark:text-white font-bold'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                                        }`}
                                      >
                                        <div className="min-w-0 pr-2">
                                          <span className="font-bold block truncate max-w-[210px]">{prod.product_name}</span>
                                          <span className="text-[10px] opacity-80 block font-mono text-slate-500">
                                            Code: {displaySku} • {prod.sub_sub_category || prod.category || 'TILES'}
                                          </span>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end">
                                          {prod.purchase_price ? (
                                            <span className="font-mono font-bold block text-emerald-600 dark:text-emerald-400">
                                              Rs. {Number(prod.purchase_price || 0).toLocaleString()}
                                            </span>
                                          ) : null}
                                          <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[10px] opacity-75">{piecesBox} pcs/bx</span>
                                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                              Stock: {stockStr}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="p-3 text-center text-xs text-slate-400 italic">No matching tile found</div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Receiving Warehouse */}
                        <td className="p-3 w-52">
                          <WarehouseSelect
                            locations={locations}
                            selectedWarehouse={tItem.warehouseName || ''}
                            onSelect={(wh) => setFieldValue(`tileItems.${tIdx}.warehouseName`, wh)}
                            productName={tItem.itemName}
                            getLocationStock={getLocationStock}
                          />
                        </td>

                        {/* Arrived Boxes */}
                        <td className="p-3 w-32 text-center">
                          <input
                            type="number"
                            min="0"
                            onKeyDown={blockInvalidChar}
                            value={tItem.boxQty ?? 0}
                            onChange={(e) =>
                              updateTileRowCalcs('boxQty', Math.max(0, Number(e.target.value) || 0), tIdx, tItem, setFieldValue)
                            }
                            className="w-full text-center font-black font-mono bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs text-black dark:text-white outline-none focus:border-primary shadow-xs"
                          />
                        </td>

                        {/* Loose Pcs */}
                        <td className="p-3 w-28 text-center">
                          <input
                            type="number"
                            min="0"
                            onKeyDown={blockInvalidChar}
                            value={tItem.loosePcs ?? 0}
                            onChange={(e) =>
                              updateTileRowCalcs('loosePcs', Math.max(0, Number(e.target.value) || 0), tIdx, tItem, setFieldValue)
                            }
                            className="w-full text-center font-black font-mono bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs text-black dark:text-white outline-none focus:border-primary shadow-xs"
                          />
                        </td>

                        {/* Total Sq.M */}
                        <td className="p-3 w-36 text-center">
                          <span className="font-mono font-black text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-meta-4/30 px-3 py-1.5 rounded border border-stroke dark:border-strokedark block text-center shadow-xs">
                            {Number(tItem.totalSqm || 0).toFixed(2)} m²
                          </span>
                        </td>

                        {/* Delete Row */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => remove(tIdx)}
                            className="text-gray-400 hover:text-danger transition cursor-pointer"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="p-3 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    push({
                      id: `tile-${Date.now()}`,
                      itemName: '',
                      skuCode: '',
                      warehouseName: '',
                      boxQty: 1,
                      loosePcs: 0,
                      totalSqm: 1.44,
                      piecesPerBox: 4,
                      sqmPerBox: 1.44,
                    })
                  }
                  className="inline-flex items-center gap-1 bg-slate-900 dark:bg-slate-700 text-white font-bold py-1.5 px-3 rounded text-xs hover:bg-slate-800 dark:hover:bg-slate-600 transition cursor-pointer shadow-xs"
                >
                  <FiPlus size={12} /> Append Tile Row
                </button>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  * Cross-calculates boxes, loose pieces &amp; sq.m automatically with your tile box specifications
                </span>
              </div>
            </div>
          );
        }}
      </FieldArray>
    </div>
  );
};
