import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import TablePagination from '../../../components/TablePagination';
import { useAuth } from '../../../Context/Auth';
import { useModal } from '../../../Context/Modal';
import { useLanguage } from '../../../Context/LanguageContext';
import ConfirmDeleteModal from '../../../components/Modals/ConfirmDeleteModal';
import { PurchaseRecord, AllocationMapEntry, UnbilledGRN } from './list/types/purchaseListTypes';
import { calculatePurchaseAllocations } from './list/utils/purchaseAllocations';
import { validateAndExecuteDeletePurchase } from './list/services/purchaseDeleteService';
import { AvailableGrnsModalContent } from './list/components/AvailableGrnsModalContent';
import { PurchaseQuickViewModal } from './list/components/PurchaseQuickViewModal';
import { PurchaseTableRow } from './list/components/PurchaseTableRow';

const PurchaseList: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const { isRTL } = useLanguage();
  const { showModal, hideModal } = useModal();

  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [purchaseAllocationsMap, setPurchaseAllocationsMap] = useState<Record<string, AllocationMapEntry>>({});
  const [loading, setLoading] = useState(true);
  const [unbilledGrns, setUnbilledGrns] = useState<UnbilledGRN[]>([]);
  const [deleteTargetPurchase, setDeleteTargetPurchase] = useState<PurchaseRecord | null>(null);
  const [isDeletingPurchase, setIsDeletingPurchase] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewPurchaseIndex, setPreviewPurchaseIndex] = useState<number | null>(null);

  const fetchProcurementLogs = async () => {
    try {
      setLoading(true);
      const [
        { data: purData, error: purError },
        { data: vouchersData },
        { data: pReturnsData },
        { data: grnData }
      ] = await Promise.all([
        fetchAllPages(supabase.from('supplier_purchases').select('*').order('created_at', { ascending: false })),
        fetchAllPages(
          supabase
            .from('financial_vouchers')
            .select('*')
            .or('voucher_type.eq.Cash Payment Voucher,voucher_type.eq.Bank Payment Voucher,voucher_type.eq.Cash & Bank Payment Voucher')
        ),
        fetchAllPages(supabase.from('purchase_returns').select('*')),
        fetchAllPages(supabase.from('grn_receipts').select('*, grn_items(*)').neq('status', 'Billed').order('created_at', { ascending: false }))
      ]);

      if (purError) throw purError;

      const allocMap = calculatePurchaseAllocations(purData || [], vouchersData || [], pReturnsData || []);
      setPurchaseAllocationsMap(allocMap);
      setPurchases(purData || []);
      if (grnData) setUnbilledGrns(grnData);
    } catch (err: any) {
      toast.error('Data Fetching Failure: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurementLogs();
  }, []);

  const openAvailableGrnsModal = () => {
    showModal(
      <AvailableGrnsModalContent
        unbilledGrns={unbilledGrns}
        onSelectGrn={(g) => {
          hideModal();
          navigate('/Purchase/Purchases/Add', {
            state: {
              importGrnId: g.id,
              importGrn: g,
              isTilePurchase: true
            }
          });
        }}
      />,
      'Available GRNs',
      undefined,
      'max-w-4xl'
    );
  };

  const executeDeletePurchase = async () => {
    if (!deleteTargetPurchase) return;
    try {
      setIsDeletingPurchase(true);
      await validateAndExecuteDeletePurchase(deleteTargetPurchase.id);
      toast.success('Procurement consignment record dropped and stock levels reversed safely!');
      setDeleteTargetPurchase(null);
      fetchProcurementLogs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete purchase');
    } finally {
      setIsDeletingPurchase(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return purchases.filter((p) => {
      const rawNo = p.purchase_no || '';
      const formattedNo = rawNo.toUpperCase().startsWith('PUR-') ? rawNo : `PUR-${rawNo}`;
      return (
        rawNo.toLowerCase().includes(term) ||
        formattedNo.toLowerCase().includes(term) ||
        (p.supplier_name || '').toLowerCase().includes(term) ||
        (p.target_warehouse || '').toLowerCase().includes(term)
      );
    });
  }, [purchases, searchTerm]);

  const totalEntries = filteredPurchases.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedPurchases = filteredPurchases.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handlePrevPurchase = () => {
    if (previewPurchaseIndex !== null && previewPurchaseIndex > 0) {
      setPreviewPurchaseIndex(previewPurchaseIndex - 1);
    }
  };

  const handleNextPurchase = () => {
    if (previewPurchaseIndex !== null && previewPurchaseIndex < filteredPurchases.length - 1) {
      setPreviewPurchaseIndex(previewPurchaseIndex + 1);
    }
  };

  const previewPurchase = previewPurchaseIndex !== null ? filteredPurchases[previewPurchaseIndex] : null;

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative text-black dark:text-bodydark text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white">
            {isRTL ? 'ہول سیل خریداری رجسٹر (Purchases)' : 'Wholesale Purchase Log Registry'}
          </h2>
          <p className="text-xs text-gray-400">
            {isRTL
              ? 'سپلائرز سے مال کی آمد، کنسائنمنٹس اور بیجز کا انتظام کریں'
              : 'Manage inward vendor supply consignments and trace batch arrivals'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unbilledGrns.length > 0 && (
            <button
              type="button"
              onClick={openAvailableGrnsModal}
              className="flex items-center justify-center rounded bg-emerald-600 py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition shadow-sm cursor-pointer"
            >
              📥 Available GRNs ({unbilledGrns.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/Purchase/Purchases/Add')}
            className="flex items-center justify-center rounded bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition shadow-sm cursor-pointer"
          >
            {isRTL ? '+ نیا مال درج کریں' : '+ Log New Supply'}
          </button>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{isRTL ? 'دکھائیں' : 'Show'}</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-stroke bg-transparent py-1 px-2 outline-none dark:border-strokedark text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-gray-500">{isRTL ? 'ریکارڈز' : 'entries'}</span>
          </div>

          <div className="w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRTL ? 'آرڈر نمبر یا وینڈر کے نام سے تلاش کریں...' : 'Search by order # or vendor name...'}
              className="w-full sm:w-64 rounded border border-stroke bg-transparent py-1.5 px-3 text-xs outline-none focus:border-primary dark:border-strokedark"
            />
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4 text-xs font-bold uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                <th className="py-4 px-4 font-semibold w-16 whitespace-nowrap">{isRTL ? 'نمبر شمار' : 'S#'}</th>
                <th className="py-4 px-4 font-semibold whitespace-nowrap">{isRTL ? 'پرچیز نمبر' : 'Purchase No'}</th>
                <th className="py-4 px-4 font-semibold whitespace-nowrap">{isRTL ? 'وینڈر پروفائل' : 'Vendor Profile'}</th>
                <th className="py-4 px-4 font-semibold text-center whitespace-nowrap">{isRTL ? 'اندراج تاریخ' : 'Entry Date'}</th>
                <th className="py-4 px-4 font-semibold text-center whitespace-nowrap">{isRTL ? 'ادائیگی کی شرط' : 'Payment Term'}</th>
                <th className="py-4 px-4 font-semibold text-right pr-4 whitespace-nowrap">{isRTL ? 'کل بل' : 'Total Bill'}</th>
                <th className="py-4 px-4 font-semibold text-right pr-6 whitespace-nowrap">{isRTL ? 'ادائیگی کی صورتحال' : 'Payment / Due Status'}</th>
                <th className="py-4 px-4 font-semibold w-24 text-center whitespace-nowrap">{isRTL ? 'کارروائی' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm">
                    <Spinner />
                  </td>
                </tr>
              ) : paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-sm text-gray-500 dark:text-gray-400 italic">
                    {isRTL ? 'ابھی تک خریداری کا کوئی لاگ درج نہیں ہوا۔' : 'No supply restock logs recorded yet.'}
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((pur, idx) => {
                  const serialNumber = startIndex + idx + 1;
                  const key = pur.purchase_no || String(pur.id);
                  const alloc = purchaseAllocationsMap[key] || purchaseAllocationsMap[String(pur.id)];

                  return (
                    <PurchaseTableRow
                      key={pur.id}
                      pur={pur}
                      serialNumber={serialNumber}
                      alloc={alloc}
                      tenantId={tenantId}
                      onPreview={() => {
                        const foundIdx = filteredPurchases.findIndex((x) => x.id === pur.id);
                        if (foundIdx !== -1) setPreviewPurchaseIndex(foundIdx);
                      }}
                      onDelete={(p) => setDeleteTargetPurchase(p)}
                    />
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

      {/* ── QUICK-VIEW PURCHASE PREVIEW MODAL WITH ARROW NAVIGATION ── */}
      {previewPurchase && previewPurchaseIndex !== null && (
        <PurchaseQuickViewModal
          previewPurchase={previewPurchase}
          previewPurchaseIndex={previewPurchaseIndex}
          totalFilteredCount={filteredPurchases.length}
          allocationsMap={purchaseAllocationsMap}
          tenantId={tenantId}
          onPrev={handlePrevPurchase}
          onNext={handleNextPurchase}
          onClose={() => setPreviewPurchaseIndex(null)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTargetPurchase}
        title="Delete Wholesale Purchase?"
        itemType="Purchase Bill"
        itemName={
          deleteTargetPurchase?.purchase_no
            ? `Bill #${deleteTargetPurchase.purchase_no}`
            : `Purchase #${deleteTargetPurchase?.id}`
        }
        subtitle="Consignment records and shelf stock allocations will be reversed."
        details={[
          { label: 'Vendor', value: deleteTargetPurchase?.supplier_name || 'N/A' },
          { label: 'Warehouse', value: deleteTargetPurchase?.target_warehouse || 'N/A' },
          { label: 'Total Amount', value: `Rs. ${Number(deleteTargetPurchase?.total_amount || 0).toLocaleString()}` }
        ]}
        warning="Deleting this purchase bill will reverse all inventory allocations and drop associated financial payment vouchers."
        confirmButtonText="Confirm & Reverse Stock"
        isDeleting={isDeletingPurchase}
        onConfirm={executeDeletePurchase}
        onCancel={() => setDeleteTargetPurchase(null)}
      />
    </div>
  );
};

export default PurchaseList;
