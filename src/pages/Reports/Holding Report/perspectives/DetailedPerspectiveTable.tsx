import React from 'react';
import { QtyBadge } from '../../../../utils/QtyBadge';
import { HoldingItemRow, CustomerDetails } from '../types/holdingReportTypes';
import CustomerBadge from '../components/CustomerBadge';

interface DetailedPerspectiveTableProps {
  displayRows: HoldingItemRow[];
  paginatedRows: HoldingItemRow[];
  kpis: {
    totalOrderQty: number;
    totalHeldQty: number;
    totalHeldValue: number;
  };
  currentPage: number;
  pageSize: number | 'all';
  customerLookupMap: Record<string, CustomerDetails>;
  isPrinting?: boolean;
}

export const DetailedPerspectiveTable: React.FC<DetailedPerspectiveTableProps> = ({
  displayRows,
  paginatedRows,
  kpis,
  currentPage,
  pageSize,
  customerLookupMap,
  isPrinting = false,
}) => {
  const startIndex = pageSize === 'all' ? 0 : (currentPage - 1) * (Number(pageSize) || 0);
  return (
<div className="w-full overflow-x-auto">
            <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                  <th className="p-1.5 border border-black text-center w-10">S#</th>
                  <th className="p-1.5 border border-black text-center w-24">Date</th>
                  <th className="p-1.5 border border-black">Gatepass #</th>
                  <th className="p-1.5 border border-black">Invoice #</th>
                  <th className="p-1.5 border border-black min-w-[140px] max-w-[220px]">Customer Name</th>
                  <th className="p-1.5 border border-black">Salesman</th>
                  <th className="p-1.5 border border-black">Product Description</th>
                  <th className="p-1.5 border border-black text-center w-16">Order</th>
                  <th className="p-1.5 border border-black text-center w-16">Sent</th>
                  <th className="p-1.5 border border-black text-center w-16 bg-amber-50">Held Qty</th>
                  <th className="p-1.5 border border-black text-right w-20">Rate</th>
                  <th className="p-1.5 border border-black text-right pr-2 bg-emerald-50 w-28">Held Value</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-8 font-bold italic border border-black text-gray-400">
                      No holding records found matching parameters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((doc: any, idx: number) => {
                    const items: any[] = doc.items || [];
                    return (
                      <tr key={doc.id || idx} className="border-b border-black font-mono text-xs hover:bg-slate-50">
                        <td className="p-1.5 border border-black text-center text-gray-500 align-middle font-bold">{startIndex + idx + 1}</td>
                        <td className="p-1.5 border border-black text-center text-gray-700 font-sans text-[10px] align-middle">{doc.date || '-'}</td>
                        <td className="p-1.5 border border-black font-bold font-mono align-middle">{doc.gatepassNo || '-'}</td>
                        <td className="p-1.5 border border-black font-mono font-bold align-middle">{doc.invoiceNo || '-'}</td>
                        <td className="p-1.5 border border-black font-sans font-bold align-middle min-w-[140px] max-w-[220px]">
                          <div className="leading-tight">{doc.customerName || '-'}</div>
                          <CustomerBadge name={doc.customerName} customerLookupMap={customerLookupMap} />
                        </td>
                        <td className="p-1.5 border border-black font-sans text-gray-700 align-middle">{doc.salesman || '-'}</td>

                        {/* 📦 Product Description Sub-Rows */}
                        <td className="p-0 border border-black align-top font-sans">
                          <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                            {items.map((it, itIdx) => (
                              <div key={itIdx} className="p-1.5 flex-1 flex flex-col justify-center min-h-[34px]">
                                <div className="font-bold text-black">{it.productName}</div>
                                {it.skuCode && <div className="text-[9px] text-gray-500 font-mono">{it.skuCode}</div>}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* 📊 Order Qty Sub-Rows */}
                        <td className="p-0 border border-black align-top">
                          <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                            {items.map((it, itIdx) => (
                              <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-center min-h-[34px]">
                                <QtyBadge qty={it.orderQty} />
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* 🚚 Sent / Dispatched Qty Sub-Rows */}
                        <td className="p-0 border border-black align-top">
                          <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                            {items.map((it, itIdx) => (
                              <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-center text-emerald-700 min-h-[34px]">
                                <QtyBadge qty={it.dispatchedQty} />
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* ⏳ Held Qty Sub-Rows */}
                        <td className="p-0 border border-black align-top bg-amber-50/40">
                          <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                            {items.map((it, itIdx) => (
                              <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-center font-black text-amber-900 min-h-[34px]">
                                <QtyBadge qty={it.holdQty} />
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* 💵 Rate Sub-Rows */}
                        <td className="p-0 border border-black align-top">
                          <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                            {items.map((it, itIdx) => (
                              <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-end font-mono min-h-[34px]">
                                Rs. {Number(it.rate || 0).toLocaleString()}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* 💰 Held Value Sub-Rows */}
                        <td className="p-0 border border-black align-top bg-emerald-50/40">
                          <div className="divide-y divide-black h-full flex flex-col justify-stretch">
                            {items.map((it, itIdx) => (
                              <div key={itIdx} className="p-1.5 flex-1 flex items-center justify-end font-mono font-bold text-emerald-900 pr-2 min-h-[34px]">
                                Rs. {Number(it.heldAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {displayRows.length > 0 && (
                <tfoot>
                  {/* 📄 Page Subtotal Row */}
                  {!isPrinting && pageSize !== 'all' && (
                    <tr className="bg-amber-50/80 border-t border-black font-bold font-mono text-xs text-amber-950">
                      <td colSpan={7} className="p-2 border border-black text-right uppercase font-sans text-amber-900">
                        Page {currentPage} Subtotal ({paginatedRows.length} documents):
                      </td>
                      <td className="p-2 border border-black text-center"><QtyBadge qty={paginatedRows.reduce((s: number, r: any) => s + Number(r.totalOrderQty || 0), 0)} /></td>
                      <td className="p-2 border border-black text-center text-emerald-700"><QtyBadge qty={paginatedRows.reduce((s: number, r: any) => s + Number(r.totalDispatchedQty || 0), 0)} /></td>
                      <td className="p-2 border border-black text-center bg-amber-100 text-amber-900"><QtyBadge qty={paginatedRows.reduce((s: number, r: any) => s + Number(r.totalHeldQty || 0), 0)} /></td>
                      <td className="p-2 border border-black text-right">-</td>
                      <td className="p-2 border border-black text-right pr-2 bg-emerald-50 text-emerald-900 font-bold">
                        Rs. {paginatedRows.reduce((s: number, r: any) => s + Number(r.totalHeldValue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                  {/* 📊 Overall Grand Totals Row */}
                  <tr className="bg-gray-100 border-t-2 border-black font-black text-black text-xs font-mono">
                    <td colSpan={7} className="p-2 border border-black text-right uppercase font-sans">Grand Total Summary (All {displayRows.length} Documents):</td>
                    <td className="p-2 border border-black text-center"><QtyBadge qty={kpis.totalOrderQty} /></td>
                    <td className="p-2 border border-black text-center text-emerald-700"><QtyBadge qty={kpis.totalOrderQty - kpis.totalHeldQty} /></td>
                    <td className="p-2 border border-black text-center bg-amber-100 text-amber-900"><QtyBadge qty={kpis.totalHeldQty} /></td>
                    <td className="p-2 border border-black text-right">-</td>
                    <td className="p-2 border border-black text-right pr-2 bg-emerald-100 text-emerald-900 font-bold">
                      Rs. {kpis.totalHeldValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
  );
};

export default DetailedPerspectiveTable;
