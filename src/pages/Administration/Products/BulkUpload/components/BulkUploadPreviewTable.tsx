import React from 'react';
import { MdClose } from 'react-icons/md';
import { MasterBadge } from './MasterBadge';
import { ProcessedRow } from '../types/bulkUploadTypes';

interface BulkUploadPreviewTableProps {
  activeTab: 'OTHER' | 'TILES';
  filteredRows: ProcessedRow[];
  paginatedRows: ProcessedRow[];
  processedRows: ProcessedRow[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  selectAllFiltered: () => void;
  deselectAllFiltered: () => void;
  toggleRowSelect: (id: string) => void;
  removeRow: (id: string) => void;
  masterLookup: {
    isBrandExists: (brand: string) => boolean;
    isParentExists: (parent: string) => boolean;
    isSubExists: (parent: string, sub: string) => boolean;
    isCatExists: (parent: string, sub: string, cat: string) => boolean;
    isPrintExists: (print: string) => boolean;
  };
}

export const BulkUploadPreviewTable: React.FC<BulkUploadPreviewTableProps> = ({
  activeTab,
  filteredRows,
  paginatedRows,
  processedRows,
  currentPage,
  totalPages,
  setCurrentPage,
  selectAllFiltered,
  deselectAllFiltered,
  toggleRowSelect,
  removeRow,
  masterLookup,
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-meta-4/40 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-stroke dark:border-strokedark">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={filteredRows.length > 0 && filteredRows.every(r => r.selected)}
                  onChange={(e) => (e.target.checked ? selectAllFiltered() : deselectAllFiltered())}
                  className="cursor-pointer"
                />
              </th>
              <th className="p-3 w-14">Row #</th>
              <th className="p-3">Status & Reason</th>
              <th className="p-3">Code / SKU</th>
              <th className="p-3">Description / Name</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Parent / Sub / Category</th>
              {activeTab === 'TILES' && (
                <>
                  <th className="p-3">Finish / Print</th>
                  <th className="p-3">Tile Size & Area</th>
                  <th className="p-3">Box Coverage</th>
                  <th className="p-3">Rate / sq.m</th>
                </>
              )}
              <th className="p-3">Purchase Price</th>
              <th className="p-3">Sale Price</th>
              <th className="p-3 w-14">UOM</th>
              <th className="p-3 w-14">Min</th>
              <th className="p-3 w-12 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={activeTab === 'TILES' ? 15 : 11} className="p-10 text-center text-slate-400">
                  No rows found matching current filters.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const isReady = r.status === 'ready';
                const isFileDup = r.status === 'duplicate_in_file';
                const isDbDup = r.status === 'duplicate_in_db';
                const isInvalid = r.status === 'invalid';

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-meta-4/20 transition duration-75 ${
                      !r.selected ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={r.selected}
                        disabled={isInvalid}
                        onChange={() => toggleRowSelect(r.id)}
                        className="cursor-pointer"
                      />
                    </td>

                    {/* Row # */}
                    <td className="p-3 font-mono font-bold text-slate-500">#{r.rowIndex}</td>

                    {/* Status Badge & Reason */}
                    <td className="p-3 min-w-[200px]">
                      {isReady && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            🟢 Ready to Add
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{r.statusReason}</p>
                        </div>
                      )}

                      {isFileDup && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            🟡 Duplicate in File
                          </span>
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            {r.statusReason}
                          </p>
                        </div>
                      )}

                      {isDbDup && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            🔵 In Database (ID #{r.matchedDbProduct?.id})
                          </span>
                          <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                            {r.statusReason}
                          </p>
                        </div>
                      )}

                      {isInvalid && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            ⛔ Rejected / Invalid
                          </span>
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                            {r.statusReason}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Code */}
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {r.code || <span className="text-slate-400 italic font-normal">Auto</span>}
                    </td>

                    {/* Product Name */}
                    <td className="p-3 font-bold text-slate-900 dark:text-white min-w-[180px]">
                      {r.productName}
                    </td>

                    {/* Brand */}
                    <td className="p-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                      {r.brand ? (
                        <div className="flex items-center gap-1.5">
                          <span>{r.brand}</span>
                          <MasterBadge exists={masterLookup.isBrandExists(r.brand)} />
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Category hierarchy */}
                    <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300 min-w-[230px]">
                      <div className="space-y-1">
                        {/* Parent Category */}
                        <div className="flex items-center flex-wrap gap-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {r.parentCat || <span className="text-slate-400 italic font-normal text-[10px]">No Parent</span>}
                          </span>
                          {r.parentCat && (
                            <MasterBadge exists={masterLookup.isParentExists(r.parentCat)} />
                          )}
                        </div>

