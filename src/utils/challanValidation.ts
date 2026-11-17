import { supabase } from '../Context/supabaseClient';

export type ChallanModule = 'purchase' | 'sale' | 'purchase_return' | 'sales_return';

export interface DuplicateChallanInfo {
  challanNo: string;
  count: number;
  distinctDocCount: number;
  records: {
    id: string | number;
    docNo?: string;
    party?: string;
    date?: string;
  }[];
}

/**
 * Normalizes slip / challan numbers for reliable case-insensitive duplicate checking
 */
export const normalizeChallanNo = (val?: string): string => {
  if (!val) return '';
  return String(val).trim().toUpperCase();
};

/**
 * Extracts the core slip suffix if prefixed with warehouse name (e.g. "MAIN-009" -> "009")
 */
export const extractSlipSuffix = (val?: string): string => {
  const norm = normalizeChallanNo(val);
  if (!norm) return '';
  if (norm.includes('-')) {
    const afterDash = norm.substring(norm.lastIndexOf('-') + 1).trim();
    if (afterDash) return afterDash;
  }
  return norm;
};

/**
 * Checks whether two challan/slip numbers conflict
 */
export const isSlipMatch = (a?: string, b?: string): boolean => {
  const normA = normalizeChallanNo(a);
  const normB = normalizeChallanNo(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Only match if one is a bare number without prefix and the other is prefixed with that same number.
  // Example: "009" matches "MAIN-009".
  // BUT if BOTH have prefixes (e.g. "GRN-01" vs "ALMUHAMMADITILESEMPORIUM-01", or "SHOP-001" vs "MAIN-001"),
  // they are DIFFERENT series/warehouses and MUST NOT conflict!
  const hasDashA = normA.includes('-');
  const hasDashB = normB.includes('-');

  if (hasDashA && !hasDashB) {
    const sufA = extractSlipSuffix(normA);
    return sufA === normB;
  }
  if (!hasDashA && hasDashB) {
    const sufB = extractSlipSuffix(normB);
    return sufB === normA;
  }

  return false;
};

/**
 * Checks whether duplicate slip/challan numbers exist across DIFFERENT parent transactions.
 * Note: Multiple dispatches or line items belonging to the SAME invoice/bill are NOT duplicates.
 */
export const checkDuplicateChallans = async (module: ChallanModule): Promise<DuplicateChallanInfo[]> => {
  try {
    if (module === 'purchase') {
      const [grnRes, purchaseRes] = await Promise.all([
        supabase
          .from('grn_receipts')
          .select('id, grn_no, vendor_name, receipt_date, remarks')
          .not('grn_no', 'is', null),
        supabase
          .from('supplier_purchases')
          .select('id, purchase_no, vendor_name, metadata')
      ]);

      const grnData = grnRes.data || [];
      const purchases = purchaseRes.data || [];

      // Map GRN ID to parent purchase_no
      const grnToPurchaseMap = new Map<string, string>();
      purchases.forEach((p: any) => {
        const pNo = String(p.purchase_no || p.id).trim().toUpperCase();
        if (p.metadata?.grn_id) {
          grnToPurchaseMap.set(String(p.metadata.grn_id), pNo);
        }
      });

      const map = new Map<string, { challanNo: string; docSet: Set<string>; records: any[] }>();
      grnData.forEach((row: any) => {
        const raw = normalizeChallanNo(row.grn_no);
        if (!raw) return;
        const key = raw;
        const entry = map.get(key) || { challanNo: row.grn_no, docSet: new Set<string>(), records: [] };
        
        const linkedPurchaseNo = grnToPurchaseMap.get(String(row.id));
        const matchPo = String(row.remarks || '').match(/for\s+([A-Z0-9\-_]+)/i);
        const docRef = linkedPurchaseNo || (matchPo && matchPo[1] ? matchPo[1].trim().toUpperCase() : `${row.vendor_name || 'V'}_${row.receipt_date || row.id}`);
        
        entry.docSet.add(docRef);
        entry.records.push({
          id: row.id,
          docNo: linkedPurchaseNo || (matchPo && matchPo[1] ? matchPo[1].trim() : row.grn_no),
          party: row.vendor_name || 'N/A',
          date: row.receipt_date || 'N/A',
        });
        map.set(key, entry);
      });

      // Only flag as duplicate if used across 2 or more DIFFERENT parent purchases
      return Array.from(map.values())
        .filter((e) => e.docSet.size > 1)
        .map((e) => ({
          challanNo: e.challanNo,
          count: e.records.length,
          distinctDocCount: e.docSet.size,
          records: e.records,
        }));
    }

    if (module === 'sale') {
      const { data, error } = await supabase
        .from('delivery_challans')
        .select('id, challan_no, customer_name, challan_date, invoice_no')
        .not('challan_no', 'is', null);

      if (error || !data) return [];

      const map = new Map<string, { challanNo: string; docSet: Set<string>; records: any[] }>();
      data.forEach((row: any) => {
        const raw = normalizeChallanNo(row.challan_no);
        if (!raw) return;
        const key = raw;
        const entry = map.get(key) || { challanNo: row.challan_no, docSet: new Set<string>(), records: [] };
        
        // Parent invoice identifier
        const invoiceRef = String(row.invoice_no || `ID_${row.id}`).trim().toUpperCase();
        entry.docSet.add(invoiceRef);
        entry.records.push({
          id: row.id,
          docNo: row.invoice_no || row.challan_no,
          party: row.customer_name || 'N/A',
          date: row.challan_date || 'N/A',
        });
        map.set(key, entry);
      });

      // Multiple delivery challans for the SAME invoice (partial shipments) are NOT duplicates!
      // Only flag if 2 or more DIFFERENT invoices share the same challan number.
      return Array.from(map.values())
        .filter((e) => e.docSet.size > 1)
        .map((e) => ({
          challanNo: e.challanNo,
          count: e.records.length,
          distinctDocCount: e.docSet.size,
          records: e.records,
        }));
    }

    if (module === 'purchase_return') {
      const { data, error } = await supabase
        .from('purchase_returns')
        .select('id, return_no, vendor_name, return_date, metadata');

      if (error || !data) return [];

      const map = new Map<string, { challanNo: string; docSet: Set<string>; records: any[] }>();
      data.forEach((row: any) => {
        const slips: string[] = [];
        if (row.metadata?.gatePasses && typeof row.metadata.gatePasses === 'object') {
          Object.values(row.metadata.gatePasses).forEach((v: any) => {
            if (v && String(v).trim()) slips.push(String(v).trim());
          });
        }
        const effectiveGp = row.gate_pass_no || row.metadata?.gate_pass_no;
        if (slips.length === 0 && effectiveGp) {
          const parts = String(effectiveGp).split('|');
          parts.forEach((p) => {
            const val = p.includes(':') ? p.split(':')[1]?.trim() : p.trim();
            if (val) slips.push(val);
          });
        }

        const returnDocRef = String(row.return_no || `PR_${row.id}`).trim().toUpperCase();

        slips.forEach((s) => {
          const raw = normalizeChallanNo(s);
          if (!raw) return;
          const key = raw;
          const entry = map.get(key) || { challanNo: s, docSet: new Set<string>(), records: [] };
          entry.docSet.add(returnDocRef);
          entry.records.push({
            id: row.id,
            docNo: row.return_no || 'Return',
            party: row.vendor_name || 'N/A',
            date: row.return_date || 'N/A',
          });
          map.set(key, entry);
        });
      });

      return Array.from(map.values())
        .filter((e) => e.docSet.size > 1)
        .map((e) => ({
          challanNo: e.challanNo,
          count: e.records.length,
          distinctDocCount: e.docSet.size,
          records: e.records,
        }));
    }

    if (module === 'sales_return') {
      const { data, error } = await supabase
        .from('sales_returns')
        .select('id, return_no, gate_pass_no, customer_name, return_date, metadata');

      if (error || !data) return [];

      const map = new Map<string, { challanNo: string; docSet: Set<string>; records: any[] }>();
      data.forEach((row: any) => {
        const slips: string[] = [];
        if (row.metadata?.gatePasses && typeof row.metadata.gatePasses === 'object') {
          Object.values(row.metadata.gatePasses).forEach((v: any) => {
            if (v && String(v).trim()) slips.push(String(v).trim());
          });
        }
        if (slips.length === 0 && row.gate_pass_no) {
          const parts = String(row.gate_pass_no).split('|');
          parts.forEach((p) => {
            const val = p.includes(':') ? p.split(':')[1]?.trim() : p.trim();
            if (val) slips.push(val);
          });
        }

        const returnDocRef = String(row.return_no || `SR_${row.id}`).trim().toUpperCase();

        slips.forEach((s) => {
          const raw = normalizeChallanNo(s);
          if (!raw) return;
          const key = raw;
          const entry = map.get(key) || { challanNo: s, docSet: new Set<string>(), records: [] };
          entry.docSet.add(returnDocRef);
          entry.records.push({
            id: row.id,
            docNo: row.return_no || 'Return',
            party: row.customer_name || 'N/A',
            date: row.return_date || 'N/A',
          });
          map.set(key, entry);
        });
      });

      return Array.from(map.values())
        .filter((e) => e.docSet.size > 1)
        .map((e) => ({
          challanNo: e.challanNo,
          count: e.records.length,
          distinctDocCount: e.docSet.size,
          records: e.records,
        }));
    }
  } catch (err) {
    console.warn(`Error checking duplicate challans for ${module}:`, err);
  }

  return [];
};

/**
 * Checks if a specific challan/slip number is already taken by a DIFFERENT parent transaction.
 * If the matched record belongs to the SAME parent document (currentDocNo), it is allowed!
 */
export const isChallanNumberTaken = async (
  module: ChallanModule,
  challanNo: string,
  excludeId?: string | number,
  currentDocNo?: string
): Promise<{ isTaken: boolean; existingRecord?: any }> => {
  const norm = normalizeChallanNo(challanNo);
  if (!norm) return { isTaken: false };
  const normCurrentDoc = currentDocNo ? currentDocNo.trim().toUpperCase() : undefined;

  try {
    if (module === 'purchase') {
      const { data } = await supabase
        .from('grn_receipts')
        .select('id, grn_no, vendor_name, receipt_date, remarks');

      if (data && data.length > 0) {
        for (const row of data) {
          if (excludeId && String(row.id) === String(excludeId)) continue;
          if (isSlipMatch(row.grn_no, norm)) {
            // Check if it belongs to the same parent purchase
            if (normCurrentDoc) {
              const matchPo = String(row.remarks || '').match(/for\s+([A-Z0-9\-_]+)/i);
              const rowDocNo = matchPo && matchPo[1] ? matchPo[1].trim().toUpperCase() : undefined;
              if (rowDocNo && rowDocNo === normCurrentDoc) {
                continue; // Same purchase bill, allow!
              }

              const { data: matchedPurchase } = await supabase
                .from('supplier_purchases')
                .select('id, purchase_no, metadata')
                .eq('purchase_no', normCurrentDoc)
                .limit(1);

              if (matchedPurchase && matchedPurchase[0]?.metadata?.grn_id && String(matchedPurchase[0].metadata.grn_id) === String(row.id)) {
                continue; // Same purchase bill, allow!
              }
            }
            return { isTaken: true, existingRecord: row };
          }
        }
      }
    }

    if (module === 'sale') {
      const { data } = await supabase
        .from('delivery_challans')
        .select('id, challan_no, customer_name, challan_date, invoice_no');

      if (data && data.length > 0) {
        for (const row of data) {
          if (excludeId && String(row.id) === String(excludeId)) continue;
          if (isSlipMatch(row.challan_no, norm)) {
            // If it belongs to the SAME invoice, it's a partial dispatch of this invoice — NOT a duplicate!
            if (normCurrentDoc && row.invoice_no && row.invoice_no.trim().toUpperCase() === normCurrentDoc) {
              continue;
            }
            return { isTaken: true, existingRecord: row };
          }
        }
      }
    }

    if (module === 'purchase_return') {
      const { data } = await supabase
        .from('purchase_returns')
        .select('id, return_no, vendor_name, metadata');

      if (data && data.length > 0) {
        for (const row of data) {
          if (excludeId && String(row.id) === String(excludeId)) continue;
          if (normCurrentDoc && row.return_no && row.return_no.trim().toUpperCase() === normCurrentDoc) {
            continue;
          }
          if (row.metadata?.gatePasses && typeof row.metadata.gatePasses === 'object') {
            for (const v of Object.values(row.metadata.gatePasses)) {
              if (isSlipMatch(String(v), norm)) {
                return { isTaken: true, existingRecord: row };
              }
            }
          }
          const effectiveGp = row.gate_pass_no || row.metadata?.gate_pass_no;
          if (effectiveGp && isSlipMatch(effectiveGp, norm)) {
            return { isTaken: true, existingRecord: row };
          }
        }
      }
    }

    if (module === 'sales_return') {
      const { data } = await supabase
        .from('sales_returns')
        .select('id, return_no, gate_pass_no, customer_name, metadata');

      if (data && data.length > 0) {
        for (const row of data) {
          if (excludeId && String(row.id) === String(excludeId)) continue;
          if (normCurrentDoc && row.return_no && row.return_no.trim().toUpperCase() === normCurrentDoc) {
            continue;
          }
          if (row.metadata?.gatePasses && typeof row.metadata.gatePasses === 'object') {
            for (const v of Object.values(row.metadata.gatePasses)) {
              if (isSlipMatch(String(v), norm)) {
                return { isTaken: true, existingRecord: row };
              }
            }
          }
          if (row.gate_pass_no && isSlipMatch(row.gate_pass_no, norm)) {
            return { isTaken: true, existingRecord: row };
          }
        }
      }
    }
  } catch (err) {
    console.warn(`Error verifying challan number ${challanNo}:`, err);
  }

  return { isTaken: false };
};
