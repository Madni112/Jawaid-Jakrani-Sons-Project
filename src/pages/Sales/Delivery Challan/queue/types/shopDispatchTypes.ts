export interface ChallanItem {
  skuCode?: string;
  pDescription?: string;
  itemName?: string;
  product_name?: string;
  item_name?: string;
  orderQty?: number;
  qty?: number;
  dispatchedQty?: number | string;
  holdQty?: number;
  rate?: number;
  disAmt?: number;
}

export interface DeliveryChallan {
  id: string | number;
  challan_no?: string;
  invoice_no?: string;
  customer_name?: string;
  challan_date?: string;
  dispatch_warehouse?: string;
  transport_name?: string;
  transportation?: string;
  freight_charges?: number | string;
  freight_payment_status?: string;
  vehicle_no?: string;
  driver_name?: string;
  remarks?: string;
  gate_remarks?: string;
  gate_pass_no?: string;
  total_quantity?: number;
  total_amount?: number;
  total_discount?: number;
  total_net_amount?: number;
  status?: string;
  is_printed?: boolean;
  shipping_address?: string;
  po_no?: string;
  created_at?: string;
  items?: ChallanItem[];
}

export interface TransportOption {
  id?: string | number;
  name: string;
  vehicle_number?: string;
  driver_name?: string;
  base_charges?: number | string;
  status?: string;
}

export interface ProductMasterItem {
  product_name?: string;
  pieces_per_box?: number | string;
  pcs_per_box?: number | string;
  pieces_per_packing?: number | string;
  category?: string;
  scenario_name?: string;
}

export interface InvoiceGroup {
  invoice_no: string;
  customer_name: string;
  dispatch_warehouse: string;
  challans: DeliveryChallan[];
  totalOrdered: number;
  totalDispatched: number;
  totalHold: number;
}
