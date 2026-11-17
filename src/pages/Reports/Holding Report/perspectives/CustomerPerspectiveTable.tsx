import React from 'react';
import { QtyBadge } from '../../../../utils/QtyBadge';
import { CustomerDetails } from '../types/holdingReportTypes';
import CustomerBadge from '../components/CustomerBadge';

interface CustomerPerspectiveTableProps {
  displayRows: any[];
  paginatedRows: any[];
  kpis: {
    totalOrderQty: number;
    totalHeldQty: number;
    totalHeldValue: number;
  };
  customerLookupMap: Record<string, CustomerDetails>;
}

export const CustomerPerspectiveTable: React.FC<CustomerPerspectiveTableProps> = ({
  displayRows,
  paginatedRows,
  kpis,
  customerLookupMap,
}) => {
  return (
<div className="w-full overflow-x-auto">
            {paginatedRows.length === 0 ? (
              <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left">
                <tbody>
                  <tr>
                    <td colSpan={13} className="text-center py-8 font-bold italic border border-black text-gray-400">
                      No records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                    <th className="p-2 border border-black text-center w-10">S#</th>
                    <th className="p-2 border border-black">Gatepass / DC #</th>
                    <th className="p-2 border border-black">Invoice #</th>
                    <th className="p-2 border border-black text-center">Date</th>
                    <th className="p-2 border border-black">Salesman</th>
                    <th className="p-2 border border-black">Item Description</th>
                    <th className="p-2 border border-black text-center">Code</th>
                    <th className="p-2 border border-black">Warehouse</th>
                    <th className="p-2 border border-black text-center">Order Qty</th>
                    <th className="p-2 border border-black text-center">Dispatched</th>
                    <th className="p-2 border border-black text-center">Held Qty</th>
                    <th className="p-2 border border-black text-right">Rate</th>
                    <th className="p-2 border border-black text-right pr-2 bg-emerald-50">Held Value</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((c: any, cIdx: number) => {
                    let runningDocIdx = 0;
                    return (
                      <React.Fragment key={cIdx}>
                        {/* 🏢 Customer Section Header Banner */}
                        <tr className="bg-slate-800 text-white font-black text-xs">
                          <td colSpan={13} className="p-2.5 border border-black bg-slate-800 text-white">
                            <div className="flex justify-between items-center px-1">
                              <div className="flex items-center gap-3">
                                <span className="bg-teal-400 text-slate-950 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">
                                  Customer
                                </span>
                                <span className="text-sm font-bold tracking-wide">{c.customer}</span>
                                <CustomerBadge name={c.customer} customerLookupMap={customerLookupMap} light />
                              </div>
                              <div className="flex items-center gap-4 text-[11px] font-mono font-normal">
                                <span><b>{c.gatepasses || 0}</b> Gatepasses</span>
                                <span>•</span>
                                <span><b>{c.invoices || 0}</b> Invoices</span>
                                <span>•</span>
                                <span><b>{c.itemsCount}</b> Line Items</span>
                                <span>•</span>
                                <span className="text-amber-300 font-bold">Held Qty: {Number(c.totalHeldQty || 0).toLocaleString()} Pcs</span>
                                <span>•</span>
                                <span className="text-emerald-300 font-bold">Valuation: Rs. {Number(c.totalHeldValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* 📋 Consolidated Document Rows with multi-item sub-rows under this Customer */}
                        {(c.docs || []).map((doc: any, docIdx: number) => {
                          runningDocIdx++;
                          const items = doc.items || [];
                          return (
                            <tr key={doc.id || docIdx} className="border-b border-black font-mono text-xs hover:bg-slate-50 transition-colors">
                              {/* 🔢 S# */}
                              <td className="p-2 border border-black text-center font-bold text-gray-700 align-middle">
                                {runningDocIdx}
                              </td>

                              {/* 🚪 Gatepass / DC # */}
                              <td className="p-2 border border-black font-black font-mono text-slate-950 align-middle">
                                {doc.gatepassNo ? (
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-gray-300">
                                    {doc.gatepassNo}
                                  </span>
                                ) : '-'}
                              </td>

                              {/* 🧾 Invoice # */}
                              <td className="p-2 border border-black font-bold font-mono text-blue-900 align-middle">
                                {doc.invoiceNo || '-'}
                              </td>

                              {/* 📅 Date */}
                              <td className="p-2 border border-black text-center font-sans text-[10px] text-gray-600 align-middle">
                                {doc.date || '-'}
                              </td>

                              {/* 👔 Salesman */}
                              <td className="p-2 border border-black font-sans font-bold text-gray-900 align-middle">
                                {doc.salesman || '-'}
                              </td>

                              {/* 📦 Product Description Sub-Rows */}
                              <td className="p-0 border border-black align-top font-sans">
                                <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                                  {items.map((it: any, itIdx: number) => (
                                    <div key={itIdx} className="p-1.5 flex-1 flex items-center font-semibold text-gray-950 min-h-[34px]">
                                      {it.productName || '-'}
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* 🏷️ Code Sub-Rows */}
                              <td className="p-0 border border-black align-top">
                                <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                                  {items.map((it: any, itIdx: number) => (
                                    <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-center text-gray-700 font-mono text-[10px] min-h-[34px]">
                                      {it.skuCode || '-'}
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* 🏬 Warehouse Sub-Rows */}
                              <td className="p-0 border border-black align-top">
                                <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                                  {items.map((it: any, itIdx: number) => (
                                    <div key={itIdx} className="p-1.5 flex-1 flex items-center text-gray-700 font-sans text-[10px] min-h-[34px]">
                                      {it.warehouse || '-'}
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* 🔢 Order Qty Sub-Rows */}
                              <td className="p-0 border border-black align-top">
                                <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                                  {items.map((it: any, itIdx: number) => (
                                    <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-center min-h-[34px]">
                                      <QtyBadge qty={it.orderQty} />
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* 🚚 Dispatched Qty Sub-Rows */}
                              <td className="p-0 border border-black align-top">
                                <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                                  {items.map((it: any, itIdx: number) => (
                                    <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-center text-emerald-700 font-bold min-h-[34px]">
                                      <QtyBadge qty={it.dispatchedQty} />
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* 🛑 Held Qty Sub-Rows */}
                              <td className="p-0 border border-black align-top bg-amber-50/50">
                                <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                                  {items.map((it: any, itIdx: number) => (
                                    <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-center font-black text-amber-900 min-h-[34px]">
                                      <QtyBadge qty={it.holdQty} />
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* 💵 Rate Sub-Rows */}
                              <td className="p-0 border border-black align-top">
                                <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                                  {items.map((it: any, itIdx: number) => (
                                    <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-end font-mono min-h-[34px]">
                                      Rs. {Number(it.rate || 0).toLocaleString()}
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* 💰 Held Value Sub-Rows */}
                              <td className="p-0 border border-black align-top bg-emerald-50/40">
                                <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                                  {items.map((it: any, itIdx: number) => (
                                    <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-end font-mono font-bold text-emerald-900 pr-2 min-h-[34px]">
                                      Rs. {Number(it.heldAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {/* 🧮 Subtotal Row for this Customer */}
                        <tr className="bg-amber-100/70 border-b-2 border-black font-bold font-mono text-xs text-amber-950">
                          <td colSpan={8} className="p-2 border border-black text-right uppercase font-sans text-amber-900">
                            Subtotal for {c.customer} ({c.itemsCount} items):
                          </td>
                          <td className="p-2 border border-black text-center"><QtyBadge qty={c.totalOrderQty} /></td>
                          <td className="p-2 border border-black text-center text-emerald-700"><QtyBadge qty={c.totalDispatchedQty} /></td>
                          <td className="p-2 border border-black text-center bg-amber-200 text-amber-950"><QtyBadge qty={c.totalHeldQty} /></td>
                          <td className="p-2 border border-black text-right">-</td>
                          <td className="p-2 border border-black text-right pr-2 bg-emerald-100 text-emerald-900 font-bold">
                            Rs. {Number(c.totalHeldValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>

                {displayRows.length > 0 && (
                  <tfoot>
                    {/* 📊 Overall Grand Totals Row */}
                    <tr className="bg-gray-100 border-t-2 border-black font-black text-black text-xs font-mono">
                      <td colSpan={8} className="p-2.5 border border-black text-right uppercase font-sans">
                        Grand Total Summary (All {displayRows.length} Clients):
                      </td>
                      <td className="p-2.5 border border-black text-center"><QtyBadge qty={kpis.totalOrderQty} /></td>
                      <td className="p-2.5 border border-black text-center text-emerald-700"><QtyBadge qty={kpis.totalOrderQty - kpis.totalHeldQty} /></td>
                      <td className="p-2.5 border border-black text-center bg-amber-200 text-amber-950"><QtyBadge qty={kpis.totalHeldQty} /></td>
                      <td className="p-2.5 border border-black text-right">-</td>
                      <td className="p-2.5 border border-black text-right pr-2 bg-emerald-200 text-emerald-950 font-bold">
                        Rs. {kpis.totalHeldValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
  );
};

export default CustomerPerspectiveTable;
