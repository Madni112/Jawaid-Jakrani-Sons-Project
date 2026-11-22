import React from 'react';

export interface UomTierLevel {
  uom: string;
  ratio: number; // Ratio relative to immediate parent (e.g. 1 Drum = 100 LTR => ratio: 100)
  cumulativeRatio: number; // Ratio relative to primary unit (e.g. 1 Drum = 100,000 ML => cumulativeRatio: 100000)
  unitCost?: number;
  unitPrice?: number;
}

export interface ChainedUomInputGridProps {
  primaryUom: string;
  primaryQuantity: number;
  primaryRate: number;
  tiers?: Array<{
    uom: string;
    ratio: number | string;
    costPrice?: number | string;
    salePrice?: number | string;
  }>;
  // Per-tier user entered quantities: { [uom]: number }
  tierQuantities?: Record<string, number>;
  // Per-tier custom rates (optional overrides): { [uom]: number }
  tierRates?: Record<string, number>;
  mode?: 'cost' | 'sale';
  isRTL?: boolean;
  disabled?: boolean;
  onChange: (data: {
    primaryQuantity: number;
    tierQuantities: Record<string, number>;
    tierRates: Record<string, number>;
    totalConvertedPrimaryQty: number;
    totalLineAmount: number;
  }) => void;
}

export const ChainedUomInputGrid: React.FC<ChainedUomInputGridProps> = ({
  primaryUom,
  primaryQuantity,
  primaryRate,
  tiers = [],
  tierQuantities = {},
  tierRates = {},
  mode = 'cost',
  isRTL = false,
  disabled = false,
  onChange
}) => {
  // Normalize tiers with cumulative conversion ratios
  const normalizedLevels: UomTierLevel[] = React.useMemo(() => {
    const list: UomTierLevel[] = [];
    
    // Level 0: Primary UOM
    list.push({
      uom: (primaryUom || 'Unit').toUpperCase(),
      ratio: 1,
      cumulativeRatio: 1,
      unitCost: primaryRate,
      unitPrice: primaryRate
    });

    let runningCumRatio = 1;
    (tiers || []).forEach(t => {
      const u = String(t.uom || '').trim().toUpperCase();
      const r = Number(t.ratio) || 1;
      if (!u || r <= 0) return;
      runningCumRatio = runningCumRatio * r;
      const rate = mode === 'sale' 
        ? (Number(t.salePrice) || (primaryRate / runningCumRatio)) 
        : (Number(t.costPrice) || (primaryRate / runningCumRatio));
      
      list.push({
        uom: u,
        ratio: r,
        cumulativeRatio: runningCumRatio,
        unitCost: rate,
        unitPrice: rate
      });
    });

    return list;
  }, [primaryUom, primaryRate, tiers, mode]);

  // If there are no loose tiers defined, show clean single input
  if (normalizedLevels.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 w-full">
        <input
          type="number"
          min="0"
          step="any"
          disabled={disabled}
          value={primaryQuantity || ''}
          onChange={e => {
            const val = parseFloat(e.target.value) || 0;
            onChange({
              primaryQuantity: val,
              tierQuantities: {},
              tierRates: {},
              totalConvertedPrimaryQty: val,
              totalLineAmount: Number((val * primaryRate).toFixed(2))
            });
          }}
          placeholder="0"
          className="w-full rounded border border-stroke bg-white dark:bg-meta-4 py-1.5 px-2 font-mono text-center outline-none focus:border-primary dark:border-strokedark font-medium text-xs"
        />
        <span className="text-[10px] font-bold text-gray-500 uppercase font-mono px-1">
          {primaryUom || 'PCS'}
        </span>
      </div>
    );
  }

  // Multi-tier chained 2-inputs-per-row grid
  const handleQtyChange = (uom: string, val: number) => {
    const updatedQtys = { ...tierQuantities, [uom]: val };
    
    // Recalculate total primary quantity & total amount
    let totalPrimary = 0;
    let totalAmount = 0;

    normalizedLevels.forEach(lvl => {
      const q = Number(updatedQtys[lvl.uom]) || 0;
      if (q > 0) {
        totalPrimary += q / lvl.cumulativeRatio;
        const activeRate = Number(tierRates[lvl.uom]) || Number(lvl.unitCost || lvl.unitPrice || 0);
        totalAmount += q * activeRate;
      }
    });

    onChange({
      primaryQuantity: Number(updatedQtys[normalizedLevels[0].uom]) || 0,
      tierQuantities: updatedQtys,
      tierRates,
      totalConvertedPrimaryQty: Number(totalPrimary.toFixed(5)),
      totalLineAmount: Number(totalAmount.toFixed(2))
    });
  };

  const handleRateChange = (uom: string, val: number) => {
    const updatedRates = { ...tierRates, [uom]: val };
    
    let totalPrimary = 0;
    let totalAmount = 0;

    normalizedLevels.forEach(lvl => {
      const q = Number(tierQuantities[lvl.uom]) || 0;
      if (q > 0) {
        totalPrimary += q / lvl.cumulativeRatio;
        const activeRate = Number(updatedRates[lvl.uom]) || Number(lvl.unitCost || lvl.unitPrice || 0);
        totalAmount += q * activeRate;
      }
    });

    onChange({
      primaryQuantity: Number(tierQuantities[normalizedLevels[0].uom]) || 0,
      tierQuantities,
      tierRates: updatedRates,
      totalConvertedPrimaryQty: Number(totalPrimary.toFixed(5)),
      totalLineAmount: Number(totalAmount.toFixed(2))
    });
  };

  return (
    <div className="space-y-1.5 w-full min-w-[200px]">
      {/* 2-inputs-per-row grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {normalizedLevels.map((lvl) => {
          const currentQty = tierQuantities[lvl.uom] !== undefined ? tierQuantities[lvl.uom] : '';
          const currentRate = tierRates[lvl.uom] !== undefined 
            ? tierRates[lvl.uom] 
            : Number((lvl.unitCost || lvl.unitPrice || 0).toFixed(2));

          return (
            <div
              key={lvl.uom}
              className="flex items-center rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-meta-4 overflow-hidden shadow-2xs focus-within:border-primary transition"
            >
              <input
                type="number"
                min="0"
                step="any"
                disabled={disabled}
                placeholder="0"
                value={currentQty}
                onChange={e => handleQtyChange(lvl.uom, parseFloat(e.target.value) || 0)}
                className="w-full py-1 px-1.5 text-xs font-mono font-bold text-center bg-transparent outline-none text-slate-800 dark:text-slate-100"
                title={`Enter quantity in ${lvl.uom}`}
              />
              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-1 text-[10px] font-black text-primary border-l border-stroke dark:border-strokedark font-mono uppercase select-none">
                {lvl.uom}
              </span>
            </div>
          );
        })}
      </div>

      {/* Matching Cascading Rates Row (Compact Display / Editable) */}
      <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono text-gray-500">
        {normalizedLevels.map((lvl) => {
          const rateVal = tierRates[lvl.uom] !== undefined 
            ? tierRates[lvl.uom] 
            : Number((lvl.unitCost || lvl.unitPrice || 0).toFixed(2));
          return (
            <span
              key={lvl.uom}
              className="bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/20"
              title={`Rate per ${lvl.uom}`}
            >
              @ {rateVal}/{lvl.uom}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default ChainedUomInputGrid;
