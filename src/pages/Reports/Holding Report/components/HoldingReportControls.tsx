import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdPrint, MdFileDownload } from 'react-icons/md';
import Spinner from '../../../../ui/Spinner';
import { getBrandConfig } from '../../../../utils/brand';

interface HoldingReportControlsProps {
  activePerspective: string;
  setActivePerspective: (perspective: string) => void;
  setCurrentPage: (page: number) => void;
  handlePrint: () => void;
  handleExportExcel: () => void;
  exporting: boolean;
  businessName?: string;
  perspectiveLabels?: Record<string, string>;
  rawFilters?: any;
}

export const HoldingReportControls: React.FC<HoldingReportControlsProps> = ({
  activePerspective,
  setActivePerspective,
  setCurrentPage,
  handlePrint,
  handleExportExcel,
  exporting,
  businessName = '',
  perspectiveLabels = {},
  rawFilters = {},
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-100 p-3 rounded border print-hidden-element print:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 font-bold hover:underline cursor-pointer"
          >
            <MdArrowBack size={16} /> Return to Holding Audit Center
          </button>

          {/* Perspective Switcher */}
          <div className="flex items-center bg-white rounded border p-0.5 text-xs font-semibold">
            {[
              { id: 'detailed', label: 'Itemized Detailed' },
              { id: 'salesman', label: 'Salesman-Wise' },
              { id: 'customer', label: 'Customer-Wise' },
              { id: 'invoice', label: 'Invoice-Wise' },
              { id: 'gatepass', label: 'Gatepass-Wise' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePerspective(p.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${activePerspective === p.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={exporting}
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-4 rounded font-bold cursor-pointer transition shadow-sm disabled:opacity-50"
            >
              <MdFileDownload size={16} /> {exporting ? 'Exporting...' : 'Export to Excel (.xlsx)'}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-primary text-white py-1.5 px-5 rounded font-black cursor-pointer hover:bg-opacity-90 transition shadow-sm"
            >
              <MdPrint size={16} /> Print Voucher Report
            </button>
          </div>
        </div>

        {/* Printable Letterhead */}
        <div className="relative text-center space-y-1.5 py-4 border-b border-double border-slate-300">
          {/* AM Brand Icon Badge (Sidebar Style Option A) */}
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
                flexShrink: 0
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, transparent, rgba(255, 255, 255, 0.15))',
                  pointerEvents: 'none'
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
                  printColorAdjust: 'exact'
                }}
              >AM</span>
            </div>
          </div>

          <h1 className="text-3xl font-black uppercase tracking-widest font-serif text-slate-950">
            {businessName || getBrandConfig().fullName}
          </h1>
          <p className="text-xs font-bold tracking-wider text-gray-600 uppercase">
            COMMERCIAL HOLDING INVENTORY & PENDING DISPATCH AUDIT STATEMENT
          </p>
          <div className="text-xs pt-1.5 font-mono flex justify-between px-2 text-gray-700">
            <span>Audit Perspective: <b className="text-black uppercase underline">{(perspectiveLabels[activePerspective] || activePerspective).toUpperCase()} PERSPECTIVE</b></span>
            <span>Date Window: {rawFilters.dateFrom || 'Start'} up to {rawFilters.dateTo || 'Today'}</span>
          </div>
      </div>
    </>
  );
};

export default HoldingReportControls;
