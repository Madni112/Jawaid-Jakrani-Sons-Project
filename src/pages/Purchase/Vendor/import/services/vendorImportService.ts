import { supabase, fetchAllPages } from '../../../../../Context/supabaseClient';
import { ParsedVendor } from '../types/vendorImportTypes';
import { normalizeVendorText } from '../utils/vendorTemplateGenerator';

export const parseVendorMatrixData = async (matrix: any[][]): Promise<ParsedVendor[]> => {
  if (!matrix || matrix.length < 2) {
    throw new Error('Spreadsheet is empty or missing headers');
  }

  // 1. Pre-fetch existing vendors from database for duplicate/update detection
  let existingDbVendors: any[] = [];
  try {
    const { data: dbVendors, error: vendErr } = await fetchAllPages(
      supabase
        .from('vendors')
        .select('*')
    );
    if (!vendErr && dbVendors) {
      existingDbVendors = dbVendors;
    }
  } catch (e) {
    console.warn('Could not query existing vendors for duplicate detection:', e);
  }

  // 2. Find header row indices (case-insensitive substring matches supporting English and Urdu)
  const headerRow = matrix[0].map((h) => String(h || '').trim().toLowerCase());
  let nameIdx = -1;
  let companyIdx = -1;
  let phoneIdx = -1;
  let cityIdx = -1;
  let areaIdx = -1;
  let addressIdx = -1;
  let provinceIdx = -1;
  let pageIdx = -1;
  let balIdx = -1;
  let natureIdx = -1;

  headerRow.forEach((col, idx) => {
    // Vendor / Supplier Name
    if (
      col.includes('vendor') ||
      col.includes('supplier') ||
      col.includes('party') ||
      col.includes('mill') ||
      col.includes('title') ||
      col.includes('سپلائر') ||
      col.includes('وینڈر') ||
      col.includes('پارٹی') ||
      col.includes('مل') ||
      col === 'name'
    ) {
      if (nameIdx === -1) nameIdx = idx;
    }
    // Company / Firm Name
    else if (
      col.includes('company') ||
      col.includes('firm') ||
      col.includes('کمپنی') ||
      col.includes('ادارہ')
    ) {
      if (companyIdx === -1) companyIdx = idx;
    }
    // Phone / Mobile
    else if (
      col.includes('phone') ||
      col.includes('mobile') ||
      col.includes('contact') ||
      col.includes('cell') ||
      col.includes('فون') ||
      col.includes('موبائل') ||
      col.includes('رابطہ') ||
      col.includes('whatsapp')
    ) {
      if (phoneIdx === -1) phoneIdx = idx;
    }
    // City (City, Town, District, Tehsil, شہر, ضلع)
    else if (
      col.includes('city') ||
      col.includes('town') ||
      col.includes('district') ||
      col.includes('tehsil') ||
      col.includes('sub area') ||
      col.includes('sub_area') ||
      col.includes('subarea') ||
      col.includes('شہر') ||
      col.includes('ضلع') ||
      col.includes('تحصیل')
    ) {
      if (cityIdx === -1) cityIdx = idx;
    }
    // Area / Market
    else if (
      col.includes('area') ||
      col.includes('market') ||
      col.includes('location') ||
      col.includes('علاقہ') ||
      col.includes('مارکیٹ') ||
      col.includes('بازار') ||
      col.includes('bazaar') ||
      col.includes('bazar')
    ) {
      if (areaIdx === -1) areaIdx = idx;
    }
    // Address / Street / Shop
    else if (
      col.includes('address') ||
      col.includes('street') ||
      col.includes('shop') ||
      col.includes('site') ||
      col.includes('پتہ') ||
      col.includes('ایڈریس') ||
      col.includes('مقام')
    ) {
      if (addressIdx === -1) addressIdx = idx;
    }
    // Province / State
    else if (
      col.includes('province') ||
      col.includes('state') ||
      col.includes('صوبہ') ||
      col.includes('region')
    ) {
      if (provinceIdx === -1) provinceIdx = idx;
    }
    // Page Number
    else if (
      col.includes('page') ||
      col.includes('صفحہ') ||
      col.includes('کھاتہ صفحہ')
    ) {
      if (pageIdx === -1) pageIdx = idx;
    }
    // Balance / Opening
    else if (
      col.includes('balance') ||
      col.includes('opening') ||
      col.includes('op bal') ||
      col.includes('بقایا') ||
      col.includes('ابتدائی') ||
      col === 'bal'
    ) {
      if (balIdx === -1) balIdx = idx;
    }
    // Balance Nature (Cr / Dr)
    else if (
      col.includes('nature') ||
      col.includes('dr/cr') ||
      col.includes('cr/dr') ||
      col.includes('debit/credit') ||
      col.includes('credit/debit') ||
      col.includes('نوعیت') ||
      col.includes('کھاتہ') ||
      col === 'cr' ||
      col === 'dr'
    ) {
      if (natureIdx === -1) natureIdx = idx;
    }
  });

  // Fallbacks if exact headers were omitted
  if (nameIdx === -1) nameIdx = 0;
  if (phoneIdx === -1 && matrix[0].length > 1) phoneIdx = 1;
  if (cityIdx === -1 && matrix[0].length > 2) cityIdx = 2;
  if (areaIdx === -1 && matrix[0].length > 3) areaIdx = 3;
  if (balIdx === -1 && matrix[0].length > 4) balIdx = 4;
  if (natureIdx === -1 && matrix[0].length > 5) natureIdx = 5;

  const list: ParsedVendor[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.every((c) => String(c).trim() === '')) continue;

    const name = nameIdx !== -1 && row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
    const companyName = companyIdx !== -1 && row[companyIdx] !== undefined ? String(row[companyIdx]).trim() : '';
    const phone = phoneIdx !== -1 && row[phoneIdx] !== undefined ? String(row[phoneIdx]).trim() : '';
    let city = cityIdx !== -1 && row[cityIdx] !== undefined ? String(row[cityIdx]).trim() : '';
    const area = areaIdx !== -1 && row[areaIdx] !== undefined ? String(row[areaIdx]).trim() : '';
    const address = addressIdx !== -1 && row[addressIdx] !== undefined ? String(row[addressIdx]).trim() : '';
    const province = provinceIdx !== -1 && row[provinceIdx] !== undefined ? String(row[provinceIdx]).trim() : 'Sindh';
    const pageNo = pageIdx !== -1 && row[pageIdx] !== undefined ? String(row[pageIdx]).trim() : '';

    // Opening Balance & Balance Nature
    const rawBal = balIdx !== -1 && row[balIdx] !== undefined ? String(row[balIdx]).trim() : '';
    const parsedBalNum = rawBal ? parseFloat(rawBal.replace(/[^0-9.-]/g, '')) || 0 : 0;
    const balance = Math.abs(parsedBalNum);

    const rawNature = natureIdx !== -1 && row[natureIdx] !== undefined ? String(row[natureIdx]).trim().toLowerCase() : '';
    // For Vendors, default is Credit (Accounts Payable = company owes supplier)
    let balanceNature: 'Credit' | 'Debit' = 'Credit';
    if (rawNature.startsWith('dr') || rawNature.includes('debit') || parsedBalNum < 0) {
      balanceNature = 'Debit';
    } else {
      balanceNature = 'Credit';
    }

    let isValid = true;
    let validationError = '';

    if (!name) {
      isValid = false;
      validationError = 'Vendor / Supplier Name is required';
    } else if (!city) {
      city = 'Hyderabad';
    }

    // Duplicate / Existing Vendor Check
    const cleanName = normalizeVendorText(name);
    const matchedDbVendor = existingDbVendors.find((v) => {
      const vName = normalizeVendorText(v.vendor_name || v.name || v.company_name || '');
      return vName === cleanName;
    });

    const isExisting = Boolean(matchedDbVendor);
    const existingId = matchedDbVendor?.id;
    const existingBalance = matchedDbVendor?.currentBalance ?? matchedDbVendor?.balance ?? matchedDbVendor?.opening_balance;
    const existingCity = matchedDbVendor?.city || (matchedDbVendor?.address && matchedDbVendor.address.includes('ماتلی') ? 'ماتلی' : undefined);

    list.push({
      id: `row-${r}-${Date.now()}`,
      name,
      companyName,
      phone,
      city,
      area,
      address,
      province: province || 'Sindh',
      pageNo,
      balance,
      balanceNature,
      isValid,
      validationError,
      isExisting,
      existingId,
      existingBalance: existingBalance !== undefined ? Number(existingBalance) : undefined,
      existingCity
    });
  }

  return list;
};

