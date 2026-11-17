import React from 'react';
import { FiCheckCircle, FiX } from 'react-icons/fi';
import { InvoiceGroup, ProductMasterItem } from '../types/shopDispatchTypes';
import { fmtBoxPcs } from '../utils/shopDispatchHelpers';

interface RemainingHoldModalProps {
  group: InvoiceGroup;
  productsMaster: ProductMasterItem[];
  onClose: () => void;
}

export const RemainingHoldModal: React.FC<RemainingHoldModalProps> = ({
  group,
  productsMaster,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-modal-backdrop" onClick={onClose} />
      <div 
        className="relative bg-white dark:bg-boxdark w-full max-w-xl rounded-2xl shadow-2xl border border-stroke dark:border-strokedark overflow-hidden animate-modal-pop z-10 max-h-[85vh] flex flex-col"
        style={{ transformOrigin: 'center center' }}
      >
        <div className="flex justify-between items-center bg-slate-900 text-white p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg font-bold">
              <FiCheckCircle />
            </div>
            <div>
              <h3 className="text-sm font-bold">Remaining Hold</h3>
              <p className="text-[11px] text-slate-400">
                {group.customer_name} • {group.dispatch_warehouse}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            <FiX />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          {group.challans.map((c) => {
            const heldItems = (c.items || [])
              .map((it) => {
                const orderQty = Number(it.orderQty ?? it.qty ?? 0);
                const dispatchedQty = Number(it.dispatchedQty ?? (c.status === 'Dispatched' ? orderQty : 0) ?? 0);
                const holdQty = Number(it.holdQty !== undefined ? it.holdQty : Math.max(0, orderQty - dispatchedQty));
                return {
                  name: it.itemName || it.product_name || it.item_name || 'Item',
                  orderQty,
                  dispatchedQty,
                  holdQty
                };
              })
              .filter((x) => x.holdQty > 0);

            if (heldItems.length === 0) return null;

            return (
              <div key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 dark:bg-meta-4/30 flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-primary">{c.challan_no || `DC-${c.id}`}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{c.status || ''}</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-strokedark">
                      <th className="py-1.5 px-3 text-left">Product</th>
                      <th className="py-1.5 px-3 text-center">Order</th>
                      <th className="py-1.5 px-3 text-center">Dispatched</th>
                      <th className="py-1.5 px-3 text-center text-amber-600 dark:text-amber-400">Hold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heldItems.map((it, iIdx) => (
                      <tr key={iIdx} className="border-b border-slate-100 dark:border-strokedark/60">
                        <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-white">{it.name}</td>
                        <td className="py-1.5 px-3 text-center font-mono">{fmtBoxPcs(it.orderQty, it.name, productsMaster)}</td>
                        <td className="py-1.5 px-3 text-center font-mono">{fmtBoxPcs(it.dispatchedQty, it.name, productsMaster)}</td>
                        <td className="py-1.5 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                          {fmtBoxPcs(it.holdQty, it.name, productsMaster)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-meta-4/30 border-t border-stroke dark:border-strokedark flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-boxdark border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-meta-4 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
