import WarehouseSearchableSelect from './WarehouseSearchableSelect';
import React, { useRef, useState } from 'react';
import { FieldArray } from 'formik';
import { MdAdd } from 'react-icons/md';
import { FiTrash2, FiX } from 'react-icons/fi';
import { DropdownPortal } from './DropdownPortal';

interface ReturnTileItemsTableProps {
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  productList: any[];
  boughtProducts: any[];
  locations: any[];
  workflowSettings: any;
  getItemWarehouseStock: (productName: string, warehouseName: string, itemCode?: string) => number;
  getProductOverallStock: (p: any) => number;
  handleTileReturnProductSelection: (p: any, tIdx: number, sourceWarehouse: string, setFieldValue: any, tItem: any) => void;
  handleTileItemChange: (tIdx: number, field: string, value: any, currentTileItems: any[], setFieldValue: any) => void;
  blockInvalidChar: (e: React.KeyboardEvent) => void;
  formatMoney: (val: number | string | undefined | null) => string;
  formatStockWithBoxesAndPcs: (qty: number, prod?: any) => { inlineText: string; boxes: number; loose: number; uom: string; looseUom: string };
  isTileProduct: (p: any) => boolean;
  getMaxReturnable?: (itemName: string, skuCode?: string) => number | null;
  selectedPoNo?: string;
}

