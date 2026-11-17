import React from 'react';
import {
  MdClose,
  MdSearch,
} from 'react-icons/md';

interface BatchItemsModalProps {
  selectedBatchForView: any;
  setSelectedBatchForView: (batch: any) => void;
  modalItemSearch: string;
  setModalItemSearch: (search: string) => void;
  modalPage: number;
  setModalPage: React.Dispatch<React.SetStateAction<number>>;
  modalPageSize: number;
  formatUploadDate: (isoString?: string) => string;
}

export const BatchItemsModal: React.FC<BatchItemsModalProps> = ({
  selectedBatchForView,
  setSelectedBatchForView,
  modalItemSearch,
  setModalItemSearch,
  modalPage,
  setModalPage,
  modalPageSize,
  formatUploadDate,
}) => {
  if (!selectedBatchForView) return null;

  const details = selectedBatchForView.details || {};
  const rawItems = Array.isArray(details.items) ? details.items : [];
  const isTileBatch = String(details.batch_type || '').toUpperCase() === 'TILES';

  const filteredModalItems = rawItems.filter((item: any) => {
    if (!modalItemSearch) return true;
    const q = modalItemSearch.toLowerCase();
    return (
      String(item.code || '').toLowerCase().includes(q) ||
      String(item.productName || item.product_name || '').toLowerCase().includes(q) ||
      String(item.brand || '').toLowerCase().includes(q) ||
      String(item.category || '').toLowerCase().includes(q)
    );
  });

  const totalModalPages = Math.ceil(filteredModalItems.length / modalPageSize);
  const currentModalData = filteredModalItems.slice(
    (modalPage - 1) * modalPageSize,
    modalPage * modalPageSize
  );

  return (
    <div className="fixed inset-0 z-99999 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-boxdark w-full max-w-5xl rounded-3xl shadow-2xl border border-stroke dark:border-strokedark flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-stroke dark:border-strokedark flex items-start justify-between gap-4 bg-slate-50 dark:bg-meta-4/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                {isTileBatch ? 'Tile Products Batch' : 'Other Products Batch'}
              </span>
              <h3 className="text-base font-black text-black dark:text-white">
                {details.file_name || 'Uploaded File Details'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Uploaded on <strong>{formatUploadDate(selectedBatchForView.created_at || details.uploaded_at)}</strong> by <strong>{selectedBatchForView.performed_by || 'User'}</strong>
            </p>
          </div>
          <button
            onClick={() => setSelectedBatchForView(null)}
            className="p-2 rounded-xl text-slate-500 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Stats & Search Bar */}
        <div className="p-4 border-b border-stroke dark:border-strokedark flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-meta-4 text-slate-700 dark:text-slate-200">
              Total: {rawItems.length} Products
            </span>
            {details.inserted_count !== undefined && (
              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                +{details.inserted_count} New
              </span>
            )}
            {details.updated_count !== undefined && details.updated_count > 0 && (
              <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {details.updated_count} Updated
              </span>
            )}
          </div>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={modalItemSearch}
              onChange={(e) => { setModalItemSearch(e.target.value); setModalPage(1); }}
              placeholder="Search by code, product name, brand..."
              className="w-full rounded-xl border border-stroke py-1.5 px-3 pl-8 bg-white dark:bg-boxdark text-xs font-semibold outline-none focus:border-emerald-500"
            />
            <MdSearch className="absolute left-2.5 top-2 text-slate-400 text-sm" />
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full table-auto border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-white border-b border-stroke">
                <th className="py-2.5 px-3 text-center">#</th>
                <th className="py-2.5 px-3">Code / SKU</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category Hierarchy</th>
                <th className="py-2.5 px-3">Brand</th>
                {isTileBatch && <th className="py-2.5 px-3">Print / Finish</th>}
                <th className="py-2.5 px-3 text-right">Purchase Price</th>
                <th className="py-2.5 px-3 text-right">Retail Price</th>
                <th className="py-2.5 px-3 text-center">UOM</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredModalItems.length === 0 ? (
                <tr>
                  <td colSpan={isTileBatch ? 10 : 9} className="py-8 text-center text-slate-400 italic font-semibold">
                    No products match your search.
                  </td>
                </tr>
              ) : (
                currentModalData.map((item: any, idx: number) => {
                  const rowNum = (modalPage - 1) * modalPageSize + idx + 1;
                  const statusText = item.status || 'Inserted';
                  const isNew = statusText.toLowerCase().includes('insert') || statusText.toLowerCase().includes('new');

                  return (
                    <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/20 font-semibold">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{rowNum}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{item.code || '—'}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{item.productName || item.product_name}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                        {[item.parentCat, item.subCategory, item.category].filter(Boolean).join(' › ') || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200">{item.brand || '—'}</td>
                      {isTileBatch && <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{item.print || '—'}</td>}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        Rs. {Number(item.purchasePrice || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {Number(item.retailPrice || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-meta-4 text-[10px] font-bold">
                          {item.uom || 'PCS'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isNew
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stroke dark:border-strokedark flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-meta-4/20 text-xs">
          <span className="text-slate-500 font-semibold">
            Showing {filteredModalItems.length > 0 ? (modalPage - 1) * modalPageSize + 1 : 0} to {Math.min(modalPage * modalPageSize, filteredModalItems.length)} of {filteredModalItems.length} products
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalPage(p => Math.max(1, p - 1))}
              disabled={modalPage === 1}
              className="px-3 py-1 rounded-lg border border-stroke dark:border-strokedark disabled:opacity-40 font-bold cursor-pointer"
            >
              Previous
            </button>
            <span className="font-bold text-emerald-600">
              Page {modalPage} of {totalModalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => setModalPage(p => Math.min(totalModalPages, p + 1))}
              disabled={modalPage === totalModalPages || totalModalPages === 0}
              className="px-3 py-1 rounded-lg border border-stroke dark:border-strokedark disabled:opacity-40 font-bold cursor-pointer"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setSelectedBatchForView(null)}
              className="ml-3 px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
