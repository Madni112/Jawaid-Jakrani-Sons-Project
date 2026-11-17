import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../../ui/Spinner';
import { OpeningStockSingleFormValues } from '../types/openingStockTypes';
import {
    todayStr,
    blockInvalidChar,
    isLoosePackagingItem,
    getProductPiecesPerBox,
    getProduct,
    getItemCurrentStock
} from '../utils/openingStockHelpers';

interface OpeningStockSingleFormProps {
    editData: any;
    products: any[];
    locations: any[];
    stockMap: Record<string, number>;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    navigate: (path: string) => void;
    showSkuDropdown: boolean;
    setShowSkuDropdown: React.Dispatch<React.SetStateAction<boolean>>;
    highlightedSkuIndex: number;
    setHighlightedSkuIndex: React.Dispatch<React.SetStateAction<number>>;
    skuDropdownRef: React.RefObject<HTMLDivElement>;
}

const singleValidationSchema = Yup.object().shape({
    itemName: Yup.string().required('Required'),
    batchNumber: Yup.string().required('Required'),
    location: Yup.string().required('Required'),
    qty: Yup.number().min(0.001, 'Min 0.001').required('Required'),
    purchasePrice: Yup.number().min(0, 'Min 0').required('Required'),
    openingDate: Yup.string().required('Required'),
    expiryDate: Yup.string().nullable(),
});

