import WarehouseSearchableSelect from './WarehouseSearchableSelect';
import { DropdownPortal } from './DropdownPortal';
import { toast } from 'react-hot-toast';
import { formatStockWithBoxesAndPcs } from '../../../../utils/stockCalculator';
import React, { useRef } from 'react';
import { FieldArray } from 'formik';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { MdAdd } from 'react-icons/md';

interface SalesReturnTileItemsTableProps {
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  activeTileProdIndex: number | null;
  setActiveTileProdIndex: (idx: number | null) => void;
  activeTileWhIndex: number | null;
  setActiveTileWhIndex: (idx: number | null) => void;
  highlightedTileProdIndex: number;
  setHighlightedTileProdIndex: React.Dispatch<React.SetStateAction<number>>;
  customerSoldProducts: any[];
  productList: any[];
  locations: any[];
  isTileProduct: (p: any) => boolean;
  handleTileReturnProductSelection: (
    selectedProduct: any,
    tIdx: number,
    chosenWarehouse: string,
    setFieldValue: any,
    currentTileItem?: any
  ) => Promise<void>;
  handleTileItemChange: (
    tIdx: number,
    field: 'boxQty' | 'loosePcs' | 'pricePerBox' | 'pricePerSqm' | 'pricePerPiece' | 'totalSqm',
    val: any,
    tileItems: any[],
    setFieldValue: any
  ) => void;
  blockInvalidChar: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  formatMoney: (val: number) => string;
  getItemWarehouseStock: (productName: string, warehouseName: string, skuCode?: string) => number;
  getProductOverallStock?: (prodOrItem: any) => number;
  getMaxReturnable: (itemName: string, skuCode?: string) => number | null;
  selectedInvNo: string;
}

