export interface StockReportFilter {
    bin?: string[];
    color?: string[];
    parentCategory?: string[];
    subCategory?: string[];
    subSubCategory?: string[];
    product?: string[];
    location?: string[] | string;
    employee?: string[];
    dateFrom?: string;
    dateTo?: string;
    asOfDate?: string;
    sortBy?: 'name_asc' | 'name_desc' | 'qty_asc' | 'qty_desc' | 'amount_asc' | 'amount_desc';
    viewMode?: 'summary' | 'detailed';
    showSalePrice?: boolean;
    showPurchasePrice?: boolean;
    showFinalPrice?: boolean;
    showSpecifications?: boolean;
}

export interface LocationBreakdownItem {
    location: string;
    qty: number;
}

export interface StockProductRow {
    id: string | number;
    product_name?: string;
    itemname?: string;
    name?: string;
    sku?: string;
    skuCode?: string;
    bin?: string;
    uom?: string;
    color?: string;
    sub_sub_category?: string;
    parent_category?: string;
    sub_category?: string;
    category?: string;
    leaf_category?: string;
    category_name?: string;
    current_stock?: number;
    stock?: number;
    retail_price?: number;
    sale_price?: number;
    purchase_price?: number;
    cost_price?: number;
    price?: number;
    unit_price?: number;
    buy_price?: number;
    cost?: number;
    mrp?: number;
    rp?: number;
    tp?: number;
    product_description?: string;
    specifications?: string;
    description?: string;
    hs_code?: string;
    warehouse_location?: string;
    location?: string;
    computed_opening?: number;
    period_stock_in?: number;
    period_stock_out?: number;
    net_activity?: number;
    computed_true_stock?: number;
    calculated_valuation?: number;
    locationBreakdown?: LocationBreakdownItem[];
    [key: string]: any;
}

export interface StockTransferRow {
    id: string | number;
    transfer_no?: string;
    transfer_date?: string;
    created_at?: string;
    from_location?: string;
    to_location?: string;
    employee?: string;
    created_by?: string;
    items?: any;
    total_quantity?: number;
    status?: string;
    [key: string]: any;
}

export interface CategoryHierarchyProduct extends StockProductRow {
    stock_qty: number;
    unit_rate: number;
    line_valuation: number;
    share_of_category: number;
}

export interface CategoryHierarchyLeaf {
    category_name: string;
    total_units: number;
    total_valuation: number;
    products: CategoryHierarchyProduct[];
}

export interface CategoryHierarchySub {
    sub_name: string;
    total_units: number;
    total_valuation: number;
    total_skus: number;
    categories: CategoryHierarchyLeaf[];
}

export interface CategoryHierarchyParent {
    parent_name: string;
    parent_id?: string;
    total_units: number;
    total_valuation: number;
    total_skus: number;
    sub_categories: CategoryHierarchySub[];
    grand_share_pct: number;
}

export interface CategorySummaryItem {
    parent_name: string;
    sub_name: string;
    category_name: string;
    products_count: number;
    total_units: number;
    total_valuation: number;
    contribution_pct: number;
}

export interface StatusGroupItem {
    key: string;
    title: string;
    subtitle: string;
    badgeText: string;
    badgeClass: string;
    containerBorder: string;
    headerBg: string;
    headerAccent: string;
    icon: any;
    items: any[];
    totalQty: number;
    totalValuation: number;
}
