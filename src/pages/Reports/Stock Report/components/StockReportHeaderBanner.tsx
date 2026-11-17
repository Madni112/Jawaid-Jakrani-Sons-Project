import React from 'react';
import { getBrandConfig } from '../../../../utils/brand';
import { StockReportFilter } from '../types/stockReportTypes';

interface StockReportHeaderBannerProps {
    businessName?: string;
    activeTab: number;
    filters: StockReportFilter;
}

export const StockReportHeaderBanner: React.FC<StockReportHeaderBannerProps> = ({
    businessName,
    activeTab,
    filters
}) => {
    return (
        <div className="text-center space-y-1 py-4 border-b border-double border-slate-300">
            <h1 className="text-xl font-black uppercase tracking-widest font-serif">
                {businessName || getBrandConfig().fullName}
            </h1>
            <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                Master Dynamic Inventory Valuation &amp; Real-Time Stock Balance Ledger
            </p>

            <div className="text-[10px] pt-1 font-mono flex justify-between px-2 text-gray-600">
                <span>Workbook Subtype: <b className="text-black uppercase underline">
                    {activeTab === 1 && 'Stock Activity Report'}
                    {activeTab === 2 && 'Stock Balance Report'}
                    {activeTab === 3 && 'Stock Status Report'}
                    {activeTab === 4 && 'Stock Transfer Statement'}
                    {activeTab === 5 && 'Detailed Pricing Metrics Sheet'}
                    {activeTab === 6 && 'Core Product Specification Log'}
                    {activeTab === 7 && 'Category-Wise Stock Valuation Ledger'}
                    {activeTab === 8 && 'Location Stock Breakdown Statement'}
                </b></span>
                {(activeTab === 1 || activeTab === 4) && filters.dateFrom && filters.dateTo && (
                    <span className="font-bold text-primary">
                        Date Period: {filters.dateFrom} to {filters.dateTo}
                    </span>
                )}
                <span>
                    {(activeTab === 3 || activeTab === 8) && filters.asOfDate
                        ? `Audit Evaluation Date (As Of): ${filters.asOfDate}`
                        : `Live Audit Evaluation Date: ${new Date().toLocaleDateString()}`}
                </span>
            </div>
        </div>
    );
};
