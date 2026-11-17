import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdCheckCircle, MdArrowBack } from 'react-icons/md';
import { FiPrinter } from 'react-icons/fi';
import { useAuth } from '../../../Context/Auth';
import { isShopLocation } from '../../../utils/locationUtils';
import { printReturnChallanSlip } from './utils/printReturnChallanSlip';

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
    const fraction = Math.abs(sampleQty - Math.floor(sampleQty));
    for (const cand of [12, 6, 4, 8, 10, 16, 24, 20, 25, 50, 100]) {
      const pcs = fraction * cand;
      if (Math.abs(pcs - Math.round(pcs)) < 0.02) {
        return cand;
      }
    }
  }
  return 1;
};

const formatItemQtyDisplay = (qty: number, pcsPerBox: number = 1, uom: string = 'Boxes') => {
  if (pcsPerBox > 1) {
    const totPcs = Math.round(qty * pcsPerBox);
    const b = Math.floor(totPcs / pcsPerBox);
    const p = totPcs % pcsPerBox;
    if (b > 0 && p > 0) return `${b} Box${b > 1 ? 'es' : ''} + ${p} Pcs`;
    if (b > 0) return `${b} Box${b > 1 ? 'es' : ''}`;
    if (p > 0) return `${p} Pcs`;
    return '0';
  }
  if (Math.abs(qty - Math.round(qty)) > 0.0001) {
    const fraction = Math.abs(qty - Math.floor(qty));
    for (const cand of [12, 6, 4, 8, 10, 16, 24]) {
      const pcs = fraction * cand;
      if (Math.abs(pcs - Math.round(pcs)) < 0.02) {
        const tot = Math.round(qty * cand);
        const b = Math.floor(tot / cand);
        const p = tot % cand;
        if (b > 0 && p > 0) return `${b} Box${b > 1 ? 'es' : ''} + ${p} Pcs`;
        if (b > 0) return `${b} Box${b > 1 ? 'es' : ''}`;
        return `${p} Pcs`;
      }
    }
    return `${Math.round(qty * 100) / 100} ${uom || 'Units'}`;
  }
  return `${Math.round(qty)} ${uom || 'Boxes'}`;
};

