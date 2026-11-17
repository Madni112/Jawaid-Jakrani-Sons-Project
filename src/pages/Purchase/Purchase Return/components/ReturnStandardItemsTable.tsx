import WarehouseSearchableSelect from './WarehouseSearchableSelect';
import React, { useRef, useState } from 'react';
import { FieldArray } from 'formik';
import { MdDelete, MdAdd } from 'react-icons/md';
import { DropdownPortal } from './DropdownPortal';

interface ReturnStandardItemsTableProps {
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  productList: any[];
  boughtProducts: any[];
  locations: any[];
  workflowSettings: any;
  getItemWarehouseStock: (productName: string, warehouseName: string, itemCode?: string) => number;
  getProductOverallStock: (p: any) => number;
  handleProductSelection: (p: any, idx: number) => void;
  blockInvalidChar: (e: React.KeyboardEvent) => void;
  formatMoney: (val: number | string | undefined | null) => string;
  formatStockWithBoxesAndPcs: (qty: number, prod?: any) => { inlineText: string; boxes: number; loose: number; uom: string; looseUom: string };
}

export const ReturnStandardItemsTable: React.FC<ReturnStandardItemsTableProps> = ({
  values,
  setFieldValue,
  productList,
  boughtProducts,
  locations,
  workflowSettings,
  getItemWarehouseStock,
  getProductOverallStock,
  handleProductSelection,
  blockInvalidChar,
  formatMoney,
  formatStockWithBoxesAndPcs,
  getMaxReturnable,
  selectedPoNo,
}) => {
  const [activeSkuIndex, setActiveSkuIndex] = useState<number | null>(null);
  const [highlightedSkuIndex, setHighlightedSkuIndex] = useState(0);

  const [activeProdNameIndex, setActiveProdNameIndex] = useState<number | null>(null);
  const [highlightedProdNameIndex, setHighlightedProdNameIndex] = useState(0);

  const [activeRowWhIndex, setActiveRowWhIndex] = useState<number | null>(null);
  const [highlightedRowWhIndex, setHighlightedRowWhIndex] = useState(0);

  const skuRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const prodRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const whRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const candidateProducts = boughtProducts.length > 0 ? boughtProducts : productList;

  return (
    <div className="w-full">
      <FieldArray name="items">
        {({ remove }) => {
          const hasDiscount = values.items.some((i: any) => Number(i.discountAmt) > 0 || Number(i.discountPer) > 0);
          return (
            <div className="border border-stroke dark:border-strokedark rounded-sm relative z-30 overflow-x-auto bg-white dark:bg-boxdark transition-all duration-200 pb-4">
              <div className="w-full min-w-max">
                <table className="w-full table-auto border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4 text-xs font-bold uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                      <th className="p-2 w-10 text-center">S#</th>
                      <th className="p-2 w-36">Code (Search)</th>
                      <th className="p-2 min-w-[200px]">Product Description</th>
                      <th className="p-2 w-36">Destination Warehouse</th>
                      <th className="p-2 w-32 text-center">Return Qty (Boxes / Pcs)</th>
                      <th className="p-2 w-28 text-right">Cost Price (PKR)</th>
                      {hasDiscount && (
                        <>
                          <th className="p-2 w-20 text-center text-amber-700 bg-amber-50/40 dark:bg-amber-950/20">Disc %</th>
                          <th className="p-2 w-28 text-right text-amber-700 bg-amber-50/40 dark:bg-amber-950/20">Disc Amt</th>
                        </>
                      )}
                      <th className="p-2 w-28 text-right pr-4">Net Total</th>
                      <th className="p-2 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    {values.items.map((item: any, idx: number) => {
                      const isCurrentSkuActive = activeSkuIndex === idx;
                      const isCurrentProdNameActive = activeProdNameIndex === idx;

                      const matchedProduct = productList.find(
                        (p: any) =>
                          (item.itemName && p.product_name === item.itemName) ||
                          (item.skuCode && (p.item_sr_no === item.skuCode || p.sku === item.skuCode || `SKU-${p.id}` === item.skuCode))
                      );

                      const rawPcs = Number(matchedProduct?.pieces_per_box ?? matchedProduct?.pcs_per_box ?? matchedProduct?.pieces_per_packing ?? 0);
                      const isTile = Boolean(
                        matchedProduct &&
                          (String(matchedProduct.category || '').toLowerCase().includes('tile') ||
                            String(matchedProduct.scenario_name || '').toLowerCase().includes('tile')) &&
                          (rawPcs > 1 || String(matchedProduct.scenario_name || '').toLowerCase().includes('tile'))
                      );
                      const allowLoose = Boolean(matchedProduct?.allow_loose_sales || isTile);
                      const looseRatio = Number(matchedProduct?.loose_conversion_ratio || rawPcs || (isTile ? 4 : 1)) || 1;
                      const pcsPerBox = looseRatio > 1 ? looseRatio : isTile ? 4 : 1;
                      const bulkUnitLabel = matchedProduct?.uom || (isTile ? 'Box' : 'Unit');
                      const looseUnitLabel = matchedProduct?.loose_uom || (isTile ? 'Pcs' : 'Units');
                      const uomString = matchedProduct ? matchedProduct.uom : item.uom || 'NOS';

                      let gross = Number(item.qty || 0) * Number(item.rate || 0);
                      if (allowLoose && pcsPerBox > 1) {
                        const bulkCount = Math.floor(Number(item.qty || 0));
                        const looseCount = Math.round((Number(item.qty || 0) - bulkCount) * pcsPerBox);
                        const pcCost =
                          item.pieceRate !== undefined && item.pieceRate !== ''
                            ? Number(item.pieceRate)
                            : Number(matchedProduct?.loose_purchase_price) > 0
                            ? Number(matchedProduct.loose_purchase_price)
                            : pcsPerBox > 0
                            ? Number(item.rate || 0) / pcsPerBox
                            : 0;
                        gross = Number((bulkCount * Number(item.rate || 0) + looseCount * pcCost).toFixed(2));
                      }
                      const lineTotal = gross - Number(item.discountAmt || 0);

                      return (
                        <tr
                          key={idx}
                          className={`text-xs transition ${
                            isCurrentSkuActive || isCurrentProdNameActive
                              ? 'relative z-50 bg-slate-50/90 dark:bg-meta-4/20'
                              : 'relative z-10 bg-white dark:bg-boxdark hover:bg-slate-50 dark:hover:bg-meta-4/10'
                          }`}
                        >
                          <td className="p-3 text-center text-gray-400 font-sans">{idx + 1}</td>

                          {/* 1. Searchable Code */}
                          <td className="p-3 relative sku-container">
                            {(() => {
                              const query = (item.skuCode || '').toLowerCase().trim();
                              const filteredBySku = candidateProducts.filter((p: any) => {
                                if (!query) return true;
                                const sku = (p.item_sr_no || p.sku || `SKU-${p.id || ''}`).toLowerCase();
                                const name = (p.product_name || '').toLowerCase();
                                return sku.includes(query) || name.includes(query);
                              });

                              return (
                                <div className="relative">
                                  <input
                                    type="text"
                                    autoComplete="off"
                                    ref={(el) => {
                                      skuRefs.current[idx] = el;
                                    }}
                                    name={`items.${idx}.skuCode`}
                                    value={item.skuCode || ''}
                                    onFocus={() => {
                                      setActiveSkuIndex(idx);
                                      setActiveProdNameIndex(null);
                                      setHighlightedSkuIndex(0);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setHighlightedSkuIndex((prev) => (prev < filteredBySku.length - 1 ? prev + 1 : 0));
                                      } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setHighlightedSkuIndex((prev) => (prev > 0 ? prev - 1 : filteredBySku.length - 1));
                                      } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (filteredBySku[highlightedSkuIndex]) {
                                          handleProductSelection(filteredBySku[highlightedSkuIndex], idx);
                                          setActiveSkuIndex(null);
                                        }
                                      } else if (e.key === 'Escape' || e.key === 'Tab') {
                                        setActiveSkuIndex(null);
                                      }
                                    }}
                                    onChange={(e) => {
                                      setFieldValue(`items.${idx}.skuCode`, e.target.value);
                                      setActiveSkuIndex(idx);
                                    }}
                                    placeholder="TYPE SKU..."
                                    className="w-full rounded border border-stroke dark:border-strokedark p-1.5 bg-transparent font-mono font-bold text-xs uppercase outline-none focus:border-primary"
                                  />

                                  {/* Floating SKU Dropdown */}
                                  <DropdownPortal isOpen={isCurrentSkuActive && filteredBySku.length > 0} anchorEl={skuRefs.current[idx]}>
                                    <div className="w-full max-h-56 overflow-y-auto bg-white dark:bg-[#1A222C] border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                                      {filteredBySku.map((prod: any, pIdx: number) => {
                                        const displaySku = prod.item_sr_no || prod.sku || `SKU-${prod.id || ''}`;
                                        return (
                                          <div
                                            key={prod.id || pIdx}
                                            onMouseEnter={() => setHighlightedSkuIndex(pIdx)}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleProductSelection(prod, idx);
                                              setActiveSkuIndex(null);
                                            }}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleProductSelection(prod, idx);
                                              setActiveSkuIndex(null);
                                            }}
                                            className={`p-2.5 cursor-pointer text-xs flex justify-between items-center ${
                                              highlightedSkuIndex === pIdx
                                                ? 'bg-primary/10 text-primary font-bold'
                                                : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                                            }`}
                                          >
                                            <div className="flex flex-col text-left pr-2">
                                              <p className="font-bold text-black dark:text-white leading-tight">{prod.product_name}</p>
                                              <p className="text-[10px] font-mono text-gray-400">{displaySku}</p>
                                            </div>
                                            <div className="text-right font-mono shrink-0 pl-2 flex flex-col items-end justify-center">
                                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                                Rs. {formatMoney(prod.purchase_price || prod.price || 0)}
                                              </span>
                                              {(() => {
                                                const avail = getProductOverallStock(prod);
                                                return (
                                                  <span
                                                    className={`text-[10px] font-bold ${
                                                      avail > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                                                    }`}
                                                  >
                                                    Avail: {formatStockWithBoxesAndPcs(avail, prod).inlineText}
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
                              );
                            })()}
                          </td>

                          {/* 2. Description / Description */}
                          <td className="p-3 relative prod-name-container min-w-[280px]">
                            {(() => {
                              const query = (item.itemName || '').toLowerCase().trim();
                              const filteredByName = candidateProducts.filter((p: any) => {
                                if (!query) return true;
                                const name = (p.product_name || '').toLowerCase();
                                const sku = (p.item_sr_no || p.sku || `SKU-${p.id || ''}`).toLowerCase();
                                return name.includes(query) || sku.includes(query);
                              });

                              return (
                                <div className="relative">
                                  <input
                                    type="text"
                                    autoComplete="off"
                                    ref={(el) => {
                                      prodRefs.current[idx] = el;
                                    }}
                                    name={`items.${idx}.itemName`}
                                    value={item.itemName || ''}
                                    onFocus={() => {
                                      setActiveProdNameIndex(idx);
                                      setActiveSkuIndex(null);
                                      setHighlightedProdNameIndex(0);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setHighlightedProdNameIndex((prev) => (prev < filteredByName.length - 1 ? prev + 1 : 0));
                                      } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setHighlightedProdNameIndex((prev) => (prev > 0 ? prev - 1 : filteredByName.length - 1));
                                      } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (filteredByName[highlightedProdNameIndex]) {
                                          handleProductSelection(filteredByName[highlightedProdNameIndex], idx);
                                          setActiveProdNameIndex(null);
                                        }
                                      } else if (e.key === 'Escape' || e.key === 'Tab') {
                                        setActiveProdNameIndex(null);
                                      }
                                    }}
                                    onChange={(e) => {
                                      const typed = e.target.value;
                                      setFieldValue(`items.${idx}.itemName`, typed);
                                      setActiveProdNameIndex(idx);
                                      setHighlightedProdNameIndex(0);

                                      const matched = candidateProducts.find(
                                        (p: any) => p.product_name && p.product_name.toLowerCase() === typed.trim().toLowerCase()
                                      );
                                      if (matched) {
                                        handleProductSelection(matched, idx);
                                      }
                                    }}
                                    placeholder="Search Description..."
                                    className="w-full bg-white dark:bg-boxdark font-bold border border-stroke dark:border-strokedark rounded p-1.5 outline-none text-xs text-black dark:text-white focus:border-primary shadow-xs"
                                  />

                                  {/* Rich Dropdown */}
                                  <DropdownPortal
                                    isOpen={isCurrentProdNameActive && filteredByName.length > 0}
                                    anchorEl={prodRefs.current[idx]}
                                    minWidth={340}
                                    maxWidth={420}
                                  >
                                    <div className="w-full max-h-[290px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300">
                                      {filteredByName.map((p: any, pIdx: number) => {
                                        const displaySku = p.item_sr_no || p.sku || `SKU-${p.id || ''}`;
                                        const isHighlighted = pIdx === highlightedProdNameIndex;
                                        return (
                                          <div
                                            key={p.id || pIdx}
                                            onMouseEnter={() => setHighlightedProdNameIndex(pIdx)}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleProductSelection(p, idx);
                                              setActiveProdNameIndex(null);
                                            }}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleProductSelection(p, idx);
                                              setActiveProdNameIndex(null);
                                            }}
                                            className={`p-3 cursor-pointer transition flex items-center justify-between group ${
                                              isHighlighted
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                            }`}
                                          >
                                            <div className="flex flex-col gap-0.5 text-left pr-2">
                                              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 leading-tight">
                                                {p.product_name}
                                              </span>
                                              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                                                <span>{displaySku}</span>
                                                {p.totalBoughtQty && (
                                                  <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                                                    Bought: {formatStockWithBoxesAndPcs(p.totalBoughtQty, p).inlineText}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <div className="text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0 flex flex-col items-end justify-center">
                                              <span>Rs. {formatMoney(p.purchase_price || p.price || 0)}</span>
                                              {(() => {
                                                const avail = getProductOverallStock(p);
                                                return (
                                                  <span
                                                    className={`text-[10px] font-bold ${
                                                      avail > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
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
                              );
                            })()}
                          </td>

                          {/* 3. Destination Warehouse */}
                          <td className="p-3 relative row-wh-container min-w-[180px]">
                            <WarehouseSearchableSelect
                              value={item.warehouse || values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse')}
                              onChange={(newWh) => setFieldValue(`items.${idx}.warehouse`, newWh)}
                              locations={locations}
                              selectedProductName={item.itemName}
                              getWarehouseStock={(pName, wh) => {
                                const matched = productList.find((p: any) => (p.product_name || '').toLowerCase() === (pName || '').toLowerCase());
                                const qty = getItemWarehouseStock(pName, wh, item.skuCode);
                                return {
                                  text: formatStockWithBoxesAndPcs(qty, matched).inlineText,
                                  hasStock: qty > 0,
                                  qty
                                };
                              }}
                              isTile={isTile}
                            />
                            {item.warehouse && item.itemName && (() => {
                              const curWhStock = getItemWarehouseStock(item.itemName, item.warehouse, item.skuCode);
                              const matchedProd = productList.find(
                                (p: any) => p.product_name === item.itemName || p.item_sr_no === item.skuCode
                              );
                              return (
                                <div
                                  className={`text-[10px] font-mono font-bold mt-0.5 truncate ${
                                    curWhStock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  Avail: {formatStockWithBoxesAndPcs(curWhStock, matchedProd).inlineText}
                                </div>
                              );
                            })()}
                          </td>

                          {/* 4. Arrived Qty with Dedicated Boxes & Loose Pieces & Sq.Mtr for Tiles */}
                          <td className="p-3 min-w-[260px]">
                            {(() => {
                              const itemWh = item.warehouse || values.sourceWarehouse;
                              const curWhStock = item.itemName && itemWh ? getItemWarehouseStock(item.itemName, itemWh, item.skuCode) : 0;
                              const isNegativeStockBlocked = workflowSettings?.allow_negative_stock === false;
                              const maxRet = getMaxReturnable ? getMaxReturnable(item.itemName, item.skuCode) : null;
                              const isStockExceeding = Boolean(
                                isNegativeStockBlocked && item.itemName && itemWh && Number(item.qty || 0) > 0 && Number(item.qty || 0) > curWhStock + 0.0001
                              );
                              const isBillExceeding = Boolean(
                                maxRet !== null && Boolean(item.itemName) && Number(item.qty || 0) > maxRet + 0.0001
                              );
                              const isRowExceeding = isStockExceeding || isBillExceeding;

                              if (isTile) {
                                let tileWidthCm = 60;
                                let tileHeightCm = 60;
                                const desc = matchedProduct?.product_description || '';
                                const sku = matchedProduct?.item_sr_no || '';
                                const sizeMatch =
                                  desc.match(/Size:\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*cm/i) ||
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
                                const totalLineSqm = boxes * perBoxSqm + loosePcs * perPieceSqm;

                                return (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1 font-mono">
                                      <span className="text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800/60 font-bold">
                                        Box: {perBoxSqm.toFixed(2)} sq.m
                                      </span>
                                      <span className="text-emerald-700 dark:emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-bold">
                                        Pc: {perPieceSqm.toFixed(4)} sq.m
                                      </span>
                                    </div>

                                    <div
                                      className={`flex items-center gap-2 p-1.5 rounded-lg border shadow-inner transition-colors ${
                                        isRowExceeding
                                          ? 'bg-red-50/90 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/50'
                                          : 'bg-slate-50 dark:bg-slate-800/90 border-stroke dark:border-strokedark'
                                      }`}
                                    >
                                      <div
                                        className={`flex-1 flex items-center bg-white dark:bg-boxdark border rounded-md px-2 py-1 shadow-sm ${
                                          isRowExceeding ? 'border-red-400 dark:border-red-600' : 'border-stroke dark:border-strokedark focus-within:border-primary'
                                        }`}
                                      >
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
                                            const currentLoose = Math.round(
                                              (Number(item.qty || 0) - Math.floor(Number(item.qty || 0))) * pcsPerBox
                                            );
                                            const combinedQty = Number((newBoxes + currentLoose / pcsPerBox).toFixed(3));
                                            setFieldValue(`items.${idx}.qty`, combinedQty);
                                          }}
                                          className={`w-full bg-transparent text-center font-black text-sm outline-none min-w-[36px] ${
                                            isRowExceeding ? 'text-red-600 dark:text-red-400' : 'text-primary'
                                          }`}
                                        />
                                        <span className={`text-[11px] font-bold pl-1 select-none ${isRowExceeding ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                          Box
                                        </span>
                                      </div>

                                      <span className={`font-black text-sm select-none ${isRowExceeding ? 'text-red-500' : 'text-gray-400'}`}>+</span>

                                      <div
                                        className={`flex-1 flex items-center bg-white dark:bg-boxdark border rounded-md px-2 py-1 shadow-sm ${
                                          isRowExceeding ? 'border-red-400 dark:border-red-600' : 'border-stroke dark:border-strokedark focus-within:border-emerald-500'
                                        }`}
                                      >
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          onKeyDown={blockInvalidChar}
                                          value={(() => {
                                            const currentLoose = Math.round(
                                              (Number(item.qty || 0) - Math.floor(Number(item.qty || 0))) * pcsPerBox
                                            );
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
                                            const combinedQty = remLoose > 0 ? Number((finalBoxes + remLoose / pcsPerBox).toFixed(3)) : finalBoxes;

                                            setFieldValue(`items.${idx}.qty`, combinedQty);
                                          }}
                                          className={`w-full bg-transparent text-center font-black text-sm outline-none min-w-[36px] ${
                                            isRowExceeding ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                                          }`}
                                        />
                                        <span className={`text-[11px] font-bold pl-1 select-none ${isRowExceeding ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                          Pcs
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-center font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/30 rounded py-0.5 border border-teal-200/60 dark:border-teal-800/40">
                                      Total: <span className="text-xs font-black">{totalLineSqm.toFixed(2)}</span> sq.m
                                      <span className="text-slate-400 font-sans font-normal ml-1">
                                        ({boxes} Box{boxes !== 1 ? 'es' : ''}
                                        {loosePcs > 0 ? ` + ${loosePcs} Pcs` : ''})
                                      </span>
                                    </div>

                                    {isRowExceeding && (
                                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded px-2 py-1 mt-1 leading-tight shadow-xs">
                                        <span className="text-xs">⚠️</span>
                                        <span>Exceeds available stock ({formatStockWithBoxesAndPcs(curWhStock, matchedProduct).inlineText} available in {itemWh})</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              if (allowLoose && pcsPerBox > 1) {
                                const currentQty = Number(item.qty || 0);
                                const bulkCount = Math.floor(currentQty);
                                const looseCount = Math.round((currentQty - bulkCount) * pcsPerBox);

                                return (
                                  <div className="flex flex-col gap-1">
                                    <div
                                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border shadow-inner transition-colors ${
                                        isRowExceeding
                                          ? 'bg-red-50/90 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/50'
                                          : 'bg-slate-50 dark:bg-slate-800/90 border-stroke dark:border-strokedark'
                                      }`}
                                    >
                                      <div
                                        className={`flex-1 flex items-center bg-white dark:bg-boxdark border rounded-md px-2 py-1 shadow-sm ${
                                          isRowExceeding ? 'border-red-400 dark:border-red-600' : 'border-stroke dark:border-strokedark focus-within:border-primary'
                                        }`}
                                      >
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          onKeyDown={blockInvalidChar}
                                          value={bulkCount === 0 ? '' : bulkCount}
                                          placeholder="0"
                                          onChange={(e) => {
                                            const val = e.target.value.trim();
                                            const newBulk = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                            const currentLoose = Math.round(
                                              (Number(item.qty || 0) - Math.floor(Number(item.qty || 0))) * pcsPerBox
                                            );
                                            const combinedQty = Number((newBulk + currentLoose / pcsPerBox).toFixed(3));
                                            setFieldValue(`items.${idx}.qty`, combinedQty);
                                          }}
                                          className={`w-full bg-transparent text-center font-black text-sm outline-none min-w-[36px] ${
                                            isRowExceeding ? 'text-red-600 dark:text-red-400' : 'text-primary'
                                          }`}
                                        />
                                        <span className={`text-[11px] font-bold pl-1 select-none ${isRowExceeding ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                          {bulkUnitLabel}
                                        </span>
                                      </div>

                                      <span className={`font-black text-sm select-none ${isRowExceeding ? 'text-red-500' : 'text-gray-400'}`}>+</span>

                                      <div
                                        className={`flex-1 flex items-center bg-white dark:bg-boxdark border rounded-md px-2 py-1 shadow-sm ${
                                          isRowExceeding ? 'border-red-400 dark:border-red-600' : 'border-stroke dark:border-strokedark focus-within:border-emerald-500'
                                        }`}
                                      >
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
                                            const combinedQty = remLoose > 0 ? Number((finalBulk + remLoose / pcsPerBox).toFixed(3)) : finalBulk;

                                            setFieldValue(`items.${idx}.qty`, combinedQty);
                                          }}
                                          className={`w-full bg-transparent text-center font-black text-sm outline-none min-w-[36px] ${
                                            isRowExceeding ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                                          }`}
                                        />
                                        <span className={`text-[11px] font-bold pl-1 select-none ${isRowExceeding ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                          {looseUnitLabel}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-center font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                      Total: <strong>{currentQty}</strong> {bulkUnitLabel} ({bulkCount} {bulkUnitLabel} + {looseCount} {looseUnitLabel})
                                    </div>

                                    {isRowExceeding && (
                                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded px-2 py-1 mt-1 leading-tight shadow-xs">
                                        <span className="text-xs">⚠️</span>
                                        <span>Exceeds available stock ({formatStockWithBoxesAndPcs(curWhStock, matchedProduct).inlineText} available in {itemWh})</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              const u = String(item.uom || uomString || matchedProduct?.uom || '').trim().toUpperCase();
                              const isDecimalUom = [
                                'KG', 'KILOGRAM', 'GM', 'GRAM', 'TON', 'METRIC TON', 'LBS',
                                'LTR', 'LITER', 'LITRE', 'ML', 'GAL',
                                'MTR', 'METER', 'FT', 'FEET', 'INCH', 'CM', 'MM', 'YD',
                                'SQM', 'SQ.M', 'SQ.MTR', 'SQ.FT', 'SQF', 'SQY', 'SQUARE METER'
                              ].includes(u);

                              return (
                                <div className="flex flex-col gap-1">
                                  <div
                                    className={`flex items-center gap-1 rounded px-2 py-1 border transition-colors ${
                                      isRowExceeding
                                        ? 'bg-red-50/90 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/50'
                                        : 'bg-slate-50 dark:bg-slate-800 border-stroke dark:border-strokedark'
                                    }`}
                                  >
                                    <input
                                      type="text"
                                      inputMode={isDecimalUom ? 'decimal' : 'numeric'}
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
                                          const newQty = Number(val) || 0;
                                          const dPer = Number(item.discountPer) || 0;
                                          if (dPer > 0) {
                                            const rate = Number(item.rate) || 0;
                                            const g = newQty * rate;
                                            setFieldValue(`items.${idx}.discountAmt`, Number(((g * dPer) / 100).toFixed(2)));
                                          }
                                        }
                                      }}
                                      placeholder="1"
                                      className={`w-full bg-transparent text-center font-black text-sm outline-none min-w-[60px] ${
                                        isRowExceeding ? 'text-red-600 dark:text-red-400' : 'text-primary'
                                      }`}
                                    />
                                    <span className={`text-[11px] font-bold select-none ${isRowExceeding ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                      {u || 'NOS'}
                                    </span>
                                  </div>

                                  {isRowExceeding && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded px-2 py-1 mt-1 leading-tight shadow-xs">
                                      <span className="text-xs">⚠️</span>
                                      <span>Exceeds available stock ({formatStockWithBoxesAndPcs(curWhStock, matchedProduct).inlineText} available in {itemWh})</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* 5. Cost Price */}
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              onKeyDown={blockInvalidChar}
                              name={`items.${idx}.rate`}
                              value={item.rate === 0 ? '' : item.rate}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFieldValue(`items.${idx}.rate`, val);
                                const newRate = Number(val) || 0;
                                const dPer = Number(item.discountPer) || 0;
                                if (dPer > 0) {
                                  const q = Number(item.qty) || 0;
                                  const g = q * newRate;
                                  setFieldValue(`items.${idx}.discountAmt`, Number(((g * dPer) / 100).toFixed(2)));
                                }
                              }}
                              placeholder="0"
                              className="w-full text-right font-bold font-mono text-xs text-black dark:text-white bg-transparent outline-none"
                            />
                          </td>

                          {/* Discounts */}
                          {hasDiscount && (
                            <>
                              <td className="p-2 w-20 min-w-[70px] bg-amber-50/30 dark:bg-amber-950/10">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="any"
                                  onKeyDown={blockInvalidChar}
                                  name={`items.${idx}.discountPer`}
                                  value={item.discountPer ?? 0}
                                  onChange={(e) => {
                                    const rawVal = e.target.value;
                                    setFieldValue(`items.${idx}.discountPer`, rawVal);
                                    const dPer = Number(rawVal);
                                    if (!isNaN(dPer) && dPer >= 0 && Number(item.rate) > 0 && Number(item.qty) > 0) {
                                      const g = Number(item.qty) * Number(item.rate);
                                      setFieldValue(`items.${idx}.discountAmt`, Number(((g * dPer) / 100).toFixed(2)));
                                    }
                                  }}
                                  placeholder="0"
                                  className="w-full text-center font-bold font-mono text-amber-700 bg-white dark:bg-boxdark border border-amber-300 rounded p-1 text-xs outline-none"
                                />
                              </td>
                              <td className="p-2 w-28 min-w-[100px] bg-amber-50/30 dark:bg-amber-950/10">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  onKeyDown={blockInvalidChar}
                                  name={`items.${idx}.discountAmt`}
                                  value={item.discountAmt ?? 0}
                                  onChange={(e) => {
                                    const rawVal = e.target.value;
                                    setFieldValue(`items.${idx}.discountAmt`, rawVal);
                                    const dAmt = Number(rawVal);
                                    if (!isNaN(dAmt) && dAmt >= 0 && Number(item.rate) > 0 && Number(item.qty) > 0) {
                                      const g = Number(item.qty) * Number(item.rate);
                                      setFieldValue(`items.${idx}.discountPer`, Number(((dAmt / g) * 100).toFixed(2)));
                                    }
                                  }}
                                  placeholder="0"
                                  className="w-full text-right font-bold font-mono text-amber-700 bg-white dark:bg-boxdark border border-amber-300 rounded p-1 text-xs outline-none"
                                />
                              </td>
                            </>
                          )}

                          {/* 6. Net Total Line */}
                          <td className="p-3 text-right font-mono font-bold text-success pr-4 text-xs">
                            Rs. {formatMoney(lineTotal)}
                          </td>

                          {/* 7. Action */}
                          <td className="p-3 text-center">
                            {values.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(idx)}
                                className="text-danger hover:opacity-80 p-1 cursor-pointer"
                              >
                                <MdDelete size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }}
      </FieldArray>

      <div className="mt-4 flex items-center gap-3">
        {/* Tile Products Toggle Pill */}
        <div
          onClick={() => {
            const nextVal = !values.showTileSection;
            setFieldValue('showTileSection', nextVal);
            const defaultWh = values.sourceWarehouse || (locations[0]?.name || 'Main Warehouse');
            if (nextVal && (!values.tileItems || values.tileItems.length === 0)) {
              setFieldValue('tileItems', [
                {
                  id: Date.now(),
                  itemName: '',
                  skuCode: '',
                  warehouse: defaultWh,
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
                },
              ]);
            }
          }}
          className={`cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border shadow-xs ${
            values.showTileSection
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-primary dark:border-primary shadow-xs'
              : 'bg-white text-slate-700 border-stroke dark:bg-boxdark dark:text-slate-200 dark:border-strokedark hover:border-primary'
          }`}
        >
          Tile
        </div>

        <button
          type="button"
          onClick={() => {
            const newRow = {
              skuCode: '',
              itemName: '',
              warehouse: values.sourceWarehouse || (locations[0]?.name || 'Central Warehouse A'),
              qty: 1,
              rate: 0,
              uom: 'Nos',
            };
            setFieldValue('items', [...values.items, newRow]);
          }}
          className="rounded bg-primary py-2 px-4 text-xs font-medium text-white hover:bg-opacity-90 transition cursor-pointer flex items-center gap-1.5"
        >
          <MdAdd size={16} /> Add Row Line
        </button>
      </div>
    </div>
  );
};
