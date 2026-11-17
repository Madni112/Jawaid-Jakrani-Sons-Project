import React from 'react';
import { MdPerson, MdInfoOutline } from 'react-icons/md';

interface PayeeVendorCardProps {
  selectedVendor: string;
  selectedVendorObj: any;
}

export const PayeeVendorCard: React.FC<PayeeVendorCardProps> = ({ selectedVendor, selectedVendorObj }) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <MdPerson className="text-emerald-600" size={16} /> Wholesale Vendor Profile
      </div>

      {selectedVendor ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Vendor:</span>
            <strong className="text-slate-950 dark:text-white font-bold text-sm">{selectedVendor}</strong>
          </div>
          {selectedVendorObj?.contact_name && (
            <div className="flex justify-between">
              <span className="text-slate-500">Contact:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedVendorObj.contact_name}</span>
            </div>
          )}
          {(selectedVendorObj?.cell_no || selectedVendorObj?.phone_no) && (
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {selectedVendorObj.cell_no || selectedVendorObj.phone_no}
              </span>
            </div>
          )}
          {selectedVendorObj?.address && (
            <div className="flex justify-between">
              <span className="text-slate-500">Address:</span>
              <span className="text-slate-700 dark:text-slate-300 text-right max-w-[60%]">
                {selectedVendorObj.address}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400">
          <MdInfoOutline className="mx-auto mb-1 text-slate-300" size={24} />
          <p className="text-xs">Type or search a vendor on the left to inspect return history</p>
        </div>
      )}
    </div>
  );
};
