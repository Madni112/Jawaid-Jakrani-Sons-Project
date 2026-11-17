import React from 'react';
import { Eye } from 'lucide-react';
import { TableEmpty } from '../../../Masters/masterUi';
import { Balance } from '../utils/leaveUtils';

interface LeaveBalancesTabProps {
  loading: boolean;
  balances: Balance[];
  activeFilters: string[];
  onClearFilters: () => void;
  onViewBalance: (b: Balance) => void;
}

export const LeaveBalancesTab: React.FC<LeaveBalancesTabProps> = ({
  loading,
  balances,
  activeFilters,
  onClearFilters,
  onViewBalance
}) => {
  return (
    <table className="w-full table-auto text-left text-sm text-black dark:text-white">
      <thead className="sticky top-0 z-10 bg-gray-2 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
        <tr>
          <th className="py-3 px-4 font-semibold text-black dark:text-white">Employee #</th>
          <th className="py-3 px-4 font-semibold text-black dark:text-white">Name</th>
          <th className="py-3 px-4 font-semibold text-black dark:text-white">Designation</th>
          <th className="py-3 px-4 font-semibold text-center text-black dark:text-white">
            Annual Entitled
          </th>
          <th className="py-3 px-4 font-semibold text-center text-black dark:text-white">
            Leaves Used
          </th>
          <th className="py-3 px-4 font-semibold text-center text-black dark:text-white">
            Available Balance
          </th>
          <th className="py-3 px-4 font-semibold text-right text-black dark:text-white">Action</th>
        </tr>
      </thead>
      <tbody>
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="border-b border-stroke dark:border-strokedark">
              <td colSpan={7} className="p-4">
                <div
                  className="h-4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse"
                  style={{ width: `${100 - i * 8}%` }}
                />
              </td>
            </tr>
          ))}
        {!loading && !balances.length && (
          <TableEmpty
            colSpan={7}
            noun="staff balances"
            filters={activeFilters}
            cleared={onClearFilters}
          />
        )}
        {!loading &&
          balances.map((b) => {
            const allowed = b.rows.reduce((s, r) => s + r.allowed, 0);
            const taken = b.rows.reduce((s, r) => s + r.taken, 0);
            const available = Math.max(0, allowed - taken);

            return (
              <tr
                key={b.employeeId}
                className="border-b border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4/20 transition-colors"
              >
                <td className="py-3.5 px-4 font-medium">
                  {b.code ? (
                    <span className="font-mono font-bold text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded">
                      {b.code}
                    </span>
                  ) : (
                    <span className="text-gray-300 font-mono">-</span>
                  )}
                </td>
                <td className="py-3.5 px-4 font-semibold text-black dark:text-white">{b.name}</td>
                <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                  {b.designation || '-'}
                </td>

                {/* Annual Entitled */}
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-slate-100 dark:bg-slate-800 text-black dark:text-white">
                    {allowed} Days
                  </span>
                </td>

                {/* Leaves Used */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                      taken > 0
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'text-gray-400 font-normal'
                    }`}
                  >
                    {taken > 0 ? `${taken} Days` : '0 Days'}
                  </span>
                </td>

                {/* Available Balance */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black font-mono shadow-2xs ${
                      available <= 0
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200'
                        : available <= 3
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300'
                    }`}
                  >
                    {available} Days Left
                  </span>
                </td>

                {/* Action: View Breakdown */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => onViewBalance(b)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:text-white bg-primary/10 hover:bg-primary rounded-lg transition-all cursor-pointer shadow-2xs"
                    title="View category quotas & leave history"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Breakdown</span>
                  </button>
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
};

export default LeaveBalancesTab;
