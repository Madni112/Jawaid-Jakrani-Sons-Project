import React from 'react';
import { FiX } from 'react-icons/fi';
import { resolvePcsPerBox, formatItemBoxQty } from '../utils/deliveryChallanHelpers';
import { GroupedInvoiceData } from '../types/deliveryChallanTypes';

interface ViewHoldSummaryModalProps {
  data: GroupedInvoiceData;
  productsMaster: any[];
  onClose: () => void;
}

export const ViewHoldSummaryModal: React.FC<ViewHoldSummaryModalProps> = ({
  data,
  productsMaster,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-modal-backdrop" onClick={onClose} />
      <div 
        className="relative bg-white dark:bg-boxdark rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col max-h-[90vh] z-10 border border-stroke dark:border-strokedark"
        style={{ transformOrigin: 'center center' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wide">
              Dispatch Summary - {data.invoice_no}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Complete breakdown of ordered, dispatched, and remaining quantities
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 cursor-pointer"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Aggregated Totals */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total Ordered</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200">
                {data.totalOrderBoxes}{data.totalOrderPcs > 0 ? ` + ${data.totalOrderPcs} Pcs` : ''}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase font-bold tracking-wider mb-1">Total Dispatched</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                {data.totalDispatchedBoxes}{data.totalDispatchedPcs > 0 ? ` + ${data.totalDispatchedPcs} Pcs` : ''}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-[10px] text-amber-600 dark:text-amber-500 uppercase font-bold tracking-wider mb-1">Remaining Hold</p>
              <p className="text-lg font-black text-amber-700 dark:text-amber-400">
                {data.totalHoldBoxes}{data.totalHoldPcs > 0 ? ` + ${data.totalHoldPcs} Pcs` : ''}
              </p>
            </div>
          </div>

          {/* Delivery Challans Breakdown */}
          <h4 className="text-xs font-bold text-black dark:text-white mb-3 uppercase tracking-wider">Delivery Challans Breakdown</h4>
          <div className="space-y-4">
            {data.challans.map((c: any, idx: number) => {
              const dcCode = c.challan_no || `DC-${String(c.id).padStart(4, '0')}`;
              const isPending = c.status === 'Pending Approval';
              return (
                <div key={idx} className="border border-stroke dark:border-strokedark rounded-lg p-4 bg-white dark:bg-boxdark">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-bold text-primary dark:text-primary">{dcCode}</span>
                      {c.gate_pass_no && c.gate_pass_no !== dcCode && (
                        <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-emerald-600">
                          GP: {c.gate_pass_no}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isPending ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(c.items || []).map((i: any, iIdx: number) => {
                      const disp = Number(i.dispatchedQty ?? 0);
                      const ord = Number(i.orderQty ?? i.qty ?? 0);

                      const prodName = String(i.pDescription || i.itemName || '').trim().toLowerCase();
                      const prod = productsMaster.find(p => String(p?.product_name || '').trim().toLowerCase() === prodName);
                      const pcsPerBox = resolvePcsPerBox(prod, ord || disp);

                      if (!isPending && disp === 0) return null; // Skip if it was fully on hold in an approved DC

                      return (
                        <div key={iIdx} className="flex justify-between text-xs items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                          <span className="font-medium text-slate-700 dark:text-slate-300">• {i.pDescription}</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800">
                            {formatItemBoxQty(isPending ? ord : disp, pcsPerBox)} Sent
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stroke dark:border-strokedark bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-sm transition-colors cursor-pointer"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};
