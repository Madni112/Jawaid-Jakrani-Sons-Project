import React, { useRef } from 'react';
import { FieldArray } from 'formik';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { formatStockWithBoxesAndPcs } from '../../../../utils/stockCalculator';
import { DropdownPortal } from './DropdownPortal';
import ChainedUomInputGrid from '../../../../components/ChainedUomInputGrid';
import { LooseChainBadge, decomposeStockForActiveUoms } from '../../../../utils/looseUomHelpers';

interface InvoiceStandardItemsTableProps {
  values: any;
  errors: any;
  hasAttempted: boolean;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  activeSkuIndex: number | null;
  setActiveSkuIndex: (idx: number | null) => void;
  highlightedSkuIndex: number;
  setHighlightedSkuIndex: React.Dispatch<React.SetStateAction<number>>;
  activeProdNameIndex: number | null;
  setActiveProdNameIndex: (idx: number | null) => void;
  highlightedProdNameIndex: number;
  setHighlightedProdNameIndex: React.Dispatch<React.SetStateAction<number>>;
  activeWhIndex: number | null;
  setActiveWhIndex: (idx: number | null) => void;
  highlightedWhIndex: number;
  setHighlightedWhIndex: React.Dispatch<React.SetStateAction<number>>;
  productsList: any[];
  warehousesList: string[];
  editData: any;
  calculateLineTotals: (item: any, taxScenario: string, applyTax: boolean) => any;
  handleProductSelectionWithWH: (
    selectedProduct: any,
    idx: number,
    defaultWarehouse: string,
    setFieldValue: any,
    currentItem?: any
  ) => void;
  fetchStockForWarehouse: (itemName: string, warehouseName: string, skuCode?: string) => Promise<number>;
  getItemWarehouseStock: (productName: string, warehouseName: string, skuCode?: string) => number | null;
  getProductOverallStock: (p: any) => number;
  isTileProduct: (p: any) => boolean;
  blockInvalidChar: (e: React.KeyboardEvent<any>) => void;
  triggerFeedbackSound: (action: string, userEmail?: string) => void;
  userEmail: string;
  productDropdownScrollRef: React.RefObject<HTMLDivElement>;
  queueProductScroll: (index: number) => void;
}

