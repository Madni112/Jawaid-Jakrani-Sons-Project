import React, { useState, useEffect } from 'react';
import {
  MdCheckCircle,
  MdClose,
  MdWarningAmber,
  MdPrecisionManufacturing,
  MdScience,
  MdOutlineVerified,
  MdFactCheck
} from 'react-icons/md';
import { ProductionOrder, QCInspectionChecklist } from '../../../../service/productionOrderService';
import Spinner from '../../../../ui/Spinner';
import { fetchStockDataset, getWarehouseAvailableStock } from '../../../../utils/stockCalculator';
import { fetchWorkflowSettings } from '../../../../service/workflowSettingsService';
import { decomposeStockIntoChain } from '../../../../utils/looseUomHelpers';

interface CompleteOrderModalProps {
  order: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (completionData: {
    completed_quantity: number;
    wastage_quantity: number;
    notes: string;
    qc_checklist?: QCInspectionChecklist;
  }) => Promise<void>;
}

export const CompleteOrderModal: React.FC<CompleteOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [completedQty, setCompletedQty] = useState<number>(order?.target_quantity || 1);
  const [wastageQty, setWastageQty] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [stockDataset, setStockDataset] = useState<any>(null);
  const [allowNegativeStock, setAllowNegativeStock] = useState<boolean>(true);
  const [shortagePopupItems, setShortagePopupItems] = useState<Array<{
    itemName: string;
    availableText: string;
    requiredText: string;
  }> | null>(null);

  // Quality Control Checklist State
  const defaultPh = order?.finished_product_name?.toLowerCase().includes('phenyl') ? 9.5 : 6.0;
  const [phLevel, setPhLevel] = useState<number>(defaultPh);
  const [viscosityCps, setViscosityCps] = useState<number>(120);
  const [fragranceColorPass, setFragranceColorPass] = useState<boolean>(true);
  const [leakageTestPass, setLeakageTestPass] = useState<boolean>(true);
  const [qcStatus, setQcStatus] = useState<'Passed' | 'Failed' | 'Conditional'>('Passed');
  const [qcInspector, setQcInspector] = useState<string>('QC Lab Analyst');
  const [qcRemarks, setQcRemarks] = useState<string>('Color, scent, viscosity & pH within standard specification.');

  useEffect(() => {
    if (!isOpen || !order) return;
    setCompletedQty(order.target_quantity || 1);
    setShortagePopupItems(null);
    Promise.all([
      fetchStockDataset().catch(() => null),
      fetchWorkflowSettings().catch(() => null),
    ]).then(([ds, wf]) => {
      setStockDataset(ds);
      if (wf) setAllowNegativeStock(wf.allow_negative_stock !== false);
    });
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const executeCompletion = async () => {
    try {
      setIsSubmitting(true);
      const qcData: QCInspectionChecklist = {
        ph_level: phLevel,
        ph_target: order.finished_product_name.toLowerCase().includes('phenyl') ? '9.0 - 10.5' : '5.5 - 6.5',
        ph_pass: true,
        viscosity_cps: viscosityCps,
        viscosity_pass: true,
        fragrance_color_pass: fragranceColorPass,
        leakage_test_pass: leakageTestPass,
        qc_status: qcStatus,
        qc_inspector: qcInspector.trim() || undefined,
        inspection_date: new Date().toISOString().split('T')[0],
        qc_remarks: qcRemarks.trim() || undefined
      };

      await onConfirm({
        completed_quantity: completedQty,
        wastage_quantity: wastageQty,
        notes: notes.trim(),
        qc_checklist: qcData
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qcStatus === 'Failed') {
      alert('QC Status is marked as Failed. Finished goods cannot be deposited into Main Inventory until approved.');
      return;
    }

    // Check raw material availability in source_warehouse before deducting
    const srcWh = order.source_warehouse || '';
    const shortList: Array<{ itemName: string; availableText: string; requiredText: string }> = [];
    for (const mat of order.materials || []) {
      const reqQty = Number(mat.consumed_qty || mat.required_qty || 0);
      if (reqQty <= 0) continue;
      const availQty = srcWh && stockDataset
        ? getWarehouseAvailableStock(mat.item_name, srcWh, stockDataset, mat.item_code)
        : 0;
      if (availQty + 1e-10 < reqQty) {
        const hasLooseInfo = Boolean(
          mat.allow_loose ||
          (Array.isArray((mat as any).multi_loose_units) && (mat as any).multi_loose_units.length > 0)
        );
        const prodMeta = {
          uom: mat.uom,
          loose_uom: mat.loose_uom,
          loose_conversion_ratio: mat.loose_ratio,
          multi_loose_units: (mat as any).multi_loose_units,
        };
        shortList.push({
          itemName: mat.item_name,
          availableText: hasLooseInfo
            ? decomposeStockIntoChain(availQty, mat.uom, prodMeta).formattedText
            : `${Number(availQty.toFixed(4)).toLocaleString()} ${mat.uom}`,
          requiredText: hasLooseInfo
            ? decomposeStockIntoChain(reqQty, mat.uom, prodMeta).formattedText
            : `${Number(reqQty.toFixed(4)).toLocaleString()} ${mat.uom}`,
        });
      }
    }

    if (shortList.length > 0) {
      setShortagePopupItems(shortList);
      return;
    }

    await executeCompletion();
  };

  const yieldPercentage = order.target_quantity > 0 
    ? ((completedQty / order.target_quantity) * 100).toFixed(1) 
    : '100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn my-8">
        {/* Header */}
        <div className="p-5 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-xs">
              <MdPrecisionManufacturing />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-black dark:text-white text-base">Complete Production Run</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {order.batch_number || 'BATCH-AUTO'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {order.order_number} • {order.finished_product_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black dark:hover:text-white text-lg p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            <MdClose />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Target & Logistics Banner */}
          <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 p-3.5 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between items-center text-blue-900 dark:text-blue-300 font-bold">
              <span>Target Planned Batch Output:</span>
              <span className="font-mono text-sm">{order.target_quantity.toLocaleString()} {order.uom}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/60 dark:border-blue-800/40 text-[11px]">
              <div>
                <span className="text-gray-500">MFG Date: </span>
                <span className="font-bold text-black dark:text-white">{order.mfg_date || 'Today'}</span>
              </div>
              <div>
                <span className="text-gray-500">EXP Date: </span>
                <span className="font-bold text-black dark:text-white">{order.exp_date || '+2 Years'}</span>
              </div>
            </div>
          </div>

          {/* Actual Yield Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Actual Finished Output ({order.uom}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={completedQty}
                onChange={e => setCompletedQty(Number(e.target.value))}
                className="w-full text-sm font-black px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Breakage / Defective Units ({order.uom})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={wastageQty}
                onChange={e => setWastageQty(Number(e.target.value))}
                className="w-full text-sm font-bold px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-rose-600 dark:text-rose-400 focus:border-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-meta-4/30 p-2.5 rounded-lg border border-stroke dark:border-strokedark font-medium">
            <span className="text-gray-600 dark:text-gray-400">Batch Yield Efficiency:</span>
            <span className={`font-black ${Number(yieldPercentage) >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {yieldPercentage}% Target Reached
            </span>
          </div>

          {/* ── Chemical & FMCG Quality Control (QC) Checklist Section ── */}
          <div className="border border-stroke dark:border-strokedark rounded-xl p-4 bg-slate-50 dark:bg-meta-4/20 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-stroke dark:border-strokedark">
              <div className="flex items-center gap-2">
                <MdScience className="text-primary text-lg" />
                <h4 className="text-xs font-extrabold text-black dark:text-white uppercase tracking-wider">
                  Quality Control (QC) Laboratory Inspection Checklist
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Gatepass Clearance Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* pH Level */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Tested pH Level (Target: {order.finished_product_name.toLowerCase().includes('phenyl') ? '9.0 - 10.5' : '5.5 - 6.5'})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={phLevel}
                    onChange={e => setPhLevel(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary outline-none"
                    placeholder="e.g. 9.5"
                  />
                  <span className="text-[11px] font-mono text-gray-500 font-bold">pH</span>
                </div>
              </div>

              {/* Viscosity */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Viscosity (cPs / Spindle test)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={viscosityCps}
                    onChange={e => setViscosityCps(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary outline-none"
                    placeholder="e.g. 120"
                  />
                  <span className="text-[11px] font-mono text-gray-500 font-bold">cPs</span>
                </div>
              </div>

              {/* Fragrance & Color Appearance */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-boxdark border border-stroke dark:border-strokedark">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  Fragrance & Color Standard Match
                </span>
                <button
                  type="button"
                  onClick={() => setFragranceColorPass(prev => !prev)}
                  className={`px-3 py-1 rounded-md text-xs font-extrabold cursor-pointer transition ${
                    fragranceColorPass
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                  }`}
                >
                  {fragranceColorPass ? '✓ PASS' : '✗ FAIL'}
                </button>
              </div>

              {/* Bottle Capping Leakage Test */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-boxdark border border-stroke dark:border-strokedark">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  Cap Torque & Leakage Test
                </span>
                <button
                  type="button"
                  onClick={() => setLeakageTestPass(prev => !prev)}
                  className={`px-3 py-1 rounded-md text-xs font-extrabold cursor-pointer transition ${
                    leakageTestPass
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                  }`}
                >
                  {leakageTestPass ? '✓ PASS' : '✗ FAIL'}
                </button>
              </div>
            </div>

            {/* Overall QC Status & Inspector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Overall QC Inspection Verdict <span className="text-red-500">*</span>
                </label>
                <select
                  value={qcStatus}
                  onChange={e => setQcStatus(e.target.value as any)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Passed">Passed (Approved for Inventory Gatepass)</option>
                  <option value="Conditional">Conditional Pass (Rework / Re-mix)</option>
                  <option value="Failed">Failed (Rejected / Quarantine)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                  QC Lab Inspector
                </label>
                <input
                  type="text"
                  value={qcInspector}
                  onChange={e => setQcInspector(e.target.value)}
                  placeholder="e.g. Dr. Tariq / Lab Analyst"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Production Execution & Batch Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Batch emulsification clear, filling line 2 completed without bottle leakage."
              className="w-full text-xs px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-300 text-[11px] leading-relaxed">
            <MdWarningAmber className="text-lg shrink-0 mt-0.5" />
            <span>
              Confirming will automatically add <strong>{completedQty.toLocaleString()} {order.uom}</strong> (Batch: <strong>{order.batch_number}</strong>) into <strong>{order.destination_warehouse}</strong>, trigger an Inward Stock Gatepass record, and deduct consumed raw materials.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stroke dark:border-strokedark">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-meta-4 hover:bg-gray-200 dark:hover:bg-meta-4/80 text-black dark:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Spinner color="border-white" size="w-3.5 h-3.5" /> : <MdCheckCircle className="text-base" />}
              <span>Approve QC & Deposit Stock</span>
            </button>
          </div>
        </form>
      </div>

      {/* Insufficient Raw Material Stock Popup */}
      {shortagePopupItems && shortagePopupItems.length > 0 && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-boxdark border border-rose-200 dark:border-rose-900/60 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/70 dark:border-rose-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400">
                  <MdWarningAmber className="text-xl" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-900 dark:text-rose-200">
                    Insufficient Raw Material Stock
                  </h3>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                    Location: <strong>{order.source_warehouse || 'N/A'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShortagePopupItems(null)}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition cursor-pointer"
              >
                <MdClose className="text-lg" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Not enough raw material stock in <strong>{order.source_warehouse}</strong> to complete{' '}
                <strong>{completedQty.toLocaleString()} {order.uom}</strong>:
              </p>

              <div className="rounded-xl border border-slate-200 dark:border-strokedark overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-meta-4/40 text-[10px] uppercase font-black text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-3 text-right">Available</th>
                      <th className="py-2 px-3 text-right">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-strokedark font-mono">
                    {shortagePopupItems.map((s, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-800 dark:text-white">
                          {s.itemName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                          {s.availableText}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                          {s.requiredText}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 dark:bg-meta-4/30 border-t border-slate-100 dark:border-strokedark flex items-center justify-end gap-2">
              {allowNegativeStock && (
                <button
                  type="button"
                  onClick={() => {
                    setShortagePopupItems(null);
                    executeCompletion();
                  }}
                  style={{ backgroundColor: 'var(--color-primary, #0D1540)' }}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-xs"
                >
                  Complete Anyway (Negative Stock)
                </button>
              )}
              <button
                type="button"
                onClick={() => setShortagePopupItems(null)}
                className={
                  !allowNegativeStock
                    ? 'px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-xs'
                    : 'px-4 py-2 rounded-xl border border-slate-300 dark:border-strokedark bg-white dark:bg-boxdark text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 transition cursor-pointer'
                }
              >
                {!allowNegativeStock ? 'Cannot Complete — Purchase Stock First' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
