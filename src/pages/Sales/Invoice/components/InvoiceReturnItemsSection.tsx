import React, { useRef } from 'react';
import { FieldArray } from 'formik';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { DropdownPortal } from './DropdownPortal';

interface InvoiceReturnItemsSectionProps {
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  returnTotalValue: number;
  tileReturnTotalValue: number;
  activeReturnProdIndex: number | null;
  setActiveReturnProdIndex: (idx: number | null) => void;
  highlightedReturnProdIndex: number;
  setHighlightedReturnProdIndex: React.Dispatch<React.SetStateAction<number>>;
  activeReturnWhIndex: number | null;
  setActiveReturnWhIndex: (idx: number | null) => void;
  highlightedReturnWhIndex: number;
  setHighlightedReturnWhIndex: React.Dispatch<React.SetStateAction<number>>;
  activeTileReturnProdIndex: number | null;
  setActiveTileReturnProdIndex: (idx: number | null) => void;
  highlightedTileReturnProdIndex: number;
  setHighlightedTileReturnProdIndex: React.Dispatch<React.SetStateAction<number>>;
  activeTileReturnWhIndex: number | null;
  setActiveTileReturnWhIndex: (idx: number | null) => void;
  highlightedTileReturnWhIndex: number;
  setHighlightedTileReturnWhIndex: React.Dispatch<React.SetStateAction<number>>;
  productsList: any[];
  warehousesList: string[];
  isTileProduct: (p: any) => boolean;
  getTileStockBreakdown: (p: any) => { boxes: number; loose: number };
  getProductOverallStock: (p: any) => number;
  formatStockWithBoxesAndPcs: (qty: number, prod?: any) => { inlineText: string };
  getItemWarehouseStock: (productName: string, warehouseName: string, skuCode?: string) => number | null;
  fetchStockForWarehouse: (itemName: string, warehouseName: string, skuCode?: string) => Promise<number>;
  customerSoldMap: Record<string, any>;
  handleTileReturnProductSelection: (
    selectedProduct: any,
    tIdx: number,
    defaultWarehouse: string,
    setFieldValue: any,
    currentTileItem?: any
  ) => void;
  handleTileReturnItemChange: (
    tIdx: number,
    field: string,
    val: any,
    tileReturnItems: any[],
    setFieldValue: any
  ) => void;
  blockInvalidChar: (e: React.KeyboardEvent<any>) => void;
}

