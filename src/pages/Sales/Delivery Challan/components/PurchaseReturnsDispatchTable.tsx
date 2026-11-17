import React from 'react';
import Spinner from '../../../../ui/Spinner';
import { FiTruck, FiPlusCircle, FiPrinter } from 'react-icons/fi';

interface PurchaseReturnsDispatchTableProps {
  loading: boolean;
  paginatedPurchaseReturns: any[];
  onApproveItems: (ret: any) => void;
  onEditDispatch: (ret: any) => void;
  onDispatchRemaining: (ret: any) => void;
  onPrintGatePass: (ret: any) => void;
}

export const PurchaseReturnsDispatchTable: React.FC<PurchaseReturnsDispatchTableProps> = ({
  loading,
  paginatedPurchaseReturns,
  onApproveItems,
  onEditDispatch,
  onDispatchRemaining,
  onPrintGatePass
}) => {
  return (
    <div className="rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6 overflow-hidden">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="bg-slate-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider border-b border-stroke text-slate-700 dark:text-white">
              <th className="py-3.5 px-4 whitespace-nowrap">Debit Note / Return #</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Date</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Vendor / Supplier</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Items Summary</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Dispatch Warehouse</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Return Amount</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
              <th className="py-3.5 px-4 text-center w-28 whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12"><Spinner /></td></tr>
            ) : paginatedPurchaseReturns.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500 font-bold italic">
                  No purchase returns logged for outward dispatch.
                </td>
              </tr>
            ) : (
              paginatedPurchaseReturns.map((ret) => {
                const items = Array.isArray(ret.items) ? ret.items : [];
                const isPending = !ret.status || ret.status === 'Pending' || ret.status === 'Pending Approval' || ret.status === 'Pending Outward';
                const isPartial = ret.status === 'Partially Dispatched' || ret.status === 'Partial';
                const hasHold = items.some((i: any) => Number(i.holdQty || 0) > 0);
                const canSendRest = isPartial && hasHold;

                return (
                  <tr key={ret.id} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150 font-semibold text-xs text-black dark:text-white">
                    <td className="py-3 px-4 font-bold font-mono whitespace-nowrap">
                      <span className="text-primary">{ret.return_no || `PR-${ret.id}`}</span>
                      {ret.purchase_no && (
                        <div className="text-[10px] text-gray-400 font-normal">Pur #{ret.purchase_no}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {ret.return_date || String(ret.created_at || '').substring(0, 10)}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold whitespace-nowrap">
                      {ret.vendor_name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 max-w-[260px]">
                        {items.map((it: any, idx: number) => {
                          const ord = Number(it.orderQty ?? it.qty ?? 0);
                          const hld = Number(it.holdQty ?? 0);

                          return (
                            <div key={idx} className="text-[10px] text-slate-700 dark:text-slate-200">
                              <span className="font-bold">{it.itemName || it.product_name}</span>
                              <span className="ml-1 text-primary font-mono font-bold">
                                ({ord} {it.uom || 'Nos'})
                              </span>
                              {hld > 0 && (
                                <span className="ml-1 text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-mono font-bold">
                                  Hold: {hld}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex rounded-md py-0.5 px-2 text-[10px] font-black uppercase tracking-wide bg-slate-100 dark:bg-meta-4 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600">
                        {ret.source_warehouse || ret.warehouse_name || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap text-rose-600 dark:text-rose-400">
                      Rs. {Number(ret.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex rounded-md py-0.5 px-2.5 text-[9px] font-black uppercase tracking-wide ${
                        ret.status === 'Refunded' || ret.status === 'Dispatched' || ret.status === 'Fully Dispatched'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isPartial
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {ret.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => onApproveItems(ret)}
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded text-[11px] font-bold text-white shadow-xs transition duration-150 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                          >
                            <FiTruck size={12} /> Approve Items
                          </button>
                        )}

                        {!isPending && (
                          <button
                            type="button"
                            onClick={() => onEditDispatch(ret)}
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded text-[11px] font-bold text-white shadow-xs transition duration-150 cursor-pointer bg-slate-700 hover:bg-slate-800"
                          >
                            <FiTruck size={12} /> Edit Dispatch
                          </button>
                        )}

                        {canSendRest && (
                          <button
                            type="button"
                            onClick={() => onDispatchRemaining(ret)}
                            title="Create new gate pass for remaining hold items"
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition duration-150 cursor-pointer"
                          >
                            <FiPlusCircle size={12} /> Dispatch Remaining
                          </button>
                        )}

                        {!isPending && (
                          <button
                            type="button"
                            onClick={() => onPrintGatePass(ret)}
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition shadow-xs cursor-pointer"
                          >
                            <FiPrinter size={12} /> Gate Pass
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
