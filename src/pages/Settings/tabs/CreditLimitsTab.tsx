import React, { useState, useEffect } from 'react';
import {
  LuCreditCard,
  LuLock,
  LuRefreshCw,
  LuSearch,
  LuUsers,
  LuSave
} from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import {
  canUserEditCreditLimit,
  fetchSystemMasterConfig,
  SystemMasterConfig
} from '../../../utils/systemPermissions';
import {
  fetchCustomerCreditLimits,
  saveCustomerCreditLimit,
  getCustomerCreditStatus
} from '../../../utils/creditLimitUtils';
import { triggerFeedbackSound } from '../../../utils/audioFeedback';

interface CreditLimitsTabProps {
  userEmail?: string | null;
  role?: string;
  systemConfig?: SystemMasterConfig | null;
  isRTL?: boolean;
}

export const CreditLimitsTab: React.FC<CreditLimitsTabProps> = ({
  userEmail,
  role,
  systemConfig: initialSystemConfig,
  isRTL = false,
}) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [creditLimits, setCreditLimits] = useState<Record<string, number>>({});
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [creditSearch, setCreditSearch] = useState('');
  const [creditFilter, setCreditFilter] = useState<'ALL' | 'SAFE' | 'NEAR_LIMIT' | 'EXCEEDED' | 'NO_LIMIT'>('ALL');
  const [editingLimitMap, setEditingLimitMap] = useState<Record<string, string>>({});
  const [savingLimitId, setSavingLimitId] = useState<string | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemMasterConfig | null>(initialSystemConfig || null);

  const canEdit = canUserEditCreditLimit(userEmail, role, systemConfig);

  const loadCustomersAndLimits = async () => {
    try {
      setLoadingCustomers(true);
      const [custRes, invRes, retRes, vchRes, limitsRes, sysCfg] = await Promise.all([
        fetchAllPages(supabase.from('customers').select('*').order('customerName', { ascending: true })),
        fetchAllPages(supabase.from('sales_invoices').select('customer_name, total_amount, cash_amount_paid, bank_amount')),
        fetchAllPages(supabase.from('sales_returns').select('customer_name, total_amount')),
        fetchAllPages(supabase.from('financial_vouchers').select('customer_name, total_amount')),
        fetchCustomerCreditLimits(),
        fetchSystemMasterConfig(),
      ]);

      const invoiceMap: Record<string, number> = {};
      (invRes.data || []).forEach((inv: any) => {
        const cName = (inv.customer_name || '').trim().toLowerCase();
        const gross = Number(inv.total_amount || 0);
        const paid = Number(inv.cash_amount_paid || 0) + Number(inv.bank_amount || 0);
        const due = Math.max(0, gross - paid);
        invoiceMap[cName] = (invoiceMap[cName] || 0) + due;
      });

      const returnMap: Record<string, number> = {};
      (retRes.data || []).forEach((r: any) => {
        const cName = (r.customer_name || '').trim().toLowerCase();
        returnMap[cName] = (returnMap[cName] || 0) + (Number(r.total_amount) || 0);
      });

      const voucherMap: Record<string, number> = {};
      (vchRes.data || []).forEach((v: any) => {
        const cName = (v.customer_name || '').trim().toLowerCase();
        voucherMap[cName] = (voucherMap[cName] || 0) + (Number(v.total_amount) || 0);
      });

      const customersWithLiveBalances = (custRes.data || []).map((c: any) => {
        const cName = (c.customerName || c.customername || '').trim().toLowerCase();
        const initialBal = Number(c.balance || 0);
        const invoiceDue = invoiceMap[cName] || 0;
        const returns = returnMap[cName] || 0;
        const payments = voucherMap[cName] || 0;

        const liveBalance = Math.max(0, Math.round((initialBal + invoiceDue - returns - payments) * 100) / 100);
        return {
          ...c,
          calculatedBalance: liveBalance,
        };
      });

      setCustomers(customersWithLiveBalances);
      setCreditLimits(limitsRes);
      if (sysCfg) setSystemConfig(sysCfg);
    } catch (err: any) {
      console.error('Failed to load customers or credit limits:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    loadCustomersAndLimits();
  }, []);

  const handleSaveCustomerLimit = async (customerId: string | number) => {
    const stringId = String(customerId);
    const entered = editingLimitMap[stringId] ?? creditLimits[stringId] ?? 0;
    const numLimit = Math.max(0, Number(entered) || 0);

    try {
      setSavingLimitId(stringId);
      const res = await saveCustomerCreditLimit(stringId, numLimit);
      if (res.success) {
        setCreditLimits(prev => ({ ...prev, [stringId]: numLimit }));
        triggerFeedbackSound('success', userEmail);
        toast.success('Customer credit limit updated successfully!');
      } else {
        toast.error('Failed to update limit: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      toast.error('Error saving limit: ' + err.message);
    } finally {
      setSavingLimitId(null);
    }
  };

  // Filtered customer list
  const filteredCustomers = customers.filter(c => {
    const name = (c.customerName || c.customername || '').toLowerCase();
    const phone = (c.primaryPhone || c.phone || '').toLowerCase();
    const code = (c.customer_code || c.customerCode || '').toLowerCase();
    const q = creditSearch.toLowerCase().trim();

    const matchesSearch = !q || name.includes(q) || phone.includes(q) || code.includes(q);
    if (!matchesSearch) return false;

    const limit = Number(creditLimits[String(c.id)] || 0);
    const balance = Number(c.calculatedBalance !== undefined ? c.calculatedBalance : (c.balance || 0));
    const statusInfo = getCustomerCreditStatus(balance, limit);

    if (creditFilter === 'SAFE') return statusInfo.status === 'SAFE';
    if (creditFilter === 'NEAR_LIMIT') return statusInfo.status === 'NEAR_LIMIT';
    if (creditFilter === 'EXCEEDED') return statusInfo.status === 'EXCEEDED';
    if (creditFilter === 'NO_LIMIT') return statusInfo.status === 'NO_LIMIT';

    return true;
  });

  // Summary metrics
  let totalExceeded = 0;
  let totalNear = 0;
  let totalSafe = 0;
  customers.forEach(c => {
    const limit = Number(creditLimits[String(c.id)] || 0);
    const balance = Number(c.calculatedBalance !== undefined ? c.calculatedBalance : (c.balance || 0));
    const info = getCustomerCreditStatus(balance, limit);
    if (info.status === 'EXCEEDED') totalExceeded++;
    else if (info.status === 'NEAR_LIMIT') totalNear++;
    else if (info.status === 'SAFE') totalSafe++;
  });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
              <LuCreditCard />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {isRTL ? "کسٹمر کریڈٹ لمٹس ڈائریکٹری" : "Customer Credit Limits Directory"}
                </h2>
                {canEdit ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Edit Authorized
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <LuLock className="text-xs" /> View Only
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {canEdit
                  ? 'You have permission to edit and set customer credit limit ceilings.'
                  : (isRTL ? "کسٹمر کے ادھار کی حد اور رسک اسٹیٹس دیکھیں۔ ترمیم کے اختیارات /dev/master میں ہیں۔" : "View customer credit boundaries and risk status. Edit rights are managed in /dev/master.")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadCustomersAndLimits}
            disabled={loadingCustomers}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <LuRefreshCw className={loadingCustomers ? 'animate-spin' : ''} />
            <span>{isRTL ? "حدود ریفریش کریں" : "Refresh Limits"}</span>
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Customers</span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5 block">{customers.length}</span>
          </div>

          <div className="bg-red-50/70 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-200 dark:border-red-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block">Limit Exceeded</span>
            <span className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5 block">{totalExceeded}</span>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Near Limit (75%+)</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{totalNear}</span>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Safe Limits</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{totalSafe}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={creditSearch}
            onChange={e => setCreditSearch(e.target.value)}
            placeholder={isRTL ? "کسٹمر کا نام، فون یا کوڈ تلاش کریں..." : "Search by customer name, phone, or code..."}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:border-primary focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'EXCEEDED', 'NEAR_LIMIT', 'SAFE', 'NO_LIMIT'] as const).map(tab => {
            const labels = {
              ALL: 'All Customers',
              EXCEEDED: 'Exceeded',
              NEAR_LIMIT: 'Near Limit',
              SAFE: 'Safe',
              NO_LIMIT: 'No Limit',
            };
            const isActive = creditFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCreditFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer Credit Limits Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4 text-right">Current Balance</th>
                <th className="py-3.5 px-4">Status & Usage</th>
                <th className="py-3.5 px-4 text-right">Credit Limit (Rs.)</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <LuUsers className="mx-auto text-3xl mb-2 opacity-50" />
                    <p className="font-semibold">No matching customers found</p>
                    <p className="text-[11px] mt-0.5">Try adjusting your search or filter</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => {
                  const stringId = String(cust.id);
                  const currentLimit = Number(creditLimits[stringId] || 0);
                  const balance = Number(cust.calculatedBalance !== undefined ? cust.calculatedBalance : (cust.balance || 0));
                  const statusInfo = getCustomerCreditStatus(balance, currentLimit);
                  const isEditing = editingLimitMap[stringId] !== undefined;
                  const inputValue = isEditing ? editingLimitMap[stringId] : String(currentLimit || '');

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {cust.customerName || cust.customername || 'Unnamed Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Code: {cust.customer_code || cust.customerCode || '—'}</span>
                          <span>•</span>
                          <span>{cust.primaryPhone || cust.phone || 'No Phone'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-mono font-bold ${balance > 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                          Rs. {balance.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 max-w-[160px]">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>
                          {currentLimit > 0 && (
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  statusInfo.percentage > 100
                                    ? 'bg-red-500'
                                    : statusInfo.percentage >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, statusInfo.percentage)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {canEdit ? (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <span className="text-[11px] text-slate-400 font-mono">Rs.</span>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={inputValue}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === '' || Number(val) >= 0) {
                                  setEditingLimitMap(prev => ({
                                    ...prev,
                                    [stringId]: val,
                                  }));
                                }
                              }}
                              placeholder="No limit (0)"
                              className="w-28 text-right px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-primary focus:outline-hidden"
                            />
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {currentLimit > 0 ? `Rs. ${currentLimit.toLocaleString()}` : 'No Limit'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {canEdit ? (
                          <button
                            type="button"
                            disabled={savingLimitId === stringId}
                            onClick={() => handleSaveCustomerLimit(cust.id)}
                            className="px-3 py-1 text-xs font-bold rounded-lg bg-primary hover:opacity-90 text-white transition flex items-center gap-1 mx-auto shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {savingLimitId === stringId ? (
                              <LuRefreshCw className="animate-spin text-xs" />
                            ) : (
                              <LuSave className="text-xs" />
                            )}
                            <span>Save</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                            <LuLock className="text-xs" /> Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
