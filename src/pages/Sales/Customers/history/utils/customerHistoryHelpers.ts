import { DEFAULT_SUB_AREAS } from '../../../../../components/SubAreaAreaInput';
import { CustomerRecord, COAAccount } from '../types/customerHistoryTypes';

export const getCustomerDisplayName = (c: CustomerRecord | any): string => {
  if (!c) return '';
  return c.customerName || c.customername || c.customer_name || c.name || '';
};

export const normalizeAccountCode = (code?: string | null): string => {
  if (!code) return '';
  const s = String(code).trim();
  if (s.startsWith('2020-')) return s;
  const match = s.match(/^\d+$/);
  if (match) {
    return `2020-${s.padStart(3, '0')}`;
  }
  return s;
};

export const parsePageNumber = (val?: string | null): number | null => {
  if (!val) return null;
  const match = String(val).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

export const getCustomerLocation = (c: CustomerRecord | any): { city: string; area: string } => {
  let city = c.city || c.sub_area || c.subArea || '';
  let area = c.area || '';

  // Check if saved inside notes (e.g. "Location: Hyderabad | Cloth Market")
  if (c.notes && c.notes.includes('Location:')) {
    const match = c.notes.match(/Location:\s*([^|\n]+)(?:\s*\|\s*([^\n]+))?/);
    if (match) {
      const noteCity = match[1]?.trim();
      const noteArea = match[2]?.trim();
      if (!city) city = noteCity;
      if (city && city.toLowerCase() === 'hyderabad' && noteCity && noteCity.toLowerCase() !== 'hyderabad') {
        city = noteCity;
      }
      if (!area && noteArea) area = noteArea;
    }
  }

  // Fallback: If city still empty, scan address for known cities
  if (!city && c.address) {
    const addr = String(c.address).toLowerCase();
    for (const dCity of DEFAULT_SUB_AREAS) {
      if (addr.includes(dCity.toLowerCase())) {
        city = dCity;
        break;
      }
    }
  }

  return { city, area };
};

export const getCustomerCOA = (cust: CustomerRecord | any, coaAccounts: COAAccount[]): COAAccount | undefined => {
  const cName = getCustomerDisplayName(cust).trim().toLowerCase();
  return coaAccounts.find(
    (a) =>
      (cust.account_code && String(a.account_code).trim() === String(cust.account_code).trim()) ||
      (a.control_code === 'Customers' && (a.account_title || '').trim().toLowerCase() === cName) ||
      ((a.account_title || '').trim().toLowerCase() === cName)
  );
};

export const getNextSuggestedCode = (coaAccounts: COAAccount[], customers: CustomerRecord[]): string => {
  const usedCodes = new Set<string>();

  coaAccounts.forEach((a) => {
    const code = String(a.account_code || '').trim().toUpperCase();
    if (code) usedCodes.add(code);
  });

  customers.forEach((c) => {
    const code1 = String(c.customer_code || '').trim().toUpperCase();
    const code2 = String(c.customerCode || '').trim().toUpperCase();
    const code3 = String(c.coa_code || '').trim().toUpperCase();
    const code4 = String(c.account_code || '').trim().toUpperCase();
    if (code1) usedCodes.add(code1);
    if (code2) usedCodes.add(code2);
    if (code3) usedCodes.add(code3);
    if (code4) usedCodes.add(code4);
  });

  let seq = 1;
  while (true) {
    const candidate = `2020-${String(seq).padStart(3, '0')}`;
    if (!usedCodes.has(candidate)) {
      return candidate;
    }
    seq++;
  }
};