export const ReturnTileItemsTable: React.FC<ReturnTileItemsTableProps> = ({
  values,
  setFieldValue,
  productList,
  boughtProducts,
  locations,
  workflowSettings,
  getItemWarehouseStock,
  getProductOverallStock,
  handleTileReturnProductSelection,
  handleTileItemChange,
  blockInvalidChar,
  formatMoney,
  formatStockWithBoxesAndPcs,
  isTileProduct,
  getMaxReturnable,
  selectedPoNo,
}) => {
  const [activeTileProdIndex, setActiveTileProdIndex] = useState<number | null>(null);
  const [highlightedTileProdIndex, setHighlightedTileProdIndex] = useState<number>(0);
  const tileProdRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  if (!values.showTileSection) return null;

  return (
    <div
      className={`rounded-2xl border border-amber-300 dark:border-amber-700/80 bg-white dark:bg-boxdark p-5 shadow-xs space-y-4 overflow-visible relative ${
        activeTileProdIndex !== null ? 'z-30' : 'z-20'
      }`}
    >
      <FieldArray name="tileItems">
        {({ push, remove }) => {
          const tileTotalSum = (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0);
          const totalBoxesCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.boxQty || 0), 0);
          const totalLoosePcsCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.loosePcs || 0), 0);
          const totalSqmCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.totalSqm || 0), 0);

          return (
            <div className="w-full">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200 dark:border-amber-800/60">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px] font-black tracking-wider uppercase">
                    Tiles
                  </span>
                  <div>
                    <span className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                      Tile Return Items (Boxes, Loose Pieces & Sq. Mtr Return to Vendor)
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Multi-dimensional tile returns with automatic box, piece, and area conversions
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                  <span>
                    Boxes: <strong className="font-black text-black dark:text-white">{totalBoxesCount}</strong>
                  </span>
                  <span>
                    Pcs: <strong className="font-black text-black dark:text-white">{totalLoosePcsCount}</strong>
                  </span>
                  <span>
                    Sq.M:{' '}
                    <strong className="font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                      {totalSqmCount.toFixed(2)} m²
                    </strong>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
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
                      <th className="p-2.5 w-48">Return Warehouse</th>
                      <th className="p-2.5 w-24 text-center">Return Qty (Box)</th>
                      <th className="p-2.5 w-24 text-center">Return Pcs (Loose)</th>
                      <th className="p-2.5 w-28 text-right">Cost (Per Box)</th>
                      <th className="p-2.5 w-28 text-right">Cost (Per Sq. Mtr)</th>
                      <th className="p-2.5 w-28 text-right">Cost (Per Piece)</th>
                      <th className="p-2.5 w-32 text-right pr-3 font-mono">Net Total</th>
                      <th className="p-2.5 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/60 dark:divide-amber-900/30">
                    {(values.tileItems || []).map((tItem: any, tIdx: number) => {
                      const isCurrentProdActive = activeTileProdIndex === tIdx;
                      const pcsPerBox = Math.max(1, Number(tItem.piecesPerBox) || 4);
                      const sqmPerBox = Math.max(0.01, Number(tItem.sqmPerBox) || 1.44);
                      const matchedTileProd = productList.find(
                        (p: any) => p.product_name === tItem.itemName || p.item_sr_no === tItem.skuCode
                      );
                      const tRawPcs = Number(matchedTileProd?.pieces_per_box ?? matchedTileProd?.pcs_per_box ?? pcsPerBox ?? 4);
                      const tPcsPerBox = tRawPcs > 0 ? tRawPcs : 4;
                      const totalEnteredBoxes = Number(tItem.boxQty || 0) + Number(tItem.loosePcs || 0) / tPcsPerBox;
                      const curTileWh = tItem.warehouse || values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse');
                      const curTileWhStock =
                        tItem.itemName && curTileWh ? getItemWarehouseStock(tItem.itemName, curTileWh, tItem.skuCode) : 0;
                      const isNegativeStockBlocked = workflowSettings?.allow_negative_stock === false;
                      const maxRet = getMaxReturnable ? getMaxReturnable(tItem.itemName, tItem.skuCode) : null;
                      const isTileStockExceeding = Boolean(
                        isNegativeStockBlocked &&
                          tItem.itemName &&
                          curTileWh &&
                          totalEnteredBoxes > 0 &&
                          totalEnteredBoxes > curTileWhStock + 0.0001
                      );
                      const isTileBillExceeding = Boolean(
                        maxRet !== null && Boolean(tItem.itemName) && totalEnteredBoxes > maxRet + 0.0001
                      );
                      const isTileRowExceeding = isTileStockExceeding || isTileBillExceeding;

                      const itemLineSqm =
                        Number(tItem.totalSqm) > 0
                          ? Number(tItem.totalSqm)
                          : Number(
                              (
                                Number(tItem.boxQty || 0) * sqmPerBox +
                                (Number(tItem.loosePcs || 0) / pcsPerBox) * sqmPerBox
                              ).toFixed(2)
                            );

                      const allTileProducts = productList.filter((p) => isTileProduct(p));
                      const boughtTileProducts = boughtProducts.filter((p) => isTileProduct(p));
                      const exactTileSelected = allTileProducts.some(
                        (p: any) =>
                          String(p.product_name || '')
                            .toLowerCase()
                            .trim() ===
                          String(tItem.itemName || '')
                            .toLowerCase()
                            .trim()
                      );
                      const tileSearch = exactTileSelected ? '' : (tItem.itemName || '').toLowerCase().trim();

                      const combinedTileList = [
                        ...boughtTileProducts.map((p) => ({ ...p, isVendorPurchased: true })),
                        ...allTileProducts
                          .filter(
                            (p) =>
                              !boughtTileProducts.some(
                                (bp) => (bp.product_name || '').toLowerCase() === (p.product_name || '').toLowerCase()
                              )
                          )
                          .map((p) => ({ ...p, isVendorPurchased: false })),
                      ];

                      const filteredTileProds = combinedTileList.filter((p: any) => {
                        if (!tileSearch) return true;
                        return (
                          (p.product_name && p.product_name.toLowerCase().includes(tileSearch)) ||
                          (p.item_sr_no && p.item_sr_no.toLowerCase().includes(tileSearch)) ||
                          `sku-${p.id}`.toLowerCase().includes(tileSearch)
                        );
                      });

                      return (
                        <tr key={tItem.id || tIdx} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                          {/* S# */}
                          <td className="p-2.5 text-center font-bold text-gray-400">{tIdx + 1}</td>

                          {/* Tile Product Autocomplete */}
                          <td className="p-2.5 relative tile-prod-container">
                            <div className="relative">
                              <input
                                type="text"
                                ref={(el) => {
                                  tileProdRefs.current[tIdx] = el;
                                }}
                                value={tItem.itemName || ''}
                                onFocus={() => {
                                  setActiveTileProdIndex(tIdx);
                                  setHighlightedTileProdIndex(0);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    if (filteredTileProds.length === 0) return;
                                    setHighlightedTileProdIndex((prev) => (prev < filteredTileProds.length - 1 ? prev + 1 : 0));
                                  } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    if (filteredTileProds.length === 0) return;
                                    setHighlightedTileProdIndex((prev) => (prev > 0 ? prev - 1 : filteredTileProds.length - 1));
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

                                  const match = combinedTileList.find(
                                    (p) => p.product_name && p.product_name.toLowerCase() === typed.trim().toLowerCase()
                                  );
                                  if (match) {
                                    handleTileReturnProductSelection(match, tIdx, values.sourceWarehouse, setFieldValue, tItem);
                                  }
                                }}
                                placeholder="Search tile product..."
                                className="w-full bg-white dark:bg-boxdark font-bold border border-stroke dark:border-strokedark rounded-lg p-2 pr-7 outline-none text-xs text-black dark:text-white focus:border-amber-500 shadow-xs"
                              />

                              {Boolean(tItem.itemName || tItem.skuCode) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTileReturnProductSelection(null, tIdx, values.sourceWarehouse, setFieldValue, tItem);
                                    setActiveTileProdIndex(null);
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors z-10"
                                  title="Deselect Tile Product"
                                >
                                  <FiX className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {tItem.skuCode && (
                                <div className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                  Code: {tItem.skuCode} • Packing: {pcsPerBox} pcs/box {tItem.sqmPerBox ? `(${tItem.sqmPerBox} m²)` : ''}
                                </div>
                              )}

                              <DropdownPortal
                                isOpen={isCurrentProdActive && filteredTileProds.length > 0}
                                anchorEl={tileProdRefs.current[tIdx]}
                                minWidth={380}
                                maxWidth={460}
                              >
                                <div className="w-full max-h-[290px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                                  {filteredTileProds.map((p, pIdx) => {
                                    const displaySku = p.item_sr_no || p.sku || `SKU-${p.id}`;
                                    const isHighlighted = pIdx === highlightedTileProdIndex;
                                    const pPcsPerBox = Number(p.pieces_per_box || p.pcs_per_box || 4);
                                    const displayPrice = Number(p.purchase_price ?? p.cost_price ?? p.rate ?? p.retail_price ?? 0);

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
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleTileReturnProductSelection(p, tIdx, values.sourceWarehouse, setFieldValue, tItem);
                                          setActiveTileProdIndex(null);
                                        }}
                                        className={`p-3 cursor-pointer transition flex items-center justify-between ${
                                          isHighlighted
                                            ? 'bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 text-black dark:text-white'
                                            : 'hover:bg-gray-50 dark:hover:bg-slate-800/80'
                                        }`}
                                      >
                                        <div className="flex flex-col text-left pr-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-black dark:text-white leading-tight">
                                              {p.product_name}
                                            </span>
                                            {p.isVendorPurchased && (
                                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                Purchased
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-gray-400 font-mono">
                                            {displaySku} • {pPcsPerBox} pcs/box
                                          </span>
                                        </div>
                                        <div className="text-right font-mono shrink-0 pl-2 flex flex-col items-end justify-center">
                                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                            Rs. {formatMoney(displayPrice)} / Box
                                          </span>
                                          {(() => {
                                            const avail = getProductOverallStock(p);
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
                                </div>
                              </DropdownPortal>
                            </div>
                          </td>

                          {/* Return Warehouse */}
                          <td className="p-2.5 w-48">
                            <WarehouseSearchableSelect
                                  value={tItem.warehouse || values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse')}
                                  onChange={(newWh) => setFieldValue(`tileItems.${tIdx}.warehouse`, newWh)}
                                  locations={locations}
                                  selectedProductName={tItem.itemName}
                                  getWarehouseStock={(pName, wh) => {
                                    const matched = productList.find(p => (p.product_name || '').toLowerCase() === (pName || '').toLowerCase());
                                    const qty = getItemWarehouseStock(pName, wh);
                                    return {
                                      text: formatStockWithBoxesAndPcs(qty, matched).inlineText,
                                      hasStock: qty > 0,
                                      qty
                                    };
                                  }}
                                  isTile={true}
                                />
                            {tItem.warehouse &&
                              tItem.itemName &&
                              (() => {
                                const curWhStock = getItemWarehouseStock(tItem.itemName, tItem.warehouse, tItem.skuCode);
                                const matchedProd = productList.find(
                                  (p: any) => p.product_name === tItem.itemName || p.item_sr_no === tItem.skuCode
                                );
                                return (
                                  <div
                                    className={`text-[10px] font-mono font-bold mt-0.5 truncate ${
                                      curWhStock > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                                    }`}
                                  >
                                    Avail: {formatStockWithBoxesAndPcs(curWhStock, matchedProd).inlineText}
                                  </div>
                                );
                              })()}
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
                              className={`w-full text-center bg-white dark:bg-boxdark border rounded-lg p-2 text-xs font-bold font-mono outline-none transition-colors ${
                                isTileRowExceeding
                                  ? 'border-red-500 bg-red-50/90 text-red-600 ring-2 ring-red-500/50 focus:border-red-500'
                                  : 'border-stroke dark:border-strokedark text-black dark:text-white focus:border-amber-500'
                              }`}
                            />
                            {isTileRowExceeding && (
                              <div className="text-[9px] font-bold text-red-600 dark:text-red-400 mt-1 whitespace-nowrap">
                                ⚠️ Exceeds Avail
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
                              className={`w-full text-center bg-white dark:bg-boxdark border rounded-lg p-2 text-xs font-bold font-mono outline-none transition-colors ${
                                isTileRowExceeding
                                  ? 'border-red-500 bg-red-50/90 text-red-600 ring-2 ring-red-500/50 focus:border-red-500'
                                  : 'border-stroke dark:border-strokedark text-black dark:text-white focus:border-amber-500'
                              }`}
                            />
                            {isTileRowExceeding && (
                              <div className="text-[9px] font-bold text-red-600 dark:text-red-400 mt-1 whitespace-nowrap">
                                ({formatStockWithBoxesAndPcs(curTileWhStock, matchedTileProd).inlineText} avail)
                              </div>
                            )}
                          </td>

                          {/* Cost (Per Box) */}
                          <td className="p-2.5 w-28 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={tItem.costPricePerBox ?? 0}
                              onKeyDown={blockInvalidChar}
                              onChange={(e) => {
                                handleTileItemChange(tIdx, 'costPricePerBox', e.target.value, values.tileItems, setFieldValue);
                              }}
                              className="w-full text-right bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg p-2 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-amber-500"
                            />
                          </td>

                          {/* Cost (Per Sq. Mtr) */}
                          <td className="p-2.5 w-28 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={tItem.costPricePerSqm ?? 0}
                              onKeyDown={blockInvalidChar}
                              onChange={(e) => {
                                handleTileItemChange(tIdx, 'costPricePerSqm', e.target.value, values.tileItems, setFieldValue);
                              }}
                              className="w-full text-right bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg p-2 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-amber-500"
                            />
                            <div className="mt-1 text-right font-mono">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                                <span>Sq.M:</span>
                                <strong>{itemLineSqm.toFixed(2)} m²</strong>
                              </span>
                            </div>
                          </td>

                          {/* Cost (Per Piece) */}
                          <td className="p-2.5 w-28 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={tItem.costPricePerPiece ?? 0}
                              onKeyDown={blockInvalidChar}
                              onChange={(e) => {
                                handleTileItemChange(tIdx, 'costPricePerPiece', e.target.value, values.tileItems, setFieldValue);
                              }}
                              className="w-full text-right bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg p-2 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-amber-500"
                            />
                          </td>

                          {/* Net Total */}
                          <td className="p-2.5 w-32 text-right pr-3 font-mono font-black text-xs text-black dark:text-white">
                            Rs. {formatMoney(tItem.totalAmount || 0)}
                          </td>

                          {/* Delete Row */}
                          <td className="p-2.5 w-8 text-center">
                            <button
                              type="button"
                              onClick={() => remove(tIdx)}
                              className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
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
                  onClick={() =>
                    push({
                      id: Date.now(),
                      itemName: '',
                      skuCode: '',
                      warehouse: values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse'),
                      boxQty: 1,
                      loosePcs: 0,
                      piecesPerBox: 4,
                      sqmPerBox: 1.44,
                      costPricePerBox: 0,
                      costPricePerSqm: 0,
                      costPricePerPiece: 0,
                      totalAmount: 0,
                      totalSqm: 1.44,
                      isTileItem: true,
                    })
                  }
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
