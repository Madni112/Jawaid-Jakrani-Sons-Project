import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPerson, MdEvent } from 'react-icons/md';
import TableActions from '../../../../../ui/TableActions';
import { PurchaseRecord, AllocationMapEntry } from '../types/purchaseListTypes';
import { formatMoney } from '../utils/purchaseAllocations';

interface PurchaseTableRowProps {
  pur: PurchaseRecord;
  serialNumber: number;
  alloc?: AllocationMapEntry;
  tenantId?: string | null;
  onPreview: () => void;
  onDelete: (pur: PurchaseRecord) => void;
}

export const PurchaseTableRow: React.FC<PurchaseTableRowProps> = ({
  pur,
  serialNumber,
  alloc,
  tenantId,
  onPreview,
  onDelete
}) => {
  const navigate = useNavigate();
  const totalAmt = Number(pur.total_amount) || 0;
  const upfrontPaid = Number(pur.cash_amount_paid || 0) + Number(pur.bank_amount_paid || 0);
  const paidAmt = alloc ? alloc.totalPaid : (Number(pur.amount_paid) || upfrontPaid);
  const dueAmt = alloc ? alloc.due : Math.max(0, totalAmt - paidAmt);
  const term = pur.payment_term || 'On Credit';
  const vendorName = pur.supplier_name || 'General Vendor';
  const formattedPurchaseNo = pur.purchase_no
    ? (String(pur.purchase_no).toUpperCase().startsWith('PUR-')
        ? pur.purchase_no
        : `PUR-${pur.purchase_no}`)
    : `PUR-${pur.id}`;

  return (
    <tr className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150 font-semibold text-black dark:text-white text-xs">
      <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap">{serialNumber}</td>
      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
        <button
          type="button"
          onClick={onPreview}
          className="font-bold text-primary dark:text-primary hover:underline cursor-pointer transition text-left"
          title="Click to preview purchase details"
        >
          {formattedPurchaseNo}
        </button>
      </td>
      <td className="py-3.5 px-4 flex items-center gap-1.5 whitespace-nowrap">
        <MdPerson className="text-gray-400 shrink-0" size={16} />
        {vendorName}
      </td>
      <td className="py-3.5 px-4 text-center text-gray-500 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 text-[11px] whitespace-nowrap">
          <MdEvent size={13} className="shrink-0" />
          {pur.purchase_date}
        </span>
      </td>
      <td className="py-3.5 px-4 text-center whitespace-nowrap">
        <span
          className={`px-2.5 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${
            term === 'On Credit'
              ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300'
              : term === 'By Cash'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300'
          }`}
        >
          {term}
        </span>
      </td>
      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white pr-4 whitespace-nowrap">
        Rs. {formatMoney(totalAmt)}
      </td>
      <td className="py-3 px-4 text-center font-mono text-xs min-w-[150px]">
        {dueAmt <= 0 ? (
          <div className="flex flex-col items-center justify-center space-y-0.5">
            {(alloc?.returned || 0) > 0 && (
              <span className="inline-block px-2 py-0.5 mb-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[9px] font-black uppercase whitespace-nowrap">
                {(alloc?.returned || 0) >= totalAmt ? 'Returned' : 'Partially Returned'}
              </span>
            )}
            {upfrontPaid >= totalAmt && (!alloc || (alloc.generalAllocated <= 0 && alloc.specificVouchers <= 0)) ? (
              <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-xs">
                Paid Upfront
              </span>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-0.5">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {upfrontPaid > 0 ? `Upfront: Rs. ${formatMoney(upfrontPaid)}` : 'No Upfront amount'}
                </span>
                <span className="inline-block px-2.5 py-0.5 my-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wide whitespace-nowrap shadow-xs">
                  Paid (By Receipt)
                </span>
                {(() => {
                  const receiptPaid = Math.max(0, paidAmt - upfrontPaid);
                  return receiptPaid > 0 ? (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      Receipt: Rs. {formatMoney(receiptPaid)}
                    </span>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-0.5">
            {/* Top center text */}
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {upfrontPaid > 0 ? `Upfront: Rs. ${formatMoney(upfrontPaid)}` : 'No Upfront amount'}
            </span>

            {/* Center main badge */}
            <span className="inline-block px-2.5 py-0.5 my-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
              Credit (Due: Rs. {formatMoney(dueAmt)})
            </span>

            {/* Bottom center text */}
            {(() => {
              const receiptPaid = Math.max(0, paidAmt - upfrontPaid);
              return (
                <span
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    receiptPaid > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {receiptPaid > 0 ? `Receipt: Rs. ${formatMoney(receiptPaid)}` : 'No receipt'}
                </span>
              );
            })()}

            {(alloc?.returned || 0) > 0 && (
              <span className="inline-block px-2 py-0.5 mt-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[9px] font-bold uppercase whitespace-nowrap">
                Returned: Rs. {formatMoney(alloc.returned)}
              </span>
            )}
          </div>
        )}
      </td>
      <td className="py-3.5 px-4 text-center whitespace-nowrap">
        <TableActions
          onPrint={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/Print/${pur.id}`)}
          onEdit={() => navigate(`/Purchase/Purchases/Edit/${pur.id}`, { state: { purchaseRecord: pur } })}
          onDelete={() => onDelete(pur)}
          printTitle="Print GRN Note"
          editTitle="Edit Purchase"
          deleteTitle="Delete Purchase"
          menuWidth="w-38"
        />
      </td>
    </tr>
  );
};
