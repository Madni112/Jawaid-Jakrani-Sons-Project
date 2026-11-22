import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';

interface ReturnItem {
  itemName?: string;
  product_name?: string;
  skuCode?: string;
  item_sr_no?: string;
  qty?: number;
  quantity?: number;
  rate?: number;
  cost_price?: number;
  lineTotal?: number;
  warehouse?: string;
}

interface PurchaseReturnData {
  id: number;
  return_no: string;
  vendor_name?: string;
  supplier_name?: string;
  source_warehouse?: string;
  warehouse_name?: string;
  purchase_no?: string;
  return_date?: string;
  payment_term?: string;
  amount_paid?: number;
  cash_amount_paid?: number;
  bank_amount_paid?: number;
  total_amount?: number;
  remarks?: string;
  notes?: string;
  items: ReturnItem[];
  metadata?: any;
  created_at: string;
}

const PrintPurchaseReturn: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const [returnData, setReturnData] = useState<PurchaseReturnData | null>(null);
  const [productsCatalog, setProductsCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturnRecord = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('purchase_returns')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setReturnData(data);

        // Fetch products catalog for tile box/sqm conversions
        const { data: prods } = await supabase
          .from('products')
          .select('id, product_name, item_sr_no, category, uom, pieces_per_box, pcs_per_box, pieces_per_packing, product_description, scenario_name, loose_conversion_ratio');
        if (prods) setProductsCatalog(prods);
        setTimeout(() => {
          window.print();
        }, 500);
      } catch (err: any) {
        toast.error('Failed to load purchase return record: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReturnRecord();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-white"><Spinner /></div>;
  }

  if (!returnData) {
    return <div className="text-center py-20 text-gray-500 font-bold">Purchase return record not found.</div>;
  }

  const rawItems = Array.isArray(returnData.items) ? returnData.items : [];

  const resolvePcsPerBox = (prodMeta: any, sampleQty?: number): number => {
    if (prodMeta) {
      const looseRatio = Number(prodMeta.loose_conversion_ratio || 0);
      const boxPcs = Number(prodMeta.pieces_per_box || prodMeta.pcs_per_box || prodMeta.pieces_per_packing || 0);
      if (looseRatio > 1) return looseRatio;
      if (boxPcs > 1) return boxPcs;
      const isTile = Boolean(
        String(prodMeta.category || '').toLowerCase().includes('tile') ||
        String(prodMeta.scenario_name || '').toLowerCase().includes('tile')
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

  let totalBoxesCount = 0;
  let totalLoosePcsCount = 0;
  let computedGross = 0;

  const processedItems = rawItems.map((item, idx) => {
    const pName = item.itemName ?? item.product_name ?? 'N/A';
    const prodMeta = productsCatalog.find(p => 
      (p.product_name && pName && p.product_name.toLowerCase() === pName.toLowerCase()) || 
      (item.skuCode && (p.item_sr_no === item.skuCode || `SKU-${p.id}` === item.skuCode || p.product_code === item.skuCode))
    );

    const qty = Number(item.qty ?? item.quantity ?? 0);
    const pcsPerBox = resolvePcsPerBox(prodMeta, qty);
    const rate = Number(item.rate ?? item.cost_price ?? 0);
    const lineTotal = Number(item.lineTotal ?? (rate * qty));
    computedGross += lineTotal;

    let qtyDisplay = `${qty}`;
    if (pcsPerBox > 1 || String(item.uom || prodMeta?.uom || '').toLowerCase().includes('box')) {
      const effectivePcs = pcsPerBox > 1 ? pcsPerBox : 1;
      const totPcs = Math.round(qty * effectivePcs);
      const boxes = Math.floor(totPcs / effectivePcs);
      const loose = totPcs % effectivePcs;
      totalBoxesCount += boxes;
      totalLoosePcsCount += loose;

      if (boxes > 0 && loose > 0) {
        qtyDisplay = `${boxes} Boxes + ${loose} Pcs`;
      } else if (boxes > 0) {
        qtyDisplay = `${boxes} Boxes`;
      } else if (loose > 0) {
        qtyDisplay = `${loose} Pcs`;
      } else {
        qtyDisplay = `0 Boxes`;
      }
    } else {
      const cleanQty = Math.round(qty * 100) / 100;
      qtyDisplay = `${cleanQty} ${item.uom || prodMeta?.uom || 'NOS'}`;
    }

    return {
      pName,
      sku: item.skuCode || prodMeta?.item_sr_no || '-',
      warehouse: item.warehouse || returnData.source_warehouse || 'Main Warehouse',
      qty,
      qtyDisplay,
      rate,
      lineTotal
    };
  });

  const returnNoFormatted = returnData.return_no || `RTN-${String(returnData.id).padStart(4, '0')}`;
  const returnDateFormatted = returnData.return_date 
    ? new Date(returnData.return_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date(returnData.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const grandTotal = Number(returnData.total_amount || computedGross);

  const formatMoney = (val: number | string | undefined | null): string => {
    const num = Number(val) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8 bg-white text-slate-900 font-sans min-h-screen relative print:p-0 print:m-0 print:max-w-none print:w-full">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
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
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Return/List`);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition cursor-pointer"
          >
            <FiArrowLeft size={14} /> Back
          </button>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Outward Return Challan / Debit Note</h1>
            <p className="text-[11px] text-slate-400 font-mono">Reference: {returnNoFormatted}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-md transition cursor-pointer"
        >
          <FiPrinter size={16} /> Print Document
        </button>
      </div>

      {/* Slip Document Body matching Inward Challan exact design */}
      <div className="print-slip-container bg-white">
        {/* Header matching Inward Challan */}
        <div className="border-b-2 border-[#800020] pb-4 mb-5 flex justify-between items-start">
          <div>
            <div className="text-[22px] font-black text-[#800020] tracking-tight">Jawaid Jakwani & Sons</div>
            <div className="text-[14px] font-extrabold uppercase tracking-wider text-[#0f172a] mt-1">OUTWARD RETURN CHALLAN / DEBIT NOTE</div>
          </div>
          <div className="text-right">
            <div className="text-[12px] font-bold text-[#64748b]">ORIGINAL COPY</div>
            <div className="text-[14px] font-mono font-black text-[#800020]">{returnNoFormatted}</div>
          </div>
        </div>

        {/* Metadata Grid matching Inward Challan */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-lg mb-5 text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Purchase Ref #</div>
            <div className="text-[13px] font-extrabold text-[#be123c] mt-0.5 font-mono">
              {returnData.purchase_no ? `PUR-${returnData.purchase_no.replace(/^PUR-?/i, '')}` : 'General Settlement'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Debit Note #</div>
            <div className="text-[13px] font-extrabold text-[#0f172a] mt-0.5 font-mono">{returnNoFormatted}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Supplier / Vendor</div>
            <div className="text-[13px] font-extrabold text-[#0f172a] mt-0.5">{returnData.vendor_name || returnData.supplier_name || 'Vendor'}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Return Date</div>
            <div className="text-[13px] font-extrabold text-[#0f172a] mt-0.5">{returnDateFormatted}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Dispatch Warehouse</div>
            <div className="text-[13px] font-extrabold text-[#0f172a] mt-0.5">{returnData.source_warehouse || returnData.warehouse_name || 'Main Warehouse'}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-[10px] font-bold uppercase text-[#64748b]">Settlement Mode / Status</div>
            <div className="text-[13px] font-extrabold text-[#047857] mt-0.5">{returnData.payment_term || 'On Credit (Debit Note)'}</div>
          </div>
        </div>

        {/* Items Table matching Inward Challan */}
        <table className="w-full border-collapse mt-2.5 text-xs">
          <thead>
            <tr>
              <th className="w-10 p-2 border border-[#cbd5e1] text-center uppercase text-[11px] font-extrabold text-[#334155] bg-[#f1f5f9]">#</th>
              <th className="p-2 border border-[#cbd5e1] text-left uppercase text-[11px] font-extrabold text-[#334155] bg-[#f1f5f9]">Product Description</th>
              <th className="p-2 border border-[#cbd5e1] text-right uppercase text-[11px] font-extrabold text-[#334155] bg-[#f1f5f9]">Returned Quantity / Packing</th>
              <th className="p-2 border border-[#cbd5e1] text-right uppercase text-[11px] font-extrabold text-[#334155] bg-[#f1f5f9]">Unit Rate</th>
              <th className="p-2 border border-[#cbd5e1] text-right uppercase text-[11px] font-extrabold text-[#334155] bg-[#f1f5f9]">Total Credit</th>
            </tr>
          </thead>
          <tbody>
            {processedItems.map((it, idx) => (
              <tr key={idx}>
                <td className="p-2 border border-[#e2e8f0] text-center text-[#64748b]">{idx + 1}</td>
                <td className="p-2 border border-[#e2e8f0] font-bold text-[#0f172a]">{it.pName}</td>
                <td className="p-2 border border-[#e2e8f0] text-right font-bold font-mono text-[#0f172a]">{it.qtyDisplay}</td>
                <td className="p-2 border border-[#e2e8f0] text-right font-mono text-slate-700">Rs. {formatMoney(it.rate)}</td>
                <td className="p-2 border border-[#e2e8f0] text-right font-bold font-mono text-[#be123c]">Rs. {formatMoney(it.lineTotal)}</td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="bg-[#f8fafc] font-bold">
              <td colSpan={2} className="p-2.5 border border-[#cbd5e1] text-right uppercase text-[11px] text-[#334155]">
                Total Returned:
              </td>
              <td className="p-2.5 border border-[#cbd5e1] text-right font-mono text-[#0f172a]">
                {totalBoxesCount > 0 ? `${totalBoxesCount} Boxes${totalLoosePcsCount > 0 ? ` + ${totalLoosePcsCount} Pcs` : ''}` : `${processedItems.length} Items`}
              </td>
              <td className="p-2.5 border border-[#cbd5e1] text-right uppercase text-[11px] text-[#334155]">
                Gross Return Total:
              </td>
              <td className="p-2.5 border border-[#cbd5e1] text-right font-mono text-[13px] text-[#be123c]">
                Rs. {formatMoney(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Remarks if any */}
        {(returnData.remarks || returnData.notes) && (
          <div className="mt-4 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded text-xs text-slate-700">
            <strong className="text-slate-900 font-bold uppercase text-[10px] block mb-0.5">Remarks / Reason:</strong>
            {returnData.remarks || returnData.notes}
          </div>
        )}

        {/* Signatures matching Inward Challan */}
        <div className="mt-14 flex justify-between items-center text-center text-xs">
          <div className="w-[28%] border-t border-dashed border-[#64748b] pt-2 text-[11px] font-bold text-[#475569]">
            Dispatched / Loaded By
          </div>
          <div className="w-[28%] border-t border-dashed border-[#64748b] pt-2 text-[11px] font-bold text-[#475569]">
            Inspected / QC Officer
          </div>
          <div className="w-[28%] border-t border-dashed border-[#64748b] pt-2 text-[11px] font-bold text-[#475569]">
            Store In-Charge Approval
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPurchaseReturn;
