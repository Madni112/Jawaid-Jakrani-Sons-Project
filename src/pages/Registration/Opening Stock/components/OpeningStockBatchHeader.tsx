import React from 'react';
import { OpeningStockMultiFormValues } from '../types/openingStockTypes';

interface OpeningStockBatchHeaderProps {
    locations: any[];
    values: OpeningStockMultiFormValues;
    handleChange: (e: React.ChangeEvent<any>) => void;
    errors: any;
    touched: any;
}

export const OpeningStockBatchHeader: React.FC<OpeningStockBatchHeaderProps> = ({
    locations,
    values,
    handleChange,
    errors,
    touched
}) => {
    return (
        <div className="rounded-xl border border-stroke dark:border-strokedark bg-slate-50/60 dark:bg-meta-4/20 p-4">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Batch Details (applies to every row below)
            </p>
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-500">Location / Warehouse *</label>
                    <select
                        name="location"
                        onChange={handleChange}
                        value={values.location}
                        className={`w-full rounded border px-3 h-10 bg-transparent text-xs font-bold outline-none focus:border-primary dark:bg-boxdark text-black dark:text-white ${touched.location && errors.location ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                    >
                        <option value="" className="dark:bg-boxdark">-- Select Warehouse --</option>
                        {locations.map((loc) => {
                            const label = loc.name || loc.locationName || loc.location_name;
                            return <option key={loc.id} value={label} className="dark:bg-boxdark">{label}</option>;
                        })}
                    </select>
                    {touched.location && errors.location && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.location)}</p>}
                </div>
                <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-500">Opening Date *</label>
                    <input
                        type="date"
                        name="openingDate"
                        onChange={handleChange}
                        value={values.openingDate}
                        className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-black dark:text-white ${touched.openingDate && errors.openingDate ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                    />
                    {touched.openingDate && errors.openingDate && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.openingDate)}</p>}
                </div>
                <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-500">Batch No *</label>
                    <input
                        name="batchNumber"
                        onChange={handleChange}
                        value={values.batchNumber}
                        placeholder="e.g., BN-001"
                        className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-black dark:text-white outline-none focus:border-primary ${touched.batchNumber && errors.batchNumber ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                    />
                    {touched.batchNumber && errors.batchNumber && <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.batchNumber)}</p>}
                </div>
            </div>
        </div>
    );
};

export default OpeningStockBatchHeader;
