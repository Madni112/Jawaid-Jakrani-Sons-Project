import React from 'react';
import { FieldArray } from 'formik';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import WarehouseSearchableSelect from './WarehouseSearchableSelect';
import ChainedUomInputGrid from '../../../../components/ChainedUomInputGrid';
import { LooseChainBadge } from '../../../../utils/looseUomHelpers';
import { getAvailableStock } from '../../../../utils/stockCalculator';

interface PurchaseStandardItemsTableProps {
  values: any;
  setFieldValue: (field: string, value: any) => void;
  activeSkuIndex: number | null;
  setActiveSkuIndex: (idx: number | null) => void;
  activeProdNameIndex: number | null;
  setActiveProdNameIndex: (idx: number | null) => void;
  highlightedProdNameIndex: number;
  setHighlightedProdNameIndex: (idx: number | ((prev: number) => number)) => void;
  isTileProduct: (p: any) => boolean;
  productList: any[];
  locations: any[];
  getWarehouseStockInfo: (prod: any, whName: string) => any;
  formatProductStock: (stock: any) => string;
  blockInvalidChar: (e: any) => void;
  calculatePurchaseLineTotals: (item: any, applyTax: boolean) => any;
  isEditMode: boolean;
  editData: any;
  getAvailableStock?: (itemName: string, warehouseName: string) => Promise<number>;
  supabase: any;
  toast: any;
}

