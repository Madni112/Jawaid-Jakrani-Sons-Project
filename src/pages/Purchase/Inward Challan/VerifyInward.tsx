import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdCheckCircle, MdArrowBack } from 'react-icons/md';

const VerifyInward = ({ inwardId, locationFilter, onSuccess, onCancel, readonly, isEditMode }: { inwardId?: string, locationFilter?: string, onSuccess?: () => void, onCancel?: () => void, readonly?: boolean, isEditMode?: boolean }) => {
  const params = useParams();
  const idToUse = inwardId || params.id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [challan, setChallan] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);

  useEffect(() => {
    fetchChallanData();
  }, [idToUse]);

  const fetchChallanData = async () => {
    setLoading(true);
    try {
      // Fetch Header & Purchases in parallel (limit purchases to recent)
      const [ { data: grnData, error: grnError }, { data: purchasesData } ] = await Promise.all([
        supabase.from('grn_receipts').select('*').eq('id', idToUse).single(),
        supabase.from('supplier_purchases').select('id, purchase_no, bill_no, metadata, created_at').order('created_at', { ascending: false }).limit(60)
      ]);

      if (grnError) throw grnError;

      // 1. Match by metadata ID
      let linkedPur = (purchasesData || []).find((p: any) =>
        p.metadata?.grn_id === idToUse ||
        (Array.isArray(p.metadata?.grn_ids) && p.metadata.grn_ids.includes(idToUse))
      );

      // 2. Remarks match (e.g. "[MANUAL] ... for 04 (..." or "for PUR-04")
      if (!linkedPur && grnData?.remarks) {
        const remarkMatch = String(grnData.remarks).match(/for\s+([A-Za-z0-9_-]+)/i);
        if (remarkMatch && remarkMatch[1]) {
          const extracted = remarkMatch[1].trim();
          const cleanExtracted = extracted.replace(/^PUR-?/i, '');
          linkedPur = (purchasesData || []).find((p: any) => {
            if (!p.purchase_no) return false;
            const pNo = String(p.purchase_no).trim();
            const cleanPNo = pNo.replace(/^PUR-?/i, '');
            return pNo.toUpperCase() === extracted.toUpperCase() || cleanPNo === cleanExtracted;
          });
        }
      }

      // 3. Fallback for automatic GRNs that end with -GRN-{purchaseNo} or GRN-{purchaseNo}
      if (!linkedPur && grnData?.grn_no) {
        const grnUpper = String(grnData.grn_no).toUpperCase();
        const grnMatch = grnUpper.match(/(?:^|-)GRN-([A-Za-z0-9]+)$/);
        if (grnMatch && grnMatch[1]) {
          const suffix = grnMatch[1];
          linkedPur = (purchasesData || []).find((p: any) => {
            if (!p.purchase_no) return false;
            const cleanPNo = String(p.purchase_no).trim().replace(/^PUR-?/i, '');
            return cleanPNo === suffix;
          });
        }
      }

      const fallbackRemarkPurNo = grnData?.remarks?.match(/for\s+([A-Za-z0-9_-]+)/i)?.[1];
      const resolvedPurchaseNo = linkedPur?.purchase_no
        ? (String(linkedPur.purchase_no).toUpperCase().startsWith('PUR-')
            ? String(linkedPur.purchase_no).toUpperCase()
            : `PUR-${linkedPur.purchase_no}`)
        : (fallbackRemarkPurNo
            ? `PUR-${fallbackRemarkPurNo.replace(/^PUR-?/i, '')}`
            : '');

      // Parse Gate Passes from remarks
      let gatePasses: Record<string, string> = {};
      const rawRemarks = String(grnData?.remarks || '');
      const jsonMatch = rawRemarks.match(/\[GatePasses:\s*(\{.*?\})\]/s);
      if (jsonMatch) {
        try {
          gatePasses = JSON.parse(jsonMatch[1]);
        } catch (e) {}
      }
      if (Object.keys(gatePasses).length === 0) {
        const singleMatch = rawRemarks.match(/\[Gate Pass:\s*([^\]]+)\]/i);
        if (singleMatch) {
          gatePasses['DEFAULT'] = singleMatch[1].trim();
        }
      }

      const resolvedChallanNo = grnData?.challan_no || (grnData?.grn_no ? `IC-${grnData.grn_no.replace(/^GRN-/, '')}` : 'IC-01');

      setChallan({
        ...grnData,
        purchase_no: resolvedPurchaseNo,
        challan_no: resolvedChallanNo,
        linked_purchase: linkedPur,
        gatePasses
      });

      // Fetch Items
      const { data: itemsData, error: itemsError } = await supabase
        .from('grn_items')
        .select('*')
        .eq('grn_id', idToUse);

      if (itemsError) throw itemsError;

      // Batch fetch product info for all items in 1 query instead of looping N times
      const prodNames = Array.from(new Set((itemsData || []).map((i: any) => i.product_name).filter(Boolean)));
      const prodMap: Record<string, any> = {};
      if (prodNames.length > 0) {
        const { data: prodList } = await supabase
          .from('products')
          .select('product_name, category, pcs_per_box, pieces_per_box, pieces_per_packing, scenario_name, uom, allow_loose_sales, loose_conversion_ratio')
          .in('product_name', prodNames);
        (prodList || []).forEach((p: any) => {
          if (p.product_name) prodMap[String(p.product_name).trim().toLowerCase()] = p;
        });
      }

      // Initialize items synchronously from the batch map
      const initializedItems = (itemsData || []).map((item) => {
        const prodInfo = prodMap[String(item.product_name).trim().toLowerCase()];
        const looseRatio = Number(prodInfo?.loose_conversion_ratio || 0);
        const boxPcs = Number(prodInfo?.pieces_per_box ?? prodInfo?.pcs_per_box ?? prodInfo?.pieces_per_packing ?? 0);
        const rawPcs = looseRatio > 0 ? looseRatio : boxPcs;
        const isTile = rawPcs > 1 || String(prodInfo?.scenario_name || '').toUpperCase().includes('TILE') || String(prodInfo?.category || '').toUpperCase().includes('TILE') || String(prodInfo?.uom || '').toUpperCase() === 'BOX';
        const pcsPerBox = rawPcs > 1 ? rawPcs : (isTile ? 4 : 1);

        const totalQty = Number(item.qty || 0);
        const prevAccepted = Number(item.accepted_qty || 0);
        const prevRejected = Number(item.rejected_qty || 0);
        const prevHold = Number(item.hold_qty ?? (item.accepted_qty == null ? totalQty : Math.max(0, totalQty - prevAccepted - prevRejected)));
        
        const remainingHold = isEditMode 
          ? totalQty 
          : (item.accepted_qty == null ? totalQty : Math.max(0, Number((totalQty - prevAccepted - prevRejected).toFixed(3))));

        return {
          ...item,
          totalQty,
          prevAccepted,
          prevRejected,
          prevHold,
          remainingHold,
          receiveNow: isEditMode ? prevAccepted : remainingHold,
          rejectNow: isEditMode ? prevRejected : 0,
          newHold: isEditMode ? prevHold : 0,
          rejectReason: item.reject_reason || '',
          isTile,
          pcsPerBox
        };
      });
      
      setAllItems(initializedItems);

      // Filter UI items based on location filter
      let displayItems = initializedItems;
      if (locationFilter && locationFilter !== 'ALL') {
        displayItems = initializedItems.filter(item => {
          const isShop = String(item.warehouse_name).toUpperCase() === 'SHOP';
          return locationFilter === 'SHOP' ? isShop : !isShop;
        });
      }
      setItems(displayItems);

    } catch (err: any) {
      toast.error('Error fetching challan details.');
      if (onSuccess) onSuccess();
      else navigate(`/Purchase/Inward-Challan/List`);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    
    if (field === 'rejectReason') {
      newItems[index][field] = value;
      setItems(newItems);
      return;
    }
    
    let val = Number(value);
    if (isNaN(val) || val < 0) val = 0;
    const pool = isEditMode
      ? Number(newItems[index].totalQty || 0)
      : Number(newItems[index].remainingHold || 0);
    if (val > pool) val = pool;

    newItems[index][field] = val;

    // 3-way dynamic auto-balance so receiveNow + newHold + rejectNow = pool
    if (field === 'receiveNow') {
      const remAfterRec = Math.max(0, Number((pool - val).toFixed(3)));
      if (Number(newItems[index].rejectNow || 0) > remAfterRec) {
        newItems[index].rejectNow = remAfterRec;
        newItems[index].newHold = 0;
      } else {
        newItems[index].newHold = Number((remAfterRec - Number(newItems[index].rejectNow || 0)).toFixed(3));
      }
    } else if (field === 'newHold') {
      const remAfterHold = Math.max(0, Number((pool - val).toFixed(3)));
      if (Number(newItems[index].rejectNow || 0) > remAfterHold) {
        newItems[index].rejectNow = remAfterHold;
        newItems[index].receiveNow = 0;
      } else {
        newItems[index].receiveNow = Number((remAfterHold - Number(newItems[index].rejectNow || 0)).toFixed(3));
      }
    } else if (field === 'rejectNow') {
      const remAfterRej = Math.max(0, Number((pool - val).toFixed(3)));
      if (Number(newItems[index].receiveNow || 0) > remAfterRej) {
        newItems[index].receiveNow = remAfterRej;
        newItems[index].newHold = 0;
      } else {
        newItems[index].newHold = Number((remAfterRej - Number(newItems[index].receiveNow || 0)).toFixed(3));
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (items.some((item) => Number(item.rejectNow) > 0 && !item.rejectReason)) {
      toast.error('Please provide a reason for all rejected items.');
      return;
    }
    const confirmMsg = isEditMode
      ? 'Are you sure you want to save these stock adjustments? Physical inventory will be recalculated.'
      : 'Are you sure you want to confirm this Inward Challan? Stock will be updated.';
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      // 1. Update Items in DB with cumulative totals or direct values on edit
      for (const item of items) {
        const finalAccepted = isEditMode
          ? Number(Number(item.receiveNow || 0).toFixed(3))
          : Number((Number(item.prevAccepted || 0) + Number(item.receiveNow || 0)).toFixed(3));
        const finalRejected = isEditMode
          ? Number(Number(item.rejectNow || 0).toFixed(3))
          : Number((Number(item.prevRejected || 0) + Number(item.rejectNow || 0)).toFixed(3));
        const finalHold = Math.max(0, Number((Number(item.totalQty || 0) - finalAccepted - finalRejected).toFixed(3)));

        await supabase
          .from('grn_items')
          .update({
            accepted_qty: finalAccepted,
            rejected_qty: finalRejected,
            hold_qty: finalHold,
            reject_reason: item.rejectReason
          })
          .eq('id', item.id);
      }

      // 2. Update GRN Header
      const updatedAllItems = allItems.map(original => {
        const updated = items.find(i => i.id === original.id);
        if (updated) {
          const finalAccepted = isEditMode
            ? Number(Number(updated.receiveNow || 0).toFixed(3))
            : Number((Number(updated.prevAccepted || 0) + Number(updated.receiveNow || 0)).toFixed(3));
          const finalRejected = isEditMode
            ? Number(Number(updated.rejectNow || 0).toFixed(3))
            : Number((Number(updated.prevRejected || 0) + Number(updated.rejectNow || 0)).toFixed(3));
          const finalHold = Math.max(0, Number((Number(updated.totalQty || 0) - finalAccepted - finalRejected).toFixed(3)));
          return {
            finalAccepted,
            finalRejected,
            finalHold,
            qty: updated.totalQty
          };
        } else {
          const finalAccepted = Number(original.accepted_qty || 0);
          const finalRejected = Number(original.rejected_qty || 0);
          const finalHold = original.accepted_qty == null 
            ? Number(original.qty || 0)
            : Number(original.hold_qty ?? Math.max(0, Number(original.qty || 0) - finalAccepted - finalRejected));
          return {
            finalAccepted,
            finalRejected,
            finalHold,
            qty: Number(original.qty || 0)
          };
        }
      });

      const hasPendingHold = updatedAllItems.some(i => Number(i.finalHold) > 0);
      const allRejected = updatedAllItems.every(i => i.finalAccepted === 0 && i.finalRejected >= i.qty);
      const hasRejections = updatedAllItems.some(i => i.finalRejected > 0);

      let newStatus = 'Confirm';
      if (hasPendingHold) {
        newStatus = 'Pending Inward';
      } else if (allRejected) {
        newStatus = 'Rejected';
      } else if (hasRejections) {
        newStatus = 'Partially Received';
      } else {
        newStatus = 'Confirm';
      }

      const { error: grnError } = await supabase
        .from('grn_receipts')
        .update({ status: newStatus })
        .eq('id', challan.id);

      if (grnError) throw grnError;

      const toastMessage = hasPendingHold
        ? `Inward Challan updated! Items with hold moved back to Active Queue.`
        : `Inward Challan updated successfully! Status: ${newStatus}`;
      toast.success(toastMessage);

      if (onSuccess) onSuccess();
      else navigate(`/Purchase/Inward-Challan/List`);
    } catch (err: any) {
      toast.error('Failed to verify challan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTileDisplay = (qtyVal: number, pcsPerBox: number, isTile: boolean, uom: string = '') => {
    if (isTile && pcsPerBox > 1) {
      const totalPieces = Math.round(Number(qtyVal || 0) * pcsPerBox);
      const b = Math.floor(totalPieces / pcsPerBox);
      const p = totalPieces % pcsPerBox;
      if (b === 0 && p === 0) return '0 Box';
      return `${b} Box${p > 0 ? ` + ${p} Pcs` : ''}`;
    }
    return `${qtyVal ?? 0} ${uom}`.trim();
  };

  if (loading) return <div className="flex h-64 items-center justify-center bg-white dark:bg-boxdark"><Spinner /></div>;
  if (!challan) return null;

  return (
    <div className={`mx-auto max-w-7xl text-black dark:text-bodydark text-xs ${inwardId ? '' : 'pb-12'}`}>
      {!inwardId && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <MdCheckCircle className="text-emerald-600" size={24} />
            {readonly ? 'View Inward Challan Details' : (isEditMode ? 'Edit Inward Challan & QC Adjustments' : 'Receive Inward Stock (Incremental)')}
          </h2>
          <button
            onClick={() => navigate(`/Purchase/Inward-Challan/List`)}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            <MdArrowBack /> Back to List
          </button>
        </div>
      )}

      <div className={inwardId ? '' : 'rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6'}>
        {/* Header Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 pb-6 border-b border-stroke dark:border-strokedark">
          <div>
            <p className="text-gray-400 font-medium uppercase tracking-wide mb-1 text-[11px]">Challan / Gate Pass #</p>
            {(() => {
              const gps = challan.gatePasses || {};
              const gpKeys = Object.keys(gps);
              if (gpKeys.length > 0) {
                return (
                  <div className="space-y-0.5">
                    {gpKeys.map((wh) => {
                      const slip = gps[wh];
                      const safePrefix = wh !== 'DEFAULT' ? wh.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
                      const fullSlip = safePrefix && !String(slip).toUpperCase().startsWith(`${safePrefix}-`)
                        ? `${safePrefix}-${slip}`
                        : String(slip);
                      return (
                        <p key={wh} className="text-lg font-mono font-bold text-purple-700 dark:text-purple-300">
                          {fullSlip}
                        </p>
                      );
                    })}
                  </div>
                );
              }
              return (
                <p className="text-lg font-mono font-bold text-black dark:text-white">
                  {challan.challan_no || (challan.grn_no ? challan.grn_no.replace(/^GRN-/, 'IC-') : 'IC-01')}
                </p>
              );
            })()}
            <span className="text-[11px] font-mono text-gray-500 block mt-0.5">GRN: {challan.grn_no}</span>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase tracking-wide mb-1 text-[11px]">Purchase #</p>
            <p className="text-lg font-mono font-bold text-primary">
              {challan.purchase_no || <span className="text-gray-400 text-sm font-normal italic">Pending Bill (GRN)</span>}
            </p>
            <span className="inline-flex rounded py-0.5 px-2 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 mt-0.5">
              {challan.status === 'Confirm' ? 'Verified & Received' : (challan.status || 'Received')}
            </span>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase tracking-wide mb-1 text-[11px]">Vendor Name</p>
            <p className="text-sm font-bold text-black dark:text-white">{challan.vendor_name || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase tracking-wide mb-1 text-[11px]">Receipt Date</p>
            <p className="text-sm font-bold text-black dark:text-white">{challan.receipt_date || '—'}</p>
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-black dark:text-white">Inspection & Receiving Checklist</h3>
          {!readonly && (
            <span className={`text-[11px] px-2.5 py-1 rounded-md ${
              isEditMode 
                ? 'text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold'
                : 'text-gray-500 bg-slate-100 dark:bg-meta-4'
            }`}>
              {isEditMode 
                ? '⚡ History Adjustment Mode: Modify Accepted, Hold, or Rejected quantities. Stock will auto-sync.'
                : '⚡ Incremental Mode: Enter newly arrived stock to add to previous receipts'}
            </span>
          )}
        </div>

        <div className="max-w-full overflow-x-auto mb-8">
          <table className="w-full table-auto border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-white">
                <th className="py-3 px-3 border-b border-stroke dark:border-strokedark">Product Item</th>
                <th className="py-3 px-3 border-b border-stroke dark:border-strokedark">Destination Warehouse</th>
                <th className="py-3 px-3 border-b border-stroke dark:border-strokedark text-center">Expected Qty</th>
                {readonly ? (
                  <>
                    <th className="py-3 px-3 border-b border-stroke dark:border-strokedark text-center text-emerald-600 dark:text-emerald-400">Accepted Qty</th>
                    <th className="py-3 px-3 border-b border-stroke dark:border-strokedark text-center text-amber-500 dark:text-amber-400">On Hold</th>
                    <th className="py-3 px-3 border-b border-stroke dark:border-strokedark text-center text-rose-600 dark:text-rose-400">Rejected Qty</th>
                    <th className="py-3 px-3 border-b border-stroke dark:border-strokedark">Reject Reason</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-3 border-b border-stroke dark:border-strokedark text-center text-emerald-700 dark:text-emerald-400">
                      {isEditMode ? 'Original Accepted' : 'Previously Received'}
                    </th>
                    <th className="py-3 px-3 border-b border-stroke dark:border-strokedark text-center text-emerald-600 dark:text-emerald-400 min-w-[140px]">
                      {isEditMode ? 'Accepted Qty' : 'Receive Now'}
                    </th>
                    <th className="py-3 px-3 border-b border-stroke dark:border-strokedark text-center text-amber-600 dark:text-amber-400 min-w-[140px]">
                      {isEditMode ? 'On Hold (Quarantine)' : 'Still On Hold (Pending)'}
                    </th>
                    <th className="py-3 px-3 border-b border-stroke dark:border-strokedark text-center text-rose-600 dark:text-rose-400 min-w-[140px]">
                      {isEditMode ? 'Rejected Qty' : 'Reject Now'}
                    </th>
                    <th className="py-3 px-3 border-b border-stroke dark:border-strokedark min-w-[130px]">Reject Reason</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/20">
                  <td className="py-3 px-3 font-bold text-black dark:text-white">{item.product_name}</td>
                  <td className="py-3 px-3 text-gray-500">
                    <div className="flex items-center gap-2">
                      {item.warehouse_name}
                      {readonly && item.isVerified && (
                        <MdCheckCircle className="text-emerald-500 text-base" title="Verified by this location" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-gray-700 dark:text-gray-300">
                    {formatTileDisplay(item.totalQty || item.qty, item.pcsPerBox, item.isTile, item.uom)}
                  </td>

                  {readonly ? (
                    <>
                      <td className="py-2 px-2 text-center">
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatTileDisplay(item.accepted_qty ?? item.acceptedQty, item.pcsPerBox, item.isTile, item.uom)}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className={`font-mono font-bold ${Number(item.hold_qty ?? item.holdQty) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {Number(item.hold_qty ?? item.holdQty) > 0 
                            ? formatTileDisplay(item.hold_qty ?? item.holdQty, item.pcsPerBox, item.isTile, item.uom)
                            : '—'}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className={`font-mono font-bold ${Number(item.rejected_qty ?? item.rejectedQty) > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                          {Number(item.rejected_qty ?? item.rejectedQty) > 0 
                            ? formatTileDisplay(item.rejected_qty ?? item.rejectedQty, item.pcsPerBox, item.isTile, item.uom)
                            : '—'}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-gray-600 dark:text-gray-300">
                        {item.reject_reason || item.rejectReason || '—'}
                      </td>
                    </>
                  ) : (
                    <>
                      {/* PREVIOUSLY RECEIVED */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                          Number(item.prevAccepted || 0) > 0 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
                            : 'bg-gray-100 text-gray-500 dark:bg-meta-4 dark:text-gray-400'
                        }`}>
                          {Number(item.prevAccepted || 0) > 0 ? '✓ ' : ''}
                          {formatTileDisplay(item.prevAccepted, item.pcsPerBox, item.isTile, item.uom)}
                        </span>
                      </td>

                      {/* RECEIVE NOW */}
                      <td className="py-2 px-2 text-center">
                        {item.remainingHold <= 0 ? (
                          <span className="text-gray-400 font-semibold italic text-[11px]">Fully Received</span>
                        ) : item.isTile && item.pcsPerBox > 1 ? (
                          <div className="flex items-start gap-1 bg-emerald-50 dark:bg-emerald-900/20 p-1.5 rounded-lg border border-emerald-300 min-w-[130px]">
                            <div className="flex-1 flex items-center bg-white dark:bg-boxdark border border-emerald-400 dark:border-emerald-600 rounded-md px-1 py-1 focus-within:ring-1 focus-within:ring-emerald-500 shadow-sm mt-0.5">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={(() => {
                                  const totalPieces = Math.round(Number(item.receiveNow || 0) * item.pcsPerBox);
                                  const b = Math.floor(totalPieces / item.pcsPerBox);
                                  return b === 0 && totalPieces === 0 ? '' : b;
                                })()}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  const newBoxes = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                  const totalPieces = Math.round(Number(item.receiveNow || 0) * item.pcsPerBox);
                                  const currentLoose = totalPieces % item.pcsPerBox;
                                  const newQty = Number((newBoxes + currentLoose / item.pcsPerBox).toFixed(3));
                                  handleItemChange(index, 'receiveNow', Math.min(Number(item.remainingHold), newQty));
                                }}
                                className="w-full bg-transparent text-center font-mono font-bold text-emerald-700 outline-none text-xs min-w-[24px]"
                              />
                              <span className="text-[9px] font-bold text-emerald-700/60 dark:text-emerald-400/60 pr-1 select-none">Box</span>
                            </div>
                            <div className="text-emerald-500 font-black text-[10px] mt-2">+</div>
                            <div className="flex flex-col items-center flex-1">
                              <div className="w-full flex items-center bg-white dark:bg-boxdark border border-emerald-400 dark:border-emerald-600 rounded-md px-1 py-1 focus-within:ring-1 focus-within:ring-emerald-500 shadow-sm mt-0.5">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={(() => {
                                    const totalPieces = Math.round(Number(item.receiveNow || 0) * item.pcsPerBox);
                                    const currentLoose = totalPieces % item.pcsPerBox;
                                    return currentLoose === 0 && totalPieces === 0 ? '' : currentLoose;
                                  })()}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value.trim();
                                    const enteredLoose = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                    const totalPieces = Math.round(Number(item.receiveNow || 0) * item.pcsPerBox);
                                    const currentBoxes = Math.floor(totalPieces / item.pcsPerBox);
                                    const extraBoxes = Math.floor(enteredLoose / item.pcsPerBox);
                                    const remLoose = enteredLoose % item.pcsPerBox;
                                    const finalBoxes = currentBoxes + extraBoxes;
                                    const newQty = Number((finalBoxes + remLoose / item.pcsPerBox).toFixed(3));
                                    handleItemChange(index, 'receiveNow', Math.min(Number(item.remainingHold), newQty));
                                  }}
                                  className="w-full bg-transparent text-center font-mono font-bold text-emerald-700 outline-none text-xs min-w-[24px]"
                                />
                                <span className="text-[9px] font-bold text-emerald-700/60 dark:text-emerald-400/60 pl-1 select-none">Pcs</span>
                              </div>
                              <span className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold leading-none">{item.pcsPerBox} pcs/box</span>
                            </div>
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max={item.remainingHold}
                            value={item.receiveNow === 0 ? '' : item.receiveNow}
                            onChange={(e) => handleItemChange(index, 'receiveNow', e.target.value)}
                            className="w-24 rounded-lg border border-emerald-400 dark:border-emerald-600 py-1.5 px-3 bg-white dark:bg-boxdark outline-none focus:border-emerald-500 font-mono font-bold text-emerald-700 text-sm shadow-sm text-center mx-auto block"
                            placeholder="0"
                          />
                        )}
                      </td>

                      {/* STILL ON HOLD (PENDING) */}
                      <td className="py-2 px-2 text-center">
                        {item.remainingHold <= 0 ? (
                          <span className="text-gray-400 font-semibold italic text-[11px]">—</span>
                        ) : item.isTile && item.pcsPerBox > 1 ? (
                          <div className="flex items-start gap-1 bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-lg border border-amber-300 min-w-[130px]">
                            <div className="flex-1 flex items-center bg-white dark:bg-boxdark border border-amber-400 dark:border-amber-600 rounded-md px-1 py-1 focus-within:ring-1 focus-within:ring-amber-500 shadow-sm mt-0.5">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={(() => {
                                  const totalPieces = Math.round(Number(item.newHold || 0) * item.pcsPerBox);
                                  const b = Math.floor(totalPieces / item.pcsPerBox);
                                  return b === 0 && totalPieces === 0 ? '' : b;
                                })()}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  const newBoxes = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                  const totalPieces = Math.round(Number(item.newHold || 0) * item.pcsPerBox);
                                  const currentLoose = totalPieces % item.pcsPerBox;
                                  const newQty = Number((newBoxes + currentLoose / item.pcsPerBox).toFixed(3));
                                  handleItemChange(index, 'newHold', Math.min(Number(item.remainingHold), newQty));
                                }}
                                className="w-full bg-transparent text-center font-mono font-bold text-amber-600 outline-none text-xs min-w-[24px]"
                              />
                              <span className="text-[9px] font-bold text-amber-600/60 dark:text-amber-400/60 pr-1 select-none">Box</span>
                            </div>
                            <div className="text-amber-500 font-black text-[10px] mt-2">+</div>
                            <div className="flex flex-col items-center flex-1">
                              <div className="w-full flex items-center bg-white dark:bg-boxdark border border-amber-400 dark:border-amber-600 rounded-md px-1 py-1 focus-within:ring-1 focus-within:ring-amber-500 shadow-sm mt-0.5">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={(() => {
                                    const totalPieces = Math.round(Number(item.newHold || 0) * item.pcsPerBox);
                                    const currentLoose = totalPieces % item.pcsPerBox;
                                    return currentLoose === 0 && totalPieces === 0 ? '' : currentLoose;
                                  })()}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value.trim();
                                    const enteredLoose = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                    const totalPieces = Math.round(Number(item.newHold || 0) * item.pcsPerBox);
                                    const currentBoxes = Math.floor(totalPieces / item.pcsPerBox);
                                    const extraBoxes = Math.floor(enteredLoose / item.pcsPerBox);
                                    const remLoose = enteredLoose % item.pcsPerBox;
                                    const finalBoxes = currentBoxes + extraBoxes;
                                    const newQty = Number((finalBoxes + remLoose / item.pcsPerBox).toFixed(3));
                                    handleItemChange(index, 'newHold', Math.min(Number(item.remainingHold), newQty));
                                  }}
                                  className="w-full bg-transparent text-center font-mono font-bold text-amber-600 outline-none text-xs min-w-[24px]"
                                />
                                <span className="text-[9px] font-bold text-amber-600/60 dark:text-amber-400/60 pl-1 select-none">Pcs</span>
                              </div>
                              <span className="text-[8px] text-amber-600 dark:text-amber-400 mt-0.5 font-bold leading-none">{item.pcsPerBox} pcs/box</span>
                            </div>
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max={item.remainingHold}
                            value={item.newHold === 0 ? '' : item.newHold}
                            onChange={(e) => handleItemChange(index, 'newHold', e.target.value)}
                            className="w-24 rounded-lg border border-amber-400 dark:border-amber-600 py-1.5 px-3 bg-white dark:bg-boxdark outline-none focus:border-amber-500 font-mono font-bold text-amber-600 text-sm shadow-sm text-center mx-auto block"
                            placeholder="0"
                          />
                        )}
                      </td>

                      {/* REJECT NOW */}
                      <td className="py-2 px-2 text-center">
                        {item.remainingHold <= 0 ? (
                          <span className="text-gray-400 font-semibold italic text-[11px]">—</span>
                        ) : item.isTile && item.pcsPerBox > 1 ? (
                          <div className="flex items-start gap-1 bg-rose-50 dark:bg-rose-900/20 p-1.5 rounded-lg border border-rose-300 min-w-[130px]">
                            <div className="flex-1 flex items-center bg-white dark:bg-boxdark border border-rose-400 dark:border-rose-600 rounded-md px-1 py-1 focus-within:ring-1 focus-within:ring-rose-500 shadow-sm mt-0.5">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={(() => {
                                  const totalPieces = Math.round(Number(item.rejectNow || 0) * item.pcsPerBox);
                                  const b = Math.floor(totalPieces / item.pcsPerBox);
                                  return b === 0 && totalPieces === 0 ? '' : b;
                                })()}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  const newBoxes = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                  const totalPieces = Math.round(Number(item.rejectNow || 0) * item.pcsPerBox);
                                  const currentLoose = totalPieces % item.pcsPerBox;
                                  const newQty = Number((newBoxes + currentLoose / item.pcsPerBox).toFixed(3));
                                  handleItemChange(index, 'rejectNow', Math.min(Number(item.remainingHold), newQty));
                                }}
                                className="w-full bg-transparent text-center font-mono font-bold text-rose-700 outline-none text-xs min-w-[24px]"
                              />
                              <span className="text-[9px] font-bold text-rose-700/60 dark:text-rose-400/60 pr-1 select-none">Box</span>
                            </div>
                            <div className="text-rose-500 font-black text-[10px] mt-2">+</div>
                            <div className="flex flex-col items-center flex-1">
                              <div className="w-full flex items-center bg-white dark:bg-boxdark border border-rose-400 dark:border-rose-600 rounded-md px-1 py-1 focus-within:ring-1 focus-within:ring-rose-500 shadow-sm mt-0.5">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={(() => {
                                    const totalPieces = Math.round(Number(item.rejectNow || 0) * item.pcsPerBox);
                                    const currentLoose = totalPieces % item.pcsPerBox;
                                    return currentLoose === 0 && totalPieces === 0 ? '' : currentLoose;
                                  })()}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value.trim();
                                    const enteredLoose = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
                                    const totalPieces = Math.round(Number(item.rejectNow || 0) * item.pcsPerBox);
                                    const currentBoxes = Math.floor(totalPieces / item.pcsPerBox);
                                    const extraBoxes = Math.floor(enteredLoose / item.pcsPerBox);
                                    const remLoose = enteredLoose % item.pcsPerBox;
                                    const finalBoxes = currentBoxes + extraBoxes;
                                    const newQty = Number((finalBoxes + remLoose / item.pcsPerBox).toFixed(3));
                                    handleItemChange(index, 'rejectNow', Math.min(Number(item.remainingHold), newQty));
                                  }}
                                  className="w-full bg-transparent text-center font-mono font-bold text-rose-700 outline-none text-xs min-w-[24px]"
                                />
                                <span className="text-[9px] font-bold text-rose-700/60 dark:text-rose-400/60 pl-1 select-none">Pcs</span>
                              </div>
                              <span className="text-[8px] text-rose-600 dark:text-rose-400 mt-0.5 font-bold leading-none">{item.pcsPerBox} pcs/box</span>
                            </div>
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max={item.remainingHold}
                            value={item.rejectNow === 0 ? '' : item.rejectNow}
                            onChange={(e) => handleItemChange(index, 'rejectNow', e.target.value)}
                            className="w-24 rounded-lg border border-rose-400 dark:border-rose-600 py-1.5 px-3 bg-white dark:bg-boxdark outline-none focus:border-rose-500 font-mono font-bold text-rose-700 text-sm shadow-sm text-center mx-auto block"
                            placeholder="0"
                          />
                        )}
                      </td>

                      {/* REJECT REASON */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.rejectReason}
                          disabled={item.remainingHold <= 0}
                          onChange={(e) => handleItemChange(index, 'rejectReason', e.target.value)}
                          placeholder={Number(item.rejectNow) > 0 ? "Reason for rejection (required)" : "Optional notes"}
                          className={`w-full rounded border px-2 py-1.5 outline-none focus:border-primary disabled:opacity-50 dark:bg-boxdark ${
                            submitted && Number(item.rejectNow) > 0 && !item.rejectReason
                              ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500 placeholder-rose-300'
                              : 'border-stroke dark:border-strokedark'
                          }`}
                        />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-stroke dark:border-strokedark pt-6">
          <button
            type="button"
            onClick={() => {
              if (onCancel) onCancel();
              else if (onSuccess) onSuccess();
              else navigate(`/Purchase/Inward-Challan/List`);
            }}
            className="rounded-lg border border-stroke px-6 py-2 font-medium hover:bg-slate-50 dark:border-strokedark dark:hover:bg-meta-4 transition"
            disabled={submitting}
          >
            {readonly ? 'Close' : 'Cancel'}
          </button>
          {!readonly && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {submitting ? <Spinner /> : <MdCheckCircle size={16} />}
              {isEditMode ? 'Save & Apply Adjustments' : 'Confirm Inward Verification'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyInward;
