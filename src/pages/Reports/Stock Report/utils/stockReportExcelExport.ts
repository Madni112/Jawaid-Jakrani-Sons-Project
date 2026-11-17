import { exportToExcel, ExcelColumn } from '../../../../utils/excelExport';
import { getBrandConfig } from '../../../../utils/brand';
import { CategoryHierarchyParent, CategorySummaryItem, StockProductRow, StockReportFilter } from '../types/stockReportTypes';

interface ExportOptions {
    activeTab: number;
    filters: StockReportFilter;
    activeViewMode: 'summary' | 'detailed';
    reportRows: StockProductRow[];
    categorySummaryRows: CategorySummaryItem[];
    categoryHierarchyTree: CategoryHierarchyParent[];
    businessName?: string;
}

export const exportStockReportToExcel = async ({
    activeTab,
    filters,
    activeViewMode,
    reportRows,
    categorySummaryRows,
    categoryHierarchyTree,
    businessName
}: ExportOptions) => {
    const tabTitles: Record<number, string> = {
        1: 'Stock Activity Report',
        2: 'Stock Balance Report',
        3: 'Stock Status Report',
        4: 'Stock Transfer Statement',
        5: 'Stock Detail With Price',
        6: 'Product Catalog Specs',
        7: 'Stock Status Detail',
        8: 'Per Location Stock Ledger'
    };

    const tabTitle = tabTitles[activeTab] || 'Stock Report';
    const filterMeta = {
        'Report Tab': tabTitle,
        'Brand': filters.bin && filters.bin.length > 0 ? filters.bin.join(', ') : 'All',
        'Category': [filters.parentCategory?.join(', '), filters.subCategory?.join(', '), filters.subSubCategory?.join(', ')].filter(c => c && c.length > 0).join(' / ') || 'All',
        'Product': filters.product && filters.product.length > 0 ? filters.product.join(', ') : 'All',
        'Location': Array.isArray(filters.location) && filters.location.length > 0 ? filters.location.join(', ') : (typeof filters.location === 'string' ? filters.location : 'All'),
        'Date Window': filters.dateFrom || filters.dateTo ? `${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}` : 'All Time'
    };

    let columns: ExcelColumn[] = [];
    let exportData: any[] = [];

    if (activeTab === 1) {
        columns = [
            { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
            { header: 'Product Item Name', key: 'product_name', width: 28 },
            { header: 'Brand / Category', key: 'category', width: 16 },
            { header: 'Opening Stock', key: 'computed_opening', width: 16, type: 'number' },
            { header: 'Stock In', key: 'period_stock_in', width: 14, type: 'number' },
            { header: 'Stock Out', key: 'period_stock_out', width: 14, type: 'number' },
            { header: 'Net Movement', key: 'net_activity', width: 16, type: 'number' },
            { header: 'Ending Stock', key: 'computed_true_stock', width: 16, type: 'number' },
            { header: 'Valuation (Rs.)', key: 'calculated_valuation', width: 20, type: 'currency' }
        ];
        exportData = reportRows.map((r, i) => ({ idx: i + 1, ...r }));
    } else if (activeTab === 4) {
        columns = [
            { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
            { header: 'Transfer Date', key: 'date', width: 16, type: 'date' },
            { header: 'Transfer ID', key: 'transfer_no', width: 16 },
            { header: 'Origin Warehouse', key: 'from_location', width: 20 },
            { header: 'Target Warehouse', key: 'to_location', width: 20 },
            { header: 'Handler Employee', key: 'employee', width: 18 },
            { header: 'Total Quantity', key: 'total_quantity', width: 16, type: 'number' }
        ];
        exportData = reportRows.map((r, i) => ({
            idx: i + 1,
            date: r.transfer_date || String(r.created_at || '').split('T')[0],
            transfer_no: r.transfer_no || `TR-${r.id}`,
            from_location: r.from_location,
            to_location: r.to_location,
            employee: r.employee || r.created_by || 'Officer',
            total_quantity: Number(r.total_quantity || 0)
        }));
    } else if (activeTab === 7) {
        if (activeViewMode === 'summary') {
            columns = [
                { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
                { header: 'Parent Category', key: 'parent_name', width: 22 },
                { header: 'Sub Category', key: 'sub_name', width: 22 },
                { header: 'Leaf Category Title', key: 'category_name', width: 24 },
                { header: 'Products', key: 'products_count', width: 14, type: 'number', alignment: 'center' },
                { header: 'Stock Units', key: 'total_units', width: 16, type: 'number', alignment: 'right' },
                { header: 'Asset Valuation (PKR)', key: 'total_valuation', width: 22, type: 'currency', alignment: 'right' },
                { header: 'Share %', key: 'contribution_pct', width: 14, type: 'percent', alignment: 'right' }
            ];
            exportData = categorySummaryRows.map((cat, idx) => ({
                idx: idx + 1,
                parent_name: cat.parent_name,
                sub_name: cat.sub_name,
                category_name: cat.category_name,
                products_count: cat.products_count,
                total_units: cat.total_units,
                total_valuation: cat.total_valuation,
                contribution_pct: (cat.contribution_pct || 0) / 100
            }));
        } else {
            columns = [
                { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
                { header: 'Product Item Name', key: 'product_name', width: 32 },
                { header: 'SKU / Code', key: 'sku', width: 16 },
                { header: 'Brand', key: 'brand', width: 16 },
                { header: 'UOM', key: 'uom', width: 10, alignment: 'center' },
                { header: 'Current Stock', key: 'current_stock', width: 14, type: 'number', alignment: 'right' },
                { header: 'Unit Rate (PKR)', key: 'price', width: 16, type: 'currency', alignment: 'right' },
                { header: 'Valuation (PKR)', key: 'valuation', width: 20, type: 'currency', alignment: 'right' }
            ];
            exportData = [];
            categoryHierarchyTree.forEach((pNode) => {
                exportData.push({
                    _isHeader: true,
                    _bannerText: `🏢 PARENT CATEGORY: ${pNode.parent_name.toUpperCase()}`
                });
                pNode.sub_categories.forEach((sNode) => {
                    exportData.push({
                        _isSubHeader: true,
                        _bannerText: `  📂 SUB-CATEGORY: ${sNode.sub_name.toUpperCase()}`
                    });
                    sNode.categories.forEach((lNode) => {
                        const leafProds = lNode.products || [];
                        const leafUnits = leafProds.reduce((sum: number, p: any) => sum + Number(p.computed_true_stock ?? p.current_stock ?? p.stock_qty ?? 0), 0);
                        const leafVal = leafProds.reduce((sum: number, p: any) => {
                            const stk = Number(p.computed_true_stock ?? p.current_stock ?? p.stock_qty ?? 0);
                            const prc = Number(p.retail_price || p.sale_price || p.price || 0);
                            return sum + (stk * prc);
                        }, 0);

                        exportData.push({
                            _isSectionHeader: true,
                            _bannerText: `    🏷️ ${lNode.category_name.toUpperCase()} (${leafProds.length} Products | ${leafUnits.toLocaleString()} Units | Rs. ${leafVal.toLocaleString(undefined, { minimumFractionDigits: 2 })})`
                        });

                        leafProds.forEach((p: any, pIdx: number) => {
                            const stk = Number(p.computed_true_stock ?? p.current_stock ?? p.stock_qty ?? 0);
                            const prc = Number(p.retail_price || p.sale_price || p.price || 0);
                            exportData.push({
                                idx: pIdx + 1,
                                product_name: p.product_name,
                                sku: p.sku || '-',
                                brand: p.bin || '-',
                                uom: p.uom || 'Pcs',
                                current_stock: stk,
                                price: prc,
                                valuation: stk * prc
                            });
                        });

                        exportData.push({
                            _isSubtotal: true,
                            idx: '',
                            product_name: `Subtotal (${lNode.category_name}):`,
                            sku: '',
                            brand: '',
                            uom: '',
                            current_stock: leafUnits,
                            price: 0,
                            valuation: leafVal
                        });
                    });
                });
            });
        }
    } else {
        columns = [
            { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
            { header: 'Product Item Name', key: 'product_name', width: 28 },
            { header: 'Brand / Category', key: 'category', width: 16 },
            { header: 'UOM', key: 'uom', width: 12 },
            { header: 'Current Stock', key: 'current_stock', width: 16, type: 'number' },
            { header: 'Unit Rate (Rs.)', key: 'price', width: 16, type: 'currency' },
            { header: 'Valuation (Rs.)', key: 'valuation', width: 20, type: 'currency' }
        ];
        exportData = reportRows.map((r, i) => {
            const stk = Number(r.computed_true_stock !== undefined ? r.computed_true_stock : r.current_stock || 0);
            const prc = Number(r.retail_price || r.sale_price || r.price || 0);
            return {
                idx: i + 1,
                product_name: r.product_name,
                category: `${r.bin || 'N/A'} / ${r.category || '-'}`,
                uom: r.uom || 'Pcs',
                current_stock: stk,
                price: prc,
                valuation: stk * prc
            };
        });
    }

    await exportToExcel({
        fileName: `Stock_Report_Tab${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: tabTitle.substring(0, 30),
        companyName: businessName || getBrandConfig().fullName,
        reportTitle: `Master Dynamic Inventory - ${tabTitle}`,
        filterSummary: filterMeta,
        columns,
        data: exportData,
        summaryRow: (activeTab === 7 && activeViewMode === 'detailed') ? false : true,
        theme: 'emerald'
    });
};
