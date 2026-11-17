import {
    CategoryHierarchyParent,
    CategorySummaryItem,
    StatusGroupItem,
    StockProductRow
} from '../types/stockReportTypes';
import { MdErrorOutline, MdWarning, MdCheckCircle } from 'react-icons/md';

export const buildCategoryTreeFromRows = (rows: StockProductRow[]): CategoryHierarchyParent[] => {
    const parentMap: {
        [pKey: string]: {
            parent_name: string;
            total_units: number;
            total_valuation: number;
            total_skus: number;
            sub_categories_map: {
                [sKey: string]: {
                    sub_name: string;
                    total_units: number;
                    total_valuation: number;
                    total_skus: number;
                    categories_map: {
                        [lKey: string]: {
                            category_name: string;
                            total_units: number;
                            total_valuation: number;
                            products: any[];
                        }
                    }
                }
            }
        }
    } = {};

    let totalVal = 0;
    rows.forEach((row: any) => {
        const rawPName = String(row.sub_sub_category || row.parent_category || row.category || 'General Products').trim() || 'General Products';
        const rawSName = String(row.sub_category || 'General').trim() || 'General';
        const rawLName = String(row.category || rawPName || 'General').trim() || 'General';

        const pKey = rawPName.toUpperCase();
        const sKey = rawSName.toUpperCase();
        const lKey = rawLName.toUpperCase();

        const qty = Number(row.computed_true_stock !== undefined ? row.computed_true_stock : row.current_stock || 0);
        const rate = Number(row.retail_price || row.sale_price || row.purchase_price || row.price || 0);
        const val = Number(row.calculated_valuation !== undefined ? row.calculated_valuation : (qty * rate));
        totalVal += val;

        if (!parentMap[pKey]) {
            parentMap[pKey] = {
                parent_name: pKey,
                total_units: 0,
                total_valuation: 0,
                total_skus: 0,
                sub_categories_map: {}
            };
        }
        const pNode = parentMap[pKey];
        pNode.total_units += qty;
        pNode.total_valuation += val;
        pNode.total_skus += 1;

        if (!pNode.sub_categories_map[sKey]) {
            pNode.sub_categories_map[sKey] = {
                sub_name: sKey,
                total_units: 0,
                total_valuation: 0,
                total_skus: 0,
                categories_map: {}
            };
        }
        const sNode = pNode.sub_categories_map[sKey];
        sNode.total_units += qty;
        sNode.total_valuation += val;
        sNode.total_skus += 1;

        if (!sNode.categories_map[lKey]) {
            sNode.categories_map[lKey] = {
                category_name: lKey,
                total_units: 0,
                total_valuation: 0,
                products: []
            };
        }
        const lNode = sNode.categories_map[lKey];
        lNode.total_units += qty;
        lNode.total_valuation += val;
        lNode.products.push({
            ...row,
            stock_qty: qty,
            unit_rate: rate,
            line_valuation: val
        });
    });

    return Object.values(parentMap).sort((a, b) => a.parent_name.localeCompare(b.parent_name)).map((pNode) => {
        const subCategories = Object.values(pNode.sub_categories_map).sort((a, b) => a.sub_name.localeCompare(b.sub_name)).map((sNode) => {
            const leafCategories = Object.values(sNode.categories_map).sort((a, b) => a.category_name.localeCompare(b.category_name)).map((lNode) => {
                return {
                    ...lNode,
                    products: lNode.products.map(prod => ({
                        ...prod,
                        share_of_category: lNode.total_valuation > 0 ? (prod.line_valuation / lNode.total_valuation) * 100 : 0
                    }))
                };
            });
            return {
                ...sNode,
                categories: leafCategories
            };
        });
        return {
            ...pNode,
            sub_categories: subCategories,
            grand_share_pct: totalVal > 0 ? (pNode.total_valuation / totalVal) * 100 : 0
        };
    });
};

