import React from 'react';
import {
  MdPrint,
  MdArrowBack,
  MdFileDownload,
  MdTableChart,
  MdViewList
} from 'react-icons/md';

interface PurchaseReportControlsProps {
  onBack: () => void;
  rType: string;
  activeViewMode: 'summary' | 'detailed';
  onViewModeChange: (mode: 'summary' | 'detailed') => void;
  exporting: boolean;
  onExportExcel: () => void;
}

export const PurchaseReportControls: React.FC<PurchaseReportControlsProps> = ({
  onBack,
  rType,
  activeViewMode,
  onViewModeChange,
  exporting,
  onExportExcel
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-100 p-3 rounded border print-hidden-element print:hidden">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 font-bold hover:underline cursor-pointer"
      >
        <MdArrowBack size={16} /> Back to Report Filter
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        {(rType === 'category-purchases' ||
          rType === 'product-purchase-history' ||
          rType === 'purchase-invoice-detail') && (
          <div className="flex items-center bg-white p-0.5 rounded border border-gray-300 shadow-2xs mr-2">
            <button
              type="button"
              onClick={() => onViewModeChange('summary')}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                activeViewMode === 'summary' ? 'bg-primary text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              <MdTableChart size={14} /> Summary View
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('detailed')}
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
  );
};

export default PurchaseReportControls;