export const OpeningStockSingleForm: React.FC<OpeningStockSingleFormProps> = ({
    editData,
    products,
    locations,
    stockMap,
    loading,
    setLoading,
    navigate,
    showSkuDropdown,
    setShowSkuDropdown,
    highlightedSkuIndex,
    setHighlightedSkuIndex,
    skuDropdownRef
}) => {
    const getSingleInitialValues = (): OpeningStockSingleFormValues => {
        const nameToFind = String(editData?.itemName || editData?.product_name || editData?.itemname || '').trim().toLowerCase();
        const codeToFind = String(editData?.skuCode || editData?.item_code || editData?.itemCode || editData?.skucode || '').trim().toLowerCase();
        const singleMatch = products.find((p: any) =>
            (p.product_name && p.product_name.trim().toLowerCase() === nameToFind) ||
            (p.item_sr_no && p.item_sr_no.trim().toLowerCase() === codeToFind)
        );
        const isTile = isLoosePackagingItem(singleMatch || editData);
        const pcsPerBox = getProductPiecesPerBox(singleMatch || editData);
        const totalQty = Number(editData?.qty ?? editData?.quantity) || 1;
        const bQty = Math.floor(totalQty);
        const lPcs = Math.round((totalQty - bQty) * pcsPerBox);

        const unitCost = Number(editData?.purchasePrice ?? editData?.purchase_price ?? editData?.rate ?? editData?.rp) || 0;
        let pieceCost: any = '';
        if (isTile && pcsPerBox > 0) {
            if (Number(singleMatch?.loose_purchase_price) > 0) {
                pieceCost = Number(singleMatch.loose_purchase_price);
            } else if (unitCost > 0) {
                pieceCost = Number((unitCost / pcsPerBox).toFixed(2));
            }
        }

        return {
            stockNo: editData?.stockNo || editData?.stock_no || editData?.stockno || '',
            skuCode: editData?.skuCode || editData?.item_code || editData?.skucode || '',
            itemName: editData?.itemName || editData?.product_name || editData?.itemname || '',
            batchNumber: editData?.batchNumber || editData?.batch_number || editData?.batchnumber || '',
            location: editData?.location || '',
            qty: totalQty,
            purchasePrice: unitCost,
            pieceCost: pieceCost,
            amount: Number(editData?.amount ?? editData?.total_amount) || 0,
            openingDate: editData?.openingDate || editData?.opening_date || editData?.openingdate || todayStr(),
            expiryDate: editData?.expiryDate || editData?.expiry_date || editData?.expirydate || '',
            isTileItem: isTile,
            piecesPerBox: pcsPerBox,
            boxQty: bQty,
            loosePcs: lPcs
        };
    };

    const handleSubmit = async (values: OpeningStockSingleFormValues) => {
        setLoading(true);
        try {
            const unitCost = Number(values.purchasePrice) || 0;
            const pObj = getProduct(products, values.itemName, values.skuCode);
            const isPack = Boolean(values.isTileItem || isLoosePackagingItem(pObj));
            const pcsPerBox = values.piecesPerBox || getProductPiecesPerBox(pObj);
            const pcCost = values.pieceCost !== undefined && values.pieceCost !== ''
                ? Number(values.pieceCost)
                : (pcsPerBox > 0 ? unitCost / pcsPerBox : 0);

            const bQty = Number(values.boxQty || 0);
            const lPcs = Number(values.loosePcs || 0);
            const quantity = isPack ? Number((bQty + (pcsPerBox > 0 ? lPcs / pcsPerBox : 0)).toFixed(3)) : (Number(values.qty) || 0);
            const totalValuation = isPack
                ? (bQty * unitCost) + (lPcs * pcCost)
                : quantity * unitCost;

            const exp = values.expiryDate === '' ? null : values.expiryDate;
            const finalValues = {
                stock_no: values.stockNo,
                stockno: values.stockNo,
                item_code: values.skuCode,
                skucode: values.skuCode,
                product_name: values.itemName,
                itemname: values.itemName,
                batch_number: values.batchNumber,
                batchnumber: values.batchNumber,
                location: values.location,
                qty: quantity,
                quantity: quantity,
                purchase_price: unitCost,
                rate: unitCost,
                amount: totalValuation,
                total_amount: totalValuation,
                opening_date: values.openingDate,
                openingdate: values.openingDate,
                expiry_date: exp,
                expirydate: exp
            };

            const oldQty = Number(editData.qty || editData.quantity) || 0;
            const qtyDifference = quantity - oldQty;

            const { error: stockError } = await supabase
                .from('opening_stocks')
                .update(finalValues)
                .eq('id', editData.id);

            if (stockError) throw stockError;

            if (qtyDifference !== 0) {
                const { data: currentProduct } = await supabase
                    .from('products')
                    .select('current_stock')
                    .ilike('product_name', values.itemName)
                    .maybeSingle();

                if (currentProduct) {
                    await supabase
                        .from('products')
                        .update({ current_stock: (Number(currentProduct.current_stock) || 0) + qtyDifference })
                        .eq('product_name', values.itemName);
                }
            }

            toast.success('Opening stock updated successfully!');
            navigate('/Inventory/OpeningStock/List');
        } catch (err: any) {
            toast.error('Operation Failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Formik
            initialValues={getSingleInitialValues()}
            enableReinitialize={true}
            validationSchema={singleValidationSchema}
            onSubmit={handleSubmit}
        >
            {({ handleChange, setFieldValue, values, errors, touched }) => {
                const singlePObj = getProduct(products, values.itemName, values.skuCode);
                const singleIsTile = Boolean(values.isTileItem || isLoosePackagingItem(singlePObj));
                const singlePcs = values.piecesPerBox || getProductPiecesPerBox(singlePObj);
                const singlePackCost = Number(values.purchasePrice) || 0;
                const singlePieceCost = values.pieceCost !== undefined && values.pieceCost !== ''
                    ? Number(values.pieceCost)
                    : (singlePcs > 0 ? singlePackCost / singlePcs : 0);

                const singleTotalValuation = singleIsTile
                    ? (Number(values.boxQty || 0) * singlePackCost) + (Number(values.loosePcs || 0) * singlePieceCost)
                    : (Number(values.qty || 0) * singlePackCost);

                const calculatedAmount = singleTotalValuation.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                return (
                    <Form className="p-6.5 space-y-6">
                        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-500">Stock Number (Auto Generated)</label>
                                <input
                                    name="stockNo"
                                    readOnly
                                    value={values.stockNo}
                                    className="w-full rounded border border-stroke bg-gray-50 dark:bg-meta-4/10 px-3 h-10 text-xs font-bold outline-none text-black dark:text-white"
                                />
                            </div>

                            {/* 1. Code Typeable Search with Custom Full-Width Dropdown */}
                            <div className="relative" ref={skuDropdownRef}>
                                <label className="mb-2 block text-xs font-semibold text-gray-500">Code (Search & Auto-Select)</label>
                                {(() => {
                                    const filteredProds = products.filter(p => {
                                        if (!values.skuCode) return true;
                                        const query = values.skuCode.toLowerCase().trim();
                                        const sku = (p.item_sr_no || `SKU-${p.id}`).toLowerCase();
                                        const name = (p.product_name || '').toLowerCase();
                                        return sku.includes(query) || name.includes(query);
                                    });

                                    return (
                                        <>
                                            <input
                                                type="text"
                                                name="skuCode"
                                                autoComplete="off"
                                                value={values.skuCode || ''}
                                                onFocus={() => {
                                                    setShowSkuDropdown(true);
                                                    setHighlightedSkuIndex(0);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setHighlightedSkuIndex((prev) =>
                                                            prev < filteredProds.length - 1 ? prev + 1 : 0
                                                        );
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setHighlightedSkuIndex((prev) =>
                                                            prev > 0 ? prev - 1 : filteredProds.length - 1
                                                        );
                                                    } else if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (filteredProds.length > 0) {
                                                            const selected = filteredProds[highlightedSkuIndex] || filteredProds[0];
                                                            const displaySku = selected.item_sr_no || `SKU-${selected.id}`;
                                                            setFieldValue('skuCode', displaySku);
                                                            setFieldValue('itemName', selected.product_name);
                                                            setFieldValue('purchasePrice', selected.purchase_price || 0);
                                                            setShowSkuDropdown(false);
                                                        }
                                                    } else if (e.key === 'Tab' || e.key === 'Escape') {
                                                        setShowSkuDropdown(false);
                                                    }
                                                }}
                                                onChange={(e) => {
                                                    const typed = e.target.value;
                                                    setFieldValue('skuCode', typed);
                                                    setShowSkuDropdown(true);
                                                    setHighlightedSkuIndex(0);

                                                    // Only auto-fill if the user has typed the EXACT FULL Code (e.g. SKU-002)
                                                    const matched = products.find(
                                                        p => p.item_sr_no && p.item_sr_no.toLowerCase() === typed.trim().toLowerCase()
                                                    );
                                                    if (matched) {
                                                        setFieldValue('itemName', matched.product_name);
                                                        setFieldValue('purchasePrice', matched.purchase_price || 0);
                                                    }
                                                }}
                                                placeholder="Type or select Code..."
                                                className="w-full rounded border border-stroke px-3 h-10 bg-transparent text-xs font-mono font-bold outline-none focus:border-primary dark:bg-boxdark text-black dark:text-white uppercase"
                                            />

                                            {/* FULL WIDTH MODERN DROPDOWN */}
                                            {showSkuDropdown && (
                                                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-[290px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                                                    {filteredProds.map((p, pIdx) => {
                                                        const displaySku = p.item_sr_no || `SKU-${p.id}`;
                                                        const isHighlighted = pIdx === highlightedSkuIndex;
                                                        return (
                                                            <div
                                                                key={p.id}
                                                                onMouseEnter={() => setHighlightedSkuIndex(pIdx)}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    setFieldValue('skuCode', displaySku);
                                                                    setFieldValue('itemName', p.product_name);
                                                                    setFieldValue('purchasePrice', p.purchase_price || 0);
                                                                    setShowSkuDropdown(false);
                                                                }}
                                                                className={`p-3 cursor-pointer transition flex items-center justify-between group ${isHighlighted
                                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500'
                                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                                                    }`}
                                                            >
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-mono font-bold text-xs text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                                                        {displaySku}
                                                                    </span>
                                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                                                        {p.product_name}
                                                                    </span>
                                                                </div>
                                                                <div className="text-right font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                                                    Cost: <span className="font-bold text-slate-800 dark:text-white">Rs. {Number(p.purchase_price || 0).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {filteredProds.length === 0 && (
                                                        <div className="p-4 text-center text-xs text-slate-400 italic">
                                                            No matching products or SKUs found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-500">Item Name (Product) *</label>
                                <select
                                    name="itemName"
                                    value={values.itemName}
                                    onChange={(e) => {
                                        const selectedProd = products.find(p => p.product_name === e.target.value);
                                        setFieldValue('itemName', e.target.value);
                                        if (selectedProd) {
                                            const isTile = isLoosePackagingItem(selectedProd);
                                            const pcsPerBox = getProductPiecesPerBox(selectedProd);
                                            setFieldValue('skuCode', selectedProd.item_sr_no || `SKU-${selectedProd.id}`);
                                            setFieldValue('purchasePrice', selectedProd.purchase_price || 0);
                                            setFieldValue('isTileItem', isTile);
                                            setFieldValue('piecesPerBox', pcsPerBox);
                                            if (isTile) {
                                                const curQty = Number(values.qty) || 1;
                                                const bQ = Math.floor(curQty);
                                                const lP = Math.round((curQty - bQ) * pcsPerBox);
                                                setFieldValue('boxQty', bQ);
                                                setFieldValue('loosePcs', lP);
                                            }
                                        }
                                    }}
                                    className={`w-full rounded border px-3 h-10 bg-transparent text-xs font-bold outline-none focus:border-primary dark:bg-boxdark text-black dark:text-white ${touched.itemName && errors.itemName ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                >
                                    <option value="" className="dark:bg-boxdark">-- Select Existing Product --</option>
                                    {products.map((p) => <option key={p.id} value={p.product_name} className="dark:bg-boxdark">{p.product_name}</option>)}
                                </select>
                                {touched.itemName && errors.itemName && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.itemName)}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-500">Batch Number *</label>
                                <input
                                    name="batchNumber"
                                    onChange={handleChange}
                                    value={values.batchNumber}
                                    placeholder="e.g., BN-001"
                                    className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-black dark:text-white ${touched.batchNumber && errors.batchNumber ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                />
                                {touched.batchNumber && errors.batchNumber && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.batchNumber)}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-500">Location / Warehouse *</label>
                                <select
                                    name="location"
                                    onChange={handleChange}
                                    value={values.location}
                                    className={`w-full rounded border px-3 h-10 bg-transparent text-xs font-bold outline-none focus:border-primary dark:bg-boxdark text-black dark:text-white ${touched.location && errors.location ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                >
                                    <option value="" className="dark:bg-boxdark">-- Select Warehouse --</option>
                                    {locations.map((loc) => {
                                        const label = loc.name || loc.locationName || loc.location_name;
                                        return <option key={loc.id} value={label} className="dark:bg-boxdark">{label}</option>;
                                    })}
                                </select>
                                {touched.location && errors.location && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.location)}</p>}
                            </div>

                            <div>
                                {(() => {
                                    const singleStockInfo = getItemCurrentStock(products, stockMap, values.itemName);
                                    const packingPcs = values.piecesPerBox || singleStockInfo.pcsPerBox || 4;
                                    const pObj = products.find(prod => (prod.product_name || '').toLowerCase().trim() === (values.itemName || '').toLowerCase().trim());
                                    const mainUnitName = pObj?.uom ? (pObj.uom.toUpperCase() === 'BOX' ? 'Box(es)' : pObj.uom) : (singleStockInfo.uom || 'Box(es)');
                                    const looseUnitName = pObj?.loose_uom || singleStockInfo.looseUom || 'Loose Pcs';
                                    const looseShort = pObj?.loose_uom || singleStockInfo.looseUom || 'Pcs';
                                    const mainShort = pObj?.uom ? (pObj.uom.toUpperCase() === 'BOX' ? 'Bx' : pObj.uom) : (singleStockInfo.uom || 'Bx');
                                    const uomDisplay = pObj?.uom || 'Box';
                                    const isPackaging = Boolean(values.isTileItem || isLoosePackagingItem(pObj));
                                    const totalQty = Number(values.qty) || 0;
                                    const boxVal = values.boxQty !== undefined ? values.boxQty : Math.floor(totalQty);
                                    const looseVal = values.loosePcs !== undefined ? values.loosePcs : Math.round((totalQty - Math.floor(totalQty)) * packingPcs);

                                    return (
                                        <>
                                            <label className="mb-2 block text-xs font-semibold text-gray-500">
                                                {isPackaging ? `Opening Stock Quantity (${mainUnitName} & ${looseUnitName}) *` : 'Opening Stock Quantity *'}
                                            </label>
                                            {isPackaging ? (
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 uppercase">{mainUnitName}</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={values.boxQty !== undefined ? values.boxQty : (boxVal ?? '')}
                                                                placeholder={mainUnitName}
                                                                onKeyDown={blockInvalidChar}
                                                                onChange={(e) => {
                                                                    const bVal = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                                    const pcsPerBox = packingPcs;
                                                                    const lVal = Math.max(0, Number(values.loosePcs || 0));
                                                                    const totalBoxes = Number((bVal + (lVal / pcsPerBox)).toFixed(3));
                                                                    setFieldValue('boxQty', bVal);
                                                                    setFieldValue('qty', totalBoxes);
                                                                }}
                                                                className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent text-xs text-right font-bold text-black dark:text-white outline-none focus:border-primary"
                                                            />
                                                            {values.itemName && (
                                                                <div className="mt-1 flex items-center justify-between text-[11px] px-1 font-medium">
                                                                    <span className="text-gray-400 text-[10px]">Stock:</span>
                                                                    <span className={`font-bold font-mono ${singleStockInfo.boxes > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                                                        {singleStockInfo.boxes} <span className="text-[9px] font-normal text-gray-400">{mainShort}</span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-between">
                                                                <label className="block text-[10px] font-bold text-teal-600 uppercase">{looseUnitName}</label>
                                                                <span className="text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-900/40 px-1.5 py-0.2 rounded lowercase">
                                                                    {packingPcs} {looseShort.toLowerCase()}/{mainShort.toLowerCase()}
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={values.loosePcs !== undefined ? values.loosePcs : (looseVal ?? '')}
                                                                placeholder={looseShort}
                                                                onKeyDown={blockInvalidChar}
                                                                onChange={(e) => {
                                                                    const pcsPerBox = packingPcs;
                                                                    if (e.target.value === '') {
                                                                        const bVal = Math.max(0, Number(values.boxQty || 0));
                                                                        setFieldValue('loosePcs', '');
                                                                        setFieldValue('qty', bVal);
                                                                        return;
                                                                    }
                                                                    const rawLoose = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                                    const currentBoxes = Math.max(0, Number(values.boxQty || 0));
                                                                    if (rawLoose >= pcsPerBox) {
                                                                        const extraBoxes = Math.floor(rawLoose / pcsPerBox);
                                                                        const remLoose = rawLoose % pcsPerBox;
                                                                        const finalBoxes = currentBoxes + extraBoxes;
                                                                        const totalBoxes = Number((finalBoxes + (remLoose / pcsPerBox)).toFixed(3));
                                                                        setFieldValue('boxQty', finalBoxes);
                                                                        setFieldValue('loosePcs', remLoose === 0 ? 0 : remLoose);
                                                                        setFieldValue('qty', totalBoxes);
                                                                    } else {
                                                                        const totalBoxes = Number((currentBoxes + (rawLoose / pcsPerBox)).toFixed(3));
                                                                        setFieldValue('loosePcs', rawLoose);
                                                                        setFieldValue('qty', totalBoxes);
                                                                    }
                                                                }}
                                                                className="w-full rounded border border-teal-300 dark:border-teal-700 px-3 h-10 bg-teal-50/40 dark:bg-teal-950/20 text-xs text-right font-bold text-teal-800 dark:text-teal-300 outline-none focus:border-teal-600"
                                                            />
                                                            {values.itemName && (
                                                                <div className="mt-1 flex items-center justify-between text-[11px] px-1 font-medium">
                                                                    <span className="text-teal-600 text-[10px]">Stock:</span>
                                                                    <span className={`font-bold font-mono ${singleStockInfo.loose > 0 ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500'}`}>
                                                                        {singleStockInfo.loose} <span className="text-[9px] font-normal text-teal-600/70">{looseShort}</span>
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {values.itemName && (
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-1">
                                                            <span className="font-bold text-teal-700 dark:text-teal-400">
                                                                📦 1 {uomDisplay} = {packingPcs} {looseShort}
                                                            </span>
                                                            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                                                                Stock: {singleStockInfo.totalStock} {mainShort} Total
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        name="qty"
                                                        min="0.001"
                                                        onKeyDown={blockInvalidChar}
                                                        onChange={handleChange}
                                                        value={values.qty}
                                                        className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-right font-bold text-black dark:text-white ${touched.qty && errors.qty ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                                    />
                                                    {values.itemName && (
                                                        <div className="mt-1 flex items-center justify-between text-[11px] px-1 font-medium">
                                                            <span className="text-gray-400 text-[10px]">Stock:</span>
                                                            <span className={`font-bold font-mono ${singleStockInfo.totalStock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                                                {singleStockInfo.totalStock} <span className="text-[9px] font-normal text-gray-400">{singleStockInfo.uom}</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                                {touched.qty && errors.qty && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.qty)}</p>}
                            </div>

                            <div>
                                {(() => {
                                    const singlePObj = getProduct(products, values.itemName, values.skuCode);
                                    const singleIsTile = Boolean(values.isTileItem || isLoosePackagingItem(singlePObj));
                                    const singlePcs = values.piecesPerBox || getProductPiecesPerBox(singlePObj);
                                    const mainShort = (singlePObj?.uom || 'Pack').toUpperCase();
                                    const looseShort = (singlePObj?.loose_uom || 'PCS').toUpperCase();

                                    if (singleIsTile) {
                                        return (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="mb-2 block text-xs font-semibold text-gray-500">
                                                        Cost / {mainShort} (PKR) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        name="purchasePrice"
                                                        min="0"
                                                        onKeyDown={blockInvalidChar}
                                                        onChange={(e) => {
                                                            handleChange(e);
                                                            const newPack = Number(e.target.value) || 0;
                                                            if (!Number(singlePObj?.loose_purchase_price) && singlePcs > 0) {
                                                                setFieldValue('pieceCost', Number((newPack / singlePcs).toFixed(2)));
                                                            }
                                                        }}
                                                        value={values.purchasePrice}
                                                        className={`w-full rounded border px-3 h-10 bg-slate-50/50 dark:bg-meta-4/20 text-xs text-right font-mono font-bold text-black dark:text-white ${touched.purchasePrice && errors.purchasePrice ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="block text-xs font-semibold text-teal-600 dark:text-teal-400">
                                                            Cost / {looseShort} (PKR) *
                                                        </label>
                                                        <span className="text-[10px] text-teal-600/80 font-medium">editable</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        name="pieceCost"
                                                        min="0"
                                                        onKeyDown={blockInvalidChar}
                                                        onChange={handleChange}
                                                        value={values.pieceCost !== undefined && values.pieceCost !== '' ? values.pieceCost : (singlePcs > 0 ? Number(((Number(values.purchasePrice) || 0) / singlePcs).toFixed(2)) : '')}
                                                        placeholder="Piece cost"
                                                        className="w-full rounded border border-teal-300 dark:border-teal-700 px-3 h-10 bg-teal-50/40 dark:bg-teal-950/20 text-xs text-right font-mono font-bold text-teal-800 dark:text-teal-300 outline-none focus:border-teal-600"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-gray-500">Purchase Price / Unit Cost (PKR) *</label>
                                            <input
                                                type="number"
                                                step="any"
                                                name="purchasePrice"
                                                min="0"
                                                onKeyDown={blockInvalidChar}
                                                onChange={handleChange}
                                                value={values.purchasePrice}
                                                className={`w-full rounded border px-3 h-10 bg-slate-50/50 dark:bg-meta-4/20 text-xs text-right font-mono font-bold text-black dark:text-white ${touched.purchasePrice && errors.purchasePrice ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                            />
                                        </div>
                                    );
                                })()}
                                {touched.purchasePrice && errors.purchasePrice && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.purchasePrice)}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-500">Opening Date *</label>
                                <input
                                    type="date"
                                    name="openingDate"
                                    onChange={handleChange}
                                    value={values.openingDate}
                                    className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-black dark:text-white ${touched.openingDate && errors.openingDate ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                />
                                {touched.openingDate && errors.openingDate && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.openingDate)}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-500">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    onChange={handleChange}
                                    value={values.expiryDate || ''}
                                    className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent text-xs text-black dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col md:flex-row justify-between items-center bg-gray-50 dark:bg-meta-4/20 p-4 rounded border border-stroke dark:border-strokedark">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Total Valuation Asset Amount (PKR):</span>
                            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                Rs. {calculatedAmount}
                            </span>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-stroke dark:border-strokedark">
                            <button
                                type="button"
                                onClick={() => navigate('/Inventory/OpeningStock/List')}
                                className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition shadow-sm text-xs cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-8 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                            >
                                {loading ? <Spinner color="border-white" size="w-4 h-4" /> : <span>Update Stock</span>}
                            </button>
                        </div>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default OpeningStockSingleForm;
