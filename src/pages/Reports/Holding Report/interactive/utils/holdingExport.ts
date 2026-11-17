import { exportToExcel, ExcelColumn } from '../../../../../utils/excelExport';
import { getBrandConfig } from '../../../../../utils/brand';
import type {
  ViewPerspective,
  HoldingItemRow,
  SalesmanSummaryItem,
  CustomerSummaryItem,
  GatepassSummaryItem,
  InvoiceSummaryItem
} from '../types/holdingTypes';

interface ExportHoldingOptions {
  activePerspective: ViewPerspective;
  businessName?: string;
  selectedSalesman: string;
  selectedCustomer: string;
  selectedGatepass: string;
  selectedInvoice: string;
  holdingStatusFilter: string;
  dateFrom: string;
  dateTo: string;
  filteredHoldingRows: HoldingItemRow[];
  salesmanSummary: SalesmanSummaryItem[];
  customerSummary: CustomerSummaryItem[];
  gatepassSummary: GatepassSummaryItem[];
  invoiceSummary: InvoiceSummaryItem[];
}

export const exportHoldingReportToExcel = async ({
  activePerspective,
  businessName,
  selectedSalesman,
  selectedCustomer,
  selectedGatepass,
  selectedInvoice,
  holdingStatusFilter,
  dateFrom,
  dateTo,
  filteredHoldingRows,
  salesmanSummary,
  customerSummary,
  gatepassSummary,
  invoiceSummary
}: ExportHoldingOptions) => {
  const filterMeta = {
    Perspective: activePerspective.toUpperCase(),
    Salesman: selectedSalesman,
    Customer: selectedCustomer,
    Gatepass: selectedGatepass,
    Invoice: selectedInvoice,
    'Date Window': dateFrom || dateTo ? `${dateFrom || 'Start'} to ${dateTo || 'End'}` : 'All Time',
    'Holding Filter':
      holdingStatusFilter === 'holding_only'
        ? 'Holding Items Only'
        : holdingStatusFilter === 'zero_holding'
        ? 'Dispatched / Zero Hold'
        : 'All Rows'
  };

  const company = businessName || getBrandConfig().fullName;
  const dateStr = new Date().toISOString().split('T')[0];

  if (activePerspective === 'detailed') {
    const columns: ExcelColumn[] = [
      { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
      { header: 'Gatepass / DC #', key: 'gatepassNo', width: 16 },
      { header: 'Invoice #', key: 'invoiceNo', width: 15 },
      { header: 'Date', key: 'date', width: 14, type: 'date' },
      { header: 'Customer Name', key: 'customerName', width: 26 },
      { header: 'Salesman', key: 'salesman', width: 20 },
      { header: 'Product Description', key: 'productName', width: 32 },
      { header: 'Code', key: 'skuCode', width: 14 },
      { header: 'Warehouse', key: 'warehouse', width: 18 },
      { header: 'Order Qty', key: 'orderQty', width: 12, type: 'number' },
      { header: 'Dispatched Qty', key: 'dispatchedQty', width: 14, type: 'number' },
      { header: 'Held Qty', key: 'holdQty', width: 12, type: 'number' },
      { header: 'Unit Rate (Rs.)', key: 'rate', width: 15, type: 'currency' },
      { header: 'Held Valuation (Rs.)', key: 'heldAmount', width: 20, type: 'currency' },
      { header: 'Status', key: 'status', width: 14, alignment: 'center' }
    ];

    const exportData = filteredHoldingRows.map((r, i) => ({
      idx: i + 1,
      ...r
    }));

    await exportToExcel({
      fileName: `Holding_Items_Detailed_${dateStr}.xlsx`,
      sheetName: 'Holding Items',
      companyName: company,
      reportTitle: 'Holding Inventory & Committed Stock Register (Item-Level)',
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald'
    });
  } else if (activePerspective === 'salesman') {
    const columns: ExcelColumn[] = [
      { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
      { header: 'Salesman Name', key: 'salesman', width: 26 },
      { header: 'Assigned Clients', key: 'custCount', width: 16, type: 'number' },
      { header: 'Invoices Count', key: 'invCount', width: 16, type: 'number' },
      { header: 'Held Items Count', key: 'itemsCount', width: 18, type: 'number' },
      { header: 'Total Held Quantity', key: 'totalHeldQty', width: 20, type: 'number' },
      { header: 'Total Holding Value (Rs.)', key: 'totalHeldValue', width: 26, type: 'currency' }
    ];

    const exportData = salesmanSummary.map((s, i) => ({
      idx: i + 1,
      salesman: s.salesman,
      custCount: s.custCount,
      invCount: s.invCount,
      itemsCount: s.itemsCount,
      totalHeldQty: s.totalHeldQty,
      totalHeldValue: s.totalHeldValue
    }));

    await exportToExcel({
      fileName: `Holding_Items_Salesman_Wise_${dateStr}.xlsx`,
      sheetName: 'Salesman Holding',
      companyName: company,
      reportTitle: 'Salesman-Wise Committed Holding Inventory Valuation',
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald'
    });
  } else if (activePerspective === 'customer') {
    const columns: ExcelColumn[] = [
      { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
      { header: 'Customer Name', key: 'customer', width: 30 },
      { header: 'Gatepasses Involved', key: 'gpCount', width: 18, type: 'number' },
      { header: 'Invoices Count', key: 'invCount', width: 16, type: 'number' },
      { header: 'Held Items Count', key: 'itemsCount', width: 18, type: 'number' },
      { header: 'Total Held Quantity', key: 'totalHeldQty', width: 20, type: 'number' },
      { header: 'Total Holding Value (Rs.)', key: 'totalHeldValue', width: 26, type: 'currency' }
    ];

    const exportData = customerSummary.map((c, i) => ({
      idx: i + 1,
      customer: c.customer,
      gpCount: c.gpCount,
      invCount: c.invCount,
      itemsCount: c.itemsCount,
      totalHeldQty: c.totalHeldQty,
      totalHeldValue: c.totalHeldValue
    }));

    await exportToExcel({
      fileName: `Holding_Items_Customer_Wise_${dateStr}.xlsx`,
      sheetName: 'Customer Holding',
      companyName: company,
      reportTitle: 'Customer-Wise Holding Stock Allocation Report',
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald'
    });
  } else if (activePerspective === 'gatepass') {
    const columns: ExcelColumn[] = [
      { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
      { header: 'Gatepass / DC #', key: 'gatepassNo', width: 18 },
      { header: 'Date', key: 'date', width: 14, type: 'date' },
      { header: 'Customer Name', key: 'customer', width: 26 },
      { header: 'Salesman', key: 'salesman', width: 20 },
      { header: 'Total Order Qty', key: 'totalOrderQty', width: 16, type: 'number' },
      { header: 'Dispatched Qty', key: 'totalDispatchedQty', width: 16, type: 'number' },
      { header: 'Held Qty', key: 'totalHeldQty', width: 14, type: 'number' },
      { header: 'Held Value (Rs.)', key: 'totalHeldValue', width: 20, type: 'currency' },
      { header: 'Status', key: 'status', width: 15, alignment: 'center' }
    ];

    const exportData = gatepassSummary.map((g, i) => ({
      idx: i + 1,
      ...g
    }));

    await exportToExcel({
      fileName: `Holding_Items_Gatepass_Wise_${dateStr}.xlsx`,
      sheetName: 'Gatepass Holding',
      companyName: company,
      reportTitle: 'Gatepass / Delivery Challan Holding Stock Audit',
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald'
    });
  } else if (activePerspective === 'invoice') {
    const columns: ExcelColumn[] = [
      { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
      { header: 'Invoice #', key: 'invoiceNo', width: 18 },
      { header: 'Date', key: 'date', width: 14, type: 'date' },
      { header: 'Customer Name', key: 'customer', width: 26 },
      { header: 'Salesman', key: 'salesman', width: 20 },
      { header: 'Held Items Count', key: 'itemsCount', width: 16, type: 'number' },
      { header: 'Total Held Quantity', key: 'totalHeldQty', width: 18, type: 'number' },
      { header: 'Held Valuation (Rs.)', key: 'totalHeldValue', width: 22, type: 'currency' }
    ];

    const exportData = invoiceSummary.map((inv, i) => ({
      idx: i + 1,
      ...inv
    }));

    await exportToExcel({
      fileName: `Holding_Items_Invoice_Wise_${dateStr}.xlsx`,
      sheetName: 'Invoice Holding',
      companyName: company,
      reportTitle: 'Invoice-Wise Holding Inventory Statement',
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald'
    });
  }
};
