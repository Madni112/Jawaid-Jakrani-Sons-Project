import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdFileDownload, MdPrint, MdTableChart, MdViewList } from 'react-icons/md';

interface StockReportControlsProps {
    activeTab: number;
    activeViewMode: 'summary' | 'detailed';
    onViewModeChange: (mode: 'summary' | 'detailed') => void;
    exporting: boolean;
    onExportExcel: () => void;
    onPrint: () => void;
}

export const StockReportControls: React.FC<StockReportControlsProps> = ({
    activeTab,
    activeViewMode,
    onViewModeChange,
    exporting,
    onExportExcel,
    onPrint
}) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3 rounded border print-hidden-element print:hidden">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 font-bold hover:underline cursor-pointer"
            >
                <MdArrowBack size={16} /> Back to Report Filter
            </button>

            {/* View Switcher Toggle (Exclusively for Tab 7: Category-Wise Stock Valuation Ledger) */}
            {activeTab === 7 && (
                <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                    <button
                        type="button"
                        onClick={() => onViewModeChange('summary')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            activeViewMode === 'summary' ? 'bg-white text-primary shadow-xs font-black' : 'text-slate-600 hover:text-black'
                        }`}
                    >
                        <MdTableChart size={14} /> Summary View
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange('detailed')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                            activeViewMode === 'detailed' ? 'bg-white text-primary shadow-xs font-black' : 'text-slate-600 hover:text-black'
                        }`}
                    >
                        <MdViewList size={14} /> Detailed View
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
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
                    onClick={onPrint}
                    className="flex items-center gap-1.5 bg-primary text-white py-1.5 px-4 rounded font-black cursor-pointer hover:bg-opacity-90 transition shadow-sm"
                >
                    <MdPrint size={16} /> Print Report
                </button>
            </div>
        </div>
    );
};
