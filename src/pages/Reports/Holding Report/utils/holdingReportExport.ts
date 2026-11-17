import { exportToExcel, ExcelColumn } from '../../../../utils/excelExport';
import { getBrandConfig } from '../../../../utils/brand';

const perspectiveLabels: Record<string, string> = {
  detailed: 'Detailed Itemized',
  salesman: 'Salesman-Wise',
  customer: 'Customer-Wise',
  gatepass: 'Gatepass-Wise',
  invoice: 'Invoice-Wise',
};

export const exportHoldingReportToExcel = async (
  activePerspective: string,
  displayRows: any[],
  rawFilters: any,
  businessName: string | undefined,
  getCustomerDetails: (name: string) => { code: string; pageNo: string }
) => {
  const filterMeta = {
    Perspective: (perspectiveLabels[activePerspective] || activePerspective).toUpperCase(),
    'Date Window':
      rawFilters.dateFrom || rawFilters.dateTo
        ? `${rawFilters.dateFrom || 'Start'} to ${rawFilters.dateTo || 'End'}`
        : 'All Time',
  };

  if (activePerspective === 'detailed') {
    const columns: ExcelColumn[] = [
      { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
      { header: 'Gatepass / DC #', key: 'gatepassNo', width: 16 },
      { header: 'Invoice #', key: 'invoiceNo', width: 15 },
      { header: 'Date', key: 'date', width: 14, type: 'date' },
      { header: 'Customer Name', key: 'customerName', width: 26 },
      { header: 'Customer Code', key: 'customerCode', width: 15 },
      { header: 'Page #', key: 'pageNo', width: 10, alignment: 'center' },
      { header: 'Salesman', key: 'salesman', width: 20 },
      { header: 'Product Description', key: 'productName', width: 32 },
      { header: 'Code', key: 'skuCode', width: 14 },
      { header: 'Warehouse', key: 'warehouse', width: 18 },
      { header: 'Order Qty', key: 'orderQty', width: 12, type: 'number', alignment: 'right' },
      { header: 'Dispatched Qty', key: 'dispatchedQty', width: 14, type: 'number', alignment: 'right' },
      { header: 'Held Qty', key: 'holdQty', width: 12, type: 'number', alignment: 'right' },
      { header: 'Unit Rate (Rs.)', key: 'rate', width: 16, type: 'currency', alignment: 'right' },
      { header: 'Held Value (Rs.)', key: 'heldAmount', width: 18, type: 'currency', alignment: 'right' },
    ];

    const exportData: any[] = [];
    let globalIdx = 1;

    (displayRows || []).forEach((doc: any) => {
      const cDetails = getCustomerDetails(doc.customerName || '');
      (doc.items || []).forEach((item: any, itIdx: number) => {
        exportData.push({
          idx: itIdx === 0 ? globalIdx : '',
          gatepassNo: itIdx === 0 ? doc.gatepassNo || '-' : '',
          invoiceNo: itIdx === 0 ? doc.invoiceNo || '-' : '',
          date: itIdx === 0 ? doc.date || '-' : '',
          customerName: itIdx === 0 ? doc.customerName || '-' : '',
          customerCode: itIdx === 0 ? cDetails.code || '-' : '',
          pageNo: itIdx === 0 ? cDetails.pageNo || '-' : '',
          salesman: itIdx === 0 ? doc.salesman || '-' : '',
          productName: item.productName || '-',
          skuCode: item.skuCode || '-',
          warehouse: item.warehouse || '-',
          orderQty: Number(item.orderQty || 0),
          dispatchedQty: Number(item.dispatchedQty || 0),
          holdQty: Number(item.holdQty || 0),
          rate: Number(item.rate || 0),
          heldAmount: Number(item.heldAmount || 0),
        });
      });
      globalIdx++;
    });

    await exportToExcel({
      fileName: `Holding_Items_Detailed_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Holding Items',
      companyName: businessName || getBrandConfig().fullName,
      reportTitle: 'Holding Items & Pending Dispatch Audit Statement',
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald',
    });
  } else if (activePerspective === 'salesman') {
    const columns: ExcelColumn[] = [
      { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
      { header: 'Gatepass / DC #', key: 'gatepassNo', width: 16 },
      { header: 'Invoice #', key: 'invoiceNo', width: 15 },
      { header: 'Date', key: 'date', width: 14, type: 'date' },
      { header: 'Customer Name', key: 'customerName', width: 26 },
      { header: 'Customer Code', key: 'customerCode', width: 15 },
      { header: 'Page #', key: 'pageNo', width: 10, alignment: 'center' },
      { header: 'Salesman', key: 'salesman', width: 20 },
      { header: 'Product Description', key: 'productName', width: 32 },
      { header: 'Code', key: 'skuCode', width: 14 },
      { header: 'Warehouse', key: 'warehouse', width: 18 },
      { header: 'Order Qty', key: 'orderQty', width: 12, type: 'number', alignment: 'right' },
      { header: 'Dispatched Qty', key: 'dispatchedQty', width: 14, type: 'number', alignment: 'right' },
      { header: 'Held Qty', key: 'holdQty', width: 12, type: 'number', alignment: 'right' },
      { header: 'Unit Rate (Rs.)', key: 'rate', width: 16, type: 'currency', alignment: 'right' },
      { header: 'Held Value (Rs.)', key: 'heldAmount', width: 18, type: 'currency', alignment: 'right' },
    ];

    const exportData: any[] = [];
    let globalIdx = 1;

    (displayRows || []).forEach((s: any) => {
      exportData.push({
        isSectionHeader: true,
        sectionTitle: `SALESMAN: ${s.salesman.toUpperCase()} (${s.itemsCount} Items | ${s.customerCount} Clients | ${s.invoices} Invoices | Held: ${Number(s.totalHeldQty || 0).toLocaleString()} Pcs | Rs. ${Number(s.totalHeldValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})`,
      });

      (s.docs || []).forEach((doc: any) => {
        const cDetails = getCustomerDetails(doc.customerName || '');
        (doc.items || []).forEach((item: any, itIdx: number) => {
          exportData.push({
            idx: itIdx === 0 ? globalIdx : '',
            gatepassNo: itIdx === 0 ? doc.gatepassNo || '-' : '',
            invoiceNo: itIdx === 0 ? doc.invoiceNo || '-' : '',
            date: itIdx === 0 ? doc.date || '-' : '',
            customerName: itIdx === 0 ? doc.customerName || '-' : '',
            customerCode: itIdx === 0 ? cDetails.code || '-' : '',
            pageNo: itIdx === 0 ? cDetails.pageNo || '-' : '',
            salesman: s.salesman,
            productName: item.productName || '-',
            skuCode: item.skuCode || '-',
            warehouse: item.warehouse || '-',
            orderQty: Number(item.orderQty || 0),
            dispatchedQty: Number(item.dispatchedQty || 0),
            holdQty: Number(item.holdQty || 0),
            rate: Number(item.rate || 0),
            heldAmount: Number(item.heldAmount || 0),
          });
        });
        globalIdx++;
      });

      exportData.push({
        isSubtotal: true,
        productName: `Subtotal for ${s.salesman}:`,
        orderQty: Number(s.totalOrderQty || 0),
        dispatchedQty: Number(s.totalDispatchedQty || 0),
        holdQty: Number(s.totalHeldQty || 0),
        heldAmount: Number(s.totalHeldValue || 0),
      });
    });

    await exportToExcel({
      fileName: `Holding_Salesman_Wise_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Salesman Holding',
      companyName: businessName || getBrandConfig().fullName,
      reportTitle: 'Salesman-Wise Holding Inventory & DC/Invoice Audit Statement',
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald',
      summaryRow: false,
    });
  } else if (activePerspective === 'customer') {
    const columns: ExcelColumn[] = [
      { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
      { header: 'Gatepass / DC #', key: 'gatepassNo', width: 16 },
      { header: 'Invoice #', key: 'invoiceNo', width: 15 },
      { header: 'Date', key: 'date', width: 14, type: 'date' },
      { header: 'Customer Name', key: 'customerName', width: 26 },
      { header: 'Customer Code', key: 'customerCode', width: 15 },
      { header: 'Page #', key: 'pageNo', width: 10, alignment: 'center' },
      { header: 'Salesman', key: 'salesman', width: 20 },
      { header: 'Product Description', key: 'productName', width: 32 },
      { header: 'Code', key: 'skuCode', width: 14 },
      { header: 'Warehouse', key: 'warehouse', width: 18 },
      { header: 'Order Qty', key: 'orderQty', width: 12, type: 'number', alignment: 'right' },
      { header: 'Dispatched Qty', key: 'dispatchedQty', width: 14, type: 'number', alignment: 'right' },
      { header: 'Held Qty', key: 'holdQty', width: 12, type: 'number', alignment: 'right' },
      { header: 'Unit Rate (Rs.)', key: 'rate', width: 16, type: 'currency', alignment: 'right' },
      { header: 'Held Value (Rs.)', key: 'heldAmount', width: 18, type: 'currency', alignment: 'right' },
    ];

    const exportData: any[] = [];
    let globalIdx = 1;

    (displayRows || []).forEach((c: any) => {
      exportData.push({
        isSectionHeader: true,
        sectionTitle: `CUSTOMER: ${c.customer.toUpperCase()} (${c.itemsCount} Items | ${c.gatepasses || 0} Gatepasses | ${c.invoices || 0} Invoices | Held: ${Number(c.totalHeldQty || 0).toLocaleString()} Pcs | Rs. ${Number(c.totalHeldValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})`,
      });

      const cDetails = getCustomerDetails(c.customer || '');

      (c.docs || []).forEach((doc: any) => {
        (doc.items || []).forEach((item: any, itIdx: number) => {
          exportData.push({
            idx: itIdx === 0 ? globalIdx : '',
            gatepassNo: itIdx === 0 ? doc.gatepassNo || '-' : '',
            invoiceNo: itIdx === 0 ? doc.invoiceNo || '-' : '',
            date: itIdx === 0 ? doc.date || '-' : '',
            customerName: c.customer,
            customerCode: cDetails.code || '-',
            pageNo: cDetails.pageNo || '-',
            salesman: itIdx === 0 ? doc.salesman || '-' : '',
            productName: item.productName || '-',
            skuCode: item.skuCode || '-',
            warehouse: item.warehouse || '-',
            orderQty: Number(item.orderQty || 0),
            dispatchedQty: Number(item.dispatchedQty || 0),
            holdQty: Number(item.holdQty || 0),
            rate: Number(item.rate || 0),
            heldAmount: Number(item.heldAmount || 0),
          });
        });
        globalIdx++;
      });

      exportData.push({
        isSubtotal: true,
        productName: `Subtotal for ${c.customer}:`,
        orderQty: Number(c.totalOrderQty || 0),
        dispatchedQty: Number(c.totalDispatchedQty || 0),
        holdQty: Number(c.totalHeldQty || 0),
        heldAmount: Number(c.totalHeldValue || 0),
      });
    });

    await exportToExcel({
      fileName: `Holding_Customer_Wise_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Customer Holding',
      companyName: businessName || getBrandConfig().fullName,
      reportTitle: 'Customer-Wise Holding Inventory & DC/Invoice Audit Statement',
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald',
      summaryRow: false,
    });
  } else if (activePerspective === 'gatepass') {
    const columns: ExcelColumn[] = [
      { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
      { header: 'Invoice #', key: 'invoiceNo', width: 16 },
      { header: 'Date', key: 'date', width: 14, type: 'date' },
      { header: 'Customer Name', key: 'customerName', width: 26 },
      { header: 'Customer Code', key: 'customerCode', width: 15 },
      { header: 'Page #', key: 'pageNo', width: 10, alignment: 'center' },
      { header: 'Salesman', key: 'salesman', width: 20 },
      { header: 'Product Description', key: 'productName', width: 32 },
      { header: 'Code', key: 'skuCode', width: 14 },
      { header: 'Warehouse', key: 'warehouse', width: 18 },
      { header: 'Order Qty', key: 'orderQty', width: 12, type: 'number', alignment: 'right' },
      { header: 'Dispatched Qty', key: 'dispatchedQty', width: 14, type: 'number', alignment: 'right' },
      { header: 'Held Qty', key: 'holdQty', width: 12, type: 'number', alignment: 'right' },
      { header: 'Unit Rate (Rs.)', key: 'rate', width: 16, type: 'currency', alignment: 'right' },
      { header: 'Held Value (Rs.)', key: 'heldAmount', width: 18, type: 'currency', alignment: 'right' },
    ];

    const exportData: any[] = [];
    let globalIdx = 1;

    (displayRows || []).forEach((g: any) => {
      exportData.push({
        isSectionHeader: true,
        sectionTitle: `GATEPASS / DC: ${g.gatepassNo} | Date: ${g.date || '-'} | Customer: ${g.customer || '-'} | Salesman: ${g.salesman || '-'} (${g.itemsCount} Items | Total Order: ${Number(g.totalOrderQty || 0).toLocaleString()} Pcs | Dispatched: ${Number(g.totalDispatchedQty || 0).toLocaleString()} Pcs | Held: ${Number(g.totalHeldQty || 0).toLocaleString()} Pcs | Rs. ${Number(g.totalHeldValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})`,
      });

      (g.docs || []).forEach((doc: any) => {
        const cDetails = getCustomerDetails(doc.customerName || g.customer || '');
        (doc.items || []).forEach((item: any, itIdx: number) => {
          exportData.push({
            idx: itIdx === 0 ? globalIdx : '',
            invoiceNo: itIdx === 0 ? doc.invoiceNo || '-' : '',
            date: itIdx === 0 ? doc.date || '-' : '',
            customerName: itIdx === 0 ? doc.customerName || g.customer || '-' : '',
            customerCode: itIdx === 0 ? cDetails.code || '-' : '',
            pageNo: itIdx === 0 ? cDetails.pageNo || '-' : '',
            salesman: itIdx === 0 ? doc.salesman || g.salesman || '-' : '',
            productName: item.productName || '-',
            skuCode: item.skuCode || '-',
            warehouse: item.warehouse || '-',
            orderQty: Number(item.orderQty || 0),
            dispatchedQty: Number(item.dispatchedQty || 0),
            holdQty: Number(item.holdQty || 0),
            rate: Number(item.rate || 0),
            heldAmount: Number(item.heldAmount || 0),
          });
        });
        globalIdx++;
      });

      exportData.push({
        isSubtotal: true,
        productName: `Subtotal for Gatepass ${g.gatepassNo}:`,
        orderQty: Number(g.totalOrderQty || 0),
        dispatchedQty: Number(g.totalDispatchedQty || 0),
        holdQty: Number(g.totalHeldQty || 0),
        heldAmount: Number(g.totalHeldValue || 0),
      });
    });

    await exportToExcel({
      fileName: `Holding_Gatepass_Wise_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Gatepass Holding',
      companyName: businessName || getBrandConfig().fullName,
      reportTitle: 'Gatepass-Wise Holding Inventory & DC/Item Audit Statement',
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald',
      summaryRow: false,
    });
  } else if (activePerspective === 'invoice') {
    const columns: ExcelColumn[] = [
      { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
      { header: 'Gatepass / DC #', key: 'gatepassNo', width: 16 },
      { header: 'Date', key: 'date', width: 14, type: 'date' },
      { header: 'Customer Name', key: 'customerName', width: 26 },
      { header: 'Customer Code', key: 'customerCode', width: 15 },
      { header: 'Page #', key: 'pageNo', width: 10, alignment: 'center' },
      { header: 'Salesman', key: 'salesman', width: 20 },
      { header: 'Product Description', key: 'productName', width: 32 },
      { header: 'Code', key: 'skuCode', width: 14 },
      { header: 'Warehouse', key: 'warehouse', width: 18 },
      { header: 'Order Qty', key: 'orderQty', width: 12, type: 'number', alignment: 'right' },
      { header: 'Dispatched Qty', key: 'dispatchedQty', width: 14, type: 'number', alignment: 'right' },
      { header: 'Held Qty', key: 'holdQty', width: 12, type: 'number', alignment: 'right' },
      { header: 'Unit Rate (Rs.)', key: 'rate', width: 16, type: 'currency', alignment: 'right' },
      { header: 'Held Value (Rs.)', key: 'heldAmount', width: 18, type: 'currency', alignment: 'right' },
    ];

    const exportData: any[] = [];
    let globalIdx = 1;

    (displayRows || []).forEach((inv: any) => {
      exportData.push({
        isSectionHeader: true,
        sectionTitle: `INVOICE: ${inv.invoiceNo} | Date: ${inv.date || '-'} | Customer: ${inv.customer || '-'} | Salesman: ${inv.salesman || '-'} (${inv.itemsCount} Items | Total Order: Rs. ${Number(inv.totalOrderAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} | Held: ${Number(inv.totalHeldQty || 0).toLocaleString()} Pcs | Rs. ${Number(inv.totalHeldValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})`,
      });

      (inv.docs || []).forEach((doc: any) => {
        const cDetails = getCustomerDetails(doc.customerName || inv.customer || '');
        (doc.items || []).forEach((item: any, itIdx: number) => {
          exportData.push({
            idx: itIdx === 0 ? globalIdx : '',
            gatepassNo: itIdx === 0 ? doc.gatepassNo || '-' : '',
            invoiceNo: inv.invoiceNo,
            date: itIdx === 0 ? doc.date || '-' : '',
            customerName: itIdx === 0 ? doc.customerName || inv.customer || '-' : '',
            customerCode: itIdx === 0 ? cDetails.code || '-' : '',
            pageNo: itIdx === 0 ? cDetails.pageNo || '-' : '',
            salesman: itIdx === 0 ? doc.salesman || inv.salesman || '-' : '',
            productName: item.productName || '-',
            skuCode: item.skuCode || '-',
            warehouse: item.warehouse || '-',
            orderQty: Number(item.orderQty || 0),
            dispatchedQty: Number(item.dispatchedQty || 0),
            holdQty: Number(item.holdQty || 0),
            rate: Number(item.rate || 0),
            heldAmount: Number(item.heldAmount || 0),
          });
        });
        globalIdx++;
      });

      exportData.push({
        isSubtotal: true,
        productName: `Subtotal for Invoice ${inv.invoiceNo}:`,
        orderQty: Number(inv.totalOrderQty || 0),
        dispatchedQty: Number(inv.totalDispatchedQty || 0),
        holdQty: Number(inv.totalHeldQty || 0),
        heldAmount: Number(inv.totalHeldValue || 0),
      });
    });

    await exportToExcel({
      fileName: `Holding_Invoice_Wise_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Invoice Holding',
      companyName: businessName || getBrandConfig().fullName,
      reportTitle: 'Invoice-Wise Holding Inventory & DC/Item Audit Statement',
      filterSummary: filterMeta,
      columns,
      data: exportData,
      theme: 'emerald',
      summaryRow: false,
    });
  }
};