export const buildCategorySummaryRows = (rows: StockProductRow[]): CategorySummaryItem[] => {
    const summaryMap: {
        [key: string]: {
            parent_name: string;
            sub_name: string;
            category_name: string;
            products_count: number;
            total_units: number;
            total_valuation: number;
            contribution_pct: number;
        }
    } = {};

    let grandValuation = 0;
    rows.forEach((row: any) => {
        const rawPName = String(row.sub_sub_category || row.parent_category || row.category || 'General Products').trim() || 'General Products';
        const rawSName = String(row.sub_category || 'General').trim() || 'General';
        const rawLName = String(row.category || rawPName || 'General').trim() || 'General';

        const pName = rawPName.toUpperCase();
        const sName = rawSName.toUpperCase();
        const lName = rawLName.toUpperCase();

        const qty = Number(row.computed_true_stock !== undefined ? row.computed_true_stock : row.current_stock || 0);
        const rate = Number(row.retail_price || row.sale_price || row.purchase_price || row.price || 0);
        const val = Number(row.calculated_valuation !== undefined ? row.calculated_valuation : (qty * rate));
        grandValuation += val;

        const key = `${pName}___${sName}___${lName}`;
        if (!summaryMap[key]) {
            summaryMap[key] = {
                parent_name: pName,
                sub_name: sName,
                category_name: lName,
                products_count: 0,
                total_units: 0,
                total_valuation: 0,
                contribution_pct: 0
            };
        }
        const item = summaryMap[key];
        item.products_count += 1;
        item.total_units += qty;
        item.total_valuation += val;
    });

    return Object.values(summaryMap).sort((a, b) =>
        a.parent_name.localeCompare(b.parent_name) ||
        a.sub_name.localeCompare(b.sub_name) ||
        a.category_name.localeCompare(b.category_name)
    ).map(item => ({
        ...item,
        contribution_pct: grandValuation > 0 ? (item.total_valuation / grandValuation) * 100 : 0
    }));
};

export const buildStatusGroups = (rows: StockProductRow[]): StatusGroupItem[] => {
    const outOfStock: any[] = [];
    const lowStock: any[] = [];
    const inStock: any[] = [];

    rows.forEach((row: any) => {
        const qty = Number(row.computed_true_stock !== undefined ? row.computed_true_stock : row.current_stock || 0);
        if (qty <= 0) {
            outOfStock.push(row);
        } else if (qty <= 10) {
            lowStock.push(row);
        } else {
            inStock.push(row);
        }
    });

    const calcValuation = (list: any[]) => list.reduce((sum, r) => {
        const q = Number(r.computed_true_stock !== undefined ? r.computed_true_stock : r.current_stock || 0);
        const rate = Number(r.retail_price || r.sale_price || r.purchase_price || r.price || 0);
        return sum + Number(r.calculated_valuation !== undefined ? r.calculated_valuation : (q * rate));
    }, 0);

    const calcQty = (list: any[]) => list.reduce((sum, r) => {
        return sum + Number(r.computed_true_stock !== undefined ? r.computed_true_stock : r.current_stock || 0);
    }, 0);

    return [
        {
            key: 'out_of_stock',
            title: 'Out of Stock (Depleted Inventory)',
            subtitle: 'Immediate Procurement Required • 0 or Negative Physical Stock Balance',
            badgeText: 'OUT OF STOCK',
            badgeClass: 'bg-red-100 text-red-800 border-red-300',
            containerBorder: 'border-red-400',
            headerBg: 'bg-red-50 text-red-950 border-red-200',
            headerAccent: 'text-red-700',
            icon: MdErrorOutline,
            items: outOfStock,
            totalQty: calcQty(outOfStock),
            totalValuation: calcValuation(outOfStock)
        },
        {
            key: 'low_stock',
            title: 'Low Stock Alert (Approaching Depletion)',
            subtitle: 'Critical Buffer Zone (1 to 10 Units Remaining) • Reorder Recommended',
            badgeText: 'LOW STOCK ALERT',
            badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
            containerBorder: 'border-amber-400',
            headerBg: 'bg-amber-50 text-amber-950 border-amber-200',
            headerAccent: 'text-amber-700',
            icon: MdWarning,
            items: lowStock,
            totalQty: calcQty(lowStock),
            totalValuation: calcValuation(lowStock)
        },
        {
            key: 'in_stock',
            title: 'In Stock (Healthy Inventory Balances)',
            subtitle: 'Sufficient Available Stock (> 10 Units on Hand) • Ready for Active Sales',
            badgeText: 'HEALTHY / IN STOCK',
            badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            containerBorder: 'border-emerald-400',
            headerBg: 'bg-emerald-50 text-emerald-950 border-emerald-200',
            headerAccent: 'text-emerald-700',
            icon: MdCheckCircle,
            items: inStock,
            totalQty: calcQty(inStock),
            totalValuation: calcValuation(inStock)
        }
    ];
};