export const executeVendorBatchImportAction = async (validRows: ParsedVendor[]) => {
  // 1. Probe database columns to set only valid columns
  const dbColumns: string[] = [];
  try {
    const { data: probeData } = await supabase.from('vendors').select('*').limit(1);
    if (probeData && probeData.length > 0) {
      dbColumns.push(...Object.keys(probeData[0]));
    }
  } catch (e) {
    console.warn('Vendor schema probe notice:', e);
  }

  const hasCol = (colName: string) =>
    dbColumns.some((c) => c.toLowerCase() === colName.toLowerCase());
  const getExactCols = (fieldKey: string) =>
    dbColumns.filter((c) => c.toLowerCase() === fieldKey.toLowerCase());

  const toUpdate = validRows.filter((r) => r.isExisting && r.existingId);
  const toInsert = validRows.filter((r) => !r.isExisting);

  let updatedCount = 0;
  let insertedCount = 0;

  // 2. Process UPDATES for existing vendors
  for (const r of toUpdate) {
    const rawBal = Number(r.balance) || 0;
    // For vendors, Credit is positive payable liability
    const computedBal = r.balanceNature === 'Debit' ? -Math.abs(rawBal) : Math.abs(rawBal);
    const locSegments = [r.address, r.area, r.city].filter(Boolean);
    const fullAddress = locSegments.length > 0 ? locSegments.join(', ') : (r.address || r.city || '');

    const updatePayload: Record<string, any> = {
      balance: computedBal,
      currentBalance: computedBal,
    };

    if (hasCol('opening_balance')) updatePayload.opening_balance = Math.abs(rawBal);
    if (hasCol('current_balance')) updatePayload.current_balance = computedBal;
    if (hasCol('address')) updatePayload.address = fullAddress;
    if (hasCol('province') && r.province) updatePayload.province = r.province;
    if (r.phone) {
      if (hasCol('phone')) updatePayload.phone = r.phone;
      if (hasCol('cell_no')) updatePayload.cell_no = r.phone;
      if (hasCol('phone_no')) updatePayload.phone_no = r.phone;
    }
    if (r.pageNo) {
      if (hasCol('page_no')) updatePayload.page_no = r.pageNo;
      if (hasCol('pageNo')) updatePayload.pageNo = r.pageNo;
    }

    const { error: updateErr } = await supabase
      .from('vendors')
      .update(updatePayload)
      .eq('id', r.existingId);

    if (updateErr) {
      console.warn(`Failed to update vendor ${r.name}:`, updateErr);
    } else {
      updatedCount++;
    }
  }

  // 3. Process INSERTS for new vendors
  if (toInsert.length > 0) {
    // Query highest vendor code
    let maxCodeNum = 0;
    try {
      const { data: codeData } = await fetchAllPages(supabase.from('vendors').select('vendor_code, vendorCode'));
      (codeData || []).forEach((v: any) => {
        const codeStr = v.vendor_code || v.vendorCode || '';
        const match = String(codeStr).match(/2010-(\d+)/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxCodeNum) maxCodeNum = num;
        }
      });
    } catch (_) {}

    const insertPayloads = toInsert.map((r, i) => {
      const item: any = {};
      const setCol = (key: string, val: any) => {
        const exacts = getExactCols(key);
        if (exacts.length > 0) {
          exacts.forEach((c) => {
            item[c] = val;
          });
        }
      };

      const rawBal = Number(r.balance) || 0;
      const computedBal = r.balanceNature === 'Debit' ? -Math.abs(rawBal) : Math.abs(rawBal);
      const locSegments = [r.address, r.area, r.city].filter(Boolean);
      const fullAddress = locSegments.length > 0 ? locSegments.join(', ') : (r.address || r.city || '');
      const assignedCode = `2010-${String(maxCodeNum + i + 1).padStart(3, '0')}`;

      if (dbColumns.length === 0) {
        item['vendor_name'] = r.name;
        item['name'] = r.name;
        if (r.companyName) item['company_name'] = r.companyName;
        item['vendor_code'] = assignedCode;
        item['vendorCode'] = assignedCode;
        if (r.phone) {
          item['phone'] = r.phone;
          item['cell_no'] = r.phone;
        }
        item['address'] = fullAddress;
        item['province'] = r.province || 'Sindh';
        if (r.pageNo) item['page_no'] = r.pageNo;
        item['balance'] = computedBal;
        item['currentBalance'] = computedBal;
      } else {
        setCol('vendor_name', r.name);
        setCol('name', r.name);
        if (r.companyName) setCol('company_name', r.companyName);

        setCol('vendor_code', assignedCode);
        setCol('vendorCode', assignedCode);

        if (r.phone) {
          setCol('phone', r.phone);
          setCol('cell_no', r.phone);
          setCol('phone_no', r.phone);
        }

        setCol('address', fullAddress);
        if (hasCol('province')) setCol('province', r.province || 'Sindh');
        if (hasCol('city')) setCol('city', r.city);
        if (hasCol('area')) setCol('area', r.area);

        if (r.pageNo) {
          setCol('page_no', r.pageNo);
          setCol('pageNo', r.pageNo);
        }

        setCol('balance', computedBal);
        setCol('currentBalance', computedBal);
        setCol('current_balance', computedBal);
        if (hasCol('opening_balance')) setCol('opening_balance', Math.abs(rawBal));
      }

      return item;
    });

    const { data: insertedData, error: insertErr } = await supabase
      .from('vendors')
      .insert(insertPayloads)
      .select('id, vendor_name, name');

    if (insertErr) {
      throw insertErr;
    } else {
      insertedCount = insertedData?.length || toInsert.length;
    }
  }

  return { insertedCount, updatedCount };
};
