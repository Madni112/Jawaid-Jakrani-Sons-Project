import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { fetchStockDataset, getTotalAvailableStock } from '../../../utils/stockCalculator';
import { useAuth } from '../../../Context/Auth';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

const todayStr = () => new Date().toISOString().split('T')[0];

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
    const isEditMode = !!editData;

    // Batch edit: list page sends every line sharing one Stock No
    const stockBatch = Array.isArray(location.state?.stockBatch) ? location.state.stockBatch : null;
    const isBatchEdit = !!stockBatch && stockBatch.length > 0;
    const batchStockNo = isBatchEdit ? String(stockBatch[0].stockNo || stockBatch[0].stock_no || '') : '';

    // Expiry column toggle (hidden by default unless batch already has expiry dates)
    const [showExpiryColumn, setShowExpiryColumn] = useState<boolean>(() => {
        if (isBatchEdit && stockBatch) {
            return stockBatch.some((r: any) => !!(r.expiryDate || r.expiry_date));
        }
        return false;
    });

    const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
        ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const { data: locData } = await supabase.from('inventory_locations').select('*');
                if (locData) setLocations(locData);

                let prodData: any[] | null = null;
                try {
                    const { data, error } = await fetchAllPages(supabase.from('products').select('id, product_name, purchase_price, retail_price, mrp, item_sr_no, uom, current_stock, category, sub_sub_category, product_description, pieces_per_box, pcs_per_box, pieces_per_packing, allow_loose_sales, loose_uom, loose_conversion_ratio, loose_sale_price, loose_purchase_price'));
                    if (error && (error.message?.includes('allow_loose_sales') || error.code === '42703')) {
                        const fallback = await fetchAllPages(supabase.from('products').select('id, product_name, purchase_price, retail_price, mrp, item_sr_no, uom, current_stock, category, sub_sub_category, product_description, pieces_per_box, pcs_per_box, pieces_per_packing'));
                        prodData = fallback.data;
                    } else {
                        prodData = data;
                    }
                } catch {
                    const fallback = await fetchAllPages(supabase.from('products').select('id, product_name, purchase_price, retail_price, mrp, item_sr_no, uom, current_stock, category, sub_sub_category, product_description, pieces_per_box, pcs_per_box, pieces_per_packing'));
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

    const generateUniqueStockNo = () => {
        const timestamp = Date.now().toString().slice(-6);
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        return `STK-${timestamp}-${randomCode}`;
    };

    // Keep the highlighted option in view while navigating with arrow keys
    const queueProductScroll = (next: number) => {
        setTimeout(() => {
            const box = productDropdownScrollRef.current;
            if (!box) return;
            const el = box.querySelector(`[data-opt="${next}"]`) as HTMLElement | null;
            if (el) el.scrollIntoView({ block: 'nearest' });
        }, 0);
    };


    const isTileProduct = (p: any) => {
        if (!p) return false;
        const cat = String(p.category || p.sub_sub_category || '').toLowerCase();
        const desc = String(p.product_description || '').toLowerCase();
        const name = String(p.product_name || p.itemName || '').toLowerCase();
        const uom = String(p.uom || '').toLowerCase();
        return cat.includes('tile') || desc.includes('[tile') || desc.includes('box:') || name.includes('tile') || uom === 'box';
    };

    const isLoosePackagingItem = (p: any) => {
        if (!p) return false;
        if (Boolean(p.allow_loose_sales)) return true;
        const ratio = Number(p.loose_conversion_ratio || 0);
        if (ratio > 1) return true;
        return isTileProduct(p);
    };

    const getProductPiecesPerBox = (p: any) => {
        if (!p) return 4;
        const looseRatio = Number(p.loose_conversion_ratio || 0);
        if (Boolean(p.allow_loose_sales) && looseRatio > 0) return looseRatio;
        const raw = Number(p.pieces_per_box ?? p.pcs_per_box ?? p.pieces_per_packing ?? 0);
        if (raw >= 1) return raw;
        if (looseRatio > 0) return looseRatio;
        const match = String(p.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
        if (match && Number(match[1]) > 0) return Number(match[1]);
        return 4;
    };

    const getProduct = (name?: string, code?: string) => {
        const nameToFind = String(name || '').trim().toLowerCase();
        const codeToFind = String(code || '').trim().toLowerCase();
        if (!nameToFind && !codeToFind) return null;
        return (products || []).find((p: any) =>
            (nameToFind && p.product_name && p.product_name.trim().toLowerCase() === nameToFind) ||
            (codeToFind && p.item_sr_no && p.item_sr_no.trim().toLowerCase() === codeToFind)
        ) || null;
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

    const getItemCurrentStock = (itemName: string) => {
        if (!itemName) return { totalStock: 0, boxes: 0, loose: 0, isTile: false, pcsPerBox: 4, hasProduct: false, uom: 'Boxes', looseUom: 'Pcs' };
        const p = products.find(prod => 
            prod.product_name?.toLowerCase().trim() === itemName.toLowerCase().trim()
        );
        if (!p) return { totalStock: 0, boxes: 0, loose: 0, isTile: false, pcsPerBox: 4, hasProduct: false, uom: 'Boxes', looseUom: 'Pcs' };

        const key = String(p.product_name || '').toLowerCase().trim();
        const totalStock = stockMap[key] !== undefined ? stockMap[key] : (Number(p.current_stock) || 0);

        const isTile = isLoosePackagingItem(p);
        const pcsPerBox = getProductPiecesPerBox(p);
        const mainUom = p.uom ? (p.uom.toUpperCase() === 'BOX' ? 'Boxes' : p.uom) : 'Boxes';
        const looseUom = p.loose_uom || 'Pcs';

        if (isTile) {
            const boxes = Math.floor(totalStock);
            let loose = Math.round((totalStock - boxes) * pcsPerBox);
            let finalBoxes = boxes;
            if (loose >= pcsPerBox) {
                finalBoxes += Math.floor(loose / pcsPerBox);
                loose = loose % pcsPerBox;
            }
            return {
                totalStock,
                boxes: finalBoxes,
                loose,
                isTile: true,
                pcsPerBox,
                hasProduct: true,
                uom: mainUom,
                looseUom
            };
        }

        return {
            totalStock,
            boxes: 0,
            loose: 0,
            isTile: false,
            pcsPerBox: 1,
            hasProduct: true,
            uom: p.uom || 'units',
            looseUom: 'Pcs'
        };
    };

    const emptyItemRow = () => ({
        itemCode: '',
        itemName: '',
        qty: 1,
        purchasePrice: 0,
        pieceCost: '',
        expiryDate: '',
        isTileItem: false,
        boxQty: 1,
        loosePcs: 0,
        piecesPerBox: 4
    });

    const fmtMoney = (val: number) =>
        val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // ------------------------------------------------------------
    // MULTI-ROW (Add mode): shared Location + Opening Date header,
    // then one product line per opening stock record.
    // ------------------------------------------------------------
    const multiInitialValues = {
        location: '',
        openingDate: todayStr(),
        batchNumber: '',
        items: [emptyItemRow()]
    };

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

    // Add (positive) or remove (negative) stock on products.current_stock for a product name
    const updateProductStock = async (nameKey: string, delta: number) => {
        if (!nameKey || delta === 0) return;
        const { data: prod } = await supabase
            .from('products')
            .select('id, current_stock')
            .ilike('product_name', nameKey)
            .maybeSingle();

        if (prod) {
            const next = Math.max(0, (Number(prod.current_stock) || 0) + delta);
            await supabase.from('products').update({ current_stock: next }).eq('id', prod.id);
        }
    };

    // Guard: throw a friendly error message when any product repeats across rows
    const assertNoDuplicateRows = (rows: any[]): string | null => {
        const seen: Record<string, number> = {};
        for (let i = 0; i < rows.length; i++) {
            const key = String(rows[i].itemName || '').trim().toLowerCase();
            if (seen[key] !== undefined) {
                return `Cannot save — "${rows[i].itemName}" is added in both row ${seen[key] + 1} and row ${i + 1}. Please remove the duplicate line.`;
            }
            seen[key] = i;
        }
        return null;
    };

    const buildPayloads = (rows: any[], stockNoValue: string, header: any) =>
        rows.map((r: any) => {
            const unitCost = Number(r.purchasePrice) || 0;
            const pObj = getProduct(r.itemName, r.itemCode);
            const isPack = Boolean(r.isTileItem || isLoosePackagingItem(pObj));
            const pcsPerBox = r.piecesPerBox || getProductPiecesPerBox(pObj);
            const pcCost = r.pieceCost !== undefined && r.pieceCost !== ''
                ? Number(r.pieceCost)
                : (pcsPerBox > 0 ? unitCost / pcsPerBox : 0);

            const bQty = Number(r.boxQty || 0);
            const lPcs = Number(r.loosePcs || 0);
            const quantity = isPack ? Number((bQty + (pcsPerBox > 0 ? lPcs / pcsPerBox : 0)).toFixed(3)) : (Number(r.qty) || 0);
            const totalValuation = isPack
                ? (bQty * unitCost) + (lPcs * pcCost)
                : quantity * unitCost;

            const exp = r.expiryDate ? r.expiryDate : null;
            return {
                stock_no: stockNoValue,
                stockno: stockNoValue,
                item_code: r.itemCode || '',
                skucode: r.itemCode || '',
                product_name: r.itemName,
                itemname: r.itemName,
                batch_number: header.batchNumber || '',
                batchnumber: header.batchNumber || '',
                location: header.location,
                qty: quantity,
                quantity: quantity,
                purchase_price: unitCost,
                rate: unitCost,
                amount: totalValuation,
                total_amount: totalValuation,
                opening_date: header.openingDate,
                openingdate: header.openingDate,
                expiry_date: exp,
                expirydate: exp
            };
        });

    // Aggregate per-product quantity across rows for current_stock updates
    const aggregateByProduct = (rows: any[]): Record<string, number> => {
        const map: Record<string, number> = {};
        rows.forEach((r: any) => {
            const key = String(r.itemName || '').trim().toLowerCase();
            if (key) map[key] = (map[key] || 0) + (Number(r.qty) || 0);
        });
        return map;
    };

    const handleMultiSubmit = async (values: any) => {
        setLoading(true);
        try {
            const rows = (values.items || []).filter((r: any) => r.itemName);
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
            const payloads = buildPayloads(rows, sharedStockNo, values);

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
    const getBatchInitialValues = () => {
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
    const handleBatchSubmit = async (values: any) => {
        setLoading(true);
        try {
            const rows = (values.items || []).filter((r: any) => r.itemName);
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
            const payloads = buildPayloads(rows, batchStockNo, values);
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

    const renderMultiForm = ({ initialValues, onSubmit, submitPrefix }: any) => (
        <Formik
            initialValues={initialValues}
            enableReinitialize={true}
            validationSchema={multiValidationSchema}
            onSubmit={onSubmit}
        >
            {({ values, setFieldValue, handleChange, errors, touched }) => {
                const totalQty = (values.items || []).reduce((sum: number, r: any) => sum + (Number(r.qty) || 0), 0);
                const totalValuation = (values.items || []).reduce((sum: number, r: any) => {
                    const pObj = getProduct(r.itemName, r.itemCode);
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
                    <Form className="p-6.5 space-y-6">
                        {/* Shared batch header */}
                        <div className="rounded-xl border border-stroke dark:border-strokedark bg-slate-50/60 dark:bg-meta-4/20 p-4">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                Batch Details (applies to every row below)
                            </p>
                            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
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
                                    <label className="mb-2 block text-xs font-semibold text-gray-500">Opening Date *</label>
                                    <input type="date" name="openingDate" onChange={handleChange} value={values.openingDate} className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-black dark:text-white ${touched.openingDate && errors.openingDate ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
                                    {touched.openingDate && errors.openingDate && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.openingDate)}</p>}
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-gray-500">Batch No *</label>
                                    <input name="batchNumber" onChange={handleChange} value={values.batchNumber} placeholder="e.g., BN-001" className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-black dark:text-white outline-none focus:border-primary ${touched.batchNumber && errors.batchNumber ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
                                    {touched.batchNumber && errors.batchNumber && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.batchNumber)}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Line items */}
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
                                                {values.items.map((item: any, index: number) => {
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
                                                    const productInputRed = Boolean(lineError?.itemName) || isDuplicateRow;

                                                    return (
                                                        <tr key={index} className="border-b border-stroke dark:border-strokedark align-top">
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
                                                                                    applyProduct(filtered[highlightedProductIndex] || filtered[0], index);
                                                                                }
                                                                            } else if (e.key === 'Tab' || e.key === 'Escape') {
                                                                                setOpenProductRow(null);
                                                                            }
                                                                        }}
                                                                        onChange={(e) => {
                                                                            const typed = e.target.value;
                                                                            const updated = [...values.items];
                                                                            updated[index] = { ...updated[index], itemName: typed };
                                                                            setFieldValue('items', updated);
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
                                                                                        applyProduct(p, index);
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
                                                                    const stockInfo = getItemCurrentStock(item.itemName);
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
                                                                    const pObj = getProduct(item.itemName, item.itemCode);
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
                                                                    const pObj = getProduct(item.itemName, item.itemCode);
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
                                                                    onClick={() => {
                                                                        if (values.items.length > 1) {
                                                                            remove(index);
                                                                        } else {
                                                                            toast.error('At least one product line is required.');
                                                                        }
                                                                    }}
                                                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg p-1.5 transition cursor-pointer"
                                                                    title="Remove line"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </td>
                                                        </tr>
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

                        {typeof errors.items === 'string' && (
                            <p className="text-red-500 text-xs font-semibold">{String(errors.items)}</p>
                        )}

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
                                {loading ? <Spinner color="border-white" size="w-4 h-4" /> : `${submitPrefix || 'Save'} ${values.items.length || 1} Opening Stock Item${(values.items?.length || 1) > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </Form>
                );
            }}
        </Formik>
    );

    // ------------------------------------------------------------
    // SINGLE-RECORD (Edit mode): unchanged legacy form
    // ------------------------------------------------------------
    const getSingleInitialValues = () => {
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

    const singleValidationSchema = Yup.object().shape({
        itemName: Yup.string().required('Required'),
        batchNumber: Yup.string().required('Required'),
        location: Yup.string().required('Required'),
        qty: Yup.number().min(0.001, 'Min 0.001').required('Required'),
        purchasePrice: Yup.number().min(0, 'Min 0').required('Required'),
        openingDate: Yup.string().required('Required'),
        expiryDate: Yup.string().nullable(),
    });

    const renderSingleForm = () => (
        <Formik
            initialValues={getSingleInitialValues()}
            enableReinitialize={true}
            validationSchema={singleValidationSchema}
            onSubmit={async (values) => {
                setLoading(true);
                try {
                    const unitCost = Number(values.purchasePrice) || 0;
                    const pObj = getProduct(values.itemName, values.skuCode);
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

                    const exp = values.expiryDate === "" ? null : values.expiryDate;
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
            }}
        >
            {({ handleChange, setFieldValue, values, errors, touched }) => {
                const singlePObj = getProduct(values.itemName, values.skuCode);
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
                                <input name="stockNo" readOnly value={values.stockNo} className="w-full rounded border border-stroke bg-gray-50 dark:bg-meta-4/10 px-3 h-10 text-xs font-bold outline-none text-black dark:text-white" />
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
                                <input name="batchNumber" onChange={handleChange} value={values.batchNumber} placeholder="e.g., BN-001" className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-black dark:text-white ${touched.batchNumber && errors.batchNumber ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
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
                                    const singleStockInfo = getItemCurrentStock(values.itemName);
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
                                            <input type="number" step="any" name="qty" min="0.001" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.qty} className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-right font-bold text-black dark:text-white ${touched.qty && errors.qty ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
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
                                    const singlePObj = getProduct(values.itemName, values.skuCode);
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
                                            <input type="number" step="any" name="purchasePrice" min="0" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.purchasePrice} className={`w-full rounded border px-3 h-10 bg-slate-50/50 dark:bg-meta-4/20 text-xs text-right font-mono font-bold text-black dark:text-white ${touched.purchasePrice && errors.purchasePrice ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
                                        </div>
                                    );
                                })()}
                                {touched.purchasePrice && errors.purchasePrice && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.purchasePrice)}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-500">Opening Date *</label>
                                <input type="date" name="openingDate" onChange={handleChange} value={values.openingDate} className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-black dark:text-white ${touched.openingDate && errors.openingDate ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
                                {touched.openingDate && errors.openingDate && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.openingDate)}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-500">Expiry Date (Optional)</label>
                                <input type="date" name="expiryDate" onChange={handleChange} value={values.expiryDate || ''} className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent text-xs text-black dark:text-white" />
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

    const renderActiveForm = () => {
        if (isBatchEdit) {
            return renderMultiForm({
                initialValues: getBatchInitialValues(),
                onSubmit: handleBatchSubmit,
                submitPrefix: `Update`
            });
        }
        if (isEditMode) {
            return renderSingleForm();
        }
        return renderMultiForm({
            initialValues: multiInitialValues,
            onSubmit: handleMultiSubmit,
            submitPrefix: 'Save'
        });
    };

    return (
        <div className="mx-auto max-w-270 text-black dark:text-bodydark text-xs">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
                    <h3 className="font-medium text-black dark:text-white text-base">
                        {isBatchEdit ? `Modify Opening Stock Batch: ${batchStockNo}` : (isEditMode ? `Modify Stock: ${editData.stockNo}` : 'Initialize Opening Stock (Multi-Item)')}
                    </h3>
                    <span onClick={() => navigate('/Inventory/OpeningStock/List')} className="text-sm text-primary font-medium hover:underline cursor-pointer">
                        {isBatchEdit || isEditMode ? '← Back to List' : '👁 See List'}
                    </span>
                </div>

                {renderActiveForm()}
            </div>
        </div>
    );
};

export default AddOpeningStock;

// HMR Touch: 1794395060114