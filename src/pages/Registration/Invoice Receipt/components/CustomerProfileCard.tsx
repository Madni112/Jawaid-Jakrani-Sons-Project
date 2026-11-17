import React from 'react';
import { MdPerson, MdInfoOutline } from 'react-icons/md';
import { CustomerItem } from '../types/invoiceReceiptTypes';

interface CustomerProfileCardProps {
  selectedCustomer: string;
  selectedCustomerObj: CustomerItem | null;
}

export const CustomerProfileCard: React.FC<CustomerProfileCardProps> = ({
  selectedCustomer,
  selectedCustomerObj
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <MdPerson className="text-primary" size={16} /> Customer Account Coordinates
      </div>

      {selectedCustomer ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Customer:</span>
            <strong className="text-slate-950 dark:text-white font-bold text-sm">{selectedCustomer}</strong>
          </div>
          {selectedCustomerObj?.contact_name && (
            <div className="flex justify-between">
              <span className="text-slate-500">Contact Person:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedCustomerObj.contact_name}</span>
            </div>
          )}
          {(selectedCustomerObj?.cell_no || selectedCustomerObj?.phone_no || selectedCustomerObj?.phone) && (
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{selectedCustomerObj.cell_no || selectedCustomerObj.phone_no || selectedCustomerObj.phone}</span>
            </div>
          )}
          {selectedCustomerObj?.address && (
            <div className="flex justify-between">
              <span className="text-slate-500">Address:</span>
              <span className="text-slate-700 dark:text-slate-300 text-right max-w-[60%]">{selectedCustomerObj.address} {selectedCustomerObj.city ? `(${selectedCustomerObj.city})` : ''}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400">
          <MdInfoOutline className="mx-auto mb-1 text-slate-300" size={24} />
          <p className="text-xs">Type or search a customer on the left to inspect ledger history</p>
        </div>
      )}
    </div>
  );
};
