import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdReceiptLong, MdEdit, MdAdd } from 'react-icons/md';
import TableActions from '../../../../../ui/TableActions';
import { CustomerRecord, COAAccount } from '../types/customerHistoryTypes';
import {
  getCustomerDisplayName,
  getCustomerLocation,
  getCustomerCOA,
  normalizeAccountCode
} from '../utils/customerHistoryHelpers';

interface CustomerTableRowProps {
  customer: CustomerRecord;
  serialNumber: number;
  coaAccounts: COAAccount[];
  onOpenAccountModal: (c: CustomerRecord) => void;
  onDeleteCustomer: (c: CustomerRecord) => void;
}

export const CustomerTableRow: React.FC<CustomerTableRowProps> = ({
  customer: c,
  serialNumber,
  coaAccounts,
  onOpenAccountModal,
  onDeleteCustomer
}) => {
  const navigate = useNavigate();
  const coa = getCustomerCOA(c, coaAccounts);
  const loc = getCustomerLocation(c);

  return (
    <tr className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150">
      {/* 1. S# */}
      <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 text-center">
        {serialNumber}
      </td>

      {/* 2. Name */}
      <td className="py-3.5 px-4 text-sm">
        <div className="flex flex-col">
          <span className="font-semibold text-black dark:text-white">
            {getCustomerDisplayName(c) || 'Private Customer'}
          </span>
          {c.company ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.company}</p>
          ) : null}
        </div>
      </td>

      {/* 3. Phone */}
      <td className="py-3.5 px-4 text-sm text-black dark:text-white">
        <p className="font-mono text-xs">{c.primaryPhone || c.phone || 'N/A'}</p>
      </td>

      {/* 4. City / Area */}
      <td className="py-3.5 px-4 text-sm">
        <div className="flex flex-col items-start gap-0.5">
          {loc.city ? (
            <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-meta-4/40 px-2 py-0.5 rounded border border-slate-200 dark:border-strokedark">
              {loc.city}
            </span>
          ) : (
            <span className="text-gray-400 font-mono text-xs">-</span>
          )}
          {loc.area ? (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium pl-0.5">
              {loc.area}
            </span>
          ) : null}
        </div>
      </td>

      {/* 5. Address & Province */}
      <td className="py-3.5 px-4 text-sm">
        {c.address ? (
          <p className="text-black dark:text-white text-xs font-normal leading-snug">{c.address}</p>
        ) : (
          <p className="text-gray-400 text-xs">N/A</p>
        )}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
          Province: {c.province || 'Sindh'}
        </p>
      </td>

      {/* 6. Accounts Code */}
      <td className="py-3.5 px-4 text-xs text-center">
        {c.customer_code || c.customerCode || c.coa_code || coa?.account_code ? (
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="font-mono font-black text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded-lg shadow-2xs">
              {normalizeAccountCode(
                c.customer_code || c.customerCode || c.coa_code || coa?.account_code
              )}
            </span>
            <button
              type="button"
              onClick={() => onOpenAccountModal(c)}
              className="text-[10px] text-primary hover:underline font-bold cursor-pointer inline-flex items-center gap-0.5"
              title="Edit Account Code"
            >
              <MdEdit size={11} /> Edit
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onOpenAccountModal(c)}
            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold transition duration-150 shadow-xs cursor-pointer"
          >
            <MdAdd size={14} /> Link Account
          </button>
        )}
      </td>

      {/* 7. Actions */}
      <td className="py-3.5 px-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const cName = getCustomerDisplayName(c);
              const cCode = c.customer_code || c.customerCode || c.coa_code;
              navigate('/Accounts/Ledgers?tab=customer-ledger', {
                state: {
                  tab: 'customer-ledger',
                  accountCode: cCode,
                  partyName: cName,
                  partyId: c.id,
                  autoGenerate: true
                }
              });
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/50 dark:hover:bg-blue-600 dark:text-blue-300 dark:hover:text-white rounded text-xs font-bold border border-blue-200 dark:border-blue-800 transition duration-150 cursor-pointer shadow-2xs"
            title="View Customer Account Ledger"
          >
            <MdReceiptLong size={14} /> Ledger
          </button>
          <TableActions
            onEdit={() => {
              navigate(`/Sales/Customers/Edit/${c.id}`, { state: { customer: c } });
            }}
            onDelete={() => onDeleteCustomer(c)}
            editTitle="Edit Customer"
            deleteTitle="Delete Customer"
          />
        </div>
      </td>
    </tr>
  );
};
