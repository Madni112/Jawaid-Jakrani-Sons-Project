import { formatStockWithBoxesAndPcs, getWarehouseAvailableStock } from '../../../../utils/stockCalculator';

export const getOverallStockNumber = (p: any, totalStockMap: Record<string, number>): number => {
  if (!p) return 0;
  const name = String(p.product_name || p.itemName || '').toLowerCase().trim();
  if (totalStockMap[name] !== undefined) return totalStockMap[name];
  return Number(p.current_stock || 0);
};

export const formatProductStockHelper = (
  p: any,
  totalStockMap: Record<string, number>,
  forcedQty?: number
): string => {
  if (!p) return '-';
  const total = forcedQty !== undefined ? forcedQty : getOverallStockNumber(p, totalStockMap);
  return formatStockWithBoxesAndPcs(total, p).inlineText;
};

export const getWarehouseStockInfoHelper = (
  productName: string,
  warehouseName: string,
  productList: any[],
  stockDataset: any,
  totalStockMap: Record<string, number>
) => {
  if (!productName || !warehouseName) return { text: '-', hasStock: false, qty: 0 };
  const p = productList.find(pr => (pr.product_name || '').toLowerCase().trim() === productName.toLowerCase().trim());
  let qty = 0;
  if (stockDataset) {
    qty = getWarehouseAvailableStock(productName, warehouseName, stockDataset);
  } else if (p) {
    qty = Number(p.current_stock || 0);
  }
  const formatted = formatProductStockHelper(p || { product_name: productName }, totalStockMap, qty);
  return {
    text: formatted,
    hasStock: qty > 0,
    qty
  };
};
