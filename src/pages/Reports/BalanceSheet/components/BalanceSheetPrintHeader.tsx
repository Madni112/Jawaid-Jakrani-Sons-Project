import React from 'react';
import { getBrandConfig } from '../../../../utils/brand';

interface BalanceSheetPrintHeaderProps {
  businessName?: string;
  activePerspective: 'summary' | 'balance_sheet';
  asOfDate: string;
}

export const BalanceSheetPrintHeader: React.FC<BalanceSheetPrintHeaderProps> = ({
  businessName,
  activePerspective,
  asOfDate,
}) => {
  return (
    <div className="hidden print:block relative text-center mb-4 border-b-2 border-black pb-3">
      <div className="absolute left-2 top-0">
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
      <h1 className="text-3xl font-black text-slate-950 uppercase tracking-widest font-serif">
        {businessName || getBrandConfig().fullName}
      </h1>
      <h2 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest font-mono mt-1">
        {activePerspective === 'summary'
          ? 'COMMERCIAL EXECUTIVE SUMMARY & FINANCIAL TRAJECTORY STATEMENT'
          : 'CORPORATE GAAP BALANCE SHEET FINANCIAL STATEMENT'}
      </h2>
      <div className="flex justify-between items-center text-xs text-gray-700 font-mono mt-2 pt-1 border-t border-gray-300">
        <span>
          Audit Perspective: <b>{activePerspective.toUpperCase().replace('_', ' ')}</b>
        </span>
        <span>
          Accounting Standard: <b>GAAP (Assets = Liabilities + Equity)</b>
        </span>
        <span>
          Cutoff As Of Date: <b>{asOfDate}</b>
        </span>
      </div>
    </div>
  );
};

export default BalanceSheetPrintHeader;
