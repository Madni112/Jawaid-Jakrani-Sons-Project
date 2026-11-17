import React from 'react';
import { LuRotateCcw, LuPrinter } from 'react-icons/lu';
import { PosOrder } from '../../../../service/posService';

interface POSOrdersTableProps {
  orders: PosOrder[];
  isReturnsOnly?: boolean;
  onSelectOrder: (order: PosOrder) => void;
  onRefundOrder: (order: PosOrder) => void;
}

export const POSOrdersTable: React.FC<POSOrdersTableProps> = ({
  orders,
  isReturnsOnly,
  onSelectOrder,
  onRefundOrder
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Ticket #</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Cashier</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Payment Tender</th>
              <th className="py-3 px-4">Grand Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <LuRotateCcw size={32} className="text-slate-300 dark:text-slate-600" />
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                      {isReturnsOnly ? 'No returns or refunds recorded yet' : 'No transactions match the selected filters.'}
                    </span>
                    <span className="text-xs text-slate-400 max-w-sm">
                      {isReturnsOnly
                        ? 'When a refund is processed from the Transactions page, the refunded ticket will appear here in this return ledger.'
                        : 'Try adjusting your search query, date filter, or payment tender.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    {o.order_number}
                  </td>
                  <td className="py-3 px-4 text-[11px]">
                    {o.refunded_at ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            Refunded
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {new Date(o.refunded_at).toLocaleDateString()}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(o.refunded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                          <span className="font-semibold uppercase tracking-wider text-[9px]">Sold:</span>
                          <span>{new Date(o.created_at).toLocaleDateString()}</span>
                          <span className="font-mono">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400">
                        <div>{new Date(o.created_at).toLocaleDateString()}</div>
                        <div className="font-mono">
                          {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 capitalize">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] shrink-0 font-bold">
                        {o.cashier_name ? o.cashier_name.charAt(0).toUpperCase() : 'C'}
                      </span>
                      <span className="truncate max-w-[120px]">{o.cashier_name || 'Cashier'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pl-6.5">
                      {o.terminal_code ? o.terminal_code.replace(/\s*\(.*?\)/g, '') : 'Register 01'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {o.customer_name}
                    </div>
                    {o.notes && (
                      <div className="text-[10px] text-rose-500 dark:text-rose-400 font-medium mt-0.5 max-w-xs truncate" title={o.notes}>
                        {o.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {o.items.length} items
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {o.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-extrabold text-slate-900 dark:text-white">
                    Rs. {o.total_amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      o.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectOrder(o)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                        title="Reprint Thermal Receipt"
                      >
                        <LuPrinter size={14} />
                      </button>

                      {!isReturnsOnly && (
                        <button
                          type="button"
                          disabled={o.status === 'Refunded'}
                          onClick={() => onRefundOrder(o)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition cursor-pointer disabled:opacity-30"
                          title="Process Return & Refund"
                        >
                          <LuRotateCcw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
