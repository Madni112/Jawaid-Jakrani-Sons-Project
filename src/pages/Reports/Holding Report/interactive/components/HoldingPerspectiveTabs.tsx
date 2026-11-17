import React from 'react';
import { MdInventory, MdPeople, MdLocalShipping, MdReceipt } from 'react-icons/md';
import type { ViewPerspective } from '../types/holdingTypes';

interface HoldingPerspectiveTabsProps {
  activePerspective: ViewPerspective;
  onSelectPerspective: (p: ViewPerspective) => void;
  detailedCount: number;
  salesmanCount: number;
  customerCount: number;
  gatepassCount: number;
  invoiceCount: number;
}

export const HoldingPerspectiveTabs: React.FC<HoldingPerspectiveTabsProps> = ({
  activePerspective,
  onSelectPerspective,
  detailedCount,
  salesmanCount,
  customerCount,
  gatepassCount,
  invoiceCount
}) => {
  return (
    <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-1 bg-white dark:bg-[#111827] p-1.5 rounded-2xl shadow-sm font-bold text-xs">
      <button
        type="button"
        onClick={() => onSelectPerspective('detailed')}
        className={`py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
          activePerspective === 'detailed'
            ? 'bg-emerald-600 text-white font-bold shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <MdInventory size={16} />
        <span>Itemized Detailed View ({detailedCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectPerspective('salesman')}
        className={`py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
          activePerspective === 'salesman'
            ? 'bg-emerald-600 text-white font-bold shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <MdPeople size={16} />
        <span>Salesman-Wise Holding ({salesmanCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectPerspective('customer')}
        className={`py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
          activePerspective === 'customer'
            ? 'bg-emerald-600 text-white font-bold shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <MdPeople size={16} />
        <span>Customer-Wise Allocation ({customerCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectPerspective('gatepass')}
        className={`py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
          activePerspective === 'gatepass'
            ? 'bg-emerald-600 text-white font-bold shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <MdLocalShipping size={16} />
        <span>Gatepass / Challan-Wise ({gatepassCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectPerspective('invoice')}
        className={`py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
          activePerspective === 'invoice'
            ? 'bg-emerald-600 text-white font-bold shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <MdReceipt size={16} />
        <span>Invoice-Wise Valuation ({invoiceCount})</span>
      </button>
    </div>
  );
};
