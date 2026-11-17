import { TopStockProduct } from './types';

interface InventoryValuationParams {
  productsList: any[];
  openStocksList: any[];
  purchasesList: any[];
  invoicesList: any[];
  salesReturnsList: any[];
  purchaseReturnsList: any[];
  startOfCurrentMonthStr: string;
}

export const calculateInventoryValuationAndTrends = ({
  productsList,
  openStocksList,
  purchasesList,
  invoicesList,
  salesReturnsList,
  purchaseReturnsList,
  startOfCurrentMonthStr
}: InventoryValuationParams) => {
  let inventoryAssetValue = 0;
  let monthOpeningStockValue = 0;
  let thisMonthStockInflowVal = 0;
  let thisMonthStockOutflowVal = 0;

  let baseOpeningStockValue = 0;
  let totalPurchasesStockVal = 0;
  let totalSalesStockVal = 0;
  let totalSalesReturnsStockVal = 0;
  let totalPurchaseReturnsStockVal = 0;
  let totalStockUnits = 0;
  const productValuationList: TopStockProduct[] = [];

  const priceMap: Record<string, number> = {};
  productsList.forEach((p: any) => {
    const nameKey = String(p.product_name || p.name || '').trim().toLowerCase();
    priceMap[nameKey] = Number(p.retail_price || p.sale_price || 0);
  });

  (productsList || []).forEach((p: any) => {
    const pName = String(p.product_name || p.name || '').trim().toLowerCase();
    const unitPrice = priceMap[pName] || Number(p.retail_price || p.sale_price || 0);

    // 1. Initial Opening Stock from opening_stocks table
    const prodOs = (openStocksList || []).filter(
      (o: any) => String(o.product_name || o.item_name || o.itemName || '').trim().toLowerCase() === pName
    );
    const osQty = prodOs.reduce((acc: number, o: any) => acc + Number(o.quantity || o.qty || 0), 0);

    // 2. Purchases Prior vs This Month
    let priorPurchases = 0;
    let thisMonthPurchases = 0;
    (purchasesList || []).forEach((pur: any) => {
      const pDate = String(pur.created_at || pur.purchase_date || '').split('T')[0];
      const items = Array.isArray(pur.items)
        ? pur.items
        : typeof pur.items === 'string'
        ? JSON.parse(pur.items || '[]')
        : [];
      items.forEach((it: any) => {
        const itName = String(it.product_name || it.itemName || it.itemDetails || '').trim().toLowerCase();
        if (itName === pName) {
          const q = Number(it.quantity || it.qty || 0);
          if (pDate && pDate < startOfCurrentMonthStr) {
            priorPurchases += q;
          } else {
            thisMonthPurchases += q;
          }
        }
      });
    });

    // 3. Sales Prior vs This Month
    let priorSales = 0;
    let thisMonthSales = 0;
    (invoicesList || []).forEach((inv: any) => {
      const iDate = String(inv.created_at || inv.sale_date || inv.invoice_date || '').split('T')[0];
      const items = Array.isArray(inv.items)
        ? inv.items
        : typeof inv.items === 'string'
        ? JSON.parse(inv.items || '[]')
        : [];
      items.forEach((it: any) => {
        const itName = String(it.product_name || it.itemName || it.pDescription || '').trim().toLowerCase();
        if (itName === pName) {
          const q = Number(it.qty || it.quantity || 0);
          if (iDate && iDate < startOfCurrentMonthStr) {
            priorSales += q;
          } else {
            thisMonthSales += q;
          }
        }
      });
    });

    // 4. Sales Returns Prior vs This Month
    let priorSalesReturns = 0;
    let thisMonthSalesReturns = 0;
    (salesReturnsList || []).forEach((sr: any) => {
      const rDate = String(sr.created_at || sr.return_date || '').split('T')[0];
      const items = Array.isArray(sr.items)
        ? sr.items
        : typeof sr.items === 'string'
        ? JSON.parse(sr.items || '[]')
        : [];
      items.forEach((it: any) => {
        const itName = String(it.product_name || it.item_name || it.itemName || '').trim().toLowerCase();
        if (itName === pName) {
          const q = Number(it.quantity || it.qty || 0);
          if (rDate && rDate < startOfCurrentMonthStr) {
            priorSalesReturns += q;
          } else {
            thisMonthSalesReturns += q;
          }
        }
      });
    });

    // 5. Purchase Returns Prior vs This Month
    let priorPurchaseReturns = 0;
    let thisMonthPurchaseReturns = 0;
    (purchaseReturnsList || []).forEach((pr: any) => {
      const prDate = String(pr.created_at || pr.return_date || '').split('T')[0];
      const items = Array.isArray(pr.items)
        ? pr.items
        : typeof pr.items === 'string'
        ? JSON.parse(pr.items || '[]')
        : [];
      items.forEach((it: any) => {
        const itName = String(it.product_name || it.item_name || it.itemName || '').trim().toLowerCase();
        if (itName === pName) {
          const q = Number(it.quantity || it.qty || 0);
          if (prDate && prDate < startOfCurrentMonthStr) {
            priorPurchaseReturns += q;
          } else {
            thisMonthPurchaseReturns += q;
          }
        }
      });
    });

    const monthOpeningQty =
      osQty + priorPurchases - priorSales + priorSalesReturns - priorPurchaseReturns;
    const netThisMonthIn = thisMonthPurchases + thisMonthSalesReturns;
    const netThisMonthOut = thisMonthSales + thisMonthPurchaseReturns;
    const currentPhysicalQty = monthOpeningQty + netThisMonthIn - netThisMonthOut;

    // Monthly Accumulations
    monthOpeningStockValue += monthOpeningQty * unitPrice;
    thisMonthStockInflowVal += netThisMonthIn * unitPrice;
    thisMonthStockOutflowVal += netThisMonthOut * unitPrice;
    inventoryAssetValue += currentPhysicalQty * unitPrice;

    // All-Time / Lifecycle Accumulations
    baseOpeningStockValue += osQty * unitPrice;
    totalPurchasesStockVal += (priorPurchases + thisMonthPurchases) * unitPrice;
    totalSalesStockVal += (priorSales + thisMonthSales) * unitPrice;
    totalSalesReturnsStockVal += (priorSalesReturns + thisMonthSalesReturns) * unitPrice;
    totalPurchaseReturnsStockVal += (priorPurchaseReturns + thisMonthPurchaseReturns) * unitPrice;
    totalStockUnits += currentPhysicalQty;

    if (currentPhysicalQty > 0) {
      productValuationList.push({
        id: p.id || pName,
        name: p.product_name || pName,
        qty: currentPhysicalQty,
        unitPrice,
        totalValuation: currentPhysicalQty * unitPrice
      });
    }
  });

  const thisMonthStockMovement = thisMonthStockInflowVal - thisMonthStockOutflowVal;
  const topStockProducts = productValuationList
    .sort((a, b) => b.totalValuation - a.totalValuation)
    .slice(0, 4);

  return {
    inventoryAssetValue,
    monthOpeningStockValue,
    thisMonthStockInflowVal,
    thisMonthStockOutflowVal,
    thisMonthStockMovement,
    baseOpeningStockValue,
    totalPurchasesStockVal,
    totalSalesStockVal,
    totalSalesReturnsStockVal,
    totalPurchaseReturnsStockVal,
    totalStockUnits,
    topStockProducts
  };
};

