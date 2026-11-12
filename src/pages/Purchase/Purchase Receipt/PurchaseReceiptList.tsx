import React, { useEffect, useState } from 'react';
import TablePagination from '../../../components/TablePagination';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import TableActions from '../../../ui/TableActions';
import ConfirmDeleteModal from '../../../components/Modals/ConfirmDeleteModal';
import { useAuth } from '../../../Context/Auth';
import { MdReceipt, MdPerson, MdEvent, MdAccountBalance, MdAdd } from 'react-icons/md';
import { FiAlertTriangle } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';

const PurchaseReceiptList = () => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const formatMoney = (val: number | string | undefined | null): string => {
    const num = Number(val) || 0;
    if (Number.isInteger(num)) {
      return num.toLocaleString('en-US');
    }
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const extractReceiptSeq = (rcpt: any) => {
    const rawNo = rcpt.voucher_no || '';
    const match = String(rawNo).match(/(?:VPR|VPV|PR)-(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) return num;
    }
    return Number(rcpt.id) || 0;
  };

  const fetchPurchaseReceiptLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_vouchers')
        .select('*')
        .or('voucher_type.eq.Vendor Payment Voucher,voucher_type.eq.Cash Payment Voucher,voucher_type.eq.Bank Payment Voucher,voucher_no.ilike.VPV-%,voucher_no.ilike.VPR-%');

      if (error) throw error;

      // Sort Receipt No wise High to Low (e.g. VPR-002 before VPR-001)
      const sorted = (data || []).sort((a: any, b: any) => {
        const seqA = extractReceiptSeq(a);
        const seqB = extractReceiptSeq(b);
        if (seqB !== seqA) return seqB - seqA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

      setReceipts(sorted);
    } catch (err: any) {
      toast.error('Failed to fetch receipts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseReceiptLogs();
  }, []);

  const confirmDeleteAction = async () => {
    if (!deleteTarget) return;
    const rcpt = deleteTarget;
    const isUpfront = Boolean(
      rcpt.metadata?.auto_generated || 
      rcpt.metadata?.moduleSource === 'purchase_bill'
    );
    const poRef = rcpt.original_invoice_no || rcpt.metadata?.linkedPurchaseNo;

    try {
      setDeleting(true);
      // 1. Delete voucher
      const { error } = await supabase.from('financial_vouchers').delete().eq('id', rcpt.id);
      if (error) throw error;

      // 2. Re-sync linked purchase balance if applicable
      if (poRef) {
        const cleanId = String(poRef).replace(/\D/g, '');
        const numId = parseInt(cleanId, 10);
        let query = supabase.from('supplier_purchases').select('*');
        if (!isNaN(numId)) {
          query = query.or(`id.eq.${numId},purchase_no.eq.${poRef}`);
        } else {
          query = query.eq('purchase_no', poRef);
        }
        const { data: targetPo } = await query.maybeSingle();

        if (targetPo) {
          const { data: remainingVouchers } = await supabase
            .from('financial_vouchers')
            .select('id, total_amount')
            .eq('customer_name', rcpt.customer_name)
            .or(`original_invoice_no.eq.${poRef},original_invoice_no.eq.${targetPo.purchase_no}`);

          const totalVouchersSum = (remainingVouchers || []).reduce((acc: number, v: any) => acc + (Number(v.total_amount) || 0), 0);
          
          let newCashPaid = Number(targetPo.cash_amount_paid || 0);
          let newBankPaid = Number(targetPo.bank_amount_paid || 0);

          if (isUpfront) {
            newCashPaid = 0;
            newBankPaid = 0;
          }

          const newTotalPaid = newCashPaid + newBankPaid + totalVouchersSum;
          const poBillTotal = Number(targetPo.total_amount || 0);
          const newRemaining = Math.max(0, poBillTotal - newTotalPaid);
          const newStatus = newTotalPaid >= poBillTotal ? 'Paid' : (newTotalPaid > 0 ? 'Partially Paid' : 'Pending Payment');

          const updatedMetadata = {
            ...(targetPo.metadata || {}),
            ...(isUpfront ? { cashAmountPaid: 0, bankAmountPaid: 0 } : {})
          };

          const { error: updatePoErr } = await supabase
            .from('supplier_purchases')
            .update({
              cash_amount_paid: newCashPaid,
              bank_amount_paid: newBankPaid,
              amount_paid: newTotalPaid,
              remaining_balance: newRemaining,
              metadata: updatedMetadata
            })
            .eq('id', targetPo.id);

          if (updatePoErr) {
            console.error('Failed to update linked purchase bill:', updatePoErr);
          }
        }
      }

      toast.success(isUpfront ? `Voucher deleted! Bill #${poRef} balance updated to unpaid.` : 'Purchase payment voucher deleted successfully!');
      setDeleteTarget(null);
      fetchPurchaseReceiptLogs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredReceipts = receipts.filter(r =>
    (r.voucher_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.original_invoice_no || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEntries = filteredReceipts.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedReceipts = filteredReceipts.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative text-black dark:text-bodydark text-xs">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <MdReceipt className="text-primary" size={24} />
            Vendor Purchase Receipt Log Registry
          </h2>
          <p className="text-xs text-gray-400">View vendor cash/bank payment disbursement vouchers and settlement history</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Receipt/Add`)}
          className="flex items-center gap-1.5 justify-center rounded bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition shadow-sm cursor-pointer"
        >
          <MdAdd size={18} /> Add Purchase Receipt
        </button>
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-stroke py-1 px-2 bg-transparent dark:border-strokedark outline-none text-black dark:text-white text-xs font-bold"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-gray-500">entries</span>
          </div>

          <div className="w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search receipt #, PO # or vendor..."
              className="w-full sm:w-64 rounded border border-stroke py-1.5 px-3 bg-transparent dark:border-strokedark outline-none text-black dark:text-white text-xs font-semibold focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto border-collapse text-xs">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4 text-xs font-bold uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                <th className="py-4 px-4 font-semibold w-16">S#</th>
                <th className="py-4 px-4 font-semibold">Receipt No</th>
                <th className="py-4 px-4 font-semibold">Vendor Name</th>
                <th className="py-4 px-4 font-semibold">Linked PO / Bill</th>
                <th className="py-4 px-4 font-semibold text-center">Voucher Type</th>
                <th className="py-4 px-4 font-semibold text-center">Disbursed Date</th>
                <th className="py-4 px-4 font-semibold text-right pr-6">Amount Cleared</th>
                <th className="py-4 px-4 font-semibold w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm"><Spinner /></td></tr>
              ) : paginatedReceipts.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-sm text-gray-500 dark:text-gray-400 italic">No purchase receipt vouchers recorded yet.</td></tr>
              ) : (
                paginatedReceipts.map((rcpt, idx) => {
                  const serialNumber = startIndex + idx + 1;
                  const venName = rcpt.customer_name || rcpt.customerName || 'General Vendor';
                  const vType = rcpt.voucher_type === 'Cash Payment Voucher' 
                    ? 'Cash Outflow' 
                    : rcpt.voucher_type === 'Bank Payment Voucher'
                    ? 'Bank Wire'
                    : (rcpt.metadata?.settlementMode ? `${rcpt.metadata.settlementMode}` : 'Bank/Cash');
                  const displayNo = rcpt.voucher_no ? String(rcpt.voucher_no).replace('VPV-', 'VPR-') : `VPR-${String(rcpt.id).padStart(3, '0')}`;
                  const poRef = rcpt.original_invoice_no || rcpt.metadata?.linkedPurchaseNo || null;
                  const isUpfront = Boolean(
                    rcpt.metadata?.auto_generated || 
                    rcpt.metadata?.moduleSource === 'purchase_bill'
                  );

                  return (
                    <tr key={rcpt.id} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150 font-semibold text-black dark:text-white text-xs">
                      <td className="py-3.5 px-4 text-gray-400">{serialNumber}</td>
                      <td className="py-3.5 px-4 font-mono font-black text-primary">{displayNo}</td>
                      <td className="py-3.5 px-4 flex items-center gap-1.5">
                        <MdPerson className="text-gray-400" size={16} />
                        <span>{venName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {poRef ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black">
                              {poRef}
                            </span>
                            {isUpfront && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60" title="Created automatically from upfront bill payment">
                                ⚡ Upfront Bill Payment
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-sans">General Ledger</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${rcpt.voucher_type === 'Cash Payment Voucher' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60' : 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60'}`}>
                          {vType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-gray-500">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono">
                          <MdEvent size={13} />{rcpt.voucher_date}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 pr-6">
                        Rs. {formatMoney(rcpt.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <TableActions
                          onPrint={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Receipt/Print/${rcpt.id}`)}
                          onEdit={!isUpfront ? () => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Receipt/Add`, { state: { receiptRecord: rcpt } }) : undefined}
                          canEdit={!isUpfront}
                          onDelete={() => setDeleteTarget(rcpt)}
                          printTitle="Print Payment Voucher"
                          editTitle="Edit Payment Record"
                          deleteTitle={isUpfront ? "Delete & Revert Bill to Unpaid" : "Delete Voucher"}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* THEME CONFIRMATION MODAL */}
      {deleteTarget && (() => {
        const isTargetUpfront = Boolean(
          deleteTarget.metadata?.auto_generated || 
          deleteTarget.metadata?.moduleSource === 'purchase_bill'
        );
        const targetPoRef = deleteTarget.original_invoice_no || deleteTarget.metadata?.linkedPurchaseNo;
        const displayNoTarget = deleteTarget.voucher_no 
          ? String(deleteTarget.voucher_no).replace('VPV-', 'VPR-') 
          : `VPR-${String(deleteTarget.id).padStart(3, '0')}`;

        return (
          <ConfirmDeleteModal
            isOpen={!!deleteTarget}
            title={isTargetUpfront ? "Delete Upfront Payment Voucher?" : "Delete Payment Voucher?"}
            itemType="Payment Voucher"
            itemName={displayNoTarget}
            subtitle={isTargetUpfront ? "This voucher was recorded upfront when creating a purchase bill." : "This will permanently remove this disbursement receipt."}
            accentVariant={isTargetUpfront ? 'warning' : 'danger'}
            details={[
              { label: "Vendor", value: deleteTarget.customer_name || 'General Vendor' },
              { label: "Amount Cleared", value: `Rs. ${formatMoney(deleteTarget.total_amount)}` },
              ...(isTargetUpfront && targetPoRef ? [{ label: "Linked Purchase Bill", value: `Bill #${targetPoRef}` }] : [])
            ]}
            warning={isTargetUpfront ? `Deleting this voucher will mark Rs. ${formatMoney(deleteTarget.total_amount)} on Bill #${targetPoRef} as UNPAID and revert the bill to Pending Payment in your vendor ledger.` : undefined}
            confirmButtonText={isTargetUpfront ? "Confirm & Mark Bill Unpaid" : "Delete Voucher"}
            isDeleting={deleting}
            onConfirm={confirmDeleteAction}
            onCancel={() => setDeleteTarget(null)}
          />
        );
      })()}

    </div>
  );
};

export default PurchaseReceiptList;
