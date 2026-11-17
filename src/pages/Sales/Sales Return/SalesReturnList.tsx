import React, { useEffect, useState } from 'react';
import TablePagination from '../../../components/TablePagination';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import TableActions from '../../../ui/TableActions';
import { useAuth } from '../../../Context/Auth';
import { useLanguage } from '../../../Context/LanguageContext';
import { fetchWorkflowSettings } from '../../../service/workflowSettingsService';
import { fetchStockDataset, getTotalAvailableStock, formatStockWithBoxesAndPcs } from '../../../utils/stockCalculator';
import { 
  MdCheckCircle, 
  MdCancel, 
  MdHourglassEmpty, 
  MdReportProblem, 
  MdClose, 
  MdOutlinePayment, 
  MdArrowForward,
  MdInventory2
} from 'react-icons/md';

const SalesReturnList = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { tenantId } = useAuth();
  const [returns, setReturns] = useState<any[]>([]);
  const [productsCatalog, setProductsCatalog] = useState<any[]>([]);
  const [selectedQcReturn, setSelectedQcReturn] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionId, setOpenActionId] = useState<any | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, right: 0 });

  const formatQtyBoxesPcs = (qty: number, pcsPerBox?: number, uom?: string, itemName?: string, sku?: string) => {
    const matchedProd = productsCatalog.find(p => 
      (itemName && p.product_name && p.product_name.toLowerCase().trim() === String(itemName).toLowerCase().trim()) ||
      (sku && p.item_sr_no && p.item_sr_no.toLowerCase().trim() === String(sku).toLowerCase().trim())
    );

    const prodToUse = matchedProd || {
      pieces_per_box: pcsPerBox,
      loose_conversion_ratio: pcsPerBox,
      uom: uom || 'Box'
    };

    return formatStockWithBoxesAndPcs(qty, prodToUse, uom || matchedProd?.uom || 'Box').inlineText;
  };

  const getQcBadge = (ret: any) => {
    const status = ret.inward_status;
    const receivedItems = Array.isArray(ret.received_items) 
      ? ret.received_items 
      : (typeof ret.received_items === 'string' ? JSON.parse(ret.received_items || '[]') : []);
    
    const hasHold = receivedItems.some((i: any) => Number(i.holdQty || 0) > 0);
    const hasRejected = receivedItems.some((i: any) => Number(i.rejectedQty || 0) > 0);
    const allRejected = receivedItems.length > 0 && receivedItems.every((i: any) => Number(i.acceptedQty || 0) === 0);

    if (!status || status === 'Pending Inward') {
      return {
        label: 'QC Pending',
        icon: <MdHourglassEmpty className="text-amber-500 animate-pulse text-xs" />,
        className: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
      };
    }

    if (status === 'Rejected' || allRejected) {
      return {
        label: 'QC Rejected',
        icon: <MdCancel className="text-rose-500 text-xs" />,
        className: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
      };
    }

    if (hasHold) {
      return {
        label: 'QC Partial (On Hold)',
        icon: <MdReportProblem className="text-amber-600 text-xs" />,
        className: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
      };
    }

    if (status === 'Partially Received' || hasRejected) {
      return {
        label: 'QC Partial (Accepted)',
        icon: <MdCheckCircle className="text-blue-600 text-xs" />,
        className: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
      };
    }

    if (status === 'Received') {
      return {
        label: 'QC Completed',
        icon: <MdCheckCircle className="text-emerald-600 text-xs" />,
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
      };
    }

    return {
      label: status,
      icon: <MdInventory2 className="text-slate-500 text-xs" />,
      className: 'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
    };
  };

  const getModalBreakdown = (ret: any) => {
    if (!ret) return { items: [], acceptedTotal: 0, holdTotal: 0, rejectedTotal: 0, grossTotal: 0 };
    const originalItems = Array.isArray(ret.items)
      ? ret.items
      : (typeof ret.items === 'string' ? JSON.parse(ret.items || '[]') : []);
    const receivedItems = Array.isArray(ret.received_items)
      ? ret.received_items
      : (typeof ret.received_items === 'string' ? JSON.parse(ret.received_items || '[]') : []);

    let acceptedTotal = 0;
    let holdTotal = 0;
    let rejectedTotal = 0;
    let grossTotal = Number(ret.total_amount || 0);

    const breakdownItems = originalItems.map((orig: any) => {
      const origSku = orig.skuCode || orig.sku || '';
      const origName = orig.itemName || orig.product_name || '';
      const rate = Number(orig.rate || orig.sale_price || orig.price || orig.rp || 0);
      const returnedQty = Number(orig.qty || orig.returnedQty || orig.quantity || 0);

      const match = receivedItems.find((r: any) => 
        (origSku && r.skuCode && r.skuCode === origSku) ||
        (origName && r.itemName && String(r.itemName).trim().toLowerCase() === String(origName).trim().toLowerCase())
      );

      const matchedProd = productsCatalog.find(p => 
        (origName && p.product_name && p.product_name.toLowerCase().trim() === String(origName).toLowerCase().trim()) ||
        (origSku && p.item_sr_no && p.item_sr_no.toLowerCase().trim() === String(origSku).toLowerCase().trim())
      );

      const resolvedPcsPerBox = Number(
        orig.pcsPerBox ||
        orig.pieces_per_box ||
        matchedProd?.loose_conversion_ratio ||
        matchedProd?.pieces_per_box ||
        matchedProd?.pcs_per_box ||
        1
      );

      const isVerified = Boolean(match);
      const acceptedQty = isVerified ? Number(match.acceptedQty || 0) : 0;
      const holdQty = isVerified ? Number(match.holdQty || 0) : 0;
      const rejectedQty = isVerified ? Number(match.rejectedQty || 0) : 0;
      const disposalAction = match?.disposalAction || (rejectedQty > 0 ? 'Handed Back to Customer' : '-');
      const rejectReason = match?.rejectReason || '-';

      acceptedTotal += (acceptedQty * rate);
      holdTotal += (holdQty * rate);
      rejectedTotal += (rejectedQty * rate);

      return {
        sku: origSku,
        itemName: origName,
        returnedQty,
        acceptedQty,
        holdQty,
        rejectedQty,
        rate,
        uom: orig.uom || matchedProd?.uom || 'Box',
        pcsPerBox: resolvedPcsPerBox,
        disposalAction,
        rejectReason,
        isVerified
      };
    });

    if (ret.metadata?.accepted_amount !== undefined && acceptedTotal === 0 && receivedItems.length > 0) {
      acceptedTotal = Number(ret.metadata.accepted_amount) || 0;
    }
    if (ret.metadata?.rejected_amount !== undefined && rejectedTotal === 0 && receivedItems.length > 0) {
      rejectedTotal = Number(ret.metadata.rejected_amount) || 0;
    }

    return {
      items: breakdownItems,
      acceptedTotal,
      holdTotal,
      rejectedTotal,
      grossTotal
    };
  };

  const handleProceedToSettlement = (ret: any, acceptedTotal: number) => {
    const returnIdentifier = ret.return_no && !ret.return_no.match(/^RTN-\d{6}$/)
      ? ret.return_no
      : `RTN-${String(ret.id).padStart(4, '0')}`;

    navigate(`${tenantId ? `/${tenantId}` : ''}/Sales/Sales-Return-Receipt/Add`, {
      state: {
        prefillReturn: ret,
        selectedReturnNo: returnIdentifier,
        selectedCustomer: ret.customer_name,
        suggestedAmount: acceptedTotal > 0 ? acceptedTotal : Number(ret.total_amount || 0)
      }
    });
  };

  useEffect(() => {
    fetchSalesReturns();
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => setOpenActionId(null);
    const handleScrollResize = () => setOpenActionId(null);
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('scroll', handleScrollResize, true);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollResize, true);
    };
  }, []);

  const fetchSalesReturns = async () => {
    try {
      setLoading(true);
      const [{ data: returnsData, error }, { data: prodsData }] = await Promise.all([
        supabase
          .from('sales_returns')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, product_name, item_sr_no, uom, category, loose_conversion_ratio, pieces_per_box, pcs_per_box, pieces_per_packing, product_description')
      ]);

      if (error) throw error;
      setReturns(returnsData || []);
      if (prodsData) setProductsCatalog(prodsData);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReturn = async (id: string | number) => {
    try {
      const { data: targetReturn, error: fetchError } = await supabase
        .from('sales_returns')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!targetReturn) return;

      // Strict Negative Stock Guardrail (when allow_negative_stock is disabled)
      const wfSettings = await fetchWorkflowSettings();
      if (wfSettings && wfSettings.allow_negative_stock === false) {
        const stockDataset = await fetchStockDataset();
        const itemsArr = Array.isArray(targetReturn.items) ? targetReturn.items : JSON.parse(targetReturn.items || '[]');

        for (const item of itemsArr) {
          const pName = item.itemName || item.product_name;
          const qty = Number(item.qty || item.returnedQty || item.quantity || 0);
          if (pName && qty > 0) {
            const avail = await getTotalAvailableStock(pName, stockDataset);
            if (avail - qty < -0.0001) {
              const { data: matchedProd } = await supabase.from('products').select('*').ilike('product_name', pName).maybeSingle();
              const fmtAvail = formatStockWithBoxesAndPcs(avail, matchedProd).inlineText;
              const fmtQty = formatStockWithBoxesAndPcs(qty, matchedProd).inlineText;
              toast.error(
                `Cannot Delete Sales Return: Deducting returned items would drive "${pName}" stock below zero (${fmtAvail} available, deducting ${fmtQty}). Negative stock is disabled in settings.`,
                { duration: 7000 }
              );
              return;
            }
          }
        }
      }

      if (!window.confirm('Are you completely certain you want to delete this sales return debit note record?')) return;

      if (targetReturn) {
        if (targetReturn.items) {
          const itemsArr = Array.isArray(targetReturn.items) ? targetReturn.items : JSON.parse(targetReturn.items || '[]');
          const dispatchLoc = targetReturn.dispatch_warehouse || targetReturn.location || '';

          for (const item of itemsArr) {
            const pName = item.itemName || item.product_name;
            const qty = Number(item.qty || item.returnedQty || item.quantity || 0);

            if (pName) {
              // 1. Decrease Master Product Stock (-)
              const { data: currentProduct } = await supabase
                .from('products')
                .select('id, current_stock')
                .ilike('product_name', pName)
                .maybeSingle();

              if (currentProduct) {
                const reducedStockCount = Math.max(0, (Number(currentProduct.current_stock) || 0) - qty);
                await supabase
                  .from('products')
                  .update({ current_stock: reducedStockCount })
                  .eq('id', currentProduct.id || '');
              }

              // warehouse_inventory retired — formula-based stock is source of truth
            }
          }
        }

        // 2. Cascade Delete Associated Financial Vouchers (SRV & CPV)
        const returnIdentifier = targetReturn.return_no || `RTN-${String(targetReturn.id).padStart(4, '0')}`;
        await supabase
          .from('financial_vouchers')
          .delete()
          .or(`original_invoice_no.eq.${returnIdentifier},metadata->>linkedReturnNo.eq.${returnIdentifier}`);
      }

      const { error: deleteError } = await supabase.from('sales_returns').delete().eq('id', id);
      if (deleteError) throw deleteError;

      toast.success('Sales Return deleted cleanly. Stock & vouchers reverted!');
      fetchSalesReturns();
    } catch (err: any) {
      toast.error('Deletion Failed: ' + err.message);
    }
  };

  const filteredReturns = returns.filter((item) => {
    const sTerm = searchTerm.toLowerCase();
    const customer = (item.customer_name || '').toLowerCase();
    const origInvoice = String(item.original_invoice_no || '').toLowerCase();
    const returnId = String(item.id || '').toLowerCase();
    return customer.includes(sTerm) || origInvoice.includes(sTerm) || returnId.includes(sTerm);
  });

  const totalEntries = filteredReturns.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedReturns = filteredReturns.slice(startIndex, startIndex + pageSize);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative text-slate-800 dark:text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{isRTL ? "سیلز واپسی اور کریڈٹ نوٹس" : "Sales Returns & Credit Notes"}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{isRTL ? "کسٹمر واپسی، اسٹاک واپسی اور کریڈٹ نوٹس کا انتظام کریں" : "Manage customer return debit notes, stock reversals and settlement vouchers"}</p>
        </div>
        <button
          onClick={() => navigate('/Sales-Return/Debit-Notes/Add')}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm hover:shadow-md cursor-pointer"
        >
          <span>{isRTL ? "+ نئی واپسی درج کریں" : "+ Add Return Note"}</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#111827] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none focus:border-emerald-600 text-xs font-bold text-slate-800 dark:text-white transition"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size} className="dark:bg-slate-800">
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-xs w-full sm:w-auto text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search return #, customer, invoice..."
              className="w-full sm:w-72 rounded-xl border border-slate-200 py-2 px-3.5 bg-slate-50/50 dark:bg-slate-800/60 dark:border-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-800 dark:text-white transition"
            />
          </div>
        </div>

        <div className="max-w-full overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <th className="py-3.5 px-4 w-12 text-center">{isRTL ? "نمبر شمار" : "S#"}</th>
                <th className="py-3.5 px-4 font-mono">{isRTL ? "واپسی نوٹ #" : "Return Note #"}</th>
                <th className="py-3.5 px-4 font-mono">{isRTL ? "اصل انوائس" : "Original Invoice"}</th>
                <th className="py-3.5 px-4 font-mono">{isRTL ? "گیٹ پاس #" : "Gate Pass #"}</th>
                <th className="py-3.5 px-4">{isRTL ? "واپسی تاریخ" : "Return Date"}</th>
                <th className="py-3.5 px-4">{isRTL ? "کسٹمر" : "Customer"}</th>
                <th className="py-3.5 px-4 text-center">{isRTL ? "کوالٹی چیک" : "QC Status"}</th>
                <th className="py-3.5 px-4 w-36 text-center">{isRTL ? "واپسی صورتحال" : "Return Status"}</th>
                <th className="py-3.5 px-4 text-right pr-3 font-mono">{isRTL ? "کل خالص رقم" : "Total Net Amount"}</th>
                <th className="py-3.5 px-4 w-14 text-center">{isRTL ? "کارروائی" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12"><Spinner /></td></tr>
              ) : filteredReturns.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-xs text-slate-400 italic">{isRTL ? "کوئی سیلز واپسی ریکارڈ نہیں ملا۔" : "No return records found."}</td></tr>
              ) : (
                paginatedReturns.map((ret, idx) => {
                  const serialNumber = startIndex + idx + 1;
                  const rawInvoiceStr = String(ret.invoice_no || ret.original_invoice_no || '').trim();
                  const cleanNum = rawInvoiceStr.replace(/^inv-?/i, '').trim();
                  const displayInvoiceNo = cleanNum ? `INV-${cleanNum.padStart(4, '0')}` : (rawInvoiceStr || '-');

                  const payout = Number(ret.payout_amount_paid || 0);
                  const total = Number(ret.total_amount || 0);
                  const isFullPaid = ret.return_status === 'Paid' || (payout > 0 && payout >= total - 0.01);
                  const isPartialPaid = !isFullPaid && payout > 0;

                  let statusLabel = 'Credit Settled';
                  let badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';

                  if (isFullPaid) {
                    statusLabel = ret.settlement_mode === 'Bank' ? 'Bank Refund' : 'Cash Refund';
                    badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
                  } else if (isPartialPaid) {
                    statusLabel = `Partial Refund (Rs. ${payout.toFixed(2)})`;
                    badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
                  }

                  return (
                    <tr key={ret.id} className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 duration-150">
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-center font-mono">{serialNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {ret.return_no && !ret.return_no.match(/^RTN-\d{6}$/) ? ret.return_no : `RTN-${String(ret.id).padStart(4, '0')}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 dark:text-slate-400">{displayInvoiceNo}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">{ret.gate_pass_no || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{ret.return_date ? ret.return_date : new Date(ret.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{ret.customer_name}</td>
                      <td className="py-3.5 px-4 text-center">
                        {(() => {
                          const qc = getQcBadge(ret);
                          return (
                            <button
                              type="button"
                              onClick={() => setSelectedQcReturn(ret)}
                              title="Click to view QC inspection details & settlement"
                              className={`inline-flex items-center gap-1.5 rounded-full py-1 px-3 text-[10px] font-black uppercase tracking-wider transition-all duration-150 hover:shadow-md cursor-pointer hover:scale-105 active:scale-95 ${qc.className}`}
                            >
                              {qc.icon}
                              <span>{qc.label}</span>
                            </button>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex rounded-full py-0.5 px-2.5 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
                          {statusLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-rose-600 font-mono pr-3">
                        Rs. {Number(ret.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <TableActions
                          onPrint={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Sales-Return/Debit-Notes/Print/${ret.id}`)}
                          onEdit={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Sales-Return/Debit-Notes/Edit/${ret.id}`, { state: { returnData: ret } })}
                          onDelete={() => handleDeleteReturn(ret.id)}
                          printTitle="Print Voucher"
                          editTitle="Edit Return"
                          deleteTitle="Delete Record"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalEntries={totalEntries}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          itemName="entries"
        />
      </div>

      {/* ── QC DETAILS & SETTLEMENT MODAL ── */}
      {selectedQcReturn && (() => {
        const bd = getModalBreakdown(selectedQcReturn);
        const qcBadge = getQcBadge(selectedQcReturn);
        const returnIdStr = selectedQcReturn.return_no && !selectedQcReturn.return_no.match(/^RTN-\d{6}$/)
          ? selectedQcReturn.return_no
          : `RTN-${String(selectedQcReturn.id).padStart(4, '0')}`;
        const canSettle = selectedQcReturn.inward_status === 'Received' || selectedQcReturn.inward_status === 'Partially Received' || bd.acceptedTotal > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div 
              className="relative w-full max-w-4xl bg-white dark:bg-boxdark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <MdInventory2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Return Quality Inspection & Settlement
                      </h3>
                      <span className={`inline-flex items-center gap-1 rounded-full py-0.5 px-2.5 text-[10px] font-black uppercase tracking-wider ${qcBadge.className}`}>
                        {qcBadge.icon}
                        {qcBadge.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      Return Note: <strong className="text-emerald-600">{returnIdStr}</strong> | Customer: <strong className="text-slate-700 dark:text-slate-200">{selectedQcReturn.customer_name}</strong> | Invoice: <strong className="text-slate-700 dark:text-slate-200">{selectedQcReturn.invoice_no || selectedQcReturn.original_invoice_no || '-'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedQcReturn(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <MdClose size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* 4 Financial Breakdown Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Returned Bill</p>
                    <p className="text-base font-black font-mono text-slate-800 dark:text-white mt-1">
                      Rs. {bd.grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Claimed value</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Accepted (QC Passed)</p>
                    <p className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      Rs. {bd.acceptedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Approved for settlement</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">On Hold (Pending Decision)</p>
                    <p className="text-base font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                      Rs. {bd.holdTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">Under evaluation</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Rejected Value</p>
                    <p className="text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                      Rs. {bd.rejectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-rose-700 dark:text-rose-400 mt-0.5">Deducted from bill</p>
                  </div>
                </div>

                {/* Inspection Items Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Item Inspection Breakdown ({bd.items.length} {bd.items.length === 1 ? 'Item' : 'Items'})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Warehouse: {selectedQcReturn.warehouse_name || selectedQcReturn.source_warehouse || 'Main Warehouse'}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/60 dark:bg-slate-800/40 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2.5 px-3">Item / Product</th>
                          <th className="py-2.5 px-3 text-center">Returned Qty</th>
                          <th className="py-2.5 px-3 text-center text-emerald-600">Accepted Qty</th>
                          <th className="py-2.5 px-3 text-center text-amber-600">On Hold Qty</th>
                          <th className="py-2.5 px-3 text-center text-rose-600">Rejected Qty</th>
                          <th className="py-2.5 px-3">Disposal Action</th>
                          <th className="py-2.5 px-3">Remarks / Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {bd.items.map((it: any, iIdx: number) => (
                          <tr key={iIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-800 dark:text-white">{it.itemName}</div>
                              {it.sku && <div className="text-[10px] font-mono text-slate-400">SKU: {it.sku}</div>}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {formatQtyBoxesPcs(it.returnedQty, it.pcsPerBox, it.uom, it.itemName, it.sku)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-600">
                              {it.isVerified ? formatQtyBoxesPcs(it.acceptedQty, it.pcsPerBox, it.uom, it.itemName, it.sku) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-amber-600">
                              {it.isVerified ? formatQtyBoxesPcs(it.holdQty, it.pcsPerBox, it.uom, it.itemName, it.sku) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-rose-600">
                              {it.isVerified ? formatQtyBoxesPcs(it.rejectedQty, it.pcsPerBox, it.uom, it.itemName, it.sku) : '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              {it.rejectedQty > 0 ? (
                                <span className={`inline-block py-0.5 px-2 rounded-md text-[10px] font-bold ${
                                  it.disposalAction === 'Move to Scrap / Breakage' 
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' 
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                                }`}>
                                  {it.disposalAction}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[10px]">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                              {it.rejectReason || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Workflow Guidance Notice */}
                {!selectedQcReturn.inward_status || selectedQcReturn.inward_status === 'Pending Inward' ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <span>
                      ⏳ <strong>Inspection Pending:</strong> Items have not yet been verified at the warehouse. Once warehouse staff confirms the accepted quantities, settlement can be issued.
                    </span>
                    <button
                      onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Inward-Challan/List`)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] cursor-pointer whitespace-nowrap ml-3"
                    >
                      Receive Stock in QC Queue →
                    </button>
                  </div>
                ) : bd.holdTotal > 0 ? (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-300">
                    💡 <strong>Partial Settlement Available:</strong> You can proceed to settle the accepted portion (Rs. {bd.acceptedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}). The on-hold items (Rs. {bd.holdTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}) can be decided later.
                  </div>
                ) : null}
              </div>

              {/* Modal Footer with Settlement Button */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => setSelectedQcReturn(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-3">
                  {canSettle && (
                    <button
                      type="button"
                      onClick={() => handleProceedToSettlement(selectedQcReturn, bd.acceptedTotal)}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                    >
                      <MdOutlinePayment size={16} />
                      <span>Proceed to Settlement / Issue Receipt</span>
                      <MdArrowForward size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default SalesReturnList;
