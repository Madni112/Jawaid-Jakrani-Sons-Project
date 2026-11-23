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
  const [activeRows, setActiveRows] = useState<ActiveRow[]>(() => [
    { id: 'row-0', uom: allLevels[0]?.uom || 'PCS' }
  ]);

  // When primaryUom, primaryRate or tiers change (e.g. user selects a different product), reset active rows
  useEffect(() => {
    const baseUom = allLevels[0]?.uom || 'PCS';
    const initial: ActiveRow[] = [{ id: 'row-0', uom: baseUom }];
    const seenUoms = new Set<string>([baseUom]);

    if (tierQuantities && typeof tierQuantities === 'object') {
      Object.keys(tierQuantities).forEach((k, idx) => {
        const uUpper = k.toUpperCase();
        if (!seenUoms.has(uUpper) && Number(tierQuantities[k]) > 0) {
          seenUoms.add(uUpper);
          initial.push({ id: `row-init-${idx + 1}`, uom: uUpper });
        }
      });
    }
    setActiveRows(initial);
  }, [primaryUom, primaryRate, JSON.stringify(tiers)]);

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
    let newRows = [...activeRows];
    newRows[rowIdx] = { ...newRows[rowIdx], uom: newUom };

    // If changing the primary (first) row, only allow sub-units that strictly follow it in the chain
    if (rowIdx === 0) {
      const primaryLevelIdx = allLevels.findIndex(l => l.uom === newUom);
      const validSubUoms = primaryLevelIdx >= 0 ? allLevels.slice(primaryLevelIdx + 1).map(l => l.uom) : [];
      const seen = new Set<string>([newUom]);
      const filtered = [newRows[0]];
      activeRows.slice(1).forEach(r => {
        if (validSubUoms.includes(r.uom) && !seen.has(r.uom)) {
          seen.add(r.uom);
          filtered.push(r);
        }
      });
      newRows = filtered;
    }

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

  // Determine which sub-units can still be added below the primary unit
  const primaryUomSelected = activeRows[0]?.uom || allLevels[0]?.uom;
  const primaryIdx = allLevels.findIndex(l => l.uom === primaryUomSelected);
  const remainingAllowedLevels = primaryIdx >= 0 ? allLevels.slice(primaryIdx + 1) : [];
  const usedSubUoms = new Set(activeRows.slice(1).map(r => r.uom));
  const availableSubLevels = remainingAllowedLevels.filter(l => !usedSubUoms.has(l.uom));
  const canAddMoreLoose = availableSubLevels.length > 0;

  const handleAddLooseRow = () => {
    if (!canAddMoreLoose) return;

    // Pick the very next unused sub-tier in hierarchical order
    const nextAvail = availableSubLevels[0];
    if (!nextAvail) return;
    const nextUom = nextAvail.uom;

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
    <div className="flex flex-col gap-2 w-full min-w-[280px]">
      {/* Dynamic 2-inputs-per-row grid */}
      <div className="grid grid-cols-2 gap-2">
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

          // For sub-tier rows (rIdx > 0), only allow selecting units that are strictly below the primary unit
          const selectableOptions =
            rIdx === 0
              ? allLevels
              : allLevels.slice(primaryIdx + 1);

          return (
            <div key={row.id} className="flex flex-col gap-1">
              {/* Pill Capsule: [ Qty ] | [ UOM Dropdown ] [ ✕ ] */}
              <div className="flex items-center gap-1">
                <div className="group/capsule flex-1 flex items-center bg-white dark:bg-meta-4 border border-slate-300 dark:border-strokedark rounded-xl shadow-2xs overflow-hidden focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all duration-150">
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
                    className="w-full py-1.5 px-2 text-sm font-mono font-bold text-slate-900 dark:text-white bg-transparent outline-none text-center focus:bg-rose-50/30 dark:focus:bg-rose-950/20 transition"
                  />

                  {/* Vertical Divider Line | (turns vibrant red when focused) */}
                  <div className="w-[1.5px] h-6 bg-slate-300 dark:bg-strokedark group-focus-within/capsule:bg-rose-500 group-focus-within/capsule:shadow-[0_0_8px_rgba(244,63,94,0.6)] shrink-0 transition-all duration-150" />

                  {/* UOM Selector Dropdown */}
                  <div className="relative shrink-0 flex items-center pr-1.5">
                    <select
                      ref={el => {
                        if (isLastRow && rIdx > 0) nextDropdownRef.current = el;
                      }}
                      disabled={disabled}
                      value={row.uom}
                      onChange={e => handleRowUomChange(rIdx, e.target.value)}
                      className="appearance-none bg-transparent py-1.5 pl-2 pr-5 text-xs font-mono font-black text-slate-800 dark:text-slate-100 outline-none cursor-pointer uppercase focus:bg-rose-50/30 dark:focus:bg-rose-950/20 transition"
                    >
                      {selectableOptions.map(opt => (
                        <option
                          key={opt.uom}
                          value={opt.uom}
                          className="bg-white dark:bg-boxdark text-black dark:text-white font-mono"
                        >
                          {opt.uom}
                        </option>
                      ))}
                    </select>
                    <MdKeyboardArrowDown className="absolute right-1 pointer-events-none text-slate-400 group-focus-within/capsule:text-rose-500 text-sm transition" />
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
              <div className="group/rate flex items-center bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 rounded-xl px-2.5 py-1 text-xs font-mono text-rose-800 dark:text-rose-300 shadow-2xs transition-all duration-150">
                <span className="text-[11px] font-sans font-bold text-rose-400 group-focus-within/rate:text-rose-600 mr-1.5 transition">@</span>
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
                  className="w-full bg-transparent font-mono font-black text-xs text-rose-700 dark:text-rose-300 outline-none border-b border-dashed border-rose-300 dark:border-rose-700 group-focus-within/rate:border-rose-500 text-center"
                  title={`Editable Rate per ${row.uom}`}
                />
                <div className="w-[1.5px] h-3.5 bg-rose-200 dark:bg-rose-900/60 group-focus-within/rate:bg-rose-500 group-focus-within/rate:shadow-[0_0_6px_rgba(244,63,94,0.6)] mx-1.5 shrink-0 transition-all duration-150" />
                <span className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase select-none shrink-0">
                  /{row.uom}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic "+ Loose" Button (Only shows if more chained sub-units exist below the current selection) */}
      {!disabled && canAddMoreLoose && (
        <button
          type="button"
          onClick={handleAddLooseRow}
          className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-300/70 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-bold cursor-pointer transition shadow-2xs mt-0.5"
          title="Add next loose sub-unit"
        >
          <span className="font-bold text-xs">Loose +</span>
        </button>
      )}
    </div>
  );
};

export default ChainedUomInputGrid;
