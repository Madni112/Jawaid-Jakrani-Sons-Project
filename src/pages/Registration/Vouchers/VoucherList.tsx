import React, { useEffect, useState } from 'react';
import TablePagination from '../../../components/TablePagination';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import TableActions from '../../../ui/TableActions';
import { MdReceipt, MdAssignment, MdDelete } from 'react-icons/md';
import { LuSparkles } from 'react-icons/lu';
import { useAuth } from '../../../Context/Auth';
import { recalculateInvoiceSettlementStatus } from '../../../service/financialCalculations';

function VoucherList() {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchVoucherLedgerHistory();
  }, []);

  const [syncing, setSyncing] = useState(false);

  const syncCustomerOpeningBalances = async (silent = false) => {
    try {
      setSyncing(true);
      // 1. Fetch customers with opening balance
      const { data: customers, error: custErr } = await supabase
        .from('customers')
        .select('*');

      if (custErr) throw custErr;
      if (!customers || customers.length === 0) {
        if (!silent) toast('No customer records found to sync.');
        return;
      }

      // 2. Fetch existing financial vouchers
      const { data: existingVouchers } = await supabase
        .from('financial_vouchers')
        .select('id, voucher_no, account_code, total_amount, debit, credit, voucher_type');

      // Auto-repair any existing vouchers where total_amount is 0/null but debit/credit is set
      if (existingVouchers) {
        for (const ev of existingVouchers) {
          const actualAmt = Number(ev.debit) || Number(ev.credit) || 0;
          if ((!ev.total_amount || Number(ev.total_amount) === 0) && actualAmt > 0) {
            try {
              await supabase.from('financial_vouchers').update({ total_amount: actualAmt }).eq('id', ev.id);
            } catch {}
          }
        }
      }

      const existingNos = new Set((existingVouchers || []).map((v: any) => String(v.voucher_no || '').trim().toUpperCase()));

      const toInsert: any[] = [];

      customers.forEach((c: any) => {
        const rawBal = c.opening_balance ?? c.openingBalance ?? c.balance ?? c.currentBalance;
        const bal = Math.abs(Number(rawBal) || 0);
        if (bal <= 0) return;

        const code = String(c.customer_code || c.customerCode || c.coa_code || c.id || '').trim();
        const cleanCode = code ? (code.length < 3 ? code.padStart(3, '0') : code) : `CUST-${c.id}`;
        const voucherNo = `OB-${cleanCode}`.toUpperCase();

        // Skip if voucher already documented
        if (existingNos.has(voucherNo)) return;

        const custName = c.customerName || c.customername || c.customer_name || c.name || `Customer #${cleanCode}`;
        const nature = c.balance_nature || c.balanceNature || 'Debit';
        const isDebit = String(nature).toLowerCase() === 'debit';

        toInsert.push({
          voucher_no: `OB-${cleanCode}`,
          voucher_type: 'Journal Voucher',
          voucher_date: c.created_at ? c.created_at.split('T')[0] : '2026-10-31',
          account_code: cleanCode,
          account_title: custName,
          total_amount: bal,
          debit: isDebit ? bal : 0,
          credit: !isDebit ? bal : 0,
          narration: `Opening Balance for Customer ${custName}`
        });
      });

      if (toInsert.length > 0) {
        const { error: insertErr } = await supabase
          .from('financial_vouchers')
          .insert(toInsert);

        if (insertErr) {
          console.error('Batch voucher insert error:', insertErr);
          if (!silent) toast.error('Failed to sync some vouchers: ' + insertErr.message);
        } else {
          toast.success(`Generated ${toInsert.length} customer opening balance vouchers!`);
          await fetchVoucherLedgerHistory();
        }
      } else {
        if (!silent) {
          toast.success('All customer opening balances are already documented in vouchers!');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) toast.error('Sync error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const fetchVoucherLedgerHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_vouchers')
        .select('*');

      if (error) throw error;

      // Auto-deduplicate by normalized voucher number and customer (keeping exactly 1 voucher per customer)
      const seenKeys = new Set<string>();
      const uniqueList: any[] = [];
      const duplicateIdsToDelete: any[] = [];

      (data || []).forEach((v: any) => {
        const rawNo = String(v.voucher_no || '').trim().toUpperCase();
        const numMatch = rawNo.match(/OB-(?:2020-)?(\d+)/);
        const normNo = numMatch ? `OB-${numMatch[1].padStart(3, '0')}` : rawNo;
        const custKey = String(v.account_code || v.account_title || '').trim().toLowerCase();

        // Primary key by normalized voucher number, fallback by customer key
        const uniqueKey = normNo.startsWith('OB-') ? normNo : (custKey || v.id);

        if (seenKeys.has(uniqueKey) || (custKey && seenKeys.has('cust:' + custKey))) {
          duplicateIdsToDelete.push(v.id);
        } else {
          seenKeys.add(uniqueKey);
          if (custKey) seenKeys.add('cust:' + custKey);
          uniqueList.push(v);
        }
      });

      // Permanently remove duplicates from database
      if (duplicateIdsToDelete.length > 0) {
        try {
          await supabase.from('financial_vouchers').delete().in('id', duplicateIdsToDelete);
        } catch (delErr) {
          console.warn('Voucher cleanup note:', delErr);
        }
      }

      // Sort vouchers sequentially by number (OB-001, OB-002, ..., OB-033)
      uniqueList.sort((a, b) => {
        const numA = parseInt(String(a.voucher_no || '').replace(/\D/g, '') || '999999', 10);
        const numB = parseInt(String(b.voucher_no || '').replace(/\D/g, '') || '999999', 10);
        return numA - numB;
      });

      setVouchers(uniqueList);
    } catch (err: any) {
      toast.error('Failed to load voucher histories: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this voucher? This will permanently remove it from the general ledger records.')) return;

    try {
      setLoading(true);
      // 1. Fetch voucher details to check for linked invoice
      const { data: voucherToDelete } = await supabase
        .from('financial_vouchers')
        .select('original_invoice_no')
        .eq('id', id)
        .maybeSingle();

      const { error } = await supabase
        .from('financial_vouchers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 2. Synchronize invoice settlement status
      if (voucherToDelete?.original_invoice_no) {
        await recalculateInvoiceSettlementStatus(voucherToDelete.original_invoice_no);
      }

      toast.success('Voucher record deleted cleanly.');
      fetchVoucherLedgerHistory();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };


  const filteredVouchers = vouchers.filter((v) =>
    v.voucher_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.voucher_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.narration?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEntries = filteredVouchers.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedVouchers = filteredVouchers.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative text-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
          🧾 General Ledger Financial Vouchers
        </h2>
        <div className="flex items-center gap-2.5">
          
          <button
            type="button"
            onClick={() => navigate('/Registration/Vouchers/Add')}
            className="flex items-center justify-center rounded-lg bg-primary py-2 px-4 text-xs font-bold text-white hover:bg-opacity-90 transition duration-150 shadow-sm cursor-pointer"
          >
            + Add New Voucher
          </button>
        </div>

      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-stroke py-1 px-2 bg-transparent dark:border-strokedark outline-none text-xs font-semibold text-black dark:text-white"
            >
              {[10, 25, 50, 100].map((size: number) => (
                <option key={size} value={size} className="dark:bg-boxdark">{size}</option>
              ))}
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto text-gray-500 dark:text-gray-400">
            <span>Search:</span>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search voucher no, type..." className="w-full sm:w-64 rounded border border-stroke py-1.5 px-3 bg-transparent dark:border-strokedark outline-none text-xs text-black dark:text-white" />
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4 text-xs font-bold uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                <th className="py-4 px-4 font-semibold w-16">S#</th>
                <th className="py-4 px-4 font-semibold w-32">Voucher Slip No</th>
                <th className="py-4 px-4 font-semibold w-48">Classification Type</th>
                <th className="py-4 px-4 font-semibold">Description Note / Accounts</th>
                <th className="py-4 px-4 font-semibold text-right w-36">Total Amount</th>
                <th className="py-4 px-4 font-semibold text-center w-32">Voucher Date</th>
                <th className="py-4 px-4 font-semibold text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><Spinner /></td></tr>
              ) : paginatedVouchers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No transaction voucher slips documented inside system history logs.</td></tr>
              ) : (
                paginatedVouchers.map((v, idx) => {
                  const serialNumber = startIndex + idx + 1;
                  return (
                    <tr key={v.id} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150">
                      <td className="py-3.5 px-4 font-medium text-black dark:text-white">{serialNumber}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-primary tracking-wide">{v.voucher_no}</td>
                      <td className="py-3.5 px-4">
                        {(() => {
                          const isJV = v.voucher_type === 'Journal Voucher' || v.voucher_type === 'JV';
                          const isReceipt = v.voucher_type?.includes('Receipt') || v.voucher_type === 'CRV' || v.voucher_type === 'BRV';
                          return (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]
                              ${isJV ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600' :
                                isReceipt ? 'bg-success/10 text-success' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'}`}>
                              <MdAssignment size={11} /> {isJV ? 'Journal Voucher' : v.voucher_type}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 font-medium max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          {(v.account_title || v.account_code) && (
                            <div className="text-[11px] font-bold text-black dark:text-white">
                              {v.account_title || v.account_code} {v.debit > 0 ? `(Dr: ${Number(v.debit).toLocaleString()})` : v.credit > 0 ? `(Cr: ${Number(v.credit).toLocaleString()})` : ''}
                            </div>
                          )}
                          {!v.voucher_no?.startsWith('OB-') && v.items && v.items.filter((it: any) => it.accountCode !== '3010-001').map((item: any, idx: number) => {
                            const amountStr = item.debit > 0 ? `(Dr: ${item.debit})` : `(Cr: ${item.credit})`;
                            return (
                              <div key={idx} className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                <span className="font-bold text-black dark:text-white">{item.accountCode}</span> {amountStr}
                              </div>
                            );
                          })}
                          {(v.notes || v.narration) && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 border-t border-stroke dark:border-strokedark mt-1 pt-0.5 italic">Note: {v.notes || v.narration}</p>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-black dark:text-white font-mono">{Number(v.total_amount || v.debit || v.credit || 0).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-center text-gray-500 font-medium">{v.voucher_date}</td>
                      <td className="py-3.5 px-4 text-center">
                        <TableActions
                          onEdit={() => navigate(`/Registration/Vouchers/Add?id=${v.id}`, { state: { voucher: v } })}
                          canDelete={false}
                          editTitle="View or Edit Voucher"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalEntries={totalEntries}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          itemName="entries"
        />
      </div>
    </div>
  );
}

export default VoucherList;