const PurchaseStandardItemsTable: React.FC<PurchaseStandardItemsTableProps> = ({
  values,
  setFieldValue,
  activeSkuIndex,
  setActiveSkuIndex,
  activeProdNameIndex,
  setActiveProdNameIndex,
  highlightedProdNameIndex,
  setHighlightedProdNameIndex,
  isTileProduct,
  productList,
  locations,
  getWarehouseStockInfo,
  formatProductStock,
  blockInvalidChar,
  calculatePurchaseLineTotals,
  isEditMode,
  editData,
  supabase,
  toast
}) => {
  return (
    <div className={`border border-stroke dark:border-strokedark bg-white dark:bg-boxdark rounded-sm mt-4 relative ${activeSkuIndex !== null || activeProdNameIndex !== null ? 'z-30' : 'z-20'} overflow-visible pb-4 shadow-xs`}>
                  <div className="w-full min-w-[980px]">
                    <table className="w-full table-auto border-collapse text-left">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                          <th className="p-3 w-10 text-center">S#</th>
                          <th className="p-3 min-w-[280px]">Product Code / Description</th>
                          <th className="p-3 w-52">Destination Warehouse</th>
                          <th className="p-3 min-w-[320px] text-center">Qty & Pricing (UOM)</th>
                          {values.showDiscount && (
                            <>
                              <th className="p-3 w-20 text-center text-amber-700 bg-amber-50/40 dark:bg-amber-950/20">Disc %</th>
                              <th className="p-3 w-28 text-right text-amber-700 bg-amber-50/40 dark:bg-amber-950/20">Disc Amt</th>
                            </>
                          )}
                          {values.applyTax && (
                            <>
                              <th className="p-3 w-20 text-center text-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">GST %</th>
                              <th className="p-3 w-28 text-right text-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">GST Amt</th>
                            </>
                          )}
                          <th className="p-3 w-36 text-right pr-4">Net Total Line</th>
                          <th className="p-3 w-10"></th>
                        </tr>
                      </thead>
                      <FieldArray name="items">
                        {({ push, remove }) => (
                          <tbody className="divide-y divide-stroke dark:divide-strokedark">
                            {values.items.map((item: any, idx: number) => {
                              const matchedProduct = productList.find(p =>
                                (item.skuCode && (p.item_sr_no === item.skuCode || `SKU-${p.id}` === item.skuCode)) ||
                                (item.itemName && String(p.product_name || '').toLowerCase() === String(item.itemName || '').toLowerCase())
                              );
                              const rawPcs = Number(matchedProduct?.pieces_per_box ?? matchedProduct?.pcs_per_box ?? matchedProduct?.pieces_per_packing ?? 0);
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
                              const uomString = matchedProduct ? matchedProduct.uom : 'NOS';
                              const lineTotals = calculatePurchaseLineTotals(item, values.applyTax);
                              const isCurrentProdNameActive = activeProdNameIndex === idx;

                              const handleProductSelection = (p: any) => {
                                const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                const price = Number(p.purchase_price ?? p.cost_price ?? 0);
                                const updatedItems = [...values.items];
                                const cur = updatedItems[idx] || {};
                                const qty = Number(cur.qty) || 1;
                                const dPer = Number(cur.discountPer) || 0;
                                const dAmt = dPer > 0 ? Number(((price * qty * dPer) / 100).toFixed(2)) : (Number(cur.discountAmt) || 0);

                                updatedItems[idx] = {
                                  ...cur,
                                  skuCode: displaySku,
                                  itemName: p.product_name,
                                  rate: price,
                                  discountAmt: dAmt,
                                  uom: p.uom || cur.uom || 'NOS'
                                };

                                setFieldValue('items', updatedItems);
                                setActiveProdNameIndex(null);
                                setActiveSkuIndex(null);
                              };

                              return (
                                <tr key={idx} className={`border-b border-stroke dark:border-strokedark text-xs transition ${isCurrentProdNameActive ? 'relative z-50 bg-slate-50/90 dark:bg-meta-4/20' : 'relative z-10 bg-white dark:bg-boxdark hover:bg-slate-50 dark:hover:bg-meta-4/10'}`}>
                                  <td className="p-3 text-center text-gray-400 font-sans">{idx + 1}</td>

                                  {/* Merged Product Code / Description Searchable Combobox */}
                                  <td className="p-3 relative prod-name-container min-w-[280px]">
                                    {(() => {
                                      const query = (item.itemName || '').toLowerCase().trim();
                                      const nonTileList = productList.filter(p => !isTileProduct(p));
                                      const filteredProds = nonTileList.filter(p => {
                                        if (!query) return true;
                                        const name = (p.product_name || '').toLowerCase();
                                        const sku = (p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                                        return name.includes(query) || sku.includes(query);
                                      });

                                      return (
                                        <div className="relative">
                                          <input
                                            type="text"
                                            autoComplete="off"
                                            value={item.itemName || ''}
                                            onFocus={() => {
                                              setActiveProdNameIndex(idx);
                                              setActiveSkuIndex(null);
                                              setHighlightedProdNameIndex(0);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setHighlightedProdNameIndex(prev => prev < filteredProds.length - 1 ? prev + 1 : 0);
                                              } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                setHighlightedProdNameIndex(prev => prev > 0 ? prev - 1 : filteredProds.length - 1);
                                              } else if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (filteredProds[highlightedProdNameIndex]) {
                                                  handleProductSelection(filteredProds[highlightedProdNameIndex]);
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

                                              const matched = productList.find(
                                                p => (p.product_name && p.product_name.toLowerCase() === typed.trim().toLowerCase()) ||
                                                     (p.item_sr_no && p.item_sr_no.toLowerCase() === typed.trim().toLowerCase())
                                              );
                                              if (matched) {
                                                handleProductSelection(matched);
                                              }
                                            }}
                                            placeholder="Search by code or product description..."
                                            className="w-full bg-white dark:bg-boxdark font-bold border border-stroke dark:border-strokedark rounded p-1.5 outline-none text-xs text-black dark:text-white focus:border-primary shadow-xs"
                                          />

                                          {item.skuCode && (
                                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                              Code: <span className="font-bold text-slate-600 dark:text-slate-300">{item.skuCode}</span>
                                            </div>
                                          )}

                                          {/* Rich Dropdown */}
                                          {isCurrentProdNameActive && filteredProds.length > 0 && (
                                            <div className="absolute left-0 top-full mt-1.5 z-[999999] min-w-[380px] max-w-[460px] max-h-[290px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300">
                                              {filteredProds.map((p, pIdx) => {
                                                const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                                const isHighlighted = pIdx === highlightedProdNameIndex;
                                                const stockStr = formatProductStock(p);
                                                return (
                                                  <div
                                                    key={p.id}
                                                    onMouseEnter={() => setHighlightedProdNameIndex(pIdx)}
                                                    onMouseDown={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      handleProductSelection(p);
                                                    }}
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      handleProductSelection(p);
                                                    }}
                                                    className={`p-3 cursor-pointer transition flex items-center justify-between group ${isHighlighted
                                                        ? 'bg-primary/10 border-l-4 border-primary'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                                      }`}
                                                  >
                                                    <div className="flex flex-col gap-0.5 text-left pr-2 min-w-0">
                                                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary leading-tight truncate max-w-[210px]">
                                                        {p.product_name}
                                                      </span>
                                                      <span className="font-mono text-[10px] text-slate-400">
                                                        Code: {displaySku}
                                                      </span>
                                                    </div>
                                                    <div className="text-right font-mono text-xs font-bold shrink-0 flex flex-col items-end">
                                                      <span className="text-emerald-700 dark:text-emerald-400">
                                                        Rs. {Number(p.purchase_price || 0).toLocaleString()}
                                                      </span>
                                                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-stroke dark:border-strokedark px-1.5 py-0.5 rounded mt-0.5">
                                                        Stock: {stockStr}
                                                      </span>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </td>

                                  {/* ROW-LEVEL DESTINATION WAREHOUSE (SEARCHABLE WITH PER-LOCATION STOCK) */}
                                  <td className="p-3 w-52">
                                    <WarehouseSearchableSelect
                                      value={item.warehouse || locations[0]?.name || ''}
                                      onChange={(val) => {
                                        setFieldValue(`items.${idx}.warehouse`, val);
                                      }}
                                      locations={locations}
                                      selectedProductName={item.itemName}
                                      getWarehouseStock={getWarehouseStockInfo}
                                    />
                                  </td>

                                  {/* Arrived Qty with Dedicated Boxes & Loose Pieces & Sq.Mtr for Tiles or Loose Products */}
                                  <td className="p-3 min-w-[320px]">
                                    {((isTile || allowLoose) && (pcsPerBox > 1 || (Array.isArray(matchedProduct?.multi_loose_units) && matchedProduct.multi_loose_units.length > 0))) ? (
                                      <ChainedUomInputGrid
                                        primaryUom={bulkUnitLabel || 'Unit'}
                                        primaryQuantity={Number(item.qty) || 0}
                                        primaryRate={Number(item.rate) || 0}
                                        tiers={
                                          Array.isArray(matchedProduct?.multi_loose_units) && matchedProduct.multi_loose_units.length > 0
                                            ? matchedProduct.multi_loose_units
                                            : [{ uom: looseUnitLabel, ratio: pcsPerBox, costPrice: matchedProduct?.loose_purchase_price, salePrice: matchedProduct?.loose_sale_price }]
                                        }
                                        tierQuantities={item.tier_quantities}
                                        tierRates={item.tier_rates}
                                        mode="cost"
                                        onChange={({ primaryQuantity, tierQuantities, tierRates, totalConvertedPrimaryQty, totalLineAmount }) => {
                                          setFieldValue(`items.${idx}.qty`, totalConvertedPrimaryQty);
                                          setFieldValue(`items.${idx}.tier_quantities`, tierQuantities);
                                          setFieldValue(`items.${idx}.tier_rates`, tierRates);
                                          
                                          if (totalConvertedPrimaryQty > 0 && totalLineAmount > 0) {
                                            const effectiveUnitRate = Number((totalLineAmount / totalConvertedPrimaryQty).toFixed(2));
                                            setFieldValue(`items.${idx}.rate`, effectiveUnitRate);
                                          }

                                          if (Number(item.discountPer) > 0) {
                                            setFieldValue(`items.${idx}.discountAmt`, Number(((totalLineAmount * Number(item.discountPer)) / 100).toFixed(2)));
                                          }
                                        }}
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-2 py-1.5 border border-stroke dark:border-strokedark">
                                          <input
                                            type="text"
                                            inputMode="decimal"
                                            name={`items.${idx}.qty`}
                                            value={item.qty === 0 ? '' : item.qty}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                setFieldValue(`items.${idx}.qty`, val);
                                                const num = parseFloat(val) || 0;
                                                const cost = num * (Number(item.rate) || 0);
                                                if (Number(item.discountPer) > 0) {
                                                  setFieldValue(`items.${idx}.discountAmt`, Number(((cost * Number(item.discountPer)) / 100).toFixed(2)));
                                                }
                                              }
                                            }}
                                            placeholder="1"
                                            className="w-full bg-transparent text-center font-black text-xs text-primary outline-none"
                                          />
                                          <span className="text-[10px] font-bold text-gray-500 uppercase select-none">{uomString}</span>
                                        </div>
                                        <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-strokedark rounded-xl px-2 py-1.5 w-28">
                                          <span className="text-[10px] text-gray-400 font-sans mr-1">Rs.</span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            name={`items.${idx}.rate`}
                                            value={item.rate}
                                            onChange={(e) => {
                                              const newRate = Math.max(0, Number(e.target.value) || 0);
                                              setFieldValue(`items.${idx}.rate`, newRate);
                                              const cost = (Number(item.qty) || 0) * newRate;
                                              if (Number(item.discountPer) > 0) {
                                                setFieldValue(`items.${idx}.discountAmt`, Number(((cost * Number(item.discountPer)) / 100).toFixed(2)));
                                              }
                                            }}
                                            className="w-full bg-transparent font-mono font-bold text-xs text-right outline-none text-slate-800 dark:text-slate-100"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </td>

                                  {/* Discount Columns */}
                                  {values.showDiscount && (
                                    <>
                                      <td className="p-3 w-24 min-w-[90px] bg-amber-50/30 dark:bg-amber-950/10">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          name={`items.${idx}.discountPer`}
                                          value={item.discountPer ?? 0}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            setFieldValue(`items.${idx}.discountPer`, rawVal);
                                            const dPer = Number(rawVal);
                                            if (!isNaN(dPer) && dPer >= 0) {
                                              const gross = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                                              setFieldValue(`items.${idx}.discountAmt`, Number(((gross * dPer) / 100).toFixed(2)));
                                            }
                                          }}
                                          placeholder="0"
                                          className="w-full text-center font-bold font-mono text-amber-700 bg-white dark:bg-boxdark border border-amber-300 rounded p-1 text-xs outline-none"
                                        />
                                      </td>
                                      <td className="p-3 w-32 min-w-[110px] bg-amber-50/30 dark:bg-amber-950/10">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          name={`items.${idx}.discountAmt`}
                                          value={item.discountAmt ?? 0}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            setFieldValue(`items.${idx}.discountAmt`, rawVal);
                                            const dAmt = Number(rawVal);
                                            if (!isNaN(dAmt) && dAmt >= 0) {
                                              const gross = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                                              const per = gross > 0 ? (dAmt / gross) * 100 : 0;
                                              setFieldValue(`items.${idx}.discountPer`, Number(per.toFixed(2)));
                                            }
                                          }}
                                          placeholder="0"
                                          className="w-full text-right font-bold font-mono text-amber-700 bg-white dark:bg-boxdark border border-amber-300 rounded p-1 text-xs outline-none"
                                        />
                                      </td>
                                    </>
                                  )}

                                  {/* GST Columns */}
                                  {values.applyTax && (
                                    <>
                                      <td className="p-3 w-24 min-w-[90px] bg-emerald-50/30 dark:bg-emerald-950/10">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          name={`items.${idx}.gstRate`}
                                          value={item.gstRate ?? 18}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            setFieldValue(`items.${idx}.gstRate`, rawVal);
                                            const r = Number(rawVal);
                                            if (!isNaN(r) && r >= 0) {
                                              const cost = (Number(item.qty) || 0) * (Number(item.rate) || 0) - (Number(item.discountAmt) || 0);
                                              setFieldValue(`items.${idx}.gstAmt`, Number(((cost * r) / 100).toFixed(2)));
                                            }
                                          }}
                                          className="w-full text-center font-bold font-mono text-emerald-700 bg-white dark:bg-boxdark border border-emerald-300 rounded p-1 text-xs outline-none"
                                        />
                                      </td>
                                      <td className="p-3 w-32 min-w-[110px] bg-emerald-50/30 dark:bg-emerald-950/10">
                                        <input
                                          type="number"
                                          min="0"
                                          onKeyDown={blockInvalidChar}
                                          name={`items.${idx}.gstAmt`}
                                          value={item.gstAmt ?? 0}
                                          onChange={(e) => {
                                            const rawVal = e.target.value;
                                            setFieldValue(`items.${idx}.gstAmt`, rawVal);
                                          }}
                                          className="w-full text-right font-bold font-mono text-emerald-700 bg-white dark:bg-boxdark border border-emerald-300 rounded p-1 text-xs outline-none"
                                        />
                                      </td>
                                    </>
                                  )}

                                  {/* Net Line Total */}
                                  <td className="p-3 text-right pr-4 text-emerald-600 dark:text-emerald-400 font-black font-mono">
                                    Rs. {lineTotals.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </td>

                                  {/* Delete Row */}
                                  <td className="p-3 text-center">
                                    {values.items.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (isEditMode && item.itemName) {
                                            // Pre-deletion stock check
                                            let qtyToReverse = Number(item.qty || 0);
                                            
                                            // Check GRN if this purchase is linked to one
                                            let grnItems = [];
                                            if (editData?.metadata?.grn_id) {
                                              const { data: gi } = await supabase.from('grn_items').select('*').eq('grn_id', editData.metadata.grn_id);
                                              if (gi) {
                                                const gItem = gi.find(g => String(g.product_name || '').toLowerCase() === String(item.itemName).toLowerCase());
                                                if (gItem) qtyToReverse = Number(gItem.accepted_qty ?? 0);
                                                else qtyToReverse = 0;
                                              }
                                            }

                                            if (qtyToReverse > 0) {
                                              const currentStock = await getAvailableStock(item.itemName, item.warehouse);
                                              if (currentStock < qtyToReverse) {
                                                toast.error(`Error: You currently only have ${currentStock} in ${item.warehouse}. Cannot delete this entry as it would cause negative stock.`, { duration: 5000 });
                                                return; // Block removal
                                              }
                                            }
                                          }
                                          remove(idx);
                                        }}
                                        className="text-gray-400 hover:text-danger transition cursor-pointer"
                                      >
                                        <FiTrash2 size={14} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        )}
                      </FieldArray>
                    </table>
                  </div>

                  <div className="p-3 bg-gray-50/50 dark:bg-meta-4/10 border-t border-stroke dark:border-strokedark">
                    <FieldArray name="items">
                      {({ push }) => (
                        <button
                          type="button"
                          onClick={() => push({ itemName: '', skuCode: '', warehouse: locations[0]?.name || '', qty: 1, rate: 0, discountPer: 0, discountAmt: 0, gstRate: 18, gstAmt: 0 })}
                          className="inline-flex items-center gap-1 bg-primary text-white font-bold py-1.5 px-3.5 rounded text-xs hover:bg-opacity-90 transition cursor-pointer shadow-xs"
                        >
                          <FiPlus size={12} /> Add Row Line
                        </button>
                      )}
                    </FieldArray>
                  </div>
                </div>

  );
};

export default PurchaseStandardItemsTable;
