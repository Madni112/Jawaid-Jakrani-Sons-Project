import React from 'react';
import { MdClose, MdPrint, MdPrecisionManufacturing, MdScience, MdOutlineQrCode } from 'react-icons/md';
import { ProductionOrder } from '../../../../service/productionOrderService';
import { getBrandConfig } from '../../../../utils/brand';

interface JobCardPrintModalProps {
  order: ProductionOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobCardPrintModal: React.FC<JobCardPrintModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  if (!isOpen || !order) return null;

  const brand = getBrandConfig();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl border border-stroke shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="p-4 border-b border-stroke flex justify-between items-center bg-gray-50 print:hidden">
          <div className="flex items-center gap-2">
            <MdPrecisionManufacturing className="text-emerald-600 text-xl" />
            <span className="font-bold text-sm text-black">Shop Floor Job Card / Production Batch Slip</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <MdPrint />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-200 transition cursor-pointer"
            >
              <MdClose className="text-lg" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-black font-sans print:p-4 print:overflow-visible">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-black">
                {brand?.name || 'Jawaid Jakwani & Sons'}
              </h1>
              <p className="text-xs text-gray-600 uppercase font-mono tracking-widest mt-0.5">
                Chemical & Personal Care Manufacturing Division • Batch Production Slip
              </p>
            </div>
            <div className="text-right font-mono">
              <div className="text-lg font-black text-emerald-800">{order.order_number}</div>
              <div className="text-xs font-bold text-blue-700">Batch: {order.batch_number || 'N/A'}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">BOM: {order.bom_number}</div>
            </div>
          </div>

