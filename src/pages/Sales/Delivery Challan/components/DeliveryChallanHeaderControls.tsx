import React from 'react';
import { FiTruck, FiClock } from 'react-icons/fi';
import { MdHistory, MdAssignmentReturn } from 'react-icons/md';

interface DeliveryChallanHeaderControlsProps {
  activeTab: 'SALES' | 'PURCHASE_RETURNS';
  setActiveTab: (tab: 'SALES' | 'PURCHASE_RETURNS') => void;
  viewScope: 'PENDING' | 'ALL';
  setViewScope: (scope: 'PENDING' | 'ALL') => void;
  displayedGroupedInvoicesCount: number;
  pendingGroupedInvoicesCount: number;
  allGroupedInvoicesCount: number;
  purchaseReturnsCount: number;
  pendingPurchaseReturnsCount: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenProcessedHistoryModal: () => void;
}

export const DeliveryChallanHeaderControls: React.FC<DeliveryChallanHeaderControlsProps> = ({
  activeTab,
  setActiveTab,
  viewScope,
  setViewScope,
  displayedGroupedInvoicesCount,
  pendingGroupedInvoicesCount,
  allGroupedInvoicesCount,
  purchaseReturnsCount,
  pendingPurchaseReturnsCount,
  pageSize,
  setPageSize,
  searchTerm,
  setSearchTerm,
  onOpenProcessedHistoryModal
}) => {
  return (
    <>
      {/* Top Header Controls row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex-1">
          <h4 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <FiTruck size={24} className="text-primary" />
            Delivery Challan / Gate Pass Registry
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Authorize, dispatch, and track warehouse goods gate-pass fulfillment
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenProcessedHistoryModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-meta-4 dark:hover:bg-meta-4/80 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 transition w-full sm:w-auto cursor-pointer shadow-xs"
          >
            <MdHistory size={18} />
            {activeTab === 'PURCHASE_RETURNS' ? 'Return History' : 'Processed History'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stroke dark:border-strokedark mb-5">
        <button
          type="button"
          onClick={() => setActiveTab('SALES')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'SALES'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <FiTruck size={16} />
          Customer Deliveries (Sales DC)
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'SALES' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-meta-4 text-slate-500'
          }`}>
            {displayedGroupedInvoicesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PURCHASE_RETURNS')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'PURCHASE_RETURNS'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <MdAssignmentReturn size={16} />
          Purchase Returns (Supplier Outward)
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            pendingPurchaseReturnsCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 dark:bg-meta-4 text-slate-500'
          }`}>
            {pendingPurchaseReturnsCount}
          </span>
        </button>
      </div>

      {/* Datatable Filters Wrapper */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-stroke py-1 px-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-sm font-medium text-black dark:text-white cursor-pointer"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size} className="dark:bg-boxdark">{size}</option>
              ))}
            </select>
            <span>{activeTab === 'PURCHASE_RETURNS' ? 'returns' : 'invoices'}</span>
          </div>

          {activeTab === 'SALES' ? (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-meta-4 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewScope('PENDING')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewScope === 'PENDING'
                    ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                    : 'text-slate-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <FiClock size={12} className="text-amber-500" />
                <span>Pending Dispatch ({pendingGroupedInvoicesCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewScope('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewScope === 'ALL'
                    ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                    : 'text-slate-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>All Orders ({allGroupedInvoicesCount})</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-meta-4 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewScope('PENDING')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewScope === 'PENDING'
                    ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                    : 'text-slate-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <FiClock size={12} className="text-amber-500" />
                <span>Pending Outward ({pendingPurchaseReturnsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewScope('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewScope === 'ALL'
                    ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                    : 'text-slate-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>All Returns ({purchaseReturnsCount})</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm w-full sm:w-auto text-gray-500 dark:text-gray-400">
          <span>Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'PURCHASE_RETURNS' ? 'Search vendor, return #, item...' : 'Search invoice, customer, challan...'}
            className="w-full sm:w-64 rounded border border-stroke py-1.5 px-3 bg-transparent dark:border-strokedark outline-none focus:border-primary text-sm text-black dark:text-white"
          />
        </div>
      </div>
    </>
  );
};