export const SalesReturnTileItemsTable: React.FC<SalesReturnTileItemsTableProps> = ({
  values,
  setFieldValue,
  activeTileProdIndex,
  setActiveTileProdIndex,
  activeTileWhIndex,
  setActiveTileWhIndex,
  highlightedTileProdIndex,
  setHighlightedTileProdIndex,
  customerSoldProducts,
  productList,
  locations,
  isTileProduct,
  handleTileReturnProductSelection,
  handleTileItemChange,
  blockInvalidChar,
  formatMoney,
  getItemWarehouseStock,
  getProductOverallStock,
  getMaxReturnable,
  selectedInvNo,
}) => {
  const tileProdRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  if (!values.showTileSection) return null;

  return (

                  <div className={`rounded-2xl border border-amber-300 dark:border-amber-700/80 bg-white dark:bg-boxdark p-5 shadow-xs space-y-4 overflow-visible relative ${activeTileProdIndex !== null || activeTileWhIndex !== null ? 'z-30' : 'z-20'}`}>
                    <FieldArray name="tileItems">
                      {({ push, remove }) => {
                        const tileTotalSum = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.totalAmount || 0)), 0);
                        const totalBoxesCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.boxQty || 0)), 0);
                        const totalLoosePcsCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.loosePcs || 0)), 0);
                        const totalSqmCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.totalSqm || 0)), 0);

                        return (
                          <div className="w-full">
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200 dark:border-amber-800/60">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px] font-black tracking-wider uppercase">
                                  Tiles
                                </span>
                                <div>
                                  <span className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                    Tile Return Items (Boxes, Loose Pieces & Sq. Mtr Return)
                                  </span>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Multi-dimensional tile returns with automatic box, piece, and area conversions
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                <span>Boxes: <strong className="font-black text-slate-900 dark:text-white">{totalBoxesCount}</strong></span>
                                <span>Pcs: <strong className="font-black text-slate-900 dark:text-white">{totalLoosePcsCount}</strong></span>
                                <span>Sq.M: <strong className="font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">{totalSqmCount.toFixed(2)} m²</strong></span>
                                <span className="text-emerald-700 dark:text-emerald-400 font-black text-sm">
                                  Total Tiles: Rs. {formatMoney(tileTotalSum)}
                                </span>
                              </div>
                            </div>

                            <div className="overflow-x-auto min-h-[140px] mt-3">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-amber-50/70 dark:bg-amber-950/20 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800/50">
                                    <th className="p-2.5 w-8 text-center">S#</th>
                                    <th className="p-2.5 min-w-[240px]">Tile Product (NAME / CODE)</th>
                                    <th className="p-2.5 w-40">Return Warehouse</th>
                                    <th className="p-2.5 w-24 text-center">Return Qty (Box)</th>
                                    <th className="p-2.5 w-24 text-center">Return Pcs (Loose)</th>
                                    <th className="p-2.5 w-28 text-right">Rate (Per Box)</th>
                                    <th className="p-2.5 w-28 text-right">Rate (Per Sq. Mtr)</th>
                                    <th className="p-2.5 w-28 text-right">Rate (Per Piece)</th>
                                    <th className="p-2.5 w-32 text-right pr-3 font-mono">Net Total</th>
                                    <th className="p-2.5 w-8 text-center"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100/60 dark:divide-amber-900/30">
                                  {(values.tileItems || []).map((tItem: any, tIdx: number) => {
                                    const isCurrentProdActive = activeTileProdIndex === tIdx;
                                    const pcsPerBox = Math.max(1, Number(tItem.piecesPerBox) || 4);
                                    const sqmPerBox = Math.max(0.01, Number(tItem.sqmPerBox) || 1.44);
                                    const itemLineSqm = Number(tItem.totalSqm) > 0
                                      ? Number(tItem.totalSqm)
                                      : Number(((Number(tItem.boxQty || 0) * sqmPerBox) + ((Number(tItem.loosePcs || 0) / pcsPerBox) * sqmPerBox)).toFixed(2));

                                    const checkIsTile = (p: any) => {
                                      if (!p) return false;
                                      if (p.isTileItem) return true;
                                      const matched = productList.find(pr =>
                                        (p.product_name && (pr.product_name || '').toLowerCase() === (p.product_name || '').toLowerCase()) ||
                                        (p.item_sr_no && (pr.item_sr_no || '').toLowerCase() === (p.item_sr_no || '').toLowerCase())
                                      );
                                      const target = matched || p;
                                      return isTileProduct(target);
                                    };

                                    const soldTileProducts = customerSoldProducts.filter(p => checkIsTile(p));
                                    const exactTileSelected = soldTileProducts.some((p: any) => String(p.product_name || '').toLowerCase().trim() === String(tItem.itemName || '').toLowerCase().trim());
                                    const tileSearch = exactTileSelected ? '' : (tItem.itemName || '').toLowerCase().trim();

                                    const combinedTileList = soldTileProducts.map(p => ({ ...p, isSoldToCustomer: true }));

                                    const filteredTileProds = combinedTileList.filter((p: any) => {
                                      if (!tileSearch) return true;
                                      return (
                                        (p.product_name && p.product_name.toLowerCase().includes(tileSearch)) ||
                                        (p.item_sr_no && p.item_sr_no.toLowerCase().includes(tileSearch)) ||
                                        (`sku-${p.id}`.toLowerCase().includes(tileSearch))
                                      );
                                    });

                                    const matchedTileProd = productList.find(p => (p.product_name || '').toLowerCase() === (tItem.itemName || '').toLowerCase() || (tItem.skuCode && (p.item_sr_no || '').toLowerCase() === (tItem.skuCode || '').toLowerCase()));
                                    const enteredBoxes = Number(tItem.boxQty || 0) + (Number(tItem.loosePcs || 0) / pcsPerBox);
                                    const maxRet = getMaxReturnable(tItem.itemName, tItem.skuCode);
                                    const isExceeded = maxRet !== null && Boolean(tItem.itemName) && enteredBoxes > maxRet + 0.0001;
                                    const whStock = tItem.itemName ? getItemWarehouseStock(tItem.itemName, tItem.warehouse || values.sourceWarehouse, tItem.skuCode) : 0;

                                    return (
                                      <tr key={tItem.id || tIdx} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                                        {/* S# */}
                                        <td className="p-2.5 text-center font-bold text-slate-400">
                                          {tIdx + 1}
                                        </td>

                                        {/* Tile Product Autocomplete */}
                                        <td className="p-2.5 relative tile-prod-container">
                                          <div className="relative">
                                            <input
                                              ref={(el) => {
                                                tileProdRefs.current[tIdx] = el;
                                              }}
                                              type="text"
                                              value={tItem.itemName || ''}
                                              onFocus={() => {
                                                setActiveTileProdIndex(tIdx);
                                                setHighlightedTileProdIndex(0);
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'ArrowDown') {
                                                  e.preventDefault();
                                                  if (filteredTileProds.length === 0) return;
                                                  setHighlightedTileProdIndex(prev => prev < filteredTileProds.length - 1 ? prev + 1 : 0);
                                                } else if (e.key === 'ArrowUp') {
                                                  e.preventDefault();
                                                  if (filteredTileProds.length === 0) return;
                                                  setHighlightedTileProdIndex(prev => prev > 0 ? prev - 1 : filteredTileProds.length - 1);
                                                } else if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  if (filteredTileProds.length > 0) {
                                                    const sel = filteredTileProds[highlightedTileProdIndex] || filteredTileProds[0];
                                                    handleTileReturnProductSelection(sel, tIdx, values.sourceWarehouse, setFieldValue, tItem);
                                                    setActiveTileProdIndex(null);
                                                  }
                                                } else if (e.key === 'Tab' || e.key === 'Escape') {
                                                  setActiveTileProdIndex(null);
                                                }
                                              }}
                                              onChange={(e) => {
                                                const typed = e.target.value;
                                                setFieldValue(`tileItems.${tIdx}.itemName`, typed);
                                                setActiveTileProdIndex(tIdx);
                                                setHighlightedTileProdIndex(0);

                                                const match = combinedTileList.find(p => p.product_name && p.product_name.toLowerCase() === typed.trim().toLowerCase());
                                                if (match) {
                                                  handleTileReturnProductSelection(match, tIdx, values.sourceWarehouse, setFieldValue, tItem);
                                                }
                                              }}
                                              placeholder="Search tile product..."
                                              className="w-full bg-white dark:bg-boxdark font-bold border border-slate-200 dark:border-slate-700 rounded-lg p-2 pr-7 outline-none text-xs text-slate-900 dark:text-white focus:border-amber-500 shadow-xs"
                                            />

                                            {Boolean(tItem.itemName || tItem.skuCode) && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleTileReturnProductSelection(null, tIdx, values.sourceWarehouse, setFieldValue, tItem);
                                                  setActiveTileProdIndex(null);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
                                                title="Deselect Tile Product"
                                              >
                                                <FiX className="w-3.5 h-3.5" />
                                              </button>
                                            )}

                                            {tItem.skuCode && (
                                              <div className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                                                Code: {tItem.skuCode} • Packing: {pcsPerBox} pcs/box {tItem.sqmPerBox ? `(${tItem.sqmPerBox} m²)` : ''}
                                              </div>
                                            )}

                                            <DropdownPortal
                                              isOpen={Boolean(isCurrentProdActive && filteredTileProds.length > 0)}
                                              anchorEl={tileProdRefs.current[tIdx]}
                                              minWidth={380}
                                              maxWidth={460}
                                            >
                                              <div className="w-full max-h-[260px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                                                {filteredTileProds.map((p, pIdx) => {
                                                  const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                                  const isHighlighted = pIdx === highlightedTileProdIndex;
                                                  const pPcsPerBox = Number(p.pieces_per_box || p.pcs_per_box || 4);
                                                  const displayPrice = Number(p.sale_price ?? p.retail_price ?? p.sales_price ?? p.price ?? 0);

                                                  return (
                                                    <div
                                                      key={p.id}
                                                      onMouseEnter={() => setHighlightedTileProdIndex(pIdx)}
                                                      onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleTileReturnProductSelection(p, tIdx, values.sourceWarehouse, setFieldValue, tItem);
                                                        setActiveTileProdIndex(null);
                                                      }}
                                                      className={`p-2.5 cursor-pointer transition flex items-center justify-between ${isHighlighted ? 'bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 text-slate-900 dark:text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
                                                    >
                                                      <div className="flex flex-col text-left pr-2">
                                                        <div className="flex items-center gap-1.5">
                                                          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                                            {p.product_name}
                                                          </span>
                                                          {p.isSoldToCustomer && (
                                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                              Sold
                                                            </span>
                                                          )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 font-mono">
                                                          {displaySku} • {pPcsPerBox} pcs/box
                                                        </span>
                                                      </div>
                                                      <div className="text-right font-mono shrink-0 pl-2 flex flex-col items-end justify-center">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                          Rs. {formatMoney(displayPrice)} / Box
                                                        </span>
                                                        {(() => {
                                                          const avail = getProductOverallStock ? getProductOverallStock(p) : Number(p.current_stock || 0);
                                                          return (
                                                            <span
                                                              className={`text-[10px] font-bold ${
                                                                avail > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                                                              }`}
                                                            >
                                                              Avail: {formatStockWithBoxesAndPcs(avail, p).inlineText}
                                                            </span>
                                                          );
                                                        })()}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                {filteredTileProds.length === 0 && (
                                                  <div className="p-4 text-center text-xs text-slate-400 italic">No tile products found</div>
                                                )}
                                              </div>
                                            </DropdownPortal>
                                          </div>
                                        </td>

                                        {/* Return Warehouse */}
                                        <td className="p-2.5 w-40">
                                          <WarehouseSearchableSelect
                                            value={tItem.warehouse || values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse')}
                                            onChange={(newWh) => setFieldValue(`tileItems.${tIdx}.warehouse`, newWh)}
                                            locations={locations}
                                            selectedProductName={tItem.itemName}
                                            getWarehouseStock={(pName, wh) => {
                                              const matched = productList.find(p => (p.product_name || '').toLowerCase() === (pName || '').toLowerCase());
                                              const qty = getItemWarehouseStock(pName, wh, tItem.skuCode || matched?.item_sr_no);
                                              return {
                                                text: formatStockWithBoxesAndPcs(qty, matched).inlineText,
                                                hasStock: qty > 0,
                                                qty
                                              };
                                            }}
                                            isTile={true}
                                          />
                                          {tItem.itemName && (
                                            <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                              Avail Stock: <span className="font-bold text-slate-700 dark:text-slate-300">{formatStockWithBoxesAndPcs(whStock, matchedTileProd).inlineText}</span>
                                            </div>
                                          )}
                                        </td>

                                        {/* Return QTY (Box) */}
                                        <td className="p-2.5 w-24 text-center">
                                          <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={tItem.boxQty ?? 0}
                                            onKeyDown={blockInvalidChar}
                                            onChange={(e) => {
                                              handleTileItemChange(tIdx, 'boxQty', e.target.value, values.tileItems, setFieldValue);
                                            }}
                                            className={`w-full text-center bg-white dark:bg-slate-800 rounded-lg p-2 text-xs font-black font-mono text-emerald-700 dark:text-emerald-400 outline-none focus:border-amber-500 ${isExceeded ? 'border-2 border-red-500 bg-red-50/90 text-red-600' : 'border border-slate-200 dark:border-slate-700'}`}
                                          />
                                          {maxRet !== null && Boolean(tItem.itemName) && (
                                            <div className="mt-1 text-center">
                                              <span className="text-[9px] text-slate-500 dark:text-slate-400">
                                                Max: <strong className="text-emerald-700 dark:text-emerald-400">{formatStockWithBoxesAndPcs(maxRet, matchedTileProd).inlineText}</strong>
                                              </span>
                                              {isExceeded && (
                                                <div className="mt-0.5 text-[9px] text-red-600 dark:text-red-400 font-bold whitespace-nowrap">
                                                  ⚠️ Entered return quantity is more than the sale to {values.customerName || 'customer'}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </td>

                                        {/* Return Pcs (Loose) */}
                                        <td className="p-2.5 w-24 text-center">
                                          <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={tItem.loosePcs ?? 0}
                                            onKeyDown={blockInvalidChar}
                                            onChange={(e) => {
                                              handleTileItemChange(tIdx, 'loosePcs', e.target.value, values.tileItems, setFieldValue);
                                            }}
                                            className={`w-full text-center bg-white dark:bg-slate-800 rounded-lg p-2 text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 outline-none focus:border-amber-500 ${isExceeded ? 'border-2 border-red-500 bg-red-50/90 text-red-600' : 'border border-slate-200 dark:border-slate-700'}`}
                                          />
                                        </td>

                                        {/* Rate (Per Box) */}
                                        <td className="p-2.5 w-28 text-right">
                                          <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={tItem.pricePerBox ?? 0}
                                            onKeyDown={blockInvalidChar}
                                            onChange={(e) => {
                                              handleTileItemChange(tIdx, 'pricePerBox', e.target.value, values.tileItems, setFieldValue);
                                            }}
                                            className="w-full text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500"
                                          />
                                        </td>

                                        {/* Rate (Per Sq. Mtr) */}
                                        <td className="p-2.5 w-28 text-right">
                                          <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={tItem.pricePerSqm ?? 0}
                                            onKeyDown={blockInvalidChar}
                                            onChange={(e) => {
                                              handleTileItemChange(tIdx, 'pricePerSqm', e.target.value, values.tileItems, setFieldValue);
                                            }}
                                            className="w-full text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500"
                                          />
                                          <div className="mt-1 text-right font-mono">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                                              <span>Sq.M:</span>
                                              <strong>{itemLineSqm.toFixed(2)} m²</strong>
                                            </span>
                                          </div>
                                        </td>

                                        {/* Rate (Per Piece) */}
                                        <td className="p-2.5 w-28 text-right">
                                          <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={tItem.pricePerPiece ?? 0}
                                            onKeyDown={blockInvalidChar}
                                            onChange={(e) => {
                                              handleTileItemChange(tIdx, 'pricePerPiece', e.target.value, values.tileItems, setFieldValue);
                                            }}
                                            className="w-full text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500"
                                          />
                                        </td>

                                        {/* Net Total */}
                                        <td className="p-2.5 w-32 text-right pr-3 font-mono font-black text-xs text-slate-900 dark:text-white">
                                          Rs. {formatMoney(tItem.totalAmount || 0)}
                                        </td>

                                        {/* Delete Row */}
                                        <td className="p-2.5 w-8 text-center">
                                          <button
                                            type="button"
                                            onClick={() => remove(tIdx)}
                                            className="text-slate-400 hover:text-rose-600 transition p-1"
                                            title="Remove tile item"
                                          >
                                            <FiTrash2 size={15} />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-800/40 flex justify-between items-center rounded-b-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!values.customerName) {
                                    toast.error('Please select a customer first!');
                                    return;
                                  }
                                  push({
                                    id: Date.now(),
                                    itemName: '',
                                    skuCode: '',
                                    warehouse: values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse'),
                                    boxQty: 1,
                                    loosePcs: 0,
                                    piecesPerBox: 4,
                                    sqmPerBox: 1.44,
                                    pricePerBox: 0,
                                    pricePerSqm: 0,
                                    pricePerPiece: 0,
                                    totalAmount: 0,
                                    totalSqm: 1.44,
                                    isTileItem: true
                                  });
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 transition cursor-pointer shadow-xs"
                              >
                                <MdAdd size={16} /> Add Tile Row
                              </button>

                              <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-300">
                                Total Tiles Return Value: <strong>Rs. {formatMoney(tileTotalSum)}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    </FieldArray>
                  </div>
  );
};

export default SalesReturnTileItemsTable;