const VerifyReturnChallan = ({ returnId, locationFilter, onSuccess, onCancel, readonly }: { returnId?: string, locationFilter?: string, onSuccess?: () => void, onCancel?: () => void, readonly?: boolean }) => {
  const params = useParams();
  const idToUse = returnId || params.id;
  const navigate = useNavigate();
  const { tenantId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [returnChallan, setReturnChallan] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchReturnData();
  }, [idToUse]);

  const fetchReturnData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_returns')
        .select('*')
        .eq('id', idToUse)
        .single();

      if (error) throw error;
      setReturnChallan(data);

      const rawItems = Array.isArray(data.items) ? data.items : [];
      const receivedItemsData = Array.isArray(data.received_items) ? data.received_items : [];

      const initializedItems = await Promise.all(rawItems.map(async (item: any, idx: number) => {
        const itName = item.itemName || item.product_name || '';
        const itSku = item.skuCode || item.sku || '';

        const { data: prodInfo } = await supabase
          .from('products')
          .select('category, scenario_name, pcs_per_box, pieces_per_box, pieces_per_packing, loose_conversion_ratio')
          .or(`product_name.ilike.%${itName}%,item_sr_no.eq.${itSku}`)
          .maybeSingle();

        const itemQty = Number(item.qty || 0);
        const pcsPerBox = resolvePcsPerBox(prodInfo, itemQty);
        const isTile = pcsPerBox > 1 || String(prodInfo?.category || '').toUpperCase().includes('TILE') || String(item.uom || '').toLowerCase().includes('box');

        const recItem = receivedItemsData.find((r: any) => 
          (r.skuCode && (r.skuCode === itSku)) || 
          (r.itemName && String(r.itemName).trim().toLowerCase() === String(itName).trim().toLowerCase())
        );
        const isUnverified = !recItem;
        const prevAccepted = !isUnverified ? Number(recItem.acceptedQty || 0) : 0;
        const prevRejected = !isUnverified ? Number(recItem.rejectedQty || 0) : 0;
        const prevHold = !isUnverified ? Number(recItem.holdQty || 0) : 0;

        return {
          ...item,
          idx,
          acceptedQty: isUnverified ? Number(item.qty || 0) : 0,
          rejectedQty: 0,
          holdQty: isUnverified ? 0 : prevHold,
          prevAccepted,
          prevRejected,
          prevHold,
          rejectReason: recItem?.rejectReason || '',
          disposalAction: recItem?.disposalAction || 'Handed Back to Customer',
          isVerified: !isUnverified,
          isTile,
          pcsPerBox
        };
      }));

      let displayItems = initializedItems;
      if (locationFilter && locationFilter !== 'ALL') {
        displayItems = initializedItems.filter(item => {
          const isShop = isShopLocation(item.warehouse || data.warehouse_name);
          return locationFilter === 'SHOP' ? isShop : !isShop;
        });
      }
      setItems(displayItems);

    } catch (err: any) {
      toast.error('Error fetching return details.');
      if (onSuccess) onSuccess();
      else navigate(`${tenantId ? `/${tenantId}` : ''}/Warehouse/Return-Challan`);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    
    if (field === 'rejectReason' || field === 'disposalAction') {
      newItems[index][field] = value;
      setItems(newItems);
      return;
    }
    
    let val = Number(value);
    if (isNaN(val) || val < 0) val = 0;
    
    const isIncremental = Boolean(newItems[index].isVerified);
    const availablePool = isIncremental ? Number(newItems[index].prevHold || 0) : Number(newItems[index].qty || 0);
    if (val > availablePool) val = availablePool;

    newItems[index][field] = val;

    if (field === 'acceptedQty') {
      const currentRej = Math.min(Number(newItems[index].rejectedQty || 0), Math.max(0, availablePool - val));
      newItems[index].rejectedQty = currentRej;
      newItems[index].holdQty = Number((Math.max(0, availablePool - val - currentRej)).toFixed(4));
    } else if (field === 'rejectedQty') {
      const currentAcc = Math.min(Number(newItems[index].acceptedQty || 0), Math.max(0, availablePool - val));
      newItems[index].acceptedQty = currentAcc;
      newItems[index].holdQty = Number((Math.max(0, availablePool - val - currentAcc)).toFixed(4));
    } else if (field === 'holdQty') {
      const currentRej = Math.min(Number(newItems[index].rejectedQty || 0), Math.max(0, availablePool - val));
      newItems[index].rejectedQty = currentRej;
      newItems[index].acceptedQty = Number((Math.max(0, availablePool - val - currentRej)).toFixed(4));
    }
    
    setItems(newItems);
  };

  const handleBoxPcsChange = (index: number, field: 'acceptedQty' | 'rejectedQty' | 'holdQty', newBoxes: number, newPcs: number, pcsPerBox: number) => {
    const newItems = [...items];
    const isIncremental = Boolean(newItems[index].isVerified);
    const availablePool = isIncremental ? Number(newItems[index].prevHold || 0) : Number(newItems[index].qty || 0);
    const maxTotPcs = Math.round(availablePool * pcsPerBox);

    let totPcs = (Math.max(0, newBoxes) * pcsPerBox) + Math.max(0, newPcs);
    if (totPcs > maxTotPcs) totPcs = maxTotPcs;

    const val = Number((totPcs / pcsPerBox).toFixed(4));
    newItems[index][field] = val;

    const currentRejPcs = Math.round(Number(newItems[index].rejectedQty || 0) * pcsPerBox);
    const currentAccPcs = Math.round(Number(newItems[index].acceptedQty || 0) * pcsPerBox);

    if (field === 'acceptedQty') {
      const keptRejPcs = Math.min(currentRejPcs, Math.max(0, maxTotPcs - totPcs));
      newItems[index].rejectedQty = Number((keptRejPcs / pcsPerBox).toFixed(4));
      const remHoldPcs = Math.max(0, maxTotPcs - totPcs - keptRejPcs);
      newItems[index].holdQty = Number((remHoldPcs / pcsPerBox).toFixed(4));
    } else if (field === 'rejectedQty') {
      const keptAccPcs = Math.min(currentAccPcs, Math.max(0, maxTotPcs - totPcs));
      newItems[index].acceptedQty = Number((keptAccPcs / pcsPerBox).toFixed(4));
      const remHoldPcs = Math.max(0, maxTotPcs - totPcs - keptAccPcs);
      newItems[index].holdQty = Number((remHoldPcs / pcsPerBox).toFixed(4));
    } else if (field === 'holdQty') {
      const keptRejPcs = Math.min(currentRejPcs, Math.max(0, maxTotPcs - totPcs));
      newItems[index].rejectedQty = Number((keptRejPcs / pcsPerBox).toFixed(4));
      const remAccPcs = Math.max(0, maxTotPcs - totPcs - keptRejPcs);
      newItems[index].acceptedQty = Number((remAccPcs / pcsPerBox).toFixed(4));
    }

    setItems(newItems);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (items.some((item) => Number(item.rejectedQty) > 0 && !item.rejectReason)) {
      toast.error('Please provide a reason for all rejected items.');
      return;
    }
    if (!window.confirm('Are you sure you want to confirm this Return Receipt? Stock will be updated.')) return;

    setSubmitting(true);
    try {
      // Build final received_items array by merging with existing received_items
      const existingReceived = Array.isArray(returnChallan.received_items) ? [...returnChallan.received_items] : [];
      
      const newReceivedData = items.map(uiItem => {
        const finalAccepted = uiItem.isVerified 
          ? Number((Number(uiItem.prevAccepted || 0) + Number(uiItem.acceptedQty || 0)).toFixed(4))
          : Number(uiItem.acceptedQty || 0);
        const finalRejected = uiItem.isVerified
          ? Number((Number(uiItem.prevRejected || 0) + Number(uiItem.rejectedQty || 0)).toFixed(4))
          : Number(uiItem.rejectedQty || 0);
        const finalHold = Number(uiItem.holdQty || 0);

        return {
          skuCode: uiItem.skuCode || uiItem.sku || '',
          itemName: uiItem.itemName || uiItem.product_name || '',
          acceptedQty: finalAccepted,
          rejectedQty: finalRejected,
          holdQty: finalHold,
          rejectReason: uiItem.rejectReason,
          disposalAction: uiItem.disposalAction || 'Handed Back to Customer',
          warehouse: uiItem.warehouse || returnChallan.warehouse_name,
          verified_at: new Date().toISOString()
        };
      });

      // Merge (replace if exists, otherwise push)
      newReceivedData.forEach(newRec => {
        const idx = existingReceived.findIndex((e: any) => 
          (e.skuCode && newRec.skuCode && e.skuCode === newRec.skuCode) || 
          (e.itemName && newRec.itemName && String(e.itemName).trim().toLowerCase() === String(newRec.itemName).trim().toLowerCase())
        );
        if (idx >= 0) existingReceived[idx] = newRec;
        else existingReceived.push(newRec);
      });

      // warehouse_inventory retired — formula-based stock is source of truth
      // Update products.current_stock for newly accepted items in this session
      for (const item of items) {
        const newlyAccepted = Number(item.acceptedQty || 0);
        if (newlyAccepted > 0) {
          const { data: currentMasterProd } = await supabase
            .from('products')
            .select('id, current_stock')
            .ilike('product_name', item.itemName)
            .maybeSingle();

          if (currentMasterProd) {
            const updatedStock = Math.max(0, Number((Number(currentMasterProd.current_stock || 0) + newlyAccepted).toFixed(4)));
            await supabase
              .from('products')
              .update({ current_stock: updatedStock })
              .eq('id', currentMasterProd.id);
          }
        }
      }

      // Check if all items across the return have been verified
      const rawItems = Array.isArray(returnChallan.items) ? returnChallan.items : [];
      const allVerified = rawItems.every((ri: any) => {
        const riSku = ri.skuCode || ri.sku || '';
        const riName = ri.itemName || ri.product_name || '';
        return existingReceived.some((er: any) => 
          (er.skuCode && riSku && er.skuCode === riSku) || 
          (er.itemName && riName && String(er.itemName).trim().toLowerCase() === String(riName).trim().toLowerCase())
        );
      });

      const hasHold = existingReceived.some((r: any) => Number(r.holdQty || 0) > 0);
      const hasRejections = existingReceived.some((r: any) => Number(r.rejectedQty || 0) > 0);
      const allRejected = existingReceived.every((r: any) => Number(r.acceptedQty || 0) === 0);

      let newStatus = 'Partially Received';
      if (allVerified) {
        if (hasHold) newStatus = 'Partially Received';
        else if (allRejected) newStatus = 'Rejected';
        else newStatus = 'Received';
      }

      const acceptedAmount = newReceivedData.reduce((acc, it) => {
        const matchedItem = rawItems.find((ri: any) => (ri.itemName || ri.product_name) === it.itemName);
        const rate = Number(matchedItem?.rate || matchedItem?.sale_price || matchedItem?.price || 0);
        return acc + (Number(it.acceptedQty || 0) * rate);
      }, 0);

      const rejectedAmount = newReceivedData.reduce((acc, it) => {
        const matchedItem = rawItems.find((ri: any) => (ri.itemName || ri.product_name) === it.itemName);
        const rate = Number(matchedItem?.rate || matchedItem?.sale_price || matchedItem?.price || 0);
        return acc + (Number(it.rejectedQty || 0) * rate);
      }, 0);

      const { error: updateErr } = await supabase
        .from('sales_returns')
        .update({ 
          inward_status: newStatus,
          received_items: existingReceived,
          metadata: {
            ...(returnChallan.metadata || {}),
            accepted_amount: acceptedAmount,
            rejected_amount: rejectedAmount,
            qc_completed_at: new Date().toISOString()
          }
        })
        .eq('id', returnChallan.id);

      if (updateErr) throw updateErr;

      toast.success(`Return Verified Successfully! Status: ${newStatus}`);
      if (onSuccess) onSuccess();
      else navigate(`${tenantId ? `/${tenantId}` : ''}/Warehouse/Return-Challan`);
    } catch (err: any) {
      toast.error('Failed to verify return: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center bg-white dark:bg-boxdark"><Spinner /></div>;
  if (!returnChallan) return null;

  return (
    <div className={`mx-auto max-w-7xl text-black dark:text-bodydark text-xs ${returnId ? '' : 'pb-12'}`}>
      {!returnId && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <MdCheckCircle className="text-emerald-600" size={24} />
            {readonly ? 'View Return Receipt' : 'Verify Customer Return (QC)'}
          </h2>
          <button
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Warehouse/Return-Challan`)}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            <MdArrowBack /> Back to List
          </button>
        </div>
      )}

      <div className={returnId ? '' : 'rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6'}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 pb-6 border-b border-stroke dark:border-strokedark">
          <div>
            <p className="text-gray-400 font-medium uppercase tracking-wide mb-1">Return Note #</p>
            <p className="text-lg font-mono font-bold text-black dark:text-white">{returnChallan.return_no || `SR-${String(returnChallan.id).padStart(4, '0')}`}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase tracking-wide mb-1">Original Invoice #</p>
            <p className="text-sm font-bold text-black dark:text-white">{returnChallan.invoice_no || '-'}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase tracking-wide mb-1">Customer Name</p>
            <p className="text-sm font-bold text-black dark:text-white">{returnChallan.customer_name}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium uppercase tracking-wide mb-1">Return Date</p>
            <p className="text-sm font-bold text-black dark:text-white">{returnChallan.return_date}</p>
          </div>
          {returnChallan.gate_pass_no && (
            <div>
              <p className="text-gray-400 font-medium uppercase tracking-wide mb-1">Return Gate Pass #</p>
              <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{returnChallan.gate_pass_no}</p>
            </div>
          )}
        </div>

        <h3 className="font-bold text-sm mb-4">Verification Checklist</h3>
        <div className="max-w-full overflow-x-auto mb-8">
          <table className="w-full table-auto border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-white">
                <th className="py-3 px-4 border-b border-stroke dark:border-strokedark">Product Item</th>
                <th className="py-3 px-4 border-b border-stroke dark:border-strokedark">Location</th>
                <th className="py-3 px-4 border-b border-stroke dark:border-strokedark text-center">Returned Qty</th>
                <th className="py-3 px-4 border-b border-stroke dark:border-strokedark text-center text-emerald-600 dark:text-emerald-400">Accepted Qty</th>
                <th className="py-3 px-4 border-b border-stroke dark:border-strokedark text-center text-rose-600 dark:text-rose-400">Rejected Qty</th>
                <th className="py-3 px-4 border-b border-stroke dark:border-strokedark text-center text-amber-500 dark:text-amber-400">On Hold</th>
                <th className="py-3 px-4 border-b border-stroke dark:border-strokedark">Reject Reason</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const pcsPerBox = item.pcsPerBox || 1;
                const isMultiUnit = pcsPerBox > 1;

                const accPcsTot = Math.round(Number(item.acceptedQty || 0) * pcsPerBox);
                const accBoxes = Math.floor(accPcsTot / pcsPerBox);
                const accPcs = accPcsTot % pcsPerBox;

                const rejPcsTot = Math.round(Number(item.rejectedQty || 0) * pcsPerBox);
                const rejBoxes = Math.floor(rejPcsTot / pcsPerBox);
                const rejPcs = rejPcsTot % pcsPerBox;

                const hldPcsTot = Math.round(Number(item.holdQty || 0) * pcsPerBox);
                const hldBoxes = Math.floor(hldPcsTot / pcsPerBox);
                const hldPcs = hldPcsTot % pcsPerBox;

                return (
                  <tr key={index} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/20">
                    <td className="py-3 px-4 font-bold">{item.itemName}</td>
                    <td className="py-3 px-4 text-gray-500">
                      <div className="flex items-center gap-2">
                        {item.warehouse || returnChallan.warehouse_name}
                        {readonly && item.isVerified && (
                          <MdCheckCircle className="text-emerald-500 text-base" title="Verified by this location" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <div className="text-[13px] text-gray-900 dark:text-gray-100">
                        {formatItemQtyDisplay(Number(item.qty || 0), item.pcsPerBox, item.uom)}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      {readonly ? (
                        !item.isVerified ? (
                          <div className="text-gray-400 font-bold italic text-[10px] uppercase">Pending</div>
                        ) : (
                          <div className="font-mono font-bold text-emerald-700">
                            {formatItemQtyDisplay(Number(item.acceptedQty || 0), item.pcsPerBox, item.uom)}
                          </div>
                        )
                      ) : isMultiUnit ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={accBoxes === 0 && accPcs === 0 && Number(item.acceptedQty || 0) === 0 ? '' : accBoxes}
                            onChange={(e) => {
                              const nb = Number(e.target.value || 0);
                              handleBoxPcsChange(index, 'acceptedQty', nb, accPcs, pcsPerBox);
                            }}
                            className="w-16 text-center font-black font-mono text-sm text-emerald-700 bg-white dark:bg-boxdark border-2 border-emerald-400 rounded-lg p-1.5 shadow-sm outline-none focus:ring-2 focus:ring-emerald-400"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-500">Box</span>
                          <input
                            type="number"
                            min="0"
                            max={pcsPerBox - 1}
                            value={accPcs === 0 && accBoxes === 0 && Number(item.acceptedQty || 0) === 0 ? '' : accPcs}
                            onChange={(e) => {
                              const np = Number(e.target.value || 0);
                              handleBoxPcsChange(index, 'acceptedQty', accBoxes, np, pcsPerBox);
                            }}
                            className="w-14 text-center font-black font-mono text-sm text-emerald-700 bg-white dark:bg-boxdark border-2 border-emerald-400 rounded-lg p-1.5 shadow-sm outline-none focus:ring-2 focus:ring-emerald-400"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-500">Pcs</span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max={item.qty}
                          value={item.acceptedQty === 0 ? '' : item.acceptedQty}
                          onChange={(e) => handleItemChange(index, 'acceptedQty', e.target.value)}
                          className="w-20 rounded-lg border border-emerald-300 dark:border-emerald-700 py-1.5 px-3 bg-white dark:bg-boxdark outline-none focus:border-emerald-500 font-mono font-bold text-emerald-700 text-sm shadow-sm text-center mx-auto block"
                          placeholder="0"
                        />
                      )}
                      {!readonly && item.prevAccepted > 0 && (
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 whitespace-nowrap text-center">
                          Prev: {formatItemQtyDisplay(item.prevAccepted, pcsPerBox, item.uom)}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {readonly ? (
                        !item.isVerified ? (
                          <div className="text-gray-400 font-bold italic text-[10px] uppercase">-</div>
                        ) : (
                          <div className="font-mono font-bold text-rose-700">
                            {formatItemQtyDisplay(Number(item.rejectedQty || 0), item.pcsPerBox, item.uom)}
                          </div>
                        )
                      ) : isMultiUnit ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={rejBoxes === 0 && rejPcs === 0 && Number(item.rejectedQty || 0) === 0 ? '' : rejBoxes}
                            onChange={(e) => {
                              const nb = Number(e.target.value || 0);
                              handleBoxPcsChange(index, 'rejectedQty', nb, rejPcs, pcsPerBox);
                            }}
                            className="w-16 text-center font-black font-mono text-sm text-rose-700 bg-white dark:bg-boxdark border-2 border-rose-400 rounded-lg p-1.5 shadow-sm outline-none focus:ring-2 focus:ring-rose-400"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-500">Box</span>
                          <input
                            type="number"
                            min="0"
                            max={pcsPerBox - 1}
                            value={rejPcs === 0 && rejBoxes === 0 && Number(item.rejectedQty || 0) === 0 ? '' : rejPcs}
                            onChange={(e) => {
                              const np = Number(e.target.value || 0);
                              handleBoxPcsChange(index, 'rejectedQty', rejBoxes, np, pcsPerBox);
                            }}
                            className="w-14 text-center font-black font-mono text-sm text-rose-700 bg-white dark:bg-boxdark border-2 border-rose-400 rounded-lg p-1.5 shadow-sm outline-none focus:ring-2 focus:ring-rose-400"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-500">Pcs</span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max={item.qty}
                          value={item.rejectedQty === 0 ? '' : item.rejectedQty}
                          onChange={(e) => handleItemChange(index, 'rejectedQty', e.target.value)}
                          className="w-20 rounded-lg border border-rose-300 dark:border-rose-700 py-1.5 px-3 bg-white dark:bg-boxdark outline-none focus:border-rose-500 font-mono font-bold text-rose-700 text-sm shadow-sm text-center mx-auto block"
                          placeholder="0"
                        />
                      )}
                      {!readonly && item.prevRejected > 0 && (
                        <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 whitespace-nowrap text-center">
                          Prev: {formatItemQtyDisplay(item.prevRejected, pcsPerBox, item.uom)}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {readonly ? (
                        !item.isVerified ? (
                          <div className="text-gray-400 font-bold italic text-[10px] uppercase">-</div>
                        ) : (
                          <div className="font-mono font-bold text-amber-600">
                            {formatItemQtyDisplay(Number(item.holdQty || 0), item.pcsPerBox, item.uom)}
                          </div>
                        )
                      ) : isMultiUnit ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={hldBoxes === 0 && hldPcs === 0 && Number(item.holdQty || 0) === 0 ? '' : hldBoxes}
                            onChange={(e) => {
                              const nb = Number(e.target.value || 0);
                              handleBoxPcsChange(index, 'holdQty', nb, hldPcs, pcsPerBox);
                            }}
                            className="w-16 text-center font-black font-mono text-sm text-amber-600 bg-white dark:bg-boxdark border-2 border-amber-400 rounded-lg p-1.5 shadow-sm outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500">Box</span>
                          <input
                            type="number"
                            min="0"
                            max={pcsPerBox - 1}
                            value={hldPcs === 0 && hldBoxes === 0 && Number(item.holdQty || 0) === 0 ? '' : hldPcs}
                            onChange={(e) => {
                              const np = Number(e.target.value || 0);
                              handleBoxPcsChange(index, 'holdQty', hldBoxes, np, pcsPerBox);
                            }}
                            className="w-14 text-center font-black font-mono text-sm text-amber-600 bg-white dark:bg-boxdark border-2 border-amber-400 rounded-lg p-1.5 shadow-sm outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500">Pcs</span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max={item.qty}
                          value={item.holdQty === 0 ? '' : item.holdQty}
                          onChange={(e) => handleItemChange(index, 'holdQty', e.target.value)}
                          className="w-20 rounded-lg border border-amber-300 dark:border-amber-700 py-1.5 px-3 bg-white dark:bg-boxdark outline-none focus:border-amber-500 font-mono font-bold text-amber-600 text-sm shadow-sm text-center mx-auto block"
                          placeholder="0"
                        />
                      )}
                      {!readonly && item.prevHold > 0 && (
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 whitespace-nowrap text-center">
                          Prev Hold: {formatItemQtyDisplay(item.prevHold, pcsPerBox, item.uom)}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {readonly ? (
                        <div className="text-gray-600 dark:text-gray-300 text-xs">
                          <div>{item.rejectReason || '-'}</div>
                          {Number(item.rejectedQty || 0) > 0 && item.disposalAction && (
                            <div className="text-[10px] font-bold text-rose-600 mt-0.5">({item.disposalAction})</div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 min-w-[140px]">
                          <input
                            type="text"
                            value={item.rejectReason || ''}
                            onChange={(e) => handleItemChange(index, 'rejectReason', e.target.value)}
                            placeholder="e.g. Broken/Damaged"
                            className={`w-full rounded border px-2 py-1 outline-none focus:border-primary disabled:opacity-50 dark:bg-boxdark text-xs ${
                              submitted && Number(item.rejectedQty) > 0 && !item.rejectReason
                                ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500 placeholder-rose-300'
                                : 'border-stroke dark:border-strokedark'
                            }`}
                          />
                          {Number(item.rejectedQty || 0) > 0 && (
                            <select
                              value={item.disposalAction || 'Handed Back to Customer'}
                              onChange={(e) => handleItemChange(index, 'disposalAction', e.target.value)}
                              className="w-full text-[10px] font-bold border border-rose-300 rounded px-1.5 py-0.5 bg-rose-50 dark:bg-meta-4 text-rose-800 dark:text-rose-300 outline-none"
                            >
                              <option value="Handed Back to Customer">📦 Hand Back to Customer</option>
                              <option value="Move to Scrap / Breakage">🗑️ Move to Scrap / Breakage</option>
                            </select>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 border-t border-stroke dark:border-strokedark pt-6">
          <button
            type="button"
            onClick={() => printReturnChallanSlip(returnChallan)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-meta-4 px-5 py-2 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition shadow-xs cursor-pointer"
          >
            <FiPrinter size={16} /> Print Return Slip
          </button>
          <button
            type="button"
            onClick={() => {
              if (onCancel) onCancel();
              else if (onSuccess) onSuccess();
              else navigate(`${tenantId ? `/${tenantId}` : ''}/Warehouse/Return-Challan`);
            }}
            className="rounded-lg border border-stroke px-6 py-2 font-medium hover:bg-slate-50 dark:border-strokedark dark:hover:bg-meta-4 transition cursor-pointer"
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
              Confirm Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyReturnChallan;
