import React from 'react';
import { MdReceipt } from 'react-icons/md';

interface CustomerTaxTabProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
}

export const CustomerTaxTab: React.FC<CustomerTaxTabProps> = ({ values, handleChange }) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm p-6 space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center gap-2 border-b border-stroke dark:border-strokedark pb-3">
        <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
          <MdReceipt size={18} />
        </span>
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            4. Taxation &amp; Legal Identifiers
          </h4>
          <p className="text-[11px] text-slate-500">Corporate tax filings, NTN, CNIC, and STRN credentials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CNIC No */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            CNIC No. (Optional)
          </label>
          <input
            type="text"
            name="cnicNo"
            onChange={handleChange}
            value={values.cnicNo || ''}
            placeholder="41303-1234567-1"
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs font-mono outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* NTN No */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            NTN No. (Optional)
          </label>
          <input
            type="text"
            name="ntnNo"
            onChange={handleChange}
            value={values.ntnNo || ''}
            placeholder="1234567-8"
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs font-mono outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* STRN No */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            Sales Tax STRN (Optional)
          </label>
          <input
            type="text"
            name="stRegNo"
            onChange={handleChange}
            value={values.stRegNo || ''}
            placeholder="17-00-1234-567-89"
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs font-mono outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
};