                        {/* Sub Category */}
                        {r.subCategory && (
                          <div className="flex items-center flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                            <span>›</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{r.subCategory}</span>
                            <MasterBadge exists={masterLookup.isSubExists(r.parentCat, r.subCategory)} />
                          </div>
                        )}

                        {/* Category / Size */}
                        {r.category && (
                          <div className="flex items-center flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                            <span>›</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{r.category}</span>
                            <MasterBadge exists={masterLookup.isCatExists(r.parentCat, r.subCategory, r.category)} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Tile Columns */}
                    {activeTab === 'TILES' && (
                      <>
                        {/* Print / Finish */}
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {r.print ? (
                            <div className="flex items-center gap-1.5">
                              <span>{r.print}</span>
                              <MasterBadge exists={masterLookup.isPrintExists(r.print)} />
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Tile Size & Area Per Piece */}
                        <td className="p-3 whitespace-nowrap">
                          {r.tileWidth && r.tileHeight ? (
                            <div>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {r.tileWidth} × {r.tileHeight} cm
                              </span>
                              <span className="block text-[10px] text-teal-700 dark:text-teal-400 font-mono font-semibold">
                                {r.sqMPerPiece ? `${r.sqMPerPiece.toFixed(4)} sq.m/pc` : '-'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Box Coverage */}
                        <td className="p-3 whitespace-nowrap">
                          {r.sqMPerBox ? (
                            <div className="bg-teal-50 dark:bg-teal-950/40 px-2 py-1 rounded-lg border border-teal-200 dark:border-teal-800/60 inline-block">
                              <strong className="text-teal-800 dark:text-teal-300 font-mono font-black text-xs block">
                                {r.sqMPerBox.toFixed(4)} sq.m
                              </strong>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                                {r.piecesPerBox} pcs / box
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Rates per sq.m */}
                        <td className="p-3 whitespace-nowrap text-[11px] font-mono">
                          {r.salePerSqM ? (
                            <div>
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold block">
                                Sale: Rs. {r.salePerSqM.toFixed(2)}/sq.m
                              </span>
                              {r.purchasePerSqM ? (
                                <span className="text-slate-500 block text-[10px]">
                                  Buy: Rs. {r.purchasePerSqM.toFixed(2)}/sq.m
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Purchase Price */}
                    <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      Rs. {r.purchasePrice.toLocaleString()}
                    </td>

                    {/* Sale Price */}
                    <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      Rs. {r.retailPrice.toLocaleString()}
                    </td>

                    {/* UOM */}
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300 uppercase whitespace-nowrap">
                      {r.uom}
                    </td>

                    {/* Min */}
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                      {r.minimumStock || '-'}
                    </td>

                    {/* Action */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(r.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Remove Row"
                      >
                        <MdClose className="text-sm" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-stroke dark:border-strokedark text-xs text-slate-500 gap-3">
        <span>
          Showing {paginatedRows.length} of {filteredRows.length} filtered items (Current tab: {processedRows.length})
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-2.5 py-1 rounded border border-stroke dark:border-strokedark disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-meta-4 transition"
          >
            Prev
          </button>
          <span className="font-bold text-black dark:text-white px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 rounded border border-stroke dark:border-strokedark disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-meta-4 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
