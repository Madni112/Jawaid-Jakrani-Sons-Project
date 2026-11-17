export interface DeliveryChallanItem {
  skuCode?: string;
  pDescription?: string;
  itemName?: string;
  product_name?: string;
  orderQty?: number;
  qty?: number;
  dispatchedQty?: number | string;
  holdQty?: number;
  rate?: number;
  disAmt?: number;
  uom?: string;
  [key: string]: any;
}

export interface DeliveryChallanRecord {
  id: string | number;
  challan_no?: string;
  gate_pass_no?: string;
  invoice_no?: string;
  customer_name?: string;
  challan_date?: string;
  created_at?: string;
  dispatch_warehouse?: string;
  transport_name?: string;
  transportation?: string;
  freight_charges?: number | string;
  freight_payment_status?: string;
  vehicle_no?: string;
  driver_name?: string;
  remarks?: string;
  gate_remarks?: string;
  total_quantity?: number;
  total_amount?: number;
  total_discount?: number;
  total_net_amount?: number;
  status?: string;
  is_printed?: boolean;
  items?: DeliveryChallanItem[];
  metadata?: any;
  isPurchaseReturn?: boolean;
  return_no?: string;
  purchase_no?: string;
  vendor_name?: string;
  return_date?: string;
  source_warehouse?: string;
  warehouse_name?: string;
  payment_term?: string;
  [key: string]: any;
}

export interface GroupedInvoiceData {
  invoice_no: string;
  customer_name: string;
  dispatch_warehouse: string;
  challans: DeliveryChallanRecord[];
  totalOrdered: number;
  totalOrderBoxes: number;
  totalOrderPcs: number;
  totalDispatched: number;
  totalDispatchedBoxes: number;
  totalDispatchedPcs: number;
  totalHold: number;
  totalHoldBoxes: number;
  totalHoldPcs: number;
}
