import { useState, useEffect } from 'react';
import { supabase } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { parseItems, getRowDiscounts } from '../utils/purchaseReportHelpers';

export const usePurchaseReportData = (rType: string, filters: any = {}) => {
  const [loading, setLoading] = useState(true);
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [categoryHierarchyTree, setCategoryHierarchyTree] = useState<any[]>([]);
  const [productLookupMap, setProductLookupMap] = useState<Record<string, any>>({});
  const [vendorLookupMap, setVendorLookupMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const compilePurchaseStructuredDataset = async () => {
      try {
        setLoading(true);

        const [prodRes, purRes, retRes, catRes, venRes] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('supplier_purchases').select('*').order('id', { ascending: true }),
          supabase.from('purchase_returns').select('*').order('id', { ascending: true }),
          supabase.from('inventory_categories').select('id, name, parent_id'),
          supabase.from('vendors').select('id, vendor_name, name, vendor_code, vendorCode, page_no, pageNo')
        ]);

        const allProducts = prodRes.data || [];
        const allPurchases = purRes.data || [];
        const allReturns = retRes.data || [];
        const allCategories = catRes.data || [];
        const allVendors = venRes.data || [];

        // Build vendor lookup map
        const vLookup: Record<string, any> = {};
        allVendors.forEach((v: any) => {
          const vName = (v.vendor_name || v.name || '').trim().toLowerCase();
          if (vName) vLookup[vName] = v;
          if (v.id) vLookup[String(v.id)] = v;
        });
        setVendorLookupMap(vLookup);

        // Build category lookup and ancestor map
        const catById = new Map<number, any>();
        const catByName = new Map<string, any>();
        allCategories.forEach((c: any) => {
          if (c.id) catById.set(Number(c.id), c);
          if (c.name) catByName.set(String(c.name).trim().toLowerCase(), c);
        });

        const getCategoryAncestors = (catName: string): string[] => {
          const names: string[] = [];
          let cur = catByName.get(String(catName || '').trim().toLowerCase());
          let depth = 0;
          while (cur && depth < 10) {
            names.push(String(cur.name || '').trim().toLowerCase());
            if (cur.parent_id) {
              cur = catById.get(Number(cur.parent_id));
            } else {
              break;
            }
            depth++;
          }
          if (catName && !names.includes(String(catName).trim().toLowerCase())) {
            names.push(String(catName).trim().toLowerCase());
          }
          return names;
        };

        // Product lookup map
        const productLookup: Record<string, any> = {};
        allProducts.forEach((p: any) => {
          if (p.product_name) {
            productLookup[p.product_name.trim().toLowerCase()] = p;
          }
        });
        setProductLookupMap(productLookup);

        const getProductMeta = (pName: string) => {
          const pKey = (pName || '').trim().toLowerCase();
          const matched = productLookup[pKey] || {};

          let pCat = matched.sub_sub_category || matched.parent_category || '';
          let sCat = matched.sub_category || '';
          let lCat = matched.category || '';

          // Dynamically verify and align 3-tier hierarchy from master category tables if needed
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
          const brand = matched?.brand || matched?.bin || '-';
          return { parentCategory: pCat, subCategory: sCat, category: lCat, sku, uom, brand };
        };

        const startTimestamp = filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00').getTime() : 0;
        const endTimestamp = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59.999').getTime() : Infinity;

        const normalizeFilterList = (val: any): string[] => {
          if (!val) return [];
          const arr = Array.isArray(val) ? val : [val];
          return arr
            .map((x: any) => String(x || '').trim().toLowerCase())
            .filter((x: string) => x && x !== 'all' && !x.startsWith('all '));
        };

        const vendorList = normalizeFilterList(filters.supplier || filters.vendor);
        const locList = normalizeFilterList(filters.location);
        const parentCatList = normalizeFilterList(filters.parentCategory || filters.category);
        const subCatList = normalizeFilterList(filters.subCategory);
        const subSubCatList = normalizeFilterList(filters.subSubCategory || filters.category);
        const prodList = normalizeFilterList(filters.product);
        const brandList = normalizeFilterList(filters.brand || filters.bin);
        const uomList = normalizeFilterList(filters.uom);
        const pMode = String(filters.purchaseType || filters.saleType || '').trim().toLowerCase();

        const doesItemMatchCriteria = (it: any, purchaseHeader?: any) => {
          if (!it) return false;
          const pName = String(it.itemName || it.product_name || it.name || '').trim();
          const pKey = pName.toLowerCase();
          const { parentCategory: pCat, subCategory: sCat, category: lCat, brand, uom } = getProductMeta(pName);
          const itemWh = String(it.warehouse || it.target_warehouse || purchaseHeader?.target_warehouse || purchaseHeader?.warehouse || '').trim().toLowerCase();

          // Compile all category tags and ancestors for this product
          const allCatTags = new Set<string>();
          if (pCat) {
            getCategoryAncestors(pCat).forEach(c => allCatTags.add(c));
          }
          if (sCat) {
            getCategoryAncestors(sCat).forEach(c => allCatTags.add(c));
          }
          if (lCat) {
            getCategoryAncestors(lCat).forEach(c => allCatTags.add(c));
          }
          if (pCat.toLowerCase().includes('tile') || sCat.toLowerCase().includes('tile') || lCat.toLowerCase().includes('tile')) {
            allCatTags.add('tile');
            allCatTags.add('tiles');
          }

          if (locList.length > 0) {
            if (!itemWh || !locList.includes(itemWh)) return false;
          }
          if (prodList.length > 0) {
            if (!prodList.includes(pKey)) return false;
          }
          if (parentCatList.length > 0) {
            const matchesParent = parentCatList.some(pc => allCatTags.has(pc) || pc.includes(pCat.toLowerCase()) || pCat.toLowerCase().includes(pc));
            if (!matchesParent) return false;
          }
          if (subCatList.length > 0) {
            const matchesSub = subCatList.some(sc => allCatTags.has(sc) || sc.includes(sCat.toLowerCase()) || sCat.toLowerCase().includes(sc));
            if (!matchesSub) return false;
          }
          if (subSubCatList.length > 0) {
            const matchesSubSub = subSubCatList.some(ssc => allCatTags.has(ssc) || ssc.includes(lCat.toLowerCase()) || lCat.toLowerCase().includes(ssc));
            if (!matchesSubSub) return false;
          }
          if (brandList.length > 0) {
            const matchesBrand = brandList.some(b =>
              brand.toLowerCase().includes(b) ||
              b.includes(brand.toLowerCase()) ||
              pKey.includes(b)
            );
            if (!matchesBrand) return false;
          }
          if (uomList.length > 0) {
            if (!uomList.includes(uom.toLowerCase())) return false;
          }
          return true;
        };

        // Common purchase filter logic
        const filterPurchaseRecord = (p: any) => {
          const rawDate = p.purchase_date || p.created_at;
          const t = rawDate ? new Date(String(rawDate).includes('T') ? String(rawDate) : String(rawDate) + 'T12:00:00').getTime() : 0;
          if (t < startTimestamp || t > endTimestamp) return false;

          // Vendor filter
          if (vendorList.length > 0) {
            const pSup = String(p.supplier_name || p.vendor_name || '').trim().toLowerCase();
            if (!vendorList.includes(pSup)) return false;
          }

          // Payment mode filter
          if (pMode && pMode !== 'all') {
            const rawTerm = String(p.payment_term || '').toLowerCase();
            const isCash = rawTerm.includes('cash');
            if (pMode === 'cash' && !isCash) return false;
            if (pMode === 'credit' && isCash) return false;
          }

          const items = parseItems(p.items);

          // Location filter check
          if (locList.length > 0) {
            const headerLoc = String(p.target_warehouse || p.warehouse || '').trim().toLowerCase();
            const matchesHeader = headerLoc && locList.includes(headerLoc);
            const matchesItem = items.some((it: any) => {
              const itemLoc = String(it.warehouse || it.target_warehouse || '').trim().toLowerCase();
              return itemLoc && locList.includes(itemLoc);
            });
            if (!matchesHeader && !matchesItem) return false;
          }

          // Line item criteria check
          const hasLineItemFilters = prodList.length > 0 || parentCatList.length > 0 || subCatList.length > 0 || subSubCatList.length > 0 || brandList.length > 0 || uomList.length > 0;
          if (hasLineItemFilters) {
            if (!items.some((it: any) => doesItemMatchCriteria(it, p))) return false;
          }

          return true;
        };

        // Common return filter logic
        const filterReturnRecord = (r: any) => {
          const rawDate = r.return_date || r.created_at;
          const t = rawDate ? new Date(String(rawDate).includes('T') ? String(rawDate) : String(rawDate) + 'T12:00:00').getTime() : 0;
          if (t < startTimestamp || t > endTimestamp) return false;

          if (vendorList.length > 0) {
            const rSup = String(r.supplier_name || r.vendor_name || '').trim().toLowerCase();
            if (!vendorList.includes(rSup)) return false;
          }

          const items = parseItems(r.returned_items || r.items);
          if (locList.length > 0) {
            const headerLoc = String(r.source_warehouse || r.warehouse || '').trim().toLowerCase();
            const matchesHeader = headerLoc && locList.includes(headerLoc);
            const matchesItem = items.some((it: any) => {
              const itemLoc = String(it.warehouse || it.source_warehouse || '').trim().toLowerCase();
              return itemLoc && locList.includes(itemLoc);
            });
            if (!matchesHeader && !matchesItem) return false;
          }

          const hasLineItemFilters = prodList.length > 0 || parentCatList.length > 0 || subCatList.length > 0 || subSubCatList.length > 0 || brandList.length > 0 || uomList.length > 0;
          if (hasLineItemFilters) {
            if (!items.some((it: any) => doesItemMatchCriteria(it, r))) return false;
          }

          return true;
        };

        // ══════════════════════════════════════════════════════════════
        // 1. REPORT: CATEGORY-WISE PURCHASES & VOLUME REPORT
        // ══════════════════════════════════════════════════════════════
        if (rType === 'category-purchases') {
          const filteredPurchases = allPurchases.filter(filterPurchaseRecord);
          const filteredReturns = allReturns.filter(filterReturnRecord);

          // 3-Tier Hierarchy Tree: Parent -> Sub -> Category -> Products
          const parentCategoryTree: Record<string, any> = {};

          const getOrCreateNodes = (pCatName: string, sCatName: string, leafCatName: string) => {
            const pKey = pCatName || 'General';
            const sKey = sCatName || 'General';
            const lKey = leafCatName || 'General';

            if (!parentCategoryTree[pKey]) {
              parentCategoryTree[pKey] = {
                parent_name: pKey,
                gross_units: 0,
                returned_units: 0,
                net_units: 0,
                gross_purchases: 0,
                returned_amount: 0,
                net_expenditure: 0,
                contribution_pct: 0,
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
                gross_purchases: 0,
                returned_amount: 0,
                net_expenditure: 0,
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
                gross_purchases: 0,
                returned_amount: 0,
                net_expenditure: 0,
                products_map: {}
              };
            }
            const leafNode = subNode.categories_map[lKey];

            return { parentNode, subNode, leafNode };
          };

          // Aggregate Purchases
          filteredPurchases.forEach((pur: any) => {
            const items = parseItems(pur.items);
            const pDate = String(pur.purchase_date || pur.created_at || '').split('T')[0];
            const pNo = pur.purchase_no || `PUR-${pur.id}`;
            const sName = pur.supplier_name || pur.vendor_name || 'Generic Wholesaler';

            items.forEach((it: any) => {
              const pName = (it.itemName || it.product_name || it.name || '').trim();
              if (!pName) return;

              if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                if (!filters.product.includes(pName)) return;
              }

              const { parentCategory: pCat, subCategory: sCat, category: lCat, sku, uom, brand } = getProductMeta(pName);

              if (parentCatList.length > 0) {
                const matches = parentCatList.some(fc => pCat.toLowerCase() === fc || pCat.toLowerCase().includes(fc) || fc.includes(pCat.toLowerCase()));
                if (!matches) return;
              }
              if (subCatList.length > 0) {
                const matches = subCatList.some(sc => sCat.toLowerCase() === sc || sCat.toLowerCase().includes(sc) || sc.includes(sCat.toLowerCase()));
                if (!matches) return;
              }
              if (subSubCatList.length > 0) {
                const matches = subSubCatList.some(ssc => lCat.toLowerCase() === ssc || lCat.toLowerCase().includes(ssc) || ssc.includes(lCat.toLowerCase()));
                if (!matches) return;
              }
              if (brandList.length > 0) {
                const matches = brandList.some(b => brand.toLowerCase().includes(b) || b.includes(brand.toLowerCase()) || pName.toLowerCase().includes(b));
                if (!matches) return;
              }
              if (uomList.length > 0) {
                if (!uomList.includes(uom.toLowerCase())) return;
              }

              const { parentNode, subNode, leafNode } = getOrCreateNodes(pCat, sCat, lCat);
              const qty = Number(it.qty || it.quantity || 1);
              const rate = Number(it.purchase_price ?? it.cost_price ?? it.unit_price ?? it.rate ?? it.price ?? 0);
              const lineTotal = Number(it.total || it.amount || it.subtotal || (qty * rate) || 0);

              const pKey = pName.toLowerCase();
              if (!leafNode.products_map[pKey]) {
                leafNode.products_map[pKey] = {
                  product_name: pName,
                  sku: it.sku || sku,
                  uom: it.uom || uom,
                  brand: it.brand || brand,
                  bought_qty: 0,
                  returned_qty: 0,
                  net_qty: 0,
                  gross_spend: 0,
                  returned_amount: 0,
                  net_spend: 0,
                  last_purchase_date: pDate,
                  last_supplier: sName
                };
              }

              const pEntry = leafNode.products_map[pKey];
              pEntry.bought_qty += qty;
              pEntry.gross_spend += lineTotal;
              pEntry.net_spend += lineTotal;
              pEntry.last_purchase_date = pDate;
              pEntry.last_supplier = sName;

              leafNode.gross_units += qty;
              leafNode.gross_purchases += lineTotal;
              subNode.gross_units += qty;
              subNode.gross_purchases += lineTotal;
              parentNode.gross_units += qty;
              parentNode.gross_purchases += lineTotal;
            });
          });

          // Aggregate Returns
          filteredReturns.forEach((ret: any) => {
            const items = parseItems(ret.items || ret.returned_items);
            items.forEach((it: any) => {
              const pName = (it.itemName || it.product_name || it.name || '').trim();
              if (!pName) return;

              if (prodList.length > 0) {
                if (!prodList.includes(pName.toLowerCase())) return;
              }

              const { parentCategory: pCat, subCategory: sCat, category: lCat, brand, uom } = getProductMeta(pName);

              if (parentCatList.length > 0) {
                const matches = parentCatList.some(fc => pCat.toLowerCase() === fc || pCat.toLowerCase().includes(fc) || fc.includes(pCat.toLowerCase()));
                if (!matches) return;
              }
              if (subCatList.length > 0) {
                const matches = subCatList.some(sc => sCat.toLowerCase() === sc || sCat.toLowerCase().includes(sc) || sc.includes(sCat.toLowerCase()));
                if (!matches) return;
              }
              if (subSubCatList.length > 0) {
                const matches = subSubCatList.some(ssc => lCat.toLowerCase() === ssc || lCat.toLowerCase().includes(ssc) || ssc.includes(lCat.toLowerCase()));
                if (!matches) return;
              }
              if (brandList.length > 0) {
                const matches = brandList.some(b => brand.toLowerCase().includes(b) || b.includes(brand.toLowerCase()) || pName.toLowerCase().includes(b));
                if (!matches) return;
              }
              if (uomList.length > 0) {
                if (!uomList.includes(uom.toLowerCase())) return;
              }

              const { parentNode, subNode, leafNode } = getOrCreateNodes(pCat, sCat, lCat);
              const qty = Number(it.qty || it.quantity || 1);
              const rate = Number(it.purchase_price ?? it.cost_price ?? it.unit_price ?? it.rate ?? 0);
              const lineTotal = Number(it.total || it.amount || (qty * rate) || 0);

              const pKey = pName.toLowerCase();
              if (leafNode.products_map[pKey]) {
                leafNode.products_map[pKey].returned_qty += qty;
                leafNode.products_map[pKey].returned_amount += lineTotal;
                leafNode.products_map[pKey].net_qty = leafNode.products_map[pKey].bought_qty - leafNode.products_map[pKey].returned_qty;
                leafNode.products_map[pKey].net_spend = Math.max(0, leafNode.products_map[pKey].gross_spend - leafNode.products_map[pKey].returned_amount);
              }

              leafNode.returned_units += qty;
              leafNode.returned_amount += lineTotal;
              subNode.returned_units += qty;
              subNode.returned_amount += lineTotal;
              parentNode.returned_units += qty;
              parentNode.returned_amount += lineTotal;
            });
          });

          let totalNetExpenditureAll = 0;
          Object.values(parentCategoryTree).forEach((p: any) => {
            Object.values(p.sub_categories_map).forEach((s: any) => {
              Object.values(s.categories_map).forEach((c: any) => {
                c.net_units = c.gross_units - c.returned_units;
                c.net_expenditure = Math.max(0, c.gross_purchases - c.returned_amount);
                totalNetExpenditureAll += c.net_expenditure;
              });
            });
          });

          // Compile flat rows & hierarchical tree
          const flatCategoryRows: any[] = [];
          const hierarchyTree: any[] = [];

          Object.values(parentCategoryTree).forEach((pNode: any) => {
            pNode.net_units = pNode.gross_units - pNode.returned_units;
            pNode.net_expenditure = Math.max(0, pNode.gross_purchases - pNode.returned_amount);

            const subCatList: any[] = [];

            Object.values(pNode.sub_categories_map).forEach((sNode: any) => {
              sNode.net_units = sNode.gross_units - sNode.returned_units;
              sNode.net_expenditure = Math.max(0, sNode.gross_purchases - sNode.returned_amount);

              const leafCatList: any[] = [];

              Object.values(sNode.categories_map).forEach((lNode: any) => {
                const prodList = Object.values(lNode.products_map).map((p: any) => {
                  const netQ = p.bought_qty - p.returned_qty;
                  const netS = Math.max(0, p.gross_spend - p.returned_amount);
                  const share = lNode.net_expenditure > 0 ? (netS / lNode.net_expenditure) * 100 : 0;
                  return {
                    ...p,
                    net_qty: netQ,
                    final_net_spend: netS,
                    share_of_category: share
                  };
                });

                prodList.sort((a, b) => b.final_net_spend - a.final_net_spend);

                flatCategoryRows.push({
                  category_name: lNode.category_name,
                  parent_name: pNode.parent_name,
                  sub_name: sNode.sub_name,
                  products_count: prodList.length,
                  products: prodList,
                  gross_units: lNode.gross_units,
                  returned_units: lNode.returned_units,
                  net_units: lNode.net_units,
                  gross_purchases: lNode.gross_purchases,
                  returned_amount: lNode.returned_amount,
                  net_expenditure: lNode.net_expenditure,
                  contribution_pct: totalNetExpenditureAll > 0 ? (lNode.net_expenditure / totalNetExpenditureAll) * 100 : 0
                });

                leafCatList.push({
                  ...lNode,
                  products: prodList
                });
              });

              subCatList.push({
                ...sNode,
                categories: leafCatList
              });
            });

            hierarchyTree.push({
              ...pNode,
              sub_categories: subCatList
            });
          });

          flatCategoryRows.sort((a, b) => b.net_expenditure - a.net_expenditure);
          setReportRows(flatCategoryRows);
          setCategoryHierarchyTree(hierarchyTree);
        }

        // ══════════════════════════════════════════════════════════════
        // 2. REPORT: PRODUCT PURCHASE HISTORY & PRICE TREND
        // ══════════════════════════════════════════════════════════════
        else if (rType === 'product-purchase-history') {
          const filteredPurchases = allPurchases.filter(filterPurchaseRecord);
          const productHistoryMap: Record<string, any> = {};

          filteredPurchases.forEach((pur: any) => {
            const items = parseItems(pur.items);
            const pDate = String(pur.purchase_date || pur.created_at || '').split('T')[0];
            const pNo = pur.purchase_no || `PUR-${pur.id}`;
            const sName = pur.supplier_name || pur.vendor_name || 'Generic Wholesaler';
            const warehouse = pur.target_warehouse || pur.warehouse || 'Main Warehouse';

            items.forEach((it: any) => {
              const pName = (it.itemName || it.product_name || it.name || '').trim();
              if (!pName) return;

              if (filters.product && filters.product.length > 0 && !filters.product.includes('All')) {
                if (!filters.product.includes(pName)) return;
              }

              const { parentCategory: pCat, subCategory: sCat, category: lCat, sku, uom, brand } = getProductMeta(pName);

              if (filters.parentCategory && filters.parentCategory.length > 0 && !filters.parentCategory.includes('All')) {
                if (!filters.parentCategory.includes(pCat)) return;
              }
              if (filters.subCategory && filters.subCategory.length > 0 && !filters.subCategory.includes('All')) {
                if (!filters.subCategory.includes(sCat)) return;
              }
              if (filters.subSubCategory && filters.subSubCategory.length > 0 && !filters.subSubCategory.includes('All')) {
                if (!filters.subSubCategory.includes(lCat)) return;
              }
              if (filters.bin && filters.bin.length > 0 && !filters.bin.includes('All')) {
                if (!filters.bin.includes(brand)) return;
              }

              const qty = Number(it.qty || it.quantity || 1);
              const rate = Number(it.purchase_price ?? it.cost_price ?? it.unit_price ?? it.rate ?? it.price ?? 0);
              const lineTotal = Number(it.total || it.amount || it.subtotal || (qty * rate) || 0);

              const pKey = pName.toLowerCase();
              if (!productHistoryMap[pKey]) {
                productHistoryMap[pKey] = {
                  product_name: pName,
                  sku: it.sku || sku,
                  parent_category: pCat,
                  sub_category: sCat,
                  category: lCat,
                  brand: it.brand || brand,
                  uom: it.uom || uom,
                  total_purchased_qty: 0,
                  total_procurement_cost: 0,
                  min_unit_rate: rate > 0 ? rate : Infinity,
                  max_unit_rate: rate > 0 ? rate : 0,
                  latest_purchase_rate: rate,
                  latest_purchase_date: pDate,
                  transactions: []
                };
              }

              const pEntry = productHistoryMap[pKey];
              pEntry.total_purchased_qty += qty;
              pEntry.total_procurement_cost += lineTotal;
              if (rate > 0 && rate < pEntry.min_unit_rate) pEntry.min_unit_rate = rate;
              if (rate > pEntry.max_unit_rate) pEntry.max_unit_rate = rate;
              pEntry.latest_purchase_rate = rate;
              pEntry.latest_purchase_date = pDate;

              pEntry.transactions.push({
                purchase_no: pNo,
                date: pDate,
                supplier_name: sName,
                warehouse,
                qty,
                uom: it.uom || uom,
                rate,
                total_amount: lineTotal,
                payment_term: pur.payment_term || 'Settle'
              });
            });
          });

          const compiledProductHistory = Object.values(productHistoryMap).map((p: any) => {
            if (p.min_unit_rate === Infinity) p.min_unit_rate = 0;
            const avgRate = p.total_purchased_qty > 0 ? p.total_procurement_cost / p.total_purchased_qty : 0;
            p.transactions.sort((a: any, b: any) => b.date.localeCompare(a.date));
            return {
              ...p,
              avg_unit_rate: avgRate
            };
          });

          compiledProductHistory.sort((a, b) => b.total_procurement_cost - a.total_procurement_cost);
          setReportRows(compiledProductHistory);
        }

        // ══════════════════════════════════════════════════════════════
        // 3. REPORT: PURCHASE INVOICE ITEMIZED DETAIL REPORT
        // ══════════════════════════════════════════════════════════════
        else if (rType === 'purchase-invoice-detail' || rType === 'invoice') {
          let pool = allPurchases.filter(filterPurchaseRecord);

          const targetInv = filters.invoiceNo || filters.invoice;
          if (targetInv && targetInv !== 'All') {
            const list = Array.isArray(targetInv) ? targetInv : [targetInv];
            pool = pool.filter(p => list.some(inv => String(p.purchase_no || `PUR-${p.id}`).toLowerCase().includes(String(inv).toLowerCase())));
          }

          const compiledInvoices = pool.map(pur => {
            const items = parseItems(pur.items);
            const pDate = String(pur.purchase_date || pur.created_at || '').split('T')[0];
            const pNo = pur.purchase_no || `PUR-${pur.id}`;
            const sName = pur.supplier_name || pur.vendor_name || 'Generic Wholesaler';
            const warehouse = pur.target_warehouse || pur.warehouse || 'Main Warehouse';

            const lineItems = items.map((it: any, iIdx: number) => {
              const pName = (it.itemName || it.product_name || it.name || `Item ${iIdx + 1}`).trim();
              const { parentCategory, subCategory, category, brand, uom, sku } = getProductMeta(pName);
              const qty = Number(it.qty || it.quantity || 1);
              const rate = Number(it.purchase_price ?? it.cost_price ?? it.unit_price ?? it.rate ?? it.price ?? 0);
              const gross = qty * rate;
              const dPer = Number(it.discountPer ?? it.discount_per ?? 0);
              const dAmt = Number(it.discountAmt ?? it.discount_amt ?? (dPer > 0 ? (gross * dPer) / 100 : 0));
              const lineTotal = Number(it.total || it.amount || it.subtotal || Math.max(0, gross - dAmt) || 0);

              return {
                sno: iIdx + 1,
                product_name: pName,
                sku: it.sku || sku,
                parent_category: parentCategory,
                sub_category: subCategory,
                category: category,
                brand: it.brand || brand,
                uom: it.uom || uom,
                qty,
                rate,
                discountPer: dPer,
                discountAmt: dAmt,
                total_amount: lineTotal
              };
            });

            const invoiceTotalUnits = lineItems.reduce((sum: number, it: any) => sum + it.qty, 0);
            const rowDiscounts = getRowDiscounts(pur, items);

            return {
              id: pur.id,
              purchase_no: pNo,
              supplier_name: sName,
              vendor_code: pur.vendor_code || pur.supplier_code || '',
              page_no: pur.page_no || pur.pageNo || '',
              purchase_date: pDate,
              warehouse,
              payment_term: pur.payment_term || 'Settle',
              total_amount: Number(pur.total_amount || 0),
              total_units: invoiceTotalUnits,
              items_count: lineItems.length,
              line_items: lineItems,
              row_discounts: rowDiscounts
            };
          });

          compiledInvoices.sort((a, b) => b.purchase_date.localeCompare(a.purchase_date));
          setReportRows(compiledInvoices);
        }

        // ══════════════════════════════════════════════════════════════
        // 4. REPORT: PURCHASE RETURNS & DEBIT LEDGER
        // ══════════════════════════════════════════════════════════════
        else if (rType === 'return') {
          let pool = allReturns.filter(filterReturnRecord);
          const hasLineItemFilters = prodList.length > 0 || parentCatList.length > 0 || subCatList.length > 0 || subSubCatList.length > 0 || brandList.length > 0 || uomList.length > 0 || locList.length > 0;
          if (hasLineItemFilters) {
            pool = pool.map(r => {
              const allItems = parseItems(r.returned_items || r.items);
              const matchingItems = allItems.filter(it => doesItemMatchCriteria(it, r));
              const filteredTotal = matchingItems.reduce((sum: number, it: any) => {
                const qty = Number(it.qty || it.quantity || 1);
                const rate = Number(it.purchase_price ?? it.cost_price ?? it.unit_price ?? it.rate ?? it.price ?? 0);
                return sum + Number(it.total || it.amount || it.subtotal || (qty * rate) || 0);
              }, 0);
              return {
                ...r,
                returned_items: matchingItems,
                items: matchingItems,
                total_amount: filteredTotal,
                original_total_amount: r.total_amount
              };
            }).filter(r => r.items.length > 0);
          }
          setReportRows(pool);
        }

        // ══════════════════════════════════════════════════════════════
        // 5. REPORT: PURCHASE INVOICE REGISTER & PARAMETER QUERY
        // ══════════════════════════════════════════════════════════════
        else {
          let pool = allPurchases.filter(filterPurchaseRecord);
          const hasLineItemFilters = prodList.length > 0 || parentCatList.length > 0 || subCatList.length > 0 || subSubCatList.length > 0 || brandList.length > 0 || uomList.length > 0 || locList.length > 0;
          if (hasLineItemFilters) {
            pool = pool.map(p => {
              const allItems = parseItems(p.items);
              const matchingItems = allItems.filter(it => doesItemMatchCriteria(it, p));
              const filteredTotal = matchingItems.reduce((sum: number, it: any) => {
                const qty = Number(it.qty || it.quantity || 1);
                const rate = Number(it.purchase_price ?? it.cost_price ?? it.unit_price ?? it.rate ?? it.price ?? 0);
                return sum + Number(it.total || it.amount || it.subtotal || (qty * rate) || 0);
              }, 0);
              return {
                ...p,
                items: matchingItems,
                total_amount: filteredTotal,
                original_total_amount: p.total_amount
              };
            }).filter(p => p.items.length > 0);
          }
          setReportRows(pool);
        }
      } catch (err: any) {
        toast.error('Procurement auditing trace failure: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    compilePurchaseStructuredDataset();
  }, [rType, JSON.stringify(filters)]);


  return {
    loading,
    reportRows,
    categoryHierarchyTree,
    productLookupMap,
    vendorLookupMap
  };
};

export default usePurchaseReportData;
