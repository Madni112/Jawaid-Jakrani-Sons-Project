import React from 'react';
import { useNavigate } from 'react-router-dom';
import TablePagination from '../../../components/TablePagination';
import { useAuth } from '../../../Context/Auth';

import { getInvoiceSaleTypeInfo } from './history/utils/salesHistoryHelpers';
import { useSalesHistoryState } from './history/hooks/useSalesHistoryState';
import { SalesHistoryHeader } from './history/components/SalesHistoryHeader';
import { SalesHistoryTable } from './history/components/SalesHistoryTable';
import { AllDeliveryChallansModal } from './history/modals/AllDeliveryChallansModal';
import { DeliveryChallanDetailModal } from './history/modals/DeliveryChallanDetailModal';
import { InvoiceDetailPreviewModal } from './history/modals/InvoiceDetailPreviewModal';

export { getInvoiceSaleTypeInfo };

const SalesHistory: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();

  const {
    sortConfig,
    loading,
    searchTerm,
    setSearchTerm,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    returnedInvoiceNos,
    deliveryChallansMap,
    invoiceBalances,
    selectedDcForModal,
    setSelectedDcForModal,
    dcListForModal,
    setDcListForModal,
    activeModalTab,
    setActiveModalTab,
    previewInvoiceIndex,
    setPreviewInvoiceIndex,
    isApprovingPayment,
    previewInvoice,
    filteredInvoices,
    paginatedInvoices,
    totalEntries,
    totalPages,
    startIndex,
    endIndex,
    handleSort,
    openDcModal,
    handleApproveFreightPayment,
    handleDeleteInvoice,
    handlePrevInvoice,
    handleNextInvoice,
  } = useSalesHistoryState();

  const handleEditInvoice = (inv: any) => {
    const invKey = String(inv.invoice_no || '').trim().toLowerCase();
    const dc = deliveryChallansMap && deliveryChallansMap[invKey] ? deliveryChallansMap[invKey][0] : null;
    const parsedItems = Array.isArray(inv.items)
      ? inv.items
      : typeof inv.items === 'string'
      ? JSON.parse(inv.items || '[]')
      : [];
    const enrichedInv = {
      ...inv,
      dispatch_warehouse: inv.dispatch_warehouse || dc?.dispatch_warehouse || '',
      items: parsedItems.map((it: any) => ({
        ...it,
        warehouse: it.warehouse || dc?.dispatch_warehouse || inv.dispatch_warehouse || '',
      })),
    };
    navigate(`/Sales/Invoice/edit/${inv.id}`, { state: { invoice: enrichedInv } });
  };

  const handlePrintInvoice = (invId: string | number) => {
    navigate(`${tenantId ? `/${tenantId}` : ''}/sales/invoice/print/${invId}`);
  };

  const handleReturnInvoice = (inv: any) => {
    navigate(`${tenantId ? `/${tenantId}` : ''}/Sales-Return/Debit-Notes/Add`, { state: { invoice: inv } });
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative text-slate-800 dark:text-slate-100 text-xs">
      {/* POPUP: ALL DELIVERY CHALLANS OF AN INVOICE */}
      {dcListForModal && (
        <AllDeliveryChallansModal
          dcListForModal={dcListForModal}
          onClose={() => setDcListForModal(null)}
          openDcModal={openDcModal}
        />
      )}

      {/* POPUP MODAL: REALTIME WAREHOUSE ACTIVITY & FREIGHT SETTLEMENT APPROVAL */}
      {selectedDcForModal && (
        <DeliveryChallanDetailModal
          selectedDcForModal={selectedDcForModal}
          onClose={() => setSelectedDcForModal(null)}
          onNavigatePrint={(dcId) => navigate(`/Delivery-Challan/Print/${dcId}`)}
          activeModalTab={activeModalTab}
          setActiveModalTab={setActiveModalTab}
          handleApproveFreightPayment={handleApproveFreightPayment}
          isApprovingPayment={isApprovingPayment}
        />
      )}

      {/* QUICK-VIEW INVOICE PREVIEW MODAL WITH ARROW NAVIGATION */}
      {previewInvoice && (
        <InvoiceDetailPreviewModal
          previewInvoice={previewInvoice}
          previewInvoiceIndex={previewInvoiceIndex}
          totalFilteredInvoices={filteredInvoices.length}
          invoiceBalances={invoiceBalances}
          handlePrevInvoice={handlePrevInvoice}
          handleNextInvoice={handleNextInvoice}
          onClose={() => setPreviewInvoiceIndex(null)}
          onEditInvoice={(inv) => {
            setPreviewInvoiceIndex(null);
            handleEditInvoice(inv);
          }}
          onPrintInvoice={(invId) => {
            setPreviewInvoiceIndex(null);
            handlePrintInvoice(invId);
          }}
        />
      )}

      {/* PAGE HEADER */}
      <SalesHistoryHeader onAddNew={() => navigate('/sales/invoice/add')} />

      {/* MAIN DATA CARD */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#111827] p-5 sm:p-6">
        {/* FILTERS & SEARCH BAR */}
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
              placeholder="Search invoices or customers..."
              className="w-full sm:w-72 rounded-xl border border-slate-200 py-2 px-3.5 bg-slate-50/50 dark:bg-slate-800/60 dark:border-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-800 dark:text-white transition"
            />
          </div>
        </div>

        {/* INVOICES TABLE */}
        <SalesHistoryTable
          loading={loading}
          paginatedInvoices={paginatedInvoices}
          filteredInvoices={filteredInvoices}
          sortConfig={sortConfig}
          handleSort={handleSort}
          returnedInvoiceNos={returnedInvoiceNos}
          deliveryChallansMap={deliveryChallansMap}
          invoiceBalances={invoiceBalances}
          onPreviewInvoice={(idx) => setPreviewInvoiceIndex(idx)}
          onOpenDcList={(dcs) => setDcListForModal(dcs)}
          onOpenDcDetail={openDcModal}
          onPrint={handlePrintInvoice}
          onReturn={handleReturnInvoice}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
        />

        {/* PAGINATION */}
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
    </div>
  );
};

export default SalesHistory;
