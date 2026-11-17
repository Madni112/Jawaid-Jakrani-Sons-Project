export interface OpeningStockItemRow {
    itemCode: string;
    itemName: string;
    qty: number;
    purchasePrice: number;
    pieceCost: number | string;
    expiryDate: string;
    isTileItem: boolean;
    boxQty: number;
    loosePcs: number | string;
    piecesPerBox: number;
}

export interface OpeningStockMultiFormValues {
    location: string;
    openingDate: string;
    batchNumber: string;
    items: OpeningStockItemRow[];
}

export interface OpeningStockSingleFormValues {
    stockNo: string;
    skuCode: string;
    itemName: string;
    batchNumber: string;
    location: string;
    qty: number;
    purchasePrice: number;
    pieceCost: number | string;
    amount: number;
    openingDate: string;
    expiryDate: string;
    isTileItem: boolean;
    piecesPerBox: number;
    boxQty: number;
    loosePcs: number | string;
}

export interface ItemStockInfo {
    totalStock: number;
    boxes: number;
    loose: number;
    isTile: boolean;
    pcsPerBox: number;
    hasProduct: boolean;
    uom: string;
    looseUom: string;
}
