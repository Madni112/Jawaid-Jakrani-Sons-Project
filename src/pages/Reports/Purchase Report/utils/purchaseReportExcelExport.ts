import { toast } from 'react-hot-toast';
import { exportToExcel, ExcelColumn } from '../../../../utils/excelExport';
import { getBrandConfig } from '../../../../utils/brand';
import {
  parseItems,
  formatItemLineQty,
  getConsignmentQtyBreakdown,
  getRowDiscounts,
  getVendorDetails
} from './purchaseReportHelpers';

export interface ExportPurchaseExcelOptions {
  rType: string;
  filters: any;
  reportRows: any[];
  businessName?: string;
  productLookupMap: Record<string, any>;
  vendorLookupMap: Record<string, any>;
}

export const exportPurchaseReportToExcel = async ({
  rType,
  filters = {},
  reportRows = [],
  businessName,
  productLookupMap,
  vendorLookupMap
}: ExportPurchaseExcelOptions) => {
  try {
    const filterMeta = {
      'Report Type': String(rType).toUpperCase(),
      'Supplier / Vendor': filters.supplier?.length > 0 ? (Array.isArray(filters.supplier) ? filters.supplier.join(', ') : filters.supplier) : 'All',
      'Warehouse': filters.location?.length > 0 ? (Array.isArray(filters.location) ? filters.location.join(', ') : filters.location) : 'All',
      'Date Window': filters.dateFrom || filters.dateTo ? `${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}` : 'All Time'
    };

    let columns: ExcelColumn[] = [];
    let exportData: any[] = [];
    let filename = `Purchase_Report_${rType}_${new Date().toISOString().split('T')[0]}`;

    if (rType === 'category-purchases') {
      filename = `Category_Purchases_Report_${new Date().toISOString().split('T')[0]}`;
      columns = [
        { header: 'S#', key: 'idx', width: 8, alignment: { horizontal: 'center' } },
        { header: 'Parent Category', key: 'parentCategory', width: 25 },
        { header: 'Sub-Category', key: 'subCategory', width: 25 },
        { header: 'Leaf Category', key: 'leafCategory', width: 28 },
        { header: 'SKU Count', key: 'skuCount', width: 14, alignment: { horizontal: 'center' } },
        { header: 'Inward Units', key: 'grossUnits', width: 16, numFmt: '#,##0', alignment: { horizontal: 'right' } },
        { header: 'Returned Units', key: 'returnedUnits', width: 16, numFmt: '#,##0', alignment: { horizontal: 'right' } },
        { header: 'Net Units', key: 'netUnits', width: 16, numFmt: '#,##0', alignment: { horizontal: 'right' } },
        { header: 'Gross Purchases (PKR)', key: 'grossSpend', width: 24, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
        { header: 'Returns (PKR)', key: 'returnedAmount', width: 20, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
        { header: 'Net Expenditure (PKR)', key: 'netExpenditure', width: 24, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
        { header: 'Spend Share %', key: 'sharePct', width: 16, numFmt: '0.00"%"', alignment: { horizontal: 'right' } }
      ];

      exportData = reportRows.map((r, idx) => ({
        idx: idx + 1,
        parentCategory: r.parent_name,
        subCategory: r.sub_name,
        leafCategory: r.category_name,
        skuCount: r.products_count,
        grossUnits: r.gross_units,
        returnedUnits: r.returned_units,
        netUnits: r.net_units,
        grossSpend: r.gross_purchases,
        returnedAmount: r.returned_amount,
        netExpenditure: r.net_expenditure,
        sharePct: r.contribution_pct
      }));
    } else if (rType === 'product-purchase-history') {
      filename = `Product_Purchase_History_${new Date().toISOString().split('T')[0]}`;
      columns = [
        { header: 'S#', key: 'idx', width: 8, alignment: { horizontal: 'center' } },
        { header: 'Product Name', key: 'productName', width: 35 },
        { header: 'SKU', key: 'sku', width: 18 },
        { header: 'Brand', key: 'brand', width: 18 },
        { header: 'Parent Category', key: 'parentCategory', width: 22 },
        { header: 'Sub Category', key: 'subCategory', width: 22 },
        { header: 'Leaf Category', key: 'category', width: 22 },
        { header: 'UOM', key: 'uom', width: 12, alignment: { horizontal: 'center' } },
        { header: 'Total Purchased Qty', key: 'totalQty', width: 20, numFmt: '#,##0', alignment: { horizontal: 'right' } },
        { header: 'Min Rate (PKR)', key: 'minRate', width: 18, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
        { header: 'Max Rate (PKR)', key: 'maxRate', width: 18, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
        { header: 'Avg Rate (PKR)', key: 'avgRate', width: 18, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
        { header: 'Total Spend (PKR)', key: 'totalSpend', width: 24, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
        { header: 'Last Supplier', key: 'lastSupplier', width: 28 },
        { header: 'Last Purchase Date', key: 'lastDate', width: 18, alignment: { horizontal: 'center' } }
      ];

      exportData = reportRows.map((r, idx) => ({
        idx: idx + 1,
        productName: r.product_name,
        sku: r.sku,
        brand: r.brand,
        parentCategory: r.parent_category,
        subCategory: r.sub_category,
        category: r.category,
        uom: r.uom,
        totalQty: r.total_purchased_qty,
        minRate: r.min_unit_rate,
        maxRate: r.max_unit_rate,
        avgRate: r.avg_unit_rate,
        totalSpend: r.total_procurement_cost,
        lastSupplier: r.transactions?.[0]?.supplier_name || '-',
        lastDate: r.latest_purchase_date
      }));
    } else if (rType === 'purchase-invoice-detail') {
      filename = `Purchase_Detail_${new Date().toISOString().split('T')[0]}`;
      columns = [
        { header: 'Purchase No', key: 'invoiceNo', width: 20 },
        { header: 'Supplier Name', key: 'supplierName', width: 30 },
        { header: 'Date', key: 'date', width: 16, alignment: { horizontal: 'center' } },
        { header: 'Warehouse', key: 'warehouse', width: 20 },
        { header: 'Item Name', key: 'itemName', width: 32 },
        { header: 'Brand', key: 'brand', width: 18 },
        { header: 'UOM', key: 'uom', width: 12, alignment: { horizontal: 'center' } },
        { header: 'Qty', key: 'qty', width: 14, numFmt: '#,##0', alignment: { horizontal: 'right' } },
        { header: 'Unit Cost (PKR)', key: 'rate', width: 18, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
        { header: 'Line Total (PKR)', key: 'lineTotal', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } }
      ];

      const flatItems: any[] = [];
      reportRows.forEach(inv => {
        (inv.line_items || []).forEach((it: any) => {
          flatItems.push({
            invoiceNo: inv.purchase_no,
            supplierName: inv.supplier_name,
            date: inv.purchase_date,
            warehouse: inv.warehouse,
            itemName: it.product_name,
            brand: it.brand,
            uom: it.uom,
            qty: it.qty,
            rate: it.rate,
            lineTotal: it.total_amount
          });
        });
      });
      exportData = flatItems;
    } else {
      columns = [
        { header: 'S#', key: 'idx', width: 8, alignment: { horizontal: 'center' } },
        { header: 'Processing Date', key: 'processingDate', width: 16, alignment: { horizontal: 'center' } },
        { header: rType === 'return' ? 'Return No' : 'Purchase No', key: 'docRef', width: 20 },
        { header: 'Supplier Name', key: 'vendorName', width: 28 },
        { header: 'Supplier Code', key: 'vendorCode', width: 16, alignment: { horizontal: 'center' } },
        { header: 'Page #', key: 'pageNo', width: 12, alignment: { horizontal: 'center' } },
        { header: 'Purchased Line Items / Products', key: 'productDetails', width: 50 },
        { header: 'Total Consignment Qty', key: 'totalQty', width: 22, alignment: { horizontal: 'center' } },
        { header: 'Discount (PKR)', key: 'discount', width: 18, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
        { header: 'Payment Term', key: 'status', width: 18, alignment: { horizontal: 'center' } },
        { header: rType === 'return' ? 'Debit Amount (PKR)' : 'Net Amount (PKR)', key: 'totalAmount', width: 24, numFmt: '#,##0.00', alignment: { horizontal: 'right' } }
      ];

      exportData = reportRows.map((row, idx) => {
        const items = parseItems(row.items || row.returned_items);
        const totalQtyStr = getConsignmentQtyBreakdown(items, productLookupMap).join(', ');
        const supplierTitle = row.supplier_name || row.vendor_name || 'Generic Wholesaler';
        const matchedVendor = getVendorDetails(supplierTitle, vendorLookupMap);
        const vendorCode = row.vendor_code || row.supplier_code || matchedVendor?.vendor_code || matchedVendor?.vendorCode || '-';
        const pageNo = row.page_no || row.pageNo || matchedVendor?.page_no || matchedVendor?.pageNo || '-';
        const rowDiscounts = getRowDiscounts(row, items);

        const productDetails = items.map((it: any) => {
          const pName = (it.itemName || it.product_name || it.name || 'Item').trim();
          const qStr = formatItemLineQty(pName, Number(it.qty || it.quantity || 1), productLookupMap, it.uom);
          const r = Number(it.purchase_price ?? it.cost_price ?? it.rate ?? 0);
          const wh = it.warehouse || it.target_warehouse;
          return `${pName}${wh ? ` [${wh}]` : ''} (${qStr}${r > 0 ? ` @ Rs. ${r}` : ''})`;
        }).join('; ');

        return {
          idx: idx + 1,
          docRef: row.purchase_no || row.return_no || `PUR-${String(row.id).padStart(4, '0')}`,
          processingDate: row.purchase_date || row.return_date || String(row.created_at || '').split('T')[0],
          vendorName: supplierTitle,
          vendorCode,
          pageNo,
          productDetails: productDetails || 'No line items recorded',
          totalQty: totalQtyStr || '-',
          discount: rowDiscounts.grandTotalDiscount,
          status: row.payment_term || row.status || 'Confirmed',
          totalAmount: Number(row.total_amount || row.return_amount || 0)
        };
      });
    }

    await exportToExcel({
      fileName: `${filename}.xlsx`,
      sheetName: `Procurement Audit`,
      companyName: businessName || getBrandConfig().fullName,
      reportTitle: `Master Procurement Accounting Statement (${String(rType).toUpperCase()})`,
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald'
    });

    toast.success('Excel workbook exported successfully!');
  } catch (err: any) {
    console.error(err);
    toast.error('Export failed: ' + (err?.message || 'Unknown error'));
  }
};
