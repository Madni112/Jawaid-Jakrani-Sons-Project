import { supabase, fetchAllPages } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { extractItemDetails } from './saleReportHelpers';
import { extractProductColor } from '../../../../utils/colorService';

export interface SaleReportFetchParams {
  rType: string;
  filters: any;
  setReportRows: (rows: any[]) => void;
  setCategoryHierarchyTree: (tree: any[]) => void;
  setReportWarehouses: (wh: string[]) => void;
  setCustomerLookup: (lookup: Record<string, { code: string; pageNo: string }>) => void;
  setProductUomMap: (map: Record<string, string>) => void;
  setLoading: (loading: boolean) => void;
}

export const fetchSaleReportDataset = async ({
  rType,
  filters,
  setReportRows,
  setCategoryHierarchyTree,
  setReportWarehouses,
  setCustomerLookup,
  setProductUomMap,
  setLoading,
}: SaleReportFetchParams) => {
      try {
        // Normalize customer filter if it contains [Code] prefix
        if (filters.customer) {
          const rawCustList = Array.isArray(filters.customer) ? filters.customer : [filters.customer];
          filters.customer = rawCustList.map((item: string) => String(item).replace(/^\[.*?\]\s*/, '').trim());
        }

        // Fetch products and customers lookup for UOM, codes & ledger page nos
        const [prodRes, custRes] = await Promise.all([
          fetchAllPages(supabase.from('products').select('*')),
          fetchAllPages(supabase.from('customers').select('id, customerName, customername, customer_code, customerCode, page_no, pageNo'))
        ]);
        const prodData = prodRes.data;
        const uomMapObj: Record<string, string> = {};
        const productColorMapObj: Record<string, string> = {};
        if (prodData) {
          prodData.forEach((p: any) => {
            if (p.product_name) {
              const isTile = Boolean(String(p.category || '').toLowerCase().includes('tile'));
              const pKey = p.product_name.trim().toLowerCase();
              uomMapObj[pKey] = p.uom || (isTile ? 'BOX' : 'Nos');
              productColorMapObj[pKey] = extractProductColor(p);
            }
          });
          setProductUomMap(uomMapObj);
        }
        const productUomMap = uomMapObj;

        const custLookupMap: Record<string, { code: string; pageNo: string }> = {};
        if (custRes.data) {
          custRes.data.forEach((c: any) => {
            const rawName = String(c.customerName || c.customername || '').trim().toLowerCase().replace(/\s+/g, ' ');
            if (rawName) {
              custLookupMap[rawName] = {
                code: String(c.customer_code || c.customerCode || '').trim(),
                pageNo: String(c.page_no || c.pageNo || '').trim()
              };
            }
          });
          setCustomerLookup(custLookupMap);
        }

        // ── 📂 REPORT TYPE: CATEGORY-WISE SALES & VOLUME REPORT ──
        if (rType === 'category-sales') {
          const [invRes, retRes, catRes, locRes] = await Promise.all([
            fetchAllPages(supabase.from('sales_invoices').select('*').order('id', { ascending: true })),
            fetchAllPages(supabase.from('sales_returns').select('*').order('id', { ascending: true })),
            supabase.from('inventory_categories').select('id, name, parent_id'),
            supabase.from('inventory_locations').select('id, name, location_type').order('id', { ascending: true })
          ]);

          if (invRes.error) throw invRes.error;
          if (retRes.error) throw retRes.error;

          const allInvoices = invRes.data || [];
          const allReturns = retRes.data || [];
          const allProducts = prodData || [];
          const allCategories = catRes.data || [];
          const registeredLocations = (locRes.data || []).map((l: any) => String(l.name || '').trim()).filter(Boolean);
          const defaultLocName = registeredLocations.find(l => l.toUpperCase() === 'SHOP') || registeredLocations[0] || 'SHOP';

          const normalizeWarehouse = (raw: string): string => {
            if (!raw) return defaultLocName;
            const clean = raw.replace(/[`'"]/g, '').trim();
            const found = registeredLocations.find(l => l.toLowerCase() === clean.toLowerCase());
            if (found) return found;
            if (clean.toLowerCase().includes('main') || clean.toLowerCase().includes('39') || clean.toLowerCase().includes('storage')) {
              const a39 = registeredLocations.find(l => l.toUpperCase().includes('A-39') || l.toLowerCase().includes('storage'));
              if (a39) return a39;
            }
            if (clean.toLowerCase().includes('shop') || clean.toLowerCase().includes('sale')) {
              const shop = registeredLocations.find(l => l.toUpperCase() === 'SHOP');
              if (shop) return shop;
            }
            return clean;
          };

          const catById = new Map<number, any>();
          const catByName = new Map<string, any>();
          allCategories.forEach((c: any) => {
            if (c.id) catById.set(Number(c.id), c);
            if (c.name) catByName.set(String(c.name).trim().toLowerCase(), c);
          });

          const startTimestamp = filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00').getTime() : 0;
          const endTimestamp = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59.999').getTime() : Infinity;

          const parseItems = (raw: any): any[] => {
            if (Array.isArray(raw)) return raw;
            if (typeof raw === 'string') {
              try { return JSON.parse(raw); } catch { return []; }
            }
            return [];
          };

          // Filter invoices
          const discoveredWhs = new Set<string>();
          const filteredInvoices = allInvoices.filter((inv: any) => {
            const d = inv.sale_date || inv.created_at;
            const t = d ? new Date(String(d).includes('T') ? String(d) : String(d) + 'T12:00:00').getTime() : 0;
            if (t < startTimestamp || t > endTimestamp) return false;

            if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) {
              if (!filters.customer.includes(inv.customer_name)) return false;
            }
            if (filters.salesman && filters.salesman.length > 0 && !filters.salesman.includes('All')) {
              if (!filters.salesman.includes(inv.salesman)) return false;
            }
            if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) {
              const invWh = (inv.dispatch_warehouse || inv.location || '').trim().toLowerCase();
              const items = parseItems(inv.items);
              const hasWhMatch = filters.location.some((fl: string) => fl.toLowerCase() === invWh) ||
                items.some((it: any) => {
                  const iw = (it.warehouse || it.location || '').trim().toLowerCase();
                  return iw && filters.location.some((fl: string) => fl.toLowerCase() === iw);
                });
              if (!hasWhMatch) return false;
            }
            return true;
          });

          // Filter returns
          const filteredReturns = allReturns.filter((ret: any) => {
            const d = ret.return_date || ret.created_at;
            const t = d ? new Date(String(d).includes('T') ? String(d) : String(d) + 'T12:00:00').getTime() : 0;
            if (t < startTimestamp || t > endTimestamp) return false;

            if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) {
              if (!filters.customer.includes(ret.customer_name)) return false;
            }
            if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) {
              const retWh = (ret.warehouse_name || ret.dispatch_warehouse || ret.source_warehouse || ret.location || '').trim().toLowerCase();
              const items = parseItems(ret.items || ret.returned_items);
              const hasWhMatch = filters.location.some((fl: string) => fl.toLowerCase() === retWh) ||
                items.some((it: any) => {
                  const iw = (it.warehouse || it.location || '').trim().toLowerCase();
                  return iw && filters.location.some((fl: string) => fl.toLowerCase() === iw);
                });
              if (!hasWhMatch) return false;
            }
            return true;
          });

          // Product lookup
          const productLookup: Record<string, any> = {};
          allProducts.forEach((p: any) => {
            if (p.product_name) {
              productLookup[p.product_name.trim().toLowerCase()] = p;
            }
          });

          const getProductCategory = (pName: string): { parentCategory: string; subCategory: string; category: string; sku: string; uom: string } => {
            const pKey = pName.trim().toLowerCase();
            const matched = productLookup[pKey] || {};

            let pCat = matched.sub_sub_category || matched.parent_category || '';
            let sCat = matched.sub_category || '';
            let lCat = matched.category || '';

            if (!pCat || (catByName.has(pCat.toLowerCase()) && catByName.get(pCat.toLowerCase())?.parent_id !== null)) {
              if (lCat && catByName.get(lCat.toLowerCase())?.parent_id === null) {
                pCat = matched.category;
                lCat = matched.sub_sub_category || matched.sub_category || 'General';
              } else if (matched.category && catByName.has(matched.category.toLowerCase())) {
                const leafObj = catByName.get(matched.category.toLowerCase());
                if (leafObj?.parent_id) {
                  const subObj = catById.get(Number(leafObj.parent_id));
                  if (subObj) {
                    sCat = subObj.name;
                    if (subObj.parent_id) {
                      const parentObj = catById.get(Number(subObj.parent_id));
                      if (parentObj) pCat = parentObj.name;
                    } else {
                      pCat = subObj.name;
                    }
                  }
                } else if (leafObj) {
                  pCat = leafObj.name;
                }
              }
            }

            pCat = pCat || 'General';
            sCat = sCat || 'General';
            lCat = lCat || pCat;

            const sku = matched?.sku || matched?.item_sr_no || '-';
            const isTile = Boolean(
              String(pCat).toLowerCase().includes('tile') ||
              String(sCat).toLowerCase().includes('tile') ||
              String(lCat).toLowerCase().includes('tile') ||
              Number(matched?.pieces_per_box || matched?.pcs_per_box || 0) > 1
            );
            const uom = matched?.uom || (isTile ? 'BOX' : 'Nos');
            return { parentCategory: pCat, subCategory: sCat, category: lCat, sku, uom };
          };

          // ── 3-TIER TREE DATA CONTAINER ──
          // Parent Category -> Sub Category -> Leaf Category -> Products
          const parentCategoryTree: Record<string, any> = {};

          const getOrCreateHierarchyNodes = (pCatName: string, sCatName: string, leafCatName: string) => {
            const pKey = pCatName || 'General';
            const sKey = sCatName || 'General';
            const lKey = leafCatName || 'General';

            if (!parentCategoryTree[pKey]) {
              parentCategoryTree[pKey] = {
                parent_name: pKey,
                gross_units: 0,
                returned_units: 0,
                net_units: 0,
                gross_sales: 0,
                returned_amount: 0,
                net_revenue: 0,
                contribution_pct: 0,
                invoices_set: new Set<string>(),
                transactions: [],
                sub_categories_map: {}
              };
            }
            const parentNode = parentCategoryTree[pKey];

            if (!parentNode.sub_categories_map[sKey]) {
              parentNode.sub_categories_map[sKey] = {
                sub_name: sKey,
                gross_units: 0,
                returned_units: 0,
                net_units: 0,
                gross_sales: 0,
                returned_amount: 0,
                net_revenue: 0,
                transactions: [],
                categories_map: {}
              };
            }
            const subNode = parentNode.sub_categories_map[sKey];

            if (!subNode.categories_map[lKey]) {
              subNode.categories_map[lKey] = {
                category_name: lKey,
                gross_units: 0,
                returned_units: 0,
                net_units: 0,
                gross_sales: 0,
                returned_amount: 0,
                net_revenue: 0,
                products_map: {},
                transactions: [],
                sold_by_wh: {},
                ret_by_wh: {}
              };
            }
            const leafNode = subNode.categories_map[lKey];

            return { parentNode, subNode, leafNode };
          };

          // Pre-populate catalog if showZeroSales is explicitly enabled
          if (filters.showZeroSales === true) {
            allProducts.forEach((p: any) => {
              const pCat = p.category || 'General';
              const sCat = p.sub_category || 'General';
              const lCat = p.sub_sub_category || p.category || 'General';

              if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                if (!filters.parentCategory.includes(pCat)) return;
              }
              if (filters.subCategory && filters.subCategory.length > 0 && !filters.subCategory.includes('All')) {
                if (!filters.subCategory.includes(sCat)) return;
              }
              if (filters.subSubCategory && filters.subSubCategory.length > 0 && !filters.subSubCategory.includes('All')) {
                if (!filters.subSubCategory.includes(lCat)) return;
              }
              if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                const prodColor = String(p.color || productColorMapObj[String(p.product_name || '').trim().toLowerCase()] || extractProductColor(p) || '').trim().toLowerCase();
                const normColors = filters.color.map((x: string) => String(x).trim().toLowerCase());
                if (!prodColor || !normColors.includes(prodColor)) return;
              }

              const { leafNode } = getOrCreateHierarchyNodes(pCat, sCat, lCat);
              const pName = (p.product_name || '').trim();
              if (pName && !leafNode.products_map[pName.toLowerCase()]) {
                const isTile = Boolean(String(pCat).toLowerCase().includes('tile') || String(sCat).toLowerCase().includes('tile'));
                leafNode.products_map[pName.toLowerCase()] = {
                  product_name: pName,
                  sku: p.sku || p.item_sr_no || '-',
                  color: p.color || productColorMapObj[pName.toLowerCase()] || extractProductColor(p) || '-',
                  uom: p.uom || (isTile ? 'BOX' : 'Nos'),
                  sold_qty: 0,
                  returned_qty: 0,
                  net_qty: 0,
                  gross_sales: 0,
                  returned_amount: 0,
                  net_sales: 0,
                  last_sale_date: '-',
                  sold_by_wh: {},
                  ret_by_wh: {}
                };
              }
            });
          }

          // Process Sales Invoices
          filteredInvoices.forEach((inv: any) => {
            const invNo = inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`;
            const invDate = inv.sale_date || String(inv.created_at || '').split('T')[0];
            const items = parseItems(inv.items);
            const salesman = inv.salesman || 'Direct';
            const customerName = inv.customer_name || 'Counter Retail Buyer';
            const paymentTerm = inv.payment_term || 'Credit';
            const freightCharges = Number(inv.additional_charges || 0) + Number(inv.transport_charges || 0);

            items.forEach((it: any) => {
              const pName = (it.itemName || it.product_name || it.name || '').trim();
              if (!pName) return;

              const rawItemWh = (it.warehouse || it.location || inv.dispatch_warehouse || inv.location || 'SHOP').trim();
              const itemWh = normalizeWarehouse(rawItemWh);
              if (itemWh) discoveredWhs.add(itemWh);
              if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) {
                if (!filters.location.some((fl: string) => fl.toLowerCase() === itemWh.toLowerCase())) return;
              }

              if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                if (!filters.product.includes(pName)) return;
              }

              const { parentCategory: pCat, subCategory: sCat, category: lCat, sku, uom } = getProductCategory(pName);

              if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                const arr = Array.isArray(filters.parentCategory) ? filters.parentCategory : [filters.parentCategory];
                const matches = arr.some((fc: string) => fc.toLowerCase() === pCat.toLowerCase() || pCat.toLowerCase().includes(fc.toLowerCase()) || fc.toLowerCase().includes(pCat.toLowerCase()));
                if (!matches) return;
              }
              if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                const matchingP = productLookup[pName.toLowerCase()];
                const prodColor = String(it.color || matchingP?.color || productColorMapObj[pName.toLowerCase()] || extractProductColor(matchingP) || '').trim().toLowerCase();
                const normColors = filters.color.map((x: string) => String(x).trim().toLowerCase());
                if (!prodColor || !normColors.includes(prodColor)) return;
              }
              if (filters.subCategory && filters.subCategory.length > 0 && !filters.subCategory.includes('All')) {
                const arr = Array.isArray(filters.subCategory) ? filters.subCategory : [filters.subCategory];
                const matches = arr.some((sc: string) => sc.toLowerCase() === sCat.toLowerCase() || sCat.toLowerCase().includes(sc.toLowerCase()) || sc.toLowerCase().includes(sCat.toLowerCase()));
                if (!matches) return;
              }
              if (filters.subSubCategory && filters.subSubCategory.length > 0 && !filters.subSubCategory.includes('All')) {
                const arr = Array.isArray(filters.subSubCategory) ? filters.subSubCategory : [filters.subSubCategory];
                const matches = arr.some((ssc: string) => ssc.toLowerCase() === lCat.toLowerCase() || lCat.toLowerCase().includes(ssc.toLowerCase()) || ssc.toLowerCase().includes(lCat.toLowerCase()));
                if (!matches) return;
              }
              if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                const matchingP = productLookup[pName.toLowerCase()];
                const prodColor = String(it.color || matchingP?.color || productColorMapObj[pName.toLowerCase()] || extractProductColor(matchingP) || '').trim().toLowerCase();
                const normColors = filters.color.map((x: string) => String(x).trim().toLowerCase());
                if (!prodColor || !normColors.includes(prodColor)) return;
              }

              const { parentNode, subNode, leafNode } = getOrCreateHierarchyNodes(pCat, sCat, lCat);
              parentNode.invoices_set.add(invNo);

              const qty = Number(it.qty || it.quantity || 1);
              const discount = Number(it.discount || it.disc || 0);
              const pKey = pName.toLowerCase();
              const matchingProd = productLookup[pKey];

              // Support all POS/ERP item price fields: rp, rate, sale_price, price, unit_price, product retail_price
              let rate = Number(it.rp ?? it.rate ?? it.sale_price ?? it.price ?? it.unit_price ?? matchingProd?.retail_price ?? matchingProd?.price ?? 0);
              let lineTotal = Number(it.total || it.amount || it.net_amount || it.subtotal || 0);
              if (!lineTotal && (qty > 0 && rate > 0)) {
                lineTotal = (qty * rate) - discount;
              } else if (lineTotal > 0 && rate === 0 && qty > 0) {
                rate = (lineTotal + discount) / qty;
              }
              const grossItemSales = (qty * rate) > 0 ? (qty * rate) : (lineTotal + discount);

              if (!leafNode.products_map[pKey]) {
                leafNode.products_map[pKey] = {
                  product_name: pName,
                  sku: it.sku || sku,
                  uom: it.uom || uom,
                  sold_qty: 0,
                  returned_qty: 0,
                  net_qty: 0,
                  gross_sales: 0,
                  returned_amount: 0,
                  net_sales: 0,
                  last_sale_date: invDate,
                  sold_by_wh: {},
                  ret_by_wh: {}
                };
              }

              if (!leafNode.products_map[pKey].sold_by_wh) leafNode.products_map[pKey].sold_by_wh = {};
              leafNode.products_map[pKey].sold_by_wh[itemWh] = (leafNode.products_map[pKey].sold_by_wh[itemWh] || 0) + qty;

              if (!leafNode.sold_by_wh) leafNode.sold_by_wh = {};
              leafNode.sold_by_wh[itemWh] = (leafNode.sold_by_wh[itemWh] || 0) + qty;

              leafNode.products_map[pKey].sold_qty += qty;
              leafNode.products_map[pKey].gross_sales += grossItemSales;
              leafNode.products_map[pKey].net_sales += lineTotal;
              if (leafNode.products_map[pKey].last_sale_date === '-' || invDate > leafNode.products_map[pKey].last_sale_date) {
                leafNode.products_map[pKey].last_sale_date = invDate;
              }

              // Update Leaf
              leafNode.gross_units += qty;
              leafNode.gross_sales += grossItemSales;

              // Update Sub
              subNode.gross_units += qty;
              subNode.gross_sales += grossItemSales;

              // Update Parent
              parentNode.gross_units += qty;
              parentNode.gross_sales += grossItemSales;

              const txRecord = {
                record_type: 'invoice',
                date: invDate,
                doc_no: invNo,
                customer_name: customerName,
                salesman,
                product_name: pName,
                parent_category: pCat,
                sub_category: sCat,
                category_name: lCat,
                qty,
                uom: it.uom || uom,
                rate,
                discount,
                total_amount: lineTotal,
                payment_term: paymentTerm,
                freight_charges: freightCharges
              };

              leafNode.transactions.push(txRecord);
              subNode.transactions.push(txRecord);
              parentNode.transactions.push(txRecord);
            });
          });

          // Process Sales Returns
          filteredReturns.forEach((ret: any) => {
            const retNo = ret.return_no || `RTN-${String(ret.id).padStart(4, '0')}`;
            const retDate = ret.return_date || String(ret.created_at || '').split('T')[0];
            const items = parseItems(ret.items || ret.returned_items);
            const customerName = ret.customer_name || 'Retail Client';

            items.forEach((it: any) => {
              const pName = (it.itemName || it.product_name || it.name || '').trim();
              if (!pName) return;

              const rawRetWh = (it.warehouse || it.location || ret.warehouse_name || ret.dispatch_warehouse || ret.source_warehouse || ret.location || 'SHOP').trim();
              const retWh = normalizeWarehouse(rawRetWh);
              if (retWh) discoveredWhs.add(retWh);
              if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) {
                if (!filters.location.some((fl: string) => fl.toLowerCase() === retWh.toLowerCase())) return;
              }

              if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                if (!filters.product.includes(pName)) return;
              }

              const { parentCategory: pCat, subCategory: sCat, category: lCat, sku, uom } = getProductCategory(pName);

              if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                const arr = Array.isArray(filters.parentCategory) ? filters.parentCategory : [filters.parentCategory];
                const matches = arr.some((fc: string) => fc.toLowerCase() === pCat.toLowerCase() || pCat.toLowerCase().includes(fc.toLowerCase()) || fc.toLowerCase().includes(pCat.toLowerCase()));
                if (!matches) return;
              }
              if (filters.subCategory && filters.subCategory.length > 0 && !filters.subCategory.includes('All')) {
                const arr = Array.isArray(filters.subCategory) ? filters.subCategory : [filters.subCategory];
                const matches = arr.some((sc: string) => sc.toLowerCase() === sCat.toLowerCase() || sCat.toLowerCase().includes(sc.toLowerCase()) || sc.toLowerCase().includes(sCat.toLowerCase()));
                if (!matches) return;
              }
              if (filters.subSubCategory && filters.subSubCategory.length > 0 && !filters.subSubCategory.includes('All')) {
                const arr = Array.isArray(filters.subSubCategory) ? filters.subSubCategory : [filters.subSubCategory];
                const matches = arr.some((ssc: string) => ssc.toLowerCase() === lCat.toLowerCase() || lCat.toLowerCase().includes(ssc.toLowerCase()) || ssc.toLowerCase().includes(lCat.toLowerCase()));
                if (!matches) return;
              }

              const { parentNode, subNode, leafNode } = getOrCreateHierarchyNodes(pCat, sCat, lCat);

              const qty = Number(it.qty || it.quantity || 1);
              const discount = Number(it.discount || it.disc || 0);
              const pKey = pName.toLowerCase();
              const matchingProd = productLookup[pKey];

              let rate = Number(it.rp ?? it.rate ?? it.sale_price ?? it.price ?? it.unit_price ?? matchingProd?.retail_price ?? matchingProd?.price ?? 0);
              let lineTotal = Number(it.total || it.amount || it.net_amount || it.subtotal || 0);
              if (!lineTotal && (qty > 0 && rate > 0)) {
                lineTotal = (qty * rate) - discount;
              } else if (lineTotal > 0 && rate === 0 && qty > 0) {
                rate = (lineTotal + discount) / qty;
              }

              if (!leafNode.products_map[pKey]) {
                leafNode.products_map[pKey] = {
                  product_name: pName,
                  sku: it.sku || sku,
                  uom: it.uom || uom,
                  sold_qty: 0,
                  returned_qty: 0,
                  net_qty: 0,
                  gross_sales: 0,
                  returned_amount: 0,
                  net_sales: 0,
                  last_sale_date: '-',
                  sold_by_wh: {},
                  ret_by_wh: {}
                };
              }

              if (!leafNode.products_map[pKey].ret_by_wh) leafNode.products_map[pKey].ret_by_wh = {};
              leafNode.products_map[pKey].ret_by_wh[retWh] = (leafNode.products_map[pKey].ret_by_wh[retWh] || 0) + qty;

              if (!leafNode.ret_by_wh) leafNode.ret_by_wh = {};
              leafNode.ret_by_wh[retWh] = (leafNode.ret_by_wh[retWh] || 0) + qty;

              leafNode.products_map[pKey].returned_qty += qty;
              leafNode.products_map[pKey].returned_amount += lineTotal;
              leafNode.products_map[pKey].net_sales = Math.max(0, leafNode.products_map[pKey].net_sales - lineTotal);

              // Update Leaf
              leafNode.returned_units += qty;
              leafNode.returned_amount += lineTotal;

              // Update Sub
              subNode.returned_units += qty;
              subNode.returned_amount += lineTotal;

              // Update Parent
              parentNode.returned_units += qty;
              parentNode.returned_amount += lineTotal;

              const txRecord = {
                record_type: 'return',
                date: retDate,
                doc_no: retNo,
                customer_name: customerName,
                salesman: 'Direct Return',
                product_name: pName,
                parent_category: pCat,
                sub_category: sCat,
                category_name: lCat,
                qty,
                uom: it.uom || uom,
                rate,
                discount: 0,
                total_amount: lineTotal,
                payment_term: 'Return Credit',
                freight_charges: 0
              };

              leafNode.transactions.push(txRecord);
              subNode.transactions.push(txRecord);
              parentNode.transactions.push(txRecord);
            });
          });

          // Total revenue across all categories
          let allCategoriesRevenue = 0;
          Object.values(parentCategoryTree).forEach((p: any) => {
            Object.values(p.sub_categories_map).forEach((s: any) => {
              Object.values(s.categories_map).forEach((c: any) => {
                c.net_units = c.gross_units - c.returned_units;
                c.net_revenue = Math.max(0, c.gross_sales - c.returned_amount);
                allCategoriesRevenue += c.net_revenue;
              });
            });
          });

          // Compile flat category list with parent and sub category references
          const compiledCategoryRows: any[] = [];
          Object.values(parentCategoryTree).forEach((parentNode: any) => {
            Object.values(parentNode.sub_categories_map).forEach((subNode: any) => {
              Object.values(subNode.categories_map).forEach((leafNode: any) => {
                const productList = Object.values(leafNode.products_map).map((p: any) => {
                  const pNetQty = p.sold_qty - p.returned_qty;
                  const pNetSales = Math.max(0, p.gross_sales - p.returned_amount);
                  const pShare = leafNode.net_revenue > 0 ? (pNetSales / leafNode.net_revenue) * 100 : 0;

                  const net_by_wh: Record<string, number> = {};
                  const allWhs = new Set([...Object.keys(p.sold_by_wh || {}), ...Object.keys(p.ret_by_wh || {})]);
                  allWhs.forEach((wh) => {
                    net_by_wh[wh] = (p.sold_by_wh?.[wh] || 0) - (p.ret_by_wh?.[wh] || 0);
                  });

                  return {
                    ...p,
                    net_qty: pNetQty,
                    final_net_sales: pNetSales,
                    share_of_category: pShare,
                    net_by_wh
                  };
                });

                productList.sort((a, b) => b.final_net_sales - a.final_net_sales);
                leafNode.transactions.sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));

                const catNetByWh: Record<string, number> = {};
                const allCatWhs = new Set([...Object.keys(leafNode.sold_by_wh || {}), ...Object.keys(leafNode.ret_by_wh || {})]);
                allCatWhs.forEach((wh) => {
                  catNetByWh[wh] = (leafNode.sold_by_wh?.[wh] || 0) - (leafNode.ret_by_wh?.[wh] || 0);
                });

                compiledCategoryRows.push({
                  category_name: leafNode.category_name,
                  parent_name: parentNode.parent_name,
                  sub_name: subNode.sub_name,
                  products_count: productList.length,
                  products: productList,
                  transactions: leafNode.transactions,
                  gross_units: leafNode.gross_units,
                  returned_units: leafNode.returned_units,
                  net_units: leafNode.net_units,
                  gross_sales: leafNode.gross_sales,
                  returned_amount: leafNode.returned_amount,
                  net_revenue: leafNode.net_revenue,
                  sold_by_wh: leafNode.sold_by_wh || {},
                  ret_by_wh: leafNode.ret_by_wh || {},
                  net_by_wh: catNetByWh,
                  contribution_pct: allCategoriesRevenue > 0 ? (leafNode.net_revenue / allCategoriesRevenue) * 100 : 0
                });
              });
            });
          });

          let finalCategories = compiledCategoryRows;
          if (!filters.showZeroSales) {
            finalCategories = finalCategories.filter(c => c.gross_units > 0 || c.returned_units > 0);
          }

          finalCategories.sort((a, b) => b.net_revenue - a.net_revenue);
          const finalReportWhs = registeredLocations.length > 0 ? registeredLocations : Array.from(discoveredWhs).filter(Boolean).sort();
          setReportWarehouses(finalReportWhs);
          setReportRows(finalCategories);

          // ── Compile Hierarchical Tree for Detailed View (Parent -> Sub -> Category -> Invoices) ──
          const compiledHierarchyTree = Object.values(parentCategoryTree).map((parentNode: any) => {
            parentNode.net_units = parentNode.gross_units - parentNode.returned_units;
            parentNode.net_revenue = Math.max(0, parentNode.gross_sales - parentNode.returned_amount);

            const subCategories = Object.values(parentNode.sub_categories_map).map((subNode: any) => {
              subNode.net_units = subNode.gross_units - subNode.returned_units;
              subNode.net_revenue = Math.max(0, subNode.gross_sales - subNode.returned_amount);

              const leafCategories = Object.values(subNode.categories_map).map((leafNode: any) => {
                leafNode.net_units = leafNode.gross_units - leafNode.returned_units;
                leafNode.net_revenue = Math.max(0, leafNode.gross_sales - leafNode.returned_amount);
                leafNode.transactions.sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
                return leafNode;
              });

              return {
                ...subNode,
                categories: leafCategories
              };
            });

            return {
              ...parentNode,
              sub_categories: subCategories
            };
          });

          let finalHierarchyTree = compiledHierarchyTree;
          if (!filters.showZeroSales) {
            finalHierarchyTree = finalHierarchyTree
              .map(p => ({
                ...p,
                sub_categories: p.sub_categories
                  .map((s: any) => ({
                    ...s,
                    categories: s.categories.filter((c: any) => (c.transactions || []).length > 0)
                  }))
                  .filter((s: any) => s.categories.length > 0)
              }))
              .filter(p => p.sub_categories.length > 0);
          }

          setCategoryHierarchyTree(finalHierarchyTree);
        }

        // ── 📦 REPORT TYPE: PRODUCT SALES HISTORY REPORT ──
        else if (rType === 'product-sales-history') {
          const [invRes, retRes] = await Promise.all([
            fetchAllPages(supabase.from('sales_invoices').select('*').order('id', { ascending: true })),
            fetchAllPages(supabase.from('sales_returns').select('*').order('id', { ascending: true }))
          ]);

          if (invRes.error) throw invRes.error;
          if (retRes.error) throw retRes.error;

          const allInvoices = invRes.data || [];
          const allReturns = retRes.data || [];
          const allProducts = prodData || [];

          const startTimestamp = filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00').getTime() : 0;
          const endTimestamp = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59.999').getTime() : Infinity;

          // Helper to extract items safely
          const parseItems = (raw: any): any[] => {
            if (Array.isArray(raw)) return raw;
            if (typeof raw === 'string') {
              try { return JSON.parse(raw); } catch { return []; }
            }
            return [];
          };

          // Filter invoices by criteria
          let filteredInvoices = allInvoices.filter((inv: any) => {
            const d = inv.sale_date || inv.created_at;
            const t = d ? new Date(String(d).includes('T') ? String(d) : String(d) + 'T12:00:00').getTime() : 0;
            if (t < startTimestamp || t > endTimestamp) return false;

            if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) {
              if (!filters.customer.includes(inv.customer_name)) return false;
            }
            if (filters.salesman && filters.salesman.length > 0 && !filters.salesman.includes('All')) {
              if (!filters.salesman.includes(inv.salesman)) return false;
            }
            if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) {
              if (!filters.location.includes(inv.dispatch_warehouse)) return false;
            }
            return true;
          });

          // Filter returns by criteria
          let filteredReturns = allReturns.filter((ret: any) => {
            const d = ret.return_date || ret.created_at;
            const t = d ? new Date(String(d).includes('T') ? String(d) : String(d) + 'T12:00:00').getTime() : 0;
            if (t < startTimestamp || t > endTimestamp) return false;

            if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) {
              if (!filters.customer.includes(ret.customer_name)) return false;
            }
            return true;
          });

          // Map returns by product
          const productReturnsMap: Record<string, { returnedQty: number; returnedAmount: number }> = {};
          filteredReturns.forEach((ret: any) => {
            const items = parseItems(ret.items || ret.returned_items);
            items.forEach((it: any) => {
              const pName = (it.itemName || it.product_name || '').trim();
              if (!pName) return;
              const key = pName.toLowerCase();
              if (!productReturnsMap[key]) {
                productReturnsMap[key] = { returnedQty: 0, returnedAmount: 0 };
              }
              const q = Number(it.qty || it.quantity || 1);
              const r = Number(it.rate ?? it.price ?? 0);
              productReturnsMap[key].returnedQty += q;
              productReturnsMap[key].returnedAmount += (q * r);
            });
          });

          // Aggregate sales transactions per product (pre-populate with catalog products if showZeroSales is enabled)
          const productSummaryMap: Record<string, any> = {};

          if (filters.showZeroSales === true) {
            allProducts.forEach((p: any) => {
              const pName = (p.product_name || '').trim();
              if (!pName) return;
              const key = pName.toLowerCase();

              if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                if (!filters.product.includes(pName)) return;
              }
              const prodParentCat = p.sub_sub_category || p.parent_category || p.category || '';
              const prodSubCat = p.sub_category || '';
              const prodLeafCat = p.category || '';
              const prodBrand = p.bin || p.brand || '';

              if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                const matchP = filters.parentCategory.includes(prodParentCat) || filters.parentCategory.includes(prodLeafCat);
                if (!matchP) return;
              }
              if (filters.subCategory && filters.subCategory.length > 0 && !filters.subCategory.includes('All')) {
                if (!filters.subCategory.includes(prodSubCat)) return;
              }
              if (filters.subSubCategory && filters.subSubCategory.length > 0 && !filters.subSubCategory.includes('All')) {
                if (!filters.subSubCategory.includes(prodLeafCat)) return;
              }
              if (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) {
                if (!filters.bin.includes(prodBrand)) return;
              }
              if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                const prodColor = String(p?.color || productColorMapObj[key] || extractProductColor(p) || '').trim().toLowerCase();
                if (!filters.color.map(x => String(x).toLowerCase()).includes(prodColor)) return;
              }

              productSummaryMap[key] = {
                product_name: pName,
                sku: p.item_sr_no || p.sku || '-',
                color: p.color || productColorMapObj[key] || extractProductColor(p) || '-',
                parentCategory: prodParentCat || '-',
                subCategory: prodSubCat || '-',
                category: prodLeafCat || '-',
                brand: prodBrand || '-',
                uom: p.uom || productUomMap[key] || 'Nos',
                sold_qty: 0,
                gross_sales: 0,
                total_discounts: 0,
                net_sales: 0,
                tx_count: 0,
                last_sale_date: '-',
                transactions: []
              };
            });
          }

          filteredInvoices.forEach((inv: any) => {
            const items = parseItems(inv.items);
            const invDate = inv.sale_date || String(inv.created_at || '').split('T')[0];
            const invNo = inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`;
            const custName = inv.customer_name || 'Counter Retail Buyer';
            const salesman = inv.salesman || 'Direct';
            const warehouse = inv.dispatch_warehouse || 'Main Warehouse';

            items.forEach((it: any) => {
              const pName = (it.itemName || it.product_name || '').trim();
              if (!pName) return;
              const key = pName.toLowerCase();

              // Product criteria filters
              if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                if (!filters.product.includes(pName)) return;
              }

              const matchingProd = allProducts.find(
                (p: any) => (p.product_name || '').trim().toLowerCase() === key ||
                  (it.sku && (p.item_sr_no || '').toLowerCase() === String(it.sku).toLowerCase())
              );

              const prodParentCat = matchingProd?.sub_sub_category || matchingProd?.parent_category || matchingProd?.category || '';
              const prodSubCat = matchingProd?.sub_category || '';
              const prodLeafCat = matchingProd?.category || it.category || '';
              const prodBrand = matchingProd?.bin || matchingProd?.brand || it.brand || '';

              // Category / Brand filters
              if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                const matchP = filters.parentCategory.includes(prodParentCat) || filters.parentCategory.includes(prodLeafCat);
                if (!matchP) return;
              }
              if (filters.subCategory && filters.subCategory.length > 0 && !filters.subCategory.includes('All')) {
                if (!filters.subCategory.includes(prodSubCat)) return;
              }
              if (filters.subSubCategory && filters.subSubCategory.length > 0 && !filters.subSubCategory.includes('All')) {
                if (!filters.subSubCategory.includes(prodLeafCat)) return;
              }
              if (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) {
                if (!filters.bin.includes(prodBrand)) return;
              }
              if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                const prodColor = String(it.color || matchingProd?.color || productColorMapObj[key] || extractProductColor(matchingProd) || '').trim().toLowerCase();
                if (!filters.color.map(x => String(x).toLowerCase()).includes(prodColor)) return;
              }

              const qty = Number(it.qty || it.quantity || 1);
              const rate = Number(it.rp ?? it.rate ?? it.sale_price ?? it.price ?? matchingProd?.retail_price ?? 0);
              const discount = Number(it.discount || it.disc || 0);
              const lineTotal = Number(it.total || it.amount || (qty * rate) - discount);
              const uom = it.uom || matchingProd?.uom || productUomMap[key] || 'Nos';
              const sku = it.sku || matchingProd?.item_sr_no || matchingProd?.sku || '-';

              if (!productSummaryMap[key]) {
                productSummaryMap[key] = {
                  product_name: pName,
                  sku,
                  color: it.color || matchingProd?.color || productColorMapObj[key] || extractProductColor(matchingProd) || '-',
                  parentCategory: prodParentCat || '-',
                  subCategory: prodSubCat || '-',
                  category: prodLeafCat || '-',
                  brand: prodBrand || '-',
                  uom,
                  sold_qty: 0,
                  gross_sales: 0,
                  total_discounts: 0,
                  net_sales: 0,
                  tx_count: 0,
                  last_sale_date: invDate,
                  transactions: []
                };
              }

              productSummaryMap[key].sold_qty += qty;
              productSummaryMap[key].gross_sales += (qty * rate);
              productSummaryMap[key].total_discounts += discount;
              productSummaryMap[key].net_sales += lineTotal;
              productSummaryMap[key].tx_count += 1;
              if (productSummaryMap[key].last_sale_date === '-' || invDate > productSummaryMap[key].last_sale_date) {
                productSummaryMap[key].last_sale_date = invDate;
              }

              productSummaryMap[key].transactions.push({
                date: invDate,
                invoice_no: invNo,
                customer_name: custName,
                salesman,
                warehouse,
                qty,
                uom,
                rate,
                discount,
                total: lineTotal
              });
            });
          });

          // Compile final rows with return deductions and averages
          const compiledRows: any[] = Object.values(productSummaryMap).map((prod: any) => {
            const key = prod.product_name.toLowerCase();
            const returnsInfo = productReturnsMap[key] || { returnedQty: 0, returnedAmount: 0 };
            const netQty = prod.sold_qty - returnsInfo.returnedQty;
            const avgRate = prod.sold_qty > 0 ? (prod.gross_sales / prod.sold_qty) : 0;
            const finalNetSales = Math.max(0, prod.net_sales - returnsInfo.returnedAmount);

            return {
              ...prod,
              returned_qty: returnsInfo.returnedQty,
              returned_amount: returnsInfo.returnedAmount,
              net_qty: netQty,
              avg_rate: avgRate,
              final_net_sales: finalNetSales
            };
          });

          let finalRows = compiledRows;
          if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
            const normColors = filters.color.map((x: string) => String(x).trim().toLowerCase());
            finalRows = finalRows.filter(r => {
              const c = String(r.color || '').trim().toLowerCase();
              return c && normColors.includes(c);
            });
          }
          if (!filters.showZeroSales) {
            finalRows = finalRows.filter(r => r.sold_qty > 0 || r.returned_qty > 0);
          }

          finalRows.sort((a, b) => {
            if (b.final_net_sales !== a.final_net_sales) {
              return b.final_net_sales - a.final_net_sales;
            }
            return a.product_name.localeCompare(b.product_name);
          });

          setReportRows(finalRows);
        }

        // ── 📊 REPORT TYPE: COMMERCIAL SALES AUDIT LEDGER (SALESMAN-WISE) ──
        else if (rType === 'sale') {
          let invQuery = supabase.from('sales_invoices').select('*');
          if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) invQuery = invQuery.in('customer_name', filters.customer);
          if (filters.salesman && filters.salesman.length > 0 && !filters.salesman.includes('All')) invQuery = invQuery.in('salesman', filters.salesman);
          if (filters.transport && filters.transport.length > 0 && !filters.transport.includes('All')) invQuery = invQuery.in('transport_name', filters.transport);
          if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) invQuery = invQuery.in('dispatch_warehouse', filters.location);

          if (filters.saleType && filters.saleType !== 'All') {
            if (filters.saleType === 'Cash') invQuery = invQuery.eq('payment_term', 'Cash');
            else invQuery = invQuery.neq('payment_term', 'Cash');
          }
          if (filters.saleMethod && filters.saleMethod !== 'All') {
            if (filters.saleMethod === 'Direct') invQuery = invQuery.or('dc_no.is.null,dc_no.eq.""');
            else invQuery = invQuery.neq('dc_no', '');
          }

          let retQuery = supabase.from('sales_returns').select('*');
          if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) retQuery = retQuery.in('customer_name', filters.customer);
          if (filters.salesman && filters.salesman.length > 0 && !filters.salesman.includes('All')) retQuery = retQuery.in('salesman', filters.salesman);
          if (filters.transport && filters.transport.length > 0 && !filters.transport.includes('All')) retQuery = retQuery.in('transport_name', filters.transport);
          if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) retQuery = retQuery.in('dispatch_warehouse', filters.location);

          const [invRes, retRes] = await Promise.all([fetchAllPages(invQuery), fetchAllPages(retQuery)]);
          if (invRes.error) throw invRes.error;
          if (retRes.error) throw retRes.error;

          let invPool = invRes.data || [];
          let retPool = retRes.data || [];

          if (filters.dateFrom && filters.dateTo) {
            const startStr = String(filters.dateFrom).split('T')[0];
            const endStr = String(filters.dateTo).split('T')[0];
            invPool = invPool.filter(i => {
              const targetDateStr = String(i.sale_date || i.created_at || '').split('T')[0];
              return targetDateStr >= startStr && targetDateStr <= endStr;
            });
            retPool = retPool.filter(r => {
              const targetDateStr = String(r.return_date || r.created_at || '').split('T')[0];
              return targetDateStr >= startStr && targetDateStr <= endStr;
            });
          }

          // Filter by product / brand / category if specified in filters
          if ((filters.product && filters.product.length > 0 && !filters.product.includes('All')) ||
            (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) ||
            (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) ||
            (filters.color && filters.color.length > 0 && !filters.color.includes('All'))) {
            const filterItemMatch = (record: any) => {
              const items = extractItemDetails(record);
              return items.some(it => {
                const pName = it.name;
                const matchingProd = (prodData || []).find((p: any) => (p.product_name || '').trim().toLowerCase() === pName.trim().toLowerCase());
                if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                  if (!filters.product.includes(pName)) return false;
                }
                if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                  const prodCat = matchingProd?.category || matchingProd?.parent_category || '';
                  if (!filters.parentCategory.includes(prodCat)) return false;
                }
                if (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) {
                  const prodBrand = matchingProd?.brand || '';
                  if (!filters.bin.includes(prodBrand)) return false;
                }
                if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                  const prodColor = String(matchingProd?.color || productColorMapObj[String(matchingProd?.product_name || '').trim().toLowerCase()] || extractProductColor(matchingProd) || '').trim().toLowerCase();
                  if (!filters.color.map(x => String(x).toLowerCase()).includes(prodColor)) return false;
                }
                return true;
              });
            };
            invPool = invPool.filter(filterItemMatch);
            retPool = retPool.filter(filterItemMatch);
          }

          // Group invoices and returns by Salesman / Sales Officer
          const salesmanMap: Record<string, any> = {};

          invPool.forEach((inv: any) => {
            const smName = inv.salesman ? String(inv.salesman).trim() : 'Direct / House Account';
            if (!salesmanMap[smName]) {
              salesmanMap[smName] = {
                salesman_name: smName,
                invoices_count: 0,
                returns_count: 0,
                unique_customers_count: 0,
                customers_set: new Set<string>(),
                cash_sales: 0,
                credit_sales: 0,
                gross_sales: 0,
                return_amount: 0,
                returned_amount: 0,
                net_sales: 0,
                total_sales: 0,
                contribution_pct: 0,
                transactions: [],
                return_transactions: []
              };
            }

            const invTotal = Number(inv.total_amount || 0);
            const isCash = String(inv.payment_term || '').toLowerCase() === 'cash';

            salesmanMap[smName].invoices_count += 1;
            salesmanMap[smName].gross_sales += invTotal;
            if (inv.customer_name) {
              salesmanMap[smName].customers_set.add(String(inv.customer_name).trim());
            }
            if (isCash) {
              salesmanMap[smName].cash_sales += invTotal;
            } else {
              salesmanMap[smName].credit_sales += invTotal;
            }
            salesmanMap[smName].transactions.push({
              ...inv,
              record_type: 'invoice'
            });
          });

          retPool.forEach((ret: any) => {
            let smName = ret.salesman ? String(ret.salesman).trim() : '';
            if (!smName && ret.original_invoice_no) {
              const orig = invPool.find((i: any) =>
                String(i.invoice_no || '').toLowerCase() === String(ret.original_invoice_no).toLowerCase() ||
                String(i.id) === String(ret.original_invoice_no).replace(/\D/g, '')
              );
              if (orig && orig.salesman) smName = String(orig.salesman).trim();
            }
            if (!smName) smName = 'Direct / House Account';

            if (!salesmanMap[smName]) {
              salesmanMap[smName] = {
                salesman_name: smName,
                invoices_count: 0,
                returns_count: 0,
                unique_customers_count: 0,
                customers_set: new Set<string>(),
                cash_sales: 0,
                credit_sales: 0,
                gross_sales: 0,
                return_amount: 0,
                returned_amount: 0,
                net_sales: 0,
                total_sales: 0,
                contribution_pct: 0,
                transactions: [],
                return_transactions: []
              };
            }

            const retTotal = Number(ret.return_amount || ret.total_amount || 0);
            salesmanMap[smName].returns_count += 1;
            salesmanMap[smName].return_amount += retTotal;
            salesmanMap[smName].returned_amount += retTotal;
            if (ret.customer_name) {
              salesmanMap[smName].customers_set.add(String(ret.customer_name).trim());
            }
            salesmanMap[smName].return_transactions.push({
              ...ret,
              record_type: 'return'
            });
          });

          // Compute net sales and contribution percentage per salesman
          let totalAllPoolNetSales = 0;
          Object.values(salesmanMap).forEach((sm: any) => {
            sm.net_sales = sm.gross_sales - sm.return_amount;
            sm.total_sales = sm.net_sales;
            totalAllPoolNetSales += sm.net_sales;
          });

          const salesmanGroups = Object.values(salesmanMap).map((sm: any) => {
            return {
              ...sm,
              salesman: sm.salesman_name,
              unique_customers_count: sm.customers_set.size || (sm.invoices_count > 0 || sm.returns_count > 0 ? 1 : 0),
              contribution_pct: totalAllPoolNetSales > 0 ? (sm.net_sales / totalAllPoolNetSales) * 100 : 0
            };
          });

          // Sort salesmen groups by net_sales descending (leaderboard)
          salesmanGroups.sort((a, b) => b.net_sales - a.net_sales);

          setReportRows(salesmanGroups);
        }

        // ── 📊 REPORT TYPE: SALES FILTER & PARAMETER REGISTER (FLAT CHRONOLOGICAL) ──
        else if (rType === 'sales-query') {
          let query = supabase.from('sales_invoices').select('*');
          if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) query = query.in('customer_name', filters.customer);
          if (filters.salesman && filters.salesman.length > 0 && !filters.salesman.includes('All')) query = query.in('salesman', filters.salesman);
          if (filters.transport && filters.transport.length > 0 && !filters.transport.includes('All')) query = query.in('transport_name', filters.transport);
          if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) query = query.in('dispatch_warehouse', filters.location);

          if (filters.saleType && filters.saleType !== 'All') {
            if (filters.saleType === 'Cash') query = query.eq('payment_term', 'Cash');
            else query = query.neq('payment_term', 'Cash');
          }
          if (filters.saleMethod && filters.saleMethod !== 'All') {
            if (filters.saleMethod === 'Direct') query = query.or('dc_no.is.null,dc_no.eq.""');
            else query = query.neq('dc_no', '');
          }

          const { data: invData, error: invError } = await fetchAllPages(query);
          if (invError) throw invError;

          const { data: returnsData, error: retError } = await fetchAllPages(
            supabase
              .from('sales_returns')
              .select('original_invoice_no')
          );
          if (retError) throw retError;

          const returnedNosList = (returnsData || []).map(r =>
            String(r.original_invoice_no || '').trim().toLowerCase()
          );

          let pool = invData || [];

          pool = pool.filter(i => {
            const rawId = String(i.id).trim().toLowerCase();
            const isReturnedItem = returnedNosList.some(retRef =>
              retRef === rawId ||
              retRef === `inv-${rawId}` ||
              retRef === `inv-${rawId.padStart(4, '0')}` ||
              retRef.includes(rawId)
            );
            return !isReturnedItem;
          });

          if (filters.dateFrom && filters.dateTo) {
            const startStr = String(filters.dateFrom).split('T')[0];
            const endStr = String(filters.dateTo).split('T')[0];
            pool = pool.filter(i => {
              const targetDateStr = String(i.sale_date || i.created_at || '').split('T')[0];
              return targetDateStr >= startStr && targetDateStr <= endStr;
            });
          }

          // Filter by product / brand / category if specified in filters
          if ((filters.product && filters.product.length > 0 && !filters.product.includes('All')) ||
            (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) ||
            (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) ||
            (filters.color && filters.color.length > 0 && !filters.color.includes('All'))) {
            pool = pool.filter((inv: any) => {
              const items = extractItemDetails(inv);
              return items.some(it => {
                const pName = it.name;
                const matchingProd = (prodData || []).find((p: any) => (p.product_name || '').trim().toLowerCase() === pName.trim().toLowerCase());
                if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                  if (!filters.product.includes(pName)) return false;
                }
                if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                  const prodCat = matchingProd?.category || matchingProd?.parent_category || '';
                  if (!filters.parentCategory.includes(prodCat)) return false;
                }
                if (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) {
                  const prodBrand = matchingProd?.brand || '';
                  if (!filters.bin.includes(prodBrand)) return false;
                }
                if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                  const prodColor = String(matchingProd?.color || productColorMapObj[String(matchingProd?.product_name || '').trim().toLowerCase()] || extractProductColor(matchingProd) || '').trim().toLowerCase();
                  if (!filters.color.map(x => String(x).toLowerCase()).includes(prodColor)) return false;
                }
                return true;
              });
            });
          }

          // Sort flat invoices
          if (filters.sortBy) {
            if (filters.sortBy === 'date_asc') {
              pool.sort((a, b) => (a.sale_date || a.created_at || '').localeCompare(b.sale_date || b.created_at || ''));
            } else if (filters.sortBy === 'amount_desc') {
              pool.sort((a, b) => Number(b.total_amount || 0) - Number(a.total_amount || 0));
            } else if (filters.sortBy === 'amount_asc') {
              pool.sort((a, b) => Number(a.total_amount || 0) - Number(b.total_amount || 0));
            } else if (filters.sortBy === 'invoice_asc') {
              pool.sort((a, b) => String(a.invoice_no || a.id).localeCompare(String(b.invoice_no || b.id)));
            } else {
              pool.sort((a, b) => (b.sale_date || b.created_at || '').localeCompare(a.sale_date || a.created_at || ''));
            }
          }

          setReportRows(pool);
        }

        // ── 📊 REPORT TYPE: CUSTOMER SALES & VOLUME ANALYSIS ──
        else if (rType === 'customer-sales') {
          let invQuery = supabase.from('sales_invoices').select('*');
          if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) invQuery = invQuery.in('customer_name', filters.customer);
          if (filters.salesman && filters.salesman.length > 0 && !filters.salesman.includes('All')) invQuery = invQuery.in('salesman', filters.salesman);
          if (filters.transport && filters.transport.length > 0 && !filters.transport.includes('All')) invQuery = invQuery.in('transport_name', filters.transport);
          if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) invQuery = invQuery.in('dispatch_warehouse', filters.location);

          if (filters.saleType && filters.saleType !== 'All') {
            if (filters.saleType === 'Cash') invQuery = invQuery.eq('payment_term', 'Cash');
            else invQuery = invQuery.neq('payment_term', 'Cash');
          }
          if (filters.saleMethod && filters.saleMethod !== 'All') {
            if (filters.saleMethod === 'Direct') invQuery = invQuery.or('dc_no.is.null,dc_no.eq.""');
            else invQuery = invQuery.neq('dc_no', '');
          }

          let retQuery = supabase.from('sales_returns').select('*');
          if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) retQuery = retQuery.in('customer_name', filters.customer);
          if (filters.salesman && filters.salesman.length > 0 && !filters.salesman.includes('All')) retQuery = retQuery.in('salesman', filters.salesman);
          if (filters.transport && filters.transport.length > 0 && !filters.transport.includes('All')) retQuery = retQuery.in('transport_name', filters.transport);
          if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) retQuery = retQuery.in('dispatch_warehouse', filters.location);

          const [invRes, retRes] = await Promise.all([fetchAllPages(invQuery), fetchAllPages(retQuery)]);
          if (invRes.error) throw invRes.error;
          if (retRes.error) throw retRes.error;

          let invPool = invRes.data || [];
          let retPool = retRes.data || [];

          if (filters.dateFrom && filters.dateTo) {
            const startStr = String(filters.dateFrom).split('T')[0];
            const endStr = String(filters.dateTo).split('T')[0];
            invPool = invPool.filter(i => {
              const targetDateStr = String(i.sale_date || i.created_at || '').split('T')[0];
              return targetDateStr >= startStr && targetDateStr <= endStr;
            });
            retPool = retPool.filter(r => {
              const targetDateStr = String(r.return_date || r.created_at || '').split('T')[0];
              return targetDateStr >= startStr && targetDateStr <= endStr;
            });
          }

          // Filter by product / brand / category if specified in filters
          if ((filters.product && filters.product.length > 0 && !filters.product.includes('All')) ||
            (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) ||
            (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) ||
            (filters.color && filters.color.length > 0 && !filters.color.includes('All'))) {
            const filterItemMatch = (record: any) => {
              const items = extractItemDetails(record);
              return items.some(it => {
                const pName = it.name;
                const matchingProd = (prodData || []).find((p: any) => (p.product_name || '').trim().toLowerCase() === pName.trim().toLowerCase());
                if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                  if (!filters.product.includes(pName)) return false;
                }
                if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                  const prodCat = matchingProd?.category || matchingProd?.parent_category || '';
                  if (!filters.parentCategory.includes(prodCat)) return false;
                }
                if (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) {
                  const prodBrand = matchingProd?.brand || '';
                  if (!filters.bin.includes(prodBrand)) return false;
                }
                if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                  const prodColor = String(matchingProd?.color || productColorMapObj[String(matchingProd?.product_name || '').trim().toLowerCase()] || extractProductColor(matchingProd) || '').trim().toLowerCase();
                  if (!filters.color.map(x => String(x).toLowerCase()).includes(prodColor)) return false;
                }
                return true;
              });
            };
            invPool = invPool.filter(filterItemMatch);
            retPool = retPool.filter(filterItemMatch);
          }

          const customerMap: Record<string, any> = {};

          invPool.forEach((inv: any) => {
            const cName = (inv.customer_name && String(inv.customer_name).trim()) ? String(inv.customer_name).trim() : 'Counter Retail Buyer';
            if (!customerMap[cName]) {
              customerMap[cName] = {
                customer_name: cName,
                invoices_count: 0,
                returns_count: 0,
                gross_units: 0,
                returned_units: 0,
                net_units: 0,
                gross_sales: 0,
                cash_sales: 0,
                credit_sales: 0,
                return_amount: 0,
                net_sales: 0,
                total_sales: 0,
                total_units: 0,
                contribution_pct: 0,
                transactions: [],
                return_transactions: []
              };
            }

            const invTotal = Number(inv.total_amount || 0);
            const isCash = String(inv.payment_term || '').toLowerCase() === 'cash';
            const invItems = extractItemDetails(inv);
            const invUnits = invItems.reduce((sum, it) => sum + Number(it.qty || 0), 0);

            customerMap[cName].invoices_count += 1;
            customerMap[cName].gross_units += invUnits;
            customerMap[cName].gross_sales += invTotal;
            if (isCash) {
              customerMap[cName].cash_sales += invTotal;
            } else {
              customerMap[cName].credit_sales += invTotal;
            }
            customerMap[cName].transactions.push({
              ...inv,
              record_type: 'invoice',
              calculated_units: invUnits,
              items_details: invItems
            });
          });

          retPool.forEach((ret: any) => {
            const cName = (ret.customer_name && String(ret.customer_name).trim()) ? String(ret.customer_name).trim() : 'Counter Retail Buyer';
            if (!customerMap[cName]) {
              customerMap[cName] = {
                customer_name: cName,
                invoices_count: 0,
                returns_count: 0,
                gross_units: 0,
                returned_units: 0,
                net_units: 0,
                gross_sales: 0,
                cash_sales: 0,
                credit_sales: 0,
                return_amount: 0,
                net_sales: 0,
                total_sales: 0,
                total_units: 0,
                contribution_pct: 0,
                transactions: [],
                return_transactions: []
              };
            }

            const retTotal = Number(ret.return_amount || ret.total_amount || 0);
            const retItems = extractItemDetails(ret);
            const retUnits = retItems.reduce((sum, it) => sum + Number(it.qty || 0), 0);

            customerMap[cName].returns_count += 1;
            customerMap[cName].returned_units += retUnits;
            customerMap[cName].return_amount += retTotal;
            customerMap[cName].return_transactions.push({
              ...ret,
              record_type: 'return',
              calculated_units: retUnits,
              items_details: retItems
            });
          });

          // Finalize net calculations
          let totalAllPoolNetSales = 0;
          Object.values(customerMap).forEach((cust: any) => {
            cust.net_units = cust.gross_units - cust.returned_units;
            cust.net_sales = cust.gross_sales - cust.return_amount;
            cust.total_sales = cust.net_sales;
            cust.total_units = cust.net_units;
            totalAllPoolNetSales += cust.net_sales;
          });

          const customerGroups = Object.values(customerMap).map((cust: any) => {
            return {
              ...cust,
              contribution_pct: totalAllPoolNetSales > 0 ? (cust.net_sales / totalAllPoolNetSales) * 100 : 0
            };
          });

          // Sort customer groups by net_sales descending (leaderboard)
          customerGroups.sort((a, b) => b.net_sales - a.net_sales);

          setReportRows(customerGroups);
        }

        // ── 📊 REPORT TYPE: SALES RETURN & CREDIT LEDGER (CUSTOMER-WISE) ──
        else if (rType === 'return') {
          let query = supabase.from('sales_returns').select('*');
          if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) query = query.in('customer_name', filters.customer);
          if (filters.salesman && filters.salesman.length > 0 && !filters.salesman.includes('All')) query = query.in('salesman', filters.salesman);
          if (filters.transport && filters.transport.length > 0 && !filters.transport.includes('All')) query = query.in('transport_name', filters.transport);
          if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) query = query.in('dispatch_warehouse', filters.location);

          const { data, error } = await fetchAllPages(query);
          if (error) throw error;

          let pool = data || [];
          if ((filters.product && filters.product.length > 0 && !filters.product.includes('All')) ||
            (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) ||
            (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) ||
            (filters.color && filters.color.length > 0 && !filters.color.includes('All'))) {
            pool = pool.filter((inv: any) => {
              const items = extractItemDetails(inv);
              return items.some(it => {
                const pName = it.name;
                const matchingProd = (prodData || []).find((p: any) => (p.product_name || '').trim().toLowerCase() === pName.trim().toLowerCase());
                if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                  if (!filters.product.includes(pName)) return false;
                }
                if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                  const prodCat = matchingProd?.category || matchingProd?.parent_category || '';
                  if (!filters.parentCategory.includes(prodCat)) return false;
                }
                if (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) {
                  const prodBrand = matchingProd?.brand || '';
                  if (!filters.bin.includes(prodBrand)) return false;
                }
                if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                  const prodColor = String(it.color || matchingProd?.color || productColorMapObj[String(matchingProd?.product_name || '').trim().toLowerCase()] || extractProductColor(matchingProd) || '').trim().toLowerCase();
                  const normColors = filters.color.map((x: string) => String(x).trim().toLowerCase());
                  if (!prodColor || !normColors.includes(prodColor)) return false;
                }
                return true;
              });
            });
          }
          if (filters.dateFrom && filters.dateTo) {
            const startStr = String(filters.dateFrom).split('T')[0];
            const endStr = String(filters.dateTo).split('T')[0];
            pool = pool.filter(r => {
              const targetDateStr = String(r.return_date || r.created_at || '').split('T')[0];
              return targetDateStr >= startStr && targetDateStr <= endStr;
            });
          }

          // Filter by product / brand / category if specified in filters
          if ((filters.product && filters.product.length > 0 && !filters.product.includes('All')) ||
            (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) ||
            (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) ||
            (filters.color && filters.color.length > 0 && !filters.color.includes('All'))) {
            pool = pool.filter((ret: any) => {
              const items = extractItemDetails(ret);
              return items.some(it => {
                const pName = it.name;
                const matchingProd = (prodData || []).find((p: any) => (p.product_name || '').trim().toLowerCase() === pName.trim().toLowerCase());
                if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                  if (!filters.product.includes(pName)) return false;
                }
                if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                  const prodCat = matchingProd?.category || matchingProd?.parent_category || '';
                  if (!filters.parentCategory.includes(prodCat)) return false;
                }
                if (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) {
                  const prodBrand = matchingProd?.brand || '';
                  if (!filters.bin.includes(prodBrand)) return false;
                }
                if (filters.color && filters.color.length > 0 && !filters.color.includes('All')) {
                  const prodColor = String(matchingProd?.color || productColorMapObj[String(matchingProd?.product_name || '').trim().toLowerCase()] || extractProductColor(matchingProd) || '').trim().toLowerCase();
                  if (!filters.color.map(x => String(x).toLowerCase()).includes(prodColor)) return false;
                }
                return true;
              });
            });
          }

          // Sort individual return records
          if (filters.sortBy) {
            if (filters.sortBy === 'date_asc') {
              pool.sort((a, b) => (a.return_date || a.created_at || '').localeCompare(b.return_date || b.created_at || ''));
            } else if (filters.sortBy === 'amount_desc') {
              pool.sort((a, b) => Number(b.return_amount || b.total_amount || 0) - Number(a.return_amount || a.total_amount || 0));
            } else if (filters.sortBy === 'amount_asc') {
              pool.sort((a, b) => Number(a.return_amount || a.total_amount || 0) - Number(b.return_amount || b.total_amount || 0));
            } else if (filters.sortBy === 'invoice_asc') {
              pool.sort((a, b) => String(a.return_no || a.id).localeCompare(String(b.return_no || b.id)));
            } else {
              pool.sort((a, b) => (b.return_date || b.created_at || '').localeCompare(a.return_date || a.created_at || ''));
            }
          }

          const totalAllReturnAmount = pool.reduce((acc, r) => acc + Number(r.return_amount || r.total_amount || 0), 0);
          const customerMap: Record<string, any> = {};

          pool.forEach((ret: any) => {
            const cName = (ret.customer_name && String(ret.customer_name).trim()) ? String(ret.customer_name).trim() : 'Counter Retail Buyer';
            if (!customerMap[cName]) {
              customerMap[cName] = {
                customer_name: cName,
                returns_count: 0,
                total_returned_qty: 0,
                total_return_amount: 0,
                contribution_pct: 0,
                transactions: []
              };
            }

            const retItems = extractItemDetails(ret);
            const retQty = retItems.reduce((sum, it) => sum + Number(it.qty || 0), 0);
            const retAmount = Number(ret.return_amount || ret.total_amount || 0);

            customerMap[cName].returns_count += 1;
            customerMap[cName].total_returned_qty += retQty;
            customerMap[cName].total_return_amount += retAmount;
            customerMap[cName].transactions.push({
              ...ret,
              calculated_qty: retQty,
              calculated_amount: retAmount
            });
          });

          const customerGroups = Object.values(customerMap).map((cust: any) => ({
            ...cust,
            contribution_pct: totalAllReturnAmount > 0 ? (cust.total_return_amount / totalAllReturnAmount) * 100 : 0
          }));

          // Sort customer groups by total_return_amount descending (leaderboard)
          customerGroups.sort((a, b) => b.total_return_amount - a.total_return_amount);

          setReportRows(customerGroups);
        }

        // ── 📊 REPORT TYPE: SALES INVOICE DETAIL REPORT ──
        else if (rType === 'invoice') {
          let query = supabase.from('sales_invoices').select('*');
          const targetInv = filters.invoiceNo || filters.invoice;
          if (targetInv && targetInv !== 'All') {
            query = query.or(`id.eq.${targetInv},invoice_no.eq.${targetInv}`);
          }
          if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) query = query.in('customer_name', filters.customer);
          if (filters.location && filters.location.length > 0 && !filters.location.includes('All')) query = query.in('dispatch_warehouse', filters.location);
          if (filters.salesman && filters.salesman.length > 0 && !filters.salesman.includes('All')) query = query.in('salesman', filters.salesman);

          const { data, error } = await fetchAllPages(query);
          if (error) throw error;

          let pool = data || [];
          if (filters.dateFrom && filters.dateTo) {
            const startStr = String(filters.dateFrom).split('T')[0];
            const endStr = String(filters.dateTo).split('T')[0];
            pool = pool.filter(i => {
              const targetDateStr = String(i.sale_date || i.created_at || '').split('T')[0];
              return targetDateStr >= startStr && targetDateStr <= endStr;
            });
          }

          if (filters.sortBy) {
            if (filters.sortBy === 'date_asc') {
              pool.sort((a, b) => (a.sale_date || a.created_at || '').localeCompare(b.sale_date || b.created_at || ''));
            } else if (filters.sortBy === 'amount_desc') {
              pool.sort((a, b) => Number(b.total_amount || 0) - Number(a.total_amount || 0));
            } else if (filters.sortBy === 'amount_asc') {
              pool.sort((a, b) => Number(a.total_amount || 0) - Number(b.total_amount || 0));
            } else if (filters.sortBy === 'invoice_asc') {
              pool.sort((a, b) => String(a.invoice_no || a.id).localeCompare(String(b.invoice_no || b.id)));
            } else {
              pool.sort((a, b) => (b.sale_date || b.created_at || '').localeCompare(a.sale_date || a.created_at || ''));
            }
          }

          setReportRows(pool);
        }

        // ── 📊 REPORT TYPE: CUSTOMER FINANCIAL STATEMENT & INVOICING LEDGER ──
        else if (rType === 'loyalty') {
          let query = supabase.from('sales_invoices').select('*').order('created_at', { ascending: true });
          if (filters.customer && filters.customer.length > 0 && !filters.customer.includes('All')) query = query.in('customer_name', filters.customer);
          if (filters.salesman && filters.salesman.length > 0 && !filters.salesman.includes('All')) query = query.in('salesman', filters.salesman);

          const { data: invData, error: invError } = await fetchAllPages(query);
          if (invError) throw invError;

          let filteredInvs = invData || [];
          if (filters.dateFrom && filters.dateTo) {
            const startStr = String(filters.dateFrom).split('T')[0];
            const endStr = String(filters.dateTo).split('T')[0];
            filteredInvs = filteredInvs.filter(i => {
              const targetDateStr = String(i.sale_date || i.created_at || '').split('T')[0];
              return targetDateStr >= startStr && targetDateStr <= endStr;
            });
          }

          // Group by customer_name
          const customerMap: Record<string, any> = {};

          filteredInvs.forEach((inv: any) => {
            const cName = inv.customer_name || 'Walking Customer';
            if (!customerMap[cName]) {
              customerMap[cName] = {
                customer_name: cName,
                transactions: [],
                total_billed: 0,
                total_paid: 0,
                net_balance: 0,
                total_sales_amount: 0,
                invoices_count: 0
              };
            }

            const billed = Number(inv.net_amount || inv.total_amount || 0);
            const paid = inv.amount_paid !== undefined && inv.amount_paid !== null
              ? Number(inv.amount_paid)
              : (inv.receipt_status === 'Paid' || inv.sale_status === 'Completed' ? billed : 0);
            const currentRunning = customerMap[cName].net_balance + (billed - paid);

            customerMap[cName].total_billed += billed;
            customerMap[cName].total_paid += paid;
            customerMap[cName].net_balance = currentRunning;
            customerMap[cName].total_sales_amount += billed;
            customerMap[cName].invoices_count += 1;

            customerMap[cName].transactions.push({
              id: `inv-${inv.id}`,
              date: inv.sale_date || String(inv.created_at || '').split('T')[0],
              invoice_no: inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`,
              salesman: inv.salesman || 'Direct',
              narration: `Sales Invoice #${inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`}${inv.sale_status ? ` (${inv.sale_status})` : ''}`,
              billed_amount: billed,
              paid_amount: paid,
              balance: currentRunning,
              status: inv.receipt_status || (billed === paid ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid')
            });
          });

          const customerGroups = Object.values(customerMap).sort((a, b) => a.customer_name.localeCompare(b.customer_name));

          setReportRows(customerGroups);
        }
      } catch (err: any) {
        toast.error('Audit compilation trace failed: ' + err.message);
      } finally {
        setLoading(false);
      }

};
