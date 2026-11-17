import React, { useRef } from 'react';
import { FieldArray } from 'formik';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { DropdownPortal } from './DropdownPortal';

interface InvoiceTileItemsTableProps {
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  activeTileProdIndex: number | null;
  setActiveTileProdIndex: (idx: number | null) => void;
  activeTileWhIndex: number | null;
  setActiveTileWhIndex: (idx: number | null) => void;
  highlightedTileProdIndex: number;
  setHighlightedTileProdIndex: React.Dispatch<React.SetStateAction<number>>;
  highlightedTileWhIndex: number;
  setHighlightedTileWhIndex: React.Dispatch<React.SetStateAction<number>>;
  productsList: any[];
  isTileProduct: (p: any) => boolean;
  handleTileProductSelection: (
    selectedProduct: any,
    tIdx: number,
    defaultWarehouse: string,
    setFieldValue: any,
    currentTileItem?: any
  ) => void;
  handleTileItemChange: (
    tIdx: number,
    field: string,
    val: any,
    tileItems: any[],
    setFieldValue: any
  ) => void;
  warehousesList: string[];
  fetchStockForWarehouse: (itemName: string, warehouseName: string) => Promise<number>;
  getItemWarehouseStock: (productName: string, warehouseName: string) => number | null;
  getTileStockBreakdown: (p: any) => { boxes: number; loose: number };
  blockInvalidChar: (e: React.KeyboardEvent<any>) => void;
}

