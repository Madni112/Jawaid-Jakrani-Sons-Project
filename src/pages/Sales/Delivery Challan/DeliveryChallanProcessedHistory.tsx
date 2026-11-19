import React, { useEffect, useState } from 'react';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { FiEye, FiPrinter, FiTruck, FiArrowLeft, FiSearch, FiCheckCircle, FiClock, FiFileText, FiEdit2, FiSave } from 'react-icons/fi';
import Spinner from '../../../ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Context/Auth';
import toast from 'react-hot-toast';
import { printDeliveryChallanSlip } from './utils/printDeliveryChallanSlip';

interface DeliveryChallanProcessedHistoryProps {
  locationFilter?: string;
  isPurchaseReturn?: boolean;
  productsMaster?: any[];
  onPrint?: (record: any) => void;
  onClose?: () => void;
}

const resolvePcsPerBox = (prod: any, sampleQty?: number): number => {
  if (prod) {
    const looseRatio = Number(prod.loose_conversion_ratio || 0);
    const boxPcs = Number(prod.pieces_per_box || prod.pcs_per_box || prod.pieces_per_packing || 0);
    if (looseRatio > 1) return looseRatio;
    if (boxPcs > 1) return boxPcs;
    const isTile = Boolean(
      String(prod.category || '').toLowerCase().includes('tile') ||
      String(prod.scenario_name || '').toLowerCase().includes('tile')
    );
    if (isTile) return 4;
  }
  if (typeof sampleQty === 'number' && Math.abs(sampleQty - Math.round(sampleQty)) > 0.0001) {
    const fraction = sampleQty - Math.floor(sampleQty);
    for (const cand of [12, 6, 4, 8, 10, 16, 24]) {
      const pcs = fraction * cand;
      if (Math.abs(pcs - Math.round(pcs)) < 0.01) {
        return cand;
      }
    }
  }
  return 1;
};

