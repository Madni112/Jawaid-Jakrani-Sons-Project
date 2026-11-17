import React from 'react';
import { MdAdd, MdDeleteOutline } from 'react-icons/md';
import { formatStockWithBoxesAndPcs } from '../../../../utils/stockCalculator';
import { TileItem } from '../types/quotationTypes';

interface QuotationTileSectionProps {
  tileItems: TileItem[];
  setTileItems: React.Dispatch<React.SetStateAction<TileItem[]>>;
  tileProducts: any[];
  showDiscount: boolean;
  totalTileBoxes: number;
  totalTilePcs: number;
  totalTileSqm: number;
  tileTotalAmount: number;
  onHideSection: () => void;
  handleAppendTileRow: () => void;
  handleRemoveTileItem: (index: number) => void;
  handleSelectTileProduct: (prod: any, index: number) => void;
  updateTileRowCalcs: (
    field: 'box_qty' | 'loose_pcs' | 'rate_per_box' | 'rate_per_sqm' | 'rate_per_piece' | 'discount_percent',
    val: number,
    tIdx: number
  ) => void;
  activeTileProdIndex: number | null;
  setActiveTileProdIndex: React.Dispatch<React.SetStateAction<number | null>>;
  highlightedTileProdIndex: number;
  setHighlightedTileProdIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const QuotationTileSection: React.FC<QuotationTileSectionProps> = ({
  tileItems,
  setTileItems,
  tileProducts,
  showDiscount,
  totalTileBoxes,
  totalTilePcs,
  totalTileSqm,
  tileTotalAmount,
  onHideSection,
  handleAppendTileRow,
  handleRemoveTileItem,
  handleSelectTileProduct,
  updateTileRowCalcs,
  activeTileProdIndex,
  setActiveTileProdIndex,
  highlightedTileProdIndex,
  setHighlightedTileProdIndex,
}) => {
  return (
    <div className="border border-[var(--color-primary,#800020)]/25 dark:border-[var(--color-primary,#800020)]/40 bg-[var(--color-primary,#800020)]/[0.03] dark:bg-[var(--color-primary,#800020)]/[0.08] rounded-2xl p-5 space-y-4">
      {/* Tile Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-primary,#800020)]/20">
        <div className="flex items-center gap-2">
          <span className="bg-[var(--color-primary,#800020)] text-white font-black text-[10px] tracking-wider px-2 py-0.5 rounded shadow-2xs uppercase">
            TILES
          </span>
          <span className="font-bold text-xs text-[var(--color-primary,#800020)] dark:text-rose-300">
            Tile Quotations (Boxes, Loose Pieces &amp; Sq. Mtr Quoted)
          </span>
        </div>

        {/* Tile Summary Pill */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold text-[var(--color-primary,#800020)] dark:text-rose-200 bg-[var(--color-primary,#800020)]/10 dark:bg-[var(--color-primary,#800020)]/20 px-3 py-1 rounded-xl border border-[var(--color-primary,#800020)]/20">
            <span>
              Boxes: <strong>{totalTileBoxes}</strong>
            </span>
            <span className="opacity-40">|</span>
            <span>
              Pcs: <strong>{totalTilePcs}</strong>
            </span>
            <span className="opacity-40">|</span>
            <span>
              Total Sq.M: <strong>{totalTileSqm.toFixed(2)} m²</strong>
            </span>
            <span className="opacity-40">|</span>
            <span className="text-[var(--color-primary,#800020)] dark:text-rose-300">
              Total Tiles: PKR {tileTotalAmount.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={onHideSection}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer border bg-white dark:bg-boxdark text-[var(--color-primary,#800020)] dark:text-rose-300 border-[var(--color-primary,#800020)]/30 hover:bg-[var(--color-primary,#800020)]/10 shadow-2xs"
          >
            <span>Hide Tile Section</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-primary,#800020)]/20 bg-white/40 dark:bg-boxdark/40 shadow-2xs">
        <table className="w-full text-left text-xs min-w-[1100px]">
          <thead>
            <tr className="bg-[var(--color-primary,#800020)]/10 dark:bg-[var(--color-primary,#800020)]/25 text-[var(--color-primary,#800020)] dark:text-rose-200 font-bold">
              <th className="p-2.5 w-10 text-center">S#</th>
              <th className="p-2.5 min-w-[220px]">Tile Code / Description</th>
              <th className="p-2.5 min-w-[90px] text-center">Boxes</th>
              <th className="p-2.5 min-w-[90px] text-center">Loose Pcs</th>
              <th className="p-2.5 min-w-[105px] text-center">Total Sq.M</th>
              <th className="p-2.5 min-w-[130px] text-right">Rate (Box)</th>
              <th className="p-2.5 min-w-[130px] text-right">Rate (Sq.M)</th>
              <th className="p-2.5 min-w-[120px] text-right">Rate (Per Pc)</th>
              {showDiscount && (
                <th className="p-2.5 min-w-[85px] text-right text-amber-700 dark:text-amber-400">
                  Disc %
                </th>
              )}
              <th className="p-2.5 min-w-[135px] text-right">Line Total</th>
              <th className="p-2.5 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-primary,#800020)]/15 dark:divide-[var(--color-primary,#800020)]/25">
            {tileItems.map((tItem, tIdx) => {
              const isTileActive = activeTileProdIndex === tIdx;
              const query = String(tItem.product_name || '').toLowerCase().trim();

              const filteredTileProds = tileProducts.filter(p => {
                if (!query) return true;
                const name = String(p.product_name || '').toLowerCase();
                const sku = String(p.item_sr_no || '').toLowerCase();
                const cat = String(p.category || '').toLowerCase();
                return name.includes(query) || sku.includes(query) || cat.includes(query);
              });

              return (
                <tr
                  key={tItem.id}
                  className={`hover:bg-[var(--color-primary,#800020)]/[0.04] dark:hover:bg-[var(--color-primary,#800020)]/[0.1] ${
                    isTileActive ? 'relative z-50' : ''
                  }`}
                >
                  <td className="p-2 text-center font-bold text-[var(--color-primary,#800020)]/70 dark:text-rose-300">
                    {tIdx + 1}
                  </td>

                  {/* Merged Tile Code / Description Searchable Autocomplete */}
                  <td className={`p-2 relative tile-dropdown-container ${isTileActive ? 'z-50' : ''}`}>
                    <div className="relative">
                      <input
                        type="text"
                        value={tItem.product_name}
                        onFocus={() => {
                          setActiveTileProdIndex(tIdx);
                          setHighlightedTileProdIndex(0);
                        }}
                        onChange={e => {
                          const typed = e.target.value;
                          setTileItems(prev => {
                            const up = [...prev];
                            up[tIdx] = { ...up[tIdx], product_name: typed };
                            return up;
                          });
                          setActiveTileProdIndex(tIdx);
                          setHighlightedTileProdIndex(0);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHighlightedTileProdIndex(prev =>
                              prev < filteredTileProds.length - 1 ? prev + 1 : 0
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightedTileProdIndex(prev =>
                              prev > 0 ? prev - 1 : filteredTileProds.length - 1
                            );
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredTileProds[highlightedTileProdIndex]) {
                              handleSelectTileProduct(
                                filteredTileProds[highlightedTileProdIndex],
                                tIdx
                              );
                            }
                          } else if (e.key === 'Escape') {
                            setActiveTileProdIndex(null);
                          }
                        }}
                        placeholder="Search by code or tile description..."
                        className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden"
                      />

                      {isTileActive && filteredTileProds.length > 0 && (
                        <div className="absolute left-0 top-full mt-1 z-99999 w-full min-w-[340px] max-w-[460px] max-h-60 overflow-y-auto rounded-xl border border-[var(--color-primary,#800020)]/30 dark:border-[var(--color-primary,#800020)]/50 bg-white dark:bg-boxdark shadow-2xl divide-y divide-stroke dark:divide-strokedark ring-1 ring-black/10">
                          {filteredTileProds.map((p, pIdx) => {
                            const price = Number(
                              p.retail_price ||
                                p.sale_price ||
                                p.sales_price ||
                                p.mrp ||
                                p.price ||
                                0
                            );
                            const isHighlighted = highlightedTileProdIndex === pIdx;
                            const pcsBox = p.pieces_per_box || p.pcs_per_box || 4;

                            return (
                              <div
                                key={p.id}
                                onMouseDown={e => {
                                  e.preventDefault();
                                  handleSelectTileProduct(p, tIdx);
                                }}
                                onMouseEnter={() => setHighlightedTileProdIndex(pIdx)}
                                className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                  isHighlighted
                                    ? 'bg-[var(--color-primary,#800020)]/10 text-[var(--color-primary,#800020)] dark:text-rose-200 font-bold'
                                    : 'hover:bg-gray-50 dark:hover:bg-meta-4/20 text-gray-700 dark:text-gray-200'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {p.item_sr_no && (
                                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-meta-4 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-strokedark shrink-0">
                                        {p.item_sr_no}
                                      </span>
                                    )}
                                    <span className="font-bold truncate">{p.product_name}</span>
                                    {p.category && (
                                      <span className="text-[10px] bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 px-1.5 py-0.2 rounded font-normal">
                                        {p.category}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                    <span>Code: {p.item_sr_no || `SKU-${p.id}`}</span>
                                    <span className="text-[var(--color-primary,#800020)] dark:text-rose-300 font-semibold">
                                      {pcsBox} pcs/box
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-mono font-bold text-[var(--color-primary,#800020)] dark:text-rose-300 block">
                                    PKR {price.toLocaleString()} / box
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Stock: {formatStockWithBoxesAndPcs(p.current_stock || 0, p).inlineText}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {tItem.sku_code && (
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                        <span className="font-bold text-gray-600 dark:text-gray-300">
                          Code: {tItem.sku_code}
                        </span>
                        {tItem.category && <span>• {tItem.category}</span>}
                      </div>
                    )}
                  </td>

                  {/* Quoted Boxes */}
                  <td className="p-2.5 text-center min-w-[90px]">
                    <input
                      type="number"
                      min="0"
                      value={tItem.box_qty}
                      onChange={e =>
                        updateTileRowCalcs(
                          'box_qty',
                          Math.max(0, Number(e.target.value) || 0),
                          tIdx
                        )
                      }
                      className="w-full min-w-0 text-center font-bold text-xs px-2 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-2xs"
                    />
                  </td>

                  {/* Loose Pieces */}
                  <td className="p-2.5 text-center min-w-[90px]">
                    <input
                      type="number"
                      min="0"
                      value={tItem.loose_pcs}
                      onChange={e =>
                        updateTileRowCalcs(
                          'loose_pcs',
                          Math.max(0, Number(e.target.value) || 0),
                          tIdx
                        )
                      }
                      className="w-full min-w-0 text-center font-bold text-xs px-2 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-2xs"
                    />
                  </td>

                  {/* Total Sq.M */}
                  <td className="p-2.5 text-center font-mono font-bold text-[var(--color-primary,#800020)] dark:text-rose-200 whitespace-nowrap min-w-[105px]">
                    {tItem.total_sqm} m²
                  </td>

                  {/* Rate Per Box */}
                  <td className="p-2.5 text-right min-w-[130px]">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={tItem.rate_per_box}
                      onChange={e =>
                        updateTileRowCalcs(
                          'rate_per_box',
                          Math.max(0, Number(e.target.value) || 0),
                          tIdx
                        )
                      }
                      className="w-full min-w-0 text-right font-bold text-xs px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-2xs"
                    />
                  </td>

                  {/* Rate Per Sq.M */}
                  <td className="p-2.5 text-right min-w-[130px]">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={tItem.rate_per_sqm}
                      onChange={e =>
                        updateTileRowCalcs(
                          'rate_per_sqm',
                          Math.max(0, Number(e.target.value) || 0),
                          tIdx
                        )
                      }
                      className="w-full min-w-0 text-right font-bold text-xs px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-2xs"
                    />
                  </td>

                  {/* Rate Per Pc */}
                  <td className="p-2.5 text-right min-w-[120px]">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={tItem.rate_per_piece}
                      onChange={e =>
                        updateTileRowCalcs(
                          'rate_per_piece',
                          Math.max(0, Number(e.target.value) || 0),
                          tIdx
                        )
                      }
                      className="w-full min-w-0 text-right font-bold text-xs px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-2xs"
                    />
                  </td>

                  {/* Disc % */}
                  {showDiscount && (
                    <td className="p-2.5 text-right min-w-[85px]">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={tItem.discount_percent}
                        onChange={e =>
                          updateTileRowCalcs(
                            'discount_percent',
                            Math.max(0, Number(e.target.value) || 0),
                            tIdx
                          )
                        }
                        className="w-full min-w-0 text-right font-mono font-bold text-xs px-2 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-2xs"
                      />
                    </td>
                  )}

                  {/* Line Total */}
                  <td className="p-2.5 text-right font-black font-mono text-[var(--color-primary,#800020)] dark:text-rose-200 whitespace-nowrap min-w-[135px]">
                    PKR {tItem.amount.toLocaleString()}
                  </td>

                  {/* Delete */}
                  <td className="p-2.5 text-center w-12">
                    <button
                      type="button"
                      onClick={() => handleRemoveTileItem(tIdx)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="Remove Tile Row"
                    >
                      <MdDeleteOutline size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {tileItems.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="p-4 text-center text-xs text-[var(--color-primary,#800020)]/70 dark:text-rose-300 italic"
                >
                  No tile products added. Click &quot;Append Tile Row&quot; below to add tile specifications.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Append Tile Row Button & Specification Helper */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleAppendTileRow}
          className="inline-flex items-center gap-1.5 bg-[var(--color-primary,#800020)] hover:opacity-90 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
        >
          <MdAdd size={16} />
          <span>Append Tile Row</span>
        </button>
        <span className="text-[11px] text-amber-800/80 dark:text-amber-400/80 italic">
          * Cross-calculates boxes, loose pieces &amp; sq.m automatically with your tile box specifications
        </span>
      </div>
    </div>
  );
};
