import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  MdArrowBack,
  MdSave,
  MdPlayArrow,
  MdPrecisionManufacturing,
  MdLayers,
  MdLocationOn,
  MdDateRange,
  MdScience,
  MdOutlineQrCode
} from 'react-icons/md';
import { supabase } from '../../../Context/supabaseClient';
import { bomService, BomHeader } from '../../../service/bomService';
import { decomposeStockIntoChain } from '../../../utils/looseUomHelpers';
import {
  productionOrderService,
  ProductionOrder,
  ProductionOrderMaterial
} from '../../../service/productionOrderService';
import Spinner from '../../../ui/Spinner';

const AddProductionOrder: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [boms, setBoms] = useState<BomHeader[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Form State
  const [selectedBomId, setSelectedBomId] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [mfgDate, setMfgDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState<string>(
    new Date(Date.now() + 86400000 * 365 * 2).toISOString().split('T')[0]
  );
  const [targetQuantity, setTargetQuantity] = useState<number>(1000);
  const [sourceWarehouse, setSourceWarehouse] = useState<string>('');
  const [destinationWarehouse, setDestinationWarehouse] = useState<string>('');
  const [plannedStartDate, setPlannedStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [plannedCompletionDate, setPlannedCompletionDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<'Low' | 'Normal' | 'High' | 'Urgent'>('Normal');
  const [supervisor, setSupervisor] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<'Draft' | 'Planned' | 'In Progress'>('Planned');

  // Load initial data
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        // Fetch BOMs and Warehouses in parallel
        const [loadedBoms, locRes] = await Promise.all([
          bomService.getAll(),
          supabase.from('inventory_locations').select('name').order('name', { ascending: true })
        ]);

        setBoms(loadedBoms);

        const extractedLocations = Array.from(
          new Set(
            (locRes.data || [])
              .map((l: any) => l.name || l.location_name)
              .filter(Boolean)
          )
        );
        setLocations(extractedLocations);
        if (!isEditMode && extractedLocations.length > 0) {
          setSourceWarehouse(prev => prev || extractedLocations[0]);
          setDestinationWarehouse(prev => prev || extractedLocations[0]);
        }

        if (isEditMode && id) {
          const existing = await productionOrderService.getById(id);
          if (existing) {
            setSelectedBomId(existing.bom_id);
            setOrderNumber(existing.order_number);
            setBatchNumber(existing.batch_number || '');
            setMfgDate(existing.mfg_date || new Date().toISOString().split('T')[0]);
            setExpDate(existing.exp_date || new Date(Date.now() + 86400000 * 730).toISOString().split('T')[0]);
            setTargetQuantity(existing.target_quantity);
            setSourceWarehouse(existing.source_warehouse);
            setDestinationWarehouse(existing.destination_warehouse);
            setPlannedStartDate(existing.planned_start_date);
            setPlannedCompletionDate(existing.planned_completion_date);
            setPriority(existing.priority);
            setSupervisor(existing.supervisor || '');
            setNotes(existing.notes || '');
            setStatus(existing.status === 'Completed' ? 'Completed' : (existing.status as any));
          } else {
            toast.error('Work order not found');
            navigate('/Manufacturing/production-orders');
          }
        } else {
          const [nextNo, nextBatch] = await Promise.all([
            productionOrderService.generateNextOrderNumber(),
            productionOrderService.generateNextBatchNumber()
          ]);
          setOrderNumber(nextNo);
          setBatchNumber(nextBatch);
          if (loadedBoms.length > 0) {
            setSelectedBomId(loadedBoms[0].id);
            setTargetQuantity(loadedBoms[0].batch_quantity || 1000);
          }
        }
      } catch (err: any) {
        toast.error('Failed to initialize: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEditMode, navigate]);

  // Selected BOM reference
  const selectedBom = useMemo(() => {
    return boms.find(b => String(b.id) === String(selectedBomId)) || null;
  }, [boms, selectedBomId]);

  // Overhead/Labor scaling vs BOM batch size, while BOM items are per-1-unit and scale by targetQuantity
  const scalingFactor = useMemo(() => {
    if (!selectedBom || !selectedBom.batch_quantity || selectedBom.batch_quantity <= 0) return 1;
    return targetQuantity / selectedBom.batch_quantity;
  }, [selectedBom, targetQuantity]);

  // Dynamically scaled materials (BOM items define consumption per 1 unit, so multiply by targetQuantity)
  const scaledMaterials: ProductionOrderMaterial[] = useMemo(() => {
    if (!selectedBom) return [];
    const qtyScale = Number(targetQuantity) > 0 ? Number(targetQuantity) : 1;
    return (selectedBom.items || []).map((item, idx) => {
      const scaledReq = Number((Number(item.quantity || 0) * qtyScale).toFixed(10));
      const unitCost = Number(item.unit_cost || 0);
      const perUnitCost = Number(item.total_cost || 0) > 0 ? Number(item.total_cost) : Number(item.quantity || 0) * unitCost;
      const totalCost = Number((perUnitCost * qtyScale).toFixed(2));

      return {
        id: `mat-${idx}-${item.id || item.item_code}`,
        item_id: item.item_id,
        item_name: item.item_name,
        item_code: item.item_code,
        required_qty: scaledReq,
        consumed_qty: scaledReq,
        uom: item.uom,
        unit_cost: unitCost,
        total_cost: totalCost,
        item_type: item.item_type || 'Chemical',
        allow_loose: item.allow_loose,
        loose_uom: item.loose_uom,
        loose_ratio: item.loose_ratio,
        multi_loose_units: item.multi_loose_units,
        loose_quantity: item.allow_loose && item.loose_ratio ? Math.round(scaledReq * item.loose_ratio) : undefined,
        wastage_percentage: item.wastage_percentage,
        notes: item.notes
      };
    });
  }, [selectedBom, targetQuantity]);

  // Financial Cost Breakdown
  const financialTotals = useMemo(() => {
    const rawMaterialCost = scaledMaterials.reduce((sum, m) => sum + m.total_cost, 0);
    const laborCost = Number(((selectedBom?.labor_cost || 0) * scalingFactor).toFixed(2));
    const overheadCost = Number(((selectedBom?.overhead_cost || 0) * scalingFactor).toFixed(2));
    const totalCost = rawMaterialCost + laborCost + overheadCost;
    const unitCost = targetQuantity > 0 ? Number((totalCost / targetQuantity).toFixed(2)) : 0;

    return {
      rawMaterialCost,
      laborCost,
      overheadCost,
      totalCost,
      unitCost
    };
  }, [scaledMaterials, selectedBom, scalingFactor, targetQuantity]);

  // Handle Saving / Starting
  const handleSubmit = async (targetStatus?: 'Draft' | 'Planned' | 'In Progress') => {
    if (!selectedBom) {
      toast.error('Please select an active BOM formulation');
      return;
    }
    if (targetQuantity <= 0) {
      toast.error('Target quantity must be greater than zero');
      return;
    }
    if (!batchNumber.trim()) {
      toast.error('Please specify a traceable Batch Number');
      return;
    }
    if (!sourceWarehouse || !destinationWarehouse) {
      toast.error('Please choose source and destination warehouses');
      return;
    }

    try {
      setSaving(true);
      const chosenStatus = targetStatus || status;

      const orderPayload: ProductionOrder = {
        id: id || `wo-${Date.now()}`,
        order_number: orderNumber,
        batch_number: batchNumber.trim().toUpperCase(),
        mfg_date: mfgDate,
        exp_date: expDate,
        bom_id: selectedBom.id,
        bom_number: selectedBom.bom_number,
        finished_product_id: selectedBom.finished_product_id,
        finished_product_name: selectedBom.finished_product_name,
        finished_product_code: selectedBom.finished_product_code,
        category: selectedBom.category,
        target_quantity: targetQuantity,
        completed_quantity: 0,
        wastage_quantity: 0,
        uom: selectedBom.uom || 'Bottles',
        source_warehouse: sourceWarehouse,
        destination_warehouse: destinationWarehouse,
        planned_start_date: plannedStartDate,
        planned_completion_date: plannedCompletionDate,
        actual_start_date: chosenStatus === 'In Progress' ? new Date().toISOString().split('T')[0] : undefined,
        status: chosenStatus,
        priority: priority,
        supervisor: supervisor.trim() || undefined,
        estimated_unit_cost: financialTotals.unitCost,
        estimated_total_cost: financialTotals.totalCost,
        labor_cost: financialTotals.laborCost,
        overhead_cost: financialTotals.overheadCost,
        notes: notes.trim() || undefined,
        materials: scaledMaterials,
        qc_checklist: {
          ph_target: selectedBom.finished_product_name.toLowerCase().includes('phenyl') ? '9.0 - 10.5' : '5.5 - 6.5',
          qc_status: 'Pending'
        }
      };

      await productionOrderService.save(orderPayload);
      toast.success(
        chosenStatus === 'In Progress'
          ? `Work Order ${orderNumber} launched! Batch ${batchNumber} is now In Progress.`
          : `Work Order ${orderNumber} saved successfully!`
      );
      navigate('/Manufacturing/production-orders');
    } catch (err: any) {
      toast.error('Failed to save work order: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-default">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/Manufacturing/production-orders')}
            className="p-2.5 rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 text-gray-600 dark:text-gray-300 transition cursor-pointer"
          >
            <MdArrowBack className="text-lg" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800">
                {orderNumber}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-400 font-bold border border-blue-300 dark:border-blue-800">
                {batchNumber}
              </span>
              <span className="text-xs font-bold text-gray-500 uppercase">
                {isEditMode ? 'Modify Work Order' : 'Chemical FMCG Batch Run'}
              </span>
            </div>
            <h1 className="text-xl font-black text-black dark:text-white tracking-tight mt-0.5">
              {isEditMode ? 'Edit Manufacturing Work Order' : 'Create & Schedule Production Order'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('Planned')}
            className="px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-meta-4 text-black dark:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <MdSave className="text-base text-gray-500" />
            <span>Save Plan</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('In Progress')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? <Spinner color="border-white" size="w-3.5 h-3.5" /> : <MdPlayArrow className="text-lg" />}
            <span>Issue & Launch Run</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: BOM Recipe Selection, Batch Traceability & Materials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Recipe Selection */}
          <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-6 shadow-default space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-stroke dark:border-strokedark">
              <MdPrecisionManufacturing className="text-emerald-600 text-xl" />
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                Select Master BOM Formulation
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Production Recipe (BOM) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBomId}
                  onChange={e => {
                    setSelectedBomId(e.target.value);
                    const b = boms.find(x => String(x.id) === String(e.target.value));
                    if (b) setTargetQuantity(b.batch_quantity || 1000);
                  }}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  {boms.map(bom => (
                    <option key={bom.id} value={bom.id}>
                      {bom.bom_number} — {bom.finished_product_name} ({bom.batch_quantity} {bom.uom}/batch)
                    </option>
                  ))}
                </select>
              </div>

              {selectedBom && (
                <div className="bg-gray-50 dark:bg-meta-4/20 p-4 rounded-xl border border-stroke dark:border-strokedark space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Output Product:</span>
                    <span className="font-bold text-black dark:text-white">{selectedBom.finished_product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Standard Formula Batch:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedBom.batch_quantity} {selectedBom.uom}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{selectedBom.category}</span>
                  </div>
                </div>
              )}

              {/* Target Batch Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Target Batch Output ({selectedBom?.uom || 'Bottles'}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={targetQuantity}
                    onChange={e => setTargetQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full text-sm font-black px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Scaled: <strong>{scalingFactor.toFixed(2)}x</strong> base formula recipe
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Job Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Normal">Normal Schedule</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent / Rush Order</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Batch Number & Expiry Traceability (FMCG Requirement) */}
          <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-6 shadow-default space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stroke dark:border-strokedark">
              <MdOutlineQrCode className="text-blue-600 text-xl" />
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                Batch Identification, MFG & Expiry Traceability
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Traceable Batch Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={e => setBatchNumber(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 focus:border-blue-500 focus:outline-hidden"
                    placeholder="BATCH-YYYYMM-XXX"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Printed on bottles & carton labels</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Manufacturing Date (MFG) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={mfgDate}
                  onChange={e => setMfgDate(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Expiry Date (EXP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={e => setExpDate(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bill of Materials Consumption Table */}
          <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-6 shadow-default space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark">
              <div className="flex items-center gap-2">
                <MdLayers className="text-emerald-600 text-xl" />
                <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                  Calculated Raw Material Requisitions
                </h2>
              </div>
              <span className="text-[11px] font-mono text-gray-500">
                {scaledMaterials.length} Items (Chemicals & Packaging)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-sans">
                <thead>
                  <tr className="border-b border-stroke dark:border-strokedark font-black text-[10px] uppercase text-gray-500 bg-gray-50 dark:bg-meta-4/20">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3 text-right">Required Qty</th>
                    <th className="py-2.5 px-3 text-center">UOM</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Estimated Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {scaledMaterials.map((mat, idx) => {
                    const isPkg = mat.item_type === 'Packaging';
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-meta-4/10">
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              isPkg
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                            }`}
                          >
                            {isPkg ? 'Packaging' : 'Chemical'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-black dark:text-white">
                          {mat.item_name}
                          {mat.item_code && <span className="block text-[10px] text-gray-400 font-normal">{mat.item_code}</span>}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {(() => {
                            const hasLooseInfo = Boolean(
                              mat.allow_loose ||
                              (Array.isArray((mat as any).multi_loose_units) && (mat as any).multi_loose_units.length > 0)
                            );
                            if (hasLooseInfo) {
                              const decomp = decomposeStockIntoChain(mat.required_qty, mat.uom, {
                                uom: mat.uom,
                                loose_uom: mat.loose_uom,
                                loose_conversion_ratio: mat.loose_ratio,
                                multi_loose_units: (mat as any).multi_loose_units,
                              });
                              return (
                                <span className="font-black text-emerald-600 dark:text-emerald-400 block">
                                  {decomp.formattedText}
                                </span>
                              );
                            }
                            return (
                              <span className="font-black text-emerald-600 dark:text-emerald-400 block">
                                {Number(mat.required_qty.toFixed(4)).toLocaleString()} {mat.uom}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-gray-500">
                          {mat.uom}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-gray-600 dark:text-gray-300">
                          Rs. {mat.unit_cost.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-black dark:text-white">
                          Rs. {mat.total_cost.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Routing & Production Meta */}
        <div className="space-y-6">
          {/* Section 4: Warehouse Logistics */}
          <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-6 shadow-default space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stroke dark:border-strokedark">
              <MdLocationOn className="text-emerald-600 text-xl" />
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                Routing & Warehouses
              </h2>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Source Raw Material / Chemical Yard <span className="text-red-500">*</span>
                </label>
                <select
                  value={sourceWarehouse}
                  onChange={e => setSourceWarehouse(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Deducts chemicals, bottles & caps from here</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Destination Finished Goods Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={destinationWarehouse}
                  onChange={e => setDestinationWarehouse(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden cursor-pointer"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Finished bottles added to inventory here upon QC approval</p>
              </div>
            </div>
          </div>

          {/* Section 5: Schedule & Assignment */}
          <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-6 shadow-default space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stroke dark:border-strokedark">
              <MdDateRange className="text-emerald-600 text-xl" />
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                Production Schedule
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Planned Start Date
                </label>
                <input
                  type="date"
                  value={plannedStartDate}
                  onChange={e => setPlannedStartDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={plannedCompletionDate}
                  onChange={e => setPlannedCompletionDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Assigned Chemist / Plant Supervisor
                </label>
                <input
                  type="text"
                  value={supervisor}
                  onChange={e => setSupervisor(e.target.value)}
                  placeholder="e.g. Dr. Tariq / Muhammad Bilal"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Job Remarks & Batch Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Bulk mixing vessel #2, check perfume temperature before dosing..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Live Cost Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4 border border-slate-700">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <MdScience className="text-emerald-400 text-xl" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Batch Cost Estimate
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Materials Cost:</span>
                <span className="font-mono text-white font-bold">Rs. {financialTotals.rawMaterialCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Direct Labor Cost:</span>
                <span className="font-mono text-white font-bold">Rs. {financialTotals.laborCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Factory Overhead Cost:</span>
                <span className="font-mono text-white font-bold">Rs. {financialTotals.overheadCost.toLocaleString()}</span>
              </div>

              <div className="border-t border-slate-700 pt-3 flex justify-between items-center text-sm font-black">
                <span className="text-emerald-400">Estimated Total:</span>
                <span className="font-mono text-base text-emerald-400">Rs. {financialTotals.totalCost.toLocaleString()}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center mt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Estimated Unit Cost</span>
                <span className="text-xl font-black font-mono text-white">
                  Rs. {financialTotals.unitCost.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400"> / {selectedBom?.uom || 'Bottle'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductionOrder;