export const applyStockSort = (list: any[], sortBy: string = 'name_asc') => {
    return [...list].sort((a: any, b: any) => {
        if (sortBy === 'name_asc' || sortBy === 'name_desc') {
            const isDesc = sortBy === 'name_desc';
            // 1. Parent Category (A to Z)
            const pA = String(a.sub_sub_category || a.parent_category || '').trim();
            const pB = String(b.sub_sub_category || b.parent_category || '').trim();
            const compP = pA.localeCompare(pB, undefined, { numeric: true, sensitivity: 'base' });
            if (compP !== 0) return isDesc ? -compP : compP;

            // 2. Sub Category (A to Z)
            const sA = String(a.sub_category || '').trim();
            const sB = String(b.sub_category || '').trim();
            const compS = sA.localeCompare(sB, undefined, { numeric: true, sensitivity: 'base' });
            if (compS !== 0) return isDesc ? -compS : compS;

            // 3. Leaf Category (A to Z)
            const lA = String(a.category || a.leaf_category || a.category_name || '').trim();
            const lB = String(b.category || b.leaf_category || b.category_name || '').trim();
            const compL = lA.localeCompare(lB, undefined, { numeric: true, sensitivity: 'base' });
            if (compL !== 0) return isDesc ? -compL : compL;

            // 4. Product Stock Asset Identifier (Product Name A to Z)
            const nA = String(a.product_name || a.itemname || a.name || '').trim();
            const nB = String(b.product_name || b.itemname || b.name || '').trim();
            const compN = nA.localeCompare(nB, undefined, { numeric: true, sensitivity: 'base' });
            if (compN !== 0) return isDesc ? -compN : compN;

            // Tie-breaker by warehouse location if present
            const locA = String(a.warehouse_location || a.location || '').trim();
            const locB = String(b.warehouse_location || b.location || '').trim();
            return locA.localeCompare(locB, undefined, { numeric: true, sensitivity: 'base' });
        }
        if (sortBy === 'qty_desc') {
            const qA = Number(a.computed_true_stock ?? a.current_stock ?? a.stock ?? 0);
            const qB = Number(b.computed_true_stock ?? b.current_stock ?? b.stock ?? 0);
            return qB - qA;
        }
        if (sortBy === 'qty_asc') {
            const qA = Number(a.computed_true_stock ?? a.current_stock ?? a.stock ?? 0);
            const qB = Number(b.computed_true_stock ?? b.current_stock ?? b.stock ?? 0);
            return qA - qB;
        }
        if (sortBy === 'amount_desc') {
            const vA = Number(a.calculated_valuation ?? ((a.computed_true_stock ?? a.current_stock ?? 0) * (a.cost_price ?? a.retail_price ?? 0)));
            const vB = Number(b.calculated_valuation ?? ((b.computed_true_stock ?? b.current_stock ?? 0) * (b.cost_price ?? b.retail_price ?? 0)));
            return vB - vA;
        }
        if (sortBy === 'amount_asc') {
            const vA = Number(a.calculated_valuation ?? ((a.computed_true_stock ?? a.current_stock ?? 0) * (a.cost_price ?? a.retail_price ?? 0)));
            const vB = Number(b.calculated_valuation ?? ((b.computed_true_stock ?? b.current_stock ?? 0) * (b.cost_price ?? b.retail_price ?? 0)));
            return vA - vB;
        }
        return (a.product_name || '').localeCompare(b.product_name || '');
    });
};

export const formatLocation = (rowLocation?: string, filtersLocation?: string[] | string): string => {
    if (rowLocation && String(rowLocation).trim() !== '') return rowLocation;
    if (Array.isArray(filtersLocation)) {
        if (filtersLocation.length > 0) return filtersLocation.join(', ');
        return 'All Locations';
    }
    if (filtersLocation && typeof filtersLocation === 'string' && filtersLocation.trim() !== '' && filtersLocation !== 'All') {
        return filtersLocation;
    }
    return 'All Locations';
};
