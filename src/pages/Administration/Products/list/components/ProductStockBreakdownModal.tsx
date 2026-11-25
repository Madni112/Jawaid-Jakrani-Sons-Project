import React from 'react';
import { MdInfoOutline, MdClose } from 'react-icons/md';
import Spinner from '../../../../../ui/Spinner';
import { ProductCatalogItem } from '../types/productListTypes';
import {
  decomposeStockIntoChain,
  getProductLooseChainText,
  LooseChainBadge,
} from '../../../../../utils/looseUomHelpers';

interface ProductStockBreakdownModalProps {
  selectedStockBreakdown: ProductCatalogItem | null;
  onClose: () => void;
  selectedModalWarehouse: string;
  setSelectedModalWarehouse: (wh: string) => void;
  masterLocations: string[];
}

export const ProductStockBreakdownModal: React.FC<ProductStockBreakdownModalProps> = ({
  selectedStockBreakdown,
  onClose,
  selectedModalWarehouse,
  setSelectedModalWarehouse,
  masterLocations,
}) => {
  const [selectedViewUom, setSelectedViewUom] = React.useState<string>('ALL');

  React.useEffect(() => {
    setSelectedViewUom('ALL');
  }, [selectedStockBreakdown?.id, selectedStockBreakdown?.product_name]);

  const uomOptions = React.useMemo(() => {
    if (!selectedStockBreakdown) return [];
    const baseUom = String(selectedStockBreakdown.uom || 'PCS').trim().toUpperCase();
    const seen = new Set<string>([baseUom]);
    const list: { uom: string; cumulativeRatio: number }[] = [{ uom: baseUom, cumulativeRatio: 1 }];

    const multi = Array.isArray(selectedStockBreakdown.multi_loose_units)
      ? selectedStockBreakdown.multi_loose_units
      : [];

    if (multi.length > 0) {
      let runningRatio = 1;
      multi.forEach((t: any) => {
        const u = String(t?.uom || '').trim().toUpperCase();
        const r = Number(t?.ratio) || 0;
        if (!u || r <= 0 || seen.has(u)) return;
        seen.add(u);
        runningRatio *= r;
        list.push({ uom: u, cumulativeRatio: runningRatio });
      });
    } else if (
      selectedStockBreakdown.allow_loose_sales &&
      selectedStockBreakdown.loose_uom &&
      Number(selectedStockBreakdown.loose_conversion_ratio || 0) > 1
    ) {
      const u = String(selectedStockBreakdown.loose_uom).trim().toUpperCase();
      if (u && !seen.has(u)) {
        list.push({ uom: u, cumulativeRatio: Number(selectedStockBreakdown.loose_conversion_ratio) });
      }
    }

    return list;
  }, [selectedStockBreakdown]);

  if (!selectedStockBreakdown) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] border border-slate-200 dark:border-strokedark overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-strokedark bg-slate-50 dark:bg-meta-4/30">
          <div className="flex items-center gap-3 min-w-0">
            <div
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 12%, transparent)',
                color: 'var(--color-primary, #0D1540)',
              }}
              className="p-2.5 rounded-xl"
            >
              <MdInfoOutline size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight">
                  Stock Breakdown
                </h3>
                {selectedStockBreakdown.item_sr_no && (
                  <span className="text-[10px] font-mono font-bold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                    SKU: {selectedStockBreakdown.item_sr_no}
                  </span>
                )}
                {selectedStockBreakdown.category && (
                  <span
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 10%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 25%, transparent)',
                      color: 'var(--color-primary, #0D1540)',
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded border"
                  >
                    {selectedStockBreakdown.category}
                  </span>
                )}
              </div>
              <p
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate mt-1 flex items-center gap-2"
                title={selectedStockBreakdown.product_name}
              >
                <span>{selectedStockBreakdown.product_name}</span>
                <LooseChainBadge product={selectedStockBreakdown} />
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
            title="Close"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Warehouse Switcher */}
        <div className="px-6 pt-3.5 pb-2.5 bg-slate-50/50 dark:bg-meta-4/10 border-b border-slate-100 dark:border-strokedark/50">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Select Location:
            </label>
            <div className="flex items-center gap-3">
              {uomOptions.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">View UOM:</span>
                  <select
                    value={selectedViewUom}
                    onChange={(e) => setSelectedViewUom(e.target.value)}
                    style={{
                      borderColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 35%, transparent)',
                      color: 'var(--color-primary, #0D1540)',
                    }}
                    className="rounded-lg border bg-white dark:bg-boxdark px-2 py-0.5 text-[11px] font-mono font-bold outline-none cursor-pointer shadow-2xs"
                    title="Convert all breakdown figures to a specific UOM"
                  >
                    <option value="ALL">All (Compound)</option>
                    {uomOptions.map((opt) => (
                      <option key={opt.uom} value={opt.uom}>
                        {opt.uom}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <span className="text-[11px] text-slate-400 font-medium">
                Active Filter: <strong className="text-slate-700 dark:text-slate-200">{selectedModalWarehouse}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
            {(() => {
              const hasUnassigned = Object.keys(selectedStockBreakdown.warehouseBreakdowns || {}).includes(
                'Global / Unassigned'
              );
              const tabs = [
                'ALL',
                ...masterLocations.filter((m) => m),
                ...(hasUnassigned ? ['Global / Unassigned'] : []),
              ];
              const uniqueTabs = Array.from(new Set(tabs));

              return uniqueTabs.map((tab) => {
                const isSelected = selectedModalWarehouse === tab;
                const whData =
                  tab === 'ALL'
                    ? selectedStockBreakdown.breakdown
                    : selectedStockBreakdown.warehouseBreakdowns?.[tab];
                const whAvail = whData?.available;

                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedModalWarehouse(tab)}
                    style={
                      isSelected
                        ? {
                            backgroundColor: 'var(--color-primary, #0D1540)',
                            borderColor: 'var(--color-primary, #0D1540)',
                            color: '#ffffff',
                          }
                        : undefined
                    }
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'shadow-sm'
                        : 'bg-white dark:bg-boxdark border-slate-200 dark:border-strokedark text-slate-600 dark:text-slate-300 hover:![border-color:color-mix(in_srgb,var(--color-primary,#0D1540)_45%,transparent)] hover:![color:var(--color-primary,#0D1540)]'
                    }`}
                  >
                    <span>{tab === 'Global / Unassigned' ? 'Unassigned' : tab}</span>
                    {whAvail !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {whAvail > 0 ? Number(whAvail).toLocaleString() : '0'}
                      </span>
                    )}
                  </button>
                );
              });
            })()}
          </div>
        </div>

        {(() => {
          if (selectedStockBreakdown._loading) {
            return (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <Spinner size="w-8 h-8" color="border-emerald-600" />
                <span className="text-xs text-slate-500 font-semibold">Loading stock ledger details...</span>
              </div>
            );
          }
          const isTile = Boolean(
            String(selectedStockBreakdown.uom || '').toLowerCase().includes('box') ||
              ((String(selectedStockBreakdown.category || '').toLowerCase().includes('tile') ||
                String(selectedStockBreakdown.scenario_name || '').toLowerCase().includes('tile')) &&
                (Number(selectedStockBreakdown.pieces_per_box || selectedStockBreakdown.pcs_per_box || 0) > 1 ||
                  String(selectedStockBreakdown.scenario_name || '').toLowerCase().includes('tile')))
          );
          const isLoose = Boolean(
            selectedStockBreakdown.allow_loose_sales ||
              Number(selectedStockBreakdown.loose_conversion_ratio || 0) > 1 ||
              isTile
          );
          const uomLabel = selectedStockBreakdown.uom || (isTile ? 'Boxes' : 'PCS');
          const looseChainSummary = getProductLooseChainText(selectedStockBreakdown);

          const formatVal = (val: number) => {
            const num = Number(val) || 0;

            if (selectedViewUom !== 'ALL') {
              const targetOpt = uomOptions.find((o) => o.uom === selectedViewUom);
              const ratio = targetOpt?.cumulativeRatio || 1;
              const converted = Number((num * ratio).toFixed(4));
              return (
                <span
                  className={`font-bold font-mono ${
                    num > 0
                      ? 'text-slate-800 dark:text-slate-100'
                      : num < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {converted.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedViewUom}
                </span>
              );
            }

            const decomposed = decomposeStockIntoChain(num, uomLabel, selectedStockBreakdown);

            if (decomposed.hasLoose) {
              const basePart = decomposed.parts[0];
              const decomposedSubMap = new Map(
                decomposed.parts.slice(1).map((p) => [p.uom.toUpperCase(), p.qty])
              );
              // Always show all UOM tier pills in compound view, even when stock is a whole number
              const allSubParts =
                uomOptions.length > 1
                  ? uomOptions.slice(1).map((opt) => ({
                      uom: opt.uom,
                      qty: decomposedSubMap.get(opt.uom.toUpperCase()) ?? 0,
                    }))
                  : decomposed.parts.slice(1);

              return (
                <div className="text-right flex flex-col items-end leading-tight">
                  <span
                    className={`font-bold font-mono ${
                      num > 0
                        ? 'text-slate-800 dark:text-slate-100'
                        : num < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {basePart ? `${basePart.qty.toLocaleString()} ${basePart.uom}` : `0 ${uomLabel}`}
                  </span>
                  {allSubParts.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap justify-end mt-0.5">
                      {allSubParts.map((sp, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            backgroundColor:
                              sp.qty > 0
                                ? 'color-mix(in srgb, var(--color-primary, #0D1540) 12%, transparent)'
                                : 'color-mix(in srgb, var(--color-primary, #0D1540) 5%, transparent)',
                            borderColor:
                              sp.qty > 0
                                ? 'color-mix(in srgb, var(--color-primary, #0D1540) 30%, transparent)'
                                : 'color-mix(in srgb, var(--color-primary, #0D1540) 15%, transparent)',
                            color: 'var(--color-primary, #0D1540)',
                          }}
                          className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                            sp.qty === 0 ? 'opacity-65' : ''
                          }`}
                        >
                          +{sp.qty.toLocaleString()} {sp.uom}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <span
                className={`font-bold font-mono ${
                  num > 0
                    ? 'text-slate-800 dark:text-slate-100'
                    : num < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {num.toLocaleString(undefined, { maximumFractionDigits: 2 })} {uomLabel}
              </span>
            );
          };

          const bData =
            selectedModalWarehouse === 'ALL'
              ? selectedStockBreakdown.breakdown || {}
              : selectedStockBreakdown.warehouseBreakdowns?.[selectedModalWarehouse] || {
                  opening: 0,
                  purchased: 0,
                  sold: 0,
                  salesReturned: 0,
                  purchaseReturned: 0,
                  hold: 0,
                  available: 0,
                  onHand: 0,
                };

          return (
            <>
              <div className="p-6 flex flex-col gap-4 font-sans overflow-y-auto flex-1 min-h-0">
                {/* Top Hero Cards: Available Stock & Physical On-Hand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 p-4 rounded-xl border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                        Available Stock
                      </span>
                      <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-medium">
                        Net ready for sales invoice
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-blue-800 dark:text-blue-200">
                        {formatVal(bData.available || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 dark:bg-meta-4/20 p-4 rounded-xl border border-slate-200/90 dark:border-strokedark flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                        Physical On-Hand
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Available + Committed Holds
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-800 dark:text-slate-100">
                        {formatVal(bData.onHand || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown in 2 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Inventory Inflow */}
                  <div className="rounded-xl border border-slate-200 dark:border-strokedark p-4 bg-white dark:bg-boxdark space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-strokedark">
                      <span
                        style={{ color: 'var(--color-primary, #0D1540)' }}
                        className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                      >
                        <span
                          style={{ backgroundColor: 'var(--color-primary, #0D1540)' }}
                          className="w-2 h-2 rounded-full"
                        ></span>
                        Inventory Inflow
                      </span>
                      {looseChainSummary ? (
                        <span
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 8%, transparent)',
                            borderColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 22%, transparent)',
                            color: 'var(--color-primary, #0D1540)',
                          }}
                          className="text-[9.5px] font-bold px-2 py-0.5 rounded border font-mono"
                        >
                          {looseChainSummary}
                        </span>
                      ) : selectedStockBreakdown.allow_loose_sales ? (
                        <span
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-primary, #0D1540) 8%, transparent)',
                            color: 'var(--color-primary, #0D1540)',
                          }}
                          className="text-[9.5px] font-bold px-2 py-0.5 rounded"
                        >
                          1 {uomLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Opening Stock</span>
                      {formatVal(bData.opening || 0)}
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Total Purchases</span>
                        {Number(bData.purchaseReturned || 0) > 0 && (
                          <span className="text-[9.5px] font-bold text-rose-500">
                            (Returned: {bData.purchaseReturned})
                          </span>
                        )}
                      </div>
                      {formatVal(bData.purchased || 0)}
                    </div>

                    {selectedModalWarehouse !== 'ALL' && (
                      <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-strokedark/50 pt-2">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Transfer Received</span>
                        <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          +{bData.transferredIn || 0} {uomLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Outflow & Holds */}
                  <div className="rounded-xl border border-slate-200 dark:border-strokedark p-4 bg-white dark:bg-boxdark space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-strokedark">
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Outflow & Commitments
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Total Sales</span>
                        {Number(bData.salesReturned || 0) > 0 && (
                          <span className="text-[9.5px] font-bold text-emerald-600">
                            (Returned: {bData.salesReturned})
                          </span>
                        )}
                      </div>
                      {formatVal(bData.sold || 0)}
                    </div>

                    {selectedModalWarehouse !== 'ALL' && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Transfer Sent</span>
                        <span className="text-xs font-bold font-mono text-rose-500">
                          -{bData.transferredOut || 0} {uomLabel}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-1.5 bg-amber-50/60 dark:bg-amber-950/20 px-2.5 rounded-lg border border-amber-100/60 dark:border-amber-900/30">
                      <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400">
                        Hold (Committed Sales)
                      </span>
                      <div className="text-amber-700 dark:text-amber-300">{formatVal(bData.hold || 0)}</div>
                    </div>

                    <div className="flex justify-between items-center py-1.5 bg-yellow-50/60 dark:bg-yellow-950/20 px-2.5 rounded-lg border border-yellow-100/60 dark:border-yellow-900/30">
                      <span className="text-[11px] font-semibold text-yellow-800 dark:text-yellow-500">
                        Hold (QC / Purchase)
                      </span>
                      <div className="text-yellow-700 dark:text-yellow-400">{formatVal(bData.purchaseHold || 0)}</div>
                    </div>

                    <div className="flex justify-between items-center py-1.5 bg-rose-50/60 dark:bg-rose-950/20 px-2.5 rounded-lg border border-rose-100/60 dark:border-rose-900/30">
                      <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-400">
                        Rejected (QC Failed)
                      </span>
                      <div className="text-rose-700 dark:text-rose-400">{formatVal(bData.rejected || 0)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-meta-4/30 border-t border-slate-100 dark:border-strokedark flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Press Escape or click Close to exit
                </span>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-white dark:bg-boxdark border border-slate-200 dark:border-strokedark hover:bg-slate-100 dark:hover:bg-meta-4 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition shadow-xs w-full sm:w-auto cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};