export const InvoiceStandardItemsTable: React.FC<InvoiceStandardItemsTableProps> = ({
  values,
  errors,
  hasAttempted,
  setFieldValue,
  activeSkuIndex,
  setActiveSkuIndex,
  highlightedSkuIndex,
  setHighlightedSkuIndex,
  activeProdNameIndex,
  setActiveProdNameIndex,
  highlightedProdNameIndex,
  setHighlightedProdNameIndex,
  activeWhIndex,
  setActiveWhIndex,
  highlightedWhIndex,
  setHighlightedWhIndex,
  productsList,
  warehousesList,
  editData,
  calculateLineTotals,
  handleProductSelectionWithWH,
  fetchStockForWarehouse,
  getItemWarehouseStock,
  getProductOverallStock,
  isTileProduct,
  blockInvalidChar,
  triggerFeedbackSound,
  userEmail,
  productDropdownScrollRef,
  queueProductScroll,
}) => {
  const prodNameRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const whRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [rowActiveUoms, setRowActiveUoms] = React.useState<Record<number, string[]>>({});

  return (
    <div className={`border border-stroke dark:border-strokedark rounded-sm mt-4 relative ${activeProdNameIndex !== null || activeSkuIndex !== null || activeWhIndex !== null ? 'z-[60]' : 'z-10'} overflow-visible pb-4`}>
      <FieldArray name="items">
        {({ push, remove }) => {
          const showDiscount = values.showDiscount;
          return (
            <div className="w-full min-w-[1050px]">
              <table className="w-full table-auto border-collapse text-left">
                <thead className="bg-gray-100 dark:bg-meta-4 text-[10px] font-black uppercase text-black dark:text-white border-b">
                  <tr>
                    <th className="p-2 w-8 text-center">S#</th>
                    <th className="p-2 min-w-[240px]">Product (Name / Code)</th>
                    <th className="p-2 w-44">Warehouse Zone Source</th>
                    <th className="p-2 w-32 text-center bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold">Available Stock</th>
                    <th className="p-2 min-w-[300px] text-center">Qty & Pricing (UOM)</th>
                    {showDiscount && (
                      <>
                        <th className="p-2 w-24 text-center bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">Discount %</th>
                        <th className="p-2 w-32 text-right bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">Discount Amt</th>
                      </>
                    )}
                    {values.applyFbrTax && (
                      <>
                        <th className="p-2 w-16 text-center">GST %</th>
                        <th className="p-2 w-16 text-center">F.Tax %</th>
                        <th className="p-2 w-24 text-right">GST Amt</th>
                        <th className="p-2 w-24 text-right">F.Tax Amt</th>
                      </>
                    )}
                    <th className="p-2 w-36 text-right pr-4">Net Total Line</th>
                    <th className="p-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {values.items.map((item: any, idx: number) => {
                    const lineCalc = calculateLineTotals(item, values.taxScenario, values.applyFbrTax);
                    const hasItemError = hasAttempted && errors.items && (errors.items as any)[idx]?.itemName;
                    const isCurrentProdNameActive = activeProdNameIndex === idx;
                    const isCurrentWhActive = activeWhIndex === idx;

                    const currentWh = item.warehouse !== undefined && item.warehouse !== '' ? item.warehouse : (values.dispatchWarehouse || '');
                    const exactWhSelected = warehousesList.some(w => String(w || '').toLowerCase().trim() === String(currentWh || '').toLowerCase().trim());
                    const whSearchTerm = exactWhSelected ? '' : (currentWh || '').toLowerCase().trim();
                    let filteredWhs = whSearchTerm
                      ? warehousesList.filter(w => String(w || '').toLowerCase().includes(whSearchTerm))
                      : warehousesList;
                    if (filteredWhs.length === 0 && warehousesList.length > 0) {
                      filteredWhs = warehousesList;
                    }

                    const selectedProd = productsList.find(p => p.product_name === item.itemName || (item.skuCode && (p.item_sr_no === item.skuCode || `SKU-${p.id}` === item.skuCode)));
                    const isTile = false;
                    const allowLoose = Boolean(selectedProd?.allow_loose_sales);
                    const rawPcs = Number(selectedProd?.loose_conversion_ratio || selectedProd?.pieces_per_box || selectedProd?.pcs_per_box || selectedProd?.pieces_per_packing || 1);
                    const pcsPerBox = rawPcs > 1 ? rawPcs : 1;
                    const bulkUnitLabel = item.uom || selectedProd?.uom || 'Unit';
                    const looseUnitLabel = selectedProd?.loose_uom || 'Pcs';
                    const uomName = item.uom || selectedProd?.uom || 'MTR';

                    // Calculate available stock breakdown (Overall stock before warehouse is selected; warehouse-specific after)
                    const hasSelectedWh = Boolean(String(currentWh || '').trim());
                    const overallStock = selectedProd ? getProductOverallStock(selectedProd) : 0;
                    let effectiveAvailStock = hasSelectedWh
                      ? Number(item.availableQty ?? getItemWarehouseStock(item.itemName, currentWh, item.skuCode) ?? 0)
                      : overallStock;
                    if (editData && editData.items) {
                      const oldItems = typeof editData.items === 'string' ? JSON.parse(editData.items || '[]') : (editData.items || []);
                      const original = oldItems.find((oi: any) => oi.skuCode === item.skuCode && (oi.warehouse || editData.dispatch_warehouse || 'Main Warehouse') === (item.warehouse || values.dispatchWarehouse || 'Main Warehouse'));
                      if (original) {
                         effectiveAvailStock += Number(original.qty || 0);
                      }
                    }

                    // Deduct quantities already allocated to prior rows in this invoice
                    const priorConsumed = values.items.slice(0, idx).reduce((sum: number, prev: any) => {
                      const prevName = String(prev.itemName || '').trim().toLowerCase();
                      const currName = String(item.itemName || '').trim().toLowerCase();
                      const prevSku = String(prev.skuCode || '').trim().toLowerCase();
                      const currSku = String(item.skuCode || '').trim().toLowerCase();
                      const prevWh = String(prev.warehouse || values.dispatchWarehouse || 'Main Warehouse').trim().toLowerCase();
                      const currWh = String(item.warehouse || values.dispatchWarehouse || 'Main Warehouse').trim().toLowerCase();
                      
                      const isMatch = (currName && prevName === currName) || (currSku && prevSku === currSku);
                      if (isMatch && prevWh === currWh) {
                        return sum + (Number(prev.qty) || 0);
                      }
                      return sum;
                    }, 0);

                    const totalAvailStock = Math.max(0, effectiveAvailStock - priorConsumed);

                    return (
                      <tr key={idx} className={`border-b border-stroke dark:border-strokedark font-mono font-semibold text-black dark:text-white ${isCurrentProdNameActive || activeWhIndex === idx ? 'relative z-30' : 'relative z-10'} ${hasItemError ? 'bg-red-50/5' : ''}`}>
                        <td className="p-2 text-center font-sans text-gray-400">{idx + 1}</td>

                        {/* Description & DESCRIPTION */}
                        <td className="p-2 relative prod-name-container min-w-[220px] max-w-[320px]">
                          {(() => {
                            const normText = (v: any) => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim();
                            const exactSelected = productsList.some(p => normText(p.product_name) === normText(item.itemName));
                            const query = exactSelected ? '' : normText(item.itemName);
                            const nonTileList = productsList.filter(p => !isTileProduct(p));
                            let filteredByName = query
                              ? nonTileList.filter(p =>
                                  normText(p.product_name).includes(query) ||
                                  normText(p.item_sr_no).includes(query) ||
                                  normText(p.category).includes(query)
                                )
                              : nonTileList.slice();
                            filteredByName = filteredByName
                              .slice()
                              .sort((a, b) =>
                                (Number(b.current_stock) || 0) - (Number(a.current_stock) || 0) ||
                                String(a.product_name || '').localeCompare(String(b.product_name || ''))
                              )
                              .slice(0, 60);

                            return (
                              <div className="relative">
                                <input
                                  type="text"
                                  autoComplete="off"
                                  ref={(el) => {
                                    prodNameRefs.current[idx] = el;
                                  }}
                                  value={item.itemName || ''}
                                  onFocus={() => {
                                    setActiveProdNameIndex(idx);
                                    setActiveSkuIndex(null);
                                    setHighlightedProdNameIndex(0);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      if (filteredByName.length === 0) return;
                                      setHighlightedProdNameIndex((prev) => {
                                        const next = prev < filteredByName.length - 1 ? prev + 1 : 0;
                                        queueProductScroll(next);
                                        return next;
                                      });
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      if (filteredByName.length === 0) return;
                                      setHighlightedProdNameIndex((prev) => {
                                        const next = prev > 0 ? prev - 1 : filteredByName.length - 1;
                                        queueProductScroll(next);
                                        return next;
                                      });
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (filteredByName.length > 0) {
                                        const selected = filteredByName[highlightedProdNameIndex] || filteredByName[0];
                                        handleProductSelectionWithWH(selected, idx, values.dispatchWarehouse, setFieldValue, item);
                                        setActiveProdNameIndex(null);
                                      }
                                    } else if (e.key === 'Tab' || e.key === 'Escape') {
                                      setActiveProdNameIndex(null);
                                    }
                                  }}
                                  onChange={(e) => {
                                    const typed = e.target.value;
                                    setFieldValue(`items.${idx}.itemName`, typed);
                                    setFieldValue(`items.${idx}.skuCode`, '');
                                    setActiveProdNameIndex(idx);
                                    setHighlightedProdNameIndex(0);

                                    }}
                                  placeholder="Search Description..."
                                  className="w-full bg-white dark:bg-boxdark font-bold border border-stroke dark:border-strokedark rounded p-2 pr-7 outline-none text-xs text-black dark:text-white focus:border-primary shadow-sm"
                                />
                                {selectedProd && (
                                  <div className="mt-1">
                                    <LooseChainBadge product={selectedProd} />
                                  </div>
                                )}

                                {Boolean(item.itemName || item.skuCode) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleProductSelectionWithWH(null, idx, values.dispatchWarehouse, setFieldValue, item);
                                      setActiveProdNameIndex(null);
                                    }}
                                    className="absolute right-2 top-[17px] -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors z-10"
                                    title="Deselect Product"
                                  >
                                    <FiX className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {selectedProd?.bin && (
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-sans mt-0.5 truncate">
                                    BIN Location: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedProd.bin || 'N/A'}</span> {selectedProd.category ? `• ${selectedProd.category}` : ''}
                                  </div>
                                )}

                                {item.skuCode && (
                                  <div className="text-[10px] font-mono font-bold text-primary dark:text-blue-400 mt-0.5 truncate">
                                    Code: {item.skuCode}
                                  </div>
                                )}

                                {/* SEARCHABLE PRODUCT DROPDOWN WITH PORTAL */}
                                <DropdownPortal
                                  isOpen={Boolean(isCurrentProdNameActive && filteredByName.length > 0)}
                                  anchorEl={prodNameRefs.current[idx]}
                                  minWidth={360}
                                  maxWidth={460}
                                >
                                  <div ref={productDropdownScrollRef} className="w-full max-h-[300px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                                    {filteredByName.map((p, pIdx) => {
                                      const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                      const isHighlighted = pIdx === highlightedProdNameIndex;
                                      return (
                                        <div
                                          key={p.id}
                                          data-opt={pIdx}
                                          onMouseEnter={() => setHighlightedProdNameIndex(pIdx)}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleProductSelectionWithWH(p, idx, values.dispatchWarehouse, setFieldValue, item);
                                            setActiveProdNameIndex(null);
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleProductSelectionWithWH(p, idx, values.dispatchWarehouse, setFieldValue, item);
                                            setActiveProdNameIndex(null);
                                          }}
                                          className={`p-3 cursor-pointer transition flex items-center justify-between group ${isHighlighted
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                            }`}
                                        >
                                          <div className="flex flex-col gap-0.5 text-left pr-2">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 leading-tight">
                                              {p.product_name}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                              <span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded font-bold text-primary">
                                                {displaySku}
                                              </span>
                                              {p.category && <span>• {p.category}</span>}
                                                <LooseChainBadge product={p} />
                                            </div>
                                          </div>
                                          {(() => {
                                            const totStock = getProductOverallStock(p);
                                            const sInfo = formatStockWithBoxesAndPcs(totStock, p);
                                            return (
                                              <div className="text-right font-mono shrink-0 pl-2 flex flex-col items-end justify-center">
                                                <span className="text-xs font-bold text-slate-800 dark:text-white">
                                                  Rs. {Number(p.retail_price || 0).toLocaleString()}
                                                </span>
                                                <span className={`text-[11px] font-bold ${totStock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                  {sInfo.inlineText}
                                                </span>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      );
                                    })}
                                    {filteredByName.length === 0 && (
                                      <div className="p-4 text-center text-xs text-slate-400 italic">
                                        No matching products found
                                      </div>
                                    )}
                                  </div>
                                </DropdownPortal>
                              </div>
                            );
                          })()}
                        </td>

                        {/* WAREHOUSE SELECTOR */}
                        <td className="p-2 w-44 relative wh-container">
                          <div className="relative">
                            <input
                              type="text"
                              autoComplete="off"
                              ref={(el) => {
                                whRefs.current[idx] = el;
                              }}
                              value={currentWh}
                              onFocus={() => {
                                setActiveWhIndex(idx);
                                setHighlightedWhIndex(0);
                              }}
                              onClick={() => {
                                setActiveWhIndex(idx);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  if (filteredWhs.length === 0) return;
                                  setHighlightedWhIndex(prev => prev < filteredWhs.length - 1 ? prev + 1 : 0);
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  if (filteredWhs.length === 0) return;
                                  setHighlightedWhIndex(prev => prev > 0 ? prev - 1 : filteredWhs.length - 1);
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (filteredWhs[highlightedWhIndex]) {
                                    const selWh = filteredWhs[highlightedWhIndex];
                                    setFieldValue(`items.${idx}.warehouse`, selWh);
                                    if (item.itemName) {
                                      fetchStockForWarehouse(item.itemName, selWh, item.skuCode).then(avail => {
                                        setFieldValue(`items.${idx}.availableQty`, avail);
                                      });
                                    }
                                    setActiveWhIndex(null);
                                  }
                                } else if (e.key === 'Escape' || e.key === 'Tab') {
                                  setActiveWhIndex(null);
                                }
                              }}
                              onChange={(e) => {
                                const newWh = e.target.value;
                                setFieldValue(`items.${idx}.warehouse`, newWh);
                                setActiveWhIndex(idx);
                                setHighlightedWhIndex(0);
                                const exact = warehousesList.find(w => w.toLowerCase().trim() === newWh.toLowerCase().trim());
                                if (exact && item.itemName) {
                                  fetchStockForWarehouse(item.itemName, exact, item.skuCode).then(avail => {
                                    setFieldValue(`items.${idx}.availableQty`, avail);
                                  });
                                }
                              }}
                              placeholder="Select Warehouse..."
                              className="w-full bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 pr-6 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-primary shadow-sm"
                            />

                            {Boolean(currentWh) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFieldValue(`items.${idx}.warehouse`, '');
                                  if (item.itemName) {
                                    fetchStockForWarehouse(item.itemName, values.dispatchWarehouse || '', item.skuCode).then(avail => {
                                      setFieldValue(`items.${idx}.availableQty`, avail);
                                    });
                                  }
                                  setActiveWhIndex(null);
                                }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors z-10"
                                title="Deselect Warehouse"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            )}

                            {/* WAREHOUSE DROPDOWN WITH PORTAL */}
                            <DropdownPortal
                              isOpen={Boolean(isCurrentWhActive && filteredWhs.length > 0)}
                              anchorEl={whRefs.current[idx]}
                              minWidth={250}
                              maxWidth={340}
                            >
                              <div className="w-full max-h-[180px] overflow-y-auto rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin">
                                {filteredWhs.map((wh, wIdx) => {
                                  const rawWhStock = item.itemName ? getItemWarehouseStock(item.itemName, wh, item.skuCode) : null;
                                  const whStock = rawWhStock !== null ? (Math.abs(rawWhStock) < 0.0001 ? 0 : Number(rawWhStock.toFixed(2))) : null;
                                  const hasStock = whStock !== null && whStock > 0;
                                  return (
                                    <div
                                      key={wh}
                                      onMouseEnter={() => setHighlightedWhIndex(wIdx)}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setFieldValue(`items.${idx}.warehouse`, wh);
                                        if (item.itemName) {
                                          fetchStockForWarehouse(item.itemName, wh, item.skuCode).then(avail => {
                                            setFieldValue(`items.${idx}.availableQty`, avail);
                                          });
                                        }
                                        setActiveWhIndex(null);
                                      }}
                                      className={`p-2.5 cursor-pointer transition flex items-center justify-between ${wIdx === highlightedWhIndex ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-primary text-black dark:text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
                                    >
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{wh}</span>
                                      {whStock !== null && (
                                        <span className={`text-[11px] font-mono font-bold ${hasStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                          {whStock} {bulkUnitLabel || 'Nos'}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </DropdownPortal>
                          </div>
                        </td>

                        {/* AVAILABLE STOCK */}
                        <td className="p-2 text-center bg-success/5 text-xs w-[150px]">
                          {(() => {
                            const hasLooseGrid = (isTile || allowLoose) && (pcsPerBox > 1 || (Array.isArray(selectedProd?.multi_loose_units) && selectedProd.multi_loose_units.length > 0));
                            const isOverStock = Boolean(item.itemName && Number(item.qty || 0) > totalAvailStock);

                            if (hasLooseGrid && selectedProd) {
                              const activeUomsForRow =
                                rowActiveUoms[idx] && rowActiveUoms[idx].length > 0
                                  ? rowActiveUoms[idx]
                                  : [bulkUnitLabel];
                              const parts = decomposeStockForActiveUoms(
                                totalAvailStock,
                                activeUomsForRow,
                                selectedProd
                              );
                              const primaryPart = parts[0];
                              const subParts = parts.slice(1);

                              return (
                                <div className="flex flex-col items-center justify-center font-mono gap-0.5">
                                  <span
                                    className={`font-black text-xs ${
                                      isOverStock || totalAvailStock <= 0
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                    }`}
                                  >
                                    {primaryPart
                                      ? `${primaryPart.qty.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${primaryPart.uom}`
                                      : `${totalAvailStock.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${bulkUnitLabel}`}
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
                                    {hasSelectedWh ? currentWh : 'Overall Stock'}
                                  </span>
                                </div>
                              );
                            }

                            const sInfo = formatStockWithBoxesAndPcs(totalAvailStock, selectedProd, item.uom);
                            if (sInfo.isBoxProduct && sInfo.piecesPerBox > 1) {
                              return (
                                <div className="flex flex-col items-center justify-center font-mono">
                                  <span className="font-black text-success text-xs">
                                    {sInfo.inlineText}
                                  </span>
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans">
                                    ({Math.round(totalAvailStock * sInfo.piecesPerBox)} Total {selectedProd?.loose_uom || 'PCS'})
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div className="flex flex-col items-center justify-center font-mono">
                                <span className={`font-black text-xs ${totalAvailStock > 0 ? 'text-success' : 'text-danger'}`}>
                                  {totalAvailStock.toFixed(2)} {uomName}
                                </span>
                                <span className="text-[9.5px] font-sans text-slate-400 dark:text-slate-500">
                                  {hasSelectedWh ? currentWh : 'Overall Stock'}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* QTY & PRICING (UOM) */}
                        <td className="p-2 min-w-[320px]">
                          {((isTile || allowLoose) && (pcsPerBox > 1 || (Array.isArray(selectedProd?.multi_loose_units) && selectedProd.multi_loose_units.length > 0))) ? (
                            <ChainedUomInputGrid
                              primaryUom={bulkUnitLabel || 'Unit'}
                              primaryQuantity={Number(item.qty) || 0}
                              primaryRate={Number(item.rp) || 0}
                              tiers={
                                Array.isArray(selectedProd?.multi_loose_units) && selectedProd.multi_loose_units.length > 0
                                  ? selectedProd.multi_loose_units
                                  : [{ uom: looseUnitLabel, ratio: pcsPerBox, costPrice: selectedProd?.loose_purchase_price, salePrice: selectedProd?.loose_sale_price }]
                              }
                              tierQuantities={item.tier_quantities}
                              tierRates={item.tier_rates}
                              mode="sale"
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
                                setFieldValue(`items.${idx}.qty`, totalConvertedPrimaryQty);
                                setFieldValue(`items.${idx}.tier_quantities`, tierQuantities);
                                setFieldValue(`items.${idx}.tier_rates`, tierRates);

                                if (totalConvertedPrimaryQty > 0 && totalLineAmount > 0) {
                                  const effectiveSaleRate = Number((totalLineAmount / totalConvertedPrimaryQty).toFixed(2));
                                  setFieldValue(`items.${idx}.rp`, effectiveSaleRate);
                                }

                                const disPer = Math.max(0, Number(item.discountPer) || 0);
                                if (disPer > 0) {
                                  setFieldValue(`items.${idx}.discountAmt`, Number(((totalLineAmount * disPer) / 100).toFixed(2)));
                                }
                              }}
                            />
                          ) : (
                            (() => {
                              const u = String(uomName || selectedProd?.uom || 'MTR').trim().toUpperCase();
                              const isDecimalUom = [
                                'MTR', 'METER', 'METERS', 'YD', 'YARD', 'YARDS', 'KG', 'LBS',
                                'LTR', 'FT', 'FEET', 'INCH', 'SQM', 'SQ.M'
                              ].some(du => u.includes(du));
                              const isOverStock = Boolean(item.itemName && Number(item.qty || 0) > totalAvailStock);

                              return (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className={`flex-1 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border transition ${isOverStock ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-400 dark:border-rose-800' : 'bg-white dark:bg-meta-4 border-slate-300 dark:border-strokedark'}`}>
                                      <input
                                        type="text"
                                        inputMode={isDecimalUom ? "decimal" : "numeric"}
                                        onKeyDown={(e) => {
                                          blockInvalidChar(e);
                                          if (!isDecimalUom && (e.key === '.' || e.key === 'Decimal')) {
                                            e.preventDefault();
                                          }
                                        }}
                                        name={`items.${idx}.qty`}
                                        value={item.qty === 0 ? '' : item.qty}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const regex = isDecimalUom ? /^\d*\.?\d*$/ : /^\d*$/;
                                          if (val === '' || regex.test(val)) {
                                            setFieldValue(`items.${idx}.qty`, val);
                                            const newQty = parseFloat(val) || 0;
                                            const currentRp = Math.max(0, Number(item.rp) || 0);
                                            const gross = newQty * currentRp;
                                            const disPer = Math.max(0, Number(item.discountPer) || 0);
                                            if (disPer > 0) {
                                              setFieldValue(`items.${idx}.discountAmt`, Number(((gross * disPer) / 100).toFixed(2)));
                                            }
                                          }
                                        }}
                                        placeholder="0"
                                        className={`w-full bg-transparent font-black text-center text-xs outline-none ${isOverStock ? 'text-rose-600 dark:text-rose-400' : 'text-primary'}`}
                                      />
                                      <span className="text-gray-400 text-[10px] font-bold select-none">{uomName}</span>
                                    </div>

                                    {/* Standard Price Input */}
                                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-strokedark rounded-xl px-2 py-1.5 w-28">
                                      <span className="text-[10px] text-gray-400 font-sans mr-1">Rs.</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        onKeyDown={blockInvalidChar}
                                        onInput={(e: any) => { if (Number(e.target.value) < 0) e.target.value = 0; }}
                                        name={`items.${idx}.rp`}
                                        value={item.rp}
                                        onChange={(e) => {
                                          const newRp = Math.max(0, Number(e.target.value) || 0);
                                          setFieldValue(`items.${idx}.rp`, newRp);
                                          const q = parseFloat(item.qty) || 0;
                                          const gross = q * newRp;
                                          const disPer = Math.max(0, Number(item.discountPer) || 0);
                                          if (disPer > 0) {
                                            setFieldValue(`items.${idx}.discountAmt`, Number(((gross * disPer) / 100).toFixed(2)));
                                          }
                                        }}
                                        className="w-full bg-transparent font-mono font-bold text-xs text-right outline-none text-slate-800 dark:text-slate-100"
                                      />
                                    </div>
                                  </div>

                                  {isOverStock && (
                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 text-center leading-tight">
                                      entering more than stock amount
                                    </span>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </td>

                        {showDiscount && (
                          <>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                onKeyDown={blockInvalidChar}
                                onInput={(e: any) => { if (Number(e.target.value) < 0) e.target.value = 0; }}
                                name={`items.${idx}.discountPer`}
                                value={item.discountPer ?? 0}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setFieldValue(`items.${idx}.discountPer`, val);
                                  const gross = Math.max(0, Number(item.qty) || 0) * Math.max(0, Number(item.rp) || 0);
                                  const amt = (gross * val) / 100;
                                  setFieldValue(`items.${idx}.discountAmt`, Number(amt.toFixed(2)));
                                }}
                                placeholder="0"
                                className="w-full bg-amber-50/40 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 text-center font-black outline-none border border-amber-300 dark:border-amber-700 rounded p-1 text-xs focus:border-amber-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                onKeyDown={blockInvalidChar}
                                onInput={(e: any) => { if (Number(e.target.value) < 0) e.target.value = 0; }}
                                name={`items.${idx}.discountAmt`}
                                value={item.discountAmt ?? 0}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setFieldValue(`items.${idx}.discountAmt`, val);
                                  const gross = Math.max(0, Number(item.qty) || 0) * Math.max(0, Number(item.rp) || 0);
                                  const per = gross > 0 ? (val / gross) * 100 : 0;
                                  setFieldValue(`items.${idx}.discountPer`, Number(per.toFixed(2)));
                                }}
                                placeholder="0"
                                className="w-full bg-amber-50/40 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 text-right font-black outline-none border border-amber-300 dark:border-amber-700 rounded p-1 text-xs focus:border-amber-500"
                              />
                            </td>
                          </>
                        )}

                        {values.applyFbrTax && (
                          <>
                            {values.taxScenario === 'Reduced Rate Sale' ? (
                              <>
                                <td className="p-2 w-20">
                                  <input
                                    type="number"
                                    min="0"
                                    onKeyDown={blockInvalidChar}
                                    onInput={(e: any) => { if (Number(e.target.value) < 0) e.target.value = 0; }}
                                    name={`items.${idx}.gstRate`}
                                    value={item.gstRate ?? 0}
                                    onChange={(e) => setFieldValue(`items.${idx}.gstRate`, Math.max(0, Number(e.target.value) || 0))}
                                    placeholder="0"
                                    className="w-full bg-emerald-50/40 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-center font-black outline-none border border-emerald-300 dark:border-emerald-700 rounded p-1 text-xs focus:border-emerald-500"
                                  />
                                </td>
                                <td className="p-2 w-20">
                                  <input
                                    type="number"
                                    min="0"
                                    onKeyDown={blockInvalidChar}
                                    onInput={(e: any) => { if (Number(e.target.value) < 0) e.target.value = 0; }}
                                    name={`items.${idx}.fTaxPer`}
                                    value={item.fTaxPer ?? 0}
                                    onChange={(e) => setFieldValue(`items.${idx}.fTaxPer`, Math.max(0, Number(e.target.value) || 0))}
                                    placeholder="0"
                                    className="w-full bg-emerald-50/40 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-center font-black outline-none border border-emerald-300 dark:border-emerald-700 rounded p-1 text-xs focus:border-emerald-500"
                                  />
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-2 text-center text-gray-400 font-sans">{lineCalc.activeGstRate}%</td>
                                <td className="p-2 text-center text-gray-400 font-sans">{lineCalc.activeFTaxPer}%</td>
                              </>
                            )}
                            <td className="p-2 text-right pr-2 text-gray-400">Rs. {lineCalc.gstAmt.toFixed(2)}</td>
                            <td className="p-2 text-right pr-2 text-gray-400">Rs. {lineCalc.fTaxAmt.toFixed(2)}</td>
                          </>
                        )}
                        <td className="p-2 text-right pr-4 text-success font-black">Rs. {lineCalc.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-1 w-8 text-center">{values.items.length > 1 && <button type="button" onClick={() => { remove(idx); triggerFeedbackSound('delete', userEmail); }} className="text-gray-400 hover:text-danger cursor-pointer"><FiTrash2 size={14} /></button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-2 bg-gray-50/10 dark:bg-meta-4/10 border-t border-stroke dark:border-strokedark text-left">
                <button
                  type="button"
                  onClick={() => push({ itemName: '', skuCode: '', warehouse: values.dispatchWarehouse || (warehousesList.length > 0 ? warehousesList[0] : 'Main Warehouse'), qty: 1, rp: 0, discountPer: 0, discountAmt: 0, gstRate: 0, fTaxPer: 0, amount: 0, availableQty: 0 })}
                  className="text-success font-bold hover:underline cursor-pointer"
                >
                  + Append Item Row
                </button>
              </div>
            </div>
          );
        }}
      </FieldArray>
    </div>
  );
};

export default InvoiceStandardItemsTable;
