import React from 'react';
import { MdPrint, MdArrowBack, MdFileDownload, MdTableChart, MdViewList } from 'react-icons/md';
import { getBrandConfig } from '../../../../utils/brand';
import ReportPagination from '../../../../components/ReportPagination';

interface AccountReportHeaderProps {
    navigate: (path: number | string) => void;
    activeTab: number;
    activeViewMode: 'summary' | 'detailed';
    handleViewModeChange: (mode: 'summary' | 'detailed') => void;
    exporting: boolean;
    handleExportExcel: () => void;
    businessName: string | null;
    filters: any;
    filteredRowsLength: number;
    currentPage: number;
    pageSize: number;
    setCurrentPage: (page: number) => void;
    setPageSize: (size: number) => void;
}

export const AccountReportHeader: React.FC<AccountReportHeaderProps> = ({
    navigate,
    activeTab,
    activeViewMode,
    handleViewModeChange,
    exporting,
    handleExportExcel,
    businessName,
    filters,
    filteredRowsLength,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
}) => {
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-100 p-3 rounded border print-hidden-element print:hidden">
                <button 
                    type="button" 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-1.5 font-bold hover:underline cursor-pointer"
                >
                    <MdArrowBack size={16} /> Back to Report Filter
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                    {(activeTab === 3 || activeTab === 11 || activeTab === 13) && (
                        <div className="flex items-center bg-white p-0.5 rounded border border-gray-300 shadow-2xs mr-2">
                            <button
                                type="button"
                                onClick={() => handleViewModeChange('summary')}
                                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                    activeViewMode === 'summary' ? 'bg-primary text-white' : 'text-gray-600 hover:text-black'
                                }`}
                            >
                                <MdTableChart size={14} /> Summary View
                            </button>
                            <button
                                type="button"
                                onClick={() => handleViewModeChange('detailed')}
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
                        onClick={handleExportExcel}
                        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white py-1.5 px-3.5 rounded font-bold cursor-pointer transition shadow-sm disabled:opacity-50"
                    >
                        <MdFileDownload size={16} /> {exporting ? 'Exporting...' : 'Export Excel'}
                    </button>
                    <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 bg-primary text-white py-1.5 px-4 rounded font-black cursor-pointer hover:bg-opacity-90 transition shadow-sm">
                        <MdPrint size={16} /> Print Report
                    </button>
                </div>
            </div>

            <div className="relative text-center space-y-1.5 py-4 border-b border-double border-black">
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
                        >
                            {getBrandConfig().code}
                        </span>
                    </div>
                </div>

                <h1 className="text-3xl font-black uppercase tracking-widest font-serif text-slate-950">
                    {businessName || getBrandConfig().fullName}
                </h1>
                <p className="text-xs font-bold tracking-wider text-gray-600 uppercase">Master Corporate Ledger Book & Financial Audit Statement Summary</p>

                <div className="text-xs pt-1.5 font-mono flex justify-between px-2 text-gray-700">
                    <span>Audit Sub-Categorization: <b className="text-black uppercase underline">
                        {activeTab === 1 && 'General Ledger Audit Statement'}
                        {activeTab === 2 && 'Customer Account Balance Ledger'}
                        {activeTab === 3 && 'Procurement Vendor Balance Ledger'}
                        {activeTab === 4 && 'Enterprise Income Statement / P&L'}
                        {activeTab === 5 && 'Chart of Accounts Structural Catalog'}
                        {activeTab === 6 && 'Vendor Outstanding Balances Ledger'}
                        {activeTab === 7 && 'Customer Recovery Collection Statement'}
                        {activeTab === 8 && 'Corporate Voucher Audit Log Summary'}
                        {activeTab === 9 && 'Daily Cash & Bank Daybook Statement'}
                        {activeTab === 10 && 'Salesman Sales & Cash Collection Sheet'}
                        {activeTab === 11 && `General Trial Balance Audit Workbook${activeViewMode === 'detailed' ? ' (Detailed Sub-Ledger Breakdown)' : ' (Summary Statement)'}`}
                        {activeTab === 12 && 'Account Debit Aging Matrix Sheet'}
                        {activeTab === 13 && `Customer Account Balance & Outstanding Detail Report${activeViewMode === 'detailed' ? ' (Detailed Invoices)' : ' (Summary Balances)'}`}
                    </b></span>
                    <span>Duration Window Block: {activeTab === 11 ? `As of ${new Date().toISOString().split('T')[0]}` : `${filters.dateFrom || 'Initial'} up to ${filters.dateTo || 'Today'}`}</span>
                    {filters.city && filters.city.length > 0 && !filters.city.includes('All') && (
                        <span>City / Region: <b className="text-black uppercase">{Array.isArray(filters.city) ? filters.city.join(', ') : filters.city}{filters.area && filters.area.length > 0 ? ` (${Array.isArray(filters.area) ? filters.area.join(', ') : filters.area})` : ''}</b></span>
                    )}
                </div>
            </div>

            {activeTab !== 4 && (
                <ReportPagination
                    totalItems={filteredRowsLength}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                    }}
                />
            )}
        </>
    );
};
