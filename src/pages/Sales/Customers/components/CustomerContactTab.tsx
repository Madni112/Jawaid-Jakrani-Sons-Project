import React from 'react';
import { MdPhone, MdInfoOutline } from 'react-icons/md';
import SubAreaAreaInput from '../../../../components/SubAreaAreaInput';
import { DEFAULT_AREAS } from '../constants/customerConstants';

interface CustomerContactTabProps {
  values: any;
  errors: any;
  touched: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  subAreaOptions: string[];
  subAreaToAreasMap: Record<string, string[]>;
  onAddCustomSubArea: (newVal: string) => void;
  onAddCustomArea: (newArea: string, currentSubArea: string) => void;
}

export const CustomerContactTab: React.FC<CustomerContactTabProps> = ({
  values,
  errors,
  touched,
  handleChange,
  setFieldValue,
  subAreaOptions,
  subAreaToAreasMap,
  onAddCustomSubArea,
  onAddCustomArea
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm p-6 space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center gap-2 border-b border-stroke dark:border-strokedark pb-3">
        <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
          <MdPhone size={18} />
        </span>
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            2. Contact Information &amp; Delivery Location
          </h4>
          <p className="text-[11px] text-slate-500">Phone numbers, WhatsApp communication, and physical shipping address</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Primary Phone */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            Primary Contact Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="primaryPhone"
            onChange={handleChange}
            value={values.primaryPhone}
            placeholder="0300-1234567"
            className={`w-full rounded-xl border bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs font-mono font-medium outline-none transition focus:bg-white dark:focus:bg-boxdark focus:ring-2 focus:ring-primary/20 ${
              touched.primaryPhone && errors.primaryPhone
                ? 'border-red-500 focus:border-red-500'
                : 'border-stroke dark:border-strokedark focus:border-primary'
            }`}
          />
          {touched.primaryPhone && errors.primaryPhone && (
            <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1">
              <MdInfoOutline size={12} /> {errors.primaryPhone as string}
            </p>
          )}
        </div>

        {/* Secondary Phone */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            Secondary Phone / WhatsApp (Optional)
          </label>
          <input
            type="text"
            name="secondaryPhone"
            onChange={handleChange}
            value={values.secondaryPhone || ''}
            placeholder="0312-7654321"
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs font-mono outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Email Address */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            Email Address (Optional)
          </label>
          <input
            type="email"
            name="email"
            onChange={handleChange}
            value={values.email || ''}
            placeholder="customer@example.com"
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* City | Area Dual Dropdown in Single Unified Input */}
        <div className="md:col-span-2">
          <SubAreaAreaInput
            label="City | Area"
            subAreaValue={values.subArea || values.city || ''}
            areaValue={values.area || ''}
            onSubAreaChange={(val) => {
              setFieldValue('subArea', val);
              setFieldValue('city', val);
            }}
            onAreaChange={(val) => setFieldValue('area', val)}
            onSubAreaAdd={onAddCustomSubArea}
            onAreaAdd={onAddCustomArea}
            subAreaOptions={subAreaOptions}
            areaOptions={
              (values.subArea || values.city) && subAreaToAreasMap[values.subArea || values.city]
                ? subAreaToAreasMap[values.subArea || values.city]
                : DEFAULT_AREAS
            }
            helperText="City is required. Area is optional."
          />
        </div>

        {/* Delivery / Site Address */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            Delivery Address / Warehouse Site
          </label>
          <textarea
            name="address"
            rows={2}
            onChange={handleChange}
            value={values.address || ''}
            placeholder="Shop #, Street, Plot / Area, City (e.g. Shop # 14, Ceramic Market, Saddar, Hyderabad)"
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white p-3 text-xs outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
};
