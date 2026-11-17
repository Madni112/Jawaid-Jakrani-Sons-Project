import React, { useState } from 'react';
import { FiCheckCircle, FiTruck, FiX, FiCalendar } from 'react-icons/fi';
import Spinner from '../../../../../ui/Spinner';
import { DeliveryChallan, ChallanItem, TransportOption } from '../types/shopDispatchTypes';
import { getPakistanDate } from '../utils/shopDispatchHelpers';
import { addNewTransporter } from '../services/shopDispatchService';
import { toast } from 'react-hot-toast';

interface DispatchApprovalModalProps {
  challan: DeliveryChallan;
  transportList: TransportOption[];
  onClose: () => void;
  onSubmit: (params: {
    challan: DeliveryChallan;
    items: ChallanItem[];
    transportName: string;
    freightCharges: number | string;
    vehicleNo: string;
    driverName: string;
    remarks: string;
  }) => Promise<void>;
  onTransporterAdded: () => void;
}

export const DispatchApprovalModal: React.FC<DispatchApprovalModalProps> = ({
  challan,
  transportList,
  onClose,
  onSubmit,
  onTransporterAdded
}) => {
  const [approvalItems, setApprovalItems] = useState<ChallanItem[]>(() => {
    return (challan.items || []).map((item) => {
      const orderQty = Number(item.orderQty ?? item.qty ?? 0);
      const prevDispatched = Number(item.dispatchedQty ?? 0);
      const availableToDispatch = orderQty - prevDispatched;
      const initialSend = availableToDispatch > 0 ? availableToDispatch : orderQty;

      return {
        ...item,
        orderQty,
        dispatchedQty: initialSend,
        holdQty: Math.max(0, orderQty - initialSend),
        rate: Number(item.rate || 0)
      };
    });
  });

  const [approvalTransportName, setApprovalTransportName] = useState(
    challan.transport_name || challan.transportation || "Customer's Own Transport"
  );
  const [approvalTransportSearch, setApprovalTransportSearch] = useState('');
  const [isTransportDropdownOpen, setIsTransportDropdownOpen] = useState(false);
  const [approvalFreightCharges, setApprovalFreightCharges] = useState<number | string>(
    challan.freight_charges !== undefined && challan.freight_charges !== null ? Number(challan.freight_charges) : 0
  );
  const [approvalVehicle, setApprovalVehicle] = useState(
    challan.vehicle_no && challan.vehicle_no !== 'Pending Dispatch' ? challan.vehicle_no : ''
  );
  const [approvalDriver, setApprovalDriver] = useState(
    challan.driver_name && challan.driver_name !== 'Pending Dispatch' ? challan.driver_name : ''
  );
  const [approvalRemarks, setApprovalRemarks] = useState(challan.gate_remarks || '');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isManualDriver, setIsManualDriver] = useState(false);

  const handleItemDispatchedChange = (index: number, rawVal: string) => {
    setApprovalItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const orderQty = Number(item.orderQty || 0);

      if (rawVal === '') {
        updated[index] = {
          ...item,
          dispatchedQty: '',
          holdQty: orderQty
        };
        return updated;
      }

      const numVal = parseFloat(rawVal);
      if (isNaN(numVal) || numVal < 0) {
        updated[index] = {
          ...item,
          dispatchedQty: 0,
          holdQty: orderQty
        };
        return updated;
      }

      const cappedSend = Math.min(numVal, orderQty > 0 ? orderQty : numVal);
      const hold = Math.max(0, orderQty - cappedSend);

      updated[index] = {
        ...item,
        dispatchedQty: cappedSend,
        holdQty: hold
      };
      return updated;
    });
  };

  const handleBlurDispatched = (index: number) => {
    setApprovalItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const orderQty = Number(item.orderQty || 0);
      if (item.dispatchedQty === '' || item.dispatchedQty === undefined || isNaN(Number(item.dispatchedQty))) {
        updated[index] = {
          ...item,
          dispatchedQty: 0,
          holdQty: orderQty
        };
      }
      return updated;
    });
  };

  const setAllItemsToSend = () => {
    setApprovalItems((prev) =>
      prev.map((item) => ({
        ...item,
        dispatchedQty: Number(item.orderQty || 0),
        holdQty: 0
      }))
    );
  };

  const setAllItemsToHold = () => {
    setApprovalItems((prev) =>
      prev.map((item) => ({
        ...item,
        dispatchedQty: 0,
        holdQty: Number(item.orderQty || 0)
      }))
    );
  };

  const handleSubmit = async () => {
    setIsSubmittingApproval(true);
    try {
      await onSubmit({
        challan,
        items: approvalItems,
        transportName: approvalTransportName,
        freightCharges: approvalFreightCharges,
        vehicleNo: approvalVehicle,
        driverName: approvalDriver,
        remarks: approvalRemarks
      });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-modal-backdrop" onClick={onClose} />
      <div 
        className="relative bg-white dark:bg-boxdark w-full max-w-3xl rounded-2xl shadow-2xl border border-stroke dark:border-strokedark overflow-hidden animate-modal-pop z-10"
        style={{ transformOrigin: 'center center' }}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center bg-slate-900 text-white p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              <FiTruck />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Warehouse Dispatch Approval
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500 text-white font-black">
                  {challan.challan_no || `DC-${challan.id}`}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Customer: <span className="text-white font-bold">{challan.customer_name}</span> • Location:{' '}
                <span className="text-emerald-400 font-bold">{challan.dispatch_warehouse}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            <FiX />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-xs">
          {/* Instructions Banner */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 flex items-start gap-3">
            <FiCheckCircle className="text-emerald-600 dark:text-emerald-400 text-base shrink-0 mt-0.5" />
            <div className="text-slate-700 dark:text-slate-300">
              <p className="font-bold text-emerald-800 dark:text-emerald-300">Warehouse Verification Mode</p>
              <p className="text-[11px] mt-0.5">
                Enter how many units are being loaded onto the truck right now in{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">Sending Now</strong>. Any difference will
                automatically be marked <strong className="text-amber-700 dark:text-amber-400">On Hold</strong> for later
                dispatch.
              </p>
            </div>
          </div>

          {/* Locked Dispatch Date Banner (Pakistan Standard Time) */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-meta-4/20 p-3 rounded-xl border border-stroke dark:border-strokedark">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-primary text-base" />
              <span className="font-bold text-black dark:text-white">Dispatch Date (PK Time):</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg px-3 py-1 font-mono font-bold text-xs text-slate-700 dark:text-slate-300 shadow-xs">
              <span>🔒 {getPakistanDate()}</span>
            </div>
          </div>

          {/* Items Verification Table */}
          <div className="border border-stroke dark:border-strokedark rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 flex justify-between items-center border-b border-stroke dark:border-strokedark">
              <span className="font-bold text-[11px] uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Items Fulfillment List
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={setAllItemsToSend}
                  className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] hover:opacity-80 transition"
                >
                  ✓ Send All Items (100%)
                </button>
                <button
                  type="button"
                  onClick={setAllItemsToHold}
                  className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] hover:opacity-80 transition"
                >
                  ⏸ Hold All (0 Sent)
                </button>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                  <th className="p-3 w-8 text-center">S#</th>
                  <th className="p-3 w-32">Code</th>
                  <th className="p-3">Product Description</th>
                  <th className="p-3 w-24 text-center">Ordered Qty</th>
                  <th className="p-3 w-32 text-center bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    Sending Now
                  </th>
                  <th className="p-3 w-28 text-center bg-amber-100/60 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    Holding (Rest)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark font-medium">
                {approvalItems.map((item, idx) => {
                  const orderQty = Number(item.orderQty || 0);
                  const sendQty = item.dispatchedQty;
                  const holdQty = Number(item.holdQty || 0);

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-center text-gray-400 font-sans">{idx + 1}</td>
                      <td className="p-3 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {item.skuCode}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-black dark:text-white">{item.pDescription}</p>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-sm">
                        {orderQty}
                      </td>
                      <td className="p-3 text-center bg-emerald-50/40 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max={orderQty}
                            value={sendQty === undefined ? '' : sendQty}
                            onChange={(e) => handleItemDispatchedChange(idx, e.target.value)}
                            onBlur={() => handleBlurDispatched(idx)}
                            placeholder="0"
                            className="w-20 text-center font-black font-mono text-sm text-emerald-600 dark:text-emerald-400 bg-white dark:bg-boxdark border-2 border-emerald-400 rounded-lg p-1.5 shadow-sm outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center bg-amber-50/40 dark:bg-amber-950/20 font-mono">
                        {holdQty > 0 ? (
                          <span className="inline-flex px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700">
                            {holdQty} Hold
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">0 (All Sent)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Manual Driver Pill Toggle */}
          <div className="flex justify-end mb-2">
            <div
              onClick={() => setIsManualDriver(!isManualDriver)}
              className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center justify-center border w-fit ${
                isManualDriver
                  ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800'
                  : 'bg-white text-slate-500 border-stroke dark:bg-boxdark dark:text-slate-400 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
              }`}
            >
              Add Custom Driver Details
            </div>
          </div>

          {/* Transit Logistics & Freight Settlement Info */}
          {!isManualDriver && (
            <div className="grid grid-cols-1 gap-4 bg-slate-50 dark:bg-meta-4/10 p-3.5 rounded-xl border border-stroke dark:border-strokedark mb-4">
              {/* Searchable Transportation Carrier Dropdown */}
              <div className="relative">
                <label className="block font-bold text-black dark:text-white mb-1">
                  Logistics / Transportation Service:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={isTransportDropdownOpen ? approvalTransportSearch : approvalTransportName}
                    onFocus={() => {
                      setIsTransportDropdownOpen(true);
                      setApprovalTransportSearch('');
                    }}
                    onChange={(e) => {
                      setApprovalTransportSearch(e.target.value);
                      setApprovalTransportName(e.target.value);
                    }}
                    placeholder="Search Carrier (e.g. TCS, Leopards, Customer Truck)..."
                    className="w-full p-2.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-bold text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                  {isTransportDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-stroke dark:divide-strokedark">
                      {['No Transport (Handover)', "Customer's Own Transport", ...transportList.map((t) => t.name)]
                        .filter((name, i, arr) => arr.indexOf(name) === i)
                        .filter((name) => name.toLowerCase().includes(approvalTransportSearch.toLowerCase()))
                        .map((name, tIdx) => {
                          const match = transportList.find((t) => t.name === name);
                          return (
                            <div
                              key={tIdx}
                              onMouseDown={() => {
                                setApprovalTransportName(name);
                                if (match) {
                                  if (match.vehicle_number) setApprovalVehicle(match.vehicle_number);
                                  if (match.driver_name) setApprovalDriver(match.driver_name);
                                  if (match.base_charges) setApprovalFreightCharges(Number(match.base_charges));
                                } else {
                                  setApprovalFreightCharges(0);
                                }
                                setIsTransportDropdownOpen(false);
                              }}
                              className="p-2 hover:bg-emerald-50 dark:hover:bg-meta-4/20 cursor-pointer flex justify-between items-center text-xs"
                            >
                              <span className="font-bold text-black dark:text-white">{name}</span>
                              {match && match.base_charges ? (
                                <span className="font-mono text-[10px] text-emerald-600 font-black">
                                  Base: Rs. {Number(match.base_charges).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400">Direct Handover</span>
                              )}
                            </div>
                          );
                        })}
                      {approvalTransportSearch.trim() !== '' &&
                        !["No Transport (Handover)", "Customer's Own Transport", ...transportList.map((t) => t.name)].some(
                          (name) => name.toLowerCase() === approvalTransportSearch.trim().toLowerCase()
                        ) && (
                          <div
                            onMouseDown={async () => {
                              const newCarrier = approvalTransportSearch.trim();
                              setApprovalTransportName(newCarrier);
                              setIsTransportDropdownOpen(false);
                              setApprovalFreightCharges(0);

                              try {
                                await addNewTransporter(newCarrier);
                                toast.success(`"${newCarrier}" added to Transport Directory!`);
                                onTransporterAdded();
                              } catch (err: any) {
                                toast.error('Could not save transporter: ' + err.message);
                              }
                            }}
                            className="p-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 cursor-pointer flex justify-between items-center text-xs font-bold border-t border-emerald-100 dark:border-emerald-800/50"
                          >
                            <span>+ Add "{approvalTransportSearch.trim()}" as New Transporter</span>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Transit & Vehicle Information */}
          {isManualDriver && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Vehicle No / Truck Plate #</label>
                <input
                  type="text"
                  value={approvalVehicle}
                  onChange={(e) => setApprovalVehicle(e.target.value)}
                  placeholder="e.g. LES-1122 or By Hand"
                  className="w-full p-2.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-bold text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-black dark:text-white mb-1">Driver Name / Carrier Contact</label>
                <input
                  type="text"
                  value={approvalDriver}
                  onChange={(e) => setApprovalDriver(e.target.value)}
                  placeholder="e.g. Muhammad Ali / 0300-1234567"
                  className="w-full p-2.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-bold text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-black dark:text-white mb-1">Remarks</label>
            <input
              type="text"
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
              placeholder="e.g. 5 boxes loaded on truck, 5 boxes to follow tomorrow."
              className="w-full p-2.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-medium text-xs"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-stroke dark:border-strokedark">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-stroke font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmittingApproval}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            {isSubmittingApproval ? <Spinner /> : <><FiCheckCircle /> Confirm & Approve Dispatch</>}
          </button>
        </div>
      </div>
    </div>
  );
};
