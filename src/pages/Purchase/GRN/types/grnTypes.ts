export interface LocationItem {
  name: string;
  location_type?: string;
}

export interface VendorItem {
  vendor_name: string;
}

export interface ProductItem {
  id: string | number;
  product_name: string;
  uom?: string;
  item_sr_no?: string;
  category?: string;
  sub_category?: string;
  sub_sub_category?: string;
  scenario_name?: string;
  pieces_per_box?: number;
  pcs_per_box?: number;
  pieces_per_packing?: number;
  product_description?: string;
  current_stock?: number;
  purchase_price?: number;
}

export interface GRNStandardItem {
  id?: string | number;
  itemName: string;
  skuCode: string;
  qty: number;
  uom: string;
  warehouseName: string;
  accepted_qty?: number | null;
  rejected_qty?: number;
  hold_qty?: number;
  reject_reason?: string | null;
}

export interface GRNTileItem {
  id?: string | number;
  itemName: string;
  skuCode: string;
  warehouseName: string;
  boxQty: number;
  loosePcs: number;
  totalSqm: number;
  piecesPerBox: number;
  sqmPerBox: number;
  costPricePerBox?: number;
  costPricePerSqm?: number;
  costPricePerPiece?: number;
  totalAmount?: number;
  accepted_qty?: number | null;
  rejected_qty?: number;
  hold_qty?: number;
  reject_reason?: string | null;
}

export interface GRNFormValues {
  grnNo: string;
  vendorName: string;
  receiptDate: string;
  supplierGatePass?: string;
  gatePasses: Record<string, string>;
  status: string;
  remarks: string;
  showTileSection: boolean;
  tileItems: GRNTileItem[];
  items: GRNStandardItem[];
}
