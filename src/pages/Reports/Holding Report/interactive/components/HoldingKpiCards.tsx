import React from 'react';
import { MdInventory, MdAttachMoney, MdLocalShipping, MdPeople } from 'react-icons/md';
import { getQtyOptionBParts } from '../utils/holdingHelpers';
import type { HoldingKpis } from '../types/holdingTypes';

interface HoldingKpiCardsProps {
  kpis: HoldingKpis;
}

export const HoldingKpiCards: React.FC<HoldingKpiCardsProps> = ({ kpis }) => {
  const kpiQtyParts = getQtyOptionBParts(kpis.totalHeldQty);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-[#111827] dark:to-slate-900 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
        <div>
          <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-1">
            Total Held Quantity
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <b className="text-slate-800 dark:text-slate-100 text-2xl font-black font-mono tracking-tight">
              {kpiQtyParts.main}
            </b>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans tracking-tight">
              {kpiQtyParts.unit}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md">
              Across
            </span>
            <span className="text-[11px] text-slate-400">{kpis.totalItems} distinct items</span>
          </div>
        </div>
        <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shadow-sm">
          <MdInventory size={28} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-[#111827] dark:to-slate-900 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
        <div>
          <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-1">
            Financial Holding Value
          </span>
          <b className="text-slate-800 dark:text-slate-100 text-2xl font-black font-mono tracking-tight block mt-0.5">
            Rs. {Number(kpis.totalHeldValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </b>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              Committed
            </span>
            <span className="text-[11px] text-slate-400">inventory cost</span>
          </div>
        </div>
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-sm">
          <MdAttachMoney size={28} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-[#111827] dark:to-slate-900 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
        <div>
          <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-1">
            Affected DCs / Invoices
          </span>
          <b className="text-slate-800 dark:text-slate-100 text-2xl font-black font-mono tracking-tight block mt-0.5">
            {kpis.uniqueGatepasses} GPs / {kpis.uniqueInvoices} Invs
          </b>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="flex items-center text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-500/10 px-1.5 py-0.5 rounded-md">
              Pending
            </span>
            <span className="text-[11px] text-slate-400">dispatch orders</span>
          </div>
        </div>
        <div className="p-3.5 bg-teal-50 dark:bg-teal-500/10 rounded-2xl text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform shadow-sm">
          <MdLocalShipping size={28} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-[#111827] dark:to-slate-900 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
        <div>
          <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-1">
            Sales Officers &amp; Clients
          </span>
          <b className="text-slate-800 dark:text-slate-100 text-2xl font-black font-mono tracking-tight block mt-0.5">
            {kpis.uniqueSalesmen} Reps / {kpis.uniqueCustomers} Cust
          </b>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="flex items-center text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded-md">
              Assigned
            </span>
            <span className="text-[11px] text-slate-400">holding portfolios</span>
          </div>
        </div>
        <div className="p-3.5 bg-purple-50 dark:bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shadow-sm">
          <MdPeople size={28} />
        </div>
      </div>
    </div>
  );
};
