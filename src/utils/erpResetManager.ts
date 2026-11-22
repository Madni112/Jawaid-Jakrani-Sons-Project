import { supabase, fetchAllPages } from '../Context/supabaseClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export interface ResetBackupMetadata {
  id: string;
  timestamp: string;
  performedBy: string;
  sourcePortal: string;
  summary: {
    salesInvoices: number;
    supplierPurchases: number;
    openingStocks: number;
    deliveryChallans: number;
    salesReturns: number;
    purchaseReturns: number;
    financialVouchers: number;
    customerRecoveries: number;
    grnReceipts: number;
    productsZeroed: number;
    customersZeroed: number;
    wipeMasterData: boolean;
  };
  archive: Record<string, any[]>;
}

/**
 * Fetch all ERP reset backups stored in audit_logs
 */
export const fetchResetBackups = async (): Promise<ResetBackupMetadata[]> => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'erp_reset_archive')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => {
      const details = typeof row.details === 'string' ? JSON.parse(row.details || '{}') : (row.details || {});
      return {
        id: details.backupId || String(row.id),
        timestamp: details.timestamp || row.created_at,
        performedBy: details.performedBy || row.performed_by || 'Super Admin',
        sourcePortal: details.sourcePortal || 'Jawaid Jakwani & Sons',
        summary: details.summary || {},
        archive: details.archive || {},
      };
    });
  } catch (err) {
    console.error('Error fetching ERP reset backups:', err);
    return [];
  }
};

/**
 * Execute full ERP factory reset:
 * 1. Harvest complete snapshot of transactions & balances
 * 2. Upload cloud backup to audit_logs (viewable in /dev/master/reset-backups)
 * 3. Trigger immediate local JSON download in browser
 * 4. Wipe transactional tables
 * 5. Zero out product current_stock and customer balances
 */
export const executeErpFactoryReset = async (
  performedBy: string,
  wipeMasterData: boolean = false
): Promise<{ success: boolean; error?: string; backupId?: string }> => {
  try {
    const timestamp = new Date().toISOString();
    const backupId = `RESET-ALM-${Date.now()}`;

    // 1. Gather all transactional data
    const [
      salesRes,
      purRes,
      openRes,
      dcRes,
      srRes,
      srrRes,
      prRes,
      prrRes,
      vchRes,
      recRes,
      grnRes,
      prodRes,
      custRes,
      bankRes,
    ] = await Promise.all([
      fetchAllPages(supabase.from('sales_invoices').select('*')),
      fetchAllPages(supabase.from('supplier_purchases').select('*')),
      fetchAllPages(supabase.from('opening_stocks').select('*')),
      fetchAllPages(supabase.from('delivery_challans').select('*')),
      fetchAllPages(supabase.from('sales_returns').select('*')),
      fetchAllPages(supabase.from('sales_return_receipts').select('*')),
      fetchAllPages(supabase.from('purchase_returns').select('*')),
      fetchAllPages(supabase.from('purchase_return_receipts').select('*')),
      fetchAllPages(supabase.from('financial_vouchers').select('*')),
      fetchAllPages(supabase.from('customer_recoveries').select('*')),
      fetchAllPages(supabase.from('grn_receipts').select('*')),
      fetchAllPages(supabase.from('products').select('*')),
      fetchAllPages(supabase.from('customers').select('*')),
      fetchAllPages(supabase.from('banks').select('*')),
    ]);

    const archiveData: Record<string, any[]> = {
      sales_invoices: salesRes.data || [],
      supplier_purchases: purRes.data || [],
      opening_stocks: openRes.data || [],
      delivery_challans: dcRes.data || [],
      sales_returns: srRes.data || [],
      sales_return_receipts: srrRes.data || [],
      purchase_returns: prRes.data || [],
      purchase_return_receipts: prrRes.data || [],
      financial_vouchers: vchRes.data || [],
      customer_recoveries: recRes.data || [],
      grn_receipts: grnRes.data || [],
      products: prodRes.data || [],
      customers: custRes.data || [],
      banks: bankRes.data || [],
    };

    const summary = {
      salesInvoices: (salesRes.data || []).length,
      supplierPurchases: (purRes.data || []).length,
      openingStocks: (openRes.data || []).length,
      deliveryChallans: (dcRes.data || []).length,
      salesReturns: (srRes.data || []).length,
      purchaseReturns: (prRes.data || []).length,
      financialVouchers: (vchRes.data || []).length,
      customerRecoveries: (recRes.data || []).length,
      grnReceipts: (grnRes.data || []).length,
      productsZeroed: (prodRes.data || []).length,
      customersZeroed: (custRes.data || []).length,
      wipeMasterData,
    };

    // 2. Persist snapshot to Cloud (audit_logs)
    const auditRecord = {
      action_type: 'ERP_FACTORY_RESET',
      table_name: 'erp_reset_archive',
      performed_by: performedBy || 'Super Admin',
      details: {
        backupId,
        timestamp,
        performedBy,
        sourcePortal: 'Jawaid Jakwani & Sons',
        summary,
        archive: archiveData,
      },
    };

    const { error: cloudSaveErr } = await supabase.from('audit_logs').insert([auditRecord]);
    if (cloudSaveErr) {
      console.warn('Cloud backup save warning:', cloudSaveErr);
    }

    // 3. Immediately download local copy to user device for instant offline guarantee
    try {
      const jsonStr = JSON.stringify(
        {
          backupId,
          timestamp,
          system: 'Jawaid Jakwani & Sons ENTERPRISE ERP',
          summary,
          data: archiveData,
        },
        null,
        2
      );
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      saveAs(blob, `ALM_ERP_RESET_BACKUP_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.json`);
    } catch (downloadErr) {
      console.warn('Browser auto-download notice:', downloadErr);
    }

    // 4. Wipe Transactional Tables (Delete all rows with id > 0)
    const tablesToWipe = [
      'sales_invoices',
      'supplier_purchases',
      'opening_stocks',
      'delivery_challans',
      'sales_returns',
      'sales_return_receipts',
      'purchase_returns',
      'purchase_return_receipts',
      'financial_vouchers',
      'customer_recoveries',
      'grn_receipts',
    ];

    for (const table of tablesToWipe) {
      try {
        await supabase.from(table).delete().gt('id', 0);
      } catch (tableErr) {
        console.warn(`Error wiping ${table}:`, tableErr);
      }
    }

    // 5. Zero out product stock and customer balances
    if (wipeMasterData) {
      try {
        await supabase.from('products').delete().gt('id', 0);
        await supabase.from('customers').delete().gt('id', 0);
      } catch (masterErr) {
        console.warn('Error wiping master directories:', masterErr);
      }
    } else {
      // Just zero out balances and stock
      try {
        await supabase.from('products').update({ current_stock: 0 }).gt('id', 0);
      } catch (pErr) {
        console.warn('Error resetting product stocks:', pErr);
      }
      try {
        await supabase.from('customers').update({ balance: 0 }).gt('id', 0);
      } catch (cErr) {
        console.warn('Error resetting customer balances:', cErr);
      }
    }

    // Reset bank balances
    try {
      await supabase.from('banks').update({ openingBalance: 0 }).gt('id', 0);
    } catch (bErr) {
      console.warn('Error resetting bank balances:', bErr);
    }

    return { success: true, backupId };
  } catch (err: any) {
    console.error('Fatal ERP reset failure:', err);
    return { success: false, error: err.message || 'Unknown reset error' };
  }
};

