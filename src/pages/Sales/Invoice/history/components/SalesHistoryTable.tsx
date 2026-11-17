import React from 'react';
import Spinner from '../../../../../ui/Spinner';
import TableActions from '../../../../../ui/TableActions';
import { SortConfig, InvoiceBalanceInfo } from '../types/salesHistoryTypes';

interface SalesHistoryTableProps {
  loading: boolean;
  paginatedInvoices: any[];
  filteredInvoices: any[];
  sortConfig: SortConfig | null;
  handleSort: (key: string) => void;
  returnedInvoiceNos: string[];
  deliveryChallansMap: Record<string, any[]>;
  invoiceBalances: Record<string, InvoiceBalanceInfo>;
  onPreviewInvoice: (idx: number) => void;
  onOpenDcList: (dcs: any[]) => void;
  onOpenDcDetail: (dc: any, defaultTab?: 'tracking' | 'payment') => void;
  onPrint: (invId: string | number) => void;
  onReturn: (inv: any) => void;
  onEdit: (inv: any) => void;
  onDelete: (invId: string | number) => void;
}

export const SalesHistoryTable: React.FC<SalesHistoryTableProps> = ({
  loading,
  paginatedInvoices,
  filteredInvoices,
  sortConfig,
  handleSort,
  returnedInvoiceNos,
  deliveryChallansMap,
  invoiceBalances,
  onPreviewInvoice,
  onOpenDcList,
  onOpenDcDetail,
  onPrint,
  onReturn,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="max-w-full overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
      <table className="w-full border-collapse text-xs text-left">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
            <th
              className="py-3.5 px-4 text-center w-16 cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('invoice_no')}
            >
              Invoice No{' '}
              <span className={sortConfig?.key === 'invoice_no' ? 'opacity-100' : 'opacity-0'}>
                {sortConfig?.key === 'invoice_no' && sortConfig.direction === 'desc' ? '↓' : '↑'}
              </span>
            </th>
            <th className="py-3.5 px-4 text-center">DC No</th>
            <th
              className="py-3.5 px-4 cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('sale_date')}
            >
              Sale Date{' '}
              <span className={sortConfig?.key === 'sale_date' ? 'opacity-100' : 'opacity-0'}>
                {sortConfig?.key === 'sale_date' && sortConfig.direction === 'desc' ? '↓' : '↑'}
              </span>
            </th>
            <th
              className="py-3.5 px-4 cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('salesman')}
            >
              Salesman{' '}
              <span className={sortConfig?.key === 'salesman' ? 'opacity-100' : 'opacity-0'}>
                {sortConfig?.key === 'salesman' && sortConfig.direction === 'desc' ? '↓' : '↑'}
              </span>
            </th>
            <th
              className="py-3.5 px-4 cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('customer_name')}
            >
              Customer{' '}
              <span className={sortConfig?.key === 'customer_name' ? 'opacity-100' : 'opacity-0'}>
                {sortConfig?.key === 'customer_name' && sortConfig.direction === 'desc' ? '↓' : '↑'}
              </span>
            </th>
            <th
              className="py-3.5 px-4 text-center cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('receipt_status')}
            >
              Status{' '}
              <span className={sortConfig?.key === 'receipt_status' ? 'opacity-100' : 'opacity-0'}>
                {sortConfig?.key === 'receipt_status' && sortConfig.direction === 'desc' ? '↓' : '↑'}
              </span>
            </th>
            <th
              className="py-3.5 px-4 text-right pr-3 cursor-pointer select-none whitespace-nowrap"
              onClick={() => handleSort('total_amount')}
            >
              Total Net Amount{' '}
              <span className={sortConfig?.key === 'total_amount' ? 'opacity-100' : 'opacity-0'}>
                {sortConfig?.key === 'total_amount' && sortConfig.direction === 'desc' ? '↓' : '↑'}
              </span>
            </th>
            <th className="py-3.5 px-4 text-center w-14">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="text-center py-14">
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <Spinner size="w-8 h-8" color="border-primary" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 animate-pulse">
                    Loading sales invoices...
                  </span>
                </div>
              </td>
            </tr>
          ) : paginatedInvoices.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-10 text-xs text-slate-400 italic">
                No invoice records found.
              </td>
            </tr>
          ) : (
            paginatedInvoices.map((inv) => {
              const rawInvoiceIdString = String(inv.id).trim().toLowerCase();

              const isReturned = returnedInvoiceNos.some((retNo) => {
                return (
                  retNo === rawInvoiceIdString ||
                  retNo === `inv-${rawInvoiceIdString}` ||
                  retNo === `inv-${rawInvoiceIdString.padStart(4, '0')}` ||
                  retNo.includes(rawInvoiceIdString)
                );
              });

              const paddedInvoiceIdString = String(inv.id).padStart(4, '0');
              const invoiceKey = `inv-${paddedInvoiceIdString}`;
              const customInvKey = String(inv.invoice_no || '').trim().toLowerCase();
              const linkedDCs =
                deliveryChallansMap[customInvKey] ||
                deliveryChallansMap[invoiceKey] ||
                deliveryChallansMap[`inv-${inv.id}`] ||
                [];

              const upfrontAmt = Number(inv.cash_amount_paid || 0) + Number(inv.bank_amount || 0);
              const balanceInfo = invoiceBalances[String(inv.id)] || {
                upfront: upfrontAmt,
                receipts: 0,
                returns: 0,
                received: upfrontAmt,
                remaining: Math.max(0, Number(inv.total_amount || 0) - upfrontAmt),
              };
              const liveRemaining = balanceInfo.remaining;
              const isFullyPaid =
                liveRemaining <= 0.01 ||
                String(inv.receipt_status || '').toLowerCase() === 'paid' ||
                String(inv.payment_term || '').toLowerCase() === 'cash';

              return (
                <tr
                  key={inv.id}
                  className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 duration-150"
                >
                  <td className="py-3 px-4 text-center font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        const foundIdx = filteredInvoices.findIndex((x: any) => x.id === inv.id);
                        if (foundIdx !== -1) onPreviewInvoice(foundIdx);
                      }}
                      className="font-bold text-primary dark:text-primary hover:underline cursor-pointer transition"
                      title="Click to preview invoice details"
                    >
                      {inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {linkedDCs.length > 1 ? (
                      (() => {
                        const pendingCount = linkedDCs.filter((dc: any) => dc.status === 'Pending Approval').length;
                        const payReqCount = linkedDCs.filter(
                          (dc: any) => Number(dc.freight_charges || 0) > 0 && dc.freight_payment_status !== 'Approved'
                        ).length;
                        return (
                          <button
                            type="button"
                            onClick={() => onOpenDcList(linkedDCs)}
                            title="Click to view all Delivery Challans of this invoice"
                            className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:shadow-xs transition cursor-pointer"
                          >
                            <span className="text-primary font-bold">{linkedDCs.length} DCs</span>
                            {pendingCount > 0 && (
                              <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 px-1.5 py-0.5 rounded text-[9px]">
                                {pendingCount} Pending
                              </span>
                            )}
                            {payReqCount > 0 && (
                              <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {payReqCount} Pay Req
                              </span>
                            )}
                            <span className="text-[9px] opacity-70 underline">view</span>
                          </button>
                        );
                      })()
                    ) : linkedDCs.length === 1 ? (
                      (() => {
                        const dc = linkedDCs[0];
                        const isPend = dc.status === 'Pending Approval';
                        const isPart = dc.status === 'Partially Dispatched';
                        const isDisp = dc.status === 'Dispatched' || dc.status === 'Fully Dispatched';
                        const hasFreightPending =
                          Number(dc.freight_charges || 0) > 0 && dc.freight_payment_status !== 'Approved';
                        return (
                          <button
                            type="button"
                            onClick={() => onOpenDcDetail(dc, hasFreightPending ? 'payment' : 'tracking')}
                            title="Click to view Realtime Warehouse Activity & Approve Freight"
                            className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:shadow-xs transition cursor-pointer"
                          >
                            <span className="text-primary font-bold">{dc.challan_no || `DC-${dc.id}`}</span>
                            {isPend && (
                              <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 px-1.5 py-0.5 rounded text-[9px]">
                                Pending
                              </span>
                            )}
                            {isPart && (
                              <span className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-1.5 py-0.5 rounded text-[9px]">
                                Partial
                              </span>
                            )}
                            {isDisp && (
                              <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px]">
                                Dispatched
                              </span>
                            )}
                            {hasFreightPending && (
                              <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold animate-pulse">
                                Pay Req
                              </span>
                            )}
                          </button>
                        );
                      })()
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {inv.sale_date || new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                    {inv.salesman || 'General'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {inv.customer_name}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-xs min-w-[150px]">
                    {isReturned ? (
                      <span className="text-[10px] font-black uppercase tracking-wide bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                        Returned
                      </span>
                    ) : isFullyPaid ? (
                      <div className="flex flex-col items-center justify-center space-y-0.5">
                        {balanceInfo.upfront >= Number(inv.total_amount || 0) && balanceInfo.receipts <= 0 ? (
                          <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-xs">
                            Paid Upfront
                          </span>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-0.5">
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {balanceInfo.upfront > 0
                                ? `Upfront: Rs. ${balanceInfo.upfront.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                : 'No Upfront amount'}
                            </span>
                            <span className="inline-block px-2.5 py-0.5 my-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wide whitespace-nowrap shadow-xs">
                              Paid (By Receipt)
                            </span>
                            {balanceInfo.receipts > 0 && (
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                Receipt: Rs.{' '}
                                {balanceInfo.receipts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-0.5">
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {balanceInfo.upfront > 0
                            ? `Upfront: Rs. ${balanceInfo.upfront.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : 'No Upfront amount'}
                        </span>
                        <span className="inline-block px-2.5 py-0.5 my-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
                          Credit (Due: Rs.{' '}
                          {liveRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                        </span>
                        <span
                          className={`text-[10px] font-medium whitespace-nowrap ${
                            balanceInfo.receipts > 0
                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {balanceInfo.receipts > 0
                            ? `Receipt: Rs. ${balanceInfo.receipts.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : 'No receipt'}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white font-mono pr-3">
                    Rs. {Number(inv.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <TableActions
                      onPrint={() => onPrint(inv.id)}
                      onReturn={() => onReturn(inv)}
                      onEdit={() => onEdit(inv)}
                      onDelete={() => onDelete(inv.id)}
                      printTitle="Print Invoice"
                      returnTitle="Sale Return"
                      editTitle="Edit Invoice"
                      deleteTitle="Delete Invoice"
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
