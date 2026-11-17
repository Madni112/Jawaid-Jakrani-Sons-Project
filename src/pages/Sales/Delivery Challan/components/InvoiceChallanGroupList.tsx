import React from 'react';
import Spinner from '../../../../ui/Spinner';
import { FiTruck, FiPlusCircle, FiPrinter, FiClock, FiCheckCircle } from 'react-icons/fi';
import { GroupedInvoiceData } from '../types/deliveryChallanTypes';
import { resolvePcsPerBox, formatItemBoxQty } from '../utils/deliveryChallanHelpers';

interface InvoiceChallanGroupListProps {
  loading: boolean;
  paginatedInvoices: GroupedInvoiceData[];
  startIndex: number;
  productsMaster: any[];
  onOpenApprovalModal: (challan: any) => void;
  onCreateSubsequentHoldChallan: (challan: any) => void;
  onPrintClick: (challan: any) => void;
  onOpenHoldDetails: (group: GroupedInvoiceData) => void;
}

export const InvoiceChallanGroupList: React.FC<InvoiceChallanGroupListProps> = ({
  loading,
  paginatedInvoices,
  startIndex,
  productsMaster,
  onOpenApprovalModal,
  onCreateSubsequentHoldChallan,
  onPrintClick,
  onOpenHoldDetails
}) => {
  if (loading) {
    return (
      <div className="py-12 text-center bg-white dark:bg-boxdark rounded-xl border border-stroke">
        <Spinner />
      </div>
    );
  }

  if (paginatedInvoices.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-boxdark rounded-xl border border-stroke">
        No matching transit record entries found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paginatedInvoices.map((group, groupIdx) => {
        return (
          <div key={groupIdx} className="border border-stroke dark:border-strokedark rounded-xl overflow-hidden shadow-xs bg-white dark:bg-boxdark">
            {/* ── PARENT HEADER ENTRY: INVOICE & CUSTOMER METADATA ── */}
            <div className="bg-slate-50 dark:bg-meta-4/30 p-4 border-b border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {startIndex + groupIdx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-rose-600 dark:text-rose-400">
                      {group.invoice_no}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm font-bold text-black dark:text-white">
                      {group.customer_name}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Dispatch Source: <span className="font-semibold text-slate-700 dark:text-slate-300">{group.dispatch_warehouse}</span>
                  </p>
                </div>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                  Total Order: {group.totalOrderBoxes}{group.totalOrderPcs > 0 ? ` + ${group.totalOrderPcs} Pcs` : ''}
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 font-mono text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  Dispatched: {group.totalDispatchedBoxes}{group.totalDispatchedPcs > 0 ? ` + ${group.totalDispatchedPcs} Pcs` : ''}
                </span>
                {group.totalHold > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenHoldDetails(group)}
                    className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/40 font-mono text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition shadow-sm cursor-pointer"
                  >
                    Remaining Hold: {group.totalHoldBoxes}{group.totalHoldPcs > 0 ? ` + ${group.totalHoldPcs} Pcs` : ''}
                  </button>
                )}
              </div>
            </div>

            {/* ── SUB-ENTRIES: ALL DELIVERY CHALLANS LINKED TO THIS INVOICE ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/70 dark:bg-meta-4/10 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-stroke dark:border-strokedark">
                    <th className="py-2.5 px-4 w-32">Challan / Gate Pass #</th>
                    <th className="py-2.5 px-4">Vehicle / Driver Details</th>
                    <th className="py-2.5 px-4">Items / Breakdown</th>
                    <th className="py-2.5 px-4 text-center w-28">Status</th>
                    <th className="py-2.5 px-4 text-right pr-6 w-56">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {group.challans.map((c: any) => {
                    const challanCode = c.challan_no || `DC-${String(c.id).padStart(4, '0')}`;
                    let totalHoldBoxes = 0;
                    let totalHoldPcs = 0;
                    (c.items || []).forEach((item: any) => {
                      const h = Number(item.holdQty) || 0;
                      const pName = String(item.pDescription || item.itemName || '').trim().toLowerCase();
                      const pr = productsMaster.find(p => String(p?.product_name || '').trim().toLowerCase() === pName);
                      const pBox = resolvePcsPerBox(pr, h);
                      if (pBox > 1) {
                        totalHoldBoxes += Math.floor(Math.round(h * pBox) / pBox);
                        totalHoldPcs += Math.round(h * pBox) % pBox;
                      } else {
                        totalHoldBoxes += Math.round(h);
                      }
                    });
                    const holdDisplay = totalHoldPcs > 0 ? `${totalHoldBoxes} + ${totalHoldPcs} Pcs` : `${totalHoldBoxes}`;

                    const isPending = !c.status || c.status === 'Pending' || c.status === 'Pending Approval' || c.status === 'Pending Dispatch';
                    const hasRemainingHold = (totalHoldBoxes > 0 || totalHoldPcs > 0);
                    const isPartial = hasRemainingHold && (c.status === 'Partially Dispatched' || String(c.status || '').toLowerCase().includes('partial') || !isPending);

                    const canSendRest = (totalHoldBoxes > 0 || totalHoldPcs > 0) && (!isPending || c.is_printed);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-primary dark:text-primary text-xs">{challanCode}</p>
                            {String(c.remarks || '').includes('[AUTOMATIC]') ? (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                ⚡ Auto
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                📋 Manual GP
                              </span>
                            )}
                          </div>
                          {c.gate_pass_no && c.gate_pass_no !== challanCode && (
                            <p className="text-[10px] text-emerald-600 font-bold mb-0.5">GP: {c.gate_pass_no}</p>
                          )}
                          <p className="text-[10px] text-gray-500">
                            {c.challan_date || (c.created_at ? new Date(c.created_at).toLocaleDateString() : '-')}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-black dark:text-white">{c.vehicle_no || 'Pending Dispatch'}</p>
                          <p className="text-[10px] text-gray-500">
                            {c.driver_name ? `Driver: ${c.driver_name}` : (c.transportation || 'By Road Transport')}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {(c.items || []).map((i: any, itemIdx: number) => {
                              const ord = Number(i.orderQty ?? i.qty ?? 0);
                              const disp = Number(i.dispatchedQty ?? 0);
                              const hld = Number(i.holdQty ?? 0);

                              const prodName = String(i.pDescription || i.itemName || '').trim().toLowerCase();
                              const prod = productsMaster.find(p => String(p?.product_name || '').trim().toLowerCase() === prodName);
                              const pcsPerBox = resolvePcsPerBox(prod, ord || disp || hld);

                              return (
                                <div key={itemIdx} className="mb-2 last:mb-0 pb-2 last:pb-0 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug mb-1">
                                    • {i.pDescription}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 pl-3">
                                    {isPending ? (
                                      <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400">
                                        {formatItemBoxQty(ord, pcsPerBox)} Ordered (Pending)
                                      </span>
                                    ) : (
                                      <>
                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                                          {formatItemBoxQty(disp, pcsPerBox)} Sent
                                        </span>
                                        {hld > 0 && (
                                          <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400">
                                            {formatItemBoxQty(hld, pcsPerBox)} on Hold
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {c.is_printed ? (
                            <span className="inline-flex items-center gap-1 rounded-full py-0.5 px-2.5 text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-600 border border-green-300 dark:bg-green-950/60 dark:text-green-400 dark:border-green-700">
                              <FiPrinter /> Printed
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 rounded-full py-0.5 px-2.5 text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                              <FiClock /> Pending
                            </span>
                          ) : isPartial ? (
                            <span className="inline-flex items-center gap-1 rounded-full py-0.5 px-2.5 text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                              <FiClock /> Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full py-0.5 px-2.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                              <FiCheckCircle /> Dispatched
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            {/* APPROVE BUTTON (When Pending) */}
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => onOpenApprovalModal(c)}
                                className="inline-flex items-center gap-1 py-1 px-2.5 rounded text-[11px] font-bold text-white shadow-xs transition duration-150 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                              >
                                <FiTruck size={12} /> Approve Items
                              </button>
                            )}

                            {/* EDIT DISPATCH BUTTON (Only shown before printing; disappears once printed) */}
                            {!isPending && !c.is_printed && (
                              <button
                                type="button"
                                onClick={() => onOpenApprovalModal(c)}
                                className="inline-flex items-center gap-1 py-1 px-2.5 rounded text-[11px] font-bold text-white shadow-xs transition duration-150 cursor-pointer bg-slate-700 hover:bg-slate-800"
                              >
                                <FiTruck size={12} /> Edit Dispatch
                              </button>
                            )}

                            {/* SEND REST BUTTON (Only shown when partially dispatched with remaining hold items) */}
                            {canSendRest && (
                              <button
                                type="button"
                                onClick={() => onCreateSubsequentHoldChallan(c)}
                                title={`Create new DC for remaining ${holdDisplay} hold items`}
                                className="inline-flex items-center gap-1 py-1 px-2.5 rounded text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition duration-150 cursor-pointer"
                              >
                                <FiPlusCircle size={12} /> Dispatch Remaining
                              </button>
                            )}

                            {/* PRINT GATE PASS - Only available after approval/dispatch */}
                            {!isPending && (
                              <button
                                type="button"
                                onClick={() => onPrintClick(c)}
                                className="inline-flex items-center gap-1 py-1 px-2.5 rounded text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition shadow-xs cursor-pointer"
                                title="Print Official Gate Pass / Delivery Voucher"
                              >
                                🖨️ Print Gate Pass
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
