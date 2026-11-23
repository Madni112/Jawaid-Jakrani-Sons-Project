import { LooseChainBadge } from '../../../../utils/looseUomHelpers';
import ChainedUomInputGrid from '../../../../components/ChainedUomInputGrid';
import WarehouseSearchableSelect from './WarehouseSearchableSelect';
import { DropdownPortal } from './DropdownPortal';
import { toast } from 'react-hot-toast';
import { formatStockWithBoxesAndPcs } from '../../../../utils/stockCalculator';
import { isTileProduct } from '../utils/salesReturnHelpers';
import React, { useRef } from 'react';
import { FieldArray } from 'formik';
import { MdAdd, MdDelete } from 'react-icons/md';
import { FiX } from 'react-icons/fi';

interface SalesReturnStandardItemsTableProps {
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  customerSoldProducts: any[];
  locations: any[];
  activeSkuIndex: number | null;
  setActiveSkuIndex: (idx: number | null) => void;
  activeProdNameIndex: number | null;
  setActiveProdNameIndex: (idx: number | null) => void;
  highlightedProdNameIndex: number;
  setHighlightedProdNameIndex: React.Dispatch<React.SetStateAction<number>>;
  productList: any[];
  blockInvalidChar: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  formatMoney: (val: number) => string;
  handleChange: (e: React.ChangeEvent<any>) => void;
  highlightedSkuIndex: number;
  setHighlightedSkuIndex: React.Dispatch<React.SetStateAction<number>>;
  getItemWarehouseStock: (productName: string, warehouseName: string, skuCode?: string) => number;
  getProductOverallStock?: (prodOrItem: any) => number;
  getMaxReturnable: (itemName: string, skuCode?: string) => number | null;
  selectedInvNo: string;
}

