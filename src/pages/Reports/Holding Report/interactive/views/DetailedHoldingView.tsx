import React from 'react';
import { QtyBadge } from '../../../../../utils/QtyBadge';
import type { HoldingItemRow } from '../types/holdingTypes';

interface DetailedHoldingViewProps {
  paginatedRows: HoldingItemRow[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const DetailedHoldingView: React.FC<DetailedHoldingViewProps> = ({
  paginatedRows,
  currentPage,
  pageSize,
  totalPages,
  onPageChange
}) => {
  return (
    <>
      <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full table-auto border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 text-left text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3.5 text-center w-12">S#</th>
              <th className="py-3 px-3.5">Gatepass / DC</th>
              <th className="py-3 px-3.5">Invoice #</th>
              <th className="py-3 px-3.5">Date</th>
              <th className="py-3 px-3.5">Customer Name</th>
              <th className="py-3 px-3.5">Salesman</th>
              <th className="py-3 px-3.5">Product Description</th>
              <th className="py-3 px-3.5">Warehouse</th>
              <th className="py-3 px-3.5 text-center">Order Qty</th>
              <th className="py-3 px-3.5 text-center">Dispatched</th>
              <th className="py-3 px-3.5 text-center bg-amber-50/70 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                Held Qty
              </th>
              <th className="py-3 px-3.5 text-right">Rate</th>
              <th className="py-3 px-3.5 text-right font-black bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                Held Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => {
                const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5 text-center text-slate-400 font-mono">{globalIdx}</td>
                    <td className="py-3 px-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {row.gatepassNo}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {row.invoiceNo}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px]">{row.date}</td>
                    <td
                      className="py-3 px-3.5 font-bold text-slate-900 dark:text-white max-w-[150px] truncate"
                      title={row.customerName}
                    >
                      {row.customerName}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">{row.salesman}</td>
                    <td
                      className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-100 max-w-[180px] truncate"
                      title={row.productName}
                    >
                      {row.productName}
                      {row.skuCode && <div className="text-[10px] font-mono text-slate-400">{row.skuCode}</div>}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500">{row.warehouse}</td>
                    <td className="py-3 px-3.5 text-center font-mono font-semibold">
                      <QtyBadge qty={row.orderQty} uom={row.uom} />
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                      <QtyBadge qty={row.dispatchedQty} uom={row.uom} />
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-black bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                      <QtyBadge qty={row.holdQty} uom={row.uom} />
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-500">
                      Rs. {Number(row.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                      Rs. {Number(row.heldAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-400 italic">
                  No holding records match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400">
            Page <strong className="text-slate-800 dark:text-slate-100">{currentPage}</strong> of{' '}
            <strong>{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1.5 font-bold">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};