/**
 * Export a historical reset backup to Excel workbook with multiple sheets
 */
export const downloadBackupAsExcel = (backup: ResetBackupMetadata) => {
  try {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryRows = [
      ['Metric', 'Value'],
      ['Backup Reference ID', backup.id],
      ['Date & Time', new Date(backup.timestamp).toLocaleString()],
      ['Performed By', backup.performedBy],
      ['Source Portal', backup.sourcePortal],
      ['Sales Invoices Reset', backup.summary.salesInvoices || 0],
      ['Purchases Reset', backup.summary.supplierPurchases || 0],
      ['Opening Stocks Reset', backup.summary.openingStocks || 0],
      ['Delivery Challans Reset', backup.summary.deliveryChallans || 0],
      ['Vouchers Reset', backup.summary.financialVouchers || 0],
      ['Recoveries Reset', backup.summary.customerRecoveries || 0],
      ['Products Zeroed', backup.summary.productsZeroed || 0],
      ['Customers Zeroed', backup.summary.customersZeroed || 0],
      ['Master Data Wiped?', backup.summary.wipeMasterData ? 'Yes' : 'No (Preserved Catalog)'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Add sheets for available tables
    const tableNames = Object.keys(backup.archive || {});
    tableNames.forEach((tName) => {
      const rows = backup.archive[tName];
      if (Array.isArray(rows) && rows.length > 0) {
        const flatRows = rows.map((r: any) => {
          const clean: Record<string, any> = {};
          Object.entries(r).forEach(([k, v]) => {
            if (typeof v === 'object' && v !== null) clean[k] = JSON.stringify(v);
            else clean[k] = v;
          });
          return clean;
        });
        const sheet = XLSX.utils.json_to_sheet(flatRows);
        const safeSheetName = tName.slice(0, 31);
        XLSX.utils.book_append_sheet(wb, sheet, safeSheetName);
      }
    });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `ALM_BACKUP_${backup.id}.xlsx`);
  } catch (err: any) {
    console.error('Failed to export backup to Excel:', err);
  }
};

