import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdStore } from 'react-icons/md';
import { UnbilledGRN } from '../types/purchaseListTypes';

interface AvailableGrnsModalContentProps {
  unbilledGrns: UnbilledGRN[];
  onSelectGrn: (grn: UnbilledGRN) => void;
}

export const AvailableGrnsModalContent: React.FC<AvailableGrnsModalContentProps> = ({
  unbilledGrns,
  onSelectGrn
}) => {
  return (
    <div className="p-4 sm:p-6 text-black dark:text-white text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-stroke dark:border-strokedark mb-4">
        <div>
          <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
            <MdStore className="text-emerald-600" size={20} />
            Available GRNs to Make Purchase Bill
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Select an unbilled physical goods receipt to convert into a financial purchase bill
          </p>
        </div>
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold rounded-full text-xs">
          {unbilledGrns.length} Available
        </span>
      </div>

      {unbilledGrns.length === 0 ? (
        <div className="py-12 text-center text-gray-400 italic">
          All received GRNs have already been billed into purchases!
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full table-auto border-collapse text-left">
            <thead>
              <tr className="bg-gray-100 dark:bg-meta-4 text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                <th className="py-2.5 px-3">GRN #</th>
                <th className="py-2.5 px-3">Vendor</th>
                <th className="py-2.5 px-3 text-center">Receipt Date</th>
                <th className="py-2.5 px-3 text-center">Items</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {unbilledGrns.map((g) => (
                <tr key={g.id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 font-semibold">
                  <td className="py-2.5 px-3 font-mono font-bold text-primary">{g.grn_no}</td>
                  <td className="py-2.5 px-3 text-gray-700 dark:text-gray-200">{g.vendor_name}</td>
                  <td className="py-2.5 px-3 text-center text-gray-500 font-mono text-[11px]">{g.receipt_date}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{g.grn_items?.length || 0}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 border text-[10px] rounded-full font-bold uppercase bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                      {g.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSelectGrn(g)}
                      className="px-3 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 transition shadow-xs text-xs whitespace-nowrap"
                    >
                      Create Purchase Bill &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
