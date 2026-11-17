import React from 'react';
import { PurchaseReportSummaryMetrics } from '../types/purchaseReportTypes';

interface PurchaseReportKpiCardsProps {
  rType: string;
  summaryMetrics: PurchaseReportSummaryMetrics;
}

export const PurchaseReportKpiCards: React.FC<PurchaseReportKpiCardsProps> = ({
  rType,
  summaryMetrics
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 print:hidden">
      <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Records</div>
        <div className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">{summaryMetrics.count} Entries</div>
      </div>
      {rType === 'category-purchases' && (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Gross Procurement</div>
            <div className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">
              Rs.{' '}
              {Number(summaryMetrics.grossSpend || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2
              })}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wide">Return Credits (Dr)</div>
            <div className="text-base font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              Rs.{' '}
              {Number(summaryMetrics.retSpend || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2
              })}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-2xs text-left">
            <div className="text-[11px] font-bold text-primary uppercase tracking-wide">Net Total Spend</div>
            <div className="text-base font-black text-primary font-mono mt-1">
              Rs.{' '}
              {Number(summaryMetrics.netSpend || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2
              })}
            </div>
          </div>
        </>
      )}
      {(rType === 'product-purchase-history' || rType === 'purchase-invoice-detail') && (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs text-left">
            <div className="text-[11px] font-bold text-indigo-500 uppercase tracking-wide">Total Inward Units</div>
            <div className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
              {Number(summaryMetrics.totalUnits || 0).toLocaleString()} Units
            </div>
          </div>
          <div className="col-span-2 p-4 bg-white dark:bg-boxdark rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-2xs text-left">
            <div className="text-[11px] font-bold text-primary uppercase tracking-wide">Total Procurement Value</div>
            <div className="text-base font-black text-primary font-mono mt-1">
              Rs.{' '}
              {Number(summaryMetrics.totalSpend || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2
              })}
            </div>
          </div>
        </>
      )}
      {(rType === 'purchase' || rType === 'return' || rType === 'purchase-query') && (
        <div className="col-span-3 p-4 bg-white dark:bg-boxdark rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-2xs text-right">
          <div className="text-[11px] font-bold text-primary uppercase tracking-wide">Aggregated Gross Valuation</div>
          <div className="text-base font-black text-primary font-mono mt-1">
            Rs.{' '}
            {Number(summaryMetrics.totalSpend || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReportKpiCards;
