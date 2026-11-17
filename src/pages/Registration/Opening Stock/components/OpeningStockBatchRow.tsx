import React from 'react';
import { OpeningStockItemRow } from '../types/openingStockTypes';
import {
    blockInvalidChar,
    isLoosePackagingItem,
    getProductPiecesPerBox,
    getProduct,
    getItemCurrentStock,
    fmtMoney
} from '../utils/openingStockHelpers';

interface OpeningStockBatchRowProps {
    item: OpeningStockItemRow;
    index: number;
    totalRowsCount: number;
    products: any[];
    stockMap: Record<string, number>;
    showExpiryColumn: boolean;
    openProductRow: number | null;
    setOpenProductRow: React.Dispatch<React.SetStateAction<number | null>>;
    highlightedProductIndex: number;
    setHighlightedProductIndex: React.Dispatch<React.SetStateAction<number>>;
    productInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    productDropdownScrollRef: React.RefObject<HTMLDivElement>;
    duplicateProductKeys: Set<string>;
    firstDupRowIndex: number;
    lineError: any;
    lineTouched: any;
    onApplyProduct: (p: any, index: number) => void;
    onRemove: (index: number) => void;
    setFieldValue: (field: string, value: any) => void;
    handleChange: (e: React.ChangeEvent<any>) => void;
    queueProductScroll: (next: number) => void;
}

