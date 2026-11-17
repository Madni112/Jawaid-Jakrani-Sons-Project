import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { PosOrder } from '../../../../service/posService';

export const exportPOSOrdersToExcel = (orders: PosOrder[]) => {
  const data = orders.map((o) => ({
    'Ticket #': o.order_number,
    'Sold Date': new Date(o.created_at).toLocaleString(),
    'Refunded Date': o.refunded_at ? new Date(o.refunded_at).toLocaleString() : 'N/A',
    'Refund Reason': o.refund_reason || 'N/A',
    'Customer': o.customer_name,
    'Cashier': o.cashier_name,
    'Terminal': o.terminal_code,
    'Payment Tender': o.payment_method,
    'Subtotal': o.subtotal,
    'Discount': o.discount_amount,
    'Tax': o.tax_amount,
    'Grand Total': o.total_amount,
    'Cash Tendered': o.cash_tendered,
    'Change Due': o.change_due,
    'Status': o.status,
    'Total Items': o.items.length
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'POS_Receipts');
  const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `POS_Sales_Receipts_${Date.now()}.xlsx`);
  toast.success('POS orders exported to Excel');
};
