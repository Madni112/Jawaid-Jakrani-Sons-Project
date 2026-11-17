import React from 'react';
import { MdPerson, MdTag, MdInfoOutline } from 'react-icons/md';
import SearchableAddableDropdown from '../../../../components/SearchableAddableDropdown';

interface CustomerIdentityTabProps {
  values: any;
  errors: any;
  touched: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  tierOptions: string[];
  onAddCustomTier: (tier: string) => void;
}

export const CustomerIdentityTab: React.FC<CustomerIdentityTabProps> = ({
  values,
  errors,
  touched,
  handleChange,
  setFieldValue,
  tierOptions,
  onAddCustomTier
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm p-6 space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
            <MdPerson size={18} />
          </span>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              1. Customer Identity &amp; Classification
            </h4>
            <p className="text-[11px] text-slate-500">Official business name and classification tier</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">* Required Fields</span>
      </div>

      <div className="space-y-5">
        {/* Customer Name */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            Customer / Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="customerName"
            onChange={handleChange}
            value={values.customerName}
            placeholder="e.g. Haji Muhammad / Al-Madina Cloth House"
            className={`w-full rounded-xl border bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-3 text-xs font-semibold outline-none transition focus:bg-white dark:focus:bg-boxdark focus:ring-2 focus:ring-primary/20 ${
              touched.customerName && errors.customerName
                ? 'border-red-500 focus:border-red-500'
                : 'border-stroke dark:border-strokedark focus:border-primary'
            }`}
          />
          {touched.customerName && errors.customerName ? (
            <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1">
              <MdInfoOutline size={12} /> {errors.customerName as string}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">
              Must be unique per business entity to prevent duplicate ledger postings
            </p>
          )}
        </div>

        {/* Customer Category / Tier (Searchable + Addable) */}
        <div>
          <SearchableAddableDropdown
            label="Customer Tier / Category"
            placeholder="Customer Tier / Category"
            icon={<MdTag className="text-primary text-sm" />}
            value={values.registrationType || ''}
            onChange={(val) => setFieldValue('registrationType', val || '')}
            onAddNew={(newTier) => {
              onAddCustomTier(newTier);
              setFieldValue('registrationType', newTier);
            }}
            options={tierOptions}
            helperText="Select or type a new Customer Tier / Category (navigate with ↑ ↓ and Enter ↵)"
          />
        </div>
      </div>
    </div>
  );
};
