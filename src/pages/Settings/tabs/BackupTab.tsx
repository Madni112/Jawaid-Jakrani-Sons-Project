import React, { useState } from 'react';
import {
  LuHardDrive,
  LuShieldAlert,
  LuUsers,
  LuPackage,
  LuReceipt,
  LuFileSpreadsheet,
  LuDownload,
  LuRefreshCw,
} from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { canUserBackup, SystemMasterConfig } from '../../../utils/systemPermissions';
import { fetchCustomerCreditLimits } from '../../../utils/creditLimitUtils';
import { triggerFeedbackSound } from '../../../utils/audioFeedback';
import { getBrandConfig } from '../../../utils/brand';

interface BackupTabProps {
  userEmail?: string | null;
  role?: string;
  businessName?: string;
  systemConfig?: SystemMasterConfig | null;
  isRTL?: boolean;
}

export const BackupTab: React.FC<BackupTabProps> = ({
  userEmail,
  role,
  businessName,
  systemConfig,
  isRTL = false,
}) => {
  const [exportingType, setExportingType] = useState<string | null>(null);

  const isBackupPermitted = canUserBackup(userEmail, role, systemConfig);

  if (!isBackupPermitted) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 shadow-sm text-center max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 mx-auto flex items-center justify-center text-3xl">
          <LuShieldAlert />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Data Backup & Export Locked
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Exporting ERP records is restricted by the System Administrator. Permission controls for Super Admin and staff are governed in Master Dev Console (<code>/dev/master</code>).
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            Status: Export Disallowed for {role || 'User'} ({userEmail || 'Account'})
          </span>
        </div>
      </div>
    );
  }

  const handleExportCustomers = async () => {
    try {
      setExportingType('customers');
      const { data, error } = await fetchAllPages(supabase.from('customers').select('*').order('customerName', { ascending: true }));
      if (error) throw error;

      const limits = await fetchCustomerCreditLimits();
      const rows = (data || []).map((c: any, index: number) => ({
        'S.No': index + 1,
        'Customer Name': c.customerName || c.customername || '—',
        'Customer Code': c.customer_code || c.customerCode || '—',
        'Phone': c.primaryPhone || c.phone || '—',
        'City': c.city || c.province || '—',
        'Balance (Receivable)': Number(c.balance || 0),
        'Credit Limit': Number(limits[String(c.id)] || 0),
        'Company / Branch': c.company || '—',
        'Address': c.address || '—',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Customers_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
      triggerFeedbackSound('success', userEmail);
      toast.success('Customer directory exported to Excel!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportProducts = async () => {
    try {
      setExportingType('products');
      const { data, error } = await fetchAllPages(supabase.from('products').select('*').order('name', { ascending: true }));
      if (error) throw error;

      const rows = (data || []).map((p: any, index: number) => ({
        'S.No': index + 1,
        'Product Name': p.name || '—',
        'Item Code / SKU': p.code || p.sku || '—',
        'Category': p.category || '—',
        'Tile Size': p.size || '—',
        'Sales Price': Number(p.sale_price || p.price || 0),
        'Purchase Price': Number(p.purchase_price || 0),
        'Current Stock': Number(p.stock || p.quantity || 0),
        'Unit': p.unit || 'Box',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Products_Catalog_${new Date().toISOString().slice(0, 10)}.xlsx`);
      triggerFeedbackSound('success', userEmail);
      toast.success('Product catalog exported to Excel!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportInvoices = async () => {
    try {
      setExportingType('invoices');
      const { data, error } = await fetchAllPages(supabase.from('sales_invoices').select('*').order('created_at', { ascending: false }));
      if (error) throw error;

      const rows = (data || []).map((inv: any, index: number) => ({
        'S.No': index + 1,
        'Invoice #': inv.invoice_number || `#${inv.id}`,
        'Date': inv.invoice_date || (inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'),
        'Customer Name': inv.customer_name || '—',
        'Salesman': inv.salesman_name || '—',
        'Gross Total': Number(inv.gross_amount || inv.total_amount || 0),
        'Discount': Number(inv.discount_amount || 0),
        'Net Total': Number(inv.net_amount || inv.total_amount || 0),
        'Received Amount': Number(inv.received_amount || 0),
        'Status': inv.payment_status || 'Completed',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Invoices');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Sales_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`);
      triggerFeedbackSound('success', userEmail);
      toast.success('Sales invoices exported to Excel!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  const handleExportFullERP = async () => {
    try {
      setExportingType('full');
      const [custRes, prodRes, invRes] = await Promise.all([
        fetchAllPages(supabase.from('customers').select('*').order('customerName', { ascending: true })),
        fetchAllPages(supabase.from('products').select('*').order('name', { ascending: true })),
        fetchAllPages(supabase.from('sales_invoices').select('*').order('created_at', { ascending: false })),
      ]);

      const limits = await fetchCustomerCreditLimits();
      const wb = XLSX.utils.book_new();

      // Sheet 1: Customers
      const custRows = (custRes.data || []).map((c: any, index: number) => ({
        'S.No': index + 1,
        'Customer Name': c.customerName || c.customername || '—',
        'Customer Code': c.customer_code || c.customerCode || '—',
        'Phone': c.primaryPhone || c.phone || '—',
        'City': c.city || c.province || '—',
        'Balance (Receivable)': Number(c.balance || 0),
        'Credit Limit': Number(limits[String(c.id)] || 0),
        'Address': c.address || '—',
      }));
      const wsCust = XLSX.utils.json_to_sheet(custRows);
      XLSX.utils.book_append_sheet(wb, wsCust, 'Customers');

      // Sheet 2: Products
      const prodRows = (prodRes.data || []).map((p: any, index: number) => ({
        'S.No': index + 1,
        'Product Name': p.name || '—',
        'Item Code / SKU': p.code || p.sku || '—',
        'Category': p.category || '—',
        'Tile Size': p.size || '—',
        'Price': Number(p.sale_price || p.price || 0),
        'Current Stock': Number(p.stock || p.quantity || 0),
        'Unit': p.unit || 'Box',
      }));
      const wsProd = XLSX.utils.json_to_sheet(prodRows);
      XLSX.utils.book_append_sheet(wb, wsProd, 'Item Master');

      // Sheet 3: Invoices
      const invRows = (invRes.data || []).map((inv: any, index: number) => ({
        'S.No': index + 1,
        'Invoice #': inv.invoice_number || `#${inv.id}`,
        'Date': inv.invoice_date || (inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'),
        'Customer Name': inv.customer_name || '—',
        'Net Total': Number(inv.net_amount || inv.total_amount || 0),
        'Received': Number(inv.received_amount || 0),
      }));
      const wsInv = XLSX.utils.json_to_sheet(invRows);
      XLSX.utils.book_append_sheet(wb, wsInv, 'Sales Invoices');

      // Sheet 4: Backup Meta
      const metaRows = [
        { 'System Attribute': 'Company Name', 'Value': businessName || getBrandConfig().fullName },
        { 'System Attribute': 'Exported By', 'Value': userEmail || 'Admin' },
        { 'System Attribute': 'Role', 'Value': role || 'Super Admin' },
        { 'System Attribute': 'Export Timestamp', 'Value': new Date().toLocaleString() },
        { 'System Attribute': 'Total Customers', 'Value': custRows.length },
        { 'System Attribute': 'Total Items', 'Value': prodRows.length },
        { 'System Attribute': 'Total Invoices', 'Value': invRows.length },
      ];
      const wsMeta = XLSX.utils.json_to_sheet(metaRows);
      XLSX.utils.book_append_sheet(wb, wsMeta, 'System Info');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Full_ERP_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`);
      triggerFeedbackSound('success', userEmail);
      toast.success('Complete multi-sheet ERP backup generated successfully!');
    } catch (err: any) {
      toast.error('Snapshot generation failed: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
            <LuHardDrive />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {isRTL ? "ERP ڈیٹا بیک اپ اور ایکسل ایکسپورٹ" : "ERP Data Backup & Excel Export"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download comprehensive, clean Excel (.xlsx) snapshots of your customers, products, and sales history.
            </p>
          </div>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export 1: Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-xl shrink-0">
              <LuUsers />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {isRTL ? "کسٹمرز اور اکاؤنٹس ڈائریکٹری" : "Customers & Accounts Directory"}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Names, codes, phone, ledger balances, and credit limits.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={exportingType !== null}
            onClick={handleExportCustomers}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {exportingType === 'customers' ? (
              <LuRefreshCw className="animate-spin text-sm" />
            ) : (
              <LuDownload className="text-sm" />
            )}
            <span>Export Customers (.xlsx)</span>
          </button>
        </div>

        {/* Export 2: Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-xl shrink-0">
              <LuPackage />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {isRTL ? "آئٹم ماسٹر اور ٹائلز کیٹلاگ" : "Item Master & Tile Catalog"}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full product registry, tile dimensions, prices, and inventory stock.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={exportingType !== null}
            onClick={handleExportProducts}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {exportingType === 'products' ? (
              <LuRefreshCw className="animate-spin text-sm" />
            ) : (
              <LuDownload className="text-sm" />
            )}
            <span>Export Item Master (.xlsx)</span>
          </button>
        </div>

        {/* Export 3: Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <LuReceipt />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {isRTL ? "سیلز انوائسز اور ریونیو لیجر" : "Sales Invoices & Revenue Ledger"}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Invoice history, customer orders, payment status, and totals.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={exportingType !== null}
            onClick={handleExportInvoices}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {exportingType === 'invoices' ? (
              <LuRefreshCw className="animate-spin text-sm" />
            ) : (
              <LuDownload className="text-sm" />
            )}
            <span>Export Invoices (.xlsx)</span>
          </button>
        </div>

        {/* Export 4: Complete ERP Snapshot */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 border-dashed border-primary/40 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-xl shrink-0">
              <LuFileSpreadsheet />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {isRTL ? "مکمل ERP اسنیپ شاٹ (ملٹی شیٹ)" : "Complete ERP Snapshot (Multi-Sheet)"}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Combines Customers, Products, and Invoices into one Excel workbook.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={exportingType !== null}
            onClick={handleExportFullERP}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-primary hover:opacity-90 text-white transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {exportingType === 'full' ? (
              <LuRefreshCw className="animate-spin text-sm" />
            ) : (
              <LuDownload className="text-sm" />
            )}
            <span>{isRTL ? "مکمل ERP اسنیپ شاٹ ڈاؤنلوڈ کریں (.xlsx)" : "Download Complete ERP Snapshot (.xlsx)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