export const InvoiceReturnItemsSection: React.FC<InvoiceReturnItemsSectionProps> = ({
  values,
  setFieldValue,
  returnTotalValue,
  tileReturnTotalValue,
  activeReturnProdIndex,
  setActiveReturnProdIndex,
  highlightedReturnProdIndex,
  setHighlightedReturnProdIndex,
  activeReturnWhIndex,
  setActiveReturnWhIndex,
  highlightedReturnWhIndex,
  setHighlightedReturnWhIndex,
  activeTileReturnProdIndex,
  setActiveTileReturnProdIndex,
  highlightedTileReturnProdIndex,
  setHighlightedTileReturnProdIndex,
  activeTileReturnWhIndex,
  setActiveTileReturnWhIndex,
  highlightedTileReturnWhIndex,
  setHighlightedTileReturnWhIndex,
  productsList,
  warehousesList,
  isTileProduct,
  getTileStockBreakdown,
  getProductOverallStock,
  formatStockWithBoxesAndPcs,
  getItemWarehouseStock,
  fetchStockForWarehouse,
  customerSoldMap,
  handleTileReturnProductSelection,
  handleTileReturnItemChange,
  blockInvalidChar,
}) => {
  const returnProdRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const returnWhRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const tileReturnProdRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const tileReturnWhRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  if (!values.showReturnSection && !values.showTileReturnSection) return null;

  return (
    <>
      {/* --- RETURN / EXCHANGE STANDARD PRODUCTS --- */}
      {values.showReturnSection && (
        <div className={`border border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 rounded-sm mt-6 relative ${activeReturnProdIndex !== null || activeReturnWhIndex !== null ? 'z-30' : 'z-10'} overflow-visible pb-4`}>
          <FieldArray name="returnItems">
            {({ push, remove }) => {
              return (
                <div className="w-full min-w-[800px]">
                  <div className="p-3 bg-rose-100/60 dark:bg-rose-900/30 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-black tracking-wider uppercase">
                        Return / Exchange
                      </span>
                      <span className="font-bold text-xs text-rose-900 dark:text-rose-200">
                        Returned Items (Credit Subtracted From This Invoice)
                      </span>
                    </div>
                    <div className="text-xs font-mono font-black text-rose-700 dark:text-rose-300">
                      Total Return Credit: Rs. {returnTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <table className="w-full table-auto border-collapse text-left">
                    <thead className="bg-rose-50/70 dark:bg-rose-950/40 text-[10px] font-black uppercase text-rose-900 dark:text-rose-300 border-b border-rose-200 dark:border-rose-800">
                      <tr>
                        <th className="p-2 w-8 text-center">S#</th>
                        <th className="p-2 min-w-[240px]">Returned Product (Name / Code)</th>
                        <th className="p-2 w-32 text-center">Return Qty</th>
                        <th className="p-2 w-32 text-right">Return Rate (RP)</th>
                        <th className="p-2 w-36 text-right pr-4">Line Credit Total</th>
                        <th className="p-2 w-14 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(values.returnItems || []).map((rItem: any, rIdx: number) => {
                        const isCurrentProdActive = activeReturnProdIndex === rIdx;
                        const lineTotal = Number(rItem.qty || 0) * Number(rItem.rp ?? rItem.rate ?? 0);

                        const exactReturnSelected = productsList.some((p: any) => !isTileProduct(p) && String(p.product_name || '').toLowerCase().trim() === String(rItem.itemName || '').toLowerCase().trim());
                        const returnSearch = exactReturnSelected ? '' : (rItem.itemName || '').toLowerCase().trim();
                        const filteredProducts = productsList.filter((p: any) => {
                          if (isTileProduct(p)) return false;
                          if (!returnSearch) return true;
                          return (
                            (p.product_name && p.product_name.toLowerCase().includes(returnSearch)) ||
                            (p.item_sr_no && p.item_sr_no.toLowerCase().includes(returnSearch)) ||
                            (`sku-${p.id}`.includes(returnSearch))
                          );
                        });

                        return (
                          <tr key={rIdx} className={`border-b border-rose-100 dark:border-rose-900/30 hover:bg-rose-50/30 ${isCurrentProdActive ? 'relative z-30' : 'relative z-10'}`}>
                            <td className="p-2 text-center text-gray-500 font-mono text-xs">{rIdx + 1}</td>
                            
                            {/* RETURN PRODUCT SELECTOR */}
                            <td className="p-2 relative return-prod-name-container">
                              <div className="relative">
                                <input
                                  type="text"
                                  autoComplete="off"
                                  ref={(el) => {
                                    returnProdRefs.current[rIdx] = el;
                                  }}
                                  value={rItem.itemName || ''}
                                  onFocus={() => {
                                    setActiveReturnProdIndex(rIdx);
                                    setHighlightedReturnProdIndex(0);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      if (filteredProducts.length === 0) return;
                                      setHighlightedReturnProdIndex(prev => prev < filteredProducts.length - 1 ? prev + 1 : 0);
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      if (filteredProducts.length === 0) return;
                                      setHighlightedReturnProdIndex(prev => prev > 0 ? prev - 1 : filteredProducts.length - 1);
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (filteredProducts.length > 0) {
                                        const sel = filteredProducts[highlightedReturnProdIndex] || filteredProducts[0];
                                        const displaySku = sel.item_sr_no || `SKU-${sel.id}`;
                                        setFieldValue(`returnItems.${rIdx}.itemName`, sel.product_name);
                                        setFieldValue(`returnItems.${rIdx}.skuCode`, displaySku);
                                        setFieldValue(`returnItems.${rIdx}.rp`, Number(sel.retail_price || 0));
                                        setFieldValue(`returnItems.${rIdx}.uom`, sel.uom || 'Nos');
                                        setActiveReturnProdIndex(null);
                                      }
                                    } else if (e.key === 'Tab' || e.key === 'Escape') {
                                      setActiveReturnProdIndex(null);
                                    }
                                  }}
                                  onChange={(e) => {
                                    const typed = e.target.value;
                                    setFieldValue(`returnItems.${rIdx}.itemName`, typed);
                                    setActiveReturnProdIndex(rIdx);
                                    setHighlightedReturnProdIndex(0);

                                    const match = productsList.find(p => !isTileProduct(p) && p.product_name && p.product_name.toLowerCase() === typed.trim().toLowerCase());
                                    if (match) {
                                      const displaySku = match.item_sr_no || `SKU-${match.id}`;
                                      setFieldValue(`returnItems.${rIdx}.itemName`, match.product_name);
                                      setFieldValue(`returnItems.${rIdx}.skuCode`, displaySku);
                                      setFieldValue(`returnItems.${rIdx}.rp`, Number(match.retail_price || 0));
                                      setFieldValue(`returnItems.${rIdx}.uom`, match.uom || 'Nos');
                                    }
                                  }}
                                  placeholder="Search item to return..."
                                  className="w-full bg-white dark:bg-boxdark font-bold border border-rose-300 dark:border-rose-800 rounded p-1.5 pr-7 outline-none text-xs text-black dark:text-white focus:border-rose-500 shadow-sm"
                                />

                                {Boolean(rItem.itemName || rItem.skuCode) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFieldValue(`returnItems.${rIdx}.itemName`, '');
                                      setFieldValue(`returnItems.${rIdx}.skuCode`, '');
                                      setFieldValue(`returnItems.${rIdx}.rp`, 0);
                                      setActiveReturnProdIndex(null);
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors z-10"
                                    title="Deselect Product"
                                  >
                                    <FiX className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {rItem.skuCode && (
                                  <div className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                                    Code: {rItem.skuCode}
                                  </div>
                                )}

                                {/* PRODUCT DROPDOWN WITH PORTAL */}
                                <DropdownPortal
                                  isOpen={Boolean(isCurrentProdActive && filteredProducts.length > 0)}
                                  anchorEl={returnProdRefs.current[rIdx]}
                                  minWidth={340}
                                  maxWidth={420}
                                >
                                  <div className="w-full max-h-[260px] overflow-y-auto rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                                    {filteredProducts.map((p, pIdx) => {
                                      const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                      const isHighlighted = pIdx === highlightedReturnProdIndex;
                                      return (
                                        <div
                                          key={p.id}
                                          onMouseEnter={() => setHighlightedReturnProdIndex(pIdx)}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setFieldValue(`returnItems.${rIdx}.itemName`, p.product_name);
                                            setFieldValue(`returnItems.${rIdx}.skuCode`, displaySku);
                                            setFieldValue(`returnItems.${rIdx}.rp`, Number(p.retail_price || 0));
                                            setFieldValue(`returnItems.${rIdx}.uom`, p.uom || 'Nos');
                                            setActiveReturnProdIndex(null);
                                          }}
                                          className={`p-2.5 cursor-pointer transition flex items-center justify-between ${isHighlighted ? 'bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
                                        >
                                          <div className="flex flex-col text-left pr-2">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                              {p.product_name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                              {displaySku} {p.category ? `• ${p.category}` : ''}
                                            </span>
                                          </div>
                                          {(() => {
                                            const totStock = getProductOverallStock(p);
                                            const sInfo = formatStockWithBoxesAndPcs(totStock, p);
                                            return (
                                              <div className="text-right font-mono shrink-0 pl-2 flex flex-col items-end justify-center">
                                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                                  Rs. {Number(p.retail_price || 0).toLocaleString()}
                                                </span>
                                                <span className={`text-[10px] font-bold ${totStock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                  {sInfo.inlineText}
                                                </span>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      );
                                    })}
                                    {filteredProducts.length === 0 && (
                                      <div className="p-4 text-center text-xs text-slate-400 italic">No products found</div>
                                    )}
                                  </div>
                                </DropdownPortal>
                              </div>
                            </td>

                            {/* RETURN QTY */}
                            <td className="p-2 w-32 text-center">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={rItem.qty ?? 0}
                                onKeyDown={blockInvalidChar}
                                onChange={(e) => {
                                  setFieldValue(`returnItems.${rIdx}.qty`, Math.max(0, parseFloat(e.target.value) || 0));
                                }}
                                className="w-full text-center bg-white dark:bg-boxdark border border-rose-300 dark:border-rose-800 rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-rose-500"
                              />
                            </td>

                            {/* RETURN RATE (RP) */}
                            <td className="p-2 w-32 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={rItem.rp ?? rItem.rate ?? 0}
                                onKeyDown={blockInvalidChar}
                                onChange={(e) => {
                                  setFieldValue(`returnItems.${rIdx}.rp`, Math.max(0, parseFloat(e.target.value) || 0));
                                }}
                                className="w-full text-right bg-white dark:bg-boxdark border border-rose-300 dark:border-rose-800 rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-rose-500"
                              />
                            </td>

                            {/* NET CREDIT */}
                            <td className="p-2 w-36 text-right pr-4 font-mono font-black text-xs text-rose-600 dark:text-rose-400">
                              - Rs. {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>

                            {/* ACTION */}
                            <td className="p-2 w-14 text-center">
                              <button
                                type="button"
                                onClick={() => remove(rIdx)}
                                className="text-slate-400 hover:text-red-600 transition p-1"
                                title="Remove return row"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="p-2 bg-rose-50/50 dark:bg-rose-950/20 border-t border-rose-200 dark:border-rose-900/50 text-left">
                    <button
                      type="button"
                      onClick={() => push({
                        itemName: '',
                        skuCode: '',
                        warehouse: values.dispatchWarehouse || (warehousesList.length > 0 ? warehousesList[0] : 'Main Warehouse'),
                        qty: 1,
                        rp: 0,
                        amount: 0
                      })}
                      className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer text-xs"
                    >
                      + Append Returned Item Row
                    </button>
                  </div>
                </div>
              );
            }}
          </FieldArray>
        </div>
      )}

      {/* --- RETURN TILE PRODUCTS DYNAMIC FIELDARRAY --- */}
      {values.showTileReturnSection && (
        <div className={`border border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 rounded-sm mt-6 relative ${activeTileReturnProdIndex !== null || activeTileReturnWhIndex !== null ? 'z-30' : 'z-10'} overflow-visible pb-4`}>
          <FieldArray name="tileReturnItems">
            {({ push, remove }) => {
              return (
                <div className="w-full min-w-[800px]">
                  <div className="p-3 bg-amber-100/60 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px] font-black tracking-wider uppercase">
                        Return Tile
                      </span>
                      <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                        Returned Tile Items (Credit Subtracted From This Invoice)
                      </span>
                    </div>
                    <div className="text-xs font-mono font-black text-amber-700 dark:text-amber-300">
                      Total Tile Return Credit: Rs. {tileReturnTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <table className="w-full table-auto border-collapse text-left">
                    <thead className="bg-amber-50/70 dark:bg-amber-950/40 text-[10px] font-black uppercase text-amber-900 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800">
                      <tr>
                        <th className="p-2 w-8 text-center">S#</th>
                        <th className="p-2 min-w-[240px]">Returned Tile Product (Name / Sku)</th>
                        <th className="p-2 w-44">Return Warehouse Zone</th>
                        <th className="p-2 w-32 text-center">Sold Qty</th>
                        <th className="p-2 w-24 text-center">Return (Box)</th>
                        <th className="p-2 w-24 text-center">Return Pcs</th>
                        <th className="p-2 w-28 text-right">RP / Box</th>
                        <th className="p-2 w-28 text-right">RP / m²</th>
                        <th className="p-2 w-28 text-right">RP / Piece</th>
                        <th className="p-2 w-32 text-right pr-3">Line Credit Total</th>
                        <th className="p-2 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(values.tileReturnItems || []).map((tItem: any, tIdx: number) => {
                        const isCurrentProdActive = activeTileReturnProdIndex === tIdx;
                        const isCurrentWhActive = activeTileReturnWhIndex === tIdx;

                        const exactMatchSelected = productsList.some(
                          (p: any) => String(p.product_name || '').toLowerCase().trim() === String(tItem.itemName || '').toLowerCase().trim()
                        );
                        const currentSearchTerm = exactMatchSelected ? '' : (tItem.itemName || '').toLowerCase().trim();

                        const filteredProducts = productsList.filter((p: any) => {
                          if (!isTileProduct(p)) return false;
                          if (!currentSearchTerm) return true;
                          return (
                            (p.product_name && p.product_name.toLowerCase().includes(currentSearchTerm)) ||
                            (p.item_sr_no && p.item_sr_no.toLowerCase().includes(currentSearchTerm)) ||
                            (`sku-${p.id}`.includes(currentSearchTerm))
                          );
                        });

                        const currentWh = tItem.warehouse !== undefined ? tItem.warehouse : (values.dispatchWarehouse || '');
                        const exactWhSelected = warehousesList.some(w => String(w || '').toLowerCase().trim() === String(currentWh || '').toLowerCase().trim());
                        const whQuery = exactWhSelected ? '' : currentWh.toLowerCase().trim();
                        let filteredWhs = whQuery
                          ? warehousesList.filter(w => w.toLowerCase().includes(whQuery))
                          : warehousesList;
                        if (filteredWhs.length === 0 && warehousesList.length > 0) {
                          filteredWhs = warehousesList;
                        }

                        const pcsPerBox = Math.max(1, Number(tItem.piecesPerBox) || 4);
                        const sqmPerBox = Math.max(0.01, Number(tItem.sqmPerBox) || 1.44);
                        const itemLineSqm = Number(tItem.totalSqm) > 0
                          ? Number(tItem.totalSqm)
                          : Number(((Number(tItem.boxQty || 0) * sqmPerBox) + ((Number(tItem.loosePcs || 0) / pcsPerBox) * sqmPerBox)).toFixed(2));

                        return (
                          <tr key={tItem.id || tIdx} className={`border-b border-amber-100 dark:border-amber-900/30 hover:bg-amber-50/30 ${isCurrentProdActive || isCurrentWhActive ? 'relative z-30' : 'relative z-10'}`}>
                            <td className="p-2 text-center text-gray-500 font-mono text-xs">{tIdx + 1}</td>

                            {/* TILE PRODUCT SELECTOR */}
                            <td className="p-2 relative tile-return-prod-container">
                              <div className="relative">
                                <input
                                  type="text"
                                  autoComplete="off"
                                  ref={(el) => {
                                    tileReturnProdRefs.current[tIdx] = el;
                                  }}
                                  value={tItem.itemName || ''}
                                  onFocus={() => {
                                    setActiveTileReturnProdIndex(tIdx);
                                    setHighlightedTileReturnProdIndex(0);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      if (filteredProducts.length === 0) return;
                                      setHighlightedTileReturnProdIndex(prev => prev < filteredProducts.length - 1 ? prev + 1 : 0);
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      if (filteredProducts.length === 0) return;
                                      setHighlightedTileReturnProdIndex(prev => prev > 0 ? prev - 1 : filteredProducts.length - 1);
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (filteredProducts.length > 0) {
                                        const sel = filteredProducts[highlightedTileReturnProdIndex] || filteredProducts[0];
                                        handleTileReturnProductSelection(sel, tIdx, values.dispatchWarehouse, setFieldValue, tItem);
                                        setActiveTileReturnProdIndex(null);
                                      }
                                    } else if (e.key === 'Tab' || e.key === 'Escape') {
                                      setActiveTileReturnProdIndex(null);
                                    }
                                  }}
                                  onChange={(e) => {
                                    const typed = e.target.value;
                                    setFieldValue(`tileReturnItems.${tIdx}.itemName`, typed);
                                    setActiveTileReturnProdIndex(tIdx);
                                    setHighlightedTileReturnProdIndex(0);

                                    const match = productsList.find(p => isTileProduct(p) && p.product_name && p.product_name.toLowerCase() === typed.trim().toLowerCase());
                                    if (match) {
                                      handleTileReturnProductSelection(match, tIdx, values.dispatchWarehouse, setFieldValue, tItem);
                                    }
                                  }}
                                  placeholder="Search returned tile product..."
                                  className="w-full bg-white dark:bg-boxdark font-bold border border-amber-300 dark:border-amber-800 rounded p-1.5 pr-7 outline-none text-xs text-black dark:text-white focus:border-amber-500 shadow-sm"
                                />

                                {Boolean(tItem.itemName || tItem.skuCode) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTileReturnProductSelection(null, tIdx, values.dispatchWarehouse, setFieldValue, tItem);
                                      setActiveTileReturnProdIndex(null);
                                    }}
                                    className="absolute right-2 top-[17px] -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors z-10"
                                    title="Deselect Tile Product"
                                  >
                                    <FiX className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {tItem.skuCode && (
                                  <div className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 mt-0.5 truncate">
                                    Code: {tItem.skuCode} • Packing: {pcsPerBox} pcs/box {tItem.sqmPerBox ? `(${tItem.sqmPerBox} m²)` : ''}
                                  </div>
                                )}

                                {/* DROPDOWN WITH PORTAL */}
                                <DropdownPortal
                                  isOpen={Boolean(isCurrentProdActive && filteredProducts.length > 0)}
                                  anchorEl={tileReturnProdRefs.current[tIdx]}
                                  minWidth={360}
                                  maxWidth={460}
                                >
                                  <div className="w-full max-h-[260px] overflow-y-auto rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                                    {filteredProducts.map((p, pIdx) => {
                                      const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                      const isHighlighted = pIdx === highlightedTileReturnProdIndex;
                                      const pPcsPerBox = Number(p.pieces_per_box || p.pcs_per_box || 4);
                                      return (
                                        <div
                                          key={p.id}
                                          onMouseEnter={() => setHighlightedTileReturnProdIndex(pIdx)}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleTileReturnProductSelection(p, tIdx, values.dispatchWarehouse, setFieldValue, tItem);
                                            setActiveTileReturnProdIndex(null);
                                          }}
                                          className={`p-2.5 cursor-pointer transition flex items-center justify-between ${isHighlighted ? 'bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 text-black dark:text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
                                        >
                                          <div className="flex flex-col text-left pr-2">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                              {p.product_name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                              {displaySku} • {pPcsPerBox} pcs/box
                                            </span>
                                          </div>
                                          {(() => {
                                            const { boxes, loose } = getTileStockBreakdown(p);
                                            const hasStock = boxes > 0 || loose > 0;
                                            return (
                                              <div className="text-right font-mono shrink-0 pl-2 flex flex-col items-end justify-center">
                                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
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
                                  </div>
                                </DropdownPortal>
                              </div>
                            </td>

                            {/* RETURN WAREHOUSE ZONE */}
                            <td className="p-2 w-44 relative tile-return-wh-container">
                              <div className="relative">
                                <input
                                  type="text"
                                  autoComplete="off"
                                  ref={(el) => {
                                    tileReturnWhRefs.current[tIdx] = el;
                                  }}
                                  value={currentWh}
                                  onFocus={() => {
                                    setActiveTileReturnWhIndex(tIdx);
                                    setHighlightedTileReturnWhIndex(0);
                                  }}
                                  onClick={() => {
                                    setActiveTileReturnWhIndex(tIdx);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      if (filteredWhs.length === 0) return;
                                      setHighlightedTileReturnWhIndex(prev => prev < filteredWhs.length - 1 ? prev + 1 : 0);
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      if (filteredWhs.length === 0) return;
                                      setHighlightedTileReturnWhIndex(prev => prev > 0 ? prev - 1 : filteredWhs.length - 1);
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (filteredWhs[highlightedTileReturnWhIndex]) {
                                        const selWh = filteredWhs[highlightedTileReturnWhIndex];
                                        setFieldValue(`tileReturnItems.${tIdx}.warehouse`, selWh);
                                        if (tItem.itemName) {
                                          fetchStockForWarehouse(tItem.itemName, selWh).then((avail) => {
                                            setFieldValue(`tileReturnItems.${tIdx}.availableQty`, avail);
                                          });
                                        }
                                        setActiveTileReturnWhIndex(null);
                                      }
                                    } else if (e.key === 'Escape' || e.key === 'Tab') {
                                      setActiveTileReturnWhIndex(null);
                                    }
                                  }}
                                  onChange={(e) => {
                                    const newWh = e.target.value;
                                    setFieldValue(`tileReturnItems.${tIdx}.warehouse`, newWh);
                                    setActiveTileReturnWhIndex(tIdx);
                                    setHighlightedTileReturnWhIndex(0);
                                  }}
                                  placeholder="Select Warehouse..."
                                  className="w-full bg-white dark:bg-boxdark border border-amber-300 dark:border-amber-800 rounded p-1.5 pr-6 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500 shadow-sm"
                                />

                                {Boolean(currentWh) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFieldValue(`tileReturnItems.${tIdx}.warehouse`, '');
                                      if (tItem.itemName) {
                                        fetchStockForWarehouse(tItem.itemName, values.dispatchWarehouse || '').then((avail) => {
                                          setFieldValue(`tileReturnItems.${tIdx}.availableQty`, avail);
                                        });
                                      }
                                      setActiveTileReturnWhIndex(null);
                                    }}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors z-10"
                                    title="Deselect Warehouse"
                                  >
                                    <FiX className="w-3 h-3" />
                                  </button>
                                )}

                                {/* DROPDOWN WITH PORTAL */}
                                <DropdownPortal
                                  isOpen={Boolean(isCurrentWhActive && filteredWhs.length > 0)}
                                  anchorEl={tileReturnWhRefs.current[tIdx]}
                                  minWidth={250}
                                  maxWidth={340}
                                >
                                  <div className="w-full max-h-[180px] overflow-y-auto rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                                    {filteredWhs.map((wh, wIdx) => {
                                      const rawStock = tItem.itemName ? getItemWarehouseStock(tItem.itemName, wh) : null;
                                      const whStock = rawStock !== null ? (Math.abs(rawStock) < 0.0001 ? 0 : Number(rawStock.toFixed(2))) : null;
                                      const hasStock = whStock !== null && whStock > 0;
                                      return (
                                        <div
                                          key={wh}
                                          onMouseEnter={() => setHighlightedTileReturnWhIndex(wIdx)}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setFieldValue(`tileReturnItems.${tIdx}.warehouse`, wh);
                                            if (tItem.itemName) {
                                              fetchStockForWarehouse(tItem.itemName, wh).then((avail) => {
                                                setFieldValue(`tileReturnItems.${tIdx}.availableQty`, avail);
                                              });
                                            }
                                            setActiveTileReturnWhIndex(null);
                                          }}
                                          className={`p-2.5 cursor-pointer transition text-xs font-bold flex items-center justify-between gap-2 ${wIdx === highlightedTileReturnWhIndex ? 'bg-amber-100 dark:bg-amber-950/60 text-black dark:text-white border-l-4 border-amber-500' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
                                        >
                                          <span className="truncate">{wh}</span>
                                          {tItem.itemName && (
                                            <span className={`text-[10px] font-mono font-bold ${hasStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                              {whStock !== null ? `${whStock} Box` : ''}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </DropdownPortal>
                              </div>
                            </td>

                            {/* SOLD QTY TO CUSTOMER */}
                            <td className="p-2 w-32 text-center">
                              {(() => {
                                const soldData = customerSoldMap[tItem.itemName];
                                if (soldData && soldData.totalPieces > 0) {
                                  return (
                                    <div>
                                      <div className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                                        {soldData.boxes} Boxes{soldData.loose > 0 ? ` + ${soldData.loose} Pcs` : ''}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono">
                                        ({soldData.totalPieces} Sold Pcs)
                                      </div>
                                    </div>
                                  );
                                }
                                if (values.customerName && values.customerName.toLowerCase() !== 'walk-in customer') {
                                  return (
                                    <div>
                                      <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                                        0 Sold
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono font-medium">
                                        (Not in history)
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div>
                                    <div className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                                      Open Return
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono font-medium">
                                      (Walk-in / Direct)
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* RETURN QTY (BOX) */}
                            <td className="p-2 w-24 text-center">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={tItem.boxQty ?? 0}
                                onKeyDown={blockInvalidChar}
                                onChange={(e) => {
                                  handleTileReturnItemChange(tIdx, 'boxQty', e.target.value, values.tileReturnItems, setFieldValue);
                                }}
                                className="w-full text-center bg-white dark:bg-boxdark border border-amber-300 dark:border-amber-800 rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-amber-500"
                              />
                            </td>

                            {/* RETURN PCS (LOOSE) */}
                            <td className="p-2 w-24 text-center">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={tItem.loosePcs ?? 0}
                                onKeyDown={blockInvalidChar}
                                onChange={(e) => {
                                  handleTileReturnItemChange(tIdx, 'loosePcs', e.target.value, values.tileReturnItems, setFieldValue);
                                }}
                                className="w-full text-center bg-white dark:bg-boxdark border border-amber-300 dark:border-amber-800 rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-amber-500"
                              />
                            </td>

                            {/* RETURN RATE (PER BOX) */}
                            <td className="p-2 w-28 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={tItem.pricePerBox ?? 0}
                                onKeyDown={blockInvalidChar}
                                onChange={(e) => {
                                  handleTileReturnItemChange(tIdx, 'pricePerBox', e.target.value, values.tileReturnItems, setFieldValue);
                                }}
                                className="w-full text-right bg-white dark:bg-boxdark border border-amber-300 dark:border-amber-800 rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-amber-500"
                              />
                            </td>

                            {/* RETURN RATE (PER SQ. MTR) */}
                            <td className="p-2 w-28 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={tItem.pricePerSqm ?? 0}
                                onKeyDown={blockInvalidChar}
                                onChange={(e) => {
                                  handleTileReturnItemChange(tIdx, 'pricePerSqm', e.target.value, values.tileReturnItems, setFieldValue);
                                }}
                                className="w-full text-right bg-white dark:bg-boxdark border border-amber-300 dark:border-amber-800 rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-amber-500"
                              />
                              <div className="mt-1 text-right font-mono">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200/80 dark:border-amber-800/60" title="Total Sq. Mtr returned for this item">
                                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Sq.M:</span>
                                  <strong className="text-amber-950 dark:text-amber-100 font-black">{itemLineSqm.toFixed(2)} m²</strong>
                                </span>
                              </div>
                            </td>

                            {/* RETURN RATE (PER PIECE) */}
                            <td className="p-2 w-28 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={tItem.pricePerPiece ?? 0}
                                onKeyDown={blockInvalidChar}
                                onChange={(e) => {
                                  handleTileReturnItemChange(tIdx, 'pricePerPiece', e.target.value, values.tileReturnItems, setFieldValue);
                                }}
                                className="w-full text-right bg-white dark:bg-boxdark border border-amber-300 dark:border-amber-800 rounded p-1.5 text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-amber-500"
                              />
                            </td>

                            {/* NET TOTAL */}
                            <td className="p-2 w-32 text-right pr-3 font-mono font-black text-xs text-amber-700 dark:text-amber-400">
                              - Rs. {Number(tItem.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>

                            {/* DELETE ROW */}
                            <td className="p-2 w-8 text-center">
                              <button
                                type="button"
                                onClick={() => remove(tIdx)}
                                className="text-slate-400 hover:text-red-600 transition p-1"
                                title="Remove tile return item"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-900/50 text-left">
                    <button
                      type="button"
                      onClick={() =>
                        push({
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
                        })
                      }
                      className="text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer text-xs"
                    >
                      + Append Returned Tile Item Row
                    </button>
                  </div>
                </div>
              );
            }}
          </FieldArray>
        </div>
      )}
    </>
  );
};

export default InvoiceReturnItemsSection;
