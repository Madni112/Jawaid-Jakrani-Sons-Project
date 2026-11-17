import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { fetchStockDataset, getTotalAvailableStock } from '../../../utils/stockCalculator';
import { useAuth } from '../../../Context/Auth';
import { toast } from 'react-hot-toast';
import { OpeningStockMultiFormValues } from './types/openingStockTypes';
import {
    todayStr,
    generateUniqueStockNo,
    isLoosePackagingItem,
    getProductPiecesPerBox,
    emptyItemRow,
    assertNoDuplicateRows,
    buildPayloads,
    aggregateByProduct,
    updateProductStock
} from './utils/openingStockHelpers';
import OpeningStockHeaderCard from './components/OpeningStockHeaderCard';
import OpeningStockMultiForm from './components/OpeningStockMultiForm';
import OpeningStockSingleForm from './components/OpeningStockSingleForm';

const multiValidationSchema = Yup.object().shape({
    location: Yup.string().required('Warehouse is required'),
    openingDate: Yup.string().required('Required'),
    batchNumber: Yup.string().required('Required'),
    items: Yup.array().of(
        Yup.object().shape({
            itemName: Yup.string().required('Select a product'),
            qty: Yup.number().typeError('Number only').min(0.001, 'Min 0.001').required('Required'),
            purchasePrice: Yup.number().typeError('Number only').min(0, 'Min 0').required('Required'),
            expiryDate: Yup.string().nullable()
        })
    ).min(1, 'Add at least one product row')
});

