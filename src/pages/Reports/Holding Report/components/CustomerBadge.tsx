import React from 'react';
import { CustomerDetails } from '../types/holdingReportTypes';

interface CustomerBadgeProps {
  name: string;
  customerLookupMap: Record<string, CustomerDetails>;
  light?: boolean;
}

export const CustomerBadge: React.FC<CustomerBadgeProps> = ({
  name,
  customerLookupMap,
  light = false,
}) => {
  if (!name) return null;
  const details = customerLookupMap[name.trim().toLowerCase()] || { code: '', pageNo: '' };
  if (!details.code && !details.pageNo) return null;

  return (
    <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] leading-tight font-sans">
      {details.code && (
        <span
          className={
            light
              ? 'bg-slate-700 text-teal-300 px-1 py-0.2 rounded border border-slate-600 font-bold uppercase'
              : 'bg-slate-100 px-1 py-0.2 rounded border border-slate-300 font-bold uppercase text-slate-800'
          }
        >
          [{details.code}]
        </span>
      )}
      {details.code && details.pageNo && (
        <span className="text-slate-400 font-bold">|</span>
      )}
      {details.pageNo && (
        <span className={light ? 'text-slate-300 font-semibold' : 'text-slate-600 font-semibold'}>
          P# {details.pageNo}
        </span>
      )}
    </div>
  );
};

export default CustomerBadge;
