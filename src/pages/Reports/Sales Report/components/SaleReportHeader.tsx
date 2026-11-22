import React from 'react';
import { MdPrint, MdArrowBack, MdFileDownload, MdViewList, MdTableChart } from 'react-icons/md';
import { getBrandConfig } from '../../../../utils/brand';

interface SaleReportHeaderProps {
  onBack: () => void;
  rType: string;
  activeViewMode: 'summary' | 'detailed';
  setActiveViewMode: (mode: 'summary' | 'detailed') => void;
  printOrientation: 'portrait' | 'landscape';
  setPrintOrientation: React.Dispatch<React.SetStateAction<'portrait' | 'landscape'>>;
  exporting: boolean;
  onExportExcel: () => void;
  businessName?: string | null;
  filters: any;
}

export const SaleReportHeader: React.FC<SaleReportHeaderProps> = ({
  onBack,
  rType,
  activeViewMode,
  setActiveViewMode,
  printOrientation,
  setPrintOrientation,
  exporting,
  onExportExcel,
  businessName,
  filters,
}) => {
  return (
    <>
      {/* ── TOP ACTION BUTTON BAR ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-100 p-3 rounded border print-hidden-element print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 font-bold hover:underline cursor-pointer"
        >
          <MdArrowBack size={16} /> Back to Report Filter
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {(rType === 'category-sales' || rType === 'product-sales-history' || rType === 'sale' || rType === 'customer-sales' || rType === 'return') && (
            <div className="flex items-center bg-white p-0.5 rounded border border-gray-300 shadow-2xs mr-2">
              <button
                type="button"
                onClick={() => setActiveViewMode('summary')}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  activeViewMode === 'summary' ? 'bg-primary text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                <MdTableChart size={14} /> Summary View
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('detailed')}
                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  activeViewMode === 'detailed' ? 'bg-primary text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                <MdViewList size={14} /> Detailed View
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setPrintOrientation((prev) => (prev === 'landscape' ? 'portrait' : 'landscape'))}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-slate-800 border border-slate-300 py-1.5 px-3 rounded font-bold cursor-pointer transition shadow-2xs text-xs"
            title="Toggle Print Layout Orientation"
          >
            📄 Layout: <span className="uppercase text-primary font-black">{printOrientation}</span>
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={onExportExcel}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white py-1.5 px-3.5 rounded font-bold cursor-pointer transition shadow-sm disabled:opacity-50"
          >
            <MdFileDownload size={16} /> {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-primary text-white py-1.5 px-4 rounded font-black cursor-pointer hover:bg-opacity-90 transition shadow-sm"
          >
            <MdPrint size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* ── OFFICIAL CORPORATE REPORT HEADER ── */}
      <div className="relative text-center space-y-1.5 py-4 border-b border-double border-black">
        {/* AM Brand Icon Badge */}
        <div className="absolute left-2 top-2">
          <div
            style={{
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px',
              maxWidth: '48px',
              maxHeight: '48px',
              borderRadius: '13px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #115e59 100%)',
              border: '1.5px solid rgba(52, 211, 153, 0.5)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, transparent, rgba(255, 255, 255, 0.15))',
                pointerEvents: 'none',
              }}
            />
            <span
              style={{
                position: 'relative',
                zIndex: 10,
                fontFamily: 'Cinzel, Georgia, serif',
                fontWeight: 900,
                letterSpacing: '0.12em',
                fontSize: '15px',
                color: '#ffffff',
                lineHeight: 1,
                paddingLeft: '2px',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
              }}
            >J.J.S</span>
          </div>
        </div>

        <h1 className="text-3xl font-black uppercase tracking-widest font-serif text-slate-950">
          {businessName || getBrandConfig().fullName}
        </h1>
        <p className="text-xs font-bold tracking-wider text-gray-600 uppercase">
          {rType === 'category-sales'
            ? 'Category-Wise Product Sales, Net Volume Realization & Revenue Contribution Statement'
            : rType === 'product-sales-history'
            ? 'Product Sales History, Velocity Trends & Realized Revenue Statement'
            : rType === 'sales-query'
            ? 'Sales Filter, Multi-Criteria Parameters & Chronological Audit Register'
            : rType === 'customer-sales'
            ? 'Customer Sales Volume, Purchasing Cycle & Revenue Contribution Statement'
            : rType === 'sale'
            ? 'Commercial Sales Audit Statement & Sales Executive Ledger'
            : rType === 'loyalty'
            ? 'Customer Financial Statement & Chronological Invoicing Ledger'
            : rType === 'return'
            ? 'Sales Return, Defect Restock & Credit Ledger Statement'
            : 'Sales Invoice Detail Audit Report'}
        </p>
        <div className="text-xs pt-1.5 font-mono flex flex-wrap justify-between px-2 text-gray-700">
          <span>
            Report Categorization:{' '}
            <b className="text-black uppercase underline">
              {rType === 'category-sales'
                ? `Category-Wise Sales Audit (${activeViewMode.toUpperCase()} VIEW)`
                : rType === 'product-sales-history'
                ? `Product Sales History (${activeViewMode.toUpperCase()} VIEW)`
                : rType === 'sales-query'
                ? 'Sales Parameter Transaction Register (CHRONOLOGICAL AUDIT)'
                : rType === 'customer-sales'
                ? `Customer Sales & Volume Analysis (${activeViewMode.toUpperCase()} VIEW)`
                : rType === 'sale'
                ? `Sale (Salesmen wise) (${activeViewMode.toUpperCase()} VIEW)`
                : rType === 'return'
                ? `Sales Return & Credit Ledger (${activeViewMode.toUpperCase()} VIEW)`
                : rType === 'loyalty'
                ? 'CUSTOMER FINANCIAL STATEMENT & INVOICE LEDGER'
                : `${rType} Ledger Book`}
            </b>
          </span>
          <span>
            Duration Window Block: {filters.dateFrom || 'All Time'} up to {filters.dateTo || 'All Time'}
          </span>
        </div>
      </div>
    </>
  );
};
