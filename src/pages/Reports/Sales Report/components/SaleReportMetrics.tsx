import React from 'react';

interface SaleReportMetricsProps {
  rType: string;
  reportRows: any[];
  filters: any;
  totalNetUnits: number;
  totalGrossAmount: number;
  totalSoldUnits: number;
  totalReturnedUnits: number;
  totalInvoicesCount: number;
  totalReturnsCount: number;
  totalCustomerGrossSales: number;
  totalReturnAmount: number;
  totalAllDiscounts: number;
  cashAmount: number;
  creditAmount: number;
  avgOrder: number;
}

export const SaleReportMetrics: React.FC<SaleReportMetricsProps> = ({
  rType,
  reportRows,
  filters,
  totalNetUnits,
  totalGrossAmount,
  totalSoldUnits,
  totalReturnedUnits,
  totalInvoicesCount,
  totalReturnsCount,
  totalCustomerGrossSales,
  totalReturnAmount,
  totalAllDiscounts,
  cashAmount,
  creditAmount,
  avgOrder,
}) => {
  return (
    <div
      className={`grid grid-cols-2 ${
        rType === 'invoice' || !rType ? 'sm:grid-cols-5' : 'sm:grid-cols-4'
      } gap-3.5 print-hidden-element print:hidden`}
    >
      {rType === 'category-sales' ? (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Product Categories</p>
            <p className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">{reportRows.length} Categories</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Items Sold</p>
            <p className="text-sm font-black text-indigo-700 font-mono mt-0.5">
              {reportRows.reduce((sum: number, c: any) => sum + Number(c.products_count || 0), 0)} Products
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Net Realized Volume</p>
            <p className="text-sm font-black text-emerald-700 font-mono mt-0.5">{totalNetUnits.toLocaleString()} Units</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Net Realized Revenue</p>
            <p className="text-sm font-black text-purple-700 font-mono mt-0.5">
              Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </>
      ) : rType === 'product-sales-history' ? (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Product SKUs</p>
            <p className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">{reportRows.length} Items</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Units Sold (Gross)</p>
            <p className="text-sm font-black text-emerald-700 font-mono mt-0.5">{totalSoldUnits.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Customer Returns Qty</p>
            <p className="text-sm font-black text-rose-700 font-mono mt-0.5">{totalReturnedUnits.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Net Realized Revenue</p>
            <p className="text-sm font-black text-purple-700 font-mono mt-0.5">
              Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </>
      ) : rType === 'customer-sales' ? (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Target Customers</p>
            <p className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">{reportRows.length} Clients</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Invoices & Returns</p>
            <p className="text-sm font-black text-indigo-700 font-mono mt-0.5">
              {totalInvoicesCount} Inv | {totalReturnsCount} Rtn
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Net Realized Volume</p>
            <p className="text-sm font-black text-emerald-700 font-mono mt-0.5">{totalNetUnits.toLocaleString()} Units</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Net Realized Revenue</p>
            <p className="text-sm font-black text-purple-700 font-mono mt-0.5">
              Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </>
      ) : rType === 'loyalty' ? (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Target Customer(s)</p>
            <p className="text-base font-black text-slate-800 dark:text-white font-mono mt-1 truncate">
              {filters.customer?.length > 0 && !filters.customer.includes('All')
                ? filters.customer.join(', ')
                : `${reportRows.length} Customers`}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Invoiced / Billed</p>
            <p className="text-sm font-black text-indigo-700 font-mono mt-0.5">
              Rs.{' '}
              {reportRows
                .reduce((sum: number, c: any) => sum + Number(c.total_billed || 0), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Received / Paid</p>
            <p className="text-sm font-black text-emerald-700 font-mono mt-0.5">
              Rs.{' '}
              {reportRows
                .reduce((sum: number, c: any) => sum + Number(c.total_paid || 0), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Net Outstanding Dues</p>
            <p className="text-sm font-black text-purple-700 font-mono mt-0.5">
              Rs.{' '}
              {reportRows
                .reduce((sum: number, c: any) => sum + Number(c.net_balance || 0), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </>
      ) : rType === 'return' ? (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Affected Customers</p>
            <p className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">{reportRows.length} Clients</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Return Debit Notes</p>
            <p className="text-sm font-black text-indigo-700 font-mono mt-0.5">{totalInvoicesCount} Notes</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Returned Units</p>
            <p className="text-sm font-black text-rose-700 font-mono mt-0.5">{totalReturnedUnits.toLocaleString()} Units</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Credit Adjusted</p>
            <p className="text-sm font-black text-purple-700 font-mono mt-0.5">
              Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </>
      ) : rType === 'sale' ? (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Sales Officers</p>
            <p className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">{reportRows.length} Officers</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Invoices & Returns</p>
            <p className="text-sm font-black text-indigo-700 font-mono mt-0.5">
              {totalInvoicesCount} Inv | {totalReturnsCount} Rtn
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Gross vs Returns (Dr)</p>
            <p className="text-[11px] font-black font-mono mt-0.5">
              <span className="text-emerald-600">Rs. {totalCustomerGrossSales.toLocaleString()}</span> /{' '}
              <span className="text-rose-600">-Rs. {totalReturnAmount.toLocaleString()}</span>
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Net Realized Revenue</p>
            <p className="text-sm font-black text-purple-700 font-mono mt-0.5">
              Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Invoices / Records</p>
            <p className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">{reportRows.length}</p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Matrix Gross</p>
            <p className="text-sm font-black text-emerald-700 font-mono mt-0.5">
              Rs. {totalGrossAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Discounts Given</p>
            <p className="text-sm font-black text-amber-700 font-mono mt-0.5">
              Rs. {totalAllDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Cash vs Credit Split</p>
            <p className="text-[11px] font-black font-mono mt-0.5">
              <span className="text-emerald-600">Rs. {cashAmount.toLocaleString()}</span> /{' '}
              <span className="text-blue-600">Rs. {creditAmount.toLocaleString()}</span>
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Average Ticket Value</p>
            <p className="text-sm font-black text-purple-700 font-mono mt-0.5">Rs. {Math.round(avgOrder).toLocaleString()}</p>
          </div>
        </>
      )}
    </div>
  );
};
