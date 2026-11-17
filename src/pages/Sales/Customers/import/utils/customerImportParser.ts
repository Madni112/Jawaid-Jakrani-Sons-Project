import * as XLSX from 'xlsx';
import { supabase } from '../../../../../Context/supabaseClient';
import { ParsedCustomer } from '../types/customerImportTypes';

export const parseExcelDate = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
      }
    } catch {}
  }
  const s = String(val).trim();
  if (!s) return '';
  const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, '0')}-${String(isoMatch[3]).padStart(2, '0')}`;
  }
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${String(dmyMatch[2]).padStart(2, '0')}-${String(dmyMatch[1]).padStart(2, '0')}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
};

export const normalizeText = (s: string) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ة]/g, 'ہ')
    .replace(/[أإآ]/g, 'ا')
    .replace(/\s+/g, ' ');

export const downloadCustomerFormatTemplate = () => {
  const templateData = [
    [
      'Customer Name *',
      'Customer Tier / Category',
      'Primary Contact Phone',
      'City *',
      'Area',
      'Delivery Address',
      'Province',
      'Opening Balance',
      'Balance Nature',
      'Opening Balance Date',
    ],
    [
      'Tariq Fabric Centre',
      'Wholesaler / Dealer',
      '0300-9281734',
      'Hyderabad',
      'Resham Gali',
      'Shop # 14, Resham Gali Market',
      'Sindh',
      85000,
      'Debit',
      '2026-10-31',
    ],
    [
      'Al-Madina Cloth House',
      'Retail / General',
      '0312-7654321',
      'ماتلی',
      'مین بازار',
      'مین بازار، نزد اسٹیشن روڈ، ماتلی',
      'Sindh',
      15000,
      'Debit',
      '2026-10-31',
    ],
    [
      'Ibrahim Textile Traders',
      'Boutique / Tailor',
      '0333-8889991',
      'Sukkur',
      'Cloth Market',
      'Shop 4, Main Sarafa Bazaar',
      'Sindh',
      25000,
      'Credit',
      '2026-10-31',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 30 }, // Customer Name
    { wch: 24 }, // Tier
    { wch: 22 }, // Phone
    { wch: 18 }, // City
    { wch: 20 }, // Area
    { wch: 34 }, // Delivery Address
    { wch: 16 }, // Province
    { wch: 18 }, // Opening Balance
    { wch: 16 }, // Balance Nature
    { wch: 20 }, // Opening Balance Date
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers Format');
  XLSX.writeFile(wb, 'Customer_Upload_Format.xlsx');
};

export const parseCustomerMatrix = async (
  matrix: any[][],
  batchOpeningDate: string
): Promise<ParsedCustomer[]> => {
  if (!matrix || matrix.length < 2) {
    throw new Error('Spreadsheet is empty or missing headers');
  }

  // 1. Pre-fetch existing customers and Chart of Accounts for duplicate/update detection & sequential code assignment
  let existingDbCustomers: any[] = [];
  const usedCodes = new Set<string>();

  try {
    const [custQuery, coaQuery] = await Promise.all([
      supabase
        .from('customers')
        .select(
          'id, customerName, customername, customer_name, city, province, address, balance, currentBalance, opening_balance, customer_code, customerCode, coa_code, account_code'
        ),
      supabase.from('chart_of_accounts').select('account_code'),
    ]);

    if (custQuery.data) {
      existingDbCustomers = custQuery.data;
      custQuery.data.forEach((c: any) => {
        ['customer_code', 'customerCode', 'coa_code', 'account_code'].forEach((k) => {
          if (c[k]) usedCodes.add(String(c[k]).trim().toUpperCase());
        });
      });
    }

    if (coaQuery.data) {
      coaQuery.data.forEach((a: any) => {
        if (a.account_code) usedCodes.add(String(a.account_code).trim().toUpperCase());
      });
    }
  } catch (e) {
    console.warn('Could not query existing customers or COA for code generation:', e);
  }

  let nextCustomerSeq = 1;
  const generateNextAccountCode = () => {
    while (true) {
      const candidate = `2020-${String(nextCustomerSeq).padStart(3, '0')}`;
      nextCustomerSeq++;
      if (!usedCodes.has(candidate)) {
        usedCodes.add(candidate);
        return candidate;
      }
    }
  };

  // 2. Find header row indices (case-insensitive substring matches supporting English and Urdu)
  const headerRow = matrix[0].map((h) => String(h || '').trim().toLowerCase());
  let nameIdx = -1;
  let tierIdx = -1;
  let phoneIdx = -1;
  let cityIdx = -1;
  let areaIdx = -1;
  let addressIdx = -1;
  let provinceIdx = -1;
  let balIdx = -1;
  let natureIdx = -1;
  let dateIdx = -1;

  headerRow.forEach((col, idx) => {
    if (
      col.includes('customer name') ||
      col.includes('client name') ||
      col.includes('party name') ||
      col.includes('account title') ||
      col.includes('پارٹی') ||
      col.includes('کسٹمر') ||
      col.includes('گاہک') ||
      col === 'name' ||
      col === 'customer'
    ) {
      if (nameIdx === -1) nameIdx = idx;
    } else if (
      col.includes('tier') ||
      col.includes('category') ||
      col.includes('type') ||
      col.includes('قسم') ||
      col.includes('رجسٹریشن')
    ) {
      if (tierIdx === -1) tierIdx = idx;
    } else if (
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
    } else if (
      col.includes('city') ||
      col.includes('town') ||
      col.includes('district') ||
      col.includes('tehsil') ||
      col.includes('sub area') ||
      col.includes('sub_area') ||
      col.includes('subarea') ||
      col.includes('شہر') ||
      col.includes('ضلع') ||
      col.includes('تحصیل') ||
      col === 'shehar' ||
      col === 'shahar'
    ) {
      if (cityIdx === -1) cityIdx = idx;
    } else if (
      col.includes('area') ||
      col.includes('market') ||
      col.includes('location') ||
      col.includes('سیکٹر') ||
      col.includes('علاقہ') ||
      col.includes('مارکیٹ') ||
      col.includes('bazaar') ||
      col.includes('bazar')
    ) {
      if (areaIdx === -1) areaIdx = idx;
    } else if (
      col.includes('address') ||
      col.includes('delivery address') ||
      col.includes('street') ||
      col.includes('shop') ||
      col.includes('site') ||
      col.includes('پتہ') ||
      col.includes('ایڈریس') ||
      col.includes('مقام')
    ) {
      if (addressIdx === -1) addressIdx = idx;
    } else if (
      col.includes('province') ||
      col.includes('state') ||
      col.includes('صوبہ') ||
      col.includes('region')
    ) {
      if (provinceIdx === -1) provinceIdx = idx;
    } else if (
      col.includes('opening balance date') ||
      col.includes('balance date') ||
      col.includes('opening date') ||
      col.includes('voucher date') ||
      col.includes('ob date') ||
      col.includes('entry date') ||
      col.includes('تاریخ') ||
      col === 'date'
    ) {
      if (dateIdx === -1) dateIdx = idx;
    } else if (
      col.includes('balance nature') ||
      col.includes('nature') ||
      col.includes('dr/cr') ||
      col.includes('dr cr') ||
      col.includes('debit/credit') ||
      col.includes('نوعیت') ||
      col.includes('کھاتہ') ||
      col === 'dr' ||
      col === 'cr'
    ) {
      if (natureIdx === -1) natureIdx = idx;
    } else if (
      col.includes('opening balance') ||
      col.includes('balance') ||
      col.includes('opening') ||
      col.includes('op bal') ||
      col.includes('بقایا') ||
      col.includes('ابتدائی') ||
      col === 'bal'
    ) {
      if (balIdx === -1) balIdx = idx;
    }
  });

  if (nameIdx === -1) nameIdx = 0;
  if (tierIdx === -1 && matrix[0].length > 1) tierIdx = 1;
  if (phoneIdx === -1 && matrix[0].length > 2) phoneIdx = 2;
  if (cityIdx === -1 && matrix[0].length > 3) cityIdx = 3;
  if (areaIdx === -1 && matrix[0].length > 4) areaIdx = 4;
  if (balIdx === -1 && matrix[0].length > 5) balIdx = 5;
  if (natureIdx === -1 && matrix[0].length > 6) natureIdx = 6;

  const list: ParsedCustomer[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.every((c) => String(c).trim() === '')) continue;

    const name = nameIdx !== -1 && row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
    const tier = tierIdx !== -1 && row[tierIdx] !== undefined ? String(row[tierIdx]).trim() : '';
    const phone = phoneIdx !== -1 && row[phoneIdx] !== undefined ? String(row[phoneIdx]).trim() : '';
    let city = cityIdx !== -1 && row[cityIdx] !== undefined ? String(row[cityIdx]).trim() : '';
    const area = areaIdx !== -1 && row[areaIdx] !== undefined ? String(row[areaIdx]).trim() : '';
    const address = addressIdx !== -1 && row[addressIdx] !== undefined ? String(row[addressIdx]).trim() : '';
    const province = provinceIdx !== -1 && row[provinceIdx] !== undefined ? String(row[provinceIdx]).trim() : 'Sindh';

    const rawBal = balIdx !== -1 && row[balIdx] !== undefined ? String(row[balIdx]).trim() : '';
    const parsedBalNum = rawBal ? parseFloat(rawBal.replace(/[^0-9.-]/g, '')) || 0 : 0;
    const balance = Math.abs(parsedBalNum);

    const rawNature =
      natureIdx !== -1 && row[natureIdx] !== undefined ? String(row[natureIdx]).trim().toLowerCase() : '';
    let balanceNature: 'Debit' | 'Credit' = 'Debit';
    if (rawNature.startsWith('cr') || rawNature.includes('credit') || parsedBalNum < 0) {
      balanceNature = 'Credit';
    } else {
      balanceNature = 'Debit';
    }

    const rawDate = dateIdx !== -1 && row[dateIdx] !== undefined ? row[dateIdx] : '';
    const openingDate = parseExcelDate(rawDate) || batchOpeningDate;

    let isValid = true;
    let validationError = '';

    if (!name) {
      isValid = false;
      validationError = 'Customer Name is required';
    } else if (!city) {
      city = 'Hyderabad';
    }

    const cleanName = normalizeText(name);
    const matchedDbCustomer = existingDbCustomers.find((c) => {
      const cName = normalizeText(c.customerName || c.customername || c.customer_name || c.name || '');
      return cName === cleanName;
    });

    const isExisting = Boolean(matchedDbCustomer);
    const existingId = matchedDbCustomer?.id;
    const existingBalance =
      matchedDbCustomer?.currentBalance ?? matchedDbCustomer?.balance ?? matchedDbCustomer?.opening_balance;
    const existingCity = matchedDbCustomer?.city;
    const existingCode =
      matchedDbCustomer?.customer_code ||
      matchedDbCustomer?.customerCode ||
      matchedDbCustomer?.coa_code ||
      matchedDbCustomer?.account_code;
    const assignedCode = isExisting && existingCode ? existingCode : generateNextAccountCode();

    list.push({
      id: `row-${r}-${Date.now()}`,
      name,
      tier,
      phone,
      city,
      area,
      address,
      province: province || 'Sindh',
      balance,
      balanceNature,
      openingDate,
      assignedCode,
      isValid,
      validationError,
      isExisting,
      existingId,
      existingBalance: existingBalance !== undefined ? Number(existingBalance) : undefined,
      existingCity,
      existingCode,
    });
  }

  return list;
};
