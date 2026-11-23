import React from 'react';
import { FieldArray } from 'formik';
import { FiTrash2, FiPlus } from 'react-icons/fi';
import { WarehouseSearchableSelect } from './WarehouseSearchableSelect';

interface PurchaseTileItemsTableProps {
  values: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  productList: any[];
  locations: any[];
  isTileProduct: (p: any) => boolean;
  activeTileProdIndex: number | null;
  setActiveTileProdIndex: (idx: number | null) => void;
  activeTileSkuIndex: number | null;
  setActiveTileSkuIndex: (idx: number | null) => void;
  highlightedTileProdIndex: number;
  setHighlightedTileProdIndex: React.Dispatch<React.SetStateAction<number>>;
  handleTileProductSelection: (p: any, tIdx: number, tItem: any, setFieldValue: any) => void;
  updateTileRowCalcs: (field: string, val: number, tIdx: number, tItem: any, setFieldValue: any) => void;
  getWarehouseStockInfo: (productName: string, warehouseName: string) => { text: string; hasStock: boolean; qty: number };
  formatProductStock: (p: any) => string;
  blockInvalidChar: (e: React.KeyboardEvent) => void;
}

export const PurchaseTileItemsTable: React.FC<PurchaseTileItemsTableProps> = ({
  values,
  setFieldValue,
  productList,
  locations,
  isTileProduct,
  activeTileProdIndex,
  setActiveTileProdIndex,
  activeTileSkuIndex,
  setActiveTileSkuIndex,
  highlightedTileProdIndex,
  setHighlightedTileProdIndex,
  handleTileProductSelection,
  updateTileRowCalcs,
  getWarehouseStockInfo,
  formatProductStock,
  blockInvalidChar,
}) => {
  if (!values.showTileSection) return null;

  const tileProducts = productList.filter((p) => isTileProduct(p));

  return (
    <div
      className={`border border-stroke dark:border-strokedark bg-white dark:bg-boxdark rounded-sm mt-6 relative ${
        activeTileSkuIndex !== null || activeTileProdIndex !== null ? 'z-30' : 'z-20'
      }`}
    >
      <FieldArray name="tileItems">
        {({ push, remove }) => {
          const tileTotalSum = (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.totalAmount || 0), 0);
          const totalBoxesCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.boxQty || 0), 0);
          const totalLoosePcsCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.loosePcs || 0), 0);
          const totalSqmCount = (values.tileItems || []).reduce((acc: number, t: any) => acc + Number(t.totalSqm || 0), 0);

          return (
            <div className="w-full min-w-[980px]">
              {/* Header Bar */}
              <div className="p-3 bg-slate-50 dark:bg-meta-4/20 border-b border-stroke dark:border-strokedark flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-700 text-white font-mono text-[10px] font-black tracking-wider uppercase">
                    Tiles
                  </span>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    Tile Purchases (Boxes, Loose Pieces & Sq. Mtr Inward)
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
                  <span className="text-slate-900 dark:text-white font-black text-sm">
                    Total Tiles: Rs. {tileTotalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full table-auto border-collapse text-left">
                <thead className="bg-gray-100 dark:bg-meta-4/40 text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 border-b border-stroke dark:border-strokedark">
                  <tr>
                    <th className="p-3 w-10 text-center">S#</th>
                    <th className="p-3 min-w-[280px]">Tile Code / Description</th>
                    <th className="p-3 w-52">Destination Warehouse</th>
                    <th className="p-3 w-28 text-center">Arrived Boxes</th>
                    <th className="p-3 w-24 text-center">Loose Pcs</th>
                    <th className="p-3 w-32 text-right">Cost (Per Box)</th>
                    <th className="p-3 w-32 text-right">Cost (Per Sq.M)</th>
                    <th className="p-3 w-28 text-right">Cost (Per Pc)</th>
                    <th className="p-3 w-36 text-right pr-4 font-mono">Line Total</th>
                    <th className="p-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {(values.tileItems || []).map((tItem: any, tIdx: number) => {
                    const isCurrentProdActive = activeTileProdIndex === tIdx;

                    const filteredTileProds = tileProducts.filter((p) => {
                      if (!tItem.itemName) return true;
                      const q = (tItem.itemName || '').toLowerCase().trim();
                      const name = (p.product_name || '').toLowerCase();
                      const sku = (p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                      const cat = (p.category || '').toLowerCase();
                      return name.includes(q) || sku.includes(q) || cat.includes(q);
                    });

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

                        {/* Tile Code / Description Searchable Dropdown */}
                        <td className="p-3 relative tile-prod-container min-w-[280px]">
                          <div className="relative">
                            <input
                              type="text"
                              autoComplete="off"
                              value={tItem.itemName || ''}
                              onFocus={() => {
                                setActiveTileProdIndex(tIdx);
                                setActiveTileSkuIndex(null);
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
                                  setHighlightedTileProdIndex((prev) => (prev > 0 ? prev - 1 : filteredTileProds.length - 1));
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (filteredTileProds[highlightedTileProdIndex]) {
                                    handleTileProductSelection(filteredTileProds[highlightedTileProdIndex], tIdx, tItem, setFieldValue);
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
                                  filteredTileProds.map((p: any, pIdx: number) => {
                                    const stockStr = formatProductStock(p);
                                    const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                    const isHighlighted = highlightedTileProdIndex === pIdx;
                                    return (
                                      <div
                                        key={p.id}
                                        onMouseEnter={() => setHighlightedTileProdIndex(pIdx)}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleTileProductSelection(p, tIdx, tItem, setFieldValue);
                                          setActiveTileProdIndex(null);
                                        }}
                                        className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                          isHighlighted
                                            ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-primary text-black dark:text-white font-bold'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                                        }`}
                                      >
                                        <div className="min-w-0 pr-2">
                                          <span className="font-bold block truncate max-w-[210px]">{p.product_name}</span>
                                          <span className="text-[10px] opacity-80 block font-mono text-slate-500">
                                            Code: {displaySku} • {p.sub_sub_category || p.category || 'Tile'}
                                          </span>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end">
                                          <span className="font-mono font-bold block text-emerald-600 dark:text-emerald-400">
                                            Rs. {Number(p.purchase_price || 0).toLocaleString()}
                                          </span>
                                          <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[10px] opacity-75">{p.pieces_per_box || 4} pcs/bx</span>
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

                        {/* Destination Warehouse */}
                        <td className="p-3 w-52">
                          <WarehouseSearchableSelect
                            value={tItem.warehouse || ''}
                            onChange={(val) => setFieldValue(`tileItems.${tIdx}.warehouse`, val)}
                            locations={locations}
                            selectedProductName={tItem.itemName}
                            getWarehouseStock={getWarehouseStockInfo}
                            isTile={true}
                          />
                        </td>

                        {/* Arrived Boxes */}
                        <td className="p-3 w-28 text-center">
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
                        <td className="p-3 w-24 text-center">
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

                        {/* Cost Price Per Box */}
                        <td className="p-3 w-32 text-right">
                          <input
                            type="number"
                            min="0"
                            onKeyDown={blockInvalidChar}
                            value={tItem.costPricePerBox ?? 0}
                            onChange={(e) =>
                              updateTileRowCalcs(
                                'costPricePerBox',
                                Math.max(0, Number(e.target.value) || 0),
                                tIdx,
                                tItem,
                                setFieldValue
                              )
                            }
                            className="w-full text-right font-black font-mono bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs text-black dark:text-white outline-none focus:border-primary shadow-xs"
                          />
                        </td>

                        {/* Cost Price Per Sq.M */}
                        <td className="p-3 w-32 text-right">
                          <input
                            type="number"
                            min="0"
                            onKeyDown={blockInvalidChar}
                            value={tItem.costPricePerSqm ?? 0}
                            onChange={(e) =>
                              updateTileRowCalcs(
                                'costPricePerSqm',
                                Math.max(0, Number(e.target.value) || 0),
                                tIdx,
                                tItem,
                                setFieldValue
                              )
                            }
                            className="w-full text-right font-black font-mono bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs text-black dark:text-white outline-none focus:border-primary shadow-xs"
                          />
                        </td>

                        {/* Cost Price Per Piece */}
                        <td className="p-3 w-28 text-right">
                          <input
                            type="number"
                            min="0"
                            onKeyDown={blockInvalidChar}
                            value={tItem.costPricePerPiece ?? 0}
                            onChange={(e) =>
                              updateTileRowCalcs(
                                'costPricePerPiece',
                                Math.max(0, Number(e.target.value) || 0),
                                tIdx,
                                tItem,
                                setFieldValue
                              )
                            }
                            className="w-full text-right font-black font-mono bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded p-1.5 text-xs text-black dark:text-white outline-none focus:border-primary shadow-xs"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="p-3 text-right pr-4 text-slate-900 dark:text-white font-black font-mono">
                          Rs. {Number(tItem.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* Delete */}
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

              {/* Append Tile Row Button */}
              <div className="p-3 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    push({
                      id: `tile-${Date.now()}`,
                      itemName: '',
                      skuCode: '',
                      warehouse: '',
                      boxQty: 1,
                      loosePcs: 0,
                      totalSqm: 0,
                      costPricePerBox: 0,
                      costPricePerPiece: 0,
                      costPricePerSqm: 0,
                      totalAmount: 0,
                      piecesPerBox: 4,
                      sqmPerBox: 1.44,
                    })
                  }
                  className="inline-flex items-center gap-1 bg-slate-900 dark:bg-slate-700 text-white font-bold py-1.5 px-3.5 rounded text-xs hover:bg-slate-800 dark:hover:bg-slate-600 transition cursor-pointer shadow-xs"
                >
                  <FiPlus size={12} /> Append Tile Row
                </button>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  * Cross-calculates boxes, loose pieces & sq.m automatically with your tile box specifications
                </span>
              </div>
            </div>
          );
        }}
      </FieldArray>
    </div>
  );
};

export default PurchaseTileItemsTable;
