import React from 'react';
import { FiTruck, FiX, FiActivity, FiDollarSign, FiCheckCircle, FiClock, FiShield } from 'react-icons/fi';
import Spinner from '../../../../../ui/Spinner';

interface DeliveryChallanDetailModalProps {
  selectedDcForModal: any;
  onClose: () => void;
  onNavigatePrint: (dcId: number | string) => void;
  activeModalTab: 'tracking' | 'payment';
  setActiveModalTab: (tab: 'tracking' | 'payment') => void;
  handleApproveFreightPayment: (dcId: number) => Promise<void>;
  isApprovingPayment: boolean;
}

export const DeliveryChallanDetailModal: React.FC<DeliveryChallanDetailModalProps> = ({
  selectedDcForModal,
  onClose,
  onNavigatePrint,
  activeModalTab,
  setActiveModalTab,
  handleApproveFreightPayment,
  isApprovingPayment,
}) => {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-boxdark w-full max-w-2xl rounded-2xl shadow-2xl border border-stroke dark:border-strokedark overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center bg-slate-900 text-white p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-xl font-bold">
              <FiTruck />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono">
                  {selectedDcForModal.challan_no || `DC-${selectedDcForModal.id}`}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    selectedDcForModal.status === 'Dispatched' || selectedDcForModal.status === 'Fully Dispatched'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : selectedDcForModal.status === 'Partially Dispatched'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedDcForModal.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Warehouse: {selectedDcForModal.dispatch_warehouse || 'Main Warehouse'} • Customer:{' '}
                {selectedDcForModal.customer_name || 'Walk-in'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20 px-6 pt-3 gap-6 font-bold text-xs">
          <button
            onClick={() => setActiveModalTab('tracking')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
              activeModalTab === 'tracking'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiActivity /> Live Dispatch Progress
          </button>
          <button
            onClick={() => setActiveModalTab('payment')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition ${
              activeModalTab === 'payment'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiDollarSign /> Freight Charges & Approval
            {Number(selectedDcForModal.freight_charges || 0) > 0 &&
              selectedDcForModal.freight_payment_status !== 'Approved' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-1" />
              )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh] text-xs">
          {/* TAB 1: LIVE DISPATCH PROGRESS */}
          {activeModalTab === 'tracking' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-stroke dark:border-strokedark">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Total Items</span>
                  <strong className="text-sm text-black dark:text-white">
                    {Number(selectedDcForModal.total_quantity || 0).toLocaleString()}
                  </strong>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 block">Dispatched Out</span>
                  <strong className="text-sm text-emerald-700 dark:text-emerald-400">
                    {(selectedDcForModal.items || [])
                      .reduce((sum: number, it: any) => sum + Number(it.dispatchedQty || 0), 0)
                      .toLocaleString()}
                  </strong>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900">
                  <span className="text-[10px] font-bold uppercase text-amber-600 block">Remaining Items</span>
                  <strong className="text-sm text-amber-700 dark:text-amber-400">
                    {Math.max(
                      0,
                      Number(selectedDcForModal.total_quantity || 0) -
                        (selectedDcForModal.items || []).reduce(
                          (sum: number, it: any) => sum + Number(it.dispatchedQty || 0),
                          0
                        )
                    ).toLocaleString()}
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-stroke dark:border-strokedark">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Driver / Fleet</span>
                  <strong className="text-sm text-black dark:text-white truncate block">
                    {selectedDcForModal.driver_name || 'Assigned Driver'}
                  </strong>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-stroke dark:border-strokedark rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-gray-500 border-b border-stroke dark:border-strokedark">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5 text-center">Billed</th>
                      <th className="p-2.5 text-center">Dispatched</th>
                      <th className="p-2.5 text-center">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    {(selectedDcForModal.items || []).map((item: any, idx: number) => {
                      const totalQ = Number(item.qty || item.quantity || 0);
                      const dispQ = Number(item.dispatchedQty || 0);
                      const remQ = Math.max(0, totalQ - dispQ);
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-bold">{item.itemName || item.product_name}</td>
                          <td className="p-2.5 text-center font-mono">{totalQ}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-600">{dispQ}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-amber-600">{remQ}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedDcForModal.remarks && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-stroke dark:border-strokedark">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Warehouse Gate Remarks:</span>
                  <p className="text-black dark:text-white font-medium mt-0.5">{selectedDcForModal.remarks}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onNavigatePrint(selectedDcForModal.id)}
                  disabled={selectedDcForModal.status === 'Pending Approval'}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
                >
                  🖨️ Open Gate Pass Document
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FREIGHT CHARGES & PAYMENT APPROVAL */}
          {activeModalTab === 'payment' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-stroke dark:border-strokedark">
                  <span className="text-gray-500 font-bold uppercase text-[11px]">Transportation Service / Carrier:</span>
                  <strong className="text-black dark:text-white text-sm">
                    {selectedDcForModal.transport_name || selectedDcForModal.transportation || "Customer's Own Transport"}
                  </strong>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-stroke dark:border-strokedark">
                  <span className="text-gray-500 font-bold uppercase text-[11px]">Freight Charges Claimed:</span>
                  <strong className="text-emerald-600 font-mono text-base font-black">
                    Rs.{' '}
                    {Number(selectedDcForModal.freight_charges || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold uppercase text-[11px]">Payment Authorization Status:</span>
                  {selectedDcForModal.freight_payment_status === 'Approved' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-xs">
                      <FiCheckCircle /> Authorized & Paid
                    </span>
                  ) : Number(selectedDcForModal.freight_charges || 0) === 0 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                      No Charges (Direct Handover)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black text-xs animate-pulse">
                      <FiClock /> Verification Pending
                    </span>
                  )}
                </div>
              </div>

              {Number(selectedDcForModal.freight_charges || 0) > 0 &&
                selectedDcForModal.freight_payment_status !== 'Approved' && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3">
                    <FiShield className="text-amber-600 text-lg shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-amber-900 dark:text-amber-200">Payment Authorization Required</h5>
                      <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px] mt-1">
                        The warehouse has entered{' '}
                        <strong>Rs. {Number(selectedDcForModal.freight_charges || 0).toLocaleString()}</strong> as the
                        freight charge for this shipment. As Admin / Billing Officer, click below to confirm and
                        authorize this payment.
                      </p>
                      <button
                        type="button"
                        disabled={isApprovingPayment}
                        onClick={() => handleApproveFreightPayment(selectedDcForModal.id)}
                        className="mt-3 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        {isApprovingPayment ? (
                          <Spinner />
                        ) : (
                          <>
                            <FiCheckCircle /> Authorize & Approve Freight Payment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-stroke dark:border-strokedark">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
