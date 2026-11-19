import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import ReportPagination from '../../../components/ReportPagination';
import { MdFileDownload, MdPrint, MdTableChart, MdViewList } from 'react-icons/md';

import {
    StockProductRow,
    StockReportFilter,
    StockTransferRow
} from './types/stockReportTypes';
import {
    buildCategoryTreeFromRows,
    buildCategorySummaryRows,
    buildStatusGroups,
    applyStockSort,
    formatLocation
} from './utils/stockReportTreeUtils';
import { exportStockReportToExcel } from './utils/stockReportExcelExport';
import { StockReportControls } from './components/StockReportControls';
import { StockReportHeaderBanner } from './components/StockReportHeaderBanner';
import { StockReportSignatures } from './components/StockReportSignatures';

import { StockActivityTable } from './perspectives/StockActivityTable';
import { StockBalanceTable } from './perspectives/StockBalanceTable';
import { StockStatusMultiLocationTable } from './perspectives/StockStatusMultiLocationTable';
import { StockTransferTable } from './perspectives/StockTransferTable';
import { StockDetailPriceTable } from './perspectives/StockDetailPriceTable';
import { StockCategorySummaryTable } from './perspectives/StockCategorySummaryTable';
import { StockHierarchyTreeTable } from './perspectives/StockHierarchyTreeTable';
import { LocationLedgerTable } from './perspectives/LocationLedgerTable';
import { extractProductColor } from '../../../utils/colorService';

export interface StockReportPrintProps {
    embedded?: boolean;
    tabOverride?: number;
    filtersOverride?: any;
}

