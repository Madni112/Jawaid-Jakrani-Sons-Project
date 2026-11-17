import React from 'react';
import { LuCoins } from 'react-icons/lu';
import { PosShift } from '../../../../service/posService';

interface PettyCashTabProps {
  filteredShifts: PosShift[];
}

export const PettyCashTab: React.FC<PettyCashTabProps> = ({ filteredShifts }) => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 shadow-sm space-y-2">
        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <LuCoins className="text-amber-500" />
          <span>Petty Cash Accounting & Carry Forward Flow</span>
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Formula: <strong className="text-slate-800 dark:text-slate-200">The Sale - Cash Out + Cash In + Opening Petty Cash = Remaining Petty Cash</strong>. This remaining cash is automatically saved and auto-fills tomorrow morning's Day Open.
        </p>
      </div>

      {/* Petty Cash Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Session #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Opening Petty Cash</th>
                <th className="py-3 px-4">Daily Cash Sales</th>
                <th className="py-3 px-4">Cash Out (Drop)</th>
                <th className="py-3 px-4">Cash In</th>
                <th className="py-3 px-4">Closing Petty Cash (Carried Over)</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No shift movements found for this period.
                  </td>
                </tr>
              ) : (
                filteredShifts.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold font-mono">#{s.session_number}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {s.business_date || new Date(s.opened_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium">{s.cashier_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {(s.opening_petty_cash ?? s.opening_float).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Rs. {s.cash_sales.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-500 font-bold">
                      Rs. {(s.cash_out || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-500 font-bold">
                      Rs. {(s.cash_in || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-amber-600 dark:text-amber-400">
                      {s.closing_petty_cash !== undefined ? `Rs. ${s.closing_petty_cash.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'Closed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
