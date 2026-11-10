import React, { useEffect, useState } from 'react';
import { supabase } from '../../../Context/supabaseClient';
import { FiEye, FiPrinter, FiTruck, FiArrowLeft, FiSearch, FiCheckCircle, FiClock, FiFileText, FiEdit2, FiSave } from 'react-icons/fi';
import Spinner from '../../../ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Context/Auth';
import toast from 'react-hot-toast';

interface DeliveryChallanProcessedHistoryProps {
  locationFilter?: string;
  isPurchaseReturn?: boolean;
  onPrint?: (record: any) => void;
  onClose?: () => void;
}

const DeliveryChallanProcessedHistory: React.FC<DeliveryChallanProcessedHistoryProps> = ({
  locationFilter,
  isPurchaseReturn = false,
  onPrint,
  onClose,
}) => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Dispatched' | 'Partially Dispatched'>('ALL');
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
    fetchHistory();
  }, [locationFilter, isPurchaseReturn]);

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

        const { data, error } = await query;
        if (error) throw error;
        setRecords(data || []);
      } else {
        let query = supabase
          .from('delivery_challans')
          .select('*')
          .order('created_at', { ascending: false });

        if (locationFilter) {
          query = query.eq('dispatch_warehouse', locationFilter);
        }

        const { data, error } = await query;
        if (error) throw error;

        const allDc = data || [];
        const processed = allDc.filter(
          (c) =>
            c.status === 'Dispatched' ||
            c.status === 'Fully Dispatched' ||
            c.status === 'Partially Dispatched' ||
            c.is_printed
        );

        setRecords(processed.length > 0 ? processed : allDc);
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
    } else if (isPurchaseReturn) {
      navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Return/Print/${rec.id}`);
    } else {
      navigate(`${tenantId ? `/${tenantId}` : ''}/Delivery-Challan/Print/${rec.id}`);
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

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'Dispatched') {
      return r.status === 'Dispatched' || r.status === 'Fully Dispatched';
    }
    if (statusFilter === 'Partially Dispatched') {
      return r.status === 'Partially Dispatched';
    }
    return true;
  });

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
                          {qty} {it.uom || ''}
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
    <div className="w-full text-black dark:text-white text-xs max-h-[75vh] flex flex-col space-y-3">
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
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-meta-4 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              All ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Dispatched')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                statusFilter === 'Dispatched'
                  ? 'bg-white dark:bg-boxdark text-emerald-600 shadow-xs'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Fully Dispatched
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Partially Dispatched')}
              className={`px-3 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                statusFilter === 'Partially Dispatched'
                  ? 'bg-white dark:bg-boxdark text-amber-600 shadow-xs'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Partial
            </button>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark flex-grow overflow-hidden flex flex-col">
        <div className="max-w-full overflow-y-auto max-h-[55vh]">
          <table className="w-full table-auto border-collapse text-left">
            <thead className="sticky top-0 bg-slate-100 dark:bg-meta-4 z-10 shadow-xs">
              <tr className="text-[10px] font-black uppercase tracking-wider border-b border-stroke text-slate-700 dark:text-white">
                <th className="py-3 px-4 whitespace-nowrap">{isPurchaseReturn ? 'Return / Debit Note #' : 'Challan / GP #'}</th>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 whitespace-nowrap">{isPurchaseReturn ? 'Linked Purchase #' : 'Invoice #'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{isPurchaseReturn ? 'Vendor / Supplier' : 'Customer Name'}</th>
                <th className="py-3 px-4 whitespace-nowrap">Warehouse</th>
                {!isPurchaseReturn && <th className="py-3 px-4 whitespace-nowrap">Vehicle / Driver</th>}
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {loading ? (
                <tr>
                  <td colSpan={isPurchaseReturn ? 7 : 8} className="text-center py-12">
                    <Spinner />
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isPurchaseReturn ? 7 : 8} className="text-center py-12 text-slate-400 font-bold italic">
                    {isPurchaseReturn ? 'No processed purchase returns found.' : 'No processed delivery challans found.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const code = isPurchaseReturn
                    ? (rec.return_no || `PR-${rec.id}`)
                    : (rec.challan_no || `DC-${String(rec.id).padStart(4, '0')}`);
                  const isDone = rec.status === 'Dispatched' || rec.status === 'Fully Dispatched' || rec.status === 'Refunded';
                  const dateStr = rec.return_date || rec.challan_date || (rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '—');

                  return (
                    <tr
                      key={rec.id}
                      className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150 font-semibold text-xs text-black dark:text-white"
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-bold font-mono whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-primary">{code}</span>
                          {!isPurchaseReturn && rec.gate_pass_no && (
                            <span className="text-[10px] text-emerald-600 font-black">
                              GP: {rec.gate_pass_no}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-medium">
                        {dateStr}
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-4 font-mono font-bold whitespace-nowrap text-rose-600 dark:text-rose-400">
                        {isPurchaseReturn ? (rec.purchase_no || 'Direct Return') : (rec.invoice_no || 'Direct DC')}
                      </td>

                      {/* Party */}
                      <td className="py-3 px-4 font-sans font-bold whitespace-nowrap">
                        {isPurchaseReturn ? (rec.vendor_name || '—') : (rec.customer_name || 'Walk-in')}
                      </td>

                      {/* Warehouse */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex rounded-md py-0.5 px-2 text-[10px] font-black uppercase tracking-wide bg-slate-100 dark:bg-meta-4 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600">
                          {rec.source_warehouse || rec.warehouse_name || rec.dispatch_warehouse || '—'}
                        </span>
                      </td>

                      {/* Vehicle if sales */}
                      {!isPurchaseReturn && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-bold text-black dark:text-white">{rec.vehicle_no || 'By Hand'}</p>
                          <p className="text-[10px] text-gray-400">{rec.driver_name || rec.transport_name || '—'}</p>
                        </td>
                      )}

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
                            onClick={() => {
                              setEditingRecord(rec);
                              const parsed = (rec.items || []).map((it: any) => {
                                const orderQty = Number(it.orderQty ?? it.qty ?? 0);
                                const dispatchedQty = Number(it.dispatchedQty ?? orderQty);
                                return {
                                  ...it,
                                  orderQty,
                                  dispatchedQty,
                                  holdQty: Math.max(0, Number((orderQty - dispatchedQty).toFixed(3))),
                                  remarks: it.remarks || ''
                                };
                              });
                              setEditItems(parsed);
                            }}
                            className="bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 p-1.5 rounded transition shadow-xs cursor-pointer"
                            title="Edit Dispatched / Hold Quantities"
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrint(rec)}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 p-1.5 rounded transition shadow-xs cursor-pointer"
                            title={isPurchaseReturn ? "Print Debit Note" : "Print Challan"}
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
      </div>
    </div>
  );
};

export default DeliveryChallanProcessedHistory;