export const InvoiceTileItemsTable: React.FC<InvoiceTileItemsTableProps> = ({
  values,
  setFieldValue,
  activeTileProdIndex,
  setActiveTileProdIndex,
  activeTileWhIndex,
  setActiveTileWhIndex,
  highlightedTileProdIndex,
  setHighlightedTileProdIndex,
  highlightedTileWhIndex,
  setHighlightedTileWhIndex,
  productsList,
  isTileProduct,
  handleTileProductSelection,
  handleTileItemChange,
  warehousesList,
  fetchStockForWarehouse,
  getItemWarehouseStock,
  getTileStockBreakdown,
  blockInvalidChar,
}) => {
  const tileProdRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const tileWhRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  if (!values.showTileSection) return null;

  return (
    <div className={`border border-stroke dark:border-strokedark bg-white dark:bg-boxdark rounded-sm mt-6 relative ${activeTileProdIndex !== null || activeTileWhIndex !== null ? 'z-[60]' : 'z-20'} overflow-visible pb-4 shadow-xs`}>
      <FieldArray name="tileItems">
        {({ push, remove }) => {
          const tileTotalSum = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.totalAmount || 0)), 0);
          const totalBoxesCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.boxQty || 0)), 0);
          const totalLoosePcsCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.loosePcs || 0)), 0);
          const totalSqmCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + (Number(t.totalSqm || 0)), 0);

          return (
            <div className="w-full min-w-[980px]">
              <div className="p-3 bg-slate-50 dark:bg-meta-4/20 border-b border-stroke dark:border-strokedark flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-700 text-white font-mono text-[10px] font-black tracking-wider uppercase">
                    Tiles
                  </span>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    Tile Items (Boxes, Loose Pieces & Sq. Mtr Sales)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  <span>Boxes: <strong className="font-black text-black dark:text-white">{totalBoxesCount}</strong></span>
                  <span>Pcs: <strong className="font-black text-black dark:text-white">{totalLoosePcsCount}</strong></span>
                  <span>Sq.M Given: <strong className="font-black text-slate-900 dark:text-white bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded shadow-xs">{totalSqmCount.toFixed(2)} m²</strong></span>
                  <span className="text-slate-900 dark:text-white font-black text-sm">
                    Total Tiles: Rs. {tileTotalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <table className="w-full table-auto border-collapse text-left">
                <thead className="bg-gray-100 dark:bg-meta-4/40 text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 border-b border-stroke dark:border-strokedark">
                  <tr>
                    <th className="p-2 w-8 text-center">S#</th>
                    <th className="p-2 min-w-[240px]">Product (NAME / CODE)</th>
                    <th className="p-2 w-44">Warehouse ZONE SOURCE</th>
                    <th className="p-2 w-32 text-center text-slate-700 dark:text-slate-200">Stock in Warehouse</th>
                    <th className="p-2 w-24 text-center">QTY (Box)</th>
                    <th className="p-2 w-24 text-center">Pcs (Loose)</th>
                    <th className="p-2 w-28 text-right">Sale Price (Per Box)</th>
                    <th className="p-2 w-28 text-right">Sale Price (Per Sq. Mtr)</th>
                    <th className="p-2 w-28 text-right">Sale Price (Per Piece)</th>
                    <th className="p-2 w-32 text-right pr-3 font-mono">Net Total</th>
                    <th className="p-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {(values.tileItems || []).map((tItem: any, tIdx: number) => {
                    const isCurrentProdActive = activeTileProdIndex === tIdx;
                    const isCurrentWhActive = activeTileWhIndex === tIdx;
                    const pcsPerBox = Math.max(1, Number(tItem.piecesPerBox) || 4);
                    const sqmPerBox = Math.max(0.01, Number(tItem.sqmPerBox) || 1.44);
                    const currentStockVal = Number(tItem.availableQty || 0);
                    const availBoxes = Math.floor(currentStockVal);
                    const availLoose = Math.round((currentStockVal - availBoxes) * pcsPerBox);
                    const totalAvailPieces = Math.round(currentStockVal * pcsPerBox);
                    const totalAvailSqm = Number((currentStockVal * sqmPerBox).toFixed(2));
                    const itemLineSqm = Number(tItem.totalSqm) > 0
                      ? Number(tItem.totalSqm)
                      : Number(((Number(tItem.boxQty || 0) * sqmPerBox) + ((Number(tItem.loosePcs || 0) / pcsPerBox) * sqmPerBox)).toFixed(2));

                    const tileProducts = productsList.filter(p => isTileProduct(p));
                    const exactTileSelected = tileProducts.some((p: any) => String(p.product_name || '').toLowerCase().trim() === String(tItem.itemName || '').toLowerCase().trim());
                    const tileSearch = exactTileSelected ? '' : (tItem.itemName || '').toLowerCase().trim();
                    const filteredTileProds = tileProducts.filter((p: any) => {
                      if (!tileSearch) return true;
                      return (
                        (p.product_name && p.product_name.toLowerCase().includes(tileSearch)) ||
                        (p.item_sr_no && p.item_sr_no.toLowerCase().includes(tileSearch)) ||
                        (`sku-${p.id}`.includes(tileSearch))
                      );
                    });

                    const currentWh = tItem.warehouse !== undefined ? tItem.warehouse : (values.dispatchWarehouse || '');
                    const exactTileWhSelected = warehousesList.some(w => String(w || '').toLowerCase().trim() === String(currentWh || '').toLowerCase().trim());
                    const tileWhQuery = exactTileWhSelected ? '' : currentWh.toLowerCase().trim();
                    let filteredWhs = tileWhQuery
                      ? warehousesList.filter(w => w.toLowerCase().includes(tileWhQuery))
                      : warehousesList;
                    if (filteredWhs.length === 0 && warehousesList.length > 0) {
                      filteredWhs = warehousesList;
                    }

                    return (
                      <tr key={tItem.id || tIdx} className={`border-b border-stroke dark:border-strokedark hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${isCurrentProdActive || isCurrentWhActive ? 'relative z-30' : 'relative z-10'}`}>
                        <td className="p-2 text-center text-gray-500 font-mono text-xs">{tIdx + 1}</td>

                        {/* TILE PRODUCT SELECTOR */}
                        <td className="p-2 relative tile-prod-name-container">
                          <div className="relative">
                            <input
                              type="text"
                              autoComplete="off"
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
                                  setHighlightedTileProdIndex(prev => prev < filteredTileProds.length - 1 ? prev + 1 : 0);
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  if (filteredTileProds.length === 0) return;
                                  setHighlightedTileProdIndex(prev => prev > 0 ? prev - 1 : filteredTileProds.length - 1);
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (filteredTileProds.length > 0) {
                                    const sel = filteredTileProds[highlightedTileProdIndex] || filteredTileProds[0];
                                    handleTileProductSelection(sel, tIdx, values.dispatchWarehouse, setFieldValue, tItem);
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

                                const match = tileProducts.find(p => p.product_name && p.product_name.toLowerCase() === typed.trim().toLowerCase());
                                if (match) {
                                  handleTileProductSelection(match, tIdx, values.dispatchWarehouse, setFieldValue, tItem);
                                }
                              }}
                              placeholder="Search tile product..."
                              className="w-full bg-white dark:bg-boxdark font-bold border border-stroke dark:border-strokedark rounded p-2 pr-7 outline-none text-xs text-black dark:text-white focus:border-primary shadow-sm"
                            />

                            {Boolean(tItem.itemName || tItem.skuCode) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTileProductSelection(null, tIdx, values.dispatchWarehouse, setFieldValue, tItem);
                                  setActiveTileProdIndex(null);
                                }}
                                className="absolute right-2 top-[17px] -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors z-10"
                                title="Deselect Tile Product"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {tItem.skuCode && (
                              <div className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                                Code: {tItem.skuCode} • Packing: {pcsPerBox} pcs/box {tItem.sqmPerBox ? `(${tItem.sqmPerBox} m²)` : ''}
                              </div>
                            )}

                            {/* TILE PRODUCT DROPDOWN WITH PORTAL */}
                            <DropdownPortal
                              isOpen={Boolean(isCurrentProdActive && filteredTileProds.length > 0)}
                              anchorEl={tileProdRefs.current[tIdx]}
                              minWidth={360}
                              maxWidth={460}
                            >
                              <div className="w-full max-h-[260px] overflow-y-auto rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                                {filteredTileProds.map((p, pIdx) => {
                                  const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                  const isHighlighted = pIdx === highlightedTileProdIndex;
                                  const pPcsPerBox = Number(p.pieces_per_box || p.pcs_per_box || 4);
                                  return (
                                    <div
                                      key={p.id}
                                      onMouseEnter={() => setHighlightedTileProdIndex(pIdx)}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleTileProductSelection(p, tIdx, values.dispatchWarehouse, setFieldValue, tItem);
                                        setActiveTileProdIndex(null);
                                      }}
                                      className={`p-2.5 cursor-pointer transition flex items-center justify-between ${isHighlighted ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-primary text-black dark:text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
                                    >
                                      <div className="flex flex-col text-left pr-2">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                          {p.product_name}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          {displaySku} {p.sub_sub_category ? `• ${p.sub_sub_category}` : ''} • {pPcsPerBox} pcs/box
                                        </span>
                                      </div>
                                      {(() => {
                                        const { boxes, loose } = getTileStockBreakdown(p);
                                        const hasStock = boxes > 0 || loose > 0;
                                        return (
                                          <div className="text-right font-mono shrink-0 pl-2 flex flex-col items-end justify-center">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                              Rs. {Number(p.retail_price || 0).toLocaleString()} / Box
                                            </span>
                                            <span className={`text-[11px] font-bold ${hasStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                              {boxes} Box{boxes !== 1 ? 'es' : ''}
                                            </span>
                                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">
                                              {loose} Pc{loose !== 1 ? 's' : ''}
                                            </span>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })}
                                {filteredTileProds.length === 0 && (
                                  <div className="p-4 text-center text-xs text-slate-400 italic">No tile products found (Parent Category: Tile)</div>
                                )}
                              </div>
                            </DropdownPortal>
                          </div>
                        </td>

                        {/* TILE WAREHOUSE SELECTOR */}
                        <td className="p-2 w-44 relative tile-wh-container">
                          <div className="relative">
                            <input
                              type="text"
                              autoComplete="off"
                              ref={(el) => {
                                tileWhRefs.current[tIdx] = el;
                              }}
                              value={currentWh}
                              onFocus={() => {
                                setActiveTileWhIndex(tIdx);
                                setHighlightedTileWhIndex(0);
                              }}
                              onClick={() => {
                                setActiveTileWhIndex(tIdx);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  if (filteredWhs.length === 0) return;
                                  setHighlightedTileWhIndex(prev => prev < filteredWhs.length - 1 ? prev + 1 : 0);
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  if (filteredWhs.length === 0) return;
                                  setHighlightedTileWhIndex(prev => prev > 0 ? prev - 1 : filteredWhs.length - 1);
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (filteredWhs[highlightedTileWhIndex]) {
                                    const selWh = filteredWhs[highlightedTileWhIndex];
                                    setFieldValue(`tileItems.${tIdx}.warehouse`, selWh);
                                    if (tItem.itemName) {
                                      fetchStockForWarehouse(tItem.itemName, selWh).then(avail => {
                                        setFieldValue(`tileItems.${tIdx}.availableQty`, avail);
                                      });
                                    }
                                    setActiveTileWhIndex(null);
                                  }
                                } else if (e.key === 'Escape' || e.key === 'Tab') {
                                  setActiveTileWhIndex(null);
                                }
                              }}
                              onChange={(e) => {
                                const newWh = e.target.value;
                                setFieldValue(`tileItems.${tIdx}.warehouse`, newWh);
                                setActiveTileWhIndex(tIdx);
                                setHighlightedTileWhIndex(0);
                              }}
                              placeholder="Select Warehouse..."
                              className="w-full bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 pr-6 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary shadow-sm"
                            />

                            {Boolean(currentWh) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFieldValue(`tileItems.${tIdx}.warehouse`, '');
                                  if (tItem.itemName) {
                                    fetchStockForWarehouse(tItem.itemName, values.dispatchWarehouse || '').then(avail => {
                                      setFieldValue(`tileItems.${tIdx}.availableQty`, avail);
                                    });
                                  }
                                  setActiveTileWhIndex(null);
                                }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors z-10"
                                title="Deselect Warehouse"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            )}

                            {/* TILE WAREHOUSE DROPDOWN WITH PORTAL */}
                            <DropdownPortal
                              isOpen={Boolean(isCurrentWhActive && filteredWhs.length > 0)}
                              anchorEl={tileWhRefs.current[tIdx]}
                              minWidth={260}
                              maxWidth={340}
                            >
                              <div className="w-full max-h-[220px] overflow-y-auto rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                                {filteredWhs.map((wh, wIdx) => {
                                  const pcsPerBox = Math.max(1, Number(tItem.piecesPerBox) || 4);
                                  const whStock = tItem.itemName ? getItemWarehouseStock(tItem.itemName, wh) : null;
                                  const whBoxes = whStock !== null ? Math.floor(whStock) : 0;
                                  const whLoose = whStock !== null ? Math.round((whStock - whBoxes) * pcsPerBox) : 0;
                                  const hasStock = whStock !== null && whStock > 0;
                                  return (
                                    <div
                                      key={wh}
                                      onMouseEnter={() => setHighlightedTileWhIndex(wIdx)}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setFieldValue(`tileItems.${tIdx}.warehouse`, wh);
                                        if (tItem.itemName) {
                                          fetchStockForWarehouse(tItem.itemName, wh).then(avail => {
                                            setFieldValue(`tileItems.${tIdx}.availableQty`, avail);
                                          });
                                        }
                                        setActiveTileWhIndex(null);
                                      }}
                                      className={`p-2.5 cursor-pointer transition text-xs font-bold flex items-center justify-between gap-2 ${wIdx === highlightedTileWhIndex ? 'bg-slate-100 dark:bg-slate-800 text-black dark:text-white border-l-4 border-primary' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
                                    >
                                      <span className="truncate">{wh}</span>
                                      {tItem.itemName && (
                                        <div className="text-right font-mono shrink-0 pl-2 flex flex-col items-end leading-none">
                                          <span className={`text-[11px] font-bold ${hasStock ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {whBoxes} Box{whBoxes !== 1 ? 'es' : ''}
                                          </span>
                                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                            {whLoose} Pc{whLoose !== 1 ? 's' : ''}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </DropdownPortal>
                          </div>
                        </td>

                        {/* STOCK IN WAREHOUSE */}
                        <td className="p-2 w-32 text-center">
                          <div className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            {availBoxes} Boxes{availLoose > 0 ? ` + ${availLoose} Pcs` : ''}
                          </div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                            {totalAvailSqm.toFixed(2)} m²
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ({totalAvailPieces} Total Pcs)
                          </div>
                        </td>

                        {/* QTY (BOX) */}
                        <td className="p-2 w-24 text-center">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={tItem.boxQty ?? 0}
                            onKeyDown={blockInvalidChar}
                            onChange={(e) => {
                              handleTileItemChange(tIdx, 'boxQty', e.target.value, values.tileItems, setFieldValue);
                            }}
                            className="w-full text-center bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-primary"
                          />
                        </td>

                        {/* PCS (LOOSE) */}
                        <td className="p-2 w-24 text-center">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={tItem.loosePcs ?? 0}
                            onKeyDown={blockInvalidChar}
                            onChange={(e) => {
                              handleTileItemChange(tIdx, 'loosePcs', e.target.value, values.tileItems, setFieldValue);
                            }}
                            className="w-full text-center bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-primary"
                          />
                        </td>

                        {/* SALE PRICE (PER BOX) */}
                        <td className="p-2 w-28 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={tItem.pricePerBox ?? 0}
                            onKeyDown={blockInvalidChar}
                            onChange={(e) => {
                              handleTileItemChange(tIdx, 'pricePerBox', e.target.value, values.tileItems, setFieldValue);
                            }}
                            className="w-full text-right bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-primary"
                          />
                        </td>

                        {/* SALE PRICE (PER SQ. MTR) */}
                        <td className="p-2 w-28 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={tItem.pricePerSqm ?? 0}
                            onKeyDown={blockInvalidChar}
                            onChange={(e) => {
                              handleTileItemChange(tIdx, 'pricePerSqm', e.target.value, values.tileItems, setFieldValue);
                            }}
                            className="w-full text-right bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-primary"
                          />
                          <div className="mt-1 text-right font-mono">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-stroke dark:border-strokedark" title="Total Sq. Mtr being given for this item">
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Sq.M:</span>
                              <strong className="text-black dark:text-white font-black">{itemLineSqm.toFixed(2)} m²</strong>
                            </span>
                          </div>
                        </td>

                        {/* SALE PRICE (PER PIECE) */}
                        <td className="p-2 w-28 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={tItem.pricePerPiece ?? 0}
                            onKeyDown={blockInvalidChar}
                            onChange={(e) => {
                              handleTileItemChange(tIdx, 'pricePerPiece', e.target.value, values.tileItems, setFieldValue);
                            }}
                            className="w-full text-right bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-primary"
                          />
                        </td>

                        {/* NET TOTAL */}
                        <td className="p-2 w-32 text-right pr-3 font-mono font-black text-xs text-slate-800 dark:text-slate-200">
                          Rs. {Number(tItem.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* DELETE ROW */}
                        <td className="p-2 w-8 text-center">
                          <button
                            type="button"
                            onClick={() => remove(tIdx)}
                            className="text-slate-400 hover:text-red-600 transition p-1"
                            title="Remove tile item"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-2 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark text-left">
                <button
                  type="button"
                  onClick={() => push({
                    id: Date.now(),
                    itemName: '',
                    skuCode: '',
                    warehouse: values.dispatchWarehouse || '',
                    availableQty: 0,
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
                  })}
                  className="text-slate-700 dark:text-slate-300 font-bold hover:underline cursor-pointer text-xs"
                >
                  + Append Tile Item Row
                </button>
              </div>
            </div>
          );
        }}
      </FieldArray>
    </div>
  );
};

export default InvoiceTileItemsTable;
