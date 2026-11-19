import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { fetchFinancialMetrics, FinancialSummary } from '../../../service/financialCalculations';
import {
  ReceivableInvoice,
  PayableVendor,
  TrendingProduct,
  LowStockAlert,
  HoldingItemData,
  CashTransaction
} from '../types/dashboardTypes';

export interface DashboardOperationalData {
  metrics: FinancialSummary;
  receivablesList: ReceivableInvoice[];
  payablesList: PayableVendor[];
  trendingProducts: TrendingProduct[];
  lowStockProducts: LowStockAlert[];
  holdingItems: HoldingItemData[];
  cashTransactions: CashTransaction[];
  customerSalesDaily: { dates: string[]; sales: number[] };
  customerSalesMonthly: { months: string[]; sales: number[] };
}

export const fetchCompleteDashboardOperationalData = async (): Promise<DashboardOperationalData> => {
  // Fetch financial metrics & database tables in parallel
  const [
    metricsData,
    invoicesRes,
    productsRes,
    openStocksRes,
    purchasesRes,
    salesReturnsRes,
    purchaseReturnsRes,
    vouchersRes,
    dcsRes,
    custRecoveriesRes,
    customersRes,
    vendorsRes
  ] = await Promise.all([
    fetchFinancialMetrics(),
    fetchAllPages(supabase.from('sales_invoices').select('*').order('created_at', { ascending: false })),
    fetchAllPages(supabase.from('products').select('*')),
    fetchAllPages(supabase.from('opening_stocks').select('*')),
    fetchAllPages(supabase.from('supplier_purchases').select('*')),
    fetchAllPages(supabase.from('sales_returns').select('*')),
    fetchAllPages(supabase.from('purchase_returns').select('*')),
    fetchAllPages(supabase.from('financial_vouchers').select('*').order('created_at', { ascending: false })),
    fetchAllPages(supabase.from('delivery_challans').select('*').order('created_at', { ascending: false })),
    fetchAllPages(supabase.from('customer_recoveries').select('*')),
    fetchAllPages(supabase.from('customers').select('*').order('customerName', { ascending: true })),
    fetchAllPages(supabase.from('vendors').select('*').order('vendor_name', { ascending: true }))
  ]);

  const invoices = invoicesRes.data || [];
  const products = productsRes.data || [];
  const openStocks = openStocksRes.data || [];
  const purchases = purchasesRes.data || [];
  const salesReturns = salesReturnsRes.data || [];
  const vouchers = vouchersRes.data || [];
  const dcs = dcsRes.data || [];
  const recoveries = custRecoveriesRes.data || [];
  const vendorsData = vendorsRes?.data || [];
  const customersData = customersRes?.data || [];

  // ==========================================
  // 1. CUSTOMER RECEIVABLES WITH AGING PENDING
  // ==========================================
  const extractedReceivables: ReceivableInvoice[] = [];

  customersData.forEach((c: any) => {
    const rawBal = Number(
      c.currentBalance !== undefined && c.currentBalance !== null && c.currentBalance !== ''
        ? c.currentBalance
        : c.balance !== undefined && c.balance !== null && c.balance !== ''
        ? c.balance
        : c.opening_balance || 0
    );
    const nature = String(c.balance_nature || c.balanceNature || '').toLowerCase();
    let effectiveBal = rawBal;
    if (nature.includes('cr') || nature.includes('credit')) {
      effectiveBal = -Math.abs(rawBal);
    } else if (rawBal > 0) {
      effectiveBal = Math.abs(rawBal);
    }

    if (effectiveBal > 0.5) {
      extractedReceivables.push({
        id: `cust-${c.id}`,
        invoiceNo: c.customer_code || `CUST-${String(c.id).padStart(3, '0')}`,
        customerName: c.customerName || 'Customer',
        salesman: c.city ? `City: ${c.city}` : c.primaryPhone || 'Direct Ledger',
        invoiceDate: c.created_at ? c.created_at.split('T')[0] : 'Opening Bal',
        totalAmount: effectiveBal,
        paidAmount: 0,
        outstandingBalance: effectiveBal,
        daysPending: 30
      });
    }
  });

  // Map recoveries per invoice
  const invoiceRecoveriesMap: Record<string, number> = {};
  recoveries.forEach((rec: any) => {
    const invId = String(rec.invoice_id || rec.invoiceId || rec.invoice_no || '').trim();
    if (invId) {
      const amt = Number(rec.net_collected_amount || rec.amount_paid || rec.amount || 0);
      invoiceRecoveriesMap[invId] = (invoiceRecoveriesMap[invId] || 0) + amt;
    }
  });

  // Map sales returns per invoice
  const invoiceReturnsMap: Record<string, number> = {};
  salesReturns.forEach((ret: any) => {
    const invNo = String(ret.invoice_no || ret.invoice_id || '').trim();
    if (invNo) {
      const retAmt = Number(ret.total_amount || ret.total_net_amount || 0);
      invoiceReturnsMap[invNo] = (invoiceReturnsMap[invNo] || 0) + retAmt;
    }
  });

  const today = new Date();

  invoices.forEach((inv: any) => {
    const total = Number(inv.total_amount || 0);
    const initialPaid = Number(inv.cash_amount_paid || inv.paid_amount || 0);
    const invKey = String(inv.id).trim();
    const invNoKey = String(inv.invoice_no || '').trim();

    const extraRecoveries =
      (invoiceRecoveriesMap[invKey] || 0) + (invNoKey ? invoiceRecoveriesMap[invNoKey] || 0 : 0);
    const retDeductions =
      (invoiceReturnsMap[invKey] || 0) + (invNoKey ? invoiceReturnsMap[invNoKey] || 0 : 0);

    const outstanding = Math.max(0, total - initialPaid - extraRecoveries - retDeductions);

    if (outstanding > 0.5) {
      const rawDate = inv.sale_date || inv.invoice_date || inv.created_at || '';
      const invDate = rawDate ? new Date(rawDate) : today;
      const diffTime = Math.max(0, today.getTime() - invDate.getTime());
      const daysPending = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      extractedReceivables.push({
        id: inv.id,
        invoiceNo: inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`,
        customerName: inv.customer_name || 'Walk-in Customer',
        salesman: inv.salesman || 'Direct Sales',
        invoiceDate: rawDate ? rawDate.split('T')[0] : 'Today',
        totalAmount: total,
        paidAmount: initialPaid + extraRecoveries,
        outstandingBalance: outstanding,
        daysPending
      });
    }
  });

  extractedReceivables.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

  // ==========================================
  // 1b. VENDOR PAYABLES LEDGER
  // ==========================================
  const extractedPayables: PayableVendor[] = [];
  vendorsData.forEach((v: any) => {
    const rawBal = Number(
      v.current_balance !== undefined && v.current_balance !== null
        ? v.current_balance
        : v.balance !== undefined && v.balance !== null
        ? v.balance
        : v.opening_balance || 0
    );
    const nature = String(v.balance_nature || v.balanceNature || '').toLowerCase();
    let effectiveBal = rawBal;
    if (nature.includes('dr') || nature.includes('debit')) {
      effectiveBal = -Math.abs(rawBal);
    } else if (rawBal > 0) {
      effectiveBal = Math.abs(rawBal);
    }

    if (effectiveBal > 0.5) {
      extractedPayables.push({
        id: v.id,
        vendorCode: v.vendor_code || v.vendorCode || `V-${String(v.id).padStart(3, '0')}`,
        vendorName: v.vendor_name || v.name || 'Vendor / Mill',
        city: v.city || v.address || 'Cloth Market',
        phone: v.phone || v.phone_no || v.cell_no || '-',
        outstandingBalance: effectiveBal
      });
    }
  });

  // Add unpaid purchases
  purchases.forEach((pur: any) => {
    const tot = Number(pur.total_amount || 0);
    const initialPaid =
      Number(pur.cash_amount_paid || 0) + Number(pur.bank_amount_paid || 0) ||
      Number(pur.amount_paid || 0);
    const outstanding = Math.max(0, tot - initialPaid);
    if (outstanding > 0.5) {
      extractedPayables.push({
        id: `pur-${pur.id}`,
        vendorCode: pur.purchase_no || `PUR-${pur.id}`,
        vendorName: pur.supplier_name || pur.supplierName || 'Wholesale Supplier',
        city: pur.destination_warehouse || pur.warehouse || 'Warehouse',
        phone: '-',
        outstandingBalance: outstanding
      });
    }
  });

  extractedPayables.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

  // ==========================================
  // 2. TRENDING PRODUCTS (REVENUE & VELOCITY)
  // ==========================================
  const productSalesMap: Record<
    string,
    { name: string; category: string; sku: string; revenue: number; units: number; count: number }
  > = {};
  let totalSalesGross = 0;

  invoices.forEach((inv: any) => {
    let items: any[] = [];
    if (Array.isArray(inv.items)) {
      items = inv.items;
    } else if (typeof inv.items === 'string') {
      try {
        items = JSON.parse(inv.items);
      } catch (_) {
        items = [];
      }
    }

    items.forEach((item: any) => {
      const pName = String(
        item.product_name || item.itemName || item.pDescription || item.name || 'Standard Product'
      ).trim();
      const qty = Number(item.qty || item.quantity || item.orderQty || 1);
      const rate = Number(item.rate || item.rp || item.price || 0);
      const lineTotal = Number(item.amount || item.total || qty * rate);

      if (!productSalesMap[pName]) {
        productSalesMap[pName] = {
          name: pName,
          category: item.category || 'General Catalog',
          sku: item.sku || item.skuCode || 'SKU-GEN',
          revenue: 0,
          units: 0,
          count: 0
        };
      }

      productSalesMap[pName].revenue += lineTotal;
      productSalesMap[pName].units += qty;
      productSalesMap[pName].count += 1;
      totalSalesGross += lineTotal;
    });
  });

  const rankedProducts: TrendingProduct[] = Object.keys(productSalesMap)
    .map((key, idx) => {
      const p = productSalesMap[key];
      const pct = totalSalesGross > 0 ? (p.revenue / totalSalesGross) * 100 : 0;
      return {
        id: idx + 1,
        name: p.name,
        category: p.category,
        sku: p.sku,
        totalRevenue: p.revenue,
        unitsSold: p.units,
        transactionCount: p.count,
        percentageOfTotal: Math.min(100, Math.max(1, pct))
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 8);

  // ==========================================
  // 3. LOW STOCK / MINIMUM LIMIT ALERTS
  // ==========================================
  const stockAlerts: LowStockAlert[] = [];

  products.forEach((prod: any) => {
    const prodName = String(prod.product_name || '').trim().toLowerCase();
    const minLimit = Number(prod.min_stock || prod.reorder_level || prod.minimum_limit || 10);

    const totalOpening = openStocks
      .filter((os: any) => {
        const osName = String(os.product_name || os.item_name || os.itemName || '').trim().toLowerCase();
        return osName === prodName || (prodName && osName.includes(prodName));
      })
      .reduce((sum: number, os: any) => sum + Number(os.quantity || os.qty || 0), 0);

    let totalPurchased = 0;
    purchases.forEach((p: any) => {
      const pItems = Array.isArray(p.items)
        ? p.items
        : typeof p.items === 'string'
        ? JSON.parse(p.items || '[]')
        : [];
      pItems.forEach((pi: any) => {
        const piName = String(pi.product_name || pi.itemName || pi.itemDetails || '').trim().toLowerCase();
        if (piName === prodName || (prodName && piName.includes(prodName))) {
          totalPurchased += Number(pi.quantity || pi.qty || 0);
        }
      });
    });

    let totalSold = 0;
    invoices.forEach((inv: any) => {
      const invItems = Array.isArray(inv.items)
        ? inv.items
        : typeof inv.items === 'string'
        ? JSON.parse(inv.items || '[]')
        : [];
      invItems.forEach((ii: any) => {
        const iiName = String(ii.product_name || ii.itemName || ii.pDescription || '').trim().toLowerCase();
        if (iiName === prodName || (prodName && iiName.includes(prodName))) {
          totalSold += Number(ii.qty || ii.quantity || 0);
        }
      });
    });

    let totalReturned = 0;
    salesReturns.forEach((sr: any) => {
      const srItems = Array.isArray(sr.items)
        ? sr.items
        : typeof sr.items === 'string'
        ? JSON.parse(sr.items || '[]')
        : [];
      srItems.forEach((sri: any) => {
        const sriName = String(sri.product_name || sri.item_name || sri.itemName || '').trim().toLowerCase();
        if (sriName === prodName || (prodName && sriName.includes(prodName))) {
          totalReturned += Number(sri.quantity || sri.qty || 0);
        }
      });
    });

    const currentStock = Math.max(0, totalOpening + totalPurchased - totalSold + totalReturned);

    if (currentStock <= minLimit) {
      stockAlerts.push({
        id: prod.id,
        name: prod.product_name || 'Item',
        category: prod.category || 'Standard Catalog',
        warehouse: prod.warehouse || prod.location || 'Main Warehouse',
        currentStock,
        minLimit,
        deficit: Math.max(0, minLimit - currentStock),
        unit: prod.unit || 'Units'
      });
    }
  });

  stockAlerts.sort((a, b) => b.deficit - a.deficit);

  // ==========================================
  // 4. HOLDING ITEMS (WAREHOUSE & INVOICE WISE)
  // ==========================================
  const extractedHolding: HoldingItemData[] = [];

  dcs.forEach((dc: any) => {
    let items: any[] = [];
    if (Array.isArray(dc.items)) {
      items = dc.items;
    } else if (typeof dc.items === 'string') {
      try {
        items = JSON.parse(dc.items);
      } catch (_) {
        items = [];
      }
    }

    const gatepassNo = dc.challan_no || `DC-${String(dc.id).padStart(4, '0')}`;
    const invoiceNo = dc.invoice_no || `INV-${String(dc.invoice_id || dc.id).padStart(4, '0')}`;
    const customerName = dc.customer_name || 'Direct Buyer';
    const salesman = dc.salesman || 'Direct Staff';
    const warehouseGuy =
      dc.warehouse_guy ||
      dc.warehouse_incharge ||
      dc.dispatch_warehouse ||
      dc.created_by ||
      'Main Warehouse Storekeeper';
    const docDate = dc.challan_date || dc.dc_date || String(dc.created_at || '').split('T')[0];

    items.forEach((item: any, idx: number) => {
      const orderQty = Number(item.orderQty ?? item.qty ?? item.quantity ?? 0);
      const dispatchedQty = Number(
        item.dispatchedQty ?? (dc.status === 'Approved' || dc.status === 'Dispatched' ? orderQty : 0)
      );
      const holdQty = Number(
        item.holdQty !== undefined ? item.holdQty : Math.max(0, orderQty - dispatchedQty)
      );
      const rate = Number(item.rate || item.rp || 0);

      if (holdQty > 0) {
        extractedHolding.push({
          id: `${dc.id}-${idx}`,
          dcId: dc.id,
          gatepassNo,
          invoiceNo,
          customerName,
          salesman,
          warehouseGuy,
          productName: item.pDescription || item.itemName || item.product_name || 'Inventory Item',
          orderQty,
          dispatchedQty,
          holdQty,
          rate,
          heldAmount: holdQty * rate,
          date: docDate
        });
      }
    });
  });

  // ==========================================
  // 5. CUSTOMER SALES GRAPH (DAILY & MONTHLY)
  // ==========================================
  const dailyMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyMap[key] = 0;
  }

  invoices.forEach((inv: any) => {
    const rawDate = String(inv.sale_date || inv.invoice_date || inv.created_at || '').split('T')[0];
    if (dailyMap.hasOwnProperty(rawDate)) {
      dailyMap[rawDate] += Number(inv.total_amount || 0);
    }
  });

  const customerSalesDaily = {
    dates: Object.keys(dailyMap).map((d) => {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    sales: Object.values(dailyMap)
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlySalesMap: Record<number, number> = {};
  monthNames.forEach((_, idx) => {
    monthlySalesMap[idx] = 0;
  });
  const currentYear = new Date().getFullYear();

  invoices.forEach((inv: any) => {
    const rawDate = inv.sale_date || inv.invoice_date || inv.created_at || '';
    if (rawDate) {
      const d = new Date(rawDate);
      if (d.getFullYear() === currentYear) {
        monthlySalesMap[d.getMonth()] += Number(inv.total_amount || 0);
      }
    }
  });

  const customerSalesMonthly = {
    months: monthNames,
    sales: monthNames.map((_, idx) => monthlySalesMap[idx])
  };

  // ==========================================
  // 6. CASH DRAWER TRANSACTIONS LEDGER
  // ==========================================
  const cashTxns: CashTransaction[] = [];

  vouchers.forEach((v: any) => {
    const mode = String(v.mode_of_payment || v.voucher_type || '').toLowerCase();
    if (!mode.includes('bank')) {
      const text = `${v.voucher_no || ''} ${v.account_title || ''} ${v.narration || ''} ${v.voucher_type || ''} ${v.party_name || ''}`.toLowerCase();
      const isOB = Boolean(v.metadata?.isOpeningBalance || String(v.voucher_no || '').startsWith('OB'));
      const isReceipt =
        String(v.voucher_type || '').toLowerCase().includes('receipt') || (isOB && text.includes('cash'));
      const isPayment = String(v.voucher_type || '').toLowerCase().includes('payment');

      if (isReceipt || isPayment || (isOB && text.includes('cash'))) {
        cashTxns.push({
          id: `v-${v.id}`,
          date: v.voucher_date || String(v.created_at || '').split('T')[0],
          type: isReceipt ? 'Inflow' : 'Outflow',
          source: isOB ? 'Opening Cash Balance' : v.voucher_type || 'Cash Voucher',
          party: v.party_name || v.account_title || 'Cash in Hand',
          amount: Number(v.total_amount || v.amount || 0),
          description: v.narration || v.remarks || 'Cash settlement'
        });
      }
    }
  });

  invoices.slice(0, 15).forEach((inv: any) => {
    const cashPaid = Number(
      inv.cash_amount_paid || (inv.settlement_mode === 'Cash' ? inv.total_amount : 0) || 0
    );
    if (cashPaid > 0) {
      cashTxns.push({
        id: `inv-${inv.id}`,
        date: inv.sale_date || String(inv.created_at || '').split('T')[0],
        type: 'Inflow',
        source: `Sale Bill ${inv.invoice_no || inv.id}`,
        party: inv.customer_name || 'Counter Customer',
        amount: cashPaid,
        description: 'Direct Cash Counter Collection'
      });
    }
  });

  return {
    metrics: metricsData,
    receivablesList: extractedReceivables.slice(0, 15),
    payablesList: extractedPayables.slice(0, 15),
    trendingProducts: rankedProducts,
    lowStockProducts: stockAlerts.slice(0, 10),
    holdingItems: extractedHolding,
    cashTransactions: cashTxns.slice(0, 15),
    customerSalesDaily,
    customerSalesMonthly
  };
};