const AddOpeningStock = () => {
    const { userName, userEmail } = useAuth();
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [showSkuDropdown, setShowSkuDropdown] = useState(false);
    const [highlightedSkuIndex, setHighlightedSkuIndex] = useState<number>(0);
    const skuDropdownRef = useRef<HTMLDivElement>(null);
    const productDropdownScrollRef = useRef<HTMLDivElement>(null);
    const productInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Multi-row product picker state
    const [openProductRow, setOpenProductRow] = useState<number | null>(null);
    const [highlightedProductIndex, setHighlightedProductIndex] = useState<number>(0);

    const [stockDataset, setStockDataset] = useState<any>(null);
    const [stockMap, setStockMap] = useState<Record<string, number>>({});

    const location = useLocation();
    const navigate = useNavigate();

    const editData = location.state?.stock;
    const isEditMode = Boolean(editData);

    // Batch edit: list page sends every line sharing one Stock No
    const stockBatch = Array.isArray(location.state?.stockBatch) ? location.state.stockBatch : null;
    const isBatchEdit = Boolean(stockBatch && stockBatch.length > 0);
    const batchStockNo = isBatchEdit && stockBatch ? String(stockBatch[0].stockNo || stockBatch[0].stock_no || '') : '';

    // Expiry column toggle (hidden by default unless batch already has expiry dates)
    const [showExpiryColumn, setShowExpiryColumn] = useState<boolean>(() => {
        if (isBatchEdit && stockBatch) {
            return stockBatch.some((r: any) => Boolean(r.expiryDate || r.expiry_date));
        }
        return false;
    });

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const { data: locData } = await supabase.from('inventory_locations').select('*');
                if (locData) setLocations(locData);

                let prodData: any[] | null = null;
                try {
                    const { data, error } = await fetchAllPages(
                        supabase.from('products').select('id, product_name, purchase_price, retail_price, mrp, item_sr_no, uom, current_stock, category, sub_sub_category, product_description, pieces_per_box, pcs_per_box, pieces_per_packing, allow_loose_sales, loose_uom, loose_conversion_ratio, loose_sale_price, loose_purchase_price')
                    );
                    if (error && (error.message?.includes('allow_loose_sales') || error.code === '42703')) {
                        const fallback = await fetchAllPages(
                            supabase.from('products').select('id, product_name, purchase_price, retail_price, mrp, item_sr_no, uom, current_stock, category, sub_sub_category, product_description, pieces_per_box, pcs_per_box, pieces_per_packing')
                        );
                        prodData = fallback.data;
                    } else {
                        prodData = data;
                    }
                } catch {
                    const fallback = await fetchAllPages(
                        supabase.from('products').select('id, product_name, purchase_price, retail_price, mrp, item_sr_no, uom, current_stock, category, sub_sub_category, product_description, pieces_per_box, pcs_per_box, pieces_per_packing')
                    );
                    prodData = fallback.data;
                }
                if (prodData) setProducts(prodData);

                // Fetch stock dataset for accurate live calculation
                fetchStockDataset().then(ds => {
                    if (ds) setStockDataset(ds);
                }).catch(() => {});
            } catch (err: any) {
                console.error('Metadata fetch error:', err.message);
            }
        };
        fetchMetadata();

        // Close SKU dropdown when clicking outside (used by edit-mode single form)
        const handleClickOutside = (event: MouseEvent) => {
            if (skuDropdownRef.current && !skuDropdownRef.current.contains(event.target as Node)) {
                setShowSkuDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keep the highlighted option in view while navigating with arrow keys
    const queueProductScroll = (next: number) => {
        setTimeout(() => {
            const box = productDropdownScrollRef.current;
            if (!box) return;
            const el = box.querySelector(`[data-opt="${next}"]`) as HTMLElement | null;
            if (el) el.scrollIntoView({ block: 'nearest' });
        }, 0);
    };

    // Calculate live overall stock map for products
    useEffect(() => {
        let isCancelled = false;
        const calculateStock = async () => {
            if (!products || products.length === 0) return;
            const map: Record<string, number> = {};
            if (stockDataset) {
                if (stockDataset.balancesMode && Array.isArray(stockDataset.balances)) {
                    stockDataset.balances.forEach((r: any) => {
                        const name = String(r.product_name || '').toLowerCase().trim();
                        map[name] = (map[name] || 0) + (Number(r.quantity) || 0);
                    });
                } else {
                    for (const p of products) {
                        const name = (p.product_name || '').toLowerCase().trim();
                        try {
                            const val = await getTotalAvailableStock(p.product_name, stockDataset);
                            map[name] = val;
                        } catch {
                            map[name] = Number(p.current_stock || 0);
                        }
                    }
                }
            }
            products.forEach(p => {
                const name = (p.product_name || '').toLowerCase().trim();
                if (map[name] === undefined) {
                    map[name] = Number(p.current_stock || 0);
                }
            });
            if (!isCancelled) {
                setStockMap(map);
            }
        };
        calculateStock();
        return () => { isCancelled = true; };
    }, [stockDataset, products]);

    const multiInitialValues: OpeningStockMultiFormValues = {
        location: '',
        openingDate: todayStr(),
        batchNumber: '',
        items: [emptyItemRow()]
    };

    const handleMultiSubmit = async (values: OpeningStockMultiFormValues) => {
        setLoading(true);
        try {
            const rows = (values.items || []).filter((r) => r.itemName);
            if (rows.length === 0) {
                toast.error('Add at least one product row.');
                return;
            }

            const dupError = assertNoDuplicateRows(rows);
            if (dupError) {
                toast.error(dupError);
                return;
            }

            const sharedStockNo = generateUniqueStockNo();
            const payloads = buildPayloads(rows, sharedStockNo, values, products);

            const { error: stockError } = await supabase.from('opening_stocks').insert(payloads);
            if (stockError) throw stockError;

            // Increase products.current_stock once per distinct product (aggregated qty)
            for (const [nameKey, totalQty] of Object.entries(aggregateByProduct(rows))) {
                await updateProductStock(nameKey, totalQty);
            }

            // Record in audit_logs
            try {
                const totalUnits = rows.reduce((sum: number, r: any) => sum + (Number(r.qty) || 0), 0);
                await supabase.from('audit_logs').insert({
                    action_type: 'INSERT',
                    table_name: 'opening_stocks',
                    performed_by: userName || userEmail || 'Warehouse Manager',
                    details: {
                        stock_no: sharedStockNo,
                        batch_number: values.batchNumber || '001',
                        location: values.location,
                        opening_date: values.openingDate,
                        items_count: rows.length,
                        total_quantity: totalUnits,
                        products: rows.slice(0, 10).map((r: any) => `${r.itemName} (${r.qty} Units)`),
                    },
                });
            } catch (auditErr) {
                console.warn('Opening stock audit log note:', auditErr);
            }

            toast.success(`Opening stock initialized for ${rows.length} item(s) under ${sharedStockNo}!`);
            navigate('/Inventory/OpeningStock/List');
        } catch (err: any) {
            toast.error('Operation Failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Prefill for editing an existing batch (all lines share one Stock No)
    const getBatchInitialValues = (): OpeningStockMultiFormValues => {
        const first = stockBatch[0];
        return {
            location: first.location || '',
            openingDate: first.openingDate || first.opening_date || first.openingdate || todayStr(),
            batchNumber: first.batchNumber || first.batch_number || first.batchnumber || '',
            items: stockBatch.map((r: any) => {
                const nameToFind = String(r.itemName || r.product_name || r.itemname || '').trim().toLowerCase();
                const codeToFind = String(r.skuCode || r.item_code || r.itemCode || r.skucode || '').trim().toLowerCase();
                const pMatch = products.find((p: any) =>
                    (p.product_name && p.product_name.trim().toLowerCase() === nameToFind) ||
                    (p.item_sr_no && p.item_sr_no.trim().toLowerCase() === codeToFind)
                );
                const isTile = isLoosePackagingItem(pMatch || r);
                const pcsPerBox = getProductPiecesPerBox(pMatch || r);
                const totalQty = Number(r.qty ?? r.quantity) || 1;
                const bQty = Math.floor(totalQty);
                const lPcs = Math.round((totalQty - bQty) * pcsPerBox);

                const unitCost = Number(r.purchase_price ?? r.rate ?? r.rp ?? r.purchasePrice) || 0;
                let pieceCost: any = '';
                if (isTile && pcsPerBox > 0) {
                    if (Number(pMatch?.loose_purchase_price) > 0) {
                        pieceCost = Number(pMatch.loose_purchase_price);
                    } else if (unitCost > 0) {
                        pieceCost = Number((unitCost / pcsPerBox).toFixed(2));
                    }
                }

                return {
                    itemCode: r.skuCode || r.item_code || r.itemCode || r.skucode || '',
                    itemName: r.itemName || r.product_name || r.itemname || '',
                    qty: totalQty,
                    purchasePrice: unitCost,
                    pieceCost: pieceCost,
                    expiryDate: r.expiryDate || r.expiry_date || r.expirydate || '',
                    isTileItem: isTile,
                    piecesPerBox: pcsPerBox,
                    boxQty: bQty,
                    loosePcs: lPcs
                };
            })
        };
    };

    // Edit an existing batch: revert old stock, delete old lines, re-insert with same Stock No
    const handleBatchSubmit = async (values: OpeningStockMultiFormValues) => {
        setLoading(true);
        try {
            const rows = (values.items || []).filter((r) => r.itemName);
            if (rows.length === 0) {
                toast.error('Add at least one product row.');
                return;
            }

            const dupError = assertNoDuplicateRows(rows);
            if (dupError) {
                toast.error(dupError);
                return;
            }

            // 1. Revert stock added by the old batch
            for (const [nameKey, qty] of Object.entries(aggregateByProduct(stockBatch))) {
                await updateProductStock(nameKey, -qty);
            }

            // 2. Remove old lines
            const oldIds = stockBatch.map((r: any) => r.id).filter(Boolean);
            if (oldIds.length > 0) {
                const { error: delError } = await supabase.from('opening_stocks').delete().in('id', oldIds);
                if (delError) throw delError;
            }

            // 3. Insert updated lines under the same Stock No
            const payloads = buildPayloads(rows, batchStockNo, values, products);
            const { error: insError } = await supabase.from('opening_stocks').insert(payloads);
            if (insError) throw insError;

            // 4. Re-apply stock for the new lines
            for (const [nameKey, qty] of Object.entries(aggregateByProduct(rows))) {
                await updateProductStock(nameKey, qty);
            }

            // Record batch update in audit_logs
            try {
                const totalUnits = rows.reduce((sum: number, r: any) => sum + (Number(r.qty) || 0), 0);
                await supabase.from('audit_logs').insert({
                    action_type: 'UPDATE',
                    table_name: 'opening_stocks',
                    performed_by: userName || userEmail || 'Warehouse Manager',
                    details: {
                        stock_no: batchStockNo,
                        batch_number: values.batchNumber || '001',
                        location: values.location,
                        opening_date: values.openingDate,
                        items_count: rows.length,
                        total_quantity: totalUnits,
                        products: rows.slice(0, 10).map((r: any) => `${r.itemName} (${r.qty} Units)`),
                    },
                });
            } catch (auditErr) {
                console.warn('Opening stock batch update audit log note:', auditErr);
            }

            toast.success(`Opening stock batch ${batchStockNo} updated (${rows.length} item(s))!`);
            navigate('/Inventory/OpeningStock/List');
        } catch (err: any) {
            toast.error('Operation Failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderActiveForm = () => {
        if (isBatchEdit) {
            return (
                <OpeningStockMultiForm
                    initialValues={getBatchInitialValues()}
                    validationSchema={multiValidationSchema}
                    onSubmit={handleBatchSubmit}
                    submitPrefix="Update"
                    loading={loading}
                    locations={locations}
                    products={products}
                    stockMap={stockMap}
                    showExpiryColumn={showExpiryColumn}
                    setShowExpiryColumn={setShowExpiryColumn}
                    openProductRow={openProductRow}
                    setOpenProductRow={setOpenProductRow}
                    highlightedProductIndex={highlightedProductIndex}
                    setHighlightedProductIndex={setHighlightedProductIndex}
                    productInputRefs={productInputRefs}
                    productDropdownScrollRef={productDropdownScrollRef}
                    navigate={navigate}
                    queueProductScroll={queueProductScroll}
                />
            );
        }
        if (isEditMode) {
            return (
                <OpeningStockSingleForm
                    editData={editData}
                    products={products}
                    locations={locations}
                    stockMap={stockMap}
                    loading={loading}
                    setLoading={setLoading}
                    navigate={navigate}
                    showSkuDropdown={showSkuDropdown}
                    setShowSkuDropdown={setShowSkuDropdown}
                    highlightedSkuIndex={highlightedSkuIndex}
                    setHighlightedSkuIndex={setHighlightedSkuIndex}
                    skuDropdownRef={skuDropdownRef}
                />
            );
        }
        return (
            <OpeningStockMultiForm
                initialValues={multiInitialValues}
                validationSchema={multiValidationSchema}
                onSubmit={handleMultiSubmit}
                submitPrefix="Save"
                loading={loading}
                locations={locations}
                products={products}
                stockMap={stockMap}
                showExpiryColumn={showExpiryColumn}
                setShowExpiryColumn={setShowExpiryColumn}
                openProductRow={openProductRow}
                setOpenProductRow={setOpenProductRow}
                highlightedProductIndex={highlightedProductIndex}
                setHighlightedProductIndex={setHighlightedProductIndex}
                productInputRefs={productInputRefs}
                productDropdownScrollRef={productDropdownScrollRef}
                navigate={navigate}
                queueProductScroll={queueProductScroll}
            />
        );
    };

    return (
        <div className="mx-auto max-w-270 text-black dark:text-bodydark text-xs">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <OpeningStockHeaderCard
                    isBatchEdit={isBatchEdit}
                    isEditMode={isEditMode}
                    batchStockNo={batchStockNo}
                    editStockNo={editData?.stockNo || editData?.stock_no}
                    onNavigateList={() => navigate('/Inventory/OpeningStock/List')}
                />
                {renderActiveForm()}
            </div>
        </div>
    );
};

export default AddOpeningStock;