export const SalesReturnStandardItemsTable: React.FC<SalesReturnStandardItemsTableProps> = ({
  values,
  setFieldValue,
  customerSoldProducts,
  locations,
  activeSkuIndex,
  setActiveSkuIndex,
  activeProdNameIndex,
  setActiveProdNameIndex,
  highlightedProdNameIndex,
  setHighlightedProdNameIndex,
  productList,
  blockInvalidChar,
  formatMoney,
  handleChange,
  highlightedSkuIndex,
  setHighlightedSkuIndex,
  getItemWarehouseStock,
  getProductOverallStock,
  getMaxReturnable,
  selectedInvNo,
}) => {
  const skuRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const prodRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  return (
                <FieldArray name="items">
                  {({ push, remove }) => (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-boxdark p-5 shadow-xs space-y-4 overflow-visible">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Returned Items Line Items
                          </span>
                          {values.customerName && (
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                              Filtered to items sold to {values.customerName} ({customerSoldProducts.length} Products Found)
                            </span>
                          )}
                        </div>
                      </div>

                      {!values.customerName ? (
                        <div className="py-8 text-center text-slate-400 italic">
                          Please select a target customer above to inspect and return their purchased items
                        </div>
                      ) : (
                        <div className="overflow-visible min-h-[140px]">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-3 w-12 text-center">S#</th>
                                <th className="p-3 min-w-[240px]">Product (Name / Code)</th>
                                <th className="p-3 w-36">Return Warehouse</th>
                                <th className="p-3 w-20 text-center">UOM</th>
                                <th className="p-3 w-28 text-right">Sale Price (PKR)</th>
                                <th className="p-3 min-w-[220px] text-center">Return Qty (Boxes / Pcs / Sq.M)</th>
                                <th className="p-3 w-32 text-right">Amount (PKR)</th>
                                <th className="p-3 w-12 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {values.items.map((item: any, idx: number) => {
                                const isRowActive = activeSkuIndex === idx || activeProdNameIndex === idx;

                                const matchedProduct = productList.find(p => 
                                  (p.product_name || '').toLowerCase() === (item.itemName || '').toLowerCase() || 
                                  (item.skuCode && ((p.item_sr_no || '').toLowerCase() === item.skuCode.toLowerCase() || `SKU-${p.id}`.toLowerCase() === item.skuCode.toLowerCase()))
                                );

                                const rawPcs = Number(matchedProduct?.pieces_per_box || matchedProduct?.pcs_per_box || matchedProduct?.pieces_per_packing || 0);
                                const isTile = Boolean(
                                  matchedProduct && (
                                    String(matchedProduct.category || '').toLowerCase().includes('tile') || 
                                    String(matchedProduct.scenario_name || '').toLowerCase().includes('tile')
                                  ) && (rawPcs > 1 || String(matchedProduct.scenario_name || '').toLowerCase().includes('tile'))
                                );
                                const allowLoose = Boolean(matchedProduct?.allow_loose_sales || isTile);
                                const looseRatio = Number(matchedProduct?.loose_conversion_ratio || rawPcs || (isTile ? 4 : 1)) || 1;
                                const pcsPerBox = looseRatio > 1 ? looseRatio : (isTile ? 4 : 1);
                                const bulkUnitLabel = matchedProduct?.uom || (isTile ? 'Box' : 'Unit');
                                const looseUnitLabel = matchedProduct?.loose_uom || (isTile ? 'Pcs' : 'Units');

                                const maxRet = getMaxReturnable ? getMaxReturnable(item.itemName, item.skuCode) : null;
                                const isExceeded = maxRet !== null && Boolean(item.itemName) && Number(item.qty || 0) > maxRet + 0.0001;
                                const whStock = item.itemName ? getItemWarehouseStock(item.itemName, item.warehouse || values.sourceWarehouse, item.skuCode) : 0;

                                let rowAmount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                                if (allowLoose && pcsPerBox > 1) {
                                  const bulkCount = Math.floor(Number(item.qty || 0));
                                  const looseCount = Math.round((Number(item.qty || 0) - bulkCount) * pcsPerBox);
                                  const piecePrice = item.pieceRate !== undefined && item.pieceRate !== ''
                                    ? Number(item.pieceRate)
                                    : (Number(matchedProduct?.loose_sale_price) > 0 ? Number(matchedProduct.loose_sale_price) : (pcsPerBox > 0 ? Number(item.rate || 0) / pcsPerBox : 0));
                                  rowAmount = Number(((bulkCount * Number(item.rate || 0)) + (looseCount * piecePrice)).toFixed(2));
                                }

                                let tileWidthCm = 60;
                                let tileHeightCm = 60;
                                const desc = matchedProduct?.product_description || matchedProduct?.product_name || item.itemName || '';
                                const sku = matchedProduct?.item_sr_no || item.skuCode || '';
                                const sizeMatch = desc.match(/Size:\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*cm/i) ||
                                                  desc.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i) ||
                                                  sku.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
                                if (sizeMatch) {
                                  tileHeightCm = Number(sizeMatch[1]) || 60;
                                  tileWidthCm = Number(sizeMatch[2]) || 60;
                                }
                                const perPieceSqm = (tileHeightCm * tileWidthCm) / 10000;
                                const perBoxSqm = perPieceSqm * pcsPerBox;

                                const currentQty = Number(item.qty || 0);
                                const boxes = Math.floor(currentQty);
                                const loosePcs = Math.round((currentQty - boxes) * pcsPerBox);
                                const totalLineSqm = (boxes * perBoxSqm) + (loosePcs * perPieceSqm);

                                return (
                                  <tr key={idx} className={`transition ${isRowActive ? 'relative z-[99999] bg-slate-50/90 dark:bg-slate-800/90 shadow-xs' : 'relative z-[1]'} hover:bg-slate-50/60 dark:hover:bg-slate-800/40`}>
                                    {/* S# */}
                                    <td className="p-3 text-center font-bold text-slate-400 font-mono">
                                      {idx + 1}
                                    </td>

                                    {/* Product (Name / Code) Unified Autocomplete */}
                                    <td className={`p-2.5 relative prod-name-container ${activeProdNameIndex === idx ? 'z-[999999]' : ''}`}>
                                      {(() => {
                                        const query = (item.itemName || '').toLowerCase().trim();
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

                                        const soldGoods = customerSoldProducts.filter(p => !checkIsTile(p));
                                        const combinedGoodsList = soldGoods.map(p => ({ ...p, isSoldToCustomer: true }));

                                        const exactSelected = combinedGoodsList.some(p => 
                                          (p.product_name && p.product_name.toLowerCase() === query) ||
                                          (item.skuCode && p.item_sr_no && p.item_sr_no.toLowerCase() === (item.skuCode || '').toLowerCase().trim())
                                        );
                                        const searchTerm = exactSelected && activeProdNameIndex !== idx ? '' : query;

                                        const filteredList = combinedGoodsList.filter(p => {
                                          if (!searchTerm) return true;
                                          return (p.product_name || '').toLowerCase().includes(searchTerm) ||
                                                 (p.item_sr_no || '').toLowerCase().includes(searchTerm) ||
                                                 (`sku-${p.id || ''}`).toLowerCase().includes(searchTerm);
                                        });

                                        const lookupItem = (queryStr: string) => {
                                          const q = (queryStr || '').trim().toLowerCase();
                                          if (!q) return null;
                                          const inSold = customerSoldProducts.find(p => 
                                            (p.item_sr_no || '').toLowerCase() === q || 
                                            (p.product_name || '').toLowerCase() === q ||
                                            (`sku-${p.id || ''}`).toLowerCase() === q
                                          );
                                          if (inSold && Number(inSold.sale_price) > 0) return inSold;

                                          const inProd = productList.find(p => 
                                            (p.item_sr_no || '').toLowerCase() === q || 
                                            (p.product_name || '').toLowerCase() === q ||
                                            (`sku-${p.id || ''}`).toLowerCase() === q
                                          );
                                          if (inProd) {
                                            const salePrice = Number(inSold?.sale_price || inProd.retail_price || inProd.sales_price || inProd.price || 0);
                                            return {
                                              product_name: inProd.product_name,
                                              item_sr_no: inProd.item_sr_no || `SKU-${inProd.id}`,
                                              sale_price: salePrice,
                                              uom: inProd.uom || inSold?.uom || 'Nos'
                                            };
                                          }
                                          return inSold || null;
                                        };

                                        const handleSelectProduct = (prod: any, price: number) => {
                                          const matched = productList.find(pr =>
                                            (prod.product_name && pr.product_name.toLowerCase() === prod.product_name.toLowerCase()) ||
                                            (prod.item_sr_no && pr.item_sr_no.toLowerCase() === prod.item_sr_no.toLowerCase())
                                          );
                                          const targetProd = matched || prod;

                                          if (isTileProduct(targetProd)) {
                                            const defaultWh = item.warehouse || values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse');
                                            const ppb = Number(targetProd.loose_conversion_ratio || targetProd.pieces_per_box || targetProd.pcs_per_box || 4) || 4;
                                            const newTileItem = {
                                              id: Date.now(),
                                              itemName: targetProd.product_name,
                                              skuCode: targetProd.item_sr_no || '',
                                              warehouse: defaultWh,
                                              boxQty: 1,
                                              loosePcs: 0,
                                              pricePerBox: Number(price) || 0,
                                              pricePerSqm: 0,
                                              pricePerPiece: ppb > 0 ? (Number(price) || 0) / ppb : 0,
                                              totalAmount: Number(price) || 0,
                                              totalSqm: 0,
                                              isTileItem: true
                                            };
                                            setFieldValue('showTileSection', true);
                                            const existingTiles = Array.isArray(values.tileItems) ? values.tileItems.filter((t: any) => t.itemName) : [];
                                            setFieldValue('tileItems', [...existingTiles, newTileItem]);
                                            setFieldValue(`items.${idx}.itemName`, '');
                                            setFieldValue(`items.${idx}.skuCode`, '');
                                            setFieldValue(`items.${idx}.rate`, 0);
                                            setActiveProdNameIndex(null);
                                            if (setActiveSkuIndex) setActiveSkuIndex(null);
                                            return;
                                          }

                                          setFieldValue(`items.${idx}.itemName`, prod.product_name);
                                          setFieldValue(`items.${idx}.skuCode`, prod.item_sr_no || '');
                                          setFieldValue(`items.${idx}.rate`, price);
                                          setFieldValue(`items.${idx}.uom`, prod.uom || 'Nos');
                                          setActiveProdNameIndex(null);
                                          if (setActiveSkuIndex) setActiveSkuIndex(null);
                                        };

                                        return (
                                          <div className="relative">
                                            <input
                                              type="text"
                                              value={item.itemName || ''}
                                              onFocus={() => {
                                                setActiveProdNameIndex(idx);
                                                if (setActiveSkuIndex) setActiveSkuIndex(null);
                                                setHighlightedProdNameIndex(0);
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'ArrowDown') {
                                                  e.preventDefault();
                                                  setHighlightedProdNameIndex(prev => Math.min(prev + 1, filteredList.length - 1));
                                                } else if (e.key === 'ArrowUp') {
                                                  e.preventDefault();
                                                  setHighlightedProdNameIndex(prev => Math.max(prev - 1, 0));
                                                } else if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  if (filteredList[highlightedProdNameIndex]) {
                                                    const prod = filteredList[highlightedProdNameIndex];
                                                    const effectivePrice = Number(prod.sale_price) > 0 
                                                      ? Number(prod.sale_price) 
                                                      : Number(lookupItem(prod.product_name || prod.item_sr_no)?.sale_price || 0);
                                                    handleSelectProduct(prod, effectivePrice);
                                                  }
                                                } else if (e.key === 'Escape' || e.key === 'Tab') {
                                                  setActiveProdNameIndex(null);
                                                }
                                              }}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setFieldValue(`items.${idx}.itemName`, val);
                                                setActiveProdNameIndex(idx);
                                                setHighlightedProdNameIndex(0);
                                                
                                              }}
                                              ref={(el) => {
                                                prodRefs.current[idx] = el;
                                              }}
                                              placeholder="Search product by name or SKU..."
                                              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 pr-7 font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 text-xs outline-none focus:border-emerald-600 shadow-xs"
                                            />

                                            {Boolean(item.itemName || item.skuCode) && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setFieldValue(`items.${idx}.itemName`, '');
                                                  setFieldValue(`items.${idx}.skuCode`, '');
                                                  setFieldValue(`items.${idx}.rate`, 0);
                                                  setActiveProdNameIndex(null);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
                                                title="Clear product"
                                              >
                                                <FiX className="w-3.5 h-3.5" />
                                              </button>
                                            )}

                                            {item.skuCode && (
                                              <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                Code: {item.skuCode}
                                              </div>
                                            )}

                                            <DropdownPortal
                                              isOpen={Boolean(activeProdNameIndex === idx && filteredList.length > 0)}
                                              anchorEl={prodRefs.current[idx]}
                                              minWidth={340}
                                              maxWidth={440}
                                            >
                                              <div className="w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-700/60 scrollbar-thin">
                                                {filteredList.map((prod, pIdx) => {
                                                  const displayPrice = Number(prod.sale_price) > 0 
                                                    ? Number(prod.sale_price) 
                                                    : Number(lookupItem(prod.product_name || prod.item_sr_no)?.sale_price || 0);

                                                  return (
                                                    <div
                                                      key={pIdx}
                                                      onMouseEnter={() => setHighlightedProdNameIndex(pIdx)}
                                                      onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleSelectProduct(prod, displayPrice);
                                                      }}
                                                      className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                                        highlightedProdNameIndex === pIdx
                                                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                                                          : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                                                      }`}
                                                    >
                                                      <div className="flex flex-col">
                                                        <span className="font-bold">{prod.product_name}</span>
                                                        <span className="text-[10px] text-slate-400">
                                                          {prod.item_sr_no ? `SKU: ${prod.item_sr_no} • ` : ''}Sold Qty: {formatStockWithBoxesAndPcs(prod.totalSoldQty, prod).inlineText}
                                                        </span>
                                                      </div>
                                                      <div className="text-right font-mono flex flex-col items-end">
                                                        <span className="font-black text-emerald-700 block">Rs. {formatMoney(displayPrice)}</span>
                                                        {(() => {
                                                          const avail = getProductOverallStock ? getProductOverallStock(prod) : Number(prod.current_stock || 0);
                                                          return (
                                                            <span className={`text-[10px] font-bold ${avail > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                              Avail: {formatStockWithBoxesAndPcs(avail, prod).inlineText}
                                                            </span>
                                                          );
                                                        })()}
                                                        {prod.lastInvNo && <span className="text-[10px] text-slate-400">{prod.lastInvNo}</span>}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            </DropdownPortal>
                                          </div>
                                        );
                                      })()}
                                    </td>

                                    {/* Warehouse */}
                                    <td className="p-2.5">
                                      <WarehouseSearchableSelect
                                        value={item.warehouse || values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse')}
                                        onChange={(newWh) => setFieldValue(`items.${idx}.warehouse`, newWh)}
                                        locations={locations}
                                        selectedProductName={item.itemName}
                                        getWarehouseStock={(pName, wh) => {
                                          const matched = productList.find(p => (p.product_name || '').toLowerCase() === (pName || '').toLowerCase());
                                          const qty = getItemWarehouseStock(pName, wh, item.skuCode || matched?.item_sr_no);
                                          return {
                                            text: formatStockWithBoxesAndPcs(qty, matched).inlineText,
                                            hasStock: qty > 0,
                                            qty
                                          };
                                        }}
                                        isTile={isTile}
                                      />
                                      {item.itemName && (
                                        <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                          Avail Stock: <span className="font-bold text-slate-700 dark:text-slate-300">{formatStockWithBoxesAndPcs(whStock, matchedProduct).inlineText}</span>
                                        </div>
                                      )}
                                    </td>

                                    {/* UOM */}
                                    <td className="p-2.5 text-center font-bold text-slate-500 font-mono">
                                      {item.uom || 'Nos'}
                                    </td>

                                    {/* Sale Price */}
                                    <td className="p-2.5">
                                      <input
                                        type="number"
                                        name={`items.${idx}.rate`}
                                        onKeyDown={blockInvalidChar}
                                        onChange={handleChange}
                                        value={item.rate}
                                        placeholder="0"
                                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-right bg-white dark:bg-slate-800 text-xs outline-none focus:border-emerald-600"
                                      />
                                      {((isTile || allowLoose) && pcsPerBox > 1) && (
                                        <div className="flex items-center gap-1 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded px-1.5 py-0.5 mt-1">
                                          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                            /{looseUnitLabel}:
                                          </span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            onKeyDown={blockInvalidChar}
                                            value={item.pieceRate !== undefined && item.pieceRate !== '' ? item.pieceRate : (Number(matchedProduct?.loose_sale_price) > 0 ? Number(matchedProduct.loose_sale_price) : (pcsPerBox > 0 ? Number(((Number(item.rate) || 0) / pcsPerBox).toFixed(2)) : ''))}
                                            onChange={(e) => {
                                              const enteredPrice = Math.max(0, Number(e.target.value) || 0);
                                              setFieldValue(`items.${idx}.pieceRate`, enteredPrice);
                                            }}
                                            placeholder="0"
                                            className="w-full bg-transparent font-mono font-bold text-[11px] text-right text-emerald-700 dark:text-emerald-400 outline-none"
                                          />
                                        </div>
                                      )}
                                    </td>

                                    {/* Return Qty with Dedicated Boxes & Loose Pieces & Sq.Mtr for Tiles */}
                                    <td className="p-2.5 min-w-[220px]">
                                      {isTile ? (
                                        <div className="flex flex-col gap-1">
                                          {/* Top Badges */}
                                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1 font-mono">
                                            <span className="text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800/60 font-bold">
                                              Box: {perBoxSqm.toFixed(2)} sq.m
                                            </span>
                                            <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-bold">
                                              Pc: {perPieceSqm.toFixed(4)} sq.m
                                            </span>
                                          </div>

                                          {/* Inputs Container: Boxes + Loose Pieces */}
                                          <div className={`flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/90 p-1.5 rounded-lg border shadow-inner ${isExceeded ? 'border-red-500 bg-red-50/90 ring-2 ring-red-500/50' : 'border-slate-200 dark:border-slate-700'}`}>
                                            {/* BOXES INPUT */}
                                            <div className="flex-1 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus-within:border-emerald-600 shadow-xs">
                                              <input
                                                type="text"
                                                inputMode="numeric"
                                                onKeyDown={blockInvalidChar}
                                                value={(() => {
                                                  const b = Math.floor(Number(item.qty || 0));
                                                  return b === 0 ? '' : b;
                                                })()}
                                                placeholder="0"
                                                onChange={(e) => {
                                                  const val = e.target.value.trim();
                                                  const newBoxes = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                                  const currentLoose = Math.round((Number(item.qty || 0) - Math.floor(Number(item.qty || 0))) * pcsPerBox);
                                                  const combinedQty = Number((newBoxes + currentLoose / pcsPerBox).toFixed(3));
                                                  setFieldValue(`items.${idx}.qty`, combinedQty);
                                                }}
                                                className="w-full bg-transparent text-center font-black text-xs text-emerald-700 dark:text-emerald-400 outline-none min-w-[32px]"
                                              />
                                              <span className="text-[10px] font-bold text-slate-400 pl-1 select-none">Box</span>
                                            </div>

                                            <span className="text-slate-400 font-black text-xs select-none">+</span>

                                            {/* LOOSE PIECES INPUT */}
                                            <div className="flex-1 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus-within:border-emerald-600 shadow-xs">
                                              <input
                                                type="text"
                                                inputMode="numeric"
                                                onKeyDown={blockInvalidChar}
                                                value={(() => {
                                                  const currentLoose = Math.round((Number(item.qty || 0) - Math.floor(Number(item.qty || 0))) * pcsPerBox);
                                                  return currentLoose === 0 ? '' : currentLoose;
                                                })()}
                                                placeholder="0"
                                                onChange={(e) => {
                                                  const val = e.target.value.trim();
                                                  const enteredLoose = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                                  const currentBoxes = Math.floor(Number(item.qty || 0));

                                                  const extraBoxes = Math.floor(enteredLoose / pcsPerBox);
                                                  const remLoose = enteredLoose % pcsPerBox;
                                                  const finalBoxes = currentBoxes + extraBoxes;
                                                  const combinedQty = remLoose > 0 
                                                    ? Number((finalBoxes + remLoose / pcsPerBox).toFixed(3)) 
                                                    : finalBoxes;

                                                  setFieldValue(`items.${idx}.qty`, combinedQty);
                                                }}
                                                className="w-full bg-transparent text-center font-black text-xs text-emerald-600 dark:text-emerald-400 outline-none min-w-[32px]"
                                              />
                                              <span className="text-[10px] font-bold text-slate-400 pl-1 select-none">Pcs</span>
                                            </div>
                                          </div>

                                          {/* Bottom Total Summary */}
                                          <div className="text-center font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/30 rounded py-0.5 border border-teal-200/60 dark:border-teal-800/40">
                                            Total: <span className="text-xs font-black">{totalLineSqm.toFixed(2)}</span> sq.m
                                            <span className="text-slate-400 font-sans font-normal ml-1">({boxes} Box{boxes !== 1 ? 'es' : ''}{loosePcs > 0 ? ` + ${loosePcs} Pcs` : ''})</span>
                                          </div>
                                        </div>
                                      ) : allowLoose && pcsPerBox > 1 ? (
                                        /* DUAL UNIT INPUT FOR GENERAL LOOSE SELLABLE PRODUCTS (KG+GM, LTR+ML, BOX+PCS) */
                                        (() => {
                                          const currentQty = Number(item.qty || 0);
                                          const bulkCount = Math.floor(currentQty);
                                          const looseCount = Math.round((currentQty - bulkCount) * pcsPerBox);

                                          return (
                                            <div className="flex flex-col gap-1">
                                              <div className={`flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/90 p-1.5 rounded-lg border shadow-inner ${isExceeded ? 'border-red-500 bg-red-50/90 ring-2 ring-red-500/50' : 'border-slate-200 dark:border-slate-700'}`}>
                                                {/* BULK UNIT INPUT */}
                                                <div className="flex-1 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus-within:border-emerald-600 shadow-xs">
                                                  <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    onKeyDown={blockInvalidChar}
                                                    value={bulkCount === 0 ? '' : bulkCount}
                                                    placeholder="0"
                                                    onChange={(e) => {
                                                      const val = e.target.value.trim();
                                                      const newBulk = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                                      const currentLoose = Math.round((Number(item.qty || 0) - Math.floor(Number(item.qty || 0))) * pcsPerBox);
                                                      const combinedQty = Number((newBulk + currentLoose / pcsPerBox).toFixed(3));
                                                      setFieldValue(`items.${idx}.qty`, combinedQty);
                                                    }}
                                                    className="w-full bg-transparent text-center font-black text-xs text-emerald-700 dark:text-emerald-400 outline-none min-w-[32px]"
                                                  />
                                                  <span className="text-[10px] font-bold text-slate-400 pl-1 select-none">{bulkUnitLabel}</span>
                                                </div>

                                                <span className="text-slate-400 font-black text-xs select-none">+</span>

                                                {/* LOOSE SUB-UNIT INPUT */}
                                                <div className="flex-1 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus-within:border-emerald-600 shadow-xs">
                                                  <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    onKeyDown={blockInvalidChar}
                                                    value={looseCount === 0 ? '' : looseCount}
                                                    placeholder="0"
                                                    onChange={(e) => {
                                                      const val = e.target.value.trim();
                                                      const enteredLoose = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                                      const currentBulk = Math.floor(Number(item.qty || 0));

                                                      const extraBulk = Math.floor(enteredLoose / pcsPerBox);
                                                      const remLoose = enteredLoose % pcsPerBox;
                                                      const finalBulk = currentBulk + extraBulk;
                                                      const combinedQty = remLoose > 0 
                                                        ? Number((finalBulk + remLoose / pcsPerBox).toFixed(3)) 
                                                        : finalBulk;

                                                      setFieldValue(`items.${idx}.qty`, combinedQty);
                                                    }}
                                                    className="w-full bg-transparent text-center font-black text-xs text-emerald-600 dark:text-emerald-400 outline-none min-w-[32px]"
                                                  />
                                                  <span className="text-[10px] font-bold text-slate-400 pl-1 select-none">{looseUnitLabel}</span>
                                                </div>
                                              </div>

                                              <div className="text-center font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                                Total: <strong>{currentQty}</strong> {bulkUnitLabel} ({bulkCount} {bulkUnitLabel} + {looseCount} {looseUnitLabel})
                                              </div>
                                              {isExceeded && (
                                                <div className="mt-1 text-[10px] text-red-600 dark:text-red-400 font-bold text-center">
                                                  ⚠️ Entered return quantity is more than the sale to {values.customerName || 'customer'}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()
                                      ) : (
                                        (() => {
                                          const u = String(item.uom || matchedProduct?.uom || '').trim().toUpperCase();
                                          const isDecimalUom = [
                                            'KG', 'KILOGRAM', 'GM', 'GRAM', 'TON', 'METRIC TON', 'LBS',
                                            'LTR', 'LITER', 'LITRE', 'ML', 'GAL',
                                            'MTR', 'METER', 'FT', 'FEET', 'INCH', 'CM', 'MM', 'YD',
                                            'SQM', 'SQ.M', 'SQ.MTR', 'SQ.FT', 'SQF', 'SQY', 'SQUARE METER'
                                          ].includes(u);

                                          return (
                                            <div className="flex flex-col gap-1">
                                              <div className={`flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1.5 border focus-within:border-emerald-600 ${isExceeded ? 'border-red-500 bg-red-50/90 ring-2 ring-red-500/50' : 'border-slate-200 dark:border-slate-700'}`}>
                                                <input
                                                  type="text"
                                                  inputMode={isDecimalUom ? "decimal" : "numeric"}
                                                  name={`items.${idx}.qty`}
                                                  onKeyDown={(e) => {
                                                    blockInvalidChar(e);
                                                    if (!isDecimalUom && (e.key === '.' || e.key === 'Decimal')) {
                                                      e.preventDefault();
                                                    }
                                                  }}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    const regex = isDecimalUom ? /^\d*\.?\d*$/ : /^\d*$/;
                                                    if (val === '' || regex.test(val)) {
                                                      setFieldValue(`items.${idx}.qty`, val);
                                                    }
                                                  }}
                                                  value={item.qty ?? ''}
                                                  placeholder="1"
                                                  className="w-full bg-transparent font-mono font-black text-center text-xs outline-none text-emerald-800 dark:text-emerald-400"
                                                />
                                                {item.uom && (
                                                  <span className="text-[10px] font-bold text-slate-400 uppercase select-none pr-1">
                                                    {item.uom}
                                                  </span>
                                                )}
                                              </div>
                                              {isExceeded && (
                                                <div className="mt-0.5 text-[10px] text-red-600 dark:text-red-400 font-bold text-center">
                                                  ⚠️ Entered return quantity is more than the sale to {values.customerName || 'customer'}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()
                                      )}
                                    </td>

                                    {/* Net Row Amount */}
                                    <td className="p-2.5 text-right font-mono font-black text-xs text-slate-900 dark:text-white">
                                      Rs. {formatMoney(rowAmount)}
                                    </td>

                                    {/* Delete Row */}
                                    <td className="p-2.5 text-center">
                                      <button
                                        type="button"
                                        title={values.items.length > 1 ? "Remove this item row" : "Clear this row"}
                                        onClick={() => {
                                          if (values.items.length > 1) {
                                            remove(idx);
                                          } else {
                                            setFieldValue(`items.0.skuCode`, '');
                                            setFieldValue(`items.0.itemName`, '');
                                            setFieldValue(`items.0.rate`, 0);
                                            setFieldValue(`items.0.qty`, 1);
                                            setFieldValue(`items.0.uom`, 'Nos');
                                          }
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                                      >
                                        <MdDelete size={17} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {/* Tile Products Toggle Pill */}
                        <div
                          onClick={() => {
                            if (!values.customerName) {
                              toast.error('Please select a customer first!');
                              return;
                            }
                            const nextVal = !values.showTileSection;
                            setFieldValue('showTileSection', nextVal);
                            const defaultWh = values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse');
                            if (nextVal && (!values.tileItems || values.tileItems.length === 0)) {
                              setFieldValue('tileItems', [{
                                id: Date.now(),
                                itemName: '',
                                skuCode: '',
                                warehouse: defaultWh,
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
                              }]);
                            }
                          }}
                          className={`cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border shadow-xs ${
                            values.showTileSection
                              ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 dark:bg-boxdark dark:text-slate-200 dark:border-slate-700 hover:border-emerald-500'
                          }`}
                        >
                          Tile
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!values.customerName) {
                              toast.error('Please select a customer first!');
                              return;
                            }
                            push({
                              skuCode: '',
                              itemName: '',
                              warehouse: values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse'),
                              qty: 1,
                              rate: 0,
                              uom: 'Nos'
                            });
                          }}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold transition text-xs cursor-pointer shadow-xs"
                        >
                          <MdAdd size={16} /> Add Item Row
                        </button>
                      </div>
                    </div>
                  )}
                </FieldArray>
  );
};


export default SalesReturnStandardItemsTable;
