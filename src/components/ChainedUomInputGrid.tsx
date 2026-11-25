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
  onActiveUomsChange?: (uoms: string[]) => void;
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
  onActiveUomsChange,
  onChange
}) => {
  // Build entire linear hierarchy of available levels: Base + all chained tiers (deduplicated)
  const allLevels: LevelDef[] = useMemo(() => {
    const baseCode = String(primaryUom || 'PCS').trim().toUpperCase();
    const seen = new Set<string>([baseCode]);
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
      if (!u || r <= 0 || seen.has(u)) return;
      seen.add(u);
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
    if (onActiveUomsChange) {
      onActiveUomsChange(activeRows.map(r => r.uom));
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
      primaryQuantity: isFirstBase ? (Number(updatedQtys[firstRowUom]) || 0) : Number(totalBaseQty.toFixed(10)),
      tierQuantities: updatedQtys,
      tierRates: updatedRates,
      totalConvertedPrimaryQty: Number(totalBaseQty.toFixed(10)),
      totalLineAmount: Number(totalLineAmount.toFixed(2))
    });
  };

  const handleQtyChange = (uom: string, rawVal: string) => {
    const val = rawVal === '' ? 0 : parseFloat(rawVal) || 0;
    const updatedQtys = { ...tierQuantities, [uom]: val };
    recalculateAndNotify(activeRows, updatedQtys, tierRates);
  };

  // Dynamic cascading carry-over: rolls excess quantity from any sub-row up into parent rows
  const handleQtyNormalize = (startRowIdx: number) => {
    if (startRowIdx <= 0) return;

    const nextQtys: Record<string, number> = { ...tierQuantities };
    const row0Uom = activeRows[0]?.uom;
    if (row0Uom && nextQtys[row0Uom] === undefined && primaryQuantity > 0) {
      nextQtys[row0Uom] = primaryQuantity;
    }

    let changed = false;

    for (let i = startRowIdx; i >= 1; i--) {
      const childUom = activeRows[i]?.uom;
      const parentUom = activeRows[i - 1]?.uom;
      if (!childUom || !parentUom) continue;

      const childDef = allLevels.find(l => l.uom === childUom);
      const parentDef = allLevels.find(l => l.uom === parentUom);
      if (!childDef || !parentDef || parentDef.cumulativeRatio <= 0) continue;

      const relRatio = childDef.cumulativeRatio / parentDef.cumulativeRatio;
      if (relRatio <= 1) continue;

      const childQty = Number(nextQtys[childUom]) || 0;
      if (childQty >= relRatio) {
        const carry = Math.floor(childQty / relRatio);
        const remainder = Number((childQty % relRatio).toFixed(4));
        nextQtys[childUom] = remainder;
        nextQtys[parentUom] = Number(((Number(nextQtys[parentUom]) || 0) + carry).toFixed(4));
        changed = true;
      }
    }

    if (changed) {
      recalculateAndNotify(activeRows, nextQtys, tierRates);
    }
  };

  const handleRateChange = (uom: string, rawVal: string) => {
    const val = rawVal === '' ? 0 : parseFloat(rawVal) || 0;
    const updatedRates = { ...tierRates, [uom]: val };
    recalculateAndNotify(activeRows, tierQuantities, updatedRates);
  };

  // Helper to sort rows in strict allLevels hierarchy order and remove any invalid/duplicate UOMs
  const sortAndDedupeRows = (rows: ActiveRow[]): ActiveRow[] => {
    const seen = new Set<string>();
    const valid = rows.filter(r => {
      const u = String(r.uom || '').trim().toUpperCase();
      if (!u || seen.has(u)) return false;
      if (!allLevels.some(l => l.uom === u)) return false;
      seen.add(u);
      return true;
    });
    return valid.sort((a, b) => {
      const idxA = allLevels.findIndex(l => l.uom === a.uom);
      const idxB = allLevels.findIndex(l => l.uom === b.uom);
      return idxA - idxB;
    });
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

    newRows = sortAndDedupeRows(newRows);
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
    const newRows = sortAndDedupeRows([...activeRows, { id: newRowId, uom: nextUom }]);
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

          // For sub-tier rows (rIdx > 0), only allow selecting units strictly below the primary unit and not used in other rows
          const otherSelectedUoms = new Set(activeRows.filter((_, idx) => idx !== rIdx).map(r => r.uom));
          const selectableOptions =
            rIdx === 0
              ? allLevels
              : allLevels.slice(primaryIdx + 1).filter(opt => !otherSelectedUoms.has(opt.uom));

          return (
            <div key={row.id} className="flex flex-col gap-1">
              {/* Pill Capsule: [ Qty ] | [ UOM Dropdown ] [ ✕ ] */}
              <div className="flex items-center gap-1">
                <div className="group/capsule flex-1 flex items-center bg-white dark:bg-meta-4 border border-slate-300 dark:border-strokedark rounded-xl shadow-2xs overflow-hidden focus-within:![border-color:var(--color-primary,#0D1540)] focus-within:![box-shadow:0_0_0_2px_color-mix(in_srgb,var(--color-primary,#0D1540)_20%,transparent)] transition-all duration-150">
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
                    onBlur={() => handleQtyNormalize(rIdx)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleQtyNormalize(rIdx);
                      }
                    }}
                    className="w-full py-1.5 px-2 text-sm font-mono font-bold text-slate-900 dark:text-white bg-transparent outline-none text-center focus:![background-color:color-mix(in_srgb,var(--color-primary,#0D1540)_6%,transparent)] transition"
                  />

                  {/* Vertical Divider Line | (follows active theme color when focused) */}
                  <div className="w-[1.5px] h-6 bg-slate-300 dark:bg-strokedark group-focus-within/capsule:![background-color:var(--color-primary,#0D1540)] group-focus-within/capsule:![box-shadow:0_0_8px_color-mix(in_srgb,var(--color-primary,#0D1540)_55%,transparent)] shrink-0 transition-all duration-150" />

                  {/* UOM Selector Dropdown */}
                  <div className="relative shrink-0 flex items-center pr-1.5">
                    <select
                      ref={el => {
                        if (isLastRow && rIdx > 0) nextDropdownRef.current = el;
                      }}
                      disabled={disabled}
                      value={row.uom}
                      onChange={e => handleRowUomChange(rIdx, e.target.value)}
                      className="appearance-none bg-transparent py-1.5 pl-2 pr-5 text-xs font-mono font-black text-slate-800 dark:text-slate-100 outline-none cursor-pointer uppercase focus:![background-color:color-mix(in_srgb,var(--color-primary,#0D1540)_6%,transparent)] transition"
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
                    <MdKeyboardArrowDown className="absolute right-1 pointer-events-none text-slate-400 group-focus-within/capsule:![color:var(--color-primary,#0D1540)] text-sm transition" />
                  </div>
                </div>

                {/* Remove button for sub-tiers */}
                {rIdx > 0 && !disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(rIdx)}
                    className="p-1.5 text-slate-400 hover:![color:var(--color-primary,#0D1540)] rounded-lg hover:![background-color:color-mix(in_srgb,var(--color-primary,#0D1540)_10%,transparent)] transition shrink-0"
                    title="Remove this loose unit"
                  >
                    <MdClose className="text-sm" />
                  </button>
                )}
              </div>

              {/* Rate Pill Capsule: [ @ 0.00 ] | [ /UOM ] */}
              <div
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 8%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 24%, transparent)',
                  color: 'var(--color-primary, #0D1540)',
                }}
                className="group/rate flex items-center border focus-within:![border-color:var(--color-primary,#0D1540)] focus-within:![box-shadow:0_0_0_2px_color-mix(in_srgb,var(--color-primary,#0D1540)_20%,transparent)] rounded-xl px-2.5 py-1 text-xs font-mono shadow-2xs transition-all duration-150"
              >
                <span className="text-[11px] font-sans font-bold opacity-70 group-focus-within/rate:opacity-100 mr-1.5 transition">@</span>
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
                  style={{
                    color: 'var(--color-primary, #0D1540)',
                    borderColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 35%, transparent)',
                  }}
                  className="w-full bg-transparent font-mono font-black text-xs outline-none border-b border-dashed group-focus-within/rate:![border-color:var(--color-primary,#0D1540)] text-center"
                  title={`Editable Rate per ${row.uom}`}
                />
                <div
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 25%, transparent)',
                  }}
                  className="w-[1.5px] h-3.5 group-focus-within/rate:![background-color:var(--color-primary,#0D1540)] group-focus-within/rate:![box-shadow:0_0_6px_color-mix(in_srgb,var(--color-primary,#0D1540)_55%,transparent)] mx-1.5 shrink-0 transition-all duration-150"
                />
                <span className="text-[11px] font-mono font-bold uppercase select-none shrink-0">
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
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 28%, transparent)',
            color: 'var(--color-primary, #0D1540)',
          }}
          className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border hover:opacity-85 text-[11px] font-mono font-bold cursor-pointer transition shadow-2xs mt-0.5"
          title="Add next loose sub-unit"
        >
          <span className="font-bold text-xs">Loose +</span>
        </button>
      )}
    </div>
  );
};

export default ChainedUomInputGrid;
