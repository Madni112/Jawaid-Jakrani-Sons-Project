import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MdAdd, MdClose, MdKeyboardArrowDown } from 'react-icons/md';

export interface LooseTier {
  id?: string;
  uom: string;
  ratio: number | string;
  costPrice?: number | string;
  salePrice?: number | string;
}

export interface ChainedUomInputGridProps {
  primaryUom: string;
  primaryQuantity: number;
  primaryRate: number;
  tiers: LooseTier[];
  tierQuantities?: Record<string, number>;
  tierRates?: Record<string, number>;
  mode?: 'sale' | 'purchase';
  disabled?: boolean;
  onChange: (data: {
    primaryQuantity: number;
    tierQuantities: Record<string, number>;
    tierRates: Record<string, number>;
    totalConvertedPrimaryQty: number;
    totalLineAmount: number;
  }) => void;
}

interface LevelDef {
  uom: string;
  cumulativeRatio: number; // units of this UOM per 1 base primary UOM
  defaultRate: number;
}

interface ActiveRow {
  id: string;
  uom: string;
}

export const ChainedUomInputGrid: React.FC<ChainedUomInputGridProps> = ({
  primaryUom = 'PCS',
  primaryQuantity = 0,
  primaryRate = 0,
  tiers = [],
  tierQuantities = {},
  tierRates = {},
  mode = 'sale',
  disabled = false,
  onChange
}) => {
  // Build entire linear hierarchy of available levels: Base + all chained tiers
  const allLevels: LevelDef[] = useMemo(() => {
    const baseCode = String(primaryUom || 'PCS').trim().toUpperCase();
    const list: LevelDef[] = [
      {
        uom: baseCode,
        cumulativeRatio: 1,
        defaultRate: Number(primaryRate) || 0
      }
    ];

    let runningRatio = 1;
    (tiers || []).forEach(t => {
      const u = String(t.uom || '').trim().toUpperCase();
      const r = Number(t.ratio) || 1;
      if (!u || r <= 0) return;
      runningRatio = runningRatio * r;
      const rate = mode === 'sale'
        ? (Number(t.salePrice) > 0 ? Number(t.salePrice) : (Number(primaryRate) / runningRatio))
        : (Number(t.costPrice) > 0 ? Number(t.costPrice) : (Number(primaryRate) / runningRatio));

      list.push({
        uom: u,
        cumulativeRatio: runningRatio,
        defaultRate: Number(rate.toFixed(4))
      });
    });

    return list;
  }, [primaryUom, primaryRate, tiers, mode]);

  // Track active rows: always starts with row 0 (primary UOM by default, but changeable)
  const [activeRows, setActiveRows] = useState<ActiveRow[]>(() => {
    const initial: ActiveRow[] = [{ id: 'row-0', uom: allLevels[0]?.uom || 'PCS' }];
    // If incoming tierQuantities already has non-zero loose units, activate them
    if (tierQuantities && typeof tierQuantities === 'object') {
      Object.keys(tierQuantities).forEach((k, idx) => {
        const uUpper = k.toUpperCase();
        if (uUpper !== initial[0].uom && Number(tierQuantities[k]) > 0) {
          initial.push({ id: `row-init-${idx + 1}`, uom: uUpper });
        }
      });
    }
    return initial;
  });

  const nextDropdownRef = useRef<HTMLSelectElement | null>(null);
  const shouldFocusNext = useRef(false);

  useEffect(() => {
    if (shouldFocusNext.current && nextDropdownRef.current) {
      nextDropdownRef.current.focus();
      shouldFocusNext.current = false;
    }
  }, [activeRows]);

  // Helper to recompute totals
  const recalculateAndNotify = (
    currentRows: ActiveRow[],
    updatedQtys: Record<string, number>,
    updatedRates: Record<string, number>
  ) => {
    let totalBaseQty = 0;
    let totalLineAmount = 0;

    currentRows.forEach(row => {
      const q = Number(updatedQtys[row.uom]) || 0;
      if (q > 0) {
        const lvl = allLevels.find(l => l.uom === row.uom) || {
          uom: row.uom,
          cumulativeRatio: 1,
          defaultRate: 0
        };
        totalBaseQty += q / lvl.cumulativeRatio;
        const activeRate = updatedRates[row.uom] !== undefined
          ? Number(updatedRates[row.uom])
          : lvl.defaultRate;
        totalLineAmount += q * activeRate;
      }
    });

    // Primary quantity is whatever is in the first active row if it's base, else converted
    const firstRowUom = currentRows[0]?.uom;
    const isFirstBase = firstRowUom === allLevels[0]?.uom;

    onChange({
      primaryQuantity: isFirstBase ? (Number(updatedQtys[firstRowUom]) || 0) : Number(totalBaseQty.toFixed(4)),
      tierQuantities: updatedQtys,
      tierRates: updatedRates,
      totalConvertedPrimaryQty: Number(totalBaseQty.toFixed(5)),
      totalLineAmount: Number(totalLineAmount.toFixed(2))
    });
  };

  const handleQtyChange = (uom: string, rawVal: string) => {
    const val = rawVal === '' ? 0 : parseFloat(rawVal) || 0;
    const updatedQtys = { ...tierQuantities, [uom]: val };
    recalculateAndNotify(activeRows, updatedQtys, tierRates);
  };

  const handleRateChange = (uom: string, rawVal: string) => {
    const val = rawVal === '' ? 0 : parseFloat(rawVal) || 0;
    const updatedRates = { ...tierRates, [uom]: val };
    recalculateAndNotify(activeRows, tierQuantities, updatedRates);
  };

  const handleRowUomChange = (rowIdx: number, newUom: string) => {
    const oldUom = activeRows[rowIdx]?.uom;
    const newRows = [...activeRows];
    newRows[rowIdx] = { ...newRows[rowIdx], uom: newUom };
    setActiveRows(newRows);

    const updatedQtys = { ...tierQuantities };
    if (oldUom && oldUom !== newUom && updatedQtys[oldUom]) {
      updatedQtys[newUom] = updatedQtys[oldUom];
      delete updatedQtys[oldUom];
    }

    const updatedRates = { ...tierRates };
    if (!updatedRates[newUom]) {
      const lvl = allLevels.find(l => l.uom === newUom);
      if (lvl) updatedRates[newUom] = lvl.defaultRate;
    }

    recalculateAndNotify(newRows, updatedQtys, updatedRates);
  };

  const handleAddLooseRow = () => {
    // Determine which UOMs are not yet chosen
    const usedUoms = new Set(activeRows.map(r => r.uom));
    const nextAvail = allLevels.find(l => !usedUoms.has(l.uom));
    const nextUom = nextAvail ? nextAvail.uom : (allLevels[1]?.uom || 'LTR');

    const newRowId = `row-${Date.now()}`;
    const newRows = [...activeRows, { id: newRowId, uom: nextUom }];
    setActiveRows(newRows);
    shouldFocusNext.current = true;

    const updatedRates = { ...tierRates };
    if (!updatedRates[nextUom]) {
      const lvl = allLevels.find(l => l.uom === nextUom);
      if (lvl) updatedRates[nextUom] = lvl.defaultRate;
    }

    recalculateAndNotify(newRows, tierQuantities, updatedRates);
  };

  const handleRemoveRow = (rowIdx: number) => {
    const rowToRemove = activeRows[rowIdx];
    const newRows = activeRows.filter((_, idx) => idx !== rowIdx);
    setActiveRows(newRows);

    const updatedQtys = { ...tierQuantities };
    if (rowToRemove) {
      delete updatedQtys[rowToRemove.uom];
    }

    recalculateAndNotify(newRows, updatedQtys, tierRates);
  };

  const hasMoreTiersAvailable = activeRows.length < allLevels.length;

  return (
    <div className="flex flex-col gap-2 w-full min-w-[210px] max-w-[260px]">
      {/* Dynamic Rows */}
      {activeRows.map((row, rIdx) => {
        const lvl = allLevels.find(l => l.uom === row.uom) || {
          uom: row.uom,
          cumulativeRatio: 1,
          defaultRate: 0
        };
        const currentQty = tierQuantities[row.uom] !== undefined
          ? (tierQuantities[row.uom] === 0 ? '' : tierQuantities[row.uom])
          : (rIdx === 0 && primaryQuantity > 0 ? primaryQuantity : '');

        const currentRate = tierRates[row.uom] !== undefined
          ? tierRates[row.uom]
          : lvl.defaultRate;

        const isLastRow = rIdx === activeRows.length - 1;

        return (
          <div key={row.id} className="flex flex-col gap-1">
            {/* Pill Capsule: [ Qty ] | [ UOM Dropdown ] [ ✕ ] */}
            <div className="flex items-center gap-1">
              <div className="flex-1 flex items-center bg-white dark:bg-meta-4 border border-slate-300 dark:border-strokedark rounded-xl shadow-2xs overflow-hidden focus-within:border-primary transition">
                {/* Quantity Input */}
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={disabled}
                  placeholder="0"
                  value={currentQty}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                      handleQtyChange(row.uom, raw);
                    }
                  }}
                  className="w-full py-1.5 px-2 text-sm font-mono font-bold text-slate-900 dark:text-white bg-transparent outline-none text-center"
                />

                {/* Vertical Divider Line | */}
                <div className="w-[1px] h-6 bg-slate-300 dark:bg-strokedark shrink-0" />

                {/* UOM Selector Dropdown */}
                <div className="relative shrink-0 flex items-center pr-1.5">
                  <select
                    ref={el => {
                      if (isLastRow && rIdx > 0) nextDropdownRef.current = el;
                    }}
                    disabled={disabled}
                    value={row.uom}
                    onChange={e => handleRowUomChange(rIdx, e.target.value)}
                    className="appearance-none bg-transparent py-1.5 pl-2 pr-5 text-xs font-mono font-black text-slate-800 dark:text-slate-100 outline-none cursor-pointer uppercase"
                  >
                    {allLevels.map(opt => (
                      <option
                        key={opt.uom}
                        value={opt.uom}
                        className="bg-white dark:bg-boxdark text-black dark:text-white font-mono"
                      >
                        {opt.uom}
                      </option>
                    ))}
                  </select>
                  <MdKeyboardArrowDown className="absolute right-1 pointer-events-none text-slate-400 text-sm" />
                </div>
              </div>

              {/* Remove button for sub-tiers */}
              {rIdx > 0 && !disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveRow(rIdx)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shrink-0"
                  title="Remove this loose unit"
                >
                  <MdClose className="text-sm" />
                </button>
              )}
            </div>

            {/* Rate Pill Capsule: [ @ 0.00 ] | [ /UOM ] */}
            <div className="flex items-center bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-xl px-2.5 py-1 text-xs font-mono text-rose-800 dark:text-rose-300 shadow-2xs">
              <span className="text-[11px] font-sans font-bold text-rose-400 mr-1.5">@</span>
              <input
                type="text"
                inputMode="decimal"
                disabled={disabled}
                placeholder="0.00"
                value={currentRate === 0 ? '' : currentRate}
                onChange={e => {
                  const raw = e.target.value;
                  if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                    handleRateChange(row.uom, raw);
                  }
                }}
                className="w-full bg-transparent font-mono font-black text-xs text-rose-700 dark:text-rose-300 outline-none border-b border-dashed border-rose-300 dark:border-rose-700 text-center"
                title={`Editable Rate per ${row.uom}`}
              />
              <div className="w-[1px] h-3.5 bg-rose-200 dark:bg-rose-900/60 mx-1.5 shrink-0" />
              <span className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase select-none shrink-0">
                /{row.uom}
              </span>
            </div>
          </div>
        );
      })}

      {/* Dynamic "+ Loose" Button (Appears if smaller tiers exist to chain) */}
      {hasMoreTiersAvailable && !disabled && (
        <button
          type="button"
          onClick={handleAddLooseRow}
          className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-300/70 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-bold cursor-pointer transition shadow-2xs mt-0.5"
          title="Add another loose sub-unit"
        >
          <MdAdd className="text-xs" />
          <span>+ Loose</span>
        </button>
      )}
    </div>
  );
};

export default ChainedUomInputGrid;