const DeliveryChallanProcessedHistory: React.FC<DeliveryChallanProcessedHistoryProps> = ({
  locationFilter,
  isPurchaseReturn = false,
  onPrint,
  onClose,
}) => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [productsMaster, setProductsMaster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Dispatched' | 'Partially Dispatched'>('ALL');
  const [workflowFilter, setWorkflowFilter] = useState<'ALL' | 'AUTOMATIC' | 'MANUAL'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    setSavingEdit(true);
    try {
      const allDispatched = editItems.every(i => Number(i.holdQty || 0) === 0);
      const noneDispatched = editItems.every(i => Number(i.dispatchedQty || 0) === 0);
      const newStatus = isPurchaseReturn
        ? (allDispatched ? 'Processed' : 'Partially Processed')
        : (allDispatched ? 'Dispatched' : (noneDispatched ? 'Pending Dispatch' : 'Partially Dispatched'));

      const table = isPurchaseReturn ? 'purchase_returns' : 'delivery_challans';
      const { error } = await supabase
        .from(table)
        .update({
          items: editItems,
          status: newStatus
        })
        .eq('id', editingRecord.id);

      if (error) throw error;

      toast.success(
        allDispatched 
          ? 'Delivery Challan updated successfully!'
          : 'Delivery Challan updated! Remaining hold items moved back to Active Dispatch Queue.'
      );
      setEditingRecord(null);
      fetchHistory();
    } catch (err: any) {
      toast.error('Failed to update challan: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    fetchAllPages(supabase.from('products').select('*')).then(({ data }) => {
      if (data) setProductsMaster(data);
    });
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [locationFilter, isPurchaseReturn]);

  const formatItemDisplay = (it: any, quantity: number) => {
    const pName = String(it.itemName || it.pDescription || it.product_name || '').trim().toLowerCase();
    const prod = productsMaster.find(p => String(p?.product_name || '').trim().toLowerCase() === pName);
    const pcsPerBox = resolvePcsPerBox(prod, quantity);

    if (pcsPerBox > 1) {
      const totPcs = Math.round(quantity * pcsPerBox);
      const b = Math.floor(totPcs / pcsPerBox);
      const p = totPcs % pcsPerBox;
      if (p === 0) return `${b} Boxes`;
      if (b === 0) return `${p} Pcs`;
      return `${b} Boxes + ${p} Pcs`;
    }
    const cleanQty = Math.round(quantity * 100) / 100;
    const uom = it.uom && it.uom !== 'Nos' ? ` ${it.uom}` : (it.uom || '');
    return `${cleanQty}${uom ? ` ${uom}` : ''}`;
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (isPurchaseReturn) {
        let query = supabase
          .from('purchase_returns')
          .select('*')
          .order('created_at', { ascending: false });

        if (locationFilter) {
          query = query.or(`source_warehouse.eq.${locationFilter},warehouse_name.eq.${locationFilter}`);
        }

        const { data, error } = await fetchAllPages(query);
        if (error) throw error;
        const processed = (data || []).filter((r: any) => {
          return r.status === 'Dispatched' || r.status === 'Fully Dispatched' || r.status === 'Refunded' || r.status === 'Processed';
        });
        const normalized = processed.map((r: any) => ({
          ...r,
          gate_pass_no: r.gate_pass_no || r.metadata?.gate_pass_no || ''
        }));
        setRecords(normalized);
      } else {
        let query = supabase
          .from('delivery_challans')
          .select('*')
          .order('created_at', { ascending: false });

        const { data, error } = await fetchAllPages(query);
        if (error) throw error;

        let allDc = data || [];
        if (locationFilter) {
          const locMatched = allDc.filter(c => String(c.dispatch_warehouse || '').toLowerCase() === String(locationFilter).toLowerCase());
          if (locMatched.length > 0) {
            allDc = locMatched;
          }
        }

        // Orders that still have pending hold or unfulfilled items belong in the active dispatch queue
        const pendingInvoiceNos = new Set(
          allDc
            .filter(c => c.status === 'Pending' || c.status === 'Pending Approval' || c.status === 'Pending Dispatch' || c.status === 'Partially Dispatched')
            .map(c => String(c.invoice_no || '').trim().toLowerCase())
        );

        const processed = allDc.filter(
          (c) =>
            (c.status === 'Dispatched' || c.status === 'Fully Dispatched') &&
            c.status !== 'Partially Dispatched' &&
            !pendingInvoiceNos.has(String(c.invoice_no || '').trim().toLowerCase())
        );

        setRecords(processed);
      }
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (rec: any) => {
    if (onPrint) {
      onPrint(rec);
    } else {
      printDeliveryChallanSlip(rec, productsMaster || [], isPurchaseReturn);
    }
  };

  const filteredRecords = records.filter((r) => {
    const q = searchTerm.toLowerCase();
    if (isPurchaseReturn) {
      const matchGeneral =
        String(r.return_no || '').toLowerCase().includes(q) ||
        String(r.vendor_name || '').toLowerCase().includes(q) ||
        String(r.purchase_no || '').toLowerCase().includes(q) ||
        String(r.source_warehouse || r.warehouse_name || '').toLowerCase().includes(q);
      const matchItems = Array.isArray(r.items) && r.items.some((it: any) =>
        String(it.itemName || it.product_name || '').toLowerCase().includes(q)
      );
      return matchGeneral || matchItems;
    }

    const matchesSearch =
      String(r.challan_no || '').toLowerCase().includes(q) ||
      String(r.gate_pass_no || '').toLowerCase().includes(q) ||
      String(r.invoice_no || '').toLowerCase().includes(q) ||
      String(r.customer_name || '').toLowerCase().includes(q) ||
      String(r.vehicle_no || '').toLowerCase().includes(q) ||
      String(r.driver_name || '').toLowerCase().includes(q) ||
      String(r.dispatch_warehouse || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Workflow Mode Filter (Automatic vs Manual Gate Pass)
    const isAuto = String(r.remarks || '').includes('[AUTOMATIC]');
    const isManual = !isAuto;
    if (workflowFilter === 'AUTOMATIC' && !isAuto) return false;
    if (workflowFilter === 'MANUAL' && !isManual) return false;

    if (r.status === 'Partially Dispatched') return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'Dispatched') {
      return r.status === 'Dispatched' || r.status === 'Fully Dispatched';
    }
    return true;
  });

  // Group processed sales delivery challans by linked invoice
  const groupedInvoices = React.useMemo(() => {
    if (isPurchaseReturn) return [];
    const groups: Record<string, {
      invoice_no: string;
      customer_name: string;
      warehouse: string;
      challans: any[];
    }> = {};

    filteredRecords.forEach((rec) => {
      const invKey = rec.invoice_no || `DIRECT-${rec.id}`;
      if (!groups[invKey]) {
        groups[invKey] = {
          invoice_no: rec.invoice_no || 'Direct DC',
          customer_name: rec.customer_name || 'Walk-in',
          warehouse: rec.dispatch_warehouse || rec.source_warehouse || rec.warehouse_name || '—',
          challans: []
        };
      }
      groups[invKey].challans.push(rec);
    });

    return Object.values(groups);
  }, [filteredRecords, isPurchaseReturn]);

  // EDIT VIEW
  if (editingRecord) {
    const recordCode = isPurchaseReturn
      ? (editingRecord.return_no || `PR-${editingRecord.id}`)
      : (editingRecord.challan_no || `DC-${String(editingRecord.id).padStart(4, '0')}`);

    return (
      <div className="w-full text-black dark:text-white text-xs max-h-[75vh] flex flex-col space-y-4">
        {/* Back and Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark">
          <button
            type="button"
            onClick={() => setEditingRecord(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-meta-4 dark:hover:bg-meta-4/80 font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
          >
            <FiArrowLeft size={16} />
            Back to List
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-black text-primary">{recordCode}</span>
            <span className="px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase border border-amber-300">
              Edit Dispatched / Hold Quantities
            </span>
          </div>
          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={savingEdit}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {savingEdit ? <Spinner color="border-white" size="w-3.5 h-3.5" /> : <FiSave size={15} />}
            Save Adjustments
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-meta-4/20 p-4 rounded-xl border border-stroke dark:border-strokedark text-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">
              {isPurchaseReturn ? 'Vendor / Supplier' : 'Customer'}
            </p>
            <p className="font-bold text-black dark:text-white mt-0.5">
              {isPurchaseReturn ? (editingRecord.vendor_name || '—') : (editingRecord.customer_name || 'Walk-in')}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">
              {isPurchaseReturn ? 'Linked Purchase #' : 'Invoice #'}
            </p>
            <p className="font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {isPurchaseReturn ? (editingRecord.purchase_no || 'Direct Return') : (editingRecord.invoice_no || 'Direct DC')}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Dispatch Warehouse</p>
            <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {editingRecord.source_warehouse || editingRecord.warehouse_name || editingRecord.dispatch_warehouse || '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Date</p>
            <p className="font-bold text-black dark:text-white mt-0.5">
              {editingRecord.return_date || editingRecord.challan_date || (editingRecord.created_at ? new Date(editingRecord.created_at).toLocaleDateString() : '—')}
            </p>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2.5 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 font-medium">
          ⚡ <strong>Adjust Dispatched vs. Hold Qty:</strong> Reducing dispatched items automatically places them on <strong>Hold</strong> and returns the items to the active dispatch queue. Available inventory updates automatically.
        </div>

        {/* Editable Items Table */}
        <div className="flex-1 overflow-y-auto border border-stroke dark:border-strokedark rounded-xl bg-white dark:bg-boxdark">
          <table className="w-full table-auto border-collapse text-left">
            <thead className="sticky top-0 bg-slate-100 dark:bg-meta-4 z-10">
              <tr className="text-[10px] font-black uppercase tracking-wider border-b border-stroke text-slate-700 dark:text-white">
                <th className="py-2.5 px-3 w-10 text-center">S#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-center">Ordered Qty</th>
                <th className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 min-w-[120px]">Dispatched Qty</th>
                <th className="py-2.5 px-3 text-center text-amber-600 dark:text-amber-400 min-w-[120px]">Remaining Hold</th>
                <th className="py-2.5 px-3 min-w-[130px]">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {editItems.map((it: any, idx: number) => {
                const itemName = it.itemName || it.pDescription || it.product_name || `Item #${idx + 1}`;
                const ord = Number(it.orderQty ?? it.qty ?? 0);
                const disp = Number(it.dispatchedQty ?? 0);
                const hold = Math.max(0, Number((ord - disp).toFixed(3)));

                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-meta-4/10">
                    <td className="py-2.5 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-black dark:text-white">
                      <div>{itemName}</div>
                      {it.warehouse && <span className="text-[10px] text-gray-400 font-normal">{it.warehouse}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {ord} {it.uom || ''}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={ord}
                        value={disp === 0 && it.dispatchedQty === '' ? '' : disp}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Math.max(0, Math.min(ord, Number(e.target.value) || 0));
                          const copy = [...editItems];
                          copy[idx].dispatchedQty = val;
                          copy[idx].holdQty = Math.max(0, Number((ord - val).toFixed(3)));
                          setEditItems(copy);
                        }}
                        className="w-24 rounded-lg border border-emerald-400 dark:border-emerald-600 py-1 px-2.5 bg-white dark:bg-boxdark outline-none focus:border-emerald-500 font-mono font-bold text-emerald-700 text-sm shadow-xs text-center mx-auto block"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-xs ${hold > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-black' : 'text-gray-400'}`}>
                        {hold} {it.uom || ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={it.remarks || ''}
                        onChange={(e) => {
                          const copy = [...editItems];
                          copy[idx].remarks = e.target.value;
                          setEditItems(copy);
                        }}
                        placeholder="Optional remarks"
                        className="w-full rounded border border-stroke px-2 py-1 outline-none text-xs dark:bg-boxdark dark:border-strokedark"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  if (selectedRecord) {
    const items = selectedRecord.items || [];
    const recordCode = isPurchaseReturn
      ? (selectedRecord.return_no || `PR-${selectedRecord.id}`)
      : (selectedRecord.challan_no || `DC-${String(selectedRecord.id).padStart(4, '0')}`);

    return (
      <div className="w-full text-black dark:text-white text-xs max-h-[75vh] flex flex-col space-y-4">
        {/* Back and Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark">
          <button
            type="button"
            onClick={() => setSelectedRecord(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-meta-4 dark:hover:bg-meta-4/80 font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
          >
            <FiArrowLeft size={16} />
            Back to List
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-black text-primary">{recordCode}</span>
            {selectedRecord.gate_pass_no && (
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                GP: {selectedRecord.gate_pass_no}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => handlePrint(selectedRecord)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm cursor-pointer"
          >
            <FiPrinter size={16} />
            Print {isPurchaseReturn ? 'Debit Note' : 'Challan'}
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-meta-4/20 p-4 rounded-xl border border-stroke dark:border-strokedark text-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">
              {isPurchaseReturn ? 'Vendor / Supplier' : 'Customer'}
            </p>
            <p className="font-bold text-black dark:text-white mt-0.5">
              {isPurchaseReturn ? (selectedRecord.vendor_name || '—') : (selectedRecord.customer_name || 'Walk-in')}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">
              {isPurchaseReturn ? 'Linked Purchase #' : 'Invoice #'}
            </p>
            <p className="font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {isPurchaseReturn ? (selectedRecord.purchase_no || 'Direct Return') : (selectedRecord.invoice_no || 'Direct DC')}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Dispatch Warehouse</p>
            <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {selectedRecord.source_warehouse || selectedRecord.warehouse_name || selectedRecord.dispatch_warehouse || '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Date</p>
            <p className="font-bold text-black dark:text-white mt-0.5">
              {selectedRecord.return_date || selectedRecord.challan_date || (selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleDateString() : '—')}
            </p>
          </div>
          {!isPurchaseReturn && (
            <>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Transporter</p>
                <p className="font-bold text-black dark:text-white mt-0.5">{selectedRecord.transport_name || selectedRecord.transportation || 'By Road'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Vehicle No</p>
                <p className="font-mono font-bold text-black dark:text-white mt-0.5">{selectedRecord.vehicle_no || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Driver</p>
                <p className="font-bold text-black dark:text-white mt-0.5">{selectedRecord.driver_name || '—'}</p>
              </div>
            </>
          )}
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Status</p>
            <span className={`inline-flex mt-0.5 rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wide border ${
              selectedRecord.status === 'Dispatched' || selectedRecord.status === 'Fully Dispatched' || selectedRecord.status === 'Refunded'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
            }`}>
              {selectedRecord.status || 'Dispatched'}
            </span>
          </div>
          {selectedRecord.remarks && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-[10px] uppercase font-bold text-gray-400">Remarks</p>
              <p className="font-medium text-gray-600 dark:text-gray-300 italic mt-0.5">{selectedRecord.remarks}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark flex-grow overflow-hidden flex flex-col">
          <div className="overflow-x-auto max-h-[350px]">
            <table className="w-full table-auto border-collapse text-left">
              <thead className="sticky top-0 bg-slate-100 dark:bg-meta-4 z-10">
                <tr className="text-[10px] font-black uppercase tracking-wider border-b border-stroke text-slate-700 dark:text-white">
                  <th className="py-2.5 px-4 w-12 text-center">S#</th>
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4 text-center">Quantity</th>
                  <th className="py-2.5 px-4 text-center">Rate (PKR)</th>
                  <th className="py-2.5 px-4 text-right pr-4">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 italic">No items recorded in this entry.</td>
                  </tr>
                ) : (
                  items.map((it: any, idx: number) => {
                    const itemName = it.itemName || it.pDescription || it.product_name || `Item #${idx + 1}`;
                    const qty = Number(it.qty ?? it.dispatchedQty ?? it.orderQty ?? 0);
                    const rate = Number(it.rate || 0);
                    const lineTotal = qty * rate;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-meta-4/10">
                        <td className="py-2.5 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold text-black dark:text-white">{itemName}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {formatItemDisplay(it, qty)}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {rate > 0 ? `Rs. ${rate.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right pr-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                          {lineTotal > 0 ? `Rs. ${lineTotal.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="w-full text-black dark:text-white text-xs flex flex-col space-y-3">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            placeholder={isPurchaseReturn ? "Search vendor, return #, item..." : "Search customer, challan, vehicle..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-white px-3.5 py-2 pl-9 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark font-bold shadow-xs text-xs"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" size={14} />
        </div>

        {!isPurchaseReturn && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Workflow Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-meta-4 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setWorkflowFilter('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  workflowFilter === 'ALL'
                    ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
              >
                All Mode ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setWorkflowFilter('AUTOMATIC')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  workflowFilter === 'AUTOMATIC'
                    ? 'bg-white dark:bg-boxdark text-emerald-600 shadow-xs'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>⚡ Automatic</span>
                <span className="text-[10px] opacity-75">
                  ({records.filter(r => String(r.remarks || '').includes('[AUTOMATIC]')).length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setWorkflowFilter('MANUAL')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                  workflowFilter === 'MANUAL'
                    ? 'bg-white dark:bg-boxdark text-indigo-600 shadow-xs'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>📋 Manual</span>
                <span className="text-[10px] opacity-75">
                  ({records.filter(r => !String(r.remarks || '').includes('[AUTOMATIC]')).length})
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Content */}
      <div className="flex-grow overflow-y-auto max-h-[72vh] space-y-3 pr-1">
        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark">
            <Spinner />
          </div>
        ) : isPurchaseReturn ? (
          /* Purchase Return Flat Table */
          <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
            <table className="w-full table-auto border-collapse text-left">
              <thead className="sticky top-0 bg-slate-100 dark:bg-meta-4 z-10 shadow-xs">
                <tr className="text-[10px] font-black uppercase tracking-wider border-b border-stroke text-slate-700 dark:text-white">
                  <th className="py-3 px-4 whitespace-nowrap">Return / Debit Note #</th>
                  <th className="py-3 px-4 whitespace-nowrap">Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Linked Purchase #</th>
                  <th className="py-3 px-4 whitespace-nowrap">Vendor / Supplier</th>
                  <th className="py-3 px-4 whitespace-nowrap">Warehouse</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-bold italic">
                      No processed purchase returns found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const code = rec.return_no || `PR-${rec.id}`;
                    const isDone = rec.status === 'Refunded' || rec.status === 'Dispatched';
                    const dateStr = rec.return_date || (rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '—');

                    return (
                      <tr
                        key={rec.id}
                        className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150 font-semibold text-xs text-black dark:text-white"
                      >
                        <td className="py-3 px-4 font-bold font-mono whitespace-nowrap text-primary">{code}</td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-medium">{dateStr}</td>
                        <td className="py-3 px-4 font-mono font-bold whitespace-nowrap text-rose-600 dark:text-rose-400">{rec.purchase_no || 'Direct Return'}</td>
                        <td className="py-3 px-4 font-sans font-bold whitespace-nowrap">{rec.vendor_name || '—'}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex rounded-md py-0.5 px-2 text-[10px] font-black uppercase tracking-wide bg-slate-100 dark:bg-meta-4 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600">
                            {rec.source_warehouse || rec.warehouse_name || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex rounded-md py-0.5 px-2.5 text-[9px] font-black uppercase tracking-wide border ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                          }`}>
                            {rec.status || 'Dispatched'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(rec)}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 p-1.5 rounded transition shadow-xs cursor-pointer"
                              title="View Details"
                            >
                              <FiEye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrint(rec)}
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 p-1.5 rounded transition shadow-xs cursor-pointer"
                              title="Print Debit Note"
                            >
                              <FiPrinter size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : groupedInvoices.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark text-slate-400 font-bold italic">
            No processed delivery challans found.
          </div>
        ) : (
          /* Sales Delivery Challans Grouped by Invoice */
          groupedInvoices.map((group) => (
            <div
              key={group.invoice_no}
              className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden transition"
            >
              {/* Group Header */}
              <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-meta-4/20 border-b border-stroke dark:border-strokedark gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">
                    {group.invoice_no}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-xs font-bold text-black dark:text-white">
                    {group.customer_name}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Dispatch Warehouse: <span className="font-semibold text-slate-700 dark:text-slate-300">{group.warehouse}</span>
                  </span>
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-meta-4 text-slate-700 dark:text-slate-200 font-mono">
                    {group.challans.length} {group.challans.length === 1 ? 'Challan' : 'Challans / Gate Passes'}
                  </span>
                </div>
              </div>

              {/* Sub-table for Challans of this Invoice */}
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-left">
                  <thead className="bg-slate-100/60 dark:bg-meta-4/10">
                    <tr className="text-[10px] font-black uppercase tracking-wider border-b border-stroke text-slate-600 dark:text-slate-300">
                      <th className="py-2.5 px-4 whitespace-nowrap w-40">Challan / GP #</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Date</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Vehicle / Driver</th>
                      <th className="py-2.5 px-4 text-center whitespace-nowrap">Workflow Mode</th>
                      <th className="py-2.5 px-4">Items / Breakdown</th>
                      <th className="py-2.5 px-4 text-center whitespace-nowrap">Status</th>
                      <th className="py-2.5 px-4 text-center w-28 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    {group.challans.map((rec: any) => {
                      const code = rec.challan_no || `DC-${String(rec.id).padStart(4, '0')}`;
                      const isDone = rec.status === 'Dispatched' || rec.status === 'Fully Dispatched';
                      const dateStr = rec.return_date || rec.challan_date || (rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '—');
                      const isAuto = String(rec.remarks || '').includes('[AUTOMATIC]');

                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150 font-semibold text-xs text-black dark:text-white"
                        >
                          {/* Code */}
                          <td className="py-3 px-4 font-bold font-mono whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-primary">{code}</span>
                              {rec.gate_pass_no && rec.gate_pass_no !== code && (
                                <span className="text-[10px] text-emerald-600 font-black">
                                  GP: {rec.gate_pass_no}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-medium text-[11px]">
                            {dateStr}
                          </td>

                          {/* Vehicle */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="font-bold text-black dark:text-white text-[11px]">{rec.vehicle_no || 'By Hand'}</p>
                            <p className="text-[10px] text-gray-400">{rec.driver_name || rec.transport_name || '—'}</p>
                          </td>

                          {/* Workflow Mode */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isAuto ? (
                              <span className="inline-flex items-center gap-1 rounded-md py-0.5 px-2 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs">
                                ⚡ Automatic
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md py-0.5 px-2 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 shadow-2xs">
                                📋 Manual GP
                              </span>
                            )}
                          </td>

                          {/* Items / Breakdown */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5 max-w-[280px]">
                              {(rec.items || []).map((it: any, itIdx: number) => {
                                const q = Number(it.qty ?? it.dispatchedQty ?? 0);
                                return (
                                  <div key={itIdx} className="text-[10px] text-slate-700 dark:text-slate-200 leading-tight">
                                    <span className="font-semibold">• {it.itemName || it.pDescription || it.product_name}</span>
                                    <span className="ml-1 text-primary font-mono font-bold">
                                      ({formatItemDisplay(it, q)})
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-md py-0.5 px-2.5 text-[9px] font-black uppercase tracking-wide border ${
                                isDone
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                              }`}
                            >
                              {rec.status || 'Dispatched'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(rec)}
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 p-1.5 rounded transition shadow-xs cursor-pointer"
                                title="View Details"
                              >
                                <FiEye size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePrint(rec)}
                                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 p-1.5 rounded transition shadow-xs cursor-pointer"
                                title="Print Challan / Gate Pass"
                              >
                                <FiPrinter size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryChallanProcessedHistory;