export const OpeningStockBatchRow: React.FC<OpeningStockBatchRowProps> = ({
    item,
    index,
    totalRowsCount,
    products,
    stockMap,
    showExpiryColumn,
    openProductRow,
    setOpenProductRow,
    highlightedProductIndex,
    setHighlightedProductIndex,
    productInputRefs,
    productDropdownScrollRef,
    duplicateProductKeys,
    firstDupRowIndex,
    lineError,
    lineTouched,
    onApplyProduct,
    onRemove,
    setFieldValue,
    handleChange,
    queueProductScroll
}) => {
    const normText = (v: any) => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const query = normText(item.itemName);
    const filtered = (query
        ? products.filter((p) =>
            normText(p.product_name).includes(query) ||
            normText(p.item_sr_no).includes(query)
        )
        : products
    )
        .slice()
        .sort((a: any, b: any) =>
            (Number(b.current_stock) || 0) - (Number(a.current_stock) || 0) ||
            String(a.product_name || '').localeCompare(String(b.product_name || ''))
        )
        .slice(0, 60);

    const rowProductKey = String(item.itemName || '').trim().toLowerCase();
    const isDuplicateRow = !!rowProductKey && duplicateProductKeys.has(rowProductKey);
    const productInputRed = Boolean(lineError?.itemName) || isDuplicateRow;

    return (
        <tr className="border-b border-stroke dark:border-strokedark align-top">
            <td className="py-2 px-2 text-center font-medium text-slate-500">{index + 1}</td>

            {/* Product search */}
            <td className="py-2 px-2">
                <div className="relative">
                    <input
                        type="text"
                        autoComplete="off"
                        placeholder="Search name or code..."
                        value={item.itemName}
                        ref={(el) => (productInputRefs.current[index] = el)}
                        onFocus={() => {
                            setOpenProductRow(index);
                            setHighlightedProductIndex(0);
                        }}
                        onBlur={() => {
                            setTimeout(() => {
                                setOpenProductRow((prev) => (prev === index ? null : prev));
                            }, 150);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                if (filtered.length === 0) return;
                                setHighlightedProductIndex((prev) => {
                                    const next = prev < filtered.length - 1 ? prev + 1 : 0;
                                    queueProductScroll(next);
                                    return next;
                                });
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                if (filtered.length === 0) return;
                                setHighlightedProductIndex((prev) => {
                                    const next = prev > 0 ? prev - 1 : filtered.length - 1;
                                    queueProductScroll(next);
                                    return next;
                                });
                            } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (filtered.length > 0) {
                                    onApplyProduct(filtered[highlightedProductIndex] || filtered[0], index);
                                }
                            } else if (e.key === 'Tab' || e.key === 'Escape') {
                                setOpenProductRow(null);
                            }
                        }}
                        onChange={(e) => {
                            const typed = e.target.value;
                            setFieldValue(`items.${index}.itemName`, typed);
                            setOpenProductRow(index);
                            setHighlightedProductIndex(0);
                        }}
                        className={`w-full rounded border px-2.5 h-9 bg-transparent text-xs font-semibold text-black dark:text-white outline-none focus:border-primary ${productInputRed ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                    />
                    {isDuplicateRow && (
                        <p className="text-red-500 text-[10px] mt-1 font-bold">
                            Duplicate product — already added in row {firstDupRowIndex + 1}. Remove it from one of these rows.
                        </p>
                    )}
                    {item.itemCode && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-primary dark:text-blue-400">
                                Code: {item.itemCode}
                            </span>
                            {Boolean(item.isTileItem || isLoosePackagingItem(products.find(prod => (prod.product_name || '').toLowerCase().trim() === (item.itemName || '').toLowerCase().trim()))) && (() => {
                                const pObj = products.find(prod => (prod.product_name || '').toLowerCase().trim() === (item.itemName || '').toLowerCase().trim());
                                const looseLabel = pObj?.loose_uom || 'pcs';
                                const mainLabel = pObj?.uom || 'box';
                                return (
                                    <span className="text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 px-1.5 py-0.5 rounded shadow-2xs">
                                        {item.piecesPerBox || (pObj ? getProductPiecesPerBox(pObj) : 4)} {looseLabel} / {mainLabel}
                                    </span>
                                );
                            })()}
                        </div>
                    )}
                    {openProductRow === index && filtered.length > 0 && (
                        <div ref={productDropdownScrollRef} className="absolute left-0 right-0 top-full mt-1 z-[9999] max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-boxdark shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map((p, pIdx) => (
                                <div
                                    key={p.id}
                                    data-opt={pIdx}
                                    onMouseEnter={() => setHighlightedProductIndex(pIdx)}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onApplyProduct(p, index);
                                    }}
                                    className={`p-2 cursor-pointer transition flex items-center justify-between gap-2 ${pIdx === highlightedProductIndex ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}
                                >
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{p.product_name}</span>
                                        <span className="text-[10px] font-mono text-primary">{p.item_sr_no || `SKU-${p.id}`}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 shrink-0">Rs. {Number(p.purchase_price || 0).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {lineTouched?.itemName && lineError?.itemName && (
                        <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(lineError.itemName)}</p>
                    )}
                </div>
            </td>

            {/* Qty / Packaging */}
            <td className="py-2 px-2">
                {(() => {
                    const stockInfo = getItemCurrentStock(products, stockMap, item.itemName);
                    const packingPcs = item.piecesPerBox || stockInfo.pcsPerBox || 4;
                    const pObj = products.find(prod => (prod.product_name || '').toLowerCase().trim() === (item.itemName || '').toLowerCase().trim());
                    const isPackaging = Boolean(item.isTileItem || isLoosePackagingItem(pObj));
                    const mainUnitName = pObj?.uom ? (pObj.uom.toUpperCase() === 'BOX' ? 'Box(es)' : pObj.uom) : (stockInfo.uom || 'Box(es)');
                    const looseUnitName = pObj?.loose_uom || stockInfo.looseUom || 'Loose Pcs';
                    const looseShort = pObj?.loose_uom || stockInfo.looseUom || 'Pcs';
                    const mainShort = pObj?.uom ? (pObj.uom.toUpperCase() === 'BOX' ? 'Bx' : pObj.uom) : (stockInfo.uom || 'Bx');
                    const uomDisplay = pObj?.uom || 'Box';

                    const totalQty = Number(item.qty) || 0;
                    const boxVal = item.boxQty !== undefined ? item.boxQty : Math.floor(totalQty);
                    const looseVal = item.loosePcs !== undefined ? item.loosePcs : Math.round((totalQty - Math.floor(totalQty)) * packingPcs);

                    return isPackaging ? (
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <div className="flex-1 min-w-[70px]">
                                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{mainUnitName}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={boxVal ?? ''}
                                        placeholder={mainUnitName}
                                        onKeyDown={blockInvalidChar}
                                        onChange={(e) => {
                                            const bVal = Math.max(0, parseInt(e.target.value, 10) || 0);
                                            const pcsPerBox = packingPcs;
                                            const lVal = Math.max(0, Number(item.loosePcs !== undefined ? item.loosePcs : looseVal));
                                            const totalBoxes = Number((bVal + (lVal / pcsPerBox)).toFixed(3));
                                            setFieldValue(`items.${index}.boxQty`, bVal);
                                            setFieldValue(`items.${index}.loosePcs`, lVal);
                                            setFieldValue(`items.${index}.qty`, totalBoxes);
                                        }}
                                        className="w-full rounded border border-stroke dark:border-strokedark px-2 h-8 bg-transparent text-xs text-right font-bold text-black dark:text-white outline-none focus:border-primary"
                                    />
                                    {item.itemName && (
                                        <div className="mt-1 flex items-center justify-between text-[10px] leading-tight px-0.5" title={`Current Overall Stock: ${stockInfo.boxes} ${mainUnitName}`}>
                                            <span className="text-[9px] text-gray-400 font-medium">Stock:</span>
                                            <span className={`font-bold font-mono ${stockInfo.boxes > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {stockInfo.boxes} <span className="text-[8.5px] font-normal text-gray-400">{mainShort}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-[70px]">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-tight">{looseUnitName}</label>
                                        <span className="text-[8.5px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-900/40 px-1 rounded lowercase" title="Pieces per packaging unit">
                                            {packingPcs}/{mainShort.toLowerCase()}
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={looseVal ?? ''}
                                        placeholder={looseShort}
                                        onKeyDown={blockInvalidChar}
                                        onChange={(e) => {
                                            const pcsPerBox = packingPcs;
                                            if (e.target.value === '') {
                                                const bVal = Math.max(0, Number(item.boxQty !== undefined ? item.boxQty : boxVal));
                                                setFieldValue(`items.${index}.boxQty`, bVal);
                                                setFieldValue(`items.${index}.loosePcs`, '');
                                                setFieldValue(`items.${index}.qty`, bVal);
                                                return;
                                            }
                                            const rawLoose = Math.max(0, parseInt(e.target.value, 10) || 0);
                                            const currentBoxes = Math.max(0, Number(item.boxQty !== undefined ? item.boxQty : boxVal));
                                            if (rawLoose >= pcsPerBox) {
                                                const extraBoxes = Math.floor(rawLoose / pcsPerBox);
                                                const remLoose = rawLoose % pcsPerBox;
                                                const finalBoxes = currentBoxes + extraBoxes;
                                                const totalBoxes = Number((finalBoxes + (remLoose / pcsPerBox)).toFixed(3));
                                                setFieldValue(`items.${index}.boxQty`, finalBoxes);
                                                setFieldValue(`items.${index}.loosePcs`, remLoose === 0 ? 0 : remLoose);
                                                setFieldValue(`items.${index}.qty`, totalBoxes);
                                            } else {
                                                const totalBoxes = Number((currentBoxes + (rawLoose / pcsPerBox)).toFixed(3));
                                                setFieldValue(`items.${index}.boxQty`, currentBoxes);
                                                setFieldValue(`items.${index}.loosePcs`, rawLoose);
                                                setFieldValue(`items.${index}.qty`, totalBoxes);
                                            }
                                        }}
                                        className="w-full rounded border border-teal-300 dark:border-teal-700 px-2 h-8 bg-teal-50/40 dark:bg-teal-950/20 text-xs text-right font-bold text-teal-800 dark:text-teal-300 outline-none focus:border-teal-600"
                                    />
                                    {item.itemName && (
                                        <div className="mt-1 flex items-center justify-between text-[10px] leading-tight px-0.5" title={`Current Overall Stock: ${stockInfo.loose} ${looseUnitName}`}>
                                            <span className="text-[9px] text-teal-600/80 font-medium">Stock:</span>
                                            <span className={`font-bold font-mono ${stockInfo.loose > 0 ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {stockInfo.loose} <span className="text-[8.5px] font-normal text-teal-600/70">{looseShort}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {item.itemName && (
                                <div className="text-[9px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-1">
                                    <span className="font-bold text-teal-700 dark:text-teal-400">
                                        1 {uomDisplay} = {packingPcs} {looseShort}
                                    </span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                                        Stock: {stockInfo.totalStock} {mainShort}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <input
                                type="number"
                                step="any"
                                name={`items.${index}.qty`}
                                min="0.001"
                                onKeyDown={blockInvalidChar}
                                onChange={handleChange}
                                value={item.qty}
                                className={`w-full rounded border px-2.5 h-8 bg-transparent text-xs text-right font-bold text-black dark:text-white outline-none focus:border-primary ${lineError?.qty ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                            />
                            {item.itemName && (
                                <div className="mt-1 flex items-center justify-between text-[10px] leading-tight px-0.5" title={`Current Overall Stock: ${stockInfo.totalStock} ${stockInfo.uom}`}>
                                    <span className="text-[9px] text-gray-400 font-medium">Stock:</span>
                                    <span className={`font-bold font-mono ${stockInfo.totalStock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {stockInfo.totalStock} <span className="text-[8.5px] font-normal text-gray-400">{stockInfo.uom}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })()}
                {lineTouched?.qty && lineError?.qty && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(lineError.qty)}</p>}
            </td>

            {/* Unit cost */}
            <td className="py-2 px-2">
                {(() => {
                    const pObj = getProduct(products, item.itemName, item.itemCode);
                    const isPackaging = Boolean(item.isTileItem || isLoosePackagingItem(pObj));
                    const pcsPerBox = item.piecesPerBox || getProductPiecesPerBox(pObj);
                    const mainShort = (pObj?.uom || 'Pack').toUpperCase();
                    const looseShort = (pObj?.loose_uom || 'PCS').toUpperCase();

                    if (isPackaging) {
                        return (
                            <div className="space-y-1.5 min-w-[130px]">
                                <div>
                                    <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                                        <span>Cost / {mainShort} *</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="any"
                                        name={`items.${index}.purchasePrice`}
                                        min="0"
                                        onKeyDown={blockInvalidChar}
                                        onChange={(e) => {
                                            handleChange(e);
                                            const newPack = Number(e.target.value) || 0;
                                            if (!Number(pObj?.loose_purchase_price) && pcsPerBox > 0) {
                                                setFieldValue(`items.${index}.pieceCost`, Number((newPack / pcsPerBox).toFixed(2)));
                                            }
                                        }}
                                        value={item.purchasePrice}
                                        placeholder="Pack cost"
                                        className={`w-full rounded border px-2 h-7 bg-slate-50/60 dark:bg-meta-4/20 text-xs text-right font-mono font-bold text-black dark:text-white outline-none focus:border-primary ${lineError?.purchasePrice ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-[9px] font-semibold text-teal-600 dark:text-teal-400">
                                        <span>Cost / {looseShort} *</span>
                                        <span className="text-[8px] opacity-75 font-normal">editable</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="any"
                                        name={`items.${index}.pieceCost`}
                                        min="0"
                                        onKeyDown={blockInvalidChar}
                                        onChange={handleChange}
                                        value={item.pieceCost !== undefined && item.pieceCost !== '' ? item.pieceCost : (pcsPerBox > 0 ? Number(((Number(item.purchasePrice) || 0) / pcsPerBox).toFixed(2)) : '')}
                                        placeholder="Piece cost"
                                        className="w-full rounded border border-teal-300 dark:border-teal-700 px-2 h-7 bg-teal-50/40 dark:bg-teal-950/20 text-xs text-right font-mono font-bold text-teal-800 dark:text-teal-300 outline-none focus:border-teal-600"
                                    />
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div>
                            <input
                                type="number"
                                step="any"
                                name={`items.${index}.purchasePrice`}
                                min="0"
                                onKeyDown={blockInvalidChar}
                                onChange={handleChange}
                                value={item.purchasePrice}
                                className={`w-full rounded border px-2.5 h-9 bg-slate-50/60 dark:bg-meta-4/20 text-xs text-right font-mono font-bold text-black dark:text-white outline-none focus:border-primary ${lineError?.purchasePrice ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                            />
                        </div>
                    );
                })()}
                {lineTouched?.purchasePrice && lineError?.purchasePrice && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(lineError.purchasePrice)}</p>}
            </td>

            {/* Expiry */}
            {showExpiryColumn && (
                <td className="py-2 px-2">
                    <input
                        type="date"
                        name={`items.${index}.expiryDate`}
                        onChange={handleChange}
                        value={item.expiryDate || ''}
                        className="w-full rounded border border-stroke dark:border-strokedark px-2.5 h-8 bg-transparent text-xs text-black dark:text-white"
                    />
                </td>
            )}

            {/* Line amount */}
            <td className="py-2 px-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                {(() => {
                    const pObj = getProduct(products, item.itemName, item.itemCode);
                    const isPack = Boolean(item.isTileItem || isLoosePackagingItem(pObj));
                    const pcsPerBox = item.piecesPerBox || getProductPiecesPerBox(pObj);
                    const packCost = Number(item.purchasePrice) || 0;
                    const pcCost = item.pieceCost !== undefined && item.pieceCost !== ''
                        ? Number(item.pieceCost)
                        : (pcsPerBox > 0 ? packCost / pcsPerBox : 0);

                    let lineTotal = 0;
                    if (isPack) {
                        const bQty = Number(item.boxQty || 0);
                        const lPcs = Number(item.loosePcs || 0);
                        lineTotal = (bQty * packCost) + (lPcs * pcCost);
                    } else {
                        lineTotal = (Number(item.qty) || 0) * packCost;
                    }
                    return `Rs. ${fmtMoney(lineTotal)}`;
                })()}
            </td>

            {/* Remove */}
            <td className="py-2 px-2 text-center">
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg p-1.5 transition cursor-pointer"
                    title="Remove line"
                >
                    ✕
                </button>
            </td>
        </tr>
    );
};

export default OpeningStockBatchRow;
