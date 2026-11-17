import React from 'react';
import { FieldArray } from 'formik';
import { OpeningStockMultiFormValues } from '../types/openingStockTypes';
import OpeningStockBatchRow from './OpeningStockBatchRow';
import {
    emptyItemRow,
    fmtMoney,
    getProduct,
    isLoosePackagingItem,
    getProductPiecesPerBox
} from '../utils/openingStockHelpers';
import { toast } from 'react-hot-toast';

interface OpeningStockBatchTableProps {
    values: OpeningStockMultiFormValues;
    errors: any;
    touched: any;
    products: any[];
    stockMap: Record<string, number>;
    showExpiryColumn: boolean;
    setShowExpiryColumn: React.Dispatch<React.SetStateAction<boolean>>;
    openProductRow: number | null;
    setOpenProductRow: React.Dispatch<React.SetStateAction<number | null>>;
    highlightedProductIndex: number;
    setHighlightedProductIndex: React.Dispatch<React.SetStateAction<number>>;
    productInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    productDropdownScrollRef: React.RefObject<HTMLDivElement>;
    setFieldValue: (field: string, value: any) => void;
    handleChange: (e: React.ChangeEvent<any>) => void;
    queueProductScroll: (next: number) => void;
}

export const OpeningStockBatchTable: React.FC<OpeningStockBatchTableProps> = ({
    values,
    errors,
    touched,
    products,
    stockMap,
    showExpiryColumn,
    setShowExpiryColumn,
    openProductRow,
    setOpenProductRow,
    highlightedProductIndex,
    setHighlightedProductIndex,
    productInputRefs,
    productDropdownScrollRef,
    setFieldValue,
    handleChange,
    queueProductScroll
}) => {
    const totalValuation = (values.items || []).reduce((sum: number, r: any) => {
        const pObj = getProduct(products, r.itemName, r.itemCode);
        const isPack = Boolean(r.isTileItem || isLoosePackagingItem(pObj));
        const pcsPerBox = r.piecesPerBox || getProductPiecesPerBox(pObj);
        const packCost = Number(r.purchasePrice) || 0;
        const pcCost = r.pieceCost !== undefined && r.pieceCost !== ''
            ? Number(r.pieceCost)
            : (pcsPerBox > 0 ? packCost / pcsPerBox : 0);

        if (isPack) {
            const bQty = Number(r.boxQty || 0);
            const lPcs = Number(r.loosePcs || 0);
            return sum + (bQty * packCost) + (lPcs * pcCost);
        }
        return sum + ((Number(r.qty) || 0) * packCost);
    }, 0);

    // Duplicate product detection across rows (case-insensitive, trimmed)
    const productCounts: Record<string, number> = {};
    (values.items || []).forEach((r: any) => {
        const k = String(r.itemName || '').trim().toLowerCase();
        if (k) productCounts[k] = (productCounts[k] || 0) + 1;
    });
    const duplicateProductKeys = new Set(
        Object.keys(productCounts).filter((k) => productCounts[k] > 1)
    );

    const applyProduct = (p: any, index: number) => {
        const isTile = isLoosePackagingItem(p);
        const pcsPerBox = getProductPiecesPerBox(p);
        const updated = [...values.items];
        const currentItem = updated[index];
        const bQty = isTile ? (currentItem?.boxQty !== undefined ? Number(currentItem.boxQty) : 1) : 1;
        const lPcs = isTile ? (Number(currentItem?.loosePcs) || 0) : 0;
        const totalBoxes = isTile ? Number((bQty + (pcsPerBox > 0 ? lPcs / pcsPerBox : 0)).toFixed(3)) : 1;

        const packCost = Number(p.purchase_price) || 0;
        let defaultPieceCost: any = '';
        if (isTile && pcsPerBox > 0) {
            if (Number(p.loose_purchase_price) > 0) {
                defaultPieceCost = Number(p.loose_purchase_price);
            } else if (packCost > 0) {
                defaultPieceCost = Number((packCost / pcsPerBox).toFixed(2));
            }
        }

        updated[index] = {
            ...updated[index],
            itemName: p.product_name,
            itemCode: p.item_sr_no || `SKU-${p.id}`,
            purchasePrice: packCost,
            pieceCost: defaultPieceCost,
            isTileItem: isTile,
            piecesPerBox: pcsPerBox,
            boxQty: bQty,
            loosePcs: lPcs,
            qty: totalBoxes > 0 ? totalBoxes : 1
        };
        setFieldValue('items', updated);
        setOpenProductRow(null);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Product Lines <span className="font-normal normal-case">(each line creates one opening stock record)</span>
                </p>

                {/* Pill selector for Expiry */}
                <button
                    type="button"
                    onClick={() => setShowExpiryColumn((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                        showExpiryColumn
                            ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-meta-4/40 dark:text-slate-300 dark:border-strokedark'
                    }`}
                    title={showExpiryColumn ? 'Hide optional expiry dates column' : 'Show optional expiry dates column'}
                >
                    <span className={`w-2 h-2 rounded-full ${showExpiryColumn ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                    <span>{showExpiryColumn ? 'Expiry Dates Visible' : '+ Add Expiry Date'}</span>
                </button>
            </div>

            <FieldArray
                name="items"
                render={({ push, remove }) => (
                    <div className="rounded-xl border border-stroke dark:border-strokedark">
                        <table className="w-full table-auto border-collapse min-w-[860px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-meta-4/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-left">
                                    <th className="py-2.5 px-2 w-10 text-center border-b border-stroke dark:border-strokedark">S#</th>
                                    <th className="py-2.5 px-2 border-b border-stroke dark:border-strokedark w-72">Product *</th>
                                    <th className="py-2.5 px-2 border-b border-stroke dark:border-strokedark w-56 text-center">Qty / Packaging *</th>
                                    <th className="py-2.5 px-2 border-b border-stroke dark:border-strokedark w-32 text-right">Unit Cost (PKR) *</th>
                                    {showExpiryColumn && (
                                        <th className="py-2.5 px-2 border-b border-stroke dark:border-strokedark w-36">Expiry (Opt)</th>
                                    )}
                                    <th className="py-2.5 px-2 border-b border-stroke dark:border-strokedark w-36 text-right">Line Amount</th>
                                    <th className="py-2.5 px-2 border-b border-stroke dark:border-strokedark w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {values.items.map((item, index) => {
                                    const lineError = (errors as any)?.items?.[index];
                                    const lineTouched = (touched as any)?.items?.[index];
                                    const rowProductKey = String(item.itemName || '').trim().toLowerCase();
                                    const isDuplicateRow = !!rowProductKey && duplicateProductKeys.has(rowProductKey);
                                    const firstDupRowIndex = isDuplicateRow
                                        ? (values.items || []).findIndex(
                                            (r: any, j: number) =>
                                                j !== index &&
                                                String(r.itemName || '').trim().toLowerCase() === rowProductKey
                                        )
                                        : -1;

                                    return (
                                        <OpeningStockBatchRow
                                            key={index}
                                            item={item}
                                            index={index}
                                            totalRowsCount={values.items.length}
                                            products={products}
                                            stockMap={stockMap}
                                            showExpiryColumn={showExpiryColumn}
                                            openProductRow={openProductRow}
                                            setOpenProductRow={setOpenProductRow}
                                            highlightedProductIndex={highlightedProductIndex}
                                            setHighlightedProductIndex={setHighlightedProductIndex}
                                            productInputRefs={productInputRefs}
                                            productDropdownScrollRef={productDropdownScrollRef}
                                            duplicateProductKeys={duplicateProductKeys}
                                            firstDupRowIndex={firstDupRowIndex}
                                            lineError={lineError}
                                            lineTouched={lineTouched}
                                            onApplyProduct={applyProduct}
                                            onRemove={(idx) => {
                                                if (values.items.length > 1) {
                                                    remove(idx);
                                                } else {
                                                    toast.error('At least one product line is required.');
                                                }
                                            }}
                                            setFieldValue={setFieldValue}
                                            handleChange={handleChange}
                                            queueProductScroll={queueProductScroll}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="p-3 border-t border-stroke dark:border-strokedark flex items-center justify-between gap-3 flex-wrap">
                            <button
                                type="button"
                                onClick={() => {
                                    const nextIndex = (values.items || []).length;
                                    push(emptyItemRow());
                                    setHighlightedProductIndex(0);
                                    setTimeout(() => {
                                        const el = productInputRefs.current[nextIndex];
                                        if (el) el.focus();
                                    }, 0);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-white font-bold py-2 px-4 text-xs transition hover:opacity-90 cursor-pointer"
                            >
                                + Add Product Line
                            </button>
                            <div className="flex items-center gap-6 text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                                    Total Items: <span className="text-slate-800 dark:text-white font-extrabold">{values.items.length}</span>
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                                    Total Valuation: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">Rs. {fmtMoney(totalValuation)}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            />
        </div>
    );
};

export default OpeningStockBatchTable;
