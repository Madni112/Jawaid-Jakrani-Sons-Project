import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { getBrandConfig } from '../../../utils/brand';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';

interface ChallanItem {
  pDescription?: string;
  itemName?: string;
  product_name?: string;
  qty?: number;
  orderQty?: number;
  dispatchedQty?: number;
  holdQty?: number;
  skuCode?: string;
  pCode?: string;
  item_code?: string;
  location?: string;
  [key: string]: any;
}

interface ChallanData {
  id: number;
  challan_no?: string;
  gate_pass_no?: string;
  invoice_no?: string;
  customer_name: string;
  transport_name?: string;
  transportation?: string;
  po_no?: string;
  po_date?: string;
  dc_date?: string;
  challan_date?: string;
  vehicle_no?: string;
  driver_name?: string;
  dispatch_warehouse?: string;
  shipping_address?: string;
  remarks?: string;
  status?: string;
  items: ChallanItem[];
  created_at: string;
  is_printed?: boolean;
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

const formatQtyWithPcs = (prod: any, qty: number): string => {
  if (qty <= 0) return '0';
  const pcsPerBox = resolvePcsPerBox(prod, qty);
  if (pcsPerBox > 1) {
    const totPcs = Math.round(qty * pcsPerBox);
    const b = Math.floor(totPcs / pcsPerBox);
    const p = totPcs % pcsPerBox;
    if (b > 0 && p > 0) return `${b} Boxes + ${p} Pcs`;
    if (b > 0) return `${b} Boxes`;
    if (p > 0) return `${p} Pcs`;
    return '0 Pcs';
  }
  if (Math.abs(qty - Math.round(qty)) > 0.0001) {
    const fraction = Math.abs(qty - Math.floor(qty));
    for (const cand of [12, 6, 4, 8, 10, 16, 24]) {
      const pcs = fraction * cand;
      if (Math.abs(pcs - Math.round(pcs)) < 0.02) {
        const tot = Math.round(qty * cand);
        const b = Math.floor(tot / cand);
        const p = tot % cand;
        if (b > 0 && p > 0) return `${b} Boxes + ${p} Pcs`;
        if (b > 0) return `${b} Boxes`;
        if (p > 0) return `${p} Pcs`;
      }
    }
    return `${Math.round(qty * 100) / 100} ${prod?.uom || 'Units'}`;
  }
  return `${Math.round(qty)} ${prod?.uom || 'Boxes'}`;
};

const formatRemarksText = (rem?: string) => {
  if (!rem) return '';
  return rem.replace(/(\d+\.\d{3,})\s*(?:pcs|units)?/gi, (_match, numStr) => {
    const num = parseFloat(numStr);
    if (isNaN(num)) return _match;
    for (const cand of [12, 6, 4, 8, 10, 16, 24]) {
      const pcs = (num - Math.floor(num)) * cand;
      if (Math.abs(pcs - Math.round(pcs)) < 0.02) {
        const tot = Math.round(num * cand);
        const b = Math.floor(tot / cand);
        const p = tot % cand;
        if (b > 0 && p > 0) return `${b} Boxes + ${p} Pcs`;
        if (b > 0) return `${b} Boxes`;
        if (p > 0) return `${p} Pcs`;
      }
    }
    return `${Math.round(num * 100) / 100} pcs`;
  });
};

const cleanShortNumber = (str?: string) => {
  if (!str) return '';
  return str.replace(/^AL-?MUHAMMADI[A-Z\s]*-/i, '');
};

const PrintChallan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { businessName, tenantId } = useAuth();
  const [challan, setChallan] = useState<ChallanData | null>(null);
  const [productsMaster, setProductsMaster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallanDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('delivery_challans')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) setChallan(data);

        const { data: prodData } = await supabase
          .from('products')
          .select('product_name, product_code, category, scenario_name, pieces_per_box, pcs_per_box, pieces_per_packing, loose_conversion_ratio, uom');
        if (prodData) setProductsMaster(prodData);

