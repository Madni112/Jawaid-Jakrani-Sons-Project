import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../Context/supabaseClient';
import { 
  FiEye, 
  FiPrinter, 
  FiSearch, 
  FiCheckCircle, 
  FiClock, 
  FiFileText, 
  FiEdit2, 
  FiPackage, 
  FiX
} from 'react-icons/fi';
import { LuWarehouse } from 'react-icons/lu';
import Spinner from '../../../ui/Spinner';

interface InwardChallanHistoryProps {
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  locationFilter?: string;
}

const resolvePcsPerBox = (prod: any): number => {
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
  return 1;
};

const InwardChallanHistory: React.FC<InwardChallanHistoryProps> = ({ onView, onEdit, locationFilter }) => {
  const [challans, setChallans] = useState<any[]>([]);
  const [productsMaster, setProductsMaster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState<'ALL' | 'AUTOMATIC' | 'MANUAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Confirm' | 'Pending Inward' | 'Rejected'>('ALL');

  useEffect(() => {
    fetchHistory();
  }, [locationFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [receiptsRes, itemsRes, purchasesRes, productsRes] = await Promise.all([
        supabase.from('grn_receipts').select('*').order('created_at', { ascending: false }),
        supabase.from('grn_items').select('*'),
        supabase.from('supplier_purchases').select('id, purchase_no, bill_no, vendor_name, target_warehouse, metadata'),
        supabase.from('products').select('product_name, category, pcs_per_box, pieces_per_box, pieces_per_packing, scenario_name, uom, loose_conversion_ratio')
      ]);

      if (receiptsRes.error) throw receiptsRes.error;

      setProductsMaster(productsRes.data || []);

      const itemsByGrn: Record<string, any[]> = {};
      (itemsRes.data || []).forEach((it: any) => {
        const gId = String(it.grn_id || '');
        if (!itemsByGrn[gId]) itemsByGrn[gId] = [];
        itemsByGrn[gId].push(it);
      });

      const purchases = purchasesRes.data || [];
      const combined = (receiptsRes.data || []).map((g: any) => {
        // 1. Direct ID match from purchase metadata (highest priority)
        let pur = purchases.find((p: any) =>
          p.metadata?.grn_id === g.id ||
          (Array.isArray(p.metadata?.grn_ids) && p.metadata.grn_ids.includes(g.id))
        );

        // 2. Remarks match (e.g. "[MANUAL] ... for 04 (..." or "for PUR-04")
        if (!pur && g.remarks) {
          const remarkMatch = String(g.remarks).match(/for\s+([A-Za-z0-9_-]+)/i);
          if (remarkMatch && remarkMatch[1]) {
            const extracted = remarkMatch[1].trim();
            const cleanExtracted = extracted.replace(/^PUR-?/i, '');
            pur = purchases.find((p: any) => {
              if (!p.purchase_no) return false;
              const pNo = String(p.purchase_no).trim();
              const cleanPNo = pNo.replace(/^PUR-?/i, '');
              return pNo.toUpperCase() === extracted.toUpperCase() || cleanPNo === cleanExtracted;
            });
          }
        }

        // 3. Fallback for automatic GRNs that end with -GRN-{purchaseNo} or GRN-{purchaseNo}
        if (!pur && g.grn_no) {
          const grnUpper = String(g.grn_no).toUpperCase();
          const grnMatch = grnUpper.match(/(?:^|-)GRN-([A-Za-z0-9]+)$/);
          if (grnMatch && grnMatch[1]) {
            const suffix = grnMatch[1];
            pur = purchases.find((p: any) => {
              if (!p.purchase_no) return false;
              const cleanPNo = String(p.purchase_no).trim().replace(/^PUR-?/i, '');
              return cleanPNo === suffix;
            });
          }
        }

        const items = itemsByGrn[String(g.id)] || [];
        const whName = items[0]?.warehouse_name || pur?.target_warehouse || 'Main Warehouse';
        const isManual = Boolean(
          (g.remarks && (g.remarks.includes('[MANUAL]') || g.remarks.includes('Slip'))) ||
          (g.grn_no && !g.grn_no.toUpperCase().includes('GRN-') && g.grn_no.includes('-'))
        );

        const fallbackRemarkPurNo = g.remarks?.match(/for\s+([A-Za-z0-9_-]+)/i)?.[1];
        const resolvedPurchaseNo = pur?.purchase_no
          ? (String(pur.purchase_no).toUpperCase().startsWith('PUR-') ? String(pur.purchase_no).toUpperCase() : `PUR-${pur.purchase_no}`)
          : (fallbackRemarkPurNo
              ? `PUR-${fallbackRemarkPurNo.replace(/^PUR-?/i, '')}`
              : 'Direct Inward');

        // Parse location-wise gate passes from remarks
        let gatePasses: Record<string, string> = {};
        const rawRemarks = String(g.remarks || '');
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

        return {
          ...g,
          purchase_no: resolvedPurchaseNo,
          vendor_name: g.vendor_name || pur?.vendor_name || 'Vendor',
          warehouse: whName,
          isManual,
          grn_items: items,
          gatePasses,
        };
      });

      let filteredByLoc = combined;
      if (locationFilter && locationFilter !== 'ALL') {
        filteredByLoc = filteredByLoc.filter((g: any) => {
          if (!g.grn_items || g.grn_items.length === 0) return true;
          return g.grn_items.some((item: any) => {
            const isShop = String(item.warehouse_name || '').toUpperCase().includes('SHOP');
            return locationFilter === 'SHOP' ? isShop : !isShop;
          });
        });
      }

      setChallans(filteredByLoc);
    } catch (err: any) {
      console.error('Failed to load inward challan history:', err);
    } finally {
      setLoading(false);
    }
  };

  const productMetaMap = useMemo(() => {
    const map: Record<string, any> = {};
    productsMaster.forEach((p) => {
      if (p.product_name) map[String(p.product_name).trim().toLowerCase()] = p;
    });
    return map;
  }, [productsMaster]);

  const formatItemDisplay = (it: any, qty: number) => {
    const pName = String(it.product_name || it.itemName || '').trim();
    const prod = productMetaMap[pName.toLowerCase()];
    const pcsPerBox = resolvePcsPerBox(prod);

    if (pcsPerBox > 1) {
      const totalPcs = Math.round(qty * pcsPerBox);
      const b = Math.floor(totalPcs / pcsPerBox);
      const p = totalPcs % pcsPerBox;
      if (b > 0 && p > 0) return `${b} Boxes + ${p} Pcs`;
      if (b > 0) return `${b} Boxes`;
      if (p > 0) return `${p} Pcs`;
      return '0 Pcs';
    }
    return `${qty} ${prod?.uom || 'Units'}`;
  };

  // Filter records
  const filteredChallans = useMemo(() => {
    return challans.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        String(c.grn_no || '').toLowerCase().includes(q) ||
        String(c.vendor_name || '').toLowerCase().includes(q) ||
        String(c.purchase_no || '').toLowerCase().includes(q) ||
        String(c.warehouse || '').toLowerCase().includes(q) ||
        (Array.isArray(c.grn_items) && c.grn_items.some((it: any) => String(it.product_name || '').toLowerCase().includes(q)));

      const matchWorkflow =
        workflowFilter === 'ALL' ||
        (workflowFilter === 'MANUAL' && c.isManual) ||
        (workflowFilter === 'AUTOMATIC' && !c.isManual);

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Confirm' && (c.status === 'Confirm' || c.status === 'Billed')) ||
        (statusFilter === 'Pending Inward' && c.status === 'Pending Inward') ||
        (statusFilter === 'Rejected' && c.status === 'Rejected');

      return matchSearch && matchWorkflow && matchStatus;
    });
  }, [challans, searchTerm, workflowFilter, statusFilter]);

  // Group by Purchase Bill
  const groupedPurchases = useMemo(() => {
    const groups: Record<string, { purchase_no: string; vendor_name: string; warehouse: string; grns: any[] }> = {};
    filteredChallans.forEach((rec) => {
      const key = rec.purchase_no || `PURCHASE_${rec.id}`;
      if (!groups[key]) {
        groups[key] = {
          purchase_no: rec.purchase_no,
          vendor_name: rec.vendor_name,
          warehouse: rec.warehouse,
          grns: [],
        };
      }
      groups[key].grns.push(rec);
    });
    return Object.values(groups);
  }, [filteredChallans]);

  // Direct Inward Slip Print
  const handlePrintSlip = (rec: any) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const itemsHtml = (rec.grn_items || [])
      .map((it: any, idx: number) => {
        const totalQty = Number(it.qty || 0);
        const holdQty = Number(it.hold_qty || 0);
        const rejectedQty = Number(it.rejected_qty || 0);

        let acceptedQty = 0;
        if (it.accepted_qty !== null && it.accepted_qty !== undefined) {
          acceptedQty = Number(it.accepted_qty);
        } else if (holdQty > 0 || rejectedQty > 0) {
          acceptedQty = Math.max(0, totalQty - holdQty - rejectedQty);
        } else if (rec.status === 'Confirm' || rec.status === 'Billed') {
          acceptedQty = totalQty;
        }

        const dispTotal = formatItemDisplay(it, totalQty);
        const dispAccepted = acceptedQty > 0 ? formatItemDisplay(it, acceptedQty) : '0';
        const dispHold = holdQty > 0 ? formatItemDisplay(it, holdQty) : '0';

        return `
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">${it.product_name || 'Item'}</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-family: monospace;">${dispTotal}</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; color: ${acceptedQty > 0 ? '#047857' : '#64748b'}; font-weight: bold;">${dispAccepted} Accepted</td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; color: ${holdQty > 0 ? '#b45309' : '#64748b'}; font-weight: ${holdQty > 0 ? 'bold' : 'normal'};">${dispHold} Hold</td>
          </tr>
        `;
      })
      .join('');

    const gpVal = rec.gatePasses?.[rec.warehouse] || rec.gatePasses?.['DEFAULT'] || '';
    const safePrefix = String(rec.warehouse || 'AL-MUHAMMADI TILES EMPORIUM').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const fullGp = gpVal ? (gpVal.toUpperCase().startsWith(safePrefix) ? gpVal : `${safePrefix}-${gpVal}`) : '';
    const displayPurchaseRef = (rec.purchase_no && rec.purchase_no !== 'Unassigned' && rec.purchase_no !== rec.grn_no && rec.purchase_no !== 'Direct Inward')
      ? rec.purchase_no
      : (fullGp ? `Direct Inward (GP: ${fullGp})` : 'Direct Inward (No Bill)');

    const hasHold = (rec.grn_items || []).some((i: any) => Number(i.hold_qty || 0) > 0);
    const allHold = (rec.grn_items || []).length > 0 && (rec.grn_items || []).every((i: any) => Number(i.hold_qty || 0) >= Number(i.qty || 0) && Number(i.qty || 0) > 0);
    const isPending = rec.status === 'Pending Inward' || allHold;
    const inspectionStatusText = isPending ? 'Pending Inward (On Hold)' : (hasHold ? 'Partial Inward' : (rec.status || 'Confirm'));
    const inspectionStatusColor = isPending || hasHold ? '#b45309' : '#047857';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inward Receiving Slip - ${rec.grn_no || 'GRN'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
            .header { border-bottom: 2px solid #800020; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .company { font-size: 22px; font-weight: 900; color: #800020; letter-spacing: -0.5px; }
            .title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
            .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; }
            .val { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #f1f5f9; padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #334155; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig-box { width: 28%; border-top: 1px dashed #64748b; padding-top: 8px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company">AL-MUHAMMADI TILES EMPORIUM</div>
              <div class="title">INWARD RECEIVING CHALLAN / GATE PASS</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: bold; color: #64748b;">ORIGINAL COPY</div>
              <div style="font-size: 14px; font-family: monospace; font-weight: 900; color: #800020;">${rec.grn_no || 'GRN'}</div>
            </div>
          </div>

          <div class="grid">
            <div>
              <div class="label">Purchase Ref #</div>
              <div class="val" style="color: #be123c;">${displayPurchaseRef}</div>
            </div>
            <div>
              <div class="label">Inward Slip / GRN #</div>
              <div class="val" style="font-family: monospace;">${rec.grn_no || '—'}</div>
            </div>
            <div>
              <div class="label">Supplier / Vendor</div>
              <div class="val">${rec.vendor_name || '—'}</div>
            </div>
            <div>
              <div class="label">Receipt Date</div>
              <div class="val">${rec.receipt_date || new Date().toISOString().split('T')[0]}</div>
            </div>
            <div style="grid-column: span 2;">
              <div class="label">Receiving Warehouse</div>
              <div class="val">${rec.warehouse || 'Main Warehouse'}</div>
            </div>
            <div style="grid-column: span 2;">
              <div class="label">Inspection Status</div>
              <div class="val" style="color: ${inspectionStatusColor};">${inspectionStatusText}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th style="text-align: left;">Product Description</th>
                <th style="text-align: right;">Received Quantity / Packing</th>
                <th style="text-align: center;">Accepted Qty</th>
                <th style="text-align: center;">Hold / Inspection</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-box">Unloaded / Received By</div>
            <div class="sig-box">Inspected / QC Officer</div>
            <div class="sig-box">Store In-Charge Approval</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const manualCount = challans.filter((c) => c.isManual).length;
  const autoCount = challans.filter((c) => !c.isManual).length;

  return (
    <div className="w-full text-black dark:text-white text-xs max-h-[75vh] flex flex-col space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search vendor, Purchase #, Inward Slip #, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-boxdark font-semibold outline-none focus:border-primary shadow-xs transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Workflow Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-meta-4 border border-slate-200/60 dark:border-strokedark self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setWorkflowFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              workflowFilter === 'ALL'
                ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
            }`}
          >
            All Mode ({challans.length})
          </button>
          <button
            type="button"
            onClick={() => setWorkflowFilter('AUTOMATIC')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
              workflowFilter === 'AUTOMATIC'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 dark:text-blue-300 hover:bg-white/60 dark:hover:bg-boxdark'
            }`}
          >
            <span>⚡ Automatic ({autoCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkflowFilter('MANUAL')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
              workflowFilter === 'MANUAL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-300 hover:bg-white/60 dark:hover:bg-boxdark'
            }`}
          >
            <span>📋 Manual Slip ({manualCount})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {loading ? (
          <div className="p-16 text-center">
            <Spinner />
            <p className="mt-2 text-slate-400 font-bold">Loading processed inward challans...</p>
          </div>
        ) : groupedPurchases.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark text-slate-400 font-bold italic">
            No processed inward receiving slips match your search.
          </div>
        ) : (
          groupedPurchases.map((group) => (
            <div
              key={group.purchase_no}
              className="rounded-2xl border border-stroke bg-white shadow-xs dark:border-strokedark dark:bg-boxdark overflow-hidden transition"
            >
              {/* Group Header */}
              <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-meta-4/20 border-b border-stroke dark:border-strokedark gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">
                    {group.purchase_no}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-xs font-bold text-black dark:text-white">
                    {group.vendor_name}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                    <LuWarehouse size={12} className="text-slate-400" />
                    <span>Receiving Warehouse:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{group.warehouse}</span>
                  </span>
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-meta-4 text-slate-700 dark:text-slate-200 font-mono">
                    {group.grns.length} {group.grns.length === 1 ? 'Inward Slip' : 'Inward Slips / GRNs'}
                  </span>
                </div>
              </div>

              {/* Sub-table for Inward Challans of this Purchase */}
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-left">
                  <thead className="bg-slate-100/60 dark:bg-meta-4/10">
                    <tr className="text-[10px] font-black uppercase tracking-wider border-b border-stroke text-slate-600 dark:text-slate-300">
                      <th className="py-2.5 px-4 whitespace-nowrap w-44">Inward Slip / GRN #</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Receipt Date</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">Warehouse</th>
                      <th className="py-2.5 px-4 text-center whitespace-nowrap">Workflow Mode</th>
                      <th className="py-2.5 px-4">Items / Breakdown</th>
                      <th className="py-2.5 px-4 text-center whitespace-nowrap">Status</th>
                      <th className="py-2.5 px-4 text-center w-32 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    {group.grns.map((rec: any) => {
                      const code = rec.grn_no || `GRN-${rec.id}`;
                      const isDone = rec.status === 'Confirm' || rec.status === 'Billed';
                      const dateStr = rec.receipt_date || (rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '—');

                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150 font-semibold text-xs text-black dark:text-white"
                        >
                          {/* Slip / GRN # */}
                          <td className="py-3 px-4 font-mono whitespace-nowrap">
                            {(() => {
                              const gps = rec.gatePasses || {};
                              const wh = rec.warehouse;
                              const slip = gps[wh] || (Object.keys(gps).length === 1 ? Object.values(gps)[0] : null);
                              if (slip) {
                                const safePrefix = wh ? wh.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
                                const fullSlip = safePrefix && !String(slip).toUpperCase().startsWith(`${safePrefix}-`)
                                  ? `${safePrefix}-${slip}`
                                  : String(slip);
                                return (
                                  <div>
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-purple-700 dark:text-purple-300">
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                        GP
                                      </span>
                                      <span>{fullSlip}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">GRN: {code}</div>
                                  </div>
                                );
                              }
                              return <span className="text-primary font-bold font-mono select-all">{code}</span>;
                            })()}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-medium text-[11px]">
                            {dateStr}
                          </td>

                          {/* Warehouse */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex rounded-md py-0.5 px-2 text-[10px] font-bold bg-slate-100 dark:bg-meta-4 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600">
                              {rec.warehouse || '—'}
                            </span>
                          </td>

                          {/* Workflow Mode */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {rec.isManual ? (
                              <span className="inline-flex items-center gap-1 rounded-md py-0.5 px-2 text-[10px] font-black uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                                <span>📋 Manual Slip</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md py-0.5 px-2 text-[10px] font-black uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
                                <span>⚡ Direct GRN</span>
                              </span>
                            )}
                          </td>

                          {/* Items / Breakdown */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5 max-w-[280px]">
                              {(rec.grn_items || []).map((it: any, itIdx: number) => {
                                const q = Number(it.qty ?? it.accepted_qty ?? 0);
                                return (
                                  <div key={itIdx} className="text-[10px] text-slate-700 dark:text-slate-200 leading-tight">
                                    <span className="font-semibold">• {it.product_name}</span>
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
                                  : rec.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                              }`}
                            >
                              {rec.status || 'Confirm'}
                            </span>
                          </td>

                          {/* Actions: View, Edit QC, Print */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* 1. View Button */}
                              <button
                                type="button"
                                onClick={() => onView(rec.id)}
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 p-1.5 rounded transition shadow-xs cursor-pointer"
                                title="View Inward Challan Details"
                              >
                                <FiEye size={15} />
                              </button>

                              {/* 2. Edit QC Quantities Button */}
                              {onEdit && (
                                <button
                                  type="button"
                                  onClick={() => onEdit(rec.id)}
                                  className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 p-1.5 rounded transition shadow-xs cursor-pointer"
                                  title="Edit Inspection Quantities (Accepted / Hold / Rejected)"
                                >
                                  <FiEdit2 size={15} />
                                </button>
                              )}

                              {/* 3. Print Slip Button */}
                              <button
                                type="button"
                                onClick={() => handlePrintSlip(rec)}
                                className="bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-400 p-1.5 rounded transition shadow-xs cursor-pointer"
                                title="Print Inward Receiving Slip / Gate Pass"
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

export default InwardChallanHistory;
