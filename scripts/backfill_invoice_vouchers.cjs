const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('C:\\Users\\user\\Downloads\\Zohaib Ali Company 2\\.env', 'utf8');
let url = '', key = '';
envText.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(url, key);

async function fetchAllPages(queryBuilder, pageSize = 1000) {
  let all = [];
  let page = 0;
  while (true) {
    const from = page * pageSize;
    const to = (page + 1) * pageSize - 1;
    const { data, error } = await queryBuilder.range(from, to);
    if (error) return { data: all, error };
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  return { data: all, error: null };
}

async function runBackfill() {
  console.log('🚀 Starting Financial Vouchers Backfill for Sales Invoices...\n');

  // 1. Fetch Customers, Invoices, and Existing Vouchers
  const [custRes, invRes, existingVchRes] = await Promise.all([
    fetchAllPages(supabase.from('customers').select('id, customer_name, customer_code, account_code')),
    fetchAllPages(supabase.from('sales_invoices').select('*').order('id', { ascending: true })),
    fetchAllPages(supabase.from('financial_vouchers').select('id, voucher_no, original_invoice_no, voucher_type'))
  ]);

  if (invRes.error) {
    console.error('Failed to fetch invoices:', invRes.error);
    return;
  }

  console.log(`✓ Loaded ${custRes.data.length} customers.`);
  console.log(`✓ Loaded ${invRes.data.length} sales invoices.`);
  console.log(`✓ Found ${existingVchRes.data.length} existing vouchers in database.\n`);

  // Map customer names to customer/account codes
  const custCodeMap = {};
  custRes.data.forEach(c => {
    const k = (c.customer_name || '').trim().toLowerCase();
    if (k) custCodeMap[k] = c.account_code || c.customer_code || '1010-001';
  });

  // Track existing vouchers by original_invoice_no + type to guarantee idempotency
  const existingSet = new Set();
  existingVchRes.data.forEach(v => {
    const invNo = String(v.original_invoice_no || '').trim().toUpperCase();
    const type = String(v.voucher_type || '').toLowerCase();
    if (invNo) {
      if (type.includes('sale amount') || String(v.voucher_no).startsWith('SAV-')) {
        existingSet.add(`${invNo}_SAV`);
      }
      if (type.includes('customer receive') || String(v.voucher_no).startsWith('CRV-')) {
        existingSet.add(`${invNo}_CRV`);
      }
    }
  });

  // Sort invoices by date then id for chronological voucher numbering
  const sortedInvoices = [...invRes.data].sort((a, b) => {
    const dateA = a.sale_date || a.created_at || '';
    const dateB = b.sale_date || b.created_at || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.id || 0) - (b.id || 0);
  });

  const vouchersToInsert = [];
  let savCounter = 1;
  let crvCounter = 1;

  for (const inv of sortedInvoices) {
    const cleanInvNo = String(inv.invoice_no || `INV-${inv.id}`).trim();
    const invUpper = cleanInvNo.toUpperCase();
    const custName = inv.customer_name || 'Walk-in Customer';
    const custKey = custName.trim().toLowerCase();
    const custCode = custCodeMap[custKey] || '1010-001';
    const vDate = inv.sale_date ? String(inv.sale_date).split('T')[0] : (inv.created_at ? String(inv.created_at).split('T')[0] : new Date().toISOString().split('T')[0]);
    const grandTotal = Number(inv.total_amount || 0);
    const paidCash = Number(inv.cash_amount_paid || 0);
    const paidBank = Number(inv.bank_amount || 0);
    const totalPaid = Number(inv.amount_paid || (paidCash + paidBank));

    // Parse items count
    let itemsCount = 1;
    try {
      if (Array.isArray(inv.items)) itemsCount = inv.items.length;
      else if (typeof inv.items === 'string') itemsCount = JSON.parse(inv.items).length;
    } catch {}

    // 1. Sale Amount Voucher (SAV)
    if (grandTotal > 0 && !existingSet.has(`${invUpper}_SAV`)) {
      const vNo = `SAV-${String(savCounter).padStart(4, '0')}`;
      savCounter++;

      vouchersToInsert.push({
        voucher_no: vNo,
        voucher_type: 'Sale Amount Voucher',
        voucher_date: vDate,
        total_amount: grandTotal,
        debit: grandTotal,
        credit: 0,
        account_code: custCode,
        account_title: custName,
        customer_name: custName,
        customerName: custName,
        party_name: custName,
        narration: `Sale Amount for Invoice #${cleanInvNo} (${itemsCount} items)`,
        original_invoice_no: cleanInvNo,
        items: [
          {
            accountCode: custCode,
            accountTitle: custName,
            particulars: `Bill #${cleanInvNo}`,
            debit: grandTotal,
            credit: 0
          }
        ],
        metadata: {
          preset: 'SAV',
          source: 'sales_invoice',
          invoice_no: cleanInvNo,
          invoice_id: inv.id,
          auto_generated: true,
          backfilled_at: new Date().toISOString()
        },
        tenant_id: inv.tenant_id || null
      });
    }

    // 2. Customer Receive Voucher (CRV)
    if (totalPaid > 0 && !existingSet.has(`${invUpper}_CRV`)) {
      const vNo = `CRV-${String(crvCounter).padStart(4, '0')}`;
      crvCounter++;

      const crvItems = [];
      let modeDesc = 'Payment received';

      if (paidCash > 0 && paidBank > 0) {
        crvItems.push({ accountCode: '1010-001', accountTitle: 'Cash in Hand', particulars: `Cash on Bill #${cleanInvNo}`, debit: paidCash, credit: 0 });
        crvItems.push({ accountCode: '1020-001', accountTitle: inv.selected_bank || 'Bank Account', particulars: `Bank Transfer on Bill #${cleanInvNo}`, debit: paidBank, credit: 0 });
        modeDesc = `Cash: Rs. ${Math.round(paidCash).toLocaleString()} + Bank: Rs. ${Math.round(paidBank).toLocaleString()}`;
      } else if (paidBank > 0) {
        crvItems.push({ accountCode: '1020-001', accountTitle: inv.selected_bank || 'Bank Account', particulars: `Bank Transfer on Bill #${cleanInvNo}`, debit: paidBank, credit: 0 });
        modeDesc = `Bank Transfer: Rs. ${Math.round(paidBank).toLocaleString()}`;
      } else {
        crvItems.push({ accountCode: '1010-001', accountTitle: 'Cash in Hand', particulars: `Cash on Bill #${cleanInvNo}`, debit: totalPaid, credit: 0 });
        modeDesc = `Cash: Rs. ${Math.round(totalPaid).toLocaleString()}`;
      }

      // Customer credit line
      crvItems.push({
        accountCode: custCode,
        accountTitle: custName,
        particulars: `Credit from Bill #${cleanInvNo}`,
        debit: 0,
        credit: totalPaid
      });

      vouchersToInsert.push({
        voucher_no: vNo,
        voucher_type: 'Customer Receive Voucher',
        voucher_date: vDate,
        total_amount: totalPaid,
        debit: 0,
        credit: totalPaid,
        account_code: custCode,
        account_title: custName,
        customer_name: custName,
        customerName: custName,
        party_name: custName,
        narration: `Payment received for Invoice #${cleanInvNo} (${modeDesc})`,
        original_invoice_no: cleanInvNo,
        items: crvItems,
        metadata: {
          preset: 'CRV',
          source: 'sales_invoice',
          invoice_no: cleanInvNo,
          invoice_id: inv.id,
          auto_generated: true,
          settlement_mode: inv.payment_term || 'Cash',
          paid_cash: paidCash,
          paid_bank: paidBank,
          backfilled_at: new Date().toISOString()
        },
        tenant_id: inv.tenant_id || null
      });
    }
  }

  console.log(`📋 Total vouchers to insert: ${vouchersToInsert.length}`);
  console.log(`   • SAV (Sale Vouchers): ${vouchersToInsert.filter(v => v.voucher_type === 'Sale Amount Voucher').length}`);
  console.log(`   • CRV (Receipt Vouchers): ${vouchersToInsert.filter(v => v.voucher_type === 'Customer Receive Voucher').length}\n`);

  if (vouchersToInsert.length === 0) {
    console.log('✅ All vouchers already exist! No new vouchers to insert.');
    return;
  }

  // Insert in batches of 100
  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < vouchersToInsert.length; i += BATCH_SIZE) {
    const chunk = vouchersToInsert.slice(i, i + BATCH_SIZE);
    const { error: insErr } = await supabase.from('financial_vouchers').insert(chunk);
    if (insErr) {
      console.error(`❌ Batch insert failed at index ${i}:`, insErr);
      return;
    }
    inserted += chunk.length;
    process.stdout.write(`⏳ Inserted ${inserted} / ${vouchersToInsert.length} vouchers...\r`);
  }

  console.log(`\n\n🎉 SUCCESS! Successfully generated and inserted ${inserted} financial vouchers into general ledger!`);
}

runBackfill();
