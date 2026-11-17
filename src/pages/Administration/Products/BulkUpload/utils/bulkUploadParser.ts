import * as XLSX from 'xlsx';
import { supabase } from '../../../../../Context/supabaseClient';
import { DuplicateStatus, ProcessedRow } from '../types/bulkUploadTypes';

export interface ParseExcelResult {
  tileRows: ProcessedRow[];
  otherRows: ProcessedRow[];
  existingCategories: any[];
  existingBrands: any[];
  existingPrints: any[];
}

export const parseExcelFile = async (file: File): Promise<ParseExcelResult> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawGrid || rawGrid.length === 0) {
    throw new Error('Spreadsheet appears to be completely empty.');
  }

  const headerKeywords = [
    'CODE',
    'DESCRIPTION',
    'ITEM CODE',
    'PRODUCT NAME',
    'CATEGORY',
    'BRAND',
    'PARENT CATEGORY',
    'PAREENT CATEGORY',
    'SUB CATEGORY',
    'SUB CATEGRY',
    'PURCHASE PRICE',
    'SALE PRICE',
    'PRICE',
    'SKU',
  ];

  let headerRowIdx = 0;
  let highestMatches = 0;

  for (let r = 0; r < Math.min(rawGrid.length, 10); r++) {
    const row = rawGrid[r] || [];
    const matchCount = row.filter((cell: any) => {
      const cellStr = String(cell || '').trim().toUpperCase();
      return headerKeywords.some((kw) => cellStr.includes(kw));
    }).length;

    if (matchCount > highestMatches && matchCount >= 2) {
      highestMatches = matchCount;
      headerRowIdx = r;
    }
  }

  const headerRow = (rawGrid[headerRowIdx] || []).map((h: any) =>
    String(h || '').trim().toUpperCase()
  );
  const dataGrid = rawGrid.slice(headerRowIdx + 1);

  const normalizedData: any[] = [];
  dataGrid.forEach((row) => {
    const hasData = row.some((cell: any) => String(cell || '').trim() !== '');
    if (!hasData) return;

    const rowObj: any = {};
    headerRow.forEach((colName, idx) => {
      if (colName) {
        rowObj[colName] = row[idx];
      }
    });

    const checkCode = String(rowObj['CODE'] || rowObj['ITEM CODE'] || rowObj['ITEM_CODE'] || rowObj['ITEM SR NO'] || rowObj['SKU'] || '').trim();
    const checkName = String(rowObj['DESCRIPTION'] || rowObj['PRODUCT NAME'] || rowObj['PRODUCT_NAME'] || rowObj['NAME'] || '').trim();
    if (!checkCode && !checkName) {
      return;
    }

    normalizedData.push(rowObj);
  });

  if (normalizedData.length === 0) {
    throw new Error('No product data rows found under the header row.');
  }

  const [productsRes, catsRes, brandsRes, printsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, product_name, item_sr_no, purchase_price, retail_price, category'),
    supabase.from('inventory_categories').select('*'),
    supabase.from('inventory_brands').select('*'),
    supabase.from('inventory_prints').select('*'),
  ]);

  if (productsRes.error) throw productsRes.error;
  const dbProducts = productsRes.data || [];
  const existingCategories = catsRes.data || [];
  const existingBrands = brandsRes.data || [];
  const existingPrints = printsRes.data || [];

  const dbByComposite = new Map<string, any>();
  (dbProducts || []).forEach((p: any) => {
    const codeKey = String(p.item_sr_no || '').trim().toLowerCase();
    const nameKey = String(p.product_name || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (codeKey || nameKey) {
      dbByComposite.set(`${codeKey}:::${nameKey}`, p);
    }
  });

  const suffixRegex = /[\.\-\s]*(a39|shop)\s*$/i;
  const fileSeenComposite = new Map<string, number>();

  const tileRows: ProcessedRow[] = [];
  const otherRows: ProcessedRow[] = [];

  normalizedData.forEach((row, i) => {
    const rowIndex = i + 1;
    const rawCode = String(
      row['CODE'] || row['ITEM CODE'] || row['ITEM_CODE'] || row['ITEM SR NO'] || row['SKU'] || ''
    );
    const rawName = String(
      row['DESCRIPTION'] || row['PRODUCT NAME'] || row['PRODUCT_NAME'] || row['NAME'] || ''
    );

    const cleanCode = rawCode.replace(suffixRegex, '').trim();
    const cleanName = rawName.replace(suffixRegex, '').replace(/\s+/g, ' ').trim();

    const codeKey = cleanCode.toLowerCase();
    const nameKey = cleanName.toLowerCase();
    const compositeKey = `${codeKey}:::${nameKey}`;

    const rawBrand = String(
      row['BRAND'] || row['BRAND / BIN'] || row['BIN'] || ''
    ).trim();

    const rawParentCat = String(
      row['PARENT CATEGORY'] || row['PAREENT CATEGORY'] || row['PARENT_CATEGORY'] || row['PARENT'] || ''
    ).trim();
    const rawSubCat = String(
      row['SUB CATEGORY'] || row['SUB CATEGRY'] || row['SUB_CATEGORY'] || row['SUB'] || ''
    ).trim();
    const rawCat = String(
      row['CATEGORY'] || row['SIZE'] || ''
    ).trim();

    const rawPrint = String(
      row['PRINT'] || row['FINISH'] || row['SURFACE'] || ''
    ).trim();
    const rawPcs = Number(
      row['PIECES PER BOX'] || row['PIECES_PER_BOX'] || row['PCS PER BOX'] || row['PCS/BOX'] || row['PACKING'] || 0
    );
    const piecesPerBox = rawPcs > 0 ? rawPcs : 1;

    const rawW = Number(row['WIDTH'] || row['W'] || 0);
    const rawH = Number(row['HEIGHT'] || row['H'] || 0);

    const rawPur = parseFloat(
      String(row['PURCHASE PRICE (PER BOX)'] || row['PURCHASE PRICE'] || row['PURCHASE'] || row['BUY RATE'] || 0).replace(/[^\d.]/g, '')
    ) || 0;
    const rawRet = parseFloat(
      String(row['SALE PRICE (PER BOX)'] || row['SALE PRICE'] || row['SALES PRICE'] || row['RETAIL PRICE'] || row['SALE RATE'] || 0).replace(/[^\d.]/g, '')
    ) || 0;
    const rawMin = parseInt(
      String(row['MIN'] || row['MINIMUM'] || row['MINIMUM STOCK'] || row['MIN STOCK'] || 0).replace(/[^\d]/g, ''),
      10
    ) || 0;

    const isTileRow = rawParentCat.toLowerCase().includes('tile');
    const rawUom = String(row['UOM'] || (isTileRow ? 'BOX' : 'PCS')).trim() || (isTileRow ? 'BOX' : 'PCS');

    let sqMPerPiece = 0;
    let sqMPerBox = 0;
    let purchasePerSqM = 0;
    let salePerSqM = 0;
    let profitPerBox = rawRet - rawPur;
    let profitMarginPercent = rawPur > 0 ? ((profitPerBox / rawPur) * 100).toFixed(1) : '0';

    if (rawW > 0 && rawH > 0) {
      sqMPerPiece = (rawW / 100) * (rawH / 100);
      sqMPerBox = sqMPerPiece * piecesPerBox;
      if (sqMPerBox > 0) {
        purchasePerSqM = rawPur / sqMPerBox;
        salePerSqM = rawRet / sqMPerBox;
      }
    }

    let status: DuplicateStatus = 'ready';
    let statusReason = isTileRow 
      ? 'New unique tile product — ready to upload' 
      : 'New unique product — ready to upload';
    let matchedDbProduct: any = undefined;
    let matchedFileRowIndex: number | undefined = undefined;

    if (!cleanName) {
      status = 'invalid';
      statusReason = 'Missing product description / name';
    } else if (fileSeenComposite.has(compositeKey)) {
      status = 'duplicate_in_file';
      matchedFileRowIndex = fileSeenComposite.get(compositeKey);
      statusReason = `Duplicate: Both Code ("${cleanCode || 'None'}") and Description match Row #${matchedFileRowIndex} in this file`;
    } else if (dbByComposite.has(compositeKey)) {
      const matched = dbByComposite.get(compositeKey);
      status = 'duplicate_in_db';
      matchedDbProduct = matched;
      statusReason = `Already in Database: Both Code and Description match "${matched.product_name}" (DB ID #${matched.id})`;
    }

    if (status !== 'duplicate_in_file' && status !== 'invalid') {
      fileSeenComposite.set(compositeKey, rowIndex);
    }

    const processedItem: ProcessedRow = {
      id: `row-${rowIndex}`,
      rowIndex,
      code: cleanCode,
      productName: cleanName,
      category: rawCat,
      subCategory: rawSubCat,
      parentCat: rawParentCat,
      brand: rawBrand,
      purchasePrice: rawPur,
      retailPrice: rawRet,
      uom: rawUom,
      minimumStock: rawMin,
      print: rawPrint,
      tileWidth: rawW > 0 ? rawW : undefined,
      tileHeight: rawH > 0 ? rawH : undefined,
      piecesPerBox,
      sqMPerPiece,
      sqMPerBox,
      purchasePerSqM,
      salePerSqM,
      profitPerBox,
      profitMarginPercent,
      status,
      statusReason,
      matchedDbProduct,
      matchedFileRowIndex,
      selected: status === 'ready',
      rawRow: row,
    };

    if (isTileRow) {
      tileRows.push(processedItem);
    } else {
      otherRows.push(processedItem);
    }
  });

  return {
    tileRows,
    otherRows,
    existingCategories,
    existingBrands,
    existingPrints,
  };
};