          {/* Job Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Finished Product</span>
              <span className="font-black text-black text-sm">{order.finished_product_name}</span>
              {order.finished_product_code && <span className="block text-[10px] text-gray-500 font-bold">{order.finished_product_code}</span>}
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Planned Target Batch</span>
              <span className="font-black text-blue-900 text-base">{order.target_quantity.toLocaleString()} {order.uom}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">MFG & EXP Dates</span>
              <span className="font-black text-black text-xs block">MFG: {order.mfg_date || 'N/A'}</span>
              <span className="font-black text-rose-700 text-xs block">EXP: {order.exp_date || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Job Status / Priority</span>
              <span className="font-black uppercase inline-block px-2 py-0.5 mt-0.5 bg-emerald-100 text-emerald-900 text-[10px] rounded border border-emerald-400 mr-1">
                {order.status}
              </span>
              <span className="font-black uppercase inline-block px-2 py-0.5 mt-0.5 bg-gray-200 text-black text-[10px] rounded border border-gray-400">
                {order.priority}
              </span>
            </div>
          </div>

          {/* Warehouse Logistics info */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono border border-gray-300 p-3 rounded-lg">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Source Raw Materials Location:</span>
              <span className="font-bold text-black">{order.source_warehouse}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-bold">Destination Finished Warehouse:</span>
              <span className="font-bold text-black">{order.destination_warehouse}</span>
            </div>
          </div>

          {/* Material Requisition Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-black font-mono flex items-center justify-between">
              <span>Required Raw Chemicals & Packaging Checklist</span>
              <span className="text-[10px] text-gray-500 font-normal">Check off when dispensed & added to vessel</span>
            </h4>
            <table className="w-full text-xs font-mono border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100 border-b border-black text-left font-black text-[11px]">
                  <th className="p-2 border border-black text-center w-10">S#</th>
                  <th className="p-2 border border-black w-24">Type</th>
                  <th className="p-2 border border-black">Raw Ingredient / Packaging Component</th>
                  <th className="p-2 border border-black text-right w-24">Required Qty</th>
                  <th className="p-2 border border-black text-center w-20">UOM</th>
                  <th className="p-2 border border-black text-right w-24">Unit Rate</th>
                  <th className="p-2 border border-black text-center w-16">Dispensed ✓</th>
                </tr>
              </thead>
              <tbody>
                {order.materials.map((mat, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="p-2 border border-black text-center font-bold text-gray-600">{idx + 1}</td>
                    <td className="p-2 border border-black font-bold text-[10px] uppercase">
                      {mat.item_type || (mat.uom === 'Liters' || mat.uom === 'Kg' ? 'Chemical' : 'Packaging')}
                    </td>
                    <td className="p-2 border border-black font-bold">
                      {mat.item_name}
                      {mat.item_code && <span className="block text-[10px] text-gray-500 font-normal">{mat.item_code}</span>}
                    </td>
                    <td className="p-2 border border-black text-right font-black">{mat.required_qty.toLocaleString()}</td>
                    <td className="p-2 border border-black text-center font-bold">{mat.uom}</td>
                    <td className="p-2 border border-black text-right">Rs. {Number(mat.unit_cost || 0).toLocaleString()}</td>
                    <td className="p-2 border border-black text-center">
                      <div className="w-4 h-4 border border-black mx-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* QC Inspection Parameters Grid */}
          <div className="border border-black p-3 rounded-lg space-y-2 font-mono text-xs bg-slate-50">
            <span className="text-black block text-[11px] uppercase font-black">
              Mandatory Quality Control (QC) Lab Sign-off Criteria
            </span>
            <div className="grid grid-cols-4 gap-3 text-center border-t border-gray-300 pt-2 text-[11px]">
              <div className="p-2 border border-gray-400 rounded bg-white">
                <span className="block text-[10px] text-gray-500">Target pH Range</span>
                <span className="font-black text-black">
                  {order.qc_checklist?.ph_target || (order.finished_product_name.toLowerCase().includes('phenyl') ? '9.0 - 10.5' : '5.5 - 6.5')}
                </span>
                <div className="mt-1 text-[10px] text-gray-400">[  ] Passed</div>
              </div>
              <div className="p-2 border border-gray-400 rounded bg-white">
                <span className="block text-[10px] text-gray-500">Viscosity (cPs)</span>
                <span className="font-black text-black">100 - 180 cPs</span>
                <div className="mt-1 text-[10px] text-gray-400">[  ] Passed</div>
              </div>
              <div className="p-2 border border-gray-400 rounded bg-white">
                <span className="block text-[10px] text-gray-500">Color & Fragrance</span>
                <span className="font-black text-black">Standard Match</span>
                <div className="mt-1 text-[10px] text-gray-400">[  ] Passed</div>
              </div>
              <div className="p-2 border border-gray-400 rounded bg-white">
                <span className="block text-[10px] text-gray-500">Cap Torque / Leak</span>
                <span className="font-black text-black">0% Leakage</span>
                <div className="mt-1 text-[10px] text-gray-400">[  ] Passed</div>
              </div>
            </div>
          </div>

          {/* Quality & Production Notes */}
          {order.notes && (
            <div className="border border-gray-300 p-3 rounded-lg text-xs font-mono">
              <span className="text-gray-500 block text-[10px] uppercase font-bold mb-1">Supervisor Special Instructions:</span>
              <p className="text-gray-800 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Shop Floor Verification Sign-off Box */}
          <div className="border-2 border-black p-4 mt-6 space-y-8 font-mono text-xs">
            <div className="text-center font-black text-xs uppercase tracking-widest text-gray-700">
              Quality Assurance & Warehouse Handover Sign-off Block
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="border-b border-black pb-1 mb-1 font-bold">
                  {order.supervisor || '_____________________'}
                </div>
                <span className="text-[10px] text-gray-500 uppercase">Plant / Shift Chemist</span>
              </div>
              <div>
                <div className="border-b border-black pb-1 mb-1 font-bold">_____________________</div>
                <span className="text-[10px] text-gray-500 uppercase">QC Lab Inspector (Sign & Stamp)</span>
              </div>
              <div>
                <div className="border-b border-black pb-1 mb-1 font-bold">_____________________</div>
                <span className="text-[10px] text-gray-500 uppercase">Warehouse Receiving In-Charge</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
