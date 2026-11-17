export interface StandardItem {
  id: string;
  product_id?: string | number;
  product_name: string;
  sku_code?: string;
  category?: string;
  uom: string;
  unit: string;
  qty: number;
  bulk_qty: number;
  loose_qty: number;
  allow_loose_sales: boolean;
  loose_uom: string;
  loose_conversion_ratio: number;
  current_stock?: number;
  rate: number;
  discount_percent: number;
  discount_amount: number;
  amount: number;
  notes?: string;
  is_tile?: false;
}

export interface TileItem {
  id: string;
  product_id?: string | number;
  product_name: string;
  sku_code?: string;
  category?: string;
  sub_category?: string;
  box_qty: number;
  loose_pcs: number;
  total_sqm: number;
  sqm_per_box: number;
  pcs_per_box: number;
  rate_per_box: number;
  rate_per_sqm: number;
  rate_per_piece: number;
  discount_percent: number;
  discount_amount: number;
  amount: number;
  notes?: string;
  current_stock?: number;
  is_tile: true;
}
