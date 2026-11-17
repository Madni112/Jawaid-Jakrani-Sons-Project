import React, { useState } from 'react';
import { FiTruck, FiX } from 'react-icons/fi';

interface AllDeliveryChallansModalProps {
  dcListForModal: any[];
  onClose: () => void;
  openDcModal: (dc: any, defaultTab?: 'tracking' | 'payment') => void;
}

export const AllDeliveryChallansModal: React.FC<AllDeliveryChallansModalProps> = ({
  dcListForModal,
  onClose,
  openDcModal,
}) => {
  const [dcListWarehouse, setDcListWarehouse] = useState<string>('');

  const warehouses = Array.from(
    new Set(dcListForModal.map((dc: any) => String(dc.dispatch_warehouse || 'Global / Unassigned').trim()))
  ).filter(Boolean);

  const activeLoc = dcListWarehouse && warehouses.includes(dcListWarehouse) ? dcListWarehouse : warehouses[0];
  const visibleDCs = dcListForModal.filter(
    (dc: any) => String(dc.dispatch_warehouse || 'Global / Unassigned').trim() === activeLoc
  );

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-boxdark w-full max-w-lg rounded-2xl shadow-2xl border border-stroke dark:border-strokedark overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center bg-slate-900 text-white p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-lg font-bold">
              <FiTruck />
            </div>
            <div>
              <h3 className="text-sm font-bold">Delivery Challans</h3>
              <p className="text-[11px] text-slate-400">{dcListForModal.length} linked to this invoice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Location switch (hidden when everything is in one warehouse) */}
        {warehouses.length > 1 && (
          <div className="px-4 pt-3 pb-1 border-b border-slate-100 dark:border-strokedark">
            <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl font-bold text-xs w-fit">
              {warehouses.map((wh) => {
                const count = dcListForModal.filter(
                  (dc: any) => String(dc.dispatch_warehouse || 'Global / Unassigned').trim() === wh
                ).length;
                return (
                  <button
                    key={wh}
                    type="button"
                    onClick={() => setDcListWarehouse(wh)}
                    className={`py-2 px-3.5 rounded-lg transition cursor-pointer ${
                      activeLoc === wh
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {wh} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
          {visibleDCs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">No DCs in this location.</div>
          ) : (
            visibleDCs.map((dc: any) => {
              const isPend = dc.status === 'Pending Approval';
              const isPart = dc.status === 'Partially Dispatched';
              const isDisp = dc.status === 'Dispatched' || dc.status === 'Fully Dispatched';
              const hasFreightPending = Number(dc.freight_charges || 0) > 0 && dc.freight_payment_status !== 'Approved';
              return (
                <button
                  key={dc.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    openDcModal(dc, hasFreightPending ? 'payment' : 'tracking');
                  }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:shadow-sm transition px-3.5 py-2.5 text-left cursor-pointer w-full"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-primary font-black font-mono text-xs truncate">
                      {dc.challan_no || `DC-${dc.id}`}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {dc.dispatch_warehouse || 'N/A'} • {dc.challan_date || 'N/A'} • Qty:{' '}
                      {Number(dc.total_quantity || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPend && (
                      <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                        Pending
                      </span>
                    )}
                    {isPart && (
                      <span className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                        Partial
                      </span>
                    )}
                    {isDisp && (
                      <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                        Dispatched
                      </span>
                    )}
                    {hasFreightPending && (
                      <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                        Pay Req
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
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
