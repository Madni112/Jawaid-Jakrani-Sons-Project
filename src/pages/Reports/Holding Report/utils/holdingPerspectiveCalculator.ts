import { HoldingItemRow } from '../types/holdingReportTypes';

export interface CalculatedKpis {
  totalItems: number;
  totalHeldQty: number;
  totalHeldValue: number;
  totalOrderQty: number;
  totalOrderValue: number;
  uniqueGatepasses: number;
  uniqueInvoices: number;
  uniqueCustomers: number;
  uniqueSalesmen: number;
}

export interface ComputedPerspectiveResult {
  displayRows: any[];
  kpis: CalculatedKpis;
}

export const computeHoldingPerspectives = (
  rawList: HoldingItemRow[],
  activePerspective: string
): ComputedPerspectiveResult => {
  let totalHeldQty = 0;
  let totalHeldValue = 0;
  let totalOrderQty = 0;
  let totalOrderValue = 0;
  const affectedGPs = new Set<string>();
  const affectedInvs = new Set<string>();
  const affectedCusts = new Set<string>();
  const affectedSMs = new Set<string>();

  rawList.forEach((row) => {
    totalHeldQty += Number(row.holdQty || 0);
    totalHeldValue += Number(row.heldAmount || 0);
    totalOrderQty += Number(row.orderQty || 0);
    totalOrderValue += Number(row.totalOrderAmount || 0);
    if (row.gatepassNo) affectedGPs.add(row.gatepassNo);
    if (row.invoiceNo) affectedInvs.add(row.invoiceNo);
    if (row.customerName) affectedCusts.add(row.customerName);
    if (row.salesman) affectedSMs.add(row.salesman);
  });

  const calculatedKpis: CalculatedKpis = {
    totalItems: rawList.length,
    totalHeldQty,
    totalHeldValue,
    totalOrderQty,
    totalOrderValue,
    uniqueGatepasses: affectedGPs.size,
    uniqueInvoices: affectedInvs.size,
    uniqueCustomers: affectedCusts.size,
    uniqueSalesmen: affectedSMs.size,
  };

  if (activePerspective === 'salesman') {
    const map: Record<string, any> = {};
    rawList.forEach((row) => {
      const smKey = row.salesman || 'Unassigned';
      if (!map[smKey]) {
        map[smKey] = {
          salesman: smKey,
          itemsCount: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          totalOrderQty: 0,
          totalDispatchedQty: 0,
          custSet: new Set(),
          invSet: new Set(),
          gpSet: new Set(),
          docMap: {},
        };
      }
      map[smKey].itemsCount += 1;
      map[smKey].totalHeldQty += Number(row.holdQty || 0);
      map[smKey].totalHeldValue += Number(row.heldAmount || 0);
      map[smKey].totalOrderQty += Number(row.orderQty || 0);
      map[smKey].totalDispatchedQty += Number(row.dispatchedQty || 0);
      if (row.customerName) map[smKey].custSet.add(row.customerName);
      if (row.invoiceNo) map[smKey].invSet.add(row.invoiceNo);
      if (row.gatepassNo) map[smKey].gpSet.add(row.gatepassNo);

      const docKey = `${row.gatepassNo || 'GP'}_${row.invoiceNo || 'INV'}_${row.date || ''}_${row.customerName || ''}`;
      if (!map[smKey].docMap[docKey]) {
        map[smKey].docMap[docKey] = {
          id: docKey,
          gatepassNo: row.gatepassNo,
          invoiceNo: row.invoiceNo,
          date: row.date,
          customerName: row.customerName,
          salesman: row.salesman,
          warehouse: row.warehouse,
          totalOrderQty: 0,
          totalDispatchedQty: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          items: [],
        };
      }
      map[smKey].docMap[docKey].totalOrderQty += Number(row.orderQty || 0);
      map[smKey].docMap[docKey].totalDispatchedQty += Number(row.dispatchedQty || 0);
      map[smKey].docMap[docKey].totalHeldQty += Number(row.holdQty || 0);
      map[smKey].docMap[docKey].totalHeldValue += Number(row.heldAmount || 0);
      map[smKey].docMap[docKey].items.push(row);
    });
    const rows = Object.values(map)
      .map((s: any) => ({
        salesman: s.salesman,
        itemsCount: s.itemsCount,
        totalHeldQty: s.totalHeldQty,
        totalHeldValue: s.totalHeldValue,
        totalOrderQty: s.totalOrderQty,
        totalDispatchedQty: s.totalDispatchedQty,
        customerCount: s.custSet.size,
        invoices: s.invSet.size,
        gatepasses: s.gpSet.size,
        docs: Object.values(s.docMap),
      }))
      .sort((a, b) => b.totalHeldValue - a.totalHeldValue);
    return { displayRows: rows, kpis: calculatedKpis };
  }

  if (activePerspective === 'customer') {
    const map: Record<string, any> = {};
    rawList.forEach((row) => {
      const cKey = row.customerName || 'Counter Buyer';
      if (!map[cKey]) {
        map[cKey] = {
          customer: cKey,
          itemsCount: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          totalOrderQty: 0,
          totalDispatchedQty: 0,
          gpSet: new Set(),
          invSet: new Set(),
          smSet: new Set(),
          docMap: {},
        };
      }
      map[cKey].itemsCount += 1;
      map[cKey].totalHeldQty += Number(row.holdQty || 0);
      map[cKey].totalHeldValue += Number(row.heldAmount || 0);
      map[cKey].totalOrderQty += Number(row.orderQty || 0);
      map[cKey].totalDispatchedQty += Number(row.dispatchedQty || 0);
      if (row.gatepassNo) map[cKey].gpSet.add(row.gatepassNo);
      if (row.invoiceNo) map[cKey].invSet.add(row.invoiceNo);
      if (row.salesman) map[cKey].smSet.add(row.salesman);

      const docKey = `${row.gatepassNo || 'GP'}_${row.invoiceNo || 'INV'}_${row.date || ''}_${row.salesman || ''}`;
      if (!map[cKey].docMap[docKey]) {
        map[cKey].docMap[docKey] = {
          id: docKey,
          gatepassNo: row.gatepassNo,
          invoiceNo: row.invoiceNo,
          date: row.date,
          customerName: row.customerName,
          salesman: row.salesman,
          warehouse: row.warehouse,
          totalOrderQty: 0,
          totalDispatchedQty: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          items: [],
        };
      }
      map[cKey].docMap[docKey].totalOrderQty += Number(row.orderQty || 0);
      map[cKey].docMap[docKey].totalDispatchedQty += Number(row.dispatchedQty || 0);
      map[cKey].docMap[docKey].totalHeldQty += Number(row.holdQty || 0);
      map[cKey].docMap[docKey].totalHeldValue += Number(row.heldAmount || 0);
      map[cKey].docMap[docKey].items.push(row);
    });
    const rows = Object.values(map)
      .map((c: any) => ({
        customer: c.customer,
        itemsCount: c.itemsCount,
        totalHeldQty: c.totalHeldQty,
        totalHeldValue: c.totalHeldValue,
        totalOrderQty: c.totalOrderQty,
        totalDispatchedQty: c.totalDispatchedQty,
        gatepasses: c.gpSet.size,
        invoices: c.invSet.size,
        salesmen: c.smSet.size,
        docs: Object.values(c.docMap),
      }))
      .sort((a, b) => b.totalHeldValue - a.totalHeldValue);
    return { displayRows: rows, kpis: calculatedKpis };
  }

  if (activePerspective === 'gatepass') {
    const map: Record<string, any> = {};
    rawList.forEach((row) => {
      const gpKey = row.gatepassNo || 'Direct';
      if (!map[gpKey]) {
        map[gpKey] = {
          gatepassNo: gpKey,
          customer: row.customerName,
          salesman: row.salesman,
          date: row.date,
          itemsCount: 0,
          totalOrderQty: 0,
          totalDispatchedQty: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          status: row.status,
          invSet: new Set(),
          docMap: {},
          items: [],
        };
      }
      map[gpKey].itemsCount += 1;
      map[gpKey].totalOrderQty += Number(row.orderQty || 0);
      map[gpKey].totalDispatchedQty += Number(row.dispatchedQty || 0);
      map[gpKey].totalHeldQty += Number(row.holdQty || 0);
      map[gpKey].totalHeldValue += Number(row.heldAmount || 0);
      if (row.invoiceNo) map[gpKey].invSet.add(row.invoiceNo);

      const docKey = `${row.invoiceNo || 'INV'}_${row.date || ''}`;
      if (!map[gpKey].docMap[docKey]) {
        map[gpKey].docMap[docKey] = {
          id: docKey,
          invoiceNo: row.invoiceNo,
          date: row.date,
          customerName: row.customerName,
          salesman: row.salesman,
          warehouse: row.warehouse,
          totalOrderQty: 0,
          totalDispatchedQty: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          items: [],
        };
      }
      map[gpKey].docMap[docKey].totalOrderQty += Number(row.orderQty || 0);
      map[gpKey].docMap[docKey].totalDispatchedQty += Number(row.dispatchedQty || 0);
      map[gpKey].docMap[docKey].totalHeldQty += Number(row.holdQty || 0);
      map[gpKey].docMap[docKey].totalHeldValue += Number(row.heldAmount || 0);
      map[gpKey].docMap[docKey].items.push(row);
      map[gpKey].items.push(row);
    });
    const rows = Object.values(map)
      .map((g: any) => ({
        ...g,
        invoices: g.invSet.size,
        docs: Object.values(g.docMap),
      }))
      .sort((a, b) => b.totalHeldValue - a.totalHeldValue);
    return { displayRows: rows, kpis: calculatedKpis };
  }

  if (activePerspective === 'invoice') {
    const map: Record<string, any> = {};
    rawList.forEach((row) => {
      const invKey = row.invoiceNo || 'Direct';
      if (!map[invKey]) {
        map[invKey] = {
          invoiceNo: invKey,
          customer: row.customerName,
          salesman: row.salesman,
          date: row.date,
          itemsCount: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          totalOrderQty: 0,
          totalDispatchedQty: 0,
          totalOrderAmount: 0,
          gpSet: new Set(),
          docMap: {},
          items: [],
        };
      }
      map[invKey].itemsCount += 1;
      map[invKey].totalHeldQty += Number(row.holdQty || 0);
      map[invKey].totalHeldValue += Number(row.heldAmount || 0);
      map[invKey].totalOrderQty += Number(row.orderQty || 0);
      map[invKey].totalDispatchedQty += Number(row.dispatchedQty || 0);
      map[invKey].totalOrderAmount += Number(row.totalOrderAmount || 0);
      if (row.gatepassNo) map[invKey].gpSet.add(row.gatepassNo);

      const docKey = `${row.gatepassNo || 'GP'}_${row.date || ''}`;
      if (!map[invKey].docMap[docKey]) {
        map[invKey].docMap[docKey] = {
          id: docKey,
          gatepassNo: row.gatepassNo,
          date: row.date,
          customerName: row.customerName,
          salesman: row.salesman,
          warehouse: row.warehouse,
          totalOrderQty: 0,
          totalDispatchedQty: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          items: [],
        };
      }
      map[invKey].docMap[docKey].totalOrderQty += Number(row.orderQty || 0);
      map[invKey].docMap[docKey].totalDispatchedQty += Number(row.dispatchedQty || 0);
      map[invKey].docMap[docKey].totalHeldQty += Number(row.holdQty || 0);
      map[invKey].docMap[docKey].totalHeldValue += Number(row.heldAmount || 0);
      map[invKey].docMap[docKey].items.push(row);
      map[invKey].items.push(row);
    });
    const rows = Object.values(map)
      .map((inv: any) => ({
        ...inv,
        gatepasses: inv.gpSet.size,
        docs: Object.values(inv.docMap),
      }))
      .sort((a, b) => b.totalHeldValue - a.totalHeldValue);
    return { displayRows: rows, kpis: calculatedKpis };
  }

  // Default: Detailed Itemized View (Grouped by Invoice / DC Document with multi-item sub-rows)
  const docMap: Record<string, any> = {};
  rawList.forEach((row) => {
    const docKey = `${row.gatepassNo || 'GP'}_${row.invoiceNo || 'INV'}_${row.date || ''}_${row.customerName || ''}`;
    if (!docMap[docKey]) {
      docMap[docKey] = {
        id: docKey,
        gatepassNo: row.gatepassNo,
        invoiceNo: row.invoiceNo,
        date: row.date,
        customerName: row.customerName,
        salesman: row.salesman,
        itemsCount: 0,
        totalOrderQty: 0,
        totalDispatchedQty: 0,
        totalHeldQty: 0,
        totalHeldValue: 0,
        items: [],
      };
    }
    docMap[docKey].itemsCount += 1;
    docMap[docKey].totalOrderQty += Number(row.orderQty || 0);
    docMap[docKey].totalDispatchedQty += Number(row.dispatchedQty || 0);
    docMap[docKey].totalHeldQty += Number(row.holdQty || 0);
    docMap[docKey].totalHeldValue += Number(row.heldAmount || 0);
    docMap[docKey].items.push(row);
  });
  const docRows = Object.values(docMap);
  return { displayRows: docRows, kpis: calculatedKpis };
};