export const calculateFinancialTrends = ({
  invoicesList,
  salesReturnsList,
  purchasesList,
  purchaseReturnsList,
  currentYear,
  currentMonth
}: {
  invoicesList: any[];
  salesReturnsList: any[];
  purchasesList: any[];
  purchaseReturnsList: any[];
  currentYear: number;
  currentMonth: number;
}) => {
  const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlySalesTrendMap: Record<string, { sales: number; purchases: number }> = {};
  const cashFlowTrendMap: Record<string, { inflow: number; outflow: number }> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const key = `${monthsName[d.getMonth()]} ${d.getFullYear()}`;
    monthlySalesTrendMap[key] = { sales: 0, purchases: 0 };
    cashFlowTrendMap[key] = { inflow: 0, outflow: 0 };
  }

  invoicesList.forEach((inv: any) => {
    const d = new Date(inv.created_at || inv.invoice_date);
    if (!isNaN(d.getTime())) {
      const key = `${monthsName[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlySalesTrendMap[key]) {
        monthlySalesTrendMap[key].sales += Number(inv.total_amount || 0);
      }
      if (cashFlowTrendMap[key]) {
        cashFlowTrendMap[key].inflow += Number(inv.cash_amount_paid || inv.total_amount || 0);
      }
    }
  });

  // Deduct Sales Returns from Monthly Trend
  salesReturnsList.forEach((ret: any) => {
    const d = new Date(ret.created_at || ret.return_date);
    if (!isNaN(d.getTime())) {
      const key = `${monthsName[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlySalesTrendMap[key]) {
        monthlySalesTrendMap[key].sales = Math.max(
          0,
          monthlySalesTrendMap[key].sales - Number(ret.total_amount || ret.total_net_amount || 0)
        );
      }
    }
  });

  purchasesList.forEach((pur: any) => {
    const d = new Date(pur.created_at || pur.purchase_date);
    if (!isNaN(d.getTime())) {
      const key = `${monthsName[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlySalesTrendMap[key]) {
        monthlySalesTrendMap[key].purchases += Number(pur.total_amount || 0);
      }
      if (cashFlowTrendMap[key]) {
        cashFlowTrendMap[key].outflow += Number(pur.amount_paid_now || pur.total_amount || 0);
      }
    }
  });

  // Deduct Purchase Returns from Monthly Trend
  purchaseReturnsList.forEach((pret: any) => {
    const d = new Date(pret.created_at || pret.return_date);
    if (!isNaN(d.getTime())) {
      const key = `${monthsName[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlySalesTrendMap[key]) {
        monthlySalesTrendMap[key].purchases = Math.max(
          0,
          monthlySalesTrendMap[key].purchases - Number(pret.total_amount || pret.total_net_amount || 0)
        );
      }
    }
  });

  const monthlySalesTrend = Object.keys(monthlySalesTrendMap).map((k) => ({
    month: k,
    sales: monthlySalesTrendMap[k].sales,
    purchases: monthlySalesTrendMap[k].purchases
  }));

  const cashFlowTrend = Object.keys(cashFlowTrendMap).map((k) => ({
    month: k,
    inflow: cashFlowTrendMap[k].inflow,
    outflow: cashFlowTrendMap[k].outflow
  }));

  return { monthlySalesTrend, cashFlowTrend };
};