        if (data && !data.is_printed) {
          await supabase.from('delivery_challans').update({ is_printed: true }).eq('id', id);
        }
        setTimeout(() => {
          window.print();
        }, 500);
      } catch (err: any) {
        toast.error('Error loading print data: ' + err.message);
        navigate(`${tenantId ? `/${tenantId}` : ''}/Sales/Delivery-Challan/List`);
      } finally {
        setLoading(false);
      }
    };

    fetchChallanDetails();
  }, [id, navigate, tenantId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Spinner />
      </div>
    );
  }

  if (!challan) return null;

  const formatPrintDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const rawChallanTitle = challan.challan_no || `DC-${String(challan.id).padStart(4, '0')}`;
  const gatePassDisplay = cleanShortNumber(challan.gate_pass_no || rawChallanTitle);
  const rawItems = Array.isArray(challan.items) ? challan.items : [];

  let totalOrderedBoxes = 0;
  let totalDispatchedBoxes = 0;
  let totalHoldBoxes = 0;

  const processedItems = rawItems.map((item, idx) => {
    const prodName = String(item.pDescription || item.itemName || item.product_name || '').trim();
    const prod = productsMaster.find(p => 
      String(p?.product_name || '').trim().toLowerCase() === prodName.toLowerCase() ||
      (p?.product_code && (p.product_code === item.skuCode || p.product_code === item.pCode || p.product_code === item.item_code))
    );

    const orderedQty = Number(item.orderQty > 0 ? item.orderQty : (item.qty || 0));
    const dispatchedQty = Number(
      item.dispatchedQty !== undefined && item.dispatchedQty !== null
        ? item.dispatchedQty
        : (challan.status === 'Dispatched' ? orderedQty : 0)
    );
    const holdQty = Number(
      item.holdQty !== undefined && item.holdQty !== null
        ? item.holdQty
        : Math.max(0, orderedQty - dispatchedQty)
    );

    totalOrderedBoxes += orderedQty;
    totalDispatchedBoxes += dispatchedQty;
    totalHoldBoxes += holdQty;

    const dispOrdered = formatQtyWithPcs(prod, orderedQty);
    const dispDispatched = dispatchedQty > 0 ? formatQtyWithPcs(prod, dispatchedQty) : '0';
    const dispHold = holdQty > 0 ? formatQtyWithPcs(prod, holdQty) : '0';

    return {
      idx: idx + 1,
      sku: item.skuCode || item.pCode || item.item_code || '-',
      name: prodName || 'Item',
      orderedQty,
      dispatchedQty,
      holdQty,
      dispOrdered,
      dispDispatched,
      dispHold
    };
  });

  const hasHold = processedItems.some(i => i.holdQty > 0);
  const allDispatched = processedItems.length > 0 && processedItems.every(i => i.holdQty === 0 && i.dispatchedQty > 0);
  const statusText = allDispatched || challan.status === 'Dispatched'
    ? 'Dispatched (Approved)'
    : (hasHold ? 'Partial Dispatch (Hold Remaining)' : (challan.status || 'Pending Dispatch'));
  const statusColor = allDispatched || challan.status === 'Dispatched' ? '#047857' : '#b45309';

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8 bg-white text-slate-900 font-sans min-h-screen relative print:p-0 print:m-0 print:max-w-none print:w-full">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          html, body, #root, main, div {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
          }
          aside, nav, header, footer, .no-print, button {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
            color: #1e293b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-slip-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #334155 !important;
            border: 1px solid #cbd5e1 !important;
            font-weight: 800 !important;
          }
          td {
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden on Print) */}
      <div className="no-print max-w-4xl mx-auto mb-4 flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-900 text-white shadow-md">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate(`${tenantId ? `/${tenantId}` : ''}/Sales/Delivery-Challan/List`);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded transition cursor-pointer"
        >
          <FiArrowLeft size={14} /> Back
        </button>
        <span className="text-xs font-mono text-slate-300">Gate Pass: <strong className="text-white">{gatePassDisplay || rawChallanTitle}</strong></span>
        <button
          type="button"
          onClick={async () => {
            if (challan?.id && !challan.is_printed) {
              await supabase.from('delivery_challans').update({ is_printed: true }).eq('id', challan.id);
            }
            window.print();
          }}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded shadow transition cursor-pointer"
        >
          <FiPrinter size={15} /> Print Gate Pass
        </button>
      </div>

      {/* Slip Document Body matching Inward Challan design */}
      <div className="print-slip-container max-w-4xl mx-auto bg-white p-8 border border-[#e2e8f0] rounded-xl shadow-xs print:p-0 print:border-none print:shadow-none">
        {/* Header matching Inward Challan */}
        <div className="border-b-2 border-[#800020] pb-4 mb-5 flex justify-between items-start">
          <div>
            <div className="text-[22px] font-black text-[#800020] tracking-tight">ZOHAIB ALI AND COMPANY</div>
            <div className="text-[14px] font-extrabold uppercase tracking-wider text-[#0f172a] mt-1">OUTWARD DELIVERY CHALLAN / GATE PASS</div>
          </div>
          <div className="text-right">
            <div className="text-[12px] font-bold text-[#64748b]">ORIGINAL COPY</div>
            <div className="text-[14px] font-mono font-black text-[#800020]">{gatePassDisplay || rawChallanTitle}</div>
          </div>
        </div>

        {/* Metadata Grid matching Inward Challan */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-lg mb-5 text-xs">
          <div className="min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Invoice Ref #</div>
            <div className="text-[13px] font-extrabold text-[#be123c] mt-0.5 font-mono break-words">
              {challan.invoice_no || 'Direct Challan'}
            </div>
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Gate Pass / Slip #</div>
            <div className="text-[13px] font-extrabold text-[#0f172a] mt-0.5 font-mono break-words">
              {gatePassDisplay || rawChallanTitle}
            </div>
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Customer / Consignee</div>
            <div className="text-[13px] font-extrabold text-[#0f172a] mt-0.5 break-words">{challan.customer_name}</div>
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Dispatch Date</div>
            <div className="text-[13px] font-extrabold text-[#0f172a] mt-0.5">{formatPrintDate(challan.dc_date || challan.challan_date || challan.created_at)}</div>
          </div>
          <div className="col-span-2 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Dispatch Warehouse</div>
            <div className="text-[13px] font-extrabold text-[#0f172a] mt-0.5 break-words">{challan.dispatch_warehouse || 'Main Warehouse'}</div>
          </div>
          <div className="col-span-2 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Dispatch Status</div>
            <div className="text-[13px] font-extrabold mt-0.5" style={{ color: statusColor }}>{statusText}</div>
          </div>
          {/* Vehicle / Carrier details */}
          <div className="col-span-2 sm:col-span-4 border-t border-[#e2e8f0] pt-2 mt-1 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Carrier / Vehicle / Driver Details</div>
            <div className="text-[12px] font-bold text-[#0f172a] mt-0.5 break-words">
              {[
                challan.driver_name ? `Driver: ${challan.driver_name}` : null,
                challan.vehicle_no ? `Vehicle: ${challan.vehicle_no}` : null,
                (challan.transport_name || challan.transportation) ? `Transit: ${challan.transport_name || challan.transportation}` : null
              ].filter(Boolean).join(' • ') || 'Direct Handover / Counter Delivery'}
            </div>
          </div>
        </div>

        {/* Items Table matching Inward Challan */}
        <table className="w-full border-collapse mt-2.5 text-xs">
          <thead>
            <tr>
              <th className="w-10 p-2 border border-[#cbd5e1] text-center uppercase text-[11px] font-extrabold text-[#334155] bg-[#f1f5f9]">#</th>
              <th className="p-2 border border-[#cbd5e1] text-left uppercase text-[11px] font-extrabold text-[#334155] bg-[#f1f5f9]">Product Description</th>
              <th className="p-2 border border-[#cbd5e1] text-right uppercase text-[11px] font-extrabold text-[#334155] bg-[#f1f5f9]">Total Ordered / Packing</th>
              <th className="p-2 border border-[#cbd5e1] text-center uppercase text-[11px] font-extrabold text-[#334155] bg-[#f1f5f9]">Dispatched Qty</th>
              <th className="p-2 border border-[#cbd5e1] text-center uppercase text-[11px] font-extrabold text-[#334155] bg-[#f1f5f9]">Hold / Remaining</th>
            </tr>
          </thead>
          <tbody>
            {processedItems.map((it) => (
              <tr key={it.idx}>
                <td className="p-2 border border-[#e2e8f0] text-center text-[#64748b]">{it.idx}</td>
                <td className="p-2 border border-[#e2e8f0]">
                  <span className="font-bold text-[#0f172a]">{it.name}</span>
                  {it.sku && it.sku !== '-' && it.sku.toLowerCase() !== it.name.toLowerCase() && (
                    <span className="ml-2 text-[10px] font-mono text-slate-500 font-semibold">({it.sku})</span>
                  )}
                </td>
                <td className="p-2 border border-[#e2e8f0] text-right font-bold font-mono text-[#0f172a]">{it.dispOrdered}</td>
                <td className="p-2 border border-[#e2e8f0] text-center font-bold" style={{ color: it.dispatchedQty > 0 ? '#047857' : '#64748b' }}>
                  {it.dispDispatched} Dispatched
                </td>
                <td className="p-2 border border-[#e2e8f0] text-center" style={{ color: it.holdQty > 0 ? '#b45309' : '#64748b', fontWeight: it.holdQty > 0 ? 'bold' : 'normal' }}>
                  {it.dispHold} Hold
                </td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="bg-[#f8fafc] font-bold">
              <td colSpan={2} className="p-2.5 border border-[#cbd5e1] text-right uppercase text-[11px] text-[#334155]">
                Summary:
              </td>
              <td className="p-2.5 border border-[#cbd5e1] text-right font-mono text-[#0f172a]">
                {formatQtyWithPcs(null, totalOrderedBoxes)} Ordered
              </td>
              <td className="p-2.5 border border-[#cbd5e1] text-center font-mono text-[#047857]">
                {formatQtyWithPcs(null, totalDispatchedBoxes)} Dispatched
              </td>
              <td className="p-2.5 border border-[#cbd5e1] text-center font-mono" style={{ color: totalHoldBoxes > 0 ? '#b45309' : '#64748b' }}>
                {totalHoldBoxes > 0 ? `${formatQtyWithPcs(null, totalHoldBoxes)} Hold` : '0 Hold'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Remarks / Shipping address if any */}
        {(challan.remarks || challan.shipping_address) && (
          <div className="mt-4 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded text-xs text-slate-700 space-y-1">
            {challan.shipping_address && (
              <div>
                <strong className="text-slate-900 font-bold uppercase text-[10px]">Delivery Address:</strong> {challan.shipping_address}
              </div>
            )}
            {challan.remarks && (
              <div>
                <strong className="text-slate-900 font-bold uppercase text-[10px]">Remarks:</strong> {formatRemarksText(challan.remarks)}
              </div>
            )}
          </div>
        )}

        {/* Signatures matching Inward Challan */}
        <div className="mt-8 flex justify-between items-center text-center text-xs">
          <div className="w-[28%] border-t border-dashed border-[#64748b] pt-2 text-[11px] font-bold text-[#475569]">
            Dispatched / Loaded By
          </div>
          <div className="w-[28%] border-t border-dashed border-[#64748b] pt-2 text-[11px] font-bold text-[#475569]">
            Carrier / Driver Signature
          </div>
          <div className="w-[28%] border-t border-dashed border-[#64748b] pt-2 text-[11px] font-bold text-[#475569]">
            Receiver's Stamp & Signature
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintChallan;
