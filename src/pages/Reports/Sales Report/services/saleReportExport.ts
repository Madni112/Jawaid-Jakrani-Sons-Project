import { toast } from 'react-hot-toast';
import { exportToExcel, ExcelColumn } from '../../../../utils/excelExport';
import { getBrandConfig } from '../../../../utils/brand';
import { extractItemNames, extractItemDetails, extractRowDiscounts } from './saleReportHelpers';

export interface SaleReportExportOptions {
  reportRows: any[];
  rType: string;
  activeViewMode: 'summary' | 'detailed';
  filters: any;
  businessName?: string | null;
  resolveCustomerMeta: (custName?: string) => { code: string; pageNo: string };
  setExporting: (val: boolean) => void;
}

export const exportSaleReportToExcel = async ({
  reportRows,
  rType,
  activeViewMode,
  filters,
  businessName,
  resolveCustomerMeta,
  setExporting,
}: SaleReportExportOptions) => {
  try {
    if (!reportRows || reportRows.length === 0) {
      toast.error('No report data available to export');
      return;
    }
    setExporting(true);


      const filterMeta = {
        'Report Type': rType === 'category-sales' ? 'Category-Wise Sales & Volume Report' : rType === 'product-sales-history' ? 'Product Sales History Report' : rType === 'sales-query' ? 'Sales Parameter Transaction Register' : rType === 'customer-sales' ? 'Customer Sales & Volume Analysis' : rType === 'return' ? 'Sales Return & Credit Ledger' : String(rType).toUpperCase(),
        'Presentation Mode': (rType === 'category-sales' || rType === 'product-sales-history' || rType === 'sale' || rType === 'customer-sales' || rType === 'return') ? (activeViewMode === 'summary' ? 'Summary View' : 'Detailed View') : 'Standard',
        'Customer': filters.customer?.length > 0 ? filters.customer.join(', ') : 'All',
        'Salesman': filters.salesman?.length > 0 ? filters.salesman.join(', ') : 'All',
        'Warehouse': filters.location?.length > 0 ? filters.location.join(', ') : 'All',
        'Date Window': filters.dateFrom || filters.dateTo ? `${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}` : 'All Time'
      };

      let columns: ExcelColumn[] = [];
      let exportData: any[] = [];

      if (rType === 'category-sales') {
        if (activeViewMode === 'summary') {
          columns = [
            { header: 'Parent Category', key: 'parent_category', width: 22 },
            { header: 'Sub Category', key: 'sub_category', width: 22 },
            { header: 'Category', key: 'category_name', width: 24 },
            { header: 'Product Name', key: 'product_name', width: 32 },
            { header: 'SKU / Code', key: 'sku', width: 16 },
            { header: 'UOM', key: 'uom', width: 10, alignment: { horizontal: 'center' } },
            { header: 'Gross Sold Qty', key: 'sold_qty', width: 14, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Returned Qty', key: 'returned_qty', width: 14, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Net Realized Qty', key: 'net_qty', width: 14, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Gross Sales (PKR)', key: 'gross_sales', width: 20, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Returns Credited (PKR)', key: 'returned_amount', width: 20, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Net Revenue (PKR)', key: 'final_net_sales', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: '% Category Share', key: 'share_of_category', width: 16, numFmt: '0.0%', alignment: { horizontal: 'right' } }
          ];

          exportData = [];
          reportRows.forEach((cat: any) => {
            (cat.products || []).forEach((p: any) => {
              exportData.push({
                parent_category: cat.parent_name,
                sub_category: cat.sub_name,
                category_name: cat.category_name,
                product_name: p.product_name,
                sku: p.sku || '-',
                uom: p.uom,
                sold_qty: p.sold_qty,
                returned_qty: p.returned_qty,
                net_qty: p.net_qty,
                gross_sales: p.gross_sales,
                returned_amount: p.returned_amount,
                final_net_sales: p.final_net_sales,
                share_of_category: (p.share_of_category || 0) / 100
              });
            });
          });
        } else {
          columns = [
            { header: 'S#', key: 'sno', width: 6, alignment: { horizontal: 'center' } },
            { header: 'Processing Date', key: 'date', width: 14, alignment: { horizontal: 'center' } },
            { header: 'Doc / Ref #', key: 'doc_no', width: 18 },
            { header: 'Doc Type', key: 'doc_type', width: 14, alignment: { horizontal: 'center' } },
            { header: 'Customer Name', key: 'customer_name', width: 26 },
            { header: 'Sales Officer', key: 'salesman', width: 18 },
            { header: 'Product Item', key: 'product_name', width: 30 },
            { header: 'Qty', key: 'qty', width: 12, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'UOM', key: 'uom', width: 8, alignment: { horizontal: 'center' } },
            { header: 'Unit Rate (PKR)', key: 'rate', width: 16, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Freight (PKR)', key: 'freight_charges', width: 16, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Net Amount (PKR)', key: 'total_amount', width: 20, numFmt: '#,##0.00', alignment: { horizontal: 'right' } }
          ];

          exportData = [];
          reportRows.forEach((cat: any, cIdx: number) => {
            const bannerText = `🏢 PARENT: ${cat.parent_name || 'General'}  |  📂 SUB: ${cat.sub_name || '-'}  |  🏷️ CATEGORY: ${cat.category_name}  |  Sold: ${Number(cat.gross_units || 0).toLocaleString()}  |  Ret: ${Number(cat.returned_units || 0).toLocaleString()}  |  Net: ${Number(cat.net_units || 0).toLocaleString()} Units  |  Net Revenue: Rs. ${Number(cat.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

            exportData.push({
              _isHeader: true,
              _bannerText: bannerText
            });

            const txList = cat.transactions || [];
            if (txList.length === 0) {
              exportData.push({
                sno: '-',
                date: '-',
                doc_no: '-',
                doc_type: '-',
                customer_name: 'No Transactions',
                salesman: '-',
                product_name: '-',
                qty: 0,
                uom: '-',
                rate: 0,
                freight_charges: 0,
                total_amount: 0
              });
            } else {
              txList.forEach((tx: any, tIdx: number) => {
                const isRet = tx.record_type === 'return';
                exportData.push({
                  sno: tIdx + 1,
                  date: tx.date,
                  doc_no: tx.doc_no,
                  doc_type: isRet ? 'Sales Return' : 'Sales Invoice',
                  customer_name: tx.customer_name,
                  salesman: tx.salesman,
                  product_name: tx.product_name,
                  qty: tx.qty,
                  uom: tx.uom,
                  rate: tx.rate,
                  freight_charges: tx.freight_charges || 0,
                  total_amount: isRet ? -Number(tx.total_amount || 0) : Number(tx.total_amount || 0)
                });
              });
            }

            exportData.push({
              _isSubtotal: true,
              sno: '',
              date: '',
              doc_no: '',
              doc_type: '',
              customer_name: `Subtotal (${cat.category_name} : ${txList.length} Records):`,
              salesman: '',
              product_name: `Net Vol: ${Number(cat.net_units || 0).toLocaleString()} Units`,
              qty: Number(cat.gross_units || 0),
              uom: '',
              rate: 0,
              freight_charges: 0,
              total_amount: Number(cat.net_revenue || 0)
            });
          });
        }
      } else if (rType === 'product-sales-history') {
        if (activeViewMode === 'summary') {
          columns = [
            { header: 'S#', key: 'sno', width: 8, alignment: 'center' },
            { header: 'Product / Item Name', key: 'product_name', width: 32 },
            { header: 'SKU / Code', key: 'sku', width: 16 },
            { header: 'Brand', key: 'brand', width: 16 },
            { header: 'Parent Category', key: 'parentCategory', width: 18 },
            { header: 'Sub Category', key: 'subCategory', width: 18 },
            { header: 'Leaf Category', key: 'category', width: 18 },
            { header: 'UOM', key: 'uom', width: 10, alignment: 'center' },
            { header: 'Sold Qty', key: 'sold_qty', width: 14, type: 'number', alignment: 'right' },
            { header: 'Returned Qty', key: 'returned_qty', width: 14, type: 'number', alignment: 'right' },
            { header: 'Net Sold Qty', key: 'net_qty', width: 14, type: 'number', alignment: 'right' },
            { header: 'Avg. Rate (PKR)', key: 'avg_rate', width: 18, type: 'currency', alignment: 'right' },
            { header: 'Net Sales Revenue (PKR)', key: 'final_net_sales', width: 24, type: 'currency', alignment: 'right' },
            { header: 'Last Sale Date', key: 'last_sale_date', width: 16, alignment: 'center' }
          ];

          exportData = reportRows.map((r, i) => ({
            sno: i + 1,
            product_name: r.product_name,
            sku: r.sku || '-',
            brand: r.brand || '-',
            parentCategory: r.parentCategory || '-',
            subCategory: r.subCategory || '-',
            category: r.category || '-',
            uom: r.uom,
            sold_qty: Number(r.sold_qty || 0),
            returned_qty: Number(r.returned_qty || 0),
            net_qty: Number(r.net_qty || 0),
            avg_rate: Number(Number(r.avg_rate || 0).toFixed(2)),
            final_net_sales: Number(Number(r.final_net_sales || 0).toFixed(2)),
            last_sale_date: r.last_sale_date || '-'
          }));
        } else {
          columns = [
            { header: 'S#', key: 'sno', width: 6, alignment: { horizontal: 'center' } },
            { header: 'Processing Date', key: 'date', width: 14, alignment: { horizontal: 'center' } },
            { header: 'Invoice #', key: 'invoice_no', width: 16 },
            { header: 'Customer Name', key: 'customer_name', width: 26 },
            { header: 'Salesman', key: 'salesman', width: 18 },
            { header: 'Warehouse', key: 'warehouse', width: 18 },
            { header: 'Qty Sold', key: 'qty', width: 12, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'UOM', key: 'uom', width: 8, alignment: { horizontal: 'center' } },
            { header: 'Unit Rate (PKR)', key: 'rate', width: 16, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Discount (PKR)', key: 'discount', width: 16, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Net Amount (PKR)', key: 'total', width: 20, numFmt: '#,##0.00', alignment: { horizontal: 'right' } }
          ];

          exportData = [];
          reportRows.forEach((prod: any) => {
            const bannerText = `📦 ${prod.product_name.toUpperCase()}  |  SKU: ${prod.sku || '-'}  |  Category: ${prod.category || 'General'}  |  Sold: ${Number(prod.sold_qty || 0).toLocaleString()} ${prod.uom || ''}  |  Ret: ${Number(prod.returned_qty || 0).toLocaleString()}  |  Net Sold: ${Number(prod.net_qty || 0).toLocaleString()}  |  Avg Rate: Rs. ${Number(prod.avg_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Net Revenue: Rs. ${Number(prod.final_net_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

            exportData.push({
              _isHeader: true,
              _bannerText: bannerText
            });

            const txList = prod.transactions || [];
            if (txList.length === 0) {
              exportData.push({
                sno: '-',
                date: '-',
                invoice_no: '-',
                customer_name: 'No Transactions',
                salesman: '-',
                warehouse: '-',
                qty: 0,
                uom: '-',
                rate: 0,
                discount: 0,
                total: 0
              });
            } else {
              txList.forEach((tx: any, tIdx: number) => {
                exportData.push({
                  sno: tIdx + 1,
                  date: tx.date,
                  invoice_no: tx.invoice_no,
                  customer_name: tx.customer_name,
                  salesman: tx.salesman,
                  warehouse: tx.warehouse,
                  qty: tx.qty,
                  uom: tx.uom,
                  rate: tx.rate,
                  discount: tx.discount,
                  total: tx.total
                });
              });
            }

            exportData.push({
              _isSubtotal: true,
              sno: '',
              date: '',
              invoice_no: '',
              customer_name: `Subtotal (${prod.product_name}):`,
              salesman: '',
              warehouse: '',
              qty: Number(prod.net_qty || 0),
              uom: prod.uom,
              rate: 0,
              discount: 0,
              total: Number(prod.final_net_sales || 0)
            });
          });
        }
      } else if (rType === 'sales-query') {
        columns = [
          { header: 'S#', key: 'sno', width: 8, alignment: { horizontal: 'center' } },
          { header: 'Processing Date', key: 'processingDate', width: 16, alignment: { horizontal: 'center' } },
          { header: 'Invoice #', key: 'docRef', width: 18 },
          { header: 'Customer Name', key: 'customerName', width: 28 },
          { header: 'Sales Officer', key: 'salesman', width: 20 },
          { header: 'Carrier Fleet', key: 'transport', width: 18 },
          { header: 'Product Line Items', key: 'products', width: 45 },
          { header: 'Warehouse', key: 'warehouse', width: 18 },
          { header: 'Payment Term', key: 'paymentTerm', width: 16, alignment: { horizontal: 'center' } },
          { header: 'Gross Matrix Amount (PKR)', key: 'totalAmount', width: 24, numFmt: '#,##0.00', alignment: { horizontal: 'right' } }
        ];

        exportData = reportRows.map((row, i) => {
          const itemDetails = extractItemDetails(row);
          const productsFormatted = itemDetails.length > 0
            ? itemDetails.map(it => `${it.name} (${it.qty} ${it.uom} @ Rs. ${Number(it.price).toLocaleString()})`).join(' | ')
            : extractItemNames(row).join(' | ');
          return {
            sno: i + 1,
            processingDate: row.sale_date || String(row.created_at || '').split('T')[0],
            docRef: row.invoice_no || `INV-${String(row.id).padStart(4, '0')}`,
            customerName: row.customer_name || 'Counter Retail Buyer',
            salesman: row.salesman || 'Direct',
            transport: row.transport_name || 'Self Pick',
            products: productsFormatted,
            warehouse: row.dispatch_warehouse || 'Main Warehouse',
            paymentTerm: row.payment_term || 'Credit',
            totalAmount: Number(row.total_amount || 0)
          };
        });
      } else if (rType === 'customer-sales') {
        if (activeViewMode === 'summary') {
          columns = [
            { header: 'S#', key: 'sno', width: 8, alignment: { horizontal: 'center' } },
            { header: 'Customer Name', key: 'customer_name', width: 28 },
            { header: 'Customer Code', key: 'customer_code', width: 16, alignment: { horizontal: 'center' } },
            { header: 'Page #', key: 'page_no', width: 14, alignment: { horizontal: 'center' } },
            { header: 'Sold Volume', key: 'gross_units', width: 16, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Return Volume', key: 'returned_units', width: 16, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Net Volume', key: 'net_units', width: 16, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Gross Sales (PKR)', key: 'gross_sales', width: 20, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Returns Credited (PKR)', key: 'return_amount', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Net Realized Revenue (PKR)', key: 'net_sales', width: 24, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Contribution (%)', key: 'contribution_pct', width: 16, numFmt: '0.00"%"', alignment: { horizontal: 'right' } }
          ];

          exportData = reportRows.map((cust, i) => {
            const meta = resolveCustomerMeta(cust.customer_name);
            const code = cust.customer_code || cust.customerCode || meta.code || '-';
            const pageNo = cust.page_no || cust.pageNo || meta.pageNo || '-';
            return {
              sno: i + 1,
              customer_name: cust.customer_name,
              customer_code: code,
              page_no: pageNo,
              gross_units: cust.gross_units,
              returned_units: cust.returned_units,
              net_units: cust.net_units,
              gross_sales: cust.gross_sales,
              return_amount: cust.return_amount,
              net_sales: cust.net_sales,
              contribution_pct: cust.contribution_pct
            };
          });
        } else {
          columns = [
            { header: 'S#', key: 'sno', width: 6, alignment: { horizontal: 'center' } },
            { header: 'Date', key: 'processingDate', width: 14, alignment: { horizontal: 'center' } },
            { header: 'Doc / Ref #', key: 'docRef', width: 18 },
            { header: 'Sales Officer', key: 'salesman', width: 20 },
            { header: 'Product Line Items', key: 'products', width: 45 },
            { header: 'Doc Type / Term', key: 'paymentTerm', width: 18, alignment: { horizontal: 'center' } },
            { header: 'Freight Charges (PKR)', key: 'freightCharges', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Amount (PKR)', key: 'totalAmount', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } }
          ];

          exportData = [];
          reportRows.forEach((cust: any) => {
            const custGross = Number(cust.gross_sales || 0);
            const custReturn = Number(cust.return_amount || 0);
            const custNet = Number(cust.net_sales || custGross - custReturn);
            const custNetUnits = Number(cust.net_units || (cust.gross_units || 0) - (cust.returned_units || 0));

            const bannerText = `👤 ${cust.customer_name.toUpperCase()}  |  Invoices: ${cust.invoices_count}  |  Returns: ${cust.returns_count}  |  Net Volume: ${custNetUnits.toLocaleString()} Units  |  Gross: Rs. ${custGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Returns: -Rs. ${custReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Net Revenue: Rs. ${custNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

            exportData.push({
              _isHeader: true,
              _bannerText: bannerText
            });

            const combinedTx = [
              ...(cust.transactions || []),
              ...(cust.return_transactions || [])
            ].sort((a: any, b: any) => {
              const dateA = a.sale_date || a.return_date || a.created_at || '';
              const dateB = b.sale_date || b.return_date || b.created_at || '';
              return dateA.localeCompare(dateB);
            });

            if (combinedTx.length === 0) {
              exportData.push({
                sno: '-',
                processingDate: '-',
                docRef: '-',
                salesman: '-',
                products: 'No Transactions',
                paymentTerm: '-',
                freightCharges: 0,
                totalAmount: 0
              });
            } else {
              combinedTx.forEach((row: any, tIdx: number) => {
                const isReturn = row.record_type === 'return';
                const itemDetails = extractItemDetails(row);
                const productsFormatted = itemDetails.length > 0
                  ? itemDetails.map(it => `${it.name} (${it.qty} ${it.uom} @ Rs. ${Number(it.price).toLocaleString()})`).join(' | ')
                  : extractItemNames(row).join(' | ');
                const rowAmount = Number(isReturn ? (row.return_amount || row.total_amount || 0) : (row.total_amount || 0));
                const rowFreight = isReturn ? 0 : (Number(row.additional_charges || 0) + Number(row.transport_charges || 0));

                exportData.push({
                  sno: tIdx + 1,
                  processingDate: row.sale_date || row.return_date || String(row.created_at || '').split('T')[0],
                  docRef: isReturn ? (row.return_no || `RTN-${String(row.id).padStart(4, '0')}`) : (row.invoice_no || `INV-${String(row.id).padStart(4, '0')}`),
                  salesman: row.salesman || 'Direct',
                  products: productsFormatted,
                  paymentTerm: isReturn ? 'Return Credit' : (row.payment_term || 'Credit'),
                  freightCharges: rowFreight,
                  totalAmount: isReturn ? -rowAmount : rowAmount
                });
              });
            }

            exportData.push({
              _isSubtotal: true,
              sno: '',
              processingDate: '',
              docRef: '',
              salesman: `Subtotal (${cust.customer_name}):`,
              products: `Net Vol: ${custNetUnits.toLocaleString()} Units`,
              paymentTerm: `Gross: Rs. ${custGross.toLocaleString()} | Ret: -Rs. ${custReturn.toLocaleString()}`,
              freightCharges: 0,
              totalAmount: custNet
            });
          });
        }
      } else if (rType === 'loyalty') {
        columns = [
          { header: 'S#', key: 'sno', width: 6, alignment: { horizontal: 'center' } },
          { header: 'Date', key: 'date', width: 14, alignment: { horizontal: 'center' } },
          { header: 'Invoice Ref #', key: 'invoice_no', width: 18 },
          { header: 'Sales Officer', key: 'salesman', width: 18 },
          { header: 'Narration / Details', key: 'narration', width: 35 },
          { header: 'Billed Amount / Dr (PKR)', key: 'billed_amount', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
          { header: 'Amount Paid / Cr (PKR)', key: 'paid_amount', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
          { header: 'Net Dues / Balance (PKR)', key: 'balance', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
          { header: 'Status', key: 'status', width: 14, alignment: { horizontal: 'center' } }
        ];

        exportData = [];
        reportRows.forEach((cust: any) => {
          const bannerText = `👤 ${cust.customer_name.toUpperCase()}  |  Closing Balance: Rs. ${Number(cust.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

          exportData.push({
            _isHeader: true,
            _bannerText: bannerText
          });

          const txList = cust.transactions || [];
          if (txList.length === 0) {
            exportData.push({
              sno: '-',
              date: '-',
              invoice_no: '-',
              salesman: '-',
              narration: 'No Transactions',
              billed_amount: 0,
              paid_amount: 0,
              balance: Number(cust.balance || 0),
              status: '-'
            });
          } else {
            txList.forEach((tx: any, tIdx: number) => {
              exportData.push({
                sno: tIdx + 1,
                date: tx.date,
                invoice_no: tx.invoice_no,
                salesman: tx.salesman,
                narration: tx.narration,
                billed_amount: Number(tx.billed_amount || 0),
                paid_amount: Number(tx.paid_amount || 0),
                balance: Number(tx.balance || 0),
                status: tx.status || 'Paid'
              });
            });
          }

          exportData.push({
            _isSubtotal: true,
            sno: '',
            date: '',
            invoice_no: '',
            salesman: '',
            narration: `Total (${cust.customer_name}):`,
            billed_amount: Number(cust.total_billed || 0),
            paid_amount: Number(cust.total_paid || 0),
            balance: Number(cust.balance || 0),
            status: ''
          });
        });
      } else if (rType === 'sale') {
        if (activeViewMode === 'summary') {
          columns = [
            { header: 'S#', key: 'sno', width: 8, alignment: { horizontal: 'center' } },
            { header: 'Sales Officer / Salesman Name', key: 'salesman', width: 28 },
            { header: 'Invoices Booked', key: 'invoices_count', width: 16, numFmt: '#,##0', alignment: { horizontal: 'right' } },
            { header: 'Returns Booked', key: 'returns_count', width: 16, numFmt: '#,##0', alignment: { horizontal: 'right' } },
            { header: 'Unique Clients', key: 'unique_customers_count', width: 16, numFmt: '#,##0', alignment: { horizontal: 'right' } },
            { header: 'Cash Sales (PKR)', key: 'cash_sales', width: 20, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Credit Sales (PKR)', key: 'credit_sales', width: 20, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Gross Sales (PKR)', key: 'gross_sales', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Returns (Dr) (PKR)', key: 'return_amount', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Net Realized Revenue (PKR)', key: 'net_sales', width: 24, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Contribution (%)', key: 'contribution_pct', width: 16, numFmt: '0.00"%"', alignment: { horizontal: 'right' } }
          ];

          exportData = reportRows.map((sm, i) => ({
            sno: i + 1,
            salesman: sm.salesman,
            invoices_count: sm.invoices_count,
            returns_count: sm.returns_count,
            unique_customers_count: sm.unique_customers_count,
            cash_sales: sm.cash_sales,
            credit_sales: sm.credit_sales,
            gross_sales: sm.gross_sales,
            return_amount: sm.return_amount,
            net_sales: sm.net_sales,
            contribution_pct: sm.contribution_pct
          }));
        } else {
          columns = [
            { header: 'S#', key: 'sno', width: 6, alignment: { horizontal: 'center' } },
            { header: 'Processing Date', key: 'processingDate', width: 16, alignment: { horizontal: 'center' } },
            { header: 'Doc / Ref #', key: 'docRef', width: 18 },
            { header: 'Customer Name', key: 'customerName', width: 28 },
            { header: 'Products / Items', key: 'products', width: 42 },
            { header: 'Payment Term / Doc Type', key: 'paymentTerm', width: 20, alignment: { horizontal: 'center' } },
            { header: 'Carrier Fleet', key: 'transport', width: 18 },
            { header: 'Net Amount (PKR)', key: 'totalAmount', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } }
          ];

          exportData = [];
          reportRows.forEach((sm: any) => {
            const smGross = Number(sm.gross_sales || 0);
            const smReturn = Number(sm.return_amount || 0);
            const smNet = Number(sm.net_sales || 0);
            const smCash = Number(sm.cash_sales || 0);
            const smCredit = Number(sm.credit_sales || 0);

            const bannerText = `👔 ${sm.salesman.toUpperCase()}  |  Invoices: ${sm.invoices_count}  |  Returns: ${sm.returns_count}  |  Unique Clients: ${sm.unique_customers_count}  |  Gross: Rs. ${smGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Returns: - Rs. ${smReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Net Realized: Rs. ${smNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}  |  Share: ${Number(sm.contribution_pct || 0).toFixed(1)}%`;

            exportData.push({
              _isHeader: true,
              _bannerText: bannerText
            });

            const invList = sm.transactions || [];
            const retList = sm.return_transactions || [];

            // ── SECTION 1: SALES INVOICES ──
            if (invList.length > 0) {
              exportData.push({
                _isSubHeader: true,
                _bannerText: `📑 SALES INVOICES (${invList.length})  |  Cash: Rs. ${smCash.toLocaleString()}  |  Credit: Rs. ${smCredit.toLocaleString()}  |  Gross Invoiced: Rs. ${smGross.toLocaleString()}`
              });

              invList.forEach((row: any, tIdx: number) => {
                const itemNames = extractItemNames(row);
                exportData.push({
                  sno: tIdx + 1,
                  processingDate: row.sale_date || String(row.created_at || '').split('T')[0],
                  docRef: row.invoice_no || `INV-${String(row.id).padStart(4, '0')}`,
                  customerName: row.customer_name || 'Counter Retail Buyer',
                  products: itemNames.join(' | '),
                  paymentTerm: row.payment_term || 'Credit',
                  transport: row.transport_name || 'Self Pick',
                  totalAmount: Number(row.total_amount || 0)
                });
              });

              exportData.push({
                _isSubtotal: true,
                sno: '',
                processingDate: '',
                docRef: '',
                customerName: `Total Sales Invoices (${sm.salesman}):`,
                products: `Cash: Rs. ${smCash.toLocaleString()} | Credit: Rs. ${smCredit.toLocaleString()}`,
                paymentTerm: '',
                transport: '',
                totalAmount: smGross
              });
            }

            // ── SECTION 2: SALES RETURNS ──
            if (retList.length > 0) {
              exportData.push({
                _isSubHeader: true,
                _bannerText: `🔄 SALES RETURNS & CREDIT ADJUSTMENTS (${retList.length})  |  Total Return Deductions: - Rs. ${smReturn.toLocaleString()}`
              });

              retList.forEach((row: any, rIdx: number) => {
                const itemNames = extractItemNames(row);
                const retAmount = Number(row.return_amount || row.total_amount || 0);

                exportData.push({
                  sno: rIdx + 1,
                  processingDate: row.return_date || String(row.created_at || '').split('T')[0],
                  docRef: row.return_no || `RTN-${String(row.id).padStart(4, '0')}`,
                  customerName: row.customer_name || 'Counter Retail Buyer',
                  products: itemNames.length > 0 ? itemNames.join(' | ') : (row.reason || 'Stock Return'),
                  paymentTerm: 'Return Credit',
                  transport: row.transport_name || 'Warehouse Return',
                  totalAmount: -retAmount
                });
              });

              exportData.push({
                _isSubtotal: true,
                sno: '',
                processingDate: '',
                docRef: '',
                customerName: `Total Sales Returns (${sm.salesman}):`,
                products: `Returns Count: ${retList.length}`,
                paymentTerm: '',
                transport: '',
                totalAmount: -smReturn
              });
            }

            // ── FINAL SALESMAN NET RECONCILIATION ──
            exportData.push({
              _isSubtotal: true,
              sno: '',
              processingDate: '',
              docRef: '',
              customerName: `NET REALIZED COMMERCIAL REVENUE (${sm.salesman}):`,
              products: `Gross: Rs. ${smGross.toLocaleString()}  -  Returns: Rs. ${smReturn.toLocaleString()}`,
              paymentTerm: '',
              transport: '',
              totalAmount: smNet
            });
          });
        }
      } else if (rType === 'return') {
        if (activeViewMode === 'summary') {
          columns = [
            { header: 'S#', key: 'sno', width: 8, alignment: { horizontal: 'center' } },
            { header: 'Customer Name', key: 'customer_name', width: 28 },
            { header: 'Customer Code', key: 'customer_code', width: 16, alignment: { horizontal: 'center' } },
            { header: 'Page #', key: 'page_no', width: 14, alignment: { horizontal: 'center' } },
            { header: 'Return Notes Booked', key: 'returns_count', width: 18, numFmt: '#,##0', alignment: { horizontal: 'right' } },
            { header: 'Total Returned Units', key: 'total_returned_qty', width: 18, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: 'Total Credit Adjusted (PKR)', key: 'total_return_amount', width: 24, numFmt: '#,##0.00', alignment: { horizontal: 'right' } },
            { header: '% Share of Returns', key: 'contribution_pct', width: 18, numFmt: '0.00"%"', alignment: { horizontal: 'right' } }
          ];

          exportData = reportRows.map((cust, i) => {
            const meta = resolveCustomerMeta(cust.customer_name);
            const code = cust.customer_code || cust.customerCode || meta.code || '-';
            const pageNo = cust.page_no || cust.pageNo || meta.pageNo || '-';
            return {
              sno: i + 1,
              customer_name: cust.customer_name,
              customer_code: code,
              page_no: pageNo,
              returns_count: cust.returns_count,
              total_returned_qty: cust.total_returned_qty,
              total_return_amount: cust.total_return_amount,
              contribution_pct: cust.contribution_pct
            };
          });
        } else {
          columns = [
            { header: 'S#', key: 'sno', width: 6, alignment: { horizontal: 'center' } },
            { header: 'Return Date', key: 'return_date', width: 14, alignment: { horizontal: 'center' } },
            { header: 'Return Ref #', key: 'return_no', width: 18 },
            { header: 'Original Inv Ref #', key: 'original_invoice_no', width: 18 },
            { header: 'Sales Officer', key: 'salesman', width: 20 },
            { header: 'Returned Line Items', key: 'items', width: 45 },
            { header: 'Restocked Warehouse', key: 'warehouse', width: 20 },
            { header: 'Reason / Remarks', key: 'reason', width: 25 },
            { header: 'Credit Amount (PKR)', key: 'return_amount', width: 22, numFmt: '#,##0.00', alignment: { horizontal: 'right' } }
          ];

          exportData = [];
          reportRows.forEach((cust: any) => {
            const bannerText = `👤 ${cust.customer_name.toUpperCase()}  |  Returns: ${cust.returns_count}  |  Total Returned Units: ${Number(cust.total_returned_qty || 0).toLocaleString()}  |  Total Credit Adjusted: Rs. ${Number(cust.total_return_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

            exportData.push({
              _isHeader: true,
              _bannerText: bannerText
            });

            const txList = cust.transactions || [];
            if (txList.length === 0) {
              exportData.push({
                sno: '-',
                return_date: '-',
                return_no: '-',
                original_invoice_no: '-',
                salesman: '-',
                items: 'No Returns',
                warehouse: '-',
                reason: '-',
                return_amount: 0
              });
            } else {
              txList.forEach((row: any, tIdx: number) => {
                const itemDetails = extractItemDetails(row);
                const itemsFormatted = itemDetails.length > 0
                  ? itemDetails.map(it => `${it.name} (${it.qty} ${it.uom} @ Rs. ${Number(it.price).toLocaleString()})`).join(' | ')
                  : extractItemNames(row).join(' | ');

                exportData.push({
                  sno: tIdx + 1,
                  return_date: row.return_date || String(row.created_at || '').split('T')[0],
                  return_no: row.return_no || `RTN-${String(row.id).padStart(4, '0')}`,
                  original_invoice_no: row.original_invoice_no || '-',
                  salesman: row.salesman || 'Direct',
                  items: itemsFormatted,
                  warehouse: row.dispatch_warehouse || row.location || 'Main Warehouse',
                  reason: row.reason || row.remarks || 'Stock Return',
                  return_amount: Number(row.return_amount || row.total_amount || 0)
                });
              });
            }

            exportData.push({
              _isSubtotal: true,
              sno: '',
              return_date: '',
              return_no: '',
              original_invoice_no: '',
              salesman: `Subtotal (${cust.customer_name}):`,
              items: `Total Units: ${Number(cust.total_returned_qty || 0).toLocaleString()}`,
              warehouse: '',
              reason: '',
              return_amount: Number(cust.total_return_amount || 0)
            });
          });
        }
      } else {
        columns = [
          { header: 'Date', key: 'processingDate', width: 16, type: 'date' as const },
          { header: 'Invoice No#', key: 'docRef', width: 18 },
          { header: 'Customer', key: 'customerName', width: 28 },
          { header: 'Product', key: 'products', width: 45 },
          { header: 'Discount (Rs.)', key: 'discountAmount', width: 22, type: 'currency' as const },
          { header: 'Total (Rs.)', key: 'totalAmount', width: 22, type: 'currency' as const }
        ];

        exportData = reportRows.map((row) => {
          const itemDetails = extractItemDetails(row);
          const itemNames = extractItemNames(row);
          const rowDiscounts = extractRowDiscounts(row);
          const rawCustName = String(row.customer_name || '').trim().toLowerCase();
          const matchedCust = resolveCustomerMeta ? resolveCustomerMeta(row.customer_name) : null;
          const custCode = row.customer_code || row.customerCode || matchedCust?.code || '';
          const custPageNo = row.page_no || row.pageNo || matchedCust?.pageNo || '';
          const custSub = [custCode, custPageNo ? (String(custPageNo).toUpperCase().startsWith('P#') ? custPageNo : `P# ${custPageNo}`) : ''].filter(Boolean).join(' | ');
          const customerFormatted = custSub ? `${row.customer_name || 'Counter Retail Buyer'}\r\n${custSub}` : (row.customer_name || 'Counter Retail Buyer');

          const productsFormatted = rType === 'invoice'
            ? itemDetails.map(it => {
              const lineTotal = Number(it.qty || 0) * Number(it.price || 0);
              return `${it.name} | ${it.qty} ${it.uom} | Rs. ${Number(it.price).toLocaleString()} = Rs. ${lineTotal.toLocaleString()}${it.discountAmt > 0 ? ` (Disc: Rs. ${it.discountAmt} [${it.discountPer}%])` : ''}`;
            }).join('\r\n')
            : itemNames.join(' | ');

          return {
            processingDate: row.sale_date || row.return_date || String(row.created_at || '').split('T')[0],
            docRef: row.invoice_no || `INV-${String(row.id).padStart(4, '0')}`,
            products: productsFormatted,
            customerName: customerFormatted,
            discountAmount: rowDiscounts.grandTotalDiscount,
            totalAmount: Number(row.total_amount || row.return_amount || row.payout_amount_paid || 0)
          };
        });
      }

      const reportTitle = rType === 'product-sales-history'
        ? `Product Sales History & Market Trends Audit Report (${activeViewMode.toUpperCase()} VIEW)`
        : rType === 'sales-query'
          ? 'Sales Parameter Multi-Criteria Transaction Register'
          : rType === 'customer-sales'
            ? `Customer Sales & Volume Analysis Statement (${activeViewMode.toUpperCase()} VIEW)`
            : rType === 'sale'
              ? `Commercial Sales Audit Ledger Statement (${activeViewMode.toUpperCase()} VIEW)`
              : rType === 'return'
                ? `Sales Return & Credit Adjustment Ledger Statement (${activeViewMode.toUpperCase()} VIEW)`
                : rType === 'loyalty'
                  ? 'Customer Financial Statement & Invoice Ledger'
                  : 'Sales Invoice Detail Audit Report';

      await exportToExcel({
        fileName: `${rType === 'sale' ? 'Commercial_Sales_Ledger' : rType === 'product-sales-history' ? 'Product_Sales_History' : rType === 'customer-sales' ? 'Customer_Sales_Analysis' : rType === 'return' ? 'Sales_Return_Credit_Ledger' : rType === 'sales-query' ? 'Sales_Parameter_Register' : rType}_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: rType === 'sale' ? 'Sales Ledger' : rType === 'customer-sales' ? 'Customer Breakdown' : rType === 'return' ? 'Return Ledger' : 'Sales Report',
        companyName: businessName || getBrandConfig().fullName,
        reportTitle,
        filterSummary: filterMeta,
        columns,
        data: exportData,
        summaryRow: activeViewMode === 'detailed' ? false : true,
        theme: 'emerald'
      });

      toast.success('Excel workbook exported successfully!');

    toast.success('Excel workbook exported successfully!');
  } catch (err: any) {
    console.error(err);
    toast.error('Export failed: ' + err.message);
  } finally {
    setExporting(false);
  }
};
