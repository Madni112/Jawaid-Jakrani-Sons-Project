import * as XLSX from 'xlsx';
import { supabase } from '../../../../../Context/supabaseClient';
import { logActivity } from '../../../../../service/auditLogger';
import { ProcessedRow } from '../types/bulkUploadTypes';

export const exportFilteredRows = (
  rowsToExport: ProcessedRow[],
  type: 'ALL' | 'DUPLICATES' | 'REJECTED' = 'DUPLICATES'
) => {
  const exportData = rowsToExport.map(r => ({
    'Row #': r.rowIndex,
    'Status': r.status === 'ready' ? 'New Product' : r.status === 'duplicate_in_file' ? 'Duplicate in File' : r.status === 'duplicate_in_db' ? 'Already in Database' : 'Rejected / Invalid',
    'Reason': r.statusReason,
    'Item Code': r.code,
    'Product Name': r.productName,
    'Brand': r.brand,
    'Parent Category': r.parentCat,
    'Sub Category': r.subCategory,
    'Category': r.category,
    'Print / Finish': r.print || '',
    'Width (cm)': r.tileWidth || '',
    'Height (cm)': r.tileHeight || '',
    'Pieces Per Box': r.piecesPerBox || 1,
    'Sq.m Per Box': r.sqMPerBox ? r.sqMPerBox.toFixed(4) : '',
    'Purchase Price': r.purchasePrice,
    'Sales Price': r.retailPrice,
    'UOM': r.uom,
    'Minimum Stock': r.minimumStock,
    'Matched Existing DB ID': r.matchedDbProduct ? r.matchedDbProduct.id : '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  const sheetName = type === 'REJECTED' ? 'Rejected Items' : type === 'DUPLICATES' ? 'Duplicates' : 'Exported Products';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `product-${type.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const syncMasterHierarchy = async (
  rowsToProcess: ProcessedRow[],
  tenantId?: string | null
) => {
  let createdParents = 0;
  let createdSubs = 0;
  let createdCats = 0;
  let createdBrands = 0;
  let createdPrints = 0;

  const { data: latestCats } = await supabase.from('inventory_categories').select('*');
  const catList: any[] = latestCats ? [...latestCats] : [];

  const parentMap = new Map<string, any>();
  const subMap = new Map<string, any>();
  const catMap = new Map<string, any>();

  catList.forEach(c => {
    const lower = String(c.name || '').trim().toLowerCase();
    if (c.parent_id === null || c.parent_id === undefined) {
      parentMap.set(lower, c);
    }
  });

  catList.forEach(c => {
    const lower = String(c.name || '').trim().toLowerCase();
    if (c.parent_id !== null && c.parent_id !== undefined) {
      subMap.set(`${c.parent_id}:::${lower}`, c);
    }
  });

  catList.forEach(c => {
    const lower = String(c.name || '').trim().toLowerCase();
    if (c.parent_id !== null && c.parent_id !== undefined) {
      catMap.set(`${c.parent_id}:::${lower}`, c);
    }
  });

  const { data: latestBrands } = await supabase.from('inventory_brands').select('*');
  const brandMap = new Map<string, any>();
  (latestBrands || []).forEach(b => {
    brandMap.set(String(b.name || '').trim().toLowerCase(), b);
  });

  const printMap = new Map<string, any>();
  try {
    const { data: latestPrints } = await supabase.from('inventory_prints').select('*');
    (latestPrints || []).forEach(p => {
      const lower = String(p.name || '').trim().toLowerCase();
      if (p.category_id) {
        printMap.set(`${p.category_id}:::${lower}`, p);
      }
      printMap.set(lower, p);
    });
  } catch (e) {}

  for (const r of rowsToProcess) {
    const cleanParent = (r.parentCat || '').trim();
    const cleanSub = (r.subCategory || '').trim();
    const cleanCat = (r.category || '').trim();
    const cleanBrand = (r.brand || '').trim();
    const cleanPrint = (r.print || '').trim();

    let parentId: number | string | null = null;
    let subId: number | string | null = null;

    if (cleanParent) {
      const lowerParent = cleanParent.toLowerCase();
      if (parentMap.has(lowerParent)) {
        parentId = parentMap.get(lowerParent).id;
      } else {
        const payload: any = { name: cleanParent, parent_id: null };
        if (tenantId) payload.tenant_id = tenantId;
        const { data: newParent, error } = await supabase
          .from('inventory_categories')
          .insert([payload])
          .select()
          .single();

        if (!error && newParent) {
          parentId = newParent.id;
          parentMap.set(lowerParent, newParent);
          createdParents++;
        }
      }
    }

    if (cleanSub && parentId) {
      const lowerSub = cleanSub.toLowerCase();
      const subKey = `${parentId}:::${lowerSub}`;
      if (subMap.has(subKey)) {
        subId = subMap.get(subKey).id;
      } else {
        const payload: any = { name: cleanSub, parent_id: parentId };
        if (tenantId) payload.tenant_id = tenantId;
        const { data: newSub, error } = await supabase
          .from('inventory_categories')
          .insert([payload])
          .select()
          .single();

        if (!error && newSub) {
          subId = newSub.id;
          subMap.set(subKey, newSub);
          createdSubs++;
        }
      }
    }

    if (cleanCat && subId) {
      const lowerCat = cleanCat.toLowerCase();
      const catKey = `${subId}:::${lowerCat}`;
      if (!catMap.has(catKey)) {
        const payload: any = { name: cleanCat, parent_id: subId };
        if (tenantId) payload.tenant_id = tenantId;
        const { data: newCat, error } = await supabase
          .from('inventory_categories')
          .insert([payload])
          .select()
          .single();

        if (!error && newCat) {
          catMap.set(catKey, newCat);
          createdCats++;
        }
      }
    } else if (cleanCat && parentId && !subId) {
      const lowerCat = cleanCat.toLowerCase();
      const catKey = `${parentId}:::${lowerCat}`;
      if (!catMap.has(catKey)) {
        const payload: any = { name: cleanCat, parent_id: parentId };
        if (tenantId) payload.tenant_id = tenantId;
        const { data: newCat, error } = await supabase
          .from('inventory_categories')
          .insert([payload])
          .select()
          .single();

        if (!error && newCat) {
          catMap.set(catKey, newCat);
          createdCats++;
        }
      }
    }

    if (cleanBrand) {
      const lowerBrand = cleanBrand.toLowerCase();
      if (!brandMap.has(lowerBrand)) {
        const { data: newBrand, error } = await supabase
          .from('inventory_brands')
          .insert([{ name: cleanBrand }])
          .select()
          .single();

        if (!error && newBrand) {
          brandMap.set(lowerBrand, newBrand);
          createdBrands++;
        }
      }
    }

    if (cleanPrint) {
      const lowerPrint = cleanPrint.toLowerCase();
      const printKey = parentId ? `${parentId}:::${lowerPrint}` : lowerPrint;
      if (!printMap.has(printKey) && !printMap.has(lowerPrint)) {
        try {
          const { data: newPrint, error } = await supabase
            .from('inventory_prints')
            .insert([{ name: cleanPrint, category_id: parentId || null }])
            .select()
            .single();

          if (!error && newPrint) {
            printMap.set(printKey, newPrint);
            printMap.set(lowerPrint, newPrint);
            createdPrints++;
          }
        } catch (e) {}
      }
    }
  }

  return {
    createdParents,
    createdSubs,
    createdCats,
    createdBrands,
    createdPrints,
    totalCreated: createdParents + createdSubs + createdCats + createdBrands + createdPrints,
  };
};

export const executeRowsUpload = async (
  rowsToProcess: ProcessedRow[],
  mode: 'TILES' | 'OTHER',
  uploadMode: 'SKIP_DUPLICATES' | 'UPDATE_EXISTING'
) => {
  const rowsToInsert = rowsToProcess.filter(r => r.status === 'ready' && r.selected);
  const rowsToUpdate =
    uploadMode === 'UPDATE_EXISTING'
      ? rowsToProcess.filter(r => r.status === 'duplicate_in_db' && r.selected && r.matchedDbProduct?.id)
      : [];

  let inserted = 0;
  let updated = 0;

  if (rowsToInsert.length > 0) {
    const payloads = rowsToInsert.map(r => {
      if (mode === 'TILES') {
        const w = r.tileWidth || 0;
        const h = r.tileHeight || 0;
        const pcs = r.piecesPerBox || 1;
        const sqMPerPiece = (w > 0 && h > 0) ? (w / 100) * (h / 100) : 0;
        const sqMPerBox = sqMPerPiece * pcs;
        const sizeStr = (w > 0 && h > 0) ? `${w}×${h} cm` : (r.category || '');

        return {
          product_name: r.productName,
          item_sr_no: r.code || sizeStr,
          bin: r.print || r.brand || '',
          brand: r.brand || '',
          category: r.category || '',
          sub_category: r.subCategory || '',
          sub_sub_category: r.parentCat || '',
          uom: r.uom || 'BOX',
          purchase_price: r.purchasePrice,
          retail_price: r.retailPrice,
          mrp: r.retailPrice,
          min_stock_alert: r.minimumStock,
          pieces_per_box: pcs,
          pcs_per_box: pcs,
          pieces_per_packing: pcs,
          profit: Math.max(0, r.retailPrice - r.purchasePrice),
          item_type: 'goods',
          scenario_name: 'Tile Metric',
          product_description: `[TILE PRODUCT] Size: ${sizeStr} | Box: ${pcs} pcs (${sqMPerBox.toFixed(4)} sq.m / box) | Finish/Print: ${r.print || ''} | Brand: ${r.brand || ''}`,
        };
      } else {
        return {
          product_name: r.productName,
          item_sr_no: r.code || '',
          bin: r.brand || '',
          brand: r.brand || '',
          purchase_price: r.purchasePrice,
          retail_price: r.retailPrice,
          mrp: r.retailPrice,
          uom: r.uom || 'PCS',
          min_stock_alert: r.minimumStock,
          category: r.category || '',
          sub_category: r.subCategory || '',
          sub_sub_category: r.parentCat || '',
          pieces_per_box: 1,
          pcs_per_box: 1,
          pieces_per_packing: 1,
          item_type: 'goods',
          profit: Math.max(0, r.retailPrice - r.purchasePrice),
        };
      }
    });

    const chunkSize = 250;
    for (let i = 0; i < payloads.length; i += chunkSize) {
      const chunk = payloads.slice(i, i + chunkSize);
      const { error } = await supabase.from('products').insert(chunk);
      if (error) throw error;
      inserted += chunk.length;
    }
  }

  if (rowsToUpdate.length > 0) {
    for (let i = 0; i < rowsToUpdate.length; i++) {
      const r = rowsToUpdate[i];
      const dbId = r.matchedDbProduct!.id;

      const updatePayload: any = {};
      if (r.purchasePrice > 0) updatePayload.purchase_price = r.purchasePrice;
      if (r.retailPrice > 0) {
        updatePayload.retail_price = r.retailPrice;
        updatePayload.mrp = r.retailPrice;
      }
      if (r.category) updatePayload.category = r.category;
      if (r.subCategory) updatePayload.sub_category = r.subCategory;
      if (r.parentCat) updatePayload.sub_sub_category = r.parentCat;
      if (r.brand) {
        updatePayload.brand = r.brand;
        updatePayload.bin = r.print || r.brand;
      }
      if (r.minimumStock > 0) updatePayload.min_stock_alert = r.minimumStock;
      if (mode === 'TILES' && r.piecesPerBox) {
        updatePayload.pieces_per_box = r.piecesPerBox;
        updatePayload.pcs_per_box = r.piecesPerBox;
        updatePayload.pieces_per_packing = r.piecesPerBox;
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error: upError } = await supabase.from('products').update(updatePayload).eq('id', dbId);
        if (!upError) updated++;
      }
    }
  }

  return { inserted, updated };
};

export const downloadOtherTemplate = () => {
  const sampleData = [
    {
      'CODE': 'G-VALVE-01',
      'DESCRIPTION': 'Brass Ball Valve 1/2 Inch Heavy Duty',
      'PARENT CATEGORY': 'Sanitary Fittings',
      'SUB CATEGORY': 'Valves',
      'CATEGORY': 'Ball Valves',
      'BRAND': 'Faisal',
      'PURCHASE PRICE': 850,
      'SALES PRICE': 1200,
      'UOM': 'PCS',
      'MINIMUM': 10,
    },
    {
      'CODE': 'G-MIXER-04',
      'DESCRIPTION': 'Single Lever Basin Mixer Chrome Finish',
      'PARENT CATEGORY': 'Sanitary Ware',
      'SUB CATEGORY': 'Faucets',
      'CATEGORY': 'Basin Mixers',
      'BRAND': 'Sonex',
      'PURCHASE PRICE': 8500,
      'SALES PRICE': 11000,
      'UOM': 'PCS',
      'MINIMUM': 5,
    },
    {
      'CODE': 'G-PIPE-02',
      'DESCRIPTION': 'PPRC Pipe 25mm 4m Class A',
      'PARENT CATEGORY': 'Pipes & Fittings',
      'SUB CATEGORY': 'PPRC Pipes',
      'CATEGORY': '25mm Pipes',
      'BRAND': 'Popular',
      'PURCHASE PRICE': 650,
      'SALES PRICE': 850,
      'UOM': 'LENGTH',
      'MINIMUM': 20,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Other Products Template');
  XLSX.writeFile(wb, 'other-products-template.xlsx');
};

export const downloadTileTemplate = () => {
  const sampleData = [
    {
      'Code': 'PT-60120-01',
      'Description': 'Calacatta Gold Glazed Polished Porcelain',
      'Brand': 'Master',
      'Parent Category': 'Pak Tiles',
      'Sub Category': 'Porcelain',
      'Category': '60x120',
      'Print': 'Glazed Polished',
      'UOM': 'BOX',
      'Pieces Per Box': 2,
      'width': 60,
      'height': 120,
      'Purchase Price (Per Box)': 3200,
      'Sale Price (Per Box)': 4000,
      'Min': 20,
    },
    {
      'Code': 'CT-6060-05',
      'Description': 'Carrara White Matte Floor Tile',
      'Brand': 'Sonex',
      'Parent Category': 'Ch Tiles',
      'Sub Category': 'Ceramic',
      'Category': '60x60',
      'Print': 'Matt',
      'UOM': 'BOX',
      'Pieces Per Box': 4,
      'width': 60,
      'height': 60,
      'Purchase Price (Per Box)': 2400,
      'Sale Price (Per Box)': 3000,
      'Min': 15,
    },
    {
      'Code': 'ST-3090-09',
      'Description': 'Nero Marquina Wall Glossy Tile',
      'Brand': 'Stile',
      'Parent Category': 'Spain Tiles',
      'Sub Category': 'Ceramic',
      'Category': '30x90',
      'Print': 'Polished',
      'UOM': 'BOX',
      'Pieces Per Box': 4,
      'width': 30,
      'height': 90,
      'Purchase Price (Per Box)': 2800,
      'Sale Price (Per Box)': 3500,
      'Min': 10,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tile Products Template');
  XLSX.writeFile(wb, 'tile-products-template.xlsx');
};