const StockReportPrint: React.FC<StockReportPrintProps> = ({
    embedded,
    tabOverride,
    filtersOverride
}) => {
    const location = useLocation();
    const { businessName } = useAuth();
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const [reportRows, setReportRows] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(25);
    const [isPrinting, setIsPrinting] = useState(false);

    const config = useMemo(() => {
        if (tabOverride !== undefined && filtersOverride !== undefined) {
            return { tab: tabOverride, filters: filtersOverride };
        }
        return location.state || { tab: 1, filters: {} };
    }, [tabOverride, filtersOverride, location.state]);

    const activeTab = config.tab || 1;
    const filters: StockReportFilter = useMemo(() => config.filters || {}, [config.filters]);
    const filtersKey = useMemo(() => JSON.stringify({ tab: activeTab, filters }), [activeTab, filters]);
    const [activeViewMode, setActiveViewMode] = useState<'summary' | 'detailed'>(
        filters.viewMode === 'detailed' ? 'detailed' : 'summary'
    );
    const [activeStatusContainerTab] = useState<string>('out_of_stock');

    // ── 3-TIER CATEGORY HIERARCHY TREE ──
    const categoryHierarchyTree = useMemo(() => {
        return buildCategoryTreeFromRows(reportRows);
    }, [reportRows]);

    // ── SUMMARY VIEW: FLAT CATEGORY ROWS ──
    const categorySummaryRows = useMemo(() => {
        return buildCategorySummaryRows(reportRows);
    }, [reportRows]);

    const statusGroups = useMemo(() => {
        return buildStatusGroups(reportRows);
    }, [reportRows]);

    const activeDisplayRows = useMemo(() => {
        if (activeViewMode === 'detailed') {
            if (activeTab === 7) {
                return reportRows;
            }
            if (activeTab !== 4 && activeStatusContainerTab !== 'all') {
                const grp = statusGroups.find(g => g.key === activeStatusContainerTab);
                return grp ? grp.items : reportRows;
            }
        }
        return reportRows;
    }, [activeViewMode, activeTab, activeStatusContainerTab, statusGroups, reportRows]);

    const paginatedRows = useMemo(() => {
        if (isPrinting || pageSize === 'all') return activeDisplayRows;
        const limit = typeof pageSize === 'number' ? pageSize : 25;
        const start = (currentPage - 1) * limit;
        return activeDisplayRows.slice(start, start + limit);
    }, [activeDisplayRows, currentPage, pageSize, isPrinting]);

    const paginatedCategorySummaryRows = useMemo(() => {
        if (isPrinting || pageSize === 'all') return categorySummaryRows;
        const limit = typeof pageSize === 'number' ? pageSize : 25;
        const start = (currentPage - 1) * limit;
        return categorySummaryRows.slice(start, start + limit);
    }, [categorySummaryRows, currentPage, pageSize, isPrinting]);

    const paginatedCategoryTree = useMemo(() => {
        if (isPrinting || pageSize === 'all') return categoryHierarchyTree;
        return buildCategoryTreeFromRows(paginatedRows);
    }, [categoryHierarchyTree, paginatedRows, isPrinting, pageSize]);

    const startIndex = (currentPage - 1) * (pageSize === 'all' ? 0 : (pageSize as number));

    useEffect(() => {
        const compileTrueDynamicStockDataset = async () => {
            try {
                setLoading(true);

                // Handling Stock Transfer Statement (Tab 4) separately
                if (activeTab === 4) {
                    const transferQuery = supabase.from('stock_transfers').select('*').order('created_at', { ascending: false });
                    const { data: transfers, error: transferError } = await fetchAllPages(transferQuery);
                    if (transferError) throw transferError;

                    const dateFromClean = filters.dateFrom ? String(filters.dateFrom).trim() : '';
                    const dateToClean = filters.dateTo ? String(filters.dateTo).trim() : '';
                    const targetLocations = (Array.isArray(filters.location) ? filters.location : filters.location ? [filters.location] : []).map((l: string) => l.trim().toLowerCase());
                    const targetEmployees = (filters.employee || []).map((e: string) => e.trim().toLowerCase());
                    const targetProducts = (filters.product || []).map((p: string) => p.trim().toLowerCase());

                    const filteredTransfers = (transfers || []).filter((t: any) => {
                        const tDate = String(t.transfer_date || t.created_at || '').split('T')[0].split(' ')[0];
                        if (dateFromClean && tDate < dateFromClean) return false;
                        if (dateToClean && tDate > dateToClean) return false;

                        if (targetLocations.length > 0) {
                            const fromLoc = String(t.from_location || '').trim().toLowerCase();
                            const toLoc = String(t.to_location || '').trim().toLowerCase();
                            if (!targetLocations.includes(fromLoc) && !targetLocations.includes(toLoc)) return false;
                        }

                        if (targetEmployees.length > 0) {
                            const emp = String(t.employee || t.created_by || '').trim().toLowerCase();
                            if (!targetEmployees.some((te: string) => emp.includes(te))) return false;
                        }

                        if (targetProducts.length > 0) {
                            const itemsArray = Array.isArray(t.items) ? t.items : JSON.parse(t.items || '[]');
                            const hasProd = itemsArray.some((i: any) => {
                                const iName = String(i.itemName || i.product_name || i.item_name || '').trim().toLowerCase();
                                return targetProducts.some((tp: string) => iName.includes(tp));
                            });
                            if (!hasProd) return false;
                        }

                        return true;
                    });

                    setReportRows(filteredTransfers);
                    return;
                }

                // 1. Fetch base product list mapping
                let prodQuery = supabase.from('products').select('*');

                if (filters.bin && filters.bin.length > 0) prodQuery = prodQuery.in('bin', filters.bin);
                if (filters.parentCategory && filters.parentCategory.length > 0) {
                    const pList = filters.parentCategory.map((p: string) => `"${p}"`).join(',');
                    prodQuery = prodQuery.or(`sub_sub_category.in.(${pList}),category.in.(${pList})`);
                }
                if (filters.subCategory && filters.subCategory.length > 0) {
                    prodQuery = prodQuery.in('sub_category', filters.subCategory);
                }
                if (filters.subSubCategory && filters.subSubCategory.length > 0) {
                    const leafList = filters.subSubCategory.map((l: string) => `"${l}"`).join(',');
                    prodQuery = prodQuery.or(`category.in.(${leafList}),sub_sub_category.in.(${leafList})`);
                }

                const { data: baseProducts, error: prodError } = await fetchAllPages(prodQuery);
                if (prodError) throw prodError;

                // 2. Fetch raw tables for Tab 3 (Multi-location Breakdown) and Tab 8 (Location Ledger)
                let openStocks: any[] = [];
                let purchases: any[] = [];
                let sales: any[] = [];
                let pReturns: any[] = [];
                let sReturns: any[] = [];
                let dbLocsData: any[] = [];
                let transfersData: any[] = [];

                if (activeTab === 8 || activeTab === 3) {
                    const [os, p, s, pr, sr, dbLocsRes, transRes] = await Promise.all([
                        fetchAllPages(supabase.from('opening_stocks').select('*')),
                        fetchAllPages(supabase.from('supplier_purchases').select('*')),
                        fetchAllPages(supabase.from('sales_invoices').select('*')),
                        fetchAllPages(supabase.from('purchase_returns').select('*')),
                        fetchAllPages(supabase.from('sales_returns').select('*')),
                        supabase.from('inventory_locations').select('id, name, location_type'),
                        fetchAllPages(supabase.from('stock_transfers').select('*'))
                    ]);
                    openStocks = os.data || [];
                    purchases = p.data || [];
                    sales = s.data || [];
                    pReturns = pr.data || [];
                    sReturns = sr.data || [];
                    dbLocsData = dbLocsRes.data || [];
                    transfersData = transRes.data || [];
                }

                const registeredLocs = (dbLocsData && dbLocsData.length > 0)
                    ? dbLocsData.map(l => String(l.name).trim())
                    : ['Market', 'Latifabad', 'Main Warehouse'];

                const defaultSaleLoc = registeredLocs.find(l => {
                    const matched = dbLocsData.find(dbL => String(dbL.name).trim().toLowerCase() === l.toLowerCase());
                    return matched && String(matched.location_type || '').toLowerCase().includes('sale');
                }) || registeredLocs.find(l => l.toLowerCase().includes('shop') || l.toLowerCase().includes('market')) || registeredLocs[0] || 'SHOP';

                const computeProductLocations = (product: any) => {
                    const name = String(product.product_name || '').trim().toLowerCase();
                    const locationStockMap: { [loc: string]: number } = {};

                    const getNormalizedLocName = (rawLoc: string, isSale: boolean = false) => {
                        if (!rawLoc) return isSale ? defaultSaleLoc : (registeredLocs[0] || 'SHOP');
                        const clean = String(rawLoc).trim();
                        const matched = registeredLocs.find(l => l.toLowerCase() === clean.toLowerCase());
                        return matched || clean;
                    };

                    // 1. Opening Stock
                    (openStocks || []).forEach((os: any) => {
                        const osName = String(os.product_name || os.item_name || os.itemName || '').trim().toLowerCase();
                        if (osName === name || osName.includes(name)) {
                            const loc = getNormalizedLocName(os.location || os.target_warehouse || os.warehouse_name, false);
                            const qty = Number(os.quantity || os.qty || 0);
                            locationStockMap[loc] = (locationStockMap[loc] || 0) + qty;
                        }
                    });

                    // 2. Purchases (Stock In)
                    (purchases || []).forEach((p: any) => {
                        if (String(p.status).toLowerCase() !== 'cancel' && String(p.status).toLowerCase() !== 'deleted') {
                            const items = Array.isArray(p.items) ? p.items : JSON.parse(p.items || '[]');
                            items.forEach((i: any) => {
                                const iName = String(i.product_name || i.itemName || i.item_name || '').trim().toLowerCase();
                                if (iName === name || iName.includes(name)) {
                                    const loc = getNormalizedLocName(i.warehouse || i.location || p.target_warehouse || p.location, false);
                                    const qty = Number(i.qty || i.quantity || 0);
                                    locationStockMap[loc] = (locationStockMap[loc] || 0) + qty;
                                }
                            });
                        }
                    });

                    // 3. Sales Returns (Stock In)
                    (sReturns || []).forEach((sr: any) => {
                        const statusClean = String(sr.status || '').toLowerCase();
                        const inwardClean = String(sr.inward_status || '').toLowerCase();
                        if (statusClean === 'cancel' || statusClean === 'deleted' || inwardClean === 'rejected') return;

                        const isPending = inwardClean === 'pending inward' || inwardClean === 'pending';
                        const items = Array.isArray(sr.items) ? sr.items : JSON.parse(sr.items || '[]');
                        const receivedItems = Array.isArray(sr.received_items) ? sr.received_items : JSON.parse(sr.received_items || '[]');

                        items.forEach((i: any) => {
                            const iName = String(i.product_name || i.itemName || i.item_name || '').trim().toLowerCase();
                            if (iName === name || iName.includes(name)) {
                                const loc = getNormalizedLocName(i.warehouse || i.location || sr.warehouse_name || sr.dispatch_warehouse || sr.source_warehouse || sr.location, true);
                                let acceptedQty = 0;
                                if (isPending) {
                                    acceptedQty = 0;
                                } else if (inwardClean === 'partially received') {
                                    const rec = receivedItems.find((r: any) =>
                                        (r.skuCode && String(r.skuCode).trim().toLowerCase() === String(i.sku || i.skuCode || '').trim().toLowerCase()) ||
                                        (r.itemName && String(r.itemName).trim().toLowerCase() === String(i.itemName || i.product_name || '').trim().toLowerCase())
                                    );
                                    acceptedQty = rec ? Number(rec.acceptedQty || 0) : 0;
                                } else {
                                    acceptedQty = Number(i.qty || i.quantity || 0);
                                }
                                if (acceptedQty > 0) {
                                    locationStockMap[loc] = (locationStockMap[loc] || 0) + acceptedQty;
                                }
                            }
                        });
                    });

                    // 4. Stock Transfers (Movement between locations)
                    (transfersData || []).forEach((t: any) => {
                        if (String(t.status).toLowerCase() !== 'cancelled') {
                            const fromLoc = getNormalizedLocName(t.from_location, false);
                            const toLoc = getNormalizedLocName(t.to_location, false);
                            const items = Array.isArray(t.items) ? t.items : JSON.parse(t.items || '[]');
                            items.forEach((i: any) => {
                                const iName = String(i.product_name || i.itemName || i.item_name || '').trim().toLowerCase();
                                if (iName === name || iName.includes(name)) {
                                    const qty = Number(i.qty || i.quantity || 0);
                                    locationStockMap[fromLoc] = (locationStockMap[fromLoc] || 0) - qty;
                                    locationStockMap[toLoc] = (locationStockMap[toLoc] || 0) + qty;
                                }
                            });
                        }
                    });

                    // 5. Sales Invoices (Stock Out)
                    (sales || []).forEach((s: any) => {
                        const statusClean = String(s.sale_status || '').trim().toLowerCase();
                        if (statusClean !== 'cancel' && statusClean !== 'deleted') {
                            const items = Array.isArray(s.items) ? s.items : JSON.parse(s.items || '[]');
                            items.forEach((i: any) => {
                                const iName = String(i.product_name || i.itemName || i.item_name || '').trim().toLowerCase();
                                if (iName === name || iName.includes(name)) {
                                    const loc = getNormalizedLocName(i.warehouse || i.location || s.dispatch_warehouse || s.location, true);
                                    const qty = Number(i.qty || i.quantity || 0);
                                    locationStockMap[loc] = (locationStockMap[loc] || 0) - qty;
                                }
                            });
                        }
                    });

                    // 6. Purchase Returns (Stock Out)
                    (pReturns || []).forEach((pr: any) => {
                        if (String(pr.status).toLowerCase() !== 'cancel') {
                            const items = Array.isArray(pr.items) ? pr.items : JSON.parse(pr.items || '[]');
                            items.forEach((i: any) => {
                                const iName = String(i.product_name || i.itemName || i.item_name || '').trim().toLowerCase();
                                if (iName === name || iName.includes(name)) {
                                    const loc = getNormalizedLocName(i.warehouse || i.location || pr.source_warehouse || pr.location, false);
                                    const qty = Number(i.qty || i.quantity || 0);
                                    locationStockMap[loc] = (locationStockMap[loc] || 0) - qty;
                                }
                            });
                        }
                    });

                    return locationStockMap;
                };

                const asOfDateClean = (activeTab === 3 && filters.asOfDate) ? String(filters.asOfDate).trim() : '';
                const dateFromClean = filters.dateFrom ? String(filters.dateFrom).trim() : '';
                const dateToClean = asOfDateClean || (filters.dateTo ? String(filters.dateTo).trim() : '');

                const rpcLoc = (Array.isArray(filters.location) && filters.location.length > 0) ? filters.location[0] : (typeof filters.location === 'string' && filters.location ? filters.location : 'All');
                let stockData: any[] | null = null;
                try {
                    const { data: rpcData, error: stockError } = await supabase.rpc('calculate_dynamic_stock', {
                        p_location: String(rpcLoc),
                        p_start_date: dateFromClean || null,
                        p_end_date: dateToClean || null
                    });
                    if (!stockError && rpcData) {
                        stockData = rpcData;
                    }
                } catch (e) {
                    // Graceful client-side fallback if RPC is not present
                }

                const stockMap = new Map();
                (stockData || []).forEach((row: any) => {
                    stockMap.set(String(row.product_name).toLowerCase(), row);
                });

                const targetLocFilter = Array.isArray(filters.location) && filters.location.length > 0
                    ? filters.location.map((l: string) => l.trim().toLowerCase())
                    : (typeof filters.location === 'string' && filters.location && filters.location !== 'All' ? [filters.location.trim().toLowerCase()] : []);

                const calculatedAggregatedRows: StockProductRow[] = (baseProducts || []).map(product => {
                    const name = String(product.product_name || '').trim().toLowerCase();
                    const stock = stockMap.get(name);

                    let computedOpening = 0;
                    let netActivity = 0;
                    let trueRemainingStock = Number(product.current_stock || 0);

                    if (stock) {
                        computedOpening = Number(stock.opening_stock || 0) + Number(stock.prior_in || 0) - Number(stock.prior_out || 0);
                        netActivity = Number(stock.period_in || 0) - Number(stock.period_out || 0);
                        trueRemainingStock = computedOpening + netActivity;
                    } else {
                        const locMap = computeProductLocations(product);
                        const totalCalculated = Object.values(locMap).reduce((acc, q) => acc + q, 0);
                        trueRemainingStock = totalCalculated !== 0 ? totalCalculated : Number(product.current_stock || 0);
                        computedOpening = trueRemainingStock;
                    }

                    let locationBreakdown: Array<{ location: string; qty: number }> = [];
                    if (activeTab === 3) {
                        const locMap = computeProductLocations(product);
                        const mapLocs = Object.keys(locMap);
                        let candidateLocs = registeredLocs.slice();
                        if (candidateLocs.length === 0) candidateLocs = ['Market'];
                        mapLocs.forEach(ml => {
                            if (!candidateLocs.some(c => c.toLowerCase() === ml.toLowerCase())) {
                                candidateLocs.push(ml);
                            }
                        });

                        if (targetLocFilter.length > 0) {
                            candidateLocs = candidateLocs.filter(l => targetLocFilter.includes(l.toLowerCase()));
                            if (candidateLocs.length === 0 && Array.isArray(filters.location)) candidateLocs = filters.location;
                        }

                        locationBreakdown = candidateLocs.map(locName => ({
                            location: locName,
                            qty: locMap[locName] || 0
                        }));

                        if (mapLocs.length === 0 && locationBreakdown.length > 0) {
                            locationBreakdown[0].qty = trueRemainingStock;
                        }

                        trueRemainingStock = locationBreakdown.reduce((sum, b) => sum + b.qty, 0);
                    }

                    return {
                        ...product,
                        color: product.color || extractProductColor(product),
                        computed_opening: computedOpening,
                        period_stock_in: Number(stock.period_in),
                        period_stock_out: Number(stock.period_out),
                        net_activity: netActivity,
                        computed_true_stock: trueRemainingStock,
                        calculated_valuation: trueRemainingStock * Number(product.retail_price || product.sale_price || 0),
                        locationBreakdown
                    };
                });

                // Tab 8 specific: Per-location breakdown
                if (activeTab === 8) {
                    const locationRows: any[] = [];

                    for (const product of (baseProducts || [])) {
                        const rate = Number(product.retail_price || product.sale_price || product.price || 0);
                        const locationStockMap = computeProductLocations(product);

                        const activeLocations = Object.keys(locationStockMap);
                        if (activeLocations.length === 0) {
                            activeLocations.push(defaultSaleLoc || registeredLocs[0] || 'SHOP');
                            locationStockMap[activeLocations[0]] = Number(product.current_stock || product.stock || 0);
                        }

                        for (const locName of activeLocations) {
                            const qty = locationStockMap[locName] || 0;
                            if (targetLocFilter.length === 0 || targetLocFilter.includes(locName.toLowerCase())) {
                                locationRows.push({
                                    ...product,
                                    color: product.color || extractProductColor(product),
                                    id: `${product.id}_${locName}`,
                                    warehouse_location: locName,
                                    computed_true_stock: qty,
                                    calculated_valuation: qty * rate
                                });
                            }
                        }
                    }

                    let finalLocPool = locationRows;
                    if (filters.product && filters.product.length > 0) {
                        finalLocPool = finalLocPool.filter(p => filters.product?.includes(p.product_name));
                    }
                    if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                        const normColors = filters.color.map((c: string) => c.trim().toLowerCase());
                        finalLocPool = finalLocPool.filter(p => {
                            const c = String(p.color || '').trim().toLowerCase();
                            return Boolean(c && normColors.includes(c));
                        });
                    }
                    setReportRows(applyStockSort(finalLocPool, filters.sortBy));
                    setLoading(false);
                    return;
                }

                let finalFilteredPool = calculatedAggregatedRows;
                if (filters.product && filters.product.length > 0) {
                    finalFilteredPool = finalFilteredPool.filter(p => filters.product?.includes(p.product_name));
                }
                if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                    const normColors = filters.color.map((c: string) => c.trim().toLowerCase());
                    finalFilteredPool = finalFilteredPool.filter(p => {
                        const c = String(p.color || '').trim().toLowerCase();
                        return Boolean(c && normColors.includes(c));
                    });
                }

                setReportRows(applyStockSort(finalFilteredPool, filters.sortBy));
            } catch (err: any) {
                console.warn('Dynamic inventory matching trace warning:', err?.message);
            } finally {
                setLoading(false);
            }
        };

        compileTrueDynamicStockDataset();
    }, [filtersKey]);

    const formatLocationName = useCallback((rowLoc?: string) => {
        return formatLocation(rowLoc, filters.location);
    }, [filters.location]);

    const handleExportExcel = async () => {
        try {
            setExporting(true);
            await exportStockReportToExcel({
                activeTab,
                filters,
                activeViewMode,
                reportRows,
                categorySummaryRows,
                categoryHierarchyTree,
                businessName
            });
            toast.success('Excel workbook exported successfully!');
        } catch (err: any) {
            console.error(err);
            toast.error('Export failed: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 150);
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

    const totalPaginationCount = activeTab === 7 && activeViewMode === 'summary'
        ? categorySummaryRows.length
        : activeDisplayRows.length;

    return (
        <div className={`w-full bg-white dark:bg-boxdark text-black dark:text-white ${embedded ? 'p-0 min-h-0' : 'p-6 min-h-screen'} space-y-6 text-xs print:p-0 print:m-0 print:bg-white print:text-black print:min-h-0 print:h-auto`}>
            <style dangerouslySetInnerHTML={{
                __html: `
        /* Modern Classic Embedded Report View Styling */
        .classic-modern-report-container table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 1rem !important;
          overflow: hidden !important;
          background: white !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        }
        .dark .classic-modern-report-container table {
          border-color: #2e3a47 !important;
          background: #1e293b !important;
        }
        .classic-modern-report-container th {
          background-color: #f8fafc !important;
          color: #475569 !important;
          border-color: #e2e8f0 !important;
          border-top: none !important;
          padding: 10px 14px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.025em !important;
          text-transform: uppercase !important;
        }
        .dark .classic-modern-report-container th {
          background-color: #1e293b !important;
          color: #cbd5e1 !important;
          border-color: #2e3a47 !important;
        }
        .classic-modern-report-container td {
          border-color: #f1f5f9 !important;
          color: #1e293b !important;
          padding: 10px 14px !important;
          font-size: 11.5px !important;
          font-weight: 500 !important;
          transition: background-color 0.15s ease !important;
        }
        .dark .classic-modern-report-container td {
          border-color: #2e3a47 !important;
          color: #e2e8f0 !important;
        }
        .classic-modern-report-container tbody tr:hover td {
          background-color: #f1f5f9 !important;
        }
        .dark .classic-modern-report-container tbody tr:hover td {
          background-color: #334155 !important;
        }
        .classic-modern-report-container tfoot td {
          background-color: #f8fafc !important;
          font-weight: 800 !important;
          border-top: 2px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        .dark .classic-modern-report-container tfoot td {
          background-color: #1e293b !important;
          border-top-color: #475569 !important;
          color: #f8fafc !important;
        }

        @media print {
          @page { size: auto; margin: 12mm 10mm 12mm 10mm; }
          body, html { height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
          body * { visibility: hidden !important; }
          .print-root-container, .print-root-container * { visibility: visible !important; }
          .print-root-container { position: static !important; width: 100% !important; height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; padding: 0 !important; margin: 0 !important; }
          aside, header, nav, footer, .print-hidden-element, button { display: none !important; visibility: hidden !important; }
          table { page-break-inside: auto !important; }
          tr, td, th { page-break-inside: avoid !important; break-inside: avoid !important; }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
        }
      `}} />

            <div className={`print-root-container ${embedded ? 'classic-modern-report-container w-full bg-transparent p-0 space-y-5' : 'w-full bg-white p-4 space-y-6'} print:p-0 print:space-y-4`}>
                {/* On screen embedded mode: render clean modern toolbar */}
                {embedded && (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-boxdark p-3 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs print:hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      {activeTab === 7 && (
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-stroke dark:border-strokedark shadow-2xs mr-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveViewMode('summary');
                              setCurrentPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                              activeViewMode === 'summary' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                            }`}
                          >
                            <MdTableChart size={14} /> Summary View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveViewMode('detailed');
                              setCurrentPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                              activeViewMode === 'detailed' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                            }`}
                          >
                            <MdViewList size={14} /> Detailed View
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        id="stock-report-export-excel-btn"
                        type="button"
                        disabled={exporting}
                        onClick={handleExportExcel}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white py-1.5 px-3.5 rounded-xl font-bold text-xs cursor-pointer transition shadow-2xs border border-stroke dark:border-strokedark disabled:opacity-50"
                      >
                        <MdFileDownload size={15} /> {exporting ? 'Exporting...' : 'Export Excel'}
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 bg-primary text-white py-1.5 px-4 rounded-xl font-bold text-xs cursor-pointer hover:bg-opacity-90 transition shadow-2xs"
                      >
                        <MdPrint size={15} /> Print Report
                      </button>
                    </div>
                  </div>
                )}

                {/* Paper Print Header Banner (hidden on screen when embedded) */}
                <div className={embedded ? 'hidden print:block' : ''}>
                  <StockReportControls
                      activeTab={activeTab}
                      activeViewMode={activeViewMode}
                      onViewModeChange={(mode) => {
                          setActiveViewMode(mode);
                          setCurrentPage(1);
                      }}
                      exporting={exporting}
                      onExportExcel={handleExportExcel}
                      onPrint={handlePrint}
                  />

                  <StockReportHeaderBanner
                      businessName={businessName}
                      activeTab={activeTab}
                      filters={filters}
                  />
                </div>

                <ReportPagination
                    totalCount={totalPaginationCount}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                    }}
                />

                <div className="w-full overflow-x-auto">
                    {/* Tab 7: Category-Wise Stock Valuation Ledger (Detailed vs Summary) */}
                    {activeTab === 7 && activeViewMode === 'detailed' && (
                        <StockHierarchyTreeTable
                            paginatedCategoryTree={paginatedCategoryTree}
                            categoryHierarchyTree={categoryHierarchyTree}
                            reportRows={reportRows}
                            currentPage={currentPage}
                        />
                    )}

                    {activeTab === 7 && activeViewMode === 'summary' && (
                        <StockCategorySummaryTable
                            paginatedCategorySummaryRows={paginatedCategorySummaryRows}
                            categorySummaryRows={categorySummaryRows}
                            reportRows={reportRows}
                            startIndex={startIndex}
                            isPrinting={isPrinting}
                            pageSize={pageSize}
                        />
                    )}

                    {/* Tab 1: Stock Activity Report */}
                    {activeTab === 1 && (
                        <StockActivityTable
                            paginatedRows={paginatedRows}
                            reportRows={reportRows}
                            startIndex={startIndex}
                            isPrinting={isPrinting}
                            pageSize={pageSize}
                        />
                    )}

                    {/* Tabs 2 & 6: Stock Balance & Specs */}
                    {(activeTab === 2 || activeTab === 6) && (
                        <StockBalanceTable
                            paginatedRows={paginatedRows}
                            reportRows={reportRows}
                            startIndex={startIndex}
                            isPrinting={isPrinting}
                            pageSize={pageSize}
                        />
                    )}

                    {/* Tab 3: Stock Status (Multi-location Breakdown) */}
                    {activeTab === 3 && (
                        <StockStatusMultiLocationTable
                            paginatedRows={paginatedRows}
                            reportRows={reportRows}
                            startIndex={startIndex}
                            isPrinting={isPrinting}
                            pageSize={pageSize}
                            formatLocationName={formatLocationName}
                        />
                    )}

                    {/* Tab 4: Stock Transfer Statement */}
                    {activeTab === 4 && (
                        <StockTransferTable
                            paginatedRows={paginatedRows}
                            startIndex={startIndex}
                        />
                    )}

                    {/* Tab 5: Detailed Pricing Metrics */}
                    {activeTab === 5 && (
                        <StockDetailPriceTable
                            paginatedRows={paginatedRows}
                            reportRows={reportRows}
                            startIndex={startIndex}
                            isPrinting={isPrinting}
                            pageSize={pageSize}
                            filters={filters}
                        />
                    )}

                    {/* Tab 8: Per Location Stock Ledger */}
                    {activeTab === 8 && (
                        <LocationLedgerTable
                            paginatedRows={paginatedRows}
                            reportRows={reportRows}
                            startIndex={startIndex}
                            isPrinting={isPrinting}
                            pageSize={pageSize}
                            formatLocationName={formatLocationName}
                        />
                    )}

                    {reportRows.length === 0 && (
                        <div className="p-12 text-center border font-bold italic text-gray-400 bg-gray-50/50">
                            No true live ledger rows discovered matching chosen criteria tokens.
                        </div>
                    )}
                </div>

                <ReportPagination
                    totalCount={totalPaginationCount}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                    }}
                />

                <StockReportSignatures businessName={businessName} />
            </div>
        </div>
    );
};

export default StockReportPrint;
