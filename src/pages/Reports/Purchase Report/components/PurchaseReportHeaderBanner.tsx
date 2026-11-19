import React from 'react';
import { getBrandConfig } from '../../../../utils/brand';

interface PurchaseReportHeaderBannerProps {
  businessName?: string;
  rType: string;
  activeViewMode: 'summary' | 'detailed';
  filters: any;
}

export const PurchaseReportHeaderBanner: React.FC<PurchaseReportHeaderBannerProps> = ({
  businessName,
  rType,
  activeViewMode,
  filters
}) => {
  return (
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
          >ZAC</span>
        </div>
      </div>

      <h1 className="text-3xl font-black uppercase tracking-widest font-serif text-slate-950">
        {businessName || getBrandConfig().fullName}
      </h1>
      <p className="text-xs font-bold tracking-wider text-gray-600 uppercase">
        Master Corporate Procurement Audit &amp; Supplier Accounts Workbook
      </p>
      <div className="text-xs pt-1.5 font-mono flex justify-between px-2 text-gray-700">
        <span>
          Audit Sub-Categorization:{' '}
          <b className="text-black uppercase underline">
            {rType === 'category-purchases' &&
              `Category-Wise Purchases Report${
                activeViewMode === 'detailed' ? ' (Hierarchical Tree Breakdown)' : ' (Summary Matrix)'
              }`}
            {rType === 'product-purchase-history' &&
              `Product Purchase History & Price Trend${
                activeViewMode === 'detailed' ? ' (Itemized Batch Logs)' : ' (SKU Summary)'
              }`}
            {rType === 'purchase-invoice-detail' &&
              `Purchase Invoice Itemized Detail Report${
                activeViewMode === 'detailed' ? ' (All Line Items)' : ' (Invoice Headers)'
              }`}
            {rType === 'return' && 'Purchase Returns & Debit Ledger'}
            {rType === 'purchase-query' && 'Purchase Parameter Query Register'}
            {rType === 'purchase' && 'Purchase Invoice Register'}
          </b>
        </span>
        <span>
          Duration Window Block: {filters.dateFrom || 'Initial'} up to {filters.dateTo || 'Today'}
        </span>
      </div>
    </div>
  );
};

export default PurchaseReportHeaderBanner;
