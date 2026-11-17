import React from 'react';

interface HoldingReportKpiCardsProps {
  kpis: {
    totalItems: number;
    totalHeldQty: number;
    totalOrderQty: number;
    totalHeldValue: number;
  };
}

export const HoldingReportKpiCards: React.FC<HoldingReportKpiCardsProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="border border-black bg-gray-50 p-2.5 rounded text-center">
        <div className="text-[10px] uppercase font-bold text-gray-600">Holding Line Items</div>
        <div className="text-base font-black font-mono text-black">{kpis.totalItems} Items</div>
      </div>
      <div className="border border-black bg-gray-50 p-2.5 rounded text-center">
        <div className="text-[10px] uppercase font-bold text-gray-600">Pending Held Units</div>
        <div className="text-base font-black font-mono text-amber-900">
          {kpis.totalHeldQty.toLocaleString()} Units
        </div>
      </div>
      <div className="border border-black bg-gray-50 p-2.5 rounded text-center">
        <div className="text-[10px] uppercase font-bold text-gray-600">Total Order Volume</div>
        <div className="text-base font-black font-mono text-primary">
          {kpis.totalOrderQty.toLocaleString()} Units
        </div>
      </div>
      <div className="border border-black bg-gray-50 p-2.5 rounded text-center">
        <div className="text-[10px] uppercase font-bold text-gray-600">Total Held Valuation</div>
        <div className="text-base font-black font-mono text-emerald-800">
          Rs. {kpis.totalHeldValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};

export default HoldingReportKpiCards;
