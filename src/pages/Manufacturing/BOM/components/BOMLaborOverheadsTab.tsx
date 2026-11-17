import React from 'react';
import { MdEngineering } from 'react-icons/md';

interface BOMLaborOverheadsTabProps {
  isRTL: boolean;
  laborCost: number;
  setLaborCost: (val: number) => void;
  overheadCost: number;
  setOverheadCost: (val: number) => void;
  packagingCost: number;
  setPackagingCost: (val: number) => void;
  notes: string;
  setNotes: (val: string) => void;
}

export const BOMLaborOverheadsTab: React.FC<BOMLaborOverheadsTabProps> = ({
  isRTL,
  laborCost,
  setLaborCost,
  overheadCost,
  setOverheadCost,
  packagingCost,
  setPackagingCost,
  notes,
  setNotes
}) => {
  return (
    <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-strokedark dark:bg-boxdark space-y-5">
      <div className="flex items-center gap-2 border-b border-stroke pb-3 dark:border-strokedark">
        <MdEngineering className="text-xl text-primary" />
        <div>
          <h2 className="text-base font-semibold text-black dark:text-white">
            {isRTL
              ? 'لیبر، مشینری اور فیکٹری اخراجات (Overheads & SOP)'
              : '3. Labor, Machine, Packaging Overheads & SOP'}
          </h2>
          <p className="text-xs text-gray-500">
            {isRTL
              ? 'خام مال کے علاوہ اس بیچ پر آنے والے تمام اضافی پیداواری اخراجات درج کریں'
              : 'Add direct conversion labor, utilities, packaging, and standard operating procedures'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Direct Labor */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-black dark:text-white">
            {isRTL ? 'براہ راست لیبر / مزدوری (PKR)' : 'Direct Labor Cost (PKR)'}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={laborCost}
            onChange={e => setLaborCost(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 text-xs font-mono outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4"
          />
          <span className="text-[11px] text-gray-500 mt-1 block">
            {isRTL ? 'سلائی، پریسنگ، کٹنگ یا کاریگر اجرت' : 'Tailoring, cutting, machine operators'}
          </span>
        </div>

        {/* Machine & Utility Overheads */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-black dark:text-white">
            {isRTL ? 'مشینری، ایندھن اور بجلی (PKR)' : 'Machinery & Fuel (PKR)'}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={overheadCost}
            onChange={e => setOverheadCost(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 text-xs font-mono outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4"
          />
          <span className="text-[11px] text-gray-500 mt-1 block">
            {isRTL ? 'جنریٹر، بجلی اور پلانٹ رننگ' : 'Electricity, generator, machine runtime'}
          </span>
        </div>

        {/* Packaging & Finishing */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-black dark:text-white">
            {isRTL ? 'پیکنگ و فنشنگ (PKR)' : 'Packaging & Finishing (PKR)'}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={packagingCost}
            onChange={e => setPackagingCost(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full rounded-lg border border-stroke bg-transparent py-2.5 px-3 text-xs font-mono outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4"
          />
          <span className="text-[11px] text-gray-500 mt-1 block">
            {isRTL ? 'باکس، ہینگر، شاپر اور بارکوڈ' : 'Boxes, bags, hangers & barcodes'}
          </span>
        </div>
      </div>

      {/* SOP Instructions */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-black dark:text-white mb-1.5">
          {isRTL ? 'پیداواری ہدایات و نوٹس (Production SOP & Notes)' : 'Production SOP & Quality Instructions'}
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={
            isRTL
              ? 'فیکٹری مینیجر یا کاریگر کے لیے ضروری ہدایات، کوالٹی کنٹرول چیکس وغیرہ یہاں لکھیں...'
              : 'Special factory instructions, mixing ratios, baking temperatures, cutting tolerances or quality standards...'
          }
          className="w-full rounded-lg border border-stroke bg-transparent py-2 px-3 text-xs outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4"
        />
      </div>
    </div>
  );
};

export default BOMLaborOverheadsTab;
