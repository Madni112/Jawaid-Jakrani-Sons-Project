import React from 'react';
import { MdPauseCircleFilled, MdRefresh, MdFileDownload, MdPrint } from 'react-icons/md';

interface HoldingHeaderCardProps {
  onRefresh: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  exporting: boolean;
  hasRows: boolean;
}

export const HoldingHeaderCard: React.FC<HoldingHeaderCardProps> = ({
  onRefresh,
  onExportExcel,
  onPrint,
  exporting,
  hasRows
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-900 to-emerald-800 dark:from-emerald-950 dark:to-emerald-900 p-6 rounded-2xl shadow-lg relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute left-1/4 -bottom-10 w-48 h-48 bg-emerald-400/10 blur-3xl rounded-full pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-white/10 text-emerald-100 font-bold backdrop-blur-sm border border-white/10 shadow-sm">
            <MdPauseCircleFilled size={24} />
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Holding Inventory &amp; Commitment Center
          </h1>
        </div>
        <p className="text-[13px] text-emerald-100/70 mt-2 max-w-xl leading-relaxed">
          Real-time committed stock held at warehouses across Salesmen, Customers, Gatepasses &amp; Invoices.
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh dataset"
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5 backdrop-blur-sm border border-white/10"
        >
          <MdRefresh size={20} />
        </button>

        <button
          type="button"
          disabled={exporting || !hasRows}
          onClick={onExportExcel}
          className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-black text-[13px] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
        >
          <MdFileDownload size={20} className="text-emerald-600" />
          <span>{exporting ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
        </button>

        <button
          type="button"
          onClick={onPrint}
          disabled={!hasRows}
          className="px-5 py-3 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-black text-[13px] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2 border border-slate-800"
        >
          <MdPrint size={20} />
          <span>Print Report</span>
        </button>
      </div>
    </div>
  );
};
